# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.test.ts >> Hamyar Full E2E Flow >> Admin can see orders page
- Location: e2e\full-flow.test.ts:51:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('table, .orders-list, [data-testid="orders-table"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - complementary [ref=f1e4]:
      - generic [ref=f1e5]:
        - generic [ref=f1e6]:
          - generic [ref=f1e7]: H
          - generic [ref=f1e8]: پنل مدیریت
        - navigation:
          - link "داشبورد" [ref=f1e9] [cursor=pointer]:
            - /url: /admin
          - link "تحلیل و گزارش" [ref=f1e15] [cursor=pointer]:
            - /url: /admin/analytics
          - link "دیجیتال مارکتینگ" [ref=f1e18] [cursor=pointer]:
            - /url: /admin/digital-marketing
          - link "همکاران" [ref=f1e22] [cursor=pointer]:
            - /url: /admin/affiliates
          - link "پرسونای مخاطب" [ref=f1e28] [cursor=pointer]:
            - /url: /admin/personas
          - link "سفارش‌ها" [ref=f1e34] [cursor=pointer]:
            - /url: /admin/orders
          - link "یادداشت‌ها" [ref=f1e39] [cursor=pointer]:
            - /url: /admin/notes
          - link "مشتریان" [ref=f1e43] [cursor=pointer]:
            - /url: /admin/customers
          - link "کدهای دعوت" [ref=f1e49] [cursor=pointer]:
            - /url: /admin/invites
          - link "محصولات" [ref=f1e54] [cursor=pointer]:
            - /url: /admin/products
          - link "کالکشن مدیا" [ref=f1e59] [cursor=pointer]:
            - /url: /admin/media
          - link "خدمات" [ref=f1e62] [cursor=pointer]:
            - /url: /admin/services
          - link "پروژه‌ها" [ref=f1e65] [cursor=pointer]:
            - /url: /admin/projects
          - link "حسابداری" [ref=f1e68] [cursor=pointer]:
            - /url: /admin/finance
          - link "فاکتورها" [ref=f1e71] [cursor=pointer]:
            - /url: /admin/invoices
          - link "کارمندان" [ref=f1e75] [cursor=pointer]:
            - /url: /admin/employees
          - link "OKR و KPI" [ref=f1e88] [cursor=pointer]:
            - /url: /admin/okr-kpi
          - link "تأمین‌کنندگان" [ref=f1e93] [cursor=pointer]:
            - /url: /admin/suppliers
          - link "کمپین تخفیف" [ref=f1e99] [cursor=pointer]:
            - /url: /admin/campaigns
          - link "پیامک انبوه" [ref=f1e104] [cursor=pointer]:
            - /url: /admin/sms
          - link "نظرات" [ref=f1e107] [cursor=pointer]:
            - /url: /admin/reviews
          - link "تیکت و پشتیبانی" [ref=f1e110] [cursor=pointer]:
            - /url: /admin/tickets
          - link "اعلان‌ها ۷۶" [ref=f1e118] [cursor=pointer]:
            - /url: /admin/notifications
            - generic: اعلان‌ها
            - generic [ref=f1e122]: ۷۶
          - link "تیم تولید محتوا" [ref=f1e123] [cursor=pointer]:
            - /url: /admin/content-team
          - link "کنترل دسترسی (RBAC)" [ref=f1e127] [cursor=pointer]:
            - /url: /admin/rbac
          - link "آموزش ادمین" [ref=f1e130] [cursor=pointer]:
            - /url: /admin/training
          - link "لاگ فعالیت" [ref=f1e134] [cursor=pointer]:
            - /url: /admin/audit
          - link "پشتیبان‌گیری" [ref=f1e137] [cursor=pointer]:
            - /url: /admin/backup
          - link "تنظیمات" [ref=f1e141] [cursor=pointer]:
            - /url: /admin/settings
        - generic:
          - link "بازگشت به سایت" [ref=f1e145] [cursor=pointer]:
            - /url: /
          - button "خروج" [ref=f1e148]
    - generic [ref=f1e152]:
      - banner [ref=f1e153]:
        - generic [ref=f1e154]:
          - button [ref=f1e155]
          - heading "کافی نت همیار - پنل مدیریت" [level=1] [ref=f1e157]
        - generic [ref=f1e158]:
          - button "اعلان‌ها، 76 خوانده‌نشده" [ref=f1e160]:
            - generic [ref=f1e164]: ۷۶
          - button "🌙" [ref=f1e165]
      - main [ref=f1e166]:
        - generic [ref=f1e167]:
          - generic [ref=f1e168]:
            - heading "مدیریت سفارش‌ها" [level=1] [ref=f1e169]
            - generic [ref=f1e170]:
              - generic [ref=f1e171]:
                - button "کانبان" [ref=f1e172]
                - button "لیست" [ref=f1e174]
              - button "سفارش جدید" [ref=f1e176]
          - generic [ref=f1e178]:
            - generic [ref=f1e179]:
              - generic [ref=f1e180]: "9"
              - generic [ref=f1e181]: کل سفارش‌ها
            - generic [ref=f1e182]:
              - generic [ref=f1e183]: "9"
              - generic [ref=f1e184]: جدید
            - generic [ref=f1e185]:
              - generic [ref=f1e186]: "0"
              - generic [ref=f1e187]: در حال انجام
            - generic [ref=f1e188]:
              - generic [ref=f1e189]: "0"
              - generic [ref=f1e190]: آماده
            - generic [ref=f1e191]:
              - generic [ref=f1e192]: "0"
              - generic [ref=f1e193]: تحویل شده
          - generic [ref=f1e194]:
            - textbox "جستجو بر اساس نام مشتری یا کد رهگیری..." [ref=f1e199]
            - combobox [ref=f1e200]:
              - option "همه وضعیت‌ها" [selected]
              - option "جدید"
              - option "در حال انجام"
              - option "آماده"
              - option "تحویل شد"
              - option "لغو"
            - combobox [ref=f1e201]:
              - option "همه انواع" [selected]
              - option "خدمات"
              - option "مدیا"
              - option "کالا"
              - option "طراحی سایت"
              - option "تولید محتوا"
          - generic [ref=f1e203]:
            - generic [ref=f1e204]:
              - generic [ref=f1e206]:
                - heading "جدید" [level=3] [ref=f1e207]
                - generic [ref=f1e208]: "9"
              - generic [ref=f1e209]:
                - generic [ref=f1e210]:
                  - generic [ref=f1e212]:
                    - paragraph [ref=f1e213]: HMY-TEST01
                    - heading "مهدی ولی زاده (تست)" [level=4] [ref=f1e214]
                  - generic [ref=f1e215]:
                    - generic [ref=f1e216]: عادی
                    - generic [ref=f1e217]: کالا
                    - generic [ref=f1e218]: وب‌سایت
                  - generic [ref=f1e219]:
                    - generic [ref=f1e220]:
                      - generic [ref=f1e221]: "مبلغ کل:"
                      - generic [ref=f1e222]: ۵۰٬۰۰۰ ت
                    - generic [ref=f1e223]:
                      - generic [ref=f1e224]: "پرداخت شده:"
                      - generic [ref=f1e225]: ۵۰٬۰۰۰ ت
                  - generic [ref=f1e226]: 1405/07/19
                  - generic [ref=f1e231]:
                    - button "ویرایش" [ref=f1e232]
                    - button "حذف" [ref=f1e233]
                - generic [ref=f1e234]:
                  - generic [ref=f1e236]:
                    - paragraph [ref=f1e237]: HMY-E29F41888D
                    - heading [level=4]
                  - generic [ref=f1e238]:
                    - generic [ref=f1e239]: عادی
                    - generic [ref=f1e240]: تولید محتوا
                    - generic [ref=f1e241]: وب‌سایت
                  - generic [ref=f1e242]:
                    - generic [ref=f1e243]:
                      - generic [ref=f1e244]: "مبلغ کل:"
                      - generic [ref=f1e245]: ۳۰٬۰۰۰٬۰۰۰ ت
                    - generic [ref=f1e246]:
                      - generic [ref=f1e247]: "پرداخت شده:"
                      - generic [ref=f1e248]: ۰ ت
                  - generic [ref=f1e249]: 1405/07/14
                  - generic [ref=f1e254]:
                    - button "جزئیات" [ref=f1e255]
                    - button "ویرایش" [ref=f1e259]
                    - button "حذف" [ref=f1e260]
                - generic [ref=f1e261]:
                  - generic [ref=f1e263]:
                    - paragraph [ref=f1e264]: HMY-B6A557528D
                    - heading [level=4]
                  - generic [ref=f1e265]:
                    - generic [ref=f1e266]: عادی
                    - generic [ref=f1e267]: طراحی سایت
                    - generic [ref=f1e268]: وب‌سایت
                  - generic [ref=f1e269]:
                    - generic [ref=f1e270]:
                      - generic [ref=f1e271]: "مبلغ کل:"
                      - generic [ref=f1e272]: ۱۵٬۰۰۰٬۰۰۰ ت
                    - generic [ref=f1e273]:
                      - generic [ref=f1e274]: "پرداخت شده:"
                      - generic [ref=f1e275]: ۰ ت
                  - generic [ref=f1e276]: 1405/07/14
                  - generic [ref=f1e281]:
                    - button "جزئیات" [ref=f1e282]
                    - button "ویرایش" [ref=f1e286]
                    - button "حذف" [ref=f1e287]
                - generic [ref=f1e288]:
                  - generic [ref=f1e290]:
                    - paragraph [ref=f1e291]: HMY-1E48C6F254
                    - heading [level=4]
                  - generic [ref=f1e292]:
                    - generic [ref=f1e293]: عادی
                    - generic [ref=f1e294]: کالا
                    - generic [ref=f1e295]: وب‌سایت
                  - generic [ref=f1e296]:
                    - generic [ref=f1e297]:
                      - generic [ref=f1e298]: "مبلغ کل:"
                      - generic [ref=f1e299]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e300]:
                      - generic [ref=f1e301]: "پرداخت شده:"
                      - generic [ref=f1e302]: ۰ ت
                  - generic [ref=f1e303]: 1405/07/14
                  - generic [ref=f1e308]:
                    - button "ویرایش" [ref=f1e309]
                    - button "حذف" [ref=f1e310]
                - generic [ref=f1e311]:
                  - generic [ref=f1e313]:
                    - paragraph [ref=f1e314]: HMY-44631D6B72
                    - heading [level=4]
                  - generic [ref=f1e315]:
                    - generic [ref=f1e316]: عادی
                    - generic [ref=f1e317]: کالا
                    - generic [ref=f1e318]: وب‌سایت
                  - generic [ref=f1e319]:
                    - generic [ref=f1e320]:
                      - generic [ref=f1e321]: "مبلغ کل:"
                      - generic [ref=f1e322]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e323]:
                      - generic [ref=f1e324]: "پرداخت شده:"
                      - generic [ref=f1e325]: ۰ ت
                  - generic [ref=f1e326]: 1405/07/14
                  - generic [ref=f1e331]:
                    - button "ویرایش" [ref=f1e332]
                    - button "حذف" [ref=f1e333]
                - generic [ref=f1e334]:
                  - generic [ref=f1e336]:
                    - paragraph [ref=f1e337]: HMY-28A89D6BFE
                    - heading [level=4]
                  - generic [ref=f1e338]:
                    - generic [ref=f1e339]: عادی
                    - generic [ref=f1e340]: کالا
                    - generic [ref=f1e341]: وب‌سایت
                  - generic [ref=f1e342]:
                    - generic [ref=f1e343]:
                      - generic [ref=f1e344]: "مبلغ کل:"
                      - generic [ref=f1e345]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e346]:
                      - generic [ref=f1e347]: "پرداخت شده:"
                      - generic [ref=f1e348]: ۰ ت
                  - generic [ref=f1e349]: 1405/07/14
                  - generic [ref=f1e354]:
                    - button "ویرایش" [ref=f1e355]
                    - button "حذف" [ref=f1e356]
                - generic [ref=f1e357]:
                  - generic [ref=f1e359]:
                    - paragraph [ref=f1e360]: HMY-83944C89BE
                    - heading [level=4]
                  - generic [ref=f1e361]:
                    - generic [ref=f1e362]: عادی
                    - generic [ref=f1e363]: کالا
                    - generic [ref=f1e364]: وب‌سایت
                  - generic [ref=f1e365]:
                    - generic [ref=f1e366]:
                      - generic [ref=f1e367]: "مبلغ کل:"
                      - generic [ref=f1e368]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e369]:
                      - generic [ref=f1e370]: "پرداخت شده:"
                      - generic [ref=f1e371]: ۰ ت
                  - generic [ref=f1e372]: 1405/07/14
                  - generic [ref=f1e377]:
                    - button "ویرایش" [ref=f1e378]
                    - button "حذف" [ref=f1e379]
                - generic [ref=f1e380]:
                  - generic [ref=f1e382]:
                    - paragraph [ref=f1e383]: HMY-EEFDA816BA
                    - heading [level=4]
                  - generic [ref=f1e384]:
                    - generic [ref=f1e385]: عادی
                    - generic [ref=f1e386]: کالا
                    - generic [ref=f1e387]: وب‌سایت
                  - generic [ref=f1e388]:
                    - generic [ref=f1e389]:
                      - generic [ref=f1e390]: "مبلغ کل:"
                      - generic [ref=f1e391]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e392]:
                      - generic [ref=f1e393]: "پرداخت شده:"
                      - generic [ref=f1e394]: ۰ ت
                  - generic [ref=f1e395]: 1405/07/14
                  - generic [ref=f1e400]:
                    - button "ویرایش" [ref=f1e401]
                    - button "حذف" [ref=f1e402]
                - generic [ref=f1e403]:
                  - generic [ref=f1e405]:
                    - paragraph [ref=f1e406]: HMY-722A9FBFAA
                    - heading [level=4]
                  - generic [ref=f1e407]:
                    - generic [ref=f1e408]: عادی
                    - generic [ref=f1e409]: کالا
                    - generic [ref=f1e410]: وب‌سایت
                  - generic [ref=f1e411]:
                    - generic [ref=f1e412]:
                      - generic [ref=f1e413]: "مبلغ کل:"
                      - generic [ref=f1e414]: ۶٬۵۰۰٬۰۰۰ ت
                    - generic [ref=f1e415]:
                      - generic [ref=f1e416]: "پرداخت شده:"
                      - generic [ref=f1e417]: ۰ ت
                  - generic [ref=f1e418]: 1405/07/14
                  - generic [ref=f1e423]:
                    - button "ویرایش" [ref=f1e424]
                    - button "حذف" [ref=f1e425]
            - generic [ref=f1e426]:
              - generic [ref=f1e428]:
                - heading "در حال انجام" [level=3] [ref=f1e429]
                - generic [ref=f1e430]: "0"
              - generic [ref=f1e431]: سفارشی وجود ندارد
            - generic [ref=f1e433]:
              - generic [ref=f1e435]:
                - heading "آماده" [level=3] [ref=f1e436]
                - generic [ref=f1e437]: "0"
              - generic [ref=f1e438]: سفارشی وجود ندارد
            - generic [ref=f1e440]:
              - generic [ref=f1e442]:
                - heading "تحویل شد" [level=3] [ref=f1e443]
                - generic [ref=f1e444]: "0"
              - generic [ref=f1e445]: سفارشی وجود ندارد
            - generic [ref=f1e447]:
              - generic [ref=f1e449]:
                - heading "لغو" [level=3] [ref=f1e450]
                - generic [ref=f1e451]: "0"
              - generic [ref=f1e452]: سفارشی وجود ندارد
  - button "چت پشتیبانی" [ref=f1e454]
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
> 31  |   await page.waitForSelector(selector, { state: 'visible', timeout });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
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
  43  |     await expect(page.locator('text=داشبورد ادمین, text=Admin Dashboard')).toBeVisible({ timeout: 10000 });
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
```