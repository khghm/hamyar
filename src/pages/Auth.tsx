import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Phone, User, Lock } from 'lucide-react';

export default function Auth() {
  const { darkMode, login, adminLogin } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');

  const handleCustomerLogin = () => {
    if (!phone || !name) { setError('لطفا تمام فیلدها را پر کنید'); return; }
    if (phone.length < 11) { setError('شماره موبایل باید ۱۱ رقم باشد'); return; }
    login(phone, name);
    navigate('/profile');
  };

  const handleAdminLogin = () => {
    if (adminLogin(adminUser, adminPass)) {
      navigate('/admin');
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است');
    }
  };

  return (
    <div className="fade-in min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className={`w-full max-w-md p-8 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-xl`}>
        {/* Tabs */}
        <div className="flex mb-8 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
          <button onClick={() => { setMode('customer'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${mode === 'customer' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-50 text-slate-600'}`}>
            ورود مشتری
          </button>
          <button onClick={() => { setMode('admin'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${mode === 'admin' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-50 text-slate-600'}`}>
            ورود مدیریت
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'customer' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-2">ورود / ثبت‌نام</h2>
            <p className={`text-sm text-center mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              برای استفاده از خدمات، شماره همراه و نام خود را وارد کنید
            </p>
            <div className="relative">
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="نام و نام خانوادگی" value={name} onChange={e => setName(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <div className="relative">
              <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" placeholder="شماره موبایل (مثال: 09123456789)" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <button onClick={handleCustomerLogin} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">
              ورود / ثبت‌نام
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-2">ورود مدیریت</h2>
            <div className="relative">
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="نام کاربری" value={adminUser} onChange={e => setAdminUser(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" placeholder="رمز عبور" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <button onClick={handleAdminLogin} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all">
              ورود به پنل مدیریت
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
