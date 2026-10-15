import { parseJalali, toIsoDate } from '../utils/jalali';
import { isValidIranianPhone, normalizePhone } from '../schemas/common';

/**
 * فاز ۲.۳ — لایهٔ سازگاری بین مقدار فروشگاه و نوع ستون پایگاه‌داده.
 *
 * mapperها در پوشهٔ `src/domains` خودشان را مسئول «قابل قبول بودن برای
 * Postgres» می‌دانند، چون یک upsert چند ردیفی **اتمیک** است: کافی است یک ردیف
 * قید را رد کند تا کل ذخیره‌سازی از بین برود و خطا فقط در کنسول دیده شود.
 */

/**
 * تاریخ — دو قالب در فروشگاه هم‌زمان وجود دارد:
 *
 *   * `JalaliDatePicker` مقدار **میلادی** `YYYY-MM-DD` برمی‌گرداند
 *     (`src/components/JalaliDatePicker.tsx`)، پس هر انتخاب کاربر میلادی است.
 *   * داده‌های seed قدیمی در `store.tsx` شمسی‌اند (`1402/01/01`). اینها هرگز از
 *     picker نیامده‌اند و اگر مستقیم نوشته شوند Postgres آن‌ها را رد می‌کند
 *     (`invalid input syntax for type date`).
 *
 * ISO با پسوند زمان هم پذیرفته می‌شود و به روز کوتاه می‌شود؛ ستون‌های
 * `timestamptz` این را درست تفسیر می‌کنند.
 */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;
const JALALI_DAY = /^(\d{4})\/(\d{2})\/(\d{2})$/;

/**
 * تاریخ فروشگاه → `YYYY-MM-DD` میلادی، یا `null` برای ورودی خالی/نامعتبر.
 *
 * تاریخ نامعتبر عمداً `null` می‌شود تا خطای نوع ستون ندهد؛ اگر ستون `not null`
 * باشد، mapper باید `toDbDateOr` را به‌کار ببرد.
 */
export function toDbDate(value?: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;

  if (ISO_DAY.test(raw)) return raw.slice(0, 10);

  const jalali = JALALI_DAY.exec(raw);
  if (jalali) {
    const year = Number(jalali[1]);
    // بازهٔ سال شمسی، تا رشته‌های آزاد دیگر اشتباه گرفته نشوند.
    if (year >= 1200 && year <= 1600) {
      const parsed = parseJalali(raw);
      return parsed ? toIsoDate(parsed) : null;
    }
  }

  return null;
}

/** برای ستون‌های `not null`: تاریخ فروشگاه، وگرنه `fallback`. */
export function toDbDateOr(value: string | undefined | null, fallback: string): string {
  return toDbDate(value) ?? fallback;
}

/**
 * `date`/`timestamptz` پایگاه‌داده → تاریخ فروشگاه (`YYYY-MM-DD`).
 *
 * ورودی خالی رشتهٔ خالی می‌دهد، چون هر دو شکل در `JalaliDatePicker` و فرم‌ها
 * به‌عنوان «تاریخی انتخاب نشده» پذیرفته شده‌اند.
 */
export function fromDbDate(value?: string | null): string {
  return (value ?? '').slice(0, 10);
}

/**
 * همان `toDbDate` ولی برای ستون‌هایی که ساعت هم در آن‌ها معنا دارد
 * (`sms_logs.sent_at`).
 *
 * بریدن به روز، لحظهٔ واقعی ارسال پیامک را نابود می‌کرد. مقدار کامل ISO دست‌نخورده
 * می‌رود و تاریخ شمسیِ فقط-روز همچنان به روز میلادی تبدیل می‌شود.
 */
export function toDbTimestamp(value?: string | null): string | undefined {
  const raw = (value ?? '').trim();
  if (!raw) return undefined;
  if (ISO_DAY.test(raw)) return raw;
  return toDbDate(raw) ?? undefined;
}

/**
 * `timestamptz` → رشتهٔ ISO خام.
 *
 * عمداً به روز کوتاه نمی‌شود: Postgres زمان را با قالب خودش برمی‌گرداند
 * (`2026-03-01T10:00:00+00:00`) که همان لحظه است، فقط با قالب متفاوت — و
 * کوتاه کردنش ساعت را برای همیشه حذف می‌کرد.
 */
export function fromDbTimestamp(value?: string | null): string {
  return value ?? '';
}

/**
 * شمارهٔ تماس → شمارهٔ موبایل نرمال یا `null`.
 *
 * قید CHECK دیتابیس (`^09[0-9]{9}$`) روی `suppliers.phone` و
 * `employees.phone` است، ولی هر دو ستون nullable هستند و فروشگاه شمارهٔ
 * ثابت هم می‌پذیرد — دادهٔ seed خودش `02188776655` دارد. نوشتن آن بدون نرمال‌سازی
 * کل batch تأمین‌کنندگان را رد می‌کرد.
 */
export function toDbPhone(value?: string | null): string | null {
  const normalized = normalizePhone(value ?? '');
  return isValidIranianPhone(normalized) ? normalized : null;
}

/** محدودکردن یک درصد/پیشرفت به بازهٔ قید `check` دیتابیس. */
export function toDbPercent(value?: number | null): number {
  const n = Math.round(Number(value) || 0);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/** امتیاز ۱ تا ۵ برای قید `check (rating between 1 and 5)`. */
export function toDbRating(value?: number | null): number {
  const n = Math.round(Number(value) || 0);
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}
