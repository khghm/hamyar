import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type {
  User,
  AdminNotification,
  NotificationType,
  NotificationPriority,
  NotificationTypeDef,
  NotificationSettings,
  ResolvedNotificationMeta,
  NotificationSectionDef,
  NotificationSectionScope,
  SmsLog,
  AuditLog,
} from '../domains/types';
import { normalizeHex, badgeStyle } from '../utils/color';
import { logActivity } from '../utils/auditLog';
import {
  fetchNotifications,
  createNotification as apiCreateNotification,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
  deleteNotification as apiDeleteNotif,
  clearReadNotifications as apiClearRead,
  isServerNotificationId,
  toNotification,
} from '../api/notifications';
import { onSyncError } from '../api/sync';
import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';
import { supabase } from '../lib/supabase';
import { subscribeTableChanges, onTabVisible, debounce } from '../lib/realtime';

export const NOTIFICATION_SECTION_SCOPE_LABEL: Record<NotificationSectionScope, string> = {
  admin: 'پنل مدیریت',
  public: 'بخش عمومی سایت',
};

const PUBLIC_NOTIFICATION_SECTIONS: NotificationSectionDef[] = [
  { path: '/',                    label: 'صفحه اصلی',            scope: 'public' },
  { path: '/services',            label: 'خدمات',                scope: 'public' },
  { path: '/store',               label: 'فروشگاه',              scope: 'public' },
  { path: '/media',               label: 'کالکشن مدیا',          scope: 'public' },
  { path: '/webdesign',           label: 'طراحی سایت',           scope: 'public' },
  { path: '/content',             label: 'تولید محتوا',          scope: 'public' },
  { path: '/asiatech',            label: 'آسیاتک',               scope: 'public' },
  { path: '/news',                label: 'اخبار و مقالات',       scope: 'public' },
  { path: '/about',               label: 'درباره ما',            scope: 'public' },
  { path: '/contact',             label: 'تماس با ما',           scope: 'public' },
  { path: '/faq',                 label: 'سوالات متداول',        scope: 'public' },
  { path: '/track',               label: 'پیگیری سفارش',         scope: 'public' },
  { path: '/cart',                label: 'سبد خرید',             scope: 'public' },
  { path: '/profile',             label: 'حساب کاربری مشتری',    scope: 'public' },
  { path: '/auth',                label: 'ورود / ثبت‌نام',       scope: 'public' },
];

const ADMIN_NOTIFICATION_SECTIONS: NotificationSectionDef[] = [
  { path: '/admin',                 label: 'داشبورد',                 scope: 'admin' },
  { path: '/admin/analytics',       label: 'تحلیل و گزارش',           scope: 'admin' },
  { path: '/admin/digital-marketing', label: 'دیجیتال مارکتینگ',      scope: 'admin' },
  { path: '/admin/affiliates',      label: 'همکاران',                 scope: 'admin' },
  { path: '/admin/personas',        label: 'پرسونای مخاطب',           scope: 'admin' },
  { path: '/admin/orders',          label: 'سفارش‌ها',                 scope: 'admin' },
  { path: '/admin/notes',           label: 'یادداشت‌ها',               scope: 'admin' },
  { path: '/admin/customers',       label: 'مشتریان',                 scope: 'admin' },
  { path: '/admin/invites',         label: 'کدهای دعوت',              scope: 'admin' },
  { path: '/admin/products',        label: 'محصولات',                 scope: 'admin' },
  { path: '/admin/media',           label: 'کالکشن مدیا',             scope: 'admin' },
  { path: '/admin/services',        label: 'خدمات',                   scope: 'admin' },
  { path: '/admin/projects',        label: 'پروژه‌ها',                scope: 'admin' },
  { path: '/admin/finance',         label: 'حسابداری',                scope: 'admin' },
  { path: '/admin/invoices',        label: 'فاکتورها',                scope: 'admin' },
  { path: '/admin/employees',       label: 'کارمندان',                scope: 'admin' },
  { path: '/admin/okr-kpi',         label: 'OKR و KPI',               scope: 'admin' },
  { path: '/admin/suppliers',       label: 'تأمین‌کنندگان',           scope: 'admin' },
  { path: '/admin/campaigns',       label: 'کمپین تخفیف',             scope: 'admin' },
  { path: '/admin/sms',             label: 'پیامک انبوه',             scope: 'admin' },
  { path: '/admin/reviews',         label: 'نظرات',                   scope: 'admin' },
  { path: '/admin/tickets',         label: 'تیکت و پشتیبانی',         scope: 'admin' },
  { path: '/admin/notifications',   label: 'اعلان‌ها',                scope: 'admin' },
  { path: '/admin/content-team',    label: 'تیم تولید محتوا',         scope: 'admin' },
  { path: '/admin/rbac',            label: 'کنترل دسترسی (RBAC)',     scope: 'admin' },
  { path: '/admin/training',        label: 'آموزش ادمین',             scope: 'admin' },
  { path: '/admin/audit',           label: 'لاگ فعالیت',              scope: 'admin' },
  { path: '/admin/backup',          label: 'پشتیبان‌گیری',            scope: 'admin' },
  { path: '/admin/settings',        label: 'تنظیمات',                 scope: 'admin' },
];

