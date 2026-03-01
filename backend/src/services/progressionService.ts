/**
 * Progression service - XP and gems calculation
 * Handles rewards calculation and user stats updates after game completion
 */

import { User } from '../models/User.js';
import { supabaseAdmin } from '../config/supabase.js';
import { db } from '../db/index.js';
import { playerStats } from '../db/schema.js';
import { sql } from 'drizzle-orm';

/**
 * Calculate XP and gems earned based on game performance
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total questions in the game
 * @returns XP and gems earned
 */
export function calculateProgression(
  correctAnswers: number,
  totalQuestions: number
): { xpEarned: number; gemsEarned: number } {
  // XP formula: 50 base + 1 per correct answer
  const xpEarned = 50 + correctAnswers;

  // Gems formula: 10 base + 1 per correct answer
  const gemsEarned = 10 + correctAnswers;

  return { xpEarned, gemsEarned };
}

/**
 * Update user progression after game completion
 * Calculates rewards and atomically updates user stats
 * @param userId - User ID
 * @param score - Total score achieved
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total questions in the game
 * @returns XP and gems earned
 * @deprecated GEMS-03: Legacy progression for integer users. UUID users use awardPlatformGems + upsertPlayerStats. Remove in Phase 44.
 */
export async function updateUserProgression(
  userId: number,
  score: number,
  correctAnswers: number,
  totalQuestions: number
): Promise<{ xpEarned: number; gemsEarned: number }> {
  // Calculate progression rewards
  const { xpEarned, gemsEarned } = calculateProgression(correctAnswers, totalQuestions);

  // Update user stats atomically
  await User.updateStats(userId, xpEarned, gemsEarned, score, correctAnswers, totalQuestions);

  return { xpEarned, gemsEarned };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 200
): Promise<{ success: true; result: T } | { success: false; error: string }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { success: true, result };
    } catch (err: any) {
      if (attempt === maxAttempts) {
        return { success: false, error: err?.message || String(err) };
      }
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
  return { success: false, error: 'Exhausted retries' };
}

// ---------------------------------------------------------------------------
// Platform integration functions
// ---------------------------------------------------------------------------

/**
 * Check Connected tier status and account standing via the Empowered accounts API.
 * Falls back to safe defaults (isConnected: false, isSuspended: false) on any error
 * so anonymous / unverifiable sessions are handled gracefully.
 *
 * @param accessToken - Raw JWT forwarded to the accounts API
 * @returns Tier and standing flags
 */
export async function checkAccountContext(
  accessToken: string
): Promise<{ isConnected: boolean; isSuspended: boolean }> {
  const accountsUrl = process.env.EMPOWERED_ACCOUNTS_URL;
  if (!accountsUrl) {
    console.warn('[progressionService] EMPOWERED_ACCOUNTS_URL not set — falling back to defaults');
    return { isConnected: false, isSuspended: false };
  }
  try {
    const resp = await fetch(`${accountsUrl}/api/account/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      console.warn(`[progressionService] accounts API returned ${resp.status}`);
      return { isConnected: false, isSuspended: false };
    }
    const data = await resp.json() as { tier?: string; account_standing?: string };
    return {
      isConnected: data.tier === 'connected' || data.tier === 'empowered',
      isSuspended: data.account_standing === 'suspended',
    };
  } catch (err: any) {
    console.warn('[progressionService] accounts API call failed:', err?.message);
    return { isConnected: false, isSuspended: false };
  }
}

/**
 * Award platform gems to a Connected-tier user via the award_gems RPC.
 * Uses (supabaseAdmin as any).rpc to avoid cross-schema TypeScript type error.
 * Retries up to 3 times with exponential backoff. Never throws — returns a result object.
 *
 * @param userId - UUID of the user to award gems to
 * @param amount - Number of gems to award
 * @returns confirmed: true on success, confirmed: false with error on failure
 */
export async function awardPlatformGems(
  userId: string,
  amount: number
): Promise<{ confirmed: boolean; error?: string }> {
  const result = await withRetry(async () => {
    const { error } = await (supabaseAdmin as any).rpc('award_gems', {
      p_user_id: userId,
      p_gem_type: 'yellow',
      p_amount: amount,
      p_reason: 'game_completed',
      p_source: 'civic_trivia',
    });
    if (error) throw new Error(error.message);
  });
  if (result.success) {
    return { confirmed: true };
  } else {
    console.error(`[progressionService] award_gems failed after retries: ${result.error}`);
    return { confirmed: false, error: result.error };
  }
}

/**
 * Upsert per-game stats into trivia.player_stats for a Connected-tier user.
 * Uses Drizzle onConflictDoUpdate so the first game inserts a row and subsequent
 * games accumulate deltas. current_streak and best_streak are initialized to 1
 * as a Phase 42 placeholder — real day-streak logic is deferred to a future phase.
 * Never throws — errors are logged and swallowed.
 *
 * @param userId - UUID of the user
 * @param score - Total score for this game
 * @param correctAnswers - Number of correct answers
 * @param totalQuestionsPlayed - Total questions in this game
 * @param gemsConfirmed - Gems confirmed as awarded (0 if RPC failed)
 */
export async function upsertPlayerStats(
  userId: string,
  score: number,
  correctAnswers: number,
  totalQuestionsPlayed: number,
  gemsConfirmed: number
): Promise<void> {
  try {
    await db
      .insert(playerStats)
      .values({
        userId,
        gamesPlayed: 1,
        bestScore: score,
        totalCorrect: correctAnswers,
        totalQuestions: totalQuestionsPlayed,
        totalXp: correctAnswers,
        lifetimeGems: gemsConfirmed,
        currentStreak: 1, // Phase 42 placeholder — real day-streak logic deferred to future phase
        bestStreak: 1,    // Phase 42 placeholder — real day-streak logic deferred to future phase
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: playerStats.userId,
        set: {
          gamesPlayed: sql`${playerStats.gamesPlayed} + 1`,
          bestScore: sql`GREATEST(${playerStats.bestScore}, ${score})`,
          totalCorrect: sql`${playerStats.totalCorrect} + ${correctAnswers}`,
          totalQuestions: sql`${playerStats.totalQuestions} + ${totalQuestionsPlayed}`,
          totalXp: sql`${playerStats.totalXp} + ${correctAnswers}`,
          lifetimeGems: sql`${playerStats.lifetimeGems} + ${gemsConfirmed}`,
          updatedAt: new Date(),
        },
      });
  } catch (err: any) {
    console.error(`[progressionService] upsertPlayerStats failed for ${userId}:`, err?.message);
  }
}
