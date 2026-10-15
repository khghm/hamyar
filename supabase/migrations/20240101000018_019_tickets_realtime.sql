-- 019 — تیکت‌ها: ستون‌های ناپدید + Realtime برای پنل مدیریت
--
-- ── مسئله ────────────────────────────────────────────────────────────
-- جدول `tickets` از مهاجرت ۰۰۳ وجود دارد و RLS آن هم ساخته شده
-- (customer_own_tickets / staff_tickets)، ولی کلاینت هرگز از آن
-- استفاده نکرد: `createTicket` در `src/store.tsx` تیکت را فقط در
-- `localStorage['hamyar_tickets']` می‌نوشت. پس تیکتی که مشتری در
-- مرورگر خود باز کرد، در مرورگر مدیر نامرئی بود — در حالی که
-- اعلان و سفارش همان مشتری (که جدول واقعی دارند) دیده می‌شدند.
--
-- ستون‌هایی که `SupportTicket` در کلاینت دارد ولی جدول ندارد:
--   category, customer_name, customer_phone, order_id, rating,
--   rated_at, closed_at
-- بدون آن‌ها یا باید جدول را join می‌کرد (که RLS پروفایل اجازهٔ
-- خواندن پروفایل دیگران را به کارمند نمی‌دهد) یا اطلاعات از دست
-- می‌رفت. همان‌طور که `invoices` نام و تلفن مشتری را denormalize
-- می‌کند، اینجا هم همین کار را می‌کنیم تا نیازی به join نباشد.
--
-- ── بلادرنگ ──────────────────────────────────────────────────────────
-- publication `supabase_realtime` خالی است، یعنی هیچ جدولی رویداد
-- postgres_changes نمی‌فرستد. پنل مدیریت همهٔ کلکسیون‌ها را یک‌بار
-- در هنگام boot می‌خواند و دوباره poll نمی‌کند، پس مدیر برای دیدن
-- سفارش/تیکت/پرداخت تازه مجبور به F5 بود. با اضافه کردن جداول
-- کلیدی به publication، کلاینت می‌تواند subscription باز کند و
-- تغییرات را بلادرنگ دریافت کند.
--
-- RLS همچنان اعمال می‌شود: رویداد فقط به کاربری می‌رسد که SELECT
-- آن ردیف را مجاز باشد، یعنی همان perm‌هایی که route guard صفحه
-- مربوطه را می‌پرسد.

-- =========================================================================
-- ۱) ستون‌های گمشدهٔ تیکت
-- =========================================================================
alter table tickets add column if not exists category text;
alter table tickets add column if not exists customer_name text;
alter table tickets add column if not exists customer_phone text;
alter table tickets add column if not exists order_id text;
alter table tickets add column if not exists rating integer check (rating between 1 and 5);
alter table tickets add column if not exists rated_at timestamptz;
alter table tickets add column if not exists closed_at timestamptz;

comment on column tickets.category is 'دستهٔ تیکت؛ همان TicketCategory کلاینت';
comment on column tickets.customer_name is 'نام نمایشی مشتری (denormalized تا join به profiles لازم نباشد)';
comment on column tickets.customer_phone is 'تلفن مشتری (denormalized)';
comment on column tickets.order_id is 'شناسهٔ سفارش مرتبط، اختیاری';

-- =========================================================================
-- ۲) جداول کلیدی پنل مدیریت را وارد publication بلادرنگ کن
--
--    `orders` و `order_items` و `order_status_history` برای نمایش
--    زندهٔ سفارشات؛ `tickets` برای تیکت‌ها؛ `notifications` برای
--    زنگوله؛ `payments` و `invoices` برای حسابداری؛ `profiles` برای
--    CRM مشتریان؛ `products` برای موجودی.
-- =========================================================================
-- `ALTER PUBLICATION ... ADD TABLE IF NOT EXISTS` روی این نسخهٔ
-- پستگرس پشتیبانی نمی‌شود، پس با یک بلوک `DO` ایمن و قابل اجرای
-- مجدد (idempotent) جداول را اضافه می‌کنیم. هر یک از این جدول‌ها
-- کلید اولیه دارد، پس REPLICA IDENTITY پیش‌فرض (DEFAULT) کافی است.
do $$
declare
  t text;
begin
  foreach t in array array[
    'orders', 'order_items', 'order_status_history', 'tickets',
    'notifications', 'payments', 'invoices', 'profiles', 'products'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;