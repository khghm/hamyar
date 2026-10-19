import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Order,
  OrderItem,
  OrderStatus,
  Invoice,
  Service,
  ProjectService,
  Product,
  MediaItem,
  User,
  Project,
  ContentProject,
} from '../domains/types';
import {
  ORDER_STATUS_LABELS,
  SERVICE_URGENCY_MULTIPLIER,
  PROJECT_FIELD_LABELS,
  CONTENT_SERVICE_TYPE_MAP,
} from '../domains/types';
import { fetchOrders, placeOrder, placeCatalogOrder, changeOrderStatus, deleteOrder as deleteOrderApi } from '../api/orders';
import { startOnlinePayment } from '../api/zarinpal';
import { fetchInvoices, syncInvoices, syncInvoiceItems } from '../domains/finance/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useCatalogStore } from './catalogStore';
import { useContentStore } from './contentStore';
import { useNotificationStore } from './notificationStore';
import { subscribeTableChanges, onTabVisible, debounce } from '../lib/realtime';

interface CrossStoreShim {
  currentUser?: User | null;
  users?: User[];
  products?: Product[];
  mediaItems?: MediaItem[];
  projects?: Project[];
  contentProjects?: ContentProject[];
  setUsers?: (u: User[]) => void;
  setCurrentUser?: (updater: (cu: User | null) => User | null) => void;
  setProducts?: (p: Product[]) => void;
  setProjects?: (p: Project[]) => void;
  setContentProjects?: (c: ContentProject[]) => void;
  pushNotification?: (input: any) => void;
  pushAuditLog?: (action: string, details: string, module: string) => void;
  pushSmsLog?: (phone: string, message: string) => void;
  awardPurchasePoints?: (userId: string | undefined, amount: number, trackingCode: string) => void;
}

/**
 * بعد از ثبت سفارش، برای پرداخت آنلاین کاربر را به درگاه زرین‌پال می‌فرستد.
 *
 * سفارش در این لحظه «پرداخت‌نشده» است؛ فقط بعد از بازگشت از درگاه و تأیید
 * سمت سرور (`/api/zarinpal/verify`) مبلغ روی سفارش و فاکتور ثبت می‌شود.
 */
async function redirectToGateway(orderId: string, cs: CrossStoreShim): Promise<boolean> {
  const gateway = await startOnlinePayment(orderId);
  if (gateway.ok && gateway.startUrl) {
    window.location.assign(gateway.startUrl);
    return true;
  }
  if (cs.pushNotification) {
    cs.pushNotification({
      type: 'payment',
      priority: 'high',
      title: 'اتصال به درگاه پرداخت ناموفق',
      message: gateway.error || 'درگاه پرداخت در دسترس نیست؛ سفارش شما ثبت شد و می‌توانید بعداً از پروفایل پرداخت کنید.',
      link: '/profile',
      key: 'pay-gw-' + Date.now(),
    });
  }
  return false;
}

const getCrossStore = (): CrossStoreShim => {
  const out: CrossStoreShim = {};  try {
    const s = useAuthStore.getState();
    out.currentUser = s.currentUser;
    out.users = s.users;
    out.setUsers = s.setUsers;
    out.setCurrentUser = s.setCurrentUser;
    out.awardPurchasePoints = s.awardPurchasePoints;
  } catch {}
  try {
    const s = useCatalogStore.getState();
    out.products = s.products;
    out.mediaItems = s.mediaItems;
    out.setProducts = s.setProducts;
    out.projects = s.projects;
    out.setProjects = s.setProjects;
  } catch {}
  try {
    const s = useContentStore.getState();
    out.contentProjects = s.contentProjects;
    out.setContentProjects = s.setContentProjects;
  } catch {}
  try {
    const s = useNotificationStore.getState();
    out.pushNotification = s.pushNotification;
    out.pushAuditLog = s.pushAuditLog;
    out.pushSmsLog = s.pushSmsLog;
  } catch {}
  return out;
};

