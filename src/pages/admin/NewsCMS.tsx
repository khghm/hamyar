import React, { useMemo, useState } from 'react';
import {
  Newspaper, Plus, Search, Eye, Pencil, Trash2, Globe, FileText, Upload, ExternalLink,
  X, CheckCircle, Clock, BarChart3, Save,
} from 'lucide-react';
import { useApp, NewsItem } from '../../store';
import { uploadImageToSupabase } from '../../api/storage';
import { slugify, uniqueSlug } from '../../utils/slugify';
import { markdownToPlain } from '../../utils/markdown';
import { toJalaliString } from '../../utils/jalali';

/**
 * CMS اخبار — جایگزین تب «اخبار» در تنظیمات.
 *
 * امکانات: فهرست قابل جستجو/فیلتر، پیش‌نویس و انتشار، ویرایشگر با آدرس خوانا
 * (slug)، خلاصه، دسته، برچسب، تصویر کاور، نویسنده، زمان مطالعهٔ خودکار و
 * فیلدهای متای سئو با پیش‌نمایش نتیجهٔ گوگل.
 */

type Draft = Partial<NewsItem> & { id: string };

const emptyDraft = (): Draft => ({
  id: 'nw' + Date.now(),
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image: '',
  coverAlt: '',
  caption: '',
  category: 'اخبار',
  tags: [],
  author: 'تیم محتوا',
  status: 'draft',
  active: false,
  date: new Date().toISOString().slice(0, 10),
  publishedAt: new Date().toISOString(),
  seoTitle: '',
  seoDescription: '',
  views: 0,
});

