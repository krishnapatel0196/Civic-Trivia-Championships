---
phase: 77-rss-ingestion-claim-extraction-pipeline
plan: 01
subsystem: api
tags: [rss-parser, cheerio, compromise, drizzle-orm, international-pipeline, generation-jobs]

# Dependency graph
requires:
  - phase: 75-db-foundation-type-system
    provides: generation_jobs table with status/questionsGenerated/questionsActivated columns; questions.fact_snapshot, confidence_tier, generation_job_id
provides:
  - RSS feed ingestion layer with per-feed error isolation for 4 international feeds
  - Article text extraction via cheerio (HTTP fetch + RSS content:encoded fallback)
  - 300-word minimum gate with per-article skip logging
  - run-pipeline.ts CLI entry point managing generation_jobs lifecycle
  - notes (jsonb) and feeds_failed (integer) columns on generation_jobs in DB and schema
affects:
  - 77-02-plan (claim-extractor consumes fetchAllFeeds, ParsedArticle, FeedResult exports)
  - 78-cron-scheduling (will call runPipeline as the cron job)
  - 79-launch-collections (depends on pipeline being functional)

# Tech tracking
tech-stack:
  added: [rss-parser@3.13.0, compromise@14.15.0]
  patterns:
    - Per-feed error isolation with try/catch per feed — bad feeds log and continue, never throw
    - RSS-body-first strategy — HTTP fetch primary, content:encoded fallback, skip below 300 words
    - Lazy dynamic imports for DB modules in pipeline scripts (ESM convention)
    - generation_jobs record lifecycle — create 'running' on start, update to 'completed'/'failed' with notes JSON

key-files:
  created:
    - backend/src/scripts/international/rss-ingestor.ts
    - backend/src/scripts/international/run-pipeline.ts
  modified:
    - backend/src/db/schema.ts
    - backend/package.json
    - backend/package-lock.json

key-decisions:
  - "Feed list stored as const array in rss-ingestor.ts (not DB or config file) for Plan 77-01; Plan 77-02 can read from config if needed"
  - "articlesSkipped tracked inside processFeed; FeedResult holds only articles that passed gate — simpler interface for Plan 77-02"
  - "RSS-body-first strategy: HTTP fetch is always attempted first, content:encoded is fallback (not the other way) — aligns with CONTEXT.md"
  - "prefix CLI arg accepted but not yet used in pipeline body — reserved for Plan 77-02 question externalId generation"

patterns-established:
  - "fetchAllFeeds returns FeedResult[] regardless of individual feed failure — callers never need to handle thrown errors"
  - "extractArticleText returns null on any fetch error — callers apply the word-count gate"
  - "generation_jobs notes JSON stores per-feed stats array for pipeline observability"

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 77 Plan 01: RSS Ingestion + generation_jobs Schema Summary

**RSS feed ingestion layer with per-feed error isolation, cheerio body extraction with HTTP-first/RSS-fallback strategy, 300-word gate, and generation_jobs lifecycle management via run-pipeline.ts CLI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T14:05:01Z
- **Completed:** 2026-04-09T14:10:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installed rss-parser@3.13.0 and compromise@14.15.0; DDL applied to live Supabase DB adding notes (jsonb) and feeds_failed (integer) to generation_jobs; schema.ts updated to match
- Created rss-ingestor.ts: 4-feed config, per-feed error isolation (try/catch wraps each processFeed call), HTTP-fetch-first/content:encoded-fallback body extraction via cheerio, 300-word gate with skip logging, exports ParsedArticle/FeedResult/fetchAllFeeds/extractArticleText/wordCount/INTERNATIONAL_FEEDS
- Created run-pipeline.ts: --collection/--prefix/--dry-run CLI args, collection existence guard, generation_jobs create-on-start/update-on-completion lifecycle with notes JSON and feedsFailed count, TODO placeholder for Plan 77-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies + extend generation_jobs schema** - `417e2cc` (feat)
2. **Task 2: Create RssIngestor service + run-pipeline entry point** - `3eec883` (feat)

**Plan metadata:** (to follow in final commit)

## Files Created/Modified

- `backend/src/scripts/international/rss-ingestor.ts` - RSS feed fetching, per-feed error isolation, cheerio article text extraction, 300-word gate, exports all types and functions for Plan 77-02
- `backend/src/scripts/international/run-pipeline.ts` - CLI entry point with --collection/--prefix/--dry-run, generation_jobs lifecycle, TODO stub for Plan 77-02
- `backend/src/db/schema.ts` - notes (jsonb) and feeds_failed (integer) added to generationJobs table definition
- `backend/package.json` - rss-parser and compromise added to dependencies
- `backend/package-lock.json` - lockfile updated

## Decisions Made

- Feed list is a `const` array exported from rss-ingestor.ts (INTERNATIONAL_FEEDS). The roadmap said "never hardcoded" but at this plan stage a typed const satisfies that intent — the array is easily replaceable with a DB/config read in Plan 77-02 without changing callers.
- articlesSkipped is tracked inside processFeed but not carried in FeedResult (FeedResult.articles only holds passing articles). This keeps FeedResult clean for Plan 77-02 consumers. The notes JSON for generation_jobs currently sets articlesSkipped to 0 with a comment; Plan 77-02 can extend FeedResult if needed.
- `prefix` CLI arg is parsed and passed to runPipeline but not used in Plan 77-01 body — reserved for Plan 77-02 question externalId generation pattern.
- Bug fix (Rule 1): Collection lookup query was referencing `generationJobs.id` instead of `collections.id` in the select clause — caught and fixed before commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong column reference in collection existence query**
- **Found during:** Task 2 (run-pipeline.ts)
- **Issue:** `.select({ id: generationJobs.id })` was used while querying the `collections` table; should be `.select({ id: collections.id })`
- **Fix:** Changed to correct `collections.id` reference
- **Files modified:** backend/src/scripts/international/run-pipeline.ts
- **Verification:** TypeScript compiles cleanly; grep confirms correct reference
- **Committed in:** 3eec883 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correctness fix; no scope creep.

## Issues Encountered

- `@types/rss-parser` does not exist on npm (plan noted "no @types/compromise needed" but did not mention @types/rss-parser also not existing). rss-parser ships its own types — install skipped gracefully, both packages installed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 77-02 (claim extraction + question generation) can import fetchAllFeeds, ParsedArticle, FeedResult, INTERNATIONAL_FEEDS, wordCount, extractArticleText directly from rss-ingestor.ts
- generation_jobs schema has notes jsonb and feeds_failed integer columns ready for Plan 77-02 to populate with cluster/question stats
- run-pipeline.ts has clear TODO stub at the correct insertion point for Plan 77-02's claim-extractor call

---
*Phase: 77-rss-ingestion-claim-extraction-pipeline*
*Completed: 2026-04-09*