interface OrderState {
  orders: Order[];
  invoices: Invoice[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** بازخوانی اجباری سفارش‌ها (بعد از پرداخت موفق، بدون رفرش کامل صفحه). */
  refresh: () => Promise<void>;
  setOrders: (o: Order[]) => void;
  setInvoices: (i: Invoice[]) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  createServiceOrder: (input: {
    service: Service;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  createProjectOrder: (input: {
    projectService: ProjectService;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  createCatalogOrder: (input: {
    items: { productId?: string; mediaId?: string; name?: string; price?: number; quantity?: number; image?: string }[];
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerNationalId?: string;
    couponCode?: string | null;
  }) => { ok: boolean; error?: string; order?: Order };
  startRealtime: () => void;
  stopRealtime: () => void;
}

const totalDeductedQuantities = (allOrders: Order[]): Record<string, number> => {
  const map: Record<string, number> = {};
  allOrders.forEach(o => {
    if (o.status === 'delivered' && Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const pid = it?.productId;
        if (pid) map[pid] = (map[pid] || 0) + Math.max(0, Number(it.quantity) || 0);
      });
    }
  });
  return map;
};

let orderRealtimeUnsub: (() => void) | null = null;
let orderItemsRealtimeUnsub: (() => void) | null = null;
let orderHistoryRealtimeUnsub: (() => void) | null = null;
let orderVisibilityUnsub: (() => void) | null = null;
let orderRefreshInFlight = false;

const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'ready', 'delivered', 'cancelled'];
const asOrderStatus = (value: string): OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : 'new';

function orderFromRow(r: Record<string, any>): Partial<Order> | null {
  if (!r || !r.id) return null;
  const partial: Partial<Order> = {
    id: r.id,
    trackingCode: r.tracking_code ?? '',
    customerId: r.customer_id ?? '',
    customerName: r.customer_name ?? '',
    type: r.type ?? 'service',
    channel: r.channel ?? 'وب‌سایت',
    status: asOrderStatus(r.status),
    priority: (r.priority as Order['priority']) ?? 'normal',
    total: Number(r.total) || 0,
    paid: Number(r.paid) || 0,
    remaining: Number(r.remaining) || 0,
    createdAt: r.created_at,
    paymentMethod: (r.payment_method as Order['paymentMethod']) ?? undefined,
    gatewayRef: r.gateway_ref ?? undefined,
    formData: r.form_data ?? undefined,
  };
  if (r.employee_id) partial.employeeId = r.employee_id;
  if (r.stock_deducted != null) partial.stockDeducted = r.stock_deducted;
  if (r.receipt_invoice_id) partial.receiptInvoiceId = r.receipt_invoice_id;
  if (r.service_id) partial.serviceId = r.service_id;
  if (r.project_service_id) partial.projectServiceId = r.project_service_id;
  if (r.document_status) partial.documentStatus = r.document_status as Order['documentStatus'];
  if (r.project_id) partial.projectId = r.project_id;
  if (r.content_project_id) partial.contentProjectId = r.content_project_id;
  return partial;
}

const debouncedOrderRefresh = debounce(() => {
  refreshOrdersFromServer();
}, 400);

async function refreshOrdersFromServer() {
  if (orderRefreshInFlight) return;
  orderRefreshInFlight = true;
  try {
    const cloud = await fetchOrders().catch(() => null);
    if (!Array.isArray(cloud) || cloud.length === 0) return;
    const curr = useOrderStore.getState().orders;
    const byId = new Map<string, Order>();
    for (const o of curr) byId.set(o.id, { ...o, items: [...(o.items || [])], statusHistory: o.statusHistory ? [...o.statusHistory] : undefined });
    for (const c of cloud) {
      if (!c || !c.id) continue;
      const existing = byId.get(c.id);
      byId.set(c.id, {
        ...(existing || {}),
        ...c,
        items: c.items || existing?.items || [],
        statusHistory: c.statusHistory || existing?.statusHistory || [],
      });
    }
    useOrderStore.setState({ orders: Array.from(byId.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')) });
  } finally {
    orderRefreshInFlight = false;
  }
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get): OrderState => ({
      orders: [],
      invoices: [],
      hydrated: false,

      hydrate: async () => {
        if (get().hydrated) return;
        try {
          const [cloudOrders, cloudInvoices] = await Promise.all([
            fetchOrders().catch(() => null),
            fetchInvoices().catch(() => null),
          ]);
          const curr = get();

          const mergeOrders = (local: Order[], cloud: Order[] | null): Order[] => {
            if (!Array.isArray(cloud) || cloud.length === 0) return local;
            const byId = new Map<string, Order>();
            for (const lo of local) byId.set(lo.id, { ...lo, items: [...(lo.items || [])], statusHistory: lo.statusHistory ? [...lo.statusHistory] : undefined });
            for (const co of cloud) {
              const c: Order = co;
              if (!c || !c.id) continue;
              const lo = byId.get(c.id);
              if (!lo) {
                byId.set(c.id, { ...c, items: [...(c.items || [])], statusHistory: c.statusHistory ? [...c.statusHistory] : undefined });
                continue;
              }
              const mergedItems: any[] = [];
              const seenLocalIdx = new Set<number>();
              if (Array.isArray(c.items)) {
                for (const ci of c.items) {
                  let found: any = null;
                  for (let i = 0; i < (lo.items || []).length; i++) {
                    const li = (lo.items as any[])[i];
                    const same = (li && ci && li.id && ci.id && li.id === ci.id)
                      || (li && ci && li.productId && ci.productId && li.productId === ci.productId);
                    if (same) { seenLocalIdx.add(i); found = { ...li, ...ci }; break; }
                  }
                  mergedItems.push(found || ci);
                }
              }
              if (Array.isArray(lo.items)) {
                for (let i = 0; i < lo.items.length; i++) {
                  if (!seenLocalIdx.has(i)) mergedItems.push((lo.items as any[])[i]);
                }
              }
              const mergedHistory = [...(c.statusHistory || []), ...(lo.statusHistory || [])]
                .filter((s: any) => s && s.status && s.date)
                .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))
                .filter((s: any, i: number, arr: any[]) => i === 0 || arr[i - 1].status !== s.status || arr[i - 1].date !== s.date);
              byId.set(c.id, {
                ...lo,
                ...c,
                items: mergedItems.length > 0 ? mergedItems : (lo.items || c.items || []),
                status: c.status || lo.status,
                statusHistory: mergedHistory.length > 0 ? mergedHistory : (lo.statusHistory || c.statusHistory || []),
                trackingCode: c.trackingCode || lo.trackingCode,
                paid: typeof c.paid === 'number' ? c.paid : lo.paid,
                stockDeducted: c.stockDeducted ?? lo.stockDeducted,
                receiptInvoiceId: c.receiptInvoiceId || lo.receiptInvoiceId,
                formData: (c as any).formData || (lo as any).formData,
                documents: Array.isArray((c as any).documents) ? (c as any).documents : (lo as any).documents,
                assignedTo: (c as any).assignedTo || (lo as any).assignedTo,
              } as Order);
            }
            return Array.from(byId.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          };

          const mergeInvoices = (local: Invoice[], cloud: Invoice[] | null): Invoice[] => {
            if (!Array.isArray(cloud) || cloud.length === 0) return local;
            const byId = new Map<string, Invoice>();
            for (const li of local) byId.set(li.id, { ...li });
            for (const ci of cloud) {
              if (!ci || !ci.id) continue;
              byId.set(ci.id, { ...(byId.get(ci.id) || {}), ...ci });
            }

            // نسخه‌های محلیِ رسیدهای تحویل که سرور هم همان شماره را دارد حذف
            // می‌شوند؛ وگرنه یک رسید در پنل دو بار دیده می‌شد (یکی با شناسهٔ
            // `inv…` محلی و یکی با شناسهٔ سروری).
            const cloudNumbers = new Set(
              cloud.map(ci => (ci.invoiceNumber || '').trim()).filter(Boolean),
            );
            const deduped = Array.from(byId.values()).filter(inv => {
              const num = (inv.invoiceNumber || '').trim();
              if (!num || !cloudNumbers.has(num)) return true;
              return !String(inv.id).startsWith('inv');
            });

            const seenNumbers = new Set<string>();
            const unique = deduped.filter(inv => {
              const num = (inv.invoiceNumber || '').trim();
              if (!num) return true;
              if (seenNumbers.has(num)) return false;
              seenNumbers.add(num);
              return true;
            });

            return unique.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
          };

          set({
            orders: mergeOrders(curr.orders, cloudOrders),
            invoices: mergeInvoices(curr.invoices, cloudInvoices),
            hydrated: true,
          });
        } catch (e: any) {
          console.warn('[orderStore] hydrate failed, using local data:', e?.message || e);
          set({ hydrated: true });
        }
      },

      setOrders: (o) => set({ orders: o }),

      refresh: async () => {
        // hydrate خودش نتیجه را با دادهٔ محلی merge می‌کند؛ برای اجرای دوباره
        // فقط فلگ را برمی‌گردانیم.
        set({ hydrated: false });
        await get().hydrate();
      },
      setInvoices: (invoices) => {
        const prev = get().invoices;
        set({ invoices });
        if (get().hydrated) {
          syncInvoices(invoices, prev)
            .then(() => syncInvoiceItems(invoices).catch(() => {}))
            .catch(() => {});
        }
      },

      startRealtime: async () => {
        if (orderRealtimeUnsub) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('[orderStore] No auth session for realtime');
          return;
        }

        orderRealtimeUnsub = subscribeTableChanges(
          'orders-changes',
          'orders',
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;
            const st = useOrderStore.getState();

            if (eventType === 'DELETE') {
              if (!oldRow) return;
              const id = String(oldRow.id ?? '');
              if (!id) return;
              useOrderStore.setState({
                orders: st.orders.filter(o => o.id !== id),
              });
              return;
            }

            if (!newRow) return;
            const incoming = orderFromRow(newRow);
            if (!incoming || !incoming.id) return;

            if (newRow.deleted_at) {
              useOrderStore.setState({
                orders: st.orders.filter(o => o.id !== incoming.id),
              });
              return;
            }

            const idx = st.orders.findIndex(o => o.id === incoming.id);
            if (idx === -1) {
              const newOrder: Order = {
                items: [],
                statusHistory: [],
                ...incoming,
              } as Order;
              useOrderStore.setState({
                orders: [newOrder, ...st.orders].sort((a, b) =>
                  (b.createdAt || '').localeCompare(a.createdAt || '')),
              });
            } else {
              const existing = st.orders[idx];
              const merged: Order = {
                ...existing,
                ...incoming,
                items: existing.items || [],
                statusHistory: existing.statusHistory || [],
              } as Order;
              const next = st.orders.slice();
              next[idx] = merged;
              useOrderStore.setState({
                orders: next.sort((a, b) =>
                  (b.createdAt || '').localeCompare(a.createdAt || '')),
              });
            }
          },
        );

        orderItemsRealtimeUnsub = subscribeTableChanges(
          'order-items-changes',
          'order_items',
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;
            const orderId = String((newRow?.order_id) ?? (oldRow?.order_id) ?? '');
            if (!orderId) return;

            useOrderStore.setState(state => {
              const orders = state.orders.map(o => {
                if (o.id !== orderId) return o;
                let items = [...(o.items || [])];

                if (eventType === 'DELETE' && oldRow) {
                  items = items.filter((it: any) =>
                    it.productId !== oldRow.product_id && it.name !== oldRow.name);
                } else if (newRow) {
                  const item: OrderItem = {
                    productId: newRow.product_id ?? undefined,
                    name: newRow.name ?? '',
                    price: Number(newRow.price) || 0,
                    quantity: Number(newRow.quantity) || 0,
                    total: Number(newRow.total) || 0,
                    image: newRow.image ?? undefined,
                  };
                  const itemIdx = items.findIndex((it: any) =>
                    (it.productId && it.productId === item.productId) ||
                    (!it.productId && it.name === item.name));
                  if (itemIdx === -1) {
                    items.push(item);
                  } else {
                    items[itemIdx] = { ...items[itemIdx], ...item };
                  }
                }
                return { ...o, items };
              });
              return { orders };
            });
          },
        );

        orderHistoryRealtimeUnsub = subscribeTableChanges(
          'order-history-changes',
          'order_status_history',
          (payload) => {
            const { eventType, new: newRow } = payload;
            if (eventType !== 'INSERT' || !newRow) return;
            const orderId = String(newRow.order_id ?? '');
            if (!orderId) return;

            const entry = {
              status: asOrderStatus(newRow.status),
              date: newRow.date,
            };

            useOrderStore.setState(state => {
              const orders = state.orders.map(o => {
                if (o.id !== orderId) return o;
                const history = [...(o.statusHistory || [])];
                const exists = history.some(h => h.status === entry.status && h.date === entry.date);
                if (!exists) history.push(entry);
                history.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                return { ...o, statusHistory: history };
              });
              return { orders };
            });
          },
        );

        orderVisibilityUnsub = onTabVisible(() => {
          debouncedOrderRefresh();
        });
      },

      stopRealtime: () => {
        if (orderRealtimeUnsub) {
          orderRealtimeUnsub();
          orderRealtimeUnsub = null;
        }
        if (orderItemsRealtimeUnsub) {
          orderItemsRealtimeUnsub();
          orderItemsRealtimeUnsub = null;
        }
        if (orderHistoryRealtimeUnsub) {
          orderHistoryRealtimeUnsub();
          orderHistoryRealtimeUnsub = null;
        }
        if (orderVisibilityUnsub) {
          orderVisibilityUnsub();
          orderVisibilityUnsub = null;
        }
      },

      updateOrder: (id, patch) => {
        const prevList = get().orders;
        const target = prevList.find((o: Order) => o.id === id);
        if (!target) return;
        const nextList = prevList.map((o: Order) => o.id === id ? { ...o, ...patch } : o);
        set({ orders: nextList });

        const cs = getCrossStore();
        const { setProducts } = cs;
        if (setProducts) {
          const prevMap = totalDeductedQuantities(prevList);
          const nextMap = totalDeductedQuantities(nextList);
          const affected = new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]);
          if (affected.size > 0) {
            const currentProducts = cs.products || [];
            setProducts(currentProducts.map((p: Product) => {
              if (!affected.has(p.id)) return p;
              const delta = (prevMap[p.id] || 0) - (nextMap[p.id] || 0);
              const next = p.stock + delta;
              return next === p.stock ? p : { ...p, stock: Math.max(0, next) };
            }));
          }
        }
      },

