import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, Clock, Search, ArrowLeft } from 'lucide-react';
import { useApp } from '../store';
import { useBanner } from '../hooks/useBanner';
import { toJalaliString } from '../utils/jalali';
import Seo from '../components/Seo';

/**
 * فهرست عمومی اخبار و مقاله‌ها.
 *
 * فقط مقاله‌های منتشرشده نمایش داده می‌شوند، با جستجو، فیلتر دسته و صفحه‌بندی؛
 * هر کارت به آدرس خوانا `/news/<slug>` لینک می‌شود (سئو).
 */
export default function News() {
  const { darkMode, news } = useApp();
  const banner = useBanner('news');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const published = useMemo(
    () => news
      .filter(n => (n.status ? n.status === 'published' : n.active !== false))
      .sort((a, b) => (b.publishedAt || b.date || '').localeCompare(a.publishedAt || a.date || '')),
    [news],
  );

  const categories = useMemo(
    () => [...new Set(published.map(n => n.category || 'اخبار').filter(Boolean))],
    [published],
  );

  const filtered = published.filter(n => {
    if (category !== 'all' && (n.category || 'اخبار') !== category) return false;
    if (search) {
      const q = search.trim();
      const haystack = `${n.title} ${n.excerpt || ''} ${n.caption || ''} ${(n.tags || []).join(' ')}`;
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fade-in">
      <Seo
        title="اخبار و مقالات"
        description="آخرین اخبار، تخفیف‌ها، اطلاعیه‌ها و مقالات آموزشی کافی نت همیار."
        path="/news"
        type="website"
        image={banner?.imageUrl || undefined}
        keywords={['اخبار', 'مقالات', 'کافی نت همیار', ...categories]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'اخبار و مقالات کافی نت همیار',
          url: `${window.location.origin}/news`,
          blogPost: published.slice(0, 10).map(n => ({
            '@type': 'BlogPosting',
            headline: n.title,
            url: `${window.location.origin}/news/${n.slug || n.id}`,
            datePublished: n.publishedAt || n.date,
          })),
        }}
      />

      {/* Hero */}
      <div className="relative h-56 md:h-80 overflow-hidden">
        {banner?.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title || 'اخبار'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-l from-blue-700 to-purple-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
            {banner?.title || 'اخبار و مقالات'}
          </h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">
            {banner?.description || 'آخرین اخبار، تخفیف‌ها و مطالب آموزشی کافی نت همیار'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="جستجو در اخبار و مقالات…"
              aria-label="جستجو در اخبار"
              className={`w-full h-11 pr-10 pl-3 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>دسته:</span>
            <button
              onClick={() => { setCategory('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === 'all' ? 'bg-blue-600 text-white border-blue-600' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-slate-600'}`}
            >
              همه
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === cat ? 'bg-blue-600 text-white border-blue-600' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-slate-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {paged.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>مقاله‌ای یافت نشد</p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>عبارت جستجو یا دسته را تغییر دهید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paged.map(item => {
              const slug = item.slug || item.id;
              return (
                <article key={item.id} className={`group rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <Link to={`/news/${slug}`} aria-label={item.title}>
                    <div className="relative h-44 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.coverAlt || item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-l from-blue-600 to-purple-600 flex items-center justify-center">
                          <Newspaper size={36} className="text-white/70" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 text-white text-[11px]">
                        {item.category || 'اخبار'}
                      </span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/news/${slug}`} className="block">
                      <h2 className="font-bold text-base leading-7 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</h2>
                    </Link>
                    <p className={`text-xs leading-6 mt-2 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.excerpt || item.caption}
                    </p>
                    <div className={`flex items-center gap-3 mt-3 text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {toJalaliString(item.publishedAt || item.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {item.readingMinutes || 3} دقیقه</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-xs font-medium ${i + 1 === currentPage ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-50 border border-gray-200'}`}
              >
                {(i + 1).toLocaleString('fa-IR')}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ArrowLeft size={14} /> بازگشت به صفحهٔ اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
