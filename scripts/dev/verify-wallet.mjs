// Regression test for migration 017: a customer must not be able to change their
// own `wallet_balance` / `loyalty_points` / `level`, and must not be able to move
// somebody else's wallet through the RPCs.
//
// The `profiles` RLS policy `customer_update_own_profile` only restricts the ROW
// (`id = auth.uid()`), never the columns, so on its own a signed-in customer can
// run `update profiles set wallet_balance = …` and mint themselves money. The
// protection is the `trg_profiles_server_columns` trigger, so the only way to
// test it honestly is to make the same call the browser makes.
//
// Usage: node scripts/dev/verify-wallet.mjs
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

const results = [];
function check(label, pass, detail = '') {
  results.push(pass);
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n          ${detail}` : ''}`);
}

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
  return { ok: res.ok, status: res.status, body, message: body?.message ?? '' };
}

/** Same path the SPA uses: a PostgREST call carrying the user's own JWT. */
async function asUser(token, path, method, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text.trim() ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { ok: res.ok, status: res.status, body: parsed, message: parsed?.message ?? '' };
}

const stamp = Date.now();
const EMAIL = `walletcheck${stamp}@example.com`;
const PHONE = `09${String(1000000000 + (stamp % 899999999)).slice(0, 9)}`;

const { body: created } = await admin('auth/v1/admin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'مشتری آزمون کیف پول', phone: PHONE },
  }),
});
if (!created?.id) throw new Error(`could not create the throwaway customer: ${JSON.stringify(created)}`);
const CUSTOMER = created.id;

try {
  const signIn = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const session = await signIn.json();
  if (!session.access_token) throw new Error(`sign-in failed: ${JSON.stringify(session)}`);
  const tok = session.access_token;

  // Fund the wallet legitimately, as an admin would.
  await admin(`profiles?id=eq.${CUSTOMER}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_balance: 100000 }),
  });
  const read = async () => {
    const r = await admin(`profiles?id=eq.${CUSTOMER}&select=wallet_balance,loyalty_points,level,display_name`);
    return r.body?.[0] ?? {};
  };
  const start = await read();

  console.log('=== 1. minting money by direct UPDATE ===');
  const mint = await asUser(tok, `profiles?id=eq.${CUSTOMER}`, 'PATCH', { wallet_balance: 999999999 });
  check(
    'PATCH wallet_balance is refused',
    !mint.ok && /permission denied/.test(mint.message),
    mint.message || `HTTP ${mint.status} — the row-level policy alone would have allowed this`,
  );
  check(
    'the balance actually did not change',
    Number((await read()).wallet_balance) === Number(start.wallet_balance),
    `still ${(await read()).wallet_balance}`,
  );

  console.log('\n=== 2. minting loyalty points and level ===');
  const points = await asUser(tok, `profiles?id=eq.${CUSTOMER}`, 'PATCH', {
    loyalty_points: 999999,
    total_earned_points: 999999,
    level: 'vip',
  });
  check(
    'PATCH loyalty_points / level is refused',
    !points.ok && /permission denied/.test(points.message),
    points.message || `HTTP ${points.status}`,
  );

  const after = await read();
  check(
    'loyalty points and level unchanged',
    Number(after.loyalty_points) === Number(start.loyalty_points) && after.level === start.level,
    `loyalty_points=${after.loyalty_points}, level=${after.level}`,
  );

  console.log('\n=== 3. the fields a customer DOES own still work ===');
  const rename = await asUser(tok, `profiles?id=eq.${CUSTOMER}`, 'PATCH', {
    display_name: 'نام ویرایش‌شده',
  });
  check('PATCH display_name is allowed', rename.ok, rename.ok ? `now "${rename.body?.[0]?.display_name}"` : rename.message);
  check('the name really changed', (await read()).display_name === 'نام ویرایش‌شده');

  console.log('\n=== 4. another customer\'s wallet through the RPCs ===');
  const { body: victim } = await admin('profiles?id=neq.' + CUSTOMER + '&select=id&limit=1');
  const victimId = victim?.[0]?.id;
  if (!victimId) {
    console.log('  SKIP  no second profile to target');
  } else {
    const debit = await fetch(`${BASE}/rest/v1/rpc/deduct_wallet`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user_id: victimId, p_amount: 1 }),
    });
    const debitBody = await debit.json().catch(() => ({}));
    check(
      'cannot debit another wallet',
      !debit.ok && /permission denied/.test(debitBody.message ?? ''),
      debitBody.message ?? `HTTP ${debit.status}`,
    );

    const refund = await fetch(`${BASE}/rest/v1/rpc/refund_wallet`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user_id: victimId, p_amount: 5000, p_reason: 'probe' }),
    });
    const refundBody = await refund.json().catch(() => ({}));
    check(
      'cannot credit another wallet',
      !refund.ok && /permission denied/.test(refundBody.message ?? ''),
      refundBody.message ?? `HTTP ${refund.status}`,
    );
  }

  console.log('\n=== 5. your own wallet still works (refund path) ===');
  const selfRefund = await fetch(`${BASE}/rest/v1/rpc/refund_wallet`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user_id: CUSTOMER, p_amount: 1000, p_reason: 'probe' }),
  });
  const selfBody = await selfRefund.json().catch(() => ({}));
  check(
    'a customer may still credit their own wallet',
    selfRefund.ok && Number(selfBody) === Number(start.wallet_balance) + 1000,
    selfRefund.ok ? `balance is now ${selfBody}` : selfBody.message,
  );
} finally {
  // See verify-orders.mjs: `orders.customer_id` is ON DELETE NO ACTION, and an
  // order would block the auth delete. Clean the children first and verify.
  await admin(`wallet_transactions?user_id=eq.${CUSTOMER}`, { method: 'DELETE' });
  const { ok: userGone, body } = await admin(`auth/v1/admin/users/${CUSTOMER}`, { method: 'DELETE' });
  if (!userGone) {
    console.error(`\nCLEANUP FAILED for ${EMAIL}: ${body?.msg ?? JSON.stringify(body)}`);
    process.exitCode = 1;
  } else {
    console.log('\ncleaned up the throwaway customer');
  }
}

const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exitCode = 1;