      updateOrderStatus: (id, status) => {
        const list = get().orders;
        const order = list.find((o: Order) => o.id === id);
        if (!order || order.status === status) return;

        const prevOrdersSnapshot = list.map((o: Order) => ({ ...o, statusHistory: o.statusHistory ? [...o.statusHistory] : undefined }));
        const prevInvoicesSnapshot = get().invoices.map((i: Invoice) => ({ ...i }));
        const wasDelivered = order.status === 'delivered';
        const isDelivered = status === 'delivered';
        const history = [...(order.statusHistory || [{ status: order.status, date: order.createdAt }]), { status, date: new Date().toISOString() }];
        const nextOrders = list.map((o: Order) => o.id === id ? { ...o, status, statusHistory: history } : o);
        set({ orders: nextOrders });

        const cs = getCrossStore();
        const customer = (cs.users || []).find((u: User) => u.id === order.customerId);
        if (customer?.phone && cs.pushSmsLog) {
          cs.pushSmsLog(customer.phone, `وضعیت سفارش ${order.trackingCode} به «${ORDER_STATUS_LABELS[status as OrderStatus] || status}» تغییر کرد.`);
        }
        if (cs.pushAuditLog) {
          cs.pushAuditLog('تغییر وضعیت سفارش', `سفارش ${order.trackingCode} از «${ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}» به «${ORDER_STATUS_LABELS[status as OrderStatus] || status}» تغییر یافت`, 'سفارشات');
        }

        if (isDelivered && !wasDelivered) {
          // صدور رسید تحویل فقط سمت سرور انجام می‌شود (`change_order_status`
          // با محافظ `receipt_invoice_id is null`). قبلاً کلاینت هم یک رسید
          // محلی می‌ساخت و نتیجه‌اش چند فاکتور/اعلان تکراری برای یک سفارش بود.
          if (cs.awardPurchasePoints) {
            cs.awardPurchasePoints(order.customerId, order.paid || order.total, order.trackingCode);
          }
        }

        const note = cs.currentUser && ((cs.currentUser.role as any) === 'admin' || (cs.currentUser.role as any) === 'staff')
          ? `توسط ${cs.currentUser.name}`
          : undefined;

        (async () => {
          try {
            const result = await changeOrderStatus(id, status, note);
            if (!result.ok) throw new Error(result.error || 'خطا در سرور');

            if (result.newStatus && result.newStatus !== status) {
              const corrected = get().orders.map((o: Order) =>
                o.id === id
                  ? { ...o, status: result.newStatus as OrderStatus, statusHistory: [...(o.statusHistory || []), { status: result.newStatus, date: new Date().toISOString() }] }
                  : o
              );
              set({ orders: corrected });
              if (cs.pushAuditLog) {
                cs.pushAuditLog('اصلاح وضعیت توسط سرور', `سفارش ${order.trackingCode} سرور وضعیت را به «${ORDER_STATUS_LABELS[(result.newStatus as OrderStatus) || status] || result.newStatus}» تصحیح کرد`, 'سفارشات');
              }
            }

            if (result.stockDeducted) {
              useOrderStore.setState(s => ({
                orders: s.orders.map(o => o.id === id ? { ...o, stockDeducted: true } : o),
              }));
            }

            // رسید/فاکتور تحویل را سرور صادر کرده است؛ لیست فاکتورها و
            // receiptInvoiceId را از سرور تازه می‌کنیم تا لینک درست شود.
            if (isDelivered) {
              const freshInvoices = await fetchInvoices().catch(() => null);
              if (Array.isArray(freshInvoices)) {
                useOrderStore.setState({ invoices: freshInvoices });
              }
              try { await get().refresh(); } catch {}
              if (cs.pushNotification) {
                cs.pushNotification({
                  type: 'payment',
                  title: 'رسید تحویل صادر شد',
                  message: `رسید تحویل سفارش ${result.trackingCode || order.trackingCode} صادر شد و در فاکتورها ثبت شد.`,
                  link: '/admin/invoices',
                  priority: 'normal',
                  key: 'rcpt-ok-' + id,
                });
              }
            }
          } catch (e: any) {
            set({ orders: prevOrdersSnapshot, invoices: prevInvoicesSnapshot });
            const msg = e?.message || 'خطا در برقراری ارتباط با سرور';
            if (cs.pushAuditLog) {
              cs.pushAuditLog('خطای تغییر وضعیت سفارش', `سفارش ${order.trackingCode} — ${msg}`, 'سفارشات');
            }
            if (cs.pushNotification) {
              cs.pushNotification({ type: 'system', priority: 'high', title: 'تغییر وضعیت ناموفق', message: `سفارش ${order.trackingCode}: ${msg}. لطفاً دوباره تلاش کنید.`, link: '/admin/orders', key: 'order-status-err-' + id });
            }
          }
        })();
      },

