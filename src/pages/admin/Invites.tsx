import React, { useState } from 'react';
import { useApp } from '../../store';
import { Gift, Users, TrendingUp, Award } from 'lucide-react';

export default function AdminInvites() {
  const { darkMode, users } = useApp();
  const [search, setSearch] = useState('');

  const customers = users.filter(u => u.role === 'customer');
  const invitedUsers = customers.filter(u => u.invitedBy);
  const topInviters = customers
    .filter(u => (u.invitedCount || 0) > 0)
    .sort((a, b) => (b.invitedCount || 0) - (a.invitedCount || 0))
    .slice(0, 10);

  const totalInvites = invitedUsers.length;
  const totalPointsAwarded = totalInvites * 50;

  const filteredCustomers = customers.filter(u => 
    u.name.includes(search) || u.phone.includes(search) || (u.inviteCode && u.inviteCode.includes(search.toUpperCase()))
  );

  return (
    <div className="fade-in space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Gift size={24} className="text-purple-600" />
        مدیریت کدهای دعوت
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{customers.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل مشتریان</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Gift size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{totalInvites}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دعوت‌های موفق</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Award size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{totalPointsAwarded.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز اعطا شده</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{topInviters.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دعوت‌کنندگان فعال</div>
        </div>
      </div>

      {/* Top Inviters */}
      {topInviters.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-500" />
            برترین دعوت‌کنندگان
          </h3>
          <div className="space-y-2">
            {topInviters.map((user, idx) => (
              <div key={user.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    darkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-300 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.phone}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-purple-600">{user.invitedCount} دعوت</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {(user.invitedCount || 0) * 50} امتیاز
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Customers with Invite Codes */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، شماره یا کد دعوت..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
          />
        </div>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className="text-right p-3">نام</th>
              <th className="text-right p-3">شماره</th>
              <th className="text-right p-3">کد دعوت</th>
              <th className="text-right p-3">دعوت‌ها</th>
              <th className="text-right p-3">امتیاز</th>
              <th className="text-right p-3">دعوت شده توسط</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(user => {
              const inviter = user.invitedBy ? users.find(u => u.id === user.invitedBy) : null;
              return (
                <tr key={user.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3 font-mono text-xs">{user.phone}</td>
                  <td className="p-3">
                    <code className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      {user.inviteCode || '-'}
                    </code>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-purple-600">{user.invitedCount || 0}</span>
                  </td>
                  <td className="p-3">{user.loyaltyPoints}</td>
                  <td className="p-3 text-xs">
                    {inviter ? (
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                        {inviter.name}
                      </span>
                    ) : (
                      <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-400">مشتری‌ای یافت نشد</p>
        )}
      </div>
    </div>
  );
}
