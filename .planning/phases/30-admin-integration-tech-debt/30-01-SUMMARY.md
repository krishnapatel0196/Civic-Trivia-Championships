---
phase: 30-admin-integration-tech-debt
plan: 01
subsystem: api
tags: [express, drizzle-orm, admin-api, flag-count, env-validation]

# Dependency graph
requires:
  - phase: 29-admin-review-queue
    provides: flagCount column on questions table, Flag Review Queue UI
provides:
  - flagCount exposed via explore and detail admin API endpoints
  - flag_count sorting and flagged-only filtering in explore endpoint
  - ADMIN_EMAIL environment variable validation and export
affects: [30-02-frontend-flag-integration, 30-03-bulk-link-repair]

# Tech tracking
tech-stack:
  added: []
  patterns: [denormalized flag_count for efficient sorting, optional env var validation with console warnings]

key-files:
  created: []
  modified: [backend/src/routes/admin.ts, backend/src/env.ts, backend/.env.example]

key-decisions:
  - "Simple regex validation for ADMIN_EMAIL vs Zod schema - kept env.ts minimal"
  - "flagged=true filter uses gt(questions.flagCount, 0) for consistency with flags endpoint"

patterns-established:
  - "Optional env vars export null when missing (not undefined)"
  - "Env var validation warns to console but doesn't throw (fail-open for optional config)"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 30 Plan 01: API Flag Count Integration Summary

**Backend explore and detail endpoints now serve flagCount with sort/filter support; ADMIN_EMAIL env var validated and exported**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T17:04:57Z
- **Completed:** 2026-02-22T17:07:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- GET /api/admin/questions/explore returns flagCount for each question
- Explore endpoint supports sort=flag_count and flagged=true query params
- GET /api/admin/questions/:id/detail returns flagCount
- ADMIN_EMAIL environment variable validation added with email format checking

## Task Commits

Each task was committed atomically:

1. **Task 1: Add flagCount to explore and detail endpoints with sort/filter support** - `35552b6` (feat)
2. **Task 2: Add ADMIN_EMAIL environment variable validation** - `6b174d9` (feat)

## Files Created/Modified
- `backend/src/routes/admin.ts` - Added flagCount to explore/detail SELECTs, flag_count sort handler, flagged filter
- `backend/src/env.ts` - Added ADMIN_EMAIL validation and export
- `backend/.env.example` - Added ADMIN_EMAIL example

## Decisions Made

**1. Simple regex validation for ADMIN_EMAIL vs Zod schema**
- Kept env.ts minimal (just dotenv loading) rather than introducing Zod dependency
- Regex warning pattern for optional validation: validates format but doesn't throw
- Maintains existing env.ts simplicity

**2. flagged=true filter uses gt(questions.flagCount, 0)**
- Consistent with flags endpoint filter logic (line 725)
- gt import already present from flags endpoint implementation
- Aligns with denormalized flag_count pattern from Phase 29

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation, TypeScript compilation passed on first attempt.

## User Setup Required

None - no external service configuration required. ADMIN_EMAIL is optional and can be added to production .env as needed.

## Next Phase Readiness

**Ready for frontend integration (30-02):**
- Question Explorer can now display Flags column using flagCount from explore endpoint
- Question Explorer can filter to flagged-only questions using flagged=true param
- Question detail panel can display flag badge using flagCount from detail endpoint
- Explore endpoint can sort by flag count (DESC shows highest severity first)

**ADMIN_EMAIL (DEBT-02):**
- Environment variable validation complete
- Ready for use in admin middleware or notification features if needed

**No blockers.** All v1.5 backend infrastructure complete.

---
*Phase: 30-admin-integration-tech-debt*
*Completed: 2026-02-22*
