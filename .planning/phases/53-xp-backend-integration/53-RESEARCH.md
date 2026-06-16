# Phase 53: XP Backend Integration - Research

**Researched:** 2026-03-05
**Domain:** Server-to-server XP award integration (Node.js/Express backend calling Empowered Accounts API)
**Confidence:** HIGH — all findings are from direct codebase inspection and the authoritative integration guide

---

## Summary

Phase 53 awards XP to Connected players after each game by calling the Empowered Accounts `POST /api/xp/award` endpoint from CTC's backend. All required infrastructure already exists in the codebase: sessions already carry `isConnected`, `isSuspended`, `accessToken`, and `userId`; the results route already has the exact insertion point (the `if (session.isConnected && !session.isSuspended)` block at line 403 of game.ts); and `progressionService.ts` already defines the retry/error-swallowing patterns this feature must follow.

The primary design decision is whether to add `awardPlatformXp()` directly into `progressionService.ts` or create a new `xpService.ts`. Given that `progressionService.ts` is already responsible for all platform API calls (`checkAccountContext`, `awardPlatformGems`) and follows a consistent pattern (never throws, returns result object, uses `withRetry`), XP should live there too. A separate `xpService.ts` would add indirection without benefit.

The `sessionId` (a `randomUUID()` generated at session creation) is already a server-generated unique UUID and is sufficient as the `gameId`. The idempotency key is therefore `ctc-game-${session.sessionId}-${session.userId}`, requiring no new fields on the session. The XP result should be stored on the session as `xpResult` (nullable) so the results endpoint can include it in the response for Phase 54's UI without a second API call.

**Primary recommendation:** Add `awardPlatformXp()` to `progressionService.ts`, call it immediately after `awardPlatformGems()` in the results route, store the XP response on the session as `xpResult`, and return it inside the `progression` object — never letting XP failure block the game results response.

---

## Standard Stack

No new npm dependencies are required. All functionality is achievable with Node.js built-in `fetch` (already used in `progressionService.ts` for `checkAccountContext`) and the existing project structure.

### Core (existing, no installation needed)
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| Node.js `fetch` | Built-in (Node 18+) | HTTP calls to Empowered Accounts API | Already used in progressionService.ts |
| `randomUUID` from `crypto` | Built-in | Session ID generation | Already used in sessionService.ts |
| `process.env` | Built-in | Env var access | Already used throughout |

### New Env Vars Required
| Var | Purpose | Where Documented |
|-----|---------|-----------------|
| `TRIVIA_SERVICE_KEY` | Auth header for `POST /api/xp/award` | Must add to `.env.example` |
| `EMPOWERED_ACCOUNTS_API_URL` | Base URL for Empowered Accounts API (separate from `EMPOWERED_ACCOUNTS_URL`) | Must add to `.env.example` |

**Note:** The existing var is `EMPOWERED_ACCOUNTS_URL` (used in `checkAccountContext`). The XP spec names the new var `EMPOWERED_ACCOUNTS_API_URL`. These may or may not be the same value in practice — but the spec calls them out separately. The implementation should validate `EMPOWERED_ACCOUNTS_API_URL` explicitly per XP-05.

**No new npm packages required.**

---

## Architecture Patterns

### Existing Pattern: How progressionService.ts Works

All platform API calls follow this pattern — XP must follow it too:

1. Check if env var is set; warn and return safe default if not
2. Use `withRetry()` (3 attempts, exponential backoff at 200ms base)
3. Never throw — return `{ confirmed: boolean; error?: string }` or similar
4. Log errors with `[progressionService]` prefix
5. Caller in game.ts logs error but continues — game results are never blocked

```typescript
// Pattern from awardPlatformGems — mirror this for awardPlatformXp
export async function awardPlatformGems(userId, amount): Promise<{ confirmed: boolean; error?: string }> {
  const result = await withRetry(async () => { ... throws on failure ... });
  if (result.success) return { confirmed: true };
  console.error(`[progressionService] award_gems failed after retries: ${result.error}`);
  return { confirmed: false, error: result.error };
}
```

### Exact Insertion Point in game.ts

**File:** `backend/src/routes/game.ts`
**Route:** `GET /results/:sessionId`
**Lines:** 403–417 (the `if (session.isConnected === true && session.isSuspended !== true)` block)

