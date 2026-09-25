import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Search, Filter, Star, Heart, Eye, ChevronDown, X, SlidersHorizontal } from 'lucide-react';

export default function MediaCatalog() {
  const { darkMode, mediaItems, currentUser, addToFavorites, selectMedia } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allGenres = useMemo(() => Array.from(new Set(mediaItems.flatMap(m => m.genre))), [mediaItems]);
  const allYears = useMemo(() => Array.from(new Set(mediaItems.map(m => m.year))).sort((a, b) => b - a), [mediaItems]);
  const allQualities = useMemo(() => Array.from(new Set(mediaItems.map(m => m.quality))), [mediaItems]);

  const filtered = useMemo(() => {
    let items = mediaItems.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (genreFilter !== 'all' && !m.genre.includes(genreFilter)) return false;
      if (yearFilter !== 'all' && m.year !== Number(yearFilter)) return false;
      if (qualityFilter !== 'all' && m.quality !== qualityFilter) return false;
      if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.includes(search)) return false;
      return true;
    });
    if (sortBy === 'rating') items.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'year') items.sort((a, b) => b.year - a.year);
    else if (sortBy === 'title') items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [mediaItems, typeFilter, genreFilter, yearFilter, qualityFilter, search, sortBy]);

  const typeLabels: Record<string, string> = { all: 'همه', movie: 'فیلم', series: 'سریال', animation: 'انیمیشن', anime: 'انیمه' };

  const detail = selectedItem ? mediaItems.find(m => m.id === selectedItem) : null;

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src="https://image.qwenlm.ai/generated-images/dafa2905-55af-4a19-9235-93202ba272f8/_result.png" 
          alt="کالکشن فیلم و سریال" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">کالکشن فیلم و سریال</h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">مجموعه‌ای کامل از فیلم، سریال، انیمیشن و انیمه با بهترین کیفیت</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className={`flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-100'}`}>
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی عنوان فیلم، سریال..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pr-10 pl-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              showFilters ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal size={18} />
            فیلترها
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className={`px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          >
            <option value="rating">امتیاز</option>
            <option value="year">سال ساخت</option>
            <option value="title">عنوان</option>
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={`p-4 rounded-xl mb-6 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} slide-in`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نوع</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setTypeFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === key ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ژانر</label>
                <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="all">همه ژانرها</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سال</label>
                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="all">همه سال‌ها</option>
                  {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کیفیت</label>
                <select value={qualityFilter} onChange={e => setQualityFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="all">همه کیفیت‌ها</option>
                  {allQualities.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{filtered.length} عنوان یافت شد</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filtered.map(item => (
            <Link key={item.id} to={`/media/${item.id}`} className={`group rounded-xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer block ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
              <div className="relative aspect-[2/3] overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                {/* Quality Badge */}
                <span className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">{item.quality}</span>
                {/* Rating */}
                <div className="absolute top-2 left-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star size={10} fill="currentColor" /> {item.imdb || item.rating}
                </div>
                {/* Type Badge */}
                <span className="absolute bottom-2 right-2 bg-blue-600/90 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                  {typeLabels[item.type]}
                </span>
                {/* Favorite & Select Buttons */}
                {currentUser && (
                  <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); addToFavorites(item.id); }}
                      className={`p-1.5 rounded-full ${currentUser.favorites.includes(item.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700'}`}>
                      <Heart size={12} fill={currentUser.favorites.includes(item.id) ? 'white' : 'none'} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); selectMedia(item.id); }}
                      className={`p-1.5 rounded-full ${currentUser.selectedMedia.includes(item.id) ? 'bg-green-500 text-white' : 'bg-white/80 text-slate-700'}`}>
                      <Eye size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm line-clamp-2 mb-1">{item.title}</h3>
                <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{item.year}</span>
                  <span>|</span>
                  <span className="truncate">{item.genre[0]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Film size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عنوانی یافت نشد</p>
          </div>
        )}

        {/* Login Notice */}
        {!currentUser && (
          <div className={`mt-8 p-4 rounded-xl text-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              برای انتخاب فیلم و سریال، ابتدا باید <a href="/auth" className="text-blue-600 font-medium hover:underline">وارد حساب کاربری</a> خود شوید.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setSelectedItem(null)}>
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="relative h-64 overflow-hidden rounded-t-2xl">
              {detail.image ? (
                <img src={detail.image} alt={detail.title} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                <X size={20} />
              </button>
              <div className="absolute bottom-4 right-4 left-4">
                <h2 className="text-2xl font-black text-white">{detail.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
                  <span>{detail.year}</span>
                  <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" fill="currentColor" /> {detail.imdb || detail.rating}</span>
                  <span className="bg-blue-600 px-2 py-0.5 rounded text-xs">{detail.quality}</span>
                  <span className="bg-purple-600 px-2 py-0.5 rounded text-xs">{typeLabels[detail.type]}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className={`mb-4 leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{detail.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کارگردان:</span> {detail.director || 'نامشخص'}</div>
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کشور:</span> {detail.country || 'نامشخص'}</div>
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>زبان:</span> {detail.language}</div>
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>زیرنویس:</span> {detail.subtitle}</div>
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>حجم:</span> {detail.volume}</div>
                <div><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>ژانر:</span> {detail.genre.join('، ')}</div>
              </div>
              {currentUser && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => addToFavorites(detail.id)}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${currentUser.favorites.includes(detail.id) ? 'bg-red-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    {currentUser.favorites.includes(detail.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                  </button>
                  <button onClick={() => selectMedia(detail.id)}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${currentUser.selectedMedia.includes(detail.id) ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {currentUser.selectedMedia.includes(detail.id) ? 'حذف از انتخاب‌ها' : 'انتخاب برای کپی'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Film(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>; }
