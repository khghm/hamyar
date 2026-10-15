import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ContentProject,
  ContentComment,
  ContentAsset,
  ContentTemplate,
  ContentIdea,
  BrandBook,
  Order,
  OrderStatus,
} from '../domains/types';
import { fetchContentIdeas, fetchContentProjects, fetchContentTemplates, syncContentIdeas, syncContentProjects, syncContentTemplates, contentProjectMapper, contentTemplateMapper, contentIdeaMapper } from '../domains/content/api';
import { onSyncError, type SyncErrorReport } from '../api/sync';
import { useNotificationStore } from './notificationStore';
import { subscribeCollectionRealtime, onTabVisible, debounce } from '../lib/realtime';

const getNotificationStore = () => {
  try {
    return useNotificationStore;
  } catch {
    return null;
  }
};

export const DEFAULT_CONTENT_TEMPLATES: ContentTemplate[] = [
  { id: 't1', name: 'معرفی محصول', type: 'video', scenario: 'معرفی کوتاه محصول با نمایش ویژگی‌ها', equipment: ['دوربین', 'نور', 'میکروفون'], contentPlan: '1. معرفی 2. ویژگی‌ها 3. قیمت 4. دعوت به خرید', qualityChecklist: ['کیفیت تصویر', 'صدای واضح', 'رعایت برند بوک'], createdAt: new Date().toISOString() },
  { id: 't2', name: 'استوری اینستاگرام', type: 'social', scenario: 'استوری کوتاه و جذاب', equipment: ['موبایل'], contentPlan: '1. هوک 2. محتوا 3. CTA', qualityChecklist: ['ابعاد صحیح', 'متن خوانا', 'کال تو اکشن'], createdAt: new Date().toISOString() },
  { id: 't3', name: 'مقاله آموزشی', type: 'article', scenario: 'آموزش استفاده از محصول', equipment: [], contentPlan: '1. مقدمه 2. مراحل 3. نکات 4. نتیجه', qualityChecklist: ['صحت اطلاعات', 'لحن برند', 'سئو'], createdAt: new Date().toISOString() },
];

export const DEFAULT_BRAND_BOOK: BrandBook = {
  primaryColor: '#2563eb',
  secondaryColor: '#7c3aed',
  accentColor: '#f59e0b',
  fonts: ['Vazirmatn', 'IRANSans'],
  tone: 'حرفه‌ای، دوستانه، قابل اعتماد',
  logoUrl: '',
  guidelines: 'در تمام محتواها از رنگ‌های آبی و بنفش به عنوان رنگ‌های اصلی استفاده شود. لحن برند باید حرفه‌ای اما دوستانه باشد.',
};

const ORDER_STATUS_TO_CONTENT_STATUS: Record<OrderStatus, ContentProject['status']> = {
  new: 'planning',
  processing: 'in-progress',
  ready: 'review',
  delivered: 'published',
  cancelled: 'completed',
};

export interface CreateContentProjectFromOrderInput {
  projectServiceId: string;
  projectServiceTitle: string;
  projectServiceGroup: string;
  contentType: ContentProject['type'];
  orderId: string;
  trackingCode: string;
  customerName: string;
  total: number;
  urgent?: boolean;
  formData: Record<string, string>;
  documents: { key: string; label: string; name: string; size: number }[];
  fieldLabels: Record<string, string>;
}

interface ContentState {
  contentProjects: ContentProject[];
  contentComments: ContentComment[];
  contentAssets: ContentAsset[];
  contentTemplates: ContentTemplate[];
  contentIdeas: ContentIdea[];
  brandBook: BrandBook;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setContentProjects: (p: ContentProject[]) => void;
  setContentComments: (c: ContentComment[]) => void;
  setContentAssets: (a: ContentAsset[]) => void;
  setContentTemplates: (t: ContentTemplate[]) => void;
  setContentIdeas: (i: ContentIdea[]) => void;
  setBrandBook: (b: BrandBook) => void;
  createContentProjectFromOrder: (input: CreateContentProjectFromOrderInput) => { contentProjectId: string; contentProject: ContentProject };
  syncContentFromOrders: (prevOrders: Order[], nextOrders: Order[]) => ContentProject[];
  syncOrdersFromContent: (prevContent: ContentProject[], nextContent: ContentProject[], orders: Order[], updateOrderStatus: (id: string, status: OrderStatus) => void) => void;
  startRealtime: () => void;
  stopRealtime: () => void;
}

let contentRealtimeUnsubs: Array<() => void> = [];
let contentVisibilityUnsub: (() => void) | null = null;

const debouncedContentRefresh = debounce(() => {
  const store = useContentStore.getState();
  if (store.hydrated) store.hydrate();
}, 500);

