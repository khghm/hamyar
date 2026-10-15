# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.test.ts >> Hamyar Full E2E Flow >> Customer places product order
- Location: e2e\full-flow.test.ts:76:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.product-card, [data-testid="product-card"], button:has-text("افزودن"), button:has-text("Add to cart")') to be visible

```

# Page snapshot

```yaml
- button "چت پشتیبانی" [ref=f1e2]
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
      |              ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
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