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
const byStatus: Record<string, string[]> = {};
for (const r of res.rows) {
  if (!byStatus[r.status]) byStatus[r.status] = [];
  byStatus[r.status].push(r.external_id);
}
for (const [status, ids] of Object.entries(byStatus)) {
  console.log(`${status} (${ids.length}):`, ids.join(', '));
}
const maxNum = Math.max(...res.rows.map(r => parseInt(r.external_id.replace('por-', ''))));
console.log('\nMax ID:', maxNum);
console.log('Total:', res.rows.length);
await pool.end();
