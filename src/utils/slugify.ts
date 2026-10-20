/**
 * ساخت «slug» خوانا برای آدرس‌های سئو.
 *
 * حروف فارسی و ارقام حفظ می‌شوند و هر چیز دیگر به «-» تبدیل می‌شود؛ نتیجه برای
 * آدرس `/news/<slug>` امن و خوانا است. اگر ورودی فارسی/خالی باشد، از `fallback`
 * استفاده می‌شود.
 */
export function slugify(input: string, fallback = 'post'): string {
  const base = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f\u200e]/g, '-') // نیم‌فاصله و نشانه‌های جهت
    .replace(/[^a-z0-9آ-ی۰-۹]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || fallback;
}

/** slug یکتا نسبت به فهرست slugهای موجود (پسوند -2، -3، …). */
export function uniqueSlug(base: string, existing: string[]): string {
  const taken = new Set(existing.map(s => (s || '').trim()).filter(Boolean));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
