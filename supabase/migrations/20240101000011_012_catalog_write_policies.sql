-- ============================================================================
-- 012_catalog_write_policies.sql
--
-- فاز ۲.۳ — مسیر نوشتن کاتالوگ عمومی و تنظیمات
--
-- مشکل
-- -----
-- `syncCollection` برای هر کلکسیون سه کار می‌کند: `upsert` (که `DO UPDATE`
-- می‌خواهد) و `delete` برای ردیف‌های حذف‌شده. ولی migration 004 برای نُه جدول
-- فقط policy خواندن ساخته بود:
--
--     products, media_items, services, project_services,
--     news, faqs, portfolio, about_content, site_settings
--
-- در RLS نبودِ policy برای یک دستور یعنی «ممنوع» (پیش‌فرض deny). پس با وجود
-- اینکه migration 007 به `authenticated` دسترسی کامل DML داده بود، هیچ‌کدام از
-- این دستورها مجاز نبود:
--
--   * `setProducts` / `setMediaItems` / `setServices` / `setNews` / `setFaqs` /
--     `setPortfolio` در store — نوشتن بی‌صدا با خطا رد می‌شد و فقط
--     `console.warn` می‌داد، در حالی که UI تغییر را خوش‌بینانه نشان داده بود.
--     نتیجه: هر ویرایش کاتالوگ و هر ویرایش صفحهٔ «درباره ما» بعد از بارگذاری
--     مجدد ناپدید می‌شد.
--   * `saveAboutContent` (`src/api/settings.ts`) همین سرنوشت را داشت.
--
-- این همان الگویی است که ۰۱۱ برای `invoices` دید و درست کرد؛ آنجا policy
-- خواندن و درج بود ولی به‌روزرسانی و حذف نبود. اینجا ده برابر گسترده‌تر است و
-- بی‌صدا رخ می‌داد، چون کاتالوگ همان چیزی است که هر مدیری هر روز عوض می‌کند.
--
-- تصمیم دربارهٔ مجوزها
-- --------------------
-- شمارهٔ مجوزها از `ADMIN_PAGE_PERMISSIONS` در `src/store.tsx` گرفته شده و از
-- همان قرارداد همه‌جا پیروی می‌کند: فرد = مشاهده، زوج = مدیریت.
--
--   /admin/products  → perm5 / perm6
--   /admin/media     → perm7 / perm8
--   /admin/services  → perm9 / perm10
--   /admin/settings  → perm30 / perm31   (اخبار، نمونه‌کار، درباره ما، تنظیمات)
--
-- `faqs` ویرایشگر زنده‌ای در مسیرها ندارد (`AdminFaqManager` صادر شده ولی route
-- نشده)، اما `setFaqs` در store به سرور وصل است؛ پس سیاستش هم مثل بقیهٔ محتوای
-- صفحهٔ تنظیمات بسته می‌شود تا مسیر نوشتن یک‌دست بماند.
--
-- چرا `is_staff()` در policy خواندن نیست
-- -------------------------------------
-- policy خواندن باید همان سطح دسترسی‌ای را بدهد که صفحه می‌بیند، وگرنه مدیر
-- صفحه را می‌بیند ولی همه‌چیز خالی است. الگوی `004` همین است (مثلاً
-- `staff_view_orders` با perm1/perm2).
-- ============================================================================

-- ── /admin/products ────────────────────────────────────────────────────────
drop policy if exists "staff_manage_products" on products;
create policy "staff_manage_products" on products
  for all using (has_permission('perm5') or has_permission('perm6'))
  with check (has_permission('perm6'));

-- ── /admin/media ───────────────────────────────────────────────────────────
drop policy if exists "staff_manage_media_items" on media_items;
create policy "staff_manage_media_items" on media_items
  for all using (has_permission('perm7') or has_permission('perm8'))
  with check (has_permission('perm8'));

