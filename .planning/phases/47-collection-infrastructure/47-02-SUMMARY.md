---
phase: 47-collection-infrastructure
plan: 02
subsystem: infra
tags: [drizzle, postgresql, typescript, embeddings, dedup, collections, tier]

# Dependency graph
requires:
  - phase: 47-01
    provides: tier column added to collections table via migration, DB has correct tier values for all 7 collections
provides:
  - COLLECTION_HIERARCHY constant removed from types.ts — no hardcoded display-name map
  - loadCollectionTierMap() async helper in types.ts — DB-sourced tier map for all callers
  - ClusterBuilder accepts tierMap constructor param — reads tier from DB
  - CollectionHierarchy accepts tierMap constructor param — instance methods replacing statics
  - scan-duplicates.ts uses DB-sourced tier map — local hardcoded map removed
  - scaffold-collection.ts has 3-step flow — no longer edits types.ts, tier flows via seed entry
  - collections.ts seed data has explicit tier values for all 7 entries
affects:
  - 47-03 (unified generator already complete — may need tierMap plumbing if it uses CollectionHierarchy)
  - Any future collection addition (now uses scaffold-collection.ts 3-step flow)
  - scan-duplicates dedup reports (now uses DB names for tier resolution)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DB-driven tier lookup: loadCollectionTierMap() queries collections table at runtime, Map<name, tier>"
    - "Constructor injection for tier map: ClusterBuilder(tierMap) and CollectionHierarchy(embeddingService, tierMap)"
    - "Dynamic imports in types.ts to prevent circular dependency (db/index.js, db/schema.js)"
    - "Seed data correctness: explicit tier values in all seed entries rather than relying on DB default"

key-files:
  created: []
  modified:
    - backend/src/services/embeddings/types.ts
    - backend/src/services/embeddings/ClusterBuilder.ts
    - backend/src/services/generation/CollectionHierarchy.ts
    - backend/src/scripts/generateQuestions.ts
    - backend/src/scripts/scan-duplicates.ts
    - backend/src/scripts/scaffold-collection.ts
    - backend/src/db/seed/collections.ts

key-decisions:
  - "Dynamic imports in loadCollectionTierMap() to avoid circular dependency (types.ts is imported early)"
  - "Constructor injection over singleton/global for tierMap — callers load once, pass in"
  - "CollectionHierarchy static methods converted to instance methods — cleaner OO design"
  - "COLLECTION_NAMES/PREFIXES/JSON_FILE_MAP keys updated from 'indiana'/'california' to 'indiana-state'/'california-state'"
  - "All 7 seed entries get explicit tier values for correctness on dev re-seed"

patterns-established:
  - "Tier lookup pattern: await loadCollectionTierMap() then pass to constructor"
  - "DB-consistent collection names: always use DB name column value as map key"

# Metrics
duration: 9min
completed: 2026-03-02
---

# Phase 47 Plan 02: Collection Hierarchy DB-Driven Runtime Summary

