-- ============================================================================
-- 013_profile_provisioning.sql
--
-- فاز ۲.۳ — ساخت سطر پروفایل مشتری فقط در سمت سرور
--
-- مشکل
-- -----
-- `signInCustomer` در `src/store.tsx` یک fallback دارد: اگر ردیف `profiles`
-- هنوز ساخته نشده باشد، کلاینت خودش آن را درج می‌کند. این درج **همیشه** با خطا
-- رد می‌شد، چون روی `profiles` هیچ policy درجی وجود ندارد (و نباید هم باشد —
-- توضیح پایین).
--
-- اما اشکال اصلی یک لایه عمیق‌تر بود: تریگر `on_auth_user_created` فقط
-- `(id, phone)` را درج می‌کرد. یعنی برای هر مشتریِ ثبت‌نام‌شدهٔ واقعی:
--
--   * `display_name` همیشه NULL می‌ماند ⇒ نامی که کاربر در فرم ثبت‌نام تایپ
--     کرده بود دور می‌رفت و رابط کاربری به‌جای آن شماره را نشان می‌داد؛
--   * `invite_code` همیشه NULL می‌ماند ⇒ `User.inviteCode` خالی می‌شد، مشتری
--     کدی برای دعوت نداشت، و `apply_referral_bonuses` هیچ‌کس را پیدا نمی‌کرد.
--     تنها جایی که کد دعوت ساخته می‌شد همان fallback مردهٔ کلاینت بود.
--
-- چرا policy درج روی `profiles` راه‌حل نیست
-- -----------------------------------------
-- migration 006 به‌درستی مجوز UPDATE جدول را برداشت و فقط ستون‌های مالک را
-- دوباره داد، چون RLS «کدام سطر» را محدود می‌کند نه «کدام ستون». همان استدلال
-- برای درج هم برقرار است: policy با `with check (id = auth.uid())` اجازه می‌دهد
-- هر کاربر سطر خودش را با هر مقداری بسازد — از جمله `wallet_balance` و
-- `loyalty_points`. یعنی یک policy درج، راه کوتاه برای چاپ پول است.
--
-- راه درست: `security definer`. تابع فقط سطر `auth.uid()` را می‌سازد و فقط
-- ستون‌هایی را پر می‌کند که کاربر خودش مالکشان است؛ بقیه پیش‌فرض پایگاه‌داده
-- می‌ماند و کلاینت هیچ راهی برای دور زدن ندارد چون اصلاً درج نمی‌کند.
--
-- چرا تریگر هم تغییر کرد
-- ----------------------
-- مسیر عادی ثبت‌نام از تریگر می‌گذرد، نه از تابع. اگر فقط تابع را درست کنیم،
-- مشتریِ واقعی همچنان بدون نام و بدون کد دعوت می‌ماند و فقط بارِ درخواستِ دوم
-- درست می‌شود. پس هر دو مسیر باید یکسان کار کنند.
-- ============================================================================

-- ── ۱) تولید کد دعوت ───────────────────────────────────────────────────────
-- کد از `gen_random_uuid()` ساخته می‌شود، نه در کلاینت: کلاینت می‌تواند کد
-- دلخواه بگذارد و قید `unique` را برای بقیه تنگ کند (DoS روی کدهای دعوت).
--
-- `unique` یعنی تصادم ممکن است، هرچند با ۸ کاراکتر از uuid عملاً ناچیز است؛
-- تابع به‌جای خطا دادن، یک‌بار دیگر تلاش می‌کند و در بدترین حالت کد بلندتری
-- می‌سازد تا از شکست قطعی در ثبت‌نام جلوگیری شود.
create or replace function public.generate_invite_code(p_length integer default 6)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text;
  v_hex    text;
  v_tries  integer := 0;
begin
  loop
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_code := 'INV' || upper(substr(v_hex, 1, greatest(p_length, 6)));
    -- فقط وقتی کد واقعاً آزاد است برمی‌گردیم؛ وگرنه دوباره می‌سازیم.
    if not exists (select 1 from public.profiles p where p.invite_code = v_code) then
      return v_code;
    end if;
    v_tries := v_tries + 1;
    if v_tries >= 5 then
      -- بعد از چند تلاش، هش بلندتر عملاً تصادم را حذف می‌کند.
      return 'INV' || upper(substr(v_hex, 1, 20));
    end if;
  end loop;
end;
$$;

revoke all on function public.generate_invite_code(integer) from public, anon;
grant execute on function public.generate_invite_code(integer) to service_role;


