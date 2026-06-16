# Phase 71: Leaderboard Cache Fix - Research

**Researched:** 2026-03-19
**Domain:** Express.js route-level cache TTL configuration
**Confidence:** HIGH

## Summary

This phase is a single-line change. The leaderboard cache TTL is a hardcoded module-level constant in `backend/src/routes/leaderboard.ts`. There are no environment variable overrides, no external config files, and no abstraction layers to navigate. The caching strategy applies to both cache keys used by the route: `leaderboard:entries:{tab}` (shared across all visitors) and `leaderboard:rank:{tab}:{userId}` (personalized per user). Both use the same `CACHE_TTL` constant.

The cache implementation is a custom dual-backend system: Redis via `setEx()` when `REDIS_URL` is configured, in-memory `Map` otherwise. Both backends are already wired correctly — the TTL is passed as a parameter to `cacheSet()` which handles both paths. Changing `CACHE_TTL` from 300 to 60 automatically reduces TTL in both storage backends.

There are no existing tests for the leaderboard route at the project level. Manual verification (the approach specified in LEAD-02) is appropriate: earn XP with a connected account, wait up to ~1 minute, reload the leaderboard, confirm updated rank.

**Primary recommendation:** Change `const CACHE_TTL = 300;` to `const CACHE_TTL = 60;` on line 29 of `backend/src/routes/leaderboard.ts` and update the file header comment from "5-minute cache" to "60-second cache".

## Standard Stack

No new libraries needed. This phase uses only existing code.

### Core (already in use)
| Component | Location | Purpose | Notes |
|-----------|----------|---------|-------|
| `redis` npm package | `backend/src/config/redis.ts` | Redis client via `storageFactory.getRawClient()` | `setEx(key, ttlSeconds, value)` API |
| In-memory Map fallback | `backend/src/routes/leaderboard.ts` | Fallback cache when Redis unavailable | TTL enforced via `expiresAt: Date.now() + ttlSeconds * 1000` |

**Installation:** No new packages required.

## Architecture Patterns

### Cache Key Structure (existing)
```
leaderboard:entries:all_time        — top-25 entries, shared across visitors
leaderboard:entries:this_week       — top-25 weekly entries, shared
leaderboard:rank:all_time:{userId}  — personalized rank for a given user
leaderboard:rank:this_week:{userId} — personalized weekly rank for a given user
```

All four key patterns use `CACHE_TTL` uniformly.

### TTL Flow (existing)
```
Request hits GET /api/leaderboard
  → cacheGet(entriesCacheKey)
      → Redis: GET key (returns null if expired by Redis TTL)
      → MemCache: checks expiresAt manually
  → cache miss → fetchAllTimeEntries() or fetchThisWeekEntries()
  → cacheSet(key, value, CACHE_TTL)  ← TTL applied here
      → Redis: setEx(key, ttlSeconds, value)
      → MemCache: { value, expiresAt: Date.now() + ttlSeconds * 1000 }
```

### The Change
```typescript
// Before (line 29):
const CACHE_TTL = 300; // 5 minutes in seconds

// After:
const CACHE_TTL = 60; // 60 seconds — XP updates visible within ~1 minute
```

Also update the file header JSDoc comment on line 2:
```typescript
// Before:
 * GET /api/leaderboard — Public leaderboard route with 5-minute cache.

// After:
 * GET /api/leaderboard — Public leaderboard route with 60-second cache.
```

### Anti-Patterns to Avoid
- **Introducing env var override for TTL:** No existing env var pattern for this route; adding one is over-engineering for a simple value change.
- **Separate TTL for entries vs. rank keys:** Both keys have the same freshness requirement. Keep them unified via the single constant.
- **Cache invalidation (push-based):** Explicitly deferred to LEAD-F01. Do not implement in this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTL reduction | New cache abstraction layer | Change the existing constant | Abstraction already exists and works |
| Instant invalidation | Cross-route cache clearing | Lower TTL (pull-based) | Push-based is deferred; pull-based is sufficient |

