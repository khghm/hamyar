import React, { useState } from 'react';
import { useApp, Project } from '../../store';
import { Plus, X, Edit, Trash2, Kanban, List, Calendar, DollarSign, User, Clock, AlertCircle } from 'lucide-react';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export default function AdminProjects() {
  const { darkMode, projects, setProjects } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [form, setForm] = useState<Partial<Project>>({ 
    title: '', clientName: '', type: 'فروشگاهی', stage: 'مشاوره', 
    deadline: '', totalCost: 0, paidAmount: 0, progress: 0, description: '' 
  });

  const stages = ['مشاوره', 'قرارداد', 'پیش‌پرداخت', 'طراحی', 'تایید', 'راه‌اندازی', 'تحویل', 'تسویه'];
  
  const filteredStages = activeStageFilter === 'all' ? stages : [activeStageFilter];

  const stageColors: Record<string, string> = {
    'مشاوره': 'from-blue-500 to-blue-600',
    'قرارداد': 'from-purple-500 to-purple-600',
    'پیش‌پرداخت': 'from-indigo-500 to-indigo-600',
    'طراحی': 'from-cyan-500 to-cyan-600',
    'تایید': 'from-teal-500 to-teal-600',
    'راه‌اندازی': 'from-orange-500 to-orange-600',
    'تحویل': 'from-green-500 to-green-600',
    'تسویه': 'from-emerald-500 to-emerald-600',
  };

  const stageBgColors: Record<string, string> = {
    'مشاوره': darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
    'قرارداد': darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200',
    'پیش‌پرداخت': darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200',
    'طراحی': darkMode ? 'bg-cyan-900/20 border-cyan-800' : 'bg-cyan-50 border-cyan-200',
    'تایید': darkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200',
    'راه‌اندازی': darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200',
    'تحویل': darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
    'تسویه': darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200',
  };

  const openNew = () => { 
    setForm({ title: '', clientName: '', type: 'فروشگاهی', stage: 'مشاوره', deadline: '', totalCost: 0, paidAmount: 0, progress: 0, description: '' }); 
    setEditId(null); 
    setShowForm(true); 
  };
  
  const openEdit = (p: Project) => { 
    setForm(p); 
    setEditId(p.id); 
    setShowForm(true); 
  };

  const save = () => {
    if (editId) {
      setProjects(projects.map(p => p.id === editId ? { ...p, ...form } as Project : p));
    } else {
      setProjects([...projects, { ...form, id: 'pr' + Date.now() } as Project]);
    }
    setShowForm(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    const project = projects.find(p => p.id === projectId);
    if (project && project.stage !== stage) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, stage } : p));
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isOverdue = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Stats
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => !['تحویل', 'تسویه'].includes(p.stage)).length,
    completed: projects.filter(p => ['تحویل', 'تسویه'].includes(p.stage)).length,
    overdue: projects.filter(p => isOverdue(p.deadline) && !['تحویل', 'تسویه'].includes(p.stage)).length,
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">پروژه‌های طراحی سایت</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 flex items-center gap-2 text-sm ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}
            >
              <Kanban size={16} /> کانبان
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}
            >
              <List size={16} /> لیست
            </button>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> پروژه جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل پروژه‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در حال انجام</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تکمیل شده</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عقب‌افتاده</div>
        </div>
      </div>

      {/* Stage Filter Tabs */}
      {viewMode === 'kanban' && (
        <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveStageFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeStageFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              همه مراحل
            </button>
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => setActiveStageFilter(stage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeStageFilter === stage
                    ? `bg-gradient-to-l ${stageColors[stage]} text-white`
                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {stage} ({projects.filter(p => p.stage === stage).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className={`grid gap-4 ${
          filteredStages.length === 1 ? 'grid-cols-1' :
          filteredStages.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          filteredStages.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
          filteredStages.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {filteredStages.map(stage => {
            const stageProjects = projects.filter(p => p.stage === stage);
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, stage)}
                className={`rounded-xl border-2 border-dashed transition-all ${
                  darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {/* Stage Header */}
                <div className={`p-3 rounded-t-xl bg-gradient-to-l ${stageColors[stage]} text-white`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">{stage}</h3>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {stageProjects.length}
                    </span>
                  </div>
                </div>

                {/* Projects List */}
                <div className="p-3 space-y-3 min-h-[200px] max-h-[500px] overflow-y-auto">
                  {stageProjects.map(project => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={e => handleDragStart(e, project.id)}
                      className={`p-3 rounded-lg border cursor-move transition-all hover:shadow-lg ${
                        darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                      } ${isOverdue(project.deadline) ? 'ring-2 ring-red-500' : ''}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm flex-1">{project.title}</h4>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(project)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setProjects(projects.filter(x => x.id !== project.id))} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-2 mb-2">
                        <User size={12} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{project.clientName}</span>
                      </div>

                      {/* Type Badge */}
                      <div className="mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                          {project.type}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>پیشرفت</span>
                          <span className="font-bold">{project.progress}%</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-full rounded-full transition-all ${getProgressColor(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className={`p-2 rounded-lg mb-2 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>هزینه:</span>
                          <span className="font-bold">{project.totalCost.toLocaleString('fa-IR')} ت</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>پرداخت:</span>
                          <span className="font-bold text-green-600">{project.paidAmount.toLocaleString('fa-IR')} ت</span>
                        </div>
                      </div>

                      {/* Deadline */}
                      {project.deadline && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue(project.deadline) ? 'text-red-500' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isOverdue(project.deadline) ? <AlertCircle size={12} /> : <Calendar size={12} />}
                          <span>{isOverdue(project.deadline) ? 'عقب‌افتاده: ' : 'تحویل: '}{project.deadline}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {stageProjects.length === 0 && (
                    <div className={`text-center py-8 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      پروژه‌ای وجود ندارد
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">عنوان</th>
                  <th className="text-right p-3">مشتری</th>
                  <th className="text-right p-3">نوع</th>
                  <th className="text-right p-3">مرحله</th>
                  <th className="text-right p-3">پیشرفت</th>
                  <th className="text-right p-3">هزینه</th>
                  <th className="text-right p-3">تحویل</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-medium">{p.title}</td>
                    <td className="p-3">{p.clientName}</td>
                    <td className="p-3">{p.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs bg-gradient-to-l ${stageColors[p.stage]} text-white`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-20 h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div className={`h-full rounded-full ${getProgressColor(p.progress)}`} style={{ width: `${p.progress}%` }}></div>
                        </div>
                        <span className="text-xs">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3">{p.totalCost.toLocaleString('fa-IR')}</td>
                    <td className={`p-3 text-xs ${isOverdue(p.deadline) ? 'text-red-500 font-bold' : ''}`}>{p.deadline}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 text-xs hover:underline">ویرایش</button>
                      <button onClick={() => setProjects(projects.filter(x => x.id !== p.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروژه‌ای ثبت نشده</p>
        </div>
      )}

      {/* Form Modal */}
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
              <JalaliDatePicker value={form.deadline || ''} onChange={date => setForm({...form, deadline: date})}
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
