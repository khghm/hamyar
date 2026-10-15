#!/usr/bin/env node
// ============================================================================
//  TEMPORARY — حساب‌های تست · فقط برای تست دستی
// ============================================================================
//  این فایل موقتی است. بعد از تست، حذفش با یک دستور انجام می‌شود:
//
//      node scripts/dev/test-accounts.mjs --remove
//
//  و اگر کلاً دیگر لازم نشد:
//      scripts/dev/            ← پوشه را پاک کنید
//  هیچ‌چیزِ دائمی در کد نمانده: نه جدول، نه مهاجرت، نه seed.
// ----------------------------------------------------------------------------
//  چرا اسکریپت و نه seed.sql
//  --------------------------
//  ساخت حساب کاربری یعنی ساخت ردیف در `auth.users`، که فقط از راه
//  `auth.admin.createUser` (کلید service_role) ممکن است. seed.sql از psql اجرا
//  می‌شود و به GoTrue دسترسی مدیریتی ندارد. ضمناً seed در هر بار `db reset` به
//  دیتابیس محلی تزریق می‌شود و برای پروژهٔ ابری اصلاً اجرا نمی‌شود.
//
//  چرا حذف راحت است
//  -----------------
//  هر دو جدولِ `profiles.id` و `staff_accounts.auth_uid` با
//  `references auth.users on delete cascade` تعریف شده‌اند. پس حذفِ کاربر از
//  Auth به‌تنهایی کافی است: پروفایل، سطر کارمند و هر چیز وابسته هم می‌رود.
//  نیازی به ترتیبِ حذف یا پاک‌کردن دستی نیست.
//
//  شماره‌ها همه با پیشوند `0912000` شروع می‌شوند تا در پنل و در
//  `Supabase → Authentication → Users` فوراً قابل تشخیص و یک‌جا پاک شوند.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REMOVE = process.argv.includes('--remove');

// ── تنظیمات ─────────────────────────────────────────────────────────────────
// رمز همهٔ حساب‌ها یکی است تا تایپش راحت باشد. با TEST_ACCOUNTS_PASSWORD قابل
// تغییر است. عمداً ضعیف انتخاب شده چون این حساب‌ها موقتی‌اند و روی پروژهٔ ابری
// ساخته می‌شوند — اگر پروژهٔ واقعی و حساس است، این اسکریپت را اجرا نکنید.
const PASSWORD = process.env.TEST_ACCOUNTS_PASSWORD || 'Test1234!';

// دامنهٔ `example.com` طبق RFC 2606 برای آزمون رزرو شده و هرگز تحویل نمی‌شود.
// با این حال چون حساب‌ها با `email_confirm: true` ساخته می‌شوند، اصلاً ایمیلی
// فرستاده نمی‌شود.
const DOMAIN = 'example.com';

const P = {
  admin: '09120000001',
  staffSales: '09120000002',
  staffServices: '09120000003',
  staffSupport: '09120000004',
  // نقشی که *فقط* perm29 دارد: برای اثبات اینکه نوشتنِ تنظیمات باشگاه مشتریان
  // واقعاً به perm43 بسته شده و تب‌های ویرایشی برایش پنهان می‌مانند.
  staffInviteViewer: '09120000005',
  customer1: '09120000101',
  customer2: '09120000102',
  customer3: '09120000103',
  customer4: '09120000104',
};

const emailOf = key => `${key}.hamyar@${DOMAIN}`;

/** نقش‌های موجود در seed.sql — نام‌ها باید دقیقاً با `roles.name` یکی باشند. */
const STAFF = [
  { key: 'admin', name: 'مدیر تست', role: 'مدیر کل' },
  { key: 'staffSales', name: 'کارمند فروش تست', role: 'مدیر فروش' },
  { key: 'staffServices', name: 'اپراتور خدمات تست', role: 'اپراتور خدمات' },
  { key: 'staffSupport', name: 'پشتیبان تست', role: 'کارشناس پشتیبانی' },
  { key: 'staffInviteViewer', name: 'ناظر دعوت تست', role: '__TEST_VIEWER__' },
].map(s => ({ ...s, phone: P[s.key], email: emailOf(s.key) }));

/** مشتری‌ها؛ یکی با کد دعوتِ کارمند فروش تا مسیر referral هم تست شود. */
const CUSTOMERS = ['customer1', 'customer2', 'customer3', 'customer4'].map(k => ({
  key: k,
  phone: P[k],
  email: emailOf(k),
  name: `مشتری تست ${k.slice(-1)}`,
}));

const VIEWER_ROLE = {
  name: '__TEST_VIEWER__',
  description: 'نقش موقت تست — فقط perm29 (مشاهده دعوت‌ها)',
  permissions: ['perm29'],
};

