// تولید بلوک‌های seed از روی دادهٔ واقعی استخراج‌شده از src/store.tsx.
// خروجی در scripts/.seed-generated.sql نوشته می‌شود و دستی داخل seed.sql
// قرار می‌گیرد — این اسکریپت خودش seed.sql را بازنویسی نمی‌کند.
import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('scripts/.seed-data.json', 'utf8'));

/** رشتهٔ SQL با کوتیشن تکی، '' برای escape */
const q = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const jsonb = (v) => `${q(JSON.stringify(v))}::jsonb`;
const nl = (s = '') => `${s}\n`;

// ── project_services ───────────────────────────────────────────────────────
let out = '';
out += nl('-- === 8) project services (وب‌سایت / تولید محتوا) — table: project_services');
out += nl('-- `sku` carries the store.tsx id (ps-wd-*, ps-ct-*) so the app can look');
out += nl('-- catalogue entries up by the ids it already knows.');
out += nl('-- `fields`/`docs` are the dynamic wizard schema as jsonb.');
// هر ردیف باید جفت پرانتز مستقل داشته باشد: VALUES (r1), (r2), ...
const projRows = data.PROJECT_SERVICES.map((s) =>
  `(${[
    q(s.id), q(s.group), q(s.icon ?? null), q(s.title), q(s.desc ?? null),
    `array[${(s.features ?? []).map(q).join(', ')}]::text[]`,
    s.basePrice, q(s.unit ?? null),
    jsonb(s.fields ?? []), jsonb(s.docs ?? []),
  ].join(', ')})`,
);
out += nl(`insert into project_services (sku, "group", icon, title, "desc", features, base_price, unit, fields, docs) values`);
out += nl(projRows.join(',\n') + ';');

// ── about_content ──────────────────────────────────────────────────────────
out += nl();
out += nl('-- === 9) about page content — table: about_content');
out += nl("-- Single row under key 'about'; `content` holds the structured payload.");
out += nl(`insert into about_content (key, content) values ('about', ${jsonb(data.INITIAL_ABOUT)});`);

// ── site_settings ──────────────────────────────────────────────────────────
const social = data.SOCIAL_MEDIA ?? [];
out += nl();
out += nl('-- === 10) site settings — table: site_settings');
out += nl('-- Key/value jsonb rows. The social row mirrors AboutContent.socialMedia so the');
out += nl('-- header/footer can read it without loading the whole about document.');
out += nl(`insert into site_settings (key, value) values`);
out += nl(`  ('social', ${jsonb(social)}),`);
out += nl(`  ('payment', ${jsonb({ gateway: 'mock', autoSettle: false, currency: 'IRT' })}),`);
out += nl(`  ('contact', ${jsonb({ phone: '', address: '', email: '' })});`);

// ── notification_settings ──────────────────────────────────────────────────
out += nl();
out += nl('-- === 11) notification settings — table: notification_settings');
out += nl('-- Single row; `config` carries types, per-type colours and the section');
out += nl('-- routing the admin UI expects.');
out += nl(`insert into notification_settings (config) values`);
out += nl(`  (${jsonb(data.DEFAULT_NOTIFICATION_SETTINGS)});`);

writeFileSync('scripts/.seed-generated.sql', out);
console.log(`wrote scripts/.seed-generated.sql (${out.split('\n').length} lines)`);
console.log(`project_services=${data.PROJECT_SERVICES.length} social=${social.length} notifTypes=${data.DEFAULT_NOTIFICATION_TYPES.length}`);