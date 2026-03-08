---
phase: 55-xp-history-panel
plan: 01
subsystem: api
tags: [xp, progression, metadata, empowered-accounts, game-results]

# Dependency graph
requires:
  - phase: 53-xp-backend-integration
    provides: awardPlatformXp() function and XpAwardResult type
  - phase: 54-xp-game-ui
    provides: results endpoint and session.collectionSlug on session objects
provides:
  - awardPlatformXp() with optional enriched metadata parameter (score, correctAnswers, collectionSlug, isDuplicate)
  - game.ts passing all four enrichment fields on every XP award call
  - Transaction records going forward contain score/correct_answers/collection_slug/is_duplicate in metadata
affects: [55-02-history-panel-api, 55-03-history-panel-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Metadata spread pattern: { game_id: idempotencyKey, ...metadata } keeps game_id first and merges caller fields"
    - "isDuplicate: false at award time — actual duplicate status comes back in API response, not known before call"

key-files:
  created: []
  modified:
    - backend/src/services/progressionService.ts
    - backend/src/routes/game.ts

key-decisions:
  - "isDuplicate passed as false at call time — the platform's is_duplicate response field (in xpResult) is the authoritative duplicate flag; the metadata field documents award-time intent"
  - "metadata parameter is optional — zero-arg callers compile without changes (no existing other callers)"
  - "collectionSlug fallback to 'federal-civics' mirrors the same fallback already used in results response body"

patterns-established:
  - "Enrichment-via-metadata: pass game context to external APIs as metadata rather than adding new top-level fields"

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 55 Plan 01: XP Award Metadata Enrichment Summary

**awardPlatformXp() extended with optional metadata param (score, correctAnswers, collectionSlug, isDuplicate); game.ts passes all four fields on every XP award so history rows have full display data**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-08T18:22:46Z
- **Completed:** 2026-03-08T18:24:17Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments
- progressionService.ts: awardPlatformXp() now accepts an optional fourth `metadata` parameter with typed fields for score, correctAnswers, collectionSlug, and isDuplicate
- The fetch body spreads caller metadata alongside `game_id`, ensuring all enrichment fields are stored in the transaction record at the accounts API
- game.ts results handler passes all four enrichment fields using live session/results data on every XP award call
- TypeScript compiles with zero errors after both changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend awardPlatformXp() to accept and forward enriched metadata** - `06c919a` (feat)
2. **Task 2: Pass enriched metadata from game.ts when awarding XP** - `58537f9` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `backend/src/services/progressionService.ts` - Added optional metadata param to awardPlatformXp(); spread into fetch body
- `backend/src/routes/game.ts` - Updated awardPlatformXp() call site to pass score/correctAnswers/collectionSlug/isDuplicate

## Decisions Made
- **isDuplicate: false at call time** — The accounts API returns `is_duplicate` in the response (accessible via `session.xpResult.isDuplicate`). The metadata field stores the award-time value, which is always `false` since we don't know the duplicate status before the call completes. History display should read `is_duplicate` from the transaction record itself (populated by the platform from the idempotency check), not our metadata field.
- **Optional parameter** — Making metadata optional means existing callers compile without modification. No breakage of any callers outside game.ts.
- **collectionSlug fallback** — Uses `'federal-civics'` as fallback, matching the same fallback pattern already used in the results response body on line 459.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (history panel API endpoint) can now read `score`, `correct_answers`, `collection_slug` from transaction metadata for all new games
- Existing transactions from before this plan will have `N/A` for those fields — history UI must handle null/missing metadata gracefully
- No blockers for Plan 02

---
*Phase: 55-xp-history-panel*
*Completed: 2026-03-08*
