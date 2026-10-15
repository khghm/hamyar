-- 027 — Add 'media' kind support to place_catalog_order RPC
-- Allows customers to order media items (movies, series) through the catalog order flow

-- Drop existing function first (different return type)
drop function if exists place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb);

-- 1. Create updated function with 'media' kind support
create or replace function place_catalog_order(
  p_customer_id    uuid,
  p_kind           text,        -- 'product' | 'project' | 'media'
  p_items          jsonb,       -- [{ "ref": "p3", "quantity": 2 }, …]
  p_payment_method text,
  p_gateway_ref    text,
  p_coupon_code    text,
  p_urgent         boolean,
  p_form_data      jsonb,
  p_documents      jsonb
)
returns table (
  order_id      uuid,
  tracking_code text,
  invoice_id    uuid,
  total         bigint,
  paid          bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind             text;
  v_order_type       order_type_t;
  v_invoice_type     invoice_type_t;
  v_group            text;
  v_order_id         uuid;
  v_invoice_id       uuid;
  v_tracking         text;
  v_total            bigint := 0;
  v_discount         bigint := 0;
  v_grand            bigint;
  v_paid             bigint := 0;
  v_payment_method   payment_method_t;
  v_item             jsonb;
  v_ref              text;
  v_qty              integer;
  v_pid              uuid;
  v_name             text;
  v_price            bigint;
  v_stock            integer;
  v_image            text;
  v_unit             text;
  v_lines            jsonb := '[]'::jsonb;
  v_summary          text := '';
  v_cpn              record;
  v_cpn_amount       bigint := 0;
  v_discount_type    text := 'fixed';
  v_doc              jsonb;
  v_doc_path         text;
begin
  -- 1. Auth guard
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_customer_id then
      raise exception 'permission denied: cannot place an order for another customer';
    end if;
  end if;

  v_kind := lower(coalesce(nullif(trim(p_kind), ''), ''));
  if v_kind not in ('product', 'project', 'media') then
    raise exception 'invalid order kind: %', p_kind;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  if p_payment_method is not null
     and p_payment_method <> ''
     and p_payment_method not in ('online', 'wallet') then
    raise exception 'invalid payment method: %', p_payment_method;
  end if;
  v_payment_method := coalesce(nullif(p_payment_method, ''), 'online')::payment_method_t;

  -- 2. Pricing from database
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_ref  := nullif(v_item ->> 'ref', '');
    v_qty  := coalesce((v_item ->> 'quantity')::integer, 0);

    if v_ref is null then
      raise exception 'order item is missing its ref';
    end if;
    if v_qty < 1 or v_qty > 99 then
      raise exception 'invalid quantity for %: %', v_ref, v_qty;
    end if;

    if v_kind = 'product' then
      select id, name, price, stock, image
        into v_pid, v_name, v_price, v_stock, v_image
        from products
       where sku = v_ref or id::text = v_ref;

      if v_pid is null then
        raise exception 'product not found: %', v_ref;
      end if;
      if v_stock < v_qty then
        raise exception 'insufficient stock for %: have %, need %', v_name, v_stock, v_qty;
      end if;

    elsif v_kind = 'media' then
      select id, title, price, 999999, image, 'عدد'
        into v_pid, v_name, v_price, v_stock, v_image, v_unit
        from media_items
       where sku = v_ref or id::text = v_ref;

      if v_pid is null then
        raise exception 'media item not found: %', v_ref;
      end if;
      -- Media items don't have stock limit (digital)
      v_stock := 999999;
      v_unit := 'عدد';

    else
      -- project (webdesign/content)
      select id, title, base_price, unit
        into v_pid, v_name, v_price, v_unit
        from project_services
       where sku = v_ref or id::text = v_ref;

      if v_pid is null then
        raise exception 'project service not found: %', v_ref;
      end if;
      v_stock := null;
      v_image := null;
    end if;

    v_total := v_total + v_price * v_qty;
    v_summary := v_summary || v_name || ' × ' || v_qty || '؛ ';

    v_lines := v_lines || jsonb_build_object(
      'product_id',   case when v_kind = 'product'   then v_pid else null end,
      'media_id',     case when v_kind = 'media'     then v_pid else null end,
      'name',         v_name,
      'price',        v_price,
      'quantity',     v_qty,
      'total',        v_price * v_qty,
      'image',        v_image,
      'unit',         coalesce(v_unit, 'عدد')
    );
  end loop;

  if v_total <= 0 then
    raise exception 'order total must be positive';
  end if;

  -- Order type mapping
  if v_kind = 'product' then
    v_order_type := 'product';
  elsif v_kind = 'media' then
    v_order_type := 'media';
  else
    select "group" into v_group from project_services where id = v_pid;
    v_order_type := case when v_group = 'webdesign' then 'webdesign' else 'service' end;
  end if;

  v_invoice_type := v_order_type::text::invoice_type_t;

  -- 3. Coupon
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_cpn
      from campaigns
     where upper(trim(code)) = upper(trim(p_coupon_code))
       and active
       and (start_date is null or start_date <= now())
       and (end_date is null or end_date >= now())
     for update;

if not found then
      raise exception 'invalid or expired discount code';
    end if;
    if v_cpn.max_uses is not null and coalesce(v_cpn.used_count, 0) >= v_cpn.max_uses then
      raise exception 'this discount code has reached its usage limit';
    end if;
    if v_cpn.min_purchase is not null and v_total < v_cpn.min_purchase then
      raise exception 'this discount code requires a minimum purchase of % Toman', v_cpn.min_purchase;
    end if;

    if v_cpn.discount_type = 'percent' then
      v_cpn_amount := round(v_total * coalesce(v_cpn.discount_value, 0) / 100.0);
      v_discount_type := 'percent';
    else
      v_cpn_amount := coalesce(v_cpn.discount_value, 0);
      v_discount_type := 'fixed';
    end if;
    v_cpn_amount := least(greatest(v_cpn_amount, 0), v_total);

    update campaigns set used_count = coalesce(used_count, 0) + 1 where id = v_cpn.id;
  end if;

  v_discount := v_cpn_amount;
  v_grand    := v_total - v_discount;

  -- 4. Payment
  v_paid := 0;
  if v_payment_method = 'wallet' then
    perform deduct_wallet(p_customer_id, v_grand);
    v_paid := v_grand;
  end if;

  -- 5. Insert order
  v_tracking := 'HMY-' || upper(substr(md5(random()::text), 1, 10));

  insert into orders (
    tracking_code, customer_id, type, channel, status, priority,
    total, paid, remaining, payment_method, gateway_ref,
    form_data, project_service_id, created_at
  ) values (
    v_tracking, p_customer_id, v_order_type, 'وب‌سایت', 'new',
    (case when p_urgent then 'urgent' else 'normal' end)::order_priority_t,
    v_grand, v_paid, v_grand - v_paid,
    v_payment_method, nullif(p_gateway_ref, ''),
    p_form_data,
    (case when v_kind = 'project' then v_pid else null end),
    now()
  )
  returning id into v_order_id;

  insert into order_status_history (order_id, status, "date", actor_id, note)
  values (v_order_id, 'new', now(), p_customer_id, 'ثبت سفارش آنلاین');

  -- 6. Order items
  for v_item in select * from jsonb_array_elements(v_lines)
  loop
    insert into order_items (order_id, product_id, media_id, name, price, quantity, total, image)
    values (
      v_order_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      nullif(v_item ->> 'media_id', '')::uuid,
      v_item ->> 'name',
      (v_item ->> 'price')::bigint,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'total')::bigint,
      v_item ->> 'image'
    );
  end loop;

  -- 7. Invoice
  insert into invoices (
    invoice_number, order_id, type, date, customer_name, customer_phone,
    subtotal, discount, discount_type, discount_amount, tax, tax_amount, total,
    note, status
  ) values (
    'PAY-' || to_char(now(), 'YYYY-MM-DD') || '-' || replace(v_tracking, 'HMY-', ''),
    v_order_id, v_invoice_type, now(),
    (select display_name from profiles where id = p_customer_id limit 1),
    (select phone from profiles where id = p_customer_id limit 1),
    v_total, v_discount, v_discount_type, v_discount, 0, 0, v_grand,
    'رسید پرداخت سفارش ' || v_tracking,
    (case when v_paid > 0 then 'paid' else 'issued' end)::invoice_status_t
  )
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(v_lines)
  loop
    insert into invoice_items (invoice_id, name, quantity, unit, price)
    values (
      v_invoice_id,
      v_item ->> 'name',
      (v_item ->> 'quantity')::integer,
      coalesce(v_item ->> 'unit', 'عدد'),
      (v_item ->> 'price')::bigint
    );
  end loop;

  -- 8. Documents
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

  -- 9. Link payment
  if p_gateway_ref is not null and p_gateway_ref <> '' then
    update payments
       set order_id = v_order_id
     where payments.gateway_ref = p_gateway_ref and payments.order_id is null;
  end if;

  -- 10. Audit, SMS, Notification
  insert into audit_logs (actor_id, is_admin, action, details, module, ip)
  values (
    p_customer_id, false, 'ثبت سفارش آنلاین',
    'سفارش ' || v_tracking || ' — ' || v_summary || '، مبلغ ' || v_grand || ' تومان، روش ' || v_payment_method,
    'سفارشات', inet_client_addr()
  );

  insert into sms_logs (phone, message, status)
  values (
    (select phone from profiles where id = p_customer_id limit 1),
    'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد. مجموع: ' || v_grand || ' تومان.',
    'pending'
  );

  insert into notifications (user_id, type, title, message, link, priority)
  values (
    p_customer_id, 'order', 'سفارش جدید',
    'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد.',
    '/admin/orders',
    (case when p_urgent then 'urgent' else 'high' end)
  );

  -- Return values via OUT parameters (returns table)
  order_id      := v_order_id;
  tracking_code := v_tracking;
  invoice_id    := v_invoice_id;
  total         := v_grand;
  paid          := v_paid;
  return next;
end;
$$;

-- Grant execute to authenticated and service_role
grant execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  to authenticated, service_role;

revoke execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  from anon;

comment on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb) is
  'Atomic catalog order creation: supports product, media, and project kinds. Server-authoritative pricing, stock, wallet, invoice, notifications.';