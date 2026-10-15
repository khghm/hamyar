import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
} from '../domains/types';
import {
  fetchTickets,
  createTicketInDb,
  updateTicketInDb,
  addTicketMessageInDb,
} from '../api/tickets';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { subscribeTableChanges, onTabVisible, debounce } from '../lib/realtime';

interface CrossStoreShim {
  currentUser?: User | null;
  users?: User[];
}

const getCrossStore = (): CrossStoreShim => {
  const out: CrossStoreShim = {};
  try {
    const s = useAuthStore.getState();
    out.currentUser = s.currentUser;
    out.users = s.users;
  } catch {}
  return out;
};

interface TicketState {
  tickets: SupportTicket[];
  setTickets: (t: SupportTicket[]) => void;
  create: (input: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    orderId?: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
  }) => { ok: boolean; error?: string; ticket?: SupportTicket };
  createTicket: (input: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    orderId?: string;
  }) => { ok: boolean; error?: string; ticket?: SupportTicket };
  update: (id: string, patch: Partial<SupportTicket>) => void;
  updateTicket: (id: string, patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>) => void;
  remove: (id: string) => void;
  customerReply: (
    ticketId: string,
    text: string,
    user: { id: string; name: string; phone?: string },
    allUsers?: { id: string; phone?: string; role?: string }[]
  ) => void;
  replyTicket: (ticketId: string, text: string) => void;
  adminReply: (ticketId: string, text: string, author?: string) => void;
  adminReplyTicket: (ticketId: string, text: string) => void;
  reopen: (
    ticketId: string,
    text: string,
    user: { id: string; name: string; phone?: string },
    allUsers?: { id: string; phone?: string; role?: string }[]
  ) => void;
  reopenTicket: (ticketId: string, text: string) => void;
  close: (ticketId: string) => void;
  rate: (
    ticketId: string,
    rating: number,
    user: { id: string; phone?: string },
    allUsers?: { id: string; phone?: string; role?: string }[]
  ) => void;
  rateTicket: (ticketId: string, rating: number) => void;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startRealtime: () => void;
  stopRealtime: () => void;
}

function newTicketCode(existing: SupportTicket[]): string {
  const n = existing.length + 1;
  return 'TCK-' + String(1000 + n) + Math.floor(Math.random() * 90 + 10);
}

function isTicketOwnerSimple(
  t: Pick<SupportTicket, 'customerId' | 'customerPhone'>,
  user: { id: string; phone?: string },
  allUsers?: { id: string; phone?: string; role?: string }[]
): boolean {
  if (t.customerId === user.id) return true;
  if (user.phone && t.customerPhone && t.customerPhone === user.phone) return true;
  if (allUsers) {
    const ids = new Set<string>([user.id]);
    if (user.phone) {
      for (const u of allUsers) {
        if ((u.role === undefined || u.role === 'customer') && u.phone === user.phone) {
          ids.add(u.id);
        }
      }
    }
    return ids.has(t.customerId);
  }
  return false;
}

let ticketRealtimeUnsub: (() => void) | null = null;
let ticketMessagesRealtimeUnsub: (() => void) | null = null;
let ticketVisibilityUnsub: (() => void) | null = null;
let ticketRefreshInFlight = false;

const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const TICKET_PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
const TICKET_CATEGORIES: TicketCategory[] = ['general', 'technical', 'billing', 'order', 'complaint', 'other'];

const asTicketStatus = (value: string): TicketStatus =>
  TICKET_STATUSES.includes(value as TicketStatus) ? (value as TicketStatus) : 'open';
const asTicketPriority = (value: string): TicketPriority =>
  TICKET_PRIORITIES.includes(value as TicketPriority) ? (value as TicketPriority) : 'normal';
const asTicketCategory = (value: string): TicketCategory =>
  TICKET_CATEGORIES.includes(value as TicketCategory) ? (value as TicketCategory) : 'general';

