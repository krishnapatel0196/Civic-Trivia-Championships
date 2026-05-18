import '../env.js';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const statusCounts = await db.select({
    status: questions.status,
    count: sql<number>`count(*)`
  }).from(questions).groupBy(questions.status);

  console.log('=== Question Status Summary ===');
  for (const row of statusCounts) {
    console.log(`  ${row.status}: ${row.count}`);
  }

  const collCounts = await db.select({
    name: collections.name,
    status: questions.status,
    count: sql<number>`count(*)`
  }).from(questions)
    .leftJoin(collectionQuestions, eq(questions.id, collectionQuestions.questionId))
    .leftJoin(collections, eq(collectionQuestions.collectionId, collections.id))
    .groupBy(collections.name, questions.status)
    .orderBy(collections.name, questions.status);

  console.log('\n=== By Collection ===');
  let currentColl = '';
  for (const row of collCounts) {
    const name = row.name || 'No collection';
    if (name !== currentColl) {
      currentColl = name;
      console.log(`  ${name}:`);
    }
    console.log(`    ${row.status}: ${row.count}`);
  }

  process.exit(0);
}

main();
