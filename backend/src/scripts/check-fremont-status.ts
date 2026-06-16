import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const result = await db.execute(sql`
  SELECT q.status, COUNT(*) as count
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
  JOIN civic_trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'fremont-ca'
  GROUP BY q.status
`);

console.log('Fremont questions by status:');
for (const row of result.rows) {
  console.log(`  ${row.status}: ${row.count}`);
}
process.exit(0);
