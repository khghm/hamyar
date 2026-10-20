/**
 * قالب‌بندی اعداد و قیمت‌ها با ارقام فارسی.
 *
 * چرا یک ماژول مشترک: در پروژه چند جا از `toLocaleString('fa-IR')` و چند جا از
 * رشتهٔ دستی استفاده می‌شد و نتیجه، ترکیب ارقام فارسی و لاتین بود. همهٔ خروجی‌های
 * عددی رابط کاربری باید از این توابع عبور کنند.
 */

export const faNum = (value: number | string | null | undefined): string => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(Number(n))) return '۰';
  return Number(n).toLocaleString('fa-IR');
};

/** قیمت با واحد تومان؛ مثال: «۱٬۲۵۰٬۰۰۰ تومان» */
export const faPrice = (value: number | null | undefined): string => `${faNum(value)} تومان`;

/** درصد؛ مثال: «۲۵٪» */
export const faPercent = (value: number | null | undefined): string => `${faNum(value)}٪`;

/** تاریخ شمسی کوتاه (بدون تبدیل اضافه) از رشتهٔ ISO */
export const faDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
