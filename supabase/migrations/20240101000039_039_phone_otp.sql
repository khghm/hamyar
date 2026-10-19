-- 039 — زیرساخت ورود مشتری با شماره موبایل و کد یک‌بارمصرف (OTP)
--
-- تصمیم محصول: چون بیشتر مشتریان ایمیل ندارند، احراز هویت مشتری بر اساس شماره
-- موبایل انجام می‌شود و ارسال پیامک با سرویس ایرانی «کاوه‌نگار» است. ورود
-- کارمندان/ادمین (ایمیل + رمز عبور در Supabase Auth) دست‌نخورده می‌ماند.
--
-- چرا جدول جداگانه و نه ستون در profiles:
--   • کدها باید کوتاه‌عمر، هش‌شده و قابل حذف باشند؛ نگه‌داشتنشان در پروفایل
--     هم امنیتی نیست و هم تاریخچهٔ بی‌مورد می‌سازد.
--   • دسترسی فقط با service_role است (Worker روی Cloudflare)، پس RLS بدون هیچ
--     policy فعال می‌شود تا anon/authenticated هیچ راهی به این جدول نداشته باشند.

create table if not exists public.phone_otp_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    integer not null default 0,
  ip          text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_phone_otp_codes_phone_created
  on public.phone_otp_codes (phone, created_at desc);

create index if not exists idx_phone_otp_codes_expires
  on public.phone_otp_codes (expires_at);

alter table public.phone_otp_codes enable row level security;

-- بدون policy: anon و authenticated هیچ دسترسی‌ای ندارند؛ service_role از RLS
-- عبور می‌کند. (Worker با کلید service_role کوئری می‌زند.)
revoke all on public.phone_otp_codes from anon, authenticated;

comment on table public.phone_otp_codes is
  'کدهای یک‌بارمصرف ورود با موبایل — فقط service_role (Worker) دسترسی دارد';

-- پاک‌سازی خودکار کدهای منقضی (اختیاری، سبک)
create or replace function public.purge_expired_phone_otps()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.phone_otp_codes
  where expires_at < now() - interval '1 day';
$$;
