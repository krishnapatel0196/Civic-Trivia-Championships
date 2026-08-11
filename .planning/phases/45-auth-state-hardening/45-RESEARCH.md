# Phase 45: Auth State Hardening — Research

**Researched:** 2026-03-01
**Domain:** React/Zustand auth store correctness, admin gate synchronization, token-refresh tier recovery
**Confidence:** HIGH

---

## Summary

Phase 45 fixes three distinct auth-state bugs identified in the v1.8 milestone audit, plus writes the missing Phase 43 VERIFICATION.md. All bugs are in the existing codebase — no new dependencies are required. The phase is purely correctness work: no new features, no new UI, no migrations.

The three integration bugs are well-defined and have clear, minimal fixes:
1. **Admin gate split**: `AdminGuard` (frontend) checks `user.tier === 'empowered'`; `requireAdmin` (backend) checks `public.admin_users`. These can diverge silently. The fix is to add a dedicated `isAdmin` field to the auth store, populated from a backend endpoint, and update `AdminGuard` to read it instead of inferring admin status from tier.
2. **Tier lost after token refresh**: `exchangeRefreshToken()` reads tier from Supabase's `user_metadata.tier`, which is not guaranteed to be set. The fallback is `'inform'`, which drops elevated tier silently. The fix is to call `GET /api/account/me` after `AuthInitializer` restores the session to get the authoritative tier.
3. **Profile page does not sync tier**: `Profile.tsx` calls `fetchAccountProfile()` which returns the correct tier, but only calls `authStore.setDisplayName()` — it never writes the tier back to the store. The fix is a one-line addition: call `setAuth` or a new `setTier` action with the authoritative tier after profile load.

There is also one requirement text gap (ADMIN-01 references `public.user_roles`; implementation uses `public.admin_users`) and several small tech-debt items. The Phase 43 VERIFICATION.md requires running goal-backward verification against AUTH-04–07 and PROF-01–04 requirements against the actual committed code.

**Primary recommendation:** Implement the three bug fixes in the order: (1) Profile tier sync — one line, zero risk, fixes the refresh gap too for users who visit Profile; (2) AuthInitializer tier resolution via accounts API call after session restore — closes the root cause for all sessions; (3) AdminGuard sync via dedicated isAdmin field from a backend check. Write Phase 43 VERIFICATION.md first as a baseline that confirms what's already working before making changes.

---

## Standard Stack

No new packages required. All fixes use what is already installed.

### Core (already installed)
| Library | Version | Purpose | Role in Phase 45 |
|---------|---------|---------|------------------|
| `zustand` | ^4.4.7 | State management | Auth store — add `setTier` action or extend `setAuth` |
| React 18 | ^18.2.0 | UI framework | `AuthInitializer.tsx`, `Profile.tsx`, `App.tsx` edits |
| `react-router-dom` | ^6.21.1 | Routing | `AdminGuard` in `App.tsx` |
| Native `fetch` | browser | HTTP | `GET /api/account/me` call in `AuthInitializer` |

### No New Packages Required

The accounts API call (`GET /api/account/me`) is already implemented in `accountsApi.ts` as `fetchAccountProfile()`. The auth store already has `setDisplayName` as a precedent for partial-state updates. The `apiRequest` function auto-attaches Bearer tokens.

**Installation:** None required.

---

## Architecture Patterns

### Current File Map (affected files)

```
frontend/src/
├── App.tsx                         # AdminGuard — fix tier-as-admin-proxy
├── store/
│   └── authStore.ts                # Add setTier action (or extend setAuth)
├── components/
│   └── AuthInitializer.tsx         # Add accounts API call after session restore
├── pages/
│   └── Profile.tsx                 # Add setTier call after fetchAccountProfile
└── services/
    └── accountsApi.ts              # fetchAccountProfile already exported here

.planning/
├── REQUIREMENTS.md                 # Update ADMIN-01 text
├── phases/43-frontend-auth-profile/
│   └── 43-VERIFICATION.md          # CREATE: goal-backward verification
└── phases/45-auth-state-hardening/
    └── 45-VERIFICATION.md          # CREATE: phase 45 verification
```

