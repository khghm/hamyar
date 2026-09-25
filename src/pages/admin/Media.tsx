import React, { useState } from 'react';
import { useApp, MediaItem } from '../../store';
import { Plus, Search, Edit, Trash2, X, Upload } from 'lucide-react';

export default function AdminMedia() {
  const { darkMode, mediaItems, setMediaItems } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MediaItem>>({ title: '', year: 2024, genre: [], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '', rating: 0, image: '', description: '' });

  const filtered = mediaItems.filter(m => m.title.includes(search));
  const typeLabels: Record<string, string> = { movie: 'فیلم', series: 'سریال', animation: 'انیمیشن', anime: 'انیمه' };

  const openNew = () => { setForm({ title: '', year: 2024, genre: [], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '', rating: 0, image: '', description: '' }); setEditId(null); setShowForm(true); };
  const openEdit = (m: MediaItem) => { setForm(m); setEditId(m.id); setShowForm(true); };

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

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت کالکشن مدیا</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> عنوان جدید
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)}
          className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(m => (
          <div key={m.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="aspect-[2/3] bg-slate-700 relative">
              {m.image && <img src={m.image} alt={m.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] px-1 rounded">{typeLabels[m.type]}</span>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
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
                <input type="number" placeholder="امتیاز IMDB" value={form.rating || ''} onChange={e => setForm({...form, rating: Number(e.target.value)})} step="0.1"
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
                <label className="text-sm mb-1 block">تصویر (از ویکی‌پدیا یا آپلود):</label>
                <input type="text" placeholder="لینک تصویر" value={form.image?.startsWith('data:') ? '' : form.image} onChange={e => setForm({...form, image: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border mb-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer w-fit ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <Upload size={16} /> آپلود تصویر
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
