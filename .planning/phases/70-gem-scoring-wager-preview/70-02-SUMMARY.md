---
phase: 70-gem-scoring-wager-preview
plan: 02
subsystem: ui
tags: [react, framer-motion, wager, gem, game-ui]

# Dependency graph
requires:
  - phase: 70-01
    provides: GEM_SCORE_THRESHOLD constant (1000) and score-based calculateProgression logic

provides:
  - WagerScreen gem indicator that transitions gold/dim based on ifCorrect >= 1000
  - "+1 GEM" inline with if-correct score when threshold met
  - Score tooltip explaining gem earning rule

affects:
  - Phase 71 (leaderboard cache) — unrelated, no dependency
  - Any future wager UI changes — gem indicator pattern established

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local GEM_SCORE_THRESHOLD constant replicating backend value — avoids cross-package import while keeping value in sync conceptually"
    - "Framer Motion animate prop for smooth color/opacity transitions on threshold crossing"
    - "AnimatePresence for tooltip enter/exit animation with y-offset"

key-files:
  created: []
  modified:
    - frontend/src/features/game/components/WagerScreen.tsx

key-decisions:
  - "GEM_SCORE_THRESHOLD local constant (not imported from backend) — frontend standalone, value manually kept in sync with progressionService.ts"
  - "Gem indicator uses motion.div animate (not variants) for color/opacity — simpler one-off animation"
  - "Tooltip positioned absolute below score number, triggered on both click and hover — mobile + desktop coverage"

patterns-established:
  - "Gem threshold indicator: color=C.gold/opacity=1 active, color=C.mutedFg/opacity=0.4 inactive, duration=0.3s transition"

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 70 Plan 02: Gem Scoring & Wager Preview Summary

**WagerScreen gem indicator lights gold when ifCorrect >= 1000, with Framer Motion color transition, inline "+1 GEM" on the if-correct row, and score tooltip explaining the gem threshold rule.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-19T16:06:45Z
- **Completed:** 2026-03-19T16:14:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Gem indicator above wager slider transitions smoothly between gold (active) and dim (inactive) using Framer Motion `animate` prop based on `ifCorrect >= GEM_SCORE_THRESHOLD`
- "+1 GEM" label with GemIcon appears inline with the if-correct score display only when threshold is met
- Score tooltip (click/hover) explains "Score 1,000+ to earn a gem. Perfect score earns 2 gems." using AnimatePresence for smooth enter/exit

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gem indicator and score tooltip to WagerScreen** - `360f9b8` (feat)

**Plan metadata:** (see below after final commit)

## Files Created/Modified

- `frontend/src/features/game/components/WagerScreen.tsx` - Added GEM_SCORE_THRESHOLD constant, meetsGemThreshold computed value, gem indicator motion.div above slider, "+1 GEM" inline with if-correct score, and animated tooltip on current score display

## Decisions Made

- GEM_SCORE_THRESHOLD defined as a local constant (1000) — not imported from backend progressionService.ts. Frontend package has no direct import path to backend services; the value is manually kept in sync. This is consistent with how other frontend threshold values are handled.
- Tooltip positioned at `bottom: '-8px'` on an `inline-block` score container — places it just below the score number without affecting layout
- `display: 'inline-block'` on the score container wrapper enables `position: 'relative'` + absolute tooltip positioning without disrupting the centered text layout

## Deviations from Plan

None — plan executed exactly as written. The WagerScreen already had the imports and GemIcon in place; all required elements (GEM_SCORE_THRESHOLD, gem indicator, "+1 GEM" inline badge, score tooltip) were implemented per spec and verified via TypeScript check and production build.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wager screen gem indicator is complete and verified (tsc + build pass)
- Phase 70 Plan 03 (ResultsScreen gem messaging) appears already committed (`feat(70-03)` visible in git log) — executor should verify Plan 03 SUMMARY.md exists or execute it
- Phase 71 (Leaderboard Cache Fix) is unblocked — independent of gem scoring work

---
*Phase: 70-gem-scoring-wager-preview*
*Completed: 2026-03-19*
