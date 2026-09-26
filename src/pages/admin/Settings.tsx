import React, { useState, useEffect } from 'react';
import { useApp, NewsItem, PortfolioItem } from '../../store';
import { Plus, X, Upload, Edit, Trash2, FileImage, Video, Image } from 'lucide-react';
import { formatJalali, toJalaliString } from '../../utils/jalali';

interface Banner {
  page: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function AdminSettings() {
  const { darkMode, news, setNews, portfolio, setPortfolio, aboutContent, setAboutContent } = useApp();
  const [tab, setTab] = useState<'news' | 'portfolio' | 'about' | 'general' | 'banners'>('general');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [editPortfolioId, setEditPortfolioId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({ title: '', image: '', caption: '', content: '', date: '', active: true });
  const [portfolioForm, setPortfolioForm] = useState<Partial<PortfolioItem>>({ title: '', description: '', image: '', link: '', type: 'فروشگاهی', technologies: [] });
  
  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('hamyar_banners');
    return saved ? JSON.parse(saved) : [
      { page: 'home', title: 'کافی نت همیار', description: 'مرکز خدمات و فروش دیجیتال', imageUrl: '' },
      { page: 'services', title: 'خدمات کافی‌نت همیار', description: 'لیست کامل خدمات و تعرفه‌ها', imageUrl: '' },
      { page: 'media', title: 'کالکشن فیلم و سریال', description: 'مجموعه‌ای کامل از فیلم، سریال، انیمیشن و انیمه با بهترین کیفیت', imageUrl: '' },
      { page: 'store', title: 'فروشگاه محصولات دیجیتال', description: 'فلش مموری، هارد، کابل، شارژر، دوربین مداربسته و لوازم جانبی', imageUrl: '' },
      { page: 'webdesign', title: 'طراحی وب‌سایت حرفه‌ای', description: 'طراحی سایت با جدیدترین تکنولوژی‌ها و بهترین کیفیت', imageUrl: '' },
      { page: 'news', title: 'اخبار کافی نت همیار', description: 'آخرین اخبار، تخفیف‌ها و اطلاعیه‌ها', imageUrl: '' },
      { page: 'about', title: 'درباره کافی نت همیار', description: 'مرکز خدمات و فروش دیجیتال', imageUrl: '' },
      { page: 'contact', title: 'تماس با ما', description: 'ما آماده پاسخگویی به شما هستیم', imageUrl: '' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('hamyar_banners', JSON.stringify(banners));
  }, [banners]);

  const tabs = [
    { id: 'general', label: 'عمومی' },
    { id: 'banners', label: 'بنرها' },
    { id: 'news', label: 'اخبار' },
    { id: 'portfolio', label: 'نمونه‌کارها' },
    { id: 'about', label: 'درباره ما' },
  ];

  const pageLabels: Record<string, string> = {
    home: 'صفحه اصلی',
    services: 'خدمات کافی‌نت',
    media: 'کالکشن فیلم و سریال',
    store: 'فروشگاه',
    webdesign: 'طراحی سایت',
    news: 'اخبار',
    about: 'درباره ما',
    contact: 'تماس با ما',
  };

  // News handlers
  const saveNews = () => {
    if (editNewsId) {
      setNews(news.map(n => n.id === editNewsId ? { ...n, ...newsForm } as NewsItem : n));
    } else {
      setNews([...news, { ...newsForm, id: 'n' + Date.now(), date: formatJalali(new Date()) } as NewsItem]);
    }
    setShowNewsForm(false);
    setNewsForm({ title: '', image: '', caption: '', content: '', date: '', active: true });
    setEditNewsId(null);
  };

  // Portfolio handlers
  const savePortfolio = () => {
    if (editPortfolioId) {
      setPortfolio(portfolio.map(p => p.id === editPortfolioId ? { ...p, ...portfolioForm } as PortfolioItem : p));
    } else {
      setPortfolio([...portfolio, { ...portfolioForm, id: 'pf' + Date.now() } as PortfolioItem]);
    }
    setShowPortfolioForm(false);
    setPortfolioForm({ title: '', description: '', image: '', link: '', type: 'فروشگاهی', technologies: [] });
    setEditPortfolioId(null);
  };

  const handleImageUpload = (callback: (url: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => callback(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAboutContent({ ...aboutContent, trustVideo: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <h1 className="text-2xl font-bold">تنظیمات</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-blue-600 text-white' : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {tab === 'general' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">تنظیمات عمومی</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">نام کسب‌وکار</label>
              <input type="text" defaultValue="کافی نت همیار" className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">شماره تماس اصلی</label>
              <input type="text" defaultValue="09913911880" className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">آدرس</label>
              <textarea defaultValue="" rows={2} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <button className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">ذخیره تنظیمات</button>
          </div>
        </div>
      )}

      {/* News Management */}
      {tab === 'news' && (
        <div className="space-y-4">
          <button onClick={() => { setNewsForm({ title: '', image: '', caption: '', content: '', date: '', active: true }); setEditNewsId(null); setShowNewsForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> خبر جدید
          </button>
          <div className="space-y-3">
            {news.map(n => (
              <div key={n.id} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-600 overflow-hidden">
                    {n.image && <img src={n.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{n.title}</h4>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{toJalaliString(n.date)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setNewsForm(n); setEditNewsId(n.id); setShowNewsForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
                  <button onClick={() => setNews(news.filter(x => x.id !== n.id))} className="text-red-500 text-xs">حذف</button>
                </div>
              </div>
            ))}
          </div>

          {showNewsForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewsForm(false)}>
              <div className={`w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{editNewsId ? 'ویرایش خبر' : 'خبر جدید'}</h3>
                  <button onClick={() => setShowNewsForm(false)}><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="عنوان خبر" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <input type="text" placeholder="کپشن" value={newsForm.caption} onChange={e => setNewsForm({...newsForm, caption: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <textarea placeholder="متن کامل خبر" value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={5} />
                  <div>
                    <label className="text-sm mb-1 block">تصویر خبر</label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload size={16} /> انتخاب تصویر
                      <input type="file" accept="image/*" onChange={handleImageUpload((url) => setNewsForm({...newsForm, image: url}))} className="hidden" />
                    </label>
                    {newsForm.image && <img src={newsForm.image} alt="" className="mt-2 w-32 h-20 object-cover rounded" />}
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={newsForm.active} onChange={e => setNewsForm({...newsForm, active: e.target.checked})} />
                    <span className="text-sm">فعال (نمایش در سایت)</span>
                  </label>
                  <button onClick={saveNews} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portfolio Management */}
      {tab === 'portfolio' && (
        <div className="space-y-4">
          <button onClick={() => { setPortfolioForm({ title: '', description: '', image: '', link: '', type: 'فروشگاهی', technologies: [] }); setEditPortfolioId(null); setShowPortfolioForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> نمونه‌کار جدید
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map(p => (
              <div key={p.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-12 rounded bg-gray-200 dark:bg-slate-600 overflow-hidden">
                    {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{p.title}</h4>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.type}</span>
                  </div>
                </div>
                <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>
                {p.link && <p className="text-xs text-blue-600 truncate">{p.link}</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setPortfolioForm(p); setEditPortfolioId(p.id); setShowPortfolioForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
                  <button onClick={() => setPortfolio(portfolio.filter(x => x.id !== p.id))} className="text-red-500 text-xs">حذف</button>
                </div>
              </div>
            ))}
          </div>

          {showPortfolioForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPortfolioForm(false)}>
              <div className={`w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{editPortfolioId ? 'ویرایش نمونه‌کار' : 'نمونه‌کار جدید'}</h3>
                  <button onClick={() => setShowPortfolioForm(false)}><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="عنوان" value={portfolioForm.title} onChange={e => setPortfolioForm({...portfolioForm, title: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <select value={portfolioForm.type} onChange={e => setPortfolioForm({...portfolioForm, type: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option>فروشگاهی</option><option>شرکتی</option><option>شخصی</option>
                  </select>
                  <input type="text" placeholder="لینک نمونه‌کار" value={portfolioForm.link} onChange={e => setPortfolioForm({...portfolioForm, link: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <textarea placeholder="توضیحات کامل" value={portfolioForm.description} onChange={e => setPortfolioForm({...portfolioForm, description: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={4} />
                  <input type="text" placeholder="تکنولوژی‌ها (با کاما جدا کنید)" value={(portfolioForm.technologies || []).join(', ')}
                    onChange={e => setPortfolioForm({...portfolioForm, technologies: e.target.value.split(',').map(t => t.trim())})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <div>
                    <label className="text-sm mb-1 block">تصویر نمونه‌کار</label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload size={16} /> انتخاب تصویر
                      <input type="file" accept="image/*" onChange={handleImageUpload((url) => setPortfolioForm({...portfolioForm, image: url}))} className="hidden" />
                    </label>
                    {portfolioForm.image && <img src={portfolioForm.image} alt="" className="mt-2 w-32 h-20 object-cover rounded" />}
                  </div>
                  <button onClick={savePortfolio} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* About Us Management */}
      {tab === 'about' && (
        <div className={`p-6 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold">مدیریت محتوای درباره ما</h3>
          <div>
            <label className="text-sm font-medium block mb-1">توضیحات</label>
            <textarea value={aboutContent.description} onChange={e => setAboutContent({...aboutContent, description: e.target.value})} rows={4}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">مأموریت</label>
            <textarea value={aboutContent.mission} onChange={e => setAboutContent({...aboutContent, mission: e.target.value})} rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">چشم‌انداز</label>
            <textarea value={aboutContent.vision} onChange={e => setAboutContent({...aboutContent, vision: e.target.value})} rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>

          {/* License Upload */}
          <div>
            <label className="text-sm font-medium block mb-1">جواز کسب</label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              <FileImage size={16} /> آپلود تصویر جواز کسب
              <input type="file" accept="image/*" onChange={handleImageUpload((url) => setAboutContent({...aboutContent, licenseImage: url}))} className="hidden" />
            </label>
            {aboutContent.licenseImage && <img src={aboutContent.licenseImage} alt="جواز کسب" className="mt-2 w-40 h-28 object-cover rounded" />}
          </div>

          {/* Trust Images */}
          <div>
            <label className="text-sm font-medium block mb-1">تصاویر اعتمادسازی</label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              <FileImage size={16} /> افزودن تصویر
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setAboutContent({...aboutContent, trustImages: [...aboutContent.trustImages, ev.target?.result as string]});
                  reader.readAsDataURL(file);
                }
              }} className="hidden" />
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {aboutContent.trustImages.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-24 h-16 object-cover rounded" />
                  <button onClick={() => setAboutContent({...aboutContent, trustImages: aboutContent.trustImages.filter((_, idx) => idx !== i)})}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">x</button>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Video */}
          <div>
            <label className="text-sm font-medium block mb-1">ویدئو اعتمادسازی</label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              <Video size={16} /> آپلود ویدئو
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
            {aboutContent.trustVideo && <video src={aboutContent.trustVideo} controls className="mt-2 w-64 rounded" />}
          </div>

          <button onClick={() => setAboutContent({...aboutContent})} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            ذخیره تغییرات
          </button>
        </div>
      )}

      {/* Banners Management */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Image size={20} className="text-blue-600" />
              مدیریت بنرهای صفحات
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              در این بخش می‌توانید بنر هر صفحه را تغییر دهید یا تصویر جدید از هارد آپلود کنید.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner, idx) => (
                <div key={banner.page} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-base">{pageLabels[banner.page]}</h4>
                  </div>
                  
                  {/* Preview */}
                  <div className={`mb-3 rounded-lg overflow-hidden border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover" />
                    ) : (
                      <div className={`w-full h-32 flex items-center justify-center ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                        <Image size={32} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="mb-2">
                    <label className="text-xs font-medium block mb-1">عنوان بنر</label>
                    <input 
                      type="text" 
                      value={banner.title}
                      onChange={e => {
                        const updated = [...banners];
                        updated[idx] = { ...banner, title: e.target.value };
                        setBanners(updated);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="text-xs font-medium block mb-1">توضیحات</label>
                    <input 
                      type="text" 
                      value={banner.description}
                      onChange={e => {
                        const updated = [...banners];
                        updated[idx] = { ...banner, description: e.target.value };
                        setBanners(updated);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                      darkMode ? 'border-slate-600 hover:bg-slate-600' : 'border-gray-300 hover:bg-gray-100'
                    }`}>
                      <Upload size={16} />
                      آپلود تصویر
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const updated = [...banners];
                              updated[idx] = { ...banner, imageUrl: ev.target?.result as string };
                              setBanners(updated);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {banner.imageUrl && (
                      <button 
                        onClick={() => {
                          const updated = [...banners];
                          updated[idx] = { ...banner, imageUrl: '' };
                          setBanners(updated);
                        }}
                        className="px-4 py-2 rounded-lg border border-red-500 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        حذف تصویر
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                💡 <strong>نکته:</strong> تغییرات به صورت خودکار ذخیره می‌شوند و در سایت عمومی نمایش داده خواهند شد.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
