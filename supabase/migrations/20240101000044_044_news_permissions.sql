-- 044 — مجوز اختصاصی «اخبار» + رفع خطای RLS در CMS
--
-- مشکل: سیاست‌های نوشتن روی جدول `news` فقط `perm31` (مدیریت تنظیمات) را
-- می‌پذیرفتند. صفحهٔ جدید «اخبار» با perm30/perm31 باز می‌شد، اما هر کارمندی که
-- perm31 نداشت (مثلاً مدیر محتوا یا اپراتور) هنگام ساخت مقاله خطای
-- «new row violates row-level security policy» می‌گرفت.
--
-- راه‌حل: دو مجوز اختصاصی برای اخبار اضافه می‌شود:
--   perm44 = مشاهده اخبار (شامل پیش‌نویس‌ها)
--   perm45 = مدیریت اخبار (ایجاد/ویرایش/انتشار/حذف)
-- و سیاست‌ها هم perm31 را (برای سازگاری با نقش‌های فعلی) و هم مجوزهای جدید را
-- می‌پذیرند.

insert into public.permissions (id, name, description, module) values
  ('perm44', 'مشاهده اخبار', 'مشاهدهٔ فهرست مقاله‌ها، پیش‌نویس‌ها و آمار بازدید', 'اخبار'),
  ('perm45', 'مدیریت اخبار', 'ایجاد، ویرایش، انتشار و حذف مقاله‌ها + تنظیمات سئو', 'اخبار')
on conflict (id) do nothing;

-- نقش‌هایی که از قبل «مدیریت تنظیمات» دارند (مدیر کل) مجوزهای تازه را هم بگیرند
update public.roles
   set permissions = permissions || array['perm44', 'perm45']::text[]
 where permissions @> array['perm31']::text[]
   and not permissions @> array['perm44']::text[];

-- نقش «مدیر محتوا» هم باید بتواند مقاله منتشر کند
update public.roles
   set permissions = permissions || array['perm44', 'perm45']::text[]
 where name = 'مدیر محتوا'
   and not permissions @> array['perm45']::text[];

-- خواندن: هر کدام از مجوزهای قبلی یا جدید
drop policy if exists staff_read_news on public.news;
create policy staff_read_news on public.news
  for select to public
  using (
    has_permission('perm30') or has_permission('perm31')
    or has_permission('perm44') or has_permission('perm45')
  );

drop policy if exists staff_manage_news_read on public.news;

-- نوشتن: مدیریت تنظیمات (سازگاری) یا مدیریت اخبار
drop policy if exists staff_manage_news_insert on public.news;
create policy staff_manage_news_insert on public.news
  for insert to public
  with check (has_permission('perm31') or has_permission('perm45'));

drop policy if exists staff_manage_news_update on public.news;
create policy staff_manage_news_update on public.news
  for update to public
  using (has_permission('perm31') or has_permission('perm45'))
  with check (has_permission('perm31') or has_permission('perm45'));

drop policy if exists staff_manage_news_delete on public.news;
create policy staff_manage_news_delete on public.news
  for delete to public
  using (has_permission('perm31') or has_permission('perm45'));
