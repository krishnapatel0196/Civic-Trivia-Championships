---
phase: 30-admin-integration-tech-debt
plan: 02
subsystem: admin
tags: [react, react-router, cross-linking, navigation, url-params]

# Dependency graph
requires:
  - phase: 29-admin-review-queue
    provides: FlagReviewPage with flag list and FlagDetailPanel component
provides:
  - Bidirectional cross-linking between Flag Review and Question Explorer
  - questionId filter on Flag Review page (/admin/flags?questionId=X)
  - Edit in Explorer link in FlagDetailPanel (/admin/questions?id=X)
affects: [30-03-question-explorer-deep-linking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - URL searchParams for cross-page navigation
    - Filter banner UI pattern for active filters

key-files:
  created: []
  modified:
    - backend/src/routes/admin.ts
    - frontend/src/pages/admin/FlagReviewPage.tsx
    - frontend/src/pages/admin/components/FlagDetailPanel.tsx

key-decisions:
  - "Use id param (?id=X) instead of search for Question Explorer deep-linking"
  - "Blue filter banner UI for question ID filter consistency"
  - "Close panel on Edit in Explorer click for smooth navigation flow"

patterns-established:
  - "Filter banner pattern: blue bg, clear button, shown when filter active"
  - "Cross-link pattern: id param for deep-linking to specific resources"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 30 Plan 02: Cross-Linking Summary

**Bidirectional navigation between Flag Review and Question Explorer via questionId filter and Edit in Explorer link**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T17:05:37Z
- **Completed:** 2026-02-22T17:07:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- FlagReviewPage accepts questionId URL param to filter flags for a single question
- Filter banner shows "Showing flags for Question #X" with clear button
- FlagDetailPanel has "Edit in Explorer" link that navigates to /admin/questions?id=X
- Backend GET /flags endpoint supports questionId filter param

## Task Commits

Each task was committed atomically:

1. **Task 1: Add questionId filter to FlagReviewPage with filter banner** - `6eef475` (feat)
2. **Task 2: Add "Edit in Explorer" link to FlagDetailPanel** - `6abcab5` (feat)

## Files Created/Modified
- `backend/src/routes/admin.ts` - Added questionId query param parsing and filtering in GET /flags endpoint
- `frontend/src/pages/admin/FlagReviewPage.tsx` - Read questionId from searchParams, pass to API, render filter banner in both tabs
- `frontend/src/pages/admin/components/FlagDetailPanel.tsx` - Changed link to use ?id=X param, updated text to "Edit in Explorer", added onClick={onClose}

## Decisions Made

**1. Use id param instead of search param for Question Explorer deep-linking**
- Link uses `/admin/questions?id=123` instead of `/admin/questions?search=externalId`
- Rationale: Plan 03 will wire the Question Explorer to auto-open detail panel from id param. Using numeric ID is more direct and efficient than searching by externalId.

**2. Blue filter banner for question ID filter**
- Follows established UI pattern for active filters
- Consistent with existing admin page filter UIs

**3. Close panel on "Edit in Explorer" click**
- Added onClick={onClose} to Link component
- Rationale: Smooth navigation flow - user clicks link, panel closes, navigates to Question Explorer. Prevents stale panel state.

## Deviations from Plan

None - plan executed exactly as written.

Backend questionId filter addition (2 lines) was noted in the plan as necessary to support the frontend filter, so it was included in Task 1 despite not being listed in files_modified frontmatter. This was a trivial blocking dependency clearly documented in the plan text.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Cross-linking foundation complete. Ready for Plan 03 (Question Explorer deep-linking) which will:
- Wire Question Explorer to read id param from URL
- Auto-open detail panel when id is present
- Complete bidirectional navigation workflow

Admin workflow now seamless:
- From Question Explorer: "View Flags" button navigates to /admin/flags?questionId=X
- From Flag Review: "Edit in Explorer" link navigates to /admin/questions?id=X
- Both directions preserve context and enable quick navigation

---
*Phase: 30-admin-integration-tech-debt*
*Completed: 2026-02-22*
