import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { normalizeText } from '../services/qualityRules/rules/duplicate.js';

async function main() {
  const allCols = await db
    .select({ id: collections.id, slug: collections.slug })
    .from(collections);

  let anyDups = false;

  for (const col of allCols) {
    const links = await db
      .select({ questionId: collectionQuestions.questionId })
      .from(collectionQuestions)
      .where(eq(collectionQuestions.collectionId, col.id));

    if (!links.length) continue;

    const qs = await db
      .select({
        externalId: questions.externalId,
        text: questions.text,
        status: questions.status,
      })
      .from(questions)
      .where(inArray(questions.id, links.map(l => l.questionId)));

    const active = qs.filter(q => q.status === 'active');

    const groups = new Map<string, typeof active>();
    for (const q of active) {
      const key = normalizeText(q.text);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }

    const dups = [...groups.entries()].filter(([, g]) => g.length > 1);

    if (dups.length > 0) {
      anyDups = true;
      console.log(`${col.slug}: ${dups.length} ACTIVE duplicate groups!`);
      for (const [, group] of dups) {
        console.log(`  ${group.map(q => q.externalId).join(', ')} — ${group[0].text}`);
      }
    } else {
      console.log(`${col.slug}: ${active.length} active — CLEAN`);
    }
  }

  if (!anyDups) {
    console.log('\nAll 6 collections clean — zero active duplicates!');
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
