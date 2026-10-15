// Exercises place_catalog_order against the cloud project through the same path
// the browser uses (Auth sign-in + PostgREST RPC call), because the RPC is
// `security definer` and its whole job is to reject what a client must not be
// able to send.
//
// Usage: node scripts/dev/verify-orders.mjs
// Creates and cleans up its own throwaway customer.

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
const field = name => {
  const m = env.match(new RegExp(`^${name}\\s*=\\s*(\\S+)`, 'm'));
  if (!m) throw new Error(`${name} is missing from .env`);
  return m[1];
};

const BASE = field('VITE_SUPABASE_URL');
const ANON = field('VITE_SUPABASE_PUBLISHABLE_KEY');
const SERVICE = field('SUPABASE_SERVICE_ROLE_KEY');
const PASSWORD = 'Test1234!';

const headers = tok => ({
  apikey: ANON,
  Authorization: `Bearer ${tok}`,
  'Content-Type': 'application/json',
});

const results = [];
function check(label, pass, detail = '') {
  results.push(pass);
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n          ${detail}` : ''}`);
}

/**
 * PostgREST helper. `auth/...` paths are routed to the Auth admin API, which
 * does NOT live under /rest/v1 — prefixing it there yields PGRST125.
 */
async function admin(path, opts = {}) {
  const url = path.startsWith('auth/') ? `${BASE}/${path}` : `${BASE}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, ...(opts.headers ?? {}) },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text.trim() ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function rpc(token, name, args) {
  const res = await fetch(`${BASE}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text.trim() ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body, message: body?.message ?? body?.hint ?? '' };
}

const stamp = Date.now();
const EMAIL = `ordercheck${stamp}@example.com`;
const PHONE = `09${String(1000000000 + (stamp % 899999999)).slice(0, 9)}`;

// ---- fixtures: one real product and one deliberately absurd price ----------
const { body: products } = await admin('products?select=id,sku,name,price,stock&limit=1&order=sku');
const product = products?.[0];
if (!product) throw new Error('no products in the database');

const { body: projects } = await admin('project_services?select=id,sku,title,base_price&limit=1&order=sku');
const projectService = projects?.[0];

console.log(`product: ${product.sku} (${product.name}) price=${product.price} stock=${product.stock}`);
if (projectService) console.log(`project: ${projectService.sku} (${projectService.title}) base=${projectService.base_price}`);

// ---- create a throwaway customer ------------------------------------------
//
// The phone must go through `user_metadata`, not the top-level `phone` field:
// GoTrue demands E.164 there, while `profiles.phone` is checked against
// `^09[0-9]{9}$` by the `on_auth_user_created` trigger (migration 013).
const { body: created, status: createStatus } = await admin('auth/v1/admin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'مشتری آزمون سفارش', phone: PHONE },
  }),
});

if (!created?.id) throw new Error(`could not create the test customer (HTTP ${createStatus}): ${JSON.stringify(created)}`);
const CUSTOMER = created.id;

// Only `profiles` and `staff_accounts` cascade from `auth.users`; every other
// child FK is `ON DELETE NO ACTION`. So one row anywhere — an order, a
// notification, a wallet entry — permanently blocks deleting the auth user, and
// the rows have to be removed explicitly, child-first.
//
// The column differs per table: `tickets` hangs off `customer_id`, not
// `user_id`, so a single hard-coded column silently skipped it.
const CUSTOMER_SCOPED = [
  ['notifications', 'user_id'],
  ['loyalty_transactions', 'user_id'],
  ['notification_settings', 'user_id'],
  ['tickets', 'customer_id'],
  ['wallet_transactions', 'user_id'],
  ['payments', 'user_id'],
  ['affiliates', 'user_id'],
  ['audit_logs', 'actor_id'],
];

