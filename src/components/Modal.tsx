import { useCallback, useEffect, useRef, type ReactNode } from 'react';

/**
 * پوشش استاندارد دیالوگ.
 *
 * قبلاً ۴۱ مودال در پروژه با یک `div` ساده دستی نوشته شده بود و همهٔ آن‌ها سه
 * ایراد یکسان داشتند: با Escape بسته نمی‌شدند، فوکوس به داخل نمی‌رفت و از آن
 * بیرون نمی‌آمد، و `role="dialog"` نداشتند — یعنی برای کاربر صفحه‌خوان عملاً
 * یک لایهٔ شناور بی‌معنا بود. این کامپوننت هر سه را یک‌جا حل می‌کند.
 *
 * DOM عمداً همان ساختار قبلی را نگه می‌دارد (overlay + panel) تا استایل‌های
 * موجود بدون تغییر کار کنند.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  onClose: () => void;
  /** کلاس‌های روی پنل داخلی؛ پنل خودش عرض/رنگ را از این می‌گیرد. */
  className?: string;
  /** کلاس‌های روی لایهٔ پس‌زمینه؛ برای مواردی که تم تیره دارند. */
  overlayClassName?: string;
  /**
   * عنوان دیالوگ. به `aria-labelledby` وصل می‌شود تا صفحه‌خوان بداند چه چیزی
   * باز شده — بدون این، کاربر فقط «dialog» بی‌نام می‌شنود.
   */
  title?: string;
  children: ReactNode;
}

export function Modal({
  onClose,
  className = '',
  overlayClassName = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
  title,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // Escape باید همان کاری را بکند که دکمهٔ بستن می‌کند.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // زندان فوکوس: بدون این، Tab از پشت دیالوگ به صفحهٔ زیرین می‌رود و
      // کاربر در پس‌زمینه گم می‌شود.
      const panel = panelRef.current;
      if (!panel) return;
      // عمداً بر پایهٔ صفت‌ها فیلتر می‌کنیم نه `offsetParent`: آن یک ویژگی
      // وابسته به چیدمان است و در jsdom همیشه `null` است، پس فهرست را خالی
      // می‌کرد و زندان فوکوس را بی‌اثر می‌کرد.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // فوکوس اولیه روی اولین کنترل، و برگرداندن فوکوس به جایی که کاربر بود.
  useEffect(() => {
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (target ?? panel)?.focus();
    return () => restoreFocusTo.current?.focus?.();
  }, []);

  // قفل اسکرول پس‌زمینه تا چرخش صفحه فقط دیالوگ را جابه‌جا نکند.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // کلیک روی خودِ لایه (نه پنل) می‌بندد؛ کلیک روی پنل نباید.
  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div className={overlayClassName} onClick={onOverlayClick}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={className}
      >
        {children}
      </div>
    </div>
  );
}