---
phase: 78-pipeline-cron-worker-pool-regulation
plan: 02
subsystem: infra
tags: [node-cron, drizzle-orm, international-pipeline, pool-regulation]

requires:
  - phase: 78-pipeline-cron-worker-pool-regulation
    plan: 01
    provides: InternationalLocaleConfig, runPipeline() with volatility+maxQuestions, reason column on generationJobs

provides:
  - poolRegulator.ts — regulatePool() archives excess fast/medium questions to 72-question ceiling
  - pipelineCron.ts — runPipelineCron() orchestrates all International collections with throttle + isolation
  - startCron.ts — startPipelineCron() registered at 02:00 AM Eastern
  - server.ts — startPipelineCron() called on startup

affects: [79-launch-collections, 80-admin-visibility]

tech-stack:
  added: []
  patterns: [per-collection try/catch isolation, throttle-then-regulate-then-generate ordering]

key-files:
  created:
    - backend/src/cron/poolRegulator.ts
    - backend/src/cron/pipelineCron.ts
  modified:
    - backend/src/cron/startCron.ts
    - backend/src/server.ts

key-decisions:
  - "INTERNATIONAL_COLLECTIONS array is empty pending Phase 79 — correct by design"
  - "POOL_CEILING = 72 — archive down to 72 so post-generation pool stays ≤80"
  - "DRAFT_THROTTLE_LIMIT = 20 — matches CONTEXT.md requirement"
  - "MAX_QUESTIONS_PER_RUN = 8 — matches CONTEXT.md and plan requirement"

patterns-established:
  - "throttle check → pool regulation → pipeline call ordering for each collection"

duration: 3min
completed: 2026-04-09
---

# Plan 78-02: Pool Regulator + Pipeline Cron Summary

**Nightly node-cron worker at 02:00 AM Eastern orchestrates International collections with draft throttling, pool regulation to 72-question ceiling, and per-collection failure isolation.**

## Performance
- **Duration:** ~3 minutes
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `poolRegulator.ts` with `regulatePool(collectionId)` — archives oldest fast-then-medium questions when active count exceeds 72; exports `POOL_CEILING = 72` and `RegulationResult` interface
- Created `pipelineCron.ts` with `runPipelineCron()` — iterates `INTERNATIONAL_COLLECTIONS`, applies draft throttle check (> 20 drafts = skip with `generation_jobs` row written), runs pool regulation, then calls `runPipeline()` with `maxQuestions: 8`; each collection wrapped in its own try/catch for isolation; failed collections write their own `generation_jobs` row
- Updated `startCron.ts` — added `startPipelineCron()` function scheduling `runPipelineCron` at `0 2 * * *` in `America/New_York` timezone
- Updated `server.ts` — imported `startPipelineCron` and called it in `startServer()` after `startElectionDetectionCron()`
- Server startup confirms: "Pipeline cron registered (runs daily at 2:00 AM Eastern)"

## Task Commits
1. **Task 1: Create poolRegulator.ts** — `26bcb8b` (feat)
2. **Task 2: Create pipelineCron.ts, wire startCron.ts + server.ts** — `02244e9` (feat)

## Files Created/Modified
- `backend/src/cron/poolRegulator.ts` — created
- `backend/src/cron/pipelineCron.ts` — created
- `backend/src/cron/startCron.ts` — added `startPipelineCron()` export
- `backend/src/server.ts` — added `startPipelineCron` import and call

## Decisions Made

| Decision | Rationale |
|---|---|
| `INTERNATIONAL_COLLECTIONS` array is empty | Phase 79 registers actual collections — empty array is correct by design; cron logs "skipping" cleanly |
| `POOL_CEILING = 72` | Archive to 72 so post-generation pool stays ≤ 80 (at most 8 new questions generated per run) |
| `DRAFT_THROTTLE_LIMIT = 20` | Matches CONTEXT.md requirement; prevents Claude spend when reviewer queue is full |
| `MAX_QUESTIONS_PER_RUN = 8` | Hard cap per plan requirement; limits API spend per collection per run |
| Failed collection writes own `generation_jobs` row | Maintains audit trail even when pipeline throws; catch in outer block ensures this |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Phase 78 complete. Phases 79 (Launch Collections) and 80 (Admin Visibility) are unblocked and can execute in parallel.
