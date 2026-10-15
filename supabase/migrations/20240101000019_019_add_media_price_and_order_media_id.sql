-- ============================================================================
-- 019_add_media_price_and_order_media_id.sql
--
-- افزودن ستون‌هایی که مهاجرت ۰۲۷ (place_catalog_order با پشتیبانی media) به آن‌ها
-- نیاز دارد، ولی در هیچ مهاجرت قبلی اضافه نشده‌اند.
--
--   * `media_items.price`: RPC 027 در حالت media قیمت را از این ستون می‌خواند.
--   * `order_items.media_id`: RPC 027 هنگام درج آیتم‌های سفارش مدیا به این ستون
--     ارجاع می‌دهد.
--
-- این مهاجرت پیش از 027 اجرا می‌شود تا آن RPC بدون خطای «ستون نامعلوم» کار کند.
-- ============================================================================

-- 1. قیمت مدیا — مدیا در جریان کاتالوگ قابل سفارش است، پس قیمت آن در دیتابیس
--    تعریف می‌شود. مقدار پیش‌فرض ۰ برای رکوردهای موجود.
alter table media_items
  add column if not exists price bigint not null default 0 check (price >= 0);

comment on column media_items.price is
  'قیمت تومان کالای مدیا برای سفارش آنلاین. ۰ یعنی هنوز قیمت‌گذاری نشده.';

-- 2. لینک آیتم سفارش به کالای مدیا — در سفارشات محصول NULL است.
alter table order_items
  add column if not exists media_id uuid references media_items(id);

comment on column order_items.media_id is
  'شناسه کالای مدیا (فیلم/سریال) برای سفارشات نوع media. در سفارشات محصول NULL است.';

create index if not exists idx_order_items_media
  on order_items(media_id) where media_id is not null;