-- ── ۲) تریگر ثبت‌نام: نام و کد دعوت هم می‌نویسد ─────────────────────────────
-- بازتعریف کامل به‌جای وصله: نام از همان `raw_user_meta_data` خوانده می‌شود که
-- `signUp` فرم می‌فرستد (`options.data.display_name`)، پس نامی که کاربر تایپ
-- کرده در دیتابیس می‌نشیند و دیگر به شمارهٔ تلفن بازنمی‌گردد.
create or replace function public.public_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- فقط مشتری؛ کارمندها با RPC/Edge Function خودشان ساخته می‌شوند.
  if not exists (select 1 from staff_accounts sa where sa.auth_uid = new.id) then
    insert into profiles (id, phone, display_name, invite_code)
    values (
      new.id,
      case
        when new.raw_user_meta_data ->> 'phone' ~ '^09[0-9]{9}$'
          then new.raw_user_meta_data ->> 'phone'
        else null
      end,
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
      public.generate_invite_code()
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;


-- ── ۳) ensure_own_profile: تنها مسیر مجاز ساخت سطر ───────────────────────────
-- دو کار می‌کند و هر دو لازم‌اند:
--
--   * اگر سطر نبود (ثبت‌نامی که با تریگر هم‌زمان شده و کلاینت زودتر رسیده)
--     آن را می‌سازد؛
--   * اگر سطر بود ولی `display_name` یا `invite_code` آن NULL بود — یعنی از
--     قبل با تریگر قدیمی ساخته شده — فقط همان ستون‌های خالی را پر می‌کند و به
--     بقیهٔ سطر (کیف پول، امتیاز، سطح) دست نمی‌زند.
--
-- عمداً هیچ پارامتری برای موجودی یا امتیاز نمی‌گیرد: ورودی کاربر فقط نام است
-- و بقیه از سرور می‌آید.
create or replace function public.ensure_own_profile(p_display_name text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_row    public.profiles;
  v_name   text;
begin
  if v_uid is null then
    raise exception 'ensure_own_profile requires an authenticated user'
      using errcode = '42501';
  end if;

  v_name := nullif(trim(coalesce(p_display_name, '')), '');

  -- اگر سطر هست، فقط فیلدهای خالیِ خودِ کاربر را پر کن.
  update public.profiles p
     set display_name = coalesce(p.display_name, v_name),
         invite_code   = coalesce(p.invite_code, public.generate_invite_code()),
         phone         = coalesce(p.phone, (auth.jwt() ->> 'phone'))
   where p.id = v_uid
  returning * into v_row;

  -- سطر نبود ⇒ همین تابع ساختش می‌دهد (به‌جای درج مستقیم از کلاینت).
  if v_row.id is null then
    insert into public.profiles (id, phone, display_name, invite_code)
    values (
      v_uid,
      case
        when auth.jwt() ->> 'phone' ~ '^09[0-9]{9}$' then auth.jwt() ->> 'phone'
        else null
      end,
      v_name,
      public.generate_invite_code()
    )
    on conflict (id) do update
      set display_name = coalesce(public.profiles.display_name, excluded.display_name),
          invite_code   = coalesce(public.profiles.invite_code, excluded.invite_code)
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.ensure_own_profile(text) from public, anon;
-- فقط کاربر احراز‌هویت‌شده، و تابع خودش با `auth.uid()` سطر را تعیین می‌کند،
-- پس هیچ چیزی از ورودی کلاینت قابل جعل نیست.
grant execute on function public.ensure_own_profile(text) to authenticated;


-- ── ۴) ترمیم پروفایل‌های موجود ─────────────────────────────────────────────
-- این مهاجرت روی پایگاه‌داده‌ای که با تریگر قدیمی ساخته شده هم اجرا می‌شود:
-- کد دعوتِ گم‌شده را برمی‌گرداند. `level`/`wallet_balance`/`loyalty_points`
-- دست‌نخورده می‌مانند چون این‌ها مالکیت کاربر نیستند.
update public.profiles p
   set invite_code = public.generate_invite_code()
 where p.invite_code is null;

update public.profiles p
   set display_name = p.phone
 where p.display_name is null
   and p.phone is not null;

comment on function public.ensure_own_profile(text) is
  'تنها مسیر مجاز ساخت سطر profiles برای کاربر جاری. جایگزین درج مستقیم کلاینت که با RLS رد می‌شد و در صورت باز شدن، راه چاپ wallet_balance بود.';

comment on column public.profiles.invite_code is
  'کد دعوت؛ در سرور ساخته می‌شود (`generate_invite_code`) تا کلاینت نتواند کد دلخواه بگذارد و یکتایی را برای بقیه تنگ کند.';
