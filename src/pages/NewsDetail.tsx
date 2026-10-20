import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowRight, Share2, Clock, User, Tag, Copy, Send, Newspaper } from 'lucide-react';
import { useApp } from '../store';
import { toJalaliString } from '../utils/jalali';
import { renderMarkdown } from '../utils/markdown';
import Seo from '../components/Seo';
import { track } from '../utils/analytics';

/** هر مقاله در هر نشست فقط یک‌بار بازدید ثبت کند. */
const countedViews = new Set<string>();

export default function NewsDetail() {
  const { slug } = useParams();
  const { darkMode, news, setNews } = useApp();

  const item = useMemo(
    () => news.find(n => (n.slug || n.id) === slug || n.id === slug),
    [news, slug],
  );

  const published = item ? (item.status ? item.status === 'published' : item.active !== false) : false;
  const canonicalPath = `/news/${item?.slug || slug}`;

  // شمارش بازدید (یک‌بار در هر نشست)
  useEffect(() => {
    if (!item || !published || countedViews.has(item.id)) return;
    countedViews.add(item.id);
    try {
      setNews(news.map(n => (n.id === item.id ? { ...n, views: (n.views || 0) + 1 } : n)));
    } catch { /* شمارنده نباید صفحه را خراب کند */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item || !published) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Seo title="مقاله یافت نشد" noindex />
        <Newspaper size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
        <h1 className="text-xl font-bold mb-2">این مقاله پیدا نشد یا منتشر نشده است</h1>
        <Link to="/news" className="text-blue-600 hover:underline mt-4 inline-block">بازگشت به فهرست اخبار</Link>
      </div>
    );
  }

  const related = news
    .filter(n => n.id !== item.id
      && (n.status ? n.status === 'published' : n.active !== false)
      && (n.category || 'اخبار') === (item.category || 'اخبار'))
    .slice(0, 3);

  const plainText = renderMarkdown(item.content || '');
  const date = item.publishedAt || item.date;
  const shareUrl = `${window.location.origin}${canonicalPath}`;

  const share = (network: 'telegram' | 'whatsapp' | 'copy') => {
    track('share_article', { network, slug: item.slug || item.id });
    if (network === 'copy') {
      navigator.clipboard?.writeText(shareUrl);
      return;
    }
    const text = encodeURIComponent(item.title);
    const url = encodeURIComponent(shareUrl);
    const target = network === 'telegram'
      ? `https://t.me/share/url?url=${url}&text=${text}`
      : `https://wa.me/?text=${text}%20${url}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="fade-in">
      <Seo
        title={item.seoTitle || item.title}
        description={item.seoDescription || item.excerpt || item.caption}
        path={canonicalPath}
        image={item.image || undefined}
        type="article"
        keywords={[item.category || 'اخبار', ...(item.tags || [])]}
        publishedTime={date ? new Date(date).toISOString() : undefined}
        modifiedTime={item.publishedAt ? new Date(item.publishedAt).toISOString() : undefined}
        author={item.author || 'تیم محتوا'}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: item.seoTitle || item.title,
            description: item.seoDescription || item.excerpt || item.caption,
            image: item.image ? [item.image] : undefined,
            datePublished: date ? new Date(date).toISOString() : undefined,
            dateModified: item.publishedAt ? new Date(item.publishedAt).toISOString() : undefined,
            author: { '@type': 'Person', name: item.author || 'تیم محتوا' },
            publisher: { '@type': 'Organization', name: 'کافی نت همیار' },
            mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
            keywords: (item.tags || []).join(', '),
            articleSection: item.category || 'اخبار',
            inLanguage: 'fa-IR',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: 'اخبار', item: `${window.location.origin}/news` },
              { '@type': 'ListItem', position: 3, name: item.title, item: shareUrl },
            ],
          },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="مسیر صفحه" className="flex items-center gap-2 mb-5 text-sm flex-wrap">
          <Link to="/" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>خانه</Link>
          <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
          <Link to="/news" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>اخبار</Link>
          <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
          <span className={`truncate max-w-[240px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/news" className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
              {item.category || 'اخبار'}
            </Link>
            {(item.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className={`px-2 py-1 rounded-lg text-[11px] ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-slate-500'}`}>#{tag}</span>
            ))}
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight mb-4">{item.title}</h1>
          {(item.excerpt || item.caption) && (
            <p className={`text-base md:text-lg leading-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.excerpt || item.caption}</p>
          )}
          <div className={`flex flex-wrap items-center gap-4 mt-4 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1"><User size={13} /> {item.author || 'تیم محتوا'}</span>
            <span className="flex items-center gap-1"><Calendar size={13} /> {toJalaliString(date)}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {item.readingMinutes || 3} دقیقه مطالعه</span>
            {typeof item.views === 'number' && item.views > 0 && (
              <span className="flex items-center gap-1">{item.views.toLocaleString('fa-IR')} بازدید</span>
            )}
          </div>
        </header>

        {/* Cover */}
        {item.image && (
          <figure className="mb-8">
            <img
              src={item.image}
              alt={item.coverAlt || item.title}
              className="w-full rounded-2xl object-cover max-h-[460px]"
              fetchPriority="high"
            />
            {item.coverAlt && (
              <figcaption className={`text-[11px] mt-2 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.coverAlt}</figcaption>
            )}
          </figure>
        )}

        {/* Content */}
        <div
          className={`prose-news text-sm md:text-base ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}
          dangerouslySetInnerHTML={{ __html: plainText }}
        />

        {/* Tags + share */}
        <div className={`mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {(item.tags || []).map(tag => (
              <span key={tag} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                <Tag size={11} /> {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Share2 size={14} /> اشتراک:</span>
            <button onClick={() => share('telegram')} title="اشتراک در تلگرام" className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}><Send size={15} /></button>
            <button onClick={() => share('whatsapp')} title="اشتراک در واتساپ" className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}><Share2 size={15} /></button>
            <button onClick={() => share('copy')} title="کپی لینک" className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}><Copy size={15} /></button>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-4">مقالات مرتبط</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link
                  key={r.id}
                  to={`/news/${r.slug || r.id}`}
                  className={`block rounded-xl border overflow-hidden transition-all hover:shadow-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                >
                  {r.image
                    ? <img src={r.image} alt={r.coverAlt || r.title} loading="lazy" className="w-full h-28 object-cover" />
                    : <div className="w-full h-28 bg-gradient-to-l from-blue-600 to-purple-600" />}
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2">{r.title}</h3>
                    <span className={`text-[11px] mt-1 block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{toJalaliString(r.publishedAt || r.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link to="/news" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ArrowRight size={14} /> همهٔ اخبار و مقالات
          </Link>
        </div>
      </div>
    </article>
  );
}