      deleteOrder: (id) => {
        const target = get().orders.find((o: Order) => o.id === id);
        set((state: OrderState) => ({ orders: state.orders.filter((o: Order) => o.id !== id) }));
        const cs = getCrossStore();
        if (target && cs.pushAuditLog) {
          cs.pushAuditLog('حذف سفارش', `سفارش ${target.trackingCode} حذف شد`, 'سفارشات');
        }
        (async () => {
          try {
            const res = await deleteOrderApi(id);
            if (!res.ok) throw new Error(res.error || 'خطا در سرور');
          } catch (e: any) {
            console.warn('[orderStore] deleteOrder sync failed:', e?.message || e);
          }
        })();
      },

      createServiceOrder: ({ service, quantity, urgent, formData, documents, paymentMethod, gatewayRef }) => {
        const cs = getCrossStore();
        const currentUser = cs.currentUser;
        if (!currentUser) return { ok: false, error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' };

        const qty = Math.max(1, Number(quantity) || 1);
        const unitPrice = urgent ? Math.round(service.basePrice * SERVICE_URGENCY_MULTIPLIER) : service.basePrice;
        const total = unitPrice * qty;

        const snapshot = {
          users: (cs.users || []).map((u: User) => ({ ...u })),
          currentUserWallet: currentUser.walletBalance || 0,
          orders: get().orders.map((o: Order) => ({ ...o })),
          invoices: get().invoices.map((i: Invoice) => ({ ...i })),
        };

        let paidAmount = 0;
        if (paymentMethod === 'wallet') {
          const balance = currentUser.walletBalance || 0;
          if (balance < total) return { ok: false, error: 'موجودی کیف پول شما کافی نیست. لطفاً کیف پول را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.' };
          if (cs.setUsers && cs.setCurrentUser) {
            const updatedUsers = (cs.users || []).map(u =>
              u.id === currentUser.id ? { ...u, walletBalance: (u.walletBalance || 0) - total } : u);
            cs.setUsers(updatedUsers);
            cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: (cu.walletBalance || 0) - total } : cu);
          }
          paidAmount = total;
        } else {
          // پرداخت آنلاین تا تأیید درگاه «پرداخت‌نشده» است؛ عدد واقعی را
          // callback درگاه (verify) روی سرور ثبت می‌کند.
          paidAmount = 0;
        }

        const now = new Date();
        const orderId = 'o' + Date.now();
        const trackingCode = 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const order: Order = {
          id: orderId,
          trackingCode,
          customerId: currentUser.id,
          customerName: formData.fullName || currentUser.name || currentUser.phone || currentUser.email || 'مشتری',
          type: 'service',
          channel: 'وب‌سایت',
          status: 'new',
          priority: urgent ? 'urgent' : 'normal',
          items: [{ name: service.name, price: unitPrice, quantity: qty, total, image: '' }],
          total,
          paid: paidAmount,
          remaining: total - paidAmount,
          createdAt: now.toISOString(),
          description: `سفارش آنلاین خدمت «${service.name}» (${qty} ${service.unit})${urgent ? ' – فوری' : ''}`,
          statusHistory: [{ status: 'new' as OrderStatus, date: now.toISOString() }],
          serviceId: service.id,
          formData,
          documents,
          paymentMethod,
          gatewayRef,
          documentStatus: 'pending',
        };
        set((state: OrderState) => ({ orders: [...state.orders, order] }));

        const invoice: Invoice = {
          id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
          invoiceNumber: 'PAY-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + trackingCode.replace(/[^A-Za-z0-9]/g, ''),
          orderId,
          type: 'service',
          date: now.toISOString(),
          customerName: order.customerName,
          customerPhone: formData.phone || currentUser.phone,
          items: [{ name: service.name, quantity: qty, unit: service.unit, price: unitPrice }],
          subtotal: total,
          discount: 0,
          discountType: 'fixed',
          discountAmount: 0,
          tax: 0,
          taxAmount: 0,
          total,
          note: `رسید پرداخت آنلاین سفارش ${trackingCode} – روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینتاپ'}${gatewayRef ? ` (کد پیگیری بانک: ${gatewayRef})` : ''}`,
          status: paymentMethod === 'wallet' ? 'paid' : 'issued',
          createdAt: now.toISOString(),
        };
        set((state: OrderState) => ({
          invoices: [{ ...invoice }, ...state.invoices],
          orders: state.orders.map((o: Order) => o.id === orderId ? { ...o, receiptInvoiceId: invoice.id } : o),
        }));

        if (cs.pushSmsLog) cs.pushSmsLog(currentUser.phone || formData.phone || '', `سفارش «${service.name}» با کد رهگیری ${trackingCode} ثبت شد. مجموع: ${total.toLocaleString('fa-IR')} تومان.`);
        if (cs.pushAuditLog) cs.pushAuditLog('ثبت سفارش آنلاین خدمات', `سفارش ${trackingCode} برای خدمت «${service.name}» به مبلغ ${total.toLocaleString('fa-IR')} تومان از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد${gatewayRef ? ` (رفرنس ${gatewayRef})` : ''}`, 'سفارشات');

