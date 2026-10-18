import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, Receipt, RotateCw, Wallet } from 'lucide-react';
import { verifyOnlinePayment } from '../api/zarinpal';

type State =
  | { kind: 'verifying' }
  | { kind: 'success'; refId?: string | number | null; orderId?: string; wallet?: boolean; amount?: number; balance?: number }
  | { kind: 'failed'; message: string; cancelled?: boolean };

/**
 * بازگشت از درگاه زرین‌پال (خرید یا شارژ کیف پول).
 *
 * زرین‌پال کاربر را با `?Authority=…&Status=OK|NOK` به این مسیر برمی‌گرداند.
 * تأیید نهایی سمت Worker انجام می‌شود (`/api/zarinpal/verify`) و تنها در صورت
 * تأیید واقعی، سفارش تسویه یا کیف پول شارژ می‌شود. این صفحه فقط نتیجه را
 * نشان می‌دهد.
 *
 * لینک‌های پایانی عمداً `<a href>` کامل هستند (نه `Link`) تا با بارگذاری دوباره،
 * موجودی کیف پول و سفارش‌ها از دیتابیس تازه شوند.
 */
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [state, setState] = useState<State>({ kind: 'verifying' });
  const started = useRef(false);

  const authority = params.get('Authority') || params.get('authority') || '';
  const status = params.get('Status') || params.get('status') || '';

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!authority) {
      setState({ kind: 'failed', message: 'کد تراکنش در آدرس بازگشتی پیدا نشد.' });
      return;
    }

    (async () => {
      const result = await verifyOnlinePayment(authority, status);
      if (result.ok) {
        setState({
          kind: 'success',
          refId: result.refId,
          orderId: result.orderId,
          wallet: result.kind === 'wallet',
          amount: result.amount,
          balance: result.balance,
        });
      } else {
        setState({
          kind: 'failed',
          message: result.error || 'پرداخت تأیید نشد.',
          cancelled: result.cancelled || status.toUpperCase() === 'NOK',
        });
      }
    })();
  }, [authority, status]);

  const isWallet = state.kind === 'success' && state.wallet;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
        {state.kind === 'verifying' && (
          <>
            <Loader2 size={44} className="mx-auto text-blue-600 animate-spin" />
            <h1 className="mt-4 font-bold text-lg">در حال تأیید پرداخت…</h1>
            <p className="mt-2 text-sm text-slate-500">
              لطفاً این صفحه را نبندید؛ نتیجهٔ تراکنش از درگاه دریافت می‌شود.
            </p>
          </>
        )}

        {state.kind === 'success' && (
          <>
            <CheckCircle2 size={56} className="mx-auto text-green-600" />
            <h1 className="mt-4 font-bold text-lg text-green-700">
              {isWallet ? 'کیف پول شما شارژ شد' : 'پرداخت با موفقیت انجام شد'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isWallet
                ? 'مبلغ پرداخت‌شده بلافاصله به موجودی کیف پول شما اضافه شد.'
                : 'سفارش شما پرداخت و ثبت شد. فاکتور و وضعیت سفارش در پروفایل شما به‌روزرسانی شد.'}
            </p>

            {isWallet && state.amount ? (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm space-y-1">
                <div>
                  <span className="text-slate-500">مبلغ شارژ: </span>
                  <span className="font-bold text-green-700">{state.amount.toLocaleString('fa-IR')} تومان</span>
                </div>
                {state.balance !== undefined && !Number.isNaN(state.balance) ? (
                  <div>
                    <span className="text-slate-500">موجودی جدید: </span>
                    <span className="font-bold text-green-700">{state.balance.toLocaleString('fa-IR')} تومان</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isWallet && state.refId ? (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm">
                <span className="text-slate-500">کد پیگیری بانک: </span>
                <span className="font-mono font-bold text-green-700">{String(state.refId)}</span>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <a href="/profile" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                {isWallet ? <Wallet size={16} /> : <Receipt size={16} />}
                {isWallet ? 'مشاهدهٔ کیف پول' : 'سفارش‌های من'}
              </a>
              <a href="/store" className="flex-1 py-2.5 rounded-lg bg-gray-100 text-slate-700 text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2">
                <ShoppingBag size={16} /> ادامهٔ خرید
              </a>
            </div>
          </>
        )}

        {state.kind === 'failed' && (
          <>
            <XCircle size={56} className="mx-auto text-red-500" />
            <h1 className="mt-4 font-bold text-lg text-red-600">
              {state.cancelled ? 'پرداخت لغو شد' : 'پرداخت تأیید نشد'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{state.message}</p>
            <p className="mt-2 text-xs text-slate-400">
              اگر برای سفارش پرداخت می‌کردید، سفارش ثبت شده ولی پرداخت‌نشده است؛ از پروفایل می‌توانید دوباره
              تلاش کنید. اگر کیف پول را شارژ می‌کردید، مبلغی کسر نشده است.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <a href="/profile" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                <RotateCw size={16} /> تلاش دوباره از پروفایل
              </a>
              <a href="/" className="flex-1 py-2.5 rounded-lg bg-gray-100 text-slate-700 text-sm font-medium hover:bg-gray-200">
                صفحهٔ اصلی
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
