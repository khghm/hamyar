import { useEffect } from 'react';

/**
 * مدیریت متا تگ‌های صفحه (سئو) در سمت کلاینت.
 *
 * برای بازدیدکنندهٔ انسانی و کرالرهایی که جاوااسکریپت اجرا می‌کنند همین کافی
 * است؛ برای ربات‌های شبکه‌های اجتماعی (که JS اجرا نمی‌کنند) Worker متاهای
 * اختصاصی هر مقاله را داخل HTML اولیه تزریق می‌کند (src/index.js).
 */

export type SeoProps = {
  title: string;
  description?: string;
  /** مسیر بدون دامنه، مثلاً `/news/slug` — canonical از همین ساخته می‌شود. */
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  noindex?: boolean;
  /** داده ساخت‌یافته (schema.org) — در <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** برای مقالات: تاریخ انتشار/به‌روزرسانی و نویسنده */
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
};

const SITE_NAME = 'کافی نت همیار';

function setMeta(attr: 'name' | 'property', key: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href?: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  keywords,
  noindex,
  jsonLd,
  publishedTime,
  modifiedTime,
  author,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords?.filter(Boolean).join(', '));
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    const origin = window.location.origin;
    const url = `${origin}${path || window.location.pathname}`;
    setLink('canonical', url);

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:locale', 'fa_IR');
    if (image) setMeta('property', 'og:image', image.startsWith('http') ? image : `${origin}${image}`);

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    if (image) setMeta('name', 'twitter:image', image.startsWith('http') ? image : `${origin}${image}`);

    if (type === 'article') {
      setMeta('property', 'article:published_time', publishedTime);
      setMeta('property', 'article:modified_time', modifiedTime);
      setMeta('property', 'article:author', author);
    }

    // JSON-LD: نسخهٔ قبلی حذف و نسخهٔ این صفحه اضافه می‌شود
    document.querySelectorAll('script[data-seo-jsonld="page"]').forEach(n => n.remove());
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = 'page';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, image, type, keywords, noindex, jsonLd, publishedTime, modifiedTime, author]);

  return null;
}
