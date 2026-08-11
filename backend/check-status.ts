import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.status, COUNT(*) as cnt
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
  GROUP BY q.status
  ORDER BY q.status
`);
res.rows.forEach(r => console.log(r.status, ':', r.cnt));

// Also check which active questions exist
const active = await pool.query(`
  SELECT q.external_id, LEFT(q.text, 60) as q_text
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
    AND q.status = 'active'
  ORDER BY q.external_id
`);
console.log('\nActive questions:', active.rows.length);
active.rows.forEach(r => console.log(r.external_id, '|', r.q_text));

await pool.end();
