import React from 'react';
import { useApp } from '../store';
import { Award, Target, Eye, Users } from 'lucide-react';

export default function About() {
  const { darkMode, aboutContent } = useApp();

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src="https://image.qwenlm.ai/generated-images/62908c70-02c9-4588-8706-7c7cadc5777e/_result.png" 
          alt="درباره کافی نت همیار" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">درباره کافی نت همیار</h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">مرکز خدمات و فروش دیجیتال</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

      {/* Description */}
      <div className={`max-w-4xl mx-auto p-8 rounded-2xl border mb-12 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <p className={`text-lg leading-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {aboutContent.description}
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-lg">مأموریت ما</h3>
          </div>
          <p className={`leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{aboutContent.mission}</p>
        </div>
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Eye size={20} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-lg">چشم‌انداز ما</h3>
          </div>
          <p className={`leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{aboutContent.vision}</p>
        </div>
      </div>

      {/* Services Summary */}
      <div className={`p-8 rounded-2xl border mb-12 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h2 className="text-2xl font-bold text-center mb-8">حوزه‌های فعالیت</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'خدمات کافی‌نت', desc: 'پرینت، اسکن، تایپ، ترجمه، ثبت‌نام اینترنتی، طراحی رزومه و سایر خدمات اداری' },
            { title: 'کپی مدیا', desc: 'کپی فیلم، سریال، انیمیشن و انیمه روی فلش و هارد شخصی مشتری' },
            { title: 'فروش محصولات دیجیتال', desc: 'فروش فلش مموری، هارد، کابل، شارژر، دوربین مداربسته، دستگاه پوز و لوازم جانبی' },
            { title: 'طراحی وب‌سایت', desc: 'طراحی سایت فروشگاهی، شرکتی و شخصی با جدیدترین تکنولوژی‌ها' },
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <h4 className="font-bold mb-2">{item.title}</h4>
              <p className={`text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      {(aboutContent.trustImages.length > 0 || aboutContent.licenseImage) && (
        <div className={`p-8 rounded-2xl border mb-12 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-2xl font-bold text-center mb-8">مجوزها و اعتماد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aboutContent.licenseImage && (
              <div className="text-center">
                <h4 className="font-bold mb-3">جواز کسب</h4>
                <img src={aboutContent.licenseImage} alt="جواز کسب" className="mx-auto rounded-xl max-h-64" />
              </div>
            )}
            {aboutContent.trustImages.map((img, i) => (
              <div key={i} className="text-center">
                <img src={img} alt={`تصویر اعتماد ${i + 1}`} className="mx-auto rounded-xl max-h-64" />
              </div>
            ))}
          </div>
          {aboutContent.trustVideo && (
            <div className="mt-6 text-center">
              <video controls className="mx-auto rounded-xl max-w-full max-h-96">
                <source src={aboutContent.trustVideo} type="video/mp4" />
              </video>
            </div>
          )}
        </div>
      )}

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Award, title: 'کیفیت', desc: 'ارائه خدمات با بالاترین استانداردهای کیفی' },
          { icon: Users, title: 'مشتری‌مداری', desc: 'رضایت مشتری اولویت اصلی ماست' },
          { icon: Target, title: 'تعهد', desc: 'تعهد به انجام به‌موقع و دقیق سفارشات' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`p-6 rounded-xl text-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Icon size={32} className="mx-auto mb-3 text-blue-600" />
              <h4 className="font-bold mb-2">{item.title}</h4>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
