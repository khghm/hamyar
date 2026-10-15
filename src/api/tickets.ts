import { supabase } from './supabase';
import { isCurrentUserStaff } from './orders';
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '../domains/types';

interface TicketRow {
  id: string;
  sku: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  order_id: string | null;
  rating: number | null;
  rated_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Legacy jsonb column (pre-migration 020) that used to carry the thread.
  // Always null on a current database; present as a fallback when the
  // `ticket_messages` table does not exist yet.
  messages?: unknown[] | null;
}

interface TicketMessageRow {
  id: string;
  ticket_id: string;
  sender: string;
  author: string | null;
  text: string;
  created_at: string;
}

const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const TICKET_PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
const TICKET_CATEGORIES: TicketCategory[] = ['general', 'technical', 'billing', 'order', 'complaint', 'other'];

const asTicketStatus = (value: string): TicketStatus =>
  TICKET_STATUSES.includes(value as TicketStatus) ? (value as TicketStatus) : 'open';

const asTicketPriority = (value: string): TicketPriority =>
  TICKET_PRIORITIES.includes(value as TicketPriority) ? (value as TicketPriority) : 'normal';

const asTicketCategory = (value: string): TicketCategory =>
  TICKET_CATEGORIES.includes(value as TicketCategory) ? (value as TicketCategory) : 'general';

export async function fetchTickets(): Promise<SupportTicket[]> {
  // Both customers and staff sign in through Supabase Auth. We check the
  // `staff_accounts` table to decide whether to read through the SECURITY
  // DEFINER RPCs (staff, bypass RLS) or the normal table path (customer, RLS
  // scoped to their own rows).
  const isAdmin = await isCurrentUserStaff();

  let tickets: TicketRow[];

  if (isAdmin) {
    const { data: rows, error } = await supabase.rpc('admin_list_tickets');
    if (error) throw new Error(`tickets: ${error.message}`);
    tickets = (rows ?? []) as TicketRow[];
  } else {
    const { data: rows, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`tickets: ${error.message}`);
    tickets = (rows ?? []) as TicketRow[];
  }

  if (!tickets.length) return [];

  const ticketIds = tickets.map(t => t.id);

  const messageRows = isAdmin
    ? (await supabase.rpc('admin_list_ticket_messages')).data as TicketMessageRow[] | null
    : (await supabase
        .from('ticket_messages')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true })).data;

  const messagesByTicket = new Map<string, SupportTicket['messages']>();
  for (const row of messageRows ?? []) {
    const list = messagesByTicket.get(row.ticket_id) ?? [];
    list.push({
      id: row.id,
      sender: row.sender as 'customer' | 'support',
      author: row.author ?? '',
      text: row.text,
      createdAt: row.created_at,
    });
    messagesByTicket.set(row.ticket_id, list);
  }

  return tickets.map(row => {
    const thread = messagesByTicket.get(row.id) ?? [];
    // A database without migration 020 has no `ticket_messages` table; the
    // thread then lives in the legacy `messages` jsonb column of the row
    // itself (see the fallback in `createTicketInDb`).
    const messages =
      thread.length > 0
        ? thread
        : (Array.isArray(row.messages) ? row.messages : [])
            .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
            .map(m => ({
              id: typeof m.id === 'string' ? m.id : crypto.randomUUID(),
              sender: m.sender === 'support' ? ('support' as const) : ('customer' as const),
              author: typeof m.author === 'string' ? m.author : '',
              text: String(m.text ?? ''),
              createdAt: typeof m.createdAt === 'string' ? m.createdAt : row.created_at,
            }));
    return {
      id: row.id,
      // The DB column is `sku` (the business key); the client domain calls it `code`.
      code: row.sku ?? '',
      customerId: row.customer_id ?? '',
      customerName: row.customer_name ?? '',
      customerPhone: row.customer_phone ?? '',
      // The DB column is `title`; the client domain calls it `subject`.
      subject: row.title ?? '',
      description: row.description ?? '',
      category: asTicketCategory(row.category ?? 'general'),
      priority: asTicketPriority(row.priority ?? 'normal'),
      status: asTicketStatus(row.status ?? 'open'),
      orderId: row.order_id ?? undefined,
      messages,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      rating: row.rating ?? undefined,
      ratedAt: row.rated_at ?? undefined,
      closedAt: row.closed_at ?? undefined,
    };
  });
}

