import React from 'react';
import { useApp } from '../store';
import { PenTool, Instagram, Video, Search, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useBanner } from '../hooks/useBanner';

export default function ContentMarketing() {
  const { darkMode } = useApp();
  const banner = useBanner('content');

  const services = [
    { icon: PenTool, title: 'تولید محتوای متنی', desc: 'نوشتن مقاله، متن تبلیغاتی و محتوای سئو شده برای سایت و شبکه‌های اجتماعی', features: ['مقالات سئو شده', 'کپی‌رایتینگ تبلیغاتی', 'تولید محتوای بلاگ'] },
    { icon: Instagram, title: 'مدیریت شبکه‌های اجتماعی', desc: 'مدیریت و ادمین اینستاگرام، تلگرام و لینکدین با تقویم محتوایی منظم', features: ['تقویم محتوایی', 'پست و استوری روزانه', 'گزارش عملکرد ماهانه'] },
    { icon: Video, title: 'تولید محتوای تصویری و ویدیویی', desc: 'طراحی پوستر، بنر، موشن‌گرافیک و ساخت ریلز و تیزرهای کوتاه', features: ['طراحی گرافیک', 'موشن‌گرافیک', 'ریلز و تیزر ویدیویی'] },
    { icon: Search, title: 'سئو و بهینه‌سازی', desc: 'بهبود رتبه سایت در گوگل از طریق سئوی داخلی، لینک‌سازی و تحقیق کلمات کلیدی', features: ['تحقیق کلمات کلیدی', 'سئوی داخلی و تکنیکال', 'لینک‌سازی استاندارد'] },
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
            src="https://image.qwenlm.ai/generated-images/8f3c2a1e-7b4d-4e9f-a6c1-d52b8e9f0a37/_result.png"
            alt="تولید محتوا و دیجیتال مارکتینگ"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
            {banner?.title || 'تولید محتوا'}
          </h1>
          <p className="text-white/90 text-sm md:text-lg mb-6 drop-shadow">
            {banner?.description || 'تولید محتوای متنی، تصویری و ویدیویی + مدیریت شبکه‌های اجتماعی و سئو'}
          </p>
          <a href="tel:09913911880" className="inline-block bg-pink-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-pink-700 transition-all">
            درخواست مشاوره رایگان
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-4">خدمات تولید محتوا</h2>
        <p className={`text-center mb-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>محتوای جذاب، کلید رشد کسب‌وکار شما در دنیای دیجیتال</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-pink-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f, j) => (
                    <li key={j} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <CheckCircle2 size={16} className="text-pink-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Packages */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">پکیج‌های ماهانه</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'پکیج برنزی', posts: '۱۲ پست + ۳۰ استوری', price: 'از ۳ میلیون تومان', popular: false },
              { name: 'پکیج نقره‌ای', posts: '۲۰ پست + ۶۰ استوری + طراحی گرافیک', price: 'از ۶ میلیون تومان', popular: true },
              { name: 'پکیج طلایی', posts: '۳۰ پست + استوری روزانه + ریلز + سئو', price: 'از ۱۰ میلیون تومان', popular: false },
            ].map((p, i) => (
              <div key={i} className={`p-6 rounded-2xl text-center border-2 ${p.popular ? 'border-pink-500 shadow-lg' : darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                {p.popular && <span className="inline-block bg-pink-600 text-white text-xs px-3 py-1 rounded-full mb-3">پرطرفدار</span>}
                <h3 className="font-bold text-xl mb-2">{p.name}</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.posts}</p>
                <div className="text-pink-600 font-black text-lg mb-4">{p.price}</div>
                <a href="tel:09913911880" className={`block px-4 py-2 rounded-xl font-medium text-sm transition-all ${p.popular ? 'bg-pink-600 text-white hover:bg-pink-700' : 'border-2 border-pink-500 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}>
                  سفارش پکیج
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-pink-600'}`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">می‌خواهید دیده شوید؟</h2>
          <p className="text-white/90 mb-6">همین حالا محتوای کسب‌وکار خود را به تیم ما بسپارید و نتیجه را ببینید</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:09913911880" className="px-6 py-3 rounded-xl font-medium bg-white text-pink-600 hover:opacity-90">
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
