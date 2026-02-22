---
phase: 29-admin-review-queue
plan: 01
subsystem: api
tags: [express, drizzle, admin, moderation, postgres]

# Dependency graph
requires:
  - phase: 27-flag-system
    provides: question_flags table with reasons and elaboration_text
  - phase: 18-quality-audit
    provides: Admin UI patterns for tables and detail views
provides:
  - Admin flag review API endpoints
  - Paginated flagged questions list with reason breakdown
  - Individual flag detail with usernames
  - Archive, dismiss, and restore actions
affects: [29-02-admin-review-ui, admin-tools]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin-flag-review, reason-aggregation, raw-sql-cross-schema-join]

key-files:
  created: []
  modified:
    - backend/src/routes/admin.ts

key-decisions:
  - "Use denormalized flag_count for sorting - no COUNT(*) aggregation"
  - "Hard delete question_flags on dismiss - simpler, no audit trail needed"
  - "Raw SQL for users table JOIN - auth.users not in Drizzle schema"
  - "Limit 20 most recent flags for detail view - performance consideration"

patterns-established:
  - "Flag list pagination: Use denormalized flag_count, aggregate reasons in separate query"
  - "Cross-schema JOIN: Use db.execute with sql template for auth.users access"
  - "Archive action: Set archived status AND clear flag_count"
  - "Dismiss action: Transaction to delete flags and clear count atomically"

# Metrics
duration: 13min
completed: 2026-02-22
---

# Phase 29 Plan 01: Admin Review Queue API Summary

**Five admin endpoints for flag review: paginated list with reason breakdown, detail view with usernames via cross-schema JOIN, archive/dismiss/restore actions with transaction safety**

## Performance

- **Duration:** 13 minutes
- **Started:** 2026-02-22T08:18:12Z
- **Completed:** 2026-02-22T08:31:26Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Paginated flag list endpoint with active/archived tab support
- Reason breakdown aggregation showing count per flag type
- Detail endpoint with full question context plus individual flag entries
- Username display via LEFT JOIN to auth.users (cross-schema raw SQL)
- Three action endpoints: archive (status change), dismiss (delete flags), restore (unarchive)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create flagged questions list and detail endpoints** - `6811f19` (feat)
2. **Task 2: Create archive, dismiss-flags, and restore action endpoints** - `c61b585` (feat)

## Files Created/Modified
- `backend/src/routes/admin.ts` - Added 5 new endpoints for flag review queue
  - GET /flags - Paginated list with filters (tab, collection, sort)
  - GET /flags/:questionId/detail - Full question context + individual flags
  - PATCH /flags/:questionId/archive - Archive question and clear flag_count
  - POST /flags/:questionId/dismiss - Delete flag records (transaction)
  - PATCH /flags/:questionId/restore - Restore archived question to active

## Decisions Made

**1. Use denormalized flag_count for sorting**
- Rationale: Avoid expensive COUNT(*) aggregations on question_flags table
- Implementation: Sort by questions.flag_count directly, aggregate reasons separately

**2. Hard delete question_flags on dismiss**
- Rationale: RESEARCH recommendation - simpler, no audit trail needed for dismissed flags
- Implementation: DELETE from question_flags in transaction with flag_count clear

**3. Raw SQL for users table JOIN**
- Rationale: auth.users table not in civic_trivia schema, not in Drizzle schema definition
- Implementation: db.execute with sql template for cross-schema LEFT JOIN
- Pattern: `LEFT JOIN auth.users u ON qf.user_id = u.id`

**4. Limit 20 most recent flags for detail view**
- Rationale: Performance consideration - avoid slow renders with 50+ flags per question
- Implementation: ORDER BY created_at DESC LIMIT 20 in detail endpoint

**5. Reset page to bounds on pagination overflow**
- Rationale: Better UX when filters reduce result set below current page
- Implementation: Calculate totalPages, reset page if beyond bounds

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript type error with nullable reasons field**
- Problem: question_flags.reasons is nullable but initial type annotation was string[]
- Solution: Updated type annotation to string[] | null for reasonsData array
- Impact: None - caught by TypeScript compiler before commit

## Next Phase Readiness

All API endpoints complete and ready for frontend integration. Next plan (29-02) will build the React admin UI to consume these endpoints.

**What's ready:**
- Paginated list endpoint with tab, collection, and sort filters
- Detail endpoint with full question context and individual flags
- Action endpoints for archive, dismiss, and restore
- All endpoints protected by admin authentication middleware
- TypeScript compilation passes without errors

**No blockers:** Frontend can begin implementation immediately.

---
*Phase: 29-admin-review-queue*
*Completed: 2026-02-22*
