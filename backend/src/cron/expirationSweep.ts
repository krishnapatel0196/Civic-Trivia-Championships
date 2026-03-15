import { db } from '../db/index.js';
import { questions, collectionQuestions, collections } from '../db/schema.js';
import { eq, and, lte, gt, isNotNull, sql } from 'drizzle-orm';
import { generateReplacement } from './replacementGenerator.js';

/**
 * Expiration sweep job
 *
 * Finds newly expired questions and updates their status to 'expired'
 * After each archival, attempts to generate a replacement question
 * Logs expiring-soon questions (within 30 days) for monitoring
 * Outputs structured JSON logs for observability
 */
export async function runExpirationSweep(): Promise<void> {
  const startTime = Date.now();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    // Find newly expired questions (expires_at <= now AND status = 'active')
    // Join collectionQuestions + collections to resolve collection context for replacement generation
    const expiredRows = await db
      .select({
        id: questions.id,
        externalId: questions.externalId,
        expiresAt: questions.expiresAt,
        subcategory: questions.subcategory,
        collectionId: collectionQuestions.collectionId,
        collectionSlug: collections.slug,
      })
      .from(questions)
      .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
      .innerJoin(collections, eq(collections.id, collectionQuestions.collectionId))
      .where(
        and(
          isNotNull(questions.expiresAt),
          lte(questions.expiresAt, now),
          eq(questions.status, 'active')
        )
      );

    // Deduplicate by question id — a question in multiple collections appears as multiple rows;
    // only the first collection encountered is used for replacement generation
    const seen = new Set<number>();
    const expiredQuestions = expiredRows.filter(row => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    // Replacement tracking counters
    let replacedCount = 0;
    let skippedCount = 0;

    // Update each newly expired question
    for (const question of expiredQuestions) {
      const historyEntry = {
        action: 'expired' as const,
        timestamp: now.toISOString(),
        previousExpiresAt: question.expiresAt?.toISOString()
      };

      // CRITICAL: Archive FIRST, then attempt replacement
      await db
        .update(questions)
        .set({
          status: 'expired',
          expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`
        })
        .where(eq(questions.id, question.id));

      // Log expired question
      console.log(JSON.stringify({
        level: 'warn',
        job: 'expiration-sweep',
        message: 'Question expired',
        questionId: question.id,
        externalId: question.externalId,
        expiresAt: question.expiresAt?.toISOString()
      }));

      // Attempt replacement generation (never-throw — always returns result)
      const result = await generateReplacement(
        question.id,
        question.externalId,
        question.subcategory,
        question.collectionSlug,
        question.collectionId,
      );

      if (result.replaced) {
        replacedCount++;
        console.log(JSON.stringify({
          level: 'info',
          job: 'expiration-sweep',
          message: 'Replacement generated',
          questionId: question.id,
          externalId: question.externalId,
          collectionSlug: question.collectionSlug,
          topic: question.subcategory,
        }));
      } else {
        skippedCount++;
        console.log(JSON.stringify({
          level: 'warn',
          job: 'expiration-sweep',
          message: 'Replacement skipped',
          questionId: question.id,
          externalId: question.externalId,
          collectionSlug: question.collectionSlug,
          topic: question.subcategory,
          reason: result.reason,
        }));
      }
    }

    // Find expiring-soon questions (expires_at > now AND expires_at <= now + 30 days AND status = 'active')
    const expiringSoonQuestions = await db
      .select({
        id: questions.id,
        externalId: questions.externalId,
        expiresAt: questions.expiresAt
      })
      .from(questions)
      .where(
        and(
          isNotNull(questions.expiresAt),
          gt(questions.expiresAt, now),
          lte(questions.expiresAt, thirtyDaysFromNow),
          eq(questions.status, 'active')
        )
      );

    // Log expiring-soon questions
    for (const question of expiringSoonQuestions) {
      const daysUntilExpiry = question.expiresAt
        ? Math.ceil((question.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      console.log(JSON.stringify({
        level: 'info',
        job: 'expiration-sweep',
        message: 'Question expiring soon',
        questionId: question.id,
        externalId: question.externalId,
        expiresAt: question.expiresAt?.toISOString(),
        daysUntilExpiry
      }));
    }

    // Log sweep summary
    const durationMs = Date.now() - startTime;
    console.log(JSON.stringify({
      level: 'info',
      job: 'expiration-sweep',
      message: 'Sweep complete',
      newlyExpiredCount: expiredQuestions.length,
      replacedCount,
      skippedCount,
      expiringSoonCount: expiringSoonQuestions.length,
      durationMs
    }));

  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      job: 'expiration-sweep',
      message: 'Sweep failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }));
  }
}
