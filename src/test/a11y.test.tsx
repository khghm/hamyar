import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Modal } from '../components/Modal';
import { ConfirmDialog, confirmRequest } from '../components/ConfirmDialog';
import { ToastProvider, useToast } from '../components/Toast';
import { useLegacyOverlayA11y } from '../hooks/useLegacyOverlayA11y';

/**
 * تست دسترسی‌پذیری — فاز ۳.۵
 *
 * این تست‌ها روی رفتاری متمرکزند که با چشم دیده نمی‌شود: با کیبورد چه اتفاقی
 * می‌افتد و آیا صفحه‌خوان می‌تواند دیالوگ را بشناسد. بدون آن‌ها یک بازگشت
 * (مثلاً حذف دوبارهٔ `role="dialog"` یا کار نکردن Escape) کاملاً بی‌صدا وارد
 * پروژه می‌شود.
 */

describe('Modal', () => {
  it('نمایان می‌کند و ساختار دسترسی‌پذیر دارد', () => {
    render(
      <Modal onClose={() => {}} title="افزودن محصول">
        <input aria-label="نام محصول" />
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('افزودن محصول');
  });

  it('با Escape بسته می‌شود', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="تأیید">
        <button>اجرا</button>
      </Modal>,
    );

    // روی عنصر تحت فوکوس شلیک می‌کنیم، نه روی `window`: در مرورگر واقعی کلید
    // روی عنصر فعال فرود می‌آید و تا `document` بالا می‌رود. شلیک مستقیم روی
    // `window` هرگز به لیسنرهای `document` نمی‌رسد و تست را دروغ می‌گوید.
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('با کلیک روی پس‌زمینه بسته می‌شود ولی با کلیک روی پنل نه', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="تأیید">
        <button>اجرا</button>
      </Modal>,
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    // `currentTarget` پنل است و `target` پس‌زمینه؛ باید بسته شود.
    const overlay = screen.getByRole('dialog').parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab را داخل دیالوگ نگه می‌دارد و از لبه برنمی‌گردد', () => {
    render(
      <Modal onClose={() => {}} title="تأیید">
        <button>اول</button>
        <button>دوم</button>
      </Modal>,
    );

    const first = screen.getByRole('button', { name: 'اول' });
    const last = screen.getByRole('button', { name: 'دوم' });

    first.focus();
    // از آخرین کنترل، Tab باید به اولی برگردد نه به بدنهٔ صفحه.
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('هنگام باز بودن، اسکرول صفحه را قفل می‌کند و بعد آزاد می‌کند', () => {
    const { unmount } = render(
      <Modal onClose={() => {}} title="تأیید">
        <button>اجرا</button>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('پس از بسته شدن، فوکوس به جایی که کاربر بود برمی‌گردد', async () => {
    function Harness() {
      return (
        <>
          <button data-testid="opener">باز کردن</button>
          <Modal onClose={() => {}} title="فرم">
            <button>داخل</button>
          </Modal>
        </>
      );
    }

    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<Harness />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'داخل' })).toBeInTheDocument());

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});

describe('ConfirmDialog', () => {
  it('Promise را با «تأیید» حل می‌کند', async () => {
    render(<ConfirmDialog />);
    const request = confirmRequest({ title: 'حذف سفارش', message: 'برگشت‌پذیر نیست.' });

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('حذف سفارش');

    fireEvent.click(screen.getByRole('button', { name: 'تأیید' }));
    await expect(request).resolves.toBe(true);
  });

  it('Escape یعنی انصراف، نه تأیید', async () => {
    render(<ConfirmDialog />);
    const request = confirmRequest({ title: 'حذف' });

    await screen.findByRole('alertdialog');
    fireEvent.keyDown(document.body, { key: 'Escape' });

    await expect(request).resolves.toBe(false);
  });

  it('اگر نصب نباشد، عملیات ویرانگر اجرا نمی‌شود', async () => {
    // بدون رندر کردن <ConfirmDialog /> هیچ هندلری روی window نیست.
    await expect(confirmRequest({ title: 'حذف' })).resolves.toBe(false);
  });

  it('روی Escape فوکوس روی «انصراف» است تا Enter تصادفی تأیید نکند', async () => {
    render(<ConfirmDialog />);
    confirmRequest({ title: 'پاکسازی باشگاه مشتریان', destructive: true });

    const cancel = await screen.findByRole('button', { name: 'انصراف' });
    expect(cancel).toHaveFocus();
  });
});

describe('Toast', () => {
  function Trigger() {
    const toast = useToast();
    return (
      <>
        <button onClick={() => toast.success('ذخیره شد')}>موفق</button>
        <button onClick={() => toast.error('خطا رخ داد')}>ناموفق</button>
      </>
    );
  }

  it('پیام را در ناحیهٔ زنده نمایش می‌دهد تا صفحه‌خوان بخواند', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'موفق' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('ذخیره شد');
  });

  it('خارج از Provider بی‌اثر است و اپ را نمی‌شکند', () => {
    function Bare() {
      const toast = useToast();
      return <button onClick={() => toast.success('x')}>کلیک</button>;
    }
    render(<Bare />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'کلیک' }))).not.toThrow();
  });
});

describe('useLegacyOverlayA11y', () => {
  function LegacyModal({ onClose }: { onClose: () => void }) {
    useLegacyOverlayA11y();
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
        <div onClick={e => e.stopPropagation()}>
          <button>داخل مودال</button>
        </div>
      </div>
    );
  }

  it('به مودال قدیمی role="dialog" می‌دهد و Escape را به هندلر بستن وصل می‌کند', () => {
    const onClose = vi.fn();
    render(<LegacyModal onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // این هوک باید دقیقاً همان کاری را بکند که کلیک روی پس‌زمینه می‌کند.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('وقتی هیچ مودالی باز نیست Escape کاری نمی‌کند', () => {
    function Idle() {
      useLegacyOverlayA11y();
      return <div>بدون مودال</div>;
    }
    render(<Idle />);

    expect(screen.queryByRole('dialog')).toBeNull();

    const stray = vi.fn();
    document.body.addEventListener('click', stray);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(stray).not.toHaveBeenCalled();
    document.body.removeEventListener('click', stray);
  });
});