export const NOTIFICATION_SECTIONS: NotificationSectionDef[] = [
  ...PUBLIC_NOTIFICATION_SECTIONS,
  ...ADMIN_NOTIFICATION_SECTIONS,
];

export const NOTIFICATION_SECTIONS_BY_SCOPE: Record<NotificationSectionScope, NotificationSectionDef[]> = {
  public: PUBLIC_NOTIFICATION_SECTIONS,
  admin: ADMIN_NOTIFICATION_SECTIONS,
};

export function findNotificationSection(path?: string): NotificationSectionDef | undefined {
  return path ? NOTIFICATION_SECTIONS.find(s => s.path === path) : undefined;
}

const DEFAULT_NOTIFICATION_TYPES: NotificationTypeDef[] = [
  { id: 'order',    label: 'سفارش جدید',       color: '#2563eb', icon: '🛒', enabled: true, builtin: true, deletable: false, eventLabel: 'ثبت سفارش خدمات و پروژه‌ها', sectionPath: '/admin/orders' },
  { id: 'ticket',   label: 'تیکت پشتیبانی',    color: '#d946ef', icon: '🎫', enabled: true, builtin: true, deletable: false, eventLabel: 'باز شدن تیکت جدید توسط مشتری', sectionPath: '/admin/tickets' },
  { id: 'payment',  label: 'پرداخت و مالی',    color: '#16a34a', icon: '💳', enabled: true, builtin: true, deletable: false, eventLabel: 'پرداخت آنلاین موفق و صدور رسید', sectionPath: '/admin/invoices' },
  { id: 'customer', label: 'مشتری جدید',       color: '#ea580c', icon: '👤', enabled: true, builtin: true, deletable: false, eventLabel: 'عضویت مشتری جدید', sectionPath: '/admin/customers' },
  { id: 'product',  label: 'محصول و انبار',    color: '#dc2626', icon: '📦', enabled: true, builtin: true, deletable: false, eventLabel: 'رسیدن موجودی محصول به آستانه هشدار', sectionPath: '/admin/products' },
  { id: 'content',  label: 'تولید محتوا',      color: '#7c3aed', icon: '📝', enabled: true, builtin: true, deletable: false, eventLabel: 'ایجاد تسک جدید در تیم تولید محتوا', sectionPath: '/admin/content-team' },
  { id: 'loyalty',  label: 'باشگاه مشتریان',   color: '#ca8a04', icon: '⭐', enabled: true, builtin: true, deletable: false, eventLabel: 'تغییر سطح و امتیاز مشتریان', sectionPath: '/admin/invites' },
  { id: 'system',   label: 'سیستمی',           color: '#0891b2', icon: '⚙️', enabled: true, builtin: true, deletable: false, eventLabel: 'پشتیبان‌گیری خودکار و اطلاع‌رسانی دستی مدیر', sectionPath: '/admin/backup' },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  maxItems: 200,
  showPopups: true,
  popupSeconds: 6,
  soundEnabled: false,
  defaultPriority: 'normal',
  types: DEFAULT_NOTIFICATION_TYPES,
};

