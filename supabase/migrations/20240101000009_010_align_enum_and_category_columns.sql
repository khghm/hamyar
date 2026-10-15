-- ============================================================================
-- 010_align_enum_and_category_columns.sql
--
-- فاز ۲.۳ — هم‌ترازی قیدهای مقدار و ستون دستهٔ هزینه
--
-- مشکل
-- -----
-- migration 009 ستون‌های از‌دست‌رفته را اضافه کرد، ولی دو دسته محدودیت روی
-- مقادیر باقی مانده بود که mapper جدید نمی‌توانست رعایتشان کند. هر دو مورد
-- یعنی «هر ذخیره‌سازی یک رکورد، خطای قید» و در نتیجه بی‌صدا از دست رفتن داده:
--
--   1) `content_projects.type`
--      دیتابیس: article, social, video, seo
--      فروشگاه: video, photo, article, social, ad
--      «photo» و «ad» در دیتابیس مجاز نبودند، پس هر پروژهٔ عکاسی یا تبلیغاتی
--      رد می‌شد.
--
--   2) `content_projects.status`
--      دیتابیس: idea, draft, in_progress, review, published, archived
--      فروشگاه: planning, in-progress, review, completed, published
--      «planning» و «completed» مجاز نبودند و «in-progress» با خط تیره نوشته
--      می‌شود در حالی که دیتابیس زیرخط می‌خواهد.
--
--   3) `expenses.category_id`
--      این ستون کلید خارجی به `expense_categories(id)` بود، ولی در فروشگاه
--      `Expense.category` یک برچسب آزاد فارسی است (پیش‌فرض «متفرقه») و
--      جدول `expense_categories` هیچ ردیف اولیه‌ای ندارد. یعنی هر هزینهٔ
--      ثبت‌شده با خطای کلید خارجی رد می‌شد.
--
-- تصمیم
-- ------
-- * برای دو enum محتوا، مقدار قدیمی به معادل فروشگاهی نگاشت و بعد قید دقیقاً
--   روی مجموعهٔ فروشگاه بسته می‌شود. دامنه محدود می‌ماند و دیتابیس همان چیزی
--   را می‌بیند که رابط کاربری می‌بیند.
-- * `category_id` به `category` تبدیل می‌شود: برچسب آزاد. جدول
--   `expense_categories` دست‌نخورده می‌ماند تا مهاجرت برگشت‌پذیر بماند و هیچ
--   چیزی که به آن اشاره می‌کند نشکند.
--
-- چرا این را در schema حل می‌کنیم و نه در mapper
-- --------------------------------------------
-- راه‌حل جایگزین، ترجمهٔ مقدار در mapper بود: «photo» را «article» کنیم،
-- «planning» را «draft» کنیم. این یعنی دو نوع محتوای متفاوت در گزارش‌ها یکی
-- دیده شوند و «تکمیل‌شده» از «منتشرشده» تشخیص داده نشود — دقیقاً همان حذف
-- اطلاعاتی که 009 برای رفعش نوشته شد. وقتی فروشگاه منبع حقیقت است، schema باید
-- با آن هم‌تراز شود.
-- ============================================================================

-- ── content_projects.type ──────────────────────────────────────────────────
-- مقدارهای باقی‌ماندهٔ دیتابیس به معادل فروشگاهی: 'seo' در فروشگاه متناظری
-- ندارد و نزدیک‌ترین معادلش 'article' است.
update public.content_projects set type = 'article' where type = 'seo';

alter table public.content_projects drop constraint if exists content_projects_type_check;
alter table public.content_projects
  add constraint content_projects_type_check
  check (type in ('video','photo','article','social','ad'));

comment on column public.content_projects.type is
  'نوع محتوا؛ مجموعهٔ دقیق مقادیرِ `ContentProject.type` در فروشگاه (video|photo|article|social|ad)';

-- ── content_projects.status ────────────────────────────────────────────────
-- نگاشت مقدارهای باقی‌مانده: نام فارسی در کامنت هر ردیف.
update public.content_projects set status = 'planning' where status in ('idea', 'draft');
update public.content_projects set status = 'in-progress' where status = 'in_progress';
update public.content_projects set status = 'completed' where status = 'archived';

alter table public.content_projects drop constraint if exists content_projects_status_check;
alter table public.content_projects
  add constraint content_projects_status_check
  check (status in ('planning','in-progress','review','completed','published'));

comment on column public.content_projects.status is
  'وضعیت؛ مجموعهٔ دقیق مقادیرِ `ContentProject.status` در فروشگاه (planning|in-progress|review|completed|published)';

-- ── expenses.category_id -> category ───────────────────────────────────────
alter table public.expenses drop constraint if exists expenses_category_id_fkey;

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'expenses' and column_name = 'category_id'
  ) then
    -- نام قدیمی فقط در صورتی نگه داشته می‌شود که ستون `category` از قبل وجود
    -- داشته باشد (اجرای دوبارهٔ مهاجرت)؛ در آن حالت داده‌ها ادغام و قدیمی حذف
    -- می‌شود.
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'expenses' and column_name = 'category'
    ) then
      execute 'update public.expenses set category = coalesce(category, category_id)';
      alter table public.expenses drop column category_id;
    else
      alter table public.expenses rename column category_id to category;
    end if;
  end if;
end $$;

comment on column public.expenses.category is
  'دستهٔ هزینه به‌صورت برچسب آزاد؛ نگاشت‌شده به `Expense.category` در فروشگاه (نه کلید خارجی)';
