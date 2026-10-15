-- 033_fix_selected_media_update_grant.sql
--
-- مشکل: مشتری وقتی در کالکشن فیلم و سریال فیلمی را برای کپی انتخاب می‌کند،
-- `authStore.selectMedia` فراخوانی می‌شود که `updateSelectedMedia` را صدا می‌زند:
--
--   update profiles set selected_media = $1 where id = auth.uid();
--
-- اما در مایگریشن 006 و 007، مجوز UPDATE روی جدول profiles فقط برای ستون‌های
-- `display_name, phone, birth_date, invited_by` به رول `authenticated` داده شده بود.
-- ستون `selected_media` در این لیست نبود، بنابراین آپدیت با خطای
-- "permission denied for column selected_media" شکست می‌خورد و به‌صورت بی‌صدا
-- در .catch لاگ می‌شد. نتیجه: ادمین در جزئیات مشتری هیچ فیلم منتخبی نمی‌دید.
--
-- راه‌حل: اضافه کردن `selected_media` به لیست ستون‌های قابل آپدیت توسط `authenticated`.
-- این ستون مالک مشتری است (مثل علاقه‌مندی‌ها) و هیچ ریسک امنیتی ندارد چون
-- RLS سطر را به `id = auth.uid()` محدود می‌کند.

revoke update on profiles from anon, authenticated;
grant update (display_name, phone, birth_date, invited_by, selected_media) on profiles to authenticated;
