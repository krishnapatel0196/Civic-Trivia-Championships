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

  console.log('=== COMPLETE QUESTION LIST ===');
  console.log(`Total: ${rows.length}`);
  console.log('');
  for (const r of rows) {
    const opts = r.options as string[];
    const answer = opts[r.correctAnswer] ?? '?';
    const exp = r.expiresAt ? `EXPIRING(${new Date(r.expiresAt).toISOString().slice(0, 10)})` : 'DURABLE';
    console.log(`${r.externalId} | ${exp} | topicId:${r.topicId} | ${r.difficulty}`);
    console.log(`  Q: ${r.text}`);
    console.log(`  A: ${answer}`);
    console.log('');
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
