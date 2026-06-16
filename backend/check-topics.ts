import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query(`
  SELECT t.slug as topic, COUNT(*) as cnt
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  JOIN trivia.collections c ON cq.collection_id = c.id
  JOIN trivia.collection_topics ct ON ct.collection_id = c.id AND ct.topic_id = q.topic_id
  JOIN trivia.topics t ON q.topic_id = t.id
  WHERE c.slug = 'portland-or' AND q.status = 'active'
  GROUP BY t.slug
  ORDER BY cnt DESC
`);
res.rows.forEach(r => console.log(r.topic, ':', r.cnt));
await pool.end();
