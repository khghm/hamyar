import { supabase } from './supabase';

/**
 * ورود مشتری با شماره موبایل + کد یک‌بارمصرف.
 *
 * کد با سرویس ایرانی «کاوه‌نگار» ارسال می‌شود؛ منطق ارسال/بررسی سمت سرور در
 * Cloudflare Worker است (`/api/otp/*`) تا کلید service_role هرگز به مرورگر
 * نرسد. پس از تأیید کد، Worker یک `token_hash` مجیک‌لینک برمی‌گرداند و اینجا
 * با `verifyOtp` نشست واقعی Supabase ساخته می‌شود (RLS دست‌نخورده می‌ماند).
 *
 * نکته: این مسیر فقط برای مشتریان است؛ ورود ادمین/کارمند همچنان ایمیل + رمز
 * عبور است.
 */

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export type OtpRequestResult = {
  ok: boolean;
  error?: string;
  code?: string;
  /** فقط در حالت تستِ بدون کلید کاوه‌نگار برگردانده می‌شود. */
  dev?: boolean;
  devCode?: string;
  expiresIn?: number;
  resendIn?: number;
  retryAfter?: number;
};

async function postOtp<T extends { ok: boolean; error?: string }>(path: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(`${BASE}/api/otp/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}) as any);
    return { ...(data || {}), ok: res.ok && data?.ok !== false } as T;
  } catch {
    return {
      ok: false,
      error: 'ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید',
    } as T;
  }
}

/** شمارهٔ واردشده را به قالب `09xxxxxxxxx` نرمال می‌کند (ارقام فارسی هم). */
export function normalizeIranPhone(input: string): string {
  let s = String(input || '').trim();
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  s = s.replace(/[۰-۹]/g, d => String(fa.indexOf(d)))
       .replace(/[٠-٩]/g, d => String(ar.indexOf(d)))
       .replace(/[^\d+]/g, '');
  if (s.startsWith('+98')) s = '0' + s.slice(3);
  else if (s.startsWith('0098')) s = '0' + s.slice(4);
  else if (s.startsWith('98') && s.length === 12) s = '0' + s.slice(2);
  else if (s.length === 10 && s.startsWith('9')) s = '0' + s;
  return /^09\d{9}$/.test(s) ? s : '';
}

export async function requestPhoneOtp(phone: string): Promise<OtpRequestResult> {
  const normalized = normalizeIranPhone(phone);
  if (!normalized) return { ok: false, error: 'شماره موبایل معتبر نیست (مثال: 09121234567)' };
  const data = await postOtp<OtpRequestResult & { dev?: boolean; code?: string }>('request', { phone: normalized });
  return {
    ...data,
    devCode: data.dev ? (data as any).code : undefined,
  };
}

export type PhoneLoginResult = {
  ok: boolean;
  error?: string;
  email?: string;
  isNew?: boolean;
};

/** بررسی کد و ساخت نشست Supabase. */
export async function verifyPhoneOtp(phone: string, code: string): Promise<PhoneLoginResult> {
  const normalized = normalizeIranPhone(phone);
  const cleanCode = String(code || '').replace(/\D/g, '');
  if (!normalized) return { ok: false, error: 'شماره موبایل معتبر نیست' };
  if (cleanCode.length !== 6) return { ok: false, error: 'کد ۶ رقمی را کامل وارد کنید' };

  const data = await postOtp<{ ok: boolean; error?: string; token_hash?: string; email?: string; is_new?: boolean }>(
    'verify',
    { phone: normalized, code: cleanCode },
  );
  if (!data.ok || !data.token_hash) {
    return { ok: false, error: data.error || 'تأیید کد ناموفق بود' };
  }

  // مجیک‌لینک تولیدشده با type=magiclink است؛ برای سازگاری، نوع email هم امتحان می‌شود.
  let { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (error) {
    const retry = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' });
    error = retry.error;
  }
  if (error) {
    return { ok: false, error: 'ورود انجام نشد؛ دوباره تلاش کنید' };
  }

  return { ok: true, email: data.email, isNew: !!data.is_new };
}
