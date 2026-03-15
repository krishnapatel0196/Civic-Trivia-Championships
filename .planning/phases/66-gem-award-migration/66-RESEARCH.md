# Phase 66: Gem Award Migration - Research

**Researched:** 2026-03-15
**Domain:** TypeScript service migration — deprecated Supabase RPC to HTTP API call
**Confidence:** HIGH

## Summary

This phase is a targeted code migration in a single file (`progressionService.ts`). The deprecated `connect.credit_gems` Supabase RPC call inside `awardPlatformGems()` must be replaced with `POST /api/gems/award` on the Empowered Accounts API, secured with `TRIVIA_GEMS_KEY`. The function signature and return type stay identical — only the internal implementation changes.

The implementation model is already present in the same file: `awardPlatformXp()` (lines 169–233 of `progressionService.ts`) is the direct blueprint. The new `awardPlatformGems()` should structurally mirror it: check env vars at function entry, call the API inside `withRetry`, return `{ confirmed: boolean; error?: string }`. The `withRetry` helper that the old implementation already uses can be retained or dropped — the CONTEXT.md decision mandates no retry for gem awards (contrast: XP currently retries), so the new implementation calls the API directly (no `withRetry`) inside its own try/catch.

Three files need changes: `progressionService.ts` (replace the RPC body), `env.ts` (add `TRIVIA_GEMS_KEY` startup warning), and `.env.example` (add the new var). The call-site in `game.ts` needs no changes because the function signature is preserved and an idempotency key is added as a new parameter aligned to the existing `ctc-game-${session.sessionId}-${session.userId}` pattern.

**Primary recommendation:** Model `awardPlatformGems()` directly after `awardPlatformXp()` — read its implementation before writing a single line. The two functions should be structurally parallel except for the endpoint path, request body shape, response fields, and the absence of retry.

---

## Standard Stack

No new libraries needed. This migration uses only what is already installed.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `fetch` (Node built-in) | Node 18+ | HTTP calls to accounts API | Already used in `awardPlatformXp()` — no new dep |
| `EMPOWERED_ACCOUNTS_API_URL` | env var | Base URL for all accounts API calls | Shared with XP integration, already set on Render |
| `TRIVIA_GEMS_KEY` | env var | Auth for `POST /api/gems/award` | New key, Chris provides value |

### No New Dependencies Required
The existing `fetch` global, TypeScript, and the env var pattern from Phase 53 are sufficient. No npm packages to add.

---

## Architecture Patterns

### Files to Touch

```
backend/
├── src/
│   ├── services/
│   │   └── progressionService.ts   # PRIMARY — replace awardPlatformGems() body
│   └── env.ts                      # ADD TRIVIA_GEMS_KEY startup validation
└── .env.example                    # ADD TRIVIA_GEMS_KEY entry
```

No other files change. `game.ts` call-site is unaffected — function signature is preserved (though an idempotency key parameter is added; see below).

### Pattern 1: awardPlatformGems() — Mirror of awardPlatformXp()

**What:** Replace the RPC body with a direct `fetch` call. Check env vars at function entry (same guard pattern as `awardPlatformXp()`). Wrap in try/catch (not `withRetry` — no retry per CONTEXT decision). Return `{ confirmed: boolean; error?: string }`.

The existing function signature in `game.ts` call-site passes only `(userId, gemsEarned)`. The new API requires an `idempotencyKey`. Two valid approaches:

1. **Add idempotencyKey as a parameter** — caller already constructs `ctc-game-${session.sessionId}-${session.userId}` for XP; a parallel `ctc-gems-${session.sessionId}-${session.userId}` is the natural pattern.
2. **Derive idempotencyKey inside the function** — not possible since the function has no `sessionId`.

**Decision implication:** The function signature must gain an `idempotencyKey: string` parameter. The `game.ts` call-site must be updated to pass `ctc-gems-${session.sessionId}-${session.userId}`.

**Example (blueprint from existing awardPlatformXp):**
```typescript
// Source: backend/src/services/progressionService.ts — existing awardPlatformXp() lines 169-233
export async function awardPlatformGems(
  userId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ confirmed: boolean; error?: string }> {
  const accountsUrl = process.env.EMPOWERED_ACCOUNTS_API_URL;
  const gemsKey = process.env.TRIVIA_GEMS_KEY;

  if (!accountsUrl || !gemsKey) {
    console.warn('[progressionService] EMPOWERED_ACCOUNTS_API_URL or TRIVIA_GEMS_KEY not set — skipping gem award');
    return { confirmed: false, error: 'Missing env vars' };
  }

  try {
    const resp = await fetch(`${accountsUrl}/api/gems/award`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': gemsKey,
      },
      body: JSON.stringify({
        userId,
        gemType: 'yellow',
        amount,
        idempotencyKey,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.warn(`[progressionService] gem award API returned ${resp.status}: ${text}`);
      return { confirmed: false, error: `API returned ${resp.status}` };
    }
    return { confirmed: true };
  } catch (err: any) {
    console.warn('[progressionService] awardPlatformGems failed:', err?.message);
    return { confirmed: false, error: err?.message };
  }
}
```

