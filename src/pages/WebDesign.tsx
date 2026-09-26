import React from 'react';
import { useApp } from '../store';
import { Globe, Code, Palette, Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import { useBanner } from '../hooks/useBanner';

export default function WebDesign() {
  const { darkMode, portfolio } = useApp();
  const banner = useBanner('webdesign');

  const services = [
    { title: 'سایت فروشگاهی', desc: 'طراحی فروشگاه آنلاین با سبد خرید، پرداخت آنلاین و پنل مدیریت', features: ['مدیریت محصولات', 'سبد خرید', 'درگاه پرداخت', 'پنل مدیریت'] },
    { title: 'سایت شرکتی', desc: 'طراحی وب‌سایت حرفه‌ای برای شرکت‌ها و سازمان‌ها', features: ['معرفی خدمات', 'نمونه‌کارها', 'فرم تماس', 'بلاگ'] },
    { title: 'سایت شخصی', desc: 'طراحی پورتفولیو و سایت شخصی برای افراد', features: ['رزومه آنلاین', 'نمونه‌کارها', 'فرم ارتباط', 'شبکه‌های اجتماعی'] },
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
            src="https://image.qwenlm.ai/generated-images/f176a0ca-e78a-405e-b84e-9b37fbaa319d/_result.png" 
            alt="طراحی وب‌سایت حرفه‌ای" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
            {banner?.title || 'طراحی وب‌سایت حرفه‌ای'}
          </h1>
          <p className="text-white/90 text-sm md:text-lg mb-6 drop-shadow">
            {banner?.description || 'طراحی سایت با جدیدترین تکنولوژی‌ها و بهترین کیفیت'}
          </p>
          <a href="tel:09913911880" className="inline-block bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all">
            درخواست مشاوره رایگان
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">انواع خدمات طراحی سایت</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={i} className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Globe size={24} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.desc}</p>
              <ul className="space-y-2">
                {s.features.map((f, j) => (
                  <li key={j} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">مراحل انجام پروژه</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['مشاوره و نیازسنجی', 'طراحی و توسعه', 'تست و بازبینی', 'راه‌اندازی و تحویل'].map((step, i) => (
              <div key={i} className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="w-10 h-10 mx-auto rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mb-3">{i + 1}</div>
                <h4 className="font-bold text-sm">{step}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">نمونه‌کارها</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolio.map(item => (
            <div key={item.id} className={`rounded-xl overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className={`h-48 ${item.image ? '' : 'bg-gradient-to-br from-purple-500 to-blue-600'} flex items-center justify-center`}>
                {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <Globe size={48} className="text-white/50" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>{item.type}</span>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                      مشاهده <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</p>
                <div className="flex flex-wrap gap-1">
                  {item.technologies.map((t, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-blue-600'}`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-white'}`}>آماده شروع پروژه خود هستید؟</h2>
          <p className={`mb-6 ${darkMode ? 'text-slate-300' : 'text-blue-100'}`}>همین حالا با ما تماس بگیرید و مشاوره رایگان دریافت کنید</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:09913911880" className={`px-6 py-3 rounded-xl font-medium ${darkMode ? 'bg-white text-slate-900' : 'bg-white text-blue-600'} hover:opacity-90`}>
              تماس: 09913911880
            </a>
            <a href="tel:09204767001" className={`px-6 py-3 rounded-xl font-medium border-2 ${darkMode ? 'border-white text-white' : 'border-white text-white'} hover:bg-white/10`}>
              تماس: 09204767001
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
