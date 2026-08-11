/**
 * Dry-run + archive questions in the Los Angeles collection that mention "Bloomington".
 *
 * Usage:
 *   npx tsx src/scripts/archive-bloomington-from-la.ts          (dry run — show matches)
 *   npx tsx src/scripts/archive-bloomington-from-la.ts --archive (archive them)
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, inArray, and, ne } from 'drizzle-orm';

const DRY_RUN = !process.argv.includes('--archive');

function mentionsBloomington(q: { text: string; options: string[]; explanation: string }): boolean {
  const target = 'bloomington';
  if (q.text.toLowerCase().includes(target)) return true;
  if (q.explanation?.toLowerCase().includes(target)) return true;
  if (q.options?.some(o => o.toLowerCase().includes(target))) return true;
  return false;
}

async function main() {
  // Find LA collection
  const [laCollection] = await db
    .select({ id: collections.id, name: collections.name, slug: collections.slug })
    .from(collections)
    .where(eq(collections.slug, 'los-angeles-ca'));

  if (!laCollection) {
    console.error('ERROR: Los Angeles collection not found (slug: los-angeles)');
    process.exit(1);
  }

  console.log(`Collection: ${laCollection.name} (id: ${laCollection.id})\n`);

  // Get all question IDs in the LA collection
  const links = await db
    .select({ questionId: collectionQuestions.questionId })
    .from(collectionQuestions)
    .where(eq(collectionQuestions.collectionId, laCollection.id));

  const qIds = links.map(l => l.questionId);
  console.log(`Total questions in collection: ${qIds.length}`);

  // Fetch all non-archived questions in the collection
  const allQuestions = await db
    .select({
      id: questions.id,
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      explanation: questions.explanation,
      status: questions.status,
    })
    .from(questions)
    .where(and(inArray(questions.id, qIds), ne(questions.status, 'archived')));

  // Filter to those that mention Bloomington
  const matches = allQuestions.filter(mentionsBloomington);

  console.log(`Active/draft questions mentioning Bloomington: ${matches.length}\n`);

  if (matches.length === 0) {
    console.log('Nothing to archive.');
    process.exit(0);
  }

  for (const q of matches) {
    const where = [
      q.text.toLowerCase().includes('bloomington') ? 'text' : null,
      q.explanation?.toLowerCase().includes('bloomington') ? 'explanation' : null,
      q.options?.some(o => o.toLowerCase().includes('bloomington')) ? 'options' : null,
    ].filter(Boolean).join(', ');

    console.log(`  [${q.status}] ${q.externalId}`);
    console.log(`  Found in: ${where}`);
    console.log(`  "${q.text.slice(0, 110)}${q.text.length > 110 ? '…' : ''}"`);
    console.log();
  }

  if (DRY_RUN) {
    console.log(`DRY RUN — ${matches.length} question(s) would be archived.`);
    console.log('Run with --archive to apply.');
    process.exit(0);
  }

  // Archive: set status = 'archived' on all matching IDs
  const ids = matches.map(q => q.id);
  await db
    .update(questions)
    .set({ status: 'archived' })
    .where(inArray(questions.id, ids));

  console.log(`✓ Archived ${ids.length} question(s).`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
