# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.test.ts >> Hamyar Full E2E Flow >> Admin login and dashboard access
- Location: e2e\full-flow.test.ts:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=داشبورد ادمین, text=Admin Dashboard')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=داشبورد ادمین, text=Admin Dashboard') with timeout 10000ms
  - waiting for locator('text=داشبورد ادمین, text=Admin Dashboard')

```

```yaml
- complementary:
  - text: H پنل مدیریت
  - navigation:
    - link "داشبورد":
      - /url: /admin
      - img
      - text: داشبورد
    - link "تحلیل و گزارش":
      - /url: /admin/analytics
      - img
      - text: تحلیل و گزارش
    - link "دیجیتال مارکتینگ":
      - /url: /admin/digital-marketing
      - img
      - text: دیجیتال مارکتینگ
    - link "همکاران":
      - /url: /admin/affiliates
      - img
      - text: همکاران
    - link "پرسونای مخاطب":
      - /url: /admin/personas
      - img
      - text: پرسونای مخاطب
    - link "سفارش‌ها":
      - /url: /admin/orders
      - img
      - text: سفارش‌ها
    - link "یادداشت‌ها":
      - /url: /admin/notes
      - img
      - text: یادداشت‌ها
    - link "مشتریان":
      - /url: /admin/customers
      - img
      - text: مشتریان
    - link "کدهای دعوت":
      - /url: /admin/invites
      - img
      - text: کدهای دعوت
    - link "محصولات":
      - /url: /admin/products
      - img
      - text: محصولات
    - link "کالکشن مدیا":
      - /url: /admin/media
      - img
      - text: کالکشن مدیا
    - link "خدمات":
      - /url: /admin/services
      - img
      - text: خدمات
    - link "پروژه‌ها":
      - /url: /admin/projects
      - img
      - text: پروژه‌ها
    - link "حسابداری":
      - /url: /admin/finance
      - img
      - text: حسابداری
    - link "فاکتورها":
      - /url: /admin/invoices
      - img
      - text: فاکتورها
    - link "کارمندان":
      - /url: /admin/employees
      - img
      - text: کارمندان
    - link "OKR و KPI":
      - /url: /admin/okr-kpi
      - img
      - text: OKR و KPI
    - link "تأمین‌کنندگان":
      - /url: /admin/suppliers
      - img
      - text: تأمین‌کنندگان
    - link "کمپین تخفیف":
      - /url: /admin/campaigns
      - img
      - text: کمپین تخفیف
    - link "پیامک انبوه":
      - /url: /admin/sms
      - img
      - text: پیامک انبوه
    - link "نظرات":
      - /url: /admin/reviews
      - img
      - text: نظرات
    - link "تیکت و پشتیبانی":
      - /url: /admin/tickets
      - img
      - text: تیکت و پشتیبانی
    - link "اعلان‌ها ۴۵":
      - /url: /admin/notifications
      - img
      - text: اعلان‌ها ۴۵
    - link "تیم تولید محتوا":
      - /url: /admin/content-team
      - img
      - text: تیم تولید محتوا
    - link "کنترل دسترسی (RBAC)":
      - /url: /admin/rbac
      - img
      - text: کنترل دسترسی (RBAC)
    - link "آموزش ادمین":
      - /url: /admin/training
      - img
      - text: آموزش ادمین
    - link "لاگ فعالیت":
      - /url: /admin/audit
      - img
      - text: لاگ فعالیت
    - link "پشتیبان‌گیری":
      - /url: /admin/backup
      - img
      - text: پشتیبان‌گیری
    - link "تنظیمات":
      - /url: /admin/settings
      - img
      - text: تنظیمات
  - link "بازگشت به سایت":
    - /url: /
    - img
    - text: بازگشت به سایت
  - button "خروج":
    - img
    - text: خروج
- banner:
  - button:
    - img
  - heading "کافی نت همیار - پنل مدیریت" [level=1]
  - button "اعلان‌ها، 45 خوانده‌نشده":
    - img
    - text: ۴۵
  - text: "👤 مدیر سیستم · نقش: مدیر کل"
  - button "🌙"
