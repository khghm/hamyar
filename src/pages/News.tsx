import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Newspaper, Calendar } from 'lucide-react';

export default function News() {
  const { darkMode, news } = useApp();
  const activeNews = news.filter(n => n.active);

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src="https://image.qwenlm.ai/generated-images/fa2e43a4-ff2d-4e87-820e-4a835049c30d/_result.png" 
          alt="اخبار کافی نت همیار" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">اخبار کافی نت همیار</h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">آخرین اخبار، تخفیف‌ها و اطلاعیه‌ها</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

      <div className="space-y-6">
        {activeNews.map(item => (
          <Link key={item.id} to={`/news/${item.id}`} className={`block rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row">
              {item.image ? (
                <img src={item.image} alt={item.title} className="md:w-64 h-48 md:h-auto object-cover" />
              ) : (
                <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Newspaper size={48} className="text-white/50" />
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.date}</span>
                </div>
                <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.caption}</p>
                <p className={`leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.content}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {activeNews.length === 0 && (
        <div className="text-center py-16">
          <Newspaper size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خبری منتشر نشده است</p>
        </div>
      )}
      </div>
    </div>
  );
}
