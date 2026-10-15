-- ============================================================================
-- 031_fix_content_order_invoice_and_persistence.sql
--
-- رفع چند مشکل مرتبط با جریان سفارش تولید محتوا:
--
--   ۱) خطای RLS برای جدول content_projects:
--      مشتری هنگام ثبت سفارش محتوا، کلاینت سعی می‌کند مستقیماً در
--      content_projects درج کند ولی سیاست RLS فقط پرسنل را اجازه می‌دهد.
--      راه‌حل: ساخت پروژهٔ محتوا داخل تابع place_catalog_order (SECURITY
--      DEFINER) که RLS را دور می‌زند.
--
--   ۲) نداشتن نام مشتری در فاکتور:
--      تابع‌ها فقط display_name را می‌خواندند و اگر NULL بود، فاکتور بدون نام
--      صادر می‌شد. راه‌حل: coalesce(display_name, phone, email).
--
--   ۳) پاک شدن داده‌ها هنگام ری‌استارت سرور:
--      چون content_projects در دیتابیس ذخیره نمی‌شد (RLS)، فقط در localStorage
--      می‌ماند و با هیدریشن از سرور (خالی) از بین می‌رفت. با حل مسئلهٔ ۱،
--      داده‌ها در دیتابیس ابری باقی می‌مانند.
--
--   ۴) تأثیر نداشتن سفارشات مشتری بر حسابداری و تحلیل:
--      چون فاکتور و سفارش درست ثبت می‌شوند (از قبل در RPC بودند)، بخش‌های مالی
--      و تحلیلی پس از رفع مشکلات بالا به‌روزرسانی می‌شوند.
-- ============================================================================

-- ============================================================================
-- ۱. بازنویسی place_catalog_order با ساخت content_project و fallback نام
-- ============================================================================
drop function if exists place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb);

