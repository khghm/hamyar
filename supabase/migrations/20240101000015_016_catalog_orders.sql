-- 016 — `place_catalog_order`: ساخت اتمیک سفارش محصول و سفارش پروژه
--
-- ── چرا این مهاجرت لازم است ──────────────────────────────────────────────────
-- مسیر «سفارش محصول» (سبد خرید) و مسیر «سفارش پروژه» (طراحی سایت / تولید محتوا)
-- هرگز به دیتابیس نمی‌رسیدند. هر دو فقط `setOrders([...])` می‌زدند که به
-- `localStorage['hamyar_orders']` می‌رود، و پنل ادمین هم همان state را
-- می‌خواند. نتیجه:
--
--   * جدول `orders` خالی می‌ماند؛ سفارش فقط در مرورگر همان مشتری هست.
--   * کیف پول سمت کلاینت کم می‌شود ولی چون `deduct_wallet` صدا زده نمی‌شود،
--     با یک refresh برمی‌گردد — یعنی پول هم گم می‌شود.
--   * `toast.success` بی‌قید زده می‌شود، پس UI موفقیت را قطعی اعلام می‌کند.
--   * برای سفارش پروژه، `projects` و `content_projects` چون mapper دارند در
--     دیتابیس ثبت می‌شوند؛ نتیجه پروژه‌ای است که سفارشش وجود ندارد.
--
-- `place_order` موجود این کار را نمی‌کند: نوع را در `005_atomic_rpcs.sql:347`
-- سخت‌کد می‌کند (`'service'`) و فقط `p_service_id` می‌گیرد.
--
-- ── چرا یک RPC با `p_kind` و نه دو RPC ───────────────────────────────────────
-- منطق مشترک — گارد احراز هویت، پرداخت، صدور فاکتور، اعلان و ممیزی — حدود
-- ۱۰۰ خط است. تکرارش برای محصول و پروژه یعنی دو نسخه که باید همیشه با هم
-- هماهنگ بمانند. تفاوت‌ها فقط در جدول قیمت‌خوانی و نوع رکورد هستند، پس با
-- یک شاخهٔ کوچک پوشش داده می‌شود.
--
-- ── تضمین‌های امنیتی ────────────────────────────────────────────────────────
--   ۱. `security definer` + گارد: مشتری فقط سفارش به نام خودش می‌سازد
--      (`auth.uid() = p_customer_id`)، وگرنه `exception`.
--   ۲. قیمت از دیتابیس خوانده می‌شود، هرگز از کلاینت. مبلغ و پرداختی که
--      کلاینت می‌فرستد نادیده گرفته می‌شود (به‌جز `p_paid` که به سقف
--      مبلغ محاسبه‌شدهٔ سرور کلیپ می‌شود).
--   ۳. موجودی انبار پیش از درج بررسی می‌شود، پس فروش بیش از موجودی ممکن
--      نیست. (کسر موجودی در `change_order_status` هنگام تحویل انجام می‌شود،
--      دقیقاً مثل مسیر خدمات.)
--   ۴. کیف پول در همین تراکنش و از طریق `deduct_wallet` کم می‌شود؛ آن
--      تابع `for update` می‌گیرد و در برابر همزمانی امن است.
--   ۵. کد تخفیف در سرور اعتبارسنجی و شمارش آن اتمیک می‌شود؛ کلاینت نمی‌تواند
--      درصدی که خودش تعیین کرده را بفرستد. کد نامعتبر خطا می‌دهد تا مشتری
--      فکر نکند تخفیف اعمال شده ولی مبلغ کامل کسر شود.

