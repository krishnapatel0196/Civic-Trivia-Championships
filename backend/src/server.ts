// Load environment variables FIRST
import './env.js';

import express, { Request, Response } from 'express';
import cors from 'cors';
import { router as gameRouter } from './routes/game.js';
import { router as profileRouter } from './routes/profile.js';
import { router as healthRouter } from './routes/health.js';
import { router as adminRouter } from './routes/admin.js';
import feedbackRouter from './routes/feedback.js';
import { router as leaderboardRouter } from './routes/leaderboard.js';
import { storageFactory } from './config/redis.js';
import { initializeSessionManager } from './services/sessionService.js';
import { startExpirationCron, startElectionDetectionCron, startPipelineCron } from './cron/startCron.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [FRONTEND_URL, process.env.FRONTEND_URL_ALT].filter((o): o is string => !!o);

/**
 * Start server with async initialization
 * Ensures storage is initialized before accepting requests
 */
async function startServer() {
  // Initialize storage (Redis or Memory fallback)
  await storageFactory.initialize();

  // Initialize session manager with storage backend
  initializeSessionManager(storageFactory.getStorage());

  // Start expiration cron job
  startExpirationCron();

  // Start election detection cron job
  startElectionDetectionCron();

  // Start international pipeline cron job
  startPipelineCron();

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow any localhost origin in development (Vite port changes)
      if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) return callback(null, true);
      // Allow configured origins
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));
  app.use(express.json());

  // Health check endpoint
  app.use('/health', healthRouter);

  // Game routes
  app.use('/api/game', gameRouter);

  // Profile routes
  app.use('/api/users/profile', profileRouter);

  // Admin routes
  app.use('/api/admin', adminRouter);

  // Feedback routes
  app.use('/api/feedback', feedbackRouter);

  // Leaderboard routes (public — no auth required)
  app.use('/api/leaderboard', leaderboardRouter);

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`CORS enabled for: ${FRONTEND_URL}`);
    console.log(`Storage: ${storageFactory.isDegradedMode() ? 'in-memory (degraded)' : 'Redis'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
