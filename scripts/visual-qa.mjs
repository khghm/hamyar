import { chromium } from '@playwright/test';
import fs from 'node:fs';

/**
 * کنترل کیفیت بصری: اسکرین‌شات صفحه‌های کلیدی در چهار بریک‌پوینت + بررسی
 * سرریز افقی، h1، alt تصاویر و هدف لمسی دکمه‌ها.
 *
 * اجرا: node scripts/visual-qa.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'https://hamyar.pardismms.workers.dev';
const OUT = '.screens/qa';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGES = [
  ['/', 'home'],
  ['/services', 'services'],
  ['/store', 'store'],
  ['/news', 'news'],
  ['/about', 'about'],
  ['/contact', 'contact'],
  ['/auth', 'auth'],
];
const VIEWPORTS = [
  [360, 800, 'sm'],
  [768, 900, 'md'],
  [1024, 900, 'lg'],
  [1440, 900, 'xl'],
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let issues = 0;
let warnings = 0;

for (const [width, height, tag] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();

  for (const [path, name] of PAGES) {
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) {
      try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 }); ok = true; } catch { await page.waitForTimeout(1500); }
    }
    if (!ok) { console.log(`✗ ${tag} ${path} — بارگذاری نشد`); issues++; continue; }

    await page.waitForTimeout(1200);
    const report = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const viewW = window.innerWidth;
      // فقط دکمه‌ها (نه لینک‌های متنی) به‌عنوان هدف لمسی سنجیده می‌شوند
      const smallButtons = [...document.querySelectorAll('button')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32);
      }).length;
      const missingAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
      const h1 = document.querySelectorAll('h1').length;
      return { overflow: scrollW > viewW + 1, scrollW, viewW, smallButtons, missingAlt, h1 };
    });

    if (report.overflow) {
      console.log(`✗ ${tag} ${path} — سرریز افقی (${report.scrollW} > ${report.viewW})`);
      issues++;
    }
    if (report.smallButtons > 0) { console.log(`! ${tag} ${path} — ${report.smallButtons} دکمهٔ کوچک`); warnings++; }
    if (report.missingAlt > 0) { console.log(`! ${tag} ${path} — ${report.missingAlt} تصویر بدون alt`); warnings++; }
    if (report.h1 === 0) { console.log(`! ${tag} ${path} — بدون h1`); warnings++; }

    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: false });
  }
  await ctx.close();
}

await browser.close();
console.log(issues === 0
  ? `✓ بدون سرریز افقی در ۴ بریک‌پوینت (${warnings} هشدار جزئی) — ${OUT}`
  : `✗ ${issues} سرریز — ${OUT}`);
process.exit(issues === 0 ? 0 : 1);
