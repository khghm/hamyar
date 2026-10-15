-- ---------------------------------------------------------------------------
-- 005_atomic_rpcs.sql — Payment tables, wallet, and server-side RPC functions
--
-- These functions are the ONLY way orders, stock, finance, and loyalty are
-- mutated.  They run inside the database transaction so every multi-step
-- operation is atomic.  Edge Functions call them with the service_role key.
-- ---------------------------------------------------------------------------

-- === Wallet transactions (append-only ledger) ============================
create table wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id),
  amount        bigint not null,                             -- تومان (+earn / -spend)
  type          text not null check (type in ('order_payment','deposit','withdrawal','refund','bonus','loyalty_redeem')),
  reference     text,                                        -- order_id / invoice_id etc.
  balance_before bigint,
  balance_after  bigint,
  created_at    timestamptz not null default now()
);
create index idx_wallet_user on wallet_transactions(user_id, created_at desc);

-- === Payments (gateway records) ============================================
create type payment_status_t as enum ('pending','paid','failed','cancelled');

create table payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references orders(id),
  user_id       uuid not null references profiles(id),
  amount        bigint not null check (amount >= 0),       -- تومان
  payment_method payment_method_t,
  gateway_ref   text unique,                                -- bank callback reference
  status        payment_status_t not null default 'pending',
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_payments_order  on payments(order_id);
create index idx_payments_status on payments(status);
create index idx_payments_gateway on payments(gateway_ref);

-- Wallet transaction triggers keep the running balance columns accurate.
create or replace function wallet_txn_trigger()
returns trigger
language plpgsql
as $$
declare
  current_balance bigint;
begin
  select coalesce(wallet_balance, 0) into current_balance
  from profiles where id = NEW.user_id;

  NEW.balance_before := current_balance;
  NEW.balance_after  := current_balance + NEW.amount;

  update profiles
  set wallet_balance = greatest(0, current_balance + NEW.amount)
  where id = NEW.user_id;

  return NEW;
end;
$$;

create trigger trg_wallet_txn
  before insert on wallet_transactions
  for each row execute function wallet_txn_trigger();
create policy "customer_own_wallet_txns" on wallet_transactions
  for select using (user_id = auth.uid());
create policy "staff_wallet_txns" on wallet_transactions
  for select using (has_permission('perm32'));
-- Wallet movements must go through `deduct_wallet` / `refund_wallet`.
-- There is no INSERT policy: the BEFORE INSERT trigger on this table is what
-- writes `profiles.wallet_balance`, so direct insert access would let *any*
-- signed-in user credit an arbitrary wallet. (`is_staff()` was not enough here
-- either — it is true for every active staff row regardless of role, so a
-- content editor with no finance permission could mint balance for anyone, with
-- no audit row.)
alter table wallet_transactions enable row level security;

-- Payments: customer sees own; staff with finance perm sees all
create policy "customer_own_payments" on payments for select using (user_id = auth.uid());
create policy "staff_view_payments" on payments for select using (has_permission('perm13') or has_permission('perm14'));
create policy "staff_insert_payments" on payments
  for insert with check (user_id = auth.uid());
alter table payments enable row level security;

-- =========================================================================
-- RPC: deduct_wallet — atomically deduct wallet balance
--
-- SECURITY DEFINER.  Authorization is enforced here because RLS does not
-- apply to definer-owned writes: the caller must be the wallet owner, a staff
-- member holding the finance permission, or service_role.
--
-- The BEFORE INSERT trigger `wallet_txn_trigger` is the single writer of
-- profiles.wallet_balance — it also fills balance_before / balance_after.
-- This function must NOT update profiles itself, or the balance moves twice.
-- =========================================================================
create or replace function deduct_wallet(p_user_id uuid, p_amount bigint)
returns bigint   -- returns new balance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after bigint;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm32') then
      raise exception 'permission denied: cannot debit another user''s wallet';
    end if;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid deduction amount: %', p_amount;
  end if;

  -- `for update` takes a row lock for the rest of the transaction. Without it
  -- this is a read-then-write race: two concurrent orders (or two browser tabs)
  -- could both read the same balance, both pass the check, and both debit —
  -- overdrawing the wallet while `wallet_txn_trigger`'s `greatest(0, ...)`
  -- clamp silently discarded the excess.
  select coalesce(wallet_balance, 0) into v_before
  from profiles where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  if v_before < p_amount then
    raise exception 'insufficient wallet balance: have %, need %', v_before, p_amount;
  end if;

  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, -p_amount, 'order_payment', p_user_id::text)
  returning balance_after into v_after;

  return v_after;
