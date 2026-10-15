import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The order mapper is deliberately NOT a `CollectionMapper`.
 *
 * Every other collection upserts its rows from the browser. Orders must never do
 * that: they are priced in `place_catalog_order` and their status only moves
 * through `change_order_status`. A client that could write its own order rows
 * could also state the amount it paid, so `fetchOrders` is read-only and this
 * test pins that boundary.
 */

describe('fetchOrders', () => {
  const builders: any[] = [];

  /** A chainable PostgREST stand-in that records every method it is given. */
  /** A chainable, thenable PostgREST stand-in that records every method it is given. */
  const makeBuilder = (rows: unknown[]) => {
    const b: any = {
      select: vi.fn(() => b),
      is: vi.fn(() => b),
      eq: vi.fn(() => b),
      in: vi.fn(() => b),
      order: vi.fn(() => b),
      limit: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: rows[0] ?? null, error: null })),
      // Write verbs exist so the read-only assertion below can prove they are
      // never called.
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      // A real PostgREST builder is thenable, which is why `.in(..)` can be
      // awaited on its own and `.in(..).order(..)` works too.
      then: (resolve: any, reject: any) => resolve({ data: rows, error: null }),
    };
    builders.push(b);
    return b;
  };

  beforeEach(() => {
    vi.resetModules();
    builders.length = 0;
    vi.doMock('../api/supabase', () => ({
      supabase: {
        from: vi.fn(() => makeBuilder([])),
        auth: {
          getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null })),
        },
        rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
      },
    }));
  });

  const load = async () => {
    const mod = await import('../api/orders');
    return mod.fetchOrders;
  };

  it('returns an empty list when the table has no rows', async () => {
    const fetchOrders = await load();
    await expect(fetchOrders()).resolves.toEqual([]);
  });

  it('is read-only: it never issues an insert, update or delete', async () => {
    const fetchOrders = await load();
    await fetchOrders();

    expect(builders.length).toBeGreaterThan(0);
    for (const b of builders) {
      expect(b.insert, 'orders must never be written from the browser').not.toHaveBeenCalled();
      expect(b.update, 'orders must never be written from the browser').not.toHaveBeenCalled();
      expect(b.upsert, 'orders must never be written from the browser').not.toHaveBeenCalled();
      expect(b.delete, 'orders must never be written from the browser').not.toHaveBeenCalled();
      expect(b.select, 'orders are read with an explicit column list').toHaveBeenCalled();
    }
  });

  it('stitches line items and status history onto each order', async () => {
    vi.resetModules();
    const orderId = '11111111-1111-1111-1111-111111111111';
    const serviceId = '22222222-2222-2222-2222-222222222222';
    const byTable: Record<string, unknown[]> = {
      orders: [
        {
          id: orderId,
          tracking_code: 'HMY-ABC123',
          customer_id: 'cust-1',
          customer_name: 'مشتری',
          type: 'service',
          channel: 'وب‌سایت',
          status: 'processing',
          priority: 'normal',
          total: 5000,
          paid: 5000,
          remaining: 0,
          created_at: '2026-01-01T00:00:00.000Z',
          service_id: serviceId,
        },
      ],
      order_items: [
        {
          order_id: orderId,
          product_id: null,
          name: 'خدمت',
          price: 2500,
          quantity: 2,
          total: 5000,
          image: null,
        },
      ],
      order_status_history: [
        { order_id: orderId, status: 'new', date: '2026-01-01T00:00:00.000Z' },
        { order_id: orderId, status: 'processing', date: '2026-01-02T00:00:00.000Z' },
      ],
      services: [{ id: serviceId, sku: 's7' }],
    };
    vi.doMock('../api/supabase', () => ({
      supabase: {
        from: vi.fn((table: string) => makeBuilder(byTable[table] ?? [])),
        auth: {
          getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null })),
        },
        rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
      },
    }));

    const fetchOrders = (await import('../api/orders')).fetchOrders;
    const orders = await fetchOrders();
    expect(orders).toHaveLength(1);
    const order = orders[0]!;

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ name: 'خدمت', price: 2500, quantity: 2, total: 5000 });
    expect(order.statusHistory).toEqual([
      { status: 'new', date: '2026-01-01T00:00:00.000Z' },
      { status: 'processing', date: '2026-01-02T00:00:00.000Z' },
    ]);
    // The uuid must be mapped back to the business key the pages use; the admin's
    // content-order filter is `projectServiceId.startsWith('ps-ct')`.
    expect(order.serviceId).toBe('s7');
    expect(order.status).toBe('processing');
  });
});

describe('humanising Postgres order errors', () => {
  // Exercised through the public surface: a rejected RPC must reach the Persian UI
  // as a sentence, not as a driver string.
  const run = async (message: string) => {
    vi.resetModules();
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: { message } }));
    vi.doMock('../api/supabase', () => ({
      supabase: {
        rpc,
        auth: {
          getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })),
        },
      },
    }));
    const { placeCatalogOrder } = await import('../api/orders');
    return placeCatalogOrder({ kind: 'product', items: [{ ref: 'p1', quantity: 1 }] });
  };

  it('turns an insufficient-balance error into Persian', async () => {
    const r = await run('insufficient wallet balance: have 10, need 250000');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('موجودی کیف پول شما کافی نیست');
  });

  it('turns an expired discount code into Persian', async () => {
    const r = await run('invalid or expired discount code');
    expect(r.error).toBe('کد تخفیف معتبر نیست یا منقضی شده');
  });

  it('turns an out-of-stock error into Persian', async () => {
    const r = await run('insufficient stock for فلش مموری: have 2, need 5');
    expect(r.error).toContain('موجودی کافی نیست');
  });

  it('names the missing item when it cannot be found', async () => {
    const r = await run('product not found: p999');
    expect(r.error).toBe('یکی از اقلام سفارش دیگر موجود نیست');
  });

  it('falls back to the raw message rather than swallowing it', async () => {
    const r = await run('something nobody has seen before');
    expect(r.error).toBe('something nobody has seen before');
  });
});