create or replace function place_catalog_order(
  p_customer_id    uuid,
  p_kind           text,
  p_items          jsonb,
  p_payment_method text,
  p_gateway_ref    text,
  p_coupon_code    text,
  p_urgent         boolean,
  p_form_data      jsonb,
  p_documents      jsonb
)
returns table (
  order_id            uuid,
  tracking_code       text,
  invoice_id          uuid,
  total               bigint,
  paid                bigint,
  content_project_sku text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind            text;
  v_order_type      order_type_t;
  v_invoice_type    invoice_type_t;
  v_group           text;
  v_order_id        uuid;
  v_invoice_id      uuid;
  v_tracking        text;
  v_total           bigint := 0;
  v_discount        bigint := 0;
  v_grand           bigint;
  v_paid            bigint := 0;
  v_payment_method  payment_method_t;
  v_item            jsonb;
  v_ref             text;
  v_qty             integer;
  v_pid             uuid;
  v_name            text;
  v_price           bigint;
  v_stock           integer;
  v_image           text;
  v_unit            text;
  v_lines           jsonb := '[]'::jsonb;
  v_summary         text := '';
  v_cpn             record;
  v_cpn_amount      bigint := 0;
  v_discount_type   text := 'fixed';
  v_doc             jsonb;
  v_doc_path        text;
  v_customer_phone  text;
  v_customer_name   text;
  v_customer_email  text;
  v_customer_display text;
  v_staff           record;
  v_content_sku     text;
  v_content_type    text;
  v_content_title   text;
  v_deadline        text;
begin
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

  -- نام، شماره و ایمیل مشتری را یک‌بار بخوان
  select display_name, phone, email into v_customer_name, v_customer_phone, v_customer_email
    from profiles where id = p_customer_id limit 1;

  -- fallback نام مشتری: اگر display_name خالی بود، از تلفن یا ایمیل استفاده کن
  v_customer_display := coalesce(
    nullif(trim(v_customer_name), ''),
    nullif(v_customer_phone, ''),
    nullif(v_customer_email, ''),
    'مشتری'
  );

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
      select id, title, price
        into v_pid, v_name, v_price
        from media_items
       where sku = v_ref or id::text = v_ref;

      if v_pid is null then
        raise exception 'media not found: %', v_ref;
      end if;
      v_stock := null;
      v_image := null;
    else
      select id, title, base_price, unit, "group"
        into v_pid, v_name, v_price, v_unit, v_group
        from project_services
       where sku = v_ref or id::text = v_ref;

      if v_pid is null then
        raise exception 'project service not found: %', v_ref;
      end if;
      v_stock := null;
      v_image := null;
    end if;

    v_total := v_total + (v_price * v_qty);

    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object(
        'product_id', case when v_kind = 'product' then v_pid else null end,
        'name',      v_name,
        'price',     v_price,
        'quantity',  v_qty,
        'total',     v_price * v_qty,
        'image',     v_image
      )
    );

    v_summary := v_summary || case when v_summary = '' then '' else '، ' end
                || v_name || ' ×' || v_qty;
  end loop;

  if v_total <= 0 then
    raise exception 'order total must be positive';
  end if;

  if v_kind = 'product' then
    v_order_type := 'product';
  elsif v_kind = 'media' then
    v_order_type := 'media';
  else
    v_order_type := case when v_group = 'webdesign' then 'webdesign' else 'service' end;
  end if;

  v_invoice_type := v_order_type::text::invoice_type_t;

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

  v_paid := 0;
  if v_payment_method = 'wallet' then
    perform deduct_wallet(p_customer_id, v_grand);
    v_paid := v_grand;
  end if;

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
    (case when v_kind = 'product' then null else v_pid end),
    now()
  )
  returning id into v_order_id;

  insert into order_status_history (order_id, status, "date", actor_id, note)
  values (v_order_id, 'new', now(), p_customer_id, 'ثبت سفارش آنلاین');

  for v_item in select * from jsonb_array_elements(v_lines)
  loop
    insert into order_items (order_id, product_id, name, price, quantity, total, image)
    values (
      v_order_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      v_item ->> 'name',
      (v_item ->> 'price')::bigint,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'total')::bigint,
      v_item ->> 'image'
    );
  end loop;

  -- ── ساخت پروژهٔ محتوا برای سفارش‌های گروه content ──────────────────────
  -- این کار داخل تابع (SECURITY DEFINER) انجام می‌شود تا مشتری نیازی به
  -- دسترسی مستقیم به جدول content_projects نداشته باشد و خطای RLS رخ ندهد.
  if v_kind = 'project' and v_group = 'content' then
    v_content_sku := 'cp' || floor(extract(epoch from now()) * 1000)::text;

    -- تعیین نوع محتوا بر اساس شناسه سرویس
    v_content_type := case
      when v_ref like '%-social%' then 'social'
      when v_ref like '%-video%'  then 'video'
      when v_ref like '%-photo%'  then 'photo'
      when v_ref like '%-ad%'     then 'ad'
      else 'article'
    end;

    v_content_title := v_name || ' – سفارش ' || v_tracking;

    -- deadline از form_data
    v_deadline := nullif(p_form_data ->> 'deadline', '');

    insert into content_projects (
      sku, title, type, status, due_date, assigned_to, tags, extra, created_at, updated_at
    ) values (
      v_content_sku,
      v_content_title,
      v_content_type,
      'planning',
      case when v_deadline <> '' then to_timestamp(v_deadline, 'YYYY-MM-DD') else null end,
      '{}',
      array['سفارش آنلاین', 'تولید محتوا'],
      jsonb_build_object(
        'scenario', 'سفارش آنلاین «' || v_name || '» از سمت مشتری ' || v_customer_display ||
                    case when p_urgent then ' (فوری)' else '' end,
        'contentPlan', 'تحویل خروجی طبق بریف مشتری و مدارک بارگذاری‌شده در سفارش ' || v_tracking || '.',
        'budget', v_grand,
        'actualCost', 0,
        'qualityScore', 0,
        'qualityChecklist', '[]'::jsonb,
        'approvalStage', 'draft',
        'versions', '[]'::jsonb,
        'startDate', to_char(now(), 'YYYY-MM-DD'),
        'sourceOrderId', v_order_id::text,
        'sourceTrackingCode', v_tracking,
        'customerName', v_customer_display,
        'priority', case when p_urgent then 'urgent' else 'medium' end,
        'notes', 'این تسک به‌صورت خودکار از سفارش آنلاین ' || v_tracking || ' ایجاد شده و با آن همگام است.'
      ),
      now(),
      now()
    );

    -- پیوند سفارش به پروژهٔ محتوا
    update orders set content_project_id = (
      select id from content_projects where sku = v_content_sku limit 1
    ) where id = v_order_id;
  end if;

  insert into invoices (
    invoice_number, order_id, type, date, customer_name, customer_phone,
    subtotal, discount, discount_type, discount_amount, tax, tax_amount, total,
    note, status
  ) values (
    'PAY-' || to_char(now(), 'YYYY-MM-DD') || '-' || replace(v_tracking, 'HMY-', ''),
    v_order_id, v_invoice_type, now(),
    v_customer_display,
    v_customer_phone,
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
      coalesce(v_unit, 'عدد'),
      (v_item ->> 'price')::bigint
    );
  end loop;

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

  if p_gateway_ref is not null and p_gateway_ref <> '' then
    update payments
       set order_id = v_order_id
     where payments.gateway_ref = p_gateway_ref and payments.order_id is null;
  end if;

  -- ممیزی
  insert into audit_logs (actor_id, is_admin, action, details, module, ip)
  values (
    p_customer_id, false, 'ثبت سفارش آنلاین',
    'سفارش ' || v_tracking || ' — ' || v_summary || '، مبلغ ' || v_grand || ' تومان، روش ' || v_payment_method,
    'سفارشات', inet_client_addr()
  );

  -- پیامک فقط اگر مشتری شماره تلفن داشته باشد
  if v_customer_phone is not null and v_customer_phone <> '' then
    insert into sms_logs (phone, message, status)
    values (
      v_customer_phone,
      'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد. مجموع: ' || v_grand || ' تومان.',
      'pending'
    );
  end if;

  -- اعلان برای مشتری
  insert into notifications (user_id, type, title, message, link, priority, dedupe_key)
  values (
    p_customer_id, 'order', 'سفارش جدید',
    'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد.',
    '/orders',
    (case when p_urgent then 'urgent' else 'high' end),
    'order-customer-' || v_order_id
  );

  -- اعلان برای همه اعضای فعال staff
  for v_staff in select auth_uid from staff_accounts where active loop
    insert into notifications (user_id, type, title, message, link, priority, dedupe_key)
    values (
      v_staff.auth_uid, 'order', 'سفارش جدید',
      'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد.',
      '/admin/orders',
      (case when p_urgent then 'urgent' else 'high' end),
      'order-staff-' || v_staff.auth_uid || '-' || v_order_id
    );
  end loop;

  order_id            := v_order_id;
  tracking_code       := v_tracking;
  invoice_id          := v_invoice_id;
  total               := v_grand;
  paid                := v_paid;
  content_project_sku := v_content_sku;
  return next;
  return;
