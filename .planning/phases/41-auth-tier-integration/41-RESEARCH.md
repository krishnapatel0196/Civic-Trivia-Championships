# Phase 41: Auth & Tier Integration (Backend) - Research

**Researched:** 2026-02-28
**Domain:** Express middleware / Supabase JWT verification / tier guards
**Confidence:** HIGH

## Summary

Phase 41 replaces the existing local JWT middleware (`jsonwebtoken` + `tokenUtils.ts`) with Supabase JWT verification using `jose`. The integration guide (`empowered-accounts-integration-guide.md`) is the authoritative contract and provides exact code patterns that must be followed verbatim.

The codebase is fully audited. Three middleware functions need replacing: `authenticateToken` becomes `requireAuth`, `optionalAuth` is updated, and `requireAdmin` switches from a `req.user.isAdmin` boolean check to a live database query against `public.user_roles` via the Supabase service role client. A new `requireConnected` guard is added. The existing `req.user` object on Express Request (which carried `userId: number`, `email`, `isAdmin`) is replaced entirely by `req.userId: string` (UUID).

Two packages need installation: `jose` (v6.x) and `@supabase/supabase-js` (v2.98.x). Neither is currently in the backend's `package.json` or `node_modules`. The `connect` schema is not present in the generated `database.types.ts` — the `requireConnected` guard must use an untyped `.schema('connect')` call on the Supabase admin client.

**Primary recommendation:** Install `jose` and `@supabase/supabase-js`, create a `backend/src/config/supabase.ts` singleton for the admin client, replace `backend/src/middleware/auth.ts` entirely, update the Express Request type declaration, and audit every caller of `req.user?.userId` (7 locations) to use `req.userId` instead.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jose` | ^6.x (latest 6.1.3) | Supabase JWT verification via `jwtVerify` | Mandated by integration guide; used in Supabase Edge Functions; ESM-native |
| `@supabase/supabase-js` | ^2.98.0 | Service role client for tier/admin DB lookups | Required for `connect.connected_profiles` and `public.user_roles` queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsonwebtoken` (existing) | ^9.0.2 | Currently used for local JWTs | Being replaced — keep in package.json until auth routes are removed in a later phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `jose` jwtVerify | `jsonwebtoken` verify | jsonwebtoken is CommonJS, lacks modern ESM exports; jose is specified by the integration guide — do not substitute |
| Direct DB query for tiers | Accounts API `GET /api/account/me` | API call adds latency + network dependency; direct DB query (Option B) is what the integration guide recommends for feature backends |

**Installation:**
```bash
cd backend && npm install jose @supabase/supabase-js
```

---

## Architecture Patterns

### Recommended File Structure Changes
```
backend/src/
├── config/
│   ├── database.ts          # existing (pg pool)
│   ├── jwt.ts               # existing (will be unused after phase)
│   ├── redis.ts             # existing
│   └── supabase.ts          # NEW — supabaseAdmin singleton
├── middleware/
│   └── auth.ts              # REPLACE entirely — new requireAuth / optionalAuth / requireConnected / requireAdmin
└── types/
    └── database.types.ts    # existing — has public/trivia schemas (connect NOT present)
```

### Pattern 1: Supabase Admin Client Singleton

Create a single `supabaseAdmin` client used by all middleware. Do not create per-request clients — the service role client is stateless and safe to share.

```typescript
// backend/src/config/supabase.ts
// Source: empowered-accounts-integration-guide.md §1 + §2
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

**Environment variables required** (add to `.env` and `.env.example`):
```
SUPABASE_URL=https://kxsdzaojfaibhuzmclfq.supabase.co
SUPABASE_ANON_KEY=<shared anon key>
SUPABASE_SERVICE_ROLE_KEY=<shared service role key>
SUPABASE_JWT_SECRET=<shared JWT secret>
```

### Pattern 2: requireAuth Middleware (replaces authenticateToken)

Copy verbatim from the integration guide. The `SECRET_KEY` should be module-level to avoid re-encoding on every request.

```typescript
// Source: empowered-accounts-integration-guide.md §1
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.slice(7); // strip "Bearer "
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Pattern 3: optionalAuth Middleware (updated)

