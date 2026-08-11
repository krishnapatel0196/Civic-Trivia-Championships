# Phase 44: Deprecation & Cleanup - Research

**Researched:** 2026-03-01
**Domain:** Legacy local auth infrastructure removal (Node.js/TypeScript backend)
**Confidence:** HIGH — all findings from direct codebase inspection

## Summary

This is a purely subtractive phase. All legacy auth infrastructure was verified by reading
every file in the backend. The findings below are exact file paths and line numbers, not
estimates. No library research or web searches were needed — the codebase is the source
of truth.

The core deletion set is four files: `tokenUtils.ts`, `jwt.ts`, `authController.ts`, `User.ts`.
These have a fan-out into five other files that import them and require surgical edits.
The Redis blacklist logic lives entirely inside `tokenUtils.ts` (which is deleted) plus
a legacy client export in `redis.ts` (which is edited, not deleted). The local `users` table
never existed in the shared Supabase project — the migration is a safe `DROP TABLE IF EXISTS`
guard against the old local PostgreSQL setup.

**Primary recommendation:** Delete in dependency order — delete the four core files first, then
edit the five files that imported them, removing dead branches and imports as you go.

---

## Standard Stack

This phase requires no new libraries. It is purely subtractive.

**Packages to remove from `package.json`:**

| Package | Location | Currently Used By |
|---------|----------|-------------------|
| `bcrypt` `^5.1.1` | `dependencies` | `authController.ts` (lines 2, 35, 69), `profile.ts` (lines 3, 150, 157) |
| `@types/bcrypt` `^5.0.2` | `devDependencies` | Type declarations for bcrypt |
| `jsonwebtoken` `^9.0.2` | `dependencies` | `tokenUtils.ts` (lines 1, 2) only |
| `@types/jsonwebtoken` `^9.0.5` | `devDependencies` | Type declarations for jsonwebtoken |

**Note:** `jose` (already in dependencies, used by `middleware/auth.ts`) is NOT removed —
it is the current Supabase JWT verification library and is actively used.

**`npm uninstall` command:**
```bash
npm uninstall bcrypt @types/bcrypt jsonwebtoken @types/jsonwebtoken
```

---

## Architecture Patterns

### Files to DELETE entirely

| File | Absolute Path | Why Deleted |
|------|--------------|-------------|
| `tokenUtils.ts` | `backend/src/utils/tokenUtils.ts` | Entire file: JWT generation, Redis blacklist functions, all legacy token logic |
| `jwt.ts` | `backend/src/config/jwt.ts` | Entire file: JWT_SECRET, JWT_REFRESH_SECRET, token expiry constants |
| `authController.ts` | `backend/src/controllers/authController.ts` | Entire file: signup/login/logout/refresh handlers |
| `User.ts` | `backend/src/models/User.ts` | Entire file: local users table model, all SQL queries against `users` |

### Files to EDIT (surgical changes)

**1. `backend/src/server.ts`**
- Line 7: Remove `import { router as authRouter } from './routes/auth.js';`
- Line 62: Remove `app.use('/auth', authRouter);`
- No other changes needed in this file.

**2. `backend/src/routes/auth.ts`** — DELETE entire file
- This file imports from `authController.ts` (line 2), `validation.ts` (line 3), `validate.ts` (line 4), `auth.ts` middleware (line 5)
- It only registers the 4 auth routes: signup, login, logout, refresh
- After deleting, the routes return 404 naturally (no router registered)

**3. `backend/src/utils/validation.ts`** — EDIT (keep file, remove legacy exports)
- Lines 6–27: Remove `signupValidation` export (used only by `routes/auth.ts` which is deleted)
- Lines 32–41: Remove `loginValidation` export (used only by `routes/auth.ts`)
- Lines 57–70: Remove `updatePasswordValidation` export (used only by `profile.ts` PATCH /password which references bcrypt and User.ts)
- **Keep:** Lines 46–52 `updateNameValidation` — still used by `profile.ts` PATCH /name route
- Line 1 `import { body } from 'express-validator'` — keep (still needed for updateNameValidation)

