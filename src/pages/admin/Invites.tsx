import React, { useEffect, useMemo, useState } from 'react';
import { useApp, GamificationConfig, LoyaltyTierRule, LoyaltyRewardItem, GamificationBadgeDef, LoyaltyCategory, User } from '../../store';
import {
  Gift, Users, TrendingUp, Award, Gamepad2, Settings2, Trophy, Crown, Medal, Store,
  History, Plus, Trash2, Search, Star, Zap, Percent, CalendarCheck, Save, RotateCcw, AlertTriangle,
} from 'lucide-react';

type TabId = 'overview' | 'club' | 'gamification' | 'rewards' | 'badges' | 'tiers' | 'ledger';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'کدهای دعوت', icon: Gift },
  { id: 'club', label: 'باشگاه مشتریان پروفایل کاربر', icon: Store },
  { id: 'gamification', label: 'تنظیمات گیمیفیکیشن', icon: Gamepad2 },
  { id: 'tiers', label: 'سطوح و طبقات', icon: Crown },
  { id: 'rewards', label: 'فروشگاه پاداش‌ها', icon: Trophy },
  { id: 'badges', label: 'نشان‌ها (مدال‌ها)', icon: Medal },
  { id: 'ledger', label: 'گزارش امتیازات', icon: History },
];

const METRIC_OPTIONS: { value: GamificationBadgeDef['metric']; label: string }[] = [
  { value: 'invitedCount', label: 'تعداد دعوت موفق' },
  { value: 'totalEarnedPoints', label: 'امتیاز کل کسب‌شده' },
  { value: 'ordersCount', label: 'تعداد سفارش' },
  { value: 'reviewsCount', label: 'تعداد نظرات' },
  { value: 'loginStreak', label: 'روزهای ورود پشت‌سرهم' },
];

