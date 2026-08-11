---
phase: 65-auto-regenerate-expired-questions
plan: 02
subsystem: cron
tags: [drizzle-orm, typescript, cron, expiration, replacement, anthropic]

# Dependency graph
requires:
  - phase: 65-01
    provides: generateReplacement() helper with never-throw pattern and ReplacementResult type
provides:
  - Expiration sweep cron integrated with replacement generation
  - Extended expiry query resolving subcategory, collectionId, collectionSlug via joins
  - Multi-collection dedup (Set-based) ensuring 1 replacement per expired question
  - Structured JSON logs for replacement success and skip-with-reason
  - Summary log with newlyExpiredCount, replacedCount, skippedCount, expiringSoonCount, durationMs
affects: [phase-66, phase-67, phase-68, ops-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Archive-first order of operations (db.update before generateReplacement call)
    - Set-based dedup for join-inflated rows before processing loop
    - Never-throw caller pattern — sweep does not wrap generateReplacement in its own try/catch

key-files:
  created: []
  modified:
    - backend/src/cron/expirationSweep.ts

key-decisions:
  - "Set-based dedup on expiredRows is required because innerJoin inflates rows for questions in multiple collections — first collection wins"
  - "generateReplacement call is AFTER db.update to ensure archival stands even if replacement fails"
  - "No second try/catch wrapper around generateReplacement — its own outer try/catch is sufficient"
  - "expiring-soon query left untouched — that section is monitoring only, no replacement needed"

patterns-established:
  - "COPS: Archive-first, then attempt replacement — archival is unconditional"
  - "COPS: Never-throw caller — sweep trusts ReplacementResult return type, no throw possible"

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 65 Plan 02: Auto-Regenerate Expired Questions (Sweep Integration) Summary

**expirationSweep.ts wired to generateReplacement() via extended join query with archive-first ordering, Set-based multi-collection dedup, and replacement counts in the always-on summary log**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T21:06:07Z
- **Completed:** 2026-03-15T21:08:25Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Extended the expired-questions query to innerJoin `collectionQuestions` and `collections`, resolving `subcategory`, `collectionId`, and `collectionSlug` for each expired row
- Added Set-based dedup to handle the multi-collection edge case (question in N collections = N rows, only 1 replacement generated)
- Wired `generateReplacement()` call after each `db.update` archival — archive-first order of operations enforced with inline comment
- Added `replacedCount` and `skippedCount` tracking with structured info/warn logs per question
- Extended sweep summary log to include `replacedCount`, `skippedCount` alongside existing counts
- All 4 COPS requirements verified (COPS-01 through COPS-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend expiry query and wire replacement generation** - `2a7f389` (feat)
2. **Task 2: End-to-end compilation check and dry-run validation** - `402e8ed` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/cron/expirationSweep.ts` - Extended with join query, multi-collection dedup, generateReplacement() integration, replacement tracking logs, and enhanced summary

## Decisions Made

- Set-based dedup uses the first collection encountered for multi-collection questions — acceptable because the dedup is edge-case handling (most questions belong to one collection) and replacement topic is driven by subcategory (not collection-specific).
- No second try/catch wrapper around `generateReplacement()` — the function's own outer try/catch already converts all errors to `{ replaced: false, reason }`, so adding a wrapper would mask bugs rather than handle them.
- `expiring-soon` query intentionally left unmodified — that section is monitoring-only and replacement is inappropriate for questions that haven't expired yet.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 65 is now complete: both the replacement generator (Plan 01) and cron integration (Plan 02) are shipped
- The auto-regeneration pipeline is fully operational: hourly sweep archives expired questions and immediately attempts AI-powered replacement in the same topic
- Monitoring: structured JSON logs (`job: 'expiration-sweep'`) provide full observability — replacedCount/skippedCount in summary log, plus per-question info/warn entries
- Phase 66 (Gems migration) can proceed — no blockers from Phase 65

---
*Phase: 65-auto-regenerate-expired-questions*
*Completed: 2026-03-15*