export default function AdminNewsCMS() {
  const { darkMode, news, setNews, pushAuditLog, hasPermission } = useApp();
  // نوشتن در جدول news به مجوز «مدیریت اخبار» (یا مدیریت تنظیمات) نیاز دارد؛
  // کاربری که فقط مجوز مشاهده دارد باید صفحه را read-only ببیند، نه خطای RLS.
  const canManage = hasPermission('perm45') || hasPermission('perm31');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [...new Set(news.map(n => n.category || 'اخبار').filter(Boolean))],
    [news],
  );

  const statusOf = (n: NewsItem): 'draft' | 'published' =>
    n.status ? n.status : (n.active ? 'published' : 'draft');

  const filtered = useMemo(() => {
    return news
      .filter(n => {
        if (statusFilter !== 'all' && statusOf(n) !== statusFilter) return false;
        if (categoryFilter !== 'all' && (n.category || 'اخبار') !== categoryFilter) return false;
        if (search) {
          const q = search.trim();
          if (!n.title.includes(q) && !(n.slug || '').includes(q) && !(n.excerpt || '').includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.publishedAt || b.date || '').localeCompare(a.publishedAt || a.date || ''));
  }, [news, statusFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => ({
    total: news.length,
    published: news.filter(n => statusOf(n) === 'published').length,
    drafts: news.filter(n => statusOf(n) === 'draft').length,
    views: news.reduce((s, n) => s + (n.views || 0), 0),
  }), [news]);

  const openNew = () => { setError(''); setEditing(emptyDraft()); };
  const openEdit = (n: NewsItem) => {
    setError('');
    setEditing({ ...n, tags: n.tags || [] });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const { url, error: upErr } = await uploadImageToSupabase('news', file);
    setUploading(false);
    if (!url) { setError('آپلود تصویر ناموفق بود: ' + (upErr || '')); return; }
    setEditing(prev => prev ? { ...prev, image: url } : prev);
  };

  const save = () => {
    if (!editing) return;
    const title = (editing.title || '').trim();
    if (title.length < 3) { setError('عنوان مقاله را کامل وارد کنید'); return; }

    const others = news.filter(n => n.id !== editing.id).map(n => n.slug || '');
    const baseSlug = slugify(editing.slug || title, 'news-' + editing.id.slice(-4));
    const slug = uniqueSlug(baseSlug, others);

    const plain = markdownToPlain(editing.content || '', 100000);
    const readingMinutes = Math.max(1, Math.ceil(plain.length / 900));
    const published = editing.status === 'published';

    const item: NewsItem = {
      id: editing.id,
      title,
      slug,
      excerpt: (editing.excerpt || '').trim() || markdownToPlain(editing.content || '', 180),
      content: editing.content || '',
      image: editing.image || '',
      coverAlt: editing.coverAlt || title,
      caption: editing.caption || '',
      category: (editing.category || 'اخبار').trim() || 'اخبار',
      tags: Array.isArray(editing.tags) ? editing.tags.filter(Boolean) : [],
      author: (editing.author || 'تیم محتوا').trim(),
      status: published ? 'published' : 'draft',
      active: published,
      date: editing.date || new Date().toISOString().slice(0, 10),
      publishedAt: editing.publishedAt || new Date().toISOString(),
      seoTitle: (editing.seoTitle || '').trim() || title,
      seoDescription: (editing.seoDescription || '').trim() || markdownToPlain(editing.excerpt || editing.content || '', 160),
      readingMinutes,
      views: editing.views || 0,
    };

    setSaving(true);
    const exists = news.some(n => n.id === item.id);
    setNews(exists ? news.map(n => (n.id === item.id ? item : n)) : [item, ...news]);
    if (pushAuditLog) {
      pushAuditLog(exists ? 'ویرایش مقاله' : 'ایجاد مقاله',
        `مقاله «${item.title}» ${published ? 'منتشر' : 'به‌صورت پیش‌نویس ذخیره'} شد (${item.slug})`, 'اخبار');
    }
    setSaving(false);
    setEditing(null);
    showToast(exists ? 'مقاله به‌روزرسانی شد' : 'مقاله ایجاد شد');
  };

  const togglePublish = (n: NewsItem) => {
    const next = statusOf(n) === 'published' ? 'draft' : 'published';
    setNews(news.map(x => x.id === n.id
      ? { ...x, status: next, active: next === 'published', publishedAt: next === 'published' ? new Date().toISOString() : x.publishedAt }
      : x));
    if (pushAuditLog) pushAuditLog('تغییر وضعیت مقاله', `مقاله «${n.title}» ${next === 'published' ? 'منتشر' : 'پیش‌نویس'} شد`, 'اخبار');
    showToast(next === 'published' ? 'مقاله منتشر شد' : 'مقاله به پیش‌نویس برگشت');
  };

  const remove = (n: NewsItem) => {
    if (!window.confirm(`حذف مقالهٔ «${n.title}»؟ این کار قابل بازگشت نیست.`)) return;
    setNews(news.filter(x => x.id !== n.id));
    if (pushAuditLog) pushAuditLog('حذف مقاله', `مقاله «${n.title}» حذف شد`, 'اخبار');
    showToast('مقاله حذف شد');
  };

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <label className="block">
      <span className="text-xs font-medium block mb-1">{label}</span>
      {node}
      {hint && <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</span>}
    </label>
  );

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`;

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Newspaper size={26} className="text-blue-600" /> مدیریت اخبار</h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            مقاله‌ها را بنویسید، سئو را تنظیم کنید و منتشر کنید — صفحهٔ عمومی: <a href="/news" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">/news</a>
          </p>
        </div>
        {canManage && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> مقالهٔ جدید
          </button>
        )}
      </div>

      {!canManage && (
        <div className={`p-3 rounded-xl border text-xs leading-6 ${darkMode ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          شما فقط <strong>مجوز مشاهده</strong> دارید؛ برای ساخت یا ویرایش مقاله، از مدیر کل بخواهید مجوز{' '}
          <strong>«مدیریت اخبار»</strong> را به نقش شما بدهد.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'کل مقاله‌ها', value: stats.total, icon: Newspaper, color: 'text-blue-600' },
          { label: 'منتشرشده', value: stats.published, icon: Globe, color: 'text-emerald-600' },
          { label: 'پیش‌نویس', value: stats.drafts, icon: FileText, color: 'text-amber-600' },
          { label: 'مجموع بازدید', value: stats.views, icon: BarChart3, color: 'text-purple-600' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Icon size={18} className={`${card.color} mb-2`} />
              <div className="text-2xl font-bold">{(card.value || 0).toLocaleString('fa-IR')}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex-1 min-w-[220px] relative">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی عنوان، آدرس یا خلاصه…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className={`w-full pr-10 pl-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} className={inputCls + ' w-auto'}>
          <option value="all">همه وضعیت‌ها</option>
          <option value="published">منتشرشده</option>
          <option value="draft">پیش‌نویس</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className={inputCls + ' w-auto'}>
          <option value="all">همه دسته‌ها</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                <th className="text-right p-3 font-medium">مقاله</th>
                <th className="text-right p-3 font-medium hidden md:table-cell">دسته</th>
                <th className="text-right p-3 font-medium">وضعیت</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">تاریخ</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">بازدید</th>
                <th className="text-right p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(n => {
                const st = statusOf(n);
                return (
                  <tr key={n.id} className={`border-t ${darkMode ? 'border-slate-700 hover:bg-slate-700/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {n.image
                          ? <img src={n.image} alt={n.coverAlt || n.title} className="w-12 h-9 rounded object-cover flex-shrink-0" />
                          : <div className={`w-12 h-9 rounded flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}><FileText size={16} className="text-slate-400" /></div>}
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[280px]">{n.title}</div>
                          <div className={`text-[11px] font-mono truncate max-w-[280px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} dir="ltr">/{n.slug || n.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>{n.category || 'اخبار'}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${st === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {st === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td className={`p-3 text-xs whitespace-nowrap hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {n.publishedAt ? toJalaliString(n.publishedAt) : (n.date ? toJalaliString(n.date) : '—')}
                    </td>
                    <td className={`p-3 text-xs hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{(n.views || 0).toLocaleString('fa-IR')}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <a href={`/news/${n.slug || n.id}`} target="_blank" rel="noreferrer" title="مشاهده" className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}><Eye size={15} /></a>
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(n)} title="ویرایش" className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}><Pencil size={15} /></button>
                            <button onClick={() => togglePublish(n)} title={st === 'published' ? 'بازگشت به پیش‌نویس' : 'انتشار'} className={`p-1.5 rounded-lg ${st === 'published' ? 'text-amber-600 hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'}`}>
                              {st === 'published' ? <Clock size={15} /> : <Globe size={15} />}
                            </button>
                            <button onClick={() => remove(n)} title="حذف" className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div className="text-center py-14">
            <Newspaper size={44} className={`mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>مقاله‌ای یافت نشد</p>
            <button onClick={openNew} className="mt-3 text-sm text-blue-600 hover:underline">اولین مقاله را بنویسید</button>
          </div>
        )}

        {filtered.length > pageSize && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, filtered.length)} از {filtered.length.toLocaleString('fa-IR')}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-2 py-1 rounded-lg text-xs border disabled:opacity-40 ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>قبلی</button>
              <span className="px-2 py-1 text-xs">{currentPage.toLocaleString('fa-IR')} / {totalPages.toLocaleString('fa-IR')}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-2 py-1 rounded-lg text-xs border disabled:opacity-40 ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>بعدی</button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm shadow-lg">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-3 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className={`w-full max-w-4xl my-6 rounded-2xl p-5 ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Newspaper size={20} className="text-blue-600" />
                {news.some(n => n.id === editing.id) ? 'ویرایش مقاله' : 'مقالهٔ جدید'}
              </h3>
              <button onClick={() => setEditing(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X size={18} /></button>
            </div>

            {error && <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-3">
                {field('عنوان مقاله *',
                  <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className={inputCls} placeholder="مثلاً: راهنمای خرید هارد اکسترنال" />
                )}

                {field('آدرس مقاله (slug)',
                  <div className="flex gap-2">
                    <input
                      dir="ltr"
                      value={editing.slug || ''}
                      onChange={e => setEditing({ ...editing, slug: e.target.value })}
                      className={inputCls + ' font-mono text-xs'}
                      placeholder="auto-from-title"
                    />
                    <button
                      onClick={() => setEditing({ ...editing, slug: slugify(editing.title || '', 'news-' + editing.id.slice(-4)) })}
                      className={`px-3 rounded-lg text-xs whitespace-nowrap ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}
                      title="ساخت خودکار از عنوان"
                    >بازسازی</button>
                  </div>,
                  'آدرس نهایی: /news/' + (editing.slug || slugify(editing.title || '', '…')),
                )}

                {field('خلاصه (برای فهرست و متای سئو)',
                  <textarea
                    rows={2}
                    value={editing.excerpt || ''}
                    onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                    className={inputCls}
                    placeholder="یک یا دو جملهٔ جذاب دربارهٔ این مقاله…"
                  />,
                  `${(editing.excerpt || '').length} از ۱۶۰ کاراکتر پیشنهادی`,
                )}

                {field('متن مقاله (Markdown)',
                  <textarea
                    rows={14}
                    value={editing.content || ''}
                    onChange={e => setEditing({ ...editing, content: e.target.value })}
                    className={inputCls + ' font-mono text-xs leading-6'}
                    placeholder={'## تیتر بخش\nمتن…\n\n- نکتهٔ اول\n- نکتهٔ دوم\n\n**متن پررنگ** و [لینک](https://example.com)'}
                  />,
                  'پشتیبانی: ## تیتر، **بولد**، *ایتالیک*، [لینک](url)، لیست، نقل‌قول و ```کد```',
                )}
              </div>

              {/* Side column */}
              <div className="space-y-3">
                {field('وضعیت',
                  <select value={editing.status || 'draft'} onChange={e => setEditing({ ...editing, status: e.target.value as any, active: e.target.value === 'published' })} className={inputCls}>
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشرشده</option>
                  </select>
                )}

                {field('تاریخ انتشار',
                  <input
                    type="date"
                    value={(editing.date || '').slice(0, 10)}
                    onChange={e => setEditing({ ...editing, date: e.target.value, publishedAt: new Date(e.target.value || Date.now()).toISOString() })}
                    className={inputCls}
                  />
                )}

                {field('دسته',
                  <>
                    <input list="news-categories" value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} className={inputCls} placeholder="اخبار" />
                    <datalist id="news-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                  </>
                )}

                {field('برچسب‌ها (با ویرگول جدا کنید)',
                  <input
                    value={(editing.tags || []).join('، ')}
                    onChange={e => setEditing({ ...editing, tags: e.target.value.split(/[،,]/).map(t => t.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="هارد، ذخیره‌سازی، راهنما"
                  />
                )}

                {field('نویسنده',
                  <input value={editing.author || ''} onChange={e => setEditing({ ...editing, author: e.target.value })} className={inputCls} />
                )}

                {field('تصویر کاور',
                  <div className="space-y-2">
                    {editing.image && <img src={editing.image} alt={editing.coverAlt || ''} className="w-full h-28 object-cover rounded-lg" />}
                    <label className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Upload size={14} className={uploading ? 'animate-pulse' : ''} /> {uploading ? 'در حال آپلود…' : 'آپلود تصویر'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverUpload(file);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                )}

                {field('متن جایگزین تصویر (alt) — مهم برای سئو',
                  <input value={editing.coverAlt || ''} onChange={e => setEditing({ ...editing, coverAlt: e.target.value })} className={inputCls} placeholder="شرح تصویر" />
                )}
              </div>
            </div>

            {/* SEO box */}
            <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Globe size={16} className="text-blue-600" /> تنظیمات سئو</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {field('عنوان سئو (title)',
                  <input value={editing.seoTitle || ''} onChange={e => setEditing({ ...editing, seoTitle: e.target.value })} className={inputCls} placeholder={editing.title || ''} />,
                  `${(editing.seoTitle || editing.title || '').length} از ۶۰ کاراکتر`,
                )}
                {field('توضیح متا (description)',
                  <input value={editing.seoDescription || ''} onChange={e => setEditing({ ...editing, seoDescription: e.target.value })} className={inputCls} placeholder={editing.excerpt || ''} />,
                  `${(editing.seoDescription || editing.excerpt || '').length} از ۱۶۰ کاراکتر`,
                )}
              </div>
              {/* Google preview */}
              <div className={`mt-3 p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`} dir="rtl">
                <div className="text-[11px] text-slate-500 mb-1" dir="ltr">hamyar.pardismms.workers.dev › news › {(editing.slug || slugify(editing.title || '', '…'))}</div>
                <div className="text-blue-700 dark:text-blue-400 text-base leading-6 truncate">{editing.seoTitle || editing.title || 'عنوان مقاله'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-5 line-clamp-2">
                  {editing.seoDescription || editing.excerpt || 'توضیح متای مقاله اینجا نمایش داده می‌شود…'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                زمان مطالعهٔ محاسبه‌شده: {Math.max(1, Math.ceil(markdownToPlain(editing.content || '', 100000).length / 900)).toLocaleString('fa-IR')} دقیقه
              </span>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>انصراف</button>
                <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  <Save size={15} /> {saving ? 'در حال ذخیره…' : 'ذخیره'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


