import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store';
import { Calendar, ArrowRight, Share2 } from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams();
  const { darkMode, news } = useApp();
  
  const newsItem = news.find(n => n.id === id);

  if (!newsItem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خبر یافت نشد</p>
        <Link to="/news" className="text-blue-600 hover:underline mt-4 inline-block">بازگشت به اخبار</Link>
      </div>
    );
  }

  const otherNews = news.filter(n => n.id !== newsItem.id && n.active).slice(0, 3);

  return (
    <div className="fade-in max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>خانه</Link>
        <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
        <Link to="/news" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>اخبار</Link>
        <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
        <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{newsItem.title}</span>
      </div>

      {/* Article */}
      <article className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        {/* Hero Image */}
        {newsItem.image ? (
          <img src={newsItem.image} alt={newsItem.title} className="w-full h-64 md:h-96 object-cover" />
        ) : (
          <div className="w-full h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-6xl font-bold opacity-20">NEWS</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Meta */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Calendar size={14} />
              {newsItem.date}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            {newsItem.title}
          </h1>

          {/* Caption */}
          {newsItem.caption && (
            <p className={`text-lg mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'} font-medium`}>
              {newsItem.caption}
            </p>
          )}

          {/* Content */}
          <div className={`prose max-w-none ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <p className="text-lg leading-8 whitespace-pre-wrap">
              {newsItem.content}
            </p>
          </div>

          {/* Share */}
          <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                اشتراک‌گذاری این خبر:
              </span>
              <div className="flex gap-2">
                <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(newsItem.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-all">
                  <Share2 size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Other News */}
      {otherNews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">سایر اخبار</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherNews.map(item => (
              <Link key={item.id} to={`/news/${item.id}`} className={`rounded-xl overflow-hidden border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <Calendar size={12} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{item.date}</span>
                  </div>
                  <h3 className="font-bold mb-2 line-clamp-2">{item.title}</h3>
                  <p className={`text-sm line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.caption}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Link to="/news" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
          <ArrowRight size={18} />
          بازگشت به لیست اخبار
        </Link>
      </div>
    </div>
  );
}
