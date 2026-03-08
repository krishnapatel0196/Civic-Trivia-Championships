import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { playerStats, playerPrefs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { supabaseAdmin } from '../config/supabase.js';

export const router = Router();

// Apply authentication to all profile routes
router.use(requireAuth);

/**
 * GET /identity - Return the authenticated user's UUID for cross-app identity debugging.
 * Used to verify the same user_id is seen by CTC and other Empowered platform apps.
 */
router.get('/identity', (req: Request, res: Response): void => {
  res.json({ user_id: req.userId });
});

/**
 * GET /admin-status - Check whether the current user is an admin/super-admin.
 * Returns { isAdmin: boolean, isSuperAdmin: boolean }.
 * Used by the frontend AdminGuard; does NOT require admin role itself.
 */
router.get('/admin-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await supabaseAdmin
      .from('admin_users')
      .select('super_admin')
      .eq('user_id', req.userId!)
      .maybeSingle();

    res.json({
      isAdmin: !!data,
      isSuperAdmin: data?.super_admin ?? false,
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

/**
 * GET / - Fetch profile stats
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [stats] = await db.select().from(playerStats).where(eq(playerStats.userId, userId));
    const [prefs] = await db.select().from(playerPrefs).where(eq(playerPrefs.userId, userId));

    const overallAccuracy =
      stats && stats.totalQuestions > 0
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
        : 0;

    res.json({
      gamesPlayed: stats?.gamesPlayed ?? 0,
      bestScore: stats?.bestScore ?? 0,
      overallAccuracy,
      timerMultiplier: prefs?.timerMultiplier ?? 1.0,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /settings - Update user settings (timer multiplier, etc.)
 */
router.patch('/settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { timerMultiplier } = req.body;

    const validMultipliers = [1.0, 1.5, 2.0];
    if (!timerMultiplier || !validMultipliers.includes(timerMultiplier)) {
      res.status(400).json({ error: 'Invalid timer multiplier. Must be 1.0, 1.5, or 2.0' });
      return;
    }

    await db
      .insert(playerPrefs)
      .values({ userId, timerMultiplier })
      .onConflictDoUpdate({ target: playerPrefs.userId, set: { timerMultiplier } });

    res.json({ timerMultiplier });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /xp/history - Proxy XP transaction history from the Empowered Accounts API.
 * Converts CTC page-based pagination (?page=N) to accounts API limit/offset.
 * Returns reshaped response with entries[], total, page, pageSize, totalPages.
 * Only accessible to authenticated users (requireAuth applied at router level).
 */
router.get('/xp/history', async (req: Request, res: Response): Promise<void> => {
  const accountsUrl = process.env.EMPOWERED_ACCOUNTS_URL;
  if (!accountsUrl) {
    res.status(503).json({ error: 'XP history service unavailable' });
    return;
  }

  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  try {
    const upstream = await fetch(
      `${accountsUrl}/api/xp/me/history?limit=${pageSize}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error(`[profile] XP history upstream returned ${upstream.status}: ${text}`);
      res.status(upstream.status === 401 ? 401 : 502).json({ error: 'Failed to fetch XP history' });
      return;
    }

    const data = await upstream.json() as {
      transactions: Array<{
        id: string;
        created_at: string;
        amount: number;
        is_duplicate?: boolean;
        metadata?: Record<string, unknown>;
      }>;
      total: number;
      limit: number;
      offset: number;
    };

    const totalPages = Math.ceil(data.total / pageSize);

    res.json({
      entries: data.transactions.map(tx => ({
        id: tx.id,
        createdAt: tx.created_at,
        amount: tx.amount,
        isDuplicate: tx.is_duplicate ?? false,
        score: (tx.metadata?.score as number | undefined) ?? null,
        correctAnswers: (tx.metadata?.correctAnswers as number | undefined) ?? null,
        collectionSlug: (tx.metadata?.collectionSlug as string | undefined) ?? null,
      })),
      total: data.total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err: any) {
    console.error('[profile] XP history fetch failed:', err?.message);
    res.status(502).json({ error: 'Failed to fetch XP history' });
  }
});
