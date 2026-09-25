import React, { useState } from 'react';
import { useApp } from '../store';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const { darkMode, faqs } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(faqs.map(f => f.category)))];
  const filtered = faqs.filter(f => {
    if (selectedCat !== 'all' && f.category !== selectedCat) return false;
    if (search && !f.question.includes(search) && !f.answer.includes(search)) return false;
    return true;
  });

  return (
    <div className="fade-in max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <HelpCircle size={32} className="text-blue-600" />
        </div>
        <h1 className="text-4xl font-black mb-4">سوالات متداول</h1>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          پاسخ سوالات پرتکرار مشتریان را اینجا بیابید
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="جستجو در سوالات..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-gray-200 placeholder-gray-400'}`}
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
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

      {/* FAQ List */}
      <div className="space-y-3">
        {filtered.map(faq => (
          <div
            key={faq.id}
            className={`rounded-xl border overflow-hidden transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
          >
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>
                  {faq.category}
                </span>
                <span className="font-bold">{faq.question}</span>
              </div>
              {openId === faq.id ? (
                <ChevronUp size={20} className="text-blue-600 flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
              )}
            </button>
            {openId === faq.id && (
              <div className={`p-4 border-t ${darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سوالی یافت نشد</p>
        </div>
      )}

      {/* Contact CTA */}
      <div className={`mt-12 p-6 rounded-2xl border text-center ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <h3 className="font-bold text-lg mb-2">سوال شما پاسخ داده نشد؟</h3>
        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          با ما تماس بگیرید یا از طریق شبکه‌های اجتماعی پیام دهید
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="tel:09913911880" className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            تماس: 09913911880
          </a>
          <a href="tel:09204767001" className={`px-6 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'}`}>
            تماس: 09204767001
          </a>
        </div>
      </div>
    </div>
  );
}
