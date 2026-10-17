import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * `React.lazy` با یک ترمیمِ شبکه‌ای.
 *
 * هر مسیر یک chunk جداگانه است، پس فقط کد همان صفحه دانلود می‌شود. اما روی
 * اتصال‌های ناپایدار (و دامنه‌های فیلترشده) دانلود یک chunk می‌تواند در میانهٔ
 * راه با `ERR_CONNECTION_RESET` قطع شود و React آن خطا را به کاربر نشان دهد.
 *
 * اینجا وقتی دانلود شکست می‌خورد، یک بار صفحه را reload می‌کنیم: `index.html`
 * تازه‌ترین هش‌ها را می‌آورد و chunk دوباره (و به‌احتمال زیاد از CDN لبه)
 * دانلود می‌شود. این همان کاری است که «بعد از هر دیپلوی، صفحهٔ سفید با
 * ChunkLoadError» را هم درمان می‌کند.
 *
 * پنجرهٔ ۶۰ ثانیه‌ای جلوی حلقهٔ بی‌پایان را می‌گیرد: اگر اتصال واقعاً قطع باشد،
 * بار دوم خطا به `ErrorBoundary` می‌رسد تا دکمهٔ «تلاش دوباره» نشان داده شود.
 */
const RELOAD_FLAG = 'hamyar:chunk-reload-at';
const RELOAD_WINDOW_MS = 60_000;

export function lazyRoute<T extends ComponentType<Record<string, never>>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      let lastReload = 0;
      try {
        lastReload = Number(window.sessionStorage.getItem(RELOAD_FLAG) || 0);
      } catch {
        // حالت خصوصی/مسدود: بی‌خیال نگه‌داشتن نشانگر می‌شویم.
      }
      if (Date.now() - lastReload > RELOAD_WINDOW_MS) {
        try {
          window.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        } catch {
          // ignore
        }
        window.location.reload();
      }
      throw error;
    }
  });
}
