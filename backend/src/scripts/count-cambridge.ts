import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  const [col] = await db.select().from(collections).where(eq(collections.slug, 'cambridge-ma')).limit(1);
  if (!col) { console.log('Collection not found'); return; }

  const links = await db.select({ questionId: collectionQuestions.questionId })
    .from(collectionQuestions).where(eq(collectionQuestions.collectionId, col.id));

  const ids = links.map(l => l.questionId);
  if (!ids.length) { console.log('No questions'); return; }

  const allQ = await db.select({ id: questions.id, status: questions.status })
    .from(questions).where(inArray(questions.id, ids));

  const counts = allQ.reduce((acc, q) => { acc[q.status] = (acc[q.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  console.log('Cambridge MA question counts:');
  Object.entries(counts).forEach(([s, n]) => console.log(`  ${s}: ${n}`));
  console.log(`  TOTAL: ${allQ.length}`);
}

main().then(() => process.exit(0));
