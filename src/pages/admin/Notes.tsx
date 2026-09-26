import React, { useState } from 'react';
import { useApp, Note } from '../../store';
import { Plus, Search, Edit, Trash2, X, CheckCircle, Clock, AlertCircle, Tag, Calendar, User, Phone, FileText } from 'lucide-react';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export default function AdminNotes() {
  const { darkMode, notes, setNotes } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState<Partial<Note>>({
    title: '',
    customerName: '',
    customerPhone: '',
    task: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    content: '',
    tags: []
  });

  const priorityLabels: Record<string, string> = { low: 'کم', medium: 'متوسط', high: 'بالا', urgent: 'فوری' };
  const priorityColors: Record<string, string> = { 
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', 
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', 
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
  };
  const statusLabels: Record<string, string> = { pending: 'در انتظار', 'in-progress': 'در حال انجام', done: 'انجام شده' };
  const statusColors: Record<string, string> = { 
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', 
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
  };

  const filtered = notes.filter(n => {
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (search && !n.title.includes(search) && !n.customerName.includes(search) && !n.task.includes(search)) return false;
    return true;
  });

  const openNew = () => { 
    setForm({ title: '', customerName: '', customerPhone: '', task: '', priority: 'medium', status: 'pending', dueDate: '', content: '', tags: [] }); 
    setEditId(null); 
    setShowForm(true); 
  };
  
  const openEdit = (n: Note) => { 
    setForm(n); 
    setEditId(n.id); 
    setShowForm(true); 
  };

  const save = () => {
    if (editId) {
      setNotes(notes.map(n => n.id === editId ? { ...n, ...form, completedAt: form.status === 'done' && !n.completedAt ? new Date().toISOString() : n.completedAt } as Note : n));
    } else {
      setNotes([...notes, { 
        ...form, 
        id: 'note' + Date.now(), 
        createdAt: new Date().toISOString(),
        completedAt: form.status === 'done' ? new Date().toISOString() : undefined
      } as Note]);
    }
    setShowForm(false);
  };

  const deleteNote = (id: string) => {
    if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setNotes(notes.map(n => {
      if (n.id === id) {
        const newStatus = n.status === 'done' ? 'pending' : n.status === 'pending' ? 'in-progress' : 'done';
        return { ...n, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : undefined };
      }
      return n;
    }));
  };

  const stats = {
    total: notes.length,
    pending: notes.filter(n => n.status === 'pending').length,
    inProgress: notes.filter(n => n.status === 'in-progress').length,
    done: notes.filter(n => n.status === 'done').length,
    urgent: notes.filter(n => n.priority === 'urgent' && n.status !== 'done').length,
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">یادداشت‌های شخصی</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> یادداشت جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل یادداشت‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در انتظار</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در حال انجام</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>انجام شده</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فوری</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="جستجو در یادداشت‌ها..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className={`px-3 py-2.5 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه اولویت‌ها</option>
          {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2.5 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filtered.map(note => (
          <div key={note.id} className={`p-5 rounded-xl border transition-all hover:shadow-md ${
            note.priority === 'urgent' && note.status !== 'done' 
              ? darkMode ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'
              : darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-bold text-lg">{note.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[note.priority]}`}>
                    {priorityLabels[note.priority]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[note.status]}`}>
                    {statusLabels[note.status]}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {note.customerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-slate-400" />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{note.customerName}</span>
                    </div>
                  )}
                  {note.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-slate-400" />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'} dir="ltr">{note.customerPhone}</span>
                    </div>
                  )}
                  {note.dueDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-slate-400" />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{note.dueDate}</span>
                    </div>
                  )}
                </div>

                <div className={`mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <p className="text-sm font-medium mb-1">وظیفه:</p>
                  <p className="text-sm">{note.task}</p>
                </div>

                {note.content && (
                  <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                )}

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  ایجاد: {new Date(note.createdAt).toLocaleDateString('fa-IR')}
                  {note.completedAt && ` | تکمیل: ${new Date(note.completedAt).toLocaleDateString('fa-IR')}`}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => toggleStatus(note.id)} 
                  className={`p-2 rounded-lg transition-all ${
                    note.status === 'done' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                      : darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`} title="تغییر وضعیت">
                  <CheckCircle size={18} />
                </button>
                <button onClick={() => openEdit(note)} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-blue-400' : 'bg-gray-100 hover:bg-gray-200 text-blue-600'}`} title="ویرایش">
                  <Edit size={18} />
                </button>
                <button onClick={() => deleteNote(note.id)} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-red-400' : 'bg-gray-100 hover:bg-gray-200 text-red-600'}`} title="حذف">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>یادداشتی یافت نشد</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش یادداشت' : 'یادداشت جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">عنوان یادداشت *</label>
                <input type="text" placeholder="مثال: پرینت مدارک آقای احمدی" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">نام مشتری</label>
                  <input type="text" placeholder="نام و نام خانوادگی" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">شماره تماس مشتری</label>
                  <input type="tel" placeholder="09123456789" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} dir="ltr"
                    className={`w-full px-3 py-2 rounded-lg border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">شرح وظیفه *</label>
                <textarea placeholder="چه کاری باید انجام شود؟" value={form.task} onChange={e => setForm({...form, task: e.target.value})} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">اولویت</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">وضعیت</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">مهلت انجام</label>
                  <JalaliDatePicker value={form.dueDate || ''} onChange={date => setForm({...form, dueDate: date})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">توضیحات اضافی</label>
                <textarea placeholder="هرگونه توضیح اضافه..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">برچسب‌ها (با کاما جدا کنید)</label>
                <input type="text" placeholder="پرینت, فوری, مشتری VIP" value={(form.tags || []).join(', ')} 
                  onChange={e => setForm({...form, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
                  {editId ? 'بروزرسانی' : 'ذخیره یادداشت'}
                </button>
                <button onClick={() => setShowForm(false)} className={`px-6 py-2.5 rounded-lg border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
