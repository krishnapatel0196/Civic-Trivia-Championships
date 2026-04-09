/**
 * Pipeline Cron Orchestrator
 *
 * Runs once per nightly invocation. Iterates all registered International
 * collections, applies pool regulation, then calls runPipeline() for each.
 *
 * Per-collection isolation: each collection runs in its own try/catch.
 * One collection failing does not block the others.
 *
 * One generation_jobs row is written per collection per run (by run-pipeline.ts).
 * For skipped collections, this module writes the row directly.
 *
 * Auto-throttle: if a collection has > 20 draft (status='draft') questions,
 * skip the entire collection for this run — no RSS fetch, no Claude calls.
 *
 * Hard cap: maxQuestions: 8 is passed to runPipeline() on every call.
 */

import { db } from '../db/index.js';
import { generationJobs, questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { regulatePool } from './poolRegulator.js';
import { runPipeline, type InternationalLocaleConfig } from '../scripts/international/run-pipeline.js';

// ─── Registered International Collections ────────────────────────────────────
// Phase 79 will add war-in-iran and climate-agreements entries here.

const INTERNATIONAL_COLLECTIONS: InternationalLocaleConfig[] = [
  // { collectionSlug: 'war-in-iran', prefix: 'wiran', volatility: 'fast' },
  // { collectionSlug: 'climate-agreements', prefix: 'clima', volatility: 'medium' },
];

const DRAFT_THROTTLE_LIMIT = 20;
const MAX_QUESTIONS_PER_RUN = 8;

export async function runPipelineCron(): Promise<void> {
  const startTime = Date.now();
  console.log(`[pipelineCron] Starting nightly run — ${INTERNATIONAL_COLLECTIONS.length} collection(s)`);

  if (INTERNATIONAL_COLLECTIONS.length === 0) {
    console.log('[pipelineCron] No International collections registered — skipping run');
    return;
  }

  for (const config of INTERNATIONAL_COLLECTIONS) {
    const { collectionSlug, prefix, volatility } = config;
    console.log(`[pipelineCron] Processing: ${collectionSlug}`);

    try {
      // ── Resolve collection ID ──────────────────────────────────────────────
      const [collectionRow] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, collectionSlug))
        .limit(1);

      if (!collectionRow) {
        console.error(`[pipelineCron] Collection not found in DB: ${collectionSlug} — skipping`);
        continue;
      }

      const collectionId = collectionRow.id;

      // ── Auto-throttle: check draft count ───────────────────────────────────
      const draftCountResult = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(questions)
        .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
        .where(
          and(
            eq(collectionQuestions.collectionId, collectionId),
            eq(questions.status, 'draft'),
          ),
        );

      const draftCount = draftCountResult[0]?.count ?? 0;

      if (draftCount > DRAFT_THROTTLE_LIMIT) {
        console.log(
          `[pipelineCron] Throttle: ${collectionSlug} has ${draftCount} drafts > ${DRAFT_THROTTLE_LIMIT} — skipping`,
        );

        await db.insert(generationJobs).values({
          collectionSlug,
          status: 'skipped',
          questionsGenerated: 0,
          questionsFlagged: 0,
          questionsActivated: 0,
          feedsFailed: 0,
          reason: `auto-throttle: ${draftCount} pending review questions exceeds limit of ${DRAFT_THROTTLE_LIMIT}`,
        });

        continue;
      }

      // ── Pool regulation (before generation) ───────────────────────────────
      const regulationResult = await regulatePool(collectionId);
      if (regulationResult.archivedCount > 0) {
        console.log(
          `[pipelineCron] Regulated pool for ${collectionSlug}: archived ${regulationResult.archivedCount}, now ${regulationResult.currentEventsCount} current-events questions`,
        );
      }

      // ── Run pipeline (handles its own generation_jobs row) ─────────────────
      await runPipeline(collectionSlug, prefix, { volatility, maxQuestions: MAX_QUESTIONS_PER_RUN });

      console.log(`[pipelineCron] Completed: ${collectionSlug}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[pipelineCron] Error processing ${collectionSlug}: ${errorMsg}`);

      try {
        await db.insert(generationJobs).values({
          collectionSlug,
          status: 'failed',
          questionsGenerated: 0,
          questionsFlagged: 0,
          questionsActivated: 0,
          feedsFailed: 0,
          reason: errorMsg.slice(0, 500),
        });
      } catch (jobErr) {
        console.error(`[pipelineCron] Could not write failed job row for ${collectionSlug}:`, jobErr);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[pipelineCron] Nightly run complete in ${durationMs}ms`);
}
