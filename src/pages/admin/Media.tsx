import React, { useState, useMemo } from 'react';
import { useApp, MediaItem } from '../../store';
import { Plus, Search, Edit, Trash2, X, Upload, Filter, Grid, List, Eye, Star } from 'lucide-react';

export default function AdminMedia() {
  const { darkMode, mediaItems, setMediaItems } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [form, setForm] = useState<Partial<MediaItem>>({ 
    title: '', year: 2024, genre: [], type: 'movie', quality: 'BluRay', 
    language: 'انگلیسی', subtitle: 'فارسی', volume: '', rating: 0, 
    image: '', description: '', director: '', country: '', imdb: 0 
  });

  const allGenres = useMemo(() => Array.from(new Set(mediaItems.flatMap(m => m.genre))), [mediaItems]);
  const allQualities = useMemo(() => Array.from(new Set(mediaItems.map(m => m.quality))), [mediaItems]);

  const filtered = useMemo(() => {
    let items = mediaItems.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (genreFilter !== 'all' && !m.genre.includes(genreFilter)) return false;
      if (qualityFilter !== 'all' && m.quality !== qualityFilter) return false;
      if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.includes(search)) return false;
      return true;
    });

    if (sortBy === 'rating') items.sort((a, b) => (b.imdb || b.rating) - (a.imdb || a.rating));
    else if (sortBy === 'year') items.sort((a, b) => b.year - a.year);
    else if (sortBy === 'title') items.sort((a, b) => a.title.localeCompare(b.title));

    return items;
  }, [mediaItems, typeFilter, genreFilter, qualityFilter, search, sortBy]);

  const typeLabels: Record<string, string> = { movie: 'فیلم', series: 'سریال', animation: 'انیمیشن', anime: 'انیمه' };

  const openNew = () => { 
    setForm({ 
      title: '', year: 2024, genre: [], type: 'movie', quality: 'BluRay', 
      language: 'انگلیسی', subtitle: 'فارسی', volume: '', rating: 0, 
      image: '', description: '', director: '', country: '', imdb: 0 
    }); 
    setEditId(null); 
    setShowForm(true); 
  };
  
  const openEdit = (m: MediaItem) => { 
    setForm(m); 
    setEditId(m.id); 
    setShowForm(true); 
  };

  const save = () => {
    if (editId) {
      setMediaItems(mediaItems.map(m => m.id === editId ? { ...m, ...form } as MediaItem : m));
    } else {
      setMediaItems([...mediaItems, { ...form, id: 'm' + Date.now() } as MediaItem]);
    }
    setShowForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm({ ...form, image: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const toggleGenre = (g: string) => {
    const genres = form.genre || [];
    setForm({ ...form, genre: genres.includes(g) ? genres.filter(x => x !== g) : [...genres, g] });
  };

  // Stats
  const stats = {
    total: mediaItems.length,
    movies: mediaItems.filter(m => m.type === 'movie').length,
    series: mediaItems.filter(m => m.type === 'series').length,
    animation: mediaItems.filter(m => m.type === 'animation').length,
    anime: mediaItems.filter(m => m.type === 'anime').length,
    avgRating: mediaItems.length > 0 ? (mediaItems.reduce((s, m) => s + (m.imdb || m.rating), 0) / mediaItems.length).toFixed(1) : '0',
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">مدیریت کالکشن مدیا</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> عنوان جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل عناوین</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.movies}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فیلم</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.series}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سریال</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.animation}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>انیمیشن</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-pink-600">{stats.anime}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>انیمه</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
            <Star size={16} className="fill-yellow-600" />
            {stats.avgRating}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین امتیاز</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="جستجو..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className={`w-full pr-10 pl-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} 
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="all">همه انواع</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="all">همه ژانرها</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={qualityFilter} onChange={e => setQualityFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="all">همه کیفیت‌ها</option>
            {allQualities.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="title">عنوان</option>
            <option value="year">سال</option>
            <option value="rating">امتیاز</option>
          </select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{filtered.length} عنوان</p>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(m => (
            <div key={m.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="aspect-[2/3] bg-slate-700 relative">
                {m.image && <img src={m.image} alt={m.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] px-1 rounded">{typeLabels[m.type]}</span>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star size={10} className="fill-yellow-400" />
                    {m.imdb || m.rating}
                  </div>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-bold truncate">{m.title}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400">{m.year}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)} className="text-blue-600 text-[10px]">ویرایش</button>
                    <button onClick={() => setMediaItems(mediaItems.filter(x => x.id !== m.id))} className="text-red-500 text-[10px]">حذف</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">تصویر</th>
                  <th className="text-right p-3">عنوان</th>
                  <th className="text-right p-3">نوع</th>
                  <th className="text-right p-3">سال</th>
                  <th className="text-right p-3">امتیاز</th>
                  <th className="text-right p-3">کیفیت</th>
                  <th className="text-right p-3">حجم</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3">
                      <div className="w-12 h-16 rounded bg-slate-700 overflow-hidden">
                        {m.image && <img src={m.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{m.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>{typeLabels[m.type]}</span>
                    </td>
                    <td className="p-3">{m.year}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star size={12} className="fill-yellow-600" />
                        {m.imdb || m.rating}
                      </span>
                    </td>
                    <td className="p-3">{m.quality}</td>
                    <td className="p-3">{m.volume}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(m)} className="text-blue-600 text-xs hover:underline">ویرایش</button>
                      <button onClick={() => setMediaItems(mediaItems.filter(x => x.id !== m.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Filter size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عنوانی یافت نشد</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش عنوان' : 'عنوان جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="movie">فیلم</option>
                  <option value="series">سریال</option>
                  <option value="animation">انیمیشن</option>
                  <option value="anime">انیمه</option>
                </select>
                <input type="number" placeholder="سال" value={form.year || ''} onChange={e => setForm({...form, year: Number(e.target.value)})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="کیفیت" value={form.quality} onChange={e => setForm({...form, quality: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="text" placeholder="حجم" value={form.volume} onChange={e => setForm({...form, volume: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="زبان" value={form.language} onChange={e => setForm({...form, language: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="امتیاز IMDB" value={form.imdb || ''} onChange={e => setForm({...form, imdb: Number(e.target.value)})} step="0.1"
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm mb-1 block">ژانرها:</label>
                <div className="flex flex-wrap gap-1">
                  {['اکشن', 'درام', 'کمدی', 'علمی‌تخیلی', 'ترسناک', 'عاشقانه', 'جنایی', 'فانتزی', 'ماجراجویی', 'خانوادگی', 'فراطبیعی', 'تاریخی'].map(g => (
                    <button key={g} onClick={() => toggleGenre(g)}
                      className={`px-2 py-1 rounded text-xs ${(form.genre || []).includes(g) ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={3} />
              <div>
                <label className="text-sm mb-1 block">تصویر:</label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Upload size={16} /> آپلود تصویر
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {form.image && <img src={form.image} alt="" className="w-16 h-20 object-cover rounded" />}
                </div>
              </div>
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
