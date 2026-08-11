/**
 * Feedback service for question flagging
 * Handles creation and deletion of flags with transactional flag_count updates
 */

import { db } from '../db/index.js';
import { questionFlags, questions } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Create a flag for a question (idempotent)
 * If flag already exists, returns existing flag without error
 * @param userId - User ID creating the flag
 * @param questionId - Question ID being flagged
 * @param sessionId - Game session ID where flag was created
 * @returns Object with created status and flag ID
 */
export async function createFlag(
  userId: string,  // UUID — references public.users(id) on shared Supabase project
  questionId: number,
  sessionId: string
): Promise<{ created: boolean; flagId: number }> {
  return await db.transaction(async (tx) => {
    // Attempt insert with onConflictDoNothing
    const insertResult = await tx
      .insert(questionFlags)
      .values({
        userId,
        questionId,
        sessionId,
        reasons: null,
        elaborationText: null,
      })
      .onConflictDoNothing()
      .returning({ id: questionFlags.id });

    // If insert returned a row, flag was created (increment flag_count)
    if (insertResult.length > 0) {
      await tx
        .update(questions)
        .set({
          flagCount: sql`${questions.flagCount} + 1`,
        })
        .where(eq(questions.id, questionId));

      return { created: true, flagId: insertResult[0].id };
    }

    // Flag already exists - find existing flag ID
    const existingFlag = await tx
      .select({ id: questionFlags.id })
      .from(questionFlags)
      .where(
        and(
          eq(questionFlags.userId, userId),
          eq(questionFlags.questionId, questionId)
        )
      )
      .limit(1);

    return { created: false, flagId: existingFlag[0].id };
  });
}

/**
 * Delete a flag for a question
 * @param userId - User ID removing the flag
 * @param questionId - Question ID being unflagged
 * @returns True if flag was deleted, false if no flag existed
 */
export async function deleteFlag(
  userId: string,  // UUID — references public.users(id) on shared Supabase project
  questionId: number
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Delete flag and return if row existed
    const deleteResult = await tx
      .delete(questionFlags)
      .where(
        and(
          eq(questionFlags.userId, userId),
          eq(questionFlags.questionId, questionId)
        )
      )
      .returning({ id: questionFlags.id });

    // If row was deleted, decrement flag_count (prevent negative with GREATEST)
    if (deleteResult.length > 0) {
      await tx
        .update(questions)
        .set({
          flagCount: sql`GREATEST(${questions.flagCount} - 1, 0)`,
        })
        .where(eq(questions.id, questionId));

      return true;
    }

    return false;
  });
}

/**
 * Update elaborations (reasons and text) for multiple flagged questions
 * All updates happen in a single transaction (all-or-nothing)
 * @param userId - User ID updating their flags
 * @param sessionId - Game session ID for context
 * @param elaborations - Array of elaborations to update
 * @returns Count of flags actually updated
 */
export async function updateFlagElaborations(
  userId: string,  // UUID — references public.users(id) on shared Supabase project
  sessionId: string,
  elaborations: Array<{
    questionId: string;  // externalId
    reasons: string[];
    elaborationText: string;
  }>
): Promise<number> {
  return await db.transaction(async (tx) => {
    let updatedCount = 0;

    for (const elaboration of elaborations) {
      // Look up question by externalId
      const question = await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.externalId, elaboration.questionId))
        .limit(1);

      if (question.length === 0) {
        throw new Error(`Question not found: ${elaboration.questionId}`);
      }

      const questionId = question[0].id;

      // Update the questionFlags row
      const updateResult = await tx
        .update(questionFlags)
        .set({
          reasons: elaboration.reasons.length > 0 ? elaboration.reasons : null,
          elaborationText: elaboration.elaborationText.trim() || null,
        })
        .where(
          and(
            eq(questionFlags.userId, userId),
            eq(questionFlags.questionId, questionId),
            eq(questionFlags.sessionId, sessionId)
          )
        )
        .returning({ id: questionFlags.id });

      if (updateResult.length > 0) {
        updatedCount++;
      }
    }

    return updatedCount;
  });
}
