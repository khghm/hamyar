import React, { useState } from 'react';
import { useApp } from '../store';
import { Search, Printer, FileText, Globe, Copy, CheckCircle } from 'lucide-react';

export default function Services() {
  const { darkMode, services } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const categories = ['all', ...Array.from(new Set(services.filter(s => s.active).map(s => s.category)))];
  const filtered = services.filter(s => s.active && (selectedCat === 'all' || s.category === selectedCat) && s.name.includes(search));

  const formatPrice = (p: number) => p.toLocaleString('fa-IR') + ' تومان';

  return (
    <div className="fade-in max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">خدمات کافی‌نت همیار</h1>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>لیست کامل خدمات و تعرفه‌ها</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className={`flex-1 relative`}>
          <Search size={18} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="جستجو در خدمات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'همه' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(service => (
          <div key={service.id} className={`p-5 rounded-xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold">{service.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>{service.category}</span>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{service.description}</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-blue-600 font-bold text-lg">{formatPrice(service.basePrice)}</span>
                <span className={`text-xs mr-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>/ {service.unit}</span>
              </div>
              <CheckCircle size={20} className="text-green-500" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خدمتی یافت نشد</p>
        </div>
      )}

      {/* Info */}
      <div className={`mt-12 p-6 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className="font-bold mb-3">نکات مهم</h3>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>- قیمت‌ها ممکن است بر اساس حجم، تعداد و فوری بودن تغییر کنند</li>
          <li>- برای سفارش خدمات فوری، ۵۰ درصد اضافه بر قیمت پایه محاسبه می‌شود</li>
          <li>- خدمات ترجمه تخصصی با قیمت متفاوت محاسبه می‌شوند</li>
          <li>- برای اطلاع از قیمت دقیق، با ما تماس بگیرید</li>
        </ul>
      </div>
    </div>
  );
}
