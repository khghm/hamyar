import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Search, SlidersHorizontal, Clock, DollarSign, Filter } from 'lucide-react';

export default function Services() {
  const { darkMode, services } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.filter(s => s.active).map(s => s.category)));
    return ['all', ...cats.sort()];
  }, [services]);

  const filtered = useMemo(() => {
    let items = services.filter(s => {
      if (!s.active) return false;
      if (selectedCat !== 'all' && s.category !== selectedCat) return false;
      if (s.basePrice < priceRange[0] || s.basePrice > priceRange[1]) return false;
      if (search && !s.name.includes(search) && !s.description.includes(search) && !s.category.includes(search)) return false;
      return true;
    });

    if (sortBy === 'price-asc') items.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'price-desc') items.sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === 'name') items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }, [services, selectedCat, priceRange, search, sortBy]);

  const formatPrice = (p: number) => p.toLocaleString('fa-IR') + ' تومان';

  const categoryIcons: Record<string, string> = {
    'پرینت': '🖨️',
    'اسکن': '📄',
    'تایپ': '⌨️',
    'ترجمه': '🌐',
    'ثبت‌نام': '📝',
    'رزومه': '📋',
    'کپی': '📑',
    'نصب': '💿',
    'لمینت': '📃',
    'صحافی': '📚',
    'ارائه': '📊',
    'تبدیل': '🔄',
    'نظام وظیفه': '🎖️',
    'قوه قضاییه': '⚖️',
    'مالیاتی': '💰',
    'بیمه': '🛡️',
    'شارژ': '📱',
    'پلیس +۱۰': '👮',
    'مالی': '💵',
    'بانکی': '🏦',
    'حقوقی': '⚖️',
    'قبوض': '💳',
    'مشاوره': '💡',
    'مخابرات': '📡',
    'طراحی': '💻',
    'اداری': '📂',
  };

  return (
    <div className="fade-in max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">خدمات کافی‌نت همیار</h1>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>لیست کامل خدمات و تعرفه‌ها</p>
      </div>

      {/* Search & Filter Bar */}
      <div className={`flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-100'}`}>
        <div className="flex-1 relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در خدمات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className={`px-4 py-3 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
        >
          <option value="default">مرتب‌سازی</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="name">نام خدمت</option>
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            showFilters ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal size={18} />
          فیلترها
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={`p-4 rounded-xl mb-6 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} slide-in`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دسته‌بندی</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCat === cat
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'همه' : cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                محدوده قیمت: {formatPrice(priceRange[0])} تا {formatPrice(priceRange[1])}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="5000"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => { setSelectedCat('all'); setPriceRange([0, 500000]); setSearch(''); setSortBy('default'); }}
            className="mt-4 px-4 py-2 rounded-lg border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            حذف فیلترها
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{filtered.length} خدمت یافت شد</p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(service => (
          <div
            key={service.id}
            className={`p-5 rounded-xl border transition-all hover:shadow-lg ${
              darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">{categoryIcons[service.category] || '📌'}</span>
                <h3 className="font-bold flex-1">{service.name}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>
                {service.category}
              </span>
            </div>
            <p className={`text-sm mb-4 leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {service.description}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
              <div>
                <span className="text-blue-600 font-bold text-lg">{formatPrice(service.basePrice)}</span>
                <span className={`text-xs mr-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>/ {service.unit}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Clock size={12} />
                <span>زمان انجام: متغیر</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Filter size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خدمتی با این فیلترها یافت نشد</p>
        </div>
      )}

      {/* Info */}
      <div className={`mt-12 p-6 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className="font-bold mb-3">نکات مهم</h3>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>- قیمت‌ها ممکن است بر اساس حجم، تعداد و فوری بودن تغییر کنند</li>
          <li>- برای سفارش خدمات فوری، ۵۰ درصد اضافه بر قیمت پایه محاسبه می‌شود</li>
          <li>- خدمات ترجمه تخصصی با قیمت متفاوت محاسبه می‌شوند</li>
          <li>- برای اطلاع از قیمت دقیق و زمان انجام، با ما تماس بگیرید</li>
          <li>- تمامی خدمات با ضمانت کیفیت ارائه می‌شوند</li>
        </ul>
      </div>
    </div>
  );
}
