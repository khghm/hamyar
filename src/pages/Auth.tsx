import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { resetPasswordForEmail, signInCustomer, signUpCustomer, fetchCurrentProfile, updateCustomerProfile as updateCustomerProfileApi } from '../api/auth';
import { requestPhoneOtp, verifyPhoneOtp, normalizeIranPhone } from '../api/otp';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Gift, Phone } from 'lucide-react';

const INVITE_BONUS = 50;

export default function Auth() {
  const { darkMode, login, loginWithSession, adminLogin, adminLoggedIn, currentUser } = useApp();
  const navigate = useNavigate();

  // اگر نشست مدیریت از قبل فعال است (مثلاً رفرش یا بازگشت از پنل)، مستقیم
  // وارد پنل شود و در صفحهٔ ورود نماند.
  useEffect(() => {
    if (adminLoggedIn) navigate('/admin', { replace: true });
  }, [adminLoggedIn, navigate]);

  // بعد از ورود با موبایل، هدایت را در افکت انجام می‌دهیم تا استور حتماً
  // به‌روزرسانی شده باشد؛ وگرنه گارد /profile قبل از ست‌شدن currentUser اجرا
  // می‌شود و کاربر به /auth برمی‌گردد.
  const [awaitProfile, setAwaitProfile] = useState(false);
  useEffect(() => {
    if (awaitProfile && currentUser?.role === 'customer') {
      navigate('/profile', { replace: true });
    }
  }, [awaitProfile, currentUser, navigate]);
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [isRegister, setIsRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ---- ورود با شماره موبایل (OTP) ----
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [otpStep, setOtpStep] = useState<'phone' | 'code' | 'name'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpInfo, setOtpInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [fullName, setFullName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn > 0]);

  const handleSendOtp = async () => {
    setError('');
    setOtpInfo('');
    setDevCode('');
    setOtpLoading(true);
    const res = await requestPhoneOtp(phone);
    setOtpLoading(false);
    if (!res.ok) {
      setError(res.error || 'ارسال کد ناموفق بود');
      if (res.retryAfter) setResendIn(res.retryAfter);
      return;
    }
    setOtpStep('code');
    setOtpCode('');
    setResendIn(res.resendIn || 60);
    setOtpInfo(`کد ۶ رقمی به ${normalizeIranPhone(phone)} پیامک شد.`);
    if (res.devCode) setDevCode(res.devCode);
  };

  const handleVerifyOtp = async () => {
    setError('');
    setOtpLoading(true);
    const res = await verifyPhoneOtp(phone, otpCode);
    if (!res.ok) {
      setOtpLoading(false);
      setError(res.error || 'کد وارد‌شده درست نیست');
      return;
    }
    // کاربر تازه‌ساخته‌شده نام ندارد؛ قبل از ورود، نامش را می‌پرسیم تا در پنل
    // مدیریت (بخش مشتریان) به‌جای شماره، نام واقعی دیده شود.
    if (res.needsName) {
      setOtpLoading(false);
      setPendingEmail(res.email || '');
      setOtpStep('name');
      return;
    }
    await finishPhoneLogin(res.email || '');
  };

  const finishPhoneLogin = async (email: string) => {
    try {
      const session = await loginWithSession(email);
      setOtpLoading(false);
      if (session.ok) setAwaitProfile(true);
      else navigate('/', { replace: true });
    } catch {
      setOtpLoading(false);
      navigate('/', { replace: true });
    }
  };

  const handleSaveName = async () => {
    const name = fullName.trim();
    if (name.length < 3) {
      setError('نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      await updateCustomerProfileApi({ displayName: name });
    } catch {
      /* نام بعداً از پروفایل قابل ویرایش است */
    }
    await finishPhoneLogin(pendingEmail);
  };

  // Check for existing session on mount (e.g., after email confirmation redirect)
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user && !loading && !email && !password) {
        // User has confirmed email and has a session, but hasn't entered credentials yet
        // Auto-login using the session
        try {
          const result = await loginWithSession(session.user.email!);
          if (!cancelled && result.ok) {
            navigate('/profile');
          } else if (!cancelled && result.error) {
            console.warn('[Auth] auto-login failed:', result.error);
          }
        } catch (e) {
          console.error('[Auth] auto-login error:', e);
        }
      }
    };
    checkSession();
    return () => { cancelled = true; };
  }, [navigate, loginWithSession, loading]);

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
    } else {
      setLoading(false);
      navigate('/profile');
    }
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

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      setError('نام کاربری (یا ایمیل) و رمز عبور را وارد کنید');
      return;
    }
    if (await adminLogin(email, password)) {
      navigate('/admin');
    } else {
      setError('نام کاربری/ایمیل یا رمز عبور اشتباه است — یا حساب غیرفعال است');
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
            {/* روش ورود مشتری: شماره موبایل (پیش‌فرض) یا ایمیل */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
              {([
                { id: 'phone', label: 'ورود با موبایل' },
                { id: 'email', label: 'ایمیل و رمز عبور' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setAuthMethod(opt.id); setError(''); setOtpStep('phone'); setOtpInfo(''); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${authMethod === opt.id ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-50 text-slate-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {authMethod === 'phone' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-center">ورود / ثبت‌نام</h2>
                <p className={`text-sm text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  کد ورود برای شمارهٔ موبایل شما پیامک می‌شود؛ نیازی به ایمیل نیست.
                </p>

                {otpStep === 'phone' ? (
                  <>
                    <div className="relative">
                      <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder="09121234567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendOtp(); }}
                        className={`w-full pr-10 pl-4 py-3 rounded-xl border text-left ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={otpLoading || !normalizeIranPhone(phone)}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {otpLoading ? 'در حال ارسال…' : 'دریافت کد ورود'}
                    </button>
                  </>
                ) : otpStep === 'code' ? (
                  <>
                    <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {otpInfo}
                      {' '}
                      <button onClick={() => { setOtpStep('phone'); setOtpCode(''); setError(''); }} className="text-blue-600 hover:underline">
                        تغییر شماره
                      </button>
                    </p>

                    <div className="relative">
                      <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={6}
                        placeholder="- - - - - -"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                        className={`w-full pr-10 pl-4 py-3 rounded-xl border text-center tracking-[0.6em] text-lg font-bold ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                      />
                    </div>

                    {devCode && (
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs text-center">
                        حالت آزمایشی (بدون پیامک): کد شما <span className="font-mono font-bold">{devCode}</span>
                      </div>
                    )}

                    <button
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {otpLoading ? 'در حال بررسی…' : 'تأیید و ورود'}
                    </button>

                    <button
                      onClick={handleSendOtp}
                      disabled={otpLoading || resendIn > 0}
                      className={`w-full text-sm ${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} disabled:opacity-50`}
                    >
                      {resendIn > 0 ? `ارسال مجدد کد (${resendIn})` : 'ارسال مجدد کد'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      برای تکمیل حساب، نام و نام خانوادگی خود را وارد کنید.
                    </p>
                    <div className="relative">
                      <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="نام و نام خانوادگی"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
                        className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                      />
                    </div>
                    <button
                      onClick={handleSaveName}
                      disabled={otpLoading || fullName.trim().length < 3}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {otpLoading ? 'در حال ذخیره…' : 'تکمیل ثبت‌نام و ورود'}
                    </button>
                  </>
                )}

                <p className={`text-xs text-center leading-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  با ورود، شمارهٔ موبایل شما به‌عنوان شناسهٔ حساب ثبت می‌شود.
                </p>
              </div>
            ) : (
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
            )}
          </div>
        ) : (
          /* Admin login (Supabase Auth + staff_accounts) */
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-2">ورود مدیریت</h2>
            <p className={`text-sm text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              با نام کاربری (یا ایمیل) و رمز عبور وارد شوید
            </p>
            <div className="relative">
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" inputMode="text" autoComplete="username" placeholder="نام کاربری یا ایمیل" value={email} onChange={e => setEmail(e.target.value)}
                className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)}
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