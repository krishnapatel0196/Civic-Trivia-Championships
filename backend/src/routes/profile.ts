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
