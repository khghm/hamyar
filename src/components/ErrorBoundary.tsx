import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** عنوان فارسی برای نمایش به کاربر. */
  fallbackTitle?: string;
  /** پیام توضیحی زیر عنوان. */
  fallbackMessage?: string;
  /** کلاس‌های CSS برای جعبهٔ خطا، تا در هر بخش با طرح همان بخش هماهنگ شود. */
  className?: string;
  /** فراخوانی اختیاری برای گزارش خطا (لاگ یا سرویس مانیتورینگ). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * مرز خطا برای زیردرخت React.
 *
 * بدون این کامپوننت، یک استثنا در رندر هر صفحه کل اپ را سفید می‌کند و کاربر
 * فقط صفحهٔ خالی می‌بیند و باید رفرش کند. اینجا خطا گرفته می‌شود، به کاربر
 * پیام فارسی داده می‌شود و امکان تلاش مجدد فراهم می‌گردد.
 *
 * دو سطح استفاده شده است: مرز ریشه در `App.tsx` و یک مرز به‌ازای هر بخش مدیریت،
 * تا خرابی یک صفحهٔ پنل بقیهٔ پنل را از کار نیندازد.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // لاگ در کنسول برای توسعه؛ onError می‌تواند آن را به سرویس مانیتورینگ بفرستد.
    console.error('[ErrorBoundary]', this.props.fallbackTitle ?? 'render error', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={this.props.className ?? 'min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center'}>
        <p className="text-lg font-bold text-red-700">{this.props.fallbackTitle ?? 'خطای غیرمنتظره'}</p>
        <p className="max-w-md text-sm text-slate-600">
          {this.props.fallbackMessage ?? 'بخشی از صفحه نتوانست نمایش داده شود. لطفاً دوباره تلاش کنید.'}
        </p>
        {/* جزئیات فنی فقط در محیط توسعه — پیام خطا می‌تواند داده‌های داخلی داشته باشد. */}
        {import.meta.env.DEV && (
          <pre dir="ltr" className="max-w-2xl overflow-auto rounded-lg bg-slate-900 p-4 text-left text-xs text-slate-100">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            بارگذاری دوبارهٔ صفحه
          </button>
        </div>
      </div>
    );
  }
}