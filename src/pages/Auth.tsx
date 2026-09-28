import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Phone, User, Lock, Gift } from 'lucide-react';

const INVITE_BONUS = 50;

export default function Auth() {
  const { darkMode, login, adminLogin, users, setUsers } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');

  const handleCustomerLogin = () => {
    if (!phone || !name) { setError('لطفا تمام فیلدها را پر کنید'); return; }
    if (phone.length < 11) { setError('شماره موبایل باید ۱۱ رقم باشد'); return; }

    // Resolve the invite code (if any) up front so an invalid code is rejected
    // before anything is persisted.
    let inviterId: string | undefined;
    if (inviteCode.trim()) {
      const inviter = users.find(u => u.inviteCode === inviteCode.trim().toUpperCase());
      if (!inviter) {
        setError('کد دعوت معتبر نیست');
        return;
      }
      inviterId = inviter.id;
    }

    const existingUser = users.find(u => u.phone === phone);

    if (existingUser) {
      // Existing customer signing in with an invite code for the first time:
      // grant the rewards to the INVITER (+1 دعوت و امتیاز) and record the
      // referrer on the new user — never give the bonus to the wrong account.
      if (inviterId && !existingUser.invitedBy && existingUser.role === 'customer') {
        const updatedUsers = users.map(u => {
          if (u.id === inviterId) {
            return {
              ...u,
              invitedCount: (u.invitedCount || 0) + 1,
              loyaltyPoints: (u.loyaltyPoints || 0) + INVITE_BONUS,
            };
          }
          if (u.id === existingUser.id) {
            return { ...u, invitedBy: inviterId };
          }
          return u;
        });
        setUsers(updatedUsers);
        login(phone, name);
      } else {
        login(phone, name);
      }
      navigate('/profile');
      return;
    }

    // New user registration with invite code
    if (inviterId) {
      // The referral bonus (50 points + 1 invite) belongs to the person whose
      // code was used — the INVITER — not to the newly registered user.
      const updatedUsers = users.map(u => {
        if (u.id === inviterId) {
          return {
            ...u,
            invitedCount: (u.invitedCount || 0) + 1,
            loyaltyPoints: (u.loyaltyPoints || 0) + INVITE_BONUS,
          };
        }
        return u;
      });
      setUsers(updatedUsers);
    }

    // login() creates the new user without touching the inviter's record,
    // so the update above is preserved.
    login(phone, name, inviterId);
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
            <div className="relative">
              <Gift size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="کد دعوت (اختیاری)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} dir="ltr"
                className={`w-full pr-10 pl-4 py-3 rounded-xl border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              با وارد کردن کد دعوت، {INVITE_BONUS} امتیاز به دعوت‌کننده و {INVITE_BONUS} امتیاز خوش‌آمدگویی به شما تعلق می‌گیرد
            </p>
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
