# Phase 56: Post-v2.0 XP Tech Debt - Research

**Researched:** 2026-03-08
**Domain:** Node.js/Express startup validation, TypeScript metadata types, Redis session persistence
**Confidence:** HIGH

## Summary

Phase 56 closes three XP tech debt items identified in the v2.0 audit. All three items are small, surgical changes to the backend — no new dependencies, no schema migrations needed. The research is grounded entirely in the existing codebase (HIGH confidence throughout).

TD-1 (startup env validation) requires adding a validation block to `env.ts` after `dotenv.config()`. The server entry point (`server.ts`) imports `env.ts` as its very first line via `import './env.js'`, so any `process.exit(1)` or thrown error in `env.ts` terminates the server before any route or storage initialization runs. This is the right place — clean and early.

TD-2 (isDuplicate metadata placeholder) is confirmed safe: the `isDuplicate` field in the `awardPlatformXp` metadata argument is never read back by the platform's `get_ctc_xp_history` RPC — the platform stores its own `is_duplicate` flag from idempotency checking. However, the field's presence in the metadata type signature is misleading. The cleanest fix is to remove `isDuplicate` from the optional metadata object entirely, since it's semantically wrong (we don't know this at call time). The TypeScript type for `XpAwardResult` (the return value) must keep `isDuplicate` — that's correctly populated from `data.is_duplicate` at line 222 of `progressionService.ts`. Only the input metadata type needs the field removed.

TD-3 (xpResult persistence across Redis TTL) requires persisting `xpResult` to the existing `trivia.player_stats` Supabase table. No new table or migration is needed. The `upsertPlayerStats()` function in `progressionService.ts` already writes to Supabase using Drizzle. The `player_stats` table currently has no XP transaction columns — but the right solution is NOT adding an `xpResult` jsonb column there. Instead, the fix is to extend the session TTL from 3600s to 86400s (24h) after progression is awarded. This is a one-line change in the `saveSession()` call in `game.ts` after `session.progressionAwarded = true`. The `storage.set(sessionId, session, ttlSeconds)` API already supports any TTL.

**Primary recommendation:** Three surgical backend changes: (1) warn + exit in env.ts, (2) remove isDuplicate from metadata input type, (3) extend session TTL to 24h after award. Zero new dependencies, zero schema migrations.

## Standard Stack

No new libraries or tools are introduced. All changes use the existing stack.

### Core (existing, no changes needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express.js | existing | HTTP server | Already in use |
| Drizzle ORM | existing | Supabase writes | Already used for `upsertPlayerStats` |
| redis (node-redis) | existing | Session storage | `RedisStorage` already calls `setEx(key, ttlSeconds, data)` |
| dotenv | existing | Env var loading | Already used in `env.ts` |

**Installation:** No new packages required.

## Architecture Patterns

### TD-1: Startup Validation Pattern

**Where env.ts fits in the startup sequence:**

`server.ts` line 2: `import './env.js';` — this is the absolute first import before express, routes, redis, or any service. Any `process.exit(1)` call in `env.ts` fires before `startServer()` begins.

**Recommended pattern — warn and exit (not throw):**
```typescript
// Source: codebase inspection — server.ts startup sequence
// env.ts — after dotenv.config():
const REQUIRED_VARS = ['EMPOWERED_ACCOUNTS_API_URL', 'TRIVIA_SERVICE_KEY'] as const;
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.warn(`[env] Missing required env vars: ${missing.join(', ')} — XP awards will be skipped`);
  // Do NOT process.exit — warn-and-skip is the correct behavior (Connected users still get gems/stats)
}
```

**Decision point:** warn vs. `process.exit(1)`. The tech debt description says "startup warning" not "startup crash." The call-time warn-and-skip pattern in `progressionService.ts` handles the missing-vars case gracefully. The real gap is operator visibility — a startup log message guarantees operators see misconfiguration on deploy. Use `console.warn` only. Do NOT `process.exit(1)` — this would make the server refuse to start if XP integration is absent (e.g. in local dev without keys set), which is worse than silently skipping.

### TD-2: isDuplicate Metadata Cleanup

**Current state (game.ts:412-417):**
```typescript
session.xpResult = await awardPlatformXp(session.userId, xpAmount, idempotencyKey, {
  score: results.totalScore,
  correctAnswers: results.totalCorrect,
  collectionSlug: session.collectionSlug ?? 'federal-civics',
  isDuplicate: false,  // placeholder — is_duplicate comes back in the response, not known at call time
});
```

**The metadata type in progressionService.ts (lines 173-178):**
```typescript
metadata?: {
  score?: number;
  correctAnswers?: number;
  collectionSlug?: string;
  isDuplicate?: boolean;  // ← remove this field
}
```

**XpAwardResult (lines 130-140) — keep isDuplicate here:**
```typescript
export interface XpAwardResult {
  confirmed: boolean;
  isDuplicate?: boolean;  // ← keep — populated from API response at line 222
  transactionId?: string;
  amount?: number;
  // ...
}
```

