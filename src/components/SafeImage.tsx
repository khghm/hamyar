import React, { useEffect, useState } from 'react';

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * تصویری که خطای بارگذاری و ورودی خالی را با استیت React مدیریت می‌کند.
 *
 * الگوی قبلی این بود: `onError={e => (e.target.style.display = 'none')}`.
 * چون آن استایل مستقیماً (imperative) روی عنصر DOM نوشته می‌شود و React آن را
 * مدیریت نمی‌کند، اگر تصویر در رندر اول خالی یا نامعتبر باشد عنصر مخفی می‌شد و
 * بعد از هیدریشن و پر شدن `src` با تصویر واقعی هم مخفی می‌ماند. این کامپوننت
 * به‌جای آن، به‌جای دست‌کاری DOM از state استفاده می‌کند و با تغییر `src` ریست می‌شود.
 */
export default function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return <img {...rest} src={src} alt={alt} onError={() => setFailed(true)} />;
}
