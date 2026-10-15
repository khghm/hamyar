-- ============================================================================
-- Functional scenarios for the order/wallet/loyalty fixes.
--
-- Exercises the paths the review found broken: wallet settlement inside
-- place_order, document persistence, payment<->order linkage, status-transition
-- validation, and verify_payment idempotency.
-- ============================================================================
\set ON_ERROR_STOP on
\pset pager off

\echo '--- SETUP ---'
-- `change_order_status` and `award_loyalty` require an authenticated caller
-- (`auth.uid()` / `is_staff()`), and the local `auth.uid()` mock reads
-- `request.jwt.claim.sub`. Running as postgres without this claim would make
-- every permission check fail for the wrong reason.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"22222222-2222-2222-2222-222222222222"}', false);
do $$
declare
  v_uid uuid := '22222222-2222-2222-2222-222222222222';
  v_service uuid;
  v_balance bigint;
  v_order record;
  v_count integer;
  v_total bigint;
  v_paid bigint;
  v_payment record;
begin
  -- This user is both the buyer and the staff operator driving the order
  -- lifecycle. `staff_accounts_require_auth_user()` rejects a staff row whose
  -- `auth_uid` is not a real auth.users entry, so the auth user is created
  -- first. The full-admin role supplies `perm2`, which `change_order_status`
  -- checks.
  insert into auth.users (id, email, raw_user_meta_data, created_at)
  values (v_uid, 'lifecycle-test@example.com', '{"phone":"09120000888"}'::jsonb, now())
  on conflict (id) do nothing;

  insert into staff_accounts (auth_uid, phone, display_name, username, role_id)
  select v_uid, '09120000888', 'Lifecycle Tester', 'lifecycle', r.id
  from roles r where r.name = 'مدیر کل'
  on conflict do nothing;

  insert into profiles (id, phone, display_name, wallet_balance, loyalty_points, level)
  values (v_uid, '09120000888', 'Buyer', 5000000, 0, 'normal')
  on conflict (id) do update set wallet_balance = 5000000, loyalty_points = 0, level = 'normal';

  select id into v_service from services where active = true limit 1;

  -- place_order now debits the wallet itself, so this is a real charge.
  -- Named notation throughout: it binds each argument to its declared parameter
  -- type, so no explicit casts are needed for NULLs or literals.
  select * into v_order from place_order(
    p_customer_id => v_uid,
    p_service_id => v_service,
    p_quantity => 2,
    p_urgent => false,
    p_total => 0,
    p_paid => 0,
    p_payment_method => 'wallet',
    p_gateway_ref => null,
    p_form_data => '{}'::jsonb,
    p_documents => '[{"storage_path":"private/22222222-2222-2222-2222-222222222222/id.png","label":"kart"},
                     {"storage_path":"private/22222222-2222-2222-2222-222222222222/passport.png","label":"passport"}]'::jsonb
  );
  raise notice 'PASS: place_order created order %', v_order.order_id;

  -- 1. Wallet was actually debited.
  select wallet_balance into v_balance from profiles where id = v_uid;
  if v_balance >= 5000000 then
    raise exception 'REGRESSION: wallet was not debited (balance %)', v_balance;
  end if;
  raise notice 'PASS: wallet debited by place_order (balance now %)', v_balance;

  select count(*) into v_count from wallet_transactions
  where user_id = v_uid and type = 'order_payment';
  if v_count <> 1 then
    raise exception 'REGRESSION: expected exactly 1 wallet_transaction, found %', v_count;
  end if;
  raise notice 'PASS: exactly one wallet_transaction row (no double-debit)';

  -- 2. Documents were persisted (previously silently dropped).
  select count(*) into v_count from order_documents where order_id = v_order.order_id;
  if v_count <> 2 then
    raise exception 'REGRESSION: expected 2 order_documents rows, found %', v_count;
  end if;
  raise notice 'PASS: % order_documents persisted (were previously dropped)', v_count;

  -- 3. Order total computed server-side; wallet order fully settled.
  select total, paid into v_total, v_paid from orders where id = v_order.order_id;
  if v_paid <> v_total then
    raise exception 'REGRESSION: wallet order paid (%) != total (%)', v_paid, v_total;
  end if;
  raise notice 'PASS: wallet order settled, paid = total = %', v_total;

  -- 4. Illegal transition: cancelled -> delivered must be rejected.
  update orders set status = 'cancelled' where id = v_order.order_id;
  begin
    perform change_order_status(v_order.order_id, 'delivered', v_uid, 'exploit');
    raise exception 'REGRESSION: cancelled -> delivered was allowed';
  exception when others then
    if sqlerrm like 'REGRESSION%' then raise; end if;
    raise notice 'PASS: cancelled -> delivered rejected';
  end;

  -- 5. Backwards transition: ready -> processing must be rejected.
  update orders set status = 'ready' where id = v_order.order_id;
  begin
    perform change_order_status(v_order.order_id, 'processing', v_uid, 'exploit');
    raise exception 'REGRESSION: ready -> processing was allowed';
  exception when others then
    if sqlerrm like 'REGRESSION%' then raise; end if;
    raise notice 'PASS: ready -> processing rejected';
  end;

  -- 6. Legal transition still works and issues the delivery receipt.
  perform change_order_status(v_order.order_id, 'delivered', v_uid, 'ok');
  select count(*) into v_count from orders
  where id = v_order.order_id and receipt_invoice_id is not null;
  if v_count <> 1 then
    raise exception 'REGRESSION: delivery receipt was not issued';
  end if;
  raise notice 'PASS: ready -> delivered allowed and receipt issued';

  -- 7. Payment <-> order linkage. create_payment_record runs before the order
  --    exists, so place_order links them by gateway_ref.
  select * into v_payment from create_payment_record(
    p_user_id => v_uid, p_order_amount => 250000, p_payment_method => 'online');
  select id into v_service from services where active = true limit 1;
  select * into v_order from place_order(
    p_customer_id => v_uid,
    p_service_id => v_service,
    p_quantity => 1,
    p_urgent => false,
    p_total => 0,
    p_paid => 0,
    p_payment_method => 'online',
    p_gateway_ref => v_payment.gateway_ref,
    p_form_data => '{}'::jsonb,
    p_documents => '[]'::jsonb
  );
  select count(*) into v_count from payments
  where gateway_ref = v_payment.gateway_ref and order_id = v_order.order_id;
  if v_count <> 1 then
    raise exception 'REGRESSION: payment.order_id was not linked (was always NULL)';
  end if;
  raise notice 'PASS: payment linked to order % via gateway_ref', v_order.order_id;

  -- 8. verify_payment is idempotent: a repeat callback must not re-award
  --    loyalty, and must settle the order only once.
  select loyalty_points into v_count from profiles where id = v_uid;
  perform verify_payment(v_payment.gateway_ref, true, 'first');
  select loyalty_points into v_total from profiles where id = v_uid;
  if v_total <= v_count then
    raise exception 'REGRESSION: first callback awarded no loyalty points';
  end if;
  raise notice 'PASS: first callback awarded loyalty (% -> %)', v_count, v_total;

  perform verify_payment(v_payment.gateway_ref, true, 'retry-1');
  perform verify_payment(v_payment.gateway_ref, true, 'retry-2');
  select loyalty_points into v_count from profiles where id = v_uid;
  if v_count <> v_total then
    raise exception 'REGRESSION: repeat callbacks re-awarded loyalty (% -> %)',
      v_total, v_count;
  end if;
  raise notice 'PASS: repeat callbacks did not re-award loyalty (still %)', v_count;

  -- 9. verify_payment settled the linked order.
  select count(*) into v_count from orders
  where id = v_order.order_id and paid = total;
  if v_count <> 1 then
    raise exception 'REGRESSION: verify_payment did not settle the order';
  end if;
  raise notice 'PASS: verify_payment settled the order (paid = total)';