**Recommended fix:**
1. Remove `isDuplicate?: boolean` from the metadata input type in `progressionService.ts`
2. Remove `isDuplicate: false` from the call site in `game.ts`
3. The TypeScript compiler will enforce this — no runtime behavior changes

**Confirmed safe:** The frontend `Profile.tsx:450` reads `entry.isDuplicate` from `profileService.ts` which calls `get_ctc_xp_history()` RPC. That RPC sources `isDuplicate` from the platform's own transaction record (idempotency flag), not from our metadata field. Removing the metadata field does not affect the "Already counted" badge.

### TD-3: Session TTL Extension Pattern

**Root cause:** After XP award, `session.progressionAwarded = true` and `saveSession()` is called — but `saveSession()` always uses a fixed 3600s TTL. If the user fetches `/results` again >1 hour later, the session is gone and `xp: null` is returned.

**The fix — extend TTL to 24h after award:**

The `SessionManager.saveSession()` method (sessionService.ts:184):
```typescript
async saveSession(session: GameSession): Promise<void> {
  await this.storage.set(session.sessionId, session, 3600);  // ← hardcoded 3600
}
```

Two implementation options:

**Option A (recommended) — parameterize saveSession TTL:**
```typescript
// sessionService.ts
async saveSession(session: GameSession, ttlSeconds: number = 3600): Promise<void> {
  await this.storage.set(session.sessionId, session, ttlSeconds);
}
```

Then in `game.ts`, after `session.progressionAwarded = true`:
```typescript
// Save with 24h TTL so repeated /results calls return correct state
await sessionManager.saveSession(session, 86400);
```

**Option B — extend TTL inside game.ts directly via storage:** Not recommended — bypasses the SessionManager abstraction.

**Why not Supabase persistence?** The `xpResult` object contains level/XP data that's already stored in the platform (Empowered Accounts). Duplicating this in the trivia Supabase schema creates a second source of truth. The Redis TTL extension is a simpler, less risky fix that addresses the actual failure scenario (user returns within 24h for a second look at results). Users who wait >24h have already left the ResultsScreen.

**Why not a separate Redis key?** Same data, extra complexity. The session already holds `xpResult`. Extending the session TTL is the minimal-risk fix.

### Anti-Patterns to Avoid

- **Throwing in env.ts:** Don't `process.exit(1)` on missing XP vars. Local dev environments won't have `TRIVIA_SERVICE_KEY`. The graceful-skip behavior is correct; the gap was only operator visibility.
- **Adding isDuplicate to JSON metadata sent to platform:** The platform ignores it for history display. Adding it more prominently would not fix anything.
- **New Supabase table for xpResult:** Over-engineering. The session TTL extension covers the real-world scenario. A new `game_xp_awards` table would need a migration, a Drizzle schema entry, and a new write path.
- **Setting TTL to 86400 everywhere (not just after award):** Only extend TTL after the progression is definitively awarded. Active game sessions should still expire at 1h.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env var validation | Custom validation library | Inline check + console.warn | 2-line fix; no library justified |
| XP result persistence | New Supabase table | Redis TTL extension | xpResult is already in session; no new schema needed |
| Session TTL parameterization | New storage abstraction | Add optional param to saveSession() | One-line change to existing method |

**Key insight:** All three TD items are one-file changes or two-file changes. Don't introduce new abstractions.

## Common Pitfalls

### Pitfall 1: process.exit(1) in env.ts breaks local dev
**What goes wrong:** Dev environments don't set `TRIVIA_SERVICE_KEY` locally. A hard exit would break every local development startup.
**Why it happens:** TD-1 says "startup warning" but the instinct is to crash-fast.
**How to avoid:** Emit `console.warn` only. The warn-and-skip at call time remains the behavior; the startup log just makes misconfiguration observable on Render's deploy logs.
**Warning signs:** If you see `process.exit` being added, reconsider.

### Pitfall 2: Removing isDuplicate from XpAwardResult (wrong type)
**What goes wrong:** Removing `isDuplicate` from the RETURN type (`XpAwardResult`) instead of just the input metadata type would break `XpReveal.tsx` (checks `xpResult.isDuplicate`), `ResultsScreen.tsx` (line 85), and `useGameState.ts` (line 299).
**Why it happens:** Both the input metadata object and the return type have `isDuplicate` — easy to confuse.
**How to avoid:** Only touch the metadata input parameter type (lines 173-178 of progressionService.ts). Leave `XpAwardResult.isDuplicate` untouched.

### Pitfall 3: saveSession TTL extension applied globally
**What goes wrong:** If `saveSession()` always uses 86400s, all game sessions live for 24h in Redis instead of 1h. This increases Redis memory usage ~24x for active game sessions.
**Why it happens:** The simplest change to `saveSession()` defaults the parameter to 86400.
**How to avoid:** Default the new `ttlSeconds` parameter to `3600`. Only the post-award call in `game.ts` passes `86400`.

