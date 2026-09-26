import React, { useState } from 'react';
import { useApp } from '../../store';
import { BookOpen, Video, FileText, ExternalLink, Search, GraduationCap, Briefcase, Globe, CreditCard, Shield, Newspaper } from 'lucide-react';

export default function AdminTraining() {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('panel');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'panel', label: 'آموزش پنل مدیریت', icon: Shield },
    { id: 'services', label: 'آموزش خدمات کافی‌نت', icon: Briefcase },
    { id: 'resources', label: 'منابع و سایت‌های مفید', icon: Globe },
  ];

  // آموزش‌های پنل مدیریت
  const panelTutorials = [
    {
      title: 'آشنایی با داشبورد',
      description: 'داشبورد مرکز کنترل اصلی سیستم است. در این بخش می‌توانید آمار کلی کسب‌وکار، سفارش‌های باز، هشدارها و دسترسی سریع به بخش‌های مختلف را مشاهده کنید.',
      topics: ['نمایش آمار درآمد و هزینه', 'مشاهده سفارش‌های باز', 'هشدارهای سیستم', 'دسترسی سریع به بخش‌ها']
    },
    {
      title: 'مدیریت سفارش‌ها',
      description: 'در این بخش می‌توانید تمام سفارش‌های مشتریان را مدیریت کنید. هر سفارش شامل کد رهگیری، وضعیت، اولویت و اطلاعات مشتری است.',
      topics: ['ثبت سفارش جدید', 'تغییر وضعیت سفارش', 'مشاهده جزئیات سفارش', 'فیلتر و جستجوی سفارش‌ها']
    },
    {
      title: 'مدیریت محصولات و انبار',
      description: 'مدیریت کامل محصولات شامل افزودن، ویرایش، حذف و مشاهده موجودی انبار. همچنین می‌توانید هشدار موجودی کم را فعال کنید.',
      topics: ['افزودن محصول جدید', 'ویرایش اطلاعات محصول', 'مدیریت موجودی', 'آپلود تصویر محصول']
    },
    {
      title: 'مدیریت مشتریان (CRM)',
      description: 'سیستم مدیریت ارتباط با مشتری شامل مشاهده اطلاعات مشتریان، تاریخچه خرید، امتیاز وفاداری و کد دعوت.',
      topics: ['مشاهده پروفایل مشتری', 'تاریخچه سفارشات', 'مدیریت کدهای دعوت', 'سطح‌بندی مشتریان']
    },
    {
      title: 'مدیریت کالکشن مدیا',
      description: 'مدیریت فیلم‌ها، سریال‌ها، انیمیشن‌ها و انیمه‌ها. امکان افزودن، ویرایش و حذف عناوین با اطلاعات کامل.',
      topics: ['افزودن عنوان جدید', 'ویرایش اطلاعات', 'آپلود پوستر', 'مدیریت ژانرها']
    },
    {
      title: 'مدیریت خدمات کافی‌نت',
      description: 'مدیریت لیست خدمات و تعرفه‌ها. امکان افزودن، ویرایش، حذف و فعال/غیرفعال کردن خدمات.',
      topics: ['افزودن خدمت جدید', 'تعیین قیمت پایه', 'فعال/غیرفعال کردن', 'دسته‌بندی خدمات']
    },
    {
      title: 'حسابداری و مالی',
      description: 'مدیریت کامل مالی شامل ثبت درآمد و هزینه، مشاهده سود خالص، گزارش‌های ماهانه و خروجی CSV.',
      topics: ['ثبت هزینه جدید', 'مشاهده درآمد به تفکیک جریان', 'گزارش ماهانه', 'خروجی CSV']
    },
    {
      title: 'تیم تولید محتوا',
      description: 'مدیریت کامل پروژه‌های تولید محتوا شامل سناریو، تجهیزات، برنامه‌ریزی، مسئولیت‌ها و تایم‌بندی.',
      topics: ['ایجاد پروژه جدید', 'تقویم محتوایی', 'مدیریت قالب‌ها', 'سیستم ایده‌پردازی']
    },
    {
      title: 'کنترل دسترسی (RBAC)',
      description: 'مدیریت نقش‌ها و دسترسی‌های کاربران سیستم. امکان تعریف نقش‌های سفارشی با دسترسی‌های خاص.',
      topics: ['ایجاد نقش جدید', 'تعیین دسترسی‌ها', 'مدیریت کاربران سیستم', 'نقش‌های پیش‌فرض']
    },
    {
      title: 'تنظیمات سایت',
      description: 'مدیریت تنظیمات عمومی سایت، اخبار، نمونه‌کارها و محتوای صفحه درباره ما.',
      topics: ['مدیریت اخبار', 'مدیریت نمونه‌کارها', 'ویرایش درباره ما', 'تنظیمات عمومی']
    },
  ];

  // آموزش‌های خدمات کافی‌نت
  const servicesTutorials = [
    {
      title: 'خدمات پرینت و اسکن',
      description: 'آموزش کامل خدمات پرینت و اسکن شامل تنظیمات کیفیت، انواع کاغذ و قیمت‌گذاری.',
      topics: ['پرینت سیاه و سفید', 'پرینت رنگی', 'اسکن با کیفیت بالا', 'تنظیمات DPI']
    },
    {
      title: 'خدمات تایپ و صفحه‌آرایی',
      description: 'آموزش تایپ حرفه‌ای متون فارسی و انگلیسی، صفحه‌آرایی پایان‌نامه و مقالات.',
      topics: ['تایپ فارسی', 'تایپ انگلیسی', 'صفحه‌آرایی پایان‌نامه', 'فرمت‌بندی مقالات']
    },
    {
      title: 'خدمات ترجمه',
      description: 'آموزش ترجمه رسمی و غیررسمی اسناد و متون در حوزه‌های مختلف.',
      topics: ['ترجمه رسمی با مهر', 'ترجمه غیررسمی', 'ترجمه فوری', 'ترجمه تخصصی']
    },
    {
      title: 'ثبت‌نام‌های آنلاین',
      description: 'آموزش ثبت‌نام در سایت‌های دولتی، دانشگاهی و آزمون‌های سراسری.',
      topics: ['ثبت‌نام کنکور', 'ثبت‌نام آزمون سراسری', 'ثبت‌نام مدارس', 'ثبت‌نام یارانه']
    },
    {
      title: 'خدمات بیمه',
      description: 'آموزش صدور انواع بیمه‌نامه شامل شخص ثالث، بدنه، عمر و مسافرتی.',
      topics: ['بیمه شخص ثالث', 'بیمه بدنه', 'بیمه عمر', 'بیمه مسافرتی']
    },
    {
      title: 'خدمات مالیاتی',
      description: 'آموزش تشکیل پرونده مالیاتی، تنظیم و ارسال اظهارنامه و پیگیری امور مالیاتی.',
      topics: ['تشکیل پرونده', 'اظهارنامه مالیاتی', 'ارزش افزوده', 'پیگیری']
    },
    {
      title: 'خدمات قوه قضاییه',
      description: 'آموزش ثبت‌نام و احراز هویت در سامانه ثنا و دریافت گواهی‌های مختلف.',
      topics: ['ثبت‌نام ثنا', 'گواهی عدم سوءپیشینه', 'گواهی حصر وراثت', 'وکالت‌نامه']
    },
    {
      title: 'خدمات پلیس +۱۰',
      description: 'آموزش خدمات گذرنامه، گواهینامه و کارت پایان خدمت.',
      topics: ['تمدید گذرنامه', 'گواهینامه', 'کارت پایان خدمت', 'پیگیری']
    },
  ];

  // منابع و سایت‌های مفید
  const resources = [
    {
      category: 'سایت‌های اداری و دولتی',
      icon: Shield,
      color: 'blue',
      sites: [
        { name: 'سامانه ثنا (قوه قضاییه)', url: 'https://adliran.ir', description: 'ثبت‌نام و احراز هویت در سامانه ثنا' },
        { name: 'سامانه ثبت‌نام کنکور', url: 'https://sanjesh.org', description: 'ثبت‌نام آزمون‌های سراسری' },
        { name: 'سامانه پلیس +۱۰', url: 'https://police10.ir', description: 'خدمات گذرنامه و گواهینامه' },
        { name: 'سامانه نظام وظیفه', url: 'https://vazifeh.police.ir', description: 'خدمات نظام وظیفه عمومی' },
        { name: 'سامانه مالیاتی', url: 'https://tax.gov.ir', description: 'امور مالیاتی و اظهارنامه' },
        { name: 'سامانه ثبت احوال', url: 'https://sabteaham.ir', description: 'خدمات ثبت احوال' },
        { name: 'سامانه سهام عدالت', url: 'https://sahamedalat.ir', description: 'مدیریت سهام عدالت' },
        { name: 'سامانه یارانه', url: 'https://yaraneh.gov.ir', description: 'ثبت‌نام و ویرایش یارانه' },
      ]
    },
    {
      category: 'سایت‌های آموزشی و دانشگاهی',
      icon: GraduationCap,
      color: 'green',
      sites: [
        { name: 'سامانه آموزش عالی', url: 'https://sanjesh.org', description: 'ثبت‌نام و انتخاب رشته دانشگاه' },
        { name: 'سامانه دانشگاه آزاد', url: 'https://azmoon.org', description: 'ثبت‌نام دانشگاه آزاد' },
        { name: 'سامانه مدارس', url: 'https://my.medu.ir', description: 'ثبت‌نام آنلاین مدارس' },
        { name: 'سامانه حج و زیارت', url: 'https://haj.ir', description: 'ثبت‌نام کاروان‌های حج' },
        { name: 'فرادرس', url: 'https://faradars.org', description: 'آموزش‌های آنلاین' },
        { name: 'مکتب‌خونه', url: 'https://maktabkhooneh.org', description: 'دوره‌های دانشگاهی آنلاین' },
      ]
    },
    {
      category: 'سایت‌های بیمه و مالی',
      icon: CreditCard,
      color: 'purple',
      sites: [
        { name: 'بیمه ایران', url: 'https://iraninsurance.ir', description: 'صدور بیمه‌نامه آنلاین' },
        { name: 'بیمه آسیا', url: 'https://asiainsurance.ir', description: 'خدمات بیمه‌ای' },
        { name: 'بیمه دانا', url: 'https://dana.ir', description: 'صدور بیمه‌نامه' },
        { name: 'بیمه پاسارگاد', url: 'https://bpi.ir', description: 'خدمات بیمه عمر و زندگی' },
        { name: 'سامانه شاپرک', url: 'https://shaparak.ir', description: 'اطلاعات دستگاه‌های پوز' },
        { name: 'بانک مرکزی', url: 'https://cbi.ir', description: 'اطلاعات بانکی' },
      ]
    },
    {
      category: 'سایت‌های خبری و اطلاع‌رسانی',
      icon: Newspaper,
      color: 'orange',
      sites: [
        { name: 'ایسنا', url: 'https://isna.ir', description: 'خبرگزاری دانشجویان' },
        { name: 'تسنیم', url: 'https://tasnimnews.com', description: 'خبرگزاری تسنیم' },
        { name: 'فارس', url: 'https://farsnews.ir', description: 'خبرگزاری فارس' },
        { name: 'مهر', url: 'https://mehrnews.com', description: 'خبرگزاری مهر' },
        { name: 'ایرنا', url: 'https://irna.ir', description: 'خبرگزاری جمهوری اسلامی' },
      ]
    },
    {
      category: 'سایت‌های خدماتی',
      icon: Briefcase,
      color: 'cyan',
      sites: [
        { name: 'سامانه کارت سوخت', url: 'https://niopdc.ir', description: 'درخواست کارت سوخت المثنی' },
        { name: 'سامانه قبضینو', url: 'https://ghabzino.com', description: 'پرداخت قبوض' },
        { name: 'آپارات', url: 'https://aparat.com', description: 'سرویس اشتراک ویدئو' },
        { name: 'دیجی‌کالا', url: 'https://digikala.com', description: 'فروشگاه آنلاین (برای مقایسه قیمت)' },
        { name: 'ترب', url: 'https://torob.com', description: 'مقایسه قیمت محصولات' },
      ]
    },
    {
      category: 'سایت‌های آموزشی تخصصی',
      icon: BookOpen,
      color: 'pink',
      sites: [
        { name: 'آموزش Word', url: 'https://faradars.org/courses/word', description: 'آموزش مایکروسافت ورد' },
        { name: 'آموزش Excel', url: 'https://faradars.org/courses/excel', description: 'آموزش مایکروسافت اکسل' },
        { name: 'آموزش PowerPoint', url: 'https://faradars.org/courses/powerpoint', description: 'آموزش پاورپوینت' },
        { name: 'آموزش فتوشاپ', url: 'https://faradars.org/courses/photoshop', description: 'آموزش ادوبی فتوشاپ' },
        { name: 'آموزش طراحی سایت', url: 'https://maktabkhooneh.org', description: 'دوره‌های طراحی وب' },
      ]
    },
  ];

  const filteredResources = resources.map(cat => ({
    ...cat,
    sites: cat.sites.filter(s => 
      s.name.includes(search) || s.description.includes(search)
    )
  })).filter(cat => cat.sites.length > 0);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={28} className="text-blue-600" />
          آموزش ادمین
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel Tutorials */}
      {activeTab === 'panel' && (
        <div className="space-y-4">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            آموزش کامل بخش‌های مختلف پنل مدیریت برای استفاده بهینه از سیستم
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {panelTutorials.map((tutorial, i) => (
              <div key={i} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{tutorial.title}</h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{tutorial.description}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سرفصل‌ها:</p>
                  <ul className="space-y-1">
                    {tutorial.topics.map((topic, j) => (
                      <li key={j} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Tutorials */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            آموزش کامل خدمات کافی‌نت برای ارائه بهتر به مشتریان
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicesTutorials.map((tutorial, i) => (
              <div key={i} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{tutorial.title}</h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{tutorial.description}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سرفصل‌ها:</p>
                  <ul className="space-y-1">
                    {tutorial.topics.map((topic, j) => (
                      <li key={j} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در سایت‌ها..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-gray-200 placeholder-gray-400'}`}
            />
          </div>

          {filteredResources.map((category, i) => {
            const Icon = category.icon;
            const colorClasses: Record<string, string> = {
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
              green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
              purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
              orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
              cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
              pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
            };
            return (
              <div key={i} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[category.color]}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-lg">{category.category}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.sites.map((site, j) => (
                    <a
                      key={j}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-lg border transition-all hover:shadow-md flex items-center justify-between group ${
                        darkMode ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm group-hover:text-blue-600">{site.name}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{site.description}</p>
                      </div>
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <Globe size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سایتی یافت نشد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