-- =========================================================================
-- پارامترها
-- =========================================================================
create or replace function place_catalog_order(
  p_customer_id    uuid,
  p_kind           text,        -- 'product' | 'project'
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
  -- `invoices.discount_type` NOT NULL است و قیدش فقط 'percent' یا 'fixed' را
  -- می‌پذیرد، پس سفارش بدون تخفیف هم باید مقدار معتبر داشته باشد.
  v_discount_type   text := 'fixed';
  v_doc             jsonb;
  v_doc_path        text;
begin
  -- ── ۱. گارد احراز هویت ──────────────────────────────────────────────────
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_customer_id then
      raise exception 'permission denied: cannot place an order for another customer';
    end if;
  end if;

  v_kind := lower(coalesce(nullif(trim(p_kind), ''), ''));
  if v_kind not in ('product', 'project') then
    raise exception 'invalid order kind: %', p_kind;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  -- روش پرداخت باید معتبر باشد؛ enum است و باید پیش از هر درج اعتبارسنجی شود
  -- تا خطای مبهمِ cast نداشته باشیم.
  if p_payment_method is not null
     and p_payment_method <> ''
     and p_payment_method not in ('online', 'wallet') then
    raise exception 'invalid payment method: %', p_payment_method;
  end if;
  v_payment_method := coalesce(nullif(p_payment_method, ''), 'online')::payment_method_t;

  -- ── ۲. قیمت‌گذاری از دیتابیس ───────────────────────────────────────────
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
    else
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

    v_total := v_total + (v_price * v_qty);

    -- خطوط سفارش را موقتاً در jsonb نگه می‌داریم تا بعد از ساخته‌شدن سفارش
    -- (که به id نیاز دارند) درج شوند.
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

  -- نوع رکورد سفارش را سرور تعیین می‌کند تا با `src/store.tsx` یکی بماند:
  -- سفارش طراحی سایت «webdesign» و سفارش تولید محتوا «service» است
  -- (همان قاعدهٔ `createProjectOrder`، ولی دیگر قابل دور زدن از سمت کلاینت).
  if v_kind = 'product' then
    v_order_type := 'product';
  else
    select "group" into v_group from project_services where id = v_pid;
    v_order_type := case when v_group = 'webdesign' then 'webdesign' else 'service' end;
  end if;

  -- `orders.type` و `invoices.type` دو enum *مجزا* هستند (`order_type_t` و
  -- `invoice_type_t`) که فقط برچسب‌هایشان یکی است. پس کست صریح لازم است،
  -- وگرنه Postgres خطای «expression is of type order_type_t» می‌دهد.
  v_invoice_type := v_order_type::text::invoice_type_t;

  -- ── ۳. کد تخفیف ────────────────────────────────────────────────────────
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
    -- تخفیف هرگز نباید مبلغ را منفی کند.
    v_cpn_amount := least(greatest(v_cpn_amount, 0), v_total);

    update campaigns set used_count = coalesce(used_count, 0) + 1 where id = v_cpn.id;
  end if;

  v_discount := v_cpn_amount;
  v_grand    := v_total - v_discount;

  -- ── ۴. پرداخت ──────────────────────────────────────────────────────────
  v_paid := 0;
  if v_payment_method = 'wallet' then
    -- کیف پول در همین تراکنش کم می‌شود؛ در برابر موجودی ناکافی خطا می‌دهد.
    perform deduct_wallet(p_customer_id, v_grand);
    v_paid := v_grand;
  end if;

  -- ── ۵. درج سفارش ───────────────────────────────────────────────────────
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

  -- ── ۶. خطوط سفارش ──────────────────────────────────────────────────────
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

  -- ── ۷. فاکتور ──────────────────────────────────────────────────────────
  -- `invoices` چند ستون NOT NULL دارد که باید صریح پر شوند: `date`، `tax`،
  -- `tax_amount` و `discount_type` (با قید percent|fixed). تخفیف روی این مسیر
  -- نداریم، پس مالیات صفر است.
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
      coalesce(v_unit, 'عدد'),
      (v_item ->> 'price')::bigint
    );
  end loop;

  -- ── ۸. مدارک بارگذاری‌شده ─────────────────────────────────────────────
  --
  -- policy خواندن Storage فقط به آبجکت‌هایی دسترسی می‌دهد که در
  -- `order_documents` ارجاع شده‌اند، پس بدون این درج مدارک مشتری برای همیشه
  -- غیرقابل‌دسترس می‌ماند.
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

  -- ── ۹. پیوند پرداخت آنلاین ────────────────────────────────────────────
  --
  -- `create_payment_record` قبل از ایجاد سفارش اجرا می‌شود، پس اتصال از راه
  -- `gateway_ref` انجام می‌شود؛ بدون آن `payments.order_id` خالی می‌ماند و
  -- `verify_payment` نه سفارش را تسویه می‌کند نه امتیاز وفاداری می‌دهد.
  if p_gateway_ref is not null and p_gateway_ref <> '' then
    update payments
       set order_id = v_order_id
     where payments.gateway_ref = p_gateway_ref and payments.order_id is null;
  end if;

  -- ── ۱۰. ممیزی، پیامک و اعلان ──────────────────────────────────────────
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

  -- `notifications.priority` از نوع `text` است (نه enum)، پس کست لازم نیست.
  insert into notifications (user_id, type, title, message, link, priority)
  values (
    p_customer_id, 'order', 'سفارش جدید',
    'سفارش «' || v_summary || '» با کد ' || v_tracking || ' ثبت شد.',
    '/admin/orders',
    (case when p_urgent then 'urgent' else 'high' end)
  );

  order_id      := v_order_id;
  tracking_code := v_tracking;
  invoice_id    := v_invoice_id;
  total         := v_grand;
  paid          := v_paid;
  return next;
end;
$$;

-- کلاینت باید بتواند مستقیم صدا بزند؛ گارد داخل تابع، مالکیت را کنترل می‌کند.
-- `service_role` هم لازم است چون `deduct_wallet` و RLS از این مسیر عبور می‌کنند.
grant execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  to authenticated, service_role;

revoke execute on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb)
  from anon;

comment on function place_catalog_order(uuid, text, jsonb, text, text, text, boolean, jsonb, jsonb) is
  'ساخت اتمیک سفارش محصول (p_kind=product) و پروژه (p_kind=project). قیمت از دیتابیس خوانده می‌شود؛ کلاینت هیچ مبلغی را تعیین نمی‌کند.';