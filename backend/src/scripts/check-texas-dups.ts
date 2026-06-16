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
    })
    .from(questions)
    .where(sql`${questions.externalId} LIKE 'tex-%' AND ${questions.status} = 'draft'`)
    .orderBy(questions.externalId);

  // Check for near-duplicate texts
  console.log('=== tex-003 vs tex-004 ===');
  const t3 = rows.find(r => r.externalId === 'tex-003');
  const t4 = rows.find(r => r.externalId === 'tex-004');
  if (t3) console.log('tex-003:', t3.text);
  if (t4) console.log('tex-004:', t4.text);
  
  console.log('\n=== tex-018 vs tex-087 ===');
  const t18 = rows.find(r => r.externalId === 'tex-018');
  const t87 = rows.find(r => r.externalId === 'tex-087');
  if (t18) console.log('tex-018:', t18.text, '| expiresAt:', t18.expiresAt);
  if (t87) console.log('tex-087:', t87.text, '| expiresAt:', t87.expiresAt);
  
  console.log('\n=== tex-029 vs tex-003 (140-day questions) ===');
  const t29 = rows.find(r => r.externalId === 'tex-029');
  const t30 = rows.find(r => r.externalId === 'tex-030');
  if (t29) console.log('tex-029:', t29.text);
  if (t30) console.log('tex-030:', t30.text);

  // Show all 140-day related questions
  console.log('\n=== All "140" questions ===');
  const filtered = rows.filter(r => r.text.includes('140'));
  for (const r of filtered) {
    const opts = r.options as string[];
    console.log(`${r.externalId}: ${r.text}`);
    console.log(`   Answer: ${opts[r.correctAnswer]}`);
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
