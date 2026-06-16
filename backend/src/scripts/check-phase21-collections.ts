import 'dotenv/config';
import { db } from '../db/index.js';
import { collections, questions, collectionQuestions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('=== Phase 21 Collection Verification ===\n');

  // Check Indiana
  const [indiana] = await db.select().from(collections).where(eq(collections.slug, 'indiana-state')).limit(1);
  console.log('Indiana collection:', indiana ? `EXISTS (id: ${indiana.id})` : 'MISSING');
  
  if (indiana) {
    const indianaQs = await db.select().from(questions)
      .innerJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
      .where(eq(collectionQuestions.collectionId, indiana.id));
    const activeCount = indianaQs.filter(row => row.questions.status === 'active').length;
    console.log(`  Total: ${indianaQs.length} questions`);
    console.log(`  Active: ${activeCount} questions`);
    console.log(`  Status: ${activeCount >= 80 && activeCount <= 100 ? 'PASS (80-100)' : 'FAIL (need 80-100)'}`);
  }

  // Check California
  const [california] = await db.select().from(collections).where(eq(collections.slug, 'california-state')).limit(1);
  console.log('\nCalifornia collection:', california ? `EXISTS (id: ${california.id})` : 'MISSING');
  
  if (california) {
    const californiaQs = await db.select().from(questions)
      .innerJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
      .where(eq(collectionQuestions.collectionId, california.id));
    const activeCount = californiaQs.filter(row => row.questions.status === 'active').length;
    console.log(`  Total: ${californiaQs.length} questions`);
    console.log(`  Active: ${activeCount} questions`);
    console.log(`  Status: ${activeCount >= 80 && activeCount <= 100 ? 'PASS (80-100)' : 'FAIL (need 80-100)'}`);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
