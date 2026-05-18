/**
 * Archive duplicate questions across ALL collections in the database.
 *
 * For each group of questions with identical normalized text within a collection,
 * keeps the first (lowest externalId) and archives the rest by setting status='archived'.
 *
 * Also handles:
 * - fre-009: WRONG answer (mayor chosen by council — incorrect post-2017)
 * - Federal near-duplicates (q069, q040, q111)
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { normalizeText } from '../services/qualityRules/rules/duplicate.js';

// Questions to force-archive regardless of duplicate detection
const FORCE_ARCHIVE: Record<string, string> = {
  'fre-009': 'WRONG ANSWER: says mayor chosen by council (incorrect post-2017)',
};

// For Federal near-duplicates: specific IDs to archive
const FEDERAL_ARCHIVE = new Set(['q069', 'q040', 'q111']);

async function main() {
  const allCols = await db
    .select({ id: collections.id, slug: collections.slug, name: collections.name })
    .from(collections);

  console.log('=== Archiving Duplicate Questions ===\n');

  let totalArchived = 0;

  for (const col of allCols) {
    // Get all question IDs for this collection
    const links = await db
      .select({ questionId: collectionQuestions.questionId })
      .from(collectionQuestions)
      .where(eq(collectionQuestions.collectionId, col.id));

    if (links.length === 0) continue;

    const qIds = links.map(l => l.questionId);
    const qs = await db
      .select({
        id: questions.id,
        externalId: questions.externalId,
        text: questions.text,
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

    const toArchive: string[] = [];

    // Handle force-archive IDs
    for (const q of qs) {
      if (FORCE_ARCHIVE[q.externalId] && q.status !== 'archived') {
        toArchive.push(q.externalId);
      }
    }

    // Handle federal near-duplicates
    if (col.slug === 'federal') {
      for (const q of qs) {
        if (FEDERAL_ARCHIVE.has(q.externalId) && q.status !== 'archived') {
          toArchive.push(q.externalId);
        }
      }
    }

    // For each duplicate group, keep the first by externalId sort, archive the rest
    for (const [, group] of groups) {
      if (group.length <= 1) continue;

      // Sort by externalId to keep the "original" (lowest ID)
      const sorted = [...group].sort((a, b) => a.externalId.localeCompare(b.externalId));

      // Keep the first, archive the rest (unless already archived)
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].status !== 'archived' && !toArchive.includes(sorted[i].externalId)) {
          toArchive.push(sorted[i].externalId);
        }
      }
    }

    if (toArchive.length === 0) {
      console.log(`${col.slug}: no duplicates to archive`);
      continue;
    }

    // Archive them
    const result = await db
      .update(questions)
      .set({ status: 'archived' })
      .where(inArray(questions.externalId, toArchive));

    console.log(`${col.slug}: archived ${toArchive.length} duplicate questions`);
    for (const id of toArchive.sort()) {
      const reason = FORCE_ARCHIVE[id] || (FEDERAL_ARCHIVE.has(id) ? 'Federal near-duplicate' : 'duplicate text');
      console.log(`  ${id} (${reason})`);
    }

    totalArchived += toArchive.length;
  }

  // Fix fre-091 topic category in DB
  console.log('\nFixing fre-091 topicCategory...');
  await db
    .update(questions)
    .set({ subcategory: 'city-government' })
    .where(eq(questions.externalId, 'fre-091'));
  console.log('  fre-091: budget-finance → city-government');

  console.log(`\n=== Done: ${totalArchived} questions archived ===`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
