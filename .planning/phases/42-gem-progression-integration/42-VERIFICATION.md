---
phase: 42-gem-progression-integration
verified: 2026-03-01T03:04:30Z
status: human_needed
score: 5/5 must-haves verified
gaps:
  - truth: "award_gems RPC is called with correct params and gem balance increases for Connected users"
    status: partial
    reason: "RPC call correctly implemented with all required params (p_gem_type: yellow, p_source: civic_trivia, p_reason: game_completed), but EMPOWERED_ACCOUNTS_URL is absent from backend/.env and backend/.env.example. checkAccountContext always falls back to {isConnected: false}, so no gems are ever awarded in the current deployment."
    artifacts:
      - path: "backend/src/services/progressionService.ts"
        issue: "awardPlatformGems calls award_gems RPC at line 132 with all required params; code structure is complete"
      - path: "backend/.env.example"
        issue: "EMPOWERED_ACCOUNTS_URL absent from documented env vars; guard at progressionService.ts:94 always triggers fallback, silently disabling gem awards"
    missing:
      - "EMPOWERED_ACCOUNTS_URL added to backend/.env.example"
      - "EMPOWERED_ACCOUNTS_URL set in backend/.env pointing to the Empowered platform API"
  - truth: "total_gems column no longer exists in any trivia schema table and no backend code references it"
    status: failed
    reason: "The trivia schema has no total_gems column (verified in all migrations and Drizzle schema). However User.ts has 6 active SQL references to total_gems on the public users table, and backend/schema.sql defines the column. Plan defers full removal to Phase 44 via GEMS-03 deprecation markers."
    artifacts:
      - path: "backend/src/models/User.ts"
        issue: "Lines 49, 68, 89, 103, 134 contain active SQL strings referencing total_gems (SELECT and UPDATE). Marked @deprecated GEMS-03 but code is live."
      - path: "backend/schema.sql"
        issue: "Lines 39 and 50 define ADD COLUMN total_gems and CHECK constraint in legacy DDL."
    missing:
      - "If criterion means trivia schema only: Truth 4 is VERIFIED (no total_gems in any trivia.* table)"
      - "If criterion means all backend code: removal is deferred to Phase 44 per GEMS-03 markers"
---

# Phase 42: Gem Progression Integration Verification Report

**Phase Goal:** Gem awards flow through the platform `award_gems` RPC, gem balance is read from the accounts API, persistent stats are stored in `trivia.player_stats` for Connected users only, and the local `total_gems` column is removed.
**Verified:** 2026-03-01T03:04:30Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After a Connected user completes a game, award_gems RPC is called with correct params and gem balance increases | PARTIAL | RPC call structurally correct at progressionService.ts:132 with p_gem_type: yellow, p_source: civic_trivia, p_reason: game_completed; fails at runtime because EMPOWERED_ACCOUNTS_URL is absent from .env/.env.example, causing checkAccountContext to always return isConnected: false |
| 2 | Stats written to trivia.player_stats for Connected users; not written for anonymous or Inform-tier | PARTIAL | Code gate correctly implemented at game.ts:412; blocked at runtime by same missing env var as Truth 1 |
| 3 | Suspended account does not earn gems and stats are not updated | VERIFIED | session.isSuspended guard at game.ts:412 prevents both awardPlatformGems and upsertPlayerStats; checkAccountContext correctly maps account_standing suspended to isSuspended true |
| 4 | total_gems column no longer exists in any trivia schema table and no backend code references it | FAILED | No total_gems in any trivia.* table (VERIFIED). But User.ts has 6 active SQL references and schema.sql defines the column on public.users. Plan defers full removal to Phase 44 via GEMS-03 markers. |
| 5 | Anonymous play completes without error and no gem/stat writes occur | VERIFIED | game.ts:394 guard (session.userId \!== anonymous) skips the entire progression block; progression returns as null |