export const useContentStore = create<ContentState>()(
  persist(
    (set, get): ContentState => {
      const state: ContentState = {
        contentProjects: [],
        contentComments: [],
        contentAssets: [],
        contentTemplates: DEFAULT_CONTENT_TEMPLATES,
        contentIdeas: [],
        brandBook: DEFAULT_BRAND_BOOK,
        hydrated: false,

        hydrate: async () => {
          try {
            const [contentProjects, contentTemplates, contentIdeas] = await Promise.all([
              fetchContentProjects(),
              fetchContentTemplates(),
              fetchContentIdeas(),
            ]);
            const mergeById = (local: ContentProject[], cloud: ContentProject[]): ContentProject[] => {
              if (!Array.isArray(cloud) || cloud.length === 0) return local;
              const byId = new Map(cloud.map(cp => [cp.id, cp]));
              const merged = [...cloud];
              for (const cp of local) {
                if (!byId.has(cp.id)) merged.push(cp);
              }
              return merged;
            };
            set({
              contentProjects: mergeById(get().contentProjects, contentProjects),
              contentTemplates: contentTemplates.length > 0 ? contentTemplates : get().contentTemplates,
              contentIdeas: contentIdeas.length > 0 ? contentIdeas : get().contentIdeas,
              hydrated: true,
            });
          } catch (e) {
            console.error('[content] hydrate failed:', e);
            set({ hydrated: true });
          }
        },

        setContentProjects: (next) => {
          const prev = get().contentProjects;
          set({ contentProjects: next });
          if (get().hydrated) {
            syncContentProjects(next, prev).catch(() => {});
          }
        },

        setContentComments: (c) => set({ contentComments: c }),

        setContentAssets: (a) => set({ contentAssets: a }),

        setContentTemplates: (next) => {
          const prev = get().contentTemplates;
          set({ contentTemplates: next });
          if (get().hydrated) {
            syncContentTemplates(next, prev).catch(() => {});
          }
        },

        setContentIdeas: (next) => {
          const prev = get().contentIdeas;
          set({ contentIdeas: next });
          if (get().hydrated) {
            syncContentIdeas(next, prev).catch(() => {});
          }
        },

        setBrandBook: (b) => set({ brandBook: b }),

        createContentProjectFromOrder: ({
          projectServiceId,
          projectServiceTitle,
          projectServiceGroup,
          contentType,
          orderId,
          trackingCode,
          customerName,
          total,
          urgent,
          formData,
          documents,
          fieldLabels,
        }) => {
          const now = new Date();
          const contentTaskId = 'cp' + Date.now();
          const docSummary = documents.length > 0
            ? `\n\nمدارک دریافتی از مشتری:\n- ${documents.map(d => d.label).join('\n- ')}`
            : '\n\nهنوز مدرکی بارگذاری نشده است.';
          const groupLabel = projectServiceGroup === 'content' ? 'تولید محتوا' : projectServiceGroup;
          const newContentTask: ContentProject = {
            id: contentTaskId,
            title: `${projectServiceTitle} – سفارش ${trackingCode}`,
            type: contentType,
            scenario: `سفارش آنلاین «${projectServiceTitle}» از سمت مشتری ${customerName}${urgent ? ' (فوری)' : ''}.\n\nاطلاعات تکمیلی مشتری:\n${Object.entries(formData).map(([k, v]) => `- ${fieldLabels[k] || k}: ${v}`).join('\n')}${docSummary}`,
            equipment: [],
            contentPlan: `تحویل خروجی طبق بریف مشتری و مدارک بارگذاری‌شده در سفارش ${trackingCode}.`,
            assignedTo: [],
            startDate: now.toISOString().split('T')[0],
            deadline: formData.deadline || '',
            status: 'planning',
            priority: urgent ? 'urgent' : 'medium',
            notes: `این تسک به‌صورت خودکار از سفارش آنلاین ${trackingCode} ایجاد شده و با آن همگام است.`,
            tags: ['سفارش آنلاین', groupLabel],
            relatedProducts: [],
            relatedCampaigns: [],
            budget: total,
            actualCost: 0,
            qualityScore: 0,
            qualityChecklist: [],
            approvalStage: 'draft',
            versions: [],
            createdAt: now.toISOString(),
            sourceOrderId: orderId,
            sourceTrackingCode: trackingCode,
            customerName,
          };
          set(state => ({ contentProjects: [newContentTask, ...state.contentProjects] }));
          return { contentProjectId: contentTaskId, contentProject: newContentTask };
        },

        syncContentFromOrders: (prevOrders, nextOrders) => {
          const changed = nextOrders.filter(o => {
            const old = prevOrders.find(p => p.id === o.id);
            return old && (old.status !== o.status || old.documentStatus !== o.documentStatus);
          });
          const linked = changed.filter(o => o.contentProjectId);
          if (linked.length === 0) return get().contentProjects;

          const current = get().contentProjects;
          const updated = current.map(cp => {
            const o = linked.find(x => x.contentProjectId === cp.id);
            if (!o) return cp;
            if (o.status === 'cancelled') {
              return { ...cp, status: 'completed' as const, notes: `${cp.notes}\n⛔ سفارش مرجع ${o.trackingCode} لغو شد.` };
            }
            const oldO = prevOrders.find(p => p.id === o.id);
            const docsNote = o.documentStatus === 'rejected' && oldO?.documentStatus !== 'rejected'
              ? `\n⚠️ مدارک سفارش ${o.trackingCode} توسط مدیر رد شد؛ مشتری باید مدارک را دوباره بارگذاری کند.`
              : o.documentStatus === 'approved' && oldO?.documentStatus !== 'approved'
                ? `\n✅ مدارک سفارش ${o.trackingCode} تأیید شد؛ تولید را آغاز کنید.`
                : '';
            return {
              ...cp,
              status: ORDER_STATUS_TO_CONTENT_STATUS[o.status],
              budget: o.total,
              deadline: o.formData?.deadline || cp.deadline,
              notes: cp.notes + docsNote,
            };
          });
          set({ contentProjects: updated });
          return updated;
        },

        syncOrdersFromContent: (prevContent, nextContent, orders, updateOrderStatus) => {
          const published = nextContent.filter(cp => {
            const old = prevContent.find(p => p.id === cp.id);
            return old && old.status !== 'published' && cp.status === 'published' && cp.sourceOrderId;
          });
          if (published.length === 0) return;
          published.forEach(cp => {
            const o = orders.find(x => x.id === cp.sourceOrderId);
            if (o && o.status !== 'delivered') updateOrderStatus(o.id, 'delivered');
          });
        },

        startRealtime: () => {
          if (contentRealtimeUnsubs.length > 0) return;

          contentRealtimeUnsubs.push(
            subscribeCollectionRealtime(
              contentProjectMapper,
              () => get().contentProjects,
              (next) => set({ contentProjects: next }),
              debouncedContentRefresh,
            ),
            subscribeCollectionRealtime(
              contentTemplateMapper,
              () => get().contentTemplates,
              (next) => set({ contentTemplates: next }),
              debouncedContentRefresh,
            ),
            subscribeCollectionRealtime(
              contentIdeaMapper,
              () => get().contentIdeas,
              (next) => set({ contentIdeas: next }),
              debouncedContentRefresh,
            ),
          );

          contentVisibilityUnsub = onTabVisible(() => {
            debouncedContentRefresh();
          });
        },

        stopRealtime: () => {
          for (const unsub of contentRealtimeUnsubs) {
            try { unsub(); } catch { /* ignore */ }
          }
          contentRealtimeUnsubs = [];
          if (contentVisibilityUnsub) {
            contentVisibilityUnsub();
            contentVisibilityUnsub = null;
          }
        },
      };
      return state;
    },
    {
      name: 'hamyar_content',
      partialize: state => ({
        contentProjects: state.contentProjects,
        contentComments: state.contentComments,
        contentAssets: state.contentAssets,
        contentTemplates: state.contentTemplates,
        contentIdeas: state.contentIdeas,
        brandBook: state.brandBook,
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
        if (state.contentProjects.length === 0) {
          state.contentProjects = tryLegacy('hamyar_content_projects', []);
        }
        if (state.contentComments.length === 0) {
          state.contentComments = tryLegacy('hamyar_content_comments', []);
        }
        if (state.contentAssets.length === 0) {
          state.contentAssets = tryLegacy('hamyar_content_assets', []);
        }
        if (state.contentTemplates.length === 0 || state.contentTemplates === DEFAULT_CONTENT_TEMPLATES) {
          const fromLegacy = tryLegacy<ContentTemplate[]>('hamyar_content_templates', []);
          if (fromLegacy.length > 0) state.contentTemplates = fromLegacy;
        }
        if (state.contentIdeas.length === 0) {
          state.contentIdeas = tryLegacy('hamyar_content_ideas', []);
        }
        if (!state.brandBook || state.brandBook === DEFAULT_BRAND_BOOK) {
          const fromLegacy = tryLegacy<BrandBook | null>('hamyar_brand_book', null);
          if (fromLegacy) state.brandBook = fromLegacy;
        }
        state.hydrated = false;
        state.hydrate();
      },
    },
  ),
);

onSyncError((report: SyncErrorReport) => {
  const tables = ['content_projects', 'content_templates', 'content_ideas'];
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
