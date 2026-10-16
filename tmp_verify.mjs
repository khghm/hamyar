import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:3210';
const browser = await chromium.launch({ channel: 'chrome', executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const page = await browser.newPage();

const responses = [];
const handler = async (r) => {
  const u = r.url();
  if (!u.includes('supabase')) return;
  responses.push(`${r.status()} ${u.replace('https://rcimwpsnekxsxeivpivm.supabase.co/rest/v1/', '')}`);
};
page.on('response', handler);
page.on('console', (m) => console.log('CONSOLE[' + m.type() + ']', m.text().slice(0, 220)));
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 220)));

await page.goto(BASE + '/webdesign', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(12000);

const state = await page.evaluate(() => {
  const titles = Array.from(document.querySelectorAll('h3')).map((h) => h.textContent?.trim());
  const imgs = Array.from(document.querySelectorAll('img')).map((i) => i.getAttribute('src') || '');
  return { lsPortfolio: (localStorage.getItem('hamyar_portfolio') || '').slice(0, 120), titles, imgs };
});
console.log('SUPABASE_IMGS', JSON.stringify(state.imgs.filter((s) => s.includes('/storage/v1/object/public/images/'))));
console.log('LS_PORTFOLIO', state.lsPortfolio);
console.log('H3_TITLES', JSON.stringify(state.titles));
console.log('RESPONSES');
for (const r of responses) console.log('  ', r);

await browser.close();
