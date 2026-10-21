-- ============================================================================
-- seed.sql — Seed data extracted from src/store.tsx
-- Business key: the `sku` column carries the original store.tsx id
-- (p1..p62, m1..m50, s1..s61, n1..n8, pf1..pf8, f1..f6, perm1..perm42, role1..role7)
-- so the app can look items up by the ids it already knows.
-- ============================================================================

-- === 1) RBAC permissions (42) — table: permissions ==================
-- `id` is the text business key (perm1..perm42); no sku column on this table.
insert into permissions (id, name, description, module) values
  ('perm1', 'مشاهده سفارشات', 'مشاهده لیست سفارشات', 'سفارشات'),
  ('perm2', 'مدیریت سفارشات', 'ایجاد، ویرایش و حذف سفارشات', 'سفارشات'),
  ('perm3', 'مشاهده مشتریان', 'مشاهده لیست مشتریان', 'مشتریان'),
  ('perm4', 'مدیریت مشتریان', 'ایجاد، ویرایش و حذف مشتریان', 'مشتریان'),
  ('perm5', 'مشاهده محصولات', 'مشاهده لیست محصولات', 'محصولات'),
  ('perm6', 'مدیریت محصولات', 'ایجاد، ویرایش و حذف محصولات', 'محصولات'),
  ('perm7', 'مشاهده مدیا', 'مشاهده لیست فیلم و سریال', 'مدیا'),
  ('perm8', 'مدیریت مدیا', 'ایجاد، ویرایش و حذف مدیا', 'مدیا'),
  ('perm9', 'مشاهده خدمات', 'مشاهده لیست خدمات', 'خدمات'),
  ('perm10', 'مدیریت خدمات', 'ایجاد، ویرایش و حذف خدمات', 'خدمات'),
  ('perm11', 'مشاهده پروژه‌ها', 'مشاهده لیست پروژه‌ها', 'پروژه‌ها'),
  ('perm12', 'مدیریت پروژه‌ها', 'ایجاد، ویرایش و حذف پروژه‌ها', 'پروژه‌ها'),
  ('perm13', 'مشاهده مالی', 'مشاهده گزارشات مالی', 'مالی'),
  ('perm14', 'مدیریت مالی', 'ثبت درآمد و هزینه', 'مالی'),
  ('perm15', 'مشاهده کارمندان', 'مشاهده لیست کارمندان', 'کارمندان'),
  ('perm16', 'مدیریت کارمندان', 'ایجاد، ویرایش و حذف کارمندان', 'کارمندان'),
  ('perm17', 'مشاهده تامین‌کنندگان', 'مشاهده لیست تامین‌کنندگان', 'تامین‌کنندگان'),
  ('perm18', 'مدیریت تامین‌کنندگان', 'ایجاد، ویرایش و حذف تامین‌کنندگان', 'تامین‌کنندگان'),
  ('perm19', 'مشاهده کمپین‌ها', 'مشاهده لیست کمپین‌ها', 'کمپین‌ها'),
  ('perm20', 'مدیریت کمپین‌ها', 'ایجاد، ویرایش و حذف کمپین‌ها', 'کمپین‌ها'),
  ('perm21', 'مشاهده پیامک', 'مشاهده پنل پیامک', 'پیامک'),
  ('perm22', 'ارسال پیامک', 'ارسال پیامک انبوه', 'پیامک'),
  ('perm23', 'مشاهده نظرات', 'مشاهده نظرات کاربران', 'نظرات'),
  ('perm24', 'مدیریت نظرات', 'تایید و حذف نظرات', 'نظرات'),
  ('perm25', 'مشاهده FAQ', 'مشاهده سوالات متداول', 'FAQ'),
  ('perm26', 'مدیریت FAQ', 'ایجاد، ویرایش و حذف FAQ', 'FAQ'),
  ('perm27', 'مشاهده تیم محتوا', 'مشاهده پروژه‌های تولید محتوا', 'تیم محتوا'),
  ('perm28', 'مدیریت تیم محتوا', 'ایجاد، ویرایش و حذف پروژه‌های محتوا', 'تیم محتوا'),
  ('perm29', 'مشاهده دعوت‌ها', 'مشاهده کدهای دعوت', 'دعوت‌ها'),
  ('perm30', 'مشاهده تنظیمات', 'مشاهده تنظیمات سایت', 'تنظیمات'),
  ('perm31', 'مدیریت تنظیمات', 'ویرایش تنظیمات سایت', 'تنظیمات'),
  ('perm32', 'مشاهده لاگ فعالیت', 'مشاهده لاگ فعالیت‌ها', 'لاگ'),
  ('perm33', 'پشتیبان‌گیری', 'ایجاد و بازیابی بکاپ', 'بکاپ'),
  ('perm34', 'مشاهده تحلیل', 'مشاهده داشبورد تحلیلی', 'تحلیل'),
  ('perm35', 'مدیریت نقش‌ها', 'ایجاد و ویرایش نقش‌ها و دسترسی‌ها', 'RBAC'),
  ('perm36', 'مشاهده همکاران', 'مشاهده لیست همکاران', 'همکاران'),
  ('perm37', 'مدیریت همکاران', 'ایجاد، ویرایش و حذف همکاران', 'همکاران'),
  ('perm38', 'مشاهده سفارشات همکار', 'مشاهده سفارشات ارجاعی همکاران', 'همکاران'),
  ('perm39', 'مدیریت کیف پول', 'مدیریت تراکنش‌های کیف پول همکاران', 'همکاران'),
  ('perm40', 'گزارش‌های همکاران', 'مشاهده گزارش‌های عملکرد همکاران', 'همکاران'),
  ('perm41', 'مشاهده تیکت‌ها', 'مشاهده تیکت‌های پشتیبانی مشتریان', 'پشتیبانی'),
  ('perm42', 'مدیریت تیکت‌ها', 'پاسخ‌دهی، تغییر وضعیت و اولویت تیکت‌ها', 'پشتیبانی');
  -- `perm43` («مدیریت باشگاه مشتریان») عمداً اینجا نیست: مهاجرت
  -- 014_gamification_settings_policies آن را درج می‌کند. دلیلش این است که seed فقط
  -- در راه‌اندازی اولیه اجرا می‌شود و دیتابیسِ از قبل استقراریافته با مهاجرت به آن
  -- می‌رسد نه با seed — پس مجوز باید در مهاجرت باشد تا آنجا هم دیده شود.
  -- درجش در هر دو جا، هنگام `db reset` خطای تکراریِ کلید اصلی می‌داد.

-- === 2) RBAC roles (7) — table: roles ==============================
-- `roles` has a uuid id and no sku column; roles are looked up by their unique
-- `name`. role1 (مدیر کل) keeps all 43 permission ids; the rest mirror store.tsx.
insert into roles (name, description, permissions, is_default) values
  ('مدیر کل', 'دسترسی کامل به تمام بخش‌ها', ARRAY['perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm7', 'perm8', 'perm9', 'perm10', 'perm11', 'perm12', 'perm13', 'perm14', 'perm15', 'perm16', 'perm17', 'perm18', 'perm19', 'perm20', 'perm21', 'perm22', 'perm23', 'perm24', 'perm25', 'perm26', 'perm27', 'perm28', 'perm29', 'perm30', 'perm31', 'perm32', 'perm33', 'perm34', 'perm35', 'perm36', 'perm37', 'perm38', 'perm39', 'perm40', 'perm41', 'perm42', 'perm43']::text[], false),
  ('مدیر فروش', 'دسترسی به سفارشات، محصولات، مشتریان و گزارشات فروش', ARRAY['perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm13', 'perm34']::text[], false),
  ('اپراتور خدمات', 'دسترسی به سفارشات و خدمات کافی‌نت', ARRAY['perm1', 'perm2', 'perm9', 'perm10']::text[], false),
  ('مدیر محتوا', 'دسترسی به مدیا، تیم محتوا و نظرات', ARRAY['perm7', 'perm8', 'perm23', 'perm24', 'perm27', 'perm28']::text[], false),
  ('حسابدار', 'دسترسی به بخش مالی و گزارشات', ARRAY['perm13', 'perm14', 'perm34']::text[], false),
  ('همکار', 'دسترسی به پنل همکاران و مشاهده پورسانت‌ها', ARRAY['perm36', 'perm38']::text[], false),
  ('کارشناس پشتیبانی', 'پاسخ‌دهی و رسیدگی به تیکت‌های مشتریان', ARRAY['perm41', 'perm42', 'perm1', 'perm21']::text[], false);

