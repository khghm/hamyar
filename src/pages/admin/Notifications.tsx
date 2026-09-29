import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Search, Inbox } from 'lucide-react';
import {
  useApp, NOTIFICATION_TYPE_META, NOTIFICATION_PRIORITY_META,
  NotificationType,
} from '../../store';
import { timeAgoFa } from '../../utils/notificationTime';
import { toJalaliString } from '../../utils/jalali';

// ---------------------------------------------------------------------------
// AdminNotifications – full notification center of the admin panel
// (سیستم اعلان پنل مدیریت). Each notification type has its OWN dedicated
// color; the colors come from the central NOTIFICATION_TYPE_META map so they
// are identical here, in the header bell and on the dashboard widget.
// ---------------------------------------------------------------------------

const ALL_TYPES = Object.keys(NOTIFICATION_TYPE_META) as NotificationType[];

export default function AdminNotifications() {
  const {
    darkMode, notifications, unreadNotificationsCount,
    markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications,
  } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const card = `rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white border-gray-300 text-slate-800'
  }`;

  const filtered = useMemo(() => notifications.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;
    if (search.trim()) {
      const q = search.trim();
      if (!n.title.includes(q) && !n.message.includes(q)) return false;
    }
    return true;
  }), [notifications, typeFilter, readFilter, search]);

  // Count per type – used both for the stat chips and the legend below
  const countByType = useMemo(() => {
    const m = {} as Record<NotificationType, number>;
    ALL_TYPES.forEach(t => { m[t] = 0; });
    notifications.forEach(n => { m[n.type] += 1; });
    return m;
  }, [notifications]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <Bell size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold">مرکز اعلان‌ها</h1>
            <p className="text-xs opacity-60">
              هر نوع اعلان رنگ مخصوص خود را دارد · {unreadNotificationsCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsRead}
            disabled={unreadNotificationsCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            <CheckCheck size={16} /> خواندن همه
          </button>
          <button
            onClick={clearReadNotifications}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
              darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            <Trash2 size={16} className="text-red-500" /> پاک کردن خوانده‌شده‌ها
          </button>
        </div>
      </div>

      {/* Color legend: each type with its own dedicated color */}
      <div className={`${card} p-3`}>
        <div className="text-xs font-semibold mb-2 opacity-70">راهنمای رنگ اعلان‌ها:</div>
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map(t => {
            const meta = NOTIFICATION_TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(cur => (cur === t ? 'all' : t))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${meta.badge} ${
                  typeFilter === t ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-slate-800' : 'border-transparent hover:opacity-80'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
                <span className="opacity-70">({countByType[t].toLocaleString('fa-IR')})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className={`${card} p-3 flex flex-wrap items-center gap-2`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در عنوان و متن اعلان‌ها…"
            className={`${inputCls} w-full pr-9`}
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className={inputCls}>
          <option value="all">همه انواع</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{NOTIFICATION_TYPE_META[t].label}</option>)}
        </select>
        <select value={readFilter} onChange={e => setReadFilter(e.target.value as any)} className={inputCls}>
          <option value="all">همه</option>
          <option value="unread">خوانده‌نشده</option>
          <option value="read">خوانده‌شده</option>
        </select>
      </div>

      {/* List */}
      <div className={`${card} overflow-hidden`}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm opacity-60">اعلانی با این فیلترها یافت نشد</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {filtered.map(n => {
              // رنگ مخصوص خود نوع اعلان
              const meta = NOTIFICATION_TYPE_META[n.type];
              const prio = NOTIFICATION_PRIORITY_META[n.priority];
              return (
                <li
                  key={n.id}
                  className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                    !n.read ? (darkMode ? 'bg-slate-700/30' : 'bg-blue-50/40') : 'hover:bg-gray-50 dark:hover:bg-slate-700/20'
                  }`}
                  style={{ borderRight: `4px solid ${meta.color}` }}
                >
                  {/* Colored dot matching the type's own color */}
                  <span className="mt-1.5 w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${meta.badge}`}>{meta.label}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${prio.badge}`}>{prio.label}</span>
                      <span className="text-[11px] opacity-50">{timeAgoFa(n.createdAt)} · {toJalaliString(n.createdAt)}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" title="خوانده نشده" />}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${n.read ? 'opacity-70 font-normal' : ''}`}>{n.title}</div>
                    <div className="text-xs opacity-70 leading-5 mt-0.5">{n.message}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => markNotificationRead(n.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        مشاهده جزئیات
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        title="علامت‌گذاری به‌عنوان خوانده‌شده"
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      title="حذف اعلان"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs opacity-50 text-center">
        حداکثر ۲۰۰ اعلان اخیر نگهداری می‌شود · اعلان‌ها به‌صورت خودکار با ثبت سفارش، تیکت، پرداخت، نظر، کمبود موجودی و عضویت کاربر جدید ایجاد می‌شوند.
      </p>
    </div>
  );
}