end;
$$;

grant execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  to authenticated, service_role;

revoke execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  from anon;

-- ============================================================================
-- ۲. بازنویسی place_order با fallback نام مشتری
-- ============================================================================
drop function if exists place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb);

create or replace function place_order(
  p_customer_id    uuid,
  p_service_id     uuid,
  p_quantity       integer,
  p_urgent         boolean,
  p_total          bigint,
  p_paid           bigint,
  p_payment_method text,
  p_gateway_ref    text,
  p_form_data      jsonb,
  p_documents      jsonb
)
returns table (
  order_id      uuid,
  tracking_code text,
  invoice_id    uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_name   text;
  v_service_unit   text;
  v_base_price     bigint;
  v_unit_price     bigint;
  v_total          bigint;
  v_paid           bigint;
  v_payment_method payment_method_t;
  v_order_id       uuid;
  v_invoice_id     uuid;
  v_tracking       text;
  v_customer_name  text;
  v_customer_phone text;
  v_customer_email text;
  v_customer_display text;
  v_doc            jsonb;
  v_doc_path       text;
  v_staff          record;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_customer_id then
      raise exception 'permission denied: cannot place an order for another customer';
    end if;
  end if;

  if p_quantity < 1 or p_quantity > 99 then
    raise exception 'invalid quantity: %', p_quantity;
  end if;

  select name, unit, base_price into v_service_name, v_service_unit, v_base_price
    from services where id = p_service_id and active;
  if not found then
    raise exception 'service not found';
  end if;

  if p_urgent then
    v_unit_price := round(v_base_price * 1.5);
  else
    v_unit_price := v_base_price;
  end if;

  v_total := v_unit_price * p_quantity;

  v_paid := 0;
  if p_payment_method = 'wallet' then
    perform deduct_wallet(p_customer_id, v_total);
    v_paid := v_total;
  elsif p_paid is not null and p_paid > 0 then
    v_paid := least(p_paid, v_total);
  end if;

  if p_payment_method is not null
     and p_payment_method <> ''
     and p_payment_method::text not in ('online', 'wallet') then
    raise exception 'invalid payment method: %', p_payment_method;
  end if;
  v_payment_method := coalesce(nullif(p_payment_method, ''), 'online')::payment_method_t;

  select display_name, phone, email into v_customer_name, v_customer_phone, v_customer_email
    from profiles where id = p_customer_id limit 1;

  -- fallback نام مشتری
  v_customer_display := coalesce(
    nullif(trim(v_customer_name), ''),
    nullif(v_customer_phone, ''),
    nullif(v_customer_email, ''),
    'مشتری'
  );

  v_tracking := 'HMY-' || upper(substr(md5(random()::text), 1, 10));

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

  insert into order_status_history (order_id, status, "date", actor_id, note)
  values (v_order_id, 'new', now(), p_customer_id, 'ثبت سفارش آنلاین');

  insert into order_items (order_id, name, price, quantity, total)
  values (v_order_id, v_service_name, v_unit_price, p_quantity, v_unit_price * p_quantity);

  insert into invoices (
    invoice_number, order_id, type, customer_name, customer_phone,
    subtotal, total, note, status
  ) values (
    'PAY-' || to_char(now(), 'YYYY-MM-DD') || '-' || replace(v_tracking, 'HMY-', ''),
    v_order_id, 'service',
    v_customer_display, v_customer_phone,
    v_total, v_total,
    'رسید پرداخت سفارش ' || v_tracking,
    (case when v_paid > 0 then 'paid' else 'issued' end)::invoice_status_t
  )
  returning id into v_invoice_id;

  if p_gateway_ref is not null and p_gateway_ref <> '' then
    update payments
    set order_id = v_order_id
    where payments.gateway_ref = p_gateway_ref and payments.order_id is null;
  end if;

  insert into invoice_items (invoice_id, name, quantity, unit, price)
  values (v_invoice_id, v_service_name, p_quantity, v_service_unit, v_unit_price);

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

  insert into audit_logs (actor_id, is_admin, action, details, module, ip)
  values (p_customer_id, false, 'ثبت سفارش آنلاین', 'سفارش ' || v_tracking || ' — ' || v_service_name || '، مبلغ ' || v_total || ' تومان، روش ' || p_payment_method, 'سفارشات', inet_client_addr());

  if v_customer_phone is not null and v_customer_phone <> '' then
    insert into sms_logs (phone, message, status)
    values (
      v_customer_phone,
      'سفارش «' || v_service_name || '» با کد ' || v_tracking || ' ثبت و پرداخت شد. مجموع: ' || v_total || ' تومان.',
      'pending'
    );
  end if;

  insert into notifications (user_id, type, title, message, link, priority, dedupe_key)
  values (p_customer_id, 'order', 'سفارش جدید', 'سفارش «' || v_service_name || '» با کد ' || v_tracking || ' ثبت شد.', '/orders', 'high', 'order-customer-' || v_order_id);

  for v_staff in select auth_uid from staff_accounts where active loop
    insert into notifications (user_id, type, title, message, link, priority, dedupe_key)
    values (
      v_staff.auth_uid, 'order', 'سفارش جدید',
      'سفارش «' || v_service_name || '» با کد ' || v_tracking || ' ثبت شد.',
      '/admin/orders',
      (case when p_urgent then 'urgent' else 'high' end),
      'order-staff-' || v_staff.auth_uid || '-' || v_order_id
    );
  end loop;

  order_id      := v_order_id;
  tracking_code := v_tracking;
  invoice_id    := v_invoice_id;
  return next;
  return;
end;
$$;

grant execute on function place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb)
  to authenticated, service_role;

revoke execute on function place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb)
  from public;
grant execute on function place_order(uuid, uuid, integer, boolean, bigint, bigint, text, text, jsonb, jsonb)
  to service_role;