**4. `backend/src/routes/profile.ts`** — EDIT (remove legacy password/name/avatar branches)
- Line 3: Remove `import bcrypt from 'bcrypt';`
- Line 11: Remove `import { User } from '../models/User.js';`
- Lines 10: Keep `import { updateNameValidation, updatePasswordValidation }` → after removing `updatePasswordValidation` from validation.ts, change to just `import { updateNameValidation }`
- Lines 118–131 (`PATCH /name`): The `User.updateName(userId, name)` call — this ENTIRE route uses `User` model against the local users table. Since the users table is being dropped, this route's implementation must change. **Decision needed (see Open Questions #1)**
- Lines 136–166 (`PATCH /password`): Remove entire route — uses bcrypt + User.findById + User.updatePassword against deleted users table
- Lines 171–215 (`POST /avatar`): Uses `User.updateAvatarUrl(userId, avatarUrl)` — same problem. **Decision needed (see Open Questions #1)**
- Lines 57–87 (`GET /`): Already uses `playerStats` and `playerPrefs` (Drizzle/Supabase) — keep as-is, no changes needed
- Lines 92–113 (`PATCH /settings`): Already uses `playerPrefs` (Drizzle/Supabase) — keep as-is

**5. `backend/src/services/progressionService.ts`** — EDIT
- Line 6: Remove `import { User } from '../models/User.js';`
- Lines 39–53 (`updateUserProgression` function): Remove entire function (GEMS-03 deprecated)
- The rest of the file (`calculateProgression`, `checkAccountContext`, `awardPlatformGems`, `upsertPlayerStats`) stays intact

**6. `backend/src/services/sessionService.ts`** — EDIT
- Line 11: Remove `import { User } from '../models/User.js';`
- Lines 264–269 (inside `submitAnswer`): Remove the integer user branch:
  ```typescript
  // Remove this branch:
  if (typeof session.userId === 'number') {
    // Legacy integer user path (will be removed in Phase 44)
    const user = await User.findById(session.userId);
    timerMultiplier = user?.timerMultiplier ?? 1.0;
  }
  // For UUID string users: timerMultiplier stays 1.0
  ```
  After removal, `timerMultiplier` simply defaults to `1.0` for all users (UUID path already does this).

**7. `backend/src/routes/game.ts`** — EDIT
- Line 4: Remove `updateUserProgression` from the import: change to `import { calculateProgression, checkAccountContext, awardPlatformGems, upsertPlayerStats } from '../services/progressionService.js';`
- Lines 394–403: Remove the integer user branch in the results handler:
  ```typescript
  // Remove this branch:
  if (typeof session.userId === 'number') {
    // Legacy integer user path — TODO Phase 44: Remove when integer users are fully migrated
    progression = await updateUserProgression(
      session.userId,
      results.totalScore,
      results.totalCorrect,
      results.totalQuestions
    );
    session.progressionAwarded = true;
  } else {
  ```
  And remove the matching closing `}` brace at the end of the UUID block.

**8. `backend/src/config/redis.ts`** — EDIT (keep file, remove legacy client)
- Lines 140–162: Remove the entire `legacyRedis` section (comment "Legacy Redis client export for backward compatibility (used by tokenUtils)" through `export { legacyRedis as redis };`)
- This section creates a second Redis connection just for tokenUtils. With tokenUtils deleted, this connection is orphaned.
- **Keep:** The `SessionStorageFactory` class and `storageFactory` singleton (lines 1–138) — still used by session management.

**9. `backend/src/routes/admin.ts`** — EDIT
- Lines 949–969: The `LEFT JOIN users u ON qf.user_id = u.id` raw SQL join against the local users table
- After the users table is dropped, this join will fail. Replace the entire flagsResult query: remove the JOIN and the `username` field, return `userId` as-is. The `username: row.username || 'Unknown User'` fallback becomes `username: 'Unknown User'` or just omit the field.
- **Exact location:** Lines 950–970 in admin.ts

**10. `backend/src/env.ts`** — EDIT
- Lines 11–17: Remove `ADMIN_EMAIL` validation and export:
  ```typescript
  // Remove:
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && !adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    console.warn('WARNING: ADMIN_EMAIL is set but does not look like a valid email address:', adminEmail);
  }
  export const ADMIN_EMAIL = adminEmail || null;
  ```
- After removal, `env.ts` only has dotenv loading (lines 1–9). Consider whether this file should be kept as a stub or removed entirely if it has no remaining exports.

---

## Don't Hand-Roll

This is a cleanup phase — nothing needs to be built. The table below documents what NOT to do:

| Temptation | Don't Do This | Reason |
|-----------|---------------|--------|
| Tombstone responses for auth routes | Don't add 404 handlers for `/auth/*` | Decision locked: 404 via no-router is sufficient |
| Archive `User.ts` instead of deleting | Don't move to `_deprecated/` | Decision locked: hard delete |
| Keep `jsonwebtoken` for future use | Don't leave it in package.json | Unused after tokenUtils deletion |
| Drop `public.users` in Supabase | Don't touch `public.users` | That's Supabase Auth's built-in table |

---

## Common Pitfalls

### Pitfall 1: admin.ts raw SQL join against dropped users table
**What goes wrong:** The `GET /api/admin/flags/:questionId` endpoint (admin.ts ~line 950) has a `LEFT JOIN users u ON qf.user_id = u.id` that cross-joins the legacy integer `users` table with the `trivia.question_flags` table. After the users table is dropped, this query errors at runtime.
**Why it happens:** This admin UI path was written during Phase 27/29 when users were integer IDs. The Supabase migration to UUID users was never reflected here.
**How to avoid:** Edit admin.ts to remove the JOIN and the `username` column. The `qf.user_id` is a UUID in the new schema — no username lookup possible without an accounts API call. Return UUID as-is or drop the field.
**Warning signs:** If the admin flag detail endpoint returns 500 after cleanup, this is the cause.

### Pitfall 2: cookie-parser becomes orphaned
**What goes wrong:** `cookie-parser` is imported in `server.ts` and used globally. After removing `authController.ts` (which used `req.cookies.refreshToken`), no remaining code reads cookies.
**Why it happens:** The auth routes were the only consumers of cookie functionality.
**How to avoid:** After deleting `authController.ts` and `routes/auth.ts`, check if `cookie-parser` has any remaining callers. If none remain, remove `import cookieParser` and `app.use(cookieParser())` from `server.ts` and `npm uninstall cookie-parser @types/cookie-parser`.
**Warning signs:** `grep -rn "req.cookies" backend/src` after cleanup returns 0 results — remove cookie-parser.

### Pitfall 3: profile.ts PATCH /name and POST /avatar use User model
**What goes wrong:** The `PATCH /name` (line 118) and `POST /avatar` (line 171) routes in profile.ts call `User.updateName()` and `User.updateAvatarUrl()` which query the local users table. After the table drop, these endpoints will error.
**Why it happens:** Phase 43 left these routes with "legacy integer cast" comments — they were deferred to Phase 44.
**How to avoid:** See Open Questions #1. The planner must decide the replacement implementation for these two routes.
**Warning signs:** PATCH /name and POST /avatar returning 500 after cleanup.

### Pitfall 4: GameSession.userId still typed as `string | number`
**What goes wrong:** The `GameSession` interface in `sessionService.ts` has `userId: string | number`. After removing integer user support, this can be simplified to `userId: string`.
**Why it happens:** The union type was added to support both legacy and UUID users simultaneously.
**How to avoid:** After removing the integer user branch from `submitAnswer` and `game.ts` results handler, update `GameSession.userId` to `string`. Also update `recentQuestions` map type in game.ts from `Map<string | number, string[]>` to `Map<string, string[]>`.
**Warning signs:** TypeScript compiler warnings about dead branches involving `typeof session.userId === 'number'`.

### Pitfall 5: `env.ts` exports nothing after ADMIN_EMAIL removal
**What goes wrong:** If `env.ts` is left as a file that only calls `dotenv.config()` with no exports, it's fine — `server.ts` imports it as a side effect (`import './env.js'`). But if something else imports `ADMIN_EMAIL` from it, the import will break.
**Why it happens:** `ADMIN_EMAIL` was exported from env.ts and could be imported elsewhere.
**How to avoid:** After removing ADMIN_EMAIL from env.ts, verify no other file imports it: `grep -rn "import.*ADMIN_EMAIL" backend/src` — currently zero results, so this is safe.

### Pitfall 6: `schema.sql` and `rollback.sql` are not deleted but remain as orphaned artifacts
**What goes wrong:** `backend/schema.sql` (the original users table schema) and `backend/rollback.sql` remain in the repo after cleanup. They're not imported or run automatically but they're confusing dead documentation.
**Why it happens:** These files were created during Phase 01 for the original PostgreSQL setup.
**How to avoid:** Delete `backend/schema.sql` and `backend/rollback.sql` as part of the cleanup. They describe infrastructure that no longer exists.

### Pitfall 7: The "local users table" drop migration context
**What goes wrong:** The CONTEXT says "Local `users` table dropped via migration" but the DATABASE_URL now points to Supabase. The local `users` table was a PostgreSQL table that NEVER existed in the shared Supabase project — it was only in the old local/EV-Backend-Dev PostgreSQL.
**Why it happens:** Phase 40 migrated content tables to Supabase but explicitly skipped the users table (it's incompatible with UUID FKs). The `trivia` schema on Supabase never had a `users` table.
**How to avoid:** The Supabase migration for DEP-04 should be: `DROP TABLE IF EXISTS public.users_legacy` or just a comment migration explaining that the legacy table was never present in this project. Do NOT drop `public.users` — that's Supabase Auth's built-in table. Write the migration as a safe `IF EXISTS` guard.

---

## Code Examples

### Removing integer user branch from sessionService.ts (lines 259–292)

Before (lines 260–292):
```typescript
// Phase 41: UUID users skip User.findById (takes integer ID)
// timerMultiplier defaults to 1.0 — player_prefs migration is Phase 43
let timerMultiplier = 1.0;
if (typeof session.userId === 'number') {
  // Legacy integer user path (will be removed in Phase 44)
  const user = await User.findById(session.userId);
  timerMultiplier = user?.timerMultiplier ?? 1.0;
}
// For UUID string users: timerMultiplier stays 1.0
```

After:
```typescript
// timerMultiplier defaults to 1.0 for all users
// (UUID users: fetched from player_prefs at session start — Phase 43 deferred to future)
const timerMultiplier = 1.0;
```

### Removing integer user branch from game.ts results handler (lines 394–443)

Before:
```typescript
if (typeof session.userId === 'number') {
  // Legacy integer user path — TODO Phase 44: Remove when integer users are fully migrated
  progression = await updateUserProgression(
    session.userId,
    results.totalScore,
    results.totalCorrect,
    results.totalQuestions
  );
  session.progressionAwarded = true;
} else {
  // UUID user path — platform gem award + stats
  const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions);
  // ... (keep all of this)
}
```

After (remove outer if/else, keep only UUID path):
```typescript
// UUID user path — platform gem award + stats
const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions);
// ... (rest of UUID path unchanged)
```

### Supabase migration for users table drop (DEP-04)

```sql
-- supabase/migrations/20260301000002_drop_legacy_users_table.sql
-- Phase 44: Remove legacy local users table infrastructure
-- The local users table was from the old PostgreSQL-based auth system (Phase 01).
-- It was never created in this shared Supabase project (kxsdzaojfaibhuzmclfq).
-- The trivia schema on this project has no users table.
-- This migration is a safety guard only.

-- NOTE: public.users is Supabase Auth's built-in table — DO NOT DROP IT.
-- The legacy table we're removing was named "users" in the public schema
-- of the old EV-Backend-Dev PostgreSQL, not in this project.

-- No-op guard: if somehow a legacy users table exists in trivia schema, remove it.
DROP TABLE IF EXISTS trivia.users CASCADE;
```

### Removing legacy Redis export from redis.ts (lines 140–162)

Remove this entire block:
```typescript
// Legacy Redis client export for backward compatibility (used by tokenUtils)
// Only connect if REDIS_URL is set — skip localhost fallback to avoid error spam
let legacyRedis: RedisClientType<any, any, any> | null = null;

if (process.env.REDIS_URL) {
  legacyRedis = createClient({
    url: process.env.REDIS_URL
  });

  legacyRedis.on('connect', () => {
    console.log('Redis connected (legacy token storage)');
  });

  legacyRedis.on('error', (err) => {
    console.error('Redis connection error (legacy token storage):', err);
  });

  legacyRedis.connect().catch((err) => {
    console.error('Failed to connect to Redis (legacy token storage):', err);
  });
}

export { legacyRedis as redis };
```

### Updated .env.example

```bash
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@host:5432/postgres

# Redis (for game session storage)
REDIS_URL=redis://localhost:6379

# Supabase (shared platform project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Empowered Accounts platform (required for gem awards and tier checks)
EMPOWERED_ACCOUNTS_URL=https://your-empowered-accounts-api.com

# OpenAI API (for semantic dedup - text-embedding-3-small)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Remove from .env.example:**
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `ADMIN_EMAIL=...`

---

## State of the Art

| Old Approach | Current Approach | Status |
|--------------|------------------|--------|
| Local bcrypt password hashing | Supabase Auth handles passwords | Remove: bcrypt, authController |
| Custom JWT tokens (HS256) with tokenUtils.ts | Supabase JWTs verified with jose in middleware/auth.ts | Remove: tokenUtils, jwt.ts |
| Local `users` table (PostgreSQL) | Supabase `public.users` (Supabase Auth) + `trivia.player_stats` + `trivia.player_prefs` | Drop: local users table; keep Supabase tables |
| Redis token blacklist (blacklist:token keys) | Supabase handles session invalidation natively | Remove: blacklist functions in tokenUtils |
| Redis refresh token store (refresh:userId:token keys) | Supabase refresh tokens are managed by Supabase Auth | Remove: storeRefreshToken/revokeRefreshToken/isRefreshTokenValid |
| Integer user IDs | UUID user IDs from Supabase Auth | Remove integer branches in sessionService, game routes |
| ADMIN_EMAIL env var for admin promotion | admin_users table in Supabase | Remove: ADMIN_EMAIL from env.ts and .env.example |

---

## Complete Deletion Checklist

### Files deleted (4 core + 2 route files)
- [ ] `backend/src/utils/tokenUtils.ts` — entire file
- [ ] `backend/src/config/jwt.ts` — entire file
- [ ] `backend/src/controllers/authController.ts` — entire file
- [ ] `backend/src/models/User.ts` — entire file
- [ ] `backend/src/routes/auth.ts` — entire file
- [ ] `backend/schema.sql` — legacy schema doc (orphaned artifact)
- [ ] `backend/rollback.sql` — legacy rollback doc (orphaned artifact)

### Files edited (surgical changes)
- [ ] `backend/src/server.ts` — remove authRouter import + `app.use('/auth', authRouter)`
- [ ] `backend/src/utils/validation.ts` — remove signupValidation, loginValidation, updatePasswordValidation
- [ ] `backend/src/routes/profile.ts` — remove bcrypt import, User import, PATCH /password route, PATCH /name + POST /avatar User.* calls
- [ ] `backend/src/services/progressionService.ts` — remove User import + updateUserProgression function
- [ ] `backend/src/services/sessionService.ts` — remove User import + integer user timerMultiplier branch
- [ ] `backend/src/routes/game.ts` — remove updateUserProgression import + integer user results branch
- [ ] `backend/src/config/redis.ts` — remove legacyRedis section (lines 140–162)
- [ ] `backend/src/routes/admin.ts` — remove LEFT JOIN users from flagsResult query (~lines 950–970)
- [ ] `backend/src/env.ts` — remove ADMIN_EMAIL validation and export
- [ ] `backend/.env.example` — remove JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL lines
- [ ] `backend/package.json` — remove bcrypt, @types/bcrypt, jsonwebtoken, @types/jsonwebtoken

### Migration files (new)
- [ ] `supabase/migrations/20260301000002_drop_legacy_users_table.sql` — safe IF EXISTS guard

### npm operations
- [ ] `npm uninstall bcrypt @types/bcrypt jsonwebtoken @types/jsonwebtoken` (run from `backend/`)

---

## Open Questions

### Question 1: What replaces profile.ts PATCH /name and POST /avatar after User model deletion?

**What we know:** `PATCH /name` (profile.ts line 118) calls `User.updateName(userId, name)` which runs `UPDATE users SET name = $1`. `POST /avatar` (profile.ts line 171) calls `User.updateAvatarUrl(userId, avatarUrl)`. Both use the deleted local users table.

**What's unclear:** Phase 43 left these with "legacy integer cast" comments suggesting they're earmarked for replacement, but the CONTEXT does not specify what replaces them in Phase 44. Options:
  - Update to use Supabase `auth.update()` for display name changes
  - Remove these routes entirely (the Empowered Accounts platform handles profile management)
  - Stub them out with 501 Not Implemented

**Recommendation:** Since Phase 43 description states "login, profile, collections all working via Supabase auth," the frontend may already be calling the accounts platform API for name/avatar updates. Verify in the frontend whether these backend routes are still called. If not called, remove them silently. If called, replace with 501 responses until the accounts API integration handles it.

**Note on avatar uploads:** The `UPLOAD_DIR = './uploads/avatars'` local disk storage is also legacy (Supabase storage or accounts platform handles avatars now). Consider removing the multer configuration and POST /avatar entirely.

### Question 2: Should `cookie-parser` be removed?

**What we know:** `cookie-parser` is used only by `authController.ts` (`req.cookies.refreshToken`). After deleting authController, no code reads cookies.

**What's unclear:** Whether any future phase will add cookie-based features.

**Recommendation:** Remove `cookie-parser` as part of this phase. It's dead weight and keeping it signals cookies are used when they aren't. `npm uninstall cookie-parser @types/cookie-parser`. Remove from server.ts.

### Question 3: admin.ts flag detail username after users table drop

**What we know:** admin.ts line 966 joins the local users table to get usernames for the flag detail view. After the table drop, this breaks.

**What's unclear:** The CONTEXT does not address admin routes. The question_flags table now has UUID user_ids. There's no in-process way to resolve UUID → username without calling the accounts platform.

**Recommendation:** Remove the JOIN entirely. Replace `username: row.username || 'Unknown User'` with `userId: row.user_id` (return the raw UUID). Admin UI can display UUIDs or make a separate lookup call. This is the simplest fix that keeps the route functional.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all findings verified by reading actual files:
  - `backend/src/utils/tokenUtils.ts` — full content
  - `backend/src/config/jwt.ts` — full content
  - `backend/src/controllers/authController.ts` — full content
  - `backend/src/models/User.ts` — full content
  - `backend/src/routes/auth.ts` — full content
  - `backend/src/routes/profile.ts` — full content
  - `backend/src/routes/game.ts` — full content
  - `backend/src/routes/admin.ts` — lines 940–990
  - `backend/src/services/progressionService.ts` — full content
  - `backend/src/services/sessionService.ts` — full content
  - `backend/src/config/redis.ts` — full content
  - `backend/src/env.ts` — full content
  - `backend/src/server.ts` — full content
  - `backend/src/utils/validation.ts` — full content
  - `backend/package.json` — full content
  - `backend/.env.example` — full content
  - `backend/schema.sql` — full content
  - `supabase/migrations/` — all 2 files

---

## Metadata

**Confidence breakdown:**
- File deletion targets: HIGH — files read directly, existence confirmed
- Import graph: HIGH — grep across entire src directory
- Redis blacklist scope: HIGH — only in tokenUtils.ts (deleted) + redis.ts legacy export (edited)
- users table schema: HIGH — schema.sql read directly
- Supabase migration approach: HIGH — existing migrations read, naming convention confirmed
- GEMS-03 deprecated markers: HIGH — grep confirmed exact locations
- Test files: HIGH — no project-level test files exist; only node_modules tests

**Research date:** 2026-03-01
**Valid until:** This research describes the current static codebase state. Valid indefinitely (no fast-moving libraries involved).
