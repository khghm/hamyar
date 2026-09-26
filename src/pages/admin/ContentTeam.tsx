import React, { useState, useMemo } from 'react';
import { useApp, ContentProject, ContentComment, ContentTemplate, ContentIdea } from '../../store';
import { 
  Plus, X, Edit, Trash2, Film, Camera, FileText, Share2, Megaphone, Calendar, Users, Clock, 
  AlertCircle, MessageSquare, Upload, CheckSquare, DollarSign, Tag, History, BarChart3, 
  Lightbulb, Bell, Download, BookOpen, Eye, ThumbsUp, ArrowRight, Filter, Kanban, List
} from 'lucide-react';
import { exportToExcel } from '../../utils/export';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export default function AdminContentTeam() {
  const { 
    darkMode, contentProjects, setContentProjects, contentComments, setContentComments,
    contentAssets, setContentAssets, contentTemplates, setContentTemplates,
    contentIdeas, setContentIdeas, brandBook, setBrandBook, employees, products, campaigns, currentUser
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('projects');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  
  const [form, setForm] = useState<Partial<ContentProject>>({
    title: '', type: 'video', scenario: '', equipment: [], contentPlan: '',
    assignedTo: [], startDate: '', deadline: '', publishDate: '', publishPlatform: [],
    status: 'planning', priority: 'medium', notes: '', tags: [],
    relatedProducts: [], relatedCampaigns: [], budget: 0, actualCost: 0,
    qualityScore: 0, qualityChecklist: [], approvalStage: 'draft', versions: []
  });

  const tabs = [
    { id: 'projects', label: 'پروژه‌ها', icon: Film },
    { id: 'calendar', label: 'تقویم محتوایی', icon: Calendar },
    { id: 'templates', label: 'قالب‌ها', icon: FileText },
    { id: 'ideas', label: 'ایده‌ها', icon: Lightbulb },
    { id: 'assets', label: 'منابع', icon: Upload },
    { id: 'brandbook', label: 'برند بوک', icon: BookOpen },
    { id: 'performance', label: 'عملکرد تیم', icon: BarChart3 },
    { id: 'reports', label: 'گزارش‌ها', icon: Download },
  ];

  const typeLabels: Record<string, string> = { video: 'ویدئو', photo: 'عکاسی', article: 'مقاله', social: 'شبکه اجتماعی', ad: 'تبلیغات' };
  const typeIcons: Record<string, any> = { video: Film, photo: Camera, article: FileText, social: Share2, ad: Megaphone };
  const statusLabels: Record<string, string> = { planning: 'برنامه‌ریزی', 'in-progress': 'در حال انجام', review: 'بازبینی', completed: 'تکمیل شده', published: 'منتشر شده' };
  const statusColors: Record<string, string> = { 
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };
  const priorityLabels: Record<string, string> = { low: 'کم', medium: 'متوسط', high: 'بالا', urgent: 'فوری' };
  const priorityColors: Record<string, string> = { 
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };
  const approvalLabels: Record<string, string> = { draft: 'پیش‌نویس', 'content-manager': 'مدیر محتوا', ceo: 'مدیر کل', client: 'مشتری', approved: 'تایید شده' };

  const filtered = useMemo(() => contentProjects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterType !== 'all' && p.type !== filterType) return false;
    return true;
  }), [contentProjects, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total: contentProjects.length,
    planning: contentProjects.filter(p => p.status === 'planning').length,
    inProgress: contentProjects.filter(p => p.status === 'in-progress').length,
    review: contentProjects.filter(p => p.status === 'review').length,
    completed: contentProjects.filter(p => p.status === 'completed').length,
    published: contentProjects.filter(p => p.status === 'published').length,
    urgent: contentProjects.filter(p => p.priority === 'urgent' && p.status !== 'completed').length,
    totalBudget: contentProjects.reduce((s, p) => s + (p.budget || 0), 0),
    totalCost: contentProjects.reduce((s, p) => s + (p.actualCost || 0), 0),
    avgQuality: contentProjects.length > 0 ? contentProjects.reduce((s, p) => s + (p.qualityScore || 0), 0) / contentProjects.length : 0,
  }), [contentProjects]);

  // Calendar view
  const calendarDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayProjects = contentProjects.filter(p => p.startDate === dateStr || p.deadline === dateStr || p.publishDate === dateStr);
      days.push({ date: dateStr, day: date.getDate(), projects: dayProjects, isToday: i === 0 });
    }
    return days;
  }, [contentProjects]);

  const openNew = () => {
    setForm({
      title: '', type: 'video', scenario: '', equipment: [], contentPlan: '',
      assignedTo: [], startDate: '', deadline: '', publishDate: '', publishPlatform: [],
      status: 'planning', priority: 'medium', notes: '', tags: [],
      relatedProducts: [], relatedCampaigns: [], budget: 0, actualCost: 0,
      qualityScore: 0, qualityChecklist: [
        { item: 'کیفیت تصویر/ویدئو', checked: false },
        { item: 'رعایت برند بوک', checked: false },
        { item: 'صحت اطلاعات', checked: false },
        { item: 'بهینه‌سازی SEO', checked: false },
        { item: 'مناسب برای پلتفرم هدف', checked: false },
      ],
      approvalStage: 'draft', versions: []
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
    const qualityScore = form.qualityChecklist && form.qualityChecklist.length > 0
      ? Math.round((form.qualityChecklist.filter(c => c.checked).length / form.qualityChecklist.length) * 100)
      : 0;
    
    if (editId) {
      const existing = contentProjects.find(p => p.id === editId);
      const newVersion = {
        version: (existing?.versions?.length || 0) + 1,
        date: new Date().toISOString(),
        notes: 'ویرایش',
        data: form
      };
      setContentProjects(contentProjects.map(p => p.id === editId ? { 
        ...p, ...form, qualityScore,
        versions: [...(p.versions || []), newVersion]
      } as ContentProject : p));
    } else {
      setContentProjects([...contentProjects, { 
        ...form, id: 'cp' + Date.now(), createdAt: new Date().toISOString(), qualityScore,
        versions: [{ version: 1, date: new Date().toISOString(), notes: 'ایجاد اولیه', data: form }]
      } as ContentProject]);
    }
    setShowForm(false);
  };

  const loadTemplate = (template: ContentTemplate) => {
    setForm({
      ...form,
      type: template.type,
      scenario: template.scenario,
      equipment: template.equipment,
      contentPlan: template.contentPlan,
      qualityChecklist: template.qualityChecklist.map(item => ({ item, checked: false }))
    });
  };

  const addComment = (projectId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const mentions = text.match(/@(\w+)/g) || [];
    const comment: ContentComment = {
      id: 'cc' + Date.now(),
      projectId,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      mentions: mentions.map(m => m.substring(1)),
      resolved: false,
      createdAt: new Date().toISOString()
    };
    setContentComments([...contentComments, comment]);
  };

  const voteIdea = (ideaId: string) => {
    if (!currentUser) return;
    setContentIdeas(contentIdeas.map(i => {
      if (i.id === ideaId) {
        const voted = i.votedBy.includes(currentUser.id);
        return {
          ...i,
          votes: voted ? i.votes - 1 : i.votes + 1,
          votedBy: voted ? i.votedBy.filter(id => id !== currentUser.id) : [...i.votedBy, currentUser.id]
        };
      }
      return i;
    }));
  };

  const convertIdeaToProject = (ideaId: string) => {
    const idea = contentIdeas.find(i => i.id === ideaId);
    if (!idea) return;
    const newProject: ContentProject = {
      id: 'cp' + Date.now(),
      title: idea.title,
      type: 'video',
      scenario: idea.description,
      equipment: [],
      contentPlan: '',
      assignedTo: [],
      startDate: '',
      deadline: '',
      status: 'planning',
      priority: 'medium',
      notes: '',
      tags: [],
      relatedProducts: [],
      relatedCampaigns: [],
      budget: 0,
      actualCost: 0,
      qualityScore: 0,
      qualityChecklist: [],
      approvalStage: 'draft',
      versions: [],
      createdAt: new Date().toISOString()
    };
    setContentProjects([...contentProjects, newProject]);
    setContentIdeas(contentIdeas.map(i => i.id === ideaId ? { ...i, status: 'converted', convertedToProjectId: newProject.id } : i));
  };

  const exportReport = () => {
    const headers = ['عنوان پروژه', 'نوع', 'وضعیت', 'اولویت', 'تاریخ شروع', 'تاریخ تحویل', 'بودجه', 'هزینه واقعی', 'امتیاز کیفیت'];
    const rows = contentProjects.map(p => [
      p.title,
      p.type,
      p.status,
      p.priority,
      p.startDate || '',
      p.deadline || '',
      (p.budget || 0).toLocaleString('fa-IR'),
      (p.actualCost || 0).toLocaleString('fa-IR'),
      (p.qualityScore || 0).toString() + '%'
    ]);
    exportToExcel('content-team-report', headers, rows, 'گزارش تیم تولید محتوا');
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">مدیریت تیم تولید محتوا</h1>
        <div className="flex gap-2">
          <button onClick={exportReport} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <Download size={16} /> خروجی گزارش
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> پروژه جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل پروژه‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در حال انجام</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فوری</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.totalBudget.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>بودجه کل (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{Math.round(stats.avgQuality)}%</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین کیفیت</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
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
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <Kanban size={14} /> کانبان
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <List size={14} /> لیست
              </button>
            </div>
          </div>

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="space-y-4">
              {/* Stage Filter Tabs */}
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
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveStageFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        activeStageFilter === key
                          ? statusColors[key]
                          : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      {label} ({contentProjects.filter(p => p.status === key).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Kanban Board */}
              <div className={`grid gap-4 ${
                activeStageFilter === 'all' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {(activeStageFilter === 'all' ? Object.keys(statusLabels) : [activeStageFilter]).map(status => {
                  const statusProjects = filtered.filter(p => p.status === status);
                  return (
                    <div
                      key={status}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const projectId = e.dataTransfer.getData('projectId');
                        const project = contentProjects.find(p => p.id === projectId);
                        if (project && project.status !== status) {
                          setContentProjects(contentProjects.map(p => p.id === projectId ? { ...p, status: status as any } : p));
                        }
                      }}
                      className={`rounded-xl border-2 border-dashed transition-all ${
                        darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {/* Status Header */}
                      <div className={`p-3 rounded-t-xl ${statusColors[status]}`}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm">{statusLabels[status]}</h3>
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                            {statusProjects.length}
                          </span>
                        </div>
                      </div>

                      {/* Projects List */}
                      <div className="p-3 space-y-3 min-h-[200px] max-h-[500px] overflow-y-auto">
                        {statusProjects.map(project => {
                          const TypeIcon = typeIcons[project.type];
                          return (
                            <div
                              key={project.id}
                              draggable
                              onDragStart={e => e.dataTransfer.setData('projectId', project.id)}
                              className={`p-3 rounded-lg border cursor-move transition-all hover:shadow-lg ${
                                darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <TypeIcon size={16} className="text-blue-600" />
                                  <h4 className="font-bold text-sm flex-1">{project.title}</h4>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => setSelectedProject(project.id)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded">
                                    <Eye size={14} />
                                  </button>
                                  <button onClick={() => openEdit(project)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded">
                                    <Edit size={14} />
                                  </button>
                                  <button onClick={() => setContentProjects(contentProjects.filter(x => x.id !== project.id))} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Type Badge */}
                              <div className="mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                                  {typeLabels[project.type]}
                                </span>
                              </div>

                              {/* Priority */}
                              <div className="mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[project.priority]}`}>
                                  {priorityLabels[project.priority]}
                                </span>
                              </div>

                              {/* Assigned To */}
                              {project.assignedTo.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-1 text-xs">
                                    <Users size={12} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                                      {project.assignedTo.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join('، ')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Budget */}
                              {project.budget > 0 && (
                                <div className={`p-2 rounded-lg mb-2 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>بودجه:</span>
                                    <span className="font-bold">{project.budget.toLocaleString('fa-IR')} ت</span>
                                  </div>
                                  {project.actualCost > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>هزینه:</span>
                                      <span className="font-bold text-orange-600">{project.actualCost.toLocaleString('fa-IR')} ت</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Deadline */}
                              {project.deadline && (
                                <div className={`flex items-center gap-1 text-xs ${
                                  new Date(project.deadline) < new Date() && project.status !== 'completed' && project.status !== 'published'
                                    ? 'text-red-500' 
                                    : darkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                  {new Date(project.deadline) < new Date() && project.status !== 'completed' && project.status !== 'published' ? (
                                    <AlertCircle size={12} />
                                  ) : (
                                    <Calendar size={12} />
                                  )}
                                  <span>تحویل: {project.deadline}</span>
                                </div>
                              )}

                              {/* Quality Score */}
                              {project.qualityScore > 0 && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کیفیت</span>
                                    <span className="font-bold">{project.qualityScore}%</span>
                                  </div>
                                  <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        project.qualityScore >= 80 ? 'bg-green-500' :
                                        project.qualityScore >= 50 ? 'bg-blue-500' :
                                        project.qualityScore >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${project.qualityScore}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {statusProjects.length === 0 && (
                          <div className={`text-center py-8 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            پروژه‌ای وجود ندارد
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(project => {
                const TypeIcon = typeIcons[project.type];
                const projectComments = contentComments.filter(c => c.projectId === project.id);
                const openComments = projectComments.filter(c => !c.resolved).length;
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
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedProject(project.id)} className="text-blue-600 hover:underline text-xs">جزئیات</button>
                        <button onClick={() => openEdit(project)} className="text-green-600 hover:underline text-xs">ویرایش</button>
                        <button onClick={() => setContentProjects(contentProjects.filter(x => x.id !== project.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>{statusLabels[project.status]}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[project.priority]}`}>{priorityLabels[project.priority]}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>{approvalLabels[project.approvalStage]}</span>
                      {project.qualityScore > 0 && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${project.qualityScore >= 80 ? 'bg-green-100 text-green-700' : project.qualityScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          کیفیت: {project.qualityScore}%
                        </span>
                      )}
                      {openComments > 0 && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                          <MessageSquare size={10} /> {openComments}
                        </span>
                      )}
                    </div>

                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.map((tag, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs">
                      {project.startDate && <div className="flex items-center gap-1"><Calendar size={12} /><span>شروع: {project.startDate}</span></div>}
                      {project.deadline && <div className="flex items-center gap-1"><Clock size={12} className="text-red-500" /><span className="text-red-500">تحویل: {project.deadline}</span></div>}
                      {project.budget > 0 && <div className="flex items-center gap-1"><DollarSign size={12} /><span>بودجه: {project.budget.toLocaleString('fa-IR')}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">تقویم محتوایی</h3>
          <div className="grid grid-cols-7 gap-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => (
              <div key={d} className="text-center text-xs font-bold p-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <div key={i} className={`p-2 rounded-lg min-h-[100px] ${day.isToday ? 'ring-2 ring-blue-500' : ''} ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className={`text-xs font-bold mb-1 ${day.isToday ? 'text-blue-600' : ''}`}>{day.day}</div>
                {day.projects.map(p => (
                  <div key={p.id} className={`text-[10px] px-1 py-0.5 rounded mb-1 truncate cursor-pointer ${statusColors[p.status]}`} onClick={() => setSelectedProject(p.id)}>
                    {p.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <button onClick={() => {
            const name = prompt('نام قالب:');
            if (name) {
              setContentTemplates([...contentTemplates, {
                id: 't' + Date.now(), name, type: 'video', scenario: '', equipment: [], contentPlan: '',
                qualityChecklist: [], createdAt: new Date().toISOString()
              }]);
            }
          }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">قالب جدید</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentTemplates.map(t => (
              <div key={t.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{t.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { loadTemplate(t); openNew(); }} className="text-blue-600 text-xs">استفاده</button>
                    <button onClick={() => setContentTemplates(contentTemplates.filter(x => x.id !== t.id))} className="text-red-500 text-xs">حذف</button>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>{typeLabels[t.type]}</span>
                {t.scenario && <p className={`text-sm mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.scenario}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ideas Tab */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          <button onClick={() => {
            const title = prompt('عنوان ایده:');
            if (title) {
              const description = prompt('توضیحات:') || '';
              setContentIdeas([...contentIdeas, {
                id: 'ci' + Date.now(), title, description, type: 'general', votes: 0, votedBy: [],
                status: 'new', createdBy: currentUser?.name || 'ناشناس', createdAt: new Date().toISOString()
              }]);
            }
          }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">ایده جدید</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentIdeas.map(idea => (
              <div key={idea.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{idea.title}</h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>توسط: {idea.createdBy}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    idea.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    idea.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    idea.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {idea.status === 'new' ? 'جدید' : idea.status === 'accepted' ? 'پذیرفته' : idea.status === 'rejected' ? 'رد شده' : 'تبدیل شده'}
                  </span>
                </div>
                <p className={`text-sm mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{idea.description}</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => voteIdea(idea.id)} className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                    currentUser && idea.votedBy.includes(currentUser.id) ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-gray-100'
                  }`}>
                    <ThumbsUp size={14} /> {idea.votes}
                  </button>
                  {idea.status === 'accepted' && (
                    <button onClick={() => convertIdeaToProject(idea.id)} className="text-blue-600 text-xs flex items-center gap-1">
                      تبدیل به پروژه <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e: any) => {
              const files = Array.from(e.target.files) as File[];
              const newAssets: any[] = [];
              let loaded = 0;
              files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  newAssets.push({
                    id: 'ca' + Date.now() + Math.random() + loaded,
                    projectId: '',
                    name: file.name,
                    type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'document',
                    url: ev.target?.result as string,
                    size: file.size,
                    uploadedBy: currentUser?.name || '',
                    uploadedAt: new Date().toISOString()
                  });
                  loaded++;
                  if (loaded === files.length) {
                    setContentAssets([...contentAssets, ...newAssets]);
                  }
                };
                reader.readAsDataURL(file);
              });
            };
            input.click();
          }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2">
            <Upload size={16} /> آپلود فایل
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contentAssets.map(asset => (
              <div key={asset.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {asset.type === 'image' && <img src={asset.url} alt={asset.name} className="w-full h-32 object-cover rounded mb-2" />}
                <p className="text-xs font-medium truncate">{asset.name}</p>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{(asset.size / 1024).toFixed(1)} KB</p>
                <button onClick={() => setContentAssets(contentAssets.filter(x => x.id !== asset.id))} className="text-red-500 text-xs mt-1">حذف</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Book Tab */}
      {activeTab === 'brandbook' && (
        <div className={`p-6 rounded-xl border space-y-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold text-lg">برند بوک و راهنمای استایل</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">رنگ اصلی</label>
              <input type="color" value={brandBook.primaryColor} onChange={e => setBrandBook({...brandBook, primaryColor: e.target.value})} className="w-full h-10 rounded" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">رنگ ثانویه</label>
              <input type="color" value={brandBook.secondaryColor} onChange={e => setBrandBook({...brandBook, secondaryColor: e.target.value})} className="w-full h-10 rounded" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">رنگ تاکید</label>
              <input type="color" value={brandBook.accentColor} onChange={e => setBrandBook({...brandBook, accentColor: e.target.value})} className="w-full h-10 rounded" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">فونت‌ها (با کاما جدا کنید)</label>
            <input type="text" value={brandBook.fonts.join(', ')} onChange={e => setBrandBook({...brandBook, fonts: e.target.value.split(',').map(f => f.trim())})}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">لحن برند</label>
            <input type="text" value={brandBook.tone} onChange={e => setBrandBook({...brandBook, tone: e.target.value})}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">راهنمای استایل</label>
            <textarea value={brandBook.guidelines} onChange={e => setBrandBook({...brandBook, guidelines: e.target.value})} rows={4}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold text-lg mb-4">عملکرد تیم</h3>
          <div className="space-y-3">
            {employees.map(emp => {
              const assigned = contentProjects.filter(p => p.assignedTo.includes(emp.id));
              const completed = assigned.filter(p => p.status === 'completed' || p.status === 'published');
              const inProgress = assigned.filter(p => p.status === 'in-progress');
              return (
                <div key={emp.id} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{emp.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>{emp.role}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><div className="font-bold text-blue-600">{assigned.length}</div><div className="text-xs text-slate-400">کل پروژه‌ها</div></div>
                    <div><div className="font-bold text-yellow-600">{inProgress.length}</div><div className="text-xs text-slate-400">در حال انجام</div></div>
                    <div><div className="font-bold text-green-600">{completed.length}</div><div className="text-xs text-slate-400">تکمیل شده</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4">گزارش‌های سیستم</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={exportReport} className={`p-4 rounded-lg border text-right ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2"><Download size={20} className="text-blue-600" /><span className="font-bold">گزارش کامل</span></div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خروجی JSON شامل تمام اطلاعات</p>
              </button>
              <button onClick={() => {
                const headers = ['نوع', 'وضعیت', 'اولویت', 'بودجه (تومان)', 'هزینه واقعی (تومان)', 'امتیاز کیفیت'];
                const rows = contentProjects.map(p => [
                  typeLabels[p.type],
                  statusLabels[p.status],
                  priorityLabels[p.priority],
                  (p.budget || 0).toLocaleString('fa-IR'),
                  (p.actualCost || 0).toLocaleString('fa-IR'),
                  (p.qualityScore || 0).toString() + '%'
                ]);
                exportToExcel('content-summary', headers, rows, 'خلاصه گزارش تیم محتوا');
              }} className={`p-4 rounded-lg border text-right ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2"><FileText size={20} className="text-green-600" /><span className="font-bold">گزارش خلاصه اکسل</span></div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خروجی اکسل با پشتیبانی فارسی</p>
              </button>
            </div>
          </div>
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold mb-4">آمار کلی</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-slate-400">کل پروژه‌ها</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <div className="text-xs text-slate-400">منتشر شده</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-purple-600">{stats.totalBudget.toLocaleString('fa-IR')}</div>
                <div className="text-xs text-slate-400">بودجه کل</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-orange-600">{stats.totalCost.toLocaleString('fa-IR')}</div>
                <div className="text-xs text-slate-400">هزینه واقعی</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (() => {
        const project = contentProjects.find(p => p.id === selectedProject);
        if (!project) return null;
        const projectComments = contentComments.filter(c => c.projectId === project.id);
        const projectAssets = contentAssets.filter(a => a.projectId === project.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProject(null)}>
            <div className={`w-full max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{project.title}</h3>
                <button onClick={() => setSelectedProject(null)}><X size={20} /></button>
              </div>
              
              {/* Approval Workflow */}
              <div className="mb-6">
                <h4 className="font-bold mb-2">مراحل تایید</h4>
                <div className="flex items-center gap-2">
                  {['draft', 'content-manager', 'ceo', 'client', 'approved'].map((stage, idx) => {
                    const currentIdx = ['draft', 'content-manager', 'ceo', 'client', 'approved'].indexOf(project.approvalStage);
                    const isCompleted = idx <= currentIdx;
                    return (
                      <React.Fragment key={stage}>
                        <div className={`flex-1 p-2 rounded text-center text-xs ${isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-slate-500'}`}>
                          {approvalLabels[stage]}
                        </div>
                        {idx < 4 && <div className={`w-4 h-0.5 ${isCompleted && idx < currentIdx ? 'bg-green-500' : darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Quality Checklist */}
              <div className="mb-6">
                <h4 className="font-bold mb-2">چک‌لیست کیفیت ({project.qualityScore}%)</h4>
                <div className="space-y-2">
                  {project.qualityChecklist.map((item, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={item.checked} onChange={() => {
                        const updated = [...project.qualityChecklist];
                        updated[i] = { ...item, checked: !item.checked };
                        setContentProjects(contentProjects.map(p => p.id === project.id ? { ...p, qualityChecklist: updated, qualityScore: Math.round((updated.filter(c => c.checked).length / updated.length) * 100) } : p));
                      }} />
                      <span className="text-sm">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <h4 className="font-bold mb-2">کامنت‌ها ({projectComments.length})</h4>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {projectComments.map(c => (
                    <div key={c.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{c.userName}</span>
                        <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString('fa-IR')}</span>
                      </div>
                      <p className="text-sm">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="کامنت جدید (برای منشن از @نام استفاده کنید)" id={`comment-${project.id}`}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <button onClick={() => {
                    const input = document.getElementById(`comment-${project.id}`) as HTMLInputElement;
                    if (input.value) {
                      addComment(project.id, input.value);
                      input.value = '';
                    }
                  }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">ارسال</button>
                </div>
              </div>

              {/* Versions */}
              {project.versions && project.versions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><History size={16} /> تاریخچه نسخه‌ها</h4>
                  <div className="space-y-2">
                    {project.versions.slice().reverse().map((v, i) => (
                      <div key={i} className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between">
                          <span className="font-bold">نسخه {v.version}</span>
                          <span className="text-xs text-slate-400">{new Date(v.date).toLocaleString('fa-IR')}</span>
                        </div>
                        <p className="text-xs text-slate-500">{v.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-slate-400 mb-1">بودجه</div>
                  <div className="font-bold text-blue-600">{project.budget.toLocaleString('fa-IR')} تومان</div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-slate-400 mb-1">هزینه واقعی</div>
                  <div className="font-bold text-orange-600">{project.actualCost.toLocaleString('fa-IR')} تومان</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش پروژه' : 'پروژه جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">عنوان *</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">نوع محتوا</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">سناریو</label>
                <textarea value={form.scenario} onChange={e => setForm({...form, scenario: e.target.value})} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">تجهیزات (با کاما جدا کنید)</label>
                <input type="text" value={(form.equipment || []).join(', ')} onChange={e => setForm({...form, equipment: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">برنامه‌ریزی محتوا</label>
                <textarea value={form.contentPlan} onChange={e => setForm({...form, contentPlan: e.target.value})} rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ شروع</label>
                  <JalaliDatePicker value={form.startDate || ''} onChange={date => setForm({...form, startDate: date})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ تحویل</label>
                  <JalaliDatePicker value={form.deadline || ''} onChange={date => setForm({...form, deadline: date})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ انتشار</label>
                  <JalaliDatePicker value={form.publishDate || ''} onChange={date => setForm({...form, publishDate: date})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">وضعیت</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">اولویت</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">مرحله تایید</label>
                  <select value={form.approvalStage} onChange={e => setForm({...form, approvalStage: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(approvalLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">مسئولین</label>
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
                  <label className="text-sm font-medium block mb-1">بودجه (تومان)</label>
                  <input type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: Number(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">هزینه واقعی (تومان)</label>
                  <input type="number" value={form.actualCost || ''} onChange={e => setForm({...form, actualCost: Number(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">تگ‌ها (با کاما جدا کنید)</label>
                <input type="text" value={(form.tags || []).join(', ')} onChange={e => setForm({...form, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">پلتفرم‌های انتشار</label>
                <div className="flex flex-wrap gap-2">
                  {['اینستاگرام', 'ایتا', 'روبیکا', 'تلگرام', 'وب‌سایت', 'یوتیوب'].map(platform => (
                    <label key={platform} className="flex items-center gap-2">
                      <input type="checkbox" checked={(form.publishPlatform || []).includes(platform)}
                        onChange={e => {
                          const platforms = form.publishPlatform || [];
                          if (e.target.checked) setForm({...form, publishPlatform: [...platforms, platform]});
                          else setForm({...form, publishPlatform: platforms.filter(p => p !== platform)});
                        }} />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">چک‌لیست کیفیت</label>
                <div className="space-y-2">
                  {(form.qualityChecklist || []).map((item, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={item.checked} onChange={() => {
                        const updated = [...(form.qualityChecklist || [])];
                        updated[i] = { ...item, checked: !item.checked };
                        setForm({...form, qualityChecklist: updated});
                      }} />
                      <span className="text-sm">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">یادداشت‌ها</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
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
