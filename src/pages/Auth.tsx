import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { resetPasswordForEmail, signInCustomer, signUpCustomer, fetchCurrentProfile } from '../api/auth';
import { Mail, Lock, User, Gift, Phone } from 'lucide-react';

const INVITE_BONUS = 50;

export default function Auth() {
  const { darkMode, login, adminLogin } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [isRegister, setIsRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomerSubmit = async () => {
    if (loading) return;
    if (!email || !password) { setError('لطفاً ایمیل و رمز عبور را وارد کنید'); return; }
    if (isRegister && !name) { setError('نام و نام خانوادگی الزامی است'); return; }
    if (password.length < 6) { setError('رمز عبور باید حداقل ۶ کاراکتر باشد'); return; }

    setLoading(true);
    setError('');

    let result;
    if (isRegister) {
      result = await signUpCustomer({ email, password, displayName: name, phone: phone || undefined, inviteCode: inviteCode || undefined });
      if (result.ok && result.needsEmailConfirmation) {
        setError('لینک تأیید ایمیل ارسال شد. پس از تأیید، به این صفحه برگردید.');
        setLoading(false);
        return;
      }
      if (!result.ok) {
        setError(result.error || 'ثبت‌نام با مشکل مواجه شد');
        setLoading(false);
        return;
      }
      // Sign in after registration
      const signInResult = await signInCustomer(email, password);
      if (!signInResult.ok) {
        setError(signInResult.error || 'ورود بعد از ثبت‌نام ناموفق بود');
        setLoading(false);
        return;
      }
    } else {
      result = await signInCustomer(email, password);
      if (!result.ok) {
        setError(result.error || 'ورود ناموفق بود');
        setLoading(false);
        return;
      }
    }

    // Sync the Supabase auth user into the store's local state
    const loginResult = await login(email, password, name, phone || undefined, inviteCode || undefined);
    if (!loginResult.ok) {
      setError(loginResult.error || 'همگام‌سازی پروفایل با مشکل مواجه شد');
    }
    setLoading(false);
    navigate('/profile');
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('لطفاً ایمیل خود را وارد کنید'); return; }
    setLoading(true);
    setError('');
    const result = await resetPasswordForEmail(email);
    if (result.ok) {
      setError('لینک فراموشی رمز عبور به ایمیل شما ارسال شد');
    } else {
      setError(result.error || 'ارسال لینک بازیابی ناموفق بود');
    }
    setLoading(false);
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
            <h2 className="text-xl font-bold text-center mb-2">
              {isRegister ? 'ثبت‌نام' : 'ورود'}
            </h2>
            <p className={`text-sm text-center mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              برای استفاده از خدمات، ایمیل و رمز عبور خود را وارد کنید
            </p>

            {isRegister && (
              <div className="relative">
                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="نام و نام خانوادگی" value={name} onChange={e => setName(e.target.value)}
                  className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>

            {isRegister && (
              <div className="relative">
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" placeholder="شماره موبایل (اختیاری: 09xxxxxxxxx)" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                  className={`w-full pr-10 pl-4 py-3 rounded-xl border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
              </div>
            )}

            {isRegister && (
              <div className="relative">
                <Gift size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="کد دعوت (اختیاری)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} dir="ltr"
                  className={`w-full pr-10 pl-4 py-3 rounded-xl border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
              </div>
            )}

            {!isRegister && (
              <div className="text-center">
                <button
                  onClick={() => setShowForgot(true)}
                  className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                  فراموشی رمز عبور؟
                </button>
              </div>
            )}

            <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              با وارد کردن کد دعوت، {INVITE_BONUS} امتیاز به دعوت‌کننده و {INVITE_BONUS} امتیاز خوش‌آمدگویی به شما تعلق می‌گیرد
            </p>

            <button
              onClick={handleCustomerSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
              {loading ? 'در حال پردازش...' : (isRegister ? 'ثبت‌نام' : 'ورود')}
            </button>

            <div className="text-center pt-2">
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className={`text-sm ${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                {isRegister ? 'قبلاً حساب دارید؟ ورود' : 'حساب ندارید؟ ثبت‌نام'}
              </button>
            </div>
          </div>
        ) : (
          /* Admin login (local RBAC) */
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

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} w-full max-w-sm`}>
              <h3 className="text-lg font-bold mb-4 text-center">فراموشی رمز عبور</h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ایمیل خود را وارد کنید. لینک بازیابی رمز عبور برای شما ارسال می‌شود.
              </p>
              <div className="relative mb-4">
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)}
                  className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForgot(false)}
                  className={`flex-1 py-2 rounded-xl ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-700'} font-medium`}>
                  انصراف
                </button>
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
                  {loading ? 'در حال ارسال...' : 'ارسال'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}