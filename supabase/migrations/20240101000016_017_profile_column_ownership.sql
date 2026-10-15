-- 017 — مالکیت ستون‌های سروری در `profiles` + اصلاح گارد کیف پول
--
-- ── مسئلهٔ ۱: مشتری می‌تواند برای خودش پول چاپ کند ───────────────────────────
-- policy مربوطه «سطر» را محدود می‌کند، نه «ستون» را:
--
--   create policy "customer_update_own_profile" on profiles
--     for update using (id = auth.uid()) with check (id = auth.uid());
--
-- RLS در Postgres قابلیت محدودکردن ستون ندارد، پس مشتری می‌توانست اجرا کند:
--
--   update profiles set wallet_balance = 999999999 where id = auth.uid();
--
-- و همین‌طور `loyalty_points` و `total_earned_points` و `level` را دستکاری کند.
-- این ریسک در `src/test/rls-coverage.test.ts` هم ثبت شده بود
-- («گزارش‌شده، نه حل‌شده») و تا وقتی راه‌حلی نبود باز نگه داشته شده بود.
--
-- راه‌حل در RLS نیست، در یک تریگر `before update` است: ستون‌هایی که سرور
-- مالکشان است جدا می‌شوند و هر تغییری روی آن‌ها یا از مسیر یک تابع
-- `security definer` باشد، یا کارمندی که مجوز صریح دارد.
--
-- ── مسئلهٔ ۲: گارد کیف پول مجوز اشتباه داشت ──────────────────────────────────
-- `deduct_wallet` و `refund_wallet` اجازهٔ دستکاری کیف پولِ کاربر *دیگر* را به
-- `perm32` می‌دادند — ولی `perm32` «مشاهده لاگ فعالیت» است، نه مدیریت پول.
-- یعنی هر کارمندی که فقط اجازهٔ دیدن لاگ را داشت می‌توانست موجودی کیف پول
-- هر مشتری را کم یا زیاد کند. مجوز درست `perm39` («مدیریت کیف پول») است.
--
-- `perm32` جای درست خودش را حفظ می‌کند: خواندن `audit_logs` و
-- `wallet_transactions` و مدارک سفارش، که همگی لاگ هستند.

-- =========================================================================
-- ۱. تریگر مالکیت ستون‌های سروری
-- =========================================================================
create or replace function enforce_profile_server_columns()
returns trigger
language plpgsql
as $$
begin
  -- RLS سطر را می‌بیند ولی ستون‌ها را نه، پس محافظت باید این‌جا باشد.
  --
  -- تفکیک مسیرها با `current_user` انجام می‌شود، نه `auth.role()`:
  --   * `current_user = 'authenticated'` → این UPDATE مستقیم از مرورگر است.
  --   * داخل یک تابع `security definer`، `current_user` برابر مالک تابع
  --     (`postgres`) می‌شود، پس نوشتن‌های قانونیِ خودمان (کسر کیف پول،
  --     امتیاز وفاداری، پاداش معرفی) بدون نیاز به پرچم اضافه عبور می‌کنند.
  --     به همین دلیل لازم نیست هر RPC جداگانه دستکاری شود.
  if current_user = 'authenticated' then
    if new.wallet_balance is distinct from old.wallet_balance
       or new.loyalty_points is distinct from old.loyalty_points
       or new.total_earned_points is distinct from old.total_earned_points
       or new.level is distinct from old.level
       or new.login_streak is distinct from old.login_streak
       or new.invited_by is distinct from old.invited_by
       or new.referral_bonus_applied_at is distinct from old.referral_bonus_applied_at
       or new.last_login_streak_date is distinct from old.last_login_streak_date
       or new.last_profile_bonus_date is distinct from old.last_profile_bonus_date
       or new.last_birthday_bonus_date is distinct from old.last_birthday_bonus_date
    then
      -- مدیریت صریح: کیف پول با `perm39`، باشگاه مشتریان با `perm43`.
      if has_permission('perm39') or has_permission('perm43') then
        return new;
      end if;
      raise exception 'permission denied: % , wallet balance, loyalty points and level are server-owned and can only be changed through the app''s own flows',
        (select coalesce(new.display_name, 'this profile'));
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_server_columns on profiles;
create trigger trg_profiles_server_columns
  before update on profiles
  for each row
  execute function enforce_profile_server_columns();

-- =========================================================================
-- ۲. گارد کیف پول: `perm32` → `perm39`
-- =========================================================================
--
-- بدنهٔ هر دو تابع با نسخهٔ ۰۰۵ یکسان است به‌جز شمارهٔ مجوز در گاردِ
-- «دستکاری کیف پولِ کاربر دیگر»، و `refund_wallet` علاوه بر آن سطر
-- `wallet_transactions` را درج می‌کند که به تریگر `wallet_txn_trigger` سپرده
-- شده است.
create or replace function deduct_wallet(p_user_id uuid, p_amount bigint)
returns bigint   -- returns new balance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after  bigint;
begin
  -- `perm39` («مدیریت کیف پول») و نه `perm32` («مشاهده لاگ فعالیت»):
  -- مجوزِ دیدن لاگ نباید اجازهٔ جابه‌جایی پولِ کس دیگر را بدهد.
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm39') then
      raise exception 'permission denied: cannot debit another user''s wallet';
    end if;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid deduction amount: %', p_amount;
  end if;

  -- قفل سطری: بدون آن دو سفارش همزمان هر دو موجودی یکسان را می‌خوانند و هر دو
  -- کسر می‌کنند، و `greatest(0, …)` در تریگر مابه‌التفاوت را بی‌صدا دور می‌ریزد.
  select coalesce(wallet_balance, 0) into v_before
  from profiles where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  if v_before < p_amount then
    raise exception 'insufficient wallet balance: have %, need %', v_before, p_amount;
  end if;

  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, -p_amount, 'order_payment', p_user_id::text)
  returning balance_after into v_after;

  return v_after;
end;
$$;

create or replace function refund_wallet(p_user_id uuid, p_amount bigint, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after  bigint;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null then
      raise exception 'permission denied: authentication required';
    end if;
    if auth.uid() is distinct from p_user_id and not has_permission('perm39') then
      raise exception 'permission denied: cannot credit another user''s wallet';
    end if;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid refund amount: %', p_amount;
  end if;

  select coalesce(wallet_balance, 0) into v_before
  from profiles where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  -- `type` مقدار ثابتِ دستهٔ تراکنش است و `p_reason` فقط توضیح است. جابه‌جا
  -- گرفتن این دو، درخواست را به قید
  -- `wallet_transactions_type_check` می‌سپارد — چون مقادیر مجاز فقط
  -- order_payment / deposit / withdrawal / refund / bonus / loyalty_redeem هستند.
  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, p_amount, 'refund', coalesce(p_reason, ''))
  returning balance_after into v_after;

  return v_after;
end;
$$;

comment on function enforce_profile_server_columns() is
  'RLS فقط سطر را محدود می‌کند نه ستون را؛ این تریگر اجازه نمی‌دهد مشتری wallet_balance یا loyalty_points خودش را بنویسد.';
comment on function deduct_wallet(uuid, bigint) is
  'پیش از ۰۱۷ گاردِ کاربر دیگر با perm32 («مشاهده لاگ») بود؛ perm39 («مدیریت کیف پول») درست است.';