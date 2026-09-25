import React, { useState } from 'react';
import { useApp, Service } from '../../store';
import { Plus, Edit, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminServices() {
  const { darkMode, services, setServices } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Service>>({ name: '', category: '', basePrice: 0, unit: 'مورد', description: '', active: true });

  const openNew = () => { setForm({ name: '', category: '', basePrice: 0, unit: 'مورد', description: '', active: true }); setEditId(null); setShowForm(true); };
  const openEdit = (s: Service) => { setForm(s); setEditId(s.id); setShowForm(true); };

  const save = () => {
    if (editId) {
      setServices(services.map(s => s.id === editId ? { ...s, ...form } as Service : s));
    } else {
      setServices([...services, { ...form, id: 's' + Date.now() } as Service]);
    }
    setShowForm(false);
  };

  const toggleActive = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت خدمات کافی‌نت</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> خدمت جدید
        </button>
      </div>

      <div className={`rounded-xl border overflow-x-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className="text-right p-3">نام خدمت</th>
              <th className="text-right p-3">دسته</th>
              <th className="text-right p-3">قیمت پایه</th>
              <th className="text-right p-3">واحد</th>
              <th className="text-right p-3">وضعیت</th>
              <th className="text-right p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.category}</td>
                <td className="p-3">{s.basePrice.toLocaleString('fa-IR')} تومان</td>
                <td className="p-3">{s.unit}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(s.id)} className={s.active ? 'text-green-500' : 'text-red-500'}>
                    {s.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-blue-600 text-xs hover:underline">ویرایش</button>
                  <button onClick={() => setServices(services.filter(x => x.id !== s.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش خدمت' : 'خدمت جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="نام خدمت" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="دسته‌بندی" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="قیمت پایه (تومان)" value={form.basePrice || ''} onChange={e => setForm({...form, basePrice: Number(e.target.value)})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="text" placeholder="واحد (برگ، صفحه، ...)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={3} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                <span className="text-sm">فعال</span>
              </label>
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
