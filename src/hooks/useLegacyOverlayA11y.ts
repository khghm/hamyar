import { useEffect } from 'react';

/**
 * پل دسترسی‌پذیری برای مودال‌های قدیمی.
 *
 * در این پروژه ۴۱ مودال به‌صورت دستی با یک `div` نوشته شده بود:
 *
 *   <div className="fixed inset-0 z-50 ..." onClick={() => setShowForm(false)}>
 *
 * یعنی هر مودال هرکدام Escape را نمی‌بست، فوکوس را نمی‌گرفت و `role="dialog"`
 * نداشت. تبدیل دستیِ ۴۱ مورد پر از ریسک ناسازگاری تگ و رگرسیون ظاهری است.
 *
 * این هوک به‌جای دست‌زدن به مارک‌آپ، همان لایه‌های موجود را پیدا می‌کند و سه
 * کار می‌کند:
 *
 *   ۱. با Escape روی لایهٔ باز یک کلیک واقعی Dispatch می‌کند. چون همهٔ این
 *      مودال‌ها `onClick` بستن دارند، این کار دقیقاً همان مسیری را اجرا می‌کند
 *      که کاربر با کلیک روی پس‌زمینه می‌زند — بدون نیاز به دانستن اینکه کدام
 *      setter صدا زده می‌شود.
 *   ۲. `role="dialog"`، `aria-modal` و قفل اسکرول را اضافه می‌کند.
 *   ۳. فقط لایهٔ *بازترین* را هدف می‌گیرد، پس Escape مودال تودرتو درست کار
 *      می‌کند.
 *
 * مودال‌های جدید باید از `<Modal>` استفاده کنند؛ این هوک فقط برای مودال‌های
 * درون‌خطی موجود است و مسیر مهاجرت تدریجی است.
 */

const OVERLAY_SELECTOR = '.fixed.inset-0';

/** همهٔ لایه‌های *نمایان* باز، از پایین‌ترین (z-index کمتر) به بالاترین. */
function collectOverlays(): HTMLElement[] {
  const overlays = Array.from(document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR)).filter(
    // `display:none` (مثلاً بک‌دراپ `lg:hidden` سایدبار که در دسکتاپ
    // همیشه در DOM است) لایهٔ واقعی نیست و نباید اسکرول صفحه را قفل
    // کند. بدون این غربال، در دسکتاپ تا زمانی که سایدبار باز است
    // هیچ صفحه‌ای اسکرول نمی‌شد.
    el => getComputedStyle(el).display !== 'none',
  );
  const zOf = (el: HTMLElement) => {
    const z = Number.parseInt(getComputedStyle(el).zIndex, 10);
    return Number.isNaN(z) ? 0 : z;
  };
  return overlays.sort((a, b) => zOf(a) - zOf(b));
}

export function useLegacyOverlayA11y() {
  useEffect(() => {
    // `data-hamy-modal` از تزریق تکراری جلوگیری می‌کند؛ مودالی که همین هوک
    // دوباره فعال شود نباید صفت‌ها را دوباره بنویسد.
    const decorate = () => {
      const overlays = collectOverlays();
      for (const el of overlays) {
        if (el.dataset.hamyModal) continue;
        el.dataset.hamyModal = '1';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
      }
      document.body.style.overflow = overlays.length > 0 ? 'hidden' : '';
      return overlays;
    };

    let overlays = decorate();

    // Escape: کلیک روی خودِ لایه، نه روی پنل داخلی — پس هندلرِ موجودِ
    // «کلیک روی پس‌زمینه = بستن» اجرا می‌شود و همان state را پاک می‌کند.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const top = overlays[overlays.length - 1];
      if (!top) return;
      e.stopPropagation();
      top.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    };
    document.addEventListener('keydown', onKeyDown);

    // باز و بسته شدن مودال‌ها در اپ کاملاً با state انجام می‌شود، پس DOM
    // عوض می‌شود. MutationObserver فهرست را تازه نگه می‌دارد.
    const observer = new MutationObserver(() => {
      overlays = decorate();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      document.body.style.overflow = '';
      for (const el of document.querySelectorAll<HTMLElement>('[data-hamy-modal]')) {
        delete el.dataset.hamyModal;
        el.removeAttribute('role');
        el.removeAttribute('aria-modal');
      }
    };
  }, []);
}