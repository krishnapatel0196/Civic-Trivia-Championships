---
phase: 43-frontend-auth-profile
plan: "02"
subsystem: auth
tags: [react, react-router, zustand, typescript, accounts-api, auth, return-to]

# Dependency graph
requires:
  - phase: 43-01
    provides: authService.ts with accountsApiFetch, AuthResponse snake_case fields, AccountsUser type, authStore with displayName/tier

provides:
  - Login.tsx using accounts API (access_token/refresh_token snake_case), ev_refresh_token in localStorage, return-to navigation
  - Signup.tsx with name field removed, accounts API signup+auto-login, always navigates to /
  - ProtectedRoute.tsx redirecting unauthenticated users to /login?from=<current path>
  - Header.tsx updated for AccountsUser type (displayName, no user.name/isAdmin), logout wiring preserved

affects:
  - 43-03 (Profile page — can now trust ProtectedRoute return-to; auth context fully wired)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Return-to navigation: useSearchParams reads ?from= in Login, ProtectedRoute passes location.pathname"
    - "Open redirect guard: from param validated to start with / before navigate"
    - "Inform-tier redirect avoidance: Signup always navigates to / regardless of from param"
    - "displayName fallback: displayName || user.email (displayName from authStore, not AccountsUser)"

key-files:
  created: []
  modified:
    - frontend/src/pages/Login.tsx
    - frontend/src/pages/Signup.tsx
    - frontend/src/components/ProtectedRoute.tsx
    - frontend/src/components/layout/Header.tsx

key-decisions:
  - "Signup always navigates to / after registration — Inform-tier users cannot access /profile, from param would cause a redirect loop"
  - "Admin pill removed from Header — user.isAdmin does not exist on AccountsUser; route-level admin checks remain for admin pages"
  - "Open redirect validation: from param must start with / before navigate is called"
  - "displayName || user.email display pattern in Header — displayName comes from authStore (loaded by AuthInitializer from accounts profile), not from AccountsUser which has no name field"

patterns-established:
  - "Return-to pattern: ProtectedRoute encodes pathname into ?from=, Login reads it via useSearchParams and validates before navigating"
  - "Signup passes from param through to login link (/login?from=...) so switching between pages preserves return-to"

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 43 Plan 02: Login/Signup/ProtectedRoute/Header Rewire Summary

**Login and Signup rewired to accounts API with snake_case token fields and return-to navigation; ProtectedRoute passes ?from= on redirect; Header updated to AccountsUser type with displayName and no admin pill**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T04:41:44Z
- **Completed:** 2026-03-01T04:44:51Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Login.tsx now reads `response.access_token`/`response.refresh_token` (snake_case), stores `ev_refresh_token` in localStorage, and navigates to validated `?from=` param or `/` after login
- Signup.tsx has name field/state removed entirely, calls accounts API signup then auto-login, always navigates to `/` (avoiding Inform-tier redirect loops); "Sign in" link preserves `from` param
- ProtectedRoute.tsx passes current `location.pathname` encoded as `?from=` when redirecting unauthenticated users to `/login`
- Header.tsx compiles against AccountsUser type: `displayName || user.email` for display, admin pill removed (no `isAdmin` on AccountsUser), `authService.logout(accessToken)` wiring unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire Login.tsx and Signup.tsx** - `3ddfe6d` (feat)
2. **Task 2: Update ProtectedRoute with return-to redirect** - `c3486d4` (feat)
3. **Task 3: Update Header.tsx for AccountsUser type** - `b31ee0e` (feat)

## Files Created/Modified

- `frontend/src/pages/Login.tsx` - Accounts API response fields, ev_refresh_token storage, return-to navigation
- `frontend/src/pages/Signup.tsx` - Name field removed, accounts API signup+auto-login, always navigates to /
- `frontend/src/components/ProtectedRoute.tsx` - useLocation added, ?from= param included in login redirect
- `frontend/src/components/layout/Header.tsx` - displayName destructured, user.name replaced, admin pill removed

## Decisions Made

- **Signup always navigates to `/`:** Inform-tier users cannot access `/profile`, so using the `from` param would send them to a protected page and immediately redirect back to login — a loop. Navigating unconditionally to `/` avoids this.
- **Admin pill removed:** `AccountsUser` has no `isAdmin` field. Admin access is enforced at the route level (`AdminLayout`). The nav pill was display-only convenience; it can be re-added when an admin role model exists in the accounts system.
- **Open redirect guard in Login:** `from` is validated to start with `/` before calling `navigate(from)`. This prevents an attacker from passing an external URL via `?from=https://evil.com`.
- **`displayName || user.email` in Header:** `displayName` is populated by `AuthInitializer` from the accounts profile API (not from the JWT token / `AccountsUser`). Fallback to `user.email` handles users whose profile hasn't loaded or who haven't set a display name.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The 4 remaining TypeScript errors in the project (`App.tsx`, `CollectionCard.tsx`, `AdminDashboard.tsx`, `AdminLayout.tsx`) all reference `user.isAdmin` or `user.name` in files outside this plan's scope. These are pre-existing issues documented in STATE.md blockers, to be resolved in a subsequent plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Auth pages fully wired to Empowered Accounts API. Return-to navigation works end-to-end.
- Ready for Plan 43-03 (Profile page) — ProtectedRoute passes `?from=` correctly, and Header uses `displayName` which Profile page will populate via `fetchAccountProfile`.
- 4 remaining TS errors in admin/App files (`user.isAdmin`, `user.name`) should be cleaned up if admin pages are still in active use; otherwise defer to Phase 44 cleanup pass.

---
*Phase: 43-frontend-auth-profile*
*Completed: 2026-03-01*
