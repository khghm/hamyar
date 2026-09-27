import React from 'react';
import { useApp } from '../store';
import { Wifi, Zap, Users, Headphones, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useBanner } from '../hooks/useBanner';

export default function Asiatech() {
  const { darkMode } = useApp();
  const banner = useBanner('asiatech');

  const packages = [
    { name: 'ADSL 16M', speed: 'تا ۱۶ مگابیت', price: '۹۵,۰۰۰ تومان/ماه', features: ['پهنای باند نامحدود', 'بدون محدودیت ترافیک', 'مودم رایگان (اجاره)', 'نصب و راه‌اندازی سریع'], popular: false },
    { name: 'VDSL 45M', speed: 'تا ۴۵ مگابیت', price: '۱۴۵,۰۰۰ تومان/ماه', features: ['پهنای باند نامحدود', 'کیفیت و پینگ مناسب', 'مدیریت ترافیک هوشمند', 'پشتیبانی ۲۴ ساعته'], popular: true },
    { name: 'VDSL 75M', speed: 'تا ۷۵ مگابیت', price: '۱۹۵,۰۰۰ تومان/ماه', features: ['مناسب استریم و گیمینگ', 'اولویت ترافیک', 'IP اختصاصی (اختیاری)', 'پشتیبانی VIP'], popular: false },
    { name: 'FTTH 300M', speed: 'فیبر نوری تا ۳۰۰ مگابیت', price: '۳۵۰,۰۰۰ تومان/ماه', features: ['سرعت و پایداری فوق‌العاده', 'تجهیزات ONT رایگان', 'مناسب سازمان‌ها', 'SLA پشتیبانی'], popular: false },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        {banner?.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="https://image.qwenlm.ai/generated-images/b7e14d92-3c6a-4f8b-9d2e-6a1c5f8b3e70/_result.png"
            alt="نمایندگی رسمی اینترنت آسیاتک"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
            {banner?.title || 'نمایندگی اینترنت آسیاتک'}
          </h1>
          <p className="text-white/90 text-sm md:text-lg mb-6 drop-shadow">
            {banner?.description || 'ثبت‌نام و فروش سرویس‌های اینترنت ثابت آسیاتک - ADSL، VDSL و فیبر نوری با پشتیبانی رسمی'}
          </p>
          <a href="tel:09913911880" className="inline-block bg-red-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-red-700 transition-all">
            درخواست ثبت‌نام
          </a>
        </div>
      </section>

      {/* Why Asiatech */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">چرا آسیاتک؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Wifi, title: 'پوشش سراسری', desc: 'دسترسی به سرویس در اکثر شهرهای کشور' },
            { icon: Zap, title: 'پینگ پایین', desc: 'زیرساخت قوی و مسیرهای ارتباطی بهینه' },
            { icon: Users, title: 'بدون محدودیت حجم', desc: 'ترافیک نامحدود در تمامی سرویس‌ها' },
            { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'پاسخگویی شبانه‌روزی به مشترکین' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className={`p-6 rounded-2xl text-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="w-14 h-14 mx-auto rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <Icon size={28} className="text-red-600" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Packages */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">سرویس‌های اینترنت ثابت</h2>
          <p className={`text-center mb-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ثبت‌نام، فعال‌سازی و انتقال سرویس به نام شما در کمتر از ۲۴ ساعت</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((p, i) => (
              <div key={i} className={`p-6 rounded-2xl text-center border-2 flex flex-col ${p.popular ? 'border-red-500 shadow-lg' : darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                {p.popular && <span className="inline-block bg-red-600 text-white text-xs px-3 py-1 rounded-full mb-3 mx-auto">پیشنهاد ویژه</span>}
                <h3 className="font-bold text-xl mb-1">{p.name}</h3>
                <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.speed}</p>
                <div className="text-red-600 font-black text-lg mb-4">{p.price}</div>
                <ul className="space-y-2 mb-6 text-right flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <CheckCircle2 size={14} className="text-red-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="tel:09913911880" className={`block px-4 py-2 rounded-xl font-medium text-sm transition-all ${p.popular ? 'bg-red-600 text-white hover:bg-red-700' : 'border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                  سفارش سرویس
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to order */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">نحوه سفارش و فعال‌سازی</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['تماس یا مراجعه حضوری', 'ارائه اطلاعات خط تلفن', 'ثبت سفارش در سامانه آسیاتک', 'نصب و فعال‌سازی سرویس'].map((step, i) => (
            <div key={i} className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}>
              <div className="w-10 h-10 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center font-bold mb-3">{i + 1}</div>
              <h4 className="font-bold text-sm">{step}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-red-600'}`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">همین الآن اینترنت پرسرعت بگیرید</h2>
          <p className="text-white/90 mb-6">کارشناسان ما آماده پاسخگویی و ثبت‌نام سرویس آسیاتک برای شما هستند</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:09913911880" className="px-6 py-3 rounded-xl font-medium bg-white text-red-600 hover:opacity-90">
              تماس: 09913911880
            </a>
            <a href="tel:09204767001" className="px-6 py-3 rounded-xl font-medium border-2 border-white text-white hover:bg-white/10">
              تماس: 09204767001
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
