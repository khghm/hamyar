-- 043 — تبدیل «اخبار» به یک CMS واقعی + زیرساخت سئو
--
-- تا امروز `news` فقط عنوان/تصویر/خلاصه/متن/تاریخ/فعال داشت و از داخل تب
-- «اخبار» در تنظیمات مدیریت می‌شد. برای انتشار حرفه‌ای و سئوشده به این ستون‌ها
-- نیاز است: slug (آدرس خوانا)، خلاصه، دسته، برچسب‌ها، وضعیت پیش‌نویس/منتشرشده،
-- زمان انتشار، فیلدهای متای سئو، نویسنده، زمان مطالعه و شمارندهٔ بازدید.

alter table public.news
  add column if not exists slug            text,
  add column if not exists excerpt         text,
  add column if not exists category        text,
  add column if not exists tags            text[] default '{}'::text[],
  add column if not exists status          text,
  add column if not exists published_at    timestamptz,
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists cover_alt       text,
  add column if not exists author          text,
  add column if not exists reading_minutes integer,
  add column if not exists views           integer default 0;

-- مقدارهای اولیه از دادهٔ موجود
update public.news
   set status = case when active is false then 'draft' else 'published' end
 where status is null;

update public.news
   set published_at = coalesce(published_at, date::timestamptz, created_at)
 where published_at is null;

update public.news
   set reading_minutes = greatest(1, least(60, ceil(length(coalesce(content, '')) / 900.0)::int))
 where reading_minutes is null;

update public.news
   set category = 'اخبار'
 where category is null or btrim(category) = '';

update public.news
   set excerpt = left(regexp_replace(coalesce(content, ''), '\s+', ' ', 'g'), 180)
 where excerpt is null and content is not null;

-- slug از عنوان؛ حروف فارسی/اعداد حفظ و بقیه به «-» تبدیل می‌شوند
update public.news
   set slug = trim(both '-' from regexp_replace(lower(coalesce(nullif(btrim(title), ''), 'news')), '[^a-z0-9آ-ی۰-۹]+', '-', 'g'))
 where slug is null or btrim(slug) = '';

-- یکتاسازی slug‌های تکراری با پسوند شناسه
update public.news n
   set slug = n.slug || '-' || left(n.id::text, 6)
 where exists (
   select 1 from public.news x
   where x.slug = n.slug and x.id < n.id
 );

create unique index if not exists news_slug_unique on public.news (slug) where slug is not null;
create index if not exists news_published_idx on public.news (status, published_at desc);

comment on column public.news.slug is 'آدرس خوانا برای سئو: /news/<slug>';
comment on column public.news.status is 'draft | published';
