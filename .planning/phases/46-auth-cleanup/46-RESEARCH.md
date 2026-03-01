# Phase 46: Auth Cleanup - Research

**Researched:** 2026-03-01
**Domain:** TypeScript backend — Express middleware refactor + JSDoc correction
**Confidence:** HIGH

---

## Summary

Phase 46 is a pure tech-debt cleanup with no logic changes, no new dependencies, and no risk to runtime behavior. Three low-severity items were catalogued in the v1.8 milestone audit against the `41-auth-tier-integration` and `44-deprecation-cleanup` phases:

1. Three route files (`profile.ts`, `admin.ts`, `feedback.ts`) still import and use `authenticateToken` — the backward-compat alias that was left in `auth.ts` to avoid a rename sweep during Phase 41. The alias is `export { requireAuth as authenticateToken }` on line 50 of `auth.ts`. Eliminating this alias requires updating three import statements and three usage sites.

2. `requireConnected` is exported from `auth.ts` (lines 90–107) but has zero consumers anywhere in the backend. No route, no middleware chain, no script imports it. It was added in Phase 41 per the integration guide spec but the actual Connected-tier guard in production uses `checkAccountContext` inside the game route instead. The dead export should be removed.

3. `sessionService.ts` line 126 has a stale JSDoc `@param userId` description that reads "number for authenticated, 'anonymous' for unauthenticated". The type is correctly `string` in both the function signature and the `GameSession` interface — this is a comment-only defect from the pre-Phase-40 era (before UUID migration). The correct description is "UUID string for authenticated users, 'anonymous' for unauthenticated".

All three changes are mechanical. No behavior changes, no new packages, no database changes. The TypeScript compiler will validate the rename (the alias export will be removed, so any missed callers become compile errors). This is the safest possible class of work.

**Primary recommendation:** Execute as one task with three sequential sub-steps: rename callers, remove dead export, fix JSDoc, then run `tsc` to confirm zero errors.

---

## Standard Stack

This phase uses only what is already installed. No new dependencies.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| TypeScript | (project, ~5.x) | Type-checked build | Already in use; `tsc` is the build verifier |
| Express | ^4.18.2 | HTTP framework | Already in use |

### No New Packages
This phase requires zero `npm install` calls. All work is string replacement and comment editing within existing files.

**Installation:**
```bash
# None required
```

---

## Architecture Patterns

### Pattern 1: Named Export Rename (import-statement level)

The rename from `authenticateToken` to `requireAuth` is purely at the import site. The middleware function itself is already named `requireAuth` — the alias was the only indirection. After removing the alias export from `auth.ts`, any file that still references `authenticateToken` will produce a TypeScript compile error, making the change self-verifying.

**Before (in each caller):**
```typescript
// Source: direct code read — profile.ts:2, admin.ts:2, feedback.ts:9
import { authenticateToken } from '../middleware/auth.js';
// ...
router.use(authenticateToken);          // profile.ts:10
router.use(authenticateToken, requireAdmin); // admin.ts:18
authenticateToken,                      // feedback.ts:26, 77, 125
```

**After (in each caller):**
```typescript
import { requireAuth } from '../middleware/auth.js';
// ...
router.use(requireAuth);
router.use(requireAuth, requireAdmin);
requireAuth,
```

### Pattern 2: Dead Export Removal

Remove the `requireConnected` function from `auth.ts`. Since no file in the codebase imports it, removal is safe. The function body queries `connect.connected_profiles` via `(supabaseAdmin as any).schema('connect')` — this query will simply never run once the export is deleted.

**Lines to remove from `auth.ts`:**
- Lines 85–107: The entire `requireConnected` function including its JSDoc block
- The `supabaseAdmin` import on line 3 must be verified — it is used by `requireAdmin` (lines 124–134), so it MUST be retained. Only `requireConnected` itself is removed.

### Pattern 3: JSDoc Correction (comment-only)

`sessionService.ts` line 126 `@param userId` comment says "number for authenticated" which is incorrect — `userId` is a `string` (UUID) since Phase 40's UUID migration.

