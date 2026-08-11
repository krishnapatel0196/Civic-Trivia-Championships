---
phase: 70-gem-scoring-wager-preview
plan: 01
subsystem: api
tags: [gems, progression, scoring, wager, rewards]

# Dependency graph
requires:
  - phase: 69-game-flow-buttons
    provides: Completed game flow; Q8 wager question confirmed as final question
provides:
  - Score-based gem calculation replacing accuracy-based rule
  - Exported GEM_SCORE_THRESHOLD = 1000 constant
  - Updated calculateProgression(correctAnswers, totalQuestions, finalScore) signature
  - game.ts passes results.totalScore to calculateProgression
affects:
  - 70-02 (wager preview UI — needs to know gem threshold for indicator logic)
  - 70-03 (any remaining Phase 70 plans referencing gem calculation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Score-based reward threshold: perfect game checked first, then score threshold, then zero"
    - "Exported constant pattern: GEM_SCORE_THRESHOLD allows UI to reference same value"

key-files:
  created: []
  modified:
    - backend/src/services/progressionService.ts
    - backend/src/routes/game.ts

key-decisions:
  - "Score threshold set at 1000 (not 900 or 1050) — balances accessibility with meaningful wager play"
  - "Perfect game (8/8) checked first before score threshold — preserves special status for flawless play"
  - "GEM_SCORE_THRESHOLD exported so wager preview UI (Phase 70-02) can reference same constant"

patterns-established:
  - "Reward rule order: perfect check before threshold check before zero — prevents perfect games from accidentally scoring as threshold-only"

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 70 Plan 01: Gem Scoring Update Summary

**Score-based gem threshold (GEM_SCORE_THRESHOLD = 1000) replaces accuracy-based rule, making wager strategy meaningful for gem earning**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T15:31:09Z
- **Completed:** 2026-03-19T15:34:39Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- Replaced `correctAnswers >= totalQuestions - 2` accuracy rule with `finalScore >= GEM_SCORE_THRESHOLD` score rule
- Exported `GEM_SCORE_THRESHOLD = 1000` constant for reuse by wager preview UI
- Updated `calculateProgression` to accept `finalScore` as third parameter
- Updated `game.ts` call site to pass `results.totalScore` as third argument
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update calculateProgression with score-based gem logic** - `afe3a88` (feat)
2. **Task 2: Update game.ts call site to pass totalScore** - `c469b61` (feat)

## Files Created/Modified

- `backend/src/services/progressionService.ts` - Added GEM_SCORE_THRESHOLD constant; updated calculateProgression signature and gem logic
- `backend/src/routes/game.ts` - Added results.totalScore as third argument to calculateProgression call

## Decisions Made

- Score threshold set at 1000: balances accessibility (a player near 800 can wager to reach 1000) with meaningful stakes (can't coast to threshold without wager engagement)
- Perfect game (8/8) checked before score threshold: a perfect game at low score (e.g., 800) still earns 2 gems, not downgraded to 1
- GEM_SCORE_THRESHOLD exported as named constant: wager preview UI (Phase 70 Plan 02) can import it directly rather than hardcoding 1000

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx tsx -e` with `.js` extension failed for TypeScript source import; resolved by creating a temp script inside `src/scripts/` to satisfy tsx module resolution. Temp file removed before commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `GEM_SCORE_THRESHOLD` exported and ready for import in wager preview UI
- `calculateProgression(correctAnswers, totalQuestions, finalScore)` signature is final
- Backend gem logic fully updated; Phase 70 Plan 02 (wager preview) can proceed

---
*Phase: 70-gem-scoring-wager-preview*
*Completed: 2026-03-19*