**COLLECTION_HIERARCHY constant eliminated — all tier lookups now query the database via loadCollectionTierMap(), with constructor injection into ClusterBuilder and CollectionHierarchy**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-02T01:14:58Z
- **Completed:** 2026-03-02T01:23:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Removed hardcoded `COLLECTION_HIERARCHY` constant from `types.ts` — no more stale display-name-to-tier mapping in TypeScript source
- Added `loadCollectionTierMap()` async helper that queries the DB `collections` table at runtime, returning `Map<name, CollectionTier>`
- Updated `ClusterBuilder` and `CollectionHierarchy` to accept `tierMap` as a constructor parameter and use it for all tier lookups (instance methods)
- Fixed naming mismatch in `generateQuestions.ts`: `COLLECTION_NAMES` now uses DB-aligned names (`'Indiana State'`, `'California State'`, `'United States'`) — tier lookups for state collections now resolve correctly
- Updated `scan-duplicates.ts` to replace its local hardcoded hierarchy (which used the wrong `'local'` tier and stale short names) with DB-sourced tier map
- Removed `step4AddToHierarchy()` from `scaffold-collection.ts` — adding a new collection now only requires the 3-step seed/config/register flow
- Added explicit `tier` values to all 7 seed entries in `collections.ts` for correctness on dev re-seed

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove COLLECTION_HIERARCHY from types.ts and update ClusterBuilder + CollectionHierarchy + generateQuestions.ts** - `7df4b38` (feat)
2. **Task 2: Update scan-duplicates.ts and scaffold-collection.ts (with tier in seed entry)** - `625e4d9` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified
- `backend/src/services/embeddings/types.ts` — COLLECTION_HIERARCHY removed; loadCollectionTierMap() added with dynamic imports to avoid circular deps
- `backend/src/services/embeddings/ClusterBuilder.ts` — constructor accepts tierMap param, recommendKeep() uses this.tierMap.get()
- `backend/src/services/generation/CollectionHierarchy.ts` — constructor accepts tierMap param, static methods converted to instance methods
- `backend/src/scripts/generateQuestions.ts` — loadCollectionTierMap imported, tierMap passed to CollectionHierarchy, COLLECTION_NAMES/PREFIXES/JSON_FILE_MAP keys aligned with DB slugs and names
- `backend/src/scripts/scan-duplicates.ts` — local COLLECTION_HIERARCHY and local TIER_RANK removed; imports from types.ts; ClusterBuilder and splitCrossCollectionClusters now receive tierMap
- `backend/src/scripts/scaffold-collection.ts` — step4AddToHierarchy removed; seed entry template includes tier field; JSDoc updated to 3-step flow
- `backend/src/db/seed/collections.ts` — explicit tier: 'federal'/'state'/'city' added to all 7 seed entries

## Decisions Made
- **Dynamic imports in types.ts:** `loadCollectionTierMap()` uses `await import('../../db/index.js')` instead of top-level imports to avoid circular dependency (types.ts is imported by many modules early in the graph).
- **Constructor injection:** Both `ClusterBuilder` and `CollectionHierarchy` receive `tierMap` as a constructor parameter. Callers call `loadCollectionTierMap()` once and pass it in — no hidden global state.
- **Instance methods:** `CollectionHierarchy.getCollectionTier()` and `isParentOrSame()` converted from static to instance methods. Static methods on a class with injected state were architecturally inconsistent.
- **COLLECTION_NAMES key correction:** Existing keys `'indiana'` and `'california'` did not match any collection slugs or DB names. Updated to `'indiana-state'` and `'california-state'` to match slugs, and `'federal'` name from `'Federal Civics'` to `'United States'` to match DB.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scan-duplicates.ts local TIER_RANK using 'local' instead of 'city'**
- **Found during:** Task 2 (scan-duplicates.ts update)
- **Issue:** The local `TIER_RANK` in scan-duplicates.ts used `{ federal: 3, state: 2, local: 1 }` — `'local'` is not a valid `CollectionTier` value (should be `'city'`). The local COLLECTION_HIERARCHY also used `'local'` tier values, making all city-tier lookups silently fail.
- **Fix:** Removed local TIER_RANK and imported canonical `TIER_RANK` from types.ts (uses `'city'`). The local hierarchy was replaced entirely by `loadCollectionTierMap()`.
- **Files modified:** `backend/src/scripts/scan-duplicates.ts`
- **Verification:** TypeScript compile passes (no type errors), grep shows no COLLECTION_HIERARCHY in scan-duplicates.ts
- **Committed in:** `625e4d9` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug fix, stale 'local' tier name)
**Impact on plan:** Bug fix necessary for correctness. No scope creep.

## Issues Encountered
None — plan executed cleanly. The TypeScript compile check caught the scan-duplicates constructor update needed immediately, keeping iteration fast.

## Next Phase Readiness
- Phase 47 is complete: 3 plans done (47-01 migration, 47-02 DB-driven hierarchy, 47-03 state config auto-discovery)
- INFRA-01 fully met: no hardcoded display-name map exists anywhere in backend/src/services/
- Adding a new collection now requires zero TypeScript source edits for tier — scaffold creates seed entry with tier field, seed.ts writes to DB, loadCollectionTierMap() picks it up at runtime
- scan-duplicates.ts will correctly resolve tier for any new collection added to the DB

---
*Phase: 47-collection-infrastructure*
*Completed: 2026-03-02*
