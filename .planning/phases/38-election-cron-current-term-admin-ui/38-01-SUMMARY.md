---
phase: 38-election-cron-current-term-admin-ui
plan: 01
subsystem: infra
tags: [cron, node-cron, drizzle-orm, election, question-generation, automation]

# Dependency graph
requires:
  - phase: 37-election-question-generation-script
    provides: generateElectionQuestions() service and GenerationBlockedError from ElectionQuestionGenerator.ts
provides:
  - Daily 6 AM Eastern election detection cron job (runElectionDetection)
  - CronRunSummary interface and lastCronRun in-memory state for admin banner (Plan 02/03 consume this)
  - startElectionDetectionCron() registered at server startup alongside startExpirationCron()
affects:
  - 38-02 (admin API reads lastCronRun for banner)
  - 38-03 (admin UI displays CronRunSummary data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-race retry loop (up to 3 attempts) with continue-on-failure for remaining races
    - GenerationBlockedError treated as idempotent skip (not failure) from cron context
    - In-memory lastCronRun state pattern for admin banner data (no DB needed for status)
    - Jurisdiction-to-collection-slug resolution via collections.name = race.jurisdiction lookup
    - Structured JSON logging matching expirationSweep.ts pattern (console.log(JSON.stringify({...})))

key-files:
  created:
    - backend/src/cron/electionDetection.ts
  modified:
    - backend/src/cron/startCron.ts
    - backend/src/server.ts
    - backend/src/scripts/create-test-race.ts

key-decisions:
  - "Collection slug resolved from jurisdiction via collections.name = race.jurisdiction (not from race itself)"
  - "GenerationBlockedError is idempotent skip — cron running twice never counts as a failure"
  - "Missing collection for a jurisdiction is a permanent failure (no retry) — logged and skipped"
  - "lastCronRun exported as module-level mutable let — avoids DB round-trip for admin banner"

patterns-established:
  - "Cron module pattern: runXxx() + lastXxxRun state + startXxxCron() registration — mirrors expirationSweep"
  - "Top-level try/catch in cron jobs ensures process stability regardless of DB or API failures"

# Metrics
duration: 4min
completed: 2026-02-26
---

# Phase 38 Plan 01: Election Detection Cron Summary

**Daily 6 AM Eastern cron that auto-discovers election races within 60 days, resolves collection slugs, calls generateElectionQuestions with retry and GenerationBlockedError as idempotent skip, exports lastCronRun state for admin banner**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-26T22:14:42Z
- **Completed:** 2026-02-26T22:18:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `electionDetection.ts` cron module with full retry logic, GenerationBlockedError handling, structured logging, and lastCronRun in-memory state
- Registered `startElectionDetectionCron()` in `startCron.ts` scheduling `runElectionDetection` at `0 6 * * *` with `timezone: 'America/New_York'`
- Wired `startElectionDetectionCron()` into `server.ts` startup alongside the existing `startExpirationCron()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create electionDetection.ts cron module** - `8a5e4b2` (feat)
2. **Task 2: Register election detection cron in startCron.ts and server.ts** - `7a98c10` (feat)

## Files Created/Modified
- `backend/src/cron/electionDetection.ts` - Election detection cron: runElectionDetection(), CronRunSummary, lastCronRun exports
- `backend/src/cron/startCron.ts` - Added startElectionDetectionCron() export with 6 AM Eastern schedule
- `backend/src/server.ts` - Added import and call to startElectionDetectionCron() at startup
- `backend/src/scripts/create-test-race.ts` - Auto-fixed missing required candidate fields (party, incumbent)

## Decisions Made
- Collection slug resolved via `collections.name = race.jurisdiction` lookup — cron doesn't have slug context, must derive from DB
- `GenerationBlockedError` treated as idempotent skip: cron running twice for same race is expected and not an error
- Missing collection for a jurisdiction is a hard skip with no retry — a missing collection won't be fixed by retrying, needs admin intervention
- `lastCronRun` stored as module-level `let` (not DB) — simple, low-latency access for admin banner; reset on each run

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed create-test-race.ts missing required candidate fields**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `create-test-race.ts` used `candidates: [{ name: 'Kerry Thomson' }, ...]` missing `party` and `incumbent` fields required by the schema type, causing TypeScript compilation failure that blocked clean `tsc --noEmit`
- **Fix:** Added `party: ''` and `incumbent: false` to both candidate objects in the script
- **Files modified:** `backend/src/scripts/create-test-race.ts`
- **Verification:** `npx tsc --noEmit` passes with zero errors after fix
- **Committed in:** `8a5e4b2` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in pre-existing untracked script)
**Impact on plan:** Required for clean TypeScript compilation. No scope creep.

## Issues Encountered
None — plan executed cleanly after the pre-existing TypeScript error in `create-test-race.ts` was fixed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `runElectionDetection()` and `lastCronRun` are ready for Plan 02 (admin API endpoint exposing cron status)
- `CronRunSummary` interface exported and typed — Plan 02 can import it directly for response typing
- Both crons registered at startup: expiration sweep (hourly) and election detection (daily 6 AM Eastern)

---
*Phase: 38-election-cron-current-term-admin-ui*
*Completed: 2026-02-26*
