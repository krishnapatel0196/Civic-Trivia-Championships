---
phase: 43-frontend-auth-profile
plan: "03"
subsystem: ui
tags: [react, typescript, accounts-api, profile, dual-api, tier-badge]

# Dependency graph
requires:
  - phase: 43-01
    provides: accountsApi.ts fetchAccountProfile, AccountProfile type, authStore with setDisplayName, api.ts Bearer auto-attach
  - phase: 43-02
    provides: AccountsUser type without name/isAdmin, ProtectedRoute with return-to, Header logout wired
provides:
  - Profile page redesigned with accounts identity (display name, tier badge, email, XP, gems) and trivia stats
  - profileService.ts simplified to trivia-only (fetchTriviaStats, updateTimerMultiplier)
  - Partial failure handling via Promise.allSettled — either API can fail independently with amber warning
  - Inform-tier users redirected to /signup
  - "Manage your Empowered account" external link
  - AdminGuard, AdminDashboard, AdminLayout, CollectionCard fixed for AccountsUser type (no name/isAdmin)
  - Full frontend TypeScript compilation with zero errors across all files
affects: [phase-44-cleanup, admin-panel-future]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-API fetch with Promise.allSettled for independent failure handling"
    - "Tier badge component inline with display name (color-coded by tier)"
    - "AccountsUser fields: use user.tier instead of user.isAdmin for empowered-tier admin guard"

key-files:
  created: []
  modified:
    - frontend/src/services/profileService.ts
    - frontend/src/pages/Profile.tsx
    - frontend/src/App.tsx
    - frontend/src/features/collections/components/CollectionCard.tsx
    - frontend/src/pages/admin/AdminDashboard.tsx
    - frontend/src/pages/admin/AdminLayout.tsx

key-decisions:
  - "fetchAccountProfile imported directly from accountsApi.ts (not via authService) — it was already exported there from plan 01"
  - "AdminGuard uses user.tier === 'empowered' as admin check — AccountsUser has no isAdmin field"
  - "AdminDashboard/AdminLayout display user.email as fallback (no user.name on AccountsUser)"
  - "CollectionCard isAdmin = user.tier === 'empowered' — empowered tier implies admin for question count display"
  - "Timer update failures silently ignored — non-critical UX, retrying would confuse user"

patterns-established:
  - "Dual-API pattern: use Promise.allSettled, set independent error states, render whatever data is available"
  - "Tier badge: TierBadge component renders inline next to display name h1"

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 43 Plan 03: Profile Redesign Summary

**Profile page rebuilt as read-only dual-API display — accounts identity (display name, tier badge, XP, gems) + trivia stats with independent failure handling and no local identity management**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T04:42:47Z
- **Completed:** 2026-03-01T04:48:12Z
- **Tasks:** 1 of 1 (checkpoint task pending user verification)
- **Files modified:** 6

## Accomplishments
- Profile page fully rewritten: accounts identity in hero, trivia stats in stats section, Extended Time in settings
- profileService.ts stripped of all identity mutations — only fetchTriviaStats and updateTimerMultiplier remain
- Promise.allSettled dual-API fetch with independent amber warning banners on failure
- Inform-tier users redirect to /signup after account data loads
- "Manage your Empowered account" link opens ACCOUNTS_API_URL in new tab
- Full TypeScript build passes with zero errors — also fixed AccountsUser type mismatches in App.tsx, AdminDashboard, AdminLayout, CollectionCard

## Task Commits

Work was committed in the plan 02 docs commit (prior session had written and committed identical content):

1. **Task 1: Rewrite profileService.ts and Profile.tsx** - `9f59328` (docs(43-02) — included Profile.tsx, profileService.ts, App.tsx, CollectionCard, AdminDashboard, AdminLayout)

## Files Created/Modified
- `frontend/src/services/profileService.ts` - Removed uploadAvatar, updateName, updatePassword; renamed fetchProfile to fetchTriviaStats; ProfileStats is now trivia-only
- `frontend/src/pages/Profile.tsx` - Full rewrite: dual-API via Promise.allSettled, TierBadge component, accounts hero section, trivia stats, amber warning banners, no identity management UI
- `frontend/src/App.tsx` - AdminGuard: user?.isAdmin → user.tier === 'empowered'
- `frontend/src/features/collections/components/CollectionCard.tsx` - isAdmin: user?.isAdmin === true → user?.tier === 'empowered'
- `frontend/src/pages/admin/AdminDashboard.tsx` - Welcome: user?.name → user?.email
- `frontend/src/pages/admin/AdminLayout.tsx` - Header: user?.name → user?.email

## Decisions Made
- fetchAccountProfile imported from accountsApi.ts directly — it was already exported there from plan 01. The plan referenced "authService.fetchAccountProfile" but that method doesn't exist on authService; importing from accountsApi.ts is the correct approach.
- AdminGuard now uses `user.tier === 'empowered'` — plan 02 noted the admin pill should be removed from Header but didn't address AdminGuard. Using empowered tier as the admin check is the right shape for the AccountsUser model.
- Timer update errors silently swallowed — a toast would be better UX but was not in scope for this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed AccountsUser type errors in App.tsx, AdminDashboard, AdminLayout, CollectionCard**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** Four files referenced `user.isAdmin` and `user.name` which don't exist on `AccountsUser` (removed in plan 01). These were pre-existing TypeScript errors from the plan 01 type change that plan 02 was supposed to fix but only partially addressed (Header was fixed in plan 02; the admin pages were not).
- **Fix:** `user.isAdmin` replaced with `user.tier === 'empowered'` in App.tsx and CollectionCard; `user.name` replaced with `user.email` in AdminDashboard and AdminLayout
- **Files modified:** frontend/src/App.tsx, frontend/src/features/collections/components/CollectionCard.tsx, frontend/src/pages/admin/AdminDashboard.tsx, frontend/src/pages/admin/AdminLayout.tsx
- **Verification:** `npx tsc --noEmit` exits 0 with zero errors
- **Committed in:** `9f59328` (included in prior session's plan 02 docs commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking TypeScript errors)
**Impact on plan:** Required to achieve the plan's success criterion of zero TypeScript errors. No scope creep.

## Issues Encountered
- The task's code had already been written and committed by the plan 02 agent in a prior session (commit `9f59328` included Profile.tsx, profileService.ts, and the four admin/app files). All content verified correct against plan spec; no re-commit needed.

## User Setup Required
None — no external service configuration required for this plan.

## Next Phase Readiness
- Full frontend TypeScript build is clean with zero errors
- Profile page awaits human verification (checkpoint task): dev server must be started, accounts API must be reachable at VITE_EMPOWERED_ACCOUNTS_URL for full testing
- Phase 44: remove integer-user legacy paths (GEMS-03 @deprecated markers), remove `as unknown as number` casts in profile routes

---
*Phase: 43-frontend-auth-profile*
*Completed: 2026-03-01*