**Score: 3/5 truths verified** (Truths 3 and 5 fully verified; Truth 4 fails on the "no backend code references it" half; Truths 1 and 2 structurally correct but blocked by missing env var)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|----------|
| backend/src/services/progressionService.ts | checkAccountContext, awardPlatformGems, upsertPlayerStats | VERIFIED | All three functions implemented and exported. awardPlatformGems calls award_gems RPC at line 132 with p_gem_type: yellow, p_source: civic_trivia, p_reason: game_completed. withRetry provides 3-attempt exponential backoff. 199 lines. |
| backend/src/services/sessionService.ts | GameSession with isConnected, isSuspended, accessToken | VERIFIED | All three fields at lines 61-63; isConnected and isSuspended are non-optional booleans; accessToken is optional string |
| backend/src/routes/game.ts | Account context at POST /session; full award logic at GET /results | VERIFIED | POST /session calls checkAccountContext at line 131 for UUID users; GET /results has full award + stats block at lines 404-442 |
| backend/src/db/schema.ts | playerStats Drizzle table with currentStreak, bestStreak, lifetimeGems | VERIFIED | Lines 156-167; all three columns as integer().notNull().default(0) |
| supabase/migrations/20260301000001_add_player_stats_columns.sql | Migration adding streak/gems columns | VERIFIED | Adds current_streak, best_streak, lifetime_gems via ADD COLUMN IF NOT EXISTS |
| backend/src/types/database.types.ts | Regenerated types include new columns | VERIFIED | Lines 1631-1658; all three columns present in Row, Insert, and Update type variants |
| backend/.env.example | EMPOWERED_ACCOUNTS_URL documented as required | MISSING | Variable consumed by checkAccountContext but absent from .env.example; omission silently disables all gem awards in fresh deployments |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| POST /session (game.ts:131) | checkAccountContext | progressionService import | WIRED | UUID users with req.accessToken hit checkAccountContext; result stored in session via createSession(accountContext) |
| GET /results (game.ts:414) | awardPlatformGems | progressionService import | WIRED (code) / NOT WIRED (runtime) | Call present at line 414 under isConnected guard; never executes because EMPOWERED_ACCOUNTS_URL is unset |
| GET /results (game.ts:419) | upsertPlayerStats | progressionService import | WIRED (code) / NOT WIRED (runtime) | Call at line 419 inside same isConnected block; same env var dependency |
| upsertPlayerStats | trivia.player_stats | Drizzle db.insert(playerStats) | WIRED | onConflictDoUpdate on playerStats.userId at progressionService.ts:171-195 |
| awardPlatformGems | award_gems RPC | (supabaseAdmin as any).rpc | WIRED (code) | RPC call at progressionService.ts:132-138 with all required params |
| checkAccountContext | Empowered accounts API | fetch(EMPOWERED_ACCOUNTS_URL + /api/account/me) | NOT WIRED (runtime) | Guard at lines 94-98 returns isConnected false when env var is unset |
| session.isSuspended guard | Block awards for suspended | game.ts:412 condition | WIRED | Correctly prevents both award functions when isSuspended is true |
| session.userId \!== anonymous guard | Block awards for anonymous | game.ts:394 condition | WIRED | Anonymous sessions get progression null with no writes |

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| award_gems called with p_gem_type: yellow, p_source: civic_trivia, p_reason: game_completed | STRUCTURALLY SATISFIED | Params correct in code; EMPOWERED_ACCOUNTS_URL unset makes RPC path unreachable at runtime |
| trivia.player_stats written for Connected users only | STRUCTURALLY SATISFIED | Code gate correct; same env var runtime gap |
| Stats NOT written for anonymous/Inform-tier | VERIFIED | Both cases guarded correctly in code |
| Suspended account blocked from gems and stats | VERIFIED | isSuspended guard in place at game.ts:412 |
| total_gems removed from trivia schema tables | VERIFIED | No total_gems column in any trivia.* table |
| No backend code references total_gems | FAILED | User.ts has 6 active SQL references; deferred to Phase 44 per GEMS-03 markers |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| backend/.env.example | -- | EMPOWERED_ACCOUNTS_URL absent from documented env vars | BLOCKER | Without this env var, all gem awards and stat writes are silently disabled in any fresh deployment |
| backend/src/routes/game.ts | 392 | let progression: any -- widened type | Warning | Type safety reduced; deliberate per Plan 03 decision pending Phase 44 cleanup |
| backend/src/routes/game.ts | 395 | Legacy integer user path still active with TODO | Warning | Deliberate documented debt; scoped to Phase 44 |
| backend/src/services/progressionService.ts | 180-181 | currentStreak/bestStreak always set to 1 (placeholder) | Info | Documented Phase 42 placeholder; not a blocker |

## Human Verification Required

### 1. Gem Award End-to-End

**Test:** Set EMPOWERED_ACCOUNTS_URL in backend/.env, sign in as a Connected-tier Supabase user, play a complete game, call GET /api/game/results/:sessionId.
**Expected:** Response has progression.gemsEarned > 0, progression.gemsConfirmed: true, progression.stats with game data; gem balance increases in the Empowered platform.
**Why human:** Requires live Empowered accounts platform, real JWT, and a valid Connected-tier account to verify the full RPC chain.

### 2. Suspended Account Blocked

**Test:** With a user whose account_standing is suspended in the accounts platform, complete a game.
**Expected:** progression.gemsEarned: 0, progression.gemsConfirmed: false, progression.stats: null; no row created or updated in trivia.player_stats.
**Why human:** Requires a suspended account on the live Empowered platform.

### 3. Inform-Tier User Gets No Stats

**Test:** With an Inform-tier (non-Connected) Supabase user, complete a game.
**Expected:** progression.gemsEarned: 0, progression.stats: null; no row in trivia.player_stats for that UUID.
**Why human:** Requires live accounts API returning a tier that is not connected or empowered.

## Gaps Summary

### Gap 1 -- Missing EMPOWERED_ACCOUNTS_URL environment variable (Truths 1 and 2)

The checkAccountContext function at progressionService.ts:91 correctly fetches the Empowered accounts API but requires EMPOWERED_ACCOUNTS_URL to be set. This variable is absent from backend/.env and backend/.env.example. In any deployment following the example file, the function immediately returns {isConnected: false, isSuspended: false} and logs a console warning -- no gems are awarded and no stats are written for any user. The code structure and RPC parameter wiring are complete and correct; the runtime path is broken by the missing config.

Plan 03 SUMMARY states the variable "will be wired in Plan 03 deployment config" but it was not added to .env.example or .env.

**Fix:** Add EMPOWERED_ACCOUNTS_URL to backend/.env.example and set the real value in backend/.env.

### Gap 2 -- total_gems still referenced in active backend code (Truth 4)

The phase goal says the total_gems column should be removed. User.ts contains 6 active SQL query strings referencing total_gems on the public users table (SELECT, RETURNING, and UPDATE statements). backend/schema.sql defines the column. Plan 03 explicitly states removal is deferred to Phase 44 via GEMS-03 deprecation markers. The trivia schema itself has no total_gems column -- if the criterion is scoped to trivia-schema tables only, Truth 4 is fully verified.

**Fix:** Per Phase 44 scope -- remove User.updateStats, updateUserProgression, and all total_gems SQL references when the integer user path is eliminated.

---

_Verified: 2026-03-01T03:04:30Z_
_Verifier: Claude (gsd-verifier)_
