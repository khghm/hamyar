import React from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor, Film, ShoppingBag, Globe, ArrowLeft, Newspaper, ShieldCheck, Sparkles,
  Clock4, CreditCard, Headphones, Bot, PenTool, Wifi, Server, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../store';
import Seo from '../components/Seo';
import { useReveal } from '../hooks/useReveal';
import BrandVisual from '../components/BrandVisual';
import { toJalaliString } from '../utils/jalali';

/**
 * صفحهٔ اصلی — بازطراحی‌شده با تمرکز روی سلسله‌مراتب بصری، اعتماد و مسیرهای
 * واضح خرید/سفارش. تصاویر هیرو به‌صورت گرادیان برند + SVG محلی هستند (بدون
 * وابستگی به دامنهٔ خارجی) و آمار از دادهٔ واقعی خوانده می‌شود.
 */
export default function Home() {
  const { darkMode, products, news, services: allServices, mediaItems } = useApp();
  useReveal();

  const publishedNews = news.filter(n => (n.status ? n.status === 'published' : n.active !== false));

  // آمار واقعی و قابل‌اعتماد برای بازدیدکنندهٔ عمومی (نه شمارندهٔ سفارش‌های خصوصی)
  const stats = [
    { value: products.length, label: 'محصول و کالای دیجیتال' },
    { value: allServices.length, label: 'خدمت قابل سفارش' },
    { value: mediaItems.length, label: 'عنوان فیلم و سریال' },
    { value: publishedNews.length, label: 'خبر و مقاله' },
  ].map(s => ({ ...s, value: s.value.toLocaleString('fa-IR') }));

  const services = [
    {
      to: '/services', icon: Monitor, title: 'خدمات کافی‌نت',
      desc: 'پرینت، اسکن، کپی، تایپ، لمینت و بسته‌بندی — همان روز',
      points: ['پرینت رنگی و سیاه‌وسفید', 'اسکن و تایپ فارسی/انگلیسی'],
    },
    {
      to: '/media', icon: Film, title: 'کالکشن فیلم و سریال',
      desc: 'کپی فیلم، سریال، انیمیشن و انیمه روی فلش و هارد شما',
      points: ['کیفیت اورجینال', 'تحویل روی حافظهٔ خودتان'],
    },
    {
      to: '/store', icon: ShoppingBag, title: 'فروشگاه محصولات دیجیتال',
      desc: 'فلش، هارد، شارژر، لوازم جانبی موبایل و کامپیوتر',
      points: ['اصالت کالا', 'ارسال سراسری'],
    },
    {
      to: '/webdesign', icon: Globe, title: 'طراحی وب‌سایت',
      desc: 'سایت فروشگاهی، شرکتی و شخصی؛ سریع، امن و سئوشده',
      points: ['طراحی اختصاصی', 'پشتیبانی پس از تحویل'],
    },
    {
      to: '/content', icon: PenTool, title: 'تولید محتوا',
      desc: 'متن، تصویر و ویدئوی تبلیغاتی متناسب با کسب‌وکار شما',
      points: ['سناریو و کپی‌رایتینگ', 'تحویل مرحله‌ای'],
    },
    {
      to: '/asiatech', icon: Wifi, title: 'اینترنت آسیاتک',
      desc: 'ثبت‌نام و تمدید سرویس ADSL و VDSL با پشتیبانی محلی',
      points: ['ثبت سریع', 'پیگیری تا نصب'],
    },
  ];

  const reasons = [
    { icon: ShieldCheck, title: 'ضمانت و اصالت', desc: 'همهٔ کالاها با ضمانت و فاکتور رسمی تحویل داده می‌شوند.' },
    { icon: Clock4, title: 'تحویل به‌موقع', desc: 'سفارش‌های کافی‌نت در همان مراجعه و سفارش‌های ویژه در زمان اعلامی انجام می‌شود.' },
    { icon: CreditCard, title: 'پرداخت امن', desc: 'پرداخت آنلاین از طریق درگاه بانکی و ثبت خودکار فاکتور.' },
    { icon: Headphones, title: 'پشتیبانی واقعی', desc: 'پاسخ‌گویی تلفنی و پیام‌رسان‌ها در ساعات کاری، توسط تیم خودمان.' },
  ];

  return (
    <div className="fade-in">
      <Seo
        title="کافی نت همیار | خدمات دیجیتال، فروشگاه، کپی مدیا و طراحی سایت"
        description="کافی نت همیار: خدمات کافی‌نت، فروش محصولات دیجیتال، کپی مدیا، طراحی سایت، تولید محتوا و پشتیبانی آنلاین."
        path="/"
        type="website"
        keywords={['کافی نت همیار', 'خدمات کافی نت', 'طراحی سایت', 'کپی مدیا', 'فروشگاه دیجیتال', 'تولید محتوا']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'کافی نت همیار',
          url: window.location.origin,
          inLanguage: 'fa-IR',
        }}
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-[#0b1533]">
        <div
          className="absolute inset-0 opacity-90"
          style={{ backgroundImage: 'url(/hero-pattern.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0b1533]/40 via-[#0b1533]/70 to-[#0b1533]" />

        <div className="container-page relative py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs backdrop-blur border border-white/15">
              <Sparkles size={14} /> بیش از یک دهه تجربه در خدمات دیجیتال
            </span>

            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.35]">
              خدمات دیجیتال، فروشگاه و طراحی سایت
              <span className="block text-sky-300 mt-2">همه در یک جا</span>
            </h1>

            <p className="mt-5 text-sm md:text-base leading-8 text-slate-300 max-w-xl">
              از پرینت و اسکن روزمره تا خرید کالای دیجیتال، کپی فیلم و سریال، طراحی وب‌سایت و
              تولید محتوا؛ با فاکتور رسمی، پرداخت آنلاین و پشتیبانی واقعی.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/40"
              >
                مشاهدهٔ خدمات <ArrowLeft size={16} />
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/20 hover:bg-white/15 backdrop-blur transition-colors"
              >
                فروشگاه آنلاین <ShoppingBag size={16} />
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300">
              {['فاکتور رسمی', 'پرداخت آنلاین امن', 'پشتیبانی تلفنی'].map(item => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Brand visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-gradient-to-br from-sky-500/20 to-fuchsia-500/10 blur-2xl rounded-full" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { icon: Monitor, title: 'خدمات کافی‌نت', sub: 'همان روز' },
                { icon: Globe, title: 'طراحی سایت', sub: 'سئوشده' },
                { icon: ShoppingBag, title: 'فروشگاه', sub: 'ارسال سراسری' },
                { icon: Bot, title: 'تولید محتوا', sub: 'تیم اختصاصی' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-5 ${i % 2 ? 'translate-y-6' : ''}`}
                  >
                    <Icon size={22} className="text-sky-300 mb-3" />
                    <div className="text-white font-bold text-sm">{card.title}</div>
                    <div className="text-slate-300 text-xs mt-1">{card.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className={`border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
        <div className="container-page py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-start">
              <div className="text-2xl md:text-3xl font-black text-blue-600 tabular-nums leading-none">{s.value}</div>
              <div className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="section reveal">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-black">خدمات ما</h2>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                هرچه برای کارهای دیجیتال خود لازم دارید، در یک مجموعه
              </p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              همهٔ خدمات <ArrowLeft size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`group flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-600' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{s.title}</h3>
                  <p className={`text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.desc}</p>
                  <ul className={`mt-4 space-y-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {s.points.map(p => (
                      <li key={p} className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                    مشاهده و سفارش <ArrowLeft size={13} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Why us ---------------- */}
      <section className="section section-alt reveal">
        <div className="container-page">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-3">چرا کافی نت همیار؟</h2>
          <p className={`text-center text-sm mb-10 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            چیزی که ما را متفاوت می‌کند، شفافیت و پیگیری تا پایان کار است
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {reasons.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.title} className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <Icon size={26} className="text-blue-600 mb-4" />
                  <h3 className="font-bold text-sm mb-2">{r.title}</h3>
                  <p className={`text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Latest news ---------------- */}
      {publishedNews.length > 0 && (
        <section className="section reveal">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
                <Newspaper size={24} className="text-blue-600" /> آخرین اخبار
              </h2>
              <Link to="/news" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                همهٔ اخبار <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {publishedNews.slice(0, 3).map(item => (
                <Link
                  key={item.id}
                  to={`/news/${item.slug || item.id}`}
                  className={`group rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.coverAlt || item.title} loading="lazy" className="w-full h-40 object-cover" />
                  ) : (
                    <BrandVisual seed={item.title} icon={Newspaper} className="w-full h-40" />
                  )}
                  <div className="p-4">
                    <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.category || 'اخبار'} · {toJalaliString(item.publishedAt || item.date)}
                    </span>
                    <h3 className="font-bold text-sm leading-6 mt-1 line-clamp-2 group-hover:text-blue-600">{item.title}</h3>
                    <p className={`text-xs leading-6 mt-2 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.excerpt || item.caption}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- CTA ---------------- */}
      <section className="section-tight reveal">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-700 to-indigo-800 p-8 md:p-12">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/hero-pattern.svg)', backgroundSize: 'cover' }} />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">سفارش خود را همین امروز ثبت کنید</h2>
                <p className="text-sm text-blue-100 mt-2 leading-7">
                  برای مشاورهٔ رایگان یا ثبت سفارش، با ما تماس بگیرید یا از طریق پیام‌رسان‌ها در ارتباط باشید.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 text-sm font-bold hover:bg-blue-50">
                  تماس با ما <Headphones size={16} />
                </Link>
                <Link to="/track" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/25 hover:bg-white/20">
                  پیگیری سفارش <Server size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
