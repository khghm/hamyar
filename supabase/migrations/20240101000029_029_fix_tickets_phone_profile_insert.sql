-- ============================================================================
-- 029_fix_tickets_phone_profile_insert.sql
--
-- اصلاحات تجمیعی برای ایرادات شناسایی‌شده در مهاجرت‌های ۰۲۰ تا ۰۲۶.
--
--   ۱. جدول `ticket_messages` ستون `updated_at` نداشت ولی تریگر
--      `trg_ticket_messages_updated` از تابع `_set_updated_at()` استفاده می‌کرد
--      ⇒ هر UPDATE روی پیام تیکت خطا می‌داد.
--   ۲. مهاجرت ۰۲۶ با `drop constraint ... cascade` هر دو قید `profiles_phone_check`
--      و `profiles_phone_key` (unique) را حذف کرد ولی فقط قید check را باز ساخت ⇒
--      یکتایی تلفن از دست رفت و دو پروفایل می‌توانستند شماره یکسان داشته باشند.
--   ۳. مهاجرت `00000000000001` یک policy INSERT روی `profiles` اضافه کرد در حالی
--      که مهاجرت ۰۱۳ به‌صراحت توضیح داده چرا نباید چنین policy‌ای باشد (مشتری
--      می‌توانست با INSERT اولیه `wallet_balance` دلخواه بنویسد). تریگر ۰۱۷ فقط
--      روی UPDATE بود و INSERT را پوشش نمی‌داد ⇒ آسیب‌پذیری چاپ پول.
-- ============================================================================

-- ── ۱. افزودن ستون updated_at به ticket_messages ──────────────────────────────
-- تریگر `trg_ticket_messages_updated` به این ستون نیاز دارد؛ بدون آن هر UPDATE
-- خطا می‌دهد.
alter table ticket_messages
  add column if not exists updated_at timestamptz not null default now();

-- ── ۲. بازگرداندن یکتایی profiles.phone ──────────────────────────────────────
-- از مهاجرت ۰۲۶ به بعد phone nullable است. Postgres در unique index چند مقدار
-- NULL را مجاز می‌داند، پس این قید فقط روی شماره‌های واقعی یکتایی اعمال می‌کند.
-- PostgreSQL از `ADD CONSTRAINT IF NOT EXISTS` پشتیبانی نمی‌کند، پس داخل بلوک DO.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_phone_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table profiles add constraint profiles_phone_key unique (phone);
  end if;
end $$;

comment on constraint profiles_phone_key on profiles is
  'یکتایی شماره تلفن. NULL مجاز است (چند کاربر می‌توانند تلفن نداشته باشند) ولی دو شماره غیر NULL نمی‌توانند تکراری باشند.';

-- ── ۳. بستن آسیب‌پذیری INSERT روی profiles ───────────────────────────────────
-- تریگر enforce_profile_server_columns فقط روی UPDATE بود. حالا روی INSERT هم
-- فعال می‌شود تا مشتری نتواند با policy INSERT، ستون‌های سروری (کیف پول، امتیاز،
-- سطح) را در زمان ساخت پروفایل دستکاری کند. مقادیر ورودی نادیده گرفته و به مقادیر
-- پیش‌فرض پایگاه‌داده بازنشانی می‌شوند.
create or replace function enforce_profile_server_columns()
returns trigger
language plpgsql
as $$
begin
  -- RLS سطر را می‌بیند ولی ستون‌ها را نه، پس محافظت باید این‌جا باشد.
  --
  -- تفکیک مسیرها با `current_user` انجام می‌شود، نه `auth.role()`:
  --   * `current_user = 'authenticated'` → این INSERT/UPDATE مستقیم از مرورگر است.
  --   * داخل یک تابع `security definer`، `current_user` برابر مالک تابع
  --     (`postgres`) می‌شود، پس نوشتن‌های قانونیِ خودمان (کسر کیف پول،
  --     امتیاز وفاداری، پاداش معرفی) بدون نیاز به پرچم اضافه عبور می‌کنند.
  if current_user = 'authenticated' then
    -- ستون‌های سروری هرگز نباید توسط کلاینت نوشته شوند، نه در UPDATE نه INSERT.
    -- در INSERT، `old` وجود ندارد، پس مقادیر را به پیش‌فرض پایگاه‌داده بازنشانی می‌کنیم.
    -- در UPDATE، مقادیر قبلی (`old`) حفظ می‌شوند تا کلاینت نتواند آن‌ها را تغییر دهد.
    if tg_op = 'INSERT' then
      new.wallet_balance             := 0;
      new.loyalty_points             := 0;
      new.total_earned_points        := 0;
      new.level                      := 'normal';
      new.login_streak               := 0;
      new.invited_by                 := null;
      new.referral_bonus_applied_at  := null;
      new.last_login_streak_date     := null;
      new.last_profile_bonus_date    := null;
      new.last_birthday_bonus_date   := null;
    else
      new.wallet_balance             := old.wallet_balance;
      new.loyalty_points             := old.loyalty_points;
      new.total_earned_points        := old.total_earned_points;
      new.level                      := old.level;
      new.login_streak               := old.login_streak;
      new.invited_by                 := old.invited_by;
      new.referral_bonus_applied_at  := old.referral_bonus_applied_at;
      new.last_login_streak_date     := old.last_login_streak_date;
      new.last_profile_bonus_date    := old.last_profile_bonus_date;
      new.last_birthday_bonus_date   := old.last_birthday_bonus_date;
    end if;

    -- در UPDATE، اگر ستون سروری تغییر کرده باشد خطا می‌دهیم تا کلاینت بداند
    -- این ستون‌ها قابل تغییر نیستند. در INSERT چون به پیش‌فرض بازنشانی شده‌اند
    -- نیازی به خطا نیست.
    if tg_op = 'UPDATE' then
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
  end if;

  return new;
end;
$$;

-- تریگر روی INSERT هم فعال می‌شود تا ستون‌های سروری در زمان ساخت پروفایل نیز
-- محافظت شوند.
drop trigger if exists trg_profiles_server_columns on profiles;
create trigger trg_profiles_server_columns
  before insert or update on profiles
  for each row
  execute function enforce_profile_server_columns();

comment on function enforce_profile_server_columns() is
  'RLS فقط سطر را محدود می‌کند نه ستون را؛ این تریگر اجازه نمی‌دهد مشتری wallet_balance یا loyalty_points خودش را در INSERT یا UPDATE بنویسد.';
