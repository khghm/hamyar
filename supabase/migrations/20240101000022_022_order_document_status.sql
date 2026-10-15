-- 022 — `set_order_document_status`: server-side write for the
-- `document_status` column.
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- `updateOrder` در `src/store.tsx` فقط `setOrders` را فراخوانی می‌کرد و هیچ
-- اتصالی به سرور نداشت. تنها استفادهٔ آن از پنل «سفارشات» بود (دکمه‌های
-- «تایید مدارک»/«رد مدارک» در `Orders.tsx`)، پس تغییرش پس از رفرش از بین
-- می‌رفت و در سرور هیچ‌وقت ثبت نمی‌شد.
--
-- ── راه‌حل ───────────────────────────────────────────────────────────────────
-- یک RPC `security definer` که فقط `document_status` را تغییر می‌دهد و
-- مالکیت سفارش را بررسی می‌کند. فقط کارمندان با دسترسی سفارشات (perm1/perm2)
-- می‌توانند این فیلد را تغییر دهند؛ مشتری نه.
-- =========================================================================

create or replace function set_order_document_status(
  p_order_id   uuid,
  p_status     text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid document status: %', p_status;
  end if;

  if not exists (select 1 from orders where id = p_order_id) then
    raise exception 'order not found';
  end if;

  -- Only staff with order-view or order-manage permission may touch this.
  -- service_role (Edge Functions) is allowed through.
  if auth.role() <> 'service_role' then
    select (has_permission('perm1') or has_permission('perm2')) into v_allowed;
    if not coalesce(v_allowed, false) then
      raise exception 'permission denied: cannot update document status';
    end if;
  end if;

  update orders
  set document_status = p_status, updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function set_order_document_status(uuid, text) from public;
grant execute on function set_order_document_status(uuid, text) to authenticated, service_role;

comment on function set_order_document_status(uuid, text) is
  'تغییر فیلد `document_status` سفارش (pending|approved|rejected) — فقط کارمندان با دسترسی سفارشات.';