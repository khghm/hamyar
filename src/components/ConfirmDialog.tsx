import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * دیالوگ تأیید درون‌برنامه‌ای به‌جای `window.confirm()`.
 *
 * دلیل حذف `confirm()`: در `iframe` و در برخی مرورگرها بلاک می‌شود، متن را
 * نمی‌توان فارسی/راست‌به‌چپ کرد، و مهم‌تر از همه همگام است — الگوی
 * `if (!confirm(...)) return;` داخل یک هندلر `async` با جریان کنترل ناسازگار
 * می‌شود. اینجا یک Promise برمی‌گرداند: `if (await confirm({...})) { ... }`.
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** قرمز می‌شود — برای کارهای ویرانگر مثل حذف یا بازنشانی. */
  destructive?: boolean;
}

type Resolver = (ok: boolean) => void;

export function ConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const settle = (ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOptions(null);
  };

  // `confirmRequest` روی `window` می‌نشیند تا هر ماژولی بدون drilling درخت
  // بتواند تأیید بگیرد. عمداً سراسری است: این یک نگرانی UI است، نه دامنه‌ای.
  useEffect(() => {
    window.confirmRequest = (opts: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        // یک دیالوگ باز، درخواست قبلی را لغو می‌کند تا Promise آن معلق نماند.
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setOptions(opts);
      });

    return () => {
      // اگر کامپوننت در حالی که دیالوگ باز است unmount شود، Promise معلقِ آن باید
      // با «انصراف» بسته شود تا کد فراخوان منتظر نماند.
      resolverRef.current?.(false);
      delete window.confirmRequest;
    };
  }, []);

  // فوکوس روی «انصراف» است تا Enter تصادفاً کار ویرانگر را تأیید نکند.
  useEffect(() => {
    if (options) cancelRef.current?.focus();
  }, [options]);

  // Escape باید همان کاری را بکند که دکمهٔ انصراف می‌کند.
  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        settle(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options]);

  if (!options) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) settle(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={options.message ? 'confirm-dialog-message' : undefined}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-start gap-3">
          {options.destructive && (
            <span className="mt-0.5 shrink-0 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-950">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
          )}
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {options.title}
            </h2>
            {options.message && (
              <p id="confirm-dialog-message" className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {options.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => settle(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {options.cancelLabel ?? 'انصراف'}
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              options.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {options.confirmLabel ?? 'تأیید'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * درخواست تأیید. اگر `ConfirmDialog` نصب نباشد، `false` می‌دهد — یعنی عملیات
 * ویرانگر انجام *نمی‌شود*، که سمت امن است.
 */
export function confirmRequest(options: ConfirmOptions): Promise<boolean> {
  if (typeof window.confirmRequest !== 'function') {
    if (import.meta.env.DEV) console.warn('[confirm] <ConfirmDialog> not mounted; treating as cancelled');
    return Promise.resolve(false);
  }
  return window.confirmRequest(options);
}

declare global {
  interface Window {
    confirmRequest?: (options: ConfirmOptions) => Promise<boolean>;
  }
}