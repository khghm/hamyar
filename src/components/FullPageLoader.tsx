import { Loader2 } from 'lucide-react';

/**
 * اسپینر تمام‌صفحه. هم برای «در حال بازیابی نشست» و هم به‌عنوان fallbackِ
 * `Suspense` در بارگذاری تنبل مسیرها استفاده می‌شود.
 */
export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  );
}

/**
 * نسخهٔ درون‌صفحه‌ای برای `Suspense` داخل Layoutها: نوار بالا و فوتر سر جایشان
 * می‌مانند و فقط ناحیهٔ محتوا اسپینر نشان می‌دهد.
 */
export function RouteLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );
}