-- === 3) Products (62: p1..p62) — table: products ===================
-- Images for p37..p62 are external unsplash URLs and are kept as-is.
insert into products (sku, name, brand, category, price, original_price, stock,
                      image, description, barcode, warranty, alert_threshold,
                      last_restocked, supplier) values
  ('p1', 'فلش مموری ۳۲ گیگابایت', 'Samsung', 'flash', 250000, 300000, 45, '/images/7fc006a3-8c36-4ae3-860f-97820566db79.png', 'فلش مموری سامسونگ ۳۲ گیگابایت USB 3.0', null, null, null, null, null),
  ('p2', 'فلش مموری ۶۴ گیگابایت', 'Kingston', 'flash', 380000, null, 30, '/images/7fc006a3-8c36-4ae3-860f-97820566db79.png', 'فلش مموری کینگستون ۶۴ گیگابایت', null, null, null, null, null),
  ('p3', 'فلش مموری ۱۲۸ گیگابایت', 'SanDisk', 'flash', 650000, 720000, 20, '/images/7fc006a3-8c36-4ae3-860f-97820566db79.png', 'فلش مموری سندیسک ۱۲۸ گیگابایت USB 3.1', null, null, null, null, null),
  ('p4', 'هارد اکسترنال ۱ ترابایت', 'WD', 'hard', 3200000, null, 15, '/images/060413c7-f31e-4aea-9840-7038a06e5c62.png', 'هارد اکسترنال وسترن دیجیتال ۱ ترابایت', null, null, null, null, null),
  ('p5', 'هارد اکسترنال ۲ ترابایت', 'Seagate', 'hard', 4800000, 5200000, 10, '/images/060413c7-f31e-4aea-9840-7038a06e5c62.png', 'هارد اکسترنال سیگیت ۲ ترابایت', null, null, null, null, null),
  ('p6', 'کابل USB تایپ سی', 'Baseus', 'cable', 85000, null, 100, '/images/products/cable1.jpg', 'کابل شارژ تایپ سی باسئوس ۱ متری', null, null, null, null, null),
  ('p7', 'کابل HDMI ۲ متری', 'Green', 'cable', 120000, null, 60, '/images/products/cable2.jpg', 'کابل HDMI نسخه ۲.۱ گرین', null, null, null, null, null),
  ('p8', 'کابل AUX ۱.۵ متری', 'McDodo', 'cable', 65000, null, 80, '/images/products/cable3.jpg', 'کابل AUX مک دودو با کیفیت بالا', null, null, null, null, null),
  ('p9', 'شارژر دیواری ۲۵ وات', 'Samsung', 'charger', 450000, 520000, 25, '/images/99f37013-fa3d-4a99-8f0e-4d246d01dbae.png', 'شارژر سریع سامسونگ ۲۵ وات', null, null, null, null, null),
  ('p10', 'شارژر فست شارژ ۳۳ وات', 'Xiaomi', 'charger', 380000, null, 35, '/images/products/charger2.jpg', 'شارژر فست شارژ شیائومی ۳۳ وات', null, null, null, null, null),
  ('p11', 'پاوربانک ۱۰۰۰۰ میلی‌آمپر', 'Anker', 'charger', 890000, null, 18, '/images/products/charger3.jpg', 'پاوربانک انکر ۱۰۰۰۰ میلی‌آمپر ساعت', null, null, null, null, null),
  ('p12', 'دوربین مداربسته تحت شبکه', 'Dahua', 'cctv', 2800000, null, 8, '/images/a6f663cb-add1-449e-8288-4cb67b7578be.png', 'دوربین مداربسته ۲ مگاپیکسل داهوا', null, null, null, null, null),
  ('p13', 'دوربین مداربسته ۴ مگاپیکسل', 'Hikvision', 'cctv', 3500000, 3900000, 6, '/images/products/cctv2.jpg', 'دوربین مداربسته هایک‌ویژن ۴ مگاپیکسل', null, null, null, null, null),
  ('p14', 'دستگاه DVR ۸ کانال', 'Dahua', 'cctv', 4200000, null, 5, '/images/products/cctv3.jpg', 'دستگاه ضبط ۸ کانال داهوا', null, null, null, null, null),
  ('p15', 'دستگاه کارتخوان سیار', 'PAX', 'pos', 8500000, null, 3, '/images/products/pos1.jpg', 'دستگاه پوز سیار PAX با اتصال WiFi', null, null, null, null, null),
  ('p16', 'دستگاه کارتخوان ثابت', 'Verifone', 'pos', 6500000, null, 4, '/images/products/pos2.jpg', 'دستگاه پوز ثابت وریفون', null, null, null, null, null),
  ('p17', 'موس بی‌سیم', 'Logitech', 'accessories', 350000, null, 22, '/images/products/mouse1.jpg', 'موس بی‌سیم لاجیتک', null, null, null, null, null),
  ('p18', 'کیبورد سیم‌دار', 'Green', 'accessories', 280000, null, 30, '/images/products/keyboard1.jpg', 'کیبورد سیم‌دار گرین', null, null, null, null, null),
  ('p19', 'هاب USB ۴ پورت', 'Baseus', 'accessories', 195000, null, 40, '/images/products/hub1.jpg', 'هاب USB ۳.۰ باسئوس ۴ پورت', null, null, null, null, null),
  ('p20', 'رم ریدر چندکاره', 'Kingston', 'accessories', 145000, null, 50, '/images/products/reader1.jpg', 'رم ریدر کینگستون چندکاره', null, null, null, null, null),
  ('p21', 'اس اس دی ۲۴۰ گیگابایت', 'Samsung', 'storage', 1800000, null, 12, '/images/products/ssd1.jpg', 'حافظه SSD سامسونگ ۲۴۰ گیگابایت', null, null, null, null, null),
  ('p22', 'اس اس دی ۴۸۰ گیگابایت', 'WD', 'storage', 2900000, 3200000, 8, '/images/products/ssd2.jpg', 'حافظه SSD وسترن دیجیتال ۴۸۰ گیگابایت', null, null, null, null, null),
  ('p23', 'رم DDR4 ۸ گیگابایت', 'Corsair', 'storage', 1200000, null, 15, '/images/products/ram1.jpg', 'رم ۸ گیگابایت DDR4 کورسیر', null, null, null, null, null),
  ('p24', 'هدفون بلوتوثی', 'JBL', 'audio', 1500000, null, 14, '/images/c9058f54-8f08-42e9-a6d9-490454530453.png', 'هدفون بلوتوثی JBL', null, null, null, null, null),
  ('p25', 'اسپیکر بلوتوثی', 'Xiaomi', 'audio', 680000, null, 20, '/images/products/speaker1.jpg', 'اسپیکر بلوتوثی قابل حمل شیائومی', null, null, null, null, null),
  ('p26', 'وبکم HD', 'Logitech', 'accessories', 950000, null, 10, '/images/products/webcam1.jpg', 'وبکم لاجیتک Full HD', null, null, null, null, null),
  ('p27', 'محافظ صفحه نمایش', 'Generic', 'accessories', 45000, null, 200, '/images/products/screen1.jpg', 'محافظ صفحه نمایش لپ‌تاپ ۱۵.۶ اینچ', null, null, null, null, null),
  ('p28', 'تبدیل USB به Type-C', 'Baseus', 'cable', 55000, null, 90, '/images/products/adapter1.jpg', 'تبدیل USB به Type-C باسئوس', null, null, null, null, null),
  ('p29', 'فلش مموری OTG', 'SanDisk', 'flash', 420000, null, 25, '/images/products/flash4.jpg', 'فلش مموری OTG سندیسک دوگانه', null, null, null, null, null),
  ('p30', 'کابل لایتنینگ', 'Apple', 'cable', 180000, null, 45, '/images/products/cable4.jpg', 'کابل لایتنینگ اورجینال اپل ۱ متری', null, null, null, null, null),
  ('p31', 'استند لپ‌تاپ', 'Baseus', 'accessories', 320000, null, 16, '/images/34eb17df-2c41-474c-9326-5fad86c9b505.png', 'استند آلومینیومی لپ‌تاپ باسئوس', null, null, null, null, null),
  ('p32', 'چراغ مطالعه LED', 'Xiaomi', 'accessories', 450000, null, 12, '/images/34eb17df-2c41-474c-9326-5fad86c9b505.png', 'چراغ مطالعه LED شیائومی با تنظیم نور', null, null, null, null, null),
  ('p33', 'اسپیکر بلوتوثی قابل حمل', 'JBL', 'audio', 1200000, 1400000, 18, '/images/241decc8-b315-4c8d-8cb6-1ed07bd02ef4.png', 'اسپیکر بلوتوثی JBL قابل حمل با کیفیت صدای عالی', null, null, null, null, null),
  ('p34', 'دستگاه DVR ۸ کانال', 'Dahua', 'cctv', 4200000, null, 7, '/images/2cea3915-eb18-4369-8905-d9e3321c0087.png', 'دستگاه ضبط ۸ کانال داهوا با کیفیت Full HD', null, null, null, null, null),
  ('p35', 'دستگاه کارتخوان سیار', 'PAX', 'pos', 8500000, null, 4, '/images/fdb618d2-8785-4a8d-8d3a-6c56588a6aa4.png', 'دستگاه پوز سیار PAX با اتصال WiFi و سیم‌کارت', null, null, null, null, null),
  ('p36', 'کیبورد مکانیکال گیمینگ', 'Razer', 'accessories', 2800000, 3200000, 10, '/images/34eb17df-2c41-474c-9326-5fad86c9b505.png', 'کیبورد مکانیکال ریزر با نورپردازی RGB', null, null, null, null, null),
  ('p37', 'موس گیمینگ بی‌سیم', 'Logitech', 'accessories', 1800000, null, 15, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 'موس گیمینگ لاجیتک با دقت بالا', null, null, null, null, null),
  ('p38', 'هاب USB ۷ پورت', 'Anker', 'accessories', 450000, null, 25, 'https://images.unsplash.com/photo-1625842268584-8f32a6f4b4cb?w=400', 'هاب USB ۳.۰ انکر ۷ پورت با شارژر', null, null, null, null, null),
  ('p39', 'کابل شبکه Cat6', 'D-Link', 'cable', 35000, null, 200, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'کابل شبکه Cat6 دیلینک ۳ متری', null, null, null, null, null),
  ('p40', 'تبدیل HDMI به VGA', 'Green', 'cable', 95000, null, 40, 'https://images.unsplash.com/photo-1588508065123-287b3a0b7909?w=400', 'تبدیل HDMI به VGA گرین با کیفیت بالا', null, null, null, null, null),
  ('p41', 'فلش مموری ۲۵۶ گیگابایت', 'SanDisk', 'flash', 1200000, 1400000, 12, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400', 'فلش مموری سندیسک ۲۵۶ گیگابایت USB 3.1', null, null, null, null, null),
  ('p42', 'هارد SSD ۱ ترابایت', 'Samsung', 'storage', 4500000, null, 8, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', 'حافظه SSD سامسونگ ۱ ترابایت NVMe', null, null, null, null, null),
  ('p43', 'رم DDR4 ۱۶ گیگابایت', 'Corsair', 'storage', 2400000, 2800000, 10, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400', 'رم ۱۶ گیگابایت DDR4 کورسیر RGB', null, null, null, null, null),
  ('p44', 'هدفون گیمینگ', 'HyperX', 'audio', 2200000, null, 12, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', 'هدفون گیمینگ هایپراکس با میکروفون', null, null, null, null, null),
  ('p45', 'وبکم ۴K', 'Logitech', 'accessories', 3500000, null, 6, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400', 'وبکم لاجیتک ۴K با autofocus', null, null, null, null, null),
  ('p46', 'پد موس گیمینگ', 'SteelSeries', 'accessories', 280000, null, 30, 'https://images.unsplash.com/photo-161575921A906-a3a1a1a1a1a1?w=400', 'پد موس بزرگ استیل‌سریز گیمینگ', null, null, null, null, null),
  ('p47', 'شارژر وایرلس', 'Samsung', 'charger', 650000, 750000, 20, 'https://images.unsplash.com/photo-1586953208448-b95a79798f08?w=400', 'شارژر بی‌سیم سریع سامسونگ ۱۵ وات', null, null, null, null, null),
  ('p48', 'کابل Type-C به Type-C', 'Anker', 'cable', 120000, null, 80, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', 'کابل تایپ سی به تایپ سی انکر ۱ متری', null, null, null, null, null),
  ('p49', 'دوربین اکشن', 'GoPro', 'accessories', 12000000, null, 3, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', 'دوربین اکشن گوپرو HERO 11', null, null, null, null, null),
  ('p50', 'تریپاد دوربین', 'Manfrotto', 'accessories', 1800000, null, 8, 'https://images.unsplash.com/photo-1606986628253-49a2b4a7a1a1?w=400', 'تریپاد حرفه‌ای مانفراتو', null, null, null, null, null),
  ('p51', 'فیلتر لنز UV', 'Hoya', 'accessories', 450000, null, 15, 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400', 'فیلتر UV هویا برای لنز دوربین', null, null, null, null, null),
  ('p52', 'کارت حافظه microSD ۱۲۸GB', 'SanDisk', 'storage', 380000, null, 35, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', 'کارت حافظه میکرو SD سندیسک ۱۲۸ گیگابایت', null, null, null, null, null),
  ('p53', 'هاب Type-C چندکاره', 'Baseus', 'accessories', 680000, 780000, 18, 'https://images.unsplash.com/photo-1625842268584-8f32a6f4b4cb?w=400', 'هاب تایپ سی باسئوس با HDMI و USB', null, null, null, null, null),
  ('p54', 'اسپیکر کامپیوتر', 'Logitech', 'audio', 850000, null, 14, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', 'اسپیکر رومیزی لاجیتک ۲.۰', null, null, null, null, null),
  ('p55', 'میکروفون USB', 'Blue', 'audio', 3200000, null, 7, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400', 'میکروفون USB بلو یتدیگی برای استریم', null, null, null, null, null),
  ('p56', 'کیبورد بی‌سیم', 'Logitech', 'accessories', 1500000, null, 12, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 'کیبورد بی‌سیم لاجیتک با تاچ‌پد', null, null, null, null, null),
  ('p57', 'محافظ برق', 'APC', 'accessories', 950000, null, 10, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'محافظ برق APC ۶ خروجی', null, null, null, null, null),
  ('p58', 'کابل AUX ۳ متری', 'McDodo', 'cable', 85000, null, 60, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', 'کابل AUX مک دودو ۳ متری با کیفیت بالا', null, null, null, null, null),
  ('p59', 'پاوربانک ۲۰۰۰۰ میلی‌آمپر', 'Anker', 'charger', 1600000, 1800000, 15, 'https://images.unsplash.com/photo-1609592424808-d9f3f66f3a1a1?w=400', 'پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر با فست شارژ', null, null, null, null, null),
  ('p60', 'هارد SSD اکسترنال ۵۰۰GB', 'Samsung', 'storage', 3800000, null, 9, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400', 'هارد SSD اکسترنال سامسونگ ۵۰۰ گیگابایت', null, null, null, null, null),
  ('p61', 'دوربین تحت شبکه PTZ', 'Hikvision', 'cctv', 5500000, null, 5, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'دوربین مداربسته PTZ هایک‌ویژن با زوم ۲۵ برابر', null, null, null, null, null),
  ('p62', 'دستگاه کارتخوان ثابت', 'Verifone', 'pos', 6500000, null, 4, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', 'دستگاه پوز ثابت وریفون با چاپگر', null, null, null, null, null);

-- === 4) Media items (50: m1..m50) — table: media_items =============
insert into media_items (sku, title, year, genre, type, quality, language,
                          subtitle, volume, rating, image, description, director,
                          country, imdb) values
  ('m1', 'Oppenheimer', 2023, ARRAY['درام', 'تاریخی']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '12GB', 8.9, 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Oppenheimer_2023_film_poster.jpg', 'داستان زندگی جی. رابرت اوپنهایمر و نقش او در ساخت بمب اتمی', 'Christopher Nolan', 'آمریکا', 8.9),
  ('m2', 'The Shawshank Redemption', 1994, ARRAY['درام']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '8GB', 9.3, 'https://upload.wikimedia.org/wikipedia/commons/5/5c/The_Shawshank_Redemption_Poster.jpg', 'داستان امید و رستگاری در زندان', 'Frank Darabont', 'آمریکا', 9.3),
  ('m3', 'Inception', 2010, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '18GB', 8.8, 'https://upload.wikimedia.org/wikipedia/commons/3/36/Inception_2010_Theatrical_Poster.jpg', 'دزدی اسرار از طریق ورود به رویا', 'Christopher Nolan', 'آمریکا', 8.8),
  ('m4', 'Breaking Bad', 2008, ARRAY['درام', 'جنایی']::text[], 'series', 'BluRay', 'انگلیسی', 'فارسی', '120GB', 9.5, 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Breaking_Bad_title_card.png', 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', null, null, 9.5),
  ('m5', 'Game of Thrones', 2011, ARRAY['فانتزی', 'درام']::text[], 'series', '4K', 'انگلیسی', 'فارسی', '250GB', 9.2, 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Game_of_Thrones_Logo.svg', 'نبرد خاندان‌های بزرگ بر سر تاج و تخت', null, null, 9.2),
  ('m6', 'Spider-Man: Across the Spider-Verse', 2023, ARRAY['انیمیشن', 'اکشن']::text[], 'animation', '4K', 'انگلیسی', 'فارسی', '15GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/9/90/Spider-Man_Across_the_Spider-Verse_poster.jpg', 'ادامه ماجراجویی‌های مرد عنکبوتی در جهان‌های موازی', null, null, 8.7),
  ('m7', 'Attack on Titan', 2013, ARRAY['اکشن', 'فانتزی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '80GB', 9, 'https://upload.wikimedia.org/wikipedia/commons/7/78/Attack_on_Titan_logo.png', 'انسان‌ها در نبرد با تایتان‌ها برای بقا', null, null, 9),
  ('m8', 'Death Note', 2006, ARRAY['جنایی', 'فراطبیعی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '45GB', 9, 'https://upload.wikimedia.org/wikipedia/commons/3/39/Death_Note_logo.png', 'دانش‌آموزی که با دفترچه مرگ، عدالت را اجرا می‌کند', null, null, 9),
  ('m9', 'Interstellar', 2014, ARRAY['علمی‌تخیلی', 'درام']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '20GB', 8.6, 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Interstellar_film_poster.jpg', 'سفر به فضا برای نجات بشریت', 'Christopher Nolan', 'آمریکا', 8.6),
  ('m10', 'The Dark Knight', 2008, ARRAY['اکشن', 'جنایی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '16GB', 9, 'https://upload.wikimedia.org/wikipedia/commons/8/83/The_Dark_Knight_%282008%29_theatrical_poster.jpg', 'بتمن در نبرد با جوکر', 'Christopher Nolan', 'آمریکا', 9),
  ('m11', 'Stranger Things', 2016, ARRAY['علمی‌تخیلی', 'ترسناک']::text[], 'series', '4K', 'انگلیسی', 'فارسی', '180GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Stranger_Things_logo.png', 'ماجراهای کودکان در شهری با اسرار فراطبیعی', null, null, 8.7),
  ('m12', 'Your Name', 2016, ARRAY['انیمیشن', 'عاشقانه']::text[], 'animation', 'BluRay', 'ژاپنی', 'فارسی', '8GB', 8.4, 'https://upload.wikimedia.org/wikipedia/commons/2/27/Your_Name_poster.jpg', 'داستان دو نوجوان که به طرز مرموزی جایشان عوض می‌شود', null, null, 8.4),
  ('m13', 'Demon Slayer', 2019, ARRAY['اکشن', 'فانتزی']::text[], 'anime', '4K', 'ژاپنی', 'فارسی', '60GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Demon_Slayer_Kimetsu_no_Yaiba_anime_logo.png', 'جنگجو جوان در نبرد با شیاطین', null, null, 8.7),
  ('m14', 'The Matrix', 1999, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '10GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/c/c1/The_Matrix_%281999%29_theatrical_release_poster.jpg', 'واقعیت مجازی و نبرد برای آزادی', null, null, 8.7),
  ('m15', 'One Piece', 1999, ARRAY['ماجراجویی', 'کمدی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '200GB', 8.9, 'https://upload.wikimedia.org/wikipedia/commons/0/09/One_Piece_Logo.png', 'ماجراجویی دزدان دریایی در جستجوی گنج', null, null, 8.9),
  ('m16', 'Coco', 2017, ARRAY['انیمیشن', 'خانوادگی']::text[], 'animation', '4K', 'انگلیسی', 'فارسی', '9GB', 8.4, 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Coco_2017_poster.jpg', 'سفر پسری به سرزمین مردگان', null, null, 8.4),
  ('m17', 'Jujutsu Kaisen', 2020, ARRAY['اکشن', 'فراطبیعی']::text[], 'anime', '4K', 'ژاپنی', 'فارسی', '50GB', 8.6, 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Jujutsu_Kaisen_logo.png', 'نبرد با نفرین‌ها و ارواح شیطانی', null, null, 8.6),
  ('m18', 'The Lion King', 2019, ARRAY['انیمیشن', 'خانوادگی']::text[], 'animation', '4K', 'انگلیسی', 'فارسی', '11GB', 6.9, 'https://upload.wikimedia.org/wikipedia/commons/1/1c/The_Lion_King_2019_poster.jpg', 'داستان شیر جوانی که باید پادشاه شود', null, null, 6.9),
  ('m19', 'Money Heist', 2017, ARRAY['اکشن', 'جنایی']::text[], 'series', 'BluRay', 'اسپانیایی', 'فارسی', '90GB', 8.2, 'https://upload.wikimedia.org/wikipedia/commons/4/45/Money_Heist_logo.png', 'سرقت بزرگ از ضرابخانه سلطنتی اسپانیا', null, null, 8.2),
  ('m20', 'Naruto Shippuden', 2007, ARRAY['اکشن', 'ماجراجویی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '180GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Naruto_Shippuuden_logo.png', 'ادامه ماجراجویی نینجای جوان', null, null, 8.7),
  ('m21', 'Dune: Part Two', 2024, ARRAY['علمی‌تخیلی', 'ماجراجویی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '22GB', 8.5, '/images/21475036-63df-412d-bc73-7925aee2e6ad.png', 'ادامه حماسه پل آتریدز در سیاره آراکیس', 'Denis Villeneuve', 'آمریکا', 8.5),
  ('m22', 'The Godfather', 1972, ARRAY['جنایی', 'درام']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '9GB', 9.2, 'https://upload.wikimedia.org/wikipedia/commons/1/18/The_Godfather_1972_poster.jpg', 'داستان خانواده مافیایی کورلئونه', 'Francis Ford Coppola', 'آمریکا', 9.2),
  ('m23', 'Pulp Fiction', 1994, ARRAY['جنایی', 'درام']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '8GB', 8.9, 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Pulp_Fiction_%281994%29_theatrical_poster.jpg', 'داستان‌های متقاطع از زندگی جنایتکاران', 'Quentin Tarantino', 'آمریکا', 8.9),
  ('m24', 'Fight Club', 1999, ARRAY['درام']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '9GB', 8.8, 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Fight_Club_%281999_film%29_poster.jpg', 'مردی که باشگاه مشت‌زنی ایجاد می‌کند', 'David Fincher', 'آمریکا', 8.8),
  ('m25', 'Forrest Gump', 1994, ARRAY['درام', 'عاشقانه']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '10GB', 8.8, '/images/6f011290-22da-4dbd-be33-08b0148c39b0.png', 'داستان مردی ساده‌دل که در رویدادهای تاریخی شرکت می‌کند', 'Robert Zemeckis', 'آمریکا', 8.8),
  ('m26', 'The Lord of the Rings', 2001, ARRAY['فانتزی', 'ماجراجویی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '25GB', 8.8, 'https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Lord_of_the_Rings_-_The_Fellowship_of_the_Ring_%282001%29_theatrical_poster.jpg', 'سفر فرودو برای نابودی حلقه', 'Peter Jackson', 'نیوزیلند', 8.8),
  ('m27', 'The Avengers', 2012, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '14GB', 8, 'https://upload.wikimedia.org/wikipedia/commons/f/f6/The_Avengers_%282012_film%29_poster.jpg', 'تیم انتقام‌جویان در نبرد با لوکی', 'Joss Whedon', 'آمریکا', 8),
  ('m28', 'Joker', 2019, ARRAY['درام', 'جنایی']::text[], 'movie', '4K', 'انگلیسی', 'فارسی', '12GB', 8.4, 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Joker_2019_poster.jpg', 'داستان تبدیل شدن آرتور فلک به جوکر', 'Todd Phillips', 'آمریکا', 8.4),
  ('m29', 'Parasite', 2019, ARRAY['درام', 'کمدی']::text[], 'movie', 'BluRay', 'کره‌ای', 'فارسی', '10GB', 8.5, 'https://upload.wikimedia.org/wikipedia/commons/5/53/Parasite_%282019_film%29_poster.png', 'داستان دو خانواده از طبقات مختلف', 'Bong Joon-ho', 'کره جنوبی', 8.5),
  ('m30', 'Whiplash', 2014, ARRAY['درام', 'موسیقی']::text[], 'movie', 'BluRay', 'انگلیسی', 'فارسی', '7GB', 8.5, 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Whiplash_2014_poster.jpg', 'داستان یک درامر جوان و استاد سختگیرش', 'Damien Chazelle', 'آمریکا', 8.5),
  ('m31', 'Breaking Bad', 2008, ARRAY['درام', 'جنایی']::text[], 'series', '4K', 'انگلیسی', 'فارسی', '150GB', 9.5, 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Breaking_Bad_title_card.png', 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', null, null, 9.5),
  ('m32', 'The Office', 2005, ARRAY['کمدی']::text[], 'series', 'BluRay', 'انگلیسی', 'فارسی', '120GB', 9, 'https://upload.wikimedia.org/wikipedia/commons/1/1e/The_Office_US_logo.png', 'کمدی موقعیت در یک دفتر کار', null, null, 9),
  ('m33', 'Friends', 1994, ARRAY['کمدی', 'عاشقانه']::text[], 'series', 'BluRay', 'انگلیسی', 'فارسی', '140GB', 8.9, 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Friends_logo.png', 'داستان شش دوست در نیویورک', null, null, 8.9),
  ('m34', 'The Witcher', 2019, ARRAY['فانتزی', 'اکشن']::text[], 'series', '4K', 'انگلیسی', 'فارسی', '100GB', 8.2, 'https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Witcher_logo.png', 'ماجراهای یک شکارچی هیولا', null, null, 8.2),
  ('m35', 'Peaky Blinders', 2013, ARRAY['جنایی', 'درام']::text[], 'series', 'BluRay', 'انگلیسی', 'فارسی', '90GB', 8.8, 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Peaky_Blinders_logo.png', 'داستان یک خانواده گنگستر در بیرمنگام', null, null, 8.8),
  ('m36', 'Spirited Away', 2001, ARRAY['انیمیشن', 'فانتزی']::text[], 'animation', 'BluRay', 'ژاپنی', 'فارسی', '7GB', 8.6, 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Spirited_Away_poster.jpg', 'سفر دختری به سرزمین ارواح', 'Hayao Miyazaki', 'ژاپن', 8.6),
  ('m37', 'Toy Story', 1995, ARRAY['انیمیشن', 'خانوادگی']::text[], 'animation', 'BluRay', 'انگلیسی', 'فارسی', '5GB', 8.3, 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Toy_Story_%281995%29_theatrical_poster.jpg', 'ماجراجویی اسباب‌بازی‌ها', 'John Lasseter', 'آمریکا', 8.3),
  ('m38', 'Frozen', 2013, ARRAY['انیمیشن', 'خانوادگی']::text[], 'animation', '4K', 'انگلیسی', 'فارسی', '8GB', 7.4, 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Frozen_%282013_film%29_poster.jpg', 'داستان دو خواهر با قدرت‌های جادویی', null, null, 7.4),
  ('m39', 'Zootopia', 2016, ARRAY['انیمیشن', 'کمدی']::text[], 'animation', '4K', 'انگلیسی', 'فارسی', '7GB', 8, 'https://upload.wikimedia.org/wikipedia/commons/0/05/Zootopia_poster.jpg', 'ماجراجویی یک خرگوش پلیس در شهری از حیوانات', null, null, 8),
  ('m40', 'Fullmetal Alchemist', 2003, ARRAY['اکشن', 'فانتزی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '70GB', 8.5, '/images/1fc6fd82-0b3d-4ba2-976c-9ff066376c33.png', 'دو برادر در جستجوی سنگ جادو', null, null, 8.5),
  ('m41', 'Dragon Ball Z', 1989, ARRAY['اکشن', 'ماجراجویی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '150GB', 8.8, 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Dragon_Ball_Z_logo.png', 'ماجراهای گوکو و دوستانش', null, null, 8.8),
  ('m42', 'Bleach', 2004, ARRAY['اکشن', 'فراطبیعی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '140GB', 8.2, 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bleach_logo.png', 'دانش‌آموزی که قدرت شینیگامی به دست می‌آورد', null, null, 8.2),
  ('m43', 'My Hero Academia', 2016, ARRAY['اکشن', 'فانتزی']::text[], 'anime', '4K', 'ژاپنی', 'فارسی', '60GB', 8.4, 'https://upload.wikimedia.org/wikipedia/commons/6/6a/My_Hero_Academia_logo.png', 'پسری بدون قدرت در دنیایی از ابرقهرمانان', null, null, 8.4),
  ('m44', 'One Punch Man', 2015, ARRAY['اکشن', 'کمدی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '40GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/7/7e/One_Punch_Man_logo.png', 'قهرمانی که با یک مشت دشمنان را شکست می‌دهد', null, null, 8.7),
  ('m45', 'Tokyo Ghoul', 2014, ARRAY['اکشن', 'ترسناک']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '45GB', 7.8, 'https://upload.wikimedia.org/wikipedia/commons/7/74/Tokyo_Ghoul_logo.png', 'دانشجویی که به نیمه غول تبدیل می‌شود', null, null, 7.8),
  ('m46', 'Sword Art Online', 2012, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '50GB', 7.5, 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Sword_Art_Online_logo.png', 'بازیکنانی که در یک بازی آنلاین گیر افتاده‌اند', null, null, 7.5),
  ('m47', 'Hunter x Hunter', 2011, ARRAY['اکشن', 'ماجراجویی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '130GB', 9, 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Hunter_x_Hunter_logo.png', 'ماجراجویی یک شکارچی جوان', null, null, 9),
  ('m48', 'Steins;Gate', 2011, ARRAY['علمی‌تخیلی', 'درام']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '35GB', 9.1, 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Steins_Gate_logo.png', 'داستان سفر در زمان و پیامدهای آن', null, null, 9.1),
  ('m49', 'Code Geass', 2006, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '55GB', 8.7, 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Code_Geass_logo.png', 'پسری با قدرت کنترل ذهن در نبرد علیه امپراتوری', null, null, 8.7),
  ('m50', 'Cowboy Bebop', 1998, ARRAY['اکشن', 'علمی‌تخیلی']::text[], 'anime', 'BluRay', 'ژاپنی', 'فارسی', '40GB', 8.9, 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Cowboy_Bebop_logo.png', 'ماجراهای شکارچیان جایزه‌بگیر در فضا', null, null, 8.9);

-- === 5) Services (111: s1..s111) — table: services ===================
-- `fields` / `docs` are NULL in store.tsx; the wizard derives them from
-- category via getServiceFormFields() / getServiceDocFields().
insert into services (sku, name, category, base_price, unit, description, active,
                      fields, docs) values
  ('s1', 'تسویه رو مبلغ تامین', 'تأمین اجتماعی', 7000, 'مورد', 'تسویه رو مبلغ تأمین اجتماعی', true, null, null),
  ('s2', 'پنشن مطلوبی', 'تأمین اجتماعی', 12000, 'مورد', 'خدمات پنشن مطلوبی', true, null, null),
  ('s3', 'حکم مطلوبی', 'تأمین اجتماعی', 12000, 'مورد', 'خدمات حکم مطلوبی', true, null, null),
  ('s4', 'سابقه بیمه (هر برگ اضافه ۱۵ تومان)', 'تأمین اجتماعی', 12500, 'برگ', 'سابقه بیمه؛ هر برگ اضافه ۱۵ تومان', true, null, null),
  ('s5', 'گواهی کسر سابقه', 'تأمین اجتماعی', 12500, 'مورد', 'صدور گواهی کسر سابقه', true, null, null),
  ('s6', 'درخواست پرداخت پزشکی', 'تأمین اجتماعی', 100000, 'مورد', 'بستگی به تعداد مدارک اسکن شده', true, null, null),
  ('s7', 'ثبت شماره شبا', 'تأمین اجتماعی', 7000, 'مورد', 'ثبت/به‌روزرسانی شماره شبا', true, null, null),
  ('s8', 'هدیه ازدواج و ترحیم', 'تأمین اجتماعی', 200000, 'مورد', 'درخواست هدیه ازدواج و ترحیم', true, null, null),
  ('s9', 'نسخه (هر برگ اضافه ۱۵ تومان)', 'تأمین اجتماعی', 100000, 'برگ', 'نسخه؛ هر برگ اضافه ۱۵ تومان', true, null, null),
  ('s10', 'ابلاغیه (هر برگ اضافه ۱۵ تومان)', 'تأمین اجتماعی', 100000, 'برگ', 'ابلاغیه؛ هر برگ اضافه ۱۵ تومان', true, null, null),
  ('s11', 'پیش‌بیمه (با پرداختی)', 'تأمین اجتماعی', 100000, 'مورد', 'پیش‌بیمه با پرداختی', true, null, null),
  ('s12', 'انتخاب واحد (آموزشیار)', 'آموزشیار', 50000, 'مورد', 'انتخاب واحد سامانه آموزشیار', true, null, null),
  ('s13', 'درخواست مجوز', 'آموزشیار', 100000, 'مورد', 'درخواست مجوز در آموزشیار', true, null, null),
  ('s14', 'فراموشی رمز', 'آموزشیار', 100000, 'مورد', 'بازیابی رمز فراموش‌شده', true, null, null),
  ('s15', 'پرداخت شهریه', 'آموزشیار', 150000, 'مورد', 'پرداخت شهریه دانشگاه', true, null, null),
  ('s16', 'کارت ورود به جلسه بدون ارزشیابی', 'آموزشیار', 150000, 'مورد', 'صدور کارت ورود به جلسه بدون ارزشیابی', true, null, null),
  ('s17', 'کارت ورود به جلسه با ارزشیابی', 'آموزشیار', 250000, 'مورد', 'صدور کارت ورود به جلسه با ارزشیابی', true, null, null),
  ('s18', 'چاپ پرینت انتخاب واحد', 'آموزشیار', 100000, 'مورد', 'چاپ پرینت انتخاب واحد', true, null, null),
  ('s19', 'چاپ کارت ورود به جلسه با ارزشیابی', 'آموزشیار', 300000, 'مورد', 'چاپ کارت ورود به جلسه با ارزشیابی', true, null, null),
  ('s20', 'ثبت نمره هر کلاس', 'آموزشیار', 100000, 'مورد', 'ثبت نمره هر کلاس', true, null, null),
  ('s21', 'چاپ کارنامه', 'آموزشیار', 100000, 'مورد', 'چاپ کارنامه', true, null, null),
  ('s22', 'چاپ لیست کلاس', 'آموزشیار', 100000, 'مورد', 'چاپ لیست کلاس', true, null, null),
  ('s23', 'گواهی پیش‌دانشگاهی', 'آموزشیار', 100000, 'مورد', 'صدور گواهی پیش‌دانشگاهی', true, null, null),
  ('s24', 'ثبت‌نام کتاب درسی', 'آموزشیار', 100000, 'مورد', 'ثبت‌نام کتاب درسی', true, null, null),
  ('s25', 'سورت (سنجش بهروزی)', 'آموزشیار', 100000, 'مورد', 'سورت (سنجش بهروزی)', true, null, null),
  ('s26', 'ثبت دادخواست', 'وزارت کار', 200000, 'مورد', 'ثبت دادخواست در سامانه جامع وزارت کار', true, null, null),
  ('s27', 'پیمانکاری', 'وزارت کار', 200000, 'مورد', 'ثبت درخواست پیمانکاری', true, null, null),
  ('s28', 'اصلاح دادخواست (بستگی به میزان کار)', 'وزارت کار', 200000, 'مورد', 'اصلاح دادخواست؛ بستگی به میزان کار', true, null, null),
  ('s29', 'درخواست اجرای حکم', 'وزارت کار', 150000, 'مورد', 'درخواست اجرای حکم', true, null, null),
  ('s30', 'لایحه', 'وزارت کار', 100000, 'مورد', 'تنظیم و ثبت لایحه', true, null, null),
  ('s31', 'درخواست سختی کار', 'وزارت کار', 100000, 'مورد', 'درخواست سختی کار', true, null, null),
  ('s32', 'سامانه ثنا', 'سامانه‌های تخصصی', 100000, 'مورد', 'خدمات سامانه ثنا', true, null, null),
  ('s33', 'فرابانک ملت', 'سامانه‌های تخصصی', 100000, 'مورد', 'خدمات فرابانک ملت', true, null, null),
  ('s34', 'هر بار اصلاح فرابانک', 'سامانه‌های تخصصی', 150000, 'مورد', 'اصلاح فرابانک؛ هر بار', true, null, null),
  ('s35', 'تسهیلات امان کشاورزی', 'سامانه‌های تخصصی', 100000, 'مورد', 'ثبت درخواست تسهیلات امان کشاورزی', true, null, null),
  ('s36', 'درخواست صدور سند', 'کاناپ', 200000, 'مورد', 'درخواست صدور سند در کاناپ', true, null, null),
  ('s37', 'درخواست اصلاح سند', 'کاناپ', 200000, 'مورد', 'درخواست اصلاح سند در کاناپ', true, null, null),
  ('s38', 'گرفتن گواهی استاد رسمی', 'کاناپ', 150000, 'مورد', 'گرفتن گواهی استاد رسمی', true, null, null),
  ('s39', 'کدپکنا ازدواج (پرینت من)', 'کاناپ', 200000, 'مورد', 'کدپکنا ازدواج (پرینت من)', true, null, null),
  ('s40', 'نوبت دهی اتباع', 'ثبت‌نام اتباع', 250000, 'مورد', 'نوبت‌دهی ثبت‌نام اتباع', true, null, null),
  ('s41', 'کد فیدا', 'ثبت‌نام اتباع', 250000, 'مورد', 'دریافت کد فیدا', true, null, null),
  ('s42', 'برگه فیدا', 'ثبت‌نام اتباع', 150000, 'مورد', 'چاپ برگه فیدا', true, null, null),
  ('s43', 'تایپ ساده', 'تایپ', 100000, 'صفحه', 'تایپ ساده هر صفحه', true, null, null),
  ('s44', 'تایپ سوال ریاضی، شیمی و جدول', 'تایپ', 200000, 'صفحه', 'تایپ سوالات ریاضی، شیمی و جدول', true, null, null),
  ('s45', 'ثبت‌نام آزمون سنجش', 'سازمان سنجش', 200000, 'مورد', 'ثبت‌نام آزمون‌های سازمان سنجش', true, null, null),
  ('s46', 'پرینت کارت و کارنامه', 'سازمان سنجش', 100000, 'مورد', 'پرینت کارت ورود و کارنامه', true, null, null),
  ('s47', 'تایید آدرس', 'سخا', 150000, 'مورد', 'تایید آدرس در سامانه سخا', true, null, null),
  ('s48', 'گواهی‌نامه زیارتی', 'سخا', 500000, 'مورد', 'صدور گواهی‌نامه زیارتی', true, null, null),
  ('s49', 'استعلام اصالت پایان خدمت', 'سخا', 250000, 'مورد', 'استعلام اصالت کارت پایان خدمت', true, null, null),
  ('s50', 'معافیت تحصیلی', 'سخا', 200000, 'مورد', 'درخواست معافیت تحصیلی', true, null, null),
  ('s51', 'تایید عدم معافیت تحصیلی', 'سخا', 200000, 'مورد', 'تایید عدم معافیت تحصیلی', true, null, null),
  ('s52', 'پرداخت ودیعه (بدون پرداختی)', 'سخا', 250000, 'مورد', 'پرداخت ودیعه (بدون پرداختی)', true, null, null),
  ('s53', 'مجوز خروج از کشور (بدون پرداختی)', 'سخا', 250000, 'مورد', 'درخواست مجوز خروج از کشور (بدون پرداختی)', true, null, null),
  ('s54', 'تمدید مجوز صلاح', 'سخا', 500000, 'مورد', 'تمدید مجوز صلاح', true, null, null),
  ('s55', 'ثبت‌نام اولیه خودرو', 'ثبت‌نام خودرو', 250000, 'مورد', 'ثبت‌نام اولیه در قرعه‌کشی خودرو', true, null, null),
  ('s56', 'واریز وثیقه', 'ثبت‌نام خودرو', 200000, 'مورد', 'واریز وثیقه قرعه‌کشی', true, null, null),
  ('s57', 'استعلام وضعیت قرعه‌کشی', 'ثبت‌نام خودرو', 150000, 'مورد', 'استعلام وضعیت قرعه‌کشی خودرو', true, null, null),
  ('s58', 'پاورپوینت مبتدی', 'پاورپوینت', 20000, 'اسلاید', 'طراحی پاورپوینت مبتدی', true, null, null),
  ('s59', 'پاورپوینت نیمه‌حرفه‌ای', 'پاورپوینت', 70000, 'اسلاید', 'طراحی پاورپوینت نیمه‌حرفه‌ای', true, null, null),
  ('s60', 'پاورپوینت حرفه‌ای', 'پاورپوینت', 150000, 'اسلاید', 'طراحی پاورپوینت حرفه‌ای', true, null, null),
  ('s61', 'پاورپوینت فوق‌حرفه‌ای', 'پاورپوینت', 200000, 'اسلاید', 'طراحی پاورپوینت فوق‌حرفه‌ای', true, null, null),
  ('s62', 'خودنویس (خرید و فروش املاک)', 'خودنویس', 200000, 'مورد', 'خودنویس مربوط به خرید و فروش املاک', true, null, null),
  ('s63', 'درخواست وام (خودنویس)', 'خودنویس', 200000, 'مورد', 'درخواست وام در خودنویس', true, null, null),
  ('s64', 'اضافه کردن بند یا الحاقیه', 'خودنویس', 200000, 'مورد', 'اضافه کردن بند یا الحاقیه', true, null, null),
  ('s65', 'امضای دیجیتال', 'بانک ملی', 250000, 'مورد', 'درخواست امضای دیجیتال بانک ملی', true, null, null),
  ('s66', 'درخواست وام (بانک ملی)', 'بانک ملی', 300000, 'مورد', 'درخواست وام بانک ملی', true, null, null),
  ('s67', 'ثبت‌نام سهام کودکان', 'سهام کودکان', 200000, 'مورد', 'ثبت‌نام سهام کودکان', true, null, null),
  ('s68', 'لمینت', 'خدمات فنی', 100000, 'مورد', 'لمینت اسناد و مدارک', true, null, null),
  ('s69', 'نوبت دهی', 'خدمات فنی', 150000, 'مورد', 'نوبت‌دهی', true, null, null),
  ('s70', 'روند پرونده (هر برگ اضافه ۱۵ تومان)', 'خدمات فنی', 150000, 'برگ', 'روند پرونده؛ هر برگ اضافه ۱۵ تومان', true, null, null),
  ('s71', 'قرارداد کار', 'خدمات فنی', 200000, 'مورد', 'تنظیم قرارداد کار', true, null, null),
  ('s72', 'لیست تنخواه', 'خدمات فنی', 250000, 'مورد', 'لیست تنخواه', true, null, null),
  ('s73', 'برگه تنخواه', 'خدمات فنی', 150000, 'مورد', 'برگه تنخواه', true, null, null),
  ('s74', 'بازبینی و بن', 'خدمات فنی', 150000, 'مورد', 'بازبینی و بن', true, null, null),
  ('s75', 'سوءپیشینه', 'خدمات فنی', 200000, 'مورد', 'صدور گواهی سوءپیشینه', true, null, null),
  ('s76', 'تصدیه و کات مرگز', 'خدمات فنی', 1000000, 'مورد', 'تصدیه و کات مرگز', true, null, null),
  ('s77', 'تصدیه و کات کارتون', 'خدمات فنی', 1000000, 'مورد', 'تصدیه و کات کارتون', true, null, null),
  ('s78', 'تایید چک', 'خدمات چک', 100000, 'مورد', 'تایید چک', true, null, null),
  ('s79', 'رد چک', 'خدمات چک', 100000, 'مورد', 'رد چک', true, null, null),
  ('s80', 'پرینت چک', 'خدمات چک', 100000, 'مورد', 'پرینت چک', true, null, null),
  ('s81', 'انتقال چک', 'خدمات چک', 100000, 'مورد', 'انتقال چک', true, null, null),
  ('s82', 'ثبت‌نام ثبت ملک (ماده ۱۲۷)', 'سامانه اداره ثبت', 1500000, 'مورد', 'ثبت‌نام ثبت ملک ماده ۱۲۷', true, null, null),
  ('s83', 'املاک و اسکان', 'سامانه اداره ثبت', 150000, 'مورد', 'خدمات سامانه املاک و اسکان', true, null, null),
  ('s84', 'تاییدیه تحصیلی', 'تاییدیه تحصیلی', 250000, 'مورد', 'تاییدیه تحصیلی', true, null, null),
  ('s85', 'سوابق فارغ‌التحصیلی', 'تاییدیه تحصیلی', 250000, 'مورد', 'سوابق فارغ‌التحصیلی', true, null, null),
  ('s86', 'پیگیری تاییدیه مدرک تحصیلی', 'تاییدیه تحصیلی', 150000, 'مورد', 'پیگیری تاییدیه مدرک تحصیلی', true, null, null),
  ('s87', 'تایید تحصیلی سامانه سجاد', 'تاییدیه تحصیلی', 250000, 'مورد', 'تایید تحصیلی سامانه سجاد', true, null, null),
  ('s88', 'تایید تحصیلی وزارت علوم', 'تاییدیه تحصیلی', 250000, 'مورد', 'تایید تحصیلی وزارت علوم', true, null, null),
  ('s89', 'دریافت کارت ورود به جلسه (کلاستان)', 'کلاستان', 150000, 'مورد', 'دریافت کارت ورود به جلسه کلاستان', true, null, null),
  ('s90', 'کارت ورود به جلسه بدون ارزشیابی (کلاستان)', 'کلاستان', 150000, 'مورد', 'کارت ورود به جلسه بدون ارزشیابی کلاستان', true, null, null),
  ('s91', 'انتخاب واحد (کلاستان)', 'کلاستان', 500000, 'مورد', 'انتخاب واحد کلاستان', true, null, null),
  ('s92', 'دریافت گزارش', 'کلاستان', 150000, 'مورد', 'دریافت گزارش', true, null, null),
  ('s93', 'انتخاب واحد (هما)', 'هما', 500000, 'مورد', 'انتخاب واحد سامانه هما', true, null, null),
  ('s94', 'کارت ورود به جلسه (هما)', 'هما', 200000, 'مورد', 'کارت ورود به جلسه سامانه هما', true, null, null),
  ('s95', 'کارت ورود به جلسه بدون ارزشیابی (هما)', 'هما', 150000, 'مورد', 'کارت ورود به جلسه بدون ارزشیابی هما', true, null, null),
  ('s96', 'سامانه مسکن (بدون هزینه پرداختی)', 'سامانه مسکن', 500000, 'مورد', 'سامانه مسکن (بدون هزینه پرداختی)', true, null, null),
  ('s97', 'نوبت جدید', 'سامانه مسکن', 300000, 'مورد', 'دریافت نوبت جدید', true, null, null),
  ('s98', 'ثبت‌نام سجام', 'سجام', 250000, 'مورد', 'ثبت‌نام سجام', true, null, null),
  ('s99', 'احراز هویت سجام', 'سجام', 250000, 'مورد', 'احراز هویت سجام', true, null, null),
  ('s100', 'درخواست گواهی', 'ثبت احوال', 250000, 'مورد', 'درخواست گواهی ثبت احوال', true, null, null),
  ('s101', 'دریافت گواهی (بدون پرداختی)', 'ثبت احوال', 200000, 'مورد', 'دریافت گواهی (بدون پرداختی)', true, null, null),
  ('s102', 'ثبت آدرس', 'ثبت احوال', 150000, 'مورد', 'ثبت آدرس', true, null, null),
  ('s103', 'اعتراض به گواهی', 'ثبت احوال', 250000, 'مورد', 'اعتراض به گواهی', true, null, null),
  ('s104', 'درخواست جداسازی NCR', 'یارانه', 300000, 'مورد', 'درخواست جداسازی NCR', true, null, null),
  ('s105', 'درخواست ثبت شماره شبا (یارانه)', 'یارانه', 250000, 'مورد', 'درخواست ثبت شماره شبا', true, null, null),
  ('s106', 'اعتراض (یارانه)', 'یارانه', 250000, 'مورد', 'ثبت اعتراض یارانه', true, null, null),
  ('s107', 'ثبت‌نام غیرحضوری دانشگاه دولتی', 'ثبت‌نام دانشگاه', 500000, 'مورد', 'ثبت‌نام غیرحضوری دانشگاه دولتی', true, null, null),
  ('s108', 'ثبت‌نام غیرحضوری دانشگاه آزاد', 'ثبت‌نام دانشگاه', 500000, 'مورد', 'ثبت‌نام غیرحضوری دانشگاه آزاد', true, null, null),
  ('s109', 'ثبت‌نام غیرحضوری سایر دانشگاه‌ها', 'ثبت‌نام دانشگاه', 500000, 'مورد', 'ثبت‌نام غیرحضوری سایر دانشگاه‌ها', true, null, null),
  ('s110', 'اسکن هر برگ', 'خدمات فنی', 200000, 'برگ', 'اسکن هر برگ (دست‌نویس روی نرخ‌نامه)', true, null, null),
  ('s111', 'برداختی (۱۵ درصد مبلغ کل)', 'خدمات فنی', 0, 'مورد', 'برداختی ۱۵ درصد مبلغ کل', true, null, null));

-- === 6) News (8: n1..n8) — table: news =============================
insert into news (sku, title, image, caption, content, "date", active) values
  ('n1', 'تخفیف ویژه خدمات پرینت در هفته آینده', '/images/ede366be-a6af-45f7-8274-ac1743efffc0.png', 'به مناسبت آغاز سال تحصیلی جدید', 'کافی نت همیار به مناسبت آغاز سال تحصیلی جدید، تخفیف ۲۰ درصدی بر روی تمامی خدمات پرینت ارائه می‌دهد. این تخفیف از تاریخ ۱ مهر تا ۷ مهر اعمال خواهد شد.', '1403/07/01', true),
  ('n2', 'اضافه شدن خدمات جدید ترجمه تخصصی', '/images/8648f349-9c19-4b40-92a3-de6ca40c1788.png', 'ترجمه متون تخصصی', 'خدمات ترجمه تخصصی در حوزه‌های حقوقی، پزشکی و فنی به مجموعه خدمات کافی نت همیار اضافه شد.', '1403/06/15', true),
  ('n3', 'جشنواره فروش محصولات دیجیتال', '/images/3965d39e-6efc-4ac9-a8f7-4bfe21f41498.png', 'تخفیف‌های ویژه', 'جشنواره فروش محصولات دیجیتال با تخفیف‌های ویژه تا ۳۰ درصد. فلش مموری، هارد اکسترنال و لوازم جانبی.', '1403/06/01', true),
  ('n4', 'راه‌اندازی خدمات بیمه آنلاین', '/images/0d2bd864-b264-4214-960f-2d0445cc2564.png', 'صدور انواع بیمه‌نامه', 'خدمات صدور بیمه‌نامه شخص ثالث، بدنه، عمر و مسافرتی به صورت آنلاین در کافی نت همیار راه‌اندازی شد. شما می‌توانید بدون مراجعه حضوری، بیمه‌نامه خود را دریافت کنید.', '1403/07/10', true),
  ('n5', 'خدمات جدید ثبت‌نام کنکور ۱۴۰۴', '/images/f5d75da2-b091-46a2-b492-82c1384eb38b.png', 'ثبت‌نام کنکور سراسری', 'ثبت‌نام کنکور سراسری ۱۴۰۴ آغاز شد. کافی نت همیار با تیم مجرب خود، خدمات ثبت‌نام، ویرایش اطلاعات و انتخاب رشته را با بهترین کیفیت ارائه می‌دهد.', '1403/07/15', true),
  ('n6', 'تخفیف ویژه طراحی سایت', '/images/a5fbf7ed-6e13-4c6d-b26f-0ea4e4aad486.png', 'طراحی سایت با ۲۰٪ تخفیف', 'به مناسبت پایان سال، کافی نت همیار تخفیف ۲۰ درصدی بر روی تمامی خدمات طراحی سایت ارائه می‌دهد. این فرصت را از دست ندهید!', '1403/07/20', true),
  ('n7', 'اضافه شدن خدمات مالیاتی', '/images/a8ff0cc2-f5fb-46c8-b6a2-d9f9df21479c.png', 'امور مالیاتی و اظهارنامه', 'خدمات تشکیل پرونده مالیاتی، تنظیم و ارسال اظهارنامه و پیگیری امور مالیاتی به مجموعه خدمات کافی نت همیار اضافه شد.', '1403/07/25', true),
  ('n8', 'جشنواره پایان سال محصولات', '/images/dcb65c22-070f-4dcf-9d16-fd2c708cca52.png', 'تخفیف‌های ویژه پایان سال', 'جشنواره پایان سال با تخفیف‌های ویژه تا ۴۰ درصد بر روی تمامی محصولات دیجیتال. فلش مموری، هارد، شارژر و لوازم جانبی با بهترین قیمت.', '1403/08/01', true);

-- === 7) Portfolio (8: pf1..pf8) — table: portfolio =================
insert into portfolio (sku, title, description, image, link, type, technologies, active) values
  ('pf1', 'فروشگاه آنلاین دیجیکالا نمونه', 'طراحی فروشگاه اینترنتی با امکانات کامل شامل سبد خرید، پرداخت آنلاین و پنل مدیریت', '/images/426c6503-cf69-4a4a-b147-6e8a955299c2.png', 'https://example.com', 'فروشگاهی', ARRAY['React', 'Node.js', 'MongoDB']::text[], true),
  ('pf2', 'سایت شرکتی بازرگانی', 'طراحی سایت شرکتی با بخش معرفی خدمات، نمونه‌کارها و فرم تماس', '/images/1e8a34d4-89f4-4c92-a5d2-c699f73c6be3.png', 'https://example.com', 'شرکتی', ARRAY['Next.js', 'Tailwind CSS']::text[], true),
  ('pf3', 'سایت رستوران', 'طراحی سایت رستوران با منوی آنلاین و سیستم رزرو میز', '/images/6b0b64c2-d847-4446-bddd-975118ecdc99.png', 'https://example.com', 'شخصی', ARRAY['WordPress', 'PHP']::text[], true),
  ('pf4', 'پلتفرم آموزش آنلاین', 'طراحی سایت آموزش آنلاین با سیستم ویدئو، آزمون و گواهینامه', '/images/821f9d55-71eb-4f81-888e-e498e92d5f6d.png', 'https://example.com', 'فروشگاهی', ARRAY['React', 'Django', 'PostgreSQL']::text[], true),
  ('pf5', 'سایت املاک', 'طراحی سایت املاک با جستجوی پیشرفته و نمایش نقشه', '/images/d8b4badf-955c-4dee-8a50-8e1da4baed91.png', 'https://example.com', 'شرکتی', ARRAY['Vue.js', 'Laravel', 'MySQL']::text[], true),
  ('pf6', 'اپلیکیشن مدیریت پروژه', 'طراحی داشبورد مدیریت پروژه با امکانات تسک، تقویم و گزارش', '/images/426c6503-cf69-4a4a-b147-6e8a955299c2.png', 'https://example.com', 'شرکتی', ARRAY['React', 'Express', 'MongoDB']::text[], true),
  ('pf7', 'سایت پزشکی', 'طراحی سایت کلینیک پزشکی با سیستم نوبت‌دهی آنلاین', '/images/1e8a34d4-89f4-4c92-a5d2-c699f73c6be3.png', 'https://example.com', 'شخصی', ARRAY['Next.js', 'Node.js', 'PostgreSQL']::text[], true),
  ('pf8', 'فروشگاه لباس', 'طراحی فروشگاه آنلاین لباس با فیلتر پیشرفته و سبد خرید', '/images/6b0b64c2-d847-4446-bddd-975118ecdc99.png', 'https://example.com', 'فروشگاهی', ARRAY['React', 'Shopify', 'Tailwind CSS']::text[], true);

-- === 8) FAQs (6: f1..f6) — table: faqs ==================================================
insert into faqs (sku, question, answer, category) values
  ('f1', 'ساعات کاری کافی نت همیار چگونه است؟', 'ما شنبه تا پنج‌شنبه از ساعت ۹ صبح تا ۹ شب و جمعه‌ها از ۱۰ صبح تا ۲ بعدازظهر در خدمت شما هستیم.', 'عمومی'),
  ('f2', 'آیا امکان ارسال محصولات وجود دارد؟', 'بله، برای سفارش‌های بالای ۵۰۰ هزار تومان ارسال رایگان است. برای سایر سفارش‌ها هزینه ارسال بر عهده مشتری است.', 'فروشگاه'),
  ('f3', 'چگونه می‌توانم سفارش خود را پیگیری کنم؟', 'با استفاده از کد رهگیری که هنگام ثبت سفارش دریافت کرده‌اید، می‌توانید از بخش پیگیری سفارش وضعیت سفارش خود را مشاهده کنید.', 'سفارش'),
  ('f4', 'آیا محصولات گارانتی دارند؟', 'بله، تمامی محصولات دیجیتال دارای گارانتی اصالت و سلامت فیزیکی هستند. محصولات خاص مانند دوربین مداربسته و دستگاه پوز دارای گارانتی شرکتی می‌باشند.', 'فروشگاه'),
  ('f5', 'زمان انجام خدمات کافی نت چقدر است؟', 'بسته به نوع خدمت متفاوت است. خدمات ساده مانند پرینت و کپی در همان لحظه انجام می‌شوند. خدمات پیچیده‌تر مانند ترجمه و طراحی سایت زمان بیشتری نیاز دارند.', 'خدمات'),
  ('f6', 'آیا امکان پرداخت اقساطی وجود دارد؟', 'برای خریدهای بالای ۲ میلیون تومان امکان پرداخت اقساطی با چک صیادی وجود دارد. برای اطلاعات بیشتر با ما تماس بگیرید.', 'فروشگاه');

-- === 9) Gamification config (DEFAULT_GAMIFICATION_CONFIG) ===================
-- table: gamification_settings (single row); `config` jsonb holds the full
-- snapshot incl. tiers, rewards and badges.
insert into gamification_settings (enabled, points_per_toman, invite_bonus,
  invited_user_bonus, review_bonus, daily_login_bonus, streak_day_multiplier,
  streak_max_days, profile_completion_bonus, birthday_bonus, config) values
  (true, 10000, 50, 50,
   10, 5, 1, 7,
   20, 100, '{"enabled":true,"pointsPerToman":10000,"inviteBonus":50,"invitedUserBonus":50,"reviewBonus":10,"dailyLoginBonus":5,"streakDayMultiplier":1,"streakMaxDays":7,"profileCompletionBonus":20,"birthdayBonus":100,"tiers":[{"level":"normal","label":"عادی","minPoints":0,"discountPercent":0,"multiplier":1,"perks":["شرکت در جشنواره‌های عضویت"]},{"level":"silver","label":"نقره‌ای","minPoints":100,"discountPercent":5,"multiplier":1.25,"perks":["۵٪ تخفیف عضویت","کسب امتیاز ۱.۲۵ برابر"]},{"level":"gold","label":"طلایی","minPoints":500,"discountPercent":10,"multiplier":1.5,"perks":["۱۰٪ تخفیف عضویت","ارسال رایگان ماهانه","پشتیبانی اولویت‌دار"]},{"level":"vip","label":"VIP","minPoints":1000,"discountPercent":15,"multiplier":2,"perks":["۱۵٪ تخفیف عضویت","اولویت در پروژه‌ها","پاداش تولد دوچندان"]}],"rewards":[{"id":"rw1","title":"۵۰ هزار تومان اعتبار کیف پول","description":"اعتبار نقدی به کیف پول شما افزوده می‌شود.","cost":200,"icon":"💰","enabled":true},{"id":"rw2","title":"یک ماه اینترنت رایگان","description":"فعال‌سازی بسته یک‌ماهه برای حساب کاربری.","cost":350,"icon":"📶","enabled":true},{"id":"rw3","title":"کد تخفیف ۲۰٪ خدمات طراحی","description":"روی سفارش بعدی طراحی سایت قابل استفاده است.","cost":500,"icon":"🎨","enabled":true},{"id":"rw4","title":"مشاوره رایگان سئو (۴۵ دقیقه)","description":"جلسه مشاوره تخصصی با تیم دیجیتال مارکتینگ.","cost":800,"icon":"🚀","enabled":true}],"badges":[{"id":"bg-invite-1","name":"دعوت‌کننده نقره‌ای","icon":"🤝","description":"حداقل ۳ دوست را با کد دعوت خود وارد کرده‌اید.","metric":"invitedCount","threshold":3},{"id":"bg-invite-2","name":"سفیر برند","icon":"📣","description":"حداقل ۱۰ دعوت موفق دارید.","metric":"invitedCount","threshold":10},{"id":"bg-points-1","name":"امتیازآور برنزی","icon":"⭐","description":"در مجموع ۲۵۰ امتیاز کسب کرده‌اید.","metric":"totalEarnedPoints","threshold":250},{"id":"bg-points-2","name":"امتیازآور طلایی","icon":"🌟","description":"در مجموع ۱۰۰۰ امتیاز کسب کرده‌اید.","metric":"totalEarnedPoints","threshold":1000},{"id":"bg-orders-1","name":"خریدار وفادار","icon":"🛒","description":"بیش از ۵ سفارش موفق داشته‌اید.","metric":"ordersCount","threshold":5},{"id":"bg-reviews-1","name":"نظردهنده فعال","icon":"✍️","description":"حداقل ۳ نظر ثبت کرده‌اید.","metric":"reviewsCount","threshold":3},{"id":"bg-streak-1","name":"ورود هفتگی","icon":"🔥","description":"۷ روز پشت سر هم وارد شوید.","metric":"loginStreak","threshold":7},{"id":"bg-streak-2","name":"وفادار ماهانه","icon":"🏆","description":"۳۰ روز پشت سر هم وارد شوید.","metric":"loginStreak","threshold":30}]}');

-- === 10) Project services (وب‌سایت / تولید محتوا) — table: project_services
-- `sku` carries the store.tsx id (ps-wd-*, ps-ct-*) so the app can look
-- catalogue entries up by the ids it already knows.
-- `fields`/`docs` are the dynamic wizard schema as jsonb.
insert into project_services (sku, "group", icon, title, "desc", features, base_price, unit, fields, docs) values
('ps-wd-shop', 'webdesign', 'ShoppingCart', 'سایت فروشگاهی', 'طراحی فروشگاه آنلاین با سبد خرید، پرداخت آنلاین و پنل مدیریت', array['مدیریت محصولات', 'سبد خرید', 'درگاه پرداخت', 'پنل مدیریت']::text[], 25000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"industry","label":"حوزه فعالیت کسب‌وکار","type":"text","required":true,"placeholder":"مثلاً پوشاک، لوازم دیجیتال"},{"key":"productCount","label":"تعداد تقریبی محصولات","type":"number","required":true,"placeholder":"100"},{"key":"domainName","label":"دامنه (در صورت وجود)","type":"text","required":false,"placeholder":"example.ir"},{"key":"payments","label":"درگاه‌های پرداخت مورد نیاز","type":"select","required":true,"options":["زرین‌پال","آی‌دی‌پی","سامان","چند درگاه"]},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true,"placeholder":"مثلاً باشگاه مشتریان، چندفروشندگی، اپلیکیشن..."},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false},{"key":"budget","label":"بودجه تقریبی (تومان)","type":"number","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / فایل نیازمندی‌ها","required":true,"hint":"pdf, docx، حداکثر ۵ مگابایت"},{"key":"brandAssets","label":"لوگو و تصاویر برند","required":false,"hint":"zip یا تصاویر png/jpg"},{"key":"samples","label":"نمونه سایت مورد علاقه","required":false,"hint":"می‌توانید چند اسکرین‌شات بارگذاری کنید"}]'::jsonb),
('ps-wd-corp', 'webdesign', 'Globe', 'سایت شرکتی', 'طراحی وب‌سایت حرفه‌ای برای شرکت‌ها و سازمان‌ها', array['معرفی خدمات', 'نمونه‌کارها', 'فرم تماس', 'بلاگ']::text[], 15000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"industry","label":"حوزه فعالیت شرکت","type":"text","required":true},{"key":"pagesCount","label":"تعداد صفحات تقریبی","type":"number","required":true,"placeholder":"8"},{"key":"domainName","label":"دامنه (در صورت وجود)","type":"text","required":false},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true,"placeholder":"بلاگ، فرم استخدام، چندزبانه..."},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false},{"key":"budget","label":"بودجه تقریبی (تومان)","type":"number","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / فایل نیازمندی‌ها","required":true},{"key":"brandAssets","label":"لوگو و تصاویر برند","required":false}]'::jsonb),
('ps-wd-personal', 'webdesign', 'User', 'سایت شخصی', 'طراحی پورتفولیو و سایت شخصی برای افراد', array['رزومه آنلاین', 'نمونه‌کارها', 'فرم ارتباط', 'شبکه‌های اجتماعی']::text[], 7000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"profession","label":"حوزه کاری شما","type":"text","required":true,"placeholder":"مثلاً عکاسی، معماری"},{"key":"siteType","label":"نوع سایت","type":"select","required":true,"options":["پورتفولیو","وبلاگ شخصی","رزومه آنلاین","فروش خدمات"]},{"key":"domainName","label":"دامنه (در صورت وجود)","type":"text","required":false},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"bio","label":"متن بیو / رزومه","required":false},{"key":"works","label":"نمونه‌کارها و تصاویر","required":false},{"key":"brandAssets","label":"لوگو شخصی","required":false}]'::jsonb),
('ps-wd-app', 'webdesign', 'Smartphone', 'ساخت اپلیکیشن موبایل', 'طراحی و توسعه اپلیکیشن اندروید و iOS برای کسب‌وکار شما', array['اپلیکیشن فروشگاهی', 'اپلیکیشن سازمانی', 'رابط کاربری اختصاصی', 'انتشار در کافه‌بازار و مایکت']::text[], 60000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"appType","label":"نوع اپلیکیشن","type":"select","required":true,"options":["فروشگاهی","سازمانی","خدماتی","آموزشی","دیگر"]},{"key":"platforms","label":"پلتفرم هدف","type":"select","required":true,"options":["اندروید","iOS","اندروید و iOS"]},{"key":"backendNeeded","label":"نیاز به پنل مدیریت / بک‌اند","type":"select","required":true,"options":["بله","خیر"]},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true,"placeholder":"ورود با شماره، نوتیفیکیشن، درگاه پرداخت..."},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false},{"key":"budget","label":"بودجه تقریبی (تومان)","type":"number","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / وایرفریم اپلیکیشن","required":true},{"key":"brandAssets","label":"لوگو و هویت بصری","required":false},{"key":"samples","label":"نمونه اپلیکیشن مورد نظر","required":false}]'::jsonb),
('ps-wd-tgbot', 'webdesign', 'Bot', 'ربات تلگرام', 'ساخت ربات‌های تلگرامی فروشگاهی، پشتیبانی، مدیریت گروه و اطلاع‌رسانی', array['فروش خودکار در تلگرام', 'مدیریت گروه و کانال', 'اتصال به درگاه پرداخت', 'پشتیبانی هوشمند']::text[], 8000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"botType","label":"نوع ربات","type":"select","required":true,"options":["فروشگاهی","پشتیبانی","مدیریت گروه/کانال","اطلاع‌رسانی","دیگر"]},{"key":"paymentNeeded","label":"نیاز به درگاه پرداخت","type":"select","required":true,"options":["بله","خیر"]},{"key":"channelLink","label":"لینک کانال/گروه (اختیاری)","type":"text","required":false},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true,"placeholder":"ثبت‌نام خودکار، فاکتور، پنل مدیریتی..."},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / سناریوی ربات","required":true},{"key":"flows","label":"فلوچارت یا نمونه صوتی/متنی منوها","required":false}]'::jsonb),
('ps-wd-otherbot', 'webdesign', 'MessageSquare', 'ربات غیرتلگرامی', 'ساخت چت‌بات و ربات برای واتساپ، اینستاگرام، وب‌سایت و سایر پیام‌رسان‌ها', array['چت‌بات سایت', 'ربات واتساپ و اینستاگرام', 'پاسخ‌گویی خودکار', 'اتصال به CRM و پنل سفارش']::text[], 10000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"platform","label":"پلتفرم هدف","type":"select","required":true,"options":["واتساپ","اینستاگرام","چت‌بات وب‌سایت","ایتا/بله","دیگر"]},{"key":"crmConnect","label":"اتصال به CRM یا پنل سفارش","type":"select","required":true,"options":["بله","خیر"]},{"key":"features","label":"امکانات مورد نیاز","type":"textarea","required":true},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / سناریوی ربات","required":true},{"key":"accessInfo","label":"دسترسی‌های لازم (API/توکن)","required":false,"hint":"در صورت وجود حساب تجاری"}]'::jsonb),
('ps-ct-text', 'content', 'PenTool', 'تولید محتوای متنی', 'نوشتن مقاله، متن تبلیغاتی و محتوای سئو شده برای سایت و شبکه‌های اجتماعی', array['مقالات سئو شده', 'کپی‌رایتینگ تبلیغاتی', 'تولید محتوای بلاگ']::text[], 1500000, 'بسته ۵ مقاله', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"contentType","label":"نوع محتوا","type":"select","required":true,"options":["مقاله وبلاگ","متن تبلیغاتی","توضیح محصول","سناریو ویدیو","دیگر"]},{"key":"topic","label":"موضوع / حوزه فعالیت","type":"text","required":true,"placeholder":"مثلاً تجهیزات پزشکی"},{"key":"articlesCount","label":"تعداد مقاله / متن","type":"number","required":true,"placeholder":"5"},{"key":"keywords","label":"کلمات کلیدی مدنظر (اختیاری)","type":"textarea","required":false},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"brief","label":"بریف محتوایی / لیست موضوعات","required":true},{"key":"brandAssets","label":"راهنمای لحن و هویت برند","required":false}]'::jsonb),
('ps-ct-social', 'content', 'Instagram', 'مدیریت شبکه‌های اجتماعی', 'مدیریت و ادمین اینستاگرام، تلگرام و لینکدین با تقویم محتوایی منظم', array['تقویم محتوایی', 'پست و استوری روزانه', 'گزارش عملکرد ماهانه']::text[], 5000000, 'ماه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"package","label":"پکیج ماهانه","type":"select","required":true,"options":["برنزی (۱۲ پست + ۳۰ استوری)","نقره‌ای (۲۰ پست + ۶۰ استوری + گرافیک)","طلایی (۳۰ پست + استوری روزانه + ریلز + سئو)"]},{"key":"platform","label":"پلتفرم(ها)","type":"select","required":true,"options":["اینستاگرام","تلگرام","لینکدین","همه مورد‌ها"]},{"key":"accountLink","label":"آیدی / لینک پیج","type":"text","required":true,"placeholder":"@yourbrand"},{"key":"duration","label":"مدت همکاری (ماه)","type":"number","required":true,"placeholder":"3"},{"key":"details","label":"توضیحات سفارش","type":"textarea","required":false}]'::jsonb, '[{"key":"loginInfo","label":"اطلاعات ورود یا دسترسی ادمین","required":false,"hint":"فقط از طریق دایرکت امن ارسال شود"},{"key":"brandAssets","label":"لوگو و فایل‌های گرافیکی","required":false}]'::jsonb),
('ps-ct-video', 'content', 'Video', 'تولید محتوای تصویری و ویدیویی', 'طراحی پوستر، بنر، موشن‌گرافیک و ساخت ریلز و تیزرهای کوتاه', array['طراحی گرافیک', 'موشن‌گرافیک', 'ریلز و تیزر ویدیویی']::text[], 3000000, 'بسته ۵ طرح', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"visualType","label":"نوع خروجی","type":"select","required":true,"options":["پوستر/بنر","موشن‌گرافیک","ریلز اینستاگرام","تیزر تبلیغاتی"]},{"key":"itemsCount","label":"تعداد اقلام","type":"number","required":true,"placeholder":"5"},{"key":"sizeFormat","label":"قطع / فرمت خروجی","type":"text","required":false,"placeholder":"مثلاً ۱۰۸۰×۱۹۲۰ عمودی"},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"brief","label":"بریف / ایده‌ها","required":true},{"key":"brandAssets","label":"لوگو و تصاویر خام","required":false},{"key":"samples","label":"نمونه کار مورد پسند","required":false}]'::jsonb),
('ps-ct-seo', 'content', 'Search', 'سئو و بهینه‌سازی', 'بهبود رتبه سایت در گوگل از طریق سئوی داخلی، لینک‌سازی و تحقیق کلمات کلیدی', array['تحقیق کلمات کلیدی', 'سئوی داخلی و تکنیکال', 'لینک‌سازی استاندارد']::text[], 8000000, 'پروژه', '[{"key":"fullName","label":"نام و نام خانوادگی / نام برند","type":"text","required":true,"placeholder":"مثلاً علی رضایی"},{"key":"phone","label":"شماره موبایل","type":"tel","required":true,"placeholder":"09xxxxxxxxx"},{"key":"email","label":"ایمیل کاری (اختیاری)","type":"email","required":false},{"key":"siteUrl","label":"آدرس سایت","type":"text","required":true,"placeholder":"https://example.ir"},{"key":"seoType","label":"نوع خدمات سئو","type":"select","required":true,"options":["تحقیق کلمات کلیدی","سئوی داخلی","سئوی تکنیکال","لینک‌سازی","بسته کامل"]},{"key":"goals","label":"اهداف و کلمات کلیدی اصلی","type":"textarea","required":true},{"key":"deadline","label":"مهلت تحویل مورد نظر","type":"date","required":false}]'::jsonb, '[{"key":"accessInfo","label":"دسترسی Search Console / Analytics","required":false},{"key":"audit","label":"گزارش سئوی قبلی (در صورت وجود)","required":false}]'::jsonb);

-- === 11) About page content — table: about_content
-- Single row under key 'about'; `content` holds the structured payload.
insert into about_content (key, content) values ('about', '{"description":"کافی نت همیار با بیش از سال‌ها تجربه در ارائه خدمات دیجیتال، مفتخر است که بهترین خدمات را در زمینه‌های کافی نت، کپی مدیا، فروش محصولات دیجیتال و طراحی وب‌سایت ارائه دهد. ما با تیمی متخصص و مجرب، همواره در تلاشیم تا نیازهای دیجیتال شما را به بهترین شکل ممکن برآورده سازیم.","licenseImage":"","trustImages":[],"trustVideo":"","mission":"ارائه خدمات دیجیتال با کیفیت بالا و قیمت مناسب برای تمامی مشتریان","vision":"تبدیل شدن به مرجع اصلی خدمات دیجیتال در منطقه","logo":"","socialMedia":[{"id":"sm1","name":"ایتا","url":"https://eitaa.com/@hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm2","name":"روبیکا","url":"https://rubika.ir/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm3","name":"بله","url":"https://ble.ir/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm4","name":"تلگرام","url":"https://t.me/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm5","name":"اینستاگرام","url":"https://instagram.com/hamyar_service1","icon":"","handle":"@hamyar_service1"}]}'::jsonb);

-- === 12) Site settings — table: site_settings
-- Key/value jsonb rows. The social row mirrors AboutContent.socialMedia so the
-- header/footer can read it without loading the whole about document.
insert into site_settings (key, value) values
  ('social', '[{"id":"sm1","name":"ایتا","url":"https://eitaa.com/@hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm2","name":"روبیکا","url":"https://rubika.ir/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm3","name":"بله","url":"https://ble.ir/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm4","name":"تلگرام","url":"https://t.me/hamyar_service1","icon":"","handle":"@hamyar_service1"},{"id":"sm5","name":"اینستاگرام","url":"https://instagram.com/hamyar_service1","icon":"","handle":"@hamyar_service1"}]'::jsonb),
  ('payment', '{"gateway":"mock","autoSettle":false,"currency":"IRT"}'::jsonb),
  ('contact', '{"phone":"","address":"","email":""}'::jsonb);

-- === 13) Notification settings — table: notification_settings
-- Single row; `config` carries types, per-type colours and the section
-- routing the admin UI expects.
insert into notification_settings (config) values
  ('{"enabled":true,"maxItems":200,"showPopups":true,"popupSeconds":6,"soundEnabled":false,"defaultPriority":"normal","types":[{"id":"order","label":"سفارش جدید","color":"#2563eb","icon":"🛒","enabled":true,"builtin":true,"deletable":false,"eventLabel":"ثبت سفارش خدمات و پروژه‌ها","sectionPath":"/admin/orders"},{"id":"ticket","label":"تیکت پشتیبانی","color":"#d946ef","icon":"🎫","enabled":true,"builtin":true,"deletable":false,"eventLabel":"باز شدن تیکت جدید توسط مشتری","sectionPath":"/admin/tickets"},{"id":"payment","label":"پرداخت و مالی","color":"#16a34a","icon":"💳","enabled":true,"builtin":true,"deletable":false,"eventLabel":"پرداخت آنلاین موفق و صدور رسید","sectionPath":"/admin/invoices"},{"id":"review","label":"نظر مشتری","color":"#ca8a04","icon":"⭐","enabled":true,"builtin":true,"deletable":false,"eventLabel":"ثبت نظر جدید در انتظار تایید","sectionPath":"/admin/reviews"},{"id":"stock","label":"موجودی انبار","color":"#dc2626","icon":"📦","enabled":true,"builtin":true,"deletable":false,"eventLabel":"رسیدن موجودی محصول به آستانه هشدار","sectionPath":"/admin/products"},{"id":"user","label":"کاربر جدید","color":"#ea580c","icon":"👤","enabled":true,"builtin":true,"deletable":false,"eventLabel":"عضویت مشتری جدید","sectionPath":"/admin/customers"},{"id":"system","label":"سیستمی","color":"#0891b2","icon":"⚙️","enabled":true,"builtin":true,"deletable":false,"eventLabel":"پشتیبان‌گیری خودکار و اطلاع‌رسانی دستی مدیر","sectionPath":"/admin/backup"},{"id":"note","label":"یادداشت کاری","color":"#7c3aed","icon":"📝","enabled":true,"builtin":true,"deletable":false,"eventLabel":"ایجاد یادداشت کاری جدید","sectionPath":"/admin/notes"}]}'::jsonb);
