import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

/**
 * پیام کوتاه موقت (toast) به‌جای `alert()`.
 *
 * `alert()` مسیر اجرا را متوقف می‌کند و در موبایل ظاهر مرورگر بدون تم است؛
 * به‌علاوه قابل استایل‌دادن و قابل خواندن با صفحه‌خوان نیست. اینجا یک لایهٔ
 * سراسری داریم که هر چیزی می‌تواند از طریق `useToast()` پیام بدهد.
 *
 * آگاهی عمداً فقط در کنسول هم نوشته می‌شود تا خطاهای مهم در محیط تست قابل
 * پیگیری بمانند (قانون پروژه: `console.warn` / `console.error` مجاز است،
 * `console.log` نه).
 */

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** زمان نمایش بر حسب میلی‌ثانیه؛ خطاها بیشتر می‌مانند چون اغلب تنها راه دیدنشان همان‌جاست. */
const LIFETIME: Record<ToastKind, number> = {
  success: 3000,
  info: 3500,
  warning: 4500,
  error: 6000,
};

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/70 dark:text-red-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-100',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setItems(prev => [...prev.slice(-3), { id, kind, message }]);
      if (kind === 'error') console.error('[toast]', message);
      else if (kind === 'warning') console.warn('[toast]', message);
      window.setTimeout(() => dismiss(id), LIFETIME[kind]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m: string) => show(m, 'success'),
      error: (m: string) => show(m, 'error'),
      warning: (m: string) => show(m, 'warning'),
      info: (m: string) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/*
        `aria-live` اعلام می‌کند که محتوای این ناحیه عوض شده تا صفحه‌خوان
        پیام را بخواند؛ بدون آن پیام کاملاً بی‌صدا از دست می‌رود.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map(t => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${TONE[t.kind]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm leading-6">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="بستن پیام"
                className="shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * خارج از `ToastProvider` صدا زده شود، هشدار کنسول می‌دهد و بی‌اثر برمی‌گردد —
 * به‌جای اینکه کل اپ را با خطای زمان اجرا بشکند.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  if (import.meta.env.DEV) console.warn('[toast] useToast outside <ToastProvider>; message dropped');
  return {
    show: () => {},
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
  };
}