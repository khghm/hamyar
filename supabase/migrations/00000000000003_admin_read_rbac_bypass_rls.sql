-- ============================================================================
-- 00000000000003_admin_read_rbac_bypass_rls.sql
--
-- The admin panel's RBAC store (rbacStore.ts) hydrates from three tables:
--   * permissions
--   * roles
--   * staff_accounts
--
-- All three are RLS-gated on `auth.uid()` / `is_staff()` / `has_permission()`.
-- Because the admin panel authenticates through the local RBAC store and NOT
-- through Supabase Auth, these reads arrive with the `anon` role and no auth
-- session, so every policy evaluates to false and the store falls back to its
-- DEFAULT_* seed data — which does NOT include the real staff accounts.
-- The result: an admin created in the database cannot log in.
--
-- Fix: SECURITY DEFINER read functions (same pattern as
-- admin_list_profiles) that bypass RLS. They are SELECT-only and the panel is
-- already locked behind local RBAC.
-- ============================================================================

create or replace function admin_list_permissions()
returns setof public.permissions
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.permissions order by id;
end;
$$;

create or replace function admin_list_roles()
returns setof public.roles
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.roles order by created_at;
end;
$$;

create or replace function admin_list_staff_accounts()
returns setof public.staff_accounts
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.staff_accounts order by created_at;
end;
$$;

-- Allow the anon role (used by the admin panel) to execute these functions.
grant execute on function admin_list_permissions() to anon;
grant execute on function admin_list_roles() to anon;
grant execute on function admin_list_staff_accounts() to anon;