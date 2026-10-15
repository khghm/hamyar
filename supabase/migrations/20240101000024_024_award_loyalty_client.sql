-- 024 — `award_loyalty_client`: client-facing wrapper for the loyalty RPC
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- `awardLoyaltyPoints` در `src/store.tsx` فقط `setUsers` محلی را فراخوانی می‌کرد و
-- هیچ تراکنشی در سرور ثبت نمی‌کرد. نتیجه: امتیازهای خرید، ثبت نظر، پاداش
-- تولد و پاداش تکمیل پروفایل پس از رفرش از بین می‌رفتند. تنها مسیر سروریِ
-- امتیاز، `change_order_status` و `verify_payment` بودند که مستقیماً به
-- `award_loyalty` RPC فراخوانی می‌کردند.
--
-- ── راه‌حل ───────────────────────────────────────────────────────────────────
-- یک wrapper که `award_loyalty` را با `auth.uid()` به عنوان actor فراخوانی می‌کند.
-- خودِ `award_loyalty` قبلاً `security definer` است و فقط `service_role` یا
-- `is_staff()` را قبول می‌کند، پس این wrapper باید از طریق یک Edge Function
-- (مثلاً `award-loyalty`) اجرا شود تا service_role در سرور باقی بماند.
--
-- این مهاجرت فقط تابع را تعریف می‌کند؛ فراخوانی آن از طرف `store.tsx` جدید است.
-- =========================================================================

create or replace function award_loyalty_client(
  p_user_id  uuid,
  p_points   integer,
  p_reason   text,
  p_category loyalty_category_t
)
returns table (points integer, new_total bigint, new_level text, txn_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only staff may award loyalty through this path. The Edge Function
  -- (`award-loyalty`) additionally enforces `perm32` before calling here, so
  -- the grant below stays narrow.
  if auth.role() <> 'service_role' and not is_staff() then
    raise exception 'permission denied: must be staff to award loyalty';
  end if;

  return query
  select * from award_loyalty(p_user_id, p_points, p_reason, p_category, auth.uid());
end;
$$;

revoke all on function award_loyalty_client(uuid, integer, text, loyalty_category_t) from public;
grant execute on function award_loyalty_client(uuid, integer, text, loyalty_category_t) to service_role;

comment on function award_loyalty_client(uuid, integer, text, loyalty_category_t) is
  ' Wrapper برای `award_loyalty` که actor را از `auth.uid()` می‌گیرد. فقط از طریق Edge Function فراخوانی شود.';