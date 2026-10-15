// Executes read-only SQL against the linked cloud project via the Management API.
// This is the only verification path that works from a machine without IPv6:
// direct Postgres (5432) and the pooler (6543/6544) are unreachable, but the
// Management API runs the SQL server-side.
//
// Usage:  node scripts/dev/db-query.mjs "select count(*) from roles"
//
// Refuses anything that is not a SELECT/WITH, so it cannot be used to mutate.

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
const field = name => {
  const m = env.match(new RegExp(`^${name}\\s*=\\s*(\\S+)`, 'm'));
  if (!m) throw new Error(`${name} is missing from .env`);
  return m[1];
};

const PROJECT = 'rcimwpsnekxsxeivpivm';
const token = field('SUPABASE_ACCESS_TOKEN');

const sql = process.argv[2];
if (!sql) {
  console.error('Usage: node scripts/dev/db-query.mjs "<select ...>"');
  process.exit(1);
}

const stripped = sql.replace(/--.*$/gm, '').trim();
if (!/^(select|with|explain)\b/i.test(stripped)) {
  console.error('Refusing to run anything that is not SELECT/WITH/EXPLAIN.');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}\n${text}`);
  process.exit(1);
}

const rows = JSON.parse(text);
if (rows.length === 0) {
  console.log('(no rows)');
} else {
  const cols = Object.keys(rows[0]);
  console.log(cols.join(' | '));
  console.log(cols.map(c => '-'.repeat(Math.max(c.length, 3))).join('-+-'));
  for (const r of rows) console.log(cols.map(c => String(r[c] ?? '')).join(' | '));
}
console.log(`\n(${rows.length} row${rows.length === 1 ? '' : 's'})`);