Note: The ONBOARDING-CTC.md shows `Authorization: Bearer` header, but the existing `awardPlatformXp()` uses `X-Service-Key`. The actual header name should match whatever `awardPlatformXp()` uses (`X-Service-Key`). If in doubt, follow the existing working pattern exactly.

### Pattern 2: env.ts startup validation

**What:** Add `TRIVIA_GEMS_KEY` to the startup check. Mirror the existing `_requiredForXp` pattern.

```typescript
// Source: backend/src/env.ts — existing pattern lines 11-15
const _requiredForGems = ['TRIVIA_GEMS_KEY'];
const _missingGems = _requiredForGems.filter(k => !process.env[k]);
if (_missingGems.length > 0) {
  console.warn(`[env] Missing env vars (gem awards will be skipped): ${_missingGems.join(', ')}`);
}
```

This is warning-only. Server continues to boot. Gem awards silently fail at runtime if key is absent (env var check in `awardPlatformGems()` handles runtime safety).

### Pattern 3: .env.example update

Add the new variable with a comment, grouped with the other Empowered Accounts vars:

```
# Gem award service key — separate from TRIVIA_SERVICE_KEY
TRIVIA_GEMS_KEY=your-trivia-gems-key-here
```

### Anti-Patterns to Avoid

- **Keeping withRetry:** The old implementation used `withRetry`. CONTEXT.md explicitly says no retry for gem awards. Remove it.
- **Throwing on failure:** The old implementation threw inside `withRetry`. New implementation must catch and return `{ confirmed: false }` — never throw.
- **Hardcoding the accounts URL:** Always read from `process.env.EMPOWERED_ACCOUNTS_API_URL`. Do not inline `https://ev-accounts-api.onrender.com`.
- **Using Authorization: Bearer vs X-Service-Key:** Follow `awardPlatformXp()` exactly for the header name — it uses `X-Service-Key`. The ONBOARDING-CTC.md example shows `Authorization: Bearer` but the working codebase uses `X-Service-Key`. Trust the working code.
- **Not updating the call-site:** The `game.ts` call at line 405 currently passes 2 args. With the new signature, it needs 3 — the idempotency key must be added.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency | Custom dedup logic | Pass idempotency key to the API endpoint | The accounts API handles dedup server-side; `is_duplicate: true` in response |
| Retry logic | New retry wrapper | None (no retry per decision) | CONTEXT says no retry — game completes normally on failure |
| Auth key rotation | Key management code | Just read env var | Chris manages key lifecycle on the accounts side |

---

## Common Pitfalls

### Pitfall 1: Forgetting to update game.ts call-site

**What goes wrong:** TypeScript compilation fails because `awardPlatformGems` gains a 3rd parameter (`idempotencyKey`) but `game.ts` still calls it with 2 args.
**Why it happens:** The old RPC call had no concept of idempotency so no key was passed. The new API requires one.
**How to avoid:** After updating `progressionService.ts`, immediately search for every call to `awardPlatformGems` and update them. There is exactly one call-site: `game.ts` line 405.
**Warning signs:** TypeScript error `Expected 3 arguments, but got 2`.

### Pitfall 2: Retaining withRetry

**What goes wrong:** The old `awardPlatformGems()` used `withRetry`. If refactoring by copy-paste from the old function, `withRetry` may be retained.
**Why it happens:** Muscle memory / copy-paste from old implementation.
**How to avoid:** CONTEXT says no retry. The new function uses a plain try/catch.
**Warning signs:** Function body contains `withRetry(`.

### Pitfall 3: Wrong header name

**What goes wrong:** Using `Authorization: Bearer ${gemsKey}` instead of `X-Service-Key: ${gemsKey}`. The request returns 401.
**Why it happens:** ONBOARDING-CTC.md shows `Authorization: Bearer` in its examples, but the working `awardPlatformXp()` in the codebase uses `X-Service-Key`. These may reflect different API versions.
**How to avoid:** Copy the header from `awardPlatformXp()` exactly — it is the working reference implementation.
**Warning signs:** Render logs show 401 from gem award endpoint after deploy.

### Pitfall 4: Not removing the TODO comment

**What goes wrong:** The `TODO: Route through accounts API` comment on line 101-103 of `progressionService.ts` remains after migration, suggesting work is still needed.
**Why it happens:** Forgetting to clean up the comment.
**How to avoid:** Delete the TODO comment block as part of the replacement.

### Pitfall 5: Touching the Supabase DB function

**What goes wrong:** Dropping or modifying `connect.credit_gems` in Supabase during this phase.
**Why it happens:** Thinking "remove the RPC call" means removing the DB function too.
**How to avoid:** CONTEXT explicitly says leave the DB function. Only remove the TypeScript code that calls it.

---

## Code Examples

### Current awardPlatformGems() — what to replace

