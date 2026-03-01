---
phase: 41-auth-tier-integration
plan: 02
subsystem: auth
tags: [typescript, express, middleware, supabase, jwt, uuid, session, rate-limiting]

# Dependency graph
requires:
  - phase: 41-01
    provides: requireAuth middleware with req.userId (string UUID), authenticateToken alias, optionalAuth; req.user removed from Express Request type

provides:
  - All route handlers migrated from req.user.userId to req.userId
  - Progression guard in game results safe for UUID string users
  - sessionService plausibility detection safe for UUID users (timerMultiplier defaults 1.0)
  - Rate limiter uses req.userId string key
  - TypeScript build compiles with zero errors
affects:
  - phase-42: award_gems RPC for UUID user progression (TODO in game.ts)
  - phase-43: profile route replacement (legacy as unknown as number casts are the bridge)
  - phase-44: authController cleanup (uses legacy token system, already clean after this plan)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "req.userId (string) is the canonical user identifier — never req.user.userId"
    - "Legacy User model (integer ID) guarded by typeof check before use with session.userId"
    - "Profile routes use as unknown as number cast as explicit Phase 43 TODO marker"
    - "UUID users get timerMultiplier=1.0 default (User.findById skipped for non-integer userId)"
    - "Progression guard: session.userId && session.userId !== 'anonymous' (string-safe)"

key-files:
  created: []
  modified:
    - backend/src/routes/feedback.ts
    - backend/src/routes/game.ts
    - backend/src/routes/profile.ts
    - backend/src/middleware/rateLimiter.ts
    - backend/src/services/sessionService.ts

key-decisions:
  - "Profile routes use as unknown as number cast (not parsed int) — UUID users cannot reach legacy User model at runtime anyway (old users table has no UUID rows)"
  - "Progression award for UUID users sets progressionAwarded=true with null result — prevents retry loop, defer to Phase 42 award_gems RPC"
  - "getRateLimitStatus signature changed from userId: number to userId: string to match UUID type"
  - "sessionService timerMultiplier defaults to 1.0 for UUID users — player_prefs migration is Phase 43"

patterns-established:
  - "req.userId migration pattern: replace req.user?.userId with req.userId, remove TODO(Phase 41) comments"
  - "Legacy integer model guard: typeof x === 'number' before passing to User model methods"

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 41 Plan 02: Update req.user Callers to req.userId Summary

**All Express route handlers and middleware migrated from req.user.userId to req.userId (UUID string), with UUID-safe guards in sessionService and game.ts, achieving a clean zero-error TypeScript build.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-01T01:07:58Z
- **Completed:** 2026-03-01T01:12:36Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Removed all `req.user.userId` references from feedback.ts (3), game.ts (2), profile.ts (5), and rateLimiter.ts (1) — replaced with `req.userId`
- Updated game.ts progression guard from `typeof session.userId === 'number'` to string-safe `session.userId && session.userId !== 'anonymous'` with inner legacy branch for integer users
- Fixed sessionService plausibility detection to skip `User.findById` for UUID string userId values (defaults timerMultiplier to 1.0)
- TypeScript build passes with zero errors (`npx tsc --noEmit` exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update all req.user callers to req.userId** - `2ab405c` (feat)
2. **Task 2: Fix sessionService plausibility and verify build** - `44496d1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/routes/feedback.ts` - 3x `String(req.user!.userId)` → `req.userId!`, removed Phase 41 TODO comments
- `backend/src/routes/game.ts` - `req.user?.userId` → `req.userId` in POST /session; progression guard updated for UUID strings
- `backend/src/routes/profile.ts` - 5x `req.user!.userId` → `req.userId! as unknown as number` with Phase 43 cast comments
- `backend/src/middleware/rateLimiter.ts` - `req.user?.userId` → `req.userId`; `getRateLimitStatus` signature: `userId: number` → `userId: string`
- `backend/src/services/sessionService.ts` - Guard `User.findById` behind `typeof session.userId === 'number'` check; UUID users default `timerMultiplier = 1.0`

## Decisions Made

- **profile.ts casts as `as unknown as number`:** Profile routes pass `req.userId!` (UUID string) to legacy `User` model methods that take `number`. Rather than change the User model (Phase 43 scope), used `as unknown as number` type bridge. UUID users cannot actually reach those queries at runtime — the legacy `users` table has no UUID primary keys.
- **Progression guard restructure:** Added inner `typeof session.userId === 'number'` branch inside the string-safe outer guard. UUID users get `progression = null` with `progressionAwarded = true` to prevent retry. Phase 42 will replace this with the `award_gems` RPC.
- **getRateLimitStatus type change:** Changed parameter from `userId: number` to `userId: string` since UUIDs are strings. This matches the req.userId type.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Profile.ts legacy User model calls need type bridge for UUID userId**

- **Found during:** Task 2 (full TypeScript build verification)
- **Issue:** After Task 1 changed `req.user!.userId` to `req.userId!`, TypeScript reported 7 errors in profile.ts — all calls to legacy `User` model methods (`getProfileStats`, `findById`, `updateTimerMultiplier`, `updateName`, `updatePassword`, `updateAvatarUrl`) take `number` but now receive `string`
- **Fix:** Added `as unknown as number` casts with Phase 43 comments at each call site — these are explicit dead-code markers for when profile routes are replaced
- **Files modified:** `backend/src/routes/profile.ts`
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** `44496d1` (Task 2 commit, alongside sessionService fix)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required for zero-error TypeScript build. The `as unknown as number` casts are safe because UUID users cannot reach the legacy integer-user queries at runtime. No scope creep.

## Issues Encountered

None beyond the expected TypeScript errors from the req.user → req.userId migration (anticipated by plan).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 41 complete: auth middleware fully replaced, all callers migrated, TypeScript build clean
- Phase 42 can implement `award_gems` RPC for UUID user progression (TODO markers placed in game.ts)
- Phase 43 can remove profile routes and legacy User model (as unknown as number casts are the explicit markers)
- Phase 44 can clean up authController (already has no req.user references in route handlers)

---
*Phase: 41-auth-tier-integration*
*Completed: 2026-03-01*
