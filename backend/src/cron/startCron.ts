import cron from 'node-cron';
import { runExpirationSweep } from './expirationSweep.js';
import { runElectionDetection } from './electionDetection.js';
import { runPipelineCron } from './pipelineCron.js';

/**
 * Start the expiration cron job
 *
 * Runs at minute 0 of every hour (e.g., 1:00, 2:00, 3:00)
 * Finds expired questions and updates their status
 */
export function startExpirationCron(): void {
  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    await runExpirationSweep();
  });

  console.log('Expiration cron job registered (runs hourly at :00)');
}

/**
 * Start the election detection cron job.
 *
 * Runs daily at 6:00 AM Eastern Time.
 * Detects races within 60 days of election day that need question generation
 * and triggers generateElectionQuestions automatically.
 */
export function startElectionDetectionCron(): void {
  cron.schedule('0 6 * * *', async () => {
    await runElectionDetection();
  }, { timezone: 'America/New_York' });

  console.log('Election detection cron registered (runs daily at 6:00 AM Eastern)');
}

/**
 * Start the international pipeline cron job.
 *
 * Runs daily at 2:00 AM Eastern Time.
 * Processes each registered International collection: pool regulation then generation.
 */
export function startPipelineCron(): void {
  cron.schedule('0 2 * * *', async () => {
    await runPipelineCron();
  }, { timezone: 'America/New_York' });

  console.log('Pipeline cron registered (runs daily at 2:00 AM Eastern)');
}
