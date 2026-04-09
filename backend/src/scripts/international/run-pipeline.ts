// Usage:
//   npx tsx src/scripts/international/run-pipeline.ts --collection world-news --prefix wrld
//   npx tsx src/scripts/international/run-pipeline.ts --collection world-news --prefix wrld --dry-run

import 'dotenv/config';
import { fetchAllFeeds, INTERNATIONAL_FEEDS, type FeedResult } from './rss-ingestor.js';
import { clusterArticles, extractClaim } from './claim-extractor.js';
import { generateQuestions, writePassingQuestions } from './question-generator.js';

// ─── CLI Argument Parsing ─────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  collection: string;
  prefix: string;
  dryRun: boolean;
} {
  const args = argv.slice(2);
  let collection = '';
  let prefix = '';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--collection' && args[i + 1]) {
      collection = args[++i];
    } else if (args[i] === '--prefix' && args[i + 1]) {
      prefix = args[++i];
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!collection) {
    console.error('Error: --collection <slug> is required');
    process.exit(1);
  }
  if (!prefix) {
    console.error('Error: --prefix <prefix> is required');
    process.exit(1);
  }

  return { collection, prefix, dryRun };
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runPipeline(
  collectionSlug: string,
  prefix: string,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  const { dryRun = false } = options;

  console.log(`[run-pipeline] Starting pipeline for collection: ${collectionSlug} (prefix: ${prefix})`);
  if (dryRun) {
    console.log('[run-pipeline] DRY RUN mode — no DB writes, no Claude calls');
  }

  // ── Lazy DB imports (ESM pattern) ────────────────────────────────────────
  const { db } = await import('../../db/index.js');
  const { generationJobs, collections } = await import('../../db/schema.js');
  const { eq, sql } = await import('drizzle-orm');

  // ── Verify collection exists ─────────────────────────────────────────────
  const [collection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, collectionSlug))
    .limit(1);

  if (!collection) {
    console.error(`[run-pipeline] Collection not found: ${collectionSlug}`);
    process.exit(1);
  }

  // ── Create generation_jobs record ────────────────────────────────────────
  let jobId: number | null = null;

  if (!dryRun) {
    const [job] = await db
      .insert(generationJobs)
      .values({
        collectionSlug,
        status: 'running',
        questionsGenerated: 0,
        questionsFlagged: 0,
        questionsActivated: 0,
        feedsFailed: 0,
      })
      .returning({ id: generationJobs.id });

    jobId = job.id;
    console.log(`[run-pipeline] Created generation_jobs record: id=${jobId}`);
  }

  // ── Fetch all feeds ──────────────────────────────────────────────────────
  let feedResults: FeedResult[] = [];
  let pipelineStatus: 'completed' | 'failed' = 'completed';

  try {
    feedResults = await fetchAllFeeds(INTERNATIONAL_FEEDS);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[run-pipeline] Fatal error during feed fetch: ${errorMsg}`);
    pipelineStatus = 'failed';
  }

  // ── Compute stats ────────────────────────────────────────────────────────
  const feedsFailed = feedResults.filter(r => r.error).length;
  const totalArticles = feedResults.reduce((sum, r) => sum + r.articles.length, 0);

  // Per-feed summary log
  for (const result of feedResults) {
    if (result.error) {
      console.log(`[${result.feedName}] FAILED (${result.feedUrl}): ${result.error}`);
    } else {
      console.log(`[${result.feedName}] ${result.articles.length} articles ready`);
    }
  }

  console.log(
    `[run-pipeline] Feed summary: ${feedResults.length} feeds, ${feedsFailed} failed, ${totalArticles} articles total`,
  );

  // ── Claim extraction + question generation ───────────────────────────────
  const allArticles = feedResults.flatMap(r => r.articles);
  const clusters = clusterArticles(allArticles);
  console.log(
    `[Pipeline] ${allArticles.length} articles → ${clusters.length} clusters after dedup`,
  );

  let lowConfidenceSkipped = 0;
  let totalGenerated = 0;
  let totalBlocked = 0;
  const blockReasons: string[] = [];

  if (!dryRun) {
    for (const cluster of clusters) {
      const claimResult = await extractClaim(cluster);
      if (!claimResult) {
        lowConfidenceSkipped++;
        continue;
      }

      const questions = await generateQuestions(claimResult);
      const passing = questions.filter(q => q.qualityGate.passed);
      const failing = questions.filter(q => !q.qualityGate.passed);

      totalBlocked += failing.length;
      blockReasons.push(...failing.map(q => q.qualityGate.reason));

      if (passing.length > 0 && jobId !== null) {
        const written = await writePassingQuestions(
          passing,
          claimResult,
          collection.id,
          jobId,
          prefix,
        );
        totalGenerated += written.length;
      }
    }
  } else {
    // Dry-run: cluster and log only — no Claude calls, no DB writes
    for (const cluster of clusters) {
      console.log(
        `[DryRun] Would process cluster: "${cluster.representativeTitle}" (${cluster.articles.length} articles)`,
      );
      totalGenerated += 1; // Estimate: 1 question per cluster in dry-run
    }
  }

  console.log(
    `[Pipeline] Run complete: ${totalGenerated} questions generated, ${totalBlocked} blocked, ${lowConfidenceSkipped} low-confidence skipped`,
  );

  // Build notes JSON for generation_jobs
  const notes = {
    feedStats: feedResults.map(r => ({
      feedUrl: r.feedUrl,
      articlesFound: r.articles.length,
      articlesSkipped: r.articlesSkipped,
      ...(r.error ? { error: r.error } : {}),
    })),
    clusters: clusters.length,
    lowConfidenceSkipped,
    questionsGenerated: totalGenerated,
    questionsBlocked: totalBlocked,
    blockReasons,
    ...(dryRun ? { dryRun: true } : {}),
  };

  // ── Update generation_jobs record ────────────────────────────────────────
  if (!dryRun && jobId !== null) {
    await db
      .update(generationJobs)
      .set({
        status: pipelineStatus,
        feedsFailed,
        questionsGenerated: totalGenerated,
        questionsFlagged: totalBlocked,
        questionsActivated: totalGenerated,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: notes as any,
        updatedAt: sql`NOW()`,
      })
      .where(eq(generationJobs.id, jobId));

    console.log(
      `[run-pipeline] Updated generation_jobs id=${jobId}: status=${pipelineStatus}, generated=${totalGenerated}, blocked=${totalBlocked}`,
    );
  }

  console.log('[run-pipeline] Pipeline complete.');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

const { collection, prefix, dryRun } = parseArgs(process.argv);
runPipeline(collection, prefix, { dryRun }).catch(err => {
  console.error('[run-pipeline] Unhandled error:', err);
  process.exit(1);
});