        (async () => {
          try {
            const efDocs = (documents || []).map(d => ({
              key: d.storage_path || d.label,
              name: d.label,
              size: 0,
              storage_path: d.storage_path || '',
            }));
            const result = await placeOrder({
              serviceId: service.id,
              quantity: qty,
              urgent,
              formData,
              documents: efDocs,
              paymentMethod,
              useWallet: paymentMethod === 'wallet',
            });
            if (!result.ok) throw new Error(result.error || 'خطا در ثبت سفارش سرور');

            const serverTotal = Number(result.total ?? total);
            const delta = total - serverTotal;
            if (delta !== 0 && paymentMethod === 'wallet' && cs.setUsers && cs.setCurrentUser) {
              const walletFix = (cs.users || []).map(u =>
                u.id === currentUser.id ? { ...u, walletBalance: Math.max(0, (u.walletBalance || 0) + delta) } : u);
              cs.setUsers(walletFix);
              cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: Math.max(0, (cu.walletBalance || 0) + delta) } : cu);
              if (delta > 0 && cs.pushAuditLog) {
                cs.pushAuditLog('بازگشت مبلغ به کیف پول', `سفارش ${result.trackingCode} — اختلاف ${delta.toLocaleString('fa-IR')} تومان سرور کمتر محاسبه شد؛ به کیف پول مشتری برگشت داده شد.`, 'مالی');
              }
            }

            useOrderStore.setState(s => ({
              orders: s.orders.map(o => o.id === orderId
                ? {
                    ...o,
                    id: result.orderId ?? o.id,
                    trackingCode: result.trackingCode ?? o.trackingCode,
                    total: serverTotal,
                    paid: Number(result.paid ?? o.paid),
                    remaining: serverTotal - Number(result.paid ?? o.paid),
                  }
                : o),
              invoices: s.invoices.map(i => i.orderId === orderId
                ? {
                    ...i,
                    id: result.invoiceId ?? i.id,
                    invoiceNumber: (result.invoiceId && i.invoiceNumber) ? i.invoiceNumber.replace(orderId, result.orderId || orderId) : i.invoiceNumber,
                    total: serverTotal,
                  }
                : i),
            }));

            if (cs.pushAuditLog) {
              cs.pushAuditLog('تایید سرور سفارش خدمت', `سفارش ${result.trackingCode} در سرور با موفقیت ثبت شد.`, 'سفارشات');
            }

            // پرداخت آنلاین: کاربر باید به درگاه زرین‌پال برود. تا تأیید درگاه،
            // سفارش «پرداخت‌نشده» می‌ماند و مقدار paid را سرور تعیین می‌کند.
            if (paymentMethod === 'online') {
              await redirectToGateway(result.orderId ?? orderId, cs);
              return;
            }
          } catch (e: any) {
            if (cs.setUsers && cs.setCurrentUser) {
              cs.setUsers(snapshot.users);
              cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: snapshot.currentUserWallet } : cu);
            }
            set({ orders: snapshot.orders, invoices: snapshot.invoices });

            const msg = e?.message || 'خطا در برقراری ارتباط با سرور';
            if (cs.pushAuditLog) {
              cs.pushAuditLog('خطای ثبت سفارش خدمت', `خدمت «${service.name}» — ${msg}`, 'سفارشات');
            }
            if (cs.pushNotification) {
              cs.pushNotification({ type: 'system', priority: 'high', title: 'ثبت سفارش ناموفق', message: `${msg}. لطفاً دوباره تلاش کنید.`, link: '/services', key: 'svc-err-' + Date.now() });
            }
          }
        })();

        return { ok: true, order };
      },

      createProjectOrder: ({ projectService, quantity, urgent, formData, documents, paymentMethod, gatewayRef }) => {
        const cs = getCrossStore();
        const currentUser = cs.currentUser;
        if (!currentUser) return { ok: false, error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' };

        const qty = Math.max(1, Number(quantity) || 1);
        const unitPrice = urgent ? Math.round(projectService.basePrice * SERVICE_URGENCY_MULTIPLIER) : projectService.basePrice;
        const total = unitPrice * qty;

        const snapshot = {
          users: (cs.users || []).map((u: User) => ({ ...u })),
          currentUserWallet: currentUser.walletBalance || 0,
          orders: get().orders.map((o: Order) => ({ ...o })),
          invoices: get().invoices.map((i: Invoice) => ({ ...i })),
          projects: (cs.projects || []).map((p: Project) => ({ ...p })),
          contentProjects: (cs.contentProjects || []).map((cp: ContentProject) => ({ ...cp })),
        };

        let paidAmount = 0;
        if (paymentMethod === 'wallet') {
          const balance = currentUser.walletBalance || 0;
          if (balance < total) return { ok: false, error: 'موجودی کیف پول شما کافی نیست. لطفاً کیف پول را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.' };
          if (cs.setUsers && cs.setCurrentUser) {
            const updatedUsers = (cs.users || []).map(u =>
              u.id === currentUser.id ? { ...u, walletBalance: (u.walletBalance || 0) - total } : u);
            cs.setUsers(updatedUsers);
            cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: (cu.walletBalance || 0) - total } : cu);
          }
          paidAmount = total;
        } else {
          // پرداخت آنلاین تا تأیید درگاه «پرداخت‌نشده» است؛ عدد واقعی را
          // callback درگاه (verify) روی سرور ثبت می‌کند.
          paidAmount = 0;
        }

        const now = new Date();
        const orderId = 'o' + Date.now();
        const trackingCode = 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const groupLabel = projectService.group === 'webdesign' ? 'طراحی سایت' : 'تولید محتوا';
        const order: Order = {
          id: orderId,
          trackingCode,
          customerId: currentUser.id,
          customerName: formData.fullName || currentUser.name || currentUser.phone || currentUser.email || 'مشتری',
          type: projectService.group === 'webdesign' ? 'webdesign' : 'service',
          channel: 'وب‌سایت',
          status: 'new',
          priority: urgent ? 'urgent' : 'normal',
          items: [{ name: projectService.title, price: unitPrice, quantity: qty, total, image: '' }],
          total,
          paid: paidAmount,
          remaining: total - paidAmount,
          createdAt: now.toISOString(),
          description: `سفارش آنلاین «${projectService.title}» (${groupLabel}) – ${qty} ${projectService.unit}${urgent ? ' – فوری' : ''}`,
          statusHistory: [{ status: 'new' as OrderStatus, date: now.toISOString() }],
          projectServiceId: projectService.id,
          formData,
          documents,
          paymentMethod,
          gatewayRef,
          documentStatus: 'pending',
        };

        // NOTE: content_project را دیگر در کلاینت نمی‌سازیم چون سیاست RLS
        // فقط پرسنل اجازه نوشتن در content_projects را دارند. تابع سرور
        // place_catalog_order (SECURITY DEFINER) آن را می‌سازد و شناسه‌اش را
        // برمی‌گرداند تا از خطای RLS جلوگیری شود و داده در دیتابیس ابری باقی بماند.

        set((state: OrderState) => ({ orders: [...state.orders, order] }));
        // NOTE: Project is NOT created here for webdesign or content orders.
        // Customer cannot write to projects table (RLS requires perm12).
        // Admin creates the project from /admin/orders after reviewing.

        const invoice: Invoice = {
          id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
          invoiceNumber: 'PAY-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + trackingCode.replace(/[^A-Za-z0-9]/g, ''),
          orderId,
          type: projectService.group === 'webdesign' ? 'webdesign' : 'service',
          date: now.toISOString(),
          customerName: order.customerName,
          customerPhone: formData.phone || currentUser.phone,
          items: [{ name: projectService.title, quantity: qty, unit: projectService.unit, price: unitPrice }],
          subtotal: total,
          discount: 0,
          discountType: 'fixed',
          discountAmount: 0,
          tax: 0,
          taxAmount: 0,
          total,
          note: `رسید پرداخت آنلاین سفارش ${trackingCode} (${groupLabel}) – روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینتاپ'}${gatewayRef ? ` (کد پیگیری بانک: ${gatewayRef})` : ''}`,
          status: paymentMethod === 'wallet' ? 'paid' : 'issued',
          createdAt: now.toISOString(),
        };
        set((state: OrderState) => ({
          invoices: [{ ...invoice }, ...state.invoices],
          orders: state.orders.map((o: Order) => o.id === orderId ? { ...o, receiptInvoiceId: invoice.id } : o),
        }));

        if (cs.pushSmsLog) cs.pushSmsLog(currentUser.phone || formData.phone || '', `سفارش «${projectService.title}» (${groupLabel}) با کد رهگیری ${trackingCode} ثبت شد. مجموع: ${total.toLocaleString('fa-IR')} تومان. پروژه مربوطه در پنل مدیریت ایجاد شد.`);
        if (cs.pushAuditLog) cs.pushAuditLog('ثبت سفارش آنلاین پروژه', `سفارش ${trackingCode} برای «${projectService.title}» (${groupLabel}) به مبلغ ${total.toLocaleString('fa-IR')} تومان از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد${gatewayRef ? ` (رفرنس ${gatewayRef})` : ''} و پروژه مرتبط آن در بخش پروژه‌ها ایجاد گردید${projectService.group === 'content' ? '؛ همچنین تسک تولید محتوای آن در بخش «تیم تولید محتوا» ایجاد شد' : ''}`, 'سفارشات');

        (async () => {
          try {
            const rpcDocs = documents.length > 0 ? documents.map(d => ({ label: d.label, storage_path: d.storage_path || '' })) : undefined;
            const result = await placeCatalogOrder({
              kind: 'project',
              items: [{ ref: projectService.id, quantity: qty }],
              paymentMethod,
              gatewayRef: gatewayRef ?? null,
              couponCode: null,
              urgent,
              formData,
              documents: rpcDocs,
            });
            if (!result.ok) throw new Error(result.error || 'خطا در ثبت سفارش سرور');

            const serverTotal = Number(result.total ?? total);
            const delta = total - serverTotal;
            if (delta !== 0 && paymentMethod === 'wallet' && cs.setUsers && cs.setCurrentUser) {
              const walletFix = (cs.users || []).map(u =>
                u.id === currentUser.id ? { ...u, walletBalance: Math.max(0, (u.walletBalance || 0) + delta) } : u);
              cs.setUsers(walletFix);
              cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: Math.max(0, (cu.walletBalance || 0) + delta) } : cu);
              if (delta > 0 && cs.pushAuditLog) {
                cs.pushAuditLog('بازگشت مبلغ به کیف پول', `سفارش ${result.trackingCode} — اختلاف ${delta.toLocaleString('fa-IR')} تومان سرور کمتر محاسبه شد؛ به کیف پول مشتری برگشت داده شد.`, 'مالی');
              }
            }

            const serverOrderId = result.orderId ?? orderId;
            const serverTracking = result.trackingCode ?? trackingCode;
            const serverContentProjectSku = result.contentProjectSku;

            useOrderStore.setState(s => ({
              orders: s.orders.map(o => o.id === orderId
                ? {
                    ...o,
                    id: serverOrderId,
                    trackingCode: serverTracking,
                    total: serverTotal,
                    paid: Number(result.paid ?? o.paid),
                    remaining: serverTotal - Number(result.paid ?? o.paid),
                    contentProjectId: serverContentProjectSku || o.contentProjectId,
                    // projectId: not set locally - admin creates project from /admin/orders
                  }
                : o),
              invoices: s.invoices.map(i => i.orderId === orderId
                ? {
                    ...i,
                    id: result.invoiceId ?? i.id,
                    orderId: serverOrderId,
                    invoiceNumber: (result.invoiceId && i.invoiceNumber) ? i.invoiceNumber.replace(orderId, result.orderId || orderId) : i.invoiceNumber,
                    total: serverTotal,
                  }
                : i),
            }));

            if (cs.pushAuditLog) {
              cs.pushAuditLog('تایید سرور سفارش پروژه', `سفارش ${result.trackingCode} در سرور با موفقیت ثبت شد.`, 'سفارشات');
            }

            if (paymentMethod === 'online') {
              await redirectToGateway(result.orderId ?? orderId, cs);
              return;
            }
          } catch (e: any) {
            if (cs.setUsers && cs.setCurrentUser) {
              cs.setUsers(snapshot.users);
              cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: snapshot.currentUserWallet } : cu);
            }
            if (cs.setProjects) cs.setProjects(snapshot.projects);
            if (cs.setContentProjects) cs.setContentProjects(snapshot.contentProjects);
            set({ orders: snapshot.orders, invoices: snapshot.invoices });

            const msg = e?.message || 'خطا در برقراری ارتباط با سرور';
            if (cs.pushAuditLog) {
              cs.pushAuditLog('خطای ثبت سفارش پروژه', `پروژه «${projectService.title}» — ${msg}`, 'سفارشات');
            }
            if (cs.pushNotification) {
              cs.pushNotification({ type: 'system', priority: 'high', title: 'ثبت سفارش ناموفق', message: `${msg}. لطفاً دوباره تلاش کنید.`, link: '/store/projects', key: 'proj-err-' + Date.now() });
            }
          }
        })();

        return { ok: true, order };
      },

      createCatalogOrder: ({ items, paymentMethod, gatewayRef, customerName: cn, customerPhone: cp, customerAddress, customerNationalId, couponCode }) => {
        const cs = getCrossStore();
        const currentUser = cs.currentUser;
        if (!currentUser) return { ok: false, error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' };

        const products = cs.products || [];
        const mediaItems = cs.mediaItems || [];
        const customerName = cn || currentUser.name || currentUser.phone || currentUser.email || 'مشتری';
        const customerPhone = cp || currentUser.phone;

        const orderItems: OrderItem[] = items.map(it => {
          let name = it.name || '';
          let price = it.price || 0;
          let image = it.image || '';
          if (it.productId) {
            const p = products.find(pp => pp.id === it.productId);
            if (p) {
              name = p.name;
              price = p.price;
              image = p.image;
            }
          } else if (it.mediaId) {
            const m = mediaItems.find(mm => mm.id === it.mediaId);
            if (m) {
              name = m.title;
              image = m.image;
            }
          }
          const qty = Math.max(1, Number(it.quantity) || 1);
          return {
            productId: it.productId,
            name,
            price,
            quantity: qty,
            total: price * qty,
            image,
          };
        });

        const hasProduct = orderItems.some(i => i.productId);
        const hasMedia = orderItems.some(i => !i.productId);
        const orderType: Order['type'] = hasProduct && !hasMedia ? 'product' : !hasProduct && hasMedia ? 'media' : 'product';

        const total = orderItems.reduce((s, i) => s + (i.total || 0), 0);

        const snapshot = {
          users: (cs.users || []).map((u: User) => ({ ...u })),
          currentUserWallet: currentUser.walletBalance || 0,
          orders: get().orders.map((o: Order) => ({ ...o })),
          invoices: get().invoices.map((i: Invoice) => ({ ...i })),
        };

        let paidAmount = 0;
        if (paymentMethod === 'wallet') {
          const balance = currentUser.walletBalance || 0;
          if (balance < total) return { ok: false, error: 'موجودی کیف پول شما کافی نیست. لطفاً کیف پول را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.' };
          if (cs.setUsers && cs.setCurrentUser) {
            const updatedUsers = (cs.users || []).map(u =>
              u.id === currentUser.id ? { ...u, walletBalance: (u.walletBalance || 0) - total } : u);
            cs.setUsers(updatedUsers);
            cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: (cu.walletBalance || 0) - total } : cu);
          }
          paidAmount = total;
        } else {
          // پرداخت آنلاین تا تأیید درگاه «پرداخت‌نشده» است؛ عدد واقعی را
          // callback درگاه (verify) روی سرور ثبت می‌کند.
          paidAmount = 0;
        }

        const now = new Date();
        const orderId = 'o' + Date.now();
        const trackingCode = 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const order: Order = {
          id: orderId,
          trackingCode,
          customerId: currentUser.id,
          customerName,
          type: orderType,
          channel: 'وب‌سایت',
          status: 'new',
          priority: 'normal',
          items: orderItems,
          total,
          paid: paidAmount,
          remaining: total - paidAmount,
          createdAt: now.toISOString(),
          description: customerAddress ? `سفارش فروشگاه – آدرس تحویل: ${customerAddress}` : 'سفارش فروشگاه',
          statusHistory: [{ status: 'new' as OrderStatus, date: now.toISOString() }],
          paymentMethod,
          gatewayRef,
        };
        set((state: OrderState) => ({ orders: [...state.orders, order] }));

        const invoice: Invoice = {
          id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
          invoiceNumber: 'PAY-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + trackingCode.replace(/[^A-Za-z0-9]/g, ''),
          orderId,
          type: orderType === 'product' ? 'product' : orderType === 'media' ? 'media' : 'combined',
          date: now.toISOString(),
          customerName,
          customerPhone,
          customerAddress,
          customerNationalId,
          items: orderItems.map((i: OrderItem) => ({ name: i.name || 'محصول', quantity: i.quantity || 1, unit: 'عدد', price: i.price || 0 })),
          subtotal: total,
          discount: 0,
          discountType: 'fixed',
          discountAmount: 0,
          tax: 0,
          taxAmount: 0,
          total,
          note: `رسید پرداخت آنلاین سفارش ${trackingCode} (فروشگاه) – روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینتاپ'}${gatewayRef ? ` (کد پیگیری بانک: ${gatewayRef})` : ''}`,
          status: paymentMethod === 'wallet' ? 'paid' : 'issued',
          createdAt: now.toISOString(),
        };
        set((state: OrderState) => ({
          invoices: [{ ...invoice }, ...state.invoices],
          orders: state.orders.map((o: Order) => o.id === orderId ? { ...o, receiptInvoiceId: invoice.id } : o),
        }));

        if (cs.pushSmsLog) cs.pushSmsLog(customerPhone || '', `سفارش فروشگاه با کد رهگیری ${trackingCode} ثبت شد. مجموع: ${total.toLocaleString('fa-IR')} تومان.`);
        if (cs.pushAuditLog) cs.pushAuditLog('ثبت سفارش فروشگاه', `سفارش ${trackingCode} به مبلغ ${total.toLocaleString('fa-IR')} تومان از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد${gatewayRef ? ` (رفرنس ${gatewayRef})` : ''}`, 'سفارشات');

        const rpcItems = orderItems
          .filter(i => i.productId || (i as any).mediaId)
          .map(i => ({
            ref: i.productId ? i.productId : `media-${(i as any).mediaId}`,
            quantity: i.quantity || 1,
          }));

        // Determine RPC kind based on order type
        // If all items are media, use 'media', otherwise 'product' (products take precedence)
        const rpcKind: 'product' | 'media' | 'project' = hasMedia && !hasProduct ? 'media' : 'product';

        if (rpcItems.length > 0) {
          (async () => {
            try {
              const result = await placeCatalogOrder({
                kind: rpcKind,
                items: rpcItems,
                paymentMethod,
                gatewayRef: gatewayRef ?? null,
                couponCode: couponCode ?? null,
                urgent: false,
              });
              if (!result.ok) throw new Error(result.error || 'خطا در ثبت سفارش سرور');

              const serverTotal = Number(result.total ?? total);
              const delta = total - serverTotal;
              if (delta !== 0 && paymentMethod === 'wallet' && cs.setUsers && cs.setCurrentUser) {
                const walletFix = (cs.users || []).map(u =>
                  u.id === currentUser.id ? { ...u, walletBalance: Math.max(0, (u.walletBalance || 0) + delta) } : u);
                cs.setUsers(walletFix);
                cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: Math.max(0, (cu.walletBalance || 0) + delta) } : cu);
                if (delta > 0 && cs.pushAuditLog) {
                  cs.pushAuditLog('بازگشت مبلغ به کیف پول', `سفارش ${result.trackingCode} — اختلاف ${delta.toLocaleString('fa-IR')} تومان سرور کمتر محاسبه شد؛ به کیف پول مشتری برگشت داده شد.`, 'مالی');
                }
              }

              useOrderStore.setState(s => ({
                orders: s.orders.map(o => o.id === orderId
                  ? {
                      ...o,
                      id: result.orderId ?? o.id,
                      trackingCode: result.trackingCode ?? o.trackingCode,
                      total: serverTotal,
                      paid: Number(result.paid ?? o.paid),
                      remaining: serverTotal - Number(result.paid ?? o.paid),
                    }
                  : o),
                invoices: s.invoices.map(i => i.orderId === orderId
                  ? {
                      ...i,
                      id: result.invoiceId ?? i.id,
                      invoiceNumber: (result.invoiceId && i.invoiceNumber) ? i.invoiceNumber.replace(orderId, result.orderId || orderId) : i.invoiceNumber,
                      total: serverTotal,
                    }
                  : i),
              }));

              if (cs.pushAuditLog) {
                cs.pushAuditLog('تایید سرور سفارش فروشگاه', `سفارش ${result.trackingCode} در سرور با موفقیت ثبت شد.`, 'سفارشات');
              }

              if (paymentMethod === 'online') {
                await redirectToGateway(result.orderId ?? orderId, cs);
                return;
              }
            } catch (e: any) {
              if (cs.setUsers && cs.setCurrentUser) {
                cs.setUsers(snapshot.users);
                cs.setCurrentUser(cu => cu ? { ...cu, walletBalance: snapshot.currentUserWallet } : cu);
              }
              set({ orders: snapshot.orders, invoices: snapshot.invoices });

              const msg = e?.message || 'خطا در برقراری ارتباط با سرور';
              if (cs.pushAuditLog) {
                cs.pushAuditLog('خطای ثبت سفارش فروشگاه', `مبلغ ${total.toLocaleString('fa-IR')} تومان — ${msg}`, 'سفارشات');
              }
              if (cs.pushNotification) {
                cs.pushNotification({ type: 'system', priority: 'high', title: 'ثبت سفارش ناموفق', message: `${msg}. لطفاً دوباره تلاش کنید.`, link: '/cart', key: 'cart-err-' + Date.now() });
              }
            }
          })();
        }

        return { ok: true, order };
      },
    }),
    {
      name: 'hamyar_orders_combined',
      partialize: (state: any) => ({ orders: state.orders, invoices: state.invoices }) as any,
      merge: (persistedState: any, currentState: any) => {
        const state = { ...currentState, ...(persistedState || {}) };
        try {
          const rawOrders = localStorage.getItem('hamyar_orders');
          if (rawOrders && (!state.orders || state.orders.length === 0)) {
            state.orders = JSON.parse(rawOrders);
          }
        } catch {}
        try {
          const rawInvoices = localStorage.getItem('hamyar_invoices');
          if (rawInvoices && (!state.invoices || state.invoices.length === 0)) {
            state.invoices = JSON.parse(rawInvoices);
          }
        } catch {}
        return state;
      },
      onRehydrateStorage: () => (state: any) => {
        if (!state) return;
        const cs = getCrossStore();
        if (!cs.setProducts) return;

        const { setProducts } = cs;
        const currentProducts = cs.products || [];
        const deductMap = totalDeductedQuantities(state.orders);
        const next = currentProducts.map(p => {
          if (!deductMap[p.id]) return p;
          const next = Math.max(0, p.stock - deductMap[p.id]);
          return next === p.stock ? p : { ...p, stock: next };
        });
        if (next.some((p, i) => p !== currentProducts[i])) setProducts(next);

        state.orders.forEach((o: any) => {
          const becameDelivered = o.status === 'delivered' && !o.stockDeducted;
          if (becameDelivered) {
            useOrderStore.setState((s: any) => ({
              orders: s.orders.map((x: any) => x.id === o.id ? { ...x, stockDeducted: true } : x),
            }));
          }
          // رسید تحویل فقط در سرور صادر می‌شود؛ اینجا فاکتور محلی نمی‌سازیم.
        });
      },
    },
  ),
);

