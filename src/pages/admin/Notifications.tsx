import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Search, Inbox, Settings2, ListOrdered, Plus, Pencil,
  RotateCcw, Send, X, Megaphone, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  useApp, NOTIFICATION_PRIORITY_META, DEFAULT_NOTIFICATION_TYPES,
  NotificationType, NotificationTypeDef, NotificationPriority, AdminNotification,
} from '../../store';
import { timeAgoFa } from '../../utils/notificationTime';
import { toJalaliString } from '../../utils/jalali';
import { normalizeHex, rgba } from '../../utils/color';

// ---------------------------------------------------------------------------
// AdminNotifications – full notification center of the admin panel
// (سیستم اعلان پنل مدیریت). Two tabs:
//   • «اعلان‌ها»  – the list itself; each type renders with its OWN dedicated
//     color taken from the admin-managed settings registry.
//   • «تنظیمات»   – full management: add / edit / delete notification types,
//     change each type's color & icon, enable/disable per-type generation,
//     global behavior (master switch, retention, popups, sound, default
//     priority) and manual broadcast of a colored notification to staff.
// ---------------------------------------------------------------------------

const TYPE_ICON_CHOICES = ['🔔', '🛒', '🎫', '💳', '⭐', '📦', '👤', '⚙️', '📝', '🚚', '📊', '🎯', '⏰', '🔥', '💬', '🧾', '🔐', '📣'];

const COLOR_PRESETS = ['#2563eb', '#d946ef', '#16a34a', '#ca8a04', '#dc2626', '#ea580c', '#0891b2', '#7c3aed', '#0ea5e9', '#64748b', '#db2777', '#4f46e5'];

export default function AdminNotifications() {
  const app = useApp();
  const {
    darkMode, notifications, unreadNotificationsCount, getNotificationMeta,
    markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications,
    notificationSettings, updateNotificationSettings, saveNotificationType,
    deleteNotificationType, resetNotificationTypes, sendSystemNotification,
    systemUsers, currentUser, logAdminAction,
  } = app;

  const [tab, setTab] = useState<'list' | 'settings'>('list');

  const card = `rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white border-gray-300 text-slate-800'
  }`;

  // Types that actually appear in the current data + everything enabled —
  // used for the legend chips and the filter dropdown.
  const visibleTypes = useMemo(() => {
    const used = new Set(notifications.map(n => n.type));
    return notificationSettings.types.filter(t => t.enabled || used.has(t.id));
  }, [notificationSettings.types, notifications]);

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
              {!notificationSettings.enabled && <span className="text-red-500 font-semibold"> · سیستم اعلان غیرفعال است</span>}
            </p>
          </div>
        </div>
        {/* Tabs */}
        <div className={`flex rounded-lg border overflow-hidden ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
          <button
            onClick={() => setTab('list')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === 'list' ? 'bg-blue-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-100')
            }`}
          >
            <ListOrdered size={16} /> اعلان‌ها
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === 'settings' ? 'bg-blue-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-100')
            }`}
          >
            <Settings2 size={16} /> تنظیمات
          </button>
        </div>
      </div>

      {tab === 'list'
        ? <NotificationsListTab {...{ card, inputCls, darkMode, notifications, unreadNotificationsCount, getNotificationMeta, visibleTypes, markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications }} />
        : <NotificationSettingsTab {...{ card, inputCls, darkMode, notificationSettings, updateNotificationSettings, saveNotificationType, deleteNotificationType, resetNotificationTypes, sendSystemNotification, systemUsers, currentUser, logAdminAction, getNotificationMeta }} />}

      <p className="text-xs opacity-50 text-center">
        حداکثر {notificationSettings.maxItems.toLocaleString('fa-IR')} اعلان اخیر نگهداری می‌شود (قابل تغییر از تب تنظیمات) · اعلان‌ها به‌صورت خودکار با ثبت سفارش، تیکت، پرداخت، نظر، کمبود موجودی و عضویت کاربر جدید ایجاد می‌شوند.
      </p>
    </div>
  );
}

// ===========================================================================
// Tab 1 – the notification list (unchanged behavior, settings-driven colors)
// ===========================================================================
function NotificationsListTab(props: any) {
  const {
    card, inputCls, darkMode, notifications, unreadNotificationsCount, getNotificationMeta, visibleTypes,
    markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications,
  } = props as {
    card: string; inputCls: string; darkMode: boolean;
    notifications: AdminNotification[]; unreadNotificationsCount: number;
    getNotificationMeta: (t: NotificationType) => ReturnType<ReturnType<typeof useApp>['getNotificationMeta']>;
    visibleTypes: NotificationTypeDef[];
    markNotificationRead: (id: string) => void; markAllNotificationsRead: () => void;
    deleteNotification: (id: string) => void; clearReadNotifications: () => void;
  };

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

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
    const m: Record<string, number> = {};
    visibleTypes.forEach(t => { m[t.id] = 0; });
    notifications.forEach(n => { m[n.type] = (m[n.type] || 0) + 1; });
    return m;
  }, [notifications, visibleTypes]);

  return (
    <>
      {/* Color legend: each type with its own dedicated color */}
      <div className={`${card} p-3`}>
        <div className="text-xs font-semibold mb-2 opacity-70">راهنمای رنگ اعلان‌ها (قابل ویرایش در تب «تنظیمات»):</div>
        <div className="flex flex-wrap gap-2">
          {visibleTypes.map(t => {
            const meta = getNotificationMeta(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setTypeFilter((cur: string) => (cur === t.id ? 'all' : t.id))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  typeFilter === t.id ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-slate-800' : 'border-transparent hover:opacity-80'
                } ${!t.enabled ? 'opacity-50' : ''}`}
                style={{ ...meta.badgeStyle, backgroundColor: typeFilter === t.id ? rgba(meta.color, 0.25) : meta.badgeStyle.backgroundColor }}
                title={t.enabled ? 'فیلتر این نوع' : 'این نوع در تنظیمات غیرفعال شده'}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.icon} {meta.label}
                <span className="opacity-70">({(countByType[t.id] || 0).toLocaleString('fa-IR')})</span>
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
          {visibleTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={readFilter} onChange={e => setReadFilter(e.target.value as any)} className={inputCls}>
          <option value="all">همه</option>
          <option value="unread">خوانده‌نشده</option>
          <option value="read">خوانده‌شده</option>
        </select>
        <div className="flex items-center gap-2 mr-auto">
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

      {/* List */}
      <div className={`${card} overflow-hidden`}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm opacity-60">اعلانی با این فیلترها یافت نشد</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {filtered.map((n: AdminNotification) => {
              // رنگ مخصوص خود نوع اعلان – از رجیستری قابل‌ویرایش تنظیمات
              const meta = getNotificationMeta(n.type);
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
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={meta.badgeStyle}>{meta.icon} {meta.label}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${prio.badge}`}>{prio.label}</span>
                      <span className="text-[11px] opacity-50">{timeAgoFa(n.createdAt)} · {toJalaliString(n.createdAt)}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" title="خوانده نشده" />}
                      {n.recipientIds && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">اختصاصی · {n.recipientIds.length} نفر</span>}
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
    </>
  );
}
