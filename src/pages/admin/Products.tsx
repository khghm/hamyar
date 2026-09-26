import React, { useState, useMemo } from 'react';
import { useApp, Product } from '../../store';
import { Plus, Search, Edit, Trash2, Upload, X, AlertTriangle, Package, TrendingDown } from 'lucide-react';

export default function AdminProducts() {
  const { darkMode, products, setProducts } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [form, setForm] = useState<Partial<Product>>({ 
    name: '', brand: '', category: 'flash', price: 0, stock: 0, 
    description: '', image: '', alertThreshold: 10 
  });

  // محصولات با موجودی کم یا ناموجود
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const threshold = p.alertThreshold || 10;
      return p.stock <= threshold;
    });
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock === 0);
  }, [products]);

  const filtered = useMemo(() => {
    let items = products.filter(p => 
      p.name.includes(search) || p.brand.includes(search)
    );
    
    if (filter === 'low') {
      items = items.filter(p => {
        const threshold = p.alertThreshold || 10;
        return p.stock <= threshold && p.stock > 0;
      });
    } else if (filter === 'out') {
      items = items.filter(p => p.stock === 0);
    }
    
    return items;
  }, [products, search, filter]);

  const openNew = () => { 
    setForm({ 
      name: '', brand: '', category: 'flash', price: 0, stock: 0, 
      description: '', image: '', alertThreshold: 10 
    }); 
    setEditId(null); 
    setShowForm(true); 
  };
  
  const openEdit = (p: Product) => { 
    setForm(p); 
    setEditId(p.id); 
    setShowForm(true); 
  };

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

  const updateStock = (id: string, newStock: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const getStockStatus = (product: Product) => {
    const threshold = product.alertThreshold || 10;
    if (product.stock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'ناموجود' };
    if (product.stock <= threshold) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'کم' };
    return { status: 'ok', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'موجود' };
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">مدیریت محصولات و انبار</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> محصول جدید
        </button>
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className={`p-4 rounded-xl border-2 ${
          outOfStockProducts.length > 0 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
            : 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className={outOfStockProducts.length > 0 ? 'text-red-600' : 'text-orange-600'} />
            <h3 className={`font-bold ${outOfStockProducts.length > 0 ? 'text-red-600' : 'text-orange-600'}`}>
              هشدار موجودی
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">
                  {outOfStockProducts.length} محصول ناموجود:
                </p>
                <div className="space-y-1">
                  {outOfStockProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="text-xs text-red-700 dark:text-red-300">
                      • {p.name}
                    </div>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <div className="text-xs text-red-600">
                      و {outOfStockProducts.length - 3} محصول دیگر...
                    </div>
                  )}
                </div>
              </div>
            )}
            {lowStockProducts.filter(p => p.stock > 0).length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">
                  {lowStockProducts.filter(p => p.stock > 0).length} محصول با موجودی کم:
                </p>
                <div className="space-y-1">
                  {lowStockProducts.filter(p => p.stock > 0).slice(0, 3).map(p => (
                    <div key={p.id} className="text-xs text-orange-700 dark:text-orange-300">
                      • {p.name} ({p.stock} عدد)
                    </div>
                  ))}
                  {lowStockProducts.filter(p => p.stock > 0).length > 3 && (
                    <div className="text-xs text-orange-600">
                      و {lowStockProducts.filter(p => p.stock > 0).length - 3} محصول دیگر...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل محصولات</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={20} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موجودی کم</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ناموجود</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{products.filter(p => p.stock > (p.alertThreshold || 10)).length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موجودی کافی</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="جستجو..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} 
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}
          >
            همه
          </button>
          <button 
            onClick={() => setFilter('low')}
            className={`px-4 py-2.5 text-sm ${filter === 'low' ? 'bg-orange-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}
          >
            موجودی کم
          </button>
          <button 
            onClick={() => setFilter('out')}
            className={`px-4 py-2.5 text-sm ${filter === 'out' ? 'bg-red-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}
          >
            ناموجود
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">تصویر</th>
                <th className="text-right p-3">نام</th>
                <th className="text-right p-3">برند</th>
                <th className="text-right p-3">دسته</th>
                <th className="text-right p-3">قیمت</th>
                <th className="text-right p-3">موجودی</th>
                <th className="text-right p-3">حد هشدار</th>
                <th className="text-right p-3">وضعیت</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stockStatus = getStockStatus(p);
                return (
                  <tr key={p.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'} ${
                    stockStatus.status === 'out' ? 'bg-red-50 dark:bg-red-900/10' :
                    stockStatus.status === 'low' ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                  }`}>
                    <td className="p-3">
                      <div className="w-12 h-12 rounded bg-gray-200 dark:bg-slate-600 overflow-hidden">
                        <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.brand}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{p.price.toLocaleString('fa-IR')}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={p.stock} 
                        onChange={e => updateStock(p.id, Number(e.target.value))}
                        className={`w-20 px-2 py-1 rounded border text-center ${
                          stockStatus.status === 'out' ? 'border-red-500 bg-red-100 dark:bg-red-900/30' :
                          stockStatus.status === 'low' ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30' :
                          darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={p.alertThreshold || 10} 
                        onChange={e => setProducts(products.map(prod => prod.id === p.id ? { ...prod, alertThreshold: Number(e.target.value) } : prod))}
                        className={`w-20 px-2 py-1 rounded border text-center ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'}`}
                      />
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">ویرایش</button>
                      <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-400">محصولی یافت نشد</p>
        )}
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
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="قیمت (تومان)" value={form.price || ''} onChange={e => setForm({...form, price: Number(e.target.value)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="موجودی" value={form.stock || ''} onChange={e => setForm({...form, stock: Number(e.target.value)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="حد هشدار" value={form.alertThreshold || ''} onChange={e => setForm({...form, alertThreshold: Number(e.target.value)})}
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
