/**
 * Check all collections in the database for duplicate question text.
 * Reports any questions that share normalized text within the same collection.
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { normalizeText } from '../services/qualityRules/rules/duplicate.js';

async function main() {
  // Get all collections
  const allCols = await db
    .select({ id: collections.id, slug: collections.slug, name: collections.name })
    .from(collections);

  console.log('=== Database Duplicate Check ===\n');

  let totalDuplicates = 0;
  let totalConflicts = 0;

  for (const col of allCols) {
    // Get all question IDs for this collection
    const links = await db
      .select({ questionId: collectionQuestions.questionId })
      .from(collectionQuestions)
      .where(eq(collectionQuestions.collectionId, col.id));

    if (links.length === 0) {
      console.log(`${col.slug} (${col.name}): 0 questions\n`);
      continue;
    }

    const qIds = links.map(l => l.questionId);
    const qs = await db
      .select({
        id: questions.id,
        externalId: questions.externalId,
        text: questions.text,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        status: questions.status,
      })
      .from(questions)
      .where(inArray(questions.id, qIds));

    // Group by normalized text
    const groups = new Map<string, typeof qs>();
    for (const q of qs) {
      const key = normalizeText(q.text);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }

    const duplicateGroups = [...groups.entries()].filter(([, g]) => g.length > 1);
    const activeQuestions = qs.filter(q => q.status === 'active');

    console.log(`${col.slug} (${col.name}): ${qs.length} total questions (${activeQuestions.length} active)`);

    if (duplicateGroups.length === 0) {
      console.log(`  No duplicates found.\n`);
      continue;
    }

    for (const [normText, group] of duplicateGroups) {
      totalDuplicates++;
      const answers = group.map(q => {
        const opts = q.options as string[];
        return opts[q.correctAnswer]?.toLowerCase().trim();
      });
      const uniqueAnswers = new Set(answers);
      const hasConflict = uniqueAnswers.size > 1;
      if (hasConflict) totalConflicts++;

      console.log(`  ${hasConflict ? 'CONFLICT' : 'DUPLICATE'}: "${group[0].text}"`);
      for (const q of group) {
        const opts = q.options as string[];
        console.log(`    ${q.externalId} [${q.status}] → "${opts[q.correctAnswer]}"`);
      }
    }
    console.log('');
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total duplicate groups: ${totalDuplicates}`);
  console.log(`Total conflicts (different answers): ${totalConflicts}`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