-- ── /admin/services ────────────────────────────────────────────────────────
-- policy خواندن جداگانه لازم است: `anon_read_services` روی `active = true`
-- فیلتر می‌کند و چون محدود به نقش `anon` نیست، برای کارمند هم اجرا می‌شد.
-- نتیجه این بود که خدمت غیرفعال‌شده از پنل مدیریت ناپدید می‌شد و مدیر دیگر
-- نمی‌توانست آن را دوباره فعال کند. policy کارمند فیلتر `active` ندارد.
drop policy if exists "staff_read_services" on services;
create policy "staff_read_services" on services
  for select using (has_permission('perm9') or has_permission('perm10'));

drop policy if exists "staff_manage_services" on services;
create policy "staff_manage_services" on services
  for all using (has_permission('perm9') or has_permission('perm10'))
  with check (has_permission('perm10'));

-- `project_services` در همین صفحهٔ خدمات قرار می‌گیرد. سیاستش امروز استفادهٔ
-- زنده ندارد: `fetchProjectServices` در store صدا زده نمی‌شود و صفحه‌های عمومی
-- هنوز از ثابت `PROJECT_SERVICES` می‌خوانند. اضافه شده تا اگر آن اتصال انجام
-- شد، مسیر نوشتن از روز اول آماده باشد و شکست بی‌صدا ندهد.
drop policy if exists "staff_manage_project_services" on project_services;
create policy "staff_manage_project_services" on project_services
  for all using (has_permission('perm9') or has_permission('perm10'))
  with check (has_permission('perm10'));

-- ── /admin/settings: اخبار، نمونه‌کار، درباره ما ──────────────────────────
-- همان مسئلهٔ `active` برای اخبار: `anon_read_news` روی `active = true`
-- بود، پس خبر پیش‌نویس برای کارمند هم قابل دیدن نبود.
drop policy if exists "staff_read_news" on news;
create policy "staff_read_news" on news
  for select using (has_permission('perm30') or has_permission('perm31'));

drop policy if exists "staff_manage_news" on news;
create policy "staff_manage_news" on news
  for all using (has_permission('perm30') or has_permission('perm31'))
  with check (has_permission('perm31'));

drop policy if exists "staff_manage_faqs" on faqs;
create policy "staff_manage_faqs" on faqs
  for all using (has_permission('perm30') or has_permission('perm31'))
  with check (has_permission('perm31'));

drop policy if exists "staff_manage_portfolio" on portfolio;
create policy "staff_manage_portfolio" on portfolio
  for all using (has_permission('perm30') or has_permission('perm31'))
  with check (has_permission('perm31'));

-- سند تک‌ردیفی «درباره ما» (`key = 'about'`): کل سند با هم نوشته می‌شود.
drop policy if exists "staff_manage_about_content" on about_content;
create policy "staff_manage_about_content" on about_content
  for all using (has_permission('perm30') or has_permission('perm31'))
  with check (has_permission('perm31'));

-- تنظیمات کلید/مقدار سایت (`src/api/settings.ts` همین را می‌نویسد).
drop policy if exists "staff_manage_site_settings" on site_settings;
create policy "staff_manage_site_settings" on site_settings
  for all using (has_permission('perm30') or has_permission('perm31'))
  with check (has_permission('perm31'));

-- ── یادداشت نگه‌دارنده ─────────────────────────────────────────────────────
-- این سیاست‌ها عمداً `for all` هستند (نه insert/update/delete جدا) تا با یک
-- drop قابل برگشت باشند و رفتارشان مثل بقیهٔ policyهای `004` بماند.
comment on policy "staff_manage_products" on products is
  'مسیر نوشتن کاتالوگ: ۰۱۲. بدون آن هر ویرایش محصول بی‌صدا رد می‌شد.';
comment on policy "staff_read_services" on services is
  'کارمند باید ردیف‌های غیرفعال را هم ببیند، وگرنه خدمت غیرفعال‌شده برای همیشه از پنل حذف می‌شد.';
comment on policy "staff_read_news" on news is
  'همان برای اخبار پیش‌نویس.';
