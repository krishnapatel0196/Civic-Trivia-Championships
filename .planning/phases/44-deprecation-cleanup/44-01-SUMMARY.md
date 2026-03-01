---
phase: 44-deprecation-cleanup
plan: 01
subsystem: auth
tags: [typescript, bcrypt, jsonwebtoken, redis, express, drizzle, supabase]

# Dependency graph
requires:
  - phase: 42-gem-progression-integration
    provides: calculateProgression, awardPlatformGems, upsertPlayerStats UUID-path
  - phase: 43-frontend-auth-profile
    provides: Supabase JWT auth middleware, UUID user identity throughout backend
provides:
  - Clean backend/src tree with all local auth dead code removed
  - sessionService with userId typed as string (no number union)
  - progressionService without updateUserProgression or User model
  - profile routes limited to GET / and PATCH /settings
  - redis.ts with storageFactory only (no legacyRedis export); getRawClient() for rate limiting
  - game.ts with UUID-only progression path
  - admin.ts flag detail without users table JOIN
affects:
  - 44-02 (env cleanup and migration — builds on this clean code state)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - storageFactory.getRawClient() for direct Redis access by rate limiter (replaces legacyRedis export)
    - GameSession.userId typed as string throughout — no integer user path remains

key-files:
  created: []
  modified:
    - backend/src/server.ts
    - backend/src/config/redis.ts
    - backend/src/routes/profile.ts
    - backend/src/services/progressionService.ts
    - backend/src/services/sessionService.ts
    - backend/src/routes/game.ts
    - backend/src/routes/admin.ts
    - backend/src/middleware/rateLimiter.ts

key-decisions:
  - "rateLimiter.ts used the deleted legacyRedis export — fixed by adding getRawClient() to SessionStorageFactory so rate limiter accesses the same Redis connection already managed by storageFactory"
  - "admin.ts flag detail now returns userId (UUID string) instead of username — accounts platform handles username resolution; admin UI shows UUID as fallback"
  - "profile.ts rewritten to GET / and PATCH /settings only — PATCH /name, PATCH /password, POST /avatar removed as all relied on the deleted User model"
  - "GameSession.userId changed from string | number to string — anonymous sessions remain as 'anonymous' string; integer user path fully removed"

patterns-established:
  - "All user identity is UUID string throughout backend — no integer user IDs remain anywhere"
  - "Rate limiter uses storageFactory.getRawClient() for raw Redis commands — SessionStorage interface is for game sessions only"

# Metrics
duration: 6min
completed: 2026-03-01
---

# Phase 44 Plan 01: Deprecation Cleanup — Legacy Auth Removal Summary

**9 legacy auth files deleted, 10 npm packages uninstalled, 7 files surgically cleaned of all integer-user paths and dead imports; TypeScript compiles clean with zero errors**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-01T18:22:47Z
- **Completed:** 2026-03-01T18:27:53Z
- **Tasks:** 2
- **Files modified:** 9 deleted + 8 edited = 17 total

## Accomplishments

- Deleted 9 legacy files: tokenUtils.ts, jwt.ts (config), authController.ts, User.ts (model), routes/auth.ts, validation.ts, middleware/validate.ts, schema.sql, rollback.sql
- Uninstalled 10 packages: bcrypt, @types/bcrypt, jsonwebtoken, @types/jsonwebtoken, cookie-parser, @types/cookie-parser, multer, @types/multer, file-type
- Removed all integer-user code paths from sessionService, game routes, and progressionService; GameSession.userId is now typed as `string`

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete legacy files and uninstall dead packages** - `63f75a0` (chore)
2. **Task 2: Surgical edits to 7 remaining files** - `8bc7fd6` (refactor)

## Files Created/Modified

**Deleted:**
- `backend/src/utils/tokenUtils.ts` - JWT generation, Redis blacklist logic
- `backend/src/config/jwt.ts` - JWT_SECRET, token expiry constants
- `backend/src/controllers/authController.ts` - signup/login/logout/refresh handlers
- `backend/src/models/User.ts` - local users table model
- `backend/src/routes/auth.ts` - 4 auth route registrations
- `backend/src/utils/validation.ts` - signupValidation, loginValidation, etc.
- `backend/src/middleware/validate.ts` - express-validator result checker
- `backend/schema.sql` - legacy PostgreSQL schema artifact
- `backend/rollback.sql` - legacy rollback script artifact

**Modified:**
- `backend/src/server.ts` - removed cookieParser, authRouter, /uploads static, /auth route
- `backend/src/config/redis.ts` - removed legacyRedis export; added getRawClient() method
- `backend/src/routes/profile.ts` - stripped to GET / and PATCH /settings only
- `backend/src/services/progressionService.ts` - removed User import and updateUserProgression
- `backend/src/services/sessionService.ts` - userId: string (no number union); removed integer user branch
- `backend/src/routes/game.ts` - removed updateUserProgression import; Map<string,string[]>; UUID-only results handler
- `backend/src/routes/admin.ts` - flag detail query without users JOIN; returns userId UUID
- `backend/src/middleware/rateLimiter.ts` - uses storageFactory.getRawClient() instead of deleted redis export

## Decisions Made

- **getRawClient() on SessionStorageFactory:** rateLimiter.ts imported `redis` from the deleted `legacyRedis` export. Instead of creating a new Redis client, added `getRawClient()` to `SessionStorageFactory` so the rate limiter reuses the single Redis connection already managed by storageFactory. Clean, no duplication.
- **admin.ts flag response shape:** `flags[].username` replaced by `flags[].userId` (UUID string). Admin UI can resolve display names via accounts platform; returning UUID is accurate.
- **profile.ts full rewrite:** The PATCH /name, PATCH /password, and POST /avatar routes all required the deleted User model. Since the plan confirmed the frontend does not call these routes, they were removed entirely rather than stubbed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] rateLimiter.ts imported deleted `redis` export**
- **Found during:** Task 2 — TypeScript build check after surgical edits
- **Issue:** `src/middleware/rateLimiter.ts(7,10): error TS2305: Module '"../config/redis.js"' has no exported member 'redis'` — rateLimiter.ts used the `legacyRedis as redis` export that was deleted from config/redis.ts
- **Fix:** Added `getRawClient(): RedisClientType | null` method to `SessionStorageFactory`; rewrote rateLimiter.ts to call `storageFactory.getRawClient()` instead of importing `redis`. Same Redis connection, no duplication.
- **Files modified:** backend/src/config/redis.ts, backend/src/middleware/rateLimiter.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors after fix
- **Committed in:** `8bc7fd6` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for TypeScript build to pass. No scope creep — rateLimiter functionality preserved, architecture improved (single Redis connection instead of two).

## Issues Encountered

None beyond the rateLimiter blocking issue documented above.

## Next Phase Readiness

- All legacy auth code removed; backend/src is clean
- TypeScript builds with zero errors
- Plan 44-02 can proceed: env.ts cleanup, .env.example rewrite, Supabase migration for DROP TABLE IF EXISTS trivia.users

---
*Phase: 44-deprecation-cleanup*
*Completed: 2026-03-01*