- main:
  - heading "داشبورد مدیریت" [level=1]
  - text: ۱۴۰۵ مهر ۱۹, یکشنبه
  - link "۵۰٬۰۰۰ ت درآمد کل":
    - /url: /admin/finance
    - img
    - text: ۵۰٬۰۰۰ ت درآمد کل
  - link "۵۰٬۰۰۰ ت سود خالص":
    - /url: /admin/finance
    - img
    - text: ۵۰٬۰۰۰ ت سود خالص
  - link "9 سفارش‌های باز":
    - /url: /admin/orders
    - img
    - text: 9 سفارش‌های باز
  - link "0 مشتریان":
    - /url: /admin/customers
    - img
    - text: 0 مشتریان
  - heading "هشدارها و اقدامات لازم" [level=3]:
    - img
    - text: هشدارها و اقدامات لازم
  - link "16 محصول با موجودی کم":
    - /url: /admin/products
    - text: 16 محصول با موجودی کم
    - img
  - link "9 سفارش در انتظار انجام":
    - /url: /admin/orders
    - text: 9 سفارش در انتظار انجام
    - img
  - heading "آمار بخش‌ها" [level=3]
  - link "62 محصولات":
    - /url: /admin/products
    - img
    - text: 62 محصولات
  - link "50 عناوین مدیا":
    - /url: /admin/media
    - img
    - text: 50 عناوین مدیا
  - link "61 خدمات فعال":
    - /url: /admin/services
    - img
    - text: 61 خدمات فعال
  - link "0 پروژه‌های طراحی":
    - /url: /admin/projects
    - img
    - text: 0 پروژه‌های طراحی
  - link "0 پروژه‌های محتوا":
    - /url: /admin/content-team
    - img
    - text: 0 پروژه‌های محتوا
  - link "0 ایده‌های جدید":
    - /url: /admin/content-team
    - img
    - text: 0 ایده‌های جدید
  - link "3 تأمین‌کنندگان":
    - /url: /admin/suppliers
    - img
    - text: 3 تأمین‌کنندگان
  - link "2 کمپین‌های فعال":
    - /url: /admin/campaigns
    - img
    - text: 2 کمپین‌های فعال
  - link "3 کارمندان":
    - /url: /admin/employees
    - img
    - text: 3 کارمندان
  - link "7 کاربران سیستم":
    - /url: /admin/rbac
    - img
    - text: 7 کاربران سیستم
  - link "8 نقش‌ها":
    - /url: /admin/rbac
    - img
    - text: 8 نقش‌ها
  - link "0 دعوت‌های موفق":
    - /url: /admin/invites
    - img
    - text: 0 دعوت‌های موفق
  - heading "درآمد به تفکیک جریان" [level=3]
  - link "خدمات کافی‌نت ۰ ت":
    - /url: /admin/services
  - link "کپی مدیا ۰ ت":
    - /url: /admin/media
  - link "فروش کالا ۵۰٬۰۰۰ ت":
    - /url: /admin/products
  - link "طراحی سایت ۰ ت":
    - /url: /admin/projects
  - heading "پروژه‌های فوری محتوا" [level=3]:
    - img
    - text: پروژه‌های فوری محتوا
  - link "مشاهده همه":
    - /url: /admin/content-team
  - paragraph: پروژه فوری وجود ندارد
  - heading "نظرات در انتظار تایید" [level=3]:
    - img
    - text: نظرات در انتظار تایید
  - link "مشاهده همه":
    - /url: /admin/reviews
  - paragraph: نظر در انتظاری وجود ندارد
  - heading "آخرین پروژه‌های محتوا" [level=3]:
    - img
    - text: آخرین پروژه‌های محتوا
  - link "مشاهده همه":
    - /url: /admin/content-team
  - paragraph: پروژه‌ای ثبت نشده
  - heading "اعلان‌های اخیر ۴۵ خوانده‌نشده" [level=3]:
    - img
    - text: اعلان‌های اخیر ۴۵ خوانده‌نشده
  - link "مشاهده همه":
    - /url: /admin/notifications
  - text: 💳 پرداخت و مالی رسید تحویل صادر شد
  - paragraph: رسید «RCPT-2026-1011-HMY722A9FBFAA» برای سفارش HMY-722A9FBFAA به مبلغ ۶٬۵۰۰٬۰۰۰ تومان صادر شد.
  - text: ۷ ساعت پیش 💳 پرداخت و مالی رسید تحویل صادر شد
  - paragraph: رسید «RCPT-2026-1011-HMY44631D6B72» برای سفارش HMY-44631D6B72 به مبلغ ۶٬۵۰۰٬۰۰۰ تومان صادر شد.
  - text: "۷ ساعت پیش 🎫 تیکت پشتیبانی تیکت جدید: جججججج"
  - paragraph: علی شیری تیکت «جججججج» (عمومی) با اولویت عادی باز کرد.
  - text: "۵ روز پیش 🎫 تیکت پشتیبانی تیکت جدید: جججججج"
  - paragraph: علی شیری تیکت «جججججج» (عمومی) با اولویت عادی باز کرد.
  - text: "۵ روز پیش 🎫 تیکت پشتیبانی تیکت جدید: جججججج"
  - paragraph: علی شیری تیکت «جججججج» (عمومی) با اولویت عادی باز کرد.
  - text: ۵ روز پیش 💳 پرداخت و مالی رسید تحویل صادر شد
  - paragraph: رسید «RCPT-2026-1006-HMYEEFDA816BA» برای سفارش HMY-EEFDA816BA به مبلغ ۶٬۵۰۰٬۰۰۰ تومان صادر شد.
  - text: ۵ روز پیش
  - heading "آخرین سفارش‌ها" [level=3]
  - link "مشاهده همه":
    - /url: /admin/orders
  - table:
    - rowgroup:
      - row "کد رهگیری مشتری نوع وضعیت مبلغ":
        - columnheader "کد رهگیری"
        - columnheader "مشتری"
        - columnheader "نوع"
        - columnheader "وضعیت"
        - columnheader "مبلغ"
    - rowgroup:
      - row "HMY-722A9FBFAA product new ۶٬۵۰۰٬۰۰۰":
        - cell "HMY-722A9FBFAA"
        - cell
        - cell "product"
        - cell "new"
        - cell "۶٬۵۰۰٬۰۰۰"
      - row "HMY-EEFDA816BA product new ۶٬۵۰۰٬۰۰۰":
        - cell "HMY-EEFDA816BA"
        - cell
        - cell "product"
        - cell "new"
        - cell "۶٬۵۰۰٬۰۰۰"
      - row "HMY-83944C89BE product new ۶٬۵۰۰٬۰۰۰":
        - cell "HMY-83944C89BE"
        - cell
        - cell "product"
        - cell "new"
        - cell "۶٬۵۰۰٬۰۰۰"
      - row "HMY-28A89D6BFE product new ۶٬۵۰۰٬۰۰۰":
        - cell "HMY-28A89D6BFE"
        - cell
        - cell "product"
        - cell "new"
        - cell "۶٬۵۰۰٬۰۰۰"
      - row "HMY-44631D6B72 product new ۶٬۵۰۰٬۰۰۰":
        - cell "HMY-44631D6B72"
        - cell
        - cell "product"
        - cell "new"
        - cell "۶٬۵۰۰٬۰۰۰"
  - heading "دسترسی سریع" [level=3]
  - link "سفارش جدید":
    - /url: /admin/orders
    - img
    - text: سفارش جدید
  - link "محصول جدید":
    - /url: /admin/products
    - img
    - text: محصول جدید
  - link "پروژه محتوا":
    - /url: /admin/content-team
    - img
    - text: پروژه محتوا
  - link "تایید نظرات":
    - /url: /admin/reviews
    - img
    - text: تایید نظرات
  - link "کمپین جدید":
    - /url: /admin/campaigns
    - img
    - text: کمپین جدید
  - link "مدیریت دسترسی":
    - /url: /admin/rbac
    - img
    - text: مدیریت دسترسی
