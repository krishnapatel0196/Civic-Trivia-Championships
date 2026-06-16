---
phase: 78-pipeline-cron-worker-pool-regulation
plan: 01
subsystem: infra
tags: [drizzle-orm, international-pipeline, supabase, esm-guard]

requires:
  - phase: 77-rss-ingestion-claim-extraction-pipeline
    provides: run-pipeline.ts, question-generator.ts, claim-extractor.ts

provides:
  - volatility column on trivia.questions (DB + schema.ts)
  - reason column on trivia.generation_jobs (DB + schema.ts)
  - computeExpiresAt() exported from question-generator.ts
  - Volatility type exported from question-generator.ts
  - InternationalLocaleConfig interface exported from run-pipeline.ts
  - writePassingQuestions() accepts volatility and sets expiresAt on DB insert
  - runPipeline() accepts maxQuestions option with cluster slice cap
  - runPipeline() throws Error (not process.exit) on missing collection
  - ESM guard wraps CLI entry point — safe to import from pipelineCron.ts

affects: [78-02-plan, pipelineCron, poolRegulator]

tech-stack:
  added: []
  patterns: [ESM main-module guard pattern, volatility-driven expiresAt computation]

key-files:
  created: []
  modified:
    - backend/src/db/schema.ts
    - backend/src/scripts/international/question-generator.ts
    - backend/src/scripts/international/run-pipeline.ts

key-decisions:
  - "volatility default is 'fast' — existing CLI usage unaffected"
  - "maxQuestions defaults to undefined (no cap) for backward-compatible CLI usage"
  - "computeExpiresAt uses midpoint of each volatility band: fast=4d, medium=10d, slow=60d, stable=180d"

patterns-established:
  - "ESM import guard: process.argv[1] === fileURLToPath(import.meta.url) pattern"

duration: 5min
completed: 2026-04-09
---

# Plan 78-01: Schema DDL + Generator Foundations Summary

**Volatility-driven expiresAt computation and maxQuestions cap wired into the international pipeline, with ESM import guard enabling safe import from pipelineCron.ts**

## Performance
- **Duration:** 5min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Applied DDL: `volatility text` column on `trivia.questions`, `reason text` column on `trivia.generation_jobs`
- Backfilled existing generation_job_id rows (0 rows needed — no prior international questions)
- Exported `Volatility` type and `computeExpiresAt()` from question-generator.ts
- Updated `writePassingQuestions()` to accept `volatility` param — now sets `expiresAt = computeExpiresAt(volatility)` and `volatility` on every DB insert
- Added `InternationalLocaleConfig` interface to run-pipeline.ts for pipelineCron use
- `runPipeline()` now accepts `volatility` (default `'fast'`) and `maxQuestions` options
- `limitedClusters = clusters.slice(0, maxQuestions)` applied before generation loop
- Fixed status string: `'completed'` → `'success'` in generation_jobs update
- Fixed collection-not-found: `process.exit(1)` → `throw new Error(...)` inside `runPipeline()`
- ESM `isDirectRun` guard wraps CLI entry point — file can now be safely imported

## Task Commits
1. **Task 1: Apply DDL and update schema.ts** - `f1483d9` (feat)
2. **Task 2: computeExpiresAt, volatility threading, maxQuestions cap, ESM guard** - `35ad255` (feat)
**Plan metadata:** `[hash]` (docs)

## Files Created/Modified
- `backend/src/db/schema.ts` - Added `volatility` (questions) and `reason` (generationJobs) fields
- `backend/src/scripts/international/question-generator.ts` - Added Volatility type, computeExpiresAt(), updated writePassingQuestions signature and DB insert
- `backend/src/scripts/international/run-pipeline.ts` - Added InternationalLocaleConfig, maxQuestions cap via limitedClusters, ESM guard, 'success' status fix, throw on missing collection

## Decisions Made
- **volatility default is 'fast'** — existing CLI usage (`npx tsx run-pipeline.ts`) unaffected; backward compatible
- **maxQuestions defaults to undefined (no cap)** — backward-compatible CLI behavior preserved
- **computeExpiresAt uses midpoint of each volatility band:** fast=4d, medium=10d, slow=60d, stable=180d
- **parseArgs process.exit calls retained** — they live in `parseArgs()` which is only called from the `isDirectRun` guard block, so they never fire during import

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
Plan 78-02 (poolRegulator + pipelineCron + server wiring) can now proceed — all schema and generator prerequisites are in place.
