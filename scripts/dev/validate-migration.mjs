// Validates a migration file against the real Postgres by running it inside a
// transaction that is rolled back. Nothing is persisted, so a broken migration
// cannot damage the project — but every statement is parsed, planned and
// executed against the actual schema (enums, column names, grants), which
// catches the class of error a linter never will.
//
// Usage: node scripts/dev/validate-migration.mjs <path-to.sql>

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
const field = name => {
  const m = env.match(new RegExp(`^${name}\\s*=\\s*(\\S+)`, 'm'));
  if (!m) throw new Error(`${name} is missing from .env`);
  return m[1];
};

const PROJECT = 'rcimwpsnekxsxeivpivm';
const token = field('SUPABASE_ACCESS_TOKEN');
const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/dev/validate-migration.mjs <path-to.sql>');
  process.exit(1);
}

const body = readFileSync(file, 'utf8');

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

// The API runs each request in its own transaction, so BEGIN … ROLLBACK inside
// one payload is what gives us the dry run.
const wrapped = `begin;\n${body}\nrollback;`;
const res = await query(wrapped);

if (res.ok) {
  console.log(`OK   ${file}`);
  console.log('     every statement parsed and executed, then rolled back. Nothing persisted.');
  // `process.exit(0)` here raced the socket teardown on Windows and produced a
  // spurious libuv assertion, so let the event loop drain on its own instead.
  process.exitCode = 0;
} else {
  console.error(`FAIL ${file}  (HTTP ${res.status})`);
  console.error(res.text);
  process.exitCode = 1;
}

// ---- second pass: call the function inside the same rolled-back transaction --
//
// `create function` compiles plpgsql lazily — the body is only parsed when it
// first runs. So a migration can apply cleanly and still be broken at runtime
// (a wrong enum cast, a NOT NULL column left out). This exercises the body
// against real rows and throws the transaction away afterwards.
const probes = process.argv.slice(3);
if (process.exitCode === 0 && probes.length) {
  console.log('\nruntime probes (inside the same rolled-back transaction):');
  for (const probe of probes) {
    const r = await query(`begin;\n${body}\n${probe}\nrollback;`);
    if (r.ok) {
      const rows = (() => {
        try {
          return JSON.parse(r.text);
        } catch {
          return null;
        }
      })();
      console.log(`  OK    ${probe.slice(0, 78)}`);
      if (Array.isArray(rows) && rows.length) console.log(`        -> ${JSON.stringify(rows[0])}`);
    } else {
      console.error(`  FAIL  ${probe.slice(0, 78)}`);
      console.error(`        ${r.text.slice(0, 600)}`);
      process.exitCode = 1;
    }
  }
}