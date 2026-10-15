import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import type { User, Review, FaqItem, SmsLog, AuditLog, GamificationConfig, LoyaltyTierRule } from '../domains/types';
import { DEFAULT_GAMIFICATION_CONFIG, computeLevelFromPoints } from '../domains/types';
import { signInCustomer, signUpCustomer, fetchCurrentProfile, updateCustomerProfile as updateCustomerProfileAPI } from '../api/auth';
import type { ProfileRow } from '../api/users';
import { profileToUser, updateSelectedMedia } from '../api/users';
import { supabase } from '../lib/supabase';
import { useLoyaltyStore } from './loyaltyStore';

const DEFAULT_REVIEWS: Review[] = [
  { id: 'r1', productId: 'p1', customerName: 'علی محمدی', rating: 5, comment: 'محصول بسیار با کیفیت و قیمت مناسب', date: '1403/07/15', approved: true },
  { id: 'r2', productId: 'p1', customerName: 'مریم احمدی', rating: 4, comment: 'کیفیت خوب، ارسال سریع', date: '1403/07/10', approved: true },
  { id: 'r3', productId: 'p4', customerName: 'رضا کریمی', rating: 5, comment: 'هارد بسیار با کیفیت و قابل اعتماد', date: '1403/07/05', approved: true },
];

