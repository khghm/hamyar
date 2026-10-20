import pg from 'pg';

function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + ((jy / 33 | 0) * 8) + (((jy % 33) + 3) / 4 | 0) + jd;
  if (jm < 7) days += (jm - 1) * 31;
  else days += ((jm - 7) * 30) + 186;
  let gy = 400 * (days / 146097 | 0);
  days %= 146097;
  if (days > 36524) { gy += 100 * ((--days) / 36524 | 0); days %= 36524; if (days >= 365) days++; }
  gy += 4 * (days / 1461 | 0); days %= 1461;
  if (days > 365) { gy += ((days - 1) / 365 | 0); days = (days - 1) % 365; }
  let gd = days + 1;
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > salA[gm]; gm++) gd -= salA[gm];
  return { gy, gm, gd };
}

const c = new pg.Client({ connectionString: process.env.PG_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const rows = await c.query(`select id, title, date, published_at from news`);
let fixed = 0;
for (const r of rows.rows) {
  const m = String(r.date || '').trim().match(/^(1[3-4]\d{2})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) continue;
  const { gy, gm, gd } = jalaliToGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  const iso = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  await c.query(`update news set date = $1, published_at = ($2 || 'T09:00:00Z')::timestamptz where id = $3`, [iso, iso, r.id]);
  fixed++;
  console.log(r.title.slice(0, 24), r.date, '→', iso);
}
console.log('fixed rows:', fixed);
const check = await c.query(`select title, date, published_at::date from news order by created_at desc limit 4`);
console.table(check.rows);
await c.end();