Same logic as `requireAuth` but continues without error if token is absent or invalid. Removes the old blacklist check (Supabase JWTs are stateless — no blacklist needed).

```typescript
// Source: integration guide §1 pattern + existing optionalAuth logic
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    req.userId = undefined;
    next();
    return;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
  } catch {
    req.userId = undefined;
  }
  next();
}
```

### Pattern 4: requireConnected Middleware

```typescript
// Source: empowered-accounts-integration-guide.md §2
export async function requireConnected(req: Request, res: Response, next: NextFunction): Promise<void> {
  // requireAuth must have run first (sets req.userId)
  const { data } = await supabaseAdmin
    .schema('connect')
    .from('connected_profiles')
    .select('verification_status')
    .eq('user_id', req.userId!)
    .maybeSingle();

  if (!data || data.verification_status !== 'verified') {
    res.status(403).json({ error: 'Connected account required' });
    return;
  }
  next();
}
```

**Note on TypeScript types:** The `connect` schema is NOT in `database.types.ts` (the type gen command only included `public` and `trivia` schemas). The `.schema('connect')` call returns untyped data. This is expected and fine — the `verification_status` field is accessed as `data.verification_status` with a runtime string check.

### Pattern 5: requireAdmin Middleware (critical discrepancy)

The integration guide shows:
```typescript
.from('user_roles').select('role').eq('role', 'admin')
```

However, the actual `public.user_roles` table (verified from `database.types.ts`) has columns: `id`, `user_id`, `role_id` (UUID FK to `roles.id`), `granted_at`, `revoked_at`. There is NO `role` text column.

**Correct implementation using a join + revoked_at filter:**

```typescript
// Source: integration guide §7 pattern adapted to actual schema from database.types.ts
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // requireAuth must have run first
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('id, roles!inner(slug)')
    .eq('user_id', req.userId)
    .is('revoked_at', null)
    .maybeSingle();

  // Check the joined role slug
  const roleSlug = (data as any)?.roles?.slug;
  if (!roleSlug || roleSlug !== 'admin') {
    res.status(403).json({ error: 'Admin required' });
    return;
  }
  next();
}
```

**Alternative — use the `admin_users` table** (simpler, also in `database.types.ts`):
```typescript
// admin_users table: { user_id: string } — one row per admin user (isOneToOne: true)
const { data } = await supabaseAdmin
  .from('admin_users')
  .select('user_id')
  .eq('user_id', req.userId)
  .maybeSingle();

if (!data) {
  res.status(403).json({ error: 'Admin required' });
  return;
}
next();
```

The `admin_users` table approach is simpler and correctly typed. However, the integration guide explicitly says to use `user_roles`. The planner should pick one and note the decision. The safest choice that matches the guide's intent is the `admin_users` table, since it clearly tracks admin membership and avoids the join complexity.

### Pattern 6: Express Request Type Update

Replace the existing `req.user?: TokenPayload` with `req.userId` and `req.accessToken`:

```typescript
// In backend/src/middleware/auth.ts or a separate types file
declare global {
  namespace Express {
    interface Request {
      userId?: string;       // UUID string from Supabase JWT sub claim
      accessToken?: string;  // raw JWT token (stored for downstream use if needed)
    }
  }
}
```

Remove the old `req.user?: TokenPayload` declaration.

### Caller Update Map

Every caller of `req.user` must be updated. Full audit:

| File | Old Access | New Access | Notes |
|------|-----------|-----------|-------|
| `routes/feedback.ts:43` | `String(req.user!.userId)` | `req.userId!` | UUID is already a string |
| `routes/feedback.ts:93` | `String(req.user!.userId)` | `req.userId!` | same |
| `routes/feedback.ts:147` | `String(req.user!.userId)` | `req.userId!` | same |
| `routes/game.ts:126` | `req.user?.userId ?? 'anonymous'` | `req.userId ?? 'anonymous'` | anonymous session path preserved |
| `routes/profile.ts:64,108,135,152,212` | `req.user!.userId` | `req.userId!` | profile routes all use authenticateToken |
| `middleware/rateLimiter.ts:24` | `req.user?.userId` | `req.userId` | rate limiter key changes |
| `routes/auth.ts` (logout) | uses authenticateToken | update import to requireAuth | |