const DEFAULT_FAQS: FaqItem[] = [
  { id: 'f1', question: 'ساعات کاری کافی نت همیار چگونه است؟', answer: 'ما شنبه تا پنج‌شنبه از ساعت ۹ صبح تا ۹ شب و جمعه‌ها از ۱۰ صبح تا ۲ بعدازظهر در خدمت شما هستیم.', category: 'عمومی' },
  { id: 'f2', question: 'آیا امکان ارسال محصولات وجود دارد؟', answer: 'بله، برای سفارش‌های بالای ۵۰۰ هزار تومان ارسال رایگان است. برای سایر سفارش‌ها هزینه ارسال بر عهده مشتری است.', category: 'فروشگاه' },
  { id: 'f3', question: 'چگونه می‌توانم سفارش خود را پیگیری کنم؟', answer: 'با استفاده از کد رهگیری که هنگام ثبت سفارش دریافت کرده‌اید، می‌توانید از بخش پیگیری سفارش وضعیت سفارش خود را مشاهده کنید.', category: 'سفارش' },
  { id: 'f4', question: 'آیا محصولات گارانتی دارند؟', answer: 'بله، تمامی محصولات دیجیتال دارای گارانتی اصالت و سلامت فیزیکی هستند. محصولات خاص مانند دوربین مداربسته و دستگاه پوز دارای گارانتی شرکتی می‌باشند.', category: 'فروشگاه' },
  { id: 'f5', question: 'زمان انجام خدمات کافی نت چقدر است؟', answer: 'بسته به نوع خدمت متفاوت است. خدمات ساده مانند پرینت و کپی در همان لحظه انجام می‌شوند. خدمات پیچیده‌تر مانند ترجمه و طراحی سایت زمان بیشتری نیاز دارند.', category: 'خدمات' },
  { id: 'f6', question: 'آیا امکان پرداخت اقساطی وجود دارد؟', answer: 'برای خریدهای بالای ۲ میلیون تومان امکان پرداخت اقساطی با چک صیادی وجود دارد. برای اطلاعات بیشتر با ما تماس بگیرید.', category: 'فروشگاه' },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', user: 'admin', action: 'ورود به سیستم', details: 'ورود موفق', date: new Date().toISOString(), ip: '192.168.1.1', module: 'سیستم' },
  { id: 'a2', user: 'admin', action: 'ایجاد', details: 'ایجاد محصول جدید: فلش مموری 64GB', date: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
  { id: 'a3', user: 'admin', action: 'ویرایش', details: 'ویرایش قیمت محصول: هارد اکسترنال 1TB', date: new Date(Date.now() - 7200000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
  { id: 'a4', user: 'admin', action: 'ایجاد', details: 'ثبت سفارش جدید: HMY-ABC123', date: new Date(Date.now() - 10800000).toISOString(), ip: '192.168.1.1', module: 'سفارشات' },
  { id: 'a5', user: 'admin', action: 'تغییر وضعیت', details: 'تغییر وضعیت سفارش HMY-ABC123 به در حال انجام', date: new Date(Date.now() - 14400000).toISOString(), ip: '192.168.1.1', module: 'سفارشات' },
  { id: 'a6', user: 'admin', action: 'ایجاد', details: 'ثبت مشتری جدید: علی محمدی', date: new Date(Date.now() - 18000000).toISOString(), ip: '192.168.1.1', module: 'مشتریان' },
  { id: 'a7', user: 'admin', action: 'ایجاد', details: 'افزودن عنوان جدید: Oppenheimer', date: new Date(Date.now() - 21600000).toISOString(), ip: '192.168.1.1', module: 'مدیا' },
  { id: 'a8', user: 'admin', action: 'ایجاد', details: 'ثبت هزینه جدید: اجاره ماهانه', date: new Date(Date.now() - 25200000).toISOString(), ip: '192.168.1.1', module: 'مالی' },
  { id: 'a9', user: 'admin', action: 'ایجاد', details: 'صدور فاکتور: INV-240001', date: new Date(Date.now() - 28800000).toISOString(), ip: '192.168.1.1', module: 'فاکتورها' },
  { id: 'a10', user: 'admin', action: 'تایید', details: 'تایید نظر مشتری: مریم احمدی', date: new Date(Date.now() - 32400000).toISOString(), ip: '192.168.1.1', module: 'نظرات' },
  { id: 'a11', user: 'admin', action: 'ارسال', details: 'ارسال پیامک انبوه به 50 مشتری', date: new Date(Date.now() - 36000000).toISOString(), ip: '192.168.1.1', module: 'پیامک' },
  { id: 'a12', user: 'admin', action: 'ایجاد', details: 'ایجاد پروژه جدید: طراحی سایت شرکتی', date: new Date(Date.now() - 39600000).toISOString(), ip: '192.168.1.1', module: 'پروژه‌ها' },
  { id: 'a13', user: 'admin', action: 'ایجاد', details: 'ایجاد کمپین تخفیف: SCHOOL1403', date: new Date(Date.now() - 43200000).toISOString(), ip: '192.168.1.1', module: 'کمپین‌ها' },
  { id: 'a14', user: 'admin', action: 'ایجاد', details: 'ثبت کارمند جدید: محمد رضایی', date: new Date(Date.now() - 46800000).toISOString(), ip: '192.168.1.1', module: 'کارمندان' },
  { id: 'a15', user: 'admin', action: 'ایجاد', details: 'ثبت تأمین‌کننده جدید: شرکت سامسونگ', date: new Date(Date.now() - 50400000).toISOString(), ip: '192.168.1.1', module: 'تأمین‌کنندگان' },
  { id: 'a16', user: 'admin', action: 'ایجاد', details: 'ایجاد پروژه محتوایی: ویدئو معرفی محصول', date: new Date(Date.now() - 54000000).toISOString(), ip: '192.168.1.1', module: 'تیم محتوا' },
  { id: 'a17', user: 'admin', action: 'ایجاد', details: 'ایجاد نقش جدید: مدیر فروش', date: new Date(Date.now() - 57600000).toISOString(), ip: '192.168.1.1', module: 'RBAC' },
  { id: 'a18', user: 'admin', action: 'ویرایش', details: 'ویرایش تنظیمات سایت', date: new Date(Date.now() - 61200000).toISOString(), ip: '192.168.1.1', module: 'تنظیمات' },
  { id: 'a19', user: 'admin', action: 'بکاپ', details: 'ایجاد بکاپ کامل سیستم', date: new Date(Date.now() - 64800000).toISOString(), ip: '192.168.1.1', module: 'سیستم' },
  { id: 'a20', user: 'admin', action: 'حذف', details: 'حذف محصول: کابل USB قدیمی', date: new Date(Date.now() - 68400000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
];

function stripLegacySessionPoints(u: User | null): User | null {
  return u;
}

interface LoyaltyStoreShim {
  gamificationConfig?: GamificationConfig;
  awardLoyaltyPoints?: (userId: string, points: number, reason: string, opts?: { category?: any; autoLevelUp?: boolean }) => void;
  pushLoyaltyTx?: (tx: any) => void;
  setGamificationConfig?: (c: GamificationConfig) => void;
}

const getLoyaltyStore = (): LoyaltyStoreShim => {
  const out: LoyaltyStoreShim = {};
  try {
    const s = useLoyaltyStore.getState();
    out.gamificationConfig = s.gamificationConfig;
    out.awardLoyaltyPoints = s.awardLoyaltyPoints;
    out.pushLoyaltyTx = s.pushLoyaltyTx;
  } catch {}
  return out;
};

const getConfig = (): GamificationConfig => {
  const shim = getLoyaltyStore();
  return shim.gamificationConfig || DEFAULT_GAMIFICATION_CONFIG;
};

function pushLoyaltyTxShim(tx: Omit<any, 'id' | 'createdAt'>) {
  const shim = getLoyaltyStore();
  if (shim.pushLoyaltyTx) {
    shim.pushLoyaltyTx(tx);
    return;
  }
}

function awardLoyaltyPointsShim(userId: string, points: number, reason: string, opts?: { category?: any; autoLevelUp?: boolean }, currentUsers?: User[]): User[] | undefined {
  const shim = getLoyaltyStore();
  if (shim.awardLoyaltyPoints) {
    shim.awardLoyaltyPoints(userId, points, reason, opts);
    return undefined;
  }
  if (!currentUsers) return undefined;
  if (!Number.isFinite(points) || points <= 0) return undefined;
  const cfg = getConfig();
  const base = currentUsers;
  const target = base.find(u => u.id === userId);
  if (!target) return undefined;
  const nextPoints = (target.loyaltyPoints || 0) + points;
  const nextTotal = (target.totalEarnedPoints ?? target.loyaltyPoints ?? 0) + points;
  const level = opts?.autoLevelUp === false
    ? target.level
    : computeLevelFromPoints(nextTotal, cfg.tiers);
  pushLoyaltyTxShim({ userId, points, reason, category: opts?.category || 'manual', byAdmin: false });
  return base.map(u => u.id === userId ? { ...u, loyaltyPoints: nextPoints, totalEarnedPoints: nextTotal, level } : u);
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
};

const authStorage: StateStorage = {
  getItem: (_name) => {
    const userRaw = localStorage.getItem('hamyar_user');
    const usersRaw = localStorage.getItem('hamyar_users');
    const reviewsRaw = localStorage.getItem('hamyar_reviews');
    const faqsRaw = localStorage.getItem('hamyar_faqs');
    const smsLogsRaw = localStorage.getItem('hamyar_sms_logs') || localStorage.getItem('hamyar_sms');
    const auditLogsRaw = localStorage.getItem('hamyar_audit_logs') || localStorage.getItem('hamyar_audit');
    return JSON.stringify({
      state: {
        currentUser: userRaw ? JSON.parse(userRaw) : null,
        users: usersRaw ? JSON.parse(usersRaw) : [],
        reviews: reviewsRaw ? JSON.parse(reviewsRaw) : DEFAULT_REVIEWS,
        faqs: faqsRaw ? JSON.parse(faqsRaw) : DEFAULT_FAQS,
        smsLogs: smsLogsRaw ? JSON.parse(smsLogsRaw) : [],
        auditLogs: auditLogsRaw ? JSON.parse(auditLogsRaw) : DEFAULT_AUDIT_LOGS,
      },
      version: 0,
    });
  },
  setItem: (_name, value) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const state = parsed.state ?? parsed;
    if (state.currentUser !== undefined) localStorage.setItem('hamyar_user', JSON.stringify(state.currentUser));
    if (state.users !== undefined) localStorage.setItem('hamyar_users', JSON.stringify(state.users));
    if (state.reviews !== undefined) localStorage.setItem('hamyar_reviews', JSON.stringify(state.reviews));
    if (state.faqs !== undefined) localStorage.setItem('hamyar_faqs', JSON.stringify(state.faqs));
    if (state.smsLogs !== undefined) localStorage.setItem('hamyar_sms_logs', JSON.stringify(state.smsLogs));
    if (state.auditLogs !== undefined) localStorage.setItem('hamyar_audit_logs', JSON.stringify(state.auditLogs));
  },
  removeItem: (_name) => {
    localStorage.removeItem('hamyar_user');
    localStorage.removeItem('hamyar_users');
    localStorage.removeItem('hamyar_reviews');
    localStorage.removeItem('hamyar_faqs');
    localStorage.removeItem('hamyar_sms_logs');
    localStorage.removeItem('hamyar_sms');
    localStorage.removeItem('hamyar_audit_logs');
    localStorage.removeItem('hamyar_audit');
  },
};

interface AuthState {
  currentUser: User | null;
  users: User[];
  reviews: Review[];
  faqs: FaqItem[];
  smsLogs: SmsLog[];
  auditLogs: AuditLog[];
  setCurrentUser: (u: User | null | ((prev: User | null) => User | null)) => void;
  setUsers: (u: User[] | ((prev: User[]) => User[])) => void;
  setReviews: (r: Review[]) => void;
  setFaqs: (f: FaqItem[]) => void;
  setSmsLogs: (s: SmsLog[] | ((prev: SmsLog[]) => SmsLog[])) => void;
  setAuditLogs: (a: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  login: (email: string, password: string, name: string, phone?: string, inviteCode?: string) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  addToFavorites: (mediaId: string) => void;
  selectMedia: (mediaId: string) => void;
  updateAvatar: (avatarUrl: string) => void;
  _updateCustomerProfileAsync: (patch: Partial<Pick<User, 'name' | 'phone' | 'birthDate'>>) => Promise<void>;
  updateCustomerProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'birthDate'>>) => void;
  chargeWallet: (amount: number) => void;
  deductWallet: (amount: number) => boolean;
  applyLoginStreak: (user: User) => User;
  awardPurchasePoints: (userId: string | undefined, amount: number, trackingCode: string) => void;
  loginWithSession: (email: string) => Promise<{ ok: boolean; error?: string }>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
}

const updateUserBoth = (state: AuthState, updater: (u: User) => User): Partial<AuthState> => {
  if (!state.currentUser) return {};
  const updated = updater(state.currentUser);
  return {
    currentUser: updated,
    users: state.users.map(u => u.id === updated.id ? updated : u),
  };
};

const normalizeUser = (u: User | null): User | null => {
  if (!u) return null;
  return {
    ...u,
    favorites: Array.isArray(u.favorites) ? u.favorites : [],
    selectedMedia: Array.isArray(u.selectedMedia) ? u.selectedMedia : [],
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get): AuthState => ({
      currentUser: null,
      users: [],
      reviews: DEFAULT_REVIEWS,
      faqs: DEFAULT_FAQS,
      smsLogs: [],
      auditLogs: DEFAULT_AUDIT_LOGS,

      hydrated: false,

      hydrate: async () => {
        try {
          const profile = await fetchCurrentProfile();
          if (profile) {
            const fromServer = profileToUser(profile);
            const cur = get();
            const existingCurrent = cur.currentUser;
            const existingUsers = cur.users;

            const mergedCurrent = existingCurrent
              ? (existingCurrent.supabaseUserId === profile.id || existingCurrent.id === profile.id || existingCurrent.email === profile.email
                  ? { ...existingCurrent, ...fromServer, avatar: fromServer.avatar || existingCurrent.avatar, favorites: existingCurrent.favorites || fromServer.favorites, selectedMedia: existingCurrent.selectedMedia || fromServer.selectedMedia, createdAt: existingCurrent.createdAt || fromServer.createdAt, inviteCode: existingCurrent.inviteCode || fromServer.inviteCode, invitedBy: existingCurrent.invitedBy || fromServer.invitedBy, invitedCount: fromServer.invitedCount ?? existingCurrent.invitedCount, role: existingCurrent.role || fromServer.role } as User
                  : existingCurrent)
              : null;

            const mergedUsers = existingUsers.map((u: User) => {
              if (u.supabaseUserId === profile.id || u.id === profile.id || u.email === profile.email) {
                return { ...u, ...fromServer, avatar: fromServer.avatar || u.avatar, favorites: u.favorites || fromServer.favorites, selectedMedia: u.selectedMedia || fromServer.selectedMedia, createdAt: u.createdAt || fromServer.createdAt, inviteCode: u.inviteCode || fromServer.inviteCode, invitedBy: u.invitedBy || fromServer.invitedBy, invitedCount: fromServer.invitedCount ?? u.invitedCount, role: u.role || fromServer.role } as User;
              }
              return u;
            });
            set({ currentUser: mergedCurrent, users: mergedUsers });
          }
        } catch (e: any) {
          console.warn('[authStore] hydrate failed:', e?.message || e);
        }
        set({ hydrated: true });
      },

      setCurrentUser: (u) => set((state: AuthState) => ({
        currentUser: normalizeUser(
          typeof u === 'function' ? (u as (prev: User | null) => User | null)(state.currentUser) : u
        ),
      })),
      setUsers: (u) => set((state: AuthState) => ({
        users: typeof u === 'function' ? (u as (prev: User[]) => User[])(state.users) : u,
      })),
      setReviews: (reviews) => set({ reviews }),
      setFaqs: (faqs) => set({ faqs }),
      setSmsLogs: (smsLogs) => set((state: AuthState) => ({
        smsLogs: typeof smsLogs === 'function' ? (smsLogs as (prev: SmsLog[]) => SmsLog[])(state.smsLogs) : smsLogs,
      })),
      setAuditLogs: (auditLogs) => set((state: AuthState) => ({
        auditLogs: typeof auditLogs === 'function' ? (auditLogs as (prev: AuditLog[]) => AuditLog[])(state.auditLogs) : auditLogs,
      })),

      login: async (email, password, name, phone, inviteCode) => {
        const cfg = getConfig();
        const baseUsers = get().users;
        const code = inviteCode?.trim().toUpperCase() || undefined;

        let result: { ok: boolean; error?: string; needsEmailConfirmation?: boolean } = { ok: false };
        const existing = baseUsers.find((u: User) => u.email === email);

        // For existing users, just sign in
        if (existing) {
          result = await signInCustomer(email, password);
        } else {
          // New user registration
          result = await signUpCustomer({ email, password, displayName: name, inviteCode: code });
          if (result.ok && result.needsEmailConfirmation) {
            return result;
          }
          if (result.ok) {
            result = await signInCustomer(email, password);
          }
        }

        if (!result.ok) {
          console.warn('[authStore] signIn failed:', result.error);
          return result;
        }

        // Fetch profile from Supabase
        const profile = await fetchCurrentProfile();
        if (!profile) {
          console.warn('[authStore] Profile not found in DB, creating minimal user object');
          // Create minimal user from auth metadata if profile doesn't exist yet
          const authUser = (await supabase.auth.getUser()).data.user;
          if (!authUser) {
            return { ok: false, error: 'نشست کاربری یافت نشد' };
          }
          // Use auth user metadata as fallback
          const user: User = {
            id: authUser.id,
            username: email,
            role: 'customer',
            name: authUser.user_metadata?.display_name || name || '',
            phone: authUser.user_metadata?.phone || phone || '',
            email: authUser.email || email,
            supabaseUserId: authUser.id,
            inviteCode: authUser.user_metadata?.invite_code || 'INV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            invitedBy: authUser.user_metadata?.invited_by,
            invitedCount: 0,
            loyaltyPoints: 0,
            totalEarnedPoints: 0,
            level: 'normal',
            favorites: [],
            selectedMedia: [],
            createdAt: authUser.created_at || new Date().toISOString(),
          };

          // ── GUARANTEE: persist the profile row on the server so the admin
          // CRM panel can see it. The server-side trigger should have already
          // created this row, but if it did not (edge case / race / disabled
          // trigger) the client inserts it as a safety net.
          // `upsert` with `ignoreDuplicates` is used instead of a raw
          // `insert().onConflict().ignore()` because that chain does not exist
          // on the installed @supabase/postgrest-js version (v2.112.3).
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert(
                {
                  id: authUser.id,
                  display_name: user.name || null,
                  phone: user.phone || null,
                  email: user.email,
                  invite_code: user.inviteCode,
                  invited_by: user.invitedBy || null,
                  level: 'normal',
                  loyalty_points: 0,
                  total_earned_points: 0,
                  wallet_balance: 0,
                },
                { onConflict: 'id', ignoreDuplicates: true }
              );

            if (insertError) {
              console.warn('[authStore] client-side profile insert failed (RLS?):', insertError.message);
            }
          } catch (e: any) {
            console.warn('[authStore] client-side profile insert threw:', e?.message || e);
          }

          const nextUsers = [...baseUsers.filter((u: User) => u.id !== user.id), user];
          set({ users: nextUsers });
          const streaked = get().applyLoginStreak(user);
          set({ currentUser: streaked });
          return { ok: true };
        }

        let inviterId: string | undefined;
        if (code) {
          const inviter = baseUsers.find((u: User) => u.inviteCode === code && u.role === 'customer');
          if (inviter) inviterId = inviter.id;
        }

        const user: User = {
          id: profile.id || existing?.id || 'u' + Date.now(),
          username: email,
          role: 'customer',
          name: profile.display_name || name || '',
          phone: profile.phone || phone || '',
          email: profile.email || email,
          supabaseUserId: profile.id,
          inviteCode: profile.invite_code || existing?.inviteCode || 'INV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          invitedBy: inviterId || profile.invited_by || existing?.invitedBy,
          invitedCount: profile.invited_count || existing?.invitedCount || 0,
          loyaltyPoints: profile.loyalty_points ?? existing?.loyaltyPoints ?? 0,
          totalEarnedPoints: existing?.totalEarnedPoints ?? (profile.loyalty_points ?? 0),
          level: (profile.level as User['level']) || 'normal',
          favorites: existing?.favorites || [],
          selectedMedia: existing?.selectedMedia || [],
          createdAt: profile.created_at || existing?.createdAt || new Date().toISOString(),
        };

        const nextUsers = existing
          ? baseUsers.map((u: User) => u.id === existing.id ? user : u)
          : [...baseUsers.filter((u: User) => u.id !== user.id), user];
        set({ users: nextUsers });

        const streaked = get().applyLoginStreak(user);
        set({ currentUser: streaked });
        return { ok: true };
      },

      loginWithSession: async (email) => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser || authUser.email !== email) {
            return { ok: false, error: 'نشست معتبر نیست' };
          }

          // Check if user already exists in local store
          const existing = get().users.find((u: User) => u.email === email);
          if (existing) {
            const streaked = get().applyLoginStreak(existing);
            set({ currentUser: streaked });
            return { ok: true };
          }

          // Fetch profile from Supabase
          const profile = await fetchCurrentProfile();
          if (!profile) {
            return { ok: false, error: 'پروفایل یافت نشد' };
          }

          const user: User = {
            id: profile.id,
            username: email,
            role: 'customer',
            name: profile.display_name || '',
            phone: profile.phone || '',
            email: profile.email || email,
            supabaseUserId: profile.id,
            inviteCode: profile.invite_code || 'INV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            invitedBy: profile.invited_by ?? undefined,
            invitedCount: profile.invited_count || 0,
            loyaltyPoints: profile.loyalty_points || 0,
            totalEarnedPoints: profile.loyalty_points || 0,
            level: (profile.level as User['level']) || 'normal',
            favorites: [],
            selectedMedia: [],
            createdAt: profile.created_at || new Date().toISOString(),
          };

          const nextUsers = [...get().users.filter((u: User) => u.id !== user.id), user];
          set({ users: nextUsers });

          const streaked = get().applyLoginStreak(user);
          set({ currentUser: streaked });
          return { ok: true };
        } catch (e: any) {
          console.error('[authStore] loginWithSession failed:', e?.message || e);
          return { ok: false, error: e?.message || 'خطا در لاگین با سشن' };
        }
      },

      logout: async () => {
        try { await supabase.auth.signOut(); } catch {}
        set({ currentUser: null });
      },

      addToFavorites: (mediaId) => {
        const state = get();
        if (!state.currentUser) return;
        set(updateUserBoth(state, (cu) => {
          const favs = Array.isArray(cu.favorites) ? cu.favorites : [];
          const next = favs.includes(mediaId)
            ? favs.filter(f => f !== mediaId)
            : [...favs, mediaId];
          return { ...cu, favorites: next };
        }));
      },

      selectMedia: (mediaId) => {
        const state = get();
        if (!state.currentUser) return;
        const selected = Array.isArray(state.currentUser.selectedMedia) ? state.currentUser.selectedMedia : [];
        const next = selected.includes(mediaId)
          ? selected.filter((s: string) => s !== mediaId)
          : [...selected, mediaId];
        set(updateUserBoth(state, (cu) => ({ ...cu, selectedMedia: next })));
        updateSelectedMedia(state.currentUser.id, next).catch((err) => {
          console.error('[authStore] updateSelectedMedia failed:', err);
        });
      },

      updateAvatar: (avatarUrl) => {
        const state = get();
        if (!state.currentUser) return;
        set(updateUserBoth(state, (cu) => ({ ...cu, avatar: avatarUrl })));
      },

      _updateCustomerProfileAsync: async (patch) => {
        const state = get();
        if (!state.currentUser) return;
        const result = await updateCustomerProfileAPI({
          displayName: patch.name,
          phone: patch.phone,
          birthDate: patch.birthDate,
        });
        if (!result.ok) {
          console.error('[authStore] updateCustomerProfile:', result.error);
          return;
        }
        set(updateUserBoth(state, (cu) => ({ ...cu, ...patch })));
      },

      updateCustomerProfile: (patch) => {
        get()._updateCustomerProfileAsync(patch);
      },

      chargeWallet: (amount) => {
        const state = get();
        if (!state.currentUser) return;
        set(updateUserBoth(state, (cu) => {
          const currentBalance = cu.walletBalance || 0;
          return { ...cu, walletBalance: currentBalance + amount };
        }));
      },

      deductWallet: (amount): boolean => {
        const state = get();
        if (!state.currentUser) return false;
        const currentBalance = state.currentUser.walletBalance || 0;
        if (currentBalance < amount) return false;
        set(updateUserBoth(state, (cu) => ({ ...cu, walletBalance: (cu.walletBalance || 0) - amount })));
        return true;
      },

      applyLoginStreak: (user): User => {
        const cfg = getConfig();
        if (!cfg.enabled || user.role !== 'customer') return user;
        let updated: User = user;
        const currentUsers = get().users;

        if (cfg.profileCompletionBonus > 0 && !updated.lastProfileBonusDate) {
          const profileComplete = !!updated.name?.trim() && !!updated.username?.trim();
          if (profileComplete) {
            const total = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + cfg.profileCompletionBonus;
            updated = {
              ...updated,
              lastProfileBonusDate: new Date().toISOString(),
              loyaltyPoints: (updated.loyaltyPoints || 0) + cfg.profileCompletionBonus,
              totalEarnedPoints: total,
              level: computeLevelFromPoints(total, cfg.tiers),
            };
            pushLoyaltyTxShim({ userId: updated.id, points: cfg.profileCompletionBonus, reason: 'پاداش تکمیل پروفایل 👤', category: 'profile' });
          }
        }

        if (cfg.birthdayBonus > 0 && updated.birthDate) {
          const bd = new Date(updated.birthDate);
          const now = new Date();
          const isBirthday = bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
          const thisYearJan1 = `${now.getFullYear()}-01-01`;
          if (isBirthday && !(updated.lastBirthdayBonusDate && updated.lastBirthdayBonusDate >= thisYearJan1)) {
            const vip = updated.level === 'vip';
            const pts = vip ? cfg.birthdayBonus * 2 : cfg.birthdayBonus;
            const total = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + pts;
            updated = {
              ...updated,
              lastBirthdayBonusDate: now.toISOString(),
              loyaltyPoints: (updated.loyaltyPoints || 0) + pts,
              totalEarnedPoints: total,
              level: computeLevelFromPoints(total, cfg.tiers),
            };
            pushLoyaltyTxShim({ userId: updated.id, points: pts, reason: `هدیه تولد 🎁${vip ? ' (VIP دوچندان)' : ''}`, category: 'birthday' });
          }
        }

        if (!cfg.dailyLoginBonus || cfg.dailyLoginBonus <= 0) return updated;
        const today = new Date().toISOString().slice(0, 10);
        if (updated.lastLoginStreakDate === today) return updated;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = updated.lastLoginStreakDate === yesterday ? (updated.loginStreak || 0) + 1 : 1;
        const cappedDay = Math.min(streak, cfg.streakMaxDays || 7);
        const bonus = Math.round(cfg.dailyLoginBonus * cappedDay * (cfg.streakDayMultiplier || 1));
        const nextTotal = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + bonus;
        updated = {
          ...updated,
          loginStreak: streak,
          lastLoginStreakDate: today,
          loyaltyPoints: (updated.loyaltyPoints || 0) + bonus,
          totalEarnedPoints: nextTotal,
          level: computeLevelFromPoints(nextTotal, cfg.tiers),
        };

        const withUpdatedUser = currentUsers.map((u: User) => u.id === updated.id ? updated : u);
        set({ users: withUpdatedUser });

        pushLoyaltyTxShim({ userId: updated.id, points: bonus, reason: `ورود روزانه — روز ${streak} از استریک 🔥`, category: 'login_streak' });
        return updated;
      },

      awardPurchasePoints: (orderUserId, amount, trackingCode) => {
        if (!orderUserId || amount <= 0) return;
        const cfg = getConfig();
        if (!cfg.enabled || cfg.pointsPerToman <= 0) return;
        const currentUsers = get().users;
        const target = currentUsers.find((u: User) => u.id === orderUserId);
        if (!target || target.role !== 'customer') return;
        const tier = cfg.tiers.find(t => t.level === target.level) || cfg.tiers[0];
        const raw = Math.floor(amount / cfg.pointsPerToman) * (tier?.multiplier || 1);
        const pts = Math.max(1, Math.round(raw));
        const updated = awardLoyaltyPointsShim(
          orderUserId,
          pts,
          `امتیاز خرید سفارش ${trackingCode} (${tier?.label || 'عادی'} ×${tier?.multiplier || 1})`,
          { category: 'purchase' },
          currentUsers
        );
        if (updated) {
          set({ users: updated });
          if (get().currentUser?.id === orderUserId) {
            const newCurrent = updated.find(u => u.id === orderUserId) || null;
            if (newCurrent) set({ currentUser: newCurrent });
          }
        }
      },
    }),
    {
      name: 'hamyar_auth',
      storage: authStorage as any,
      partialize: (state: any) => ({
        currentUser: state.currentUser,
        users: state.users,
        reviews: state.reviews,
        faqs: state.faqs,
        smsLogs: state.smsLogs,
        auditLogs: state.auditLogs,
      }) as any,
      onRehydrateStorage: () => (state: any) => {
        if (!state) return;
        try {
          if (state.currentUser) {
            state.setCurrentUser(state.currentUser);
            state.applyLoginStreak(state.currentUser);
          }
        } catch {}
      },
    },
  ),
);