Current block awards gems then calls `upsertPlayerStats`. XP award goes **between** `awardPlatformGems` and `upsertPlayerStats`, or immediately after gems (both are fire-and-forget relative to the response):

```typescript
// CURRENT STRUCTURE (lines 403-417):
if (session.isConnected === true && session.isSuspended !== true) {
  const gemResult = await awardPlatformGems(session.userId, gemsEarned);
  gemsConfirmed = gemResult.confirmed;
  gemError = gemResult.error;

  // XP AWARD GOES HERE (new in Phase 53)
  const xpResult = await awardPlatformXp(
    session.sessionId,   // gameId = sessionId (server-generated UUID)
    session.userId,
    xpAmount,           // calculated from formula
    {
      score: results.totalScore,
      correct_answers: results.totalCorrect,
      total_questions: results.totalQuestions,
      perfect_game: results.totalCorrect === results.totalQuestions,
    }
  );
  session.xpResult = xpResult;  // store for response (Phase 54 consumption)

  await upsertPlayerStats(...);
}
```

### Session Field Addition

Add `xpResult` to the `GameSession` interface in `sessionService.ts`:

```typescript
export interface GameSession {
  // ... existing fields ...
  progressionAwarded: boolean;  // existing — covers gems AND xp
  xpResult?: XpAwardResult | null;  // new — stored after award for results response
}
```

**Do NOT add `xpAwarded` as a separate flag.** `progressionAwarded` already gates the entire block (gems + XP). XP runs inside that block. If XP fails, it's captured in `xpResult.confirmed = false`, not a separate flag.

### XP Result Type

Define `XpAwardResult` in `progressionService.ts` (or a shared types file):

```typescript
export interface XpAwardResult {
  confirmed: boolean;          // false if API call failed after retries
  amount?: number;             // XP awarded (present on success)
  level?: number;              // player's new level (present on success)
  total_xp?: number;           // new cumulative XP (present on success)
  xp_in_level?: number;        // for progress bar (present on success)
  xp_to_next_level?: number;   // for progress bar (present on success)
  is_duplicate?: boolean;      // true if gameId already processed
  error?: string;              // error message if confirmed=false
}
```

### What to Return in the Results API Response

The `progression` object already returned by the results endpoint must include XP data for Phase 54:

```typescript
progression = {
  gemsEarned,
  gemsConfirmed,
  xp: session.xpResult ?? null,   // null for non-Connected or if xpResult not set
  stats: ...,
  ...(message ? { message } : {}),
};
```

**The full `XpAwardResult` object should be returned inside `progression.xp`.** Phase 54 needs `amount`, `level`, `total_xp`, `xp_in_level`, `xp_to_next_level`, and `is_duplicate`.

### Recommended Project Structure

No new files or directories needed. Changes confined to:

```
backend/src/
├── services/
│   ├── progressionService.ts    # Add: awardPlatformXp(), XpAwardResult interface
│   └── sessionService.ts        # Add: xpResult field to GameSession interface
├── routes/
│   └── game.ts                  # Add: call awardPlatformXp() in results route
└── env.ts                       # Add: startup validation for 2 new env vars
```

---

## The gameId Question: sessionId Is Sufficient

**Finding:** `session.sessionId` is already generated by `randomUUID()` from Node's crypto module at session creation. It is:
- Server-generated (not client-provided)
- Cryptographically unique UUID v4
- Already the natural identifier for the game session
- Stored on the session object and available in the results route

**Conclusion:** Use `session.sessionId` as `gameId` directly. No separate `gameId` field needed.

**Idempotency key:** `ctc-game-${session.sessionId}-${session.userId}`

This is consistent with the integration guide's pattern `ctc-game-<gameId>-<userId>`.

---

## XP Formula Recommendation

**Formula:** `base_xp + Math.round(score_ratio * variable_xp)`

Where:
- `base_xp` = 50 (participation floor — non-zero for any completed game)
- `variable_xp` = 150 (the score-proportional component)
- `score_ratio` = `results.totalCorrect / results.totalQuestions`

**Result range:** 50 XP (0/10 correct) to 200 XP (10/10 correct)