### Pattern 1: setTier Action on AuthStore

The authStore already has `setDisplayName(name: string)` as a precedent for partial-state updates that don't require a full `setAuth` call. A parallel `setTier(tier: Tier)` action is the correct shape for Profile.tsx and AuthInitializer to write tier without re-authenticating.

**Current store shape (authStore.ts):**
```typescript
// Source: C:/Project Test/frontend/src/store/authStore.ts (direct read)
interface AuthStore {
  accessToken: string | null;
  user: AccountsUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tier: Tier | null;
  displayName: string | null;
  timerMultiplier: number;
  setAuth: (token: string, user: AccountsUser, extras?: { tier?: Tier; displayName?: string }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setTimerMultiplier: (multiplier: number) => void;
  setDisplayName: (name: string) => void;
  // MISSING: setTier action
}
```

**Addition needed:**
```typescript
// Add to AuthStore interface:
setTier: (tier: Tier) => void;

// Add to create() call:
setTier: (tier: Tier) => set({ tier }),
```

Also add `isAdmin: boolean` and `setIsAdmin: (isAdmin: boolean) => void` for the admin gate fix.

### Pattern 2: AuthInitializer — Post-Restore Tier Resolution

**The root cause of "tier lost after token refresh":**

`exchangeRefreshToken()` calls Supabase's native `/auth/v1/token?grant_type=refresh_token`. Supabase returns the user object with `user_metadata`, but `user_metadata.tier` is only populated if the Empowered Accounts platform explicitly wrote it there during signup/tier-change. This is not guaranteed. The current fallback is `'inform'`.

**Current AuthInitializer behavior (direct read):**
```typescript
// Source: C:/Project Test/frontend/src/components/AuthInitializer.tsx
if (data) {
  localStorage.setItem('ev_refresh_token', data.refresh_token);
  setAuth(data.access_token, {
    id: data.user?.id || '',
    email: data.user?.email || '',
    tier: data.user?.tier || 'inform',  // <-- PROBLEM: may be 'inform' wrongly
  });
}
```

**Fix pattern — call fetchAccountProfile after session restore:**
```typescript
// After setAuth, resolve authoritative tier from accounts API
if (data) {
  localStorage.setItem('ev_refresh_token', data.refresh_token);
  // Set auth with potentially-stale tier first (unblocks the UI)
  setAuth(data.access_token, {
    id: data.user?.id || '',
    email: data.user?.email || '',
    tier: data.user?.tier || 'inform',
  });
  // Then resolve correct tier from accounts API (non-blocking for UI)
  try {
    const profile = await fetchAccountProfile(data.access_token);
    useAuthStore.getState().setTier(profile.tier);
    useAuthStore.getState().setDisplayName(profile.display_name);
  } catch {
    // Profile fetch failure is non-fatal — session is still valid
    // User keeps the tier from token metadata (may be stale)
  }
}
```

**Trade-off considered:** Making `AuthInitializer` wait for the profile API call before setting `isLoading: false` would increase startup latency. The pattern above sets auth immediately (unblocks render) and then updates tier asynchronously after the profile call resolves. This means there is a brief window (~100–300ms) where `AdminGuard` could render with the wrong tier. The correct mitigation is for `AdminGuard` to also check `isAdmin` (from `admin_users`) rather than relying on tier alone — which is the admin gate fix below.

**Alternative considered:** Always pass tier through Supabase `user_metadata`. This would require the Empowered Accounts platform to write tier into Supabase `user_metadata` on every tier change. This is an external dependency beyond this phase's control. Do not rely on it.

### Pattern 3: Profile.tsx — Tier Sync After fetchAccountProfile

**Current Profile.tsx behavior (direct read):**
```typescript
// Source: C:/Project Test/frontend/src/pages/Profile.tsx lines 56-68
if (accountResult.status === 'fulfilled') {
  const profile = accountResult.value;
  setAccountData(profile);
  useAuthStore.getState().setDisplayName(profile.display_name);  // <-- sets displayName
  // MISSING: setTier(profile.tier) call here
}
```

