import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const totalResult = await db.execute(sql`
  SELECT COUNT(*) as count
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
  JOIN civic_trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'fremont-ca'
`);

console.log('Total Fremont questions:', totalResult.rows[0].count);

const topicResult = await db.execute(sql`
  SELECT q.subcategory, COUNT(*) as count
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
  JOIN civic_trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'fremont-ca'
  GROUP BY q.subcategory
  ORDER BY count DESC
`);

console.log('\nBy topic:');
for (const row of topicResult.rows) {
  console.log(`  ${row.subcategory}: ${row.count}`);
}

const diffResult = await db.execute(sql`
  SELECT q.difficulty, COUNT(*) as count
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
  JOIN civic_trivia.collections c ON cq.collection_id = c.id
  WHERE c.slug = 'fremont-ca'
  GROUP BY q.difficulty
`);

console.log('\nBy difficulty:');
for (const row of diffResult.rows) {
  console.log(`  ${row.difficulty}: ${row.count}`);
}

process.exit(0);
