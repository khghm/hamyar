-- ---------------------------------------------------------------------------
-- 007_grants.sql — table privileges
--
-- Migrations 001-006 create RLS policies but never GRANT table privileges.
-- A hosted Supabase project hides this because the platform applies its own
-- default privileges; on a self-hosted/plain Postgres every query fails with
-- "permission denied for table ...". Making the grants explicit keeps the
-- schema self-contained and reviewable.
--
-- Model: RLS is the only row-level gate, exactly like Supabase's default.
--   anon           → SELECT on the public catalogue only
--   authenticated  → full table privileges; RLS decides which rows
--   service_role   → full (Edge Functions bypass RLS)
--
-- Any table that ends up WITHOUT RLS would therefore be world-readable under a
-- blanket grant, so the two such tables are closed explicitly below.
-- ---------------------------------------------------------------------------

-- === Safety net: deny-by-default on tables that have no RLS ================
-- `_meta` is internal bookkeeping and `expense_categories` is a lookup table
-- with no policy. Both are closed before the blanket grants go out.
alter table _meta enable row level security;

alter table expense_categories enable row level security;

drop policy if exists "expense_categories_read" on expense_categories;
create policy "expense_categories_read" on expense_categories
  for select to authenticated
  using (has_permission('perm2') or is_staff());

-- === Schema usage =========================================================
grant usage on schema public to anon, authenticated, service_role;

-- === anon: the public catalogue ===========================================
-- Only rows that are publicly visible. `active = true` filtering is done by
-- the policies created in migration 004.
grant select on
  products, media_items, services, project_services,
  news, faqs, portfolio,
  about_content, site_settings, gamification_settings
  to anon;

-- === authenticated: full privileges, RLS decides the rows ================
-- The client writes through most collections, so DML is required; the RLS
-- policies in migrations 004-006 are what actually restrict access.
--
-- `profiles` is the one exception. RLS restricts *which row* a customer may
-- touch (`id = auth.uid()`) but not *which columns*, and the client update path
-- is a plain PostgREST update — so a blanket table-level UPDATE would hand every
-- customer `wallet_balance`, `loyalty_points`, `level` and `invite_code` on
-- their own row. Migration 006 revoked table-level UPDATE and re-granted only
-- the customer-owned columns; the grant above would silently undo that, so it
-- is re-asserted below. Keep these two blocks in the same migration order.
grant select, insert, update, delete on all tables in schema public
  to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Re-assert the column scoping that the blanket grant above just re-opened.
-- This ordering is load-bearing: any future blanket UPDATE grant must be
-- followed by these two statements again.
revoke update on profiles from anon, authenticated;
grant update (display_name, phone, birth_date, invited_by) on profiles to authenticated;

-- Internal bookkeeping stays unreachable even though the grant above is a
-- blanket one — RLS on `_meta` has no policy, so it denies everyone.
revoke all on _meta from anon, authenticated;

-- === service_role: Edge Functions =========================================
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;