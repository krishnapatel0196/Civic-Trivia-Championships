import 'dotenv/config';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function check() {
  const bliQuestions = await db.select().from(questions)
    .where(sql`external_id LIKE 'bli-%'`)
    .orderBy(questions.externalId)
    .limit(3);
  
  console.log('=== BLOOMINGTON SAMPLE QUESTIONS ===\n');
  for (const q of bliQuestions) {
    console.log(`ID: ${q.externalId} [${q.status}]`);
    console.log(`Topic: ${q.topicCategory} | Difficulty: ${q.difficulty}`);
    console.log(`Q: ${q.text}`);
    console.log(`Explanation: ${q.explanation}`);
    console.log(`Source: ${JSON.stringify(q.source)}`);
    console.log('---\n');
  }
  
  const lacQuestions = await db.select().from(questions)
    .where(sql`external_id LIKE 'lac-%'`)
    .orderBy(questions.externalId)
    .limit(3);
  
  console.log('=== LOS ANGELES SAMPLE QUESTIONS ===\n');
  for (const q of lacQuestions) {
    console.log(`ID: ${q.externalId} [${q.status}]`);
    console.log(`Topic: ${q.topicCategory} | Difficulty: ${q.difficulty}`);
    console.log(`Q: ${q.text}`);
    console.log(`Explanation: ${q.explanation}`);
    console.log(`Source: ${JSON.stringify(q.source)}`);
    console.log('---\n');
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
