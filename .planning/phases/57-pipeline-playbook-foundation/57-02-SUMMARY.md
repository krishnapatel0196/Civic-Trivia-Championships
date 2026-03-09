---
phase: 57-pipeline-playbook-foundation
plan: 02
subsystem: pipeline
tags: [audit, expiring-questions, playbook, collection-quality, typescript]

# Dependency graph
requires:
  - phase: 57-pipeline-playbook-foundation-01
    provides: semantic dedup wired into generation pipeline
provides:
  - Expiring-question ratio warning in audit-collection-readiness.ts (PIPELINE-02)
  - COLLECTION-PLAYBOOK.md bootstrapped from v1.9 learnings (PLAYBOOK-01)
affects:
  - phase-58-portland-or
  - any future collection phase using audit-collection-readiness.ts

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Surgical audit script addition: new SQL query + warning block inserted without touching existing exit code logic"
    - "Living playbook document pattern: bootstrapped once, retrospective sections appended after each collection phase"

key-files:
  created:
    - .planning/COLLECTION-PLAYBOOK.md
  modified:
    - backend/src/scripts/audit-collection-readiness.ts

key-decisions:
  - "Ratio warning is non-blocking (exit 0) — enforcing as a block would prevent activating older collections with no expiring questions"
  - "expiringRatioCount uses IS NOT NULL with no date filter — distinct from the 90-day window expiringCount which feeds netCount"
  - "Playbook placed in .planning/ root (not a phase subdirectory) — it is a cross-phase living document, not per-phase artifact"

patterns-established:
  - "Two-query expiry model: expiringCount (90-day window, feeds netCount blocker) and expiringRatioCount (any date, feeds ratio warning)"

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 57 Plan 02: Pipeline & Playbook Foundation Summary

**Expiring-question ratio warning added to audit script (non-blocking, exit 0) and COLLECTION-PLAYBOOK.md bootstrapped with all six v1.9 learnings sections**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-09T11:08:14Z
- **Completed:** 2026-03-09T11:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `audit-collection-readiness.ts` now prints expiring ratio and emits a WARNING when ratio < 15% — exit code unchanged (0 = ready)
- Two distinct SQL queries: `expiringRatioCount` (IS NOT NULL, no date filter) and the existing `expiringCount` (90-day window for net count blocker)
- `.planning/COLLECTION-PLAYBOOK.md` created with all 6 sections: Standard Workflow, Known Bugs, Content Patterns, Quality Conventions, Near-Duplicate Gap Resolution, Retrospective Template
- Playbook is immediately usable for Phase 58 (Portland, OR) and ready for retrospective appends

## Task Commits

Each task was committed atomically:

1. **Task 1: Add expiring-question ratio warning to audit script** - `2fd6284` (feat)
2. **Task 2: Create COLLECTION-PLAYBOOK.md bootstrapped from v1.9 learnings** - `3f8d64d` (docs)

## Files Created/Modified

- `backend/src/scripts/audit-collection-readiness.ts` - Added Step 4b (expiringRatioCount query), ratio display lines in report, and non-blocking WARNING block before process.exit(0)
- `.planning/COLLECTION-PLAYBOOK.md` - New living playbook: 7-step workflow, Scaffold Bug 2 workaround, mixed-durability pattern, quality conventions, near-duplicate gap resolution note, retrospective template

## Decisions Made

- Ratio warning is non-blocking (exit 0): enforcing as a block would prevent activating collections that predate the 15% convention. This is a forward-looking quality nudge, not a gate.
- Two separate queries: `expiringRatioCount` uses `IS NOT NULL` with no date filter to measure the ratio target. `expiringCount` keeps its `<= 90 days` filter because that feeds the netCount blocker (near-expiring questions don't count toward readiness).
- Playbook lives in `.planning/` root, not a phase subdirectory — it is a cross-phase living document that gets appended to after every future collection phase.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 58 (Portland, OR) can use the updated audit script immediately — it will warn on low expiring ratio during pre-activation audit
- COLLECTION-PLAYBOOK.md is ready for the Phase 58 retrospective to be appended after activation
- Both PIPELINE-02 and PLAYBOOK-01 deliverables from the phase spec are complete

---
*Phase: 57-pipeline-playbook-foundation*
*Completed: 2026-03-09*
