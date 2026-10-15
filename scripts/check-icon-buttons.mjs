// بازرسی/کدود برچسب دسترسی‌پذیری دکمه‌های فقط-آیکن.
//
// استفاده:
//   node scripts/check-icon-buttons.mjs            # فقط گزارش (در CI fail می‌کند)
//   node scripts/check-icon-buttons.mjs --apply    # افزودن aria-label از روی نام آیکن
//
// نکتهٔ کلیدی: پایان تگ `<button …>` با شمارش عمق `{}` و رد کردن رشته‌ها پیدا
// می‌شود. الگوی سادهٔ `<button([^>]*)>` غلط است چون `=>` داخل صفتی مثل
// `onClick={() => …}` اولین `>` است و تگ را همان‌جا می‌بندد — یعنی کدود
// برچسب را وسط عبارت می‌چپاند و فایل را خراب می‌کند.
//
// نکتهٔ دوم: یک دکمه ممکن است هیچ متن ثابت نداشته باشد ولی در زمان اجرا متن
// نشان دهد (`{t.label}` یا `{selectedDate || placeholder}`). چنین دکمه‌ای نام
// دسترس‌پذیر دارد و نباید گزارش شود؛ به همین دلیل فقط متن فارسیِ ثابت
// بررسی نمی‌شود.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2] ?? 'src';
const APPLY = process.argv.includes('--apply');

const ICON_LABELS = {
  X: 'بستن',
  XCircle: 'حذف',
  Trash2: 'حذف',
  Trash: 'حذف',
  Edit: 'ویرایش',
  Eye: 'مشاهده',
  EyeOff: 'پنهان کردن',
  Plus: 'افزودن',
  Copy: 'کپی',
  Search: 'جست‌وجو',
  Printer: 'چاپ',
  Download: 'دانلود',
  Upload: 'بارگذاری',
  Check: 'تأیید',
  CheckCircle2: 'تأیید',
  Send: 'ارسال',
  Heart: 'افزودن به علاقه‌مندی‌ها',
  Star: 'ثبت امتیاز',
  CreditCard: 'پرداخت',
  Wallet: 'کیف پول',
  Minus: 'کاهش',
  PlusCircle: 'افزودن',
  ChevronUp: 'بستن',
  ChevronDown: 'باز کردن',
  ArrowRight: 'بعدی',
  ArrowLeft: 'قبلی',
  RefreshCw: 'تازه‌سازی',
  Settings: 'تنظیمات',
  Filter: 'فیلتر',
  Menu: 'منو',
  Bell: 'اعلان‌ها',
  MessageSquare: 'پیام',
  Clock: 'زمان',
  User: 'کاربر',
  Users: 'کاربران',
  Award: 'نشان',
  Target: 'هدف',
  BarChart3: 'نمودار',
  ThumbsUp: 'پسندیدن',
  Play: 'پخش',
  Maximize2: 'بزرگ‌نمایی',
  Minimize2: 'بستن پنجره',
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** اندیس `>`ای که واقعاً تگ باز `<button …>` را می‌بندد. */
function findTagEnd(src, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) return i;
  }
  return -1;
}

// نام دسترس‌پذیر یک دکمه می‌تواند از سه چیز بیاید: متن ثابت، `title`، یا یک
// درون‌یابی که در زمان اجرا متن می‌دهد مثل `{t.label}`. آن سومی با الگوی سادهٔ
// «متن فارسی دارد؟» دیده نمی‌شود و در بررسی اول ۱۰ دکمهٔ تب را اشتباهی گزارش کرد.
const HAS_STATIC_TEXT = /[؀-ۿ‌\u200c]{2,}/;
// هر عبارت داخل `{}` که نه عنصر JSX دارد و نه تابع، در زمان اجرا یک مقدار
// قابل نمایش تولید می‌کند: `{t.label}`، `{selectedDate || placeholder}`، `{count}`.
// اگر JSX داشته باشد (`{cond && <X/>}`) نامی برای صفحه‌خوان تولید نمی‌کند.
const HAS_DYNAMIC_TEXT = /\{\s*[^{}<>]*\}/;
const HAS_LABEL = /aria-label|aria-labelledby|\btitle=/;
const ICON_RE = /<([A-Z][A-Za-z0-9]*)[\s/>]/;
const hasText = (s) => HAS_STATIC_TEXT.test(s) || HAS_DYNAMIC_TEXT.test(s);

const unresolved = [];
let patched = 0;

for (const file of walk(SRC)) {
  let src = readFileSync(file, 'utf8');
  let changed = false;

  for (;;) {
    const start = src.indexOf('<button');
    if (start === -1) break;

    const tagEnd = findTagEnd(src, start + '<button'.length);
    if (tagEnd === -1) break;
    const attrs = src.slice(start + '<button'.length, tagEnd);

    const close = src.indexOf('</button>', tagEnd);
    if (close === -1) break;
    const inner = src.slice(tagEnd + 1, close);

    const needsLabel = !HAS_LABEL.test(attrs) && !HAS_LABEL.test(inner) && !hasText(inner);
    const icon = needsLabel ? ICON_RE.exec(inner) : null;

    if (!icon) {
      // از این دکمه عبور کن و ادامه بده.
      const rest = src.slice(tagEnd + 1);
      const nextIdx = rest.indexOf('<button');
      if (nextIdx === -1) break;
      // جایگزینی امن: تگ را دست‌نخورده نگه می‌داریم ولی از جلوی بررسی ردش می‌کنیم
      // با یک نشانهٔ موقت که بلافاصله برمی‌گردد.
      src = src.slice(0, start) + '<butt0n' + src.slice(start + '<button'.length);
      continue;
    }

    const label = ICON_LABELS[icon[1]];
    if (!label) {
      const line = src.slice(0, start).split('\n').length;
      unresolved.push({ file, line, icon: icon[1], attrs: attrs.trim().replace(/\s+/g, ' ').slice(0, 70) });
      src = src.slice(0, start) + '<butt0n' + src.slice(start + '<button'.length);
      continue;
    }

    const trimmed = attrs.replace(/\s+$/, '');
    src =
      src.slice(0, start) +
      `<button${trimmed} aria-label="${label}">` +
      src.slice(tagEnd + 1);
    changed = true;
    patched += 1;
  }

  src = src.replaceAll('<butt0n', '<button');
  if (changed && APPLY) writeFileSync(file, src, 'utf8');
}

console.log(`${APPLY ? 'patched' : 'would patch'}: ${patched}`);
if (unresolved.length) {
  console.log(`\nNEEDS MANUAL LABEL (${unresolved.length}):`);
  for (const u of unresolved) console.log(`  ${u.file}:${u.line}  <${u.icon} />  ${u.attrs}`);
}

// بدون `--apply` این ابزار یک بررسی است: اگر دکمه‌ای بدون نام دسترس‌پذیر بماند
// یعنی رگرسیون، پس باید CI را fail کند.
if (!APPLY && (patched > 0 || unresolved.length > 0)) {
  console.error('\nicon-only buttons without an accessible name — run with --apply or label by hand');
  process.exit(1);
}