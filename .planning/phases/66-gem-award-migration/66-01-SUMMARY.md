---
phase: 66-gem-award-migration
plan: 01
subsystem: api
tags: [gems, accounts-api, fetch, idempotency, env-validation, progression]

# Dependency graph
requires:
  - phase: 53-xp-backend-integration
    provides: awardPlatformXp pattern (fetch + X-Service-Key + idempotency) that gems migration mirrors
provides:
  - awardPlatformGems() using fetch POST /api/gems/award with TRIVIA_GEMS_KEY
  - Idempotency key support for gem awards (ctc-gems-{sessionId}-{userId})
  - TRIVIA_GEMS_KEY startup validation with warning-only behavior
  - .env.example documentation for new env var
affects: [deploy, production-verification, 67-leaderboard-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Never-throw gem award: plain try/catch returning { confirmed: boolean } — no retry, matches XP pattern"
    - "Service-to-service auth via X-Service-Key header (not Authorization: Bearer)"
    - "Idempotency key pattern: ctc-{type}-{sessionId}-{userId}"
    - "Warning-only env validation: server boots without key, awards silently fail at runtime"

key-files:
  created: []
  modified:
    - backend/src/services/progressionService.ts
    - backend/src/routes/game.ts
    - backend/src/env.ts
    - backend/.env.example

key-decisions:
  - "No withRetry for gem awards — plain try/catch only (contrast with awardPlatformXp which uses withRetry)"
  - "X-Service-Key header with TRIVIA_GEMS_KEY (not TRIVIA_SERVICE_KEY — separate scoped key)"
  - "gemType hardcoded to 'yellow' — matches GEMS-01 decision, key scope configured on accounts side"
  - "TRIVIA_GEMS_KEY validation is warning-only — server boots without it, gem awards silently fail"
  - "connect.credit_gems Supabase RPC fully removed from TypeScript (DB function untouched)"

patterns-established:
  - "Gem award idempotency: ctc-gems-{sessionId}-{userId} constructed in game.ts before calling service"
  - "Three-block env.ts validation pattern: XP block + accounts block + gems block"

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 66 Plan 01: Gem Award Migration Summary

**connect.credit_gems Supabase RPC replaced with fetch POST /api/gems/award using X-Service-Key header and idempotency key — gem awards now route through accounts API like XP awards**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T22:22:55Z
- **Completed:** 2026-03-15T22:25:12Z
- **Tasks:** 3 (Tasks 1-2 code changes, Task 3 verification sweep)
- **Files modified:** 4

## Accomplishments

- Replaced deprecated `connect.credit_gems` Supabase RPC with fetch to `POST /api/gems/award` on the Empowered Accounts API
- Added `idempotencyKey` as third parameter to `awardPlatformGems()` and updated game.ts call-site to pass `ctc-gems-{sessionId}-{userId}`
- Added `TRIVIA_GEMS_KEY` startup validation block in `env.ts` (warning-only, server boots without it)
- Documented `TRIVIA_GEMS_KEY` in `.env.example` alongside other Empowered Accounts vars

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace awardPlatformGems() body and add idempotencyKey parameter** - `636e7f9` (feat)
2. **Task 2: Add TRIVIA_GEMS_KEY startup validation and .env.example entry** - `b37c3a8` (chore)
3. **Task 3: End-to-end compilation check and codebase cleanup verification** - verification only, no new commit

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/services/progressionService.ts` - Replaced connect.credit_gems RPC with fetch to /api/gems/award; added idempotencyKey param; plain try/catch (no withRetry)
- `backend/src/routes/game.ts` - Updated awardPlatformGems call-site to pass gemIdempotencyKey as third arg
- `backend/src/env.ts` - Added third validation block for TRIVIA_GEMS_KEY with warning-only behavior
- `backend/.env.example` - Added TRIVIA_GEMS_KEY entry grouped with Empowered Accounts vars

## Decisions Made

- **No withRetry for gems:** Plain try/catch only — CONTEXT explicitly ruled out retry for gem awards (contrast with awardPlatformXp which uses withRetry with 3 attempts)
- **Separate TRIVIA_GEMS_KEY:** Does not reuse TRIVIA_SERVICE_KEY — separate scoped key with scope ["yellow"] configured on accounts side by Chris
- **gemType hardcoded to 'yellow':** Matches GEMS-01 decision; type is not caller-configurable
- **Warning-only startup validation:** Consistent with existing XP and accounts patterns — server boots normally, awards fail gracefully at runtime

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Environment variable required on Render (and local .env):**

- `TRIVIA_GEMS_KEY` — service-to-service auth key for gem awards, scope ["yellow"]. Obtain from Chris / Empowered Accounts dashboard. Must be set before gem awards function in production.

## Next Phase Readiness

- Code changes complete and TypeScript compiles cleanly
- Ready to deploy to Render — after deploy, Chris should manually complete one game as a Connected user and verify gem balance increases
- Phase 67 (leaderboard integration) can proceed independently

---
*Phase: 66-gem-award-migration*
*Completed: 2026-03-15*
