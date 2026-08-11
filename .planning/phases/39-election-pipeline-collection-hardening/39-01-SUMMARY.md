---
phase: 39-election-pipeline-collection-hardening
plan: 01
subsystem: api
tags: [express, drizzle-orm, typescript, react, admin, election-pipeline]

# Dependency graph
requires:
  - phase: 38-election-admin-ui
    provides: ElectionsPage with three-tab admin UI and regenerate flow
  - phase: 36-election-question-generation
    provides: POST /election-races and POST /election-races/:id/regenerate endpoints
provides:
  - GET /api/admin/collections endpoint returning all collections without question-count floor
  - Jurisdiction validation on POST /election-races rejecting unknown collection names
  - Optional collectionSlug override on POST /election-races/:id/regenerate
  - ElectionsPage fetching from authenticated admin collections endpoint
affects: [phase-39-future-plans, election-pipeline-cron, admin-ui-dropdowns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin endpoints return all records without game-tier filters (no question-count floor, no is_active filter)"
    - "Jurisdiction validation via runtime DB lookup against collections.name (no FK constraint)"
    - "Override pattern with safe fallback: optional body param checked first, name-based lookup as default"

key-files:
  created: []
  modified:
    - backend/src/routes/admin.ts
    - frontend/src/pages/admin/ElectionsPage.tsx

key-decisions:
  - "GET /admin/collections registered before /collections/health to prevent Express route shadowing"
  - "Jurisdiction validation returns 400 (not 404) — user input validation error, not missing resource"
  - "collectionSlug override in regenerate uses req.body?.collectionSlug with optional chaining — req.body may be undefined when frontend sends no body"
  - "ElectionsPage guards fetch with if (!accessToken) return to prevent 401 on initial render before auth state available"

patterns-established:
  - "Admin collections endpoint: no WHERE clause, no question-count floor — admins see everything"
  - "Jurisdiction runtime validation: eq(collections.name, jurisdiction) case-sensitive exact match"

# Metrics
duration: 5min
completed: 2026-02-27
---

# Phase 39 Plan 01: Election Pipeline Collection Hardening Summary

**Three surgical API fixes closing election pipeline data-integrity gaps: unfiltered admin collections endpoint, jurisdiction DB validation on race creation, and collectionSlug override escape hatch on regenerate**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-27T05:11:23Z
- **Completed:** 2026-02-27T05:16:15Z
- **Tasks:** 4/4
- **Files modified:** 2

## Accomplishments

- Added `GET /api/admin/collections` returning all collections without the 50-question floor that hides new/sparse collections from the jurisdiction dropdown
- Added jurisdiction DB validation to `POST /election-races` — returns 400 with the attempted name when no collection matches, preventing silent bad data in the election pipeline
- Added optional `collectionSlug` body parameter to `POST /election-races/:id/regenerate` with full DB validation and fallback to existing name-based lookup, giving admins an escape hatch when collections are renamed
- Updated `ElectionsPage` to fetch from the authenticated admin endpoint with Bearer token, `accessToken` dependency, and null guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GET /admin/collections endpoint in admin.ts** - `b56f244` (feat)
2. **Task 2: Add jurisdiction validation to POST /election-races** - `0f9be2f` (feat)
3. **Task 3: Add collectionSlug override to POST /election-races/:id/regenerate** - `9db7b07` (feat)
4. **Task 4: Update ElectionsPage to fetch from admin/collections with auth** - `fd7646b` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/src/routes/admin.ts` — Added GET /collections, jurisdiction validation, collectionSlug override in regenerate
- `frontend/src/pages/admin/ElectionsPage.tsx` — Collections fetch updated to admin endpoint with auth

## Decisions Made

- `GET /admin/collections` registered before `GET /collections/health` in route order — Express matches routes top-to-bottom; if `/collections/health` were registered first the more-general `/collections` handler could shadow it (won't happen here since exact-match routing, but ordering is correct defensive practice)
- Jurisdiction validation returns HTTP 400 (not 404) — the jurisdiction string is user-provided input that fails validation; 400 is the correct semantics for client input errors
- `collectionSlug` override uses `req.body?.collectionSlug` with optional chaining — the current frontend sends no body to regenerate, so `req.body` may be undefined; optional chaining prevents TypeError
- ElectionsPage guards fetch with `if (!accessToken) return` — prevents a 401 request firing on the initial render before the Zustand auth store is hydrated

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all four tasks executed cleanly. TypeScript compiled without errors in both backend and frontend after each change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Election pipeline hardening complete — all three operational risks from the v1.7 milestone audit are closed
- `GET /api/admin/collections` is available for any future admin UI that needs an unfiltered collection list
- The collectionSlug override in regenerate is usable immediately from the ElectionsPage pending tab (future plan could expose a UI field for it)
- No blockers for subsequent Phase 39 plans

---
*Phase: 39-election-pipeline-collection-hardening*
*Completed: 2026-02-27*