**Fix — one additional line:**
```typescript
if (accountResult.status === 'fulfilled') {
  const profile = accountResult.value;
  setAccountData(profile);
  useAuthStore.getState().setDisplayName(profile.display_name);
  useAuthStore.getState().setTier(profile.tier);  // ADD THIS
}
```

This is the lowest-risk fix and handles the case where a user visits Profile after a page reload. Combined with the AuthInitializer fix, tier is correctly resolved at both startup and profile page load.

### Pattern 4: Admin Gate — Authoritative isAdmin Check

**Current problem (from audit):**
- Frontend `AdminGuard` in `App.tsx` line 29: `if (!user || user.tier !== 'empowered') return <Forbidden />;`
- Backend `requireAdmin` in `auth.ts` lines 114-135: queries `public.admin_users` table

These are two independent unsynchronized checks. Failure modes:
- Admin with tier `'connected'` (tier-admin split): passes backend, blocked by frontend → locked out of UI
- Empowered user not in `admin_users`: frontend passes, backend sends 403 → confusing failures on every admin API call
- After page reload: tier reverts to `'inform'` (refresh bug) → admin locked out even if they were empowered

**Fix strategy — add `isAdmin` field to auth store, populate from backend:**

Option A (RECOMMENDED): Add a `/api/admin/me` endpoint (or repurpose an existing health check) that returns `{ isAdmin: boolean }`. `AdminGuard` calls this on mount and caches the result in `isAdmin` store field.

Option B: `AdminGuard` reads `isAdmin` from the accounts API profile (`fetchAccountProfile` — the `AccountProfile` type does not currently expose admin status, so this would require a new field from the accounts platform).

Option C: Keep tier-as-proxy for UI, but also check backend on each admin page render. If the first backend call returns 403, redirect to Forbidden. This handles the case without adding a new endpoint.

**Recommendation: Option C for this phase** (minimal change, no new endpoint required).

The audit-identified risk is that an empowered user NOT in `admin_users` sees the admin UI but gets 403 from every action — confusing. Option C catches this on first action. For the reverse case (admin with non-empowered tier), the AuthInitializer fix (Pattern 2) resolves tier correctly, so `AdminGuard` using tier will work correctly after that fix.

If the accounts platform never issues empowered-tier to non-admins (i.e., empowered = admin by definition in this system), then fixing the tier refresh bug (Pattern 2) effectively fixes the admin gate too. This should be verified.

**Minimum safe fix for admin gate:**
1. Fix tier loss after refresh (Pattern 2) — eliminates the "admin locked out after page reload" case
2. Add a store field `isAdmin: boolean | null` (null = unknown, false = not admin, true = admin)
3. `AdminGuard` checks both `user.tier === 'empowered'` AND `isAdmin !== false` (allows null = loading state)
4. A lazy admin status check happens via the first 403 response from the backend

### Pattern 5: Phase 43 VERIFICATION.md Structure

The Phase 43 VERIFICATION.md must follow the same structure as Phase 41 and Phase 44 verification reports (direct read of those files).

**Required structure:**
```markdown
---
phase: 43-frontend-auth-profile
verified: [timestamp]
status: passed | gaps_found | failed
score: X/8 must-haves verified
---

# Phase 43: Frontend Auth & Profile — Verification Report

## Goal Achievement (Observable Truths)
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
...

## Required Artifacts
...

## Key Link Verification
...

## Build Check
...

## Requirements Coverage (AUTH-04–07, PROF-01–04)
...

## Anti-Patterns Found
...
```

**Truths to verify for Phase 43 (AUTH-04–07, PROF-01–04):**

