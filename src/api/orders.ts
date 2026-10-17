import { supabase } from './supabase';
import { functionsUrl } from '../lib/supabase';
import type { Order, OrderItem, OrderStatus } from '../domains/types';

let staffCheckCache: { uid: string; isStaff: boolean } | null = null;

export async function isCurrentUserStaff(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const uid = session.user.id;
  if (staffCheckCache && staffCheckCache.uid === uid) return staffCheckCache.isStaff;
  const { data, error } = await supabase
    .from('staff_accounts')
    .select('id')
    .eq('auth_uid', uid)
    .eq('active', true)
    .maybeSingle();
  const isStaff = !error && !!data;
  staffCheckCache = { uid, isStaff };
  return isStaff;
}

export interface PlaceOrderRequest {
  serviceId: string;
  quantity?: number;
  urgent?: boolean;
  formData?: Record<string, string>;
  documents?: { key: string; name: string; size: number; storage_path: string }[];
  paymentMethod?: 'online' | 'wallet';
  useWallet?: boolean;
}

export interface PlaceOrderResult {
  ok: boolean;
  error?: string;
  orderId?: string;
  trackingCode?: string;
  invoiceId?: string;
  total?: number;
  paid?: number;
}

export async function placeOrder(body: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const jwt = (await supabase.auth.getSession()).data.session?.access_token;
  if (!jwt) return { ok: false, error: 'وارد حساب کاربری شوید' };

  const res = await fetch('/functions/v1/place-order', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    return { ok: false, error: json.error || res.statusText };
  }
  return {
    ok: true,
    orderId: json.orderId,
    trackingCode: json.trackingCode,
    invoiceId: json.invoiceId,
    total: json.total,
    paid: json.paid,
  };
}

export interface ChangeStatusResult {
  ok: boolean;
  error?: string;
  trackingCode?: string;
  newStatus?: string;
  stockDeducted?: boolean;
  receiptIssued?: boolean;
  loyaltyAwarded?: number;
}

export async function changeOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<ChangeStatusResult> {
  // The RPC is `security definer` and re-checks `has_permission('perm2')`
  // server-side, and for non-service-role callers it takes the actor from
  // `auth.uid()` rather than the argument — so calling it directly from the
  // authenticated client is as safe as going through an Edge Function, and it
  // avoids the `/functions/v1/change-order-status` endpoint returning 404 when
  // the function is not deployed.
  const actorId = (await supabase.auth.getUser()).data.user?.id;
  if (!actorId) return { ok: false, error: 'وارد حساب کاربری شوید' };

  const { data, error } = await supabase.rpc('change_order_status', {
    p_order_id: orderId,
    p_new_status: status,
    p_actor_id: actorId,
    p_note: note ?? '',
  });

  if (error) return { ok: false, error: humaniseRpcError(error.message) };

  const row = (Array.isArray(data) ? data[0] : data) as {
    tracking_code: string;
    new_status: string;
    stock_deducted: boolean;
    receipt_issued: boolean;
    loyalty_points: number;
  } | null;
  if (!row) return { ok: false, error: 'پاسخ نامعتبر از سرور' };

  return {
    ok: true,
    trackingCode: row.tracking_code,
    newStatus: row.new_status,
    stockDeducted: row.stock_deducted,
    receiptIssued: row.receipt_issued,
    loyaltyAwarded: row.loyalty_points,
  };
}

export interface CreatePaymentIntentResult {
  ok: boolean;
  error?: string;
  paymentId?: string;
  gatewayRef?: string;
  amount?: number;
  status?: string;
}

