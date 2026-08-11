---
phase: 42-gem-progression-integration
plan: "03"
subsystem: api
tags: [game-routes, progression, gems, player-stats, supabase-rpc, typescript]

# Dependency graph
requires:
  - phase: 42-02
    provides: checkAccountContext, awardPlatformGems, upsertPlayerStats exported from progressionService; GameSession extended with isConnected/isSuspended/accessToken
  - phase: 42-01
    provides: trivia.player_stats table with current_streak, best_streak, lifetime_gems columns; Drizzle schema + TypeScript types
  - phase: 41-02
    provides: req.userId canonical UUID identifier; req.accessToken raw JWT from optionalAuth middleware

provides:
  - POST /session account context check for UUID users (checkAccountContext at session creation)
  - accountContext passed as 4th arg to both createSession call sites (adaptive and classic paths)
  - GET /results full gem award + stats write for Connected non-suspended UUID users
  - progression response shape {gemsEarned, gemsConfirmed, stats, message?} for UUID users
  - GEMS-03 deprecation markers on total_gems references in User.ts and progressionService.ts

affects:
  - 43-profile-uuid-migration (profile routes use legacy User model; deprecation markers signal removal priority)
  - 44-cleanup (Phase 44 is the designated removal target for total_gems and integer-user paths)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Account context checked at session start (POST /session), stored in session, consumed at game end (GET /results)"
    - "Fail-silent progression: awardPlatformGems and upsertPlayerStats errors are logged but do not fail the game submission"
    - "Only Connected non-suspended UUID users earn gems and stats; all other paths get gemsEarned=0, gemsConfirmed=false"
    - "gemsConfirmed boolean decouples stats write from RPC success — 0 gems counted in lifetime_gems if RPC failed"
    - "progression type widened to any to accommodate both legacy {xpEarned, gemsEarned} and new UUID shape"

key-files:
  created: []
  modified:
    - backend/src/routes/game.ts
    - backend/src/models/User.ts
    - backend/src/services/progressionService.ts

key-decisions:
  - "progression declared as any (not a union type) — avoids forcing a discriminated union while legacy integer path still exists"
  - "saveSession called after progressionAwarded set on session — ensures idempotency across retried GET /results calls"
  - "GEMS-03 deprecation markers are JSDoc @deprecated — picked up by IDEs and TypeDoc, no runtime effect"
  - "accountContext check runs for any authenticated UUID user regardless of tier — tier check happens at award time, not session start"

patterns-established:
  - "Deprecation marker format: @deprecated GEMS-03: [reason]. Legacy [scope]. Remove in Phase 44."

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 42 Plan 03: Route Wiring — Gem Award Summary

**GET /results now awards platform gems and writes player_stats for Connected non-suspended UUID users via award_gems RPC and Drizzle upsert; POST /session checks account context and stores it in every new session**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T02:51:16Z
- **Completed:** 2026-03-01T02:54:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- POST /session now calls checkAccountContext for all authenticated UUID users and passes the result as the 4th argument to both createSession call sites (adaptive easy-steps path and classic path)
- GET /results replaces the Phase 41 UUID stub (progression=null, prevent retry) with full award logic: awardPlatformGems + upsertPlayerStats for Connected non-suspended users, with fail-silent error handling
- Game completion response includes gemsEarned, gemsConfirmed, stats snapshot, and optional degraded-connection message for UUID users
- Anonymous, Inform-tier, and suspended users receive progression object with gemsEarned=0, gemsConfirmed=false, stats=null
- GEMS-03 deprecation markers added to User interface totalGems field, UserProfileStats totalGems field, User.updateStats method, and updateUserProgression function

## Task Commits

1. **Task 1: Wire account context into POST /session and gem award into GET /results** - `2eb03c0` (feat)
2. **Task 2: Add GEMS-03 deprecation markers to legacy total_gems references** - `6578ce3` (docs)

## Files Created/Modified

- `backend/src/routes/game.ts` — Updated progressionService import, added accountContext check block, both createSession calls now pass accountContext, UUID results branch replaced with full gem award + stats write, saveSession called after award
- `backend/src/models/User.ts` — @deprecated GEMS-03 on User.totalGems, UserProfileStats.totalGems, and User.updateStats method
- `backend/src/services/progressionService.ts` — @deprecated GEMS-03 on updateUserProgression function

## Decisions Made

- `progression` widened to `any` rather than a union type — avoids creating a discriminated union while both the legacy `{xpEarned, gemsEarned}` shape and the new `{gemsEarned, gemsConfirmed, stats}` shape coexist. Phase 44 will remove the integer path and can tighten the type then.
- `saveSession` added unconditionally after the `progressionAwarded` check — if the session is retrieved twice by a slow client, the second call sees `progressionAwarded=true` and skips the award block.
- accountContext check fires for any UUID user (not just Connected-tier) — tier filtering happens inside the results handler at award time. This keeps session creation simple and allows the tier to be checked once rather than twice.
- GEMS-03 marker chosen over TODO comment — JSDoc @deprecated surfaces in IDE hover text and TypeDoc output, making the removal scope visible without a grep.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. The EMPOWERED_ACCOUNTS_URL environment variable is consumed by checkAccountContext (already documented in Phase 42-02). If the variable is absent, checkAccountContext falls back to {isConnected: false, isSuspended: false} and no gems are awarded.

## Next Phase Readiness

- Phase 42 is now complete: player_stats schema (42-01), progressionService platform functions (42-02), and game route wiring (42-03) are all done
- UUID users completing games on the Connected tier will earn yellow gems via award_gems RPC and accumulate trivia.player_stats
- Phase 43 (profile UUID migration) can proceed — @deprecated markers on total_gems and User.updateStats signal what must be cleaned up
- Phase 44 cleanup: remove integer-user path (updateUserProgression, User.updateStats, total_gems column reads) per GEMS-03 markers

---
*Phase: 42-gem-progression-integration*
*Completed: 2026-02-28*