const CATEGORY_META: Record<LoyaltyCategory, { label: string; cls: string }> = {
  invite: { label: 'دعوت', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  purchase: { label: 'خرید', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  review: { label: 'نظر', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  login_streak: { label: 'ورود روزانه', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  profile: { label: 'تکمیل پروفایل', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  birthday: { label: 'تولد', cls: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  manual: { label: 'دستی ادمین', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  redeem: { label: 'خرج پاداش', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const LEVEL_LABELS: Record<User['level'], string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };

// Small styled input used across the gamification settings form
function NumField({ label, value, onChange, min = 0, step = 1, hint, darkMode, suffix }: {
  label: string; value: number; onChange: (n: number) => void; min?: number; step?: number;
  hint?: string; darkMode: boolean; suffix?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm ${suffix ? 'pl-14' : ''} ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
        />
        {suffix && <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{suffix}</span>}
      </div>
      {hint && <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  );
}

function TextField({ label, value, onChange, darkMode, placeholder }: {
  label: string; value: string; onChange: (s: string) => void; darkMode: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
      />
    </div>
  );
}

export default function AdminInvites() {
  const app = useApp();
  const {
    darkMode, users, orders, reviews,
    loyaltyTx, gamificationConfig, setGamificationConfig, resetLoyaltyData,
    awardLoyaltyPoints, deductLoyaltyPointsForAdmin, redeemLoyaltyReward, setUserLevel, getEarnedBadges,
  } = app;

  const [tab, setTab] = useState<TabId>('overview');
  const [search, setSearch] = useState('');

  // Local draft of the config — saved with the «ذخیره تنظیمات» button
  const [draft, setDraft] = useState<GamificationConfig>(gamificationConfig);
  useEffect(() => { setDraft(gamificationConfig); }, [gamificationConfig]);

  // Per-user management modals
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [awardPts, setAwardPts] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [deductPts, setDeductPts] = useState('');
  const [deductReason, setDeductReason] = useState('');

  // Ledger filters
  const [ledgerFilter, setLedgerFilter] = useState<'all' | LoyaltyCategory>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Unsaved-changes indicator for the tiers/rewards/badges editors
  const arraysDirty = JSON.stringify({ t: draft.tiers, r: draft.rewards, b: draft.badges }) !==
    JSON.stringify({ t: gamificationConfig.tiers, r: gamificationConfig.rewards, b: gamificationConfig.badges });

  const customers = users.filter(u => u.role === 'customer');
  const invitedUsers = customers.filter(u => u.invitedBy);
  const topInviters = [...customers]
    .filter(u => (u.invitedCount || 0) > 0)
    .sort((a, b) => (b.invitedCount || 0) - (a.invitedCount || 0))
    .slice(0, 10);

  const totalInvites = invitedUsers.length;
  const totalPointsAwarded = loyaltyTx.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);

  const filteredCustomers = customers.filter(u =>
    u.name.includes(search) || u.phone.includes(search) || (u.inviteCode && u.inviteCode.includes(search.toUpperCase()))
  );

  const enabledRewards = draft.rewards.filter(r => r.enabled);
  const userOrdersCount = (u: User) => orders.filter(o => o.customerId === u.id && o.status !== 'cancelled').length;

  const ledgerRows = useMemo(() => {
    const list = loyaltyTx.filter(t => {
      if (ledgerFilter !== 'all' && t.category !== ledgerFilter) return false;
      if (!ledgerSearch) return true;
      const usr = users.find(u => u.id === t.userId);
      return (usr?.name || '').includes(ledgerSearch) || t.reason.includes(ledgerSearch);
    });
    return list.slice(0, 300);
  }, [loyaltyTx, ledgerFilter, ledgerSearch, users]);

  const cardCls = `rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`;

  const openManage = (u: User) => { setManageUser(u); setAwardPts(''); setAwardReason(''); setDeductPts(''); setDeductReason(''); };

  const saveDraft = () => { setGamificationConfig(draft); };

  const StatCard = ({ icon: Icon, color, bg, value, label }: any) => (
    <div className={`p-5 rounded-xl border ${cardCls}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('fa-IR') : value}</div>
      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
    </div>
  );

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift size={24} className="text-purple-600" />
          مدیریت کدهای دعوت و باشگاه مشتریان
        </h1>
        <button
          onClick={() => {
            if (confirm('با این کار تمام امتیازها و تراکنش‌های باشگاه مشتریان پاک شده و از صفر شروع می‌شود. ادامه دهید؟')) {
              resetLoyaltyData();
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${darkMode ? 'border-red-800 text-red-400 hover:bg-red-900/30' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
        >
          <RotateCcw size={14} /> پاکسازی و شروع مجدد باشگاه
        </button>
      </div>

      {/* Tabs */}
      <div className={`${cardCls} p-1.5 flex gap-1 overflow-x-auto`}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-purple-600 text-white shadow'
                  : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------- Overview (invite codes) */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={Users} color="text-purple-600" bg="bg-purple-100 dark:bg-purple-900/30" value={customers.length} label="کل مشتریان" />
            <StatCard icon={Gift} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-900/30" value={totalInvites} label="دعوت‌های موفق" />
            <StatCard icon={Award} color="text-green-600" bg="bg-green-100 dark:bg-green-900/30" value={totalPointsAwarded} label="امتیاز اعطا شده" />
            <StatCard icon={TrendingUp} color="text-orange-600" bg="bg-orange-100 dark:bg-orange-900/30" value={topInviters.length} label="دعوت‌کنندگان فعال" />
          </div>

          <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-purple-50 border-purple-200 text-purple-900'}`}>
            <Zap size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <p>
              قوانین فعلی گیمیفیکیشن: هر دعوت موفق ← <b>{gamificationConfig.inviteBonus.toLocaleString('fa-IR')} امتیاز</b> برای دعوت‌کننده و{' '}
              <b>{gamificationConfig.invitedUserBonus.toLocaleString('fa-IR')} امتیاز</b> خوش‌آمدگویی برای دعوت‌شده — هر{' '}
              <b>{gamificationConfig.pointsPerToman.toLocaleString('fa-IR')} تومان</b> خرید ← <b>۱ امتیاز</b> (در سطوح بالاتر با ضریب بیشتر).
              برای تغییر، به تب «تنظیمات گیمیفیکیشن» بروید.
            </p>
          </div>

          {topInviters.length > 0 && (
            <div className={`p-5 ${cardCls}`}>
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
                        {(user.totalEarnedPoints ?? user.loyaltyPoints ?? 0).toLocaleString('fa-IR')} امتیاز کل
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`overflow-hidden ${cardCls}`}>
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
                  <th className="text-right p-3">موجودی امتیاز</th>
                  <th className="text-right p-3">سطح باشگاه</th>
                  <th className="text-right p-3">دعوت شده توسط</th>
                  <th className="text-right p-3">عملیات</th>
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
                      <td className="p-3"><span className="font-bold text-purple-600">{user.invitedCount || 0}</span></td>
                      <td className="p-3 font-bold text-green-600">{(user.loyaltyPoints || 0).toLocaleString('fa-IR')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.level === 'vip' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                          user.level === 'gold' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          user.level === 'silver' ? 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-200' :
                          darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {LEVEL_LABELS[user.level]}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {inviter ? <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{inviter.name}</span>
                          : <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>-</span>}
                      </td>
                      <td className="p-3">
                        <button onClick={() => openManage(user)} className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700">
                          مدیریت باشگاه
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && <p className="text-center py-8 text-sm text-slate-400">مشتری‌ای یافت نشد</p>}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Gamification settings */}
      {tab === 'gamification' && (
        <div className="space-y-6">
          <div className={`p-5 ${cardCls}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold flex items-center gap-2"><Settings2 size={18} className="text-purple-600" /> موتور گیمیفیکیشن باشگاه مشتریان</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={e => setDraft({ ...draft, enabled: e.target.checked })}
                  className="w-4 h-4 accent-purple-600"
                />
                فعال بودن کل سیستم امتیازدهی
              </label>
            </div>
            {!draft.enabled && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                <AlertTriangle size={16} /> سیستم غیرفعال است؛ هیچ امتیازی (خرید، دعوت، ورود و…) اعطا نمی‌شود.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <NumField darkMode={darkMode} label="مبلغ خرید به ازای هر ۱ امتیاز" value={draft.pointsPerToman} suffix="تومان"
                onChange={n => setDraft({ ...draft, pointsPerToman: n })}
                hint="مثلاً ۱۰۰۰۰ یعنی به ازای هر ۱۰ هزار تومان خرید، ۱ امتیاز." />
              <NumField darkMode={darkMode} label="پاداش دعوت‌کننده (به ازای هر دعوت موفق)" value={draft.inviteBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, inviteBonus: n })}
                hint="هنگامی که کاربری با کد دعوت شما ثبت‌نام کند." />
              <NumField darkMode={darkMode} label="پاداش خوش‌آمدگویی کاربر دعوت‌شده" value={draft.invitedUserBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, invitedUserBonus: n })}
                hint="به کاربر جدیدی که با کد دعوت وارد شده اعطا می‌شود." />
              <NumField darkMode={darkMode} label="پاداش ثبت نظر" value={draft.reviewBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, reviewBonus: n })} />
              <NumField darkMode={darkMode} label="پاداش پایه ورود روزانه" value={draft.dailyLoginBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, dailyLoginBonus: n })} />
              <NumField darkMode={darkMode} label="ضریب افزایش پاداش روزهای متوالی" value={draft.streakDayMultiplier} step={0.1} min={0}
                onChange={n => setDraft({ ...draft, streakDayMultiplier: n })}
                hint="پاداش = پایه × روز متوالی (تا سقف) × این ضریب." />
              <NumField darkMode={darkMode} label="سقف روزهای متوالی برای ضریب" value={draft.streakMaxDays} suffix="روز"
                onChange={n => setDraft({ ...draft, streakMaxDays: n })} />
              <NumField darkMode={darkMode} label="پاداش تکمیل پروفایل" value={draft.profileCompletionBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, profileCompletionBonus: n })} />
              <NumField darkMode={darkMode} label="پاداش تولد" value={draft.birthdayBonus} suffix="امتیاز"
                onChange={n => setDraft({ ...draft, birthdayBonus: n })} />
            </div>

            <div className={`mt-5 p-4 rounded-lg text-sm leading-7 ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-slate-600'}`}>
              <b className="text-purple-600">پیش‌نمایش قوانین:</b><br />
              🛒 هر خرید: مبلغ ÷ {draft.pointsPerToman.toLocaleString('fa-IR')} تومان = امتیاز (× ضریب سطح کاربر)<br />
              🤝 دعوت موفق: دعوت‌کننده +{draft.inviteBonus} و دعوت‌شده +{draft.invitedUserBonus} امتیاز<br />
              🔥 ورود روزانه: {draft.dailyLoginBonus} × روز متوالی (تا {draft.streakMaxDays} روز) × {draft.streakDayMultiplier}<br />
              ✍️ ثبت نظر +{draft.reviewBonus} — 👤 تکمیل پروفایل +{draft.profileCompletionBonus} — 🎁 تولد +{draft.birthdayBonus}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={saveDraft} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors">
                <Save size={16} /> ذخیره تنظیمات
              </button>
              <button onClick={() => setDraft(gamificationConfig)} className={`px-5 py-2.5 rounded-lg text-sm font-medium border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                بازگردانی
              </button>
              <button onClick={() => setDraft({ ...draft, ...JSON.parse(JSON.stringify({ pointsPerToman: 10000, inviteBonus: 50, invitedUserBonus: 50, reviewBonus: 10, dailyLoginBonus: 5, streakDayMultiplier: 1, streakMaxDays: 7, profileCompletionBonus: 20, birthdayBonus: 100 })) })}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                مقادیر پیش‌فرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Tiers */}
      {tab === 'tiers' && (
        <div className="space-y-4">
          <div className={`p-4 ${cardCls} text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Crown size={16} className="inline text-yellow-500 ml-1" />
            طبقات بر اساس «امتیاز کل کسب‌شده» محاسبه می‌شوند. ضریب امتیاز روی پاداش خرید اعمال می‌گردد و درصد تخفیف در سبد خرید استفاده می‌شود.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...draft.tiers].sort((a, b) => a.minPoints - b.minPoints).map(t => {
              const idx = draft.tiers.findIndex(x => x.level === t.level);
              const upd = (patch: Partial<LoyaltyTierRule>) => {
                const arr = [...draft.tiers]; arr[idx] = { ...arr[idx], ...patch }; setDraft({ ...draft, tiers: arr });
              };
              return (
                <div key={t.level} className={`p-5 ${cardCls} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      t.level === 'vip' ? 'bg-purple-600 text-white' : t.level === 'gold' ? 'bg-yellow-400 text-black' :
                      t.level === 'silver' ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-200'}`}>
                      {LEVEL_LABELS[t.level]}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{users.filter(u => u.role === 'customer' && u.level === t.level).length} کاربر در این سطح</span>
                  </div>
                  <TextField darkMode={darkMode} label="نام نمایشی طبقه" value={t.label} onChange={v => upd({ label: v })} />
                  <div className="grid grid-cols-3 gap-3">
                    <NumField darkMode={darkMode} label="حداقل امتیاز کل" value={t.minPoints} onChange={n => upd({ minPoints: n })} />
                    <NumField darkMode={darkMode} label="ضریب امتیاز خرید" value={t.multiplier} step={0.1} min={0} onChange={n => upd({ multiplier: n })} suffix="×" />
                    <NumField darkMode={darkMode} label="تخفیف عضویت" value={t.discountPercent} onChange={n => upd({ discountPercent: n })} suffix="٪" />
                  </div>
                  <TextField darkMode={darkMode} label="امتیازها/مزایا (با «،» جدا کنید)" value={t.perks.join('، ')} onChange={v => upd({ perks: v.split('،').map(s => s.trim()).filter(Boolean) })} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveDraft} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">
              <Save size={16} /> ذخیره طبقات
            </button>
            {arraysDirty && <span className="text-xs text-amber-500 font-medium">تغییرات ذخیره‌نشده دارید.</span>}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Rewards catalog */}
      {tab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>🏆 پاداش‌هایی که کاربران در تب «باشگاه مشتریان» پروفایل خود با امتیازخرج می‌کنند.</p>
            <div className="flex gap-2">
              <button onClick={() => setDraft({ ...draft, rewards: [...draft.rewards, { id: 'rw' + Date.now(), title: 'پاداش جدید', description: '', cost: 100, icon: '🎁', enabled: true }] })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                <Plus size={15} /> افزودن پاداش
              </button>
              <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">
                <Save size={15} /> ذخیره
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {draft.rewards.map((r, i) => {
              const upd = (patch: Partial<LoyaltyRewardItem>) => { const arr = [...draft.rewards]; arr[i] = { ...arr[i], ...patch }; setDraft({ ...draft, rewards: arr }); };
              const redemptions = loyaltyTx.filter(t => t.category === 'redeem' && t.reason.includes(r.title)).length;
              return (
                <div key={r.id} className={`p-5 ${cardCls} space-y-3 ${!r.enabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <input dir="ltr" maxLength={2} value={r.icon} onChange={e => upd({ icon: e.target.value })}
                      className={`w-12 text-center text-xl rounded-lg border ${inputCls}`} />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input type="checkbox" checked={r.enabled} onChange={e => upd({ enabled: e.target.checked })} className="w-4 h-4 accent-purple-600" /> فعال
                      </label>
                      <button onClick={() => setDraft({ ...draft, rewards: draft.rewards.filter((_, j) => j !== i) })}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <TextField darkMode={darkMode} label="عنوان پاداش" value={r.title} onChange={v => upd({ title: v })} />
                  <TextField darkMode={darkMode} label="توضیحات" value={r.description} onChange={v => upd({ description: v })} />
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <NumField darkMode={darkMode} label="قیمت" value={r.cost} suffix="امتیاز" onChange={n => upd({ cost: n })} />
                    <div className={`text-xs p-2 rounded-lg ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-slate-500'}`}>
                      تعدادخرج تاکنون: <b>{redemptions}</b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {draft.rewards.length === 0 && <p className="text-center py-8 text-sm text-slate-400">هنوز پاداشی تعریف نشده است.</p>}
          {arraysDirty && <p className="text-xs text-amber-500 font-medium">⚠ تغییرات ذخیره‌نشده دارید — دکمه «ذخیره» را بزنید.</p>}
        </div>
      )}

      {/* ---------------------------------------------------------------- Badges */}
      {tab === 'badges' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>🎖 نشان‌ها زنده روی پروفایل کاربر محاسبه می‌شوند؛ معیار و آستانه هر نشان را اینجا تعیین کنید.</p>
            <div className="flex gap-2">
              <button onClick={() => setDraft({ ...draft, badges: [...draft.badges, { id: 'bg' + Date.now(), name: 'نشان جدید', icon: '🏅', description: '', metric: 'invitedCount', threshold: 5 }] })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                <Plus size={15} /> افزودن نشان
              </button>
              <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">
                <Save size={15} /> ذخیره
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {draft.badges.map((b, i) => {
              const upd = (patch: Partial<GamificationBadgeDef>) => { const arr = [...draft.badges]; arr[i] = { ...arr[i], ...patch }; setDraft({ ...draft, badges: arr }); };
              const holders = customers.filter(u => getEarnedBadges(u).some(e => e.def.id === b.id && e.earned)).length;
              return (
                <div key={b.id} className={`p-5 ${cardCls} space-y-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <input dir="ltr" maxLength={2} value={b.icon} onChange={e => upd({ icon: e.target.value })} className={`w-12 text-center text-xl rounded-lg border ${inputCls}`} />
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-500'}`}>{holders} کاربر اخذ کرده</span>
                      <button onClick={() => setDraft({ ...draft, badges: draft.badges.filter((_, j) => j !== i) })}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <TextField darkMode={darkMode} label="نام نشان" value={b.name} onChange={v => upd({ name: v })} />
                  <TextField darkMode={darkMode} label="توضیح" value={b.description} onChange={v => upd({ description: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1">معیار</label>
                      <select value={b.metric} onChange={e => upd({ metric: e.target.value as GamificationBadgeDef['metric'] })} className={inputCls}>
                        {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <NumField darkMode={darkMode} label="آستانه دریافت" value={b.threshold} onChange={n => upd({ threshold: n })} />
                  </div>
                </div>
              );
            })}
          </div>
          {draft.badges.length === 0 && <p className="text-center py-8 text-sm text-slate-400">هنوز نشانی تعریف نشده است.</p>}
          {arraysDirty && <p className="text-xs text-amber-500 font-medium">⚠ تغییرات ذخیره‌نشده دارید — دکمه «ذخیره» را بزنید.</p>}
        </div>
      )}

      {/* ---------------------------------------------------------------- Customer club management */}
      {tab === 'club' && (
        <div className="space-y-4">
          <div className={`p-4 ${cardCls} text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Store size={16} className="inline text-purple-600 ml-1" />
            مدیریت کامل بخش «باشگاه مشتریان» پروفایل کاربر: سطح هر کاربر، اعطای/کسر دستی امتیاز، فعال‌سازی پاداش از طرف ادمین و مشاهده نشان‌های کسب‌شده.
          </div>
          <div className={`overflow-hidden ${cardCls}`}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <input type="text" placeholder="جستجوی مشتری..." value={search} onChange={e => setSearch(e.target.value)} className={inputCls} />
            </div>
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">مشتری</th>
                  <th className="text-right p-3">سطح</th>
                  <th className="text-right p-3">موجودی</th>
                  <th className="text-right p-3">امتیاز کل</th>
                  <th className="text-right p-3">سفارش / نظر / استریک</th>
                  <th className="text-right p-3">نشان‌ها</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(user => {
                  const earned = getEarnedBadges(user).filter(e => e.earned);
                  return (
                    <tr key={user.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className="p-3">
                        <p className="font-medium">{user.name}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.phone}</p>
                      </td>
                      <td className="p-3">
                        <select value={user.level} onChange={e => setUserLevel(user.id, e.target.value as User['level'])}
                          className={`px-2 py-1 rounded-lg border text-xs ${inputCls}`}>
                          {(Object.keys(LEVEL_LABELS) as User['level'][]).map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                        </select>
                      </td>
                      <td className="p-3 font-bold text-green-600">{(user.loyaltyPoints || 0).toLocaleString('fa-IR')}</td>
                      <td className="p-3">{(user.totalEarnedPoints ?? user.loyaltyPoints ?? 0).toLocaleString('fa-IR')}</td>
                      <td className="p-3 text-xs">
                        {userOrdersCount(user)} / {reviews.filter(r => r.customerName === user.name).length} / {user.loginStreak || 0}🔥
                      </td>
                      <td className="p-3 text-base tracking-wide">{earned.length ? earned.slice(0, 6).map(e => e.def.icon).join(' ') : <span className="text-slate-400 text-xs">-</span>}</td>
                      <td className="p-3">
                        <button onClick={() => openManage(user)} className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700">مدیریت</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && <p className="text-center py-8 text-sm text-slate-400">مشتری‌ای یافت نشد</p>}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Ledger */}
      {tab === 'ledger' && (
        <div className="space-y-4">
          <div className={`p-4 ${cardCls} flex flex-wrap gap-3 items-center`}>
            <div className="flex-1 min-w-48">
              <input type="text" placeholder="جستجو در نام کاربر یا دلیل…" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} className={inputCls} />
            </div>
            <select value={ledgerFilter} onChange={e => setLedgerFilter(e.target.value as any)} className={`w-44 ${inputCls}`}>
              <option value="all">همه دسته‌ها</option>
              {(Object.keys(CATEGORY_META) as LoyaltyCategory[]).map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ledgerRows.length.toLocaleString('fa-IR')} تراکنش</span>
          </div>
          <div className={`overflow-hidden ${cardCls}`}>
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">کاربر</th>
                  <th className="text-right p-3">امتیاز</th>
                  <th className="text-right p-3">دسته</th>
                  <th className="text-right p-3">دلیل</th>
                  <th className="text-right p-3">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map(t => {
                  const usr = users.find(u => u.id === t.userId);
                  const meta = CATEGORY_META[t.category] || CATEGORY_META.manual;
                  return (
                    <tr key={t.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className="p-3 font-medium">{usr?.name || t.userId}</td>
                      <td className={`p-3 font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {t.points > 0 ? '+' : ''}{t.points.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>{meta.label}</span></td>
                      <td className="p-3 text-xs">{t.reason}{t.byAdmin && <span className="mr-1 text-purple-500">(ادمین)</span>}</td>
                      <td className="p-3 text-xs font-mono">{new Date(t.createdAt).toLocaleString('fa-IR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ledgerRows.length === 0 && <p className="text-center py-8 text-sm text-slate-400">تراکنشی یافت نشد — پس از فعال‌بودن سیستم، امتیازهای خرید/دعوت/ورود اینجا ثبت می‌شوند.</p>}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- Manage-user modal */}
      {manageUser && (() => {
        const live = users.find(u => u.id === manageUser.id) || manageUser;
        const badgeState = getEarnedBadges(live);
        const userTx = loyaltyTx.filter(t => t.userId === live.id).slice(0, 10);
        const nextTier = [...gamificationConfig.tiers].sort((a, b) => a.minPoints - b.minPoints).find(t => t.minPoints > (live.totalEarnedPoints ?? live.loyaltyPoints ?? 0));
        const total = live.totalEarnedPoints ?? live.loyaltyPoints ?? 0;
        const prevMin = [...gamificationConfig.tiers].filter(t => t.minPoints <= total).sort((a, b) => b.minPoints - a.minPoints)[0]?.minPoints ?? 0;
        const progress = nextTier ? Math.min(100, Math.round(((total - prevMin) / Math.max(1, nextTier.minPoints - prevMin)) * 100)) : 100;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setManageUser(null)}>
            <div className={`w-full max-w-2xl my-8 rounded-2xl p-6 space-y-5 ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><Store size={20} className="text-purple-600" /> باشگاه مشتریان — {live.name}</h3>
                <button onClick={() => setManageUser(null)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>✕</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xl font-bold text-green-600">{(live.loyaltyPoints || 0).toLocaleString('fa-IR')}</div>
                  <div className="text-xs text-slate-400">موجودی قابل خرج</div>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xl font-bold">{total.toLocaleString('fa-IR')}</div>
                  <div className="text-xs text-slate-400">امتیاز کل</div>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xl font-bold text-purple-600">{live.invitedCount || 0}</div>
                  <div className="text-xs text-slate-400">دعوت موفق</div>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="text-xl font-bold">{(live.loginStreak || 0)}</div>
                  <div className="text-xs text-slate-400">روز ورود متوالی 🔥</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>پیشرفت به {nextTier ? `سطح «${nextTier.label}» (${nextTier.minPoints.toLocaleString('fa-IR')})` : 'بالاترین سطح'}</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className={`h-2.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">تنظیم دستی سطح کاربر</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(LEVEL_LABELS) as User['level'][]).map(l => (
                    <button key={l} onClick={() => setUserLevel(live.id, l)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        live.level === l ? 'bg-purple-600 text-white border-purple-600'
                          : darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                      {LEVEL_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl space-y-2 ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">➕ اعطای دستی امتیاز</p>
                  <input type="number" min={1} value={awardPts} onChange={e => setAwardPts(e.target.value)} placeholder="مقدار امتیاز" className={inputCls} />
                  <input type="text" value={awardReason} onChange={e => setAwardReason(e.target.value)} placeholder="دلیل (اختیاری)" className={inputCls} />
                  <button
                    onClick={() => {
                      const n = Number(awardPts);
                      if (!n || n <= 0) { alert('مقدار امتیاز معتبر نیست'); return; }
                      awardLoyaltyPoints(live.id, n, awardReason || 'اعطای دستی توسط مدیر', { category: 'manual' });
                      setAwardPts(''); setAwardReason('');
                    }}
                    className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">اعطا</button>
                </div>
                <div className={`p-4 rounded-xl space-y-2 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">➖ کسر امتیاز</p>
                  <input type="number" min={1} value={deductPts} onChange={e => setDeductPts(e.target.value)} placeholder="مقدار امتیاز" className={inputCls} />
                  <input type="text" value={deductReason} onChange={e => setDeductReason(e.target.value)} placeholder="دلیل (اختیاری)" className={inputCls} />
                  <button
                    onClick={() => {
                      const n = Number(deductPts);
                      if (!n || n <= 0) { alert('مقدار امتیاز معتبر نیست'); return; }
                      if (!deductLoyaltyPointsForAdmin(live.id, n, deductReason || 'کسر دستی توسط مدیر')) alert('موجودی کاربر کافی نیست.');
                      setDeductPts(''); setDeductReason('');
                    }}
                    className="w-full py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700">کسر</button>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold mb-2">🎁 فعال‌سازی پاداش از طرف ادمین ({enabledRewards.length} پاداش فعال)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {enabledRewards.map(r => {
                    const canAfford = (live.loyaltyPoints || 0) >= r.cost;
                    return (
                      <button key={r.id} disabled={!canAfford}
                        onClick={() => {
                          const res = redeemLoyaltyReward(live.id, r.id);
                          alert(res.ok ? `پاداش «${r.title}» برای ${live.name} فعال شد.` : res.error);
                        }}
                        className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-right text-sm transition-colors ${
                          canAfford ? (darkMode ? 'border-purple-700 hover:bg-purple-900/30' : 'border-purple-200 hover:bg-purple-50')
                                    : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-slate-700'}`}>
                        <span>{r.icon} {r.title}</span>
                        <span className="font-bold text-purple-600 shrink-0">{r.cost.toLocaleString('fa-IR')} امتیاز</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold mb-2">🎖 وضعیت نشان‌ها</p>
                <div className="flex flex-wrap gap-2">
                  {badgeState.map(e => (
                    <span key={e.def.id} title={`${e.def.name} — ${e.progress}%`}
                      className={`px-2.5 py-1 rounded-full text-xs ${e.earned ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-400'}`}>
                      {e.def.icon} {e.def.name} {e.earned ? '✓' : `${e.progress}%`}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold mb-2">آخرین تراکنش‌ها</p>
                {userTx.length === 0 ? <p className="text-xs text-slate-400">تراکنشی ثبت نشده است.</p> : (
                  <div className="space-y-1">
                    {userTx.map(t => (
                      <div key={t.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <span>{t.reason} <span className={`mr-1 px-1.5 py-0.5 rounded ${CATEGORY_META[t.category]?.cls || ''}`}>{CATEGORY_META[t.category]?.label}</span></span>
                        <span className={`font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>{t.points > 0 ? '+' : ''}{t.points.toLocaleString('fa-IR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
