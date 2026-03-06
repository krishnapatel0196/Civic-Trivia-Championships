/**
 * Progression service - XP and gems calculation
 * Handles rewards calculation and user stats updates after game completion
 */

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
    const { error } = await (supabaseAdmin as any).schema('connect').rpc('credit_gems', {
      p_user_id: userId,
      p_gem_type: 'yellow',
      p_amount: amount,
      p_transaction_type: 'game_completed',
      p_source_ref: 'civic_trivia',
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

// ---------------------------------------------------------------------------
// Platform XP integration (Phase 53)
// ---------------------------------------------------------------------------

export interface XpAwardResult {
  confirmed: boolean;
  isDuplicate?: boolean;
  transactionId?: string;
  amount?: number;
  level?: number;
  totalXp?: number;
  xpInLevel?: number;
  xpToNextLevel?: number;
  error?: string;
}

/**
 * Calculate XP to award based on game performance.
 * Range: 50 XP (0/10 correct) → 200 XP (10/10 correct)
 *
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total questions in the game
 * @returns XP amount to award (50–200)
 */
export function calculateXpAmount(correctAnswers: number, totalQuestions: number): number {
  const BASE_XP = 50;
  const VARIABLE_XP = 150;
  const scoreRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  return BASE_XP + Math.round(scoreRatio * VARIABLE_XP);
}
// Range: 50 XP (0/10 correct) → 200 XP (10/10 correct)

/**
 * Award platform XP to a Connected-tier user via the Empowered Accounts XP award API.
 * Uses withRetry for resilience. Never throws — returns a result object.
 * Idempotent: same idempotencyKey returns is_duplicate: true with no double-award.
 *
 * @param userId - UUID of the user to award XP to
 * @param amount - XP amount to award
 * @param idempotencyKey - Unique key to prevent double-awards (use ctc-game-{sessionId}-{userId})
 * @returns XpAwardResult with confirmed flag and level metadata
 */
export async function awardPlatformXp(
  userId: string,
  amount: number,
  idempotencyKey: string
): Promise<XpAwardResult> {
  const accountsUrl = process.env.EMPOWERED_ACCOUNTS_API_URL;
  const serviceKey = process.env.TRIVIA_SERVICE_KEY;

  if (!accountsUrl || !serviceKey) {
    console.warn('[progressionService] EMPOWERED_ACCOUNTS_API_URL or TRIVIA_SERVICE_KEY not set — skipping XP award');
    return { confirmed: false, error: 'Missing env vars' };
  }

  const result = await withRetry(async () => {
    const resp = await fetch(`${accountsUrl}/api/xp/award`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': serviceKey,
      },
      body: JSON.stringify({
        user_id: userId,
        source: 'civic_trivia_championship_score',
        amount,
        idempotency_key: idempotencyKey,
        metadata: { game_id: idempotencyKey },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`XP award API returned ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<{
      transaction_id: string;
      amount: number;
      level: number;
      total_xp: number;
      xp_in_level: number;
      xp_to_next_level: number;
      is_duplicate: boolean;
    }>;
  });

  if (result.success) {
    const data = result.result;
    return {
      confirmed: true,
      isDuplicate: data.is_duplicate,
      transactionId: data.transaction_id,
      amount: data.amount,
      level: data.level,
      totalXp: data.total_xp,
      xpInLevel: data.xp_in_level,
      xpToNextLevel: data.xp_to_next_level,
    };
  } else {
    console.error(`[progressionService] awardPlatformXp failed after retries: ${result.error}`);
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