**Context:** XP levels 1–3 require 2,000 XP each. At 200 XP/game, 10 perfect games = 1 level. At 50 XP/game (participation), ~40 games = 1 level. This feels appropriately paced for the Bloomington alpha cohort.

**Implementation:**

```typescript
function calculateXpAmount(correctAnswers: number, totalQuestions: number): number {
  const BASE_XP = 50;
  const VARIABLE_XP = 150;
  const scoreRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  return BASE_XP + Math.round(scoreRatio * VARIABLE_XP);
}
```

**No separate perfect-game bonus transaction.** Keep it simple for v1. The 200 XP ceiling for a perfect game is already motivating without the complexity of a second idempotency key.

**Note on existing `calculateProgression()` in progressionService.ts:** That function returns `xpEarned` (50 + correctAnswers, range 50–60) — this was CTC-internal XP before the platform integration existed. The new formula replaces the conceptual intent but the old `xpEarned` is never sent to the platform. The `upsertPlayerStats` call uses `correctAnswers` for `totalXp`, not `xpEarned`. No refactoring of existing code needed.

---

## Env Var Validation Pattern

**Current state of `backend/src/env.ts`:** The file currently only loads `.env` via `dotenv.config()`. It has **no validation logic** — it does not assert that required env vars are present. Startup validation does not currently exist.

**Pattern used in progressionService.ts:** Each function checks its own env var at call time and logs a warning if missing, returning a safe default. This is the existing runtime-check pattern.

**What Phase 53 must add:**

Option A (preferred): Add startup validation to `env.ts` that throws on missing required vars:
```typescript
// In env.ts, after dotenv.config():
const required = [
  'TRIVIA_SERVICE_KEY',
  'EMPOWERED_ACCOUNTS_API_URL',
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[env] Missing required env var: ${key}`);
    // Warn but don't crash — allows local dev without XP configured
  }
}
```

Option B (simpler, matches existing pattern): Check inline in `awardPlatformXp()` and warn-then-skip, same as `checkAccountContext` does for `EMPOWERED_ACCOUNTS_URL`.

**Recommendation: Use Option B for the function itself (consistent with existing pattern), but also add documentation comments to `env.ts` and `.env.example` for discoverability.** XP-05 says "validated at startup" — interpret this as documented + runtime warn, not crash-on-missing, since the app should still serve non-Connected players if XP env vars are absent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry logic | Custom retry loop | Existing `withRetry()` in progressionService.ts | Already tested, handles exponential backoff |
| Idempotency | Custom dedup table | Empowered Accounts API's DB-layer idempotency | API enforces it atomically; `is_duplicate: true` on retry is built-in |
| XP level calculation | CTC-side level math | Empowered Accounts API response fields | Level/progress data comes back in the award response; no second GET needed |
| Double-award prevention | Separate XP flag | Existing `progressionAwarded` flag | XP runs inside the same gate as gems |

---

## Common Pitfalls

### Pitfall 1: Blocking Game Results on XP Failure

**What goes wrong:** Awaiting `awardPlatformXp()` and returning a 500 if it fails.
**Why it happens:** Natural inclination to surface errors.
**How to avoid:** Mirror `awardPlatformGems` — capture the result, log the error, continue. The game results response must always succeed. XP failure is logged but the player still sees their score.
**Warning signs:** Any `throw` in the XP award path that isn't caught before the response.

### Pitfall 2: Using the Wrong API Base URL Env Var

**What goes wrong:** Calling `EMPOWERED_ACCOUNTS_URL` (existing) for XP instead of `EMPOWERED_ACCOUNTS_API_URL` (new XP-05 requirement).
**Why it happens:** They may point to the same host. But the spec distinguishes them.
**How to avoid:** Use `process.env.EMPOWERED_ACCOUNTS_API_URL` explicitly for XP calls. Document both vars separately in `.env.example`.

### Pitfall 3: Wrong `source` String

**What goes wrong:** Any value other than `"civic_trivia_championship_score"` returns 422 from the API.
**How to avoid:** Hardcode the string as a constant, don't derive it dynamically.

### Pitfall 4: Calling Award for Non-Connected Users

**What goes wrong:** The API returns 404 for users without a `connected_profiles` row. Calling it for Inform/anonymous users wastes a network round-trip and generates error logs.
**How to avoid:** XP award is already gated by `session.isConnected === true && session.isSuspended !== true`. Never call it outside that block.

### Pitfall 5: Treating `is_duplicate: true` as an Error

**What goes wrong:** Logging `is_duplicate` as an error, returning 500, or not including the existing XP result in the response.
**Why it happens:** The word "duplicate" sounds bad.
**How to avoid:** `is_duplicate: true` is a success path — the API returns the original transaction's level/XP data. Include it in the response and let Phase 54's UI show "already recorded" messaging.

### Pitfall 6: Forgetting to Save the Session After Setting `xpResult`

**What goes wrong:** `session.xpResult = xpResult` is set but `sessionManager.saveSession(session)` is not called, so a second call to `/results` returns null XP data.
**How to avoid:** The session is already saved at line 436 via `if (session.progressionAwarded) { await sessionManager.saveSession(session); }`. `xpResult` will be included in that save as long as it's set before that line executes.

---

## Code Examples

### awardPlatformXp() — Full Function Pattern

```typescript
// Source: progressionService.ts pattern (awardPlatformGems mirror)
// Add to: backend/src/services/progressionService.ts

