import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Monitor, Film, ShoppingBag, Globe, ArrowLeft, Newspaper, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  const { darkMode, news } = useApp();

  const features = [
    { icon: Monitor, title: 'خدمات کافی‌نت', desc: 'پرینت، اسکن، تایپ، ترجمه، ثبت‌نام و تمامی خدمات اداری', path: '/services', color: 'from-blue-500 to-cyan-500' },
    { icon: Film, title: 'کالکشن فیلم و سریال', desc: 'بزرگ‌ترین مجموعه فیلم، سریال، انیمیشن و انیمه با کیفیت بالا', path: '/media', color: 'from-purple-500 to-pink-500' },
    { icon: ShoppingBag, title: 'فروشگاه محصولات', desc: 'فروش فلش، هارد، کابل، شارژر، دوربین مداربسته و لوازم جانبی', path: '/store', color: 'from-green-500 to-emerald-500' },
    { icon: Globe, title: 'طراحی وب‌سایت', desc: 'طراحی سایت فروشگاهی، شرکتی و شخصی با جدیدترین تکنولوژی‌ها', path: '/webdesign', color: 'from-orange-500 to-red-500' },
  ];

  const stats = [
    { value: '+۵۰۰', label: 'مشتری راضی' },
    { value: '+۱۰۰۰', label: 'سفارش انجام‌شده' },
    { value: '+۵۰', label: 'پروژه طراحی سایت' },
    { value: '+۵۰۰', label: 'عنوان فیلم و سریال' },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">کافی نت همیار</span>
            </h1>
            <p className={`text-lg lg:text-xl mb-8 leading-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              مرکز خدمات و فروش دیجیتال - ارائه‌دهنده خدمات کافی‌نت، کپی مدیا، فروش محصولات دیجیتال و طراحی وب‌سایت
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/services" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
                مشاهده خدمات
                <ArrowLeft size={18} />
              </Link>
              <Link to="/store" className={`px-8 py-3 rounded-xl font-medium border-2 transition-all ${darkMode ? 'border-slate-600 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-100'}`}>
                فروشگاه آنلاین
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-12 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-blue-600">{s.value}</div>
                <div className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">خدمات ما</h2>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>چهار جریان خدماتی برای پاسخگویی به تمامی نیازهای دیجیتال شما</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link key={i} to={f.path} className={`group p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className={`py-16 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">چرا همیار؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Star, title: 'کیفیت بالا', desc: 'ارائه خدمات با بالاترین کیفیت و دقت' },
              { icon: Shield, title: 'اعتماد و امنیت', desc: 'حفظ امنیت اطلاعات و حریم خصوصی مشتریان' },
              { icon: Clock, title: 'سرعت در انجام', desc: 'انجام سفارشات در سریع‌ترین زمان ممکن' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center p-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon size={32} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Newspaper size={24} className="text-blue-600" />
              آخرین اخبار
            </h2>
            <Link to="/news" className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
              مشاهده همه
              <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.filter(n => n.active).slice(0, 3).map(item => (
              <div key={item.id} className={`rounded-xl overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`h-40 ${item.image ? '' : 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center`}>
                  {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <Newspaper size={48} className="text-white/50" />}
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className={`text-sm line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.caption}</p>
                  <span className={`text-xs mt-2 block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
