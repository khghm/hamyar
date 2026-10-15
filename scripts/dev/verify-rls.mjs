// End-to-end check of the read/write RLS split (migration 015).
//
// The bug it guards against: 20 policies were `for all using (read or write)`.
// `using` also governs DELETE and DELETE has no `with check`, so a staff member
// holding only the read permission could delete rows.
//
// NOTE ON DETECTION: PostgREST applies RLS by *filtering rows*, not by erroring.
// A DELETE that RLS blocks returns HTTP 200 with zero rows affected. So asserting
// on status codes gives false confidence — every "blocked" case must instead be
// proven by the row still being there afterwards.
//
// Usage:  node scripts/dev/verify-rls.mjs
// Assumes: node scripts/dev/test-accounts.mjs

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

async function signIn(email) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`sign-in failed for ${email}: ${JSON.stringify(body)}`);
  return body.access_token;
}

/** PostgREST call as the given token. Returns the parsed body or the error. */
async function call(token, { table, method = 'GET', filter = '', body, prefer }) {
  const url = `${BASE}/rest/v1/${table}${filter ? `?${filter}` : ''}`;
  const headers = { apikey: ANON, Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text.trim() ? JSON.parse(text) : [];
  } catch {
    parsed = text.slice(0, 200);
  }
  return { status: res.status, rows: Array.isArray(parsed) ? parsed : null, raw: parsed };
}

/** Does the row still exist, as seen by this token? */
async function stillExists(token, table, id) {
  const r = await call(token, { table, filter: `id=eq.${id}` });
  return Array.isArray(r.rows) && r.rows.length > 0;
}

/**
 * `mutated` = did the change actually happen?
 * For UPDATE we send a harmless value change and read it back.
 */
async function tryUpdate(token, table, id, patch) {
  const r = await call(token, {
    table,
    method: 'PATCH',
    filter: `id=eq.${id}`,
    body: patch,
    prefer: 'return=representation',
  });
  // RLS filtering yields 0 rows back even on HTTP 200.
  return Array.isArray(r.rows) && r.rows.length > 0;
}

async function tryDelete(token, table, id) {
  const r = await call(token, {
    table,
    method: 'DELETE',
    filter: `id=eq.${id}`,
    prefer: 'return=representation',
  });
  return Array.isArray(r.rows) && r.rows.length > 0;
}

const results = [];
function check(label, pass, detail) {
  results.push(pass);
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n          ${detail}` : ''}`);
}

// Discover the real settings row rather than hard-coding an id.
const svc = SERVICE;
const { rows: settingRows } = await call(svc, { table: 'gamification_settings' });
if (!settingRows?.length) throw new Error('gamification_settings is empty; run the seed first');
const SETTINGS_ID = settingRows[0].id;
const { rows: staffRows } = await call(svc, { table: 'staff_accounts', filter: 'select=id&limit=1' });
if (!staffRows?.length) throw new Error('staff_accounts is empty; run test-accounts.mjs first');
const STAFF_ID = staffRows[0].id;

console.log(`=== gamification_settings (${SETTINGS_ID}) ===`);
const viewer = await signIn('staffInviteViewer.hamyar@example.com'); // perm29 only

check(
  'perm29-only: SELECT allowed',
  await stillExists(viewer, 'gamification_settings', SETTINGS_ID),
  'read gate must accept perm29',
);

const viewerUpdated = await tryUpdate(viewer, 'gamification_settings', SETTINGS_ID, {
  points_per_toman: 99999,
});
check(
  'perm29-only: UPDATE blocked',
  !viewerUpdated,
  'write gate requires perm43',
);

const viewerDeleted = await tryDelete(viewer, 'gamification_settings', SETTINGS_ID);
check(
  'perm29-only: DELETE blocked  <-- the 015 regression',
  !viewerDeleted && (await stillExists(svc, 'gamification_settings', SETTINGS_ID)),
  'row must survive; PostgREST returns 200 with 0 rows, so we assert on survival',
);

console.log('\n=== staff_accounts ===');
const staffViewer = await signIn('staffSupport.hamyar@example.com'); // perm15 read
const staffDeleted = await tryDelete(staffViewer, 'staff_accounts', STAFF_ID);
check(
  'perm15-only: DELETE blocked',
  !staffDeleted && (await stillExists(svc, 'staff_accounts', STAFF_ID)),
  'before 015, perm15 could delete staff accounts',
);

console.log('\n=== admin (perm43) must still be able to write ===');
const admin = await signIn('admin.hamyar@example.com');
const original = settingRows[0].points_per_toman;
const adminUpdated = await tryUpdate(admin, 'gamification_settings', SETTINGS_ID, {
  points_per_toman: original + 1,
});
check('perm43: UPDATE allowed', adminUpdated, `set points_per_toman ${original} -> ${original + 1}`);

// Put the value back so repeated runs stay idempotent.
const restored = await tryUpdate(admin, 'gamification_settings', SETTINGS_ID, {
  points_per_toman: original,
});
check('perm43: restore original value', restored, `back to ${original}`);

const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exitCode = 1;