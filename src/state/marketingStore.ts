import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Campaign,
  Affiliate,
  AffiliateOrder,
  AffiliateTransaction,
  Persona,
  OKR,
  KPI,
} from '../domains/types';
import { fetchCampaigns, fetchAffiliates, fetchPersonas, syncAffiliates, syncCampaigns, syncPersonas } from '../domains/marketing/api';
import { fetchKpis, fetchOkrs, syncKpis, syncOkrs } from '../domains/okr/api';
import { onSyncError, type SyncErrorReport } from '../api/sync';
import { useNotificationStore } from './notificationStore';

const getNotificationStore = () => {
  try {
    return useNotificationStore;
  } catch {
    return null;
  }
};

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: 'تخفیف آغاز سال تحصیلی', code: 'SCHOOL1403', discount: 20, type: 'percent', minPurchase: 100000, maxUses: 100, usedCount: 15, startDate: '1403/07/01', endDate: '1403/07/31', active: true },
  { id: 'c2', title: 'تخفیف ویژه پایان سال', code: 'ENDYEAR', discount: 50000, type: 'fixed', minPurchase: 500000, maxUses: 50, usedCount: 8, startDate: '1403/12/01', endDate: '1403/12/29', active: true },
];

const nowIso = () => new Date().toISOString();

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'persona1',
    name: 'دانشجوی فعال',
    avatar: '🎓',
    tagline: 'دنبال خدمات سریع و ارزان برای پروژه‌های دانشگاهی',
    demographics: {
      ageRange: '18-25',
      gender: 'mixed',
      location: 'شهرهای بزرگ',
      education: 'دانشجو',
      occupation: 'دانشجو',
      incomeLevel: 'low',
    },
    psychographics: {
      personality: ['کنجکاو', 'صرفه‌جو', 'تکنولوژی‌دوست'],
      values: ['سرعت', 'قیمت مناسب', 'کیفیت'],
      interests: ['تکنولوژی', 'فیلم', 'بازی'],
      lifestyle: 'پرجنب‌وجوش و دیجیتال',
    },
    behavior: {
      buyingHabits: 'مقایسه قیمت قبل از خرید',
      preferredChannels: ['اینستاگرام', 'تلگرام'],
      decisionFactors: ['قیمت', 'سرعت انجام', 'نظرات دیگران'],
      painPoints: ['بودجه محدود', 'کمبود وقت', 'پیچیدگی خدمات'],
      goals: ['انجام پروژه‌های دانشگاهی', 'یادگیری مهارت‌های جدید'],
    },
    services: {
      primaryServices: ['پرینت و اسکن', 'تایپ', 'کپی فیلم'],
      frequency: 'weekly',
      avgSpending: 50000,
      preferredPayment: 'کارت به کارت',
    },
    scenario: {
      typicalDay: 'صبح دانشگاه، عصر پروژه‌های درسی، شب فیلم و سریال',
      challenges: ['بودجه محدود', 'مهلت‌های فشرده', 'نیاز به خدمات سریع'],
      solutions: ['قیمت‌های دانشجویی', 'انجام فوری', 'بسته‌های ویژه'],
      touchpoints: ['اینستاگرام', 'سایت', 'مراجعه حضوری'],
    },
    quote: 'من به دنبال خدماتی هستم که سریع و ارزان باشه',
    notes: 'این گروه هدف اصلی ما برای خدمات پرینت و تایپ هستند',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'persona2',
    name: 'کارمند حرفه‌ای',
    avatar: '💼',
    tagline: 'نیازمند خدمات با کیفیت برای کار و زندگی شخصی',
    demographics: {
      ageRange: '25-40',
      gender: 'mixed',
      location: 'تهران و کلان‌شهرها',
      education: 'لیسانس و بالاتر',
      occupation: 'کارمند',
      incomeLevel: 'medium',
    },
    psychographics: {
      personality: ['منظم', 'کیفیت‌محور', 'مشتری‌مدار'],
      values: ['کیفیت', 'اعتماد', 'راحتی'],
      interests: ['تکنولوژی', 'سرمایه‌گذاری', 'سفر'],
      lifestyle: 'متعادل و حرفه‌ای',
    },
    behavior: {
      buyingHabits: 'تحقیق قبل از خرید',
      preferredChannels: ['وب‌سایت', 'واتساپ'],
      decisionFactors: ['کیفیت', 'اعتبار', 'پشتیبانی'],
      painPoints: ['کمبود وقت', 'نیاز به خدمات حرفه‌ای', 'پیچیدگی فرآیندها'],
      goals: ['ارتقای شغلی', 'مدیریت بهتر زندگی', 'یادگیری'],
    },
    services: {
      primaryServices: ['ترجمه رسمی', 'طراحی سایت', 'خدمات اداری'],
      frequency: 'monthly',
      avgSpending: 200000,
      preferredPayment: 'کارت بانکی',
    },
    scenario: {
      typicalDay: 'صبح کار، ناهار با همکاران، عصر ورزش یا مطالعه',
      challenges: ['مدیریت زمان', 'نیاز به خدمات حرفه‌ای', 'بودجه متوسط'],
      solutions: ['خدمات آنلاین', 'بسته‌های ویژه', 'مشاوره رایگان'],
      touchpoints: ['وب‌سایت', 'ایمیل', 'مراجعه حضوری'],
    },
    quote: 'من به دنبال خدماتی هستم که حرفه‌ای و قابل اعتماد باشه',
    notes: 'این گروه برای خدمات ترجمه و طراحی سایت مناسب هستند',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'persona3',
    name: 'صاحب کسب‌وکار',
    avatar: '🏢',
    tagline: 'نیازمند خدمات دیجیتال برای رشد کسب‌وکار',
    demographics: {
      ageRange: '30-50',
      gender: 'mixed',
      location: 'سراسر ایران',
      education: 'لیسانس و بالاتر',
      occupation: 'کارآفرین',
      incomeLevel: 'high',
    },
    psychographics: {
      personality: ['ریسک‌پذیر', 'خلاق', 'نتیجه‌محور'],
      values: ['رشد', 'نوآوری', 'سودآوری'],
      interests: ['کسب‌وکار', 'تکنولوژی', 'بازاریابی'],
      lifestyle: 'پرجنب‌وجوش و هدفمند',
    },
    behavior: {
      buyingHabits: 'سرمایه‌گذاری در خدمات با کیفیت',
      preferredChannels: ['لینکدین', 'وب‌سایت'],
      decisionFactors: ['ROI', 'کیفیت', 'پشتیبانی'],
      painPoints: ['رقابت شدید', 'نیاز به حضور آنلاین', 'مدیریت زمان'],
      goals: ['رشد کسب‌وکار', 'افزایش فروش', 'برندسازی'],
    },
    services: {
      primaryServices: ['طراحی سایت', 'تولید محتوا', 'دیجیتال مارکتینگ'],
      frequency: 'monthly',
      avgSpending: 2000000,
      preferredPayment: 'حواله بانکی',
    },
    scenario: {
      typicalDay: 'صبح جلسات، ظهر ناهار کاری، عصر برنامه‌ریزی',
      challenges: ['رقابت', 'بودجه بازاریابی', 'نیاز به نتایج سریع'],
      solutions: ['پکیج‌های جامع', 'مشاوره تخصصی', 'گزارش‌های منظم'],
      touchpoints: ['لینکدین', 'وب‌سایت', 'تماس تلفنی'],
    },
    quote: 'من به دنبال خدماتی هستم که کسب‌وکارم را متحول کند',
    notes: 'این گروه برای خدمات طراحی سایت و دیجیتال مارکتینگ مناسب هستند',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