### Anti-Patterns to Avoid

- **Importing from tokenUtils in new middleware:** The `tokenUtils.ts` functions (`verifyAccessToken`, `isTokenBlacklisted`) must NOT be called from the new middleware. They use `jsonwebtoken` against `JWT_SECRET`, not Supabase JWTs.
- **Creating the supabaseAdmin client per-request:** Module-level singleton only. Creating a new client on every request wastes resources.
- **Calling `.schema()` with TypeScript-strict mode on untyped schemas:** The `connect` schema queries will return `any` — don't try to add generic type params that don't exist in `database.types.ts`.
- **Forgetting `revoked_at IS NULL` filter on user_roles:** Revoked roles still have rows; `revoked_at` being non-null means revoked. Always filter `is('revoked_at', null)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification | Custom HMAC comparison | `jose` `jwtVerify` | Handles signature, expiry, issuer, audience in one call |
| Service role Supabase client | Raw pg queries to `connect` schema | `@supabase/supabase-js` createClient with service role | Type safety, auto-handles PostgREST API |
| Token blacklisting | Redis blacklist (existing pattern) | None needed | Supabase JWTs are short-lived stateless tokens; revocation is handled by Supabase Auth |
| Gem awards | Any direct DB insert | `award_gems` RPC | Existing shared RPC with proper atomicity — but this is Phase 43's concern, not Phase 41 |

**Key insight:** Supabase JWTs are cryptographically verified and short-lived. The old token blacklist in Redis was for locally-issued long-lived tokens. With Supabase JWTs, blacklisting is unnecessary at this layer — logout is handled by invalidating the session in Supabase Auth.

---

## Common Pitfalls

### Pitfall 1: Wrong Function Name Export
**What goes wrong:** Callers import `authenticateToken` — if the new middleware is exported as `requireAuth` only, all existing callers break.
**Why it happens:** The phase renames the primary auth middleware from `authenticateToken` to `requireAuth`.
**How to avoid:** Export both names from `auth.ts` as an alias: `export { requireAuth as authenticateToken }` OR update all callers simultaneously. Updating all callers is cleaner and eliminates the old name.
**Warning signs:** TypeScript errors like "Module has no exported member 'authenticateToken'".

### Pitfall 2: req.user vs req.userId Mismatch
**What goes wrong:** Route handlers access `req.user.userId` after the middleware no longer sets `req.user`.
**Why it happens:** The old middleware set `req.user: TokenPayload` (with `userId: number`). The new middleware sets `req.userId: string`. These are completely different shapes.
**How to avoid:** Full text search for `req.user` before finalizing. Audit list above covers all known locations.
**Warning signs:** TypeScript errors on `req.user?.userId`, or runtime `undefined` errors on `req.userId`.

### Pitfall 3: Integer userId vs UUID userId in sessionService
**What goes wrong:** `sessionService.ts` calls `User.findById(session.userId as number)` at line 256 for plausibility detection. After Phase 41, `session.userId` will be a UUID string, not a number.
**Why it happens:** The game session stores `userId: string | number` — after migration, authenticated users will have UUID string IDs, but `User.findById()` takes a `number`.
**How to avoid:** The `User.findById` lookup in sessionService (for plausibility check timer multiplier) will break. The planner must scope this: either (a) skip plausibility timer-multiplier lookup for now (set `timerMultiplier = 1.0` for all users), or (b) replace `User.findById` with a Supabase query to `trivia.player_prefs` for the timer multiplier. Option (a) is the safe Phase 41 approach; option (b) can be Phase 43.
**Warning signs:** `NaN` timer multiplier, runtime errors on `User.findById`.

### Pitfall 4: results Route progression award uses integer userId
**What goes wrong:** `routes/game.ts:385`: `if (typeof session.userId === 'number' && !session.progressionAwarded)` — after migration, authenticated users have UUID string userId, so `typeof session.userId === 'number'` is always false, and progression is never awarded.
**Why it happens:** The guard was written for integer user IDs.
**How to avoid:** Update the condition: `if (session.userId && session.userId !== 'anonymous' && !session.progressionAwarded)`. The progression service itself (`updateUserProgression`) calls `User.updateStats` which is a local PG call — this will also need updating in Phase 43. For Phase 41, the guard should be loosened, but progression awarding via the old local DB path is being replaced by gem awards in Phase 43. Planner decision: either preserve old logic with UUID path (breaks on User.updateStats integer ID) or skip progression awards in Phase 41 (safest).
**Warning signs:** No progression awarded for any authenticated user, no errors thrown.

### Pitfall 5: rateLimiter uses req.user?.userId for Redis key
**What goes wrong:** `middleware/rateLimiter.ts:24` uses `req.user?.userId` for the Redis rate limit key.
**Why it happens:** `req.user` no longer exists after the middleware replacement.
**How to avoid:** Update `rateLimiter.ts` to use `req.userId` instead. The Redis key format changes from `rate_limit:flag:123` (integer) to `rate_limit:flag:<uuid>` (string) — this is fine.
**Warning signs:** Rate limiter returns 401 on every flagging attempt.

### Pitfall 6: connect schema not in TypeScript types
**What goes wrong:** TypeScript strict errors on `.schema('connect').from('connected_profiles')` call.
**Why it happens:** The generated `database.types.ts` was created with `--schema public,trivia` (the connect schema was in the gen command but didn't appear in output, likely because the Supabase CLI wasn't connected with access to it at gen time).
**How to avoid:** Cast to `any` on the `.schema('connect')` call, or use an untyped client. The pattern from the integration guide uses untyped JS — this is expected.
**Warning signs:** TypeScript error "Argument of type 'string' is not assignable to parameter of type 'keyof Database'".

### Pitfall 7: SUPABASE_URL includes /auth/v1 in issuer
**What goes wrong:** `jwtVerify` fails with "issuer mismatch" error.
**Why it happens:** The `SUPABASE_URL` env var is the base URL (e.g., `https://kxsdzaojfaibhuzmclfq.supabase.co`). The JWT issuer claim is `<SUPABASE_URL>/auth/v1`. The `jwtVerify` issuer option must be the full issuer, not just the base URL.
**How to avoid:** Use `issuer: \`${process.env.SUPABASE_URL}/auth/v1\`` exactly as the integration guide shows.
**Warning signs:** All `jwtVerify` calls throw with "JWTClaimValidationFailed: claim 'iss' validation failed".

