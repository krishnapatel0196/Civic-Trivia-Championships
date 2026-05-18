import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT q.external_id, q.status, q.text, q.quality_score, q.difficulty
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'portland-or'
    AND q.status = 'draft'
  ORDER BY q.external_id
`);
res.rows.forEach(r => console.log(r.external_id, r.status, 'score:', r.quality_score, r.difficulty, '|', r.text));
await pool.end();