| # | Requirement | Observable Truth |
|---|-------------|-----------------|
| 1 | AUTH-04 | Login page calls `POST /api/auth/login` on the accounts API and stores `access_token` in Zustand + `refresh_token` in localStorage |
| 2 | AUTH-05 | Signup page calls `POST /api/auth/signup` on the accounts API (no name field); then auto-calls login |
| 3 | AUTH-06 | Logout calls accounts API `POST /api/auth/logout` with Bearer token |
| 4 | AUTH-07 | `exchangeRefreshToken()` calls Supabase `/auth/v1/token?grant_type=refresh_token`; `AuthInitializer` calls it on startup |
| 5 | PROF-01 | Profile page fetches and displays trivia stats: games played, best score, accuracy |
| 6 | PROF-02 | Profile page fetches gem balance and tier badge from `fetchAccountProfile` (`GET /api/account/me`) |
| 7 | PROF-03 | Display name from `AccountProfile.display_name` shown in profile hero |
| 8 | PROF-04 | "Manage your Empowered account" links out; no identity management UI in trivia |

All 8 are structurally verifiable from code (direct file read) — no live environment needed.

### Anti-Patterns to Avoid

- **Do not make `setTier` update `user.tier` in `AccountsUser`:** `tier` is a separate top-level field in the store (`tier: Tier | null`). Update the store's `tier` field, not the nested `user.tier`. This keeps the fix minimal and avoids deep object mutations.
- **Do not block UI render waiting for the profile API call in `AuthInitializer`:** The session is valid after `exchangeRefreshToken()` succeeds. Setting auth immediately and updating tier asynchronously avoids adding startup latency for all returning users.
- **Do not remove the `user.tier` field from `AccountsUser`:** The `setAuth` call uses `user.tier` as the initial tier value. It is a reasonable default from the login response. The store's `tier` field overrides it when the authoritative API is consulted.
- **Do not call `fetchAccountProfile` with an empty-string fallback:** The existing bug `accessToken ?? ''` in `Profile.tsx` sends a malformed Authorization header. The `AuthInitializer` fix only calls `fetchAccountProfile` when `data.access_token` is a real token — no empty-string risk in that path.
- **Do not change the AdminGuard rendering path for `isLoading` state:** Current `AdminGuard` returns `null` while loading. This is correct — changing it risks flash of unauthorized content.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authoritative tier resolution | Custom tier-polling mechanism | Single `fetchAccountProfile` call in `AuthInitializer` after restore | `fetchAccountProfile` already exists in `accountsApi.ts`; one API call gets all needed data |
| Admin status check | Custom `/api/admin/status` endpoint | Use existing 403 response from any admin API call as the signal | Backend `requireAdmin` already returns 403; no new endpoint needed for MVP |
| Token freshness detection | Client-side JWT decode + expiry timer | Existing `401 → exchangeRefreshToken → retry` pattern in `api.ts` | Already implemented correctly; adding expiry timer duplicates concerns |
| Cross-tab auth sync | `BroadcastChannel` + `storage` event listeners | None for this phase | Out of scope; single-tab is sufficient |

**Key insight:** The entire tier-sync problem is solved by calling `fetchAccountProfile` in the right places. The function already exists, is already typed, and returns exactly the data needed. No new infrastructure required.

---

## Common Pitfalls

### Pitfall 1: Tier Update Race Condition in AuthInitializer

**What goes wrong:** `AuthInitializer` sets auth with stale tier `'inform'`, then immediately navigates to `/admin`. `AdminGuard` checks tier before the `fetchAccountProfile` call resolves — sees `'inform'`, renders `<Forbidden />`. Profile fetch completes with `'empowered'`, updates the store, but the user is already on Forbidden.

**Why it happens:** React's render cycle is faster than the network round trip to the accounts API.

**How to avoid:** `AdminGuard` must continue using tier as its primary check but should NOT redirect to Forbidden based on a stale `isLoading: false` + `tier: 'inform'` state from a refresh. One approach: add a `tierResolved: boolean` flag to the store that is `false` until `fetchAccountProfile` completes in `AuthInitializer`. `AdminGuard` returns `null` (spinner) while `!tierResolved`. Set `tierResolved: true` both on success and on error (error = tier stays at whatever it was, user must navigate to Profile to fix it).

**Warning signs:** Admins are randomly shown Forbidden page on reload but are fine after clicking somewhere and back.

### Pitfall 2: fetchAccountProfile Called with Empty-String Token

