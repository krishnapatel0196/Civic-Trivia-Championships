import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('=== Sample Questions from State Collections ===\n');

  // Get Indiana samples
  const [indiana] = await db.select().from(collections).where(eq(collections.slug, 'indiana-state')).limit(1);
  
  if (indiana) {
    const indianaSamples = await db.select({
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      explanation: questions.explanation
    })
    .from(questions)
    .innerJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
    .where(eq(collectionQuestions.collectionId, indiana.id))
    .limit(2);
    
    console.log('INDIANA SAMPLES:');
    indianaSamples.forEach((q, i) => {
      console.log(`\n${i+1}. [${q.externalId}] ${q.text}`);
      console.log('   Options:', JSON.stringify(q.options));
      console.log('   Explanation:', q.explanation.substring(0, 120) + '...');
    });
  }

  // Get California samples
  const [california] = await db.select().from(collections).where(eq(collections.slug, 'california-state')).limit(1);
  
  if (california) {
    const californiaSamples = await db.select({
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options
    })
    .from(questions)
    .innerJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
    .where(eq(collectionQuestions.collectionId, california.id))
    .limit(2);
    
    console.log('\n\nCALIFORNIA SAMPLES:');
    californiaSamples.forEach((q, i) => {
      console.log(`\n${i+1}. [${q.externalId}] ${q.text}`);
      console.log('   Options:', JSON.stringify(q.options));
    });
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
