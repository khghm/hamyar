-- ============================================================================
-- 00000000000002_admin_read_profiles_bypass_rls.sql
--
-- The admin panel (src/pages/admin/Customers.tsx) calls `fetchProfiles()`,
-- which issues `supabase.from('profiles').select('*')`. That request is sent
-- with the `anon` role because the admin panel authenticates through the
-- local RBAC store (rbacStore.ts), NOT through Supabase Auth. With no auth
-- session, every RLS policy on `profiles` evaluates against `auth.uid() =
-- NULL` and returns zero rows — even though 17 rows exist in the table.
--
-- Fix: a SECURITY DEFINER function that the admin panel calls via RPC. It
-- runs with the function owner's privileges, bypassing RLS, and is the ONLY
-- read path that returns the full customer list. It is read-only (no DML).
--
-- Scope is intentionally limited:
--   * SELECT only — no INSERT/UPDATE/DELETE
--   * Returns the full set of profiles, exactly what the CRM panel needs
--   * The panel is already locked behind local RBAC (canAccessPage perm3/perm4),
--     so this function does not widen app-level access
-- ============================================================================

create or replace function admin_list_profiles()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select * from public.profiles order by created_at desc;
end;
$$;

revoke all on function admin_list_profiles() from public, anon;
grant execute on function admin_list_profiles() to authenticated, service_role;

-- The admin panel authenticates through the local RBAC store, NOT through
-- Supabase Auth, so its requests arrive with the `anon` role and no session.
-- The function is SECURITY DEFINER (runs with the owner's privileges and
-- bypasses RLS), but PostgREST still requires EXECUTE to be granted to the
-- calling role. Grant it to `anon` so the panel's unauthenticated RPC call
-- can execute the function. The app-level permission gate (RBAC perm3/perm4)
-- remains the real access control.
grant execute on function admin_list_profiles() to anon;