end;
$$;

-- =========================================================================
-- RPC: refund_wallet — return funds to wallet (order rollback)
-- Same authorization model as deduct_wallet.
-- =========================================================================
create or replace function refund_wallet(p_user_id uuid, p_amount bigint, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_after bigint;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm32') then
      raise exception 'permission denied: cannot credit another user''s wallet';
    end if;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid refund amount: %', p_amount;
  end if;

  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, p_amount, 'refund', p_reason)
  returning balance_after into v_after;

  return v_after;
end;
$$;

-- =========================================================================
-- RPC: deposit_wallet — top up the caller's own wallet
--
-- Mirrors `deduct_wallet` but in the opposite direction. The BEFORE INSERT
-- trigger `wallet_txn_trigger` is the single writer of `profiles.wallet_balance`
-- and also fills `balance_before` / `balance_after`, so this function must NOT
-- update profiles itself, or the balance moves twice.
-- =========================================================================
create or replace function deposit_wallet(p_user_id uuid, p_amount bigint, p_reason text)
returns bigint   -- returns new balance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_after bigint;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm32') then
      raise exception 'permission denied: cannot credit another user''s wallet';
    end if;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid deposit amount: %', p_amount;
  end if;

  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, p_amount, 'deposit', p_reason)
  returning balance_after into v_after;

  return v_after;
end;
$$;

-- =========================================================================
-- RPC: create_payment_record — create a pending payment record
-- =========================================================================
create or replace function create_payment_record(
  p_user_id    uuid,
  p_order_amount bigint,
  p_payment_method text
)
returns table (payment_id uuid, gateway_ref text)
language plpgsql
security definer
as $$
declare
  v_gateway_ref text;
begin
  -- SECURITY DEFINER bypasses RLS: a caller may only open a payment record for
  -- itself, unless it is service_role (Edge Functions).
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm13') then
      raise exception 'permission denied: cannot create a payment for another user';
    end if;
  end if;

  v_gateway_ref := 'PAY-' || gen_random_uuid()::text;

  -- `payments.payment_method` is an enum but the RPC signature takes text (the
  -- Edge Function forwards whatever string the client sent). Insert the raw
  -- text directly and Postgres rejects it with "column is of type
  -- payment_method_t but expression is of type text", which is why online
  -- checkout could never record a payment. Validate and cast explicitly, the
  -- same way `place_order` handles `p_payment_method`.
  if p_payment_method is not null
     and p_payment_method <> ''
     and p_payment_method not in ('online', 'wallet') then
    raise exception 'invalid payment method: %', p_payment_method;
  end if;

  insert into payments (user_id, amount, payment_method, gateway_ref, status)
  values (p_user_id, p_order_amount,
          coalesce(nullif(p_payment_method, ''), 'online')::payment_method_t,
          v_gateway_ref, 'pending'::payment_status_t)
  -- `gateway_ref` is both an OUT parameter and a column of `payments`, so the
  -- RETURNING target must be qualified or Postgres reports it as ambiguous.
  returning id, payments.gateway_ref into payment_id, gateway_ref;

  return next;
  return;
end;
$$;

-- =========================================================================
-- RPC: place_order — atomic service order creation
--
-- Price is read from the `services` table in-database; the client-supplied
-- total / paid values are IGNORED.  This is the single source of truth.
-- =========================================================================
create or replace function place_order(
  p_customer_id   uuid,
  p_service_id    uuid,
  p_quantity      integer,
  p_urgent        boolean,
  p_total         bigint,       -- client-supplied, OVERRIDDEN by server calc
  p_paid          bigint,       -- client-supplied, OVERRIDDEN
  p_payment_method text,
  p_gateway_ref   text,
  p_form_data     jsonb,
  p_documents     jsonb
)
returns table (
  order_id      uuid,
  tracking_code text,
  invoice_id    uuid
)
language plpgsql
security definer
as $$
declare
  v_base_price bigint;
  v_unit_price bigint;
  v_total bigint;
  v_paid bigint;
  v_payment_method payment_method_t;
  v_tracking text;
  v_order_id uuid;
  v_service_name text;
  v_service_unit text;
  v_order_desc text;
  v_invoice_id uuid;
  v_cfg jsonb;
  v_doc jsonb;
  v_doc_path text;