const cleanup = async () => {
  const failed = [];

  for (const [table, column] of CUSTOMER_SCOPED) {
    const { ok } = await admin(`${table}?${column}=eq.${CUSTOMER}`, { method: 'DELETE' });
    if (!ok) failed.push(table);
  }

  // SMS receipts hang off the throwaway phone, not the user id, so they
  // are orphaned once the customer is gone.
  {
    const { ok } = await admin(`sms_logs?phone=eq.${PHONE}`, { method: 'DELETE' });
    if (!ok) failed.push('sms_logs');
  }

  const { body: orderRows } = await admin(`orders?customer_id=eq.${CUSTOMER}&select=id`);
  const ids = (orderRows ?? []).map(r => r.id);

  if (ids.length) {
    const inIds = ids.join(',');
    for (const table of ['order_items', 'order_status_history', 'order_documents']) {
      const { ok } = await admin(`${table}?order_id=in.(${inIds})`, { method: 'DELETE' });
      if (!ok) failed.push(table);
    }
    const { body: invoiceRows } = await admin(`invoices?order_id=in.(${inIds})&select=id`);
    const invIds = (invoiceRows ?? []).map(r => r.id).join(',');
    if (invIds) {
      const { ok } = await admin(`invoice_items?invoice_id=in.(${invIds})`, { method: 'DELETE' });
      if (!ok) failed.push('invoice_items');
    }
    const { ok: invGone } = await admin(`invoices?order_id=in.(${inIds})`, { method: 'DELETE' });
    if (!invGone) failed.push('invoices');
    const { ok: ordGone } = await admin(`orders?id=in.(${inIds})`, { method: 'DELETE' });
    if (!ordGone) failed.push('orders');
  }

  const { ok: userGone, body } = await admin(`auth/v1/admin/users/${CUSTOMER}`, { method: 'DELETE' });
  if (!userGone) {
    console.error(`\nCLEANUP FAILED for ${EMAIL}: ${body?.msg ?? body?.message ?? JSON.stringify(body)}`);
    process.exitCode = 1;
    return;
  }
  const { body: leftover } = await admin(`profiles?id=eq.${CUSTOMER}&select=id`);
  if (leftover?.length) {
    console.error(`\nCLEANUP INCOMPLETE: profile survived. Tables that refused a delete: ${failed.join(', ') || 'none'}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\ncleaned up the throwaway customer (${ids.length} order(s) removed${failed.length ? `; refused: ${failed.join(', ')}` : ''})`);
};

try {
  const signIn = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const session = await signIn.json();
  if (!session.access_token) throw new Error(`sign-in failed: ${JSON.stringify(session)}`);
  const tok = session.access_token;

  // Give the wallet a balance so the debit path is actually exercised.
  await admin(`profiles?id=eq.${CUSTOMER}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ wallet_balance: 5000000 }),
  });

  console.log('\n=== 1. product order, online payment ===');
  const online = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 2 }],
    p_payment_method: 'online',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: { note: 'verify-rls probe' },
    p_documents: null,
  });
  check('order created', online.ok, online.ok ? `tracking=${online.body?.[0]?.tracking_code}` : online.message);

  if (online.ok) {
    const row = online.body[0];
    check(
      'server computed the total from the DB price (2 × price)',
      Number(row.total) === Number(product.price) * 2,
      `expected ${Number(product.price) * 2}, got ${row.total}`,
    );
    check('online payment is not marked paid', Number(row.paid) === 0, `paid=${row.paid}`);

    const { body: items } = await admin(`order_items?order_id=eq.${row.order_id}&select=name,price,quantity,product_id`);
    check(
      'order_items written with product_id',
      items?.length === 1 && items[0].product_id === product.id,
      JSON.stringify(items?.[0] ?? null),
    );

    const { body: hist } = await admin(`order_status_history?order_id=eq.${row.order_id}&select=status`);
    check('status history seeded', hist?.some(h => h.status === 'new'), JSON.stringify(hist));

    const { body: inv } = await admin(`invoices?order_id=eq.${row.order_id}&select=invoice_number,total,status`);
    check('invoice issued', inv?.length === 1, JSON.stringify(inv?.[0] ?? null));
  }

  console.log('\n=== 2. the client must not be able to set the price ===');
  const { body: beforeProducts } = await admin(`products?id=eq.${product.id}&select=price`);
  const realPrice = beforeProducts[0].price;
  // A hostile client sends its own total/paid. The RPC has no such parameters at
  // all, so PostgREST rejects the call outright.
  const hostile = await fetch(`${BASE}/rest/v1/rpc/place_catalog_order`, {
    method: 'POST',
    headers: headers(tok),
    body: JSON.stringify({
      p_customer_id: CUSTOMER,
      p_kind: 'product',
      p_items: [{ ref: product.sku, quantity: 1, price: 1 }],
      p_payment_method: 'online',
      p_total: 1,
      p_paid: 999999999,
    }),
  });
  check(
    'unknown price/total parameters are rejected',
    !hostile.ok,
    `HTTP ${hostile.status} — the RPC accepts only its declared parameters`,
  );

  console.log('\n=== 3. ordering for another customer ===');
  const { body: other } = await admin(`profiles?select=id&id=neq.${CUSTOMER}&limit=1`);
  const someoneElse = other?.[0]?.id;
  if (someoneElse) {
    const cross = await rpc(tok, 'place_catalog_order', {
      p_customer_id: someoneElse,
      p_kind: 'product',
      p_items: [{ ref: product.sku, quantity: 1 }],
      p_payment_method: 'online',
      p_gateway_ref: null,
      p_coupon_code: null,
      p_urgent: false,
      p_form_data: null,
      p_documents: null,
    });
    check(
      'cannot place an order on someone else\'s behalf',
      !cross.ok && /permission denied/.test(cross.message),
      cross.message || `HTTP ${cross.status}`,
    );
  } else {
    console.log('  SKIP  no second profile to target');
  }

  console.log('\n=== 4. stock guard ===');
  const over = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 99 }],
    p_payment_method: 'online',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  const stockBlocked = !over.ok && /insufficient stock/.test(over.message);
  check(
    'rejects a quantity above available stock',
    stockBlocked,
    over.message || `HTTP ${over.status} (stock is ${product.stock})`,
  );

  console.log('\n=== 5. wallet payment is debited server-side ===');
  const { body: before } = await admin(`profiles?id=eq.${CUSTOMER}&select=wallet_balance`);
  const balanceBefore = Number(before[0].wallet_balance);
  const wallet = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 1 }],
    p_payment_method: 'wallet',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check('wallet order created', wallet.ok, wallet.ok ? `tracking=${wallet.body?.[0]?.tracking_code}` : wallet.message);

  if (wallet.ok) {
    const charged = Number(wallet.body[0].total);
    const { body: after } = await admin(`profiles?id=eq.${CUSTOMER}&select=wallet_balance`);
    const balanceAfter = Number(after[0].wallet_balance);
    check(
      'wallet debited by exactly the order total',
      balanceBefore - balanceAfter === charged,
      `${balanceBefore} - ${balanceAfter} = ${balanceBefore - balanceAfter}, order total ${charged}`,
    );
    check('order marked fully paid', Number(wallet.body[0].paid) === charged, `paid=${wallet.body[0].paid}`);

    const { body: txns } = await admin(
      `wallet_transactions?user_id=eq.${CUSTOMER}&select=amount,type,balance_after&order=created_at.desc&limit=1`,
    );
    check('a wallet_transactions row was written', txns?.length === 1, JSON.stringify(txns?.[0] ?? null));
  }

  console.log('\n=== 6. wallet overdraft ===');
  await admin(`profiles?id=eq.${CUSTOMER}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_balance: 10 }),
  });
  const broke = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 1 }],
    p_payment_method: 'wallet',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check(
    'insufficient wallet balance is refused',
    !broke.ok && /insufficient wallet balance/.test(broke.message),
    broke.message || `HTTP ${broke.status}`,
  );

  console.log('\n=== 7. project-service order ===');
  if (projectService) {
    const proj = await rpc(tok, 'place_catalog_order', {
      p_customer_id: CUSTOMER,
      p_kind: 'project',
      p_items: [{ ref: projectService.sku, quantity: 1 }],
      p_payment_method: 'online',
      p_gateway_ref: null,
      p_coupon_code: null,
      p_urgent: false,
      p_form_data: { fullName: 'مشتری تست' },
      p_documents: null,
    });
    check('project order created', proj.ok, proj.ok ? `tracking=${proj.body?.[0]?.tracking_code}` : proj.message);
    if (proj.ok) {
      const { body: ord } = await admin(`orders?id=eq.${proj.body[0].order_id}&select=type,project_service_id,total`);
      check(
        'project_service_id linked and type derived server-side',
        ord?.[0]?.project_service_id === projectService.id,
        JSON.stringify(ord?.[0] ?? null),
      );
      check(
        'total is the base price',
        Number(ord?.[0]?.total) === Number(projectService.base_price),
        `expected ${projectService.base_price}, got ${ord?.[0]?.total}`,
      );
    }
  } else {
    console.log('  SKIP  no project services seeded');
  }

  console.log('\n=== 8. empty / malformed input ===');
  const empty = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [],
    p_payment_method: 'online',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check('empty cart refused', !empty.ok && /cart is empty/.test(empty.message), empty.message);

  const badKind = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'nonsense',
    p_items: [{ ref: product.sku, quantity: 1 }],
    p_payment_method: 'online',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check('unknown kind refused', !badKind.ok && /invalid order kind/.test(badKind.message), badKind.message);

  const badPay = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 1 }],
    p_payment_method: 'bitcoin',
    p_gateway_ref: null,
    p_coupon_code: null,
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check('unknown payment method refused', !badPay.ok && /invalid payment method/.test(badPay.message), badPay.message);

  const badCoupon = await rpc(tok, 'place_catalog_order', {
    p_customer_id: CUSTOMER,
    p_kind: 'product',
    p_items: [{ ref: product.sku, quantity: 1 }],
    p_payment_method: 'online',
    p_gateway_ref: null,
    p_coupon_code: 'NOT-A-REAL-CODE',
    p_urgent: false,
    p_form_data: null,
    p_documents: null,
  });
  check(
    'forged discount code refused',
    !badCoupon.ok && /invalid or expired discount code/.test(badCoupon.message),
    badCoupon.message,
  );

  console.log('\n=== 9. the price the client asked for was never honoured ===');
  const { body: finalProducts } = await admin(`products?id=eq.${product.id}&select=price,stock`);
  check(
    'product row untouched by the hostile request',
    Number(finalProducts[0].price) === Number(realPrice),
    `price still ${finalProducts[0].price}`,
  );
} finally {
  await cleanup();
}

const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exitCode = 1;