- button "چت پشتیبانی":
  - img
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_EMAIL = 'admin@hamyar.ir';
  4   | const ADMIN_PASSWORD = '123456789';
  5   | const CUSTOMER_EMAIL = 'kafinet.hamyar@gmail.com';
  6   | const CUSTOMER_PASSWORD = '123456789';
  7   | 
  8   | async function login(page, email, password, isAdmin = false) {
  9   |   await page.goto('/auth');
  10  |   await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  11  |   
  12  |   if (isAdmin) {
  13  |     // Click admin tab
  14  |     await page.click('button:has-text("ورود مدیریت")');
  15  |     await page.waitForTimeout(300);
  16  |   }
  17  |   
  18  |   await page.fill('input[type="email"]', email);
  19  |   await page.fill('input[type="password"]', password);
  20  |   
  21  |   if (isAdmin) {
  22  |     await page.click('button:has-text("ورود به پنل مدیریت")');
  23  |   } else {
  24  |     await page.click('button:has-text("ورود"), button:has-text("ثبت‌نام")');
  25  |   }
  26  |   
  27  |   await page.waitForURL(isAdmin ? /\/admin/ : /\/profile|\//, { timeout: 15000 });
  28  | }
  29  | 
  30  | async function waitForRealtime(page, selector, timeout = 10000) {
  31  |   await page.waitForSelector(selector, { state: 'visible', timeout });
  32  | }
  33  | 
  34  | test.describe('Hamyar Full E2E Flow', () => {
  35  |   test.beforeEach(async ({ page }) => {
  36  |     page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  37  |     page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));
  38  |   });
  39  | 
  40  |   test('Admin login and dashboard access', async ({ page }) => {
  41  |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
  42  |     await expect(page).toHaveURL(/\/admin/);
> 43  |     await expect(page.locator('text=داشبورد ادمین, text=Admin Dashboard')).toBeVisible({ timeout: 10000 });
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  44  |   });
  45  | 
  46  |   test('Customer login and dashboard access', async ({ page }) => {
  47  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, false);
  48  |     await expect(page).toHaveURL(/\/profile|\//);
  49  |   });
  50  | 
  51  |   test('Admin can see orders page', async ({ page }) => {
  52  |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
  53  |     await page.goto('/admin/orders');
  54  |     await waitForRealtime(page, 'table, .orders-list, [data-testid="orders-table"]');
  55  |     console.log('Admin orders page loaded');
  56  |   });
  57  | 
  58  |   test('Customer places service order', async ({ page }) => {
  59  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  60  |     await page.goto('/services');
  61  |     await waitForRealtime(page, '.service-card, [data-testid="service-card"], button:has-text("سفارش")', 15000);
  62  |     
  63  |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
  64  |     const count = await orderButtons.count();
  65  |     if (count > 0) {
  66  |       await orderButtons.first().click();
  67  |       await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
  68  |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
  69  |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  70  |       console.log('Service order placed');
  71  |     } else {
  72  |       console.log('No services available to order');
  73  |     }
  74  |   });
  75  | 
  76  |   test('Customer places product order', async ({ page }) => {
  77  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  78  |     await page.goto('/shop');
  79  |     await waitForRealtime(page, '.product-card, [data-testid="product-card"], button:has-text("افزودن"), button:has-text("Add to cart")', 15000);
  80  |     
  81  |     const addButtons = page.locator('button:has-text("افزودن"), button:has-text("Add to cart"), .add-to-cart');
  82  |     const count = await addButtons.count();
  83  |     if (count > 0) {
  84  |       await addButtons.first().click();
  85  |       await page.waitForTimeout(1000);
  86  |       await page.goto('/cart');
  87  |       await waitForRealtime(page, 'button:has-text("تسویه"), button:has-text("Checkout")');
  88  |       await page.click('button:has-text("تسویه"), button:has-text("Checkout")');
  89  |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  90  |       console.log('Product order placed');
  91  |     } else {
  92  |       console.log('No products available to order');
  93  |     }
  94  |   });
  95  | 
  96  |   test('Customer places media order', async ({ page }) => {
  97  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  98  |     await page.goto('/media');
  99  |     await waitForRealtime(page, '.media-card, [data-testid="media-card"], button:has-text("سفارش"), button:has-text("Order")', 15000);
  100 |     
  101 |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
  102 |     const count = await orderButtons.count();
  103 |     if (count > 0) {
  104 |       await orderButtons.first().click();
  105 |       await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
  106 |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
  107 |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  108 |       console.log('Media order placed');
  109 |     } else {
  110 |       console.log('No media available to order');
  111 |     }
  112 |   });
  113 | 
  114 |   test('Customer creates webdesign project order', async ({ page }) => {
  115 |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  116 |     await page.goto('/webdesign');
  117 |     await waitForRealtime(page, 'button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")', 15000);
  118 |     
  119 |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")');
  120 |     const count = await orderButtons.count();
  121 |     if (count > 0) {
  122 |       await orderButtons.first().click();
  123 |       await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
  124 |       await page.fill('textarea, input[type="text"]', 'Test webdesign project from E2E test');
  125 |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت"), button:has-text("Send")');
  126 |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد, text=Created', { timeout: 10000 });
  127 |       console.log('Webdesign project order placed');
  128 |     } else {
  129 |       console.log('No webdesign order option available');
  130 |     }
  131 |   });
  132 | 
  133 |   test('Customer creates content project order', async ({ page }) => {
  134 |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  135 |     await page.goto('/content');
  136 |     await waitForRealtime(page, 'button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")', 15000);
  137 |     
  138 |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")');
  139 |     const count = await orderButtons.count();
  140 |     if (count > 0) {
  141 |       await orderButtons.first().click();
  142 |       await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
  143 |       await page.fill('textarea, input[type="text"]', 'Test content project from E2E test');
```