import React, { useState } from 'react';
import { useApp, Project } from '../../store';
import { Plus, X } from 'lucide-react';
import JalaliDateInput from '../../components/JalaliDateInput';

export default function AdminProjects() {
  const { darkMode, projects, setProjects } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Project>>({ title: '', clientName: '', type: 'فروشگاهی', stage: 'مشاوره', deadline: '', totalCost: 0, paidAmount: 0, progress: 0, description: '' });

  const stages = ['مشاوره', 'قرارداد', 'پیش‌پرداخت', 'طراحی', 'تایید', 'راه‌اندازی', 'تحویل', 'تسویه'];

  const openNew = () => { setForm({ title: '', clientName: '', type: 'فروشگاهی', stage: 'مشاوره', deadline: '', totalCost: 0, paidAmount: 0, progress: 0, description: '' }); setEditId(null); setShowForm(true); };
  const openEdit = (p: Project) => { setForm(p); setEditId(p.id); setShowForm(true); };

  const save = () => {
    if (editId) {
      setProjects(projects.map(p => p.id === editId ? { ...p, ...form } as Project : p));
    } else {
      setProjects([...projects, { ...form, id: 'pr' + Date.now() } as Project]);
    }
    setShowForm(false);
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">پروژه‌های طراحی سایت</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> پروژه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">{p.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>{p.type}</span>
            </div>
            <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مشتری: {p.clientName}</p>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>پیشرفت</span>
                <span>{p.progress}%</span>
              </div>
              <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${p.progress}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>{p.stage}</span>
              <span>{p.paidAmount.toLocaleString('fa-IR')} / {p.totalCost.toLocaleString('fa-IR')} تومان</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(p)} className="text-blue-600 text-xs hover:underline">ویرایش</button>
              <button onClick={() => setProjects(projects.filter(x => x.id !== p.id))} className="text-red-500 text-xs hover:underline">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && <p className="text-center py-8 text-slate-400">پروژه‌ای ثبت نشده</p>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش پروژه' : 'پروژه جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان پروژه" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="نام مشتری" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option>فروشگاهی</option><option>شرکتی</option><option>شخصی</option>
                </select>
                <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  {stages.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <JalaliDateInput value={form.deadline || ''} onChange={date => setForm({...form, deadline: date})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="هزینه کل" value={form.totalCost || ''} onChange={e => setForm({...form, totalCost: Number(e.target.value)})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="پرداخت‌شده" value={form.paidAmount || ''} onChange={e => setForm({...form, paidAmount: Number(e.target.value)})}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm mb-1">درصد پیشرفت: {form.progress}%</label>
                <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm({...form, progress: Number(e.target.value)})} className="w-full" />
              </div>
              <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={3} />
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
