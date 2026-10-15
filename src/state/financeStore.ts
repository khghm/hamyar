import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import type { Expense, DigitalMarketingData, Invoice } from '../domains/types';
import { fetchExpenses, fetchInvoices, syncExpenses, syncInvoices, syncInvoiceItems, expenseMapper, invoiceMapper } from '../domains/finance/api';
import { onSyncError } from '../api/sync';
import { subscribeCollectionRealtime, subscribeTableChanges, onTabVisible, debounce } from '../lib/realtime';

const DEFAULT_DIGITAL_MARKETING_DATA: DigitalMarketingData = {
  gmv: 0, nmv: 0, grossProfit: 0, profit: 0, cashFlow: 0,
  totalImpressions: 0, sessions: 0, engagementRate: 0, users: 0, sessionsPerUser: 0,
  transactions: 0, totalProductsSold: 0, returnRate: 0, outOfStockRate: 0, avgLossPerReturn: 0,
  onTimeDeliveryRate: 0, avgDeliveryTime: 0, avgSupplyTime: 0, purchaseRate: 0, aov: 0,
  aop: 0, avgProductPrice: 0, avgPackagingCost: 0, avgClicksPerVisit: 0,
  totalCalls: 0, callsPerSession: 0, callToCustomerRate: 0, clickOnCallRate: 0,
  phoneOrdersRate: 0, trackingCallsRate: 0, avgCallsPerUser: 0, costPerCall: 0,
  salesPerCall: 0, profitPerCall: 0, missedCallsRate: 0,
  chatSessionsInitiated: 0, chatPerSession: 0,
  pagesPerSession: 0, totalPageviews: 0, uniquePageviews: 0, homepageViewsRate: 0,
  productPageviews: 0, productPageviewsRate: 0, blogPageviews: 0, blogPageviewsRate: 0,
  categoryPageviewsRate: 0, topProductViewsRate: 0, error404Rate: 0,
  avgSessionDuration: 0, totalSessionTime: 0, avgEngagementTime: 0, avgTimeOnPage: 0,
  productVsBlogDuration: 0, videoVsNonVideoDuration: 0,
  bounceRate: 0, deepSessionsRate: 0, longSessionsRate: 0,
  registrationToPurchaseRate: 0, profileCompletionRate: 0, registrationCompletionRate: 0, googleVsEmailRate: 0,
  addToCartToPurchaseRate: 0, cartCompletionRate: 0, cartAbandonmentRate: 0,
  cpc: 0, cpv: 0, rpv: 0, rpl: 0, cpl: 0, organicVsPaidRate: 0, directRate: 0,
  directBrandedRate: 0, organicRate: 0, googleFirstTimeRate: 0,
  googleImpressions: 0, googleImageClickRate: 0, productOrganicRate: 0, avgCtr: 0,
  indexedPages: 0, internalLinks: 0, backlinkDomains: 0, domainAuthority: 0, spamScore: 0,
  topGoogleKeywords: 0, blogToShopVisits: 0,
  sessionGrowthRate: 0, organicGrowthRate: 0, internalSearchRate: 0, noResultSearchRate: 0,
  subscriberGrowthRate: 0, openRate: 0, emailCtr: 0,
  roi: 0, roas: 0,
  avgSessionsPerUser: 0, avgDaysBetweenSessions: 0, singlePageViewsRate: 0, avgTimeToPurchase: 0,
  assistedPathPosition: 0, firstVisitPurchaseRate: 0, newVisitorPurchaseRate: 0,
  assistedConversionsRate: 0, returningVsNewRate: 0, returningValueVsNew: 0,
  mobileVsDesktopRate: 0, maleVsFemaleRate: 0, avgUserAge: 0,
  productComments: 0, avgCommentsPerUser: 0, avgScrollDepth: 0, scroll80Rate: 0,
  day1RetentionRate: 0, weeklyVsMonthlyRetention: 0,
  cac: 0, clv: 0, clvToCac: 0, retentionRate: 0, churnRate: 0, loyalCustomerRate: 0,
  purchaseFrequency: 0, avgTimeBetweenPurchases: 0,
  largestCartItems: 0, topCustomerOrders: 0, topCustomerAmount: 0, b2bVsB2cRate: 0,
  marketShare: 0, cheaperCompetitorsRate: 0,
  deadClicks: 0, quickBacks: 0, trustSymbolClickRate: 0, wishlistClicks: 0,
  wordsGenerated: 0, imagesAdded: 0, infographicsCreated: 0, videosAdded: 0,
  productsAdded: 0, blogPosts: 0, productVsBlogWordsRate: 0, reports: 0, oldContentUpdates: 0,
  referralTraffic: 0, exitRate: 0, avgBlogPageValue: 0, blogVsTotalPageValue: 0,
  blogUsersRate: 0, blogToShopRate: 0, productImageClickRate: 0, productVideoClickRate: 0,
  avgProductRating: 0, avgBlogRating: 0,
  brandAwareness: 0, topOfMind: 0, nps: 0, satisfactionRate: 0, womRate: 0,
  designScore: 0, findabilityScore: 0, readabilityScore: 0, trustScore: 0, supportScore: 0,
  suppliers: 0, personnel: 0, positions: 0, dailyWorkHours: 0, revenuePerHour: 0, avgHourlyWage: 0,
  avgPageLoadTime: 0, fcp: 0, lcp: 0,
  socialTraffic: 0, socialIconClicks: 0, ugcContent: 0, totalFollowers: 0, followers: 0,
  avgLikes: 0, avgComments: 0, accountReach: 0, videoReach: 0, postReach: 0, storyReach: 0,
  topPostReach: 0, topStoryReach: 0, topVideoReach: 0, profileVisits: 0, socialImpressions: 0,
  contentInteractions: 0, postInteractions: 0, storyInteractions: 0, videoInteractions: 0,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_EXPENSES: Expense[] = [];

interface FinanceState {
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  invoices: Invoice[];
  setInvoices: (i: Invoice[]) => void;
  digitalMarketingData: DigitalMarketingData;
  setDigitalMarketingData: (d: DigitalMarketingData) => void;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startRealtime: () => void;
  stopRealtime: () => void;
}

const financeStorage: StateStorage = {
  getItem: (_name) => {
    const expensesRaw = localStorage.getItem('hamyar_expenses');
    const invoicesRaw = localStorage.getItem('hamyar_invoices');
    const dmRaw = localStorage.getItem('hamyar_digital_marketing_data');
    const dmFallback = localStorage.getItem('hamyar_digital_marketing');
    const dmFinal = dmRaw ?? dmFallback;
    return JSON.stringify({
      state: {
        expenses: expensesRaw ? JSON.parse(expensesRaw) : DEFAULT_EXPENSES,
        invoices: invoicesRaw ? JSON.parse(invoicesRaw) : [],
        digitalMarketingData: dmFinal
          ? { ...DEFAULT_DIGITAL_MARKETING_DATA, ...JSON.parse(dmFinal) }
          : DEFAULT_DIGITAL_MARKETING_DATA,
      },
      version: 0,
    });
  },
  setItem: (_name, value) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const state = parsed.state ?? parsed;
    if (state.expenses !== undefined) {
      localStorage.setItem('hamyar_expenses', JSON.stringify(state.expenses));
    }
    if (state.invoices !== undefined) {
      localStorage.setItem('hamyar_invoices', JSON.stringify(state.invoices));
    }
    if (state.digitalMarketingData !== undefined) {
      localStorage.setItem(
        'hamyar_digital_marketing_data',
        JSON.stringify(state.digitalMarketingData),
      );
    }
  },
  removeItem: (_name) => {
    localStorage.removeItem('hamyar_expenses');
    localStorage.removeItem('hamyar_invoices');
    localStorage.removeItem('hamyar_digital_marketing_data');
  },
};