function ticketFromRow(r: Record<string, any>): SupportTicket | null {
  if (!r || !r.id) return null;
  return {
    id: r.id,
    code: r.sku ?? '',
    customerId: r.customer_id ?? '',
    customerName: r.customer_name ?? '',
    customerPhone: r.customer_phone ?? '',
    subject: r.title ?? '',
    description: r.description ?? '',
    category: asTicketCategory(r.category ?? 'general'),
    priority: asTicketPriority(r.priority ?? 'normal'),
    status: asTicketStatus(r.status ?? 'open'),
    orderId: r.order_id ?? undefined,
    messages: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? r.created_at,
    rating: r.rating ?? undefined,
    ratedAt: r.rated_at ?? undefined,
    closedAt: r.closed_at ?? undefined,
  };
}

const debouncedTicketRefresh = debounce(() => {
  refreshTicketsFromServer();
}, 400);

async function refreshTicketsFromServer() {
  if (ticketRefreshInFlight) return;
  ticketRefreshInFlight = true;
  try {
    const cloud = await fetchTickets().catch(() => null);
    if (!Array.isArray(cloud) || cloud.length === 0) return;
    const curr = useTicketStore.getState().tickets;
    const byId = new Map<string, SupportTicket>();
    for (const t of curr) byId.set(t.id, { ...t, messages: [...(t.messages || [])] });
    for (const c of cloud) {
      if (!c || !c.id) continue;
      const existing = byId.get(c.id);
      byId.set(c.id, {
        ...(existing || {}),
        ...c,
        messages: c.messages || existing?.messages || [],
      });
    }
    useTicketStore.setState({ tickets: Array.from(byId.values()).sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')) });
  } finally {
    ticketRefreshInFlight = false;
  }
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],

      hydrated: false,

      hydrate: async () => {
        try {
          const cloud = await fetchTickets();
          const curr = get().tickets;

          if (!Array.isArray(cloud) || cloud.length === 0) {
            set({ hydrated: true });
            return;
          }

          const byId = new Map<string, SupportTicket>();
          for (const t of curr) byId.set(t.id, { ...t, messages: [...(t.messages || [])] });

          for (const c of cloud) {
            const cloudT: SupportTicket = typeof c === 'object' && c ? { ...(c as any) } as SupportTicket : c as SupportTicket;
            if (!cloudT || !cloudT.id) continue;

            const local = byId.get(cloudT.id);
            if (!local) {
              byId.set(cloudT.id, { ...cloudT, messages: [...(cloudT.messages || [])] });
              continue;
            }

            const msgIds = new Set<string>();
            const mergedMsgs: SupportTicket['messages'] = [];
            for (const m of [...(cloudT.messages || []), ...(local.messages || [])]) {
              if (m && m.id && !msgIds.has(m.id)) {
                msgIds.add(m.id);
                mergedMsgs.push(m);
              } else if (m && !m.id) {
                mergedMsgs.push(m);
              }
            }
            mergedMsgs.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

            const merged: SupportTicket = {
              ...local,
              ...cloudT,
              messages: mergedMsgs.length > 0 ? mergedMsgs : (local.messages || cloudT.messages || []),
              assignedTo: cloudT.assignedTo || local.assignedTo,
              priority: cloudT.priority || local.priority,
              category: cloudT.category || local.category,
              status: cloudT.status || local.status,
              rating: cloudT.rating ?? local.rating,
              ratedAt: cloudT.ratedAt || local.ratedAt,
              closedAt: cloudT.closedAt || local.closedAt,
              updatedAt: cloudT.updatedAt && local.updatedAt
                ? (cloudT.updatedAt > local.updatedAt ? cloudT.updatedAt : local.updatedAt)
                : (cloudT.updatedAt || local.updatedAt || cloudT.createdAt || local.createdAt || new Date().toISOString()),
            };
            byId.set(merged.id, merged);
          }

          const mergedList = Array.from(byId.values()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
          set({ tickets: mergedList, hydrated: true });
        } catch (e: any) {
          console.warn('[ticketStore] hydrate failed:', e?.message || e);
          set({ hydrated: true });
        }
      },

      setTickets: (tickets) => set({ tickets }),

      startRealtime: async () => {
        if (ticketRealtimeUnsub) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('[ticketStore] No auth session for realtime');
          return;
        }

        ticketRealtimeUnsub = subscribeTableChanges(
          'tickets-changes',
          'tickets',
          (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;
            const st = useTicketStore.getState();

            if (eventType === 'DELETE') {
              if (!oldRow) return;
              const id = String(oldRow.id ?? '');
              if (!id) return;
              useTicketStore.setState({
                tickets: st.tickets.filter(t => t.id !== id),
              });
              return;
            }

            if (!newRow) return;
            const incoming = ticketFromRow(newRow);
            if (!incoming) return;

            const idx = st.tickets.findIndex(t => t.id === incoming.id);
            if (idx === -1) {
              useTicketStore.setState({
                tickets: [incoming, ...st.tickets].sort((a, b) =>
                  (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')),
              });
            } else {
              const existing = st.tickets[idx];
              const merged: SupportTicket = {
                ...existing,
                ...incoming,
                messages: existing.messages || incoming.messages || [],
              };
              const next = st.tickets.slice();
              next[idx] = merged;
              useTicketStore.setState({
                tickets: next.sort((a, b) =>
                  (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')),
              });
            }
          },
        );

        ticketMessagesRealtimeUnsub = subscribeTableChanges(
          'ticket-messages-changes',
          'ticket_messages',
          (payload) => {
            const { eventType, new: newRow } = payload;
            if (eventType !== 'INSERT' || !newRow) return;

            const ticketId = String(newRow.ticket_id ?? '');
            if (!ticketId) return;

            const message = {
              id: newRow.id,
              sender: newRow.sender === 'support' ? ('support' as const) : ('customer' as const),
              author: newRow.author ?? '',
              text: newRow.text ?? '',
              createdAt: newRow.created_at,
            };

            useTicketStore.setState(state => {
              const tickets = state.tickets.map(t => {
                if (t.id !== ticketId) return t;
                const alreadyHas = (t.messages || []).some(m => m.id === message.id);
                if (alreadyHas) return t;
                return {
                  ...t,
                  messages: [...(t.messages || []), message],
                  updatedAt: message.createdAt,
                };
              });
              return { tickets };
            });
          },
        );

        ticketVisibilityUnsub = onTabVisible(() => {
          debouncedTicketRefresh();
        });
      },

      stopRealtime: () => {
        if (ticketRealtimeUnsub) {
          ticketRealtimeUnsub();
          ticketRealtimeUnsub = null;
        }
        if (ticketMessagesRealtimeUnsub) {
          ticketMessagesRealtimeUnsub();
          ticketMessagesRealtimeUnsub = null;
        }
        if (ticketVisibilityUnsub) {
          ticketVisibilityUnsub();
          ticketVisibilityUnsub = null;
        }
      },

      create: (input) => {
        const subject = input.subject.trim();
        const description = input.description.trim();
        if (!subject || !description) return { ok: false, error: 'موضوع و شرح مشکل را کامل وارد کنید.' };
        const now = new Date().toISOString();
        const tickets = get().tickets;
        const ticket: SupportTicket = {
          id: crypto.randomUUID(),
          code: newTicketCode(tickets),
          customerId: input.customerId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subject,
          description,
          category: input.category,
          priority: input.priority,
          status: 'open',
          orderId: input.orderId,
          messages: [
            { id: crypto.randomUUID(), sender: 'customer', author: input.customerName, text: description, createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        };
        set({ tickets: [ticket, ...tickets] });
        const ticketToSync = ticket;
        (async () => {
          if (!get().hydrated) return;
          try {
            await createTicketInDb({ ...ticketToSync, messages: ticketToSync.messages });
          } catch (e: any) {
            console.warn('[ticketStore] create sync failed:', e?.message || e);
          }
        })();
        return { ok: true, ticket };
      },

      createTicket: (input) => {
        const cs = getCrossStore();
        const user = cs.currentUser;
        if (!user) return { ok: false, error: 'برای ثبت تیکت ابتدا وارد حساب کاربری خود شوید.' };
        return get().create({
          ...input,
          customerId: user.id,
          customerName: user.name,
          customerPhone: user.phone || '',
        });
      },

      update: (id, patch) => {
        const now = new Date().toISOString();
        set(state => ({
          tickets: state.tickets.map(t => {
            if (t.id !== id) return t;
            const next: SupportTicket = { ...t, ...patch, updatedAt: now };
            if (patch.status === 'resolved' || patch.status === 'closed') next.closedAt = now;
            if (patch.status === 'open' || patch.status === 'in_progress') next.closedAt = undefined;
            return next;
          }),
        }));
        if (get().hydrated) {
          (async () => {
            try {
              const allowed = ['status', 'priority', 'category', 'rating', 'ratedAt', 'closedAt', 'updatedAt'] as const;
              type AllowedKey = typeof allowed[number];
              const filtered: Partial<Pick<SupportTicket, AllowedKey>> = {};
              (Object.keys(patch) as AllowedKey[]).forEach(k => {
                if ((allowed as readonly AllowedKey[]).includes(k)) {
                  (filtered as any)[k] = (patch as any)[k];
                }
              });
              if (patch.status === 'closed' || patch.status === 'resolved') {
                filtered.closedAt = now;
              }
              if (patch.status === 'open' || patch.status === 'in_progress') {
                filtered.closedAt = undefined as any;
              }
              filtered.updatedAt = now;
              await updateTicketInDb(id, filtered);
            } catch (e: any) {
              console.warn('[ticketStore] update sync failed:', e?.message || e);
            }
          })();
        }
      },

      updateTicket: (id, patch) => {
        get().update(id, patch);
      },

      remove: (id) =>
        set(state => ({ tickets: state.tickets.filter(t => t.id !== id) })),

      customerReply: (ticketId, text, user, allUsers) => {
        const body = text.trim();
        if (!body) return;
        const now = new Date().toISOString();
        let newMsg: SupportTicket['messages'][0] | null = null;
        set(state => ({
          tickets: state.tickets.map(t => {
            if (t.id !== ticketId || !isTicketOwnerSimple(t, user, allUsers)) return t;
            newMsg = {
              id: crypto.randomUUID(),
              sender: 'customer',
              author: user.name,
              text: body,
              createdAt: now,
            };
            return {
              ...t,
              customerId: user.id,
              messages: [
                ...t.messages,
                newMsg,
              ],
              updatedAt: now,
            };
          }),
        }));
        if (get().hydrated && newMsg) {
          const msgSync = newMsg;
          (async () => {
            try {
              await addTicketMessageInDb(ticketId, msgSync);
            } catch (e: any) {
              console.warn('[ticketStore] customerReply sync failed:', e?.message || e);
            }
          })();
        }
      },

      replyTicket: (ticketId, text) => {
        const cs = getCrossStore();
        const user = cs.currentUser;
        if (!user) return;
        get().customerReply(ticketId, text, { id: user.id, name: user.name, phone: user.phone }, cs.users);
      },

      adminReply: (ticketId, text, author) => {
        const body = text.trim();
        if (!body) return;
        const now = new Date().toISOString();
        const replyAuthor = author || 'تیم پشتیبانی';
        let newMsg: SupportTicket['messages'][0] | null = null;
        set(state => ({
          tickets: state.tickets.map(t => {
            if (t.id !== ticketId) return t;
            newMsg = {
              id: crypto.randomUUID(),
              sender: 'support',
              author: replyAuthor,
              text: body,
              createdAt: now,
            };
            return {
              ...t,
              status: t.status === 'open' ? 'in_progress' : t.status,
              assignedTo: t.assignedTo || replyAuthor,
              messages: [
                ...t.messages,
                newMsg,
              ],
              updatedAt: now,
            };
          }),
        }));
        if (get().hydrated && newMsg) {
          const msgSync = newMsg;
          (async () => {
            try {
              await addTicketMessageInDb(ticketId, msgSync);
            } catch (e: any) {
              console.warn('[ticketStore] adminReply sync failed:', e?.message || e);
            }
          })();
        }
      },

      adminReplyTicket: (ticketId, text) => {
        get().adminReply(ticketId, text);
      },

      reopen: (ticketId, text, user, allUsers) => {
        const body = text.trim();
        if (!body) return;
        const now = new Date().toISOString();
        let newMsg: SupportTicket['messages'][0] | null = null;
        let targetId = '';
        let reopening = false;
        set(state => ({
          tickets: state.tickets.map(t => {
            if (t.id !== ticketId || !isTicketOwnerSimple(t, user, allUsers)) return t;
            targetId = t.id;
            reopening = t.status === 'resolved' || t.status === 'closed';
            newMsg = {
              id: crypto.randomUUID(),
              sender: 'customer',
              author: user.name,
              text: body,
              createdAt: now,
            };
            return {
              ...t,
              customerId: user.id,
              status: reopening ? 'open' : t.status,
              closedAt: reopening ? undefined : t.closedAt,
              messages: [
                ...t.messages,
                newMsg,
              ],
              updatedAt: now,
            };
          }),
        }));
        if (get().hydrated) {
          const msgSync = newMsg;
          const filteredPatch: any = {};
          if (reopening) {
            filteredPatch.status = 'open' as TicketStatus;
            filteredPatch.closedAt = undefined;
          }
          filteredPatch.updatedAt = now;
          (async () => {
            try {
              if (Object.keys(filteredPatch).length > 0) {
                await updateTicketInDb(targetId, filteredPatch);
              }
              if (msgSync) {
                await addTicketMessageInDb(ticketId, msgSync);
              }
            } catch (e: any) {
              console.warn('[ticketStore] reopen sync failed:', e?.message || e);
            }
          })();
        }
      },

      reopenTicket: (ticketId, text) => {
        const cs = getCrossStore();
        const user = cs.currentUser;
        if (!user) return;
        get().reopen(ticketId, text, { id: user.id, name: user.name, phone: user.phone }, cs.users);
      },

      close: (ticketId) => {
        const now = new Date().toISOString();
        set(state => ({
          tickets: state.tickets.map(t =>
            t.id === ticketId ? { ...t, status: 'closed', closedAt: now, updatedAt: now } : t
          ),
        }));
        if (get().hydrated) {
          (async () => {
            try {
              await updateTicketInDb(ticketId, { status: 'closed', closedAt: now, updatedAt: now });
            } catch (e: any) {
              console.warn('[ticketStore] close sync failed:', e?.message || e);
            }
          })();
        }
      },

      rate: (ticketId, rating, user, allUsers) => {
        if (!rating || rating < 1 || rating > 5) return;
        const now = new Date().toISOString();
        set(state => ({
          tickets: state.tickets.map(t =>
            user && t.id === ticketId && isTicketOwnerSimple(t, user, allUsers)
              ? { ...t, rating, ratedAt: now, updatedAt: now }
              : t
          ),
        }));
        if (get().hydrated) {
          (async () => {
            try {
              await updateTicketInDb(ticketId, { rating, ratedAt: now, updatedAt: now });
            } catch (e: any) {
              console.warn('[ticketStore] rate sync failed:', e?.message || e);
            }
          })();
        }
      },

      rateTicket: (ticketId, rating) => {
        const cs = getCrossStore();
        const user = cs.currentUser;
        if (!user) return;
        get().rate(ticketId, rating, { id: user.id, phone: user.phone }, cs.users);
      },
    }),
    {
      name: 'hamyar_tickets',
      partialize: state => ({ tickets: state.tickets }),
    },
  ),
);
