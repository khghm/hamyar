-- ============================================================================
-- 036_order_payment_settlement.sql
--
-- ثبت «پرداخت واقعی» روی سفارش.
--
-- مشکل: در دادهٔ فعلی همهٔ سفارش‌ها `paid = 0` دارند. دو علت داشت:
--   1) مسیر پرداخت آنلاین در SPA هیچ‌وقت به درگاه/verify وصل نمی‌شد، پس
--      `payments` هیچ ردیف «پرداخت‌شده» نداشت و `orders.paid` صفر می‌ماند.
--   2) پول واقعی (کارت‌به‌کارت، POS، نقدی) هیچ‌جا در سیستم ثبت نمی‌شد، در حالی
--      که ادمین سفارش را تحویل می‌داد.
--
-- این تابع مسیر دوم را حل می‌کند: ادمین مبلغ دریافتی را ثبت می‌کند و به‌صورت
-- اتمیک `payments` + `orders.paid/remaining` + وضعیت فاکتور + لاگ فعالیت
-- به‌روزرسانی می‌شوند.
--
-- چرا payment_method = 'online'؟ enum فعلی فقط 'online' و 'wallet' را دارد و
-- افزودن مقدار جدید به enum در همان تراکنش ریسک دارد. ردیف پرداخت با
-- `gateway_ref = 'MANUAL-…'` علامت‌گذاری می‌شود تا از پرداخت درگاهی قابل تفکیک
-- باشد، بدون نیاز به تغییر نوع داده.
-- ============================================================================

create or replace function settle_order_payment(
  p_order_id uuid,
  p_amount   bigint default null,
  p_trace    text   default ''
)
returns table (
  out_order_id  uuid,
  out_paid      bigint,
  out_total     bigint,
  out_remaining bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order       orders%rowtype;
  v_amount      bigint;
  v_new_paid    bigint;
  v_staff_name  text;
begin
  -- SECURITY DEFINER یعنی RLS دور زده می‌شود؛ پس اجازه اینجا بررسی می‌شود.
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required' using errcode = '42501';
    end if;
    if not (has_permission('perm2') or has_permission('perm13') or has_permission('perm14')) then
      raise exception 'ثبت پرداخت برای این نقش مجاز نیست' using errcode = '42501';
    end if;
  end if;

  select * into v_order
  from orders
  where orders.id = p_order_id and orders.deleted_at is null
  for update;

  if not found then
    raise exception 'سفارش یافت نشد';
  end if;

  v_amount := coalesce(p_amount, v_order.total - v_order.paid);
  if v_amount is null or v_amount <= 0 then
    raise exception 'مبلغ پرداخت باید بزرگ‌تر از صفر باشد';
  end if;

  -- ردیف پرداخت: قابل ردیابی و قابل تفکیک از پرداخت درگاهی.
  insert into payments (user_id, order_id, amount, payment_method, gateway_ref, status, paid_at)
  values (
    v_order.customer_id,
    v_order.id,
    v_amount,
    'online'::payment_method_t,
    'MANUAL-' || replace(gen_random_uuid()::text, '-', ''),
    'paid'::payment_status_t,
    now()
  );

  update orders
  set paid = least(orders.total, orders.paid + v_amount),
      remaining = greatest(0, orders.total - least(orders.total, orders.paid + v_amount)),
      updated_at = now()
  where orders.id = v_order.id
  returning orders.paid into v_new_paid;

  update invoices
  set status = 'paid'::invoice_status_t,
      updated_at = now()
  where invoices.order_id = v_order.id
    and invoices.status is distinct from 'paid'::invoice_status_t;

  select sa.display_name into v_staff_name
  from staff_accounts sa
  where sa.auth_uid = auth.uid()
  limit 1;

  insert into audit_logs (actor, actor_id, is_admin, action, details, module)
  values (
    coalesce(v_staff_name, 'سیستم'),
    auth.uid(),
    auth.role() = 'service_role' or v_staff_name is not null,
    'ثبت پرداخت سفارش',
    format(
      'سفارش %s — مبلغ %s تومان%s',
      coalesce(v_order.tracking_code, v_order.id::text),
      v_amount,
      case when coalesce(p_trace, '') <> '' then ' — ' || p_trace else '' end
    ),
    'سفارشات'
  );

  return query
  select v_order.id,
         v_new_paid,
         v_order.total,
         greatest(0, v_order.total - v_new_paid);
end;
$$;

revoke all on function settle_order_payment(uuid, bigint, text) from public;
-- Supabase به‌صورت پیش‌فرض EXECUTE را به anon هم می‌دهد؛ این تابع پول را جابه‌جا
-- می‌کند، پس دسترسی ناشناس باید صریحاً گرفته شود (بدنه هم auth.uid() را چک
-- می‌کند، ولی لایهٔ دوم لازم است).
revoke execute on function settle_order_payment(uuid, bigint, text) from anon;
grant execute on function settle_order_payment(uuid, bigint, text) to authenticated, service_role;
