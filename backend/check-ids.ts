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
  ORDER BY q.external_id
`);
// Show the range and gaps
const ids = res.rows.map(r => ({ id: r.external_id, status: r.status }));
const nums = ids.map(r => parseInt(r.id.replace('por-', '')));
console.log('All IDs in DB:', ids.map(r => `${r.id}(${r.status[0]})`).join(', '));
console.log('Max ID number:', Math.max(...nums));
console.log('Total in DB:', ids.length);
await pool.end();