interface MarketingState {
  campaigns: Campaign[];
  affiliates: Affiliate[];
  affiliateOrders: AffiliateOrder[];
  affiliateTransactions: AffiliateTransaction[];
  personas: Persona[];
  okrs: OKR[];
  kpis: KPI[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setCampaigns: (c: Campaign[]) => void;
  setAffiliates: (a: Affiliate[]) => void;
  setAffiliateOrders: (o: AffiliateOrder[]) => void;
  setAffiliateTransactions: (t: AffiliateTransaction[]) => void;
  setPersonas: (p: Persona[]) => void;
  setOkrs: (o: OKR[]) => void;
  setKpis: (k: KPI[]) => void;
}

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get): MarketingState => {
      const state: MarketingState = {
        campaigns: DEFAULT_CAMPAIGNS,
        affiliates: [],
        affiliateOrders: [],
        affiliateTransactions: [],
        personas: DEFAULT_PERSONAS,
        okrs: [],
        kpis: [],
        hydrated: false,

        hydrate: async () => {
          try {
            const [campaigns, affiliates, personas, okrs, kpis] = await Promise.all([
              fetchCampaigns(),
              fetchAffiliates(),
              fetchPersonas(),
              fetchOkrs(),
              fetchKpis(),
            ]);
            set({
              campaigns: campaigns.length > 0 ? campaigns : get().campaigns,
              affiliates: affiliates.length > 0 ? affiliates : get().affiliates,
              personas: personas.length > 0 ? personas : get().personas,
              okrs: okrs.length > 0 ? okrs : get().okrs,
              kpis: kpis.length > 0 ? kpis : get().kpis,
              hydrated: true,
            });
          } catch (e) {
            console.error('[marketing] hydrate failed:', e);
            set({ hydrated: true });
          }
        },

        setCampaigns: (next) => {
          const prev = get().campaigns;
          set({ campaigns: next });
          if (get().hydrated) {
            syncCampaigns(next, prev).catch(() => {});
          }
        },

        setAffiliates: (next) => {
          const prev = get().affiliates;
          set({ affiliates: next });
          if (get().hydrated) {
            syncAffiliates(next, prev).catch(() => {});
          }
        },

        setAffiliateOrders: (o) => set({ affiliateOrders: o }),

        setAffiliateTransactions: (t) => set({ affiliateTransactions: t }),

        setPersonas: (next) => {
          const prev = get().personas;
          set({ personas: next });
          if (get().hydrated) {
            syncPersonas(next, prev).catch(() => {});
          }
        },

        setOkrs: (next) => {
          const prev = get().okrs;
          set({ okrs: next });
          if (get().hydrated) {
            syncOkrs(next, prev).catch(() => {});
          }
        },

        setKpis: (next) => {
          const prev = get().kpis;
          set({ kpis: next });
          if (get().hydrated) {
            syncKpis(next, prev).catch(() => {});
          }
        },
      };
      return state;
    },
    {
      name: 'hamyar_marketing',
      partialize: (state) => ({
        campaigns: state.campaigns,
        affiliates: state.affiliates,
        affiliateOrders: state.affiliateOrders,
        affiliateTransactions: state.affiliateTransactions,
        personas: state.personas,
        okrs: state.okrs,
        kpis: state.kpis,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const tryLegacy = <T,>(key: string, fallback: T): T => {
          if (typeof window === 'undefined') return fallback;
          try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
          } catch {
            return fallback;
          }
        };
        if (state.campaigns.length === 0 || state.campaigns === DEFAULT_CAMPAIGNS) {
          const fromLegacy = tryLegacy<Campaign[]>('hamyar_campaigns', []);
          if (fromLegacy.length > 0) state.campaigns = fromLegacy;
        }
        if (state.affiliates.length === 0) {
          state.affiliates = tryLegacy('hamyar_affiliates', []);
        }
        if (state.affiliateOrders.length === 0) {
          state.affiliateOrders = tryLegacy('hamyar_affiliate_orders', []);
        }
        if (state.affiliateTransactions.length === 0) {
          state.affiliateTransactions = tryLegacy('hamyar_affiliate_transactions', []);
        }
        if (state.personas.length === 0 || state.personas === DEFAULT_PERSONAS) {
          const fromLegacy = tryLegacy<Persona[]>('hamyar_personas', []);
          if (fromLegacy.length > 0) state.personas = fromLegacy;
        }
        if (state.okrs.length === 0) {
          state.okrs = tryLegacy('hamyar_okrs', []);
        }
        if (state.kpis.length === 0) {
          state.kpis = tryLegacy('hamyar_kpis', []);
        }
        state.hydrated = false;
        state.hydrate();
      },
    },
  ),
);

onSyncError((report: SyncErrorReport) => {
  const tables = ['campaigns', 'affiliates', 'personas', 'okrs', 'kpis'];
  if (!tables.includes(report.table)) return;
  const ns = getNotificationStore();
  if (!ns) return;
  const st = ns.getState?.();
  if (!st?.pushNotification) return;
  const keysText = report.keys.length > 0 ? ` (${report.keys.slice(0, 3).join('، ')}${report.keys.length > 3 ? '…' : ''})` : '';
  st.pushNotification({
    type: 'system',
    title: `خطای ذخیره‌سازی ${report.table}`,
    message: `${report.rejected} ردیف ذخیره نشد${keysText}: ${report.message}`,
    priority: 'high',
  });
});
