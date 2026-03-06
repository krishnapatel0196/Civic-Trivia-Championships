---
phase: 54-xp-game-ui
plan: 04
subsystem: ui
tags: [react, typescript, xp, game-ui, hooks, zustand]

# Dependency graph
requires:
  - phase: 54-01
    provides: usePlayerXp hook and PlayerXpData type
  - phase: 54-02
    provides: XpStrip component and ACCOUNTS_WEB_URL
  - phase: 54-03
    provides: XpReveal and LevelUpOverlay end-screen components
provides:
  - Game.tsx orchestrates XP fetch via usePlayerXp with userId from authStore
  - priorLevel state captured before game starts for level-up detection
  - GameScreen receives xpData/isXpLoading/isXpConnected props
  - ResultsScreen receives priorLevel/onLevelCaptured props (interface in Plan 05)
  - Idle phase shows XpStrip for Connected users or subtle link prompt for non-Connected
affects: [54-05, any phase touching Game.tsx or GameScreen.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XP fetch gated by tier: only fetch for connected/empowered tier (userId null otherwise)"
    - "priorLevel captured once on idle phase — Plan 05 updates it via onLevelCaptured after each game"
    - "Non-Connected prompt: text-slate-500 muted link — suggestion not CTA (no dark patterns)"

key-files:
  created: []
  modified:
    - frontend/src/pages/Game.tsx
    - frontend/src/features/game/components/GameScreen.tsx

key-decisions:
  - "isConnectedTier local var (not selector) — tier check runs inline before usePlayerXp call"
  - "priorLevel useEffect guards with priorLevel === null — only sets once; Plan 05 resets via onLevelCaptured"
  - "Non-Connected prompt hidden while isXpLoading is true — avoids flash of prompt before fetch resolves"
  - "onLevelCaptured typed as any pending Plan 05 ResultsScreen interface update — expected TS error"

patterns-established:
  - "XP props flow: Game.tsx (fetch) → GameScreen (display) — orchestration in page, rendering in component"
  - "Tier gate pattern: isConnectedTier ? userId : null passed to usePlayerXp — null userId = no fetch"

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 54 Plan 04: XP Start Screen Wiring Summary

**Game.tsx now fetches XP via usePlayerXp (tier-gated), captures priorLevel, and GameScreen idle phase renders XpStrip for Connected users or a muted link prompt for non-Connected users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T06:56:57Z
- **Completed:** 2026-03-06T06:59:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Game.tsx calls `usePlayerXp(userId)` only for connected/empowered tier users
- `priorLevel` state captured from `xpData.level` on idle phase, ready for Plan 05 level-up detection
- GameScreen idle phase renders `XpStrip` below Play button for Connected users
- GameScreen idle phase renders "Link account to earn XP" muted link for non-Connected users
- Play button completely unaffected — game starts immediately regardless of XP load state

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire usePlayerXp and priorLevel into Game.tsx** - `dccbeda` (feat)
2. **Task 2: Wire XpStrip and non-Connected prompt into GameScreen idle phase** - `251ade7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/pages/Game.tsx` - Added usePlayerXp call, priorLevel state, XP props passed to GameScreen and ResultsScreen
- `frontend/src/features/game/components/GameScreen.tsx` - Added XpStrip/prompt to idle phase, new props in interface and destructuring

## Decisions Made
- `isConnectedTier` computed inline before `usePlayerXp` — cleaner than a selector, avoids hook call when not needed
- `priorLevel === null` guard in useEffect ensures level is captured only once at session start; Plan 05's `onLevelCaptured` updates it after each game for accurate replay detection
- Non-Connected prompt hidden during `isXpLoading` — avoids brief flash of prompt before fetch resolves for non-Connected authenticated users
- `onLevelCaptured={(newLevel) => setPriorLevel(newLevel)}` has implicit `any` TS warning — expected, ResultsScreen interface is Plan 05 work

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript errors after Task 1 were expected (GameScreen/ResultsScreen props not yet updated) and resolved after Task 2. Only ResultsScreen errors remain, as planned.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- XP start screen experience (XPS-01, XPS-02) is complete
- `priorLevel` is wired and ready for Plan 05 level-up detection on the end screen
- `onLevelCaptured` callback defined on ResultsScreen — Plan 05 needs to add `priorLevel` and `onLevelCaptured` to ResultsScreenProps and implement level-up detection logic
- Expected TS errors: `priorLevel` and `onLevelCaptured` not in ResultsScreenProps — Plan 05 fixes this

---
*Phase: 54-xp-game-ui*
*Completed: 2026-03-06*
