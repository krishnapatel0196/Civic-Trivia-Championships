---
phase: 56-post-v2-xp-tech-debt
plan: 01
subsystem: api
tags: [xp, redis, session, env, progression, typescript]

# Dependency graph
requires:
  - phase: 53-xp-backend-integration
    provides: awardPlatformXp function and XpAwardResult type used in game.ts
  - phase: 54-xp-frontend-integration
    provides: xpResult session field consumed by ResultsScreen
  - phase: 55-xp-history-panel
    provides: XP history endpoint — confirmed isDuplicate comes from API response, not metadata input
provides:
  - Startup warning when TRIVIA_SERVICE_KEY or EMPOWERED_ACCOUNTS_API_URL are missing
  - Clean metadata type for awardPlatformXp — isDuplicate removed from input side
  - 24h session TTL after XP award — /results returns xpResult for up to 24h post-game
affects: [future-xp-phases, session-management, operator-dx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Warn-only env validation at startup (console.warn, not process.exit) — local dev unaffected"
    - "Optional TTL param with default — backward-compatible saveSession extension"

key-files:
  created: []
  modified:
    - backend/src/env.ts
    - backend/src/services/progressionService.ts
    - backend/src/routes/game.ts
    - backend/src/services/sessionService.ts

key-decisions:
  - "console.warn not process.exit for missing XP env vars — local dev must start without these vars"
  - "Underscore-prefixed _requiredForXp and _missing to avoid linter unused-var warnings in module scope"
  - "saveSession optional ttlSeconds defaults to 3600 — all existing callers unchanged"
  - "86400s TTL only on post-award save — submitAnswer and adaptive-state saves keep 1h default"
  - "isDuplicate removed from metadata input; XpAwardResult.isDuplicate (return type) preserved"

patterns-established:
  - "Side-effect env.ts import runs before routes — startup warnings visible before any handler fires"

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 56 Plan 01: Post-v2.0 XP Tech Debt Summary

**Three surgical fixes: startup env warning for missing XP vars, isDuplicate removed from metadata input, and 24h session TTL after XP award**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T23:32:32Z
- **Completed:** 2026-03-08T23:35:13Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Server startup now logs `[env] Missing env vars (XP awards will be skipped): ...` when TRIVIA_SERVICE_KEY or EMPOWERED_ACCOUNTS_API_URL are absent — visible before any route handler fires
- `isDuplicate?: boolean` removed from awardPlatformXp metadata parameter type and the call site in game.ts; XpAwardResult.isDuplicate (return type) and data.is_duplicate mapping untouched
- saveSession extended with optional ttlSeconds param (default 3600); post-award call passes 86400 so Connected players revisiting /results beyond 1h still see their xpResult

## Task Commits

Each task was committed atomically:

1. **Task 1: Startup env validation warning in env.ts** - `21e2ac2` (feat)
2. **Task 2: Remove isDuplicate from XP award metadata input type and call site** - `6dba1dd` (fix)
3. **Task 3: Extend session TTL to 24h after XP award** - `b0d8fb2` (feat)

## Files Created/Modified

- `backend/src/env.ts` - Added console.warn check for missing TRIVIA_SERVICE_KEY and EMPOWERED_ACCOUNTS_API_URL
- `backend/src/services/progressionService.ts` - Removed isDuplicate?: boolean from metadata parameter type
- `backend/src/routes/game.ts` - Removed isDuplicate: false from metadata call site; saveSession now passes 86400 after award
- `backend/src/services/sessionService.ts` - saveSession accepts optional ttlSeconds: number = 3600

## Decisions Made

- `console.warn` not `process.exit(1)` for missing XP env vars — local dev must start cleanly without these vars set
- Underscore-prefixed `_requiredForXp` and `_missing` to avoid linter unused-var warnings in module scope
- `saveSession` optional second param with default 3600 — all existing callers (submitAnswer, adaptive-state save, createSession) unchanged
- 86400s TTL only on the post-award `saveSession` — the other two call sites (submitAnswer line 338 and adaptive state line 177) correctly keep the 1h default
- `isDuplicate` preserved in `XpAwardResult` interface and `data.is_duplicate` return mapping — only the input metadata side was wrong

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three v2.0 audit items closed
- TypeScript compiles cleanly across all four modified files
- No blockers; v2.0 milestone tech debt fully cleared

---
*Phase: 56-post-v2-xp-tech-debt*
*Completed: 2026-03-08*
