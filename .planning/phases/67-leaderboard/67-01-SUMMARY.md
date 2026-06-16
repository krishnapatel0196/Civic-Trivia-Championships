---
phase: 67-leaderboard
plan: 01
subsystem: api
tags: [express, supabase, redis, leaderboard, xp, caching]

# Dependency graph
requires:
  - phase: 66-gem-award-migration
    provides: shared Supabase project context, supabaseAdmin pattern
  - phase: 53-xp-backend-integration
    provides: connect.xp_transactions table, connect.connected_profiles table
provides:
  - GET /api/leaderboard endpoint returning ranked player data from Supabase
  - All-time tab (top 25 by total_xp from connected_profiles)
  - This-week tab (rolling 7-day XP sum from xp_transactions)
  - Optional userId param for personal rank with gap_to_next
  - 5-minute TTL cache via raw Redis client with in-memory fallback
affects: [67-02-frontend-leaderboard, 67-03-nav-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Raw Redis client (storageFactory.getRawClient()) for non-session string caching
    - supabaseAdmin.schema('connect').from() for direct connect schema table access
    - Module-level Map as in-memory cache fallback for degraded mode

key-files:
  created:
    - backend/src/routes/leaderboard.ts
  modified:
    - backend/src/server.ts

key-decisions:
  - "Direct .schema('connect').from() access works via supabaseAdmin service role — no SECURITY DEFINER function needed"
  - "Tier derived from verification_status: 'verified' → 'connected', else 'inform' (empowered tier not distinguishable from DB alone)"
  - "Raw Redis client (storageFactory.getRawClient()) used for leaderboard cache — SessionStorage abstraction types to GameSession, cannot store arbitrary strings"
  - "In-memory fallback cache (module-level Map) for degraded/dev mode — avoids dependency on SessionStorage abstraction"
  - "Cache keys split: leaderboard:entries:{tab} shared across all visitors; leaderboard:rank:{tab}:{userId} personalized"
  - "This-week aggregation done in JS after fetching all transactions — Supabase JS client doesn't support GROUP BY directly"

patterns-established:
  - "Raw Redis pattern: storageFactory.getRawClient() + memCache fallback for non-GameSession string caching"
  - "connect schema access: supabaseAdmin.schema('connect').from(tableName) — works without SECURITY DEFINER wrapper"

# Metrics
duration: 12min
completed: 2026-03-17
---

# Phase 67 Plan 01: Leaderboard Backend Summary

**Public GET /api/leaderboard endpoint querying Supabase connect schema directly for ranked XP data with 5-minute Redis cache, supporting all_time and this_week tabs plus personal rank with gap_to_next**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-17T16:37:49Z
- **Completed:** 2026-03-17T16:49:40Z
- **Tasks:** 2 (schema inspection + route implementation)
- **Files modified:** 2

## Accomplishments
- Inspected Supabase `connect` schema and confirmed direct table access works via supabaseAdmin service role
- Built `GET /api/leaderboard` with all_time tab (connected_profiles ORDER BY total_xp) and this_week tab (xp_transactions rolling 7-day SUM aggregated in JS)
- Personal rank endpoint: optional `userId` param returns rank position, tier, level, total_xp, and gap_to_next
- 5-minute cache using raw Redis client with in-memory Map fallback for degraded mode
- Route registered as public (no auth middleware) at `/api/leaderboard` in server.ts

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: Schema inspection + leaderboard route** - `4a39058` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/routes/leaderboard.ts` - Express route with Supabase query and Redis/memory cache
- `backend/src/server.ts` - Leaderboard router registered at /api/leaderboard

## Decisions Made
- **Direct table access works:** `supabaseAdmin.schema('connect').from()` bypasses PostgREST schema restrictions via service role key. No SECURITY DEFINER function needed (contrary to what was anticipated in the plan).
- **SessionStorage can't store arbitrary strings:** The `RedisStorage.get()` implementation wraps keys with `session:` prefix and parses results as GameSession (setting `createdAt` Date field). Used `storageFactory.getRawClient()` directly instead, with a module-level Map fallback for degraded mode.
- **Tier derivation:** `verification_status === 'verified'` → `'connected'`; anything else → `'inform'`. The `empowered` tier is not distinguishable from the connect schema alone (no explicit tier column found).
- **This-week aggregation in JS:** Supabase JS client doesn't expose GROUP BY. Fetched all transactions from last 7 days and aggregated in JavaScript. At current user count this is negligible; a DB function can be added when scale requires it.
- **Cache key strategy:** Entries cache is shared (`leaderboard:entries:{tab}`) to benefit all visitors. User rank cache is personalized (`leaderboard:rank:{tab}:{userId}`) to avoid serving stale rank data to different users.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SessionStorage abstraction incompatible with string caching**
- **Found during:** Task 2 (testing the route)
- **Issue:** `RedisStorage.get()` tries to set `createdAt` as a Date on the returned object — crashes with "Cannot create property 'createdAt' on string" when the stored value is a JSON string, not a GameSession.
- **Fix:** Used `storageFactory.getRawClient()` (raw Redis client) for leaderboard cache operations; added module-level `Map<string, {value, expiresAt}>` as in-memory fallback for degraded/dev mode.
- **Files modified:** backend/src/routes/leaderboard.ts
- **Verification:** All four curl tests pass returning correct JSON.
- **Committed in:** 4a39058 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in storage abstraction usage)
**Impact on plan:** Required fix. The cache now works correctly with both Redis and in-memory fallback. No scope creep.

## Issues Encountered
- `userRank === undefined` sentinel bug: initialized `userRank` as `null` but checked for `undefined` to detect "not yet computed" state — resulted in 503 on all userId requests. Fixed by using a Symbol sentinel (`UNCACHED`) to distinguish cache miss from cached-null.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend endpoint fully operational: `GET /api/leaderboard?tab=all_time|this_week&userId=<optional-uuid>`
- Both tabs return correct data from Supabase
- Cache confirmed working (5-minute TTL, Redis in production)
- Ready for Phase 67-02 (frontend leaderboard page)

---
*Phase: 67-leaderboard*
*Completed: 2026-03-17*
