-- ============================================================================
-- 00000000000001_customer_insert_own_profile.sql
--
-- Client-side safety-net policy for profile creation.
--
-- The server-side trigger `on_auth_user_created` is the primary path that
-- creates a `profiles` row for every new customer. However, the client-side
-- fallback in `authStore.ts` (the `if (!profile)` branch) also inserts a row
-- when the trigger did not fire for any reason (edge case, race, disabled
-- trigger). For that INSERT to succeed under RLS, an authenticated customer
-- needs an INSERT policy scoped to their own row.
--
-- Scope is deliberately narrow: `with check (id = auth.uid())` — the caller
-- can only insert a row whose `id` equals their own auth UID. They cannot
-- insert rows for other users, and they cannot set `wallet_balance`,
-- `loyalty_points` or `level` for anyone else because those columns are
-- server-authoritative (see migration 017_profile_column_ownership).
--
-- Idempotent: PostgreSQL's `CREATE POLICY` does not support `IF NOT EXISTS`,
-- so the policy is created inside a plpgsql block that checks pg_policy first.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'customers can insert their own profile'
  ) then
    execute $pol$
      create policy "customers can insert their own profile"
        on public.profiles for insert
        with check (auth.uid() = id)
    $pol$;
  end if;
end;
$$;