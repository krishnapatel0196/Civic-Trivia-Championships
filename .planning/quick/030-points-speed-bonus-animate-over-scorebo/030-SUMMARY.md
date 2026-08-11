---
phase: quick-030
plan: 01
subsystem: ui
tags: [framer-motion, animation, game-ui, scoreboard, react]

requires: []
provides:
  - Score popup animations (+base points, +speed bonus) anchored near top-left scoreboard HUD
  - Timeout popup unchanged (still centered on screen)
affects: []

tech-stack:
  added: []
  patterns:
    - "Fixed top-left anchor for HUD-relative animations — use fixed top-0 left-0 with inline top/left style offsets to match HUD padding"

key-files:
  created: []
  modified:
    - frontend/src/features/game/components/ScorePopup.tsx

key-decisions:
  - "Use fixed top-0 left-0 with inline style offset (top:40px left:16px) rather than CSS transform or ref-based positioning — simpler, deterministic, matches HUD padding"
  - "Animate with rightward drift (x: 0->40) to visually connect popup to the score number incrementing"
  - "Scale text down at scoreboard proximity: text-5xl->text-3xl for base points, text-2xl->text-lg for speed bonus"

patterns-established:
  - "Score popup dual-branch pattern: isTimeout branch stays centered (fixed inset-0), isCorrect branch anchors to HUD region (fixed top-0 left-0)"

duration: 1min
completed: 2026-03-20
---

# Quick Task 030: Points/Speed Bonus Animate Over Scoreboard — Summary

**Score popup +base and +speed bonus animations repositioned from screen-center to the top-left HUD score area, with rightward drift animation and scaled-down text to match the compact scoreboard.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-20T20:15:28Z
- **Completed:** 2026-03-20T20:16:39Z
- **Tasks:** 1 (+ 1 visual checkpoint noted but not blocking)
- **Files modified:** 1

## Accomplishments

- Correct-answer point animations (+100, +XX speed bonus) now appear near the top-left score number instead of dead-center on screen
- Animation has rightward drift (x: 0 to 40) to visually connect the floating text to the score display
- Text scaled down to fit the compact HUD context: `text-3xl` for base points, `text-lg` for speed bonus
- Timeout "Time's up!" popup branch is unchanged — still centered on screen
- Wrong-answer shake/flash behavior is unaffected (handled by ScoreDisplay, not ScorePopup)

## Task Commits

1. **Task 1: Reposition ScorePopup to animate near the scoreboard** - `ad0b9be` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `frontend/src/features/game/components/ScorePopup.tsx` — Repositioned correct-answer animation branch: container changed from `fixed inset-0 flex items-center justify-center` to `fixed top-0 left-0`, inner container offset to `top:40px left:16px`, motion values updated to animate rightward, centering classes removed, text sizes scaled down

## Decisions Made

- Used `fixed top-0 left-0` with inline style `top: '40px', left: '16px'` instead of ref-based DOM measurement — simpler and the HUD padding is a known constant
- Rightward drift (x: 0 → 40) chosen so the popup appears to float out from the score number toward open space, reinforcing the causal connection
- Kept `absolute left-0` on both inner motion.div elements (removed `left-1/2 -translate-x-1/2`) so they stack vertically at the same left edge
- Speed bonus y offset set to `y: 14` (positive) to place it below the base points line, both floating up from their starting positions

## Deviations from Plan

None — plan executed exactly as written. GameScreen.tsx required no changes as confirmed in the plan.

## Visual Checkpoint (Task 2)

The plan includes a `checkpoint:human-verify` to visually confirm the repositioned animations. Per task constraints this is noted but not blocking. To verify:

1. Open the game at https://ctc.empowered.vote or a local dev server
2. Answer a question correctly — "+100" and "+XX speed bonus" should appear near the score in the top-left corner, not screen-center
3. Let a question time out — "Time's up!" should still appear centered
4. Answer wrong — score display should shake with red flash (unchanged)
5. Check mobile viewport — animations should be visible and not clipped

## Issues Encountered

None.

## Next Phase Readiness

- Animation change is self-contained; no downstream effects
- If further tuning needed (offset values, text size, drift distance), all changes are isolated to ScorePopup.tsx correct-answer branch

---
*Phase: quick-030*
*Completed: 2026-03-20*
