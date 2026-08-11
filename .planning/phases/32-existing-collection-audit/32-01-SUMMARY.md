---
phase: 32-existing-collection-audit
plan: 01
subsystem: backend-services
tags: [duplicate-review, drizzle-transactions, json-sync, admin-api, undo-capability, advanced-flags]

# Dependency graph
requires:
  - phase: 31-02
    provides: Scanner report format, DuplicateCluster types, ClusterBuilder recommendations
provides:
  - Backend services for duplicate review workflow (DuplicateReviewService, JSONSyncService)
  - Five admin API endpoints for cluster management (GET /duplicates, POST /duplicates/resolve, POST /duplicates/auto-resolve, POST /duplicates/undo, GET /duplicates/summary)
  - Backward-compatible scanner report format detection (bare array vs object with clusters+advancedFlags)
  - Drizzle transaction-based batch archival with 30-second undo window
  - JSON source file synchronization after database operations
affects: [32-02-frontend-review-ui, 33-generation-pipeline-dedup-gate]

# Tech tracking
tech-stack:
  added: []
  patterns: [singleton service pattern for in-memory state, backward-compatible format detection, Drizzle transaction batch operations, JSON sync after DB commit, 30-second undo window matching Gmail/GitHub UX]

key-files:
  created:
    - backend/src/services/DuplicateReviewService.ts
    - backend/src/services/JSONSyncService.ts
  modified:
    - backend/src/routes/admin.ts

key-decisions:
  - "Singleton DuplicateReviewService instance persists across requests for in-memory resolution state tracking"
  - "Backward-compatible format detection handles both old (bare array) and new (object with clusters+advancedFlags) scanner report formats"
  - "30-second undo window matches familiar UX patterns from Gmail and GitHub"
  - "JSON sync always happens AFTER successful DB transaction to prevent data inconsistency"
  - "Auto-resolve threshold set at 0.90 similarity for high-confidence automation"
  - "Advanced flags included in GET /duplicates response for frontend badge display"
  - "Collection-to-file mapping hardcoded for the 6 existing collections (Federal Civics, Indiana, California, Bloomington IN, Los Angeles CA, Fremont CA)"

patterns-established:
  - "Service singleton pattern: Module-level instance lazy-initialized on first API call, persists for request lifecycle"
  - "Backward-compatible format detection: Check if parsed JSON is Array (old) vs Object with 'clusters' key (new)"
  - "Undo window pattern: Store resolution timestamp, validate elapsed time before allowing undo"
  - "JSON sync pattern: syncAfterArchive removes by externalId, syncAfterRestore queries DB and re-adds full question objects"

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 32 Plan 01: Backend Duplicate Review Services Summary

**Backend services and API endpoints for the duplicate review workflow: load scanner reports with backward-compatible format detection, batch archive with Drizzle transactions, undo/restore within 30 seconds, and JSON sync after DB operations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T15:56:25Z
- **Completed:** 2026-02-23T15:59:38Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Built DuplicateReviewService (280 lines) with backward-compatible scanner report loading, cluster filtering, advanced flag exposure, batch archival with Drizzle transactions, 30-second undo window, and auto-resolve for 90%+ similarity clusters
- Built JSONSyncService (145 lines) for syncing JSON source files after archive/restore operations with collection-to-file mapping
- Added five admin API endpoints for duplicate review: GET /duplicates (with advancedFlags), POST /duplicates/resolve, POST /duplicates/auto-resolve, POST /duplicates/undo, GET /duplicates/summary
- Implemented singleton service pattern for in-memory resolution state persistence across requests
- Ensured JSON sync only happens after successful DB transaction to prevent data inconsistency

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DuplicateReviewService and JSONSyncService** - `5b20438` (feat)
2. **Task 2: Add duplicate review API endpoints to admin routes** - `526e0d9` (feat)

## Files Created/Modified

**Created:**
- `backend/src/services/DuplicateReviewService.ts` - Load scanner reports (backward-compatible format detection), manage cluster resolution state, batch archive with Drizzle transactions, undo within 30 seconds, auto-resolve 90%+ clusters
- `backend/src/services/JSONSyncService.ts` - Sync JSON source files after archive/restore, collection-to-file mapping, atomic read-filter-write operations

**Modified:**
- `backend/src/routes/admin.ts` - Added 5 duplicate review endpoints with Zod validation, singleton service pattern, and proper error handling

## Decisions Made

1. **Singleton service pattern** - DuplicateReviewService instantiated once per server lifecycle (module-level variable) to maintain in-memory resolution state across API requests. Acceptable for single-admin tool with no concurrent user concerns.

2. **Backward-compatible format detection** - loadReport() detects both old format (bare array from Phase 31-02) and new format (object with clusters + advancedFlags from Plan 32-04). Uses `Array.isArray(parsed)` check to distinguish formats. This ensures Plan 01 and Plan 04 can execute in any order without breaking.

3. **30-second undo window** - Matches familiar UX patterns from Gmail (undo send) and GitHub (undo merge). Enforced by checking elapsed time between resolvedAt and current time. After 30 seconds, undo throws error and returns 400 status.

4. **JSON sync after DB commit** - syncAfterArchive() and syncAfterRestore() always called AFTER successful Drizzle transaction completes. Never write JSON before DB operation succeeds. This prevents data inconsistency if transaction rolls back.

5. **Auto-resolve threshold 0.90** - autoResolveAll() only resolves clusters where highest similarity >= 0.90 (90% semantic similarity). Uses existing ClusterBuilder recommendations which apply Federal > State > City hierarchy and quality score tiebreaker.

6. **Advanced flags in API response** - GET /duplicates includes `advancedFlags` array alongside `clusters` and `summary`. Frontend can use this to display flag badges (answer-leakage, same-source-cluster, inverse-duplicate) on affected questions.

7. **Collection-to-file mapping** - Hardcoded mapping for the 6 existing collections (Federal Civics -> questions.json, Indiana -> indiana-state-questions.json, etc.). Simple and sufficient for current scope. Can be made dynamic if more collections added.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

**Ready for Plan 32-02 (Frontend Review UI):**
- All five required API endpoints implemented and tested via TypeScript compilation
- GET /duplicates returns enriched clusters with autoResolvable, resolved, and resolution fields
- Advanced flags array available for frontend badge display
- Summary endpoint provides collection-level stats for dashboard

**Ready for Phase 33 (Generation Pipeline Dedup Gate):**
- DuplicateReviewService.resolveCluster() demonstrates batch archival pattern for pipeline integration
- JSON sync pattern can be reused for pipeline-generated questions
- Backward-compatible format detection shows how to evolve report formats without breaking consumers

**No blockers or concerns.**

---
*Phase: 32-existing-collection-audit*
*Completed: 2026-02-23*