**What goes wrong:** `Profile.tsx` currently passes `accessToken ?? ''` to `fetchAccountProfile`. If `accessToken` is null (user somehow reaches Profile unauthenticated), an empty-string Bearer token is sent — most APIs return 401, but some may return 400 or unexpected errors.

**Why it happens:** `ProtectedRoute` should prevent unauthenticated access to Profile, but if `AuthInitializer` is still loading (race), `ProtectedRoute` returns null and doesn't redirect.

**How to avoid:** Guard the `fetchAccountProfile` call: `if (!accessToken) { navigate('/login'); return; }`. Or use non-null assertion since `ProtectedRoute` guarantees authentication.

**Warning signs:** `accountError` state set to "Couldn't load account info" for users who ARE logged in.

### Pitfall 3: REQUIREMENTS.md ADMIN-01 Update Creates Confusion

**What goes wrong:** ADMIN-01 says `public.user_roles` but implementation uses `public.admin_users`. If the requirements doc is updated to say `admin_users`, then anyone reading the history will see a changed requirement — they may think the table was renamed when it was always `admin_users`.

**Why it happens:** The requirement was written before the Empowered Accounts platform finalized its schema naming. The implementation used the correct table name.

**How to avoid:** Update ADMIN-01 requirement text to reflect the actual implementation (`public.admin_users`). Add a note that this was the correct schema name from the platform; the requirement text was written speculatively. This is a documentation fix, not a functional change.

**Warning signs:** None — purely documentation.

### Pitfall 4: stale JSDoc in sessionService.ts

**What goes wrong:** `backend/src/services/sessionService.ts` line 126 has a JSDoc comment that says "number for authenticated" when `userId` is typed as `string`. Future developers may read the comment and write integer-assumption code.

**Why it happens:** The comment was written when `userId` was a number. The type was updated but the comment was not.

**How to avoid:** Update the JSDoc to say "string UUID for authenticated". This is a one-line fix.

**Warning signs:** None — the type is correct; only the documentation misleads.

### Pitfall 5: authenticateToken Alias Still in Use

**What goes wrong:** `backend/src/routes/admin.ts`, `profile.ts`, and `feedback.ts` import `authenticateToken` (the backward-compat alias for `requireAuth`). The alias was added in Phase 41 with the comment "until Plan 02 migrates them to requireAuth." Phase 44 cleanup didn't migrate these callers.

**Why it happens:** The alias works correctly; it was just not cleaned up.

**How to avoid:** Phase 45 should migrate these three files to import `requireAuth` directly. Remove the `authenticateToken` export from `auth.ts`. This is low-risk and removes dead code.

---

## Code Examples

### setTier and isAdmin Actions on AuthStore

```typescript
// Source: C:/Project Test/frontend/src/store/authStore.ts (current, extended)
interface AuthStore {
  // ... existing fields ...
  tier: Tier | null;
  isAdmin: boolean | null;  // null = unknown (not yet checked), false = not admin, true = admin
  tierResolved: boolean;    // false until fetchAccountProfile has completed once

  // ... existing actions ...
  setTier: (tier: Tier) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setTierResolved: (resolved: boolean) => void;
}

// In create():
isAdmin: null,
tierResolved: false,

setTier: (tier: Tier) => set({ tier }),
setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
setTierResolved: (resolved: boolean) => set({ tierResolved: resolved }),

// clearAuth should reset all three:
clearAuth: () => {
  localStorage.removeItem('ev_refresh_token');
  set({
    // ... existing resets ...
    tier: null,
    isAdmin: null,
    tierResolved: false,
  });
},
```

### AuthInitializer — Post-Restore Tier Resolution