```typescript
// Source: backend/src/services/progressionService.ts lines 104-124
// THIS IS THE OLD IMPLEMENTATION — replace entire body
export async function awardPlatformGems(
  userId: string,
  amount: number
): Promise<{ confirmed: boolean; error?: string }> {
  const result = await withRetry(async () => {
    const { error } = await (supabaseAdmin as any).schema('connect').rpc('credit_gems', {
      p_user_id: userId,
      p_gem_type: 'yellow',
      p_amount: amount,
      p_transaction_type: 'game_completed',
      p_source_ref: 'civic_trivia',
    });
    if (error) throw new Error(error.message);
  });
  if (result.success) {
    return { confirmed: true };
  } else {
    console.error(`[progressionService] award_gems failed after retries: ${result.error}`);
    return { confirmed: false, error: result.error };
  }
}
```

### Current game.ts call-site — what needs updating

```typescript
// Source: backend/src/routes/game.ts lines 405-407
// Current (2 args):
const gemResult = await awardPlatformGems(session.userId, gemsEarned);

// After migration (3 args — add idempotency key):
const gemIdempotencyKey = `ctc-gems-${session.sessionId}-${session.userId}`;
const gemResult = await awardPlatformGems(session.userId, gemsEarned, gemIdempotencyKey);
```

### POST /api/gems/award request body

```typescript
// Source: ONBOARDING-CTC.md — Gem Awards section
{
  userId: string;          // Supabase UUID
  gemType: 'yellow';       // CTC scope is yellow only
  amount: number;          // positive integer
  idempotencyKey: string;  // ctc-gems-{sessionId}-{userId}
}
```

### POST /api/gems/award response shape

```typescript
// Source: ONBOARDING-CTC.md — Gem Awards section
// 200 success:
{
  gem_type: 'yellow';
  amount: number;
  new_balance: number;
  is_duplicate: boolean;
}
// 422: { error: 'FORBIDDEN_GEM_TYPE' }
// 401: { error: 'UNAUTHORIZED' }
```

Note: The current `awardPlatformGems()` return type is `{ confirmed: boolean; error?: string }`. The new implementation can ignore `new_balance` and `is_duplicate` from the response — the return type stays the same to avoid touching callers (beyond the new idempotency key parameter).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `connect.credit_gems` Supabase RPC (direct DB) | `POST /api/gems/award` HTTP endpoint | Accounts API v1.3 (2026-03-15) | Idempotency, per-key auth, audit trail |
| `supabaseAdmin.schema('connect').rpc(...)` | `fetch(accountsUrl + '/api/gems/award', ...)` | Phase 66 | Removes direct DB coupling |
| `withRetry` (3 attempts) | Plain try/catch, no retry | Phase 66 decision | Game session always completes; gem failure is non-blocking |

**Deprecated/outdated:**
- `connect.credit_gems` RPC: Still exists in DB but TypeScript call is removed. Leave DB function as-is — no migration SQL needed.
- `(supabaseAdmin as any).schema('connect')` cast: The `as any` hack exists because the TypeScript types don't include the `connect` schema. This disappears with the migration.

---

## Open Questions

1. **Header name: X-Service-Key vs Authorization: Bearer**
   - What we know: `awardPlatformXp()` uses `'X-Service-Key': serviceKey`. ONBOARDING-CTC.md examples show `Authorization: Bearer ${process.env.TRIVIA_GEMS_KEY}`.
   - What's unclear: Whether the gem endpoint uses the same header scheme as the XP endpoint.
   - Recommendation: Use `X-Service-Key` to mirror `awardPlatformXp()` exactly. If the first production deploy fails with 401, switching to `Authorization: Bearer` is a 1-line fix. Chris configured both keys — he would know the scheme.

---

## Sources

### Primary (HIGH confidence)
- `backend/src/services/progressionService.ts` — complete source of `awardPlatformGems()` and `awardPlatformXp()` (read directly)
- `backend/src/env.ts` — complete source of startup env validation pattern (read directly)
- `backend/src/routes/game.ts` — complete call-site for `awardPlatformGems()` including idempotency key usage for XP (read directly)
- `C:/Project Test/ONBOARDING-CTC.md` — official gem award API contract: endpoint, request body, response shape, key configuration (read directly)
- `backend/.env.example` — current env var documentation (read directly)
- `.planning/phases/66-gem-award-migration/66-CONTEXT.md` — locked user decisions (read directly)

### Secondary (MEDIUM confidence)
- Project MEMORY.md — confirms deprecation of `awardPlatformGems()` → `connect.credit_gems` as of v1.3, `POST /api/gems/award` with `TRIVIA_GEMS_KEY`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all tooling verified directly in codebase
- Architecture: HIGH — reference implementation (`awardPlatformXp`) exists in same file; all patterns read from source
- API contract: HIGH — ONBOARDING-CTC.md is authoritative and was read directly
- Pitfalls: HIGH — identified from direct code analysis (not speculation)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable internal codebase; accounts API contract documented in ONBOARDING-CTC.md)
