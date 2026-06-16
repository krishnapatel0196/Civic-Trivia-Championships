import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.external_id, q.status, q.text, q.quality_score
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
    AND q.external_id IN ('por-036', 'por-037')
`);
res.rows.forEach(r => console.log(r.external_id, r.status, r.quality_score, '|', r.text));
await pool.end();
