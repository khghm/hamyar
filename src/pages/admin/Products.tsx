import React, { useState } from 'react';
import { useApp, Product } from '../../store';
import { Plus, Search, Edit, Trash2, Upload, X } from 'lucide-react';

export default function AdminProducts() {
  const { darkMode, products, setProducts } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ name: '', brand: '', category: 'flash', price: 0, stock: 0, description: '', image: '' });

  const filtered = products.filter(p => p.name.includes(search) || p.brand.includes(search));

  const openNew = () => { setForm({ name: '', brand: '', category: 'flash', price: 0, stock: 0, description: '', image: '' }); setEditId(null); setShowForm(true); };
  const openEdit = (p: Product) => { setForm(p); setEditId(p.id); setShowForm(true); };

  const save = () => {
    if (editId) {
      setProducts(products.map(p => p.id === editId ? { ...p, ...form } as Product : p));
    } else {
      setProducts([...products, { ...form, id: 'p' + Date.now() } as Product]);
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

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت محصولات و انبار</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> محصول جدید
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)}
          className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} />
      </div>

      <div className={`rounded-xl border overflow-x-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className="text-right p-3">تصویر</th>
              <th className="text-right p-3">نام</th>
              <th className="text-right p-3">برند</th>
              <th className="text-right p-3">دسته</th>
              <th className="text-right p-3">قیمت</th>
              <th className="text-right p-3">موجودی</th>
              <th className="text-right p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3"><div className="w-10 h-10 rounded bg-gray-200 dark:bg-slate-600 overflow-hidden"><img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div></td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.brand}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.price.toLocaleString('fa-IR')}</td>
                <td className="p-3"><span className={p.stock < 10 ? 'text-red-500 font-bold' : ''}>{p.stock}</span></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">ویرایش</button>
                  <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش محصول' : 'محصول جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="نام محصول" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="برند" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="flash">فلش مموری</option>
                <option value="hard">هارد</option>
                <option value="cable">کابل</option>
                <option value="charger">شارژر</option>
                <option value="cctv">دوربین مداربسته</option>
                <option value="pos">دستگاه پوز</option>
                <option value="accessories">لوازم جانبی</option>
                <option value="storage">حافظه</option>
                <option value="audio">صوتی</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="قیمت (تومان)" value={form.price || ''} onChange={e => setForm({...form, price: Number(e.target.value)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="موجودی" value={form.stock || ''} onChange={e => setForm({...form, stock: Number(e.target.value)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={3} />
              <div>
                <label className={`text-sm mb-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تصویر محصول</label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Upload size={16} /> انتخاب تصویر
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {form.image && <img src={form.image} alt="" className="w-12 h-12 rounded object-cover" />}
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
