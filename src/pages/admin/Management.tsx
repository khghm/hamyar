import React, { useState } from 'react';
import { useApp, Employee, Campaign, SmsLog, AuditLog } from '../../store';
import { Plus, X, Edit, Trash2, Send, Download, Shield } from 'lucide-react';

// Employees Page
export function AdminEmployees() {
  const { darkMode, employees, setEmployees } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({ name: '', phone: '', role: 'seller', salary: 0, startDate: '', active: true, commission: 0 });

  const roleLabels: Record<string, string> = { admin: 'مدیر', seller: 'فروشنده', operator: 'اپراتور', designer: 'طراح', accountant: 'حسابدار' };

  const save = () => {
    if (editId) setEmployees(employees.map(e => e.id === editId ? { ...e, ...form } as Employee : e));
    else setEmployees([...employees, { ...form, id: 'emp' + Date.now() } as Employee]);
    setShowForm(false);
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت کارمندان</h1>
        <button onClick={() => { setForm({ name: '', phone: '', role: 'seller', salary: 0, startDate: '', active: true, commission: 0 }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"><Plus size={16} /> کارمند جدید</button>
      </div>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr><th className="text-right p-3">نام</th><th className="text-right p-3">نقش</th><th className="text-right p-3">حقوق</th><th className="text-right p-3">کمیسیون</th><th className="text-right p-3">وضعیت</th><th className="text-right p-3">عملیات</th></tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3">{roleLabels[e.role]}</td>
                <td className="p-3">{e.salary.toLocaleString('fa-IR')}</td>
                <td className="p-3">{e.commission}%</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${e.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.active ? 'فعال' : 'غیرفعال'}</span></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => { setForm(e); setEditId(e.id); setShowForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
                  <button onClick={() => setEmployees(employees.filter(x => x.id !== e.id))} className="text-red-500 text-xs">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
}

// Campaigns Page
export function AdminCampaigns() {
  const { darkMode, campaigns, setCampaigns } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>({ title: '', code: '', discount: 0, type: 'percent', minPurchase: 0, maxUses: 100, usedCount: 0, startDate: '', endDate: '', active: true });

  const save = () => {
    if (editId) setCampaigns(campaigns.map(c => c.id === editId ? { ...c, ...form } as Campaign : c));
    else setCampaigns([...campaigns, { ...form, id: 'c' + Date.now() } as Campaign]);
    setShowForm(false);
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت کمپین‌های تخفیفی</h1>
        <button onClick={() => { setForm({ title: '', code: '', discount: 0, type: 'percent', minPurchase: 0, maxUses: 100, usedCount: 0, startDate: '', endDate: '', active: true }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"><Plus size={16} /> کمپین جدید</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
          <div key={c.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{c.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.active ? 'فعال' : 'غیرفعال'}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کد:</span><span className="font-mono font-bold">{c.code}</span></div>
              <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>تخفیف:</span><span>{c.discount}{c.type === 'percent' ? '%' : ' تومان'}</span></div>
              <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>استفاده:</span><span>{c.usedCount}/{c.maxUses}</span></div>
              <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>حداقل خرید:</span><span>{c.minPurchase.toLocaleString('fa-IR')} تومان</span></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setForm(c); setEditId(c.id); setShowForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
              <button onClick={() => setCampaigns(campaigns.filter(x => x.id !== c.id))} className="text-red-500 text-xs">حذف</button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{editId ? 'ویرایش' : 'کمپین جدید'}</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="کد تخفیف" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className={`w-full px-3 py-2 rounded-lg border font-mono ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="مقدار تخفیف" value={form.discount || ''} onChange={e => setForm({...form, discount: Number(e.target.value)})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}><option value="percent">درصد</option><option value="fixed">مبلغ ثابت</option></select>
              </div>
              <input type="number" placeholder="حداقل خرید" value={form.minPurchase || ''} onChange={e => setForm({...form, minPurchase: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="number" placeholder="حداکثر استفاده" value={form.maxUses || ''} onChange={e => setForm({...form, maxUses: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} /><span className="text-sm">فعال</span></label>
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SMS Panel
export function AdminSmsPanel() {
  const { darkMode, smsLogs, setSmsLogs, users } = useApp();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [phones, setPhones] = useState('');

  const sendSms = () => {
    if (!message.trim()) { alert('متن پیام را وارد کنید'); return; }
    const targetPhones = target === 'all' ? users.filter(u => u.role === 'customer').map(u => u.phone) : phones.split(',').map(p => p.trim());
    const newLogs: SmsLog[] = targetPhones.map(phone => ({
      id: 'sms' + Date.now() + Math.random(),
      phone,
      message,
      date: new Date().toISOString(),
      status: 'sent'
    }));
    setSmsLogs([...smsLogs, ...newLogs]);
    setMessage('');
    setPhones('');
    alert(`${newLogs.length} پیامک با موفقیت ارسال شد`);
  };

  return (
    <div className="fade-in space-y-6">
      <h1 className="text-2xl font-bold">پنل پیامک انبوه</h1>
      <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4">ارسال پیامک جدید</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">گیرندگان</label>
            <select value={target} onChange={e => setTarget(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
              <option value="all">همه مشتریان ({users.filter(u => u.role === 'customer').length} نفر)</option>
              <option value="custom">شماره‌های خاص</option>
            </select>
          </div>
          {target === 'custom' && (
            <textarea placeholder="شماره‌ها را با کاما جدا کنید" value={phones} onChange={e => setPhones(e.target.value)} rows={2} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          )}
          <div>
            <label className="text-sm font-medium block mb-1">متن پیام</label>
            <textarea placeholder="متن پیامک..." value={message} onChange={e => setMessage(e.target.value)} rows={4} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <button onClick={sendSms} className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 flex items-center gap-2"><Send size={16} /> ارسال پیامک</button>
        </div>
      </div>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold p-4 border-b border-gray-200 dark:border-slate-700">تاریخچه پیامک‌ها</h3>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}><tr><th className="text-right p-3">شماره</th><th className="text-right p-3">متن</th><th className="text-right p-3">تاریخ</th><th className="text-right p-3">وضعیت</th></tr></thead>
          <tbody>
            {smsLogs.slice(-20).reverse().map(log => (
              <tr key={log.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-mono text-xs">{log.phone}</td>
                <td className="p-3 text-xs">{log.message.substring(0, 50)}...</td>
                <td className="p-3 text-xs">{new Date(log.date).toLocaleDateString('fa-IR')}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status === 'sent' ? 'ارسال شد' : 'ناموفق'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reviews Management
export function AdminReviews() {
  const { darkMode, reviews, setReviews } = useApp();
  return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-bold">مدیریت نظرات</h1>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}><tr><th className="text-right p-3">مشتری</th><th className="text-right p-3">امتیاز</th><th className="text-right p-3">نظر</th><th className="text-right p-3">تاریخ</th><th className="text-right p-3">وضعیت</th><th className="text-right p-3">عملیات</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3">{r.customerName}</td>
                <td className="p-3">{'⭐'.repeat(r.rating)}</td>
                <td className="p-3 text-xs">{r.comment.substring(0, 50)}</td>
                <td className="p-3 text-xs">{r.date}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.approved ? 'تایید شده' : 'در انتظار'}</span></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setReviews(reviews.map(x => x.id === r.id ? { ...x, approved: !x.approved } : x))} className="text-blue-600 text-xs">{r.approved ? 'رد' : 'تایید'}</button>
                  <button onClick={() => setReviews(reviews.filter(x => x.id !== r.id))} className="text-red-500 text-xs">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audit Log
export function AdminAuditLog() {
  const { darkMode, auditLogs } = useApp();
  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield size={24} /> لاگ فعالیت‌ها</h1>
      </div>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}><tr><th className="text-right p-3">کاربر</th><th className="text-right p-3">عملیات</th><th className="text-right p-3">جزئیات</th><th className="text-right p-3">تاریخ</th><th className="text-right p-3">IP</th></tr></thead>
          <tbody>
            {auditLogs.slice().reverse().map(log => (
              <tr key={log.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-medium">{log.user}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 text-xs">{log.details}</td>
                <td className="p-3 text-xs">{new Date(log.date).toLocaleString('fa-IR')}</td>
                <td className="p-3 font-mono text-xs">{log.ip || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Backup
export function AdminBackup() {
  const { darkMode } = useApp();
  
  const createBackup = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hamyar_')) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hamyar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const restoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string') localStorage.setItem(key, value);
        });
        alert('بکاپ با موفقیت بازیابی شد. صفحه را رفرش کنید.');
        window.location.reload();
      } catch {
        alert('فایل بکاپ معتبر نیست');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fade-in space-y-6">
      <h1 className="text-2xl font-bold">پشتیبان‌گیری و بازیابی</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">ایجاد بکاپ</h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تمامی اطلاعات سیستم را در یک فایل JSON ذخیره کنید</p>
          <button onClick={createBackup} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2"><Download size={16} /> دانلود بکاپ</button>
        </div>
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">بازیابی از بکاپ</h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فایل بکاپ قبلی را بارگذاری کنید</p>
          <label className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 inline-flex items-center gap-2 cursor-pointer"><Download size={16} /> انتخاب فایل<input type="file" accept=".json" onChange={restoreBackup} className="hidden" /></label>
        </div>
      </div>
    </div>
  );
}

// FAQ Manager
export function AdminFaqManager() {
  const { darkMode, faqs, setFaqs } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'عمومی' });

  const save = () => {
    if (editId) setFaqs(faqs.map(f => f.id === editId ? { ...f, ...form } : f));
    else setFaqs([...faqs, { ...form, id: 'f' + Date.now() }]);
    setShowForm(false);
    setForm({ question: '', answer: '', category: 'عمومی' });
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت سوالات متداول</h1>
        <button onClick={() => { setForm({ question: '', answer: '', category: 'عمومی' }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"><Plus size={16} /> سوال جدید</button>
      </div>
      <div className="space-y-3">
        {faqs.map(f => (
          <div key={f.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>{f.category}</span>
                <h3 className="font-bold mt-2">{f.question}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{f.answer}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm(f); setEditId(f.id); setShowForm(true); }} className="text-blue-600 text-xs">ویرایش</button>
                <button onClick={() => setFaqs(faqs.filter(x => x.id !== f.id))} className="text-red-500 text-xs">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-lg p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{editId ? 'ویرایش' : 'سوال جدید'}</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input type="text" placeholder="سوال" value={form.question} onChange={e => setForm({...form, question: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option>عمومی</option><option>فروشگاه</option><option>خدمات</option><option>سفارش</option>
              </select>
              <textarea placeholder="پاسخ" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} rows={4} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