// ── دو قالب شماره، و چرا فرق دارند ────────────────────────────────────────
// Supabase Auth با **ایمیل** کار می‌کند، چون ارائه‌دهندهٔ Phone روی این پروژه
// خاموش است (برای روشن‌شدن به اعتبارنامهٔ شرکت پیامک نیاز دارد). شمارهٔ موبایل
// هنوز دادهٔ پروفایل است: `profiles.phone` و `staff_accounts.phone` قید CHECK
// `^09[0-9]{9}$` دارند، پس آنجا **فرمت محلی** لازم است و همان به
// `create_staff_account` داده می‌شود.
//
// نکتهٔ تاریخی که در کد اصلاح شد: قبلاً `createUser` شمارهٔ محلی می‌گرفت و GoTrue
// آن را رد می‌کرد («Invalid phone number format (E.164 required)»).

/** ایمیل‌های تست، برای پیدا کردن/پاک‌کردن دستی در داشبورد. */
const ALL_EMAILS = [...STAFF, ...CUSTOMERS].map(a => a.email);

// ── خواندن تنظیمات ─────────────────────────────────────────────────────────
function loadEnv() {
  const file = resolve(ROOT, '.env');
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    // از انتهای خط توضیح (# ...) و کوتیشن‌های دور مقدار پاک می‌شویم.
    if (m) out[m[1]] = m[2].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = loadEnv();
const URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error(
    [
      'یکی از این دو مقدار کم است — یکی از راه‌های زیر بدهید:',
      '',
      '  • در فایل .env پروژه اضافه کنید:',
      '      SUPABASE_SERVICE_ROLE_KEY=<کلید service_role>',
      '    کلید از: Supabase → Project Settings → API → service_role',
      '    (فایل .env در .gitignore است، پس commit نمی‌شود)',
      '',
      '  • یا فقط برای همین اجرا، در محیط:',
      '      $env:SUPABASE_SERVICE_ROLE_KEY = "..."   # PowerShell',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// service_role از RLS عبور می‌کند؛ این دقیقاً همان کاری است که Edge Function
// `create-staff` انجام می‌دهد، با این تفاوت که اینجا مستقیم صدا زده می‌شود.
const db = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** کلاینت فقط‌خواندنی، برای بررسی اینکه ورود با شماره اصلاً فعال است یا نه. */
const pub = createClient(URL, env.VITE_SUPABASE_PUBLISHABLE_KEY || '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * آیا ارائه‌دهندهٔ Email روی پروژه روشن است؟
 *
 * اگر خاموش باشد، حساب‌ها ساخته می‌شوند ولی هیچ‌کس نمی‌تواند وارد شود — و خطای
 * GoTrue برای کاربر پنل گنگ است. این بررسی هیچ چیزی را تغییر نمی‌دهد؛ فقط یک تلاش
 * ورودِ عمداً‌ناموفق با ایمیلی که وجود ندارد.
 */
async function emailAuthEnabled() {
  const { error } = await pub.auth.signInWithPassword({
    email: `probe.${Date.now()}@${DOMAIN}`,
    password: 'x',
  });
  if (!error) return true;
  const m = error.message.toLowerCase();
  return !(m.includes('email logins are disabled') || m.includes('email signups are disabled'));
}

// ── کمکی‌ها ─────────────────────────────────────────────────────────────────
const log = (...a) => console.log(...a);

async function findUserByEmail(email) {
  const want = email.trim().toLowerCase();
  // صفحه‌بندی لازم است: متد admin.listUsers پیش‌فرض فقط ۵۰ کاربر برمی‌گرداند.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(u => (u.email || '').toLowerCase() === want);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** ساخت کاربر Auth. اگر از قبل باشد، همان را برمی‌گرداند (idempotent). */
async function upsertAuthUser({ email, phone, name }) {
  const existing = await findUserByEmail(email);
  if (existing) return { user: existing, created: false };

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true, // بدون این، ورود با «Email not confirmed» رد می‌شود
    user_metadata: {
      display_name: name,
      // تریگر `on_auth_user_created` (مهاجرت ۰۱۳) شماره را از
      // `raw_user_meta_data` می‌خواند و با قید `^09[0-9]{9}$` می‌سنجد. GoTrue
      // خودش شماره را در metadata نمی‌گذارد، پس اگر این را ندهیم
      // `profiles.phone` خالی می‌ماند.
      phone,
    },
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function ensureViewerRole() {
  const { data, error } = await db
    .from('roles')
    .select('id')
    .eq('name', VIEWER_ROLE.name)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const { data: created, error: insErr } = await db
    .from('roles')
    .insert({ ...VIEWER_ROLE, is_default: false })
    .select('id')
    .single();
  if (insErr) throw new Error(`نقش موقت: ${insErr.message}`);
  return created.id;
}

async function ensureStaffAccount(uid, phone, name, roleId) {
  const { data: existing, error: findErr } = await db
    .from('staff_accounts')
    .select('id')
    .eq('auth_uid', uid)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return false;

  // همان RPCای که Edge Function `create-staff` صدا می‌زند؛ خودش تکراری‌بودنِ
  // شماره را می‌گیرد و سطر را `active` درج می‌کند.
  const { error } = await db.rpc('create_staff_account', {
    p_auth_uid: uid,
    p_phone: phone,
    p_display_name: name,
    p_role_id: roleId,
    p_username: name,
  });
  if (error) throw new Error(`سطر کارمند ${phone}: ${error.message}`);
  return true;
}

async function resolveRoleId(name) {
  if (name === VIEWER_ROLE.name) return ensureViewerRole();
  const { data, error } = await db.from('roles').select('id').eq('name', name).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `نقش «${name}» در دیتابیس نیست. یعنی seed.sql روی این پروژه اجرا نشده ` +
      `(یا نام نقش‌ها فرق کرده). اول seed را اجرا کنید.`,
    );
  }
  return data.id;
}

// ── حذف ─────────────────────────────────────────────────────────────────────
async function remove() {
  log('=== حذف حساب‌های تست ===\n');

  let removed = 0;
  for (const a of [...STAFF, ...CUSTOMERS]) {
    const user = await findUserByEmail(a.email);
    if (!user) {
      log(`  · ${a.email} — از قبل نبود`);
      continue;
    }
    // آبشاری: profiles و staff_accounts با حذف کاربر Auth پاک می‌شوند.
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  ✗ ${a.email} — ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    removed++;
    log(`  ✓ ${a.email} حذف شد`);
  }

  // نقش موقت را دستی برمی‌داریم (به هیچ کاربری وصل نیست).
  const { error: roleErr } = await db.from('roles').delete().eq('name', VIEWER_ROLE.name);
  if (roleErr) console.error(`  ✗ نقش ${VIEWER_ROLE.name}: ${roleErr.message}`);
  else log(`  ✓ نقش ${VIEWER_ROLE.name} حذف شد`);

  log(`\nتمام. ${removed} حساب حذف شد.`);
  if (removed) {
    log(`اگر چیزی باقی مانده، در Supabase → Authentication → Users این ایمیل‌ها را پاک کنید:`);
  for (const e of ALL_EMAILS) log(`  ${e}`);
  }
}

// ── ساخت ────────────────────────────────────────────────────────────────────
async function create() {
  log('=== ساخت حساب‌های تست ===');
  log(`پروژه: ${URL}`);
  log('کلید ورود: ایمیل   |   شماره‌ها: 0912000…');
  log(`رمز همه: ${PASSWORD}\n`);

  if (!(await emailAuthEnabled())) {
    log(
      [
        '┌──────────────────────────────────────────────────────────────┐',
        '│ هشدار: ورود با ایمیل روی این پروژه غیرفعال است.            │',
        '│                                                              │',
        '│ حساب‌ها ساخته می‌شوند، ولی کسی نمی‌تواند وارد شود.          │',
        '│                                                              │',
        '│ Supabase → Authentication → Providers → Email → Enable       │',
        '└──────────────────────────────────────────────────────────────┘',
        '',
      ].join('\n'),
    );
  }

  log('-- کارمندها --');
  for (const s of STAFF) {
    const { user, created } = await upsertAuthUser(s);
    const roleId = await resolveRoleId(s.role);
    const linked = await ensureStaffAccount(user.id, s.phone, s.name, roleId);
    log(
      `  ✓ ${s.email}\n      ${s.phone}  ${s.name}  [${s.role}]` +
      (created ? '' : '  (کاربر از قبل بود)') +
      (linked ? '' : '  (سطر کارمند از قبل بود)'),
    );
  }

  log('\n-- مشتری‌ها --');
  for (const c of CUSTOMERS) {
    // پروفایل را تریگر `on_auth_user_created` می‌سازد (نام + شماره + کد دعوت).
    const { created } = await upsertAuthUser(c);
    log(`  ✓ ${c.email}\n      ${c.phone}  ${c.name}${created ? '' : '  (کاربر از قبل بود)'}`);
  }

  const admin = STAFF[0], sales = STAFF[1], viewer = STAFF[4], c1 = CUSTOMERS[0];
  log('\n' + '='.repeat(64));
  log('ورود به پنل مدیریت (مدیر تست):');
  log(`  ${admin.email}`);
  log(`  رمز: ${PASSWORD}`);
  log('\nنمونهٔ کارمند (بقیه در خروجی بالا):');
  log(`  ${sales.email}   [مدیر فروش]`);
  log(`  ${viewer.email}   [فقط مشاهدهٔ دعوت‌ها — تنظیمات نباید باز شود]`);
  log('\nورود مشتری:');
  log(`  ${c1.email}`);
  log('\n' + '='.repeat(64));
  log('حذف بعد از تست:  node scripts/dev/test-accounts.mjs --remove');
}

// ── اجرا ────────────────────────────────────────────────────────────────────
try {
  if (REMOVE) await remove();
  else await create();
} catch (err) {
  console.error('\nخطا:', err.message);
  process.exit(1);
}