```typescript
// Source: C:/Project Test/frontend/src/components/AuthInitializer.tsx (pattern to follow)
import { fetchAccountProfile } from '../services/accountsApi';

// Inside initializeAuth(), after session restore:
if (data) {
  localStorage.setItem('ev_refresh_token', data.refresh_token);
  setAuth(data.access_token, {
    id: data.user?.id || '',
    email: data.user?.email || '',
    tier: data.user?.tier || 'inform',
  });
  // Resolve authoritative tier from accounts API (non-blocking for UI)
  try {
    const profile = await fetchAccountProfile(data.access_token);
    useAuthStore.getState().setTier(profile.tier);
    useAuthStore.getState().setDisplayName(profile.display_name);
  } catch {
    // Non-fatal: session is valid, tier stays at whatever token metadata said
  } finally {
    useAuthStore.getState().setTierResolved(true);
  }
} else {
  clearAuth();
  useAuthStore.getState().setTierResolved(true); // no session = resolved (tier is null)
}
```

### Profile.tsx — Add setTier Call

```typescript
// Source: C:/Project Test/frontend/src/pages/Profile.tsx lines 56-68 (current pattern)
// After this existing line:
useAuthStore.getState().setDisplayName(profile.display_name);
// Add:
useAuthStore.getState().setTier(profile.tier);
```

### AdminGuard — Respect tierResolved

```typescript
// Source: C:/Project Test/frontend/src/App.tsx AdminGuard (current pattern, extended)
function AdminGuard() {
  const { isAuthenticated, user, isLoading, tierResolved, tier } = useAuthStore();

  if (isLoading || !tierResolved) return null; // wait for tier to resolve
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || tier !== 'empowered') return <Forbidden />;

  return <Outlet />;
}
```

### Profile.tsx — Guard Empty Token

```typescript
// Source: C:/Project Test/frontend/src/pages/Profile.tsx lines 44-47 (current pattern)
// REPLACE:
fetchAccountProfile(accessToken ?? ''),
// WITH:
...(accessToken ? [fetchAccountProfile(accessToken)] : [Promise.reject(new Error('No token'))]),
// OR more readably, guard at the top of load():
if (!accessToken) {
  navigate('/login?from=/profile', { replace: true });
  return;
}
```

### REQUIREMENTS.md ADMIN-01 Update

```markdown
<!-- BEFORE: -->
- [ ] **ADMIN-01**: `requireAdmin` middleware checks `public.user_roles` table via service role client (not `is_admin` boolean)

<!-- AFTER: -->
- [ ] **ADMIN-01**: `requireAdmin` middleware checks `public.admin_users` table via service role client (not `is_admin` boolean)
<!-- Note: requirement was originally drafted referencing `public.user_roles`; implementation correctly used `public.admin_users` which is the actual Empowered Accounts platform schema -->
```

---

## State of the Art

| Old Approach | Current Approach | Gap | Fix in Phase 45 |
|--------------|------------------|-----|----------------|
| Tier from Supabase user_metadata on refresh | Tier from `user_metadata.tier` (may be absent, defaults to `'inform'`) | Tier loss after page reload | Call `fetchAccountProfile` in `AuthInitializer` after restore |
| Admin check: `user.tier === 'empowered'` | Same (no change since Phase 43) | Gate mismatch with backend `admin_users` check | Add `tierResolved` + fix tier-after-refresh |
| Profile page tier update | `setDisplayName` called but not `setTier` | Store holds stale tier even after Profile loads correct one | Add `setTier` call in Profile.tsx |
| Phase 43 verification | No VERIFICATION.md | Phase considered "unverified" in audit | Write 43-VERIFICATION.md with goal-backward check |

**Tech debt being closed in this phase:**
- `accessToken ?? ''` in Profile.tsx: replace with proper null guard
- Stale JSDoc in sessionService.ts line 126: update comment to match actual string type
- `authenticateToken` alias still in 3 route files: migrate to `requireAuth` directly
- ADMIN-01 requirement text: update to `admin_users`

---

## Open Questions

1. **Does the Empowered Accounts platform guarantee `empowered` tier == admin user in `admin_users`?**
   - What we know: Backend `requireAdmin` queries `admin_users` by UUID. Frontend `AdminGuard` uses `tier === 'empowered'`. The audit flags these as unsynchronized.
   - What's unclear: Is it actually possible in production for an empowered-tier user to NOT be in `admin_users`? If not, fixing the tier refresh bug effectively fixes the admin gate.
   - Recommendation: Treat them as potentially divergent (defensive approach). Fix the tier refresh bug (Pattern 2) which covers the "admin locked out after reload" case. The admin-gate-mismatch risk is structural but low-probability in practice. Document the divergence risk rather than fully solving it (full solve requires new backend endpoint or accounts API admin field).