end $$;

\echo ''
\echo '=== RESULT: no REGRESSION raised ==='

\echo '--- cleanup ---'
-- Order matters here: this must run children before parents, and must clear
-- the *inbound* links first (`orders.receipt_invoice_id` -> invoices, and
-- `orders.employee_id` -> staff_accounts). Deleting invoices or profiles while
-- an order still points at them fails on the FK.
--
-- Note: no `on commit drop` -- psql runs in autocommit mode, so that would
-- drop the table at the end of the very statement that creates it.
create temporary table _t_orders as
  select id from orders where customer_id = '22222222-2222-2222-2222-222222222222';

delete from notifications         where user_id = '22222222-2222-2222-2222-222222222222';
delete from notification_settings where user_id = '22222222-2222-2222-2222-222222222222';
delete from tickets               where customer_id = '22222222-2222-2222-2222-222222222222';
delete from affiliates            where user_id = '22222222-2222-2222-2222-222222222222';
delete from loyalty_transactions  where user_id = '22222222-2222-2222-2222-222222222222';
delete from wallet_transactions   where user_id = '22222222-2222-2222-2222-222222222222';
delete from payments              where user_id = '22222222-2222-2222-2222-222222222222';

delete from affiliate_orders where order_id in (select id from _t_orders);
delete from invoice_items    where invoice_id in (
  select id from invoices where order_id in (select id from _t_orders));
delete from order_documents  where order_id in (select id from _t_orders);
delete from order_items      where order_id in (select id from _t_orders);
delete from order_status_history where order_id in (select id from _t_orders);
update orders set receipt_invoice_id = null, employee_id = null
  where id in (select id from _t_orders);
delete from invoices where order_id in (select id from _t_orders);
delete from orders  where id in (select id from _t_orders);

delete from audit_logs
  where actor_id = '22222222-2222-2222-2222-222222222222'
     or (details like 'HMY-%' and created_at > now() - interval '30 minutes');
delete from profiles       where id = '22222222-2222-2222-2222-222222222222';
delete from staff_accounts where auth_uid = '22222222-2222-2222-2222-222222222222';
delete from auth.users     where id = '22222222-2222-2222-2222-222222222222';
drop table _t_orders;