export async function createPaymentIntent(orderId: string): Promise<{
  ok: boolean;
  error?: string;
  paymentId?: string;
  gatewayRef?: string;
  amount?: number;
  status?: string;
}> {
  const jwt = (await supabase.auth.getSession()).data.session?.access_token;
  if (!jwt) return { ok: false, error: 'وارد حساب کاربری شوید' };

  const res = await fetch(functionsUrl('create-payment-intent'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    return { ok: false, error: json.error || res.statusText };
  }
  return {
    ok: true,
    paymentId: json.paymentId,
    gatewayRef: json.gatewayRef,
    amount: json.amount,
    status: json.status,
  };
}

// ===========================================================================
// place_catalog_order — product and project-service orders
//
// This calls the RPC directly instead of going through an Edge Function. The
// function is `security definer` and re-checks `auth.uid() = p_customer_id`, so
// the server still decides who the order belongs to; the RPC just keeps one less
// deployable in the path.
//
// Nothing about the money is accepted from here on purpose: there is no
// `total`/`paid`/`price` parameter to pass, so a tampered client cannot state
// its own amount. The server prices from `products` / `project_services` and
// debits the wallet in the same transaction.
// ===========================================================================

export type CatalogOrderKind = 'product' | 'project' | 'media';

export interface PlaceCatalogOrderRequest {
  kind: CatalogOrderKind;
  /** Business keys (`p1`, `ps-wd-app`) as the store knows them. */
  items: { ref: string; quantity: number }[];
  paymentMethod?: 'online' | 'wallet';
  urgent?: boolean;
  formData?: Record<string, string>;
  couponCode?: string | null;
  gatewayRef?: string | null;
  documents?: { label: string; storage_path: string }[];
}

export interface PlaceCatalogOrderResult {
  ok: boolean;
  error?: string;
  orderId?: string;
  trackingCode?: string;
  invoiceId?: string;
  total?: number;
  paid?: number;
  contentProjectSku?: string;
}

/**
 * Postgres raises business-rule failures as plain messages; turn them into
 * something a Persian UI can show instead of a raw driver string.
 */
function humaniseRpcError(message: string): string {
  if (/order not found/.test(message)) return 'سفارش یافت نشد';
  if (/illegal transition/.test(message)) return 'تغییر وضعیت به این حالت مجاز نیست';
  if (/order is already in status/.test(message)) return 'سفارش هم اکنون در این وضعیت است';
  if (/insufficient wallet balance/.test(message)) {
    return 'موجودی کیف پول شما کافی نیست';
  }
  if (/insufficient stock/.test(message))
    return message.replace(/^insufficient stock for /, 'موجودی کافی نیست: ');
  if (/invalid or expired discount code/.test(message)) return 'کد تخفیف معتبر نیست یا منقضی شده';
  if (/usage limit/.test(message)) return 'ظرفیت این کد تخفیف تکمیل شده است';
  if (/minimum purchase/.test(message)) return 'مبلغ خرید برای این کد تخفیف کافی نیست';
  if (/cart is empty/.test(message)) return 'سبد خرید خالی است';
  if (/permission denied/.test(message)) return 'دسترسی لازم را ندارید';
  if (/payment method/.test(message)) return 'روش پرداخت نامعتبر است';
  if (/order kind/.test(message)) return 'نوع سفارش نامعتبر است';
  if (/invalid quantity/.test(message)) return 'تعداد سفارش نامعتبر است';
  if (/not found/.test(message)) return 'یکی از اقلام سفارش دیگر موجود نیست';
  return message;
}

export async function placeCatalogOrder(
  body: PlaceCatalogOrderRequest,
): Promise<PlaceCatalogOrderResult> {
  // The RPC re-checks `auth.uid() = p_customer_id` server-side, so the uid is
  // the correct customer id to send — no profile lookup needed.
  const customerId = (await supabase.auth.getUser()).data.user?.id;
  if (!customerId) return { ok: false, error: 'وارد حساب کاربری شوید' };

  const { data, error } = await supabase.rpc('place_catalog_order', {
    p_customer_id: customerId,
    p_kind: body.kind,
    p_items: body.items,
    p_payment_method: body.paymentMethod ?? 'online',
    p_gateway_ref: body.gatewayRef ?? null,
    p_coupon_code: body.couponCode ?? null,
    p_urgent: body.urgent ?? false,
    p_form_data: body.formData ?? null,
    p_documents: body.documents ?? null,
  });

  if (error) return { ok: false, error: humaniseRpcError(error.message) };

  const row = (Array.isArray(data) ? data[0] : data) as {
    order_id: string;
    tracking_code: string;
    invoice_id: string;
    total: number;
    paid: number;
    content_project_sku: string | null;
  } | null;
  if (!row) return { ok: false, error: 'پاسخ نامعتبر از سرور' };

  return {
    ok: true,
    orderId: row.order_id,
    trackingCode: row.tracking_code,
    invoiceId: row.invoice_id,
    total: Number(row.total),
    paid: Number(row.paid),
    contentProjectSku: row.content_project_sku || undefined,
  };
}

// ===========================================================================
// Reading orders back
//
// `orders` is the one collection that is NOT a `CollectionMapper`, and it must
// not become one. Those mappers diff the array and upsert rows the client can
// edit freely; orders are created only by `place_catalog_order` /
// `place_order`, priced server-side, and their status moves only through
// `change_order_status`. A client-side upsert would let the browser state the
// amount it paid, so the write path here is deliberately read-only.
// ===========================================================================

interface OrderRow extends Record<string, any> {
  id: string;
  tracking_code: string | null;
  customer_id: string | null;
  customer_name: string | null;
  type: Order['type'];
  channel: string | null;
  status: string;
  priority: string;
  total: number | string;
  paid: number | string;
  remaining: number | string;
  employee_id: string | null;
  payment_method: string | null;
  gateway_ref: string | null;
  form_data: Record<string, string> | null;
  stock_deducted: boolean | null;
  receipt_invoice_id: string | null;
  service_id: string | null;
  project_service_id: string | null;
  document_status: string | null;
  project_id: string | null;
  content_project_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'ready', 'delivered', 'cancelled'];

const asOrderStatus = (value: string): OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : 'new';

export interface FetchOrdersOptions {
  /** Restrict to one customer (the public tracking page and the customer's own profile). */
  customerId?: string;
  /** Exclude soft-deleted rows. Admin only. */
  includeDeleted?: boolean;
}

/**
 * Loads orders together with their line items and status timeline.
 *
 * The three child tables are read separately and stitched by uuid, because RLS
 * is evaluated per table: a staff member with `perm1` may read orders but not
 * `order_documents`, and one blocked child must not blank the whole list.
 */
export async function fetchOrders(options: FetchOrdersOptions = {}): Promise<Order[]> {
  // Both customers and staff sign in through Supabase Auth, so the presence of
  // a session does not tell us whether the caller is an admin. We check the
  // `staff_accounts` table: an active staff row means the caller is an
  // admin/staff member and should read through the SECURITY DEFINER RPCs that
  // bypass RLS. A real customer session keeps using the normal table path so
  // RLS still scopes them to their own rows.
  const isAdmin = await isCurrentUserStaff();

  let heads: OrderRow[];

  if (isAdmin) {
    const { data: rows, error } = await supabase.rpc('admin_list_orders');
    if (error) throw new Error(`orders: ${error.message}`);
    heads = ((rows ?? []) as OrderRow[]).filter(
      r => !options.customerId || r.customer_id === options.customerId,
    );
  } else {
    let query = supabase
      .from('orders')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options.customerId) query = query.eq('customer_id', options.customerId);

    const { data: rows, error } = await query;
    if (error) throw new Error(`orders: ${error.message}`);
    heads = (rows ?? []) as OrderRow[];
  }

  if (!heads.length) return [];

  const orderIds = heads.map(r => r.id);

  const itemRows = isAdmin
    ? (await supabase.rpc('admin_list_order_items')).data as
        | { order_id: string; product_id: string | null; name: string | null; price: number | string | null; quantity: number | string | null; total: number | string | null; image: string | null }[]
        | null
    : (await supabase
        .from('order_items')
        .select('order_id, product_id, name, price, quantity, total, image')
        .in('order_id', orderIds)).data;

  const historyRows = isAdmin
    ? (await supabase.rpc('admin_list_order_status_history')).data as
        | { order_id: string; status: string; date: string }[]
        | null
    : (await supabase
        .from('order_status_history')
        .select('order_id, status, "date"')
        .in('order_id', orderIds)
        .order('date', { ascending: true })).data;

  // The store identifies services and project services by their business key
  // (`s7`, `ps-ct-seo`), but Postgres stores the uuid. Without this the admin's
  // content-order filter (`projectServiceId.startsWith('ps-ct')`) silently stops
  // matching and the whole «تیم تولید محتوا» section empties out.
  const [{ data: serviceRows }, { data: projectRows }] = await Promise.all([
    supabase.from('services').select('id, sku'),
    supabase.from('project_services').select('id, sku'),
  ]);
  const skuOfService = new Map((serviceRows ?? []).map(r => [r.id, r.sku]));
  const skuOfProject = new Map((projectRows ?? []).map(r => [r.id, r.sku]));

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows ?? []) {
    const list = itemsByOrder.get(row.order_id) ?? [];
    list.push({
      productId: row.product_id ?? undefined,
      name: row.name ?? '',
      price: Number(row.price) || 0,
      quantity: Number(row.quantity) || 0,
      total: Number(row.total) || 0,
      image: row.image ?? undefined,
    });
    itemsByOrder.set(row.order_id, list);
  }

  const historyByOrder = new Map<string, { status: OrderStatus; date: string }[]>();
  for (const row of historyRows ?? []) {
    const list = historyByOrder.get(row.order_id) ?? [];
    list.push({ status: asOrderStatus(row.status), date: row.date });
    historyByOrder.set(row.order_id, list);
  }

  return heads.map(row => {
    const order: Order = {
      id: row.id,
      trackingCode: row.tracking_code ?? '',
      customerId: row.customer_id ?? '',
      customerName: row.customer_name ?? '',
      type: row.type ?? 'service',
      channel: row.channel ?? 'وب‌سایت',
      status: asOrderStatus(row.status),
      priority: (row.priority as Order['priority']) ?? 'normal',
      items: itemsByOrder.get(row.id) ?? [],
      total: Number(row.total) || 0,
      paid: Number(row.paid) || 0,
      remaining: Number(row.remaining) || 0,
      createdAt: row.created_at,
      paymentMethod: (row.payment_method as Order['paymentMethod']) ?? undefined,
      gatewayRef: row.gateway_ref ?? undefined,
      formData: row.form_data ?? undefined,
      statusHistory: historyByOrder.get(row.id) ?? [],
    };
    if (row.employee_id) order.employeeId = row.employee_id;
    if (row.stock_deducted != null) order.stockDeducted = row.stock_deducted;
    if (row.receipt_invoice_id) order.receiptInvoiceId = row.receipt_invoice_id;
    if (row.service_id) {
      const sku = skuOfService.get(row.service_id);
      if (sku) order.serviceId = sku;
    }
    if (row.project_service_id) {
      const sku = skuOfProject.get(row.project_service_id);
      if (sku) order.projectServiceId = sku;
    }
    if (row.document_status) {
      order.documentStatus = row.document_status as Order['documentStatus'];
    }
    if (row.project_id) order.projectId = row.project_id;
    if (row.content_project_id) order.contentProjectId = row.content_project_id;
    return order;
  });
}

/** The customer this browser is signed in as, or null when signed out. */
export async function currentCustomerId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function deleteOrder(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
