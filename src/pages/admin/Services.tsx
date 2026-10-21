import React, { useState } from 'react';
import { useApp, Service, ServiceFormField, ServiceDocField, getServiceFormFields, getServiceDocFields } from '../../store';
import { useCatalogStore } from '../../state/catalogStore';
import { syncServices } from '../../api/services';
import { Plus, Edit, Trash2, X, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

const FIELD_TYPES: ServiceFormField['type'][] = ['text', 'tel', 'number', 'email', 'date', 'select', 'textarea'];

export default function AdminServices() {
  const { darkMode, services, setServices } = useApp();
  const refreshCatalog = useCatalogStore((s) => s.refresh);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState<'basic' | 'fields' | 'docs'>('basic');
  const [form, setForm] = useState<Partial<Service>>({ name: '', category: '', basePrice: 0, unit: 'مورد', description: '', active: true, fields: [], docs: [] });

  const openNew = () => { setForm({ name: '', category: '', basePrice: 0, unit: 'مورد', description: '', active: true, fields: [], docs: [] }); setEditId(null); setTab('basic'); setShowForm(true); };
  const openEdit = (s: Service) => { setForm({ ...s, fields: s.fields ?? [], docs: s.docs ?? [] }); setEditId(s.id); setTab('basic'); setShowForm(true); };

  const save = async () => {
    // validate unique keys
    const fieldKeys = (form.fields || []).map(f => f.key.trim()).filter(Boolean);
    if (new Set(fieldKeys).size !== fieldKeys.length) { alert('کلید فیلدهای فرم باید یکتا باشد'); return; }
    const docKeys = (form.docs || []).map(d => d.key.trim()).filter(Boolean);
    if (new Set(docKeys).size !== docKeys.length) { alert('کلید مدارک باید یکتا باشد'); return; }

    const previous = services;
    let next: Service[];
    const payload: Service = {
      ...(form as Service),
      fields: (form.fields && form.fields.length > 0) ? form.fields : undefined,
      docs: (form.docs && form.docs.length > 0) ? form.docs : undefined,
    };
    if (editId) {
      next = services.map(s => s.id === editId ? { ...s, ...payload } as Service : s);
    } else {
      next = [...services, { ...payload, id: 's' + Date.now() } as Service];
    }
    setServices(next);
    setShowForm(false);
    const result = await syncServices(next, previous);
    if (!result.ok) {
      setServices(previous);
      alert('خطا در ذخیره خدمت: ' + (result.error || 'نامشخص'));
      return;
    }
    await refreshCatalog();
  };

  const toggleActive = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const loadDefaults = () => {
    const svc = { ...(form as Service), fields: undefined, docs: undefined };
    setForm({ ...form, fields: getServiceFormFields(svc), docs: getServiceDocFields(svc) });
  };

  const resetToDefault = () => {
    setForm({ ...form, fields: [], docs: [] });
  };

  const updateField = (i: number, patch: Partial<ServiceFormField>) => {
    const next = [...(form.fields || [])];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, fields: next });
  };
  const removeField = (i: number) => {
    setForm({ ...form, fields: (form.fields || []).filter((_, idx) => idx !== i) });
  };
  const addField = () => {
    setForm({ ...form, fields: [...(form.fields || []), { key: '', label: '', type: 'text', required: false }] });
  };

  const updateDoc = (i: number, patch: Partial<ServiceDocField>) => {
    const next = [...(form.docs || [])];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, docs: next });
  };
  const removeDoc = (i: number) => {
    setForm({ ...form, docs: (form.docs || []).filter((_, idx) => idx !== i) });
  };
  const addDoc = () => {
    setForm({ ...form, docs: [...(form.docs || []), { key: '', label: '', required: false }] });
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`;

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
          <div className={`w-full max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش خدمت' : 'خدمت جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-slate-700">
              {(['basic','fields','docs'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>
                  {t === 'basic' ? 'اطلاعات پایه' : t === 'fields' ? 'فیلدهای فرم' : 'مدارک'}
                </button>
              ))}
            </div>

            {tab === 'basic' && (
              <div className="space-y-3">
                <input type="text" placeholder="نام خدمت" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                <input type="text" placeholder="دسته‌بندی" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="قیمت پایه (تومان)" value={form.basePrice || ''} onChange={e => setForm({...form, basePrice: Number(e.target.value)})} className={inputCls} />
                  <input type="text" placeholder="واحد (برگ، صفحه، ...)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className={inputCls} />
                </div>
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} rows={3} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                  <span className="text-sm">فعال</span>
                </label>
              </div>
            )}

            {tab === 'fields' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={loadDefaults} className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-xs"><RefreshCw size={14} /> بارگذاری پیش‌فرض‌های این دسته</button>
                  <button onClick={resetToDefault} className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-xs">بازگشت به پیش‌فرض</button>
                  <button onClick={addField} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs">+ فیلد جدید</button>
                </div>
                {(form.fields || []).map((f, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${darkMode ? 'border-slate-600' : 'border-gray-200'} space-y-2`}>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="key" value={f.key} onChange={e => updateField(i, { key: e.target.value })} className={inputCls} />
                      <input placeholder="label" value={f.label} onChange={e => updateField(i, { label: e.target.value })} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={f.type} onChange={e => updateField(i, { type: e.target.value as ServiceFormField['type'] })} className={inputCls}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input placeholder="placeholder" value={f.placeholder || ''} onChange={e => updateField(i, { placeholder: e.target.value })} className={inputCls} />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!f.required} onChange={e => updateField(i, { required: e.target.checked })} /> الزامی
                      </label>
                    </div>
                    {f.type === 'select' && (
                      <input placeholder="گزینه‌ها (با کاما جدا کنید)" value={(f.options || []).join(',')} onChange={e => updateField(i, { options: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} className={inputCls} />
                    )}
                    <button onClick={() => removeField(i)} className="text-red-500 text-xs">حذف</button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'docs' && (
              <div className="space-y-3">
                <button onClick={addDoc} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs">+ مدرک جدید</button>
                {(form.docs || []).map((d, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${darkMode ? 'border-slate-600' : 'border-gray-200'} space-y-2`}>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="key" value={d.key} onChange={e => updateDoc(i, { key: e.target.value })} className={inputCls} />
                      <input placeholder="label" value={d.label} onChange={e => updateDoc(i, { label: e.target.value })} className={inputCls} />
                    </div>
                    <input placeholder="hint" value={d.hint || ''} onChange={e => updateDoc(i, { hint: e.target.value })} className={inputCls} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!d.required} onChange={e => updateDoc(i, { required: e.target.checked })} /> الزامی
                    </label>
                    <button onClick={() => removeDoc(i)} className="text-red-500 text-xs">حذف</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={save} className="w-full py-2.5 mt-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
          </div>
        </div>
      )}
    </div>
  );
}
