import { describe, expect, it } from 'vitest';
import {
  faqMapper,
  newsMapper,
  portfolioMapper,
  projectServiceMapper,
  serviceMapper,
} from '../api/services';
import { mediaMapper } from '../api/media';
import { productMapper } from '../api/products';
import {
  employeeMapper,
  expenseMapper,
  invoiceMapper,
  supplierMapper,
} from '../domains/finance/api';
import { affiliateMapper, campaignMapper, personaMapper } from '../domains/marketing/api';
import {
  contentIdeaMapper,
  contentProjectMapper,
  contentTemplateMapper,
} from '../domains/content/api';
import { kpiMapper, okrMapper } from '../domains/okr/api';
import { projectMapper } from '../domains/projects/api';
import { noteMapper, reviewMapper, smsLogMapper } from '../domains/support/api';

/**
 * پوشش RLS برای مسیر نوشتن — فاز ۲.۳
 *
 * این تست روی یک اشکال واقعی نگه دارد: نه جدول از کاتالوگ عمومی و تنظیمات
 * (`products`, `media_items`, `services`, `project_services`, `news`, `faqs`,
 * `portfolio`, `about_content`, `site_settings`) جز policy خواندن policy نداشت.
 * چون در RLS نبودِ policy برای یک دستور یعنی «ممنوع»، در حالی که migration 007
 * به `authenticated` دسترسی کامل داده بود، هر ویرایش کاتالوگ بی‌صدا رد می‌شد:
 * UI تغییر را خوش‌بینانه نشان می‌داد، `syncCollection` فقط `console.warn` می‌داد،
 * و با بارگذاری مجدد همه‌چیز به حالت قبل برمی‌گشت. مهاجرت 012 این را درست کرد.
 *
 * چرا تست به‌جای شمارهٔ مهاجرت، SQL را می‌خواند
 * ---------------------------------------------
 * policyها فقط از راه `create policy` ساخته می‌شوند و مسیر دیگری برای نوشتن
 * روی جدول نیست. پس خواندن مستقیم migrationها — به‌جای یک فهرست دستی —
 * تضمین می‌کند که با اضافه شدن mapper جدید، کمبود policy فوراً لو برود.
 */

/**
 * متن همهٔ migrationها.
 *
 * `import.meta.glob` به‌جای `node:fs` انتخاب شده چون `tsconfig.json` عمداً فقط
 * `vite/client` را در `types` دارد؛ آوردن `@types/node` برای یک تست، دامنهٔ
 * کل پروژه را عوض می‌کرد. کلیدها مرتب می‌شوند تا خروجی پایدار بماند.
 */
