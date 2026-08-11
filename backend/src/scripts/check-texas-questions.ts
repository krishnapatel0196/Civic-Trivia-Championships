import 'dotenv/config';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select({
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      expiresAt: questions.expiresAt,
      topicId: questions.topicId,
      difficulty: questions.difficulty,
    })
    .from(questions)
    .where(sql`${questions.externalId} LIKE 'tex-%' AND ${questions.status} = 'draft'`)
    .orderBy(questions.externalId);

  const durable = rows.filter(r => r.expiresAt === null);
  const expiring = rows.filter(r => r.expiresAt !== null);

  console.log('Total draft questions:', rows.length);
  console.log('Durable (expiresAt: null):', durable.length);
  console.log('Expiring (expiresAt set):', expiring.length);
  console.log('');

  if (expiring.length > 0) {
    console.log('=== EXPIRING QUESTIONS ===');
    for (const r of expiring) {
      const opts = r.options as string[];
      const answer = opts[r.correctAnswer] ?? '?';
      console.log(`${r.externalId} | expiresAt: ${r.expiresAt} | ${r.text.substring(0, 90)}`);
      console.log(`   ANSWER: ${answer.substring(0, 80)}`);
    }
    console.log('');
  } else {
    console.log('!!! NO EXPIRING QUESTIONS FOUND - mixed-durability pattern may not have taken effect !!!');
    console.log('');
  }

  console.log('=== SAMPLE DURABLE QUESTIONS (first 25) ===');
  for (const r of durable.slice(0, 25)) {
    const opts = r.options as string[];
    const answer = opts[r.correctAnswer] ?? '?';
    console.log(`${r.externalId} | topicId:${r.topicId} | ${r.difficulty} | ${r.text.substring(0, 80)}`);
    console.log(`   ANSWER: ${answer.substring(0, 80)}`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
