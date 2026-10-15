-- ============================================================================
-- Security regression scenarios — verifies the review fixes actually hold.
--
-- Every block below asserts that a specific attack is DENIED. These are the
-- inverse of scenarios.sql: they run as the `authenticated` role with the
-- request JWT claim set to a customer, so RLS and GRANT are exercised for real,
-- not simulated.
--
-- Run with:  psql -v ON_ERROR_STOP=1 -f supabase/tests/security-regression.sql
--
-- IMPORTANT — two setup details this file depends on:
--   1. `set role` is required. As superuser every GRANT/RLS check is bypassed,
--      so all the DENY assertions would wrongly "fail" without it.
--   2. The claim must be set AFTER `set role` (which resets the session), and
--      `auth.uid()` reads `request.jwt.claim.sub` — the individual claim, not
--      the `request.jwt.claims` JSON blob. `is_local` is false so the setting
--      survives the implicit transactions psql runs each statement in.
-- ============================================================================
\set ON_ERROR_STOP on
\pset pager off

\echo '--- SETUP: baseline data ---'
-- Roles for the test users. Roles are created by seed.sql; reuse them.
-- The JWT claim must be set BEFORE `set role`, because `set role` resets the
-- session and would clear it again.
-- The local `auth.uid()` mock reads `request.jwt.claim.sub` (the key PostgREST
-- actually sets), not the whole `request.jwt.claims` JSON blob. Set the
-- individual claim so every `using (… auth.uid() …)` predicate resolves.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111","email":"atk-customer@example.com"}', false);

-- Guarantee the attacker profile exists with a zero wallet. Written as
-- postgres first, since `authenticated` may only insert its own row.
insert into profiles (id, phone, display_name, wallet_balance, loyalty_points, level)
values ('11111111-1111-1111-1111-111111111111', '09120000999', 'Attacker', 0, 0, 'normal')
on conflict (id) do nothing;

-- Run everything below as an ordinary customer. Without this the session is
-- superuser and every GRANT/RLS check is bypassed, so all the DENY assertions
-- would wrongly "fail".
--
-- Order matters: `set role` clears `request.jwt.claims`, so the claim is set
-- *after* the role. `auth.uid()` reads that claim, and every `using (...)`
-- predicate below depends on it.
set role authenticated;
-- The local `auth.uid()` mock reads `request.jwt.claim.sub` (the key PostgREST
-- actually sets), not the whole `request.jwt.claims` JSON blob. Set the
-- individual claim so every `using (… auth.uid() …)` predicate resolves.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111","email":"atk-customer@example.com"}', false);

-- An order for the attacker to try to tamper with. Created as postgres because
-- `place_order` is service_role-only by design.
reset role;
do $$
declare
  v_order uuid;
  v_total bigint;
  v_paid bigint;
begin
  select base_price into v_total from services where active = true limit 1;
  v_paid := coalesce(v_total, 0);

  insert into orders (tracking_code, customer_id, type, channel, status,
                      total, paid, remaining, payment_method)
  values ('HMY-SECTEST', '11111111-1111-1111-1111-111111111111', 'service',
          'online', 'processing', v_paid, 0, v_paid, 'online')
  returning id into v_order;

  insert into order_items (order_id, name, price, quantity, total)
  values (v_order, 'Test item', v_paid, 1, v_paid);
end $$;
set role authenticated;
-- The local `auth.uid()` mock reads `request.jwt.claim.sub` (the key PostgREST
-- actually sets), not the whole `request.jwt.claims` JSON blob. Set the
-- individual claim so every `using (… auth.uid() …)` predicate resolves.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111","email":"atk-customer@example.com"}', false);

\echo ''
\echo '=== 1. Customer cannot inflate own wallet via refund_wallet (was CRITICAL) ==='
do $$
begin
  begin
    perform refund_wallet('11111111-1111-1111-1111-111111111111', 1000000, 'exploit');
    raise exception 'SECURITY REGRESSION: refund_wallet succeeded for a customer';
  exception when insufficient_privilege then
    raise notice 'PASS: refund_wallet denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== 2. Customer cannot inflate own wallet via direct wallet_transactions insert (was WARNING) ==='
do $$
begin
  begin
    insert into wallet_transactions (user_id, amount, type, reference)
    values ('11111111-1111-1111-1111-111111111111', 1000000, 'refund', 'exploit');
    raise exception 'SECURITY REGRESSION: direct wallet_transactions insert succeeded';
  exception when insufficient_privilege then
    raise notice 'PASS: direct wallet insert denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== 3. Customer cannot write wallet_balance / loyalty_points on own profile (was CRITICAL) ==='
