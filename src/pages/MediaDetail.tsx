import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Star, Heart, Eye, Calendar, Globe, Film, Clock } from 'lucide-react';

export default function MediaDetail() {
  const { id } = useParams();
  const { darkMode, mediaItems, currentUser, addToFavorites, selectMedia } = useApp();
  const navigate = useNavigate();
  
  const media = mediaItems.find(m => m.id === id);

  if (!media) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عنوان یافت نشد</p>
        <Link to="/media" className="text-blue-600 hover:underline mt-4 inline-block">بازگشت به کالکشن</Link>
      </div>
    );
  }

  const typeLabels: Record<string, string> = { movie: 'فیلم', series: 'سریال', animation: 'انیمیشن', anime: 'انیمه' };
  const relatedMedia = mediaItems.filter(m => m.genre.some(g => media.genre.includes(g)) && m.id !== media.id).slice(0, 6);

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        {media.image ? (
          <img src={media.image} alt={media.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium">
                {typeLabels[media.type]}
              </span>
              <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-sm font-bold flex items-center gap-1">
                <Star size={14} fill="currentColor" /> {media.imdb || media.rating}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                {media.quality}
              </span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{media.title}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><Calendar size={14} /> {media.year}</span>
              {media.director && <span>کارگردان: {media.director}</span>}
              {media.country && <span className="flex items-center gap-1"><Globe size={14} /> {media.country}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h2 className="text-xl font-bold mb-4">خلاصه داستان</h2>
              <p className={`leading-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {media.description}
              </p>
            </div>

            {/* Genres */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h2 className="text-xl font-bold mb-4">ژانرها</h2>
              <div className="flex flex-wrap gap-2">
                {media.genre.map((g, i) => (
                  <span key={i} className={`px-4 py-2 rounded-full text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            {currentUser && (
              <div className="flex gap-3">
                <button 
                  onClick={() => addToFavorites(media.id)}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    currentUser.favorites.includes(media.id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart size={20} fill={currentUser.favorites.includes(media.id) ? 'white' : 'none'} />
                  {currentUser.favorites.includes(media.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                </button>
                <button 
                  onClick={() => selectMedia(media.id)}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    currentUser.selectedMedia.includes(media.id)
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Eye size={20} />
                  {currentUser.selectedMedia.includes(media.id) ? 'حذف از انتخاب‌ها' : 'انتخاب برای کپی'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className="font-bold mb-4">مشخصات</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>سال ساخت</span>
                  <span className="font-medium">{media.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>زبان</span>
                  <span className="font-medium">{media.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>زیرنویس</span>
                  <span className="font-medium">{media.subtitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کیفیت</span>
                  <span className="font-medium">{media.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>حجم</span>
                  <span className="font-medium">{media.volume}</span>
                </div>
                {media.director && (
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کارگردان</span>
                    <span className="font-medium">{media.director}</span>
                  </div>
                )}
                {media.country && (
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کشور</span>
                    <span className="font-medium">{media.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
              <h3 className="font-bold mb-2 text-blue-600">اطلاعات مهم</h3>
              <p className={`text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                برای دریافت این عنوان، لطفاً به کافی نت همیار مراجعه کنید یا با ما تماس بگیرید.
              </p>
              <a href="tel:09913911880" className="block mt-3 text-center py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                تماس: 09913911880
              </a>
            </div>
          </div>
        </div>

        {/* Related Media */}
        {relatedMedia.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">عناوین مشابه</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedMedia.map(m => (
                <Link key={m.id} to={`/media/${m.id}`} className={`rounded-xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <div className="aspect-[2/3] relative">
                    {m.image && <img src={m.image} alt={m.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-2 left-2 bg-black/70 text-yellow-400 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star size={10} fill="currentColor" /> {m.imdb || m.rating}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-xs line-clamp-2">{m.title}</h3>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.year}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
