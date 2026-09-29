import React, { useState } from 'react';
import {
  Settings2, Trash2, Plus, Pencil, RotateCcw, Send, X, Megaphone,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  useApp, NOTIFICATION_PRIORITY_META, NOTIFICATION_SECTIONS,
  NotificationType, NotificationTypeDef, NotificationPriority, NotificationSettings,
} from '../../store';
import { normalizeHex } from '../../utils/color';

// ---------------------------------------------------------------------------
// Tab 2 of the admin notification center – «تنظیمات اعلانات».
// Full management of the type/color registry, global behavior (master switch,
// retention, popups, sound, default priority) and manual broadcast of a
// colored notification to staff. Extracted into its own module so the main
// page stays readable.
// ---------------------------------------------------------------------------

export const TYPE_ICON_CHOICES = ['🔔', '🛒', '🎫', '💳', '⭐', '📦', '👤', '⚙️', '📝', '🚚', '📊', '🎯', '⏰', '🔥', '💬', '🧾', '🔐', '📣'];

export const COLOR_PRESETS = ['#2563eb', '#d946ef', '#16a34a', '#ca8a04', '#dc2626', '#ea580c', '#0891b2', '#7c3aed', '#0ea5e9', '#64748b', '#db2777', '#4f46e5'];

type SettingsTabProps = {
  card: string;
  inputCls: string;
  darkMode: boolean;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  saveNotificationType: (input: Partial<NotificationTypeDef> & { id: string }) => void;
  deleteNotificationType: (id: string) => void;
  resetNotificationTypes: () => void;
  sendSystemNotification: (input: { title: string; message: string; typeId?: string; priority?: NotificationPriority; link?: string; audience: 'all' | string[] }) => void;
  systemUsers: { id: string; name: string; active: boolean }[];
  currentUser: { name?: string } | null;
  pushAuditLog: (action: string, details: string, module: string) => void;
  getNotificationMeta: (t: NotificationType) => ReturnType<ReturnType<typeof useApp>['getNotificationMeta']>;
};

const AUDIENCE_OPTIONS: { value: 'all' | 'active' | 'admins'; label: string }[] = [
  { value: 'all', label: 'همه کارکنان' },
  { value: 'active', label: 'کارکنان فعال' },
  { value: 'admins', label: 'فقط مدیران' },
];

