import React, { useState } from 'react';
import { useApp, Supplier } from '../../store';
import { Plus, X, Edit, Trash2 } from 'lucide-react';

export default function AdminSuppliers() {
  const { darkMode, suppliers, setSuppliers } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({ name: '', phone: '', email: '', address: '', products: [], balance: 0 });

  const openNew = () => { setForm({ name: '', phone: '', email: '', address: '', products: [], balance: 0 }); setEditId(null); setShowForm(true); };
  const openEdit = (s: Supplier) => { setForm(s); setEditId(s.id); setShowForm(true); };
  const save = () => {
    if (editId) setSuppliers(suppliers.map(s => s.id === editId ? { ...s, ...form } as Supplier : s));
    else setSuppliers([...suppliers, { ...form, id: 'sup' + Date.now() } as Supplier]);
    setShowForm(false);
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت تأمین‌کنندگان</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"><Plus size={16} /> تأمین‌کننده جدید</button>
      </div>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className="text-right p-3">نام</th>
              <th className="text-right p-3">تلفن</th>
              <th className="text-right p-3">ایمیل</th>
              <th className="text-right p-3">محصولات</th>
              <th className="text-right p-3">موجودی حساب</th>
              <th className="text-right p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3">{s.email || '-'}</td>
                <td className="p-3">{s.products.join('، ')}</td>
                <td className={`p-3 ${s.balance > 0 ? 'text-red-500' : ''}`}>{s.balance.toLocaleString('fa-IR')}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-blue-600 text-xs">ویرایش</button>
                  <button onClick={() => setSuppliers(suppliers.filter(x => x.id !== s.id))} className="text-red-500 text-xs">حذف</button>
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
              <h3 className="text-lg font-bold">{editId ? 'ویرایش' : 'تأمین‌کننده جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="نام" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="تلفن" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="email" placeholder="ایمیل" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="آدرس" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="number" placeholder="موجودی حساب" value={form.balance || ''} onChange={e => setForm({...form, balance: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
