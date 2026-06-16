---
phase: 45-auth-state-hardening
plan: 01
subsystem: auth
tags: [zustand, react, auth, tier, admin-guard, accounts-api]

# Dependency graph
requires:
  - phase: 43-auth-integration
    provides: authStore, AuthInitializer, AccountsUser, fetchAccountProfile
  - phase: 43-frontend-wiring
    provides: AdminGuard using user.tier, Profile.tsx with fetchAccountProfile
provides:
  - tierResolved flag in authStore (default false, set true after API resolution in all paths)
  - setTier action for authoritative tier updates
  - AuthInitializer resolves tier from accounts API after token restore
  - AdminGuard race condition fix (waits for tierResolved before rendering)
  - Profile.tsx tier sync to store and accessToken null guard
affects: [46-gap-closure, future admin route work, tier-gating features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tierResolved gate pattern: store flag defaults false, set true in all init exit paths, guards rendered before resolution"
    - "Authoritative tier resolution: JWT metadata is provisional, accounts API is canonical"
    - "setLoading(false) deferred until after fetchAccountProfile to prevent AdminGuard flash"

key-files:
  created: []
  modified:
    - frontend/src/store/authStore.ts
    - frontend/src/components/AuthInitializer.tsx
    - frontend/src/App.tsx
    - frontend/src/pages/Profile.tsx

key-decisions:
  - "tierResolved defaults to false and is set to true in all 4 AuthInitializer exit paths (success, profile-fetch-failure, no-session, no-refresh-token)"
  - "setLoading(false) moved into per-branch finally blocks — prevents AdminGuard from briefly seeing stale JWT-metadata tier before the accounts API call completes"
  - "AdminGuard uses store-level tier field (not user.tier) for empowered check — user.tier is stale JWT metadata after token refresh"
  - "Profile.tsx accessToken null guard redirects to /login?from=/profile rather than passing empty string to Bearer header"
  - "fetchAccountProfile failure in AuthInitializer is silently swallowed — session remains valid, tier stays at JWT metadata fallback"

patterns-established:
  - "Store flag pattern: boolean flag (tierResolved) guards renders that depend on async resolution"
  - "All-path resolution: any init function that sets a resolved flag must set it in every code path (return, success, failure, catch)"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 45 Plan 01: Auth State Hardening Summary

**tierResolved flag added to authStore, AdminGuard race condition fixed, and Profile.tsx tier sync + null guard implemented — eliminating tier loss after page reload for admin users**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-01T21:59:16Z
- **Completed:** 2026-03-01T22:02:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `tierResolved` flag, `setTier`, and `setTierResolved` actions to authStore — tier resolution is now trackable
- AuthInitializer calls `fetchAccountProfile` after token restore so the authoritative tier from the accounts API overwrites the provisional JWT-metadata tier; `setLoading(false)` deferred until resolution completes to prevent AdminGuard flash
- AdminGuard now waits for `tierResolved` before rendering (`isLoading || !tierResolved`), and checks `tier` from the store (not `user.tier`) for the empowered gate
- Profile.tsx calls `setTier(profile.tier)` after `fetchAccountProfile` succeeds, and replaces `accessToken ?? ''` with an early-return redirect to `/login?from=/profile` when token is null

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tierResolved flag to authStore and wire AuthInitializer + AdminGuard** - `8246b42` (fix)
2. **Task 2: Fix Profile.tsx tier sync and accessToken null guard** - `4e151b9` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/store/authStore.ts` - Added `tierResolved: boolean`, `setTier`, `setTierResolved`; `clearAuth` resets `tierResolved: false`
- `frontend/src/components/AuthInitializer.tsx` - Added `fetchAccountProfile` call post-restore; `setTierResolved(true)` in all 4 exit paths; `setLoading(false)` moved into per-branch finally
- `frontend/src/App.tsx` - AdminGuard destructures `tier` and `tierResolved`; guards with `isLoading || !tierResolved`; checks `tier !== 'empowered'` (store-level, not `user.tier`)
- `frontend/src/pages/Profile.tsx` - Adds `setTier(profile.tier)` after `setDisplayName`; replaces `accessToken ?? ''` with early-return null guard

## Decisions Made
- `tierResolved` defaults to `false` and is set to `true` in all 4 `AuthInitializer` exit paths: success (after `fetchAccountProfile` finally), profile-fetch-failure (same finally), no-session (else branch), no-refresh-token (early return)
- `setLoading(false)` moved into per-branch finally blocks — AdminGuard never briefly sees stale JWT-metadata tier before the API call resolves
- AdminGuard uses store-level `tier` field (not `user.tier`) — `user.tier` is stale JWT metadata after Supabase token refresh which does not populate `user_metadata.tier` reliably
- Profile.tsx null guard redirects to `/login?from=/profile` — defense-in-depth since ProtectedRoute should prevent unauthenticated access, but the empty-string Bearer header was a real bug
- `fetchAccountProfile` failure in AuthInitializer is silently swallowed — the session is valid, the tier stays at the JWT metadata fallback, and the user can still use the app

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All four auth-state bugs from the v1.8 milestone audit are resolved
- Admin users who reload the page will reach `/admin/*` routes correctly after `tierResolved=true` fires
- `authStore.tier` is always authoritative after startup completes
- Phase 46 (gap closure) can proceed — no blockers from auth state hardening

---
*Phase: 45-auth-state-hardening*
*Completed: 2026-03-01*
