-- 025 — `award_self_loyalty`: customer-facing loyalty awards
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- `award_loyalty` (migration 005) only accepts `service_role` or `is_staff()`,
-- which is correct for the money-mutating admin path but wrong for the passive
-- customer rewards: review bonus, profile-completion bonus, birthday bonus,
-- login-streak bonus and the invitee half of a referral. Those are awarded from
-- `src/store.tsx` (`awardLoyaltyPoints`) by editing local state only, so every
-- reload reverted them and the `loyalty_transactions` table stayed empty.
--
-- ── راه‌حل ───────────────────────────────────────────────────────────────────
-- یک تابع `security definer` که فقط به کاربر خودش اجازه می‌دهد امتیاز بگیرد و
-- فقط در دسته‌های غیرمالی (review, profile, birthday, login_streak, invite).
-- مسیر مالی (purchase) همچنان از طریق `change_order_status` /
-- `verify_payment` / `award_loyalty` (service_role) انجام می‌شود.
-- =========================================================================

create or replace function award_self_loyalty(
  p_points   integer,
  p_reason   text,
  p_category loyalty_category_t
)
returns table (points integer, new_total bigint, new_level text, txn_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'permission denied: authentication required';
  end if;

  if p_category not in ('review', 'profile', 'birthday', 'login_streak', 'invite') then
    raise exception 'category % is not eligible for self-award', p_category;
  end if;

  if p_points <= 0 then
    raise exception 'points must be positive';
  end if;

  return query
  select * from award_loyalty(v_user_id, p_points, p_reason, p_category, v_user_id);
end;
$$;

revoke all on function award_self_loyalty(integer, text, loyalty_category_t) from public;
grant execute on function award_self_loyalty(integer, text, loyalty_category_t) to authenticated, service_role;

comment on function award_self_loyalty(integer, text, loyalty_category_t) is
  ' امتیازدهی خودکارِ مشتری (review|profile|birthday|login_streak|invite). فقط کاربر خودش و فقط در این دسته‌ها.';