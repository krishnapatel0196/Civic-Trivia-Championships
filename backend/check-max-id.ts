import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.external_id, q.status
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
  ORDER BY CAST(SUBSTRING(q.external_id FROM 5) AS INTEGER) DESC
  LIMIT 5
`);
res.rows.forEach(r => console.log(r.external_id, r.status));
const active = await pool.query(`
  SELECT COUNT(*) as cnt 
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or' AND q.status = 'active'
`);
console.log('Active count:', active.rows[0].cnt);
await pool.end();
