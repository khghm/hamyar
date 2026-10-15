import { supabase } from './supabase';
import type { ProfileRow } from './users';
// فاز ۲.۶: قاعدهٔ شمارهٔ موبایل یک‌بار در `schemas/common` تعریف شده و از اینجا
// دوباره صادر می‌شود تا import‌های قبلی نشکنند.
export { normalizePhone, isValidIranianPhone } from '../schemas/common';

export interface SignInResult { ok: boolean; error?: string; needsEmailConfirmation?: boolean }

export interface SignUpResult {
  ok: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

export interface CustomerSignUpData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  inviteCode?: string;
}

/**
 * Registers a new customer via Supabase Auth (email + password).
 */
export async function signUpCustomer(data: CustomerSignUpData): Promise<SignUpResult> {
  const { email, password, displayName, phone, inviteCode } = data;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: {
        display_name: displayName,
        ...(phone ? { phone } : {}),
        ...(inviteCode ? { invite_code: inviteCode.toUpperCase() } : {}),
      },
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message), needsEmailConfirmation: false };
  }

  if (signUpData?.user && !signUpData.user.email_confirmed_at) {
    return { ok: true, needsEmailConfirmation: true };
  }

  return { ok: true };
}

/**
 * Signs a customer in with email + password via Supabase Auth.
 */
export async function signInCustomer(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  if (data?.user && !data.user.email_confirmed_at) {
    return { ok: false, error: 'ایمیل را تأیید نکرده‌اید. لینک تأییدی که فرستاده شد را باز کنید.', needsEmailConfirmation: true };
  }

  return { ok: true };
}

/**
 * Sends a password-reset email to the given address.
 */
export async function resetPasswordForEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return { ok: true };
}

/**
 * Updates the display name + optional phone on the customer's profile.
 */
export async function updateCustomerProfile(
  updates: { displayName?: string; phone?: string | null; birthDate?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { ok: false, error: 'کاربر یافت نمی‌شود' };

  const { error } = await supabase.from('profiles').update({
    display_name: updates.displayName,
    phone: updates.phone,
    birth_date: updates.birthDate,
  }).eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Fetches the full profile row for the currently-authenticated user from `profiles`.
 */
export async function fetchCurrentProfile(): Promise<ProfileRow | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[auth] fetchCurrentProfile:', error.message);
    return null;
  }
  return data;
}

/** Maps Supabase/GoTrue English errors to Persian, user-facing messages. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'email not confirmed': 'ایمیل را تأیید نکرده‌اید. لینک تأییدی که فرستاده شد را باز کنید.',
  'confirmations should never be null': 'ایمیل را تأیید نکرده‌اید. لینک تأییدی که فرستاده شد را باز کنید.',
  'invalid login credentials': 'ایمیل یا رمز عبور اشتباه است',
  'user already registered': 'این ایمیل قبلاً ثبت‌نام کرده است',
  'email not valid': 'ایمیل معتبر نیست',
  'password should be at least 6 characters': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
  'unable to validate email': 'ایمیل معتبر نیست',
  'email rate limit exceeded': 'تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید',
  // پیام‌های ارائه‌دهندهٔ Phone. روی این پروژه خاموش است، ولی اگر کسی آن را
  // روشن کند این‌ها دیگر گمراه‌کننده نیستند.
  'phone logins are disabled': 'ورود با شماره موبایل روی این پروژه غیرفعال است؛ با ایمیل وارد شوید',
  'phone signups are disabled': 'ثبت‌نام با شماره موبایل روی این پروژه غیرفعال است؛ با ایمیل ثبت‌نام کنید',
  'phone number should be a valid phone number': 'شماره موبایل معتبر نیست',
  'sms rate limit exceeded': 'تعداد پیامک‌های تأیید بیش از حد مجاز است',
};

/** Maps Supabase/GoTrue English errors to Persian, user-facing messages. */
export function friendlyAuthError(error?: string | null): string {
  if (!error) return 'خطای ناشناخته در ورود';
  const lower = error.toLowerCase();
  const known = Object.keys(AUTH_ERROR_MESSAGES).find(k => lower.includes(k));
  if (known) return AUTH_ERROR_MESSAGES[known] ?? error;
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'خطای شبکه؛ اتصال اینترنت را بررسی کنید';
  }
  return error;
}

// توابع `signInWithPhone`/`signUpWithPhone` قبلاً اینجا بودند و هیچ‌جا فراخوانی
// نمی‌شدند. با انتقال کلید ورود به ایمیل (به‌دلیل غیرفعال‌بودن ارائه‌دهندهٔ Phone
// در این پروژه) حذف شدند تا کسی دوباره سراغ‌شان نرود.

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

// NOTE: there is deliberately no client-side "update my profile points" helper.
// `loyalty_points`, `total_earned_points` and `level` are server-authoritative:
// they are written by `award_loyalty` / `apply_referral_bonuses` (SECURITY
// DEFINER), and the `profiles` table grants UPDATE on those columns to nobody
// but the function owner. A browser write would both fail and be a privilege
// escalation, so the values are never sent from the client.
