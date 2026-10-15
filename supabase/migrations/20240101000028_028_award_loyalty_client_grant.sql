-- 028 — grant `award_loyalty_client` to authenticated callers
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- `award_loyalty_client` (migration 024) only granted EXECUTE to `service_role`,
-- so the admin panel had to route every manual loyalty award through the
-- `award-loyalty` Edge Function. That function checked `has_permission('perm32')`
-- using the service_role client, where `auth.uid()` is null — so the check was
-- always false and the endpoint returned 403 for every caller.
--
-- ── راه‌حل ────────────────────────────────────────────────────────────────────
-- The wrapper already enforces `is_staff()` for non-service_role callers and
-- takes the actor from `auth.uid()`, so granting it to `authenticated` is safe
-- and removes the broken Edge Function from the path. Staff can call it
-- directly; non-staff get a permission-denied exception from inside the RPC.
-- =========================================================================

revoke all on function award_loyalty_client(uuid, integer, text, loyalty_category_t) from public;
grant execute on function award_loyalty_client(uuid, integer, text, loyalty_category_t) to authenticated, service_role;