begin
  -- SECURITY DEFINER bypasses RLS: an order may only be placed for the calling
  -- customer, unless the caller is service_role (Edge Functions).
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_customer_id then
      raise exception 'permission denied: cannot place an order for another customer';
    end if;
  end if;

  -- 1. Read price from DB (never trust client)
  select base_price, name, unit
  into v_base_price, v_service_name, v_service_unit
  from services where id = p_service_id and active = true;

  if v_base_price is null then
    raise exception 'service not found or inactive';
  end if;

  v_unit_price := v_base_price * (case when p_urgent then 2 else 1 end);
  -- Apply urgency multiplier stored in gamification_settings... actually use
  -- the same constant as the client (1.5 for urgent).  We hardcode here so the
  -- server is the source of truth.
  if p_urgent then
    v_unit_price := round(v_base_price * 1.5);
  else
    v_unit_price := v_base_price;
  end if;

  v_total := v_unit_price * p_quantity;

  -- 2. Paid amount.
  --
  -- Wallet orders are settled here rather than trusting the caller: the RPC
  -- debits the wallet itself. The `place-order` Edge Function also debits before
  -- calling, but that debit is not something this function can verify, so the
  -- money movement and the `paid = total` flag are kept in one transaction.
  v_paid := 0;
  if p_payment_method = 'wallet' then
    -- Raises 'insufficient wallet balance' when the customer cannot pay.
    perform deduct_wallet(p_customer_id, v_total);
    v_paid := v_total;
  elsif p_paid is not null and p_paid > 0 then
    -- Online settlement. `p_paid` comes from the caller (the Edge Function,
    -- which has already confirmed the gateway — directly in mock-auto mode, or
    -- from a verified callback). Clamp to the server-computed total so a
    -- mismatched or malicious value cannot overstate what was collected.
    v_paid := least(p_paid, v_total);
  end if;

  -- The column is an enum but the RPC signature takes text (the Edge Function
  -- passes through whatever the client sent). Reject unknown values with a
  -- clear message instead of failing on an opaque enum cast.
  if p_payment_method is not null
     and p_payment_method <> ''
     and p_payment_method::text not in ('online', 'wallet') then
    raise exception 'invalid payment method: %', p_payment_method;
  end if;
  v_payment_method := coalesce(nullif(p_payment_method, ''), 'online')::payment_method_t;

  -- 3. Generate tracking code
  v_tracking := 'HMY-' || upper(substr(md5(random()::text), 1, 10));

  -- 4. Insert order (server-authoritative fields override client)
  insert into orders (
    tracking_code, customer_id, type, channel, status, priority,
    total, paid, remaining, payment_method, gateway_ref,
    form_data, service_id, created_at
  ) values (
    v_tracking, p_customer_id, 'service', 'وب‌سایت', 'new',
    (case when p_urgent then 'urgent' else 'normal' end)::order_priority_t,
    v_total, v_paid, v_total - v_paid,
    v_payment_method, p_gateway_ref,
    p_form_data, p_service_id, now()
  )
  returning id into v_order_id;

  -- 4b. Initial status history entry (status history is a normalized table)
  insert into order_status_history (order_id, status, "date", actor_id, note)
  values (v_order_id, 'new', now(), p_customer_id, 'ثبت سفارش آنلاین');

  -- 5. Order line item
  insert into order_items (order_id, name, price, quantity, total)
  values (v_order_id, v_service_name, v_unit_price, p_quantity, v_unit_price * p_quantity);

  -- 6. Invoice (payment receipt)
  insert into invoices (
    invoice_number, order_id, type, customer_name,
    customer_phone,
    subtotal, total,
    note, status
  ) values (
    'PAY-' || to_char(now(), 'YYYY-MM-DD') || '-' || replace(v_tracking, 'HMY-', ''),
    v_order_id, 'service',
    (select display_name from profiles where id = p_customer_id limit 1),
    (select phone from profiles where id = p_customer_id limit 1),
    v_total, v_total,
    'رسید پرداخت سفارش ' || v_tracking,
    (case when v_paid > 0 then 'paid' else 'issued' end)::invoice_status_t
  )
  returning id into v_invoice_id;

  -- 6a. Link the pending payment to the order.
  --
  -- `create_payment_record` runs before the order exists, so the linkage happens
  -- here by matching `gateway_ref`. Without this, `payments.order_id` stayed
  -- NULL and `verify_payment` could neither settle the order nor award the
  -- purchase loyalty points.
  -- `order_id` is also an OUT parameter of this function, so the SET/WHERE
  -- targets are qualified to keep them distinct from the variable.
  if p_gateway_ref is not null and p_gateway_ref <> '' then
    update payments
    set order_id = v_order_id
    where payments.gateway_ref = p_gateway_ref and payments.order_id is null;
  end if;

  -- 6b. Invoice line items (normalized child table)
  insert into invoice_items (invoice_id, name, quantity, unit, price)
  values (v_invoice_id, v_service_name, p_quantity, v_service_unit, v_unit_price);

  -- 6c. Persist uploaded documents.
  --
  -- The Edge Function uploads files into the caller's staging folder *before*
  -- the order exists and sends the resulting `storage_path` values in
  -- `p_documents`. The storage read policy only grants access to objects
  -- referenced by an `order_documents` row, so skipping this insert made every
  -- uploaded ID card / passport permanently unreachable.
  if p_documents is not null and jsonb_typeof(p_documents) = 'array' then
    for v_doc in select * from jsonb_array_elements(p_documents)
    loop
      v_doc_path := nullif(v_doc ->> 'storage_path', '');
      if v_doc_path is not null then
        insert into order_documents (order_id, storage_path, label, uploaded_by)
        values (v_order_id, v_doc_path, nullif(v_doc ->> 'label', ''), p_customer_id)
        on conflict do nothing;
      end if;
    end loop;
  end if;

  -- 7. Link invoice back to order.
