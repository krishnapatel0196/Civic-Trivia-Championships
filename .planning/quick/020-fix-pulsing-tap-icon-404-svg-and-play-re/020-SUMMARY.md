---
phase: quick
plan: 020
subsystem: ui
tags: [svg, game, assets, public-dir, vite]

# Dependency graph
requires:
  - phase: commits 776a6e2 and b052de4
    provides: Tap hint feature code in AnswerGrid.tsx (SVG img tag + framer-motion pulse)
provides:
  - noun-tap-8166713-03B9D2.svg committed to repo and tracked by git
  - Zero 404 errors for tap hint SVG in deployed environments
affects: [game-ui, answer-reveal-phase]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - frontend/public/images/noun-tap-8166713-03B9D2.svg
  modified: []

key-decisions:
  - "No code changes needed — the SVG path in AnswerGrid.tsx was already correct (/images/noun-tap-8166713-03B9D2.svg maps to frontend/public via Vite)"
  - "The play:1 404 error in bug report is the browser devtools notation for 'initiated from /play page line 1' — it refers to the same SVG 404, not a separate resource"
  - "The 401 error in bug report is an unrelated auth API call and was explicitly excluded from scope"

patterns-established: []

# Metrics
duration: 1min
completed: 2026-02-26
---

# Quick Task 020: Fix Pulsing Tap Icon 404 SVG Summary

**Committed the missing tap hint SVG (noun-tap-8166713-03B9D2.svg) to git, eliminating 404 errors during game answer reveal phase in deployed environments**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-27T02:07:09Z
- **Completed:** 2026-02-27T02:07:43Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- Identified the root cause: SVG added in commits 776a6e2/b052de4 but never staged to git
- Verified SVG file content is valid and the path reference in AnswerGrid.tsx is correct
- Committed frontend/public/images/noun-tap-8166713-03B9D2.svg — file is now tracked and will be present in all deployed environments
- Confirmed no code changes were required (path was already correct)

## Task Commits

1. **Task 1: Commit the untracked tap hint SVG and verify path** - `fef1950` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/public/images/noun-tap-8166713-03B9D2.svg` - Tap hint icon SVG (cyan #03B9D2 hand/tap icon, 512x512pt)

## Decisions Made

- No code changes needed — the `/images/noun-tap-8166713-03B9D2.svg` path in AnswerGrid.tsx line 247 correctly maps to `frontend/public/images/` via Vite's public directory serving
- The "play:1 Failed to load resource" browser console notation means "initiated from /play page" — it refers to the same SVG 404, not a separate resource named "play"
- The 401 error was explicitly out of scope (auth API call unrelated to tap hint feature)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward file commit. The SVG existed locally and the path reference was correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tap hint SVG now present in repo; 404 errors will be resolved on next deploy
- No follow-up work needed for this fix

---
*Phase: quick-020*
*Completed: 2026-02-26*
