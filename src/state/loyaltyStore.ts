import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import type {
  LoyaltyTransaction,
  GamificationConfig,
  GamificationBadgeDef,
  LoyaltyRewardItem,
  LoyaltyTierRule,
  User,
  LoyaltyCategory,
  Order,
  Review,
} from '../domains/types';
import {
  DEFAULT_GAMIFICATION_CONFIG,
  DEFAULT_TIERS,
  DEFAULT_REWARDS,
  DEFAULT_BADGES,
  computeLevelFromPoints,
} from '../domains/types';
import { awardLoyalty, applyReferralBonus } from '../api/loyalty';
import { useAuthStore } from './authStore';
import { useCrmStore } from './crmStore';
import { useOrderStore } from './orderStore';
import { useNotificationStore } from './notificationStore';

const GAMIFICATION_RESET_KEY = 'hamyar_gamification_reset_v1';

interface CrossStoreShim {
  currentUser?: User | null;
  users?: User[];
  setUsers?: (u: User[]) => void;
  setCurrentUser?: (updater: (cu: User | null) => User | null) => void;
  orders?: Order[];
  reviews?: Review[];
  pushAuditLog?: (action: string, details: string, module: string) => void;
}

const getCrossStore = (): CrossStoreShim => {
  const out: CrossStoreShim = {};
  try {
    const s = useAuthStore.getState();
    out.currentUser = s.currentUser;
    out.users = s.users;
    out.setUsers = s.setUsers;
    out.setCurrentUser = s.setCurrentUser;
  } catch {}
  try {
    const s = useCrmStore.getState();
    if (!out.users) out.users = s.users;
    if (!out.setUsers) out.setUsers = s.setUsers;
  } catch {}
  try {
    const s = useOrderStore.getState();
    out.orders = s.orders;
  } catch {}
  try {
    const s = useNotificationStore.getState();
    out.pushAuditLog = s.pushAuditLog;
  } catch {}
  return out;
};

function stripLegacyLoyalty(users: User[]): User[] {
  let touched = false;
  const next = users.map(u => {
    if (u.role !== 'customer') return u;
    const hadBalance = (u.loyaltyPoints || 0) !== 0;
    const hadTotal = (u.totalEarnedPoints ?? 0) !== 0;
    const hadStreak = !!u.lastLoginStreakDate || (u.loginStreak || 0) > 0;
    if (!hadBalance && !hadTotal && !hadStreak) return u;
    touched = true;
    return {
      ...u,
      loyaltyPoints: 0,
      totalEarnedPoints: 0,
      lastLoginStreakDate: undefined,
      loginStreak: undefined,
      level: 'normal' as const,
    };
  });
  return touched ? next : users;
}

const loyaltyStorage: StateStorage = {
  getItem: (_name) => {
    const txRaw = localStorage.getItem('hamyar_loyalty_tx');
    const cfgRaw = localStorage.getItem('hamyar_gamification_config');
    return JSON.stringify({
      state: {
        loyaltyTx: txRaw ? JSON.parse(txRaw) : [],
        gamificationConfig: cfgRaw ? { ...DEFAULT_GAMIFICATION_CONFIG, ...JSON.parse(cfgRaw) } : DEFAULT_GAMIFICATION_CONFIG,
      },
      version: 0,
    });
  },
  setItem: (_name, value) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const state = parsed.state ?? parsed;
    if (state.loyaltyTx !== undefined) localStorage.setItem('hamyar_loyalty_tx', JSON.stringify(state.loyaltyTx));
    if (state.gamificationConfig !== undefined) localStorage.setItem('hamyar_gamification_config', JSON.stringify(state.gamificationConfig));
  },
  removeItem: (_name) => {
    localStorage.removeItem('hamyar_loyalty_tx');
    localStorage.removeItem('hamyar_gamification_config');
  },
};

