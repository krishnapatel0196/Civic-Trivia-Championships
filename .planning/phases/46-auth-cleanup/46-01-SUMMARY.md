---
phase: 46-auth-cleanup
plan: 01
subsystem: auth
tags: [typescript, express, middleware, jwt, supabase]

# Dependency graph
requires:
  - phase: 41-auth-migration
    provides: requireAuth function and backward-compat authenticateToken alias created in 41-01; callers migrated to req.userId in 41-02
  - phase: 44-integer-user-removal
    provides: integer user path fully removed; GameSession.userId is string only
provides:
  - auth.ts has exactly three clean exports (requireAuth, optionalAuth, requireAdmin) with no dead code
  - All route callers use requireAuth directly with no alias indirection
  - sessionService.ts JSDoc accurately describes UUID string userId parameter
affects: [future-auth-phases, onboarding-flows, any-new-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "requireAuth is the canonical import name for protected-route middleware in all route files"
    - "auth.ts exports only what is actively used: requireAuth, optionalAuth, requireAdmin"

key-files:
  created: []
  modified:
    - backend/src/middleware/auth.ts
    - backend/src/routes/profile.ts
    - backend/src/routes/admin.ts
    - backend/src/routes/feedback.ts
    - backend/src/services/sessionService.ts

key-decisions:
  - "authenticateToken alias removed — no backward-compat shim needed, all callers now use requireAuth directly"
  - "requireConnected removed entirely — connect schema tier check is handled at the frontend (AuthInitializer + AdminGuard), not via Express middleware"
  - "supabaseAdmin import retained in auth.ts — still used by requireAdmin for admin_users table lookup"

patterns-established:
  - "auth.ts is the single source of truth for three middleware functions; no aliases, no dead exports"

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 46 Plan 01: Auth Cleanup Summary

**Eliminated backward-compat authenticateToken alias and dead requireConnected export from auth.ts, migrating all three route callers to requireAuth and correcting a stale JSDoc in sessionService.ts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T22:54:16Z
- **Completed:** 2026-03-01T22:57:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Renamed all callers of `authenticateToken` (profile.ts, admin.ts, feedback.ts) to use `requireAuth` directly
- Removed the `export { requireAuth as authenticateToken }` backward-compat alias from auth.ts
- Removed the unused `requireConnected` function and its JSDoc block from auth.ts (dead code since Phase 45)
- Corrected the `@param userId` JSDoc in `sessionService.ts` from "number for authenticated" to "UUID string for authenticated users, or 'anonymous' for unauthenticated"
- TypeScript build passes with zero errors after all removals

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename authenticateToken to requireAuth in all callers and remove dead code from auth.ts** - `fb638ee` (refactor)
2. **Task 2: Final sweep and commit verification** - (verification only, no file changes)

## Files Created/Modified

- `backend/src/middleware/auth.ts` - Removed authenticateToken alias and requireConnected function; now exports exactly requireAuth, optionalAuth, requireAdmin
- `backend/src/routes/profile.ts` - Import and router.use updated to requireAuth
- `backend/src/routes/admin.ts` - Import updated to requireAuth; router.use uses requireAuth, requireAdmin
- `backend/src/routes/feedback.ts` - Import, all three route middleware calls, and all JSDoc Middleware comments updated to requireAuth
- `backend/src/services/sessionService.ts` - @param userId JSDoc corrected to "UUID string for authenticated users, or 'anonymous' for unauthenticated"

## Decisions Made

- authenticateToken alias removed entirely — all callers were in this same plan, so no phased migration needed; clean cut in one commit
- requireConnected removed — the Connected-tier access gate is enforced at the frontend (AuthInitializer fetches tier from accounts API; AdminGuard checks store tier); no Express route uses requireConnected
- supabaseAdmin import retained in auth.ts — requireAdmin still queries admin_users via supabaseAdmin

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 46 Plan 01 complete. auth.ts is clean with three active exports.
- v1.8 Empowered Identity milestone (Phases 40-46) is now complete pending final milestone verification.
- No blockers for next work. Pending todos remain: EMPOWERED_ACCOUNTS_URL in backend/.env, admin audit-address-phone review.

---
*Phase: 46-auth-cleanup*
*Completed: 2026-03-01*