do $$
begin
  begin
    update profiles
    set wallet_balance = 999999999, loyalty_points = 999999, level = 'vip'
    where id = '11111111-1111-1111-1111-111111111111';
    raise exception 'SECURITY REGRESSION: customer updated own wallet_balance/loyalty';
  exception when insufficient_privilege then
    raise notice 'PASS: column-level grant blocked wallet/loyalty write';
  end;
end $$;

\echo ''
\echo '=== 3b. Customer CAN still write their own display_name (must not be over-blocked) ==='
do $$
begin
  update profiles
  set display_name = 'Renamed By Customer'
  where id = '11111111-1111-1111-1111-111111111111';
  raise notice 'PASS: customer may update own display_name';
exception when others then
  raise exception 'OVER-BLOCKED: customer lost a legitimate column: %', sqlerrm;
end $$;

\echo ''
\echo '=== 4. Customer cannot call place_order directly (was CRITICAL: free paid order) ==='
do $$
declare
  v_service uuid;
begin
  select id into v_service from services where active = true limit 1;
  begin
    perform place_order(
      '11111111-1111-1111-1111-111111111111', v_service, 1, false,
      0, 0, 'wallet', null, '{}'::jsonb, '[]'::jsonb);
    raise exception 'SECURITY REGRESSION: place_order succeeded for a customer';
  exception when insufficient_privilege then
    raise notice 'PASS: place_order denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== 5. Customer cannot call award_loyalty to mint points (was CRITICAL path) ==='
do $$
begin
  begin
    perform award_loyalty('11111111-1111-1111-1111-111111111111', 50000,
      'exploit', 'manual'::loyalty_category_t, null);
    raise exception 'SECURITY REGRESSION: award_loyalty succeeded for a customer';
  exception when insufficient_privilege then
    raise notice 'PASS: award_loyalty denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== 6. Customer cannot rewrite own order total via order_items (was WARNING) ==='
do $$
declare
  v_order uuid;
  v_item uuid;
  v_rows integer;
begin
  -- An order created for this customer by the test harness.
  select o.id into v_order from orders o
  where o.customer_id = auth.uid() limit 1;

  if v_order is null then
    raise notice 'SKIP: no order for the attacker to tamper with';
    return;
  end if;

  select oi.id into v_item from order_items oi where oi.order_id = v_order limit 1;
  if v_item is null then
    raise notice 'SKIP: order has no line items';
    return;
  end if;

  -- Assert on rows actually changed: an UPDATE that matches nothing is not an
  -- exploit, and raising unconditionally would report a false regression.
  update order_items set price = 0, quantity = 999, total = 0 where id = v_item;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'SECURITY REGRESSION: customer zeroed their own order price';
  end if;
  raise notice 'PASS: order_items write denied (0 rows updated)';
end $$;

\echo ''
\echo '=== 7. Customer cannot mark own order delivered (was WARNING) ==='
do $$
declare
  v_order uuid;
  v_rows integer;
begin
  select o.id into v_order from orders o
  where o.customer_id = auth.uid()
    and o.status <> 'cancelled' limit 1;

  if v_order is null then
    raise notice 'SKIP: no open order for the attacker';
    return;
  end if;

  -- A denied write can surface either as an RLS error or as a silent 0-row
  -- update, depending on whether the USING or WITH CHECK clause rejects it.
  -- Both are denials; only a real row change is an exploit.
  begin
    update orders set status = 'delivered', paid = total where id = v_order;
    get diagnostics v_rows = row_count;
  exception when insufficient_privilege or check_violation then
    v_rows := 0;
  end;
  if v_rows > 0 then
    raise exception 'SECURITY REGRESSION: customer self-delivered their order';
  end if;
  raise notice 'PASS: status/paid write denied (0 rows updated)';
end $$;

\echo ''
\echo '=== 8. Customer cannot write training_sites (was WARNING: using(true)) ==='
do $$
begin
  begin
    insert into training_sites (title, url, category) values ('evil', 'https://evil.test', 'x');
    raise exception 'SECURITY REGRESSION: customer wrote to training_sites';
  exception when insufficient_privilege then
    raise notice 'PASS: training_sites write denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== 9. Customer cannot call verify_payment (service_role only) ==='
do $$
begin
  begin
    perform verify_payment('any-ref', true, '');
    raise exception 'SECURITY REGRESSION: verify_payment succeeded for a customer';
  exception when insufficient_privilege then
    raise notice 'PASS: verify_payment denied (insufficient_privilege)';
  end;
end $$;

\echo ''
\echo '=== RESULT: no SECURITY REGRESSION raised ==='
\echo '--- cleanup ---'
-- Orders first: the test order has a FK to the attacker profile.
reset role;
delete from orders where tracking_code = 'HMY-SECTEST';
delete from profiles where id = '11111111-1111-1111-1111-111111111111';

