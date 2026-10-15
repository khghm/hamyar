-- 021 — پروژه‌ها را به سفارش مبدأشان وصل می‌کند
--
-- ── مسئله ────────────────────────────────────────────────────────────────
-- `createProjectOrder` در `src/store.tsx` یک پروژهٔ طراحی سایت و یک تسک
-- تولید محتوا ایجاد می‌کند و آن را به سفارش پیوند می‌دهد، ولی این پیوند فقط
-- در حافظهٔ مرورگر می‌ماند. پس از refresh یا باز کردن از تب دیگر،
-- `fetchOrders` سفارش را از دیتابیس می‌آورد اما ستون `project_id` /
-- `content_project_id` آن خالی است (سرور این ستون‌ها را پر نمی‌کند)، در
-- نتیجه sync پروژه ↔ سفارش قطع می‌شود: مرحله/پیشرفت پروژه بعد از
-- تغییر وضعیت سفارش بروزرسانی نمی‌شود و بخش «پروژه‌ها» پروژه‌های تازه
-- را نمایش نمی‌دهد.
--
-- راه: ستون `source_order_id` روی `projects` (و به صورت متقارن
-- `source_project_id` روی `content_projects`) اضافه می‌کنیم تا
-- sync در جهت معکوس هم کار کند — سفارش پروژه را پیدا می‌کند و پروژه
-- سفارش را.
-- =========================================================================

alter table public.projects add column if not exists source_order_id uuid;
alter table public.content_projects add column if not exists source_order_id uuid;

comment on column public.projects.source_order_id is
  'شناسهٔ سفارش آنلاینی که این پروژه را ایجاد کرد (orders.id). برای sync دو طرفهٔ پروژه ↔ سفارش';
comment on column public.content_projects.source_order_id is
  'شناسهٔ سفارش آنلاینی که این تسک تولید محتوا را ایجاد کرد (orders.id)';