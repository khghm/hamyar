-- 014 — سیاست‌های `gamification_settings` + مجوز «مدیریت باشگاه مشتریان»
--
-- شماره‌گذاری: این فایل عمداً `014` است نه `013`، چون `013_profile_provisioning`
-- (ساخت پروفایل مشتری در سرور) پیش‌تر همان شماره را گرفته بود. شمارهٔ مهاجرت در
-- `schema_migrations` کلید یکتاست، پس دو فایل با یک شماره یعنی خطای اعمال.
--
-- ── بخش ۱: مجوز جدید `perm43` ───────────────────────────────────────────────
-- لازم است چون `seed.sql` فقط یک‌بار هنگام راه‌اندازی اولیه اجرا می‌شود. بدون این
-- درج، دیتابیسِ از قبل استقراریافته `perm43` را ندارد، `fetchPermissions()` آن را
-- برنمی‌گرداند، و چون store فقط وقتی لیست خالی باشد به دادهٔ محلی برمی‌گردد
-- (`if (perms.length) setPermissions(perms)`)، مجوز در صفحهٔ RBAC اصلاً دیده نمی‌شد
-- و در نتیجه هیچ‌کس نمی‌توانست آن را به نقشی بدهد. پس این درج باید در مهاجرت باشد.
--
-- `on conflict (id) do update` عمدی است: مهاجرت دوباره اجرا شدنش بی‌خطر است و
-- برچسبِ اصلاح‌شده را هم می‌آورد.
insert into permissions (id, name, description, module) values
  ('perm43', 'مدیریت باشگاه مشتریان', 'ویرایش تنظیمات، سطوح و پاداش‌های باشگاه مشتریان', 'باشگاه مشتریان')
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description,
      module      = excluded.module;

-- نقش «مدیر کل» باید perm43 را هم داشته باشد، وگرنه پس از اعمال مهاجرت هیچ‌کس
-- نمی‌تواند تنظیمات باشگاه مشتریان را ذخیره کند. سایر نقش‌ها دست‌نخورده می‌مانند تا
-- ادمین خودش در RBAC تصمیم بگیرد چه کسی آن را بگیرد.
--
-- `::text` لازم است: بدون آن Postgres عملگر `||` را روی دو آرایه تفسیر می‌کند و
-- به‌جای الحاق یک عنصر، سعی می‌کند `'perm43'` را آرایه بخواند
-- («malformed array literal»).
update roles
   set permissions = permissions || 'perm43'::text
 where name = 'مدیر کل'
   and not (permissions @> array['perm43']);

-- ── بخش ۲: خواندنِ عمومی وجود نداشت ─────────────────────────────────────────
-- migration 007 به `anon` دسترسی `select` روی `gamification_settings` داد، ولی در
-- RLS هیچ policy خواندنی برای مهمان نوشته نشده بود. در RLS نبودِ policy برای یک
-- دستور یعنی «ممنوع»، پس آن grant بی‌اثر بود: نه کلاینت می‌توانست قیمت امتیاز و
-- آستانهٔ سطح‌ها را بخواند، نه `Auth.tsx` پاداش دعوت را نشان می‌داد. محتوای این
-- سند ذاتاً عمومی است (در صفحهٔ ورود و باشگاه مشتریان نمایش داده می‌شود)، پس
-- policy خواندنِ باز درست است — دقیقاً مثل `anon_read_faqs` و
-- `anon_read_project_services`.
drop policy if exists "anon_read_gamification" on gamification_settings;
create policy "anon_read_gamification" on gamification_settings
  for select using (true);

-- ── بخش ۳: مجوز نوشتن اشتباه بود ─────────────────────────────────────────────
-- policy قبلی `has_permission('perm35') or is_staff()` بود. `perm35` یعنی
-- «مدیریت نقش‌ها» و ربطی به باشگاه مشتریان ندارد؛ و بدتر از آن، `or is_staff()`
-- راه فرار بود: هر کارمندِ فعالی — حتی کسی که فقط «مشاهده دعوت‌ها» دارد — می‌توانست
-- اقتصاد امتیاز و آستانهٔ سطح‌ها را بازنویسی کند.
--
-- قاعده‌ای که مهاجرت‌های ۰۱۱/۰۱۲ رعایت کرده‌اند: مجوزِ RLS باید همان مجوزِ
-- گیتِ مسیر در `src/store.tsx` باشد، وگرنه ویرایشِ مجاز در UI بی‌صدا رد می‌شود و
-- با بارگذاری مجدد برمی‌گردد.
--
-- این سند فقط در `/admin/invites` ویرایش می‌شود، و آن صفحه دو نقش دارد: `perm29`
-- («مشاهده دعوت‌ها») برای دیدن، و `perm43` («مدیریت باشگاه مشتریان») برای
-- ویرایش — چون `perm29` یک مجوزِ فقط‌خواندنی است و برای نوشتن کافی نبود. پس:
-- خواندن با `perm29`، نوشتن با `perm43`. تب‌های ویرایشیِ صفحه هم در
-- `src/pages/admin/Invites.tsx` با همین `perm43` گیت شده‌اند تا دکمهٔ «ذخیره»
-- برای نقشِ فقط‌مشاهده اصلاً نمایش داده نشود.
drop policy if exists "staff_manage_gamification" on gamification_settings;
create policy "staff_manage_gamification" on gamification_settings
  for all using (has_permission('perm29') or has_permission('perm43'))
  with check (has_permission('perm43'));

-- ── یادداشت نگه‌دارنده ─────────────────────────────────────────────────────
-- مثل بقیهٔ policyهای این سری، `for all` است تا با یک drop قابل برگشت باشد.
-- `anon_read_gamification` جدا نگه داشته شده چون خواندن و نوشتن این سند دو
-- تصمیم امنیتی متفاوت‌اند: اولی برای همه (حتی مهمان)، دومی برای دارندهٔ perm43.
-- هر دو `drop ... if exists` دارند تا اجرای دوبارهٔ مهاجرت خطا ندهد.
comment on policy "anon_read_gamification" on gamification_settings is
  'خواندن عمومی؛ grantِ ۰۰۷ بدون این policy بی‌اثر بود و کلاینت هیچ‌وقت تنظیمات را نمی‌خواند.';
comment on policy "staff_manage_gamification" on gamification_settings is
  'خواندن: perm29 (گیت صفحه). نوشتن: perm43 — perm35 قبلاً اشتباه بود و is_staff() راه فرار.';
