import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.external_id, q.expires_at, LEFT(q.text, 80) as text
  FROM trivia.questions q
  WHERE q.external_id LIKE 'wdc-%'
    AND q.status = 'active'
    AND q.external_id NOT IN (
      SELECT external_id FROM trivia.questions 
      WHERE external_id LIKE 'wdc-4%'
    )
  ORDER BY q.external_id
  LIMIT 20
`);
console.log('Sample of pre-existing active wdc questions:');
res.rows.forEach(r => console.log(r.external_id, '|', r.expires_at ?? 'no expiry', '|', r.text));

const total = await pool.query(`SELECT COUNT(*) FROM trivia.questions WHERE external_id LIKE 'wdc-%' AND status = 'active'`);
const under400 = await pool.query(`SELECT COUNT(*) FROM trivia.questions WHERE external_id LIKE 'wdc-%' AND status = 'active' AND CAST(SUBSTRING(external_id FROM 5) AS INT) < 400`);
console.log(`\nTotal active: ${total.rows[0].count} | Pre-existing (wdc-1xx to wdc-3xx): ${under400.rows[0].count}`);
await pool.end();
