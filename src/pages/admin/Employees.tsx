import React, { useState } from 'react';
import { useApp, Employee, OKR, KPI } from '../../store';
import { Plus, X, Edit, Trash2, Target, TrendingUp, Award, Calendar } from 'lucide-react';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export function AdminEmployees() {
  const { darkMode, employees, setEmployees, okrs, setOkrs, kpis, setKpis } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({ name: '', phone: '', role: 'seller', salary: 0, startDate: '', active: true, commission: 0 });
  const [showOKRForm, setShowOKRForm] = useState(false);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [okrForm, setOkrForm] = useState<Partial<OKR>>({
    title: '',
    description: '',
    type: 'employee',
    assignedTo: '',
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
    type: 'employee',
    assignedTo: '',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const roleLabels: Record<string, string> = { admin: 'مدیر', seller: 'فروشنده', operator: 'اپراتور', designer: 'طراح', accountant: 'حسابدار' };

  const save = () => {
    if (editId) setEmployees(employees.map(e => e.id === editId ? { ...e, ...form } as Employee : e));
    else setEmployees([...employees, { ...form, id: 'emp' + Date.now() } as Employee]);
    setShowForm(false);
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
      type: 'employee',
      assignedTo: '',
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
      type: 'employee',
      assignedTo: '',
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

  const getEmployeeOKRs = (employeeId: string) => okrs.filter(o => o.assignedTo === employeeId);
  const getEmployeeKPIs = (employeeId: string) => kpis.filter(k => k.assignedTo === employeeId);

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

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">مدیریت کارمندان</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowOKRForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">
            <Target size={16} /> OKR جدید
          </button>
          <button onClick={() => setShowKPIForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700">
            <TrendingUp size={16} /> KPI جدید
          </button>
          <button onClick={() => { setForm({ name: '', phone: '', role: 'seller', salary: 0, startDate: '', active: true, commission: 0 }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <Plus size={16} /> کارمند جدید
          </button>
        </div>
      </div>

      {/* Employees List */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">نام</th>
                <th className="text-right p-3">نقش</th>
                <th className="text-right p-3">حقوق</th>
                <th className="text-right p-3">کمیسیون</th>
                <th className="text-right p-3">OKR</th>
                <th className="text-right p-3">KPI</th>
                <th className="text-right p-3">وضعیت</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => {
                const empOKRs = getEmployeeOKRs(e.id);
                const empKPIs = getEmployeeKPIs(e.id);
                const avgOKR = empOKRs.length > 0 ? Math.round(empOKRs.reduce((sum, o) => sum + getOKRProgress(o), 0) / empOKRs.length) : 0;
                const avgKPI = empKPIs.length > 0 ? Math.round(empKPIs.reduce((sum, k) => sum + getKPIProgress(k), 0) / empKPIs.length) : 0;
                
                return (
                  <tr key={e.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3">{roleLabels[e.role]}</td>
                    <td className="p-3">{e.salary.toLocaleString('fa-IR')}</td>
                    <td className="p-3">{e.commission}%</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{empOKRs.length}</span>
                        {avgOKR > 0 && (
                          <div className={`w-16 h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${avgOKR}%` }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{empKPIs.length}</span>
                        {avgKPI > 0 && (
                          <div className={`w-16 h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${avgKPI}%` }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${e.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.active ? 'فعال' : 'غیرفعال'}</span></td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setForm(e); setEditId(e.id); setShowForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
                      <button onClick={() => setEmployees(employees.filter(x => x.id !== e.id))} className="text-red-500 text-xs">حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{editId ? 'ویرایش' : 'کارمند جدید'}</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input type="text" placeholder="نام" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="تلفن" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="حقوق" value={form.salary || ''} onChange={e => setForm({...form, salary: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="number" placeholder="کمیسیون (%)" value={form.commission || ''} onChange={e => setForm({...form, commission: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} /><span className="text-sm">فعال</span></label>
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* OKR Form Modal */}
      {showOKRForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowOKRForm(false)}>
          <div className={`w-full max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">OKR جدید</h3><button onClick={() => setShowOKRForm(false)}><X size={20} /></button></div>
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
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">KPI جدید</h3><button onClick={() => setShowKPIForm(false)}><X size={20} /></button></div>
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
