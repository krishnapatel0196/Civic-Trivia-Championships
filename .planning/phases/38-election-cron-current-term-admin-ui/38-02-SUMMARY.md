---
phase: 38-election-cron-current-term-admin-ui
plan: 02
subsystem: api
tags: [election, current-term, admin, claude-api, drizzle, zod, express]

# Dependency graph
requires:
  - phase: 38-election-cron-current-term-admin-ui
    provides: electionDetection.ts with lastCronRun export (Plan 01)
  - phase: 37-election-question-generation-script
    provides: ElectionQuestionGenerator.ts with getEndOfDayUTC, resolveCollectionAndTopic, generateElectionQuestions
provides:
  - CurrentTermQuestionGenerator service (generateCurrentTermQuestions, FollowupBlockedError, CurrentTermResult)
  - GET /election-races/classified — three-tab lifecycle view with cronLastRun
  - GET /election-races/:id/question-count — active/draft counts for confirm modal
  - POST /election-races/:id/enter-result — enter winner + trigger current-term generation
  - POST /election-races/:id/regenerate — destructive re-generate (archive active, delete draft)
  - PUT /election-races/:id — partial race update
  - DELETE /election-races/:id — remove race (questions get null FK)
affects:
  - 38-03 (admin UI — Plan 03 calls all 6 of these endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FollowupBlockedError idempotency pattern (mirror of GenerationBlockedError)
    - classified endpoint with N+1-safe batch GROUP BY question count query
    - Destructive regenerate: archive active + delete draft + reset flag + regenerate
    - Strict priority classification: awaiting-followup > active > pending

key-files:
  created:
    - backend/src/services/generation/CurrentTermQuestionGenerator.ts
  modified:
    - backend/src/routes/admin.ts

key-decisions:
  - "CurrentTermQuestionGenerator uses same pattern as ElectionQuestionGenerator (imports getEndOfDayUTC, resolveCollectionAndTopic)"
  - "classified endpoint registered BEFORE catch-all GET /election-races to prevent Express :id param match"
  - "Awaiting Follow-up classification: election_date < now AND followup_generated = FALSE (regardless of questions_generated)"
  - "Regenerate resolves collection slug from collections.name = race.jurisdiction (same approach as cron)"
  - "PUT /election-races/:id uses partial patch pattern — only updates fields present in body"

patterns-established:
  - "FollowupBlockedError: extends Error with raceId property, 409 on repeat call"
  - "elc-term-{raceId}-{seq} external ID format for current-term questions (distinct from elc- campaign questions)"
  - "classified endpoint returns questionCount per race via Map from single GROUP BY query"

# Metrics
duration: 22min
completed: 2026-02-26
---

# Phase 38 Plan 02: CurrentTermQuestionGenerator + Admin Election Lifecycle Endpoints Summary

**CurrentTermQuestionGenerator service generating 6 post-election "Who is the current [seat]?" questions with term-end expiry, plus 6 new admin endpoints covering the full election lifecycle (classified tabs, question counts, result entry, regenerate, update, delete)**

## Performance

- **Duration:** 22 min
- **Started:** 2026-02-26T22:00:00Z
- **Completed:** 2026-02-26T22:22:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CurrentTermQuestionGenerator service with idempotency guard (FollowupBlockedError → 409), term-end expiresAt via getEndOfDayUTC, elc-term- external IDs, followupGenerated=true + result=winnerName after generation
- GET /election-races/classified with strict priority classification and N+1-safe batch question count query
- POST /election-races/:id/enter-result wired to generateCurrentTermQuestions with Zod validation
- POST /election-races/:id/regenerate with archive-active/delete-draft/reset-flag/regenerate destructive flow
- PUT /election-races/:id partial update and DELETE /election-races/:id with FK set-null cascade

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CurrentTermQuestionGenerator service** - `508d1c0` (feat)
2. **Task 2: Add 6 admin API endpoints for election lifecycle** - `951baaa` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `backend/src/services/generation/CurrentTermQuestionGenerator.ts` - Post-election current-term question generator service; exports generateCurrentTermQuestions, CurrentTermResult, FollowupBlockedError
- `backend/src/routes/admin.ts` - Added 6 election lifecycle endpoints + enterResultSchema + updateRaceSchema + new imports (lt, CurrentTermQuestionGenerator, lastCronRun)

## Decisions Made

- `classified` route registered BEFORE `GET /election-races` catch-all — Express would match "/classified" as `:id` param if placed after
- Classification priority: awaiting-followup (past date, no followup) takes precedence over all other states; complete races (followupGenerated=true) excluded from all tabs
- Regenerate endpoint resolves collection slug from `collections.name = race.jurisdiction` — same pattern used by the cron job
- PUT endpoint uses partial patch (only update keys present in body) rather than full replacement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All backend endpoints ready for Plan 03 (admin election UI three-tab component)
- CurrentTermQuestionGenerator imports getEndOfDayUTC and resolveCollectionAndTopic from ElectionQuestionGenerator — no circular dependency
- lastCronRun imported from electionDetection.ts — resolves as long as Plan 01 and Plan 02 are both deployed together
- TypeScript compiles cleanly (zero errors)

---
*Phase: 38-election-cron-current-term-admin-ui*
*Completed: 2026-02-26*