// SQLSTATE codes that mean "the database is missing a column or table the
// current schema expects" (undefined_column / undefined_table /
// undefined_object). They are the signature of a database that has not run
// migrations 019/020 yet, and are the only failures worth retrying with a
// narrower payload.
const SCHEMA_ERROR_CODES = new Set(['42703', '42P01', '42704']);

const isSchemaError = (error: { code?: string } | null | undefined): boolean =>
  !!error && SCHEMA_ERROR_CODES.has(error.code ?? '');

export async function createTicketInDb(
  ticket: Omit<SupportTicket, 'messages'> & { messages: SupportTicket['messages'] },
): Promise<{ ok: boolean; error?: string; fallback?: boolean }> {
  // Columns that have existed since the first `tickets` migration (003).
  // The enriched payload below adds the denormalized columns from migration
  // 019; on a database that has not run it, the insert fails with
  // `undefined_column`, so we retry with this base payload and keep the
  // thread in the legacy `messages` jsonb column instead.
  const base = {
    id: ticket.id,
    sku: ticket.code,
    customer_id: ticket.customerId,
    title: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };

  const { error } = await supabase.from('tickets').insert({
    ...base,
    customer_name: ticket.customerName,
    customer_phone: ticket.customerPhone,
    category: ticket.category,
    order_id: ticket.orderId ?? null,
    rating: ticket.rating ?? null,
    rated_at: ticket.ratedAt ?? null,
    closed_at: ticket.closedAt ?? null,
  });

  // Non-schema failures (RLS, FK, unique sku, network…) must surface: a
  // retry with fewer columns would fail the same way.
  if (error && !isSchemaError(error)) return { ok: false, error: error.message };

  if (error) {
    const { error: retryError } = await supabase
      .from('tickets')
      .insert({ ...base, messages: ticket.messages ?? [] });
    if (retryError) return { ok: false, error: retryError.message };
    return { ok: true, fallback: true };
  }

  if (ticket.messages.length > 0) {
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert(ticket.messages.map(m => ({
        id: m.id,
        ticket_id: ticket.id,
        sender: m.sender,
        author: m.author,
        text: m.text,
        created_at: m.createdAt,
      })));

    // No `ticket_messages` table (migration 020 missing): the ticket row
    // itself is already persisted and carries the thread in its legacy
    // `messages` column only on the fallback path — on the enriched path
    // the row exists without a message copy. Either way the ticket is
    // visible to support, so this must not turn a saved ticket into an
    // error for the customer.
    if (messageError && isSchemaError(messageError)) return { ok: true, fallback: true };
    if (messageError) return { ok: false, error: messageError.message };
  }

  return { ok: true };
}

export async function updateTicketInDb(
  id: string,
  patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'category' | 'rating' | 'ratedAt' | 'closedAt' | 'updatedAt'>>
): Promise<{ ok: boolean; error?: string }> {
  const updates: Record<string, any> = {};
  if (patch.status) updates.status = patch.status;
  if (patch.priority) updates.priority = patch.priority;
  if (patch.category) updates.category = patch.category;
  if (patch.rating !== undefined) updates.rating = patch.rating;
  if (patch.ratedAt) updates.rated_at = patch.ratedAt;
  if (patch.closedAt) updates.closed_at = patch.closedAt;
  if (patch.updatedAt) updates.updated_at = patch.updatedAt;

  if (Object.keys(updates).length === 0) return { ok: true };

  const { error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addTicketMessageInDb(
  ticketId: string,
  message: SupportTicket['messages'][0]
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      id: message.id,
      ticket_id: ticketId,
      sender: message.sender,
      author: message.author,
      text: message.text,
      created_at: message.createdAt,
    });

  if (error) return { ok: false, error: error.message };

  // Also update the ticket's updated_at
  await supabase
    .from('tickets')
    .update({ updated_at: message.createdAt })
    .eq('id', ticketId);

  return { ok: true };
}