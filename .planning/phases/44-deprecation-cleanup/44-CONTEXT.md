# Phase 44: Deprecation & Cleanup - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all legacy local auth infrastructure from the trivia backend: bcrypt dependency, JWT utilities, auth routes, User model, local users table, Redis token blacklist, and stale env vars. Leave the codebase clean with only Supabase-based auth remaining. No new capabilities — this phase is purely subtractive.

</domain>

<decisions>
## Implementation Decisions

### Auth routes removal
- `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh` must all return 404 after removal
- No redirect or tombstone messages required — these are internal API routes, not user-facing URLs

### File deletions
- Delete entirely (no archiving): `tokenUtils.ts`, `jwt.ts`, `authController.ts`, `User.ts`
- `bcrypt` removed from `package.json` and `node_modules`
- Any test files or seeds referencing these files updated or removed

### Database
- Local `users` table dropped via migration
- No active queries may reference it post-drop
- GEMS-03 markers in progression code: integer-user path (`updateUserProgression`, `User.updateStats`, `total_gems` column reads) removed — these were flagged with `@deprecated` in Phase 42-03

### Environment variables
- Remove from `.env.example` and all validation logic: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`
- `.env.example` must list: `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `EMPOWERED_ACCOUNTS_URL`

### Redis blacklist
- Redis token blacklist code path fully removed
- Redis itself may remain (used for sessions) — only the blacklist logic goes

### Claude's Discretion
- Order of deletions within each plan
- Whether to remove stale test files in one pass or alongside their source files
- Exact migration name and SQL for users table drop

</decisions>

<specifics>
## Specific Ideas

- GEMS-03 `@deprecated` JSDoc markers were placed in Phase 42-03 specifically to surface these removal targets in IDE hover text — use them as a checklist for the integer-user path cleanup
- Phase 43 is live: login, profile, collections all working via Supabase auth — safe to hard-delete legacy paths with no grace period needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-deprecation-cleanup*
*Context gathered: 2026-03-01*