const applyProductStockAtDelivery = (order: Order, delivered: boolean) => {
  if (order.type !== 'product') return;
  const lines = (order.items || []).filter((it: any) => it?.productId);
  if (lines.length === 0) return;
  const cs = getCrossStore();
  if (!cs.setProducts) return;
  cs.setProducts((cs.products || []).map(p => {
    const line = lines.find((it: any) => it.productId === p.id);
    if (!line) return p;
    const qty = Math.max(0, Number(line.quantity) || 0);
    const next = delivered ? Math.max(0, p.stock - qty) : p.stock + qty;
    return next === p.stock ? p : { ...p, stock: next };
  }));
};

let _prevOrders: Order[] | null = null;
useOrderStore.subscribe((state: OrderState) => {
  const prev = _prevOrders;
  _prevOrders = state.orders;
  if (!prev) return;

  const cs = getCrossStore();

  state.orders.forEach((o: Order) => {
    const old = prev.find((p: Order) => p.id === o.id);
    const becameDelivered = o.status === 'delivered' && (!old || old.status !== 'delivered');
    const stoppedBeingDelivered = old?.status === 'delivered' && o.status !== 'delivered';

    if (becameDelivered && !o.stockDeducted) {
      applyProductStockAtDelivery(o, true);
      useOrderStore.setState((s: OrderState) => ({
        orders: s.orders.map((x: Order) => x.id === o.id ? { ...x, stockDeducted: true } : x),
      }));
      if (cs.pushAuditLog) cs.pushAuditLog('کسر موجودی انبار', `با تحویل سفارش ${o.trackingCode}، موجودی محصولات فروخته‌شده از انبار کسر شد`, 'محصولات');
    }
    if (stoppedBeingDelivered && o.stockDeducted) {
      applyProductStockAtDelivery(o, false);
      useOrderStore.setState((s: OrderState) => ({
        orders: s.orders.map((x: Order) => x.id === o.id ? { ...x, stockDeducted: false } : x),
      }));
      if (cs.pushAuditLog) cs.pushAuditLog('بازگشت موجودی انبار', `وضعیت سفارش ${o.trackingCode} از «تحویل شد» خارج شد و موجودی به انبار بازگشت`, 'محصولات');
    }
    // رسید تحویل فقط سمت سرور صادر می‌شود؛ ساخت رسید محلی حذف شده است.
  });

  if (cs.setProjects) {
    const changed = state.orders.filter((o: Order) => {
      const old = prev.find((p: Order) => p.id === o.id);
      return old && old.status !== o.status;
    });
    const linked = changed.filter((o: Order) => o.projectId);
    if (linked.length > 0) {
      const nextStage: Record<OrderStatus, string> = {
        new: 'قرارداد', processing: 'طراحی', ready: 'تایید', delivered: 'تحویل', cancelled: 'قرارداد',
      };
      const nextProgress: Record<OrderStatus, number> = {
        new: 15, processing: 50, ready: 85, delivered: 100, cancelled: 15,
      };
      cs.setProjects((cs.projects || []).map(p => {
        const o = linked.find(x => x.projectId === p.id);
        if (!o) return p;
        if (o.status === 'cancelled') return { ...p, stage: 'مشاوره', progress: 0 };
        return {
          ...p,
          stage: nextStage[o.status],
          progress: Math.max(p.progress, nextProgress[o.status]),
          paidAmount: o.paid,
          totalCost: o.total,
        };
      }));
    }

    const changedProjects = (cs.projects || []).filter(() => false);
  }

  if (cs.setContentProjects) {
    const changed = state.orders.filter(o => {
      const old = prev.find(p => p.id === o.id);
      return old && (old.status !== o.status || old.documentStatus !== o.documentStatus);
    });
    const linked = changed.filter(o => o.contentProjectId);
    if (linked.length > 0) {
      const nextStatus: Record<OrderStatus, ContentProject['status']> = {
        new: 'planning', processing: 'in-progress', ready: 'review', delivered: 'published', cancelled: 'completed',
      };
      cs.setContentProjects((cs.contentProjects || []).map(cp => {
        const o = linked.find(x => x.contentProjectId === cp.id);
        if (!o) return cp;
        if (o.status === 'cancelled') {
          return { ...cp, status: 'completed' as const, notes: `${cp.notes}\n⛔ سفارش مرجع ${o.trackingCode} لغو شد.` };
        }
        const oldO = prev.find(p => p.id === o.id);
        const docsNote = o.documentStatus === 'rejected' && oldO?.documentStatus !== 'rejected'
          ? `\n⚠️ مدارک سفارش ${o.trackingCode} توسط مدیر رد شد؛ مشتری باید مدارک را دوباره بارگذاری کند.`
          : o.documentStatus === 'approved' && oldO?.documentStatus !== 'approved'
            ? `\n✅ مدارک سفارش ${o.trackingCode} تأیید شد؛ تولید را آغاز کنید.`
            : '';
        return {
          ...cp,
          status: nextStatus[o.status],
          budget: o.total,
          deadline: o.formData?.deadline || cp.deadline,
          notes: cp.notes + docsNote,
        };
      }));
    }

    const oldCPs: ContentProject[] = [];
    const published = (cs.contentProjects || []).filter(cp => {
      const old = oldCPs.find(p => p.id === cp.id);
      return old && old.status !== 'published' && cp.status === 'published' && cp.sourceOrderId;
    });
    published.forEach(cp => {
      const o = useOrderStore.getState().orders.find(x => x.id === cp.sourceOrderId);
      if (o && o.status !== 'delivered') useOrderStore.getState().updateOrderStatus(o.id, 'delivered');
    });
  }
});
