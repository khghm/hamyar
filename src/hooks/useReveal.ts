import { useEffect } from 'react';

/**
 * نمایش نرم بخش‌ها هنگام ورود به دید.
 *
 * یک IntersectionObserver مشترک برای همهٔ عناصر `.reveal` می‌سازد و کلاس
 * `is-visible` را اضافه می‌کند. اگر کاربر «کاهش حرکت» را فعال کرده باشد یا
 * مرورگر پشتیبانی نکند، همهٔ عناصر بلافاصله نمایان می‌شوند.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    if (!nodes.length) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      nodes.forEach(n => n.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);
}
