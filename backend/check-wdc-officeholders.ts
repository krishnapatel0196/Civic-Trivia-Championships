import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const res = await pool.query(`
  SELECT q.external_id, q.expires_at, LEFT(q.text, 120) as text
  FROM trivia.questions q
  WHERE q.external_id LIKE 'wdc-%'
    AND q.status = 'draft'
    AND (
      LOWER(q.text) LIKE '%mayor%'
      OR LOWER(q.text) LIKE '%council%'
      OR LOWER(q.text) LIKE '%chair%'
      OR LOWER(q.text) LIKE '%attorney general%'
      OR LOWER(q.text) LIKE '%delegate%'
      OR LOWER(q.text) LIKE '%norton%'
      OR LOWER(q.text) LIKE '%bowser%'
      OR LOWER(q.text) LIKE '%mendelson%'
      OR LOWER(q.text) LIKE '%schwalb%'
      OR LOWER(q.text) LIKE '%currently%'
      OR LOWER(q.text) LIKE '%who is the%'
      OR LOWER(q.text) LIKE '%who serves%'
    )
  ORDER BY q.external_id
`);

console.log(`Found ${res.rows.length} potential officeholder questions:\n`);
res.rows.forEach(r => console.log(r.external_id, '|', r.expires_at ? `expires: ${r.expires_at}` : 'no expiry', '|', r.text));

const total = await pool.query(`SELECT COUNT(*) FROM trivia.questions WHERE external_id LIKE 'wdc-%' AND status = 'draft'`);
console.log(`\nTotal draft: ${total.rows[0].count} | Officeholder matches: ${res.rows.length}`);
await pool.end();