const migrationFiles = import.meta.glob('../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** جدول → دستورهایی که policyهایش اجازه می‌دهند. */
type PolicyMap = Map<string, Set<string>>;

function readPolicies(): PolicyMap {
  const map: PolicyMap = new Map();
  const sql = Object.keys(migrationFiles)
    .sort()
    .map(path => migrationFiles[path]!)
    .join('\n')
    // Order matters: strip `--` comments FIRST. Migration 011 quotes the path
    // `src/domains/*/api.ts` inside a `--` comment, which is a literal `/*` and
    // would otherwise open a fake block comment and swallow everything up to the
    // next `*/` — including real policies in later migrations.
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');

  // `create policy <name> on <table>` با `for <cmd>` اختیاری. نبودِ `for` یعنی
  // `for all` — همان‌طور که خود Postgres تفسیر می‌کند.
  const re =
    /create\s+policy\s+(?:if\s+not\s+exists\s+)?["']?([\w]+)["']?\s+on\s+(?:public\.)?(\w+)\s*(?:for\s+(all|select|insert|update|delete)\b)?/gi;
  for (const m of sql.matchAll(re)) {
    const table = m[2]!.toLowerCase();
    const cmd = (m[3] ?? 'all').toLowerCase();
    if (!map.has(table)) map.set(table, new Set());
    const commands = map.get(table)!;
    // policyهای permissive با هم OR می‌شوند، پس یک policy که `all` اجازه
    // می‌دهد هر سه دستور نوشتن را پوشش می‌دهد.
    if (cmd === 'all') ['insert', 'update', 'delete', 'select'].forEach(c => commands.add(c));
    else commands.add(cmd);
  }
  return map;
}

/**
 * جدول‌هایی که از مسیر `syncCollection` نوشته می‌شوند.
 *
 * `syncCollection` همیشه هر سه دستور را لازم دارد: `upsert` برای ردیف‌های
 * تازه/تغییریافته و `.delete()` برای ردیف‌های حذف‌شده. پس policy فقط برای درج
 * کافی نیست — دقیقاً همان اشکالی که 011 برای `invoices` داشت.
 */
const SYNCED_MAPPERS = [
  // کاتالوگ عمومی
  productMapper,
  mediaMapper,
  serviceMapper,
  projectServiceMapper,
  newsMapper,
  faqMapper,
  portfolioMapper,
  // مالی
  expenseMapper,
  invoiceMapper,
  supplierMapper,
  employeeMapper,
  // بازاریابی
  campaignMapper,
  affiliateMapper,
  personaMapper,
  // محتوا
  contentProjectMapper,
  contentTemplateMapper,
  contentIdeaMapper,
  // OKR / KPI
  okrMapper,
  kpiMapper,
  // پروژه‌ها و پشتیبانی
  projectMapper,
  noteMapper,
  reviewMapper,
  smsLogMapper,
];

describe('پوشش RLS برای مسیر نوشتن', () => {
  const policies = readPolicies();

  it('خواندن migrationها واقعاً policy پیدا کرده (محافظ تست)', () => {
    // اگر الگوی parse خراب شود، بقیهٔ تست‌ها بی‌سروصدا سبز می‌شوند.
    expect(policies.size).toBeGreaterThan(20);
    expect(policies.get('products')).toContain('select');
  });

  it.each(SYNCED_MAPPERS.map(m => m.table))('%s مسیر درج، به‌روزرسانی و حذف دارد', table => {
    const commands = policies.get(table);
    expect(commands, `no policy at all on ${table}`).toBeDefined();
    // پیام خطا نام دستور کم‌شده را می‌گوید تا حدس زدن لازم نباشد.
    expect(commands, `${table} is missing insert`).toContain('insert');
    expect(commands, `${table} is missing update`).toContain('update');
    expect(commands, `${table} is missing delete`).toContain('delete');
  });

  it('هیچ جدولِ همگام‌شده‌ای نیست که فقط خواندن را اجازه دهد', () => {
    // همان اشکال، به شکلی که نام جدول را لو نمی‌دهد و با افزودن mapper جدید
    // خودبه‌خود سخت‌گیرتر می‌شود.
    const readOnly = SYNCED_MAPPERS.map(m => m.table).filter(t => {
      const c = policies.get(t);
      return !!c && !['insert', 'update', 'delete'].every(cmd => c.has(cmd));
    });
    expect(readOnly).toEqual([]);
  });
});

describe('سندهای تک‌ردیفی تنظیمات', () => {
  const policies = readPolicies();

  /**
   * `src/api/settings.ts` سند را با `upsert(..., { onConflict })` می‌نویسد و
   * نام جدول را آرگومان می‌گیرد، پس نمی‌شود آن را از روی source ثابت استخراج
   * کرد؛ نام‌ها اینجا صریح آمده و با فراخوانی‌ها هم‌خوان است.
   */
  const SETTINGS_TABLES = ['about_content', 'site_settings', 'notification_settings'];

  it.each(SETTINGS_TABLES)('%s مسیر نوشتن دارد', table => {
    const commands = policies.get(table);
    expect(commands, `no policy at all on ${table}`).toBeDefined();
    // `upsert` به `insert` + `update` نیاز دارد.
    expect(commands, `${table} cannot insert`).toContain('insert');
    expect(commands, `${table} cannot update`).toContain('update');
  });

  it('gamification_settings مسیر نوشتن دارد', () => {
    // این یکی با `insert`/`update` جداگانه کار می‌کند، نه upsert.
    const commands = policies.get('gamification_settings');
    expect(commands?.has('insert')).toBe(true);
    expect(commands?.has('update')).toBe(true);
  });
});

describe('جدول‌هایی که عمداً خارج از این تست هستند', () => {
  /**
   * خواندن policy از متن migration، نه از دیتابیس.
   *
   * 017 در سربرگش policy قدیمیِ `profiles` را نقل می‌کند تا توضیح دهد چرا محافظت
   * ستون‌ها لازم شد. اگر کامنت‌ها پیش از تطبیق حذف نشوند، آن نقل‌قول دیده می‌شود و
   * چون `for` ندارد، `for all` فرض می‌شود — و تست به‌اشتباه می‌گوید `profiles`
   * مسیر درج دارد، در حالی که عمداً ندارد.
   */
  it('policyهای نقل‌شده در کامنت، policy واقعی حساب نمی‌شوند', () => {
    const policies = readPolicies();
    // `create policy "customer_update_own_profile" on profiles` داخل کامنتِ ۰۱۷
    // است و نباید مجوزِ درج بسازد.
    expect(policies.get('profiles')?.has('insert')).toBe(false);
  });

  /**
   * `profiles` عمداً پوشش داده نشده: مسیر نوشتنِ آن یک fallback در
   * `signInCustomer` است برای حالتی که تریگر `on_auth_user_created` هنوز ردیف
   * را نساخته. آن fallback با RLS رد می‌شود (هیچ policy درجی وجود ندارد) و
   * **نباید** باز شود: policy درجِ خودِ کاربر با `with check (id = auth.uid())`
   * فقط سطر را محدود می‌کند نه ستون‌ها را، پس مشتری می‌توانست در همان درج
   * `wallet_balance` و `loyalty_points` را برای خودش تعیین کند. مسیر مشروع،
   * همان تریگر است.
   *
   * وضعیت: مهاجرت ۰۱۷ یک لایهٔ دوم اضافه کرد — تریگر
   * `trg_profiles_server_columns` — ولی محافظت اصلی همچنان grant ستونی است
   * (`authenticated` فقط `display_name`, `phone`, `birth_date`, `invited_by` را
   * می‌تواند به‌روزرسانی کند). لایهٔ دوم دفاع در عمق است، نه جایگزین grant.
   */
  it('profiles policy درج ندارد — و نباید داشته باشد تا وقتی تصمیم دیگری گرفته شود', () => {
    const policies = readPolicies();
    expect(policies.get('profiles')?.has('insert')).toBe(false);
    // به‌روزرسانیِ محدودِ ستون‌های خودِ مشتری باید بماند.
    expect(policies.get('profiles')?.has('update')).toBe(true);
  });

  /**
   * مهاجرت ۰۱۵ سیاست‌های `for all using (مجوزِ مشاهده or مجوزِ نوشتن)` را به
   * چهار سیاست بر اساس *دستور* شکست، چون `using` روی `delete` هم حاکم است و
   * `delete` اصلاً `with check` ندارد — یعنی کارمندی با فقط مجوزِ مشاهده می‌توانست
   * سطرها را حذف کند (بدترین نمونه: حذف حساب کارمندی با `perm15`).
   *
   * policyها داخل یک حلقهٔ `do $$ … $$` و با `execute format` ساخته می‌شوند، پس
   * در متن مهاجرت فقط یک جمله برای هر دستور هست، نه یکی به‌ازای هر جدول. تعداد
   * جدول‌ها در حلقهٔ `values` فهرست شده و مهاجرت ۰۱۶ خودش آن را تأیید می‌کند.
   */
  it('سیاست‌های تفکیک‌شده، هر چهار دستور را جدا ساخته‌اند', () => {
    const sql = Object.keys(migrationFiles)
      .sort()
      .map(path => migrationFiles[path]!)
      .join('\n')
      // Same two-step strip as `readPolicies`: `--` first, then `/* */`.
      .replace(/--[^\n]*/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');

    // The old permissive policy has to be dropped first, otherwise the new
    // per-command policies would only ever widen it.
    expect(sql).toMatch(/drop policy if exists %I on public\.%I/);

    for (const cmd of ['select', 'insert', 'update', 'delete']) {
      expect(sql, `no split policy for ${cmd}`).toContain(
        `create policy %I on public.%I for ${cmd}`,
      );
    }

    // `update` needs the write permission on both sides, otherwise a read-only
    // staff member could still target a row.
    expect(sql).toMatch(/create policy %I on public\.%I for update using \(%s\) with check \(%s\)/);
  });

  /**
   * حلقهٔ `values` در ۰۱۵ باید هر ۲۰ جدولِ مشکل‌دار را پوشش دهد. یک جدول که
   * جا بماند، همان الگوی آسیب‌پذیر را نگه می‌دارد.
   */
  it('حلقهٔ ۰۱۵ هر ۲۰ جدولِ آسیب‌پذیر را پوشش می‌دهد', () => {
    const split = Object.entries(migrationFiles).find(([path]) =>
      path.includes('015_split_read_write_rls_policies'),
    );
    expect(split, 'migration 015 not found').toBeDefined();

    // Rows look like ('table', 'policy', 'read_expr', 'write_expr')
    const rows = split![1].match(/^\s*\('([a-z_]+)',\s*'([a-z_]+)'/gim) ?? [];
    expect(rows.length, 'tables listed in the 015 values() loop').toBeGreaterThanOrEqual(20);

    // The three the bug report was filed against must not be missing.
    for (const table of [
      'portfolio',
      'project_services',
      'gamification_settings',
      'staff_accounts',
    ]) {
      expect(rows.join(' '), `${table} missing from the 015 split`).toContain(`'${table}'`);
    }
  });
});
