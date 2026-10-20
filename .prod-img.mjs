import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.PG_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query(`select name, image from products where image is not null and image <> '' limit 6`);
console.log(JSON.stringify(r.rows, null, 1));
const m = await c.query(`select image, count(*) from media_items where image is not null and image <> '' group by image limit 3`).catch(()=>null);
if (m) console.log('media images:', JSON.stringify(m.rows));
await c.end();
