import React from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { faPrice } from '../utils/format';

/**
 * نوار اقدام چسبان در موبایل (صفحهٔ محصول/خدمت).
 *
 * در دسکتاپ پنهان است و فقط زیر ۷۶۸px نمایش داده می‌شود؛ فضای پایین صفحه با
 * کلاس `pb-24 md:pb-0` در محتوای صفحه جبران می‌شود.
 */
export default function StickyBuyBar({
  price,
  unit = 'تومان',
  onBuy,
  buyLabel = 'افزودن به سبد',
  href,
  disabled,
}: {
  price: number;
  unit?: string;
  onBuy?: () => void;
  buyLabel?: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <ShoppingCart size={17} />
      {buyLabel}
    </>
  );

  return (
    <div className="sticky-buy md:hidden">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500">قیمت</span>
        <span className="font-bold text-brand-600 text-sm tnum">
          {price.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
        </span>
      </div>
      {href ? (
        <a href={href} className="btn btn-primary flex-1 justify-center">
          {content}
        </a>
      ) : (
        <button type="button" onClick={onBuy} disabled={disabled} className="btn btn-primary flex-1 justify-center">
          {content}
        </button>
      )}
    </div>
  );
}