**Before:**
```typescript
// Source: direct code read — sessionService.ts:126
* @param userId - User identifier (number for authenticated, 'anonymous' for unauthenticated)
```

**After:**
```typescript
* @param userId - UUID string for authenticated users, or 'anonymous' for unauthenticated
```

### Recommended Execution Sequence

```
1. auth.ts     — Remove lines 48–50 (authenticateToken alias export)
2. auth.ts     — Remove lines 85–107 (requireConnected function + JSDoc)
3. profile.ts  — Update import + router.use() call
4. admin.ts    — Update import + router.use() call
5. feedback.ts — Update import + 3 inline middleware references
6. sessionService.ts — Fix @param userId JSDoc on line 126
7. Run: cd backend && npx tsc --noEmit
```

### Anti-Patterns to Avoid

- **Removing `requireAuth as authenticateToken` alias before updating callers:** TypeScript will catch it anyway, but editing `auth.ts` first and running tsc before updating callers produces noisy errors. Edit callers first, then remove the alias, then verify.
- **Removing `supabaseAdmin` import from auth.ts:** `requireAdmin` still uses it (line 124). Only `requireConnected` references are removed.
- **Updating JSDoc without reading the full existing comment:** The `@param` block has more content. Replace only the description of the `userId` param, not the entire block.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying no missed callers | Manual grep | `tsc --noEmit` | Compiler catches all references automatically once alias is removed |
| Validating JSDoc correctness | Custom tooling | Code review + `tsc` | TypeScript validates type signatures; JSDoc is human-readable only |

**Key insight:** Removing the `authenticateToken` alias export turns the TypeScript compiler into the exhaustive verification tool. Any file that still uses the old name will fail to compile — no grep audit needed.

---

## Common Pitfalls

### Pitfall 1: Missing a `feedback.ts` Reference

**What goes wrong:** `feedback.ts` uses `authenticateToken` as an inline middleware argument on three separate routes (lines 26, 77, 125) — not as a `router.use()` call. A developer who only looks for `router.use(authenticateToken)` misses all three inline uses.

**Why it happens:** The pattern differs from `profile.ts` and `admin.ts`, which apply auth via `router.use()`.

**How to avoid:** Search for all occurrences of `authenticateToken` in the file, not just `router.use()`. After the rename, `tsc --noEmit` will catch any remaining references.

**Warning signs:** Build passes but JSDoc comments in `feedback.ts` still say "authenticateToken" (comments are not validated by tsc — fix them too).

### Pitfall 2: Removing `supabaseAdmin` Import Along With `requireConnected`

**What goes wrong:** Developer removes the entire `requireConnected` block including the import that `requireAdmin` also needs.

**Why it happens:** `supabaseAdmin` appears in both functions; when deleting `requireConnected` it's easy to assume the import becomes unused.

**How to avoid:** After removing `requireConnected`, verify `requireAdmin` (lines 114–135) still compiles. `tsc --noEmit` will catch a missing import as an error.

**Warning signs:** `tsc` reports "Cannot find name 'supabaseAdmin'" in the `requireAdmin` function.

### Pitfall 3: JSDoc Comments in feedback.ts Not Updated

**What goes wrong:** The JSDoc blocks above each route handler in `feedback.ts` say "Middleware: authenticateToken" (e.g., line 21, line 72, line 120). These are not caught by `tsc`.

**Why it happens:** tsc only validates TypeScript syntax, not JSDoc prose content.

**How to avoid:** After updating the import and middleware references, grep for "authenticateToken" in `feedback.ts` to catch comment references. Update all three route-level JSDoc middleware lines.

**Warning signs:** After successful build, `grep authenticateToken backend/src/` still returns hits in feedback.ts comments.

---

## Code Examples

### Exact Current State of auth.ts Alias (lines 48–50)

```typescript
// Source: direct code read — backend/src/middleware/auth.ts:48-50
// Backward-compat alias — existing callers importing authenticateToken continue to work
// until Plan 02 migrates them to requireAuth
export { requireAuth as authenticateToken };
```

These three lines are deleted in their entirety. The comment above them references "Plan 02" (the original plan from Phase 41-01) — that plan is now complete.

