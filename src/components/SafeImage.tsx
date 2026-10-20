import React, { useEffect, useState } from 'react';

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** وقتی تصویر خالی/خراب است چه چیزی نمایش داده شود (مثلاً پوشش گرادیانی برند). */
  fallback?: React.ReactNode;
};

/**
 * تصویری که خطای بارگذاری و ورودی خالی را با استیت React مدیریت می‌کند.
 *
 * الگوی قبلی این بود: `onError={e => (e.target.style.display = 'none')}`.
 * چون آن استایل مستقیماً (imperative) روی عنصر DOM نوشته می‌شود و React آن را
 * مدیریت نمی‌کند، اگر تصویر در رندر اول خالی یا نامعتبر باشد عنصر مخفی می‌شد و
 * بعد از هیدریشن و پر شدن `src` با تصویر واقعی هم مخفی می‌ماند. این کامپوننت
 * به‌جای آن، با state کار می‌کند و با تغییر `src` ریست می‌شود.
 *
 * `fallback` عمداً اضافه شده است: قبلاً کارت‌های بدون تصویر (بیشتر محصولات)
 * فضایی کاملاً خالی نشان می‌دادند.
 */
export default function SafeImage({ src, alt, fallback = null, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return <img {...rest} src={src} alt={alt} loading={rest.loading ?? 'lazy'} onError={() => setFailed(true)} />;
}
