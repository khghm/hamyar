-- ============================================================================
-- 009_align_collection_columns.sql
--
-- فاز ۱.۱۹ / ۲.۳ — هم‌ترازی ستون‌های کلکسیون با شکل واقعی فروشگاه
--
-- مشکل
-- -----
-- migration 008 ستون `sku` را اضافه کرد تا mapper تخت بتواند کلکسیون‌ها را
-- بخواند و بنویسد. اما بررسی دقیق نشان داد چند جدول اصلاً ستون‌های لازم را
-- ندارند. برای نمونه `Campaign` در فروشگاه این فیلدها را دارد:
--
--   minPurchase, maxUses, usedCount
--
-- ولی جدول `campaigns` فقط `name, code, discount_type, discount_value,
-- start_date, end_date, active` دارد. یعنی نوشتن mapper روی شکل فعلی یعنی
-- نوشتن mapper ای که سه فیلد را در هر ذخیره‌سازی دور می‌اندازد — دادهٔ مشتری
-- بی‌سروصدا از بین می‌رود. راه درست این است که اول schema هم‌تراز شود.
--
-- تصمیم دربارهٔ ستون‌های از دست رفته
-- ----------------------------------
-- این ستون‌ها nullable اضافه می‌شوند تا جدول‌های موجود بدون از دست دادن داده
-- بمانند و مهاجرت روی پایگاه‌دادهٔ پرشده هم امن باشد.
--
-- چه چیزی عمداً اضافه نمی‌شود
-- ---------------------------
-- * `loyalty_transactions` — فقط‌خواندنی است؛ نوشتن از راه `award_loyalty` انجام
--   می‌شود و RLS نوشتن مستقیم را می‌بندد. mapper سمت کلاینت برایش خواندنی است.
-- * جدول‌های فرزند (`invoice_items`, `key_results`, `content_comments`,
--   `content_assets`, `affiliate_orders`, `affiliate_transactions`) — کلیدشان
--   باید از `uuid` والد بیاید و mapper تخت از پسش برنمی‌آید. برای آن‌ها مسیر
--   جداگانه لازم است.
-- * `brand_book`, `digital_marketing` — تک‌ردیفی‌اند و کلید `key` دارند.
-- ============================================================================

-- ── campaigns: سقف و حداقل خرید ────────────────────────────────────────────
alter table public.campaigns add column if not exists min_purchase bigint not null default 0;
alter table public.campaigns add column if not exists max_uses integer not null default 0;
alter table public.campaigns add column if not exists used_count integer not null default 0;

-- ── suppliers: سبد کالا، مانده و یادداشت ──────────────────────────────────
alter table public.suppliers add column if not exists products text[] not null default '{}';
alter table public.suppliers add column if not exists balance bigint not null default 0;
alter table public.suppliers add column if not exists notes text;

-- ── employees: پورسانت ─────────────────────────────────────────────────────
alter table public.employees add column if not exists commission bigint not null default 0;

-- ── projects (پروژه‌های طراحی سایت): مشتری، مرحله و مبالغ ─────────────────
alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists type text;
alter table public.projects add column if not exists stage text;
alter table public.projects add column if not exists domain text;
alter table public.projects add column if not exists host text;
alter table public.projects add column if not exists total_cost bigint not null default 0;
alter table public.projects add column if not exists paid_amount bigint not null default 0;
alter table public.projects add column if not exists hidden_from_projects boolean not null default false;

-- ── notes: مشخصات مشتری، اولویت، وضعیت و برچسب ────────────────────────────
alter table public.notes add column if not exists customer_name text;
alter table public.notes add column if not exists customer_phone text;
alter table public.notes add column if not exists task text;
alter table public.notes add column if not exists priority text not null default 'medium';
alter table public.notes add column if not exists status text not null default 'pending';
alter table public.notes add column if not exists due_date timestamptz;
alter table public.notes add column if not exists completed_at timestamptz;
alter table public.notes add column if not exists tags text[] not null default '{}';
alter table public.notes add column if not exists content text;

-- ── reviews: نام مشتری ────────────────────────────────────────────────────
-- ستون `name` از قبل هست و نام مشتری را نگه می‌دارد؛ فقط باید در mapper به
-- `customerName` نگاشت شود. ستون تازه لازم نیست.
comment on column public.reviews.name is
  'نام مشتریِ ثبت‌کنندهٔ نظر (نگاشت‌شده به Review.customerName در لایهٔ سرویس)';

-- ── expenses: رسید، روش پرداخت و تأیید ────────────────────────────────────
alter table public.expenses add column if not exists receipt_url text;
alter table public.expenses add column if not exists payment_method text;
alter table public.expenses add column if not exists approved boolean not null default false;

-- ── content_templates: سناریو، تجهیزات و چک‌لیست کیفیت ─────────────────────
-- فیلدهای ساختاریافته در `jsonb` می‌روند (طبق اصل بخش ۳.۱ نقشه).
alter table public.content_templates add column if not exists scenario text not null default '';
alter table public.content_templates add column if not exists equipment text[] not null default '{}';
alter table public.content_templates add column if not exists quality_checklist jsonb;

-- ── content_ideas: رأی، وضعیت و سازنده ────────────────────────────────────
alter table public.content_ideas add column if not exists votes integer not null default 0;
alter table public.content_ideas add column if not exists voted_by text[] not null default '{}';
alter table public.content_ideas add column if not exists status text not null default 'new';
alter table public.content_ideas add column if not exists converted_to_project_id uuid;
alter table public.content_ideas add column if not exists created_by text;

-- ── training_sites: دسته‌بندی ────────────────────────────────────────────
-- جدول تخت است و دسته در ستون متنی می‌ماند؛ گروه‌بندی در UI انجام می‌شود.
comment on column public.training_sites.category is
  'دستهٔ نمایشی سایت آموزشی؛ گروه‌بندی در UI انجام می‌شود نه در schema';