### Exact Current State of requireConnected (lines 85–107 in auth.ts)

```typescript
// Source: direct code read — backend/src/middleware/auth.ts:85-107
/**
 * Requires the authenticated user to have a verified connected_profiles row
 * in the connect schema. Must be used after requireAuth.
 * Returns 403 if no verified connected profile exists.
 */
export async function requireConnected(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
```

Delete this entire block. The `supabaseAdmin` import on line 3 remains (still used by `requireAdmin`).

### Exact Current State of stale JSDoc (sessionService.ts:124-127)

```typescript
// Source: direct code read — backend/src/services/sessionService.ts:124-127
  /**
   * Create a new game session
   * @param userId - User identifier (number for authenticated, 'anonymous' for unauthenticated)
   * @param questions - Array of questions for this game
```

Change line 126 description only. The corrected line:

```typescript
   * @param userId - UUID string for authenticated users, or 'anonymous' for unauthenticated
```

### Build Verification Command

```bash
cd "C:/Project Test/backend" && npx tsc --noEmit
```

A zero-error output confirms all renames are complete and no references were missed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `authenticateToken` (tokenUtils-era name) | `requireAuth` (Supabase-era name) | Phase 41 (v1.8) | Three callers still use old name |
| `requireConnected` as active middleware | `checkAccountContext` in game route | Phase 41/42 implementation | `requireConnected` became dead code |
| `userId: number` (pre-UUID era) | `userId: string` (UUID) | Phase 40 database migration | JSDoc not updated at the time |

**Deprecated/outdated:**
- `authenticateToken` export: was preserved for backward compat in Phase 41 with a TODO comment referencing "Plan 02" — that migration never happened. Phase 46 completes it.
- `requireConnected` export: was added per integration guide spec but the actual implementation chose session-level `checkAccountContext` instead. Dead since Phase 41.
- JSDoc "number for authenticated": survives from pre-Phase-40 era when userId was a numeric PK. Phase 40 migrated to UUIDs; the comment was not updated.

---

## Open Questions

None. All three items are fully characterized by direct code inspection. No ambiguity remains.

---

## Sources

### Primary (HIGH confidence)

Direct code reads from committed codebase (2026-03-01):

- `C:/Project Test/backend/src/middleware/auth.ts` — complete file read; alias export on line 50, `requireConnected` on lines 90–107, `supabaseAdmin` import on line 3 also used by `requireAdmin`
- `C:/Project Test/backend/src/routes/profile.ts` — `authenticateToken` import line 2, `router.use()` line 10
- `C:/Project Test/backend/src/routes/admin.ts` — `authenticateToken` import line 2, `router.use()` line 18
- `C:/Project Test/backend/src/routes/feedback.ts` — `authenticateToken` import line 9, inline use on lines 26, 77, 125; JSDoc references on lines 21, 72, 120
- `C:/Project Test/backend/src/services/sessionService.ts` — stale JSDoc on line 126
- `C:/Project Test/.planning/v1.8-MILESTONE-AUDIT.md` — authoritative tech debt item list
- `C:/Project Test/backend/tsconfig.json` — confirms `strict: true`, `tsc --noEmit` is the correct build check command
- `C:/Project Test/backend/package.json` — confirms `build` script is `tsc && ...`; no custom type-check script exists

### Grep verification

- `grep authenticateToken backend/` — 11 hits across 3 route files + auth.ts itself (alias definition + comment). Zero hits in frontend or scripts.
- `grep requireConnected` (full repo) — hits only in auth.ts (definition) and planning docs/audit. Zero hits in any route or script file. Confirms dead export.

---

## Metadata

**Confidence breakdown:**
- Exact change locations: HIGH — direct line reads from source files
- No runtime impact: HIGH — all changes are import names and a comment; middleware behavior is identical
- Build verification approach: HIGH — TypeScript strict mode + alias removal makes missed callers compile errors
- Scope completeness: HIGH — grep confirms no callers outside the three route files

**Research date:** 2026-03-01
**Valid until:** Stable indefinitely (no moving parts — pure refactor of existing code)