--    `receipt_invoice_id` is specifically the DELIVERY receipt and must stay
--    NULL here — setting it to the payment invoice would make
--    change_order_status skip issuing the real delivery receipt
--    (it guards on `receipt_invoice_id is null`).

  -- 8. Audit log
  insert into audit_logs (actor_id, is_admin, action, details, module, ip)
  values (p_customer_id, false, 'ثبت سفارش آنلاین', 'سفارش ' || v_tracking || ' — ' || v_service_name || '، مبلغ ' || v_total || ' تومان، روش ' || p_payment_method, 'سفارشات', inet_client_addr());

  -- 9. SMS notification (insert into sms_logs)
  insert into sms_logs (phone, message, status)
  values (
    (select phone from profiles where id = p_customer_id limit 1),
    'سفارش «' || v_service_name || '» با کد ' || v_tracking || ' ثبت و پرداخت شد. مجموع: ' || v_total || ' تومان.',
    'pending'
  );

  -- 10. Notification
  insert into notifications (user_id, type, title, message, link, priority)
  values (p_customer_id, 'order', 'سفارش جدید', 'سفارش «' || v_service_name || '» با کد ' || v_tracking || ' ثبت شد.', '/admin/orders', 'high');

  -- OUT parameters of `returns table` are not assigned automatically; without
  -- this the caller receives a row of NULLs instead of the new order.
  order_id      := v_order_id;
  tracking_code := v_tracking;
  invoice_id    := v_invoice_id;
  return next;
  return;
end;
$$;
--
-- On delivery: deducts product stock, issues receipt invoice, and awards
-- loyalty points — all in one transaction.
-- =========================================================================
create or replace function change_order_status(
  p_order_id    uuid,
  p_new_status  order_status_t,
  p_actor_id    uuid,
  p_note        text
)
returns table (
  tracking_code     text,
  new_status        order_status_t,
  stock_deducted    boolean,
  receipt_issued    boolean,
  loyalty_points    integer
)
language plpgsql
security definer
as $$
declare
  v_order orders%rowtype;
  v_was_delivered boolean;
  v_is_delivered boolean;
  v_stock_deducted boolean := false;
  v_receipt_issued boolean := false;
  v_loyalty_points integer := 0;
  v_tracking text;
  v_invoice_id uuid;
  v_cfg jsonb;
  v_effective_actor uuid;
