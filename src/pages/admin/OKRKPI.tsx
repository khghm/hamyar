import React, { useState } from 'react';
import { useApp, OKR, KPI } from '../../store';
import { Target, TrendingUp, Award, Calendar, Filter, Plus, X, Edit, Trash2, BarChart3 } from 'lucide-react';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export default function AdminOKRKPI() {
  const { darkMode, okrs, setOkrs, kpis, setKpis, employees } = useApp();
  const [activeTab, setActiveTab] = useState<'okr' | 'kpi'>('okr');
  const [filter, setFilter] = useState<'all' | 'organizational' | 'employee'>('all');
  const [showOKRForm, setShowOKRForm] = useState(false);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [okrForm, setOkrForm] = useState<Partial<OKR>>({
    title: '',
    description: '',
    type: 'organizational',
    keyResults: [],
    startDate: '',
    endDate: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    status: 'active'
  });
  const [kpiForm, setKpiForm] = useState<Partial<KPI>>({
    title: '',
    description: '',
    category: 'sales',
    type: 'organizational',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const filteredOKRs = okrs.filter(o => filter === 'all' || o.type === filter);
  const filteredKPIs = kpis.filter(k => filter === 'all' || k.type === filter);

  const getOKRProgress = (okr: OKR) => {
    if (okr.keyResults.length === 0) return 0;
    const total = okr.keyResults.reduce((sum, kr) => {
      const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    return Math.round(total / okr.keyResults.length);
  };

  const getKPIProgress = (kpi: KPI) => {
    return kpi.targetValue > 0 ? Math.min(Math.round((kpi.currentValue / kpi.targetValue) * 100), 100) : 0;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const categoryLabels: Record<string, string> = {
    sales: 'فروش',
    marketing: 'بازاریابی',
    customer: 'مشتری',
    operations: 'عملیات',
    financial: 'مالی',
    digital: 'دیجیتال مارکتینگ'
  };

  const saveOKR = () => {
    if (okrForm.id) {
      setOkrs(okrs.map(o => o.id === okrForm.id ? { ...o, ...okrForm } as OKR : o));
    } else {
      setOkrs([...okrs, { ...okrForm, id: 'okr' + Date.now(), createdAt: new Date().toISOString() } as OKR]);
    }
    setShowOKRForm(false);
    setOkrForm({
      title: '',
      description: '',
      type: 'organizational',
      keyResults: [],
      startDate: '',
      endDate: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      status: 'active'
    });
  };

  const saveKPI = () => {
    if (kpiForm.id) {
      setKpis(kpis.map(k => k.id === kpiForm.id ? { ...k, ...kpiForm } as KPI : k));
    } else {
      setKpis([...kpis, { ...kpiForm, id: 'kpi' + Date.now(), createdAt: new Date().toISOString() } as KPI]);
    }
    setShowKPIForm(false);
    setKpiForm({
      title: '',
      description: '',
      category: 'sales',
      type: 'organizational',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      startDate: '',
      endDate: '',
      status: 'active'
    });
  };

  const addKeyResult = () => {
    setOkrForm({
      ...okrForm,
      keyResults: [...(okrForm.keyResults || []), { id: 'kr' + Date.now(), title: '', targetValue: 0, currentValue: 0, unit: '' }]
    });
  };

  const updateKeyResult = (index: number, field: string, value: any) => {
    const updated = [...(okrForm.keyResults || [])];
    updated[index] = { ...updated[index], [field]: value };
    setOkrForm({ ...okrForm, keyResults: updated });
  };

  const removeKeyResult = (index: number) => {
    setOkrForm({ ...okrForm, keyResults: okrForm.keyResults?.filter((_, i) => i !== index) || [] });
  };

  const stats = {
    totalOKRs: okrs.length,
    activeOKRs: okrs.filter(o => o.status === 'active').length,
    totalKPIs: kpis.length,
    activeKPIs: kpis.filter(k => k.status === 'active').length,
    avgOKRProgress: okrs.length > 0 ? Math.round(okrs.reduce((sum, o) => sum + getOKRProgress(o), 0) / okrs.length) : 0,
    avgKPIProgress: kpis.length > 0 ? Math.round(kpis.reduce((sum, k) => sum + getKPIProgress(k), 0) / kpis.length) : 0,
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award size={28} className="text-purple-600" />
          OKR و KPI سازمانی
        </h1>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab('okr'); setShowOKRForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">
            <Target size={16} /> OKR جدید
          </button>
          <button onClick={() => { setActiveTab('kpi'); setShowKPIForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700">
            <TrendingUp size={16} /> KPI جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.totalOKRs}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل OKR</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.activeOKRs}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>OKR فعال</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.avgOKRProgress}%</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین پیشرفت OKR</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-orange-600">{stats.totalKPIs}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل KPI</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.activeKPIs}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>KPI فعال</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-orange-600">{stats.avgKPIProgress}%</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین پیشرفت KPI</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('okr')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'okr' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-gray-200'}`}>
          <Target size={16} className="inline mr-2" /> OKR ها
        </button>
        <button onClick={() => setActiveTab('kpi')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'kpi' ? 'bg-orange-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-gray-200'}`}>
          <TrendingUp size={16} className="inline mr-2" /> KPI ها
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs ${filter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>همه</button>
        <button onClick={() => setFilter('organizational')} className={`px-3 py-1.5 rounded-lg text-xs ${filter === 'organizational' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>سازمانی</button>
        <button onClick={() => setFilter('employee')} className={`px-3 py-1.5 rounded-lg text-xs ${filter === 'employee' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>کارمندان</button>
      </div>

      {/* OKR List */}
      {activeTab === 'okr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOKRs.map(okr => {
            const progress = getOKRProgress(okr);
            const employee = okr.assignedTo ? employees.find(e => e.id === okr.assignedTo) : null;
            
            return (
              <div key={okr.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{okr.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{okr.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setOkrForm(okr); setShowOKRForm(true); }} className="text-blue-600 p-1"><Edit size={16} /></button>
                    <button onClick={() => setOkrs(okrs.filter(x => x.id !== okr.id))} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className={`px-2 py-1 rounded ${okr.type === 'organizational' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    {okr.type === 'organizational' ? 'سازمانی' : employee?.name}
                  </span>
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    {okr.quarter} {okr.year}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>پیشرفت کلی</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full ${getProgressColor(progress)} transition-all`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {okr.keyResults.map((kr, idx) => {
                    const krProgress = kr.targetValue > 0 ? Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100) : 0;
                    return (
                      <div key={kr.id} className={`p-2 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{kr.title}</span>
                          <span>{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                          <div className={`h-full rounded-full ${getProgressColor(krProgress)} transition-all`} style={{ width: `${krProgress}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI List */}
      {activeTab === 'kpi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKPIs.map(kpi => {
            const progress = getKPIProgress(kpi);
            const employee = kpi.assignedTo ? employees.find(e => e.id === kpi.assignedTo) : null;
            
            return (
              <div key={kpi.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1">{kpi.title}</h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setKpiForm(kpi); setShowKPIForm(true); }} className="text-blue-600 p-1"><Edit size={16} /></button>
                    <button onClick={() => setKpis(kpis.filter(x => x.id !== kpi.id))} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    {categoryLabels[kpi.category]}
                  </span>
                  <span className={`px-2 py-1 rounded ${kpi.type === 'organizational' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    {kpi.type === 'organizational' ? 'سازمانی' : employee?.name}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{kpi.currentValue} / {kpi.targetValue} {kpi.unit}</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full ${getProgressColor(progress)} transition-all`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(activeTab === 'okr' ? filteredOKRs : filteredKPIs).length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {activeTab === 'okr' ? 'OKR' : 'KPI'} ای ثبت نشده است
        </div>
      )}

      {/* OKR Form Modal */}
      {showOKRForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowOKRForm(false)}>
          <div className={`w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{okrForm.id ? 'ویرایش OKR' : 'OKR جدید'}</h3><button onClick={() => setShowOKRForm(false)}><X size={20} /></button></div>
            <div className="space-y-4">
              <input type="text" placeholder="عنوان هدف" value={okrForm.title} onChange={e => setOkrForm({...okrForm, title: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <textarea placeholder="توضیحات" value={okrForm.description} onChange={e => setOkrForm({...okrForm, description: e.target.value})} rows={2} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <select value={okrForm.type} onChange={e => setOkrForm({...okrForm, type: e.target.value as any})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="organizational">سازمانی</option>
                  <option value="employee">کارمند</option>
                </select>
                {okrForm.type === 'employee' && (
                  <select value={okrForm.assignedTo} onChange={e => setOkrForm({...okrForm, assignedTo: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option value="">انتخاب کارمند</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={okrForm.quarter} onChange={e => setOkrForm({...okrForm, quarter: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="Q1">فصل اول</option>
                  <option value="Q2">فصل دوم</option>
                  <option value="Q3">فصل سوم</option>
                  <option value="Q4">فصل چهارم</option>
                </select>
                <input type="number" placeholder="سال" value={okrForm.year} onChange={e => setOkrForm({...okrForm, year: Number(e.target.value)})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <JalaliDatePicker value={okrForm.startDate || ''} onChange={date => setOkrForm({...okrForm, startDate: date})} placeholder="تاریخ شروع" className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <JalaliDatePicker value={okrForm.endDate || ''} onChange={date => setOkrForm({...okrForm, endDate: date})} placeholder="تاریخ پایان" className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">نتایج کلیدی</label>
                  <button onClick={addKeyResult} className="text-blue-600 text-sm">+ افزودن</button>
                </div>
                <div className="space-y-2">
                  {okrForm.keyResults?.map((kr, idx) => (
                    <div key={kr.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className="flex gap-2 mb-2">
                        <input type="text" placeholder="عنوان نتیجه کلیدی" value={kr.title} onChange={e => updateKeyResult(idx, 'title', e.target.value)} className={`flex-1 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                        <button onClick={() => removeKeyResult(idx)} className="text-red-500"><X size={16} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" placeholder="مقدار هدف" value={kr.targetValue || ''} onChange={e => updateKeyResult(idx, 'targetValue', Number(e.target.value))} className={`px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                        <input type="number" placeholder="مقدار فعلی" value={kr.currentValue || ''} onChange={e => updateKeyResult(idx, 'currentValue', Number(e.target.value))} className={`px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                        <input type="text" placeholder="واحد" value={kr.unit} onChange={e => updateKeyResult(idx, 'unit', e.target.value)} className={`px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button onClick={saveOKR} className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700">ذخیره OKR</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Form Modal */}
      {showKPIForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowKPIForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{kpiForm.id ? 'ویرایش KPI' : 'KPI جدید'}</h3><button onClick={() => setShowKPIForm(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان شاخص" value={kpiForm.title} onChange={e => setKpiForm({...kpiForm, title: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <textarea placeholder="توضیحات" value={kpiForm.description} onChange={e => setKpiForm({...kpiForm, description: e.target.value})} rows={2} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={kpiForm.category} onChange={e => setKpiForm({...kpiForm, category: e.target.value as any})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="sales">فروش</option>
                <option value="marketing">بازاریابی</option>
                <option value="customer">مشتری</option>
                <option value="operations">عملیات</option>
                <option value="financial">مالی</option>
                <option value="digital">دیجیتال مارکتینگ</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={kpiForm.type} onChange={e => setKpiForm({...kpiForm, type: e.target.value as any})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="organizational">سازمانی</option>
                  <option value="employee">کارمند</option>
                </select>
                {kpiForm.type === 'employee' && (
                  <select value={kpiForm.assignedTo} onChange={e => setKpiForm({...kpiForm, assignedTo: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option value="">انتخاب کارمند</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="مقدار هدف" value={kpiForm.targetValue || ''} onChange={e => setKpiForm({...kpiForm, targetValue: Number(e.target.value)})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="number" placeholder="مقدار فعلی" value={kpiForm.currentValue || ''} onChange={e => setKpiForm({...kpiForm, currentValue: Number(e.target.value)})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="text" placeholder="واحد" value={kpiForm.unit} onChange={e => setKpiForm({...kpiForm, unit: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <JalaliDatePicker value={kpiForm.startDate || ''} onChange={date => setKpiForm({...kpiForm, startDate: date})} placeholder="تاریخ شروع" className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <JalaliDatePicker value={kpiForm.endDate || ''} onChange={date => setKpiForm({...kpiForm, endDate: date})} placeholder="تاریخ پایان" className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <button onClick={saveKPI} className="w-full py-2.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700">ذخیره KPI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
