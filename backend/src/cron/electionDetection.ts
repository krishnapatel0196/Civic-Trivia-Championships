import { db } from '../db/index.js';
import { electionRaces, collections } from '../db/schema.js';
import { and, eq, lte, gte } from 'drizzle-orm';
import {
  generateElectionQuestions,
  GenerationBlockedError,
} from '../services/generation/ElectionQuestionGenerator.js';

// ─── Exported types ───────────────────────────────────────────────────────────

export interface CronRunSummary {
  timestamp: string;
  racesDetected: number;
  processed: number;
  failures: number;
  failureDetails: Array<{ raceId: number; seat: string; error: string }>;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

/**
 * Last cron run summary. Null until the cron has run at least once.
 * Consumed by the admin API endpoint (Plan 02) for the banner.
 */
export let lastCronRun: CronRunSummary | null = null;

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the election detection cron job.
 *
 * Queries all election races where questions have not yet been generated
 * and the election date falls within the next 60 days. For each race,
 * resolves the collection slug from the jurisdiction name, then calls
 * generateElectionQuestions with force: false (idempotent).
 *
 * Failed races are retried up to 3 times; remaining races always continue.
 * GenerationBlockedError is treated as an idempotent skip (not a failure).
 * Updates lastCronRun in-memory state after every run (success or failure).
 */
export async function runElectionDetection(): Promise<void> {
  const startTime = Date.now();
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const failureDetails: Array<{ raceId: number; seat: string; error: string }> = [];
  let processed = 0;

  try {
    // Query races needing generation within the 60-day window
    const races = await db
      .select()
      .from(electionRaces)
      .where(
        and(
          eq(electionRaces.questionsGenerated, false),
          gte(electionRaces.electionDate, now),
          lte(electionRaces.electionDate, sixtyDaysFromNow)
        )
      );

    const racesDetected = races.length;

    if (racesDetected === 0) {
      console.log(JSON.stringify({
        level: 'info',
        job: 'election-detection',
        message: 'No upcoming elections requiring generation',
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }));

      lastCronRun = {
        timestamp: new Date().toISOString(),
        racesDetected: 0,
        processed: 0,
        failures: 0,
        failureDetails: [],
      };
      return;
    }

    console.log(JSON.stringify({
      level: 'info',
      job: 'election-detection',
      message: 'Races detected for generation',
      racesDetected,
      timestamp: new Date().toISOString(),
    }));

    // Process each race
    for (const race of races) {
      // Step 1: Resolve collection slug from jurisdiction name
      const [collectionRow] = await db
        .select({ slug: collections.slug })
        .from(collections)
        .where(eq(collections.name, race.jurisdiction))
        .limit(1);

      if (!collectionRow) {
        const errorMsg = `No collection found matching jurisdiction '${race.jurisdiction}'`;
        console.log(JSON.stringify({
          level: 'error',
          job: 'election-detection',
          message: 'Collection lookup failed — skipping race',
          raceId: race.id,
          seat: race.seat,
          jurisdiction: race.jurisdiction,
          error: errorMsg,
        }));
        failureDetails.push({ raceId: race.id, seat: race.seat, error: errorMsg });
        continue;
      }

      const collectionSlug = collectionRow.slug;

      // Step 2: Attempt generation with up to 3 retries
      let attempt = 0;
      let succeeded = false;

      while (attempt < 3 && !succeeded) {
        attempt++;
        try {
          await generateElectionQuestions(race.id, collectionSlug, { force: false });
          processed++;
          succeeded = true;

          console.log(JSON.stringify({
            level: 'info',
            job: 'election-detection',
            message: 'Questions generated successfully',
            raceId: race.id,
            seat: race.seat,
            collectionSlug,
            attempt,
          }));
        } catch (err) {
          // GenerationBlockedError = race already processed (idempotent skip, not failure)
          if (err instanceof GenerationBlockedError) {
            console.log(JSON.stringify({
              level: 'warn',
              job: 'election-detection',
              message: 'Race already processed — skipping (idempotent)',
              raceId: race.id,
              seat: race.seat,
              detail: err.message,
            }));
            succeeded = true; // treat as success — do not retry, do not count as failure
            break;
          }

          const errMsg = err instanceof Error ? err.message : String(err);

          if (attempt < 3) {
            console.log(JSON.stringify({
              level: 'warn',
              job: 'election-detection',
              message: 'Generation attempt failed — retrying',
              raceId: race.id,
              seat: race.seat,
              attempt,
              error: errMsg,
            }));
          } else {
            // Final attempt failed
            console.log(JSON.stringify({
              level: 'error',
              job: 'election-detection',
              message: 'Generation failed after 3 attempts — skipping race',
              raceId: race.id,
              seat: race.seat,
              error: errMsg,
            }));
            failureDetails.push({ raceId: race.id, seat: race.seat, error: errMsg });
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    lastCronRun = {
      timestamp,
      racesDetected,
      processed,
      failures: failureDetails.length,
      failureDetails,
    };

    console.log(JSON.stringify({
      level: 'info',
      job: 'election-detection',
      message: 'Election detection complete',
      racesDetected,
      processed,
      failures: failureDetails.length,
      failureDetails,
      durationMs,
      timestamp,
    }));
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const errMsg = error instanceof Error ? error.message : String(error);

    console.log(JSON.stringify({
      level: 'error',
      job: 'election-detection',
      message: 'Election detection job failed (top-level error)',
      error: errMsg,
      stack: error instanceof Error ? error.stack : undefined,
      durationMs,
      timestamp,
    }));

    // Update lastCronRun to reflect the failure so admin banner shows something
    lastCronRun = {
      timestamp,
      racesDetected: 0,
      processed,
      failures: failureDetails.length + 1,
      failureDetails: [
        ...failureDetails,
        { raceId: -1, seat: 'unknown', error: errMsg },
      ],
    };
  }
}
