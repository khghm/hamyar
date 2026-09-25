import React from 'react';
import { useApp } from '../store';
import { Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
  const { darkMode } = useApp();

  const contactInfo = [
    { icon: Phone, title: 'تلفن ثابت', value: '02136432665', link: 'tel:02136432665' },
    { icon: Phone, title: 'موبایل ۱', value: '09913911880', link: 'tel:09913911880' },
    { icon: Phone, title: 'موبایل ۲', value: '09204767001', link: 'tel:09204767001' },
  ];

  const socialChannels = [
    { name: 'ایتا', handle: '@hamyar_service1', link: 'https://eitaa.com/@hamyar_service1' },
    { name: 'روبیکا', handle: '@hamyar_service1', link: 'https://rubika.ir/hamyar_service1' },
    { name: 'بله', handle: '@hamyar_service1', link: 'https://ble.ir/hamyar_service1' },
    { name: 'تلگرام', handle: '@hamyar_service1', link: 'https://t.me/hamyar_service1' },
    { name: 'اینستاگرام', handle: '@hamyar_service1', link: 'https://instagram.com/hamyar_service1' },
  ];

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src="https://image.qwenlm.ai/generated-images/fee27274-9d94-4aad-8962-1cc1496347b3/_result.png" 
          alt="تماس با ما" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">تماس با ما</h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">ما آماده پاسخگویی به شما هستیم</p>
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
              return (
                <a key={i} href={item.link} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.title}</p>
                    <p className="font-bold text-lg">{item.value}</p>
                  </div>
                </a>
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

        {/* Social Media */}
        <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold mb-6">شبکه‌های اجتماعی</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            پشتیبانی ما در تمامی پیام‌رسان‌ها با شماره‌های موبایل فوق فعال است.
          </p>
          <div className="space-y-3">
            {socialChannels.map((ch, i) => {
              const getIcon = () => {
                switch(ch.name) {
                  case 'ایتا': return 'fa-telegram';
                  case 'روبیکا': return 'fa-instagram';
                  case 'بله': return 'fa-facebook';
                  case 'تلگرام': return 'fa-telegram';
                  case 'اینستاگرام': return 'fa-instagram';
                  default: return 'fa-share-alt';
                }
              };
              const getColor = () => {
                switch(ch.name) {
                  case 'ایتا': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
                  case 'روبیکا': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
                  case 'بله': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
                  case 'تلگرام': return 'bg-sky-100 dark:bg-sky-900/30 text-sky-600';
                  case 'اینستاگرام': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600';
                  default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600';
                }
              };
              return (
                <a key={i} href={ch.link} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColor()}`}>
                      <i className={`fa-brands ${getIcon()} text-xl`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{ch.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ch.handle}</p>
                    </div>
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>مشاهده</span>
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
          پشتیبانی ما با شماره‌های 09913911880 و 09204767001 در تمامی پیام‌رسان‌ها (ایتا، روبیکا، بله، تلگرام و اینستاگرام) فعال است.
        </p>
      </div>
      </div>
    </div>
  );
}
