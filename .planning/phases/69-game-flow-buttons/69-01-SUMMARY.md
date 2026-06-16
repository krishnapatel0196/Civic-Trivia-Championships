---
phase: 69-game-flow-buttons
plan: 01
subsystem: ui
tags: [react, framer-motion, game-ui, accessibility]

requires:
  - phase: 68-santa-monica-ca-collection
    provides: base game screen with tap-anywhere mechanic

provides:
  - NextStepButton component with contextual labels (Next Question / Last Question / Game Recap)
  - GameScreen with explicit navigation buttons replacing tap-anywhere
  - Mobile-fit layout with timer shrink during reveal phase

affects: [phase-70-gem-scoring, game-ui]

tech-stack:
  added: []
  patterns: [motion.button with delayed fade-in, conditional label from props]

key-files:
  created: [frontend/src/features/game/components/NextStepButton.tsx]
  modified: [frontend/src/features/game/components/GameScreen.tsx]

key-decisions:
  - "Label derived from props (isFinalQuestion, questionIndex, totalQuestions) — not hardcoded question numbers"
  - "Timer shrinks to 56px (from 80px) during reveal phase to reclaim vertical space"
  - "Both root div and inner motion.div use overflow-hidden — scroll fully disabled"
  - "motion.button with delay: 0.55s so button fades in after answer reveal settles"

patterns-established:
  - "NextStepButton: disabled prop dims to 0.4 opacity and prevents click when LearnMore modal is open"

duration: 30min
completed: 2026-03-19
---

# Phase 69-01: Game Flow Buttons Summary

**NextStepButton component replaces tap-anywhere: contextual labels (NEXT QUESTION / LAST QUESTION / GAME RECAP), mobile-fit timer shrink, overflow-hidden on both scroll containers**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-03-19
- **Tasks:** 1 auto + 1 checkpoint (approved)
- **Files modified:** 2

## Accomplishments

- Created `NextStepButton.tsx` — amber-styled motion.button with three contextual labels based on question position
- Removed tap-anywhere onClick from root div and tap hint SVG from GameScreen
- Timer shrinks to 56px during reveal phase (from 80px) to prevent mobile scroll
- Both scroll containers set to overflow-hidden — full screen fits on 375x667 without scrolling
- Screen reader announce messages updated to reference actual button labels

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Create NextStepButton and integrate into GameScreen | da62be3 | feat |

**Plan metadata:** (docs: complete plan)

## Files Created/Modified

- `frontend/src/features/game/components/NextStepButton.tsx` — New navigation button component with conditional label logic
- `frontend/src/features/game/components/GameScreen.tsx` — Removed tap-anywhere, added NextStepButton, timer shrink, overflow fixes

## Decisions Made

- Label derived from props (`isFinalQuestion` + `questionIndex` vs `totalQuestions - 2`) — not hardcoded indices
- Timer shrinks to 56px during reveal to reclaim vertical space for the button
- overflow-hidden on BOTH root div and inner motion.div — inner container was independently scrollable

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 69 complete — all FLOW-01 through FLOW-06 requirements met
- Phase 70 (Gem Scoring & Wager Preview) can proceed

---
*Phase: 69-game-flow-buttons*
*Completed: 2026-03-19*
