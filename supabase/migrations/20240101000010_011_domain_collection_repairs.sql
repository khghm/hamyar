-- ============================================================================
-- 011_domain_collection_repairs.sql
--
-- فاز ۲.۳ — ترمیم‌های لازم برای اینکه mapperهای `src/domains/*/api.ts`
-- واقعاً بتوانند بنویسند و بخوانند.
--
-- این مهاجرت «تکمیل» ۰۰۸/۰۰۹/۰۱۰ است: هر چیزی که آن‌ها برای کار کردن
-- mapperها کم گذاشته بودند اینجا جبران می‌شود، به‌علاوهٔ ترمیم پایگاه‌داده‌هایی
-- که ۰۰۸ را با ایندکس‌های جزئی اجرا کرده‌اند. همهٔ دستورها idempotent هستند.
--
-- هر بخش شمارهٔ اشکالی را دارد که از آن می‌آید.
-- ============================================================================


-- ── ۱) ON CONFLICT و ایندکس یکتای جزئی ────────────────────────────────────
-- `src/api/sync.ts` با `upsert(rows, { onConflict: 'sku' })` می‌نویسد و
-- PostgREST از آن `ON CONFLICT (sku) DO UPDATE` می‌سازد. ایندکس یکتای جزئی
-- (`WHERE sku IS NOT NULL`) قابل استنتاج نیست مگر predicate هم در conflict
-- target بیاید، و PostgREST چنین چیزی تولید نمی‌کند → خطای 42P10 و هیچ
-- نوشتنی انجام نمی‌شود.
--
-- این بلوک عیناً کار اصلاح‌شدهٔ ۰۰۸ را تکرار می‌کند تا پایگاه‌داده‌هایی که نسخهٔ
-- قدیمی ۰۰۸ را اجرا کرده‌اند هم ترمیم شوند.
do $$
declare
  t text;
begin
  foreach t in array array[
    'invoices', 'sms_logs', 'reviews', 'notes', 'okrs', 'kpis',
    'content_templates', 'content_ideas', 'training_sites'
  ] loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I add column if not exists sku text', t);
      execute format('drop index if exists public.%I', 'idx_' || t || '_sku');
      execute format(
        'create unique index if not exists %I on public.%I (sku)',
        'idx_' || t || '_sku', t);
    end if;
  end loop;
end $$;

-- همان اشکال، همان راه‌حل: `src/api/settings.ts` تنظیمات اعلان هر کاربر را با
-- `onConflict: 'user_id'` upsert می‌کند و ایندکس ۰۰۶ جزئی است.
-- ایندکس کامل NULLها را چندبار مجاز می‌کند، پس چیزی از دست نمی‌رود.
drop index if exists public.notification_settings_user_unique;
create unique index if not exists notification_settings_user_unique
  on public.notification_settings (user_id);


-- ── ۲) RLS فاکتورها: به‌روزرسانی و حذف ──────────────────────────────────────
-- ۰۰۴ فقط `for select` و `for insert` ساخته بود. `syncCollection` هم `upsert`
-- می‌کند (که `DO UPDATE` می‌خواهد) و هم ردیف‌های حذف‌شده را `.delete()`.
-- بدون این دو policy، هر ویرایش فاکتور از پنل با خطای RLS رد می‌شد.
drop policy if exists "staff_update_invoices" on invoices;
create policy "staff_update_invoices" on invoices
  for update using (has_permission('perm14'))
  with check (has_permission('perm14'));

drop policy if exists "staff_delete_invoices" on invoices;
create policy "staff_delete_invoices" on invoices
  for delete using (has_permission('perm14'));


-- ── ۳) reviews: پیوند با محصول به‌جای uuid ─────────────────────────────────
-- `reviews.product_id` یک uuid به `products.id` است ولی فروشگاه با کلید تجاری
-- (`p1`) کار می‌کند. بدون ستون کمکی، نظرِ تازه‌ثبت‌شده بدون پیوند محصول ذخیره
-- می‌شد و در `fromRow` هم `productId` خالی برمی‌گشت، پس نظر از صفحهٔ محصول
-- ناپدید می‌ماند.
--
-- عمداً کلید خارجی گذاشته نمی‌شود: کالکشن‌ها به ترتیب نامعلوم sync می‌شوند و
-- یک FK اینجا یعنی «ثبت نظر قبل از رسیدن محصول به دیتابیس» شکست می‌خورد.
-- پیوند در سطح برنامه حفظ می‌شود، درست مثل بقیهٔ کلیدهای تجاری.
alter table public.reviews add column if not exists product_sku text;

comment on column public.reviews.product_sku is
  'کلید تجاری محصول (`products.sku`، مثلاً p1) — نگاشت `Review.productId`. کنار `product_id` (uuid) نگه داشته می‌شود چون فروشگاه با کلید تجاری کار می‌کند.';

-- ردیف‌هایی که پیوندشان فقط به‌صورت uuid است، به کلید تجاری برگردانده می‌شوند
-- تا پس از ترمیم هم در فروشگاه قابل مشاهده باشند.
update public.reviews r
   set product_sku = p.sku
  from public.products p
 where r.product_sku is null
   and r.product_id = p.id;