### Pitfall 4: Missing the second getSession() call in game.ts
**What goes wrong:** The `/results` route calls `sessionManager.getResults(sessionId)` AND `sessionManager.getSession(sessionId)` separately. Both refresh TTL to 3600s. If the fix only changes the `saveSession` call at line 447, the `getSession` at line 385 has already re-set TTL to 3600s. The extended TTL write at line 447 overrides this, so order matters — but this is fine since `saveSession` is called last.
**Why it happens:** The TTL refresh in `getSession` could undo a TTL extension if called after `saveSession`.
**How to avoid:** Confirm `saveSession(session, 86400)` is the LAST write to Redis for that session in the request handler. Looking at `game.ts:446-448` — yes, `saveSession` is the final write after `progressionAwarded = true`.

## Code Examples

### TD-1: Startup Warning (env.ts)
```typescript
// Source: codebase inspection — env.ts (current 9 lines), server.ts line 2
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Startup validation for XP integration env vars
const XP_REQUIRED = ['EMPOWERED_ACCOUNTS_API_URL', 'TRIVIA_SERVICE_KEY'] as const;
const missingXpVars = XP_REQUIRED.filter(v => !process.env[v]);
if (missingXpVars.length > 0) {
  console.warn(
    `[env] WARNING: ${missingXpVars.join(', ')} not set — XP awards will be skipped for Connected players`
  );
}
```

### TD-2: Remove isDuplicate from metadata input type
```typescript
// Source: progressionService.ts lines 169-178
// Change: remove isDuplicate from the metadata parameter type only

export async function awardPlatformXp(
  userId: string,
  amount: number,
  idempotencyKey: string,
  metadata?: {
    score?: number;
    correctAnswers?: number;
    collectionSlug?: string;
    // isDuplicate removed — value is unknowable before the award call;
    // platform sets its own is_duplicate flag from idempotency check
  }
): Promise<XpAwardResult> {
```

And in game.ts, remove the `isDuplicate: false` line from the metadata argument (lines 413-417).

### TD-3: Parameterize saveSession TTL
```typescript
// Source: sessionService.ts — SessionManager.saveSession()
async saveSession(session: GameSession, ttlSeconds: number = 3600): Promise<void> {
  await this.storage.set(session.sessionId, session, ttlSeconds);
}
```

```typescript
// Source: game.ts — after progressionAwarded = true (currently line 447)
if (session.progressionAwarded) {
  // Extend TTL to 24h so repeated /results calls return correct XP state
  await sessionManager.saveSession(session, 86400);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Call-time env warn only | Call-time warn + startup warn | Phase 56 | Operators see misconfiguration immediately on deploy log |
| isDuplicate: false placeholder in metadata | Field removed from metadata type | Phase 56 | Eliminates misleading code; no behavior change |
| 1h session TTL (fixed) | 1h active / 24h post-award | Phase 56 | Repeated /results calls work for up to 24h after game |

## Open Questions

1. **Should the startup warning block ALL startup or just warn?**
   - What we know: The success criteria says "logs a startup warning" — not "fails to start"
   - What's unclear: Whether a hard exit is desired for production
   - Recommendation: `console.warn` only. The call-time skip in progressionService.ts means the server functions normally; XP is just not awarded. A hard exit would break dev environments.

2. **Is 24h TTL sufficient for the /results page use case?**
   - What we know: ResultsScreen is shown immediately after game completion. The second `/results` call scenario is "user refreshes the page or navigates back"
   - What's unclear: Whether anyone navigates back to results hours later
   - Recommendation: 24h (86400s) is conservative but reasonable. Could use 7200s (2h) if Redis memory is a concern, but 24h is cleaner.

## Sources

### Primary (HIGH confidence)
- `backend/src/env.ts` — full file read; confirmed 9 lines, no validation
- `backend/src/server.ts` — full file read; confirmed `import './env.js'` is first line
- `backend/src/services/progressionService.ts` — full file read; confirmed metadata type shape and XpAwardResult type
- `backend/src/services/sessionService.ts` — full file read; confirmed saveSession TTL hardcoded at 3600
- `backend/src/routes/game.ts` — relevant sections read; confirmed isDuplicate placeholder and saveSession call order
- `backend/src/services/storage/RedisStorage.ts` — full file read; confirmed `setEx(key, ttlSeconds, data)` API
- `backend/src/db/schema.ts` — full file read; confirmed no xp_awards or game_sessions table exists
- `frontend/src/features/game/components/XpReveal.tsx` — grep confirmed reads `xpResult.isDuplicate` from API response
- `frontend/src/pages/Profile.tsx` — grep confirmed "Already counted" badge reads from `entry.isDuplicate` (RPC result, not our metadata)

## Metadata

**Confidence breakdown:**
- TD-1 (env startup validation): HIGH — code read directly; startup sequence confirmed
- TD-2 (isDuplicate cleanup): HIGH — both type definitions read; frontend consumption confirmed; RPC independence confirmed from Phase 55 decisions
- TD-3 (session TTL): HIGH — saveSession code read; Redis setEx API confirmed; no schema migration needed

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable codebase, no external API changes expected)
