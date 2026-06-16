---
phase: 54-xp-game-ui
plan: 02
subsystem: ui
tags: [react, typescript, hooks, tailwind, xp, empowered-accounts]

# Dependency graph
requires:
  - phase: 54-01
    provides: PlayerXpData type exported from usePlayerXp (defined here); XpResult and Progression types in game.ts
  - phase: 53-01
    provides: ACCOUNTS_API_URL export from accountsApi.ts; XP API endpoint pattern (/api/xp/:userId)

provides:
  - usePlayerXp hook — fetches player XP from Empowered Accounts API, returns PlayerXpData, isLoading, isConnected
  - XpStrip component — start screen XP panel with level, XP fraction, progress bar, loading skeleton

affects:
  - 54-03 (XP award animations — may reference XpStrip for visual continuity)
  - 54-04 (GameScreen wiring — imports both usePlayerXp and XpStrip)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "404-as-non-connected: XP API 404 treated as isConnected=false, not an error — user hasn't linked account"
    - "Silent XP errors: network failures warn but don't surface to UI — XP data is non-critical, game must continue"
    - "Skeleton loading: animate-pulse placeholder divs prevent layout shift during XP data fetch"

key-files:
  created:
    - frontend/src/hooks/usePlayerXp.ts
    - frontend/src/features/game/components/XpStrip.tsx
  modified: []

key-decisions:
  - "404 from /api/xp/:userId = not Connected (isConnected: false, xpData: null) — not an error state"
  - "No Authorization header on XP fetch — endpoint is public (confirmed in 54-research)"
  - "XP math: xpNeeded = xpInLevel + xpToNextLevel; display fraction is xpInLevel / xpNeeded"
  - "XpStrip renders null when xpData is null (isLoading=false) — non-Connected users see nothing, no conditional parent logic needed"

patterns-established:
  - "XP hook pattern: fetch on mount, re-fetch on userId change, swallow network errors as warnings"

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 54 Plan 02: XpStrip Component and usePlayerXp Hook Summary

**usePlayerXp hook fetches /api/xp/:userId with 404-as-non-connected logic; XpStrip renders level number, XP fraction, and animated progress bar for Connected players**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-06T06:52:12Z
- **Completed:** 2026-03-06T06:54:35Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `usePlayerXp` hook with full state management (loading, connected, data) and graceful 404/error handling
- Created `XpStrip` component with level display, XP fraction, ARIA-attributed progress bar, and skeleton loading state
- Both files TypeScript clean with zero compiler errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usePlayerXp hook** - `1a7c3cb` (feat)
2. **Task 2: Create XpStrip component** - `24ef294` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/hooks/usePlayerXp.ts` - React hook: fetches /api/xp/:userId, exports PlayerXpData type and usePlayerXp function
- `frontend/src/features/game/components/XpStrip.tsx` - Start screen XP panel: level, fraction, progress bar, loading skeleton

## Decisions Made

- **404-as-non-connected:** A 404 from the XP endpoint means the user hasn't linked their account to the Empowered platform. `isConnected` is set to false, no error is thrown. This is the expected path for non-Connected players.
- **No auth header:** The `/api/xp/:userId` endpoint is public — confirmed in phase 54 research. No Authorization header required or sent.
- **XP fraction math:** `xpNeeded = xpInLevel + xpToNextLevel`. Display shows `xpInLevel / xpNeeded` (e.g. "1,240 / 2,000 XP"). This gives the player a clear sense of progress within the current level.
- **Null render for non-Connected:** `XpStrip` returns `null` when `xpData` is null and not loading. The parent (Plan 04) does not need conditional rendering logic — the component self-manages.
- **Cyan-500 progress bar:** Matches the XP icon color used in ResultsScreen for visual consistency across the XP feature.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `usePlayerXp` and `XpStrip` are complete, standalone, and ready to compose
- Plan 04 (GameScreen wiring) can import both directly: `import { usePlayerXp }` and `import { XpStrip }`
- No blockers

---
*Phase: 54-xp-game-ui*
*Completed: 2026-03-06*