begin
  -- Authorization: SECURITY DEFINER bypasses RLS, so the caller must prove
  -- staff access to orders here.  service_role (Edge Functions) is allowed.
  if auth.role() = 'service_role' then
    v_effective_actor := p_actor_id;
  else
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if not has_permission('perm2') then
      raise exception 'permission denied: cannot change order status';
    end if;
    -- The actor is taken from the session, never from the argument, so audit
    -- history cannot be forged.
    v_effective_actor := auth.uid();
  end if;

  -- Load the order
  select * into v_order from orders where id = p_order_id;
  if not found then
    raise exception 'order not found';
  end if;

  v_was_delivered := (v_order.status = 'delivered');
  v_is_delivered := (p_new_status = 'delivered');
  v_tracking := v_order.tracking_code;

  -- Transition validation.
  --
  -- Without this the function accepted any pair, so `cancelled → delivered`
  -- deducted product stock, issued a delivery receipt and awarded loyalty for an
  -- order that had been cancelled. The `orders_enforce_authority` trigger only
  -- blocks *leaving* `delivered`, and it does so by silently rewriting
  -- `new.status` — which left `orders.status`, the status history row and the
  -- returned value disagreeing. Validating up front makes both cases explicit.
  if v_order.status = p_new_status then
    raise exception 'order is already in status %', p_new_status;
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'illegal transition: % -> % (a cancelled order is terminal)',
      v_order.status, p_new_status;
  end if;

  if v_order.status = 'delivered' then
    raise exception 'illegal transition: % -> % (a delivered order cannot be reopened)',
      v_order.status, p_new_status;
  end if;

  if p_new_status = 'delivered' and v_order.status not in ('new', 'processing', 'ready') then
    raise exception 'illegal transition: % -> %', v_order.status, p_new_status;
  end if;

  -- Forward-only through the happy path. `cancelled` and `delivered` are
  -- handled above as terminal; this rejects backwards moves such as
  -- `processing -> new`, which would otherwise re-open a completed step.
  if p_new_status = 'new' and v_order.status <> 'new' then
    raise exception 'illegal transition: % -> new', v_order.status;
  end if;

  if p_new_status = 'processing' and v_order.status = 'ready' then
    raise exception 'illegal transition: ready -> processing';
  end if;

  -- Update status + history
  update orders
  set status = p_new_status,
      updated_at = now()
  where id = p_order_id;

  insert into order_status_history (order_id, status, "date", actor_id, actor_name, note)
  values (p_order_id, p_new_status, now(), v_effective_actor,
    (select display_name from staff_accounts where auth_uid = v_effective_actor limit 1),
    p_note);

  -- Audit log
  insert into audit_logs (actor_id, is_admin, action, details, module, ip)
  values (v_effective_actor, true, 'تغییر وضعیت سفارش',
    'سفارش ' || v_tracking || ' به ' || p_new_status, 'سفارشات', inet_client_addr());

  -- On NEW delivery: stock + receipt + loyalty
  if v_is_delivered and not v_was_delivered then
    -- Stock deduction for product orders
    if v_order.type = 'product' then
      declare
        item order_items%rowtype;
      begin
        for item in select * from order_items where order_id = p_order_id and product_id is not null loop
          update products
          set stock = greatest(0, stock - item.quantity)
          where id = item.product_id;
          v_stock_deducted := true;
        end loop;
      end;
    end if;

    -- Issue delivery receipt
    if v_order.receipt_invoice_id is null then
      insert into invoices (
        invoice_number, order_id, type,
        customer_name, customer_phone,
        subtotal, total,
        note, status
      ) values (
        'RCPT-' || to_char(now(), 'YYYY-MM-DD') || '-' || replace(v_tracking, 'HMY-', ''),
        p_order_id,
        -- `invoices.type` is invoice_type_t while `orders.type` is order_type_t.
        -- The value sets line up today, but a bare assignment fails the whole
        -- delivery if a new order type is added without an invoice twin, so the
        -- value is mapped explicitly and falls back to 'service'.
        case v_order.type
          when 'product'   then 'product'::invoice_type_t
          when 'webdesign' then 'webdesign'::invoice_type_t
          when 'media'     then 'media'::invoice_type_t
          else 'service'::invoice_type_t
        end,
        v_order.customer_name,
        (select phone from profiles
          where id = v_order.customer_id
          limit 1),
        v_order.total, v_order.total,
        'رسید تحویل سفارش ' || v_tracking,
        (case when v_order.remaining <= 0 then 'paid' else 'issued' end)::invoice_status_t
      )
      returning id into v_invoice_id;

      insert into invoice_items (invoice_id, name, quantity, unit, price)
      select v_invoice_id, name, quantity, 'عدد', price
      from order_items where order_id = p_order_id;

      update orders set receipt_invoice_id = v_invoice_id where id = p_order_id;
      v_receipt_issued := true;
    end if;

    -- Customer club: award purchase loyalty points
    if v_order.customer_id is not null and v_order.paid > 0 then
      select config into v_cfg from gamification_settings limit 1;
      if v_cfg is not null then
        v_loyalty_points := LEAST(
          GREATEST(1, round((v_order.paid / ((v_cfg->>'points_per_toman')::bigint)) * (
            select case when p.level = 'vip' then 2.0 when p.level = 'gold' then 1.5 when p.level = 'silver' then 1.25 else 1 end
            from profiles p where p.id = v_order.customer_id
          ))),
          999999
        );
        if v_loyalty_points > 0 then
          perform award_loyalty(
            v_order.customer_id,
            v_loyalty_points,
            'امتیاز خرید سفارش ' || v_tracking,
            'purchase'::loyalty_category_t,
            v_effective_actor
          );
        end if;
      end if;
    end if;
  end if;