interface CrossStoreShim {
  currentUser?: User | null;
  currentUserName?: string;
  setAuditLogs?: (a: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  setSmsLogs?: (s: SmsLog[] | ((prev: SmsLog[]) => SmsLog[])) => void;
  darkMode?: boolean;
}

const getCrossStore = (): CrossStoreShim => {
  const out: CrossStoreShim = {};
  try {
    const s = useAuthStore.getState();
    out.currentUser = s.currentUser;
    out.currentUserName = s.currentUser?.name;
    out.setAuditLogs = s.setAuditLogs;
    out.setSmsLogs = s.setSmsLogs;
  } catch {}
  try {
    const s = useThemeStore.getState();
    out.darkMode = !!s.darkMode;
  } catch {}
  return out;
};

const resolveNotificationMeta = (
  type: NotificationType,
  types: NotificationTypeDef[],
  darkMode: boolean,
): ResolvedNotificationMeta => {
  const def = types.find(t => t.id === type);
  const color = normalizeHex(def?.color || '#64748b');
  const section = findNotificationSection(def?.sectionPath);
  return {
    id: def?.id ?? type,
    label: def?.label ?? 'اعلان',
    icon: def?.icon ?? '🔔',
    color,
    enabled: def ? def.enabled : true,
    builtin: def?.builtin ?? false,
    deletable: def?.deletable ?? true,
    eventLabel: def?.eventLabel,
    sectionPath: def?.sectionPath,
    sectionLabel: section?.label ?? '',
    sectionScope: section?.scope,
    badgeStyle: badgeStyle(color, darkMode),
  };
};

const playNotificationPing = () => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {}
};