export default function NotificationSettingsTab(props: SettingsTabProps) {
  const {
    card, inputCls, darkMode, notificationSettings, updateNotificationSettings,
    saveNotificationType, deleteNotificationType, resetNotificationTypes,
    sendSystemNotification, systemUsers, currentUser, pushAuditLog, getNotificationMeta,
  } = props;

  const [editing, setEditing] = useState<NotificationTypeDef | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // «بخش مربوطه» – section of the admin panel each notification type is bound
  // to. Changing it rewrites the default destination («مقصد») used by every
  // future automatic/manual notification of that type (pushNotification and
  // sendSystemNotification fall back to `sectionPath` when no explicit link
  // is given), so the binding takes effect immediately.
  const changeTypeSection = (t: NotificationTypeDef, path: string) => {
    saveNotificationType({ ...t, sectionPath: path || undefined });
    const label = NOTIFICATION_SECTIONS.find(s => s.path === path)?.label;
    pushAuditLog(
      'تغییر بخش نوع اعلان',
      `نوع «${t.label}» (${t.id}) به بخش «${label || 'بدون مقصد'}» متصل شد`,
      'تنظیمات اعلان‌ها',
    );
  };

  // ---- Manual broadcast form state -----------------------------------------
  const [bTitle, setBTitle] = useState('');
  const [bMessage, setMessage] = useState('');
  const [bTypeId, setBTypeId] = useState<string>('system');
  const [bPriority, setBPriority] = useState<NotificationPriority>(notificationSettings.defaultPriority);
  const [bLink, setBLink] = useState('');
  const [bAudience, setBAudience] = useState<'all' | 'active' | 'admins'>('all');
  const [broadcastError, setBroadcastError] = useState('');
  const [broadcastOk, setBroadcastOk] = useState('');

  const enabledCount = notificationSettings.types.filter(t => t.enabled).length;
  const activeStaff = systemUsers.filter(u => u.active);

  const resolveAudience = (): 'all' | string[] => {
    if (bAudience === 'all') return 'all';
    if (bAudience === 'active') return activeStaff.map(u => u.id);
    // «فقط مدیران» – accounts whose name suggests admin access; falls back to
    // all active staff when no such account exists so nothing gets muted.
    const admins = activeStaff.filter(u => /مدیر|admin/i.test(u.name));
    return admins.length ? admins.map(u => u.id) : activeStaff.map(u => u.id);
  };

  const handleBroadcast = () => {
    setBroadcastOk('');
    if (!bTitle.trim() || !bMessage.trim()) {
      setBroadcastError('عنوان و متن اعلان الزامی است.');
      return;
    }
    setBroadcastError('');
    const audience = resolveAudience();
    sendSystemNotification({
      title: bTitle, message: bMessage, typeId: bTypeId,
      priority: bPriority, link: bLink.trim() || undefined, audience,
    });
    pushAuditLog(
      'ارسال اعلان دستی',
      `«${bTitle.trim()}» با نوع «${getNotificationMeta(bTypeId).label}» برای ${audience === 'all' ? 'همه کارکنان' : `${audience.length} نفر`}`,
      'اعلان‌ها',
    );
    setBroadcastOk(`اعلان «${bTitle.trim()}» ارسال شد ✓`);
    setBTitle(''); setMessage(''); setBLink('');
    window.setTimeout(() => setBroadcastOk(''), 4000);
  };

  const toggleTypeEnabled = (t: NotificationTypeDef) => {
    saveNotificationType({ ...t, enabled: !t.enabled });
    pushAuditLog(
      !t.enabled ? 'فعال‌سازی نوع اعلان' : 'غیرفعال‌سازی نوع اعلان',
      `نوع «${t.label}» (${t.id}) ${!t.enabled ? 'فعال' : 'غیرفعال'} شد`,
      'تنظیمات اعلان‌ها',
    );
  };

  return (
    <div className="space-y-4">
      {/* ---------------- Global behavior ---------------- */}
      <div className={`${card} p-4`}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Settings2 size={16} className="text-blue-600" /> رفتار کلی سیستم اعلان
        </h2>

        <button
          onClick={() => {
            updateNotificationSettings({ enabled: !notificationSettings.enabled });
            pushAuditLog(
              notificationSettings.enabled ? 'غیرفعال‌سازی سیستم اعلان' : 'فعال‌سازی سیستم اعلان',
              `کلید اصلی سیستم اعلان ${notificationSettings.enabled ? 'خاموش' : 'روشن'} شد`,
              'تنظیمات اعلان‌ها',
            );
          }}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm mb-3 transition-colors ${
            darkMode ? 'border-slate-600 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {notificationSettings.enabled
              ? <ToggleRight size={22} className="text-green-600" />
              : <ToggleLeft size={22} className="text-red-500 opacity-70" />}
            کلید اصلی سیستم اعلان
            {!notificationSettings.enabled && <span className="text-xs text-red-500">(خاموش – هیچ اعلانی ثبت نمی‌شود)</span>}
          </span>
          <span className="text-xs opacity-60">{notificationSettings.enabled ? 'روشن' : 'خاموش'}</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">حداکثر اعلان‌های نگهداری‌شده</span>
            <input
              type="number" min={10} max={1000} step={10}
              value={notificationSettings.maxItems}
              onChange={e => updateNotificationSettings({ maxItems: Math.max(10, Math.min(1000, Number(e.target.value) || 10)) })}
              className={`${inputCls} w-full`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">اولویت پیش‌فرض اعلان‌های جدید</span>
            <select
              value={notificationSettings.defaultPriority}
              onChange={e => updateNotificationSettings({ defaultPriority: e.target.value as NotificationPriority })}
              className={`${inputCls} w-full`}
            >
              {(Object.keys(NOTIFICATION_PRIORITY_META) as NotificationPriority[]).map(p => (
                <option key={p} value={p}>{NOTIFICATION_PRIORITY_META[p].label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">مدت نمایش پاپ‌آپ (ثانیه)</span>
            <input
              type="number" min={2} max={30}
              value={notificationSettings.popupSeconds}
              onChange={e => updateNotificationSettings({ popupSeconds: Math.max(2, Math.min(30, Number(e.target.value) || 2)) })}
              className={`${inputCls} w-full`}
              disabled={!notificationSettings.showPopups}
            />
          </label>

          <div className="flex flex-col justify-end gap-2">
            <button
              onClick={() => updateNotificationSettings({ showPopups: !notificationSettings.showPopups })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                notificationSettings.showPopups
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : (darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-slate-600 hover:bg-gray-100')
              }`}
            >
              {notificationSettings.showPopups ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              نمایش پاپ‌آپ اعلان جدید
            </button>
            <button
              onClick={() => updateNotificationSettings({ soundEnabled: !notificationSettings.soundEnabled })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                notificationSettings.soundEnabled
                  ? 'bg-green-600 border-green-600 text-white'
                  : (darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-slate-600 hover:bg-gray-100')
              }`}
            >
              {notificationSettings.soundEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              صدای اعلان (Ping)
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Type / color registry ---------------- */}
      <div className={`${card} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Megaphone size={16} className="text-purple-600" /> انواع اعلان و رنگ اختصاصی هر کدام
            <span className="text-xs font-normal opacity-60">({enabledCount.toLocaleString('fa-IR')} از {notificationSettings.types.length.toLocaleString('fa-IR')} نوع فعال)</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing({ id: '', label: '', color: '#0ea5e9', icon: '🔔', enabled: true, builtin: false, deletable: true }); setIsNew(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Plus size={14} /> افزودن نوع جدید
            </button>
            {confirmReset ? (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="opacity-70">بازگشت به پیش‌فرض‌ها؟</span>
                <button
                  onClick={() => { resetNotificationTypes(); setConfirmReset(false); pushAuditLog('بازنشانی انواع اعلان', 'رجیستری انواع اعلان به مقادیر پیش‌فرض بازگشت', 'تنظیمات اعلان‌ها'); }}
                  className="px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                >بله</button>
                <button onClick={() => setConfirmReset(false)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700"><X size={14} /></button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <RotateCcw size={14} /> بازنشانی پیش‌فرض
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs ${darkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-gray-200'} border-b`}>
                <th className="text-right py-2 px-2 font-medium">نوع اعلان</th>
                <th className="text-right py-2 px-2 font-medium">بخش مربوطه (مقصد اعلان)</th>
                <th className="text-right py-2 px-2 font-medium">رنگ اختصاصی</th>
                <th className="text-right py-2 px-2 font-medium">رویدادهای خودکار</th>
                <th className="text-center py-2 px-2 font-medium">وضعیت تولید</th>
                <th className="text-left py-2 px-2 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {notificationSettings.types.map(t => {
                const meta = getNotificationMeta(t.id);
                return (
                  <tr key={t.id} className={`border-b last:border-b-0 ${darkMode ? 'border-slate-700/60' : 'border-gray-100'} ${!t.enabled ? 'opacity-60' : ''}`}>
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className="font-medium">{meta.icon} {t.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300 font-mono" dir="ltr">{t.id}</span>
                        {t.builtin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">سیستمی</span>}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      {/* Binding the type to an admin-panel section – the chosen
                          section becomes the default destination of every
                          notification created with this type. */}
                      <select
                        value={t.sectionPath || ''}
                        onChange={e => changeTypeSection(t, e.target.value)}
                        title="بخشی از پنل مدیریت که اعلان‌های این نوع به آن متصل‌اند (مقصد پیش‌فرض کلیک روی اعلان)"
                        className={`px-2 py-1.5 rounded-lg border text-xs max-w-[190px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-700'
                        } ${!t.sectionPath ? 'border-amber-400 text-amber-600 font-medium' : ''}`}
                      >
                        <option value="">— انتخاب بخش —</option>
                        {NOTIFICATION_SECTIONS.map(s => (
                          <option key={s.path} value={s.path}>{s.label}</option>
                        ))}
                      </select>
                      {t.sectionPath ? (
                        <div className="text-[10px] opacity-50 mt-1 font-mono" dir="ltr">{t.sectionPath}</div>
                      ) : (
                        <div className="text-[10px] text-amber-600 mt-1">اعلان‌های این نوع مقصد مشخصی ندارند</div>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono" dir="ltr">
                        <input
                          type="color"
                          value={normalizeHex(t.color)}
                          onChange={e => saveNotificationType({ ...t, color: normalizeHex(e.target.value) })}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="انتخاب رنگ جدید"
                        />
                        <span style={{ color: meta.color }}>{normalizeHex(t.color)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-xs opacity-70">{t.eventLabel || <span className="italic opacity-60">فقط ارسال دستی</span>}</td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => toggleTypeEnabled(t)}
                        title={t.enabled ? 'کلیک برای غیرفعال‌سازی' : 'کلیک برای فعال‌سازی'}
                        className={`transition-transform hover:scale-110 ${t.enabled ? 'text-green-600' : 'text-red-500 opacity-70'}`}
                      >
                        {t.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing({ ...t }); setIsNew(false); }}
                          title="ویرایش نام، آیکون و رویداد"
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}
                        >
                          <Pencil size={15} />
                        </button>
                        {t.deletable ? (
                          <button
                            onClick={() => { deleteNotificationType(t.id); pushAuditLog('حذف نوع اعلان', `نوع «${t.label}» (${t.id}) حذف شد`, 'تنظیمات اعلان‌ها'); }}
                            title="حذف این نوع"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span title="انواع سیستمی قابل حذف نیستند، اما می‌توانید غیرفعالشان کنید" className="p-1.5 opacity-30"><Trash2 size={15} /></span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] opacity-50 mt-2">
          تغییر رنگ بلافاصله در لیست اعلان‌ها، زنگوله بالای پنل و داشبورد اعمال و به‌صورت محلی ذخیره می‌شود. ستون «بخش مربوطه» مشخص می‌کند اعلان‌های هر نوع به کدام بخش از پنل مدیریت متصل‌اند؛ این بخش، مقصد پیش‌فرض دکمه «مشاهده جزئیات» آن اعلان است.
        </p>
      </div>

      {/* ---------------- Manual broadcast ---------------- */}
      <div className={`${card} p-4`}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Send size={16} className="text-green-600" /> ارسال اعلان دستی برای کارکنان
          <span className="text-xs font-normal opacity-60">(فرستنده: {currentUser?.name || 'مدیر سیستم'})</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">عنوان اعلان *</span>
            <input value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder="مثلاً: جلسه هماهنگی ساعت ۱۴" className={`${inputCls} w-full`} />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block col-span-1">
              <span className="text-xs font-medium opacity-70 block mb-1">نوع / رنگ</span>
              <select value={bTypeId} onChange={e => setBTypeId(e.target.value)} className={`${inputCls} w-full`}>
                {notificationSettings.types.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </label>
            <label className="block col-span-1">
              <span className="text-xs font-medium opacity-70 block mb-1">اولویت</span>
              <select value={bPriority} onChange={e => setBPriority(e.target.value as NotificationPriority)} className={`${inputCls} w-full`}>
                {(Object.keys(NOTIFICATION_PRIORITY_META) as NotificationPriority[]).map(p => (
                  <option key={p} value={p}>{NOTIFICATION_PRIORITY_META[p].label}</option>
                ))}
              </select>
            </label>
            <label className="block col-span-1">
              <span className="text-xs font-medium opacity-70 block mb-1">مخاطبان</span>
              <select value={bAudience} onChange={e => setBAudience(e.target.value as any)} className={`${inputCls} w-full`}>
                {AUDIENCE_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">متن اعلان *</span>
            <textarea value={bMessage} onChange={e => setMessage(e.target.value)} rows={2} placeholder="جزئیات پیام…" className={`${inputCls} w-full resize-y`} />
          </label>
          <label className="block">
            <span className="text-xs font-medium opacity-70 block mb-1">لینک داخلی (اختیاری)</span>
            <input value={bLink} onChange={e => setBLink(e.target.value)} placeholder="/admin/orders" dir="ltr" className={`${inputCls} w-full font-mono text-xs`} />
            {/* Destination hint – shows the section bound to the selected type
                so the admin knows exactly where the notification will point. */}
            <span className="text-[11px] opacity-60 block mt-1 leading-5">
              {(() => {
                const def = notificationSettings.types.find(t => t.id === bTypeId);
                const sec = NOTIFICATION_SECTIONS.find(s => s.path === def?.sectionPath);
                return bLink.trim()
                  ? <>مقصد این اعلان: <code className="font-mono text-blue-600" dir="ltr">{bLink.trim()}</code> (دستی)</>
                  : sec
                    ? <>بدون لینک دستی، مقصد پیش‌فرض بخش «{sec.label}» است: <code className="font-mono text-blue-600" dir="ltr">{sec.path}</code></>
                    : <span className="text-amber-600">نوع انتخابی به بخشی متصل نیست؛ برای مشخص شدن مقصد، لینک داخلی را وارد کنید یا در جدول بالا «بخش مربوطه» آن را تعیین کنید.</span>;
              })()}
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={handleBroadcast}
            disabled={!notificationSettings.enabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={15} /> ارسال اعلان
          </button>
          {!notificationSettings.enabled && <span className="text-xs text-red-500">برای ارسال دستی، ابتدا کلید اصلی سیستم اعلان را روشن کنید.</span>}
          {broadcastError && <span className="text-xs text-red-500">{broadcastError}</span>}
          {broadcastOk && <span className="text-xs text-green-600">{broadcastOk}</span>}
        </div>
      </div>

      {/* ---------------- Edit / add type modal ---------------- */}
      {editing && (
        <TypeEditorModal
          {...{ darkMode, card, inputCls, isNew, editing, types: notificationSettings.types }}
          onClose={() => setEditing(null)}
          onSave={(def) => {
            saveNotificationType(def);
            pushAuditLog(isNew ? 'افزودن نوع اعلان' : 'ویرایش نوع اعلان', `نوع «${def.label}» (${def.id}) ${isNew ? 'ایجاد' : 'به‌روزرسانی'} شد`, 'تنظیمات اعلان‌ها');
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal for creating / editing a notification type (label, id, icon, event).
// Color is editable both here and inline in the table via the color picker.
// ---------------------------------------------------------------------------
function TypeEditorModal(props: {
  darkMode: boolean; card: string; inputCls: string;
  isNew: boolean; editing: NotificationTypeDef; types: NotificationTypeDef[];
  onClose: () => void; onSave: (def: NotificationTypeDef) => void;
}) {
  const { darkMode, card, inputCls, isNew, editing, types, onClose, onSave } = props;
  const [form, setForm] = useState<NotificationTypeDef>(() => ({
    ...editing,
    // Ensure the field exists on brand-new types so React treats it as a
    // controlled input and the admin must pick a section explicitly.
    sectionPath: editing.sectionPath ?? '',
  }));
  const [error, setError] = useState('');

  const submit = () => {
    const id = form.id.trim();
    if (!id) { setError('شناسه انگلیسی نوع الزامی است.'); return; }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id)) { setError('شناسه باید با حرف انگلیسی شروع شود (بدون فاصله).'); return; }
    if (!form.label.trim()) { setError('نام فارسی نوع الزامی است.'); return; }
    if (isNew && types.some(t => t.id === id)) { setError('این شناسه قبلاً ثبت شده است.'); return; }
    // A type must be bound to an exact admin-panel section, otherwise its
    // notifications would have no destination («مقصد») to point at.
    if (!form.sectionPath) { setError('انتخاب «بخش مربوطه» الزامی است؛ مشخص کنید اعلان‌های این نوع به کدام بخش از پنل مدیریت می‌روند.'); return; }
    onSave({ ...form, id, label: form.label.trim(), color: normalizeHex(form.color) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`${card} w-full max-w-md p-4 space-y-3 shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{isNew ? 'افزودن نوع اعلان جدید' : `ویرایش نوع «${editing.label}»`}</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X size={16} /></button>
        </div>

        <label className="block">
          <span className="text-xs font-medium opacity-70 block mb-1">نام نمایشی (فارسی) *</span>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="مثلاً: شارژ کیف پول" className={`${inputCls} w-full`} />
        </label>

        <label className="block">
          <span className="text-xs font-medium opacity-70 block mb-1">شناسه انگلیسی (unique id) *</span>
          <input
            value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
            disabled={!isNew}
            dir="ltr"
            placeholder="wallet-topup"
            className={`${inputCls} w-full font-mono text-xs disabled:opacity-50`}
          />
        </label>

        <div>
          <span className="text-xs font-medium opacity-70 block mb-1">آیکون (ایموجی)</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_ICON_CHOICES.map(ic => (
              <button
                key={ic}
                onClick={() => setForm(f => ({ ...f, icon: ic }))}
                className={`w-9 h-9 rounded-lg text-lg border transition-all ${
                  form.icon === ic ? 'ring-2 ring-blue-500 border-blue-500' : (darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-100')
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium opacity-70 block mb-1">رنگ اختصاصی</span>
          <span className="flex items-center gap-2 flex-wrap">
            <input type="color" value={normalizeHex(form.color)} onChange={e => setForm(f => ({ ...f, color: normalizeHex(e.target.value) }))} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0" />
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${normalizeHex(form.color) === c ? 'border-slate-800 dark:border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium opacity-70 block mb-1">بخش مربوطه در پنل مدیریت * </span>
          <select
            value={form.sectionPath || ''}
            onChange={e => setForm(f => ({ ...f, sectionPath: e.target.value || undefined }))}
            className={`${inputCls} w-full ${!form.sectionPath ? 'border-amber-400' : ''}`}
          >
            <option value="">— انتخاب بخش مقصد —</option>
            {NOTIFICATION_SECTIONS.map(s => (
              <option key={s.path} value={s.path}>{s.label}</option>
            ))}
          </select>
          <span className="text-[11px] opacity-60 block mt-1 leading-5">
            مشخص می‌کند اعلان‌های این نوع به کدام بخش از پنل مربوط باشند؛ مسیر{' '}
            {form.sectionPath
              ? <code className="font-mono text-blue-600" dir="ltr">{form.sectionPath}</code>
              : <span className="text-amber-600">«مشخص نشده»</span>}{' '}
            مقصد پیش‌فرض دکمه «مشاهده جزئیات» هر اعلان از این نوع خواهد بود.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium opacity-70 block mb-1">توضیح رویداد / کاربرد (اختیاری)</span>
          <input value={form.eventLabel || ''} onChange={e => setForm(f => ({ ...f, eventLabel: e.target.value }))} placeholder="مثلاً: پرداخت آنلاین کیف پول" className={`${inputCls} w-full`} />
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="accent-blue-600 w-4 h-4" />
          تولید خودکار این نوع اعلان فعال باشد
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'}`}>
            انصراف
          </button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            {isNew ? 'ایجاد نوع' : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