2. **Should `fetchAccountProfile` in AuthInitializer increase `isLoading` duration?**
   - What we know: Current `setLoading(false)` is called after `setAuth`. If we add `fetchAccountProfile` before `setLoading(false)`, startup time increases by one accounts API round trip (~100-500ms).
   - What's unclear: Is this acceptable UX? Currently only returning users see the loading spinner.
   - Recommendation: Add `fetchAccountProfile` BEFORE `setLoading(false)` for correctness (no flash of wrong tier). The spinner already exists for returning users. Document the latency trade-off in the plan.

3. **`requireConnected` middleware is exported but has no consumers (audit finding):**
   - What we know: `requireConnected` is in `auth.ts` but no route uses it directly — gem/stats guards use `checkAccountContext` from the game route instead.
   - What's unclear: Is this intentional? Should it be removed or is it reserved for future use?
   - Recommendation: Out of scope for Phase 45. Document as known dead code. Do not remove without understanding if any planned routes will use it.

---

## Sources

### Primary (HIGH confidence)

Direct code reads from committed codebase:
- `C:/Project Test/frontend/src/components/AuthInitializer.tsx` — current startup behavior, `exchangeRefreshToken` call site
- `C:/Project Test/frontend/src/services/accountsApi.ts` — `exchangeRefreshToken` implementation, Supabase native refresh, user_metadata.tier read, `fetchAccountProfile` export
- `C:/Project Test/frontend/src/store/authStore.ts` — current store shape, `setDisplayName` precedent, missing `setTier`
- `C:/Project Test/frontend/src/pages/Profile.tsx` — `fetchAccountProfile` call, `setDisplayName` but not `setTier`, `accessToken ?? ''` bug
- `C:/Project Test/frontend/src/App.tsx` — `AdminGuard` using `user.tier === 'empowered'`
- `C:/Project Test/backend/src/middleware/auth.ts` — `requireAdmin` queries `public.admin_users`
- `C:/Project Test/.planning/v1.8-MILESTONE-AUDIT.md` — authoritative gap descriptions
- `C:/Project Test/.planning/phases/41-auth-tier-integration/41-VERIFICATION.md` — verification format reference
- `C:/Project Test/.planning/phases/44-deprecation-cleanup/44-VERIFICATION.md` — verification format reference
- `C:/Project Test/.planning/phases/43-frontend-auth-profile/43-01-SUMMARY.md` — decision to use Supabase native refresh
- `C:/Project Test/.planning/phases/43-frontend-auth-profile/43-02-SUMMARY.md` — auth page wiring confirmed
- `C:/Project Test/.planning/phases/43-frontend-auth-profile/43-03-SUMMARY.md` — Profile.tsx decisions confirmed
- `C:/Project Test/.planning/REQUIREMENTS.md` — AUTH-04–07, PROF-01–04, ADMIN-01 requirement text

### Secondary (MEDIUM confidence)

- `C:/Project Test/.planning/phases/43-frontend-auth-profile/43-RESEARCH.md` — Phase 43 research (pitfall reference, pattern reference)

### Tertiary (LOW confidence)

- None — all findings are from direct codebase inspection, not WebSearch

---

## Metadata

**Confidence breakdown:**
- Bug analysis (3 integration gaps): HIGH — bugs identified by direct code read, root causes confirmed
- Fix patterns: HIGH — minimal changes following existing codebase patterns (setDisplayName precedent, fetchAccountProfile already exists)
- Phase 43 verification truths: HIGH — all verifiable by file inspection, no live environment needed
- Admin gate long-term fix: MEDIUM — strategy is sound, but optimal solution depends on whether tier==admin is guaranteed by the accounts platform (unanswered)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain; no fast-moving dependencies)