---

## Code Examples

### Full auth.ts Replacement Skeleton

```typescript
// backend/src/middleware/auth.ts
// Source: empowered-accounts-integration-guide.md §1, §2, §7
import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '../config/supabase.js';

// Encoded once at module load — avoids re-encoding on every request
const SECRET_KEY = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accessToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Keep old name as alias for callers not yet updated
export { requireAuth as authenticateToken };

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.slice(7);
  if (!token) { next(); return; }
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
  } catch {
    // invalid token — continue as anonymous
  }
  next();
}

export async function requireConnected(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { data } = await (supabaseAdmin as any)
    .schema('connect')
    .from('connected_profiles')
    .select('verification_status')
    .eq('user_id', req.userId!)
    .maybeSingle();

  if (!data || data.verification_status !== 'verified') {
    res.status(403).json({ error: 'Connected account required' });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  // Use admin_users table — simpler, correctly typed, consistent with is_admin pattern
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (!data) {
    res.status(403).json({ error: 'Admin required' });
    return;
  }
  next();
}
```

### supabase.ts Client Singleton
```typescript
// backend/src/config/supabase.ts
// Source: empowered-accounts-integration-guide.md §2
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `jsonwebtoken` + local `JWT_SECRET` | `jose` `jwtVerify` + `SUPABASE_JWT_SECRET` | Phase 41 | Hard cutover; old JWTs immediately rejected |
| `req.user.isAdmin` boolean from JWT | Live query to `admin_users` table | Phase 41 | Admin status checked at request time, not encoded in token |
| `req.user.userId` (number) | `req.userId` (UUID string) | Phase 41 | All route handlers must update |
| Local user table for auth | Shared `public.users` via Supabase | Phase 40 (done) | UUID user IDs throughout |
| Token blacklist in Redis | Not needed | Phase 41 | Supabase JWTs are short-lived; logout handled by Supabase Auth |

**Deprecated/outdated after Phase 41:**
- `src/utils/tokenUtils.ts`: All functions (`generateAccessToken`, `verifyAccessToken`, `isTokenBlacklisted`, etc.) become unused. Do NOT delete in Phase 41 — auth routes still exist. They will be cleaned up when the local auth endpoints are removed in a later phase.
- `src/config/jwt.ts`: `JWT_SECRET`, `JWT_REFRESH_SECRET` become unused for new tokens.
- `src/controllers/authController.ts`: The login/signup/logout endpoints still exist and use `jsonwebtoken`. These remain unchanged in Phase 41 — they are being replaced by Supabase Auth in Phase 43.

---

## Open Questions

1. **Admin check: `admin_users` vs `user_roles` table**
   - What we know: The integration guide says "check `public.user_roles`" but the actual `user_roles` table has `role_id` FK (not `role` text). `admin_users` is a simpler direct lookup that's clearly typed in `database.types.ts`.
   - What's unclear: Whether `admin_users` or `user_roles` is the authoritative source for admin status going forward.
   - Recommendation: Use `admin_users` for Phase 41 (simpler, correctly typed, matches the `isAdmin` boolean pattern from before). If the integration guide pattern is strictly required, use `user_roles` with a join to `roles` where `slug = 'admin'` AND `revoked_at IS NULL`.

2. **sessionService plausibility: User.findById(userId as number)**
   - What we know: After Phase 41, `session.userId` for authenticated users will be a UUID string. `User.findById` takes `number`.
   - What's unclear: Whether Phase 41 should fix the sessionService plausibility path, or leave it as a known broken path until Phase 43.
   - Recommendation: Phase 41 should make `sessionService.ts` safe by: (a) checking `typeof session.userId === 'string' && session.userId !== 'anonymous'` and either skip plausibility (set timerMultiplier = 1.0) or query `trivia.player_prefs` for the timer_multiplier via supabaseAdmin. Option (a) skip is safer for Phase 41 scope.

3. **results route progression award gate**
   - What we know: `routes/game.ts:385` guards on `typeof session.userId === 'number'` — this will never be true for UUID users.
   - What's unclear: Whether the old local progression system should still run for Phase 41 (it can't — User.updateStats takes integer IDs) or be entirely disabled until Phase 43.
   - Recommendation: Update the guard condition and let it call `updateUserProgression` with UUID — it will fail at `User.updateStats`. Better: skip progression award entirely in Phase 41, log a warning, and let Phase 43 implement the Supabase-backed version.

---

## Sources

### Primary (HIGH confidence)
- `empowered-accounts-integration-guide.md` (repo root, v1.0 2026-02-28) — exact code patterns for `requireAuth`, `requireConnected`, `requireAdmin`, JWT secret usage
- `backend/src/middleware/auth.ts` (direct read) — existing middleware to replace
- `backend/src/types/database.types.ts` (direct read) — actual `user_roles`, `roles`, `admin_users` table schemas
- `backend/src/routes/game.ts`, `feedback.ts`, `profile.ts`, `admin.ts` (direct read) — complete caller audit
- `backend/src/services/sessionService.ts` (direct read) — userId type issue identified
- `backend/package.json` (direct read) — confirms `jose` and `@supabase/supabase-js` are NOT installed

### Secondary (MEDIUM confidence)
- Supabase JWT docs at `supabase.com/docs/guides/auth/jwt-fields` — confirms `sub` claim is UUID, `aud` is `'authenticated'`, `iss` is `<SUPABASE_URL>/auth/v1`
- github.com/panva/jose releases — confirms current version is v6.1.3
- github.com/supabase/supabase-js releases — confirms current version is v2.98.0

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — integration guide mandates `jose` and `@supabase/supabase-js`; versions verified from GitHub releases
- Architecture: HIGH — all files directly read; callers fully audited; patterns taken verbatim from integration guide
- Pitfalls: HIGH — identified from direct code reading (sessionService integer cast, progression guard, rateLimiter req.user access)
- `requireAdmin` implementation: MEDIUM — integration guide has a discrepancy with actual DB schema; two valid paths identified

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (stable domain; jose and supabase-js are mature libraries)