interface LoyaltyState {
  loyaltyTx: LoyaltyTransaction[];
  gamificationConfig: GamificationConfig;
  setGamificationConfig: (c: GamificationConfig) => void;
  resetLoyaltyData: () => void;
  awardLoyaltyPoints: (userId: string, points: number, reason: string, opts?: { category?: LoyaltyCategory; autoLevelUp?: boolean }) => void;
  deductLoyaltyPointsForAdmin: (userId: string, points: number, reason: string) => boolean;
  awardReviewPoints: () => void;
  redeemLoyaltyReward: (userId: string, rewardId: string) => { ok: boolean; error?: string };
  setUserLevel: (userId: string, level: User['level']) => void;
  getEarnedBadges: (user: User) => { def: GamificationBadgeDef; earned: boolean; progress: number }[];
  pushLoyaltyTx: (tx: Omit<LoyaltyTransaction, 'id' | 'createdAt'>) => void;
  hydrated: boolean;
  hydrate: () => Promise<void>;
}

const pushLoyaltyTx = (
  currentTx: LoyaltyTransaction[],
  tx: Omit<LoyaltyTransaction, 'id' | 'createdAt'>,
): LoyaltyTransaction[] => [
  {
    ...tx,
    id: 'ltx' + Date.now() + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  },
  ...currentTx,
].slice(0, 2000);

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get): LoyaltyState => ({
      loyaltyTx: [],
      gamificationConfig: DEFAULT_GAMIFICATION_CONFIG,

      hydrated: false,

      hydrate: async () => {
        try {
          const cs = getCrossStore();
          if (cs.currentUser?.id) {
            await applyReferralBonus().catch(() => {});
          }
        } catch (e: any) {
          console.warn('[loyaltyStore] hydrate applyReferralBonus failed:', e?.message || e);
        }
        set({ hydrated: true });
      },

      setGamificationConfig: (c) => set({ gamificationConfig: c }),

      resetLoyaltyData: () => {
        localStorage.setItem(GAMIFICATION_RESET_KEY, new Date().toISOString());
        const cs = getCrossStore();
        if (cs.setUsers && cs.users) {
          cs.setUsers(stripLegacyLoyalty(cs.users));
        }
        set({ loyaltyTx: [] });
        if (cs.setCurrentUser && cs.currentUser && cs.currentUser.role === 'customer') {
          cs.setCurrentUser(() => ({
            ...cs.currentUser!,
            loyaltyPoints: 0,
            totalEarnedPoints: 0,
            loginStreak: undefined,
            lastLoginStreakDate: undefined,
            level: 'normal',
          }));
        }
        cs.pushAuditLog?.('پاکسازی امتیازها', 'تمام امتیازهای هاردکور/قدیمی باشگاه مشتریان حذف و از صفر شروع شد', 'دعوت‌ها');
      },

      getEarnedBadges: (user: User) => {
        const cfg = get().gamificationConfig;
        const cs = getCrossStore();
        const ordersCount = (cs.orders || []).filter(o => o.customerId === user.id && o.status !== 'cancelled').length;
        const reviewsCount = (cs.reviews || []).filter((r: Review) => r.customerName === user.name).length;
        const metrics: Record<GamificationBadgeDef['metric'], number> = {
          invitedCount: user.invitedCount || 0,
          totalEarnedPoints: user.totalEarnedPoints ?? user.loyaltyPoints ?? 0,
          ordersCount,
          reviewsCount,
          loginStreak: user.loginStreak || 0,
        };
        return cfg.badges.map((def: GamificationBadgeDef) => {
          const value = metrics[def.metric] ?? 0;
          const threshold = Math.max(1, def.threshold || 1);
          return { def, earned: value >= threshold, progress: Math.min(100, Math.round((value / threshold) * 100)) };
        });
      },

      pushLoyaltyTx: (tx) => {
        set((state: LoyaltyState) => ({
          loyaltyTx: pushLoyaltyTx(state.loyaltyTx, tx),
        }));
      },

      awardLoyaltyPoints: (userId, points, reason, opts) => {
        if (!Number.isFinite(points) || points <= 0) return;
        const cfg = get().gamificationConfig;
        const cs = getCrossStore();
        const base = cs.users || [];
        const target = base.find(u => u.id === userId);
        if (!target) return;
        const nextPoints = (target.loyaltyPoints || 0) + points;
        const nextTotal = (target.totalEarnedPoints ?? target.loyaltyPoints ?? 0) + points;
        const level = opts?.autoLevelUp === false
          ? target.level
          : computeLevelFromPoints(nextTotal, cfg.tiers);
        if (cs.setUsers) {
          cs.setUsers(base.map(u => u.id === userId ? { ...u, loyaltyPoints: nextPoints, totalEarnedPoints: nextTotal, level } : u));
        }
        if (cs.setCurrentUser && cs.currentUser && cs.currentUser.id === userId) {
          cs.setCurrentUser(() => ({
            ...cs.currentUser!,
            loyaltyPoints: nextPoints,
            totalEarnedPoints: nextTotal,
            level,
          }));
        }
        set((state: LoyaltyState) => ({
          loyaltyTx: pushLoyaltyTx(state.loyaltyTx, {
            userId,
            points,
            reason,
            category: opts?.category || 'manual',
            byAdmin: cs.currentUser?.role === 'admin',
          }),
        }));
        const category = opts?.category as any;
        (async () => {
          if (!get().hydrated) return;
          try {
            const res = await awardLoyalty({ userId, points, reason, category });
            if (res.ok && (res.newTotal !== undefined || res.newLevel)) {
              const xcs = getCrossStore();
              if (xcs.setUsers && xcs.users) {
                xcs.setUsers(xcs.users.map(u => u.id === userId ? {
                  ...u,
                  loyaltyPoints: res.newTotal ?? u.loyaltyPoints,
                  totalEarnedPoints: res.newTotal ?? u.totalEarnedPoints,
                  level: res.newLevel ? (res.newLevel as any) : u.level,
                } : u));
              }
              if (xcs.setCurrentUser && xcs.currentUser && xcs.currentUser.id === userId) {
                xcs.setCurrentUser(() => ({
                  ...xcs.currentUser!,
                  loyaltyPoints: res.newTotal ?? xcs.currentUser!.loyaltyPoints,
                  totalEarnedPoints: res.newTotal ?? xcs.currentUser!.totalEarnedPoints,
                  level: res.newLevel ? (res.newLevel as any) : xcs.currentUser!.level,
                }));
              }
            }
          } catch (e: any) {
            console.warn('[loyaltyStore] awardLoyaltyPoints sync failed:', e?.message || e);
          }
        })();
      },

      deductLoyaltyPointsForAdmin: (userId, points, reason) => {
        if (!Number.isFinite(points) || points <= 0) return false;
        const cs = getCrossStore();
        const base = cs.users || [];
        const target = base.find(u => u.id === userId);
        if (!target || (target.loyaltyPoints || 0) < points) return false;
        if (cs.setUsers) {
          cs.setUsers(base.map(u => u.id === userId ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) - points } : u));
        }
        if (cs.setCurrentUser && cs.currentUser && cs.currentUser.id === userId) {
          cs.setCurrentUser(() => ({
            ...cs.currentUser!,
            loyaltyPoints: (cs.currentUser!.loyaltyPoints || 0) - points,
          }));
        }
        set((state: LoyaltyState) => ({
          loyaltyTx: pushLoyaltyTx(state.loyaltyTx, {
            userId,
            points: -points,
            reason,
            category: 'manual',
            byAdmin: true,
          }),
        }));
        return true;
      },

      setUserLevel: (userId, level) => {
        const cs = getCrossStore();
        const u = (cs.users || []).find(x => x.id === userId);
        if (cs.setUsers) {
          cs.setUsers((cs.users || []).map(x => x.id === userId ? { ...x, level } : x));
        }
        if (cs.setCurrentUser && cs.currentUser && cs.currentUser.id === userId) {
          cs.setCurrentUser(() => ({ ...cs.currentUser!, level }));
        }
        if (u) cs.pushAuditLog?.('تغییر سطح باشگاه مشتریان', `سطح «${u.name}» به «${level}» تغییر کرد`, 'دعوت‌ها');
      },

      redeemLoyaltyReward: (userId, rewardId) => {
        const cfg = get().gamificationConfig;
        const reward = cfg.rewards.find((r: LoyaltyRewardItem) => r.id === rewardId);
        if (!reward) return { ok: false, error: 'پاداش یافت نشد' };
        if (!reward.enabled) return { ok: false, error: 'این پاداش غیرفعال است' };
        const cs = getCrossStore();
        const base = cs.users || [];
        const target = base.find(u => u.id === userId);
        if (!target) return { ok: false, error: 'کاربر یافت نشد' };
        if ((target.loyaltyPoints || 0) < reward.cost) return { ok: false, error: 'امتیاز کافی نیست' };
        if (cs.setUsers) {
          cs.setUsers(base.map(u => u.id === userId ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) - reward.cost } : u));
        }
        if (cs.setCurrentUser && cs.currentUser && cs.currentUser.id === userId) {
          cs.setCurrentUser(() => ({
            ...cs.currentUser!,
            loyaltyPoints: (cs.currentUser!.loyaltyPoints || 0) - reward.cost,
          }));
        }
        set((state: LoyaltyState) => ({
          loyaltyTx: pushLoyaltyTx(state.loyaltyTx, {
            userId,
            points: -reward.cost,
            reason: `ثبت‌نام پاداش: ${reward.title}`,
            category: 'redeem',
          }),
        }));
        cs.pushAuditLog?.('خرج امتیاز باشگاه', `${target.name} پاداش «${reward.title}» (${reward.cost} امتیاز) را فعال کرد`, 'دعوت‌ها');
        return { ok: true };
      },

      awardReviewPoints: () => {
        const cs = getCrossStore();
        if (!cs.currentUser || cs.currentUser.role !== 'customer') return;
        const cfg = get().gamificationConfig;
        if (!cfg.enabled || cfg.reviewBonus <= 0) return;
        get().awardLoyaltyPoints(cs.currentUser.id, cfg.reviewBonus, 'ثبت نظر درباره محصول/خدمت', { category: 'review' });
      },
    }),
    {
      name: 'hamyar_loyalty_combined',
      storage: loyaltyStorage as any,
      partialize: (state: any) => ({
        loyaltyTx: state.loyaltyTx,
        gamificationConfig: state.gamificationConfig,
      }) as any,
      merge: (persistedState: any, currentState: any) => {
        const state = { ...currentState, ...(persistedState || {}) };

        if (!state.gamificationConfig || Object.keys(state.gamificationConfig).length === 0) {
          state.gamificationConfig = DEFAULT_GAMIFICATION_CONFIG;
        } else {
          state.gamificationConfig = { ...DEFAULT_GAMIFICATION_CONFIG, ...state.gamificationConfig };
        }

        try {
          const rawOldTx = localStorage.getItem('hamyar_loyalty');
          if (rawOldTx && (!state.loyaltyTx || state.loyaltyTx.length === 0)) {
            const parsed = JSON.parse(rawOldTx);
            if (Array.isArray(parsed)) state.loyaltyTx = parsed;
          }
        } catch {}

        try {
          const rawOldCfg = localStorage.getItem('hamyar_gamification');
          if (rawOldCfg) {
            const parsed = JSON.parse(rawOldCfg);
            const hasFullCfg = state.gamificationConfig?.tiers?.length > 0 &&
                               state.gamificationConfig?.badges?.length > 0 &&
                               state.gamificationConfig?.rewards?.length > 0;
            if (!hasFullCfg) {
              state.gamificationConfig = { ...DEFAULT_GAMIFICATION_CONFIG, ...parsed };
            }
          }
        } catch {}

        return state;
      },
    },
  ),
);
