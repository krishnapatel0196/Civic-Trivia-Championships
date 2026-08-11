/**
 * One-off: list all tex- questions with full options for curation review.
 */
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
      subcategory: questions.subcategory,
      expiresAt: questions.expiresAt,
      status: questions.status,
    })
    .from(questions)
    .where(sql`${questions.externalId} LIKE 'tex-%'`)
    .orderBy(questions.externalId);

  console.log(`Total tex- questions: ${rows.length}\n`);
  for (const r of rows) {
    const expires = r.expiresAt ? `expires:${r.expiresAt.toString().slice(0, 10)}` : 'durable';
    console.log(`${r.externalId} [${r.status}][${expires}][${r.subcategory}]`);
    console.log(`  Q: ${r.text}`);
    const opts = r.options as string[];
    opts.forEach((o, i) => {
      const marker = i === (r.correctAnswer as number) ? '* ' : '  ';
      console.log(`  ${marker}${i}: ${o}`);
    });
    console.log('');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
