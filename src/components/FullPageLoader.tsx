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