export interface XpAwardResult {
  confirmed: boolean;
  amount?: number;
  level?: number;
  total_xp?: number;
  xp_in_level?: number;
  xp_to_next_level?: number;
  is_duplicate?: boolean;
  error?: string;
}

export async function awardPlatformXp(
  gameId: string,        // = session.sessionId
  userId: string,
  amount: number,
  metadata: {
    score: number;
    correct_answers: number;
    total_questions: number;
    perfect_game: boolean;
  }
): Promise<XpAwardResult> {
  const apiUrl = process.env.EMPOWERED_ACCOUNTS_API_URL;
  const serviceKey = process.env.TRIVIA_SERVICE_KEY;

  if (!apiUrl || !serviceKey) {
    console.warn('[progressionService] XP env vars not set — skipping XP award');
    return { confirmed: false, error: 'XP env vars not configured' };
  }

  const idempotencyKey = `ctc-game-${gameId}-${userId}`;

  const result = await withRetry(async () => {
    const resp = await fetch(`${apiUrl}/api/xp/award`, {
      method: 'POST',
      headers: {
        'X-Service-Key': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        source: 'civic_trivia_championship_score',
        amount,
        idempotency_key: idempotencyKey,
        metadata,
      }),
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(`XP award returned ${resp.status}: ${JSON.stringify(body)}`);
    }
    return resp.json();
  });

  if (result.success) {
    const data = result.result as any;
    return {
      confirmed: true,
      amount: data.amount,
      level: data.level,
      total_xp: data.total_xp,
      xp_in_level: data.xp_in_level,
      xp_to_next_level: data.xp_to_next_level,
      is_duplicate: data.is_duplicate,
    };
  } else {
    console.error(`[progressionService] awardPlatformXp failed after retries: ${result.error}`);
    return { confirmed: false, error: result.error };
  }
}
```

### XP Formula Function

```typescript
// Add to progressionService.ts (or inline in game.ts results route)
function calculateXpAmount(correctAnswers: number, totalQuestions: number): number {
  const BASE_XP = 50;
  const VARIABLE_XP = 150;
  const scoreRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  return BASE_XP + Math.round(scoreRatio * VARIABLE_XP);
}
// Range: 50 (0 correct) → 200 (all correct)
```

### Insertion Point in game.ts Results Route

```typescript
// In GET /results/:sessionId, inside the Connected block (after awardPlatformGems):

if (session.isConnected === true && session.isSuspended !== true) {
  // Gems (existing)
  const gemResult = await awardPlatformGems(session.userId, gemsEarned);
  gemsConfirmed = gemResult.confirmed;
  gemError = gemResult.error;

  // XP (new Phase 53)
  const xpAmount = calculateXpAmount(results.totalCorrect, results.totalQuestions);
  const xpResult = await awardPlatformXp(
    session.sessionId,
    session.userId,
    xpAmount,
    {
      score: results.totalScore,
      correct_answers: results.totalCorrect,
      total_questions: results.totalQuestions,
      perfect_game: results.totalCorrect === results.totalQuestions,
    }
  );
  session.xpResult = xpResult;  // persisted via saveSession below

  // Stats (existing)
  await upsertPlayerStats(
    session.userId,
    results.totalScore,
    results.totalCorrect,
    results.totalQuestions,
    gemsConfirmed ? gemsEarned : 0
  );
}

