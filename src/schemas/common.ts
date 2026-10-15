import { z } from 'zod';

/**
 * فاز ۲.۶ — اسکیمای مشترک فرم‌ها با Zod.
 *
 * پیش از این، اعتبارسنجی در هر فرم جداگانه و با if/else تکراری انجام می‌شد و
 * پیام‌های خطا یکدست نبودند. اینجا یک منبع حقیقت برای قاعده‌های مشترک
 * (موبایل، رمز، مبلغ، کد تخفیف …) تعریف می‌شود تا فرم‌ها و لایهٔ سرویس و
 * Edge Function دقیقاً یک قاعده را به کار ببرند.
 *
 * نکته: همان قاعدهٔ `^09[0-9]{9}$` در قید CHECK دیتابیس هم هست؛ این لایه فقط
 * تجربهٔ کاربری بهتری می‌دهد و جایگزین قید سرور نیست.
 */

// ---------------------------------------------------------------------------
// موبایل ایرانی
// ---------------------------------------------------------------------------

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * نرمال‌سازی شمارهٔ واردشده به شکل `09xxxxxxxxx` که قید دیتابیس می‌خواهد.
 * ارقام فارسی/عربی، فاصله، خط تیره و پیشوندهای +98 و 0098 را می‌پذیرد.
 */
export function normalizePhone(input: string): string {
  if (!input) return '';
  let digits = input.replace(/[۰-۹]/g, d => String(PERSIAN_DIGITS.indexOf(d)));
  digits = digits.replace(/[٠-٩]/g, d => String(PERSIAN_DIGITS.indexOf(d)));
  digits = digits.replace(/\D/g, '');
  if (digits.startsWith('0098')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);
  if (digits.length === 10 && digits.startsWith('9')) digits = '0' + digits;
  return digits;
}

/** فیلد شمارهٔ موبایل: خودش را نرمال می‌کند و سپس شکل نهایی را می‌سنجد. */
export const phoneSchema = z
  .string()
  .min(1, 'شماره موبایل را وارد کنید')
  .transform(normalizePhone)
  .refine(v => /^09[0-9]{9}$/.test(v), 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد');

/** نسخهٔ فقط-اعتبارسنجی، برای جایی که مقدار از قبل نرمال شده است. */
export function isValidIranianPhone(phone: string): boolean {
  return /^09[0-9]{9}$/.test(phone);
}

// ---------------------------------------------------------------------------
// رمز عبور
// ---------------------------------------------------------------------------

export const passwordSchema = z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد');

// ---------------------------------------------------------------------------
// ایمیل — کلید احراز هویت
// ---------------------------------------------------------------------------

/**
 * ایمیل، کلید ورود است و شمارهٔ موبایل دادهٔ پروفایل.
 *
 * چرا این تفکیک: ارائه‌دهندهٔ Phone در Supabase برای فعال‌شدن به اعتبارنامهٔ یک
 * شرکت پیامک (Twilio/MessageBird و…) نیاز دارد، ولی Email از قبل فعال است و
 * هیچ اعتبارنامهٔ بیرونی نمی‌خواهد. شمارهٔ موبایل همچنان ذخیره می‌شود
 * (`profiles.phone` با قید `^09[0-9]{9}$`) چون دادهٔ کسب‌وکاری است — فقط
 * دیگر «کلید» نیست.
 *
 * اعتبارسنجی عمداً با regex ساده است نه `z.email()`، تا به API نسخهٔ zod وابسته
 * نباشیم؛ GoTrue پیام خطای خودش را هم می‌دهد و در `friendlyAuthError` ترجمه می‌شود.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'ایمیل را وارد کنید')
  .refine(v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'ایمیل معتبر نیست');

// ---------------------------------------------------------------------------
// احراز هویت
// ---------------------------------------------------------------------------

export const customerLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
  // شماره فقط برای ثبت‌نامِ تازه لازم است؛ ورودِ حساب موجود به آن نیازی ندارد.
  phone: phoneSchema.optional().or(z.literal('')),
});

export const staffLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export const customerSignUpSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  displayName: z.string().min(1, 'نام خود را وارد کنید'),
  // کد دعوت اختیاری است، ولی اگر وارد شود باید ۶ کاراکتر باشد.
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine(v => v === '' || v.length === 6, 'کد دعوت باید ۶ کاراکتر باشد')
    .optional()
    .or(z.literal('')),
});

/** ساخت حساب کارمند از پنل RBAC. */
export const staffAccountSchema = z.object({
  username: z.string().min(1, 'نام نمایشی کارمند را وارد کنید'),
  name: z.string().min(1, 'نام کامل کارمند را وارد کنید'),
  // ایمیل کلید ورود است، ولی `staff_accounts` ستونِ ایمیل ندارد (هویت در
  // `auth.users` است و با `auth_uid` وصل می‌شود). پس هنگام *ویرایش* کارمندِ
  // موجود، ایمیلی در دست نیست و نباید ذخیره را بی‌دلیل رد کند — دقیقاً مثل رمز
  // عبور. اجباری‌بودنش هنگام ایجاد، در `createStaffUser` بررسی می‌شود.
  email: emailSchema.optional(),
  phone: phoneSchema,
  password: passwordSchema,
  roleId: z.string().min(1, 'یک نقش را انتخاب کنید'),
  active: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// سفارش و پرداخت
// ---------------------------------------------------------------------------

/** مبلغ به تومان — همیشه عدد صحیح و نامنفی (هم‌ارز قید CHECK دیتابیس). */
export const tomanAmountSchema = z
  .number({ error: 'مبلغ باید عدد باشد' })
  .int('مبلغ باید صحیح باشد')
  .nonnegative('مبلغ نمی‌تواند منفی باشد');

export const quantitySchema = z
  .number({ error: 'تعداد باید عدد باشد' })
  .int('تعداد باید صحیح باشد')
  .min(1, 'تعداد حداقل ۱ است')
  .max(99, 'حداکثر تعداد ۹۹ است');

export const paymentMethodSchema = z.enum(['online', 'wallet'], {
  error: 'روش پرداخت نامعتبر است',
});

export const orderStatusSchema = z.enum(['new', 'processing', 'ready', 'delivered', 'cancelled'], {
  error: 'وضعیت سفارش نامعتبر است',
});

// ---------------------------------------------------------------------------
// کمپین و باشگاه مشتریان
// ---------------------------------------------------------------------------

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'کد تخفیف کوتاه است')
  .max(30, 'کد تخفیف بیش از حد طولانی است');

export const loyaltyPointsSchema = z
  .number({ error: 'امتیاز باید عدد باشد' })
  .int('امتیاز باید صحیح باشد')
  .positive('امتیاز باید بزرگ‌تر از صفر باشد');

// ---------------------------------------------------------------------------
// ابزار مصرف در فرم‌ها
// ---------------------------------------------------------------------------

/**
 * پیام فارسیِ مناسب برای نمایش به کاربر از روی خطای Zod.
 * اگر چند خطا وجود داشته باشد اولین خطا برگردانده می‌شود.
 */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'ورودی نامعتبر است';
}

/**
 * رابط کوچک برای استفاده در کامپوننت‌ها: اعتبارسنجی می‌کند و در صورت خطا
 * پیام فارسی را برمی‌گرداند.
 *
 *   const res = safeParse(schema, form);
 *   if (!res.ok) return setError(res.error);
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstErrorMessage(result.error) };
}
