import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useApp, getProjectService, PROJECT_QTY_KEYS, SERVICE_URGENCY_MULTIPLIER, ProjectService,
} from '../store';
import {
  ShoppingCart, CheckCircle2, ArrowLeft, ArrowRight, CreditCard, FileText, HardDrive,
  Loader2, Lock, ShieldCheck, Wallet, X, Zap, Globe, Smartphone, Bot, MessageSquare,
  User, PenTool, Instagram, Video, Search,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Public details page for every item of the «طراحی سایت» and «تولید محتوا»
// sections (/project-services/:id). The card is selectable and opens this
// exact details page with a 3-step wizard:
//   1) Enter the supplementary information (dynamic per-service fields)
//   2) Upload the required documents from disk
//   3) Pay online through the gateway or with the wallet balance
// After a successful payment an order tracking code (کد سفارش) is generated.
// The store then keeps the admin panel sections that reference this code in
// full sync: Orders, Projects (linked project), Invoices/Finance, SMS and the
// audit log.
// ---------------------------------------------------------------------------

const MAX_FILE_MB = 5;
type Step = 0 | 1 | 2 | 3; // 0 details, 1 docs, 2 payment, 3 done

interface UploadedDoc {
  key: string;
  label: string;
  name: string;
  size: number;
  dataUrl: string;
}

const ICONS: Record<string, any> = {
  ShoppingCart, Globe, Smartphone, Bot, MessageSquare, User, PenTool, Instagram, Video, Search,
};

export default function ProjectServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, currentUser, createProjectOrder } = useApp();

  const service = getProjectService(id);
  const isWeb = service?.group === 'webdesign';
  const accent = isWeb ? 'blue' : 'pink';

  const [step, setStep] = useState<Step>(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, UploadedDoc>>({});
  const [docError, setDocError] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [urgent, setUrgent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');
  const [payError, setPayError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ trackingCode: string; total: number } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Pre-fill contact fields from the logged-in customer profile
  const fieldDefault = (key: string): string => {
    if (formData[key] !== undefined) return formData[key];
    if (!currentUser) return '';
    if (key === 'fullName') return currentUser.name || '';
    if (key === 'phone') return currentUser.phone || '';
    return '';
  };

  // Quantity multiplier derived from the relevant numeric field of the service
  const quantity = useMemo(() => {
    if (!service) return 1;
    for (const k of PROJECT_QTY_KEYS) {
      const raw = fieldDefault(k);
      if (raw && Number(raw) > 0) return Math.floor(Number(raw));
    }
    return 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, service]);

  if (!service) {
    return (
      <div className="fade-in max-w-3xl mx-auto px-4 py-20 text-center">
        <FileText size={56} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
        <h1 className="text-2xl font-bold mb-3">خدمت یافت نشد</h1>
        <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          این خدمت وجود ندارد یا از فهرست حذف شده است.
        </p>
        <Link to="/webdesign" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 ml-3">
          بازگشت به طراحی سایت
        </Link>
        <Link to="/content" className="inline-block px-6 py-3 rounded-xl bg-pink-600 text-white font-medium hover:bg-pink-700">
          بازگشت به تولید محتوا
        </Link>
      </div>
    );
  }

  const Icon = ICONS[service.icon] || Globe;
  const unitPrice = urgent ? Math.round(service.basePrice * SERVICE_URGENCY_MULTIPLIER) : service.basePrice;
  const total = unitPrice * quantity;
  const walletBalance = currentUser?.walletBalance || 0;

  const validateDetails = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of service.fields) {
      const v = (fieldDefault(f.key) || '').trim();
      if (f.required && !v) {
        errs[f.key] = `«${f.label}» الزامی است`;
        continue;
      }
      if (v && f.type === 'number' && (isNaN(Number(v)) || Number(v) <= 0)) {
        errs[f.key] = 'لطفاً یک عدد معتبر وارد کنید';
      }
      if (v && f.key === 'phone' && !/^09\d{9}$/.test(v)) {
        errs[f.key] = 'شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد';
      }
      if (v && f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        errs[f.key] = 'ایمیل معتبر نیست';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNextFromDetails = () => {
    if (validateDetails()) setStep(1);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFile = (slotKey: string, label: string, file: File | undefined) => {
    setDocError('');
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setDocError(`حجم فایل «${file.name}» بیشتر از ${MAX_FILE_MB} مگابایت است`);
      return;
    }
    setUploadingKey(slotKey);
    const reader = new FileReader();
    reader.onload = () => {
      setDocs(prev => ({ ...prev, [slotKey]: { key: slotKey, label, name: file.name, size: file.size, dataUrl: String(reader.result) } }));
      setUploadingKey(null);
    };
    reader.onerror = () => {
      setDocError('خواندن فایل ناموفق بود، دوباره تلاش کنید');
      setUploadingKey(null);
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (slotKey: string) => {
    setDocs(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const goNextFromDocs = () => {
    const missing = service.docs.filter(d => d.required && !docs[d.key]);
    if (missing.length > 0) {
      setDocError(`لطفاً مدارک الزامی را بارگذاری کنید: ${missing.map(m => m.label).join('، ')}`);
      return;
    }
    setDocError('');
    setStep(2);
  };

  const pay = () => {
    setPayError('');
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      setPayError('موجودی کیف پول شما کافی نیست. می‌توانید از بخش «کیف پول» در پروفایل آن را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.');
      return;
    }
    setProcessing(true);
    // Simulate the bank/gateway redirect + callback round-trip
    const gatewayRef = paymentMethod === 'online'
      ? 'BG-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 900 + 100)
      : undefined;
    setTimeout(() => {
      const res = createProjectOrder({
        projectService: service as ProjectService,
        quantity,
        urgent,
        formData: service.fields.reduce((acc, f) => {
          const v = fieldDefault(f.key).trim();
          if (v) acc[f.key] = v;
          return acc;
        }, {} as Record<string, string>),
        documents: service.docs.filter(d => docs[d.key]).map(d => docs[d.key]),
        paymentMethod,
        gatewayRef,
      });
      setProcessing(false);
      if (!res.ok || !res.order) {
        setPayError(res.error || 'خطا در ثبت سفارش رخ داد، لطفاً دوباره تلاش کنید');
        return;
      }
      setResult({ trackingCode: res.order.trackingCode, total: res.order.total });
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const fmt = (n: number) => n.toLocaleString('fa-IR');
  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10'
        : darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-200 focus:border-blue-400'
    } outline-none`;
  const cardCls = `rounded-2xl border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`;
  const primaryBtn = `flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all bg-${accent}-600 hover:bg-${accent}-700`;
  const steps = ['اطلاعات تکمیلی', 'بارگذاری مدارک', 'پرداخت'];

  return (
    <div className="fade-in max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className={`flex items-center gap-2 text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <Link to="/" className="hover:text-blue-600">خانه</Link>
        <ArrowLeft size={14} />
        <Link to={isWeb ? '/webdesign' : '/content'} className="hover:text-blue-600">
          {isWeb ? 'طراحی سایت' : 'تولید محتوا'}
        </Link>
        <ArrowLeft size={14} />
        <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{service.title}</span>
      </div>

      {/* Service header */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isWeb ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-pink-100 dark:bg-pink-900/30'}`}>
              <Icon size={28} className={isWeb ? 'text-purple-600' : 'text-pink-600'} />
            </div>
            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full ${isWeb ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'}`}>
                {isWeb ? 'طراحی سایت، اپلیکیشن و ربات' : 'تولید محتوا'}
              </span>
              <h1 className="text-2xl font-black mt-2">{service.title}</h1>
              <p className={`mt-2 text-sm leading-7 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{service.desc}</p>
              <ul className="flex flex-wrap gap-2 mt-3">
                {service.features.map(f => (
                  <li key={f} className={`text-xs px-2.5 py-1 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-left">
            <div className={`${isWeb ? 'text-blue-600' : 'text-pink-600'} font-black text-xl`}>
              {fmt(service.basePrice)} <span className="text-sm font-normal">تومان</span>
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>قیمت پایه / هر {service.unit}</div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? 'bg-green-500 text-white' : i === step ? `${isWeb ? 'bg-blue-600' : 'bg-pink-600'} text-white` : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 size={16} /> : fmt(i + 1)}
                </span>
                <span className={`text-xs md:text-sm font-medium ${i === step ? (darkMode ? 'text-white' : 'text-slate-800') : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 md:w-12 h-0.5 ${i < step ? 'bg-green-500' : darkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ------------------------- STEP 1: supplementary info ------------------------- */}
      {step === 0 && (
        <div className={cardCls}>
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
            <FileText size={20} className={isWeb ? 'text-blue-600' : 'text-pink-600'} /> تکمیل اطلاعات {service.title}
          </h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            موارد ستاره‌دار الزامی هستند. این اطلاعات مستقیماً در پرونده سفارش و پروژه شما ثبت و برای کارشناسان نمایش داده می‌شود.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.fields.map(f => (
              <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.type === 'select' ? (
                  <select value={fieldDefault(f.key)} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} className={inputCls(!!errors[f.key])}>
                    <option value="">انتخاب کنید…</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows={3} placeholder={f.placeholder} value={fieldDefault(f.key)} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} className={inputCls(!!errors[f.key])} />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text'}
                    placeholder={f.placeholder}
                    value={fieldDefault(f.key)}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    className={inputCls(!!errors[f.key])}
                  />
                )}
                {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
              </div>
            ))}
          </div>

          {/* Urgency toggle with live price preview */}
          <div className={`mt-6 p-4 rounded-xl border ${urgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <Zap size={18} className="text-orange-500" />
              <div>
                <div className="text-sm font-bold">انجام فوری این پروژه</div>
                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>۵۰٪ اضافه بر قیمت پایه – اولویت VIP در صف انجام کار</div>
              </div>
            </label>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                پیش‌بینی مبلغ: {fmt(quantity)} × {fmt(unitPrice)} تومان
              </span>
              <span className={`font-black ${isWeb ? 'text-blue-600' : 'text-pink-600'}`}>{fmt(total)} تومان</span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={goNextFromDetails} className={primaryBtn}>
              مرحله بعد: بارگذاری مدارک
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------- STEP 2: documents ------------------------ */}
      {step === 1 && (
        <div className={cardCls}>
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><HardDrive size={20} className={isWeb ? 'text-blue-600' : 'text-pink-600'} /> بارگذاری مدارک از روی هارد</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            فایل‌ها به صورت امن همراه سفارش ثبت می‌شوند و در پنل مدیریت قابل مشاهده و تأیید هستند. حداکثر حجم هر فایل {MAX_FILE_MB} مگابایت.
          </p>
          <div className="space-y-4">
            {service.docs.map(d => {
              const uploaded = docs[d.key];
              return (
                <div key={d.key} className={`p-4 rounded-xl border ${uploaded ? 'border-green-300 bg-green-50/60 dark:bg-green-900/10' : darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-bold">
                        {d.label} {d.required && <span className="text-red-500">*</span>}
                      </div>
                      {d.hint && <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{d.hint}</div>}
                    </div>
                    {!uploaded && (
                      <div className="flex items-center gap-2">
                        <input
                          ref={el => { fileInputRefs.current[d.key] = el; }}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,image/*,.zip"
                          className="hidden"
                          onChange={e => handleFile(d.key, d.label, e.target.files?.[0])}
                        />
                        <button
                          onClick={() => fileInputRefs.current[d.key]?.click()}
                          disabled={uploadingKey === d.key}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 ${isWeb ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                        >
                          {uploadingKey === d.key ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                          انتخاب فایل
                        </button>
                      </div>
                    )}
                  </div>
                  {uploaded && (
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-dashed border-green-300/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        <span className="text-sm truncate" title={uploaded.name}>{uploaded.name}</span>
                        <span className={`text-xs shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({fmt(Math.round(uploaded.size / 1024))} کیلوبایت)</span>
                      </div>
                      <button onClick={() => removeDoc(d.key)} className="flex items-center gap-1 text-xs text-red-500 hover:underline shrink-0">
                        <X size={14} /> حذف و انتخاب مجدد
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {docError && <p className="text-sm text-red-500 mt-4">{docError}</p>}

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700">
              <ArrowRight size={16} />
              بازگشت
            </button>
            <button onClick={goNextFromDocs} className={primaryBtn}>
              مرحله بعد: پرداخت
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------- STEP 3: payment -------------------------- */}
      {step === 2 && (
        <div className={cardCls}>
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><CreditCard size={20} className={isWeb ? 'text-blue-600' : 'text-pink-600'} /> پرداخت هزینه سفارش</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            پس از پرداخت موفق، کد سفارش (کد رهگیری) شما صادر می‌شود؛ سفارش، پروژه مرتبط در پنل مدیریت، فاکتور رسید و پیامک وضعیت همگی به‌صورت خودکار هماهنگ می‌مانند.
          </p>

          {/* Summary */}
          <div className={`p-4 rounded-xl mb-6 space-y-2 text-sm ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>خدمت</span><span className="font-bold">{service.title}</span></div>
            <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>بخش</span><span>{isWeb ? 'طراحی سایت' : 'تولید محتوا'}</span></div>
            <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>تعداد / حجم</span><span>{fmt(quantity)} {service.unit}</span></div>
            <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>نوع انجام</span><span>{urgent ? 'فوری (+۵۰٪)' : 'عادی'}</span></div>
            <div className="flex justify-between"><span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>مدارک بارگذاری‌شده</span><span>{fmt(Object.keys(docs).length)} فایل</span></div>
            <div className="flex justify-between pt-2 border-t border-dashed border-gray-300 dark:border-slate-600">
              <span className="font-bold">مبلغ قابل پرداخت</span>
              <span className={`font-black ${isWeb ? 'text-blue-600' : 'text-pink-600'} text-lg`}>{fmt(total)} تومان</span>
            </div>
          </div>

          {!currentUser ? (
            <div className="text-center py-6">
              <Lock size={36} className={`mx-auto mb-3 ${darkMode ? 'text-slate-500' : 'text-gray-300'}`} />
              <p className="mb-4">برای پرداخت و ثبت سفارش ابتدا وارد حساب کاربری خود شوید.</p>
              <Link to="/auth" className={`inline-block px-6 py-3 rounded-xl text-white font-medium ${isWeb ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'}`}>ورود / ثبت‌نام</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1"><CreditCard size={18} className="text-blue-600" /> پرداخت آنلاین (درگاه بانکی)</div>
                  <p className={`text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>اتصال به درگاه اینترنتی امن، پرداخت با تمام کارت‌های عضو شتاب</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${paymentMethod === 'wallet' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1"><Wallet size={18} className="text-purple-600" /> پرداخت از کیف پول</div>
                  <p className={`text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    موجودی فعلی: {fmt(walletBalance)} تومان
                    {walletBalance < total && <span className="text-red-500"> (کافی نیست)</span>}
                  </p>
                </button>
              </div>

              {payError && <p className="text-sm text-red-500 mt-4">{payError}</p>}

              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(1)} disabled={processing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                  <ArrowRight size={16} />
                  بازگشت
                </button>
                <button
                  onClick={pay}
                  disabled={processing}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-l from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 shadow-md"
                >
                  {processing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {processing ? 'در حال اتصال به درگاه…' : `پرداخت ${fmt(total)} تومان`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------- STEP 4: done ----------------------------- */}
      {step === 3 && result && (
        <div className={`${cardCls} text-center py-12`}>
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-black mb-2">پرداخت موفق – کد سفارش صادر شد</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            کد سفارش زیر را نگه دارید. این کد در بخش‌های «سفارش‌ها»، «پروژه‌ها»، «فاکتورها/مالی»، «پیامک‌ها» و «گزارش فعالیت» پنل مدیریت به‌صورت هماهنگ پیگیری می‌شود.
          </p>
          <div className="inline-block px-8 py-4 rounded-2xl bg-blue-600 text-white font-mono text-2xl font-black tracking-widest mb-2 select-all">
            {result.trackingCode}
          </div>
          <div className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مبلغ پرداختی: {fmt(result.total)} تومان</div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={`/track?code=${result.trackingCode}`} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">پیگیری سفارش</Link>
            <Link to="/profile" className={`px-6 py-3 rounded-xl border font-medium ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>مشاهده سفارشات من</Link>
            <Link to={isWeb ? '/webdesign' : '/content'} className={`px-6 py-3 rounded-xl border font-medium ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>بازگشت به بخش {isWeb ? 'طراحی سایت' : 'تولید محتوا'}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
