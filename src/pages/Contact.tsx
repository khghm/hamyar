import React from 'react';
import { useApp } from '../store';
import { Phone, MapPin, Clock, Mail, MessageCircle, MessagesSquare, MessageSquare, Send, Instagram, Share2 } from 'lucide-react';
import { useBanner } from '../hooks/useBanner';
import { track } from '../utils/analytics';

/**
 * صفحهٔ «تماس با ما».
 *
 * همهٔ اطلاعات تماس و شبکه‌های اجتماعی از «تنظیمات → درباره ما» خوانده می‌شوند؛
 * قبلاً مقادیر این صفحه هاردکد بود و آپلود لوگو/تغییر شماره در پنل هیچ اثری روی
 * آن نداشت.
 */
export default function Contact() {
  const { darkMode, aboutContent } = useApp();
  const banner = useBanner('contact');

  const phone = (aboutContent.phone || '').trim() || '02136432665';
  const mobile = (aboutContent.mobile || '').trim() || '09913911880';
  const extraPhones = (aboutContent.extraPhones || []).map(p => String(p || '').trim()).filter(Boolean);
  const address = (aboutContent.address || '').trim() || 'تهران';
  const email = (aboutContent.email || '').trim();

  const tel = (value: string) => `tel:${value.replace(/[^\d+]/g, '')}`;

  const contactInfo: { icon: typeof Phone; title: string; value: string; link?: string; dir?: string }[] = [
    { icon: Phone, title: 'تلفن ثابت', value: phone, link: tel(phone), dir: 'ltr' },
    { icon: Phone, title: 'موبایل', value: mobile, link: tel(mobile), dir: 'ltr' },
    ...extraPhones.map((p, i) => ({
      icon: Phone,
      title: `موبایل ${i + 2}`,
      value: p,
      link: tel(p),
      dir: 'ltr' as const,
    })),
    ...(email ? [{ icon: Mail, title: 'ایمیل', value: email, link: `mailto:${email}`, dir: 'ltr' as const }] : []),
    { icon: MapPin, title: 'آدرس', value: address },
  ];

  const configuredSocials = (aboutContent.socialMedia || []).filter(s => s.url);
  const socialChannels = configuredSocials.length > 0
    ? configuredSocials
    : [
        { id: 'd1', name: 'ایتا', handle: '@hamyar_service1', url: 'https://eitaa.com/@hamyar_service1', icon: '' },
        { id: 'd2', name: 'روبیکا', handle: '@hamyar_service1', url: 'https://rubika.ir/hamyar_service1', icon: '' },
        { id: 'd3', name: 'بله', handle: '@hamyar_service1', url: 'https://ble.ir/hamyar_service1', icon: '' },
        { id: 'd4', name: 'تلگرام', handle: '@hamyar_service1', url: 'https://t.me/hamyar_service1', icon: '' },
        { id: 'd5', name: 'اینستاگرام', handle: '@hamyar_service1', url: 'https://instagram.com/hamyar_service1', icon: '' },
      ];

  const iconFor = (name: string) => {
    if (name.includes('ایتا')) return MessageCircle;
    if (name.includes('روبیکا')) return MessagesSquare;
    if (name.includes('بله')) return MessageSquare;
    if (name.includes('تلگرام')) return Send;
    if (name.includes('اینستاگرام')) return Instagram;
    return Share2;
  };
  const colorFor = (name: string) => {
    if (name.includes('ایتا')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
    if (name.includes('روبیکا')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
    if (name.includes('بله')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
    if (name.includes('تلگرام')) return 'bg-sky-100 dark:bg-sky-900/30 text-sky-600';
    if (name.includes('اینستاگرام')) return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600';
  };

  const supportNumbers = [phone, mobile, ...extraPhones].filter(Boolean).join(' و ');
  const supportNetworks = socialChannels.map(s => s.name).filter(Boolean).join('، ');

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {banner?.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="https://image.qwenlm.ai/generated-images/fee27274-9d94-4aad-8962-1cc1496347b3/_result.png"
            alt="تماس با ما"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
            {banner?.title || 'تماس با ما'}
          </h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">
            {banner?.description || 'ما آماده پاسخگویی به شما هستیم'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold mb-6">اطلاعات تماس</h2>
          <div className="space-y-4">
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.title}</p>
                    <p className="font-bold text-sm sm:text-base break-words" dir={item.dir as 'ltr' | 'rtl' | undefined}>{item.value}</p>
                  </div>
                </>
              );
              const cls = `flex items-center gap-4 p-4 rounded-xl transition-all ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`;
              return item.link ? (
                <a key={i} href={item.link} onClick={() => track('contact_link', { label: item.title })} className={cls}>
                  {content}
                </a>
              ) : (
                <div key={i} className={cls}>{content}</div>
              );
            })}
          </div>

          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock size={18} className="text-blue-600" />
              <span className="font-bold text-sm">ساعات کاری</span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>شنبه تا پنج‌شنبه: ۹ صبح تا ۹ شب</p>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>جمعه: ۱۰ صبح تا ۲ بعدازظهر</p>
          </div>
        </div>

        {/* Social Media — از تنظیمات «درباره ما» */}
        <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold mb-6">شبکه‌های اجتماعی</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            پشتیبانی ما در همهٔ پیام‌رسان‌ها با شماره‌های {supportNumbers} فعال است.
          </p>
          <div className="space-y-3">
            {socialChannels.map((ch, i) => {
              const SocialIcon = iconFor(ch.name);
              return (
                <a key={ch.id || i} href={ch.url} onClick={() => track('social_icon', { network: ch.name })} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${ch.icon ? '' : colorFor(ch.name)}`}>
                      {ch.icon ? (
                        <img src={ch.icon} alt={ch.name} className="w-full h-full object-contain" />
                      ) : (
                        <SocialIcon size={20} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{ch.name}</p>
                      {ch.handle ? (
                        <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ch.handle}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>مشاهده</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Support Notice */}
      <div className={`mt-8 p-6 rounded-2xl border text-center ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className="font-bold text-lg mb-2">پشتیبانی آنلاین</h3>
        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          پشتیبانی ما با شماره‌های {supportNumbers} در پیام‌رسان‌ها ({supportNetworks}) فعال است.
        </p>
      </div>
      </div>
    </div>
  );
}
