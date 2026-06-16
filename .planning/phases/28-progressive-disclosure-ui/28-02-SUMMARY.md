---
phase: 28-progressive-disclosure-ui
plan: 02
subsystem: ui
tags: [react, typescript, game-flow, feedback, framer-motion]

# Dependency graph
requires:
  - phase: 28-01
    provides: FeedbackElaborationScreen component, PATCH /flags/batch endpoint
  - phase: 27-02
    provides: FlagButton component, handleFlagToggle pattern, flaggedQuestions state
provides:
  - Integrated post-game elaboration flow in Game.tsx
  - Interactive flag buttons on ResultsScreen for all questions
  - pendingAction pattern for intercepting navigation with elaboration
affects: [29-admin-review-queue]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pendingAction state pattern: intercept Play Again/Home with elaboration before executing"
    - "Interactive flags on results screen: onFlagToggle prop enables flag toggles for authenticated users"
    - "Post-results elaboration: elaboration screen appears after results, not before"

key-files:
  created: []
  modified:
    - frontend/src/pages/Game.tsx (elaboration flow, pendingAction, onFlagToggle pass-through)
    - frontend/src/features/game/components/ResultsScreen.tsx (interactive flag buttons for all questions)

key-decisions:
  - "Elaboration after results, not before — user requested flags on results screen with post-review elaboration"
  - "Interactive flags on every question for authenticated users — empty outline or filled gold"
  - "pendingAction pattern to intercept Play Again/Home and show elaboration before executing"
  - "Anonymous users see no flag buttons on results (onFlagToggle not passed)"

patterns-established:
  - "Post-results elaboration: Game → Results (with flags) → Elaboration → action"
  - "pendingAction + showElaborationScreen pattern for deferred navigation"

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 28 Plan 02: Game Flow Integration Summary

**Interactive flag buttons on results screen with post-results elaboration flow — players flag any question from results, then provide reasons before leaving**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T04:05:00Z
- **Completed:** 2026-02-22T04:10:00Z
- **Tasks:** 1 auto + 1 checkpoint (human-verify)
- **Files modified:** 2

## Accomplishments
- Every question on results screen shows flag icon (gold filled or outline) for authenticated users
- Players can flag/unflag any question directly from the results screen — not limited to in-game flagging
- Elaboration screen appears when clicking "Play Again" or "Home" with flagged questions
- After elaboration submit/skip, the pending navigation action executes (new game or dashboard)
- Games with no flagged questions proceed directly without elaboration intercept

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire FeedbackElaborationScreen into Game.tsx** - `bcf70c7` (feat)
2. **User feedback: Interactive flags on results + post-results elaboration** - `c13b437` (feat)

**Plan metadata:** (included in phase completion commit)

## Files Created/Modified
- `frontend/src/pages/Game.tsx` - Added pendingAction state, modified Play Again/Home handlers to intercept with elaboration, removed auto-trigger useEffect, passes onFlagToggle to ResultsScreen for authenticated users
- `frontend/src/features/game/components/ResultsScreen.tsx` - Added onFlagToggle prop, shows interactive FlagButton for all questions when handler provided, falls back to read-only indicator when not

## Decisions Made
- **Elaboration after results (user-directed change):** Originally planned elaboration before results. User requested flags on the results screen so players can flag questions they didn't flag during gameplay, with elaboration happening when they try to leave. This is a better UX — players review all answers first, then provide feedback.
- **pendingAction pattern:** Tracks whether user clicked "Play Again" or "Home" so elaboration can execute the right action after submit/skip.
- **Anonymous users excluded:** onFlagToggle only passed when accessToken exists, so anonymous users see no flag UI on results.

## Deviations from Plan

### User-Requested Changes

**1. [Checkpoint Feedback] Interactive flags on results screen instead of elaboration-before-results**
- **Found during:** Checkpoint verification
- **User request:** "When I'm on the results page, I want to be able to flag questions I didn't flag during the game. Beside each question, can we have a flag?"
- **Change:** Moved elaboration to after results, added interactive FlagButton to every question on ResultsScreen
- **Files modified:** Game.tsx, ResultsScreen.tsx
- **Verification:** TypeScript compiles, flow approved by user
- **Committed in:** c13b437

---

**Total deviations:** 1 user-requested flow change
**Impact on plan:** Improved UX per user feedback. All must_haves still met (elaboration still works, API still called, skip still works).

## Issues Encountered
None

## User Setup Required
None - no external service configuration required

## Next Phase Readiness
**Phase 28 complete.** All building blocks for feedback marks are in place:
- In-game flagging (Phase 27): FlagButton during answer reveal
- Results flagging (Phase 28): FlagButton on all results questions
- Elaboration UI (Phase 28): Reason chips + textarea per flagged question
- Batch API (Phase 28): PATCH /flags/batch for elaboration persistence

**Ready for Phase 29: Admin Review Queue** — admin-facing flag review page

---
*Phase: 28-progressive-disclosure-ui*
*Completed: 2026-02-22*
