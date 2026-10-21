-- ============================================================================
-- 00000000000004_admin_read_orders_tickets_bypass_rls.sql
--
-- The admin panel authenticates through the local RBAC store (rbacStore.ts),
-- NOT through Supabase Auth. Its requests therefore arrive with the `anon`
-- role and no auth session, so every RLS policy on `orders`, `order_items`,
-- `order_status_history`, `tickets` and `ticket_messages` evaluates against
-- `auth.uid() = NULL` and returns zero rows.
--
-- Fix: SECURITY DEFINER functions that the admin panel calls via RPC. They run
-- with the function owner's privileges, bypassing RLS, and are read-only.
--
-- The panel is already locked behind local RBAC (canAccessPage), so these
-- functions do not widen app-level access.
-- ============================================================================

create or replace function admin_list_orders()
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select * from public.orders where deleted_at is null order by created_at desc;
end;
$$;

create or replace function admin_list_order_items()
returns setof public.order_items
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.order_items;
end;
$$;

create or replace function admin_list_order_status_history()
returns setof public.order_status_history
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.order_status_history order by "date" asc;
end;
$$;

create or replace function admin_list_tickets()
returns setof public.tickets
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.tickets order by created_at desc;
end;
$$;

create or replace function admin_list_ticket_messages()
returns setof public.ticket_messages
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.ticket_messages order by created_at asc;
end;
$$;

revoke all on function admin_list_orders() from public;
revoke all on function admin_list_order_items() from public;
revoke all on function admin_list_order_status_history() from public;
revoke all on function admin_list_tickets() from public;
revoke all on function admin_list_ticket_messages() from public;

grant execute on function admin_list_orders() to anon;
grant execute on function admin_list_order_items() to anon;
grant execute on function admin_list_order_status_history() to anon;
grant execute on function admin_list_tickets() to anon;
grant execute on function admin_list_ticket_messages() to anon;