-- OUT parameters of `returns table` are not assigned automatically.
  tracking_code  := v_tracking;
  new_status     := p_new_status;
  stock_deducted := v_stock_deducted;
  receipt_issued := v_receipt_issued;
  loyalty_points := v_loyalty_points;
  return next;
  return;
end;
$$;

-- =========================================================================
-- RPC: award_loyalty — SECURITY DEFINER, append-only loyalty write
--
-- Only callable by staff (the Edge Function enforces has_permission).
-- Appends to loyalty_transactions and updates the profile atomically.
-- =========================================================================
create or replace function award_loyalty(
  p_user_id      uuid,
  p_points       integer,
  p_reason       text,
  p_category     loyalty_category_t,
  p_actor_id     uuid
)
returns table (
  points      integer,
  new_total   bigint,
  new_level   text,
  txn_id      uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_points bigint;
  v_new_total bigint;
  v_new_level text;
  v_cfg jsonb;
  v_running integer;
  v_txn_id uuid;
begin
  if p_points <= 0 then
    raise exception 'points must be positive';
  end if;

  -- Verify caller is staff.  service_role (Edge Functions such as
  -- verify_payment) is allowed through; has_permission is left to the caller
  -- layer so a specific permission can be enforced there.
  if auth.role() <> 'service_role' and not is_staff() then
    raise exception 'permission denied: must be staff to award loyalty';
  end if;

  -- Update profile atomically
  update profiles
  set loyalty_points = (coalesce(loyalty_points, 0)) + p_points,
      total_earned_points = (coalesce(total_earned_points, 0)) + p_points,
      level = compute_level_from_points((coalesce(total_earned_points, 0)) + p_points)
  where id = p_user_id
  returning loyalty_points, total_earned_points, level into v_new_points, v_new_total, v_new_level;

  if not found then
    raise exception 'profile not found';
  end if;

  select running_balance into v_running from (
    select coalesce(max(running_balance), 0) as running_balance
    from loyalty_transactions where user_id = p_user_id
  ) s;

insert into loyalty_transactions (user_id, points, running_balance, reason, category, by_admin, actor_id)
    values (p_user_id, p_points, v_new_points, p_reason, p_category, true, p_actor_id)
  returning id into v_txn_id;

  -- OUT parameters of `returns table` are not assigned automatically.
  points    := v_new_points;
  new_total := v_new_total;
  new_level := v_new_level;
  txn_id    := v_txn_id;
  return next;
  return;
end;
$$;

-- =========================================================================
-- RPC: compute_level_from_points — pure function for level calculation
-- =========================================================================
create or replace function compute_level_from_points(p_points bigint)
returns text
language plpgsql
immutable
as $$
declare
  v_level text;
begin
  select level into v_level
  from (
    select 'normal'::text as level, 0 as min_points, 1 as sort_order
    union all select 'silver', 100, 2
    union all select 'gold', 500, 3
    union all select 'vip', 1000, 4
  ) tiers
  where p_points >= min_points
  order by sort_order desc
  limit 1;

  if v_level is null then
    return 'normal';
  else
    return v_level;
  end if;
end;
$$;

-- =========================================================================
-- RPC: verify_payment — callback from payment gateway (mock mode supported)
--
-- In mock-auto mode the payment is marked paid immediately.  In production
-- this is called by the bank's webhook with the gateway_ref to flip the
-- payment from pending → paid and award loyalty.
-- =========================================================================
-- The OUT parameters are deliberately named `out_*`. With the original names
-- (`payment_id`, `order_id`, `status`) they shadowed the identically-named
-- columns of `payments` inside the body, so `set status = 'paid'` resolved to
-- the *parameter* rather than the column and Postgres failed with
-- "invalid input syntax for type uuid: paid". An UPDATE SET target cannot be
-- qualified to disambiguate, so renaming the parameters is the fix.
create or replace function verify_payment(p_gateway_ref text, p_success boolean, p_trace text)
returns table (
  out_payment_id uuid,
  out_order_id   uuid,
  out_status     payment_status_t
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_payment_id uuid;
  v_order_id uuid;
  v_newly_paid boolean := false;
  v_final_status payment_status_t;
begin
  -- The gateway callback is a privileged, unauthenticated entry point: it is
  -- restricted to service_role and must carry a valid gateway_ref.
  if auth.role() <> 'service_role' then
    raise exception 'permission denied: payment verification is service-role only';
  end if;

  -- `payment_id`, `order_id` and `status` are OUT parameters *and* columns of
  -- `payments`, so every reference inside the body is qualified with the table
  -- alias or an explicit `payments.` prefix.
  select * into v_payment from payments where payments.gateway_ref = p_gateway_ref;
  if not found then
    raise exception 'payment not found for gateway ref %', p_gateway_ref;
  end if;
  v_payment_id := v_payment.id;

  if p_success then
    -- Idempotency: only a payment that is not already settled may flip, and the
    -- loyalty award runs only when this call is the one that flipped it.
    -- Previously every repeat callback re-ran the award, so a retried webhook
    -- credited the customer more than once.
    update payments
    set status = 'paid', paid_at = now()
    where payments.id = v_payment.id
      and payments.status is distinct from 'paid'::payment_status_t;

    if found then
      v_newly_paid := true;

      -- Settle the order this payment belongs to. `place_order` links
      -- `payments.order_id` by `gateway_ref`; without this the order stayed at
      -- `paid = 0` even after a successful payment.
      if v_payment.order_id is not null then
        v_order_id := v_payment.order_id;

        update orders
        set paid = orders.total, updated_at = now()
        where orders.id = v_order_id and orders.paid < orders.total;

        -- `round(bigint)` returns numeric, so the result needs an explicit integer
        -- cast: award_loyalty takes `p_points integer`.
        perform award_loyalty(
          (select o.customer_id from orders o where o.id = v_order_id limit 1),
          greatest(1, round(v_payment.amount / 10000.0)::integer),
          'امتیاز خرید آنلاین (پرداخت شده)',
          'purchase'::loyalty_category_t,
          null            -- system-triggered: no acting user
        );
      end if;
    end if;
  else
    update payments
    set status = 'failed'::payment_status_t
    where payments.id = v_payment.id and payments.status <> 'failed'::payment_status_t;
  end if;

  -- Track the resulting status locally instead of re-reading the row.
  --
  -- `SELECT p.id, p.order_id, p.status INTO v_payment` looks equivalent but is
  -- NOT: plpgsql expands a composite INTO target into its *fields* and assigns
  -- positionally, so the third value (`p.status`, 'paid') was assigned to the
  -- third field of `payments` — `user_id uuid` — and the call failed with
  -- "invalid input syntax for type uuid: paid". `select * into` works, but a
  -- scalar is clearer and avoids the trap entirely.
  if p_success then
    v_final_status := case when v_newly_paid then 'paid'::payment_status_t
                          else v_payment.status end;
  else
    v_final_status := 'failed'::payment_status_t;
  end if;

  -- RETURN QUERY's output columns are matched to the OUT parameter names
  -- positionally, so each source expression is aliased explicitly.
  return query
  select v_payment_id as out_payment_id,
         v_payment.order_id as out_order_id,
         v_final_status as out_status;
end;
$$;

-- =========================================================================
-- Grants
--
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default.  Every
-- SECURITY DEFINER function below must therefore be revoked explicitly and
-- re-granted only to the roles that legitimately need it, otherwise `anon`
-- could call them and inherit the definer's privileges.
-- =========================================================================

-- `deduct_wallet` debits the caller's own wallet. Granting it to `authenticated`
-- is safe because the function body refuses to debit anyone else's uid without
-- `perm32` (audit permission).
revoke all on function deduct_wallet(uuid, bigint) from public;
grant execute on function deduct_wallet(uuid, bigint) to authenticated, service_role;

-- `refund_wallet` *credits* a wallet. The body's own-uid check is not a
-- safeguard: a customer calling refund_wallet(auth.uid(), <amount>, 'x') passes
-- it and mints themselves unlimited spendable balance. Only a server-side
-- rollback path may credit funds, so this is service_role only.
revoke all on function refund_wallet(uuid, bigint, text) from public;
grant execute on function refund_wallet(uuid, bigint, text) to service_role;

-- `deposit_wallet` lets a customer top up their own wallet. Unlike
  -- `refund_wallet` this is safe for `authenticated` callers because the body
  -- enforces `auth.uid() = p_user_id` (or `perm32` for staff) and the amount is
  -- supplied by the caller, not by a server-side rollback. The BEFORE INSERT
  -- trigger `wallet_txn_trigger` is the single writer of `profiles.wallet_balance`.
  -- `deposit_wallet` must NOT update profiles itself, or the balance moves twice.
  revoke all on function deposit_wallet(uuid, bigint, text) from public;
  grant execute on function deposit_wallet(uuid, bigint, text) to authenticated, service_role;

  -- `create_payment_record` creates a `pending` payment row; the client needs it
  -- to obtain a gateway_ref for checkout. It cannot mark anything paid, and it
  -- runs *before* the order exists, so `order_id` is linked afterwards by
  -- `place_order` matching on `gateway_ref`.
  revoke all on function create_payment_record(uuid, bigint, text) from public;
  grant execute on function create_payment_record(uuid, bigint, text) to authenticated, service_role;

-- `place_order` charges the customer, so it must not be directly reachable by
-- the client: its body never debits the wallet, and the Edge Function performs
-- the debit as service_role. Leaving it granted to `authenticated` let any
-- customer call it over PostgREST with payment_method='wallet' and receive a
-- fully-paid order with no corresponding wallet_transaction row.
-- service_role only — `place-order/index.ts` is the sole caller.
revoke all on function place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb) from public;
grant execute on function place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb) to service_role;

-- `change_order_status` mutates money and inventory, but it carries a real
-- permission check (perm2) and derives the actor from the session rather than
-- the argument, so staff legitimately need direct access.
revoke all on function change_order_status(uuid, order_status_t, uuid, text) from public;
grant execute on function change_order_status(uuid, order_status_t, uuid, text) to authenticated, service_role;

-- `award_loyalty` raises a customer's point balance, so it is granted to
-- `service_role` only. The body additionally requires `is_staff()`, but the
-- grant itself stays narrow: a staff account should award points through the
-- `award-loyalty` Edge Function, which can enforce a specific permission and
-- write an audit row.
revoke all on function award_loyalty(uuid, integer, text, loyalty_category_t, uuid) from public;
grant execute on function award_loyalty(uuid, integer, text, loyalty_category_t, uuid) to service_role;

revoke all on function verify_payment(text, boolean, text) from public;
grant execute on function verify_payment(text, boolean, text) to service_role;

-- Pure helper: no table access, safe for any authenticated caller.
revoke all on function compute_level_from_points(bigint) from public;
grant execute on function compute_level_from_points(bigint) to anon, authenticated, service_role;

-- Trigger functions are never called directly.
revoke all on function wallet_txn_trigger() from public;
