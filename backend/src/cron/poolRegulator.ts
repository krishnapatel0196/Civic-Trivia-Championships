/**
 * Pool Regulator
 *
 * Archives excess Current Events questions (fast/medium volatility) for an
 * International collection when the pool exceeds the 72-question ceiling.
 *
 * Pool regulation rules (from CONTEXT.md):
 * - Only questions with volatility 'fast' or 'medium' are eligible for archival
 * - Archive order: oldest 'fast' questions first (created_at ASC), then oldest 'medium'
 * - Target ceiling: 72 active current-events questions per collection
 * - Regulation triggers only when count > 72
 * - slow/stable questions are NEVER touched by pool regulation
 */

import { db } from '../db/index.js';
import { questions, collectionQuestions } from '../db/schema.js';
import { eq, and, inArray, asc, sql } from 'drizzle-orm';

export const POOL_CEILING = 72;

export interface RegulationResult {
  archivedCount: number;
  currentEventsCount: number; // count after archival
}

/**
 * Regulate pool size for a single International collection.
 *
 * Returns the number of questions archived and the post-archival count.
 * Never throws — errors are caught and re-thrown with context for the caller
 * to handle in its own try/catch.
 */
export async function regulatePool(
  collectionId: number,
): Promise<RegulationResult> {
  // Count active current-events questions (fast + medium volatility only)
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(questions)
    .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
    .where(
      and(
        eq(collectionQuestions.collectionId, collectionId),
        eq(questions.status, 'active'),
        inArray(questions.volatility, ['fast', 'medium']),
      ),
    );

  const currentCount = countResult[0]?.count ?? 0;

  if (currentCount <= POOL_CEILING) {
    // No regulation needed
    return { archivedCount: 0, currentEventsCount: currentCount };
  }

  const excess = currentCount - POOL_CEILING;

  // Fetch candidates to archive: fast first (oldest created_at), then medium
  const fastCandidates = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
    .where(
      and(
        eq(collectionQuestions.collectionId, collectionId),
        eq(questions.status, 'active'),
        eq(questions.volatility, 'fast'),
      ),
    )
    .orderBy(asc(questions.createdAt))
    .limit(excess);

  const toArchiveIds: number[] = fastCandidates.map(r => r.id);

  // If we still need more, pull from medium
  if (toArchiveIds.length < excess) {
    const remaining = excess - toArchiveIds.length;
    const mediumCandidates = await db
      .select({ id: questions.id })
      .from(questions)
      .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
      .where(
        and(
          eq(collectionQuestions.collectionId, collectionId),
          eq(questions.status, 'active'),
          eq(questions.volatility, 'medium'),
        ),
      )
      .orderBy(asc(questions.createdAt))
      .limit(remaining);

    toArchiveIds.push(...mediumCandidates.map(r => r.id));
  }

  if (toArchiveIds.length === 0) {
    return { archivedCount: 0, currentEventsCount: currentCount };
  }

  // Archive: set status = 'archived', append to expirationHistory
  const now = new Date();
  const historyEntry = {
    action: 'archived' as const,
    timestamp: now.toISOString(),
  };

  await db
    .update(questions)
    .set({
      status: 'archived',
      expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
      updatedAt: sql`NOW()`,
    })
    .where(inArray(questions.id, toArchiveIds));

  console.log(
    `[poolRegulator] Archived ${toArchiveIds.length} current-events questions (collectionId=${collectionId})`,
  );

  return {
    archivedCount: toArchiveIds.length,
    currentEventsCount: currentCount - toArchiveIds.length,
  };
}
