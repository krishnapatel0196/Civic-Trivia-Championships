---
phase: 47-collection-infrastructure
plan: 01
subsystem: database
tags: [postgres, drizzle, supabase, migration, collections, tier]

# Dependency graph
requires:
  - phase: 40-database-migration
    provides: trivia schema on shared Supabase project with collections table
provides:
  - tier column in trivia.collections (text NOT NULL DEFAULT 'city')
  - All 7 existing collections assigned correct tier values
  - GET /collections API response includes tier field per collection
  - Frontend CollectionSummary type includes tier field
affects:
  - 47-02 (DB-driven COLLECTION_HIERARCHY replacement reads tier from DB)
  - 47-03 (collection picker UI can render tier-based grouping)
  - Any consumer of GET /collections endpoint

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration-first DB change: SQL migration -> Drizzle schema update -> verify in DB"
    - "text column for tier (not enum) — matches CollectionTier union type pattern"

key-files:
  created:
    - supabase/migrations/20260302000001_add_collections_tier.sql
  modified:
    - backend/src/db/schema.ts
    - backend/src/routes/game.ts
    - frontend/src/features/collections/types.ts
    - backend/src/scripts/content-generation/generate-state-questions.ts
    - backend/src/scripts/export-state-questions.ts

key-decisions:
  - "Tier stored as text column (not enum) — simpler to add new tiers later without DDL changes"
  - "DEFAULT 'city' chosen because city collections are the most common type"
  - "State config files renamed indiana.ts->indiana-state.ts, california.ts->california-state.ts to match slug convention — imports updated accordingly"

patterns-established:
  - "Tier values: 'federal' | 'state' | 'city' — consistent across DB, API, and frontend type"

# Metrics
duration: 10min
completed: 2026-03-02
---

# Phase 47 Plan 01: Collection Infrastructure - Tier Column Summary

**tier column added to trivia.collections via psql migration, Drizzle schema updated, GET /collections returns tier, CollectionSummary typed as 'federal' | 'state' | 'city'**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-02T01:01:01Z
- **Completed:** 2026-03-02T01:11:00Z
- **Tasks:** 2
- **Files modified:** 5 (+ 1 migration created)

## Accomplishments

- Applied SQL migration adding `tier text NOT NULL DEFAULT 'city'` to `trivia.collections`
- Set correct tier values for all 7 existing collections (federal, 2 state, 4 city) — verified via psql query
- Added `tier: collections.tier` to Drizzle SELECT in GET /collections endpoint
- Added `tier: 'federal' | 'state' | 'city'` to frontend `CollectionSummary` interface
- Both backend and frontend compile cleanly with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tier column to collections table (migration + Drizzle schema)** - `83876c6` (feat)
2. **Task 2: Add tier to GET /collections API response and frontend type** - `7e8e66a` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `supabase/migrations/20260302000001_add_collections_tier.sql` - Migration adding tier column with correct UPDATE statements for federal/state collections
- `backend/src/db/schema.ts` - Added `tier: text('tier').notNull().default('city')` after themeColor field
- `backend/src/routes/game.ts` - Added `tier: collections.tier` to GET /collections SELECT query
- `frontend/src/features/collections/types.ts` - Added `tier: 'federal' | 'state' | 'city'` to CollectionSummary interface
- `backend/src/scripts/content-generation/generate-state-questions.ts` - Fixed broken import paths (Rule 3 auto-fix)
- `backend/src/scripts/export-state-questions.ts` - Fixed broken import paths (Rule 3 auto-fix)

## Decisions Made

- **Tier as text, not enum:** Simpler to extend (add new tiers) without ALTER TYPE DDL changes. Matches `CollectionTier` union type pattern already in use in the codebase.
- **DEFAULT 'city':** City is the most common tier; new collections will default correctly without explicit tier set.
- **Renamed state config files:** `indiana.ts` -> `indiana-state.ts`, `california.ts` -> `california-state.ts` to match slug convention. Import paths updated in both dependent scripts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed broken import paths after state-config file renames**

- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** The previous git commit (Task 1) included a rename of `indiana.ts` -> `indiana-state.ts` and `california.ts` -> `california-state.ts` in `state-configs/`. Two scripts (`generate-state-questions.ts` and `export-state-questions.ts`) still imported from the old paths, causing `tsc --noEmit` to fail with module-not-found errors.
- **Fix:** Updated import strings in both files to reference the new `-state` suffixed filenames.
- **Files modified:** `backend/src/scripts/content-generation/generate-state-questions.ts`, `backend/src/scripts/export-state-questions.ts`
- **Verification:** `cd backend && npx tsc --noEmit` passes after fix.
- **Committed in:** `7e8e66a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** The fix was necessary for the TypeScript compilation check to pass. No scope creep — the file renames were pre-existing (from prior work in the git working tree), not introduced by this plan.

## Issues Encountered

None beyond the Rule 3 deviation documented above.

## User Setup Required

None - no external service configuration required. Migration was applied automatically via psql during execution.

## Next Phase Readiness

- Tier data is now in the DB and available at runtime via GET /collections.
- Plan 47-02 (replace hardcoded COLLECTION_HIERARCHY with DB-driven lookup) can read `tier` directly from the API response — no additional schema work needed.
- Plan 47-03 (collection picker UI tier grouping) has the frontend type ready — `CollectionSummary.tier` is typed and available.

---
*Phase: 47-collection-infrastructure*
*Completed: 2026-03-02*
