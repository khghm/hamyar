import React, { useState } from 'react';
import { useApp } from '../../store';
import { Search, Users, Star, Eye } from 'lucide-react';

export default function AdminCustomers() {
  const { darkMode, users } = useApp();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const customers = users.filter(u => u.role === 'customer' && (u.name.includes(search) || u.phone.includes(search)));
  const detail = selectedUser ? users.find(u => u.id === selectedUser) : null;

  const levelLabels: Record<string, string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-bold">مدیریت مشتریان (CRM)</h1>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="جستجوی نام یا شماره..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} />
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className="text-right p-3">نام</th>
              <th className="text-right p-3">شماره</th>
              <th className="text-right p-3">سطح</th>
              <th className="text-right p-3">امتیاز</th>
              <th className="text-right p-3">علاقه‌مندی</th>
              <th className="text-right p-3">انتخاب مدیا</th>
              <th className="text-right p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.phone}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{levelLabels[c.level]}</span></td>
                <td className="p-3">{c.loyaltyPoints}</td>
                <td className="p-3">{c.favorites.length}</td>
                <td className="p-3">{c.selectedMedia.length}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedUser(c.id)} className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                    <Eye size={12} /> جزئیات
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="text-center py-8 text-sm text-slate-400">مشتری‌ای یافت نشد</p>}
      </div>

      {/* User Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUser(null)}>
          <div className={`w-full max-w-lg p-6 rounded-2xl max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">پروفایل مشتری</h3>
            <div className="space-y-3">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <p className="font-bold">{detail.name}</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{detail.phone}</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کد دعوت: {detail.inviteCode}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="font-bold">{detail.loyaltyPoints}</div>
                  <div className="text-xs text-slate-400">امتیاز</div>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="font-bold">{detail.favorites.length}</div>
                  <div className="text-xs text-slate-400">علاقه‌مندی</div>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="font-bold">{detail.selectedMedia.length}</div>
                  <div className="text-xs text-slate-400">انتخاب مدیا</div>
                </div>
              </div>
              {detail.selectedMedia.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm mb-2">فیلم‌های انتخاب‌شده:</h4>
                  <div className="space-y-1">
                    {detail.selectedMedia.map(id => (
                      <div key={id} className={`p-2 rounded text-sm ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>{id}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedUser(null)} className="mt-4 w-full py-2 rounded-lg bg-blue-600 text-white text-sm">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}
