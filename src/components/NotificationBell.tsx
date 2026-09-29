import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useApp, NOTIFICATION_PRIORITY_META } from '../store';
import { timeAgoFa } from '../utils/notificationTime';

// ---------------------------------------------------------------------------
// NotificationBell – header bell of the admin panel (سیستم اعلان پنل مدیریت)
// Every notification is rendered with its type's OWN dedicated color. The
// colors/labels/icons come from the admin-managed settings registry via
// `getNotificationMeta`, so changing a type's color in «تنظیمات اعلان» is
// reflected here instantly.
// ---------------------------------------------------------------------------

interface Props {
  onNavigate?: () => void; // used on mobile to close the sidebar after a click
}

export default function NotificationBell({ onNavigate }: Props) {
  const {
    darkMode, notifications, unreadNotificationsCount, getNotificationMeta,
    markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications,
  } = useApp();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close the dropdown when clicking outside or navigating between pages
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const recent = notifications.slice(0, 8);

  return (
    <div ref={wrapRef} className="relative">
      {/* Bell button with unread counter */}
      <button
        onClick={() => setOpen(o => !o)}
        title="اعلان‌ها"
        aria-label={`اعلان‌ها${unreadNotificationsCount ? `، ${unreadNotificationsCount} خوانده‌نشده` : ''}`}
        className={`relative p-2 rounded-lg text-xs sm:text-sm transition-colors ${
          darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
        }`}
      >
        <Bell size={20} className={darkMode ? 'text-slate-300' : 'text-slate-600'} />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadNotificationsCount > 99 ? '۹۹+' : unreadNotificationsCount.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute left-0 top-full mt-2 w-[min(92vw,380px)] rounded-xl border shadow-2xl overflow-hidden z-50 ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-slate-800'
        }`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
            <span className="font-bold text-sm">اعلان‌ها {unreadNotificationsCount > 0 && (
              <span className="text-red-500 text-xs">({unreadNotificationsCount.toLocaleString('fa-IR')} جدید)</span>
            )}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllNotificationsRead}
                disabled={unreadNotificationsCount === 0}
                title="خواندن همه"
                className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-500 disabled:opacity-30 disabled:cursor-default"
              >
                <CheckCheck size={16} />
              </button>
              <button
                onClick={clearReadNotifications}
                title="پاک کردن خوانده‌شده‌ها"
                className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} title="بستن" className="p-1.5 rounded-md hover:bg-gray-500/10">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700/50">
            {recent.length === 0 && (
              <div className="py-10 text-center text-sm opacity-60">اعلانی وجود ندارد</div>
            )}
            {recent.map(n => {
              // رنگ مخصوص خود نوع اعلان – از رجیستری قابل‌ویرایش تنظیمات (getNotificationMeta)
              const meta = getNotificationMeta(n.type);
              const prio = NOTIFICATION_PRIORITY_META[n.priority];
              const inner = (
                <>
                  <span
                    className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 self-start"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={meta.badgeStyle}
                      >
                        {meta.icon} {meta.label}
                      </span>
                      {(n.priority === 'high' || n.priority === 'urgent') && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${prio.badge}`}>{prio.label}</span>
                      )}
                      <span className="text-[10px] opacity-50 mr-auto">{timeAgoFa(n.createdAt)}</span>
                    </span>
                    <span className={`block text-sm font-semibold mt-1 ${!n.read ? '' : 'opacity-60 font-normal'}`}>
                      {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-1.5 align-middle" />}
                      {n.title}
                    </span>
                    <span className="block text-xs opacity-70 leading-5 line-clamp-2">{n.message}</span>
                  </span>
                </>
              );
              return (
                <div key={n.id} className={`group relative ${!n.read ? (darkMode ? 'bg-slate-700/30' : 'bg-blue-50/40') : ''}`}>
                  <div className="flex items-start gap-2.5 px-3 py-2.5">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => { markNotificationRead(n.id); onNavigate?.(); }}
                        className="flex items-start gap-2.5 flex-1 min-w-0 text-right"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button onClick={() => markNotificationRead(n.id)} className="flex items-start gap-2.5 flex-1 min-w-0 text-right">
                        {inner}
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      title="حذف اعلان"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-red-500 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`px-4 py-2.5 border-t text-center ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <Link
              to="/admin/notifications"
              onClick={onNavigate}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              مشاهده همه اعلان‌ها ←
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
