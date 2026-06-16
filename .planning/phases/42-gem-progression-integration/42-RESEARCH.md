# Phase 42: Gem & Progression Integration — Research

**Researched:** 2026-02-28
**Status:** Complete

---

## 1. Where Phase 41 Left Off

`GET /results/:sessionId` in `backend/src/routes/game.ts` (lines ~382–407) already has the UUID branch with explicit `TODO Phase 42: Replace with award_gems RPC` comments. For UUID sessions:

```ts
// UUID users: progression disabled until Phase 42 implements award_gems RPC
progression = null;
session.progressionAwarded = true; // prevent retry
```

This is the primary insertion point for Phase 42 work.

---

## 2. award_gems RPC — Confirmed Signature

From the integration guide:

```typescript
const { error } = await supabaseAdmin.rpc('award_gems', {
  p_user_id: userId,       // UUID string
  p_gem_type: 'yellow',    // civic knowledge
  p_amount: 50,            // calculated from game
  p_reason: 'game_completed',
  p_source: 'civic_trivia',
});
```

Called via `supabaseAdmin` (service role). Immediately visible in `GET /api/gems/balance` and admin dashboard.

---

## 3. XP Mechanism — Open Question

The integration guide shows `xp: 120` on `connected_profile` in the `GET /api/account/me` response but documents **no `award_xp` RPC or endpoint**. Only `award_gems` is documented for rewarding users.

**Decision (per REQUIREMENTS.md XP-01):** Phase 42 tracks XP in `trivia.player_stats.total_xp` only. This is trivia-local XP (correct answers count). Platform XP integration via `connected_profile.xp` is deferred pending confirmation of API mechanism.

---

## 4. Suspension Detection

**Mechanism:** `GET /api/account/me` (accounts API, Bearer token) returns:
```json
{ "account_standing": "active" | "suspended" }
```

**Per CONTEXT decisions:**
- Check at **game start** (`POST /session`): record `isSuspended` flag on the session
- Check at **game submission** (`GET /results/:sessionId`): read from session — no second live API call
- Suspended users complete the game normally but earn no gems and no stats are written

**Implementation note:** The accounts API call requires the user's `accessToken` (already stored in session via `req.accessToken` from `requireAuth`/`optionalAuth` middleware). The `optionalAuth` middleware sets `req.accessToken` when a valid JWT is present.

However, `POST /session` currently uses `optionalAuth` — anonymous users won't have a token and don't need a suspension check. Only UUID users (authenticated) need the check.

**Session model addition needed:**

```typescript
interface GameSession {
  // ... existing fields ...
  isSuspended: boolean;           // recorded at game start for Connected users
  isConnected: boolean;           // whether user was Connected at session start
  accessToken?: string;           // stored for downstream platform calls
}
```

---

## 5. Tier Detection at Game Start

**Mechanism:** Query `connect.connected_profiles` via `supabaseAdmin.schema('connect')` (already pattern-established in `requireConnected` middleware). Alternatively, call `GET /api/account/me` with the user's token.

**Per CONTEXT:** Stats are written only for sessions **started** while Connected. Mid-session tier upgrades don't retroactively enable stat writes. So tier check happens at session creation time and is stored on the session.

**Most efficient:** Single call to `GET /api/account/me` at game start gives both `tier` and `account_standing` in one request. If token is absent (anonymous), skip both checks.

---

## 6. player_stats Table — Schema Gap

The existing migration (`20260228000001_create_trivia_schema.sql`) created:
```
user_id, total_xp, games_played, best_score, total_correct, total_questions, updated_at
```

CONTEXT decisions specify these additional columns Phase 42 should design:
- `current_streak` — playing streak in days
- `best_streak` — best streak ever
- `lifetime_gems` — total gems earned via trivia (local tracking)

**Action needed:** New Supabase migration to add these 3 columns. The Drizzle schema (`backend/src/db/schema.ts`) also needs updating.

**Note on `lifetime_gems`:** Per CONTEXT, if a gem award failed (award_gems RPC returned error), we do NOT increment `lifetime_gems`. Only count confirmed awards.

---

