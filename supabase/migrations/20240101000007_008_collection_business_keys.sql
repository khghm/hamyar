-- ============================================================================
-- 008_collection_business_keys.sql
--
-- فاز ۱.۱۹ / ۲.۳ — کلید تجاری برای کلکسیون‌های باقی‌مانده
--
-- چرا این مهاجرت لازم است
-- --------------------
-- الگوی لایهٔ سرویس (`src/api/sync.ts`) هر کلکسیون را با یک mapper می‌خواند و
-- می‌نویسد که به یک «کلید تجاری» تکیه می‌کند. کلکسیون‌های دستهٔ اول این کلید را
-- در ستون `sku` دارند و کار می‌کنند. برای بقیهٔ جدول‌ها `sku` وجود ندارد، بنابراین
-- آن‌ها هنوز فقط در localStorage زندگی می‌کنند — یعنی با پاک شدن cache مرورگر
-- از بین می‌روند، بین دستگاه‌ها به اشتراک گذاشته نمی‌شوند و بکاپ سرور آن‌ها را
-- نمی‌بیند.
--
-- چرا یک ستون تازه به‌جای کلید طبیعی
-- -----------------------------------
-- گزینهٔ بدیهی «کلید طبیعی» است (مثلاً `name` یا `url`) و به‌صرفه به نظر می‌رسد،
-- اما این کلیدها هم قابل ویرایش‌اند و هم تکراری مجازند: اگر مدیر دو کمپین با یک
-- نام بسازد، diff-based sync آن دو را یکی می‌بیند و رکورد یکی بی‌صدا پاک می‌شود.
-- `sku` ثابت است، از قبل در شناسهٔ فروشگاهی وجود دارد و پنجاه‌وسه صفحه همان را
-- می‌شناسند، پس هیچ صفحه‌ای نیاز به تغییر ندارد.
--
-- چرا بعضی جدول‌ها در این فهرست نیستند
-- -----------------------------------
-- `CollectionMapper` فقط کلکسیون‌های تخت (تک‌جدولی) را پشتیبانی می‌کند. این سه
-- جدول عمداً اضافه نشده‌اند و به مسیر جداگانه نیاز دارند:
--
--   * `invoice_items`, `key_results`, `content_comments`, `content_assets`,
--     `affiliate_orders`, `affiliate_transactions` — فرزندِ یک رکورد والد هستند
--     و کلیدشان باید از سمت سرور از `uuid` والد گرفته شود؛ mapper تخت این را
--     نمی‌تواند چون فقط یک کلید در اختیار دارد.
--   * `loyalty_transactions` — فقط از طریق تابع `award_loyalty` نوشته می‌شود
--     (RLS عمداً نوشتن مستقیم را می‌بندد)، پس برایش write-through معنا ندارد و
--     فقط مسیر خواندن لازم است.
--   * `brand_book`, `digital_marketing` — تک‌ردیفی‌اند و از قبل کلید `key` دارند.
-- ============================================================================

create table if not exists public._collection_key_migration (
  applied_at timestamptz not null default now()
);

comment on table public._collection_key_migration is
  'نشانهٔ اعمال مهاجرت 008. یک ردیف درج می‌شود تا تاریخچه قابل ممیزی باشد.';

-- کلکسیون‌های تختی که mapper ندارند و به کلید پایدار نیاز دارند.
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
      -- ایندکس یکتا عمداً «جزئی» (partial) نیست.
      --
      -- `syncCollection` در `src/api/sync.ts` با `upsert(..., { onConflict: 'sku' })`
      -- می‌نویسد و PostgREST از آن `ON CONFLICT (sku)` می‌سازد. Postgres برای
      -- استنتاج Arbiter باید قید `WHERE` ایندکس را هم در conflict target داشته
      -- باشد (`ON CONFLICT (sku) WHERE …`) و PostgREST چنین predicate‌ای تولید
      -- نمی‌کند؛ نتیجه خطای 42P10 است و هیچ‌کدام از این کلکسیون‌ها نوشته
      -- نمی‌شوند. ضمناً predicate اصلاً لازم نبود: در Postgres مقادیر NULL در
      -- ایندکس یکتا ذاتاً متمایز شمرده می‌شوند، پس ایندکس کامل هم بی‌نهایت
      -- ردیف `sku IS NULL` را مجاز می‌کند.
      execute format('drop index if exists public.%I', 'idx_' || t || '_sku');
      execute format(
        'create unique index if not exists %I on public.%I (sku)',
        'idx_' || t || '_sku', t);
    end if;
  end loop;
end $$;

insert into public._collection_key_migration default values;