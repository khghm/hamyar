import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('../api/tickets', () => ({
  fetchTickets: vi.fn().mockResolvedValue([]),
  createTicketInDb: vi.fn().mockResolvedValue({ ok: true }),
  updateTicketInDb: vi.fn().mockResolvedValue({ ok: true }),
  addTicketMessageInDb: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../api/sync', () => ({
  onSyncError: vi.fn(),
}));

import { useTicketStore } from '../state/ticketStore';
import { fetchTickets } from '../api/tickets';

describe('ticketStore - actions + hydrate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
    useTicketStore.setState({
      tickets: [],
      hydrated: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('create creates a new ticket', () => {
    let result: { ok: boolean; error?: string; ticket?: any };
    act(() => {
      result = useTicketStore.getState().create({
        subject: 'Test Ticket',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
    });

    expect(result!.ok).toBe(true);
    expect(result!.ticket).toBeDefined();
    expect(useTicketStore.getState().tickets).toHaveLength(1);
    expect(useTicketStore.getState().tickets[0].subject).toBe('Test Ticket');
    expect(useTicketStore.getState().tickets[0].status).toBe('open');
  });

  it('update updates ticket status', () => {
    act(() => {
      useTicketStore.getState().create({
        subject: 'Test Ticket',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
    });

    const ticketId = useTicketStore.getState().tickets[0].id;

    act(() => {
      useTicketStore.getState().update(ticketId, { status: 'in_progress' });
    });

    const updated = useTicketStore.getState().tickets.find(t => t.id === ticketId);
    expect(updated?.status).toBe('in_progress');
  });

  it('remove removes a ticket', () => {
    act(() => {
      useTicketStore.getState().create({
        subject: 'Test Ticket 1',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
      useTicketStore.getState().create({
        subject: 'Test Ticket 2',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
    });

    const ticketId = useTicketStore.getState().tickets[0].id;

    act(() => {
      useTicketStore.getState().remove(ticketId);
    });

    expect(useTicketStore.getState().tickets).toHaveLength(1);
  });

  it('hydrate fetches from Supabase', async () => {
    await act(async () => {
      await useTicketStore.getState().hydrate();
    });

    expect(fetchTickets).toHaveBeenCalled();
    expect(useTicketStore.getState().hydrated).toBe(true);
  });

  it('customerReply adds message to ticket', () => {
    act(() => {
      useTicketStore.getState().create({
        subject: 'Test Ticket',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
    });

    const ticketId = useTicketStore.getState().tickets[0].id;

    act(() => {
      useTicketStore.getState().customerReply(ticketId, 'Reply message', { id: 'user1', name: 'Test User', phone: '09123456789' });
    });

    const updated = useTicketStore.getState().tickets.find(t => t.id === ticketId);
    expect(updated?.messages).toHaveLength(2);
    expect(updated?.messages[1].text).toBe('Reply message');
    expect(updated?.messages[1].sender).toBe('customer');
  });

  it('adminReply adds support message', () => {
    act(() => {
      useTicketStore.getState().create({
        subject: 'Test Ticket',
        description: 'Test description',
        category: 'technical',
        priority: 'normal',
        customerId: 'user1',
        customerName: 'Test User',
        customerPhone: '09123456789',
      });
    });

    const ticketId = useTicketStore.getState().tickets[0].id;

    act(() => {
      useTicketStore.getState().adminReply(ticketId, 'Support reply', 'Support Agent');
    });

    const updated = useTicketStore.getState().tickets.find(t => t.id === ticketId);
    expect(updated?.messages).toHaveLength(2);
    expect(updated?.messages[1].text).toBe('Support reply');
    expect(updated?.messages[1].sender).toBe('support');
    expect(updated?.status).toBe('in_progress');
  });
});