-- ── ۴) affiliates: هم‌ترازی با فروشگاه ─────────────────────────────────────
-- جدول فقط `user_id / code / link / tier` داشت، ولی `user_id` و `code`
-- هر دو NOT NULL بودند و هیچ‌کدام از فیلدهای فروشگاه (`name`, `phone`,
-- `commissionRate`, `walletBalance`, …) جایی نداشت. یعنی mapper تخت روی این
-- جدول اساساً نمی‌توانست یک ردیف درج کند.
--
-- همکار می‌تواند پیش از داشتن حساب مشتری ساخته شود، پس `user_id` اختیاری
-- می‌شود؛ `code` هم اختیاری تا همکاران بدون کد Referral هم ساخته شوند (NULL در
-- ایندکس یکتا تکرارپذیر است).
alter table public.affiliates alter column user_id drop not null;
alter table public.affiliates alter column code drop not null;

alter table public.affiliates add column if not exists name text;
alter table public.affiliates add column if not exists phone text;
alter table public.affiliates add column if not exists email text;
alter table public.affiliates add column if not exists commission_rate numeric(5,2);
alter table public.affiliates add column if not exists wallet_balance bigint not null default 0;
alter table public.affiliates add column if not exists total_earnings bigint not null default 0;
alter table public.affiliates add column if not exists total_withdrawn bigint not null default 0;
alter table public.affiliates add column if not exists total_spent bigint not null default 0;
alter table public.affiliates add column if not exists status text not null default 'pending';
alter table public.affiliates add column if not exists join_date date;
alter table public.affiliates add column if not exists last_activity timestamptz;
alter table public.affiliates add column if not exists notes text;

-- پیش از بستن قید، هر مقدار ناشناخته به حالت اولیه برمی‌گردد (همان رویکرد ۰۱۰).
update public.affiliates set status = 'pending'
 where status is null or status not in ('active','inactive','pending');

alter table public.affiliates drop constraint if exists affiliates_status_check;
alter table public.affiliates
  add constraint affiliates_status_check
  check (status in ('active','inactive','pending'));

comment on column public.affiliates.user_id is
  'اختیاری: همکار ممکن است پیش از ساخت حساب مشتری ثبت شود.';


-- ── ۵) content_projects: جدا کردن فیلدهای ساختاریافته از metrics ───────────
-- `metrics` از ۰۰۳ برای شاخص‌های عملکردی معنا دارد (`{ views, engagement_rate }`)
-- و mapper آن را به کیسهٔ فیلدهای نگاشت‌نشده تبدیل کرده بود. این دو معنا نباید
-- قاطی شوند.
alter table public.content_projects add column if not exists extra jsonb;

comment on column public.content_projects.extra is
  'فیلدهای ساختاریافتهٔ فروشگاه که ستون مستقل ندارند (نگاشت `ContentProject`). `metrics` فقط برای شاخص‌های عملکردی است.';


-- ── ۶) projects: یکی کردن دو ستون مبلغ ─────────────────────────────────────
-- ۰۰۹ `total_cost` را اضافه کرد ولی `price` از ۰۰۲ باقی ماند؛ mapper دومی را
-- پر می‌کند و اولی برای همیشه NULL می‌ماند — دو ستون پولی با یک معنا.
-- `price` هیچ‌جا در SQL یا Edge Functionها ارجاع نمی‌شود، پس با حفظ مقدار حذف
-- می‌شود.
update public.projects set total_cost = price
 where price is not null and coalesce(total_cost, 0) = 0;

alter table public.projects drop column if exists price;


-- ── ۷) notes: قید مقدار هم‌تراز با فروشگاه ─────────────────────────────────
-- ۰۰۹ ستون‌ها را اضافه کرد ولی قیدی روی مقادیر نگذاشت. `tickets` از
-- `in_progress` استفاده می‌کند ولی فروشگاه برای یادداشت `in-progress`
-- (خط تیره) دارد؛ به‌جای تغییر ۵۳ صفحه، قید دقیقاً روی مقادیر فروشگاه بسته
-- می‌شود — همان تصمیمی که ۰۱۰ برای `content_projects` گرفت.
update public.notes set priority = 'medium'
 where priority is null or priority not in ('low','medium','high','urgent');
update public.notes set status = 'pending'
 where status is null or status not in ('pending','in-progress','done');

alter table public.notes drop constraint if exists notes_priority_check;
alter table public.notes
  add constraint notes_priority_check
  check (priority in ('low','medium','high','urgent'));

alter table public.notes drop constraint if exists notes_status_check;
alter table public.notes
  add constraint notes_status_check
  check (status in ('pending','in-progress','done'));


-- ── ۸) expense_categories: علامت‌گذاری به‌عنوان اسکیمای منسوخ ────────────────
-- ۰۱۰ کلید خارجی `expenses.category_id` را برداشت، چون `Expense.category` در
-- فروشگاه یک برچسب آزاد فارسی است. جدول دیگر ارجاعی ندارد و هیچ ردیف اولیه‌ای
-- هم ندارد، ولی برای برگشت‌پذیری مهاجرت حذف نمی‌شود.
comment on table public.expense_categories is
  'منسوخ: پس از ۰۱۰ دیگر به هیچ جدولی ارجاع ندارد. `expenses.category` یک برچسب آزاد است. جدول فقط برای برگشت‌پذیری نگه داشته شده.';

comment on table public.projects is
  'پروژه‌های طراحی سایت. ستون `status` باقی‌ماندهٔ قبل از ۰۰۹ است و mapper عمداً مقدار ثابت `in_progress` در آن می‌نویسد تا فقط قید راضی بماند؛ مرحلهٔ واقعی در `stage` است.';
