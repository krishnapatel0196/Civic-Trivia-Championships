import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.external_id, q.status, LEFT(q.text, 80) as q_text
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
    AND q.status = 'archived'
  ORDER BY q.external_id
`);
console.log('Archived count:', res.rows.length);
res.rows.forEach(r => console.log(r.external_id, '|', r.q_text));
await pool.end();