**Key insight:** The existing `cacheSet` abstraction already threads `ttlSeconds` through to both Redis `setEx` and the in-memory Map. The TTL is already parameterized — only the value needs to change.

## Common Pitfalls

### Pitfall 1: Forgetting the file header comment
**What goes wrong:** The JSDoc on line 2 still says "5-minute cache" after the constant is changed.
**Why it happens:** Comment and constant are in different places in the file (line 2 vs. line 29).
**How to avoid:** Update both in the same edit.
**Warning signs:** Search for "5-minute" or "5 minutes" in the file after editing.

### Pitfall 2: Assuming only one cache key uses the constant
**What goes wrong:** Developer checks that `entriesCacheKey` uses `CACHE_TTL` but misses that `rankCacheKey` also uses it (line 375).
**Why it happens:** The `cacheSet` call for rank is deeper in the conditional block.
**How to avoid:** Verify both `cacheSet` calls reference `CACHE_TTL` — they already do; the constant change covers both.
**Warning signs:** Either key path still caching for 5 minutes after the change.

### Pitfall 3: Expecting immediate reflection of existing cached values
**What goes wrong:** TTL change doesn't affect already-cached entries (existing Redis keys expire on their original schedule).
**Why it happens:** Redis `setEx` sets TTL at write time. Keys written before the deploy still have their old TTL.
**How to avoid:** Accept that the first 5 minutes after deploy may still serve some cached data. After all keys expire naturally, new cache writes will use the 60s TTL. This is expected and acceptable.
**Warning signs:** Testing immediately after deploy and not seeing the new TTL in effect — wait 5 minutes or flush Redis manually.

## Code Examples

### Current implementation (lines 29, 367, 375 — no change needed to logic)
```typescript
// Source: backend/src/routes/leaderboard.ts (direct file inspection)
const CACHE_TTL = 300; // 5 minutes in seconds — CHANGE THIS TO 60

// ...

await cacheSet(entriesCacheKey, JSON.stringify(entries), CACHE_TTL);  // line 367
// ...
await cacheSet(rankCacheKey, JSON.stringify(computed), CACHE_TTL);    // line 375
```

### Redis TTL path (for reference)
```typescript
// Source: backend/src/routes/leaderboard.ts lines 51-57
async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redisClient = storageFactory.getRawClient();
  if (redisClient) {
    await redisClient.setEx(key, ttlSeconds, value);  // Redis handles expiry
    return;
  }
  memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 }); // in-memory handles expiry
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 5-minute TTL (300s) | 60-second TTL | Phase 71 | XP updates visible within ~1 minute |

**No deprecated patterns:** This is purely a configuration value change within existing, working code.

## Open Questions

None. The implementation is fully understood from direct code inspection.

1. **Redis TTL on existing keys after deploy**
   - What we know: Existing cached keys in Redis retain their original TTL until they naturally expire
   - What's unclear: Whether the test environment uses Redis or in-memory fallback
   - Recommendation: For manual verification (LEAD-02), wait 5 minutes after deploy before testing, OR flush Redis manually if access is available. Alternatively, test with a fresh userId that has never been cached.

## Sources

### Primary (HIGH confidence)
- Direct inspection of `backend/src/routes/leaderboard.ts` — full file read, confirmed CACHE_TTL constant location (line 29), both cacheSet call sites (lines 367, 375), and JSDoc comment (line 2)
- Direct inspection of `backend/src/config/redis.ts` — confirmed `storageFactory.getRawClient()` returns `RedisClientType | null`, and `setEx(key, ttlSeconds, value)` is the Redis write path

### Secondary (MEDIUM confidence)
N/A — all findings from direct codebase inspection.

### Tertiary (LOW confidence)
N/A — no unverified claims.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by direct file reads, no external libraries needed
- Architecture: HIGH — cache key structure and TTL flow confirmed by reading full route implementation
- Pitfalls: HIGH — directly observed from code structure (two cacheSet call sites, comment/constant separation)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable code — no external dependencies changing)
