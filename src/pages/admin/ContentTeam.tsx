import React, { useState } from 'react';
import { useApp, ContentProject } from '../../store';
import { Plus, X, Edit, Trash2, Film, Camera, FileText, Share2, Megaphone, Calendar, Users, Clock, AlertCircle } from 'lucide-react';

export default function AdminContentTeam() {
  const { darkMode, contentProjects, setContentProjects, employees } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState<Partial<ContentProject>>({
    title: '',
    type: 'video',
    scenario: '',
    equipment: [],
    contentPlan: '',
    assignedTo: [],
    startDate: '',
    deadline: '',
    status: 'planning',
    priority: 'medium',
    notes: ''
  });

  const typeLabels: Record<string, string> = {
    video: 'ویدئو',
    photo: 'عکاسی',
    article: 'مقاله',
    social: 'شبکه اجتماعی',
    ad: 'تبلیغات'
  };

  const typeIcons: Record<string, any> = {
    video: Film,
    photo: Camera,
    article: FileText,
    social: Share2,
    ad: Megaphone
  };

  const statusLabels: Record<string, string> = {
    planning: 'برنامه‌ریزی',
    'in-progress': 'در حال انجام',
    review: 'بازبینی',
    completed: 'تکمیل شده'
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  };

  const priorityLabels: Record<string, string> = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا',
    urgent: 'فوری'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };

  const filtered = contentProjects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterType !== 'all' && p.type !== filterType) return false;
    return true;
  });

  const openNew = () => {
    setForm({
      title: '',
      type: 'video',
      scenario: '',
      equipment: [],
      contentPlan: '',
      assignedTo: [],
      startDate: '',
      deadline: '',
      status: 'planning',
      priority: 'medium',
      notes: ''
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p: ContentProject) => {
    setForm(p);
    setEditId(p.id);
    setShowForm(true);
  };

  const save = () => {
    if (editId) {
      setContentProjects(contentProjects.map(p => p.id === editId ? { ...p, ...form } as ContentProject : p));
    } else {
      setContentProjects([...contentProjects, { ...form, id: 'cp' + Date.now(), createdAt: new Date().toISOString() } as ContentProject]);
    }
    setShowForm(false);
  };

  const stats = {
    total: contentProjects.length,
    planning: contentProjects.filter(p => p.status === 'planning').length,
    inProgress: contentProjects.filter(p => p.status === 'in-progress').length,
    review: contentProjects.filter(p => p.status === 'review').length,
    completed: contentProjects.filter(p => p.status === 'completed').length,
    urgent: contentProjects.filter(p => p.priority === 'urgent' && p.status !== 'completed').length
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت تیم تولید محتوا</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> پروژه جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل پروژه‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.planning}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>برنامه‌ریزی</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در حال انجام</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.review}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>بازبینی</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تکمیل شده</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فوری</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه انواع</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(project => {
          const TypeIcon = typeIcons[project.type];
          return (
            <div key={project.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <TypeIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{project.title}</h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{typeLabels[project.type]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(project)} className="text-blue-600 hover:underline text-xs">ویرایش</button>
                  <button onClick={() => setContentProjects(contentProjects.filter(x => x.id !== project.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[project.priority]}`}>
                  {priorityLabels[project.priority]}
                </span>
              </div>

              {project.scenario && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سناریو:</p>
                  <p className="text-sm line-clamp-2">{project.scenario}</p>
                </div>
              )}

              {project.equipment.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تجهیزات:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.equipment.map((eq, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.assignedTo.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مسئولین:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.assignedTo.map((empId, i) => {
                      const emp = employees.find(e => e.id === empId);
                      return emp ? (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {emp.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs">
                {project.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                    <span>شروع: {project.startDate}</span>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-red-500" />
                    <span className="text-red-500">تحویل: {project.deadline}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Film size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروژه‌ای یافت نشد</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش پروژه' : 'پروژه جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">عنوان پروژه *</label>
                <input type="text" placeholder="مثال: ویدئو معرفی محصولات جدید" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">نوع محتوا</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">اولویت</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">سناریو</label>
                <textarea placeholder="توضیح کامل سناریوی پروژه..." value={form.scenario} onChange={e => setForm({...form, scenario: e.target.value})} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">تجهیزات مورد نیاز (با کاما جدا کنید)</label>
                <input type="text" placeholder="دوربین، نور، میکروفون، ..." value={(form.equipment || []).join(', ')}
                  onChange={e => setForm({...form, equipment: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">برنامه‌ریزی محتوا</label>
                <textarea placeholder="جزئیات برنامه‌ریزی محتوا..." value={form.contentPlan} onChange={e => setForm({...form, contentPlan: e.target.value})} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">مسئولین پروژه</label>
                <div className="flex flex-wrap gap-2">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={(form.assignedTo || []).includes(emp.id)}
                        onChange={e => {
                          const assigned = form.assignedTo || [];
                          if (e.target.checked) setForm({...form, assignedTo: [...assigned, emp.id]});
                          else setForm({...form, assignedTo: assigned.filter(id => id !== emp.id)});
                        }} />
                      <span className="text-sm">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ شروع</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ تحویل</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">وضعیت</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">یادداشت‌ها</label>
                <textarea placeholder="یادداشت‌های اضافی..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
