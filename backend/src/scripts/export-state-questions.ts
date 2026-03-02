// One-time script: Export active state questions from DB to JSON data files.
//
// Usage:
//   npx tsx src/scripts/export-state-questions.ts
//
// Run from backend/ directory. Requires DATABASE_URL in .env.
//
// Creates:
//   src/data/indiana-state-questions.json
//   src/data/california-state-questions.json

import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions, topics } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { LocaleConfig } from './content-generation/locale-configs/bloomington-in.js';
import { indianaConfig } from './content-generation/locale-configs/state-configs/indiana-state.js';
import { californiaConfig } from './content-generation/locale-configs/state-configs/california-state.js';

interface StateExportConfig {
  collectionSlug: string;
  outputFile: string;
  localeConfig: LocaleConfig;
}

const states: StateExportConfig[] = [
  { collectionSlug: 'indiana-state', outputFile: 'indiana-state-questions.json', localeConfig: indianaConfig },
  { collectionSlug: 'california-state', outputFile: 'california-state-questions.json', localeConfig: californiaConfig },
];

async function exportCollection(config: StateExportConfig): Promise<void> {
  console.log(`\nExporting ${config.collectionSlug}...`);

  // Look up collection
  const [collection] = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.slug, config.collectionSlug))
    .limit(1);

  if (!collection) {
    console.warn(`  Collection "${config.collectionSlug}" not found — skipping`);
    return;
  }

  // Use topic definitions from the state config (authoritative source)
  const topicDefs = config.localeConfig.topicCategories;
  console.log(`  Topics: ${topicDefs.length}`);

  // Load question IDs linked to this collection
  const questionLinks = await db
    .select({ questionId: collectionQuestions.questionId })
    .from(collectionQuestions)
    .where(eq(collectionQuestions.collectionId, collection.id));

  if (questionLinks.length === 0) {
    console.warn(`  No questions linked to collection — skipping`);
    return;
  }

  const questionIds = questionLinks.map(l => l.questionId);

  // Load questions (only active ones)
  const rows = await db
    .select({
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      topicId: questions.topicId,
      subcategory: questions.subcategory,
      source: questions.source,
      expiresAt: questions.expiresAt,
      status: questions.status,
    })
    .from(questions)
    .where(inArray(questions.id, questionIds));

  // Filter to active only
  const activeRows = rows.filter(r => r.status === 'active');
  console.log(`  Total questions: ${rows.length}, Active: ${activeRows.length}`);

  // Build topic ID → slug mapping
  const allTopics = await db
    .select({ id: topics.id, slug: topics.slug })
    .from(topics);
  const topicIdToSlug = new Map(allTopics.map(t => [t.id, t.slug]));

  // Format questions to match locale JSON structure
  const exportedQuestions = activeRows.map(row => ({
    externalId: row.externalId,
    text: row.text,
    options: row.options,
    correctAnswer: row.correctAnswer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    topicCategory: row.subcategory || topicIdToSlug.get(row.topicId!) || 'unknown',
    source: row.source,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }));

  // Sort by externalId for stable output
  exportedQuestions.sort((a, b) => a.externalId.localeCompare(b.externalId));

  const output = {
    topics: topicDefs.map(t => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
    })),
    questions: exportedQuestions,
  };

  const outPath = join(process.cwd(), 'src/data', config.outputFile);
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`  Written: ${outPath}`);
  console.log(`  Topics: ${output.topics.length}, Questions: ${output.questions.length}`);
}

async function main(): Promise<void> {
  console.log('Export State Questions to JSON Data Files');
  console.log('=========================================');

  for (const state of states) {
    await exportCollection(state);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