interface NotificationState {
  notifications: AdminNotification[];
  /**
   * کلیدهای اعلان‌هایی که ادمین حذف کرده است.
   *
   * بعضی اعلان‌ها (مثل «رسید تحویل صادر شد») هنگام هر بارگذاری دوباره ساخته
   * می‌شوند و `dedupeKey` یکسان دارند؛ بدون این فهرست، حذف‌کردنشان بی‌اثر بود و
   * بعد از رفرش برمی‌گشتند.
   */
  dismissedKeys: string[];
  setNotifications: (n: AdminNotification[]) => void;
  unreadNotificationsCount: number;
  pushNotification: (input: { type: NotificationType; title: string; message: string; link?: string; priority?: NotificationPriority; key?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
  notificationToasts: AdminNotification[];
  dismissNotificationToast: (id: string) => void;
  getNotificationMeta: (type: NotificationType) => ResolvedNotificationMeta;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  saveNotificationType: (input: Partial<NotificationTypeDef> & { id: string }) => void;
  deleteNotificationType: (id: string) => void;
  resetNotificationTypes: () => void;
  sendSystemNotification: (input: { title: string; message: string; typeId?: string; priority?: NotificationPriority; link?: string; audience: 'all' | string[] }) => void;
  pushAuditLog: (action: string, details: string, module: string) => void;
  pushSmsLog: (phone: string, message: string) => void;
  pushSystemError: (title: string, message: string) => void;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startRealtime: () => void;
  stopRealtime: () => void;
}

let notificationRealtimeUnsub: (() => void) | null = null;
let notificationVisibilityUnsub: (() => void) | null = null;
let notificationRefreshInFlight = false;

const debouncedNotificationRefresh = debounce(() => {
  refreshNotificationsFromServer();
}, 400);

async function refreshNotificationsFromServer() {
  if (notificationRefreshInFlight) return;
  notificationRefreshInFlight = true;
  try {
    const cloud = await fetchNotifications().catch(() => null);
    if (!Array.isArray(cloud)) return;
    const curr = useNotificationStore.getState().notifications;
    const maxItems = useNotificationStore.getState().notificationSettings.maxItems;
    const byKey = new Map<string, AdminNotification>();
    for (const n of curr) {
      const k = (n as any).dedupeKey || n.id;
      byKey.set(k, n);
    }
    for (const c of cloud) {
      if (!c || !c.id) continue;
      const k = (c as any).dedupeKey || c.id;
      const existing = byKey.get(k);
      byKey.set(k, { ...(existing || {}), ...c });
    }
    const merged = Array.from(byKey.values())
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, maxItems);
    useNotificationStore.setState({
      notifications: merged,
      unreadNotificationsCount: merged.reduce((c: number, n: AdminNotification) => c + (n.read ? 0 : 1), 0),
    });
  } finally {
    notificationRefreshInFlight = false;
  }
}

const notificationStorage: StateStorage = {
  getItem: (name) => {
    try {
      const saved = localStorage.getItem(name);
      if (saved) {
        // مقدار خراب (مثلاً "[object Object]" از نسخه‌های قبلی) نباید کل
        // بازیابی را بشکند.
        try {
          JSON.parse(saved);
          return saved;
        } catch {
          localStorage.removeItem(name);
        }
      }
    } catch {}
    try {
      const legacyNotifs = localStorage.getItem('hamyar_notifications');
      const legacySettings = localStorage.getItem('hamyar_notification_settings');
      if (legacyNotifs || legacySettings) {
        const state: Partial<NotificationState> = {};
        if (legacyNotifs) {
          try { state.notifications = JSON.parse(legacyNotifs); } catch {}
        }
        if (legacySettings) {
          try {
            const parsed = JSON.parse(legacySettings) as Partial<NotificationSettings>;
            const savedTypes = Array.isArray(parsed.types) ? parsed.types : [];
            const byId = new Map<string, NotificationTypeDef>();
            DEFAULT_NOTIFICATION_TYPES.forEach(t => byId.set(t.id, t));
            savedTypes.forEach(t => { if (t && typeof t.id === 'string') byId.set(t.id, t); });
            state.notificationSettings = {
              ...DEFAULT_NOTIFICATION_SETTINGS,
              ...parsed,
              maxItems: Math.min(500, Math.max(20, Number(parsed.maxItems) || 200)),
              popupSeconds: Math.min(30, Math.max(2, Number(parsed.popupSeconds) || 6)),
              types: [...byId.values()],
            };
          } catch {}
        }
        return JSON.stringify({ state, version: 0 });
      }
    } catch {}
    return null;
  },
  // `persist` ممکن است مقدار را به‌صورت رشته بدهد؛ اگر شیء داد هم خراب نشود.
  setItem: (name, value) =>
    localStorage.setItem(name, typeof value === 'string' ? value : JSON.stringify(value)),
  removeItem: (name) => localStorage.removeItem(name),
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get): NotificationState => ({
      notifications: [],
      dismissedKeys: [],
      setNotifications: (notifications) => set({ notifications }),

      unreadNotificationsCount: 0,

      hydrated: false,

      hydrate: async () => {
        try {
          const cloud = await fetchNotifications();
          if (Array.isArray(cloud) && cloud.length > 0) {
            const maxItems = get().notificationSettings.maxItems;
            set((s: NotificationState) => {
              const merged = [...cloud, ...s.notifications.filter(n => !isServerNotificationId(n.id))];
              const seen = new Set<string>();
              const deduped = merged.filter(n => {
                const k = (n as any).dedupeKey || n.id;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              }).slice(0, maxItems);
              return {
                notifications: deduped,
                unreadNotificationsCount: deduped.reduce((c: number, n: AdminNotification) => c + (n.read ? 0 : 1), 0),
                hydrated: true,
              };
            });
          } else {
            set({ hydrated: true });
          }
        } catch (e: any) {
          console.warn('[notificationStore] hydrate failed:', e?.message || e);
          set({ hydrated: true });
        }
        try {
          onSyncError((ev) => {
            try {
              const s = get();
              if (!s.hydrated) return;
              s.pushNotification({
                type: 'system',
                priority: 'high',
                title: 'خطای همگام‌سازی',
                message: String(ev?.message || 'خطا در برقراری ارتباط با سرور') + ' (' + (ev?.table || 'general') + ')',
              });
            } catch {}
          });
        } catch {}
      },

      pushNotification: ({ type, title, message, link, priority, key }) => {
        const settings = get().notificationSettings;
        if (!settings.enabled) return;
        const def = settings.types.find((t: NotificationTypeDef) => t.id === type);
        if (def && !def.enabled) return;
        if (key && get().notifications.some((n: AdminNotification & { dedupeKey?: string }) => n.dedupeKey === key)) return;
        // اگر ادمین همین اعلان را قبلاً حذف کرده، دوباره ساخته نشود.
        if (key && get().dismissedKeys.includes(key)) return;
        const now = new Date().toISOString();
        const n: AdminNotification & { dedupeKey?: string } = {
          id: 'ntf' + Date.now() + Math.random().toString(36).slice(2, 6),
          type,
          priority: priority ?? settings.defaultPriority,
          title,
          message,
          link: link ?? def?.sectionPath,
          read: false,
          createdAt: now,
          dedupeKey: key,
        };
        const wasUnread = !n.read ? 1 : 0;
        set((state: NotificationState) => ({
          notifications: [n, ...state.notifications].slice(0, settings.maxItems),
          unreadNotificationsCount: state.unreadNotificationsCount + wasUnread,
        }));
        if (settings.showPopups) {
          set((state: NotificationState) => ({
            notificationToasts: [...state.notificationToasts.slice(-2), n],
          }));
          window.setTimeout(() => get().dismissNotificationToast(n.id), Math.max(2, settings.popupSeconds) * 1000);
        }
        if (settings.soundEnabled) playNotificationPing();
        const optimisticId = n.id;
        const cs = getCrossStore();
        (async () => {
          if (!get().hydrated) return;
          try {
            const res = await apiCreateNotification({
              type: n.type,
              priority: n.priority,
              title: n.title,
              message: n.message,
              link: n.link,
              userId: cs.currentUser?.id || null,
              dedupeKey: n.dedupeKey,
            });
            if (res.ok && res.id && !res.duplicate) {
              set((st: NotificationState) => ({
                notifications: st.notifications.map(x => x.id === optimisticId ? { ...x, id: res.id! } : x),
              }));
            }
          } catch (e: any) {
            console.warn('[notificationStore] pushNotification sync failed:', e?.message || e);
          }
        })();
      },

      markNotificationRead: (id) => {
        const wasUnread = get().notifications.some((n: AdminNotification) => n.id === id && !n.read);
        set((state: NotificationState) => ({
          notifications: state.notifications.map((n: AdminNotification) =>
            n.id === id && !n.read ? { ...n, read: true } : n,
          ),
          unreadNotificationsCount: wasUnread
            ? state.unreadNotificationsCount - 1
            : state.unreadNotificationsCount,
        }));
        if (get().hydrated && isServerNotificationId(id)) {
          (async () => {
            try {
              await apiMarkRead(id, true);
            } catch (e: any) {
              console.warn('[notificationStore] markNotificationRead sync failed:', e?.message || e);
            }
          })();
        }
      },

      markAllNotificationsRead: () => {
        set((state: NotificationState) => ({
          notifications: state.notifications.map((n: AdminNotification) => ({ ...n, read: true })),
          unreadNotificationsCount: 0,
        }));
        const cs = getCrossStore();
        const uid = cs.currentUser?.id;
        if (get().hydrated && uid) {
          (async () => {
            try {
              await apiMarkAllRead(uid);
            } catch (e: any) {
              console.warn('[notificationStore] markAllNotificationsRead sync failed:', e?.message || e);
            }
          })();
        }
      },

      deleteNotification: (id) => {
        const before = get().notifications;
        const prevUnread = get().unreadNotificationsCount;
        const target = before.find((n: AdminNotification) => n.id === id);
        const dismissedKey = (target as (AdminNotification & { dedupeKey?: string }) | undefined)?.dedupeKey;
        set({
          notifications: before.filter((n: AdminNotification) => n.id !== id),
          unreadNotificationsCount: Math.max(0, prevUnread - (target && !target.read ? 1 : 0)),
          ...(dismissedKey && !get().dismissedKeys.includes(dismissedKey)
            ? { dismissedKeys: [...get().dismissedKeys, dismissedKey].slice(-300) }
            : {}),
        });

        // اعلان محلی (id غیر UUID) فقط در همین مرورگر وجود دارد.
        if (!get().hydrated || !isServerNotificationId(id)) return;

        (async () => {
          try {
            const res = await apiDeleteNotif(id);
            if (!res.ok) throw new Error(res.error || 'حذف اعلان در سرور ناموفق بود');
            // ۲۰۴ بدون حذف یعنی RLS اجازه نداده (مثلاً نشست منقضی شده).
            if (res.deleted === false) {
              throw new Error('این اعلان در سرور حذف نشد؛ احتمالاً نشست مدیریت منقضی شده است. دوباره وارد شوید.');
            }
          } catch (e: any) {
            // برگرداندن اعلان: کاربر باید ببیند حذف واقعاً انجام نشده است.
            set({
              notifications: before,
              unreadNotificationsCount: prevUnread,
              ...(dismissedKey ? { dismissedKeys: get().dismissedKeys.filter((k: string) => k !== dismissedKey) } : {}),
            });
            try {
              get().pushNotification({
                type: 'system',
                priority: 'high',
                title: 'حذف اعلان انجام نشد',
                message: e?.message || 'خطا در ارتباط با سرور',
                key: 'notif-del-err-' + id,
              });
            } catch {}
          }
        })();
      },

      clearReadNotifications: () => {
        const before = get().notifications;
        const prevUnread = get().unreadNotificationsCount;
        const readOnes = before.filter((n: AdminNotification) => n.read);
        const readCount = readOnes.length;
        const newKeys: string[] = readOnes
          .map((n: AdminNotification & { dedupeKey?: string }) => n.dedupeKey)
          .filter((k: string | undefined): k is string => !!k && !get().dismissedKeys.includes(k));
        set({
          notifications: before.filter((n: AdminNotification) => !n.read),
          ...(newKeys.length ? { dismissedKeys: [...get().dismissedKeys, ...newKeys].slice(-300) } : {}),
        });

        if (!get().hydrated || readCount === 0) return;

        (async () => {
          try {
            const res = await apiClearRead();
            if (!res.ok) throw new Error(res.error || 'پاک‌سازی اعلان‌ها ناموفق بود');
          } catch (e: any) {
            set({ notifications: before, unreadNotificationsCount: prevUnread });
            try {
              get().pushNotification({
                type: 'system',
                priority: 'high',
                title: 'پاک‌سازی اعلان‌ها انجام نشد',
                message: e?.message || 'خطا در ارتباط با سرور',
                key: 'notif-clear-err-' + Date.now(),
              });
            } catch {}
          }
        })();
      },

      notificationToasts: [],

      dismissNotificationToast: (id) =>
        set((state: NotificationState) => ({
          notificationToasts: state.notificationToasts.filter((t: AdminNotification) => t.id !== id),
        })),

      getNotificationMeta: (type) => {
        const cs = getCrossStore();
        return resolveNotificationMeta(type, get().notificationSettings.types, !!cs.darkMode);
      },

      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

      updateNotificationSettings: (patch) =>
        set((state: NotificationState) => {
          const nextSettings = { ...state.notificationSettings, ...patch };
          let nextNotifications = state.notifications;
          if (typeof patch.maxItems === 'number') {
            nextNotifications = state.notifications.slice(0, patch.maxItems!);
          }
          const nextUnread = nextNotifications.reduce((c: number, n: AdminNotification) => c + (n.read ? 0 : 1), 0);
          return {
            notificationSettings: nextSettings,
            notifications: nextNotifications,
            unreadNotificationsCount: nextUnread,
          };
        }),

      saveNotificationType: (input) => {
        const id = input.id.trim();
        if (!id) return;
        set((state: NotificationState) => {
          const exists = state.notificationSettings.types.some((t: NotificationTypeDef) => t.id === id);
          if (exists) {
            return {
              notificationSettings: {
                ...state.notificationSettings,
                types: state.notificationSettings.types.map((t: NotificationTypeDef) =>
                  t.id === id ? { ...t, ...input, id, color: normalizeHex(input.color || t.color) } : t,
                ),
              },
            };
          }
          const created: NotificationTypeDef = {
            id,
            label: input.label || 'اعلان جدید',
            color: normalizeHex(input.color || '#0ea5e9'),
            icon: input.icon || '🔔',
            enabled: input.enabled ?? true,
            builtin: false,
            deletable: true,
            eventLabel: input.eventLabel,
            sectionPath: input.sectionPath,
          };
          return {
            notificationSettings: {
              ...state.notificationSettings,
              types: [...state.notificationSettings.types, created],
            },
          };
        });
      },

      deleteNotificationType: (id) =>
        set((state: NotificationState) => {
          const target = state.notificationSettings.types.find((t: NotificationTypeDef) => t.id === id);
          if (!target || !target.deletable) return state;
          return {
            notificationSettings: {
              ...state.notificationSettings,
              types: state.notificationSettings.types.filter((t: NotificationTypeDef) => t.id !== id),
            },
          };
        }),

      resetNotificationTypes: () =>
        set((state: NotificationState) => ({
          notificationSettings: {
            ...state.notificationSettings,
            types: DEFAULT_NOTIFICATION_TYPES.map((t: NotificationTypeDef) => ({ ...t })),
          },
        })),

      sendSystemNotification: ({ title, message, typeId, priority, link, audience }) => {
        const trimmedTitle = title.trim();
        const trimmedMessage = message.trim();
        if (!trimmedTitle || !trimmedMessage) return;
        const state = get();
        const settings = state.notificationSettings;
        const actualTypeId = typeId || 'system';
        const typeDef = settings.types.find((t: NotificationTypeDef) => t.id === actualTypeId);
        const finalLink = link ?? typeDef?.sectionPath;
        const recipientIds = audience === 'all' ? undefined : audience;
        const now = new Date().toISOString();
        const items: AdminNotification[] =
          recipientIds && recipientIds.length > 0
            ? recipientIds.map((rid, i) => ({
                id: 'ntf' + Date.now() + 'a' + i + Math.random().toString(36).slice(2, 5),
                type: actualTypeId,
                priority: priority ?? settings.defaultPriority,
                title: trimmedTitle,
                message: trimmedMessage,
                link: finalLink,
                read: false,
                createdAt: now,
                recipientIds,
              }))
            : [{
                id: 'ntf' + Date.now() + 'b' + Math.random().toString(36).slice(2, 5),
                type: actualTypeId,
                priority: priority ?? settings.defaultPriority,
                title: trimmedTitle,
                message: trimmedMessage,
                link: finalLink,
                read: false,
                createdAt: now,
              }];
        set((s: NotificationState) => ({
          notifications: [...items, ...s.notifications].slice(0, settings.maxItems),
          unreadNotificationsCount: s.unreadNotificationsCount + items.length,
        }));
        if (settings.showPopups && items.length > 0) {
          const first = items[0];
          set((s: NotificationState) => ({
            notificationToasts: [...s.notificationToasts.slice(-2), first],
          }));
          window.setTimeout(() => get().dismissNotificationToast(first.id), Math.max(2, settings.popupSeconds) * 1000);
        }
        const cs = getCrossStore();
        if (cs.setAuditLogs) {
          cs.setAuditLogs(prev => [
            logActivity(
              cs.currentUserName || 'مدیر سیستم',
              'ارسال اعلان دستی',
              `عنوان: ${trimmedTitle} · مخاطب: ${recipientIds ? `${recipientIds.length} نفر` : 'همه کارکنان'}`,
              'اعلان‌ها',
            ),
            ...prev,
          ]);
        }
      },

      pushAuditLog: (action, details, module) => {
        const cs = getCrossStore();
        if (cs.setAuditLogs) {
          cs.setAuditLogs(prev => [
            logActivity(cs.currentUserName || 'مدیر سیستم', action, details, module),
            ...prev,
          ]);
        }
      },

      pushSmsLog: (phone, message) => {
        const cs = getCrossStore();
        if (cs.setSmsLogs) {
          cs.setSmsLogs(prev => [{
            id: 'sms' + Date.now() + Math.random().toString(36).slice(2, 6),
            phone,
            message,
            date: new Date().toISOString(),
            status: 'sent' as const,
          }, ...prev]);
        }
      },

      pushSystemError: (title, message) => {
        get().pushNotification({
          type: 'system',
          title,
          message,
          priority: 'high',
          key: 'syserr-' + Date.now(),
        });
      },

      startRealtime: async () => {
        if (notificationRealtimeUnsub) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        notificationRealtimeUnsub = subscribeTableChanges(
          'notifications-changes',
          'notifications',
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;
            const st = useNotificationStore.getState();
            const maxItems = st.notificationSettings.maxItems;

            if (eventType === 'DELETE') {
              if (!oldRow) return;
              const id = String(oldRow.id ?? '');
              if (!id) return;
              const next = st.notifications.filter(n => n.id !== id);
              useNotificationStore.setState({
                notifications: next,
                unreadNotificationsCount: next.reduce((c, n) => c + (n.read ? 0 : 1), 0),
              });
              return;
            }

            if (!newRow) return;
            const incoming = toNotification(newRow);
            if (!incoming || !incoming.id) return;

            const idx = st.notifications.findIndex(n => n.id === incoming.id);
            if (idx === -1) {
              const next = [incoming, ...st.notifications].slice(0, maxItems);
              useNotificationStore.setState({
                notifications: next,
                unreadNotificationsCount: next.reduce((c, n) => c + (n.read ? 0 : 1), 0),
              });
            } else {
              const merged: AdminNotification = { ...st.notifications[idx], ...incoming };
              const next = st.notifications.slice();
              next[idx] = merged;
              useNotificationStore.setState({
                notifications: next,
                unreadNotificationsCount: next.reduce((c, n) => c + (n.read ? 0 : 1), 0),
              });
            }
          },
        );

        notificationVisibilityUnsub = onTabVisible(() => {
          debouncedNotificationRefresh();
        });
      },

      stopRealtime: () => {
        if (notificationRealtimeUnsub) {
          notificationRealtimeUnsub();
          notificationRealtimeUnsub = null;
        }
        if (notificationVisibilityUnsub) {
          notificationVisibilityUnsub();
          notificationVisibilityUnsub = null;
        }
      },
    }),
    {
      name: 'hamyar_notifications',
      // `createJSONStorage` لازم است: بدون آن، persist مقدار را به‌صورت شیء به
      // setItem می‌داد و localStorage به "[object Object]" تبدیل می‌شد؛ نتیجه
      // این بود که اعلان‌های محلی و کلیدهای حذف‌شده هرگز ذخیره نمی‌شدند.
      storage: createJSONStorage(() => notificationStorage) as any,
      partialize: (state: any) => ({
        notifications: state.notifications,
        notificationSettings: state.notificationSettings,
        dismissedKeys: state.dismissedKeys,
      }) as any,
      merge: (persistedState: any, currentState: any) => {
        const base = { ...currentState, ...(persistedState || {}) };
        base.unreadNotificationsCount = Array.isArray(base.notifications)
          ? base.notifications.reduce((c: number, n: AdminNotification) => c + (n.read ? 0 : 1), 0)
          : 0;
        base.notificationToasts = [];
        try {
          if (!base.notifications || base.notifications.length === 0) {
            const raw = localStorage.getItem('hamyar_notifications');
            if (raw) base.notifications = JSON.parse(raw);
          }
        } catch {}
        try {
          if (!base.notificationSettings || !base.notificationSettings.types) {
            const raw = localStorage.getItem('hamyar_notification_settings');
            if (raw) {
              const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
              const savedTypes = Array.isArray(parsed.types) ? parsed.types : [];
              const byId = new Map<string, NotificationTypeDef>();
              DEFAULT_NOTIFICATION_TYPES.forEach(t => byId.set(t.id, t));
              savedTypes.forEach(t => { if (t && typeof t.id === 'string') byId.set(t.id, t); });
              base.notificationSettings = {
                ...DEFAULT_NOTIFICATION_SETTINGS,
                ...parsed,
                maxItems: Math.min(500, Math.max(20, Number(parsed.maxItems) || 200)),
                popupSeconds: Math.min(30, Math.max(2, Number(parsed.popupSeconds) || 6)),
                types: [...byId.values()],
              };
            }
          }
        } catch {}
        base.unreadNotificationsCount = Array.isArray(base.notifications)
          ? base.notifications.reduce((c: number, n: AdminNotification) => c + (n.read ? 0 : 1), 0)
          : 0;
        return base;
      },
    },
  ),
);

(() => {
  const computeUnread = () => {
    const st = useNotificationStore.getState();
    const correct = st.notifications.reduce((c, n) => c + (n.read ? 0 : 1), 0);
    if (correct !== st.unreadNotificationsCount) {
      useNotificationStore.setState({ unreadNotificationsCount: correct });
    }
  };
  computeUnread();
  useNotificationStore.subscribe((_: any, prev: any) => {
    const cur = useNotificationStore.getState();
    if (prev.notifications !== cur.notifications) computeUnread();
  });
})();
