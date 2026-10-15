-- ============================================================================
-- 00000000000000_backfill_missing_profiles.sql
--
-- Customer backfill: every auth.users row that does NOT yet have a matching
-- profiles row gets one created so the admin CRM panel can see it.
--
-- Excludes staff (staff_accounts rows are created by a separate RPC/Edge
-- Function and intentionally bypass the trigger).
--
-- NOTE: `invited_count` is NOT a column on `profiles` in this schema; it is
-- tracked in the client-side User model only. The server-side trigger and
-- this backfill therefore omit it. Columns written here are exactly those
-- that exist on public.profiles.
-- ============================================================================

insert into public.profiles (
  id,
  display_name,
  phone,
  email,
  level,
  loyalty_points,
  total_earned_points,
  wallet_balance,
  invite_code,
  created_at
)
select
  au.id,
  coalesce(
    nullif(au.raw_user_meta_data ->> 'display_name', ''),
    nullif(au.raw_user_meta_data ->> 'full_name', ''),
    split_part(au.email, '@', 1)
  ) as display_name,
  case
    when au.raw_user_meta_data ->> 'phone' ~ '^09[0-9]{9}$'
      then au.raw_user_meta_data ->> 'phone'
    else null
  end as phone,
  lower(nullif(trim(coalesce(au.email, '')), '')) as email,
  'normal' as level,
  0 as loyalty_points,
  0 as total_earned_points,
  0 as wallet_balance,
  coalesce(
    nullif(au.raw_user_meta_data ->> 'invite_code', ''),
    public.generate_invite_code()
  ) as invite_code,
  coalesce(au.created_at, now()) as created_at
from auth.users au
where not exists (
  select 1 from public.profiles p where p.id = au.id
)
and not exists (
  select 1 from public.staff_accounts sa where sa.auth_uid = au.id
)
on conflict (id) do nothing;