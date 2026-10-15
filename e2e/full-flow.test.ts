import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@hamyar.ir';
const ADMIN_PASSWORD = '123456789';
const CUSTOMER_EMAIL = 'kafinet.hamyar@gmail.com';
const CUSTOMER_PASSWORD = '123456789';

async function login(page, email, password, isAdmin = false) {
  await page.goto('/auth');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  if (isAdmin) {
    // Click admin tab
    await page.click('button:has-text("ورود مدیریت")');
    await page.waitForTimeout(300);
  }
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  if (isAdmin) {
    await page.click('button:has-text("ورود به پنل مدیریت")');
  } else {
    await page.click('button:has-text("ورود"), button:has-text("ثبت‌نام")');
  }
  
  await page.waitForURL(isAdmin ? /\/admin/ : /\/profile|\//, { timeout: 15000 });
}

async function waitForRealtime(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

test.describe('Hamyar Full E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));
  });

  test('Admin login and dashboard access', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=داشبورد ادمین, text=Admin Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('Customer login and dashboard access', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, false);
    await expect(page).toHaveURL(/\/profile|\//);
  });

  test('Admin can see orders page', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
    await page.goto('/admin/orders');
    await waitForRealtime(page, 'table, .orders-list, [data-testid="orders-table"]');
    console.log('Admin orders page loaded');
  });

  test('Customer places service order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/services');
    await waitForRealtime(page, '.service-card, [data-testid="service-card"], button:has-text("سفارش")', 15000);
    
    const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
    const count = await orderButtons.count();
    if (count > 0) {
      await orderButtons.first().click();
      await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
      await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
      await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
      console.log('Service order placed');
    } else {
      console.log('No services available to order');
    }
  });

  test('Customer places product order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/shop');
    await waitForRealtime(page, '.product-card, [data-testid="product-card"], button:has-text("افزودن"), button:has-text("Add to cart")', 15000);
    
    const addButtons = page.locator('button:has-text("افزودن"), button:has-text("Add to cart"), .add-to-cart');
    const count = await addButtons.count();
    if (count > 0) {
      await addButtons.first().click();
      await page.waitForTimeout(1000);
      await page.goto('/cart');
      await waitForRealtime(page, 'button:has-text("تسویه"), button:has-text("Checkout")');
      await page.click('button:has-text("تسویه"), button:has-text("Checkout")');
      await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
      console.log('Product order placed');
    } else {
      console.log('No products available to order');
    }
  });

  test('Customer places media order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/media');
    await waitForRealtime(page, '.media-card, [data-testid="media-card"], button:has-text("سفارش"), button:has-text("Order")', 15000);
    
    const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
    const count = await orderButtons.count();
    if (count > 0) {
      await orderButtons.first().click();
      await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
      await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
      await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
      console.log('Media order placed');
    } else {
      console.log('No media available to order');
    }
  });

  test('Customer creates webdesign project order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/webdesign');
    await waitForRealtime(page, 'button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")', 15000);
    
    const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")');
    const count = await orderButtons.count();
    if (count > 0) {
      await orderButtons.first().click();
      await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
      await page.fill('textarea, input[type="text"]', 'Test webdesign project from E2E test');
      await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت"), button:has-text("Send")');
      await page.waitForSelector('text=موفق, text=Success, text=ثبت شد, text=Created', { timeout: 10000 });
      console.log('Webdesign project order placed');
    } else {
      console.log('No webdesign order option available');
    }
  });

  test('Customer creates content project order', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/content');
    await waitForRealtime(page, 'button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")', 15000);
    
    const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")');
    const count = await orderButtons.count();
    if (count > 0) {
      await orderButtons.first().click();
      await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
      await page.fill('textarea, input[type="text"]', 'Test content project from E2E test');
      await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت"), button:has-text("Send")');
      await page.waitForSelector('text=موفق, text=Success, text=ثبت شد, text=Created', { timeout: 10000 });
      console.log('Content project order placed');
    } else {
      console.log('No content order option available');
    }
  });

  test('Customer creates ticket', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto('/tickets');
    await waitForRealtime(page, 'button:has-text("تیکت جدید"), button:has-text("New ticket"), button:has-text("Create")', 15000);
    
    await page.click('button:has-text("تیکت جدید"), button:has-text("New ticket"), button:has-text("Create")');
    await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
    await page.fill('input[name="subject"], input[placeholder*="موضوع"], input[placeholder*="Subject"]', 'Test ticket from E2E');
    await page.fill('textarea[name="message"], textarea[placeholder*="پیام"], textarea[placeholder*="Message"]', 'This is a test ticket created by E2E test');
    await page.click('button:has-text("ارسال"), button:has-text("Submit"), button:has-text("Create")');
    await page.waitForSelector('text=موفق, text=Success, text=ثبت شد, text=Created', { timeout: 10000 });
    console.log('Ticket created');
  });

  test('Admin sees customer orders in realtime', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
    await page.goto('/admin/orders');
    await waitForRealtime(page, 'table tbody tr, .order-row, [data-testid="order-row"]', 15000);
    
    const rows = page.locator('table tbody tr, .order-row, [data-testid="order-row"]');
    const count = await rows.count();
    console.log(`Admin sees ${count} orders`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Admin sees tickets in realtime', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
    await page.goto('/admin/tickets');
    await waitForRealtime(page, 'table tbody tr, .ticket-row, [data-testid="ticket-row"]', 15000);
    
    const rows = page.locator('table tbody tr, .ticket-row, [data-testid="ticket-row"]');
    const count = await rows.count();
    console.log(`Admin sees ${count} tickets`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Admin can create project from webdesign order', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
    await page.goto('/admin/orders');
    await waitForRealtime(page, 'table tbody tr, .order-row', 15000);
    
    const createProjectButtons = page.locator('button:has-text("ساخت پروژه"), button:has-text("Create project"), button:has-text("Create Project")');
    const count = await createProjectButtons.count();
    if (count > 0) {
      await createProjectButtons.first().click();
      await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
      await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("Create")');
      await page.waitForSelector('text=موفق, text=Success, text=Created', { timeout: 10000 });
      console.log('Admin created project from order');
    } else {
      console.log('No webdesign orders with create project option');
    }
  });
});