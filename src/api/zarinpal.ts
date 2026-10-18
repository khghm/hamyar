import { supabase } from './supabase';

/**
 * پل مرورگر به endpointهای پرداخت روی Worker (`/api/zarinpal/*`).
 *
 * منطق پول سمت سرور است: Worker با کلید service_role مبلغ را از دیتابیس
 * می‌خواند، تراکنش را در زرین‌پال می‌سازد و بعد از بازگشت کاربر، با
 * `verify_payment` سفارش و فاکتور را تسویه می‌کند. مرورگر فقط JWT کاربر را
 * می‌فرستد.
 */
export interface StartPaymentResult {
  ok: boolean;
  error?: string;
  startUrl?: string;
  authority?: string;
  sandbox?: boolean;
  amount?: number;
}

export interface VerifyPaymentResult {
  ok: boolean;
  error?: string;
  refId?: string | number | null;
  code?: number;
  orderId?: string;
  cancelled?: boolean;
  kind?: 'order' | 'wallet';
  amount?: number;
  balance?: number;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
}

/** ساخت تراکنش و گرفتن آدرس صفحهٔ درگاه. */
export async function startOnlinePayment(orderId: string): Promise<StartPaymentResult> {
  try {
    const res = await postJson('/api/zarinpal/request', { orderId });
    if (res.status === 404) {
      return { ok: false, error: 'درگاه پرداخت روی این آدرس فعال نیست (نسخهٔ استاتیک).' };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.startUrl) {
      return { ok: false, error: data?.error || 'اتصال به درگاه پرداخت ناموفق بود' };
    }
    return {
      ok: true,
      startUrl: data.startUrl,
      authority: data.authority,
      sandbox: Boolean(data.sandbox),
      amount: Number(data.amount),
    };
  } catch {
    return { ok: false, error: 'خطای شبکه در اتصال به درگاه پرداخت' };
  }
}

/** شارژ کیف پول از طریق زرین‌پال (مبلغ به تومان). */
export async function startWalletTopUp(amount: number): Promise<StartPaymentResult> {
  try {
    const res = await postJson('/api/zarinpal/wallet/request', { amount });
    if (res.status === 404) {
      return { ok: false, error: 'درگاه پرداخت روی این آدرس فعال نیست (نسخهٔ استاتیک).' };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.startUrl) {
      return { ok: false, error: data?.error || 'اتصال به درگاه پرداخت ناموفق بود' };
    }
    return {
      ok: true,
      startUrl: data.startUrl,
      authority: data.authority,
      sandbox: Boolean(data.sandbox),
      amount: Number(data.amount),
    };
  } catch {
    return { ok: false, error: 'خطای شبکه در اتصال به درگاه پرداخت' };
  }
}

/** تأیید تراکنش بعد از بازگشت از درگاه. */
export async function verifyOnlinePayment(authority: string, status: string): Promise<VerifyPaymentResult> {
  try {
    const res = await postJson('/api/zarinpal/verify', { authority, status });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'تأیید پرداخت ناموفق بود', cancelled: Boolean(data?.cancelled) };
    }
    return {
      ok: true,
      refId: data.refId ?? null,
      code: data.code,
      orderId: data.orderId,
      kind: data.kind === 'wallet' ? 'wallet' : 'order',
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
      balance: data.balance !== undefined ? Number(data.balance) : undefined,
    };
  } catch {
    return { ok: false, error: 'خطای شبکه در تأیید پرداخت' };
  }
}
