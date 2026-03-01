import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import bcrypt from 'bcrypt';
import { fileTypeFromBuffer } from 'file-type';
import { join, extname } from 'path';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateNameValidation, updatePasswordValidation } from '../utils/validation.js';
import { User } from '../models/User.js';
import { db } from '../db/index.js';
import { playerStats, playerPrefs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const router = Router();

// Ensure uploads directory exists
const UPLOAD_DIR = './uploads/avatars';
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueName = randomUUID() + extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter for MIME type validation
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// Apply authentication to all profile routes
router.use(authenticateToken);

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
 * PATCH /name - Update display name
 */
router.patch('/name', updateNameValidation, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Phase 43: legacy integer cast until profile routes are replaced
    const userId = req.userId! as unknown as number;
    const { name } = req.body;

    await User.updateName(userId, name);

    res.json({ name });
  } catch (error) {
    console.error('Error updating name:', error);
    res.status(500).json({ error: 'Failed to update name' });
  }
});

/**
 * PATCH /password - Change password (requires current password verification)
 */
router.patch('/password', updatePasswordValidation, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Phase 43: legacy integer cast until profile routes are replaced
    const userId = req.userId! as unknown as number;
    const { currentPassword, newPassword } = req.body;

    // Fetch user to get current password hash
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password with cost 12 (matching authController)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await User.updatePassword(userId, hashedPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

/**
 * POST /avatar - Upload avatar image with magic byte validation
 */
router.post(
  '/avatar',
  upload.single('avatar'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Magic byte validation
      const buffer = readFileSync(req.file.path);
      const fileType = await fileTypeFromBuffer(buffer);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!fileType || !allowedTypes.includes(fileType.mime)) {
        // Delete the uploaded file
        unlinkSync(req.file.path);
        res.status(400).json({
          error: 'Invalid file type. File content does not match allowed image types.',
        });
        return;
      }

      // Construct avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user's avatar URL in database
      // Phase 43: legacy integer cast until profile routes are replaced
      const userId = req.userId! as unknown as number;
      await User.updateAvatarUrl(userId, avatarUrl);

      res.json({ avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);

      // Clean up file if it exists
      if (req.file && existsSync(req.file.path)) {
        unlinkSync(req.file.path);
      }

      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

// Multer error handler
router.use((error: Error, _req: Request, res: Response, _next: any) => {
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large (max 5MB)' });
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Only one file allowed' });
      return;
    }
  }

  if (error.message.includes('Invalid file type')) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Upload error' });
});