## 7. Gem Amount Formula

The legacy `progressionService.ts` formula: `gemsEarned = 10 + correctAnswers`. This is reasonable for Phase 42. The exact retry count and backoff for failed RPC calls are at Claude's discretion (CONTEXT).

---

## 8. total_gems Column Removal (GEMS-03)

`total_gems` column exists in the **legacy PostgreSQL `users` table** accessed via `backend/src/models/User.ts` (pool queries). This is a local table separate from Supabase.

The Drizzle/Supabase schema (`trivia.player_stats`) does NOT have `total_gems` — gem balance comes from the platform via `GET /api/gems/balance`.

**GEMS-03 scope:** Remove `total_gems` from the legacy `User` model and ensure no code path writes to it for UUID users. The legacy table is for integer-ID users only and will be fully removed in Phase 44 (deprecation). Phase 42 should:
1. Stop writing `total_gems` in any code path that handles UUID users
2. Document it as deprecated (removal in Phase 44)

**The legacy `updateUserProgression` function** (`progressionService.ts`) calls `User.updateStats` which writes `total_gems`. This path is already gated behind `typeof session.userId === 'number'` in `game.ts`, so UUID users already don't hit it.

---

## 9. Disconnect Icon — Frontend

Asset confirmed at: `frontend/public/images/noun-disconnect-6883726-03B9D2.svg`

CONTEXT: subtle disconnect icon in lower-left corner when platform calls fail. Per CONTEXT, at Claude's discretion whether it's persistent indicator or transient toast.

**Phase 42 scope (backend only per CONTEXT boundary):** The backend needs to include failure signals in API responses. The actual icon rendering is frontend work — but CONTEXT says "No frontend changes in this phase."

**Resolution:** Backend includes `gems_earned: null` and `rewards_failed: true` (or a descriptive message) in game results response when award_gems fails after retries. The frontend already receives `progression` from the response — Phase 42 shapes this to signal failure. Frontend icon work is Phase 43 or later.

---

## 10. Game Results Response Shape

Per CONTEXT: include `gems_earned` in game completion response. Reflect actual outcome.

```typescript
// Success
progression = {
  gemsEarned: 24,        // actual gems awarded
  gemsConfirmed: true,
  stats: { gamesPlayed: 5, bestScore: 420, ... }
}

// Failure after retries
progression = {
  gemsEarned: 0,
  gemsConfirmed: false,
  message: "We had trouble recording your rewards — we'll resolve this when your connection improves."
}
```

---

## 11. Retry Strategy

Per CONTEXT: "retry a small number of times, then log and continue." Claude's discretion.

**Recommendation:** 3 attempts with exponential backoff (200ms, 400ms, 800ms). This totals <1.5s added latency on failure, acceptable for a results endpoint.

---

## 12. Files That Will Be Modified

| File | Change |
|------|--------|
| `backend/src/services/sessionService.ts` | Add `isSuspended`, `isConnected`, `accessToken` to `GameSession` |
| `backend/src/routes/game.ts` | Suspension check at session start; award_gems + player_stats at results |
| `backend/src/services/progressionService.ts` | New `awardPlatformGems` and `upsertPlayerStats` functions |
| `backend/src/db/schema.ts` | Add `current_streak`, `best_streak`, `lifetime_gems` to `playerStats` |
| `supabase/migrations/` | New migration: add columns to `trivia.player_stats` |
| `backend/src/types/database.types.ts` | Regenerate after migration |

---

## 13. Wave Structure Recommendation

**Wave 1** (foundation):
- Schema migration: add `current_streak`, `best_streak`, `lifetime_gems` columns
- Update Drizzle schema and regenerate types

**Wave 2** (service layer):
- `progressionService.ts`: add `awardPlatformGems`, `upsertPlayerStats`, `checkAccountStanding` functions
- `sessionService.ts`: extend `GameSession` with `isSuspended`, `isConnected`

**Wave 3** (route wiring):
- `game.ts POST /session`: suspension + tier check
- `game.ts GET /results/:sessionId`: replace TODO with actual gem award + stat write

---

*Research complete — ready for planning*