let financeRealtimeUnsubs: Array<() => void> = [];
let financeVisibilityUnsub: (() => void) | null = null;

const debouncedFinanceRefresh = debounce(() => {
  const store = useFinanceStore.getState();
  if (store.hydrated) store.hydrate();
}, 500);

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get): FinanceState => ({
      hydrated: false,
      hydrate: async () => {
        if (get().hydrated) return;
        try {
          const [cloudExpenses, cloudInvoices] = await Promise.all([
            fetchExpenses().catch(() => null),
            fetchInvoices().catch(() => null),
          ]);
          const local = get();
          const mergeById = <T extends { id: string }>(localArr: T[], cloudArr: T[] | null): T[] => {
            if (!Array.isArray(cloudArr) || cloudArr.length === 0) return localArr;
            const byId = new Map(cloudArr.map(x => [x.id, x]));
            const merged = [...cloudArr];
            for (const x of localArr) {
              if (!byId.has(x.id)) merged.push(x);
            }
            return merged;
          };
          set({
            expenses: mergeById(local.expenses, cloudExpenses),
            invoices: mergeById(local.invoices, cloudInvoices),
            hydrated: true,
          });
        } catch (err) {
          console.warn('[finance] hydrate failed, using local data:', err);
          set({ hydrated: true });
        }
      },
      expenses: DEFAULT_EXPENSES,
      setExpenses: (expenses) => {
        const prev = get().expenses;
        set({ expenses });
        if (get().hydrated) {
          syncExpenses(expenses, prev).catch(() => {});
        }
      },
      invoices: [],
      setInvoices: (invoices) => {
        const prev = get().invoices;
        set({ invoices });
        if (get().hydrated) {
          syncInvoices(invoices, prev)
            .then(() => syncInvoiceItems(invoices).catch(() => {}))
            .catch(() => {});
        }
      },
      digitalMarketingData: DEFAULT_DIGITAL_MARKETING_DATA,
      setDigitalMarketingData: (digitalMarketingData) => set({ digitalMarketingData }),

      startRealtime: () => {
        if (financeRealtimeUnsubs.length > 0) return;

        financeRealtimeUnsubs.push(
          subscribeCollectionRealtime(
            expenseMapper,
            () => get().expenses,
            (next) => set({ expenses: next }),
            debouncedFinanceRefresh,
          ),
        );

        financeRealtimeUnsubs.push(
          subscribeTableChanges(
            'invoices-realtime',
            'invoices',
            (payload) => {
              const { eventType, new: newRow, old: oldRow } = payload;
              const current = get().invoices;

              if (eventType === 'DELETE') {
                if (!oldRow) return;
                const key = String(oldRow[invoiceMapper.keyColumn] ?? oldRow.id ?? '');
                if (!key) return;
                set({ invoices: current.filter(i => i.id !== key) });
                return;
              }

              if (!newRow) return;
              const incoming = invoiceMapper.fromRow(newRow);
              if (!incoming) return;

              const idx = current.findIndex(i => i.id === incoming.id);
              if (idx === -1) {
                set({ invoices: [incoming, ...current] });
              } else {
                const existing = current[idx];
                const merged: Invoice = {
                  ...existing,
                  ...incoming,
                  items: existing.items || incoming.items || [],
                };
                const next = current.slice();
                next[idx] = merged;
                set({ invoices: next });
              }
            },
          ),
        );

        financeVisibilityUnsub = onTabVisible(() => {
          debouncedFinanceRefresh();
        });
      },

      stopRealtime: () => {
        for (const unsub of financeRealtimeUnsubs) {
          try { unsub(); } catch { /* ignore */ }
        }
        financeRealtimeUnsubs = [];
        if (financeVisibilityUnsub) {
          financeVisibilityUnsub();
          financeVisibilityUnsub = null;
        }
      },
    }),
    {
      name: 'hamyar_finance',
      storage: financeStorage as any,
      partialize: (state: any) => ({
        expenses: state.expenses,
        invoices: state.invoices,
        digitalMarketingData: state.digitalMarketingData,
      }) as any,
      merge: (persistedState: any, currentState: any) => {
        const merged = { ...currentState, ...(persistedState ?? {}) } as FinanceState;
        if (merged.digitalMarketingData) {
          merged.digitalMarketingData = {
            ...DEFAULT_DIGITAL_MARKETING_DATA,
            ...merged.digitalMarketingData,
          };
        }
        return merged;
      },
    },
  ),
);

onSyncError((report) => {
  console.error(`[finance] sync error on ${report.table}:`, report.message, report.keys);
});