// progression object update (existing block, add xp):
progression = {
  gemsEarned: (session.isConnected && !session.isSuspended) ? gemsEarned : 0,
  gemsConfirmed,
  xp: session.xpResult ?? null,   // new
  stats: ...,
};
```

### GameSession Interface Addition

```typescript
// In sessionService.ts, add to GameSession interface:
xpResult?: XpAwardResult | null;  // Set after award; null before first results call
```

Import `XpAwardResult` from progressionService (or declare in a shared types file).

### .env.example Additions

```
# Empowered Accounts XP integration (required for Connected-tier XP awards)
EMPOWERED_ACCOUNTS_API_URL=https://your-empowered-accounts-api.com
TRIVIA_SERVICE_KEY=your-trivia-service-key-from-empowered-accounts
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|---|---|---|
| CTC tracks XP internally in `player_stats.totalXp` | Platform XP via Empowered Accounts API | `totalXp` in player_stats uses `correctAnswers` as placeholder — this Phase adds the real platform XP |
| `calculateProgression()` returns `xpEarned` (50–60 range) | `calculateXpAmount()` returns 50–200 XP for platform | Old function kept for gems calc; new function is XP-specific |

**Note on `totalXp` in `player_stats`:** The `upsertPlayerStats` call currently stores `correctAnswers` as `totalXp` (a placeholder). Phase 53 does NOT need to fix this — `player_stats.totalXp` is a local CTC stat, separate from the platform XP ledger. Keep the existing behavior.

---

## Open Questions

1. **Is `EMPOWERED_ACCOUNTS_API_URL` the same as `EMPOWERED_ACCOUNTS_URL`?**
   - What we know: `EMPOWERED_ACCOUNTS_URL` is the existing var used by `checkAccountContext`. The XP spec introduces `EMPOWERED_ACCOUNTS_API_URL` as a distinct var.
   - What's unclear: Whether they point to the same host or different hosts (separate API).
   - Recommendation: Treat them as distinct env vars per the spec. The implementer should confirm with the Empowered Accounts maintainer. Add both to `.env.example` with separate comments.

2. **Should `calculateXpAmount()` be exported or kept module-private?**
   - Recommendation: Export it — it makes unit testing trivial and mirrors how `calculateProgression()` is exported.

3. **XpAwardResult type location: progressionService.ts or shared types?**
   - Recommendation: Put it in `progressionService.ts` alongside the function. The `GameSession` interface can import it from there. No need for a shared types file for a single interface.

---

## Sources

### Primary (HIGH confidence)
- `C:/Project Test/civic-trivia-championship-xp-integration.md` — Authoritative integration contract. API endpoints, request/response shapes, idempotency rules, error codes, metadata guidance, XP formula considerations. Direct read.
- `C:/Project Test/backend/src/services/progressionService.ts` — `withRetry()`, `awardPlatformGems()`, `checkAccountContext()` patterns. Direct read.
- `C:/Project Test/backend/src/services/sessionService.ts` — `GameSession` interface, `randomUUID()` for `sessionId`, session creation flow. Direct read.
- `C:/Project Test/backend/src/routes/game.ts` (lines 370–458) — Exact insertion point, `progressionAwarded` gate, `progression` response shape. Direct read.
- `C:/Project Test/backend/src/env.ts` — Confirms no existing validation logic. Direct read.
- `C:/Project Test/backend/.env.example` — Existing env var documentation; `EMPOWERED_ACCOUNTS_URL` already present. Direct read.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing Node.js fetch and progressionService patterns
- Architecture: HIGH — exact file locations and line numbers verified from source
- XP formula: HIGH — numbers derived from integration guide guidance and level scale math
- Pitfalls: HIGH — derived from reading existing error handling patterns in the codebase
- Env var pattern: HIGH — env.ts read directly; no existing validation confirmed

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable internal codebase; integration guide is versioned v1.1 shipped 2026-03-04)
