import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';
import Seo from '../components/Seo';

/** صفحهٔ ۴۰۴ با مسیرهای پیشنهادی (به‌جای صفحهٔ خالی مرورگر). */
export default function NotFound() {
  return (
    <div className="container-page section text-center">
      <Seo title="صفحه یافت نشد" noindex />
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
          <Compass size={38} className="text-brand-600" />
        </div>
        <p className="eyebrow mb-2">خطای ۴۰۴</p>
        <h1 className="h1 mb-3">این صفحه پیدا نشد</h1>
        <p className="body-text meta mb-8">
          ممکن است آدرس تغییر کرده باشد یا صفحه حذف شده باشد. از مسیرهای زیر ادامه دهید.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary">
            <Home size={16} /> صفحهٔ اصلی
          </Link>
          <Link to="/services" className="btn btn-secondary">
            <Search size={16} /> جستجو در خدمات
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[
            { to: '/store', label: 'فروشگاه' },
            { to: '/news', label: 'اخبار' },
            { to: '/contact', label: 'تماس با ما' },
            { to: '/faq', label: 'سوالات متداول' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="chip">
              {l.label} <ArrowLeft size={12} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
