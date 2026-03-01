---
phase: 41-auth-tier-integration
plan: "01"
name: "Install Packages and Replace Auth Middleware"
subsystem: authentication
tags: [jose, supabase, jwt, middleware, auth-tier]
one-liner: "Replaced tokenUtils JWT auth with jose jwtVerify against Supabase JWT secret; added requireConnected and requireAdmin guards"

dependency-graph:
  requires:
    - "40-03: database.types.ts generated (admin_users table type)"
  provides:
    - "requireAuth: Supabase JWT verification middleware"
    - "authenticateToken: backward-compat alias for requireAuth"
    - "optionalAuth: anonymous-friendly auth middleware"
    - "requireConnected: Connected tier guard via connect.connected_profiles"
    - "requireAdmin: Admin guard via public.admin_users"
    - "supabaseAdmin: typed singleton client for server-side Supabase operations"
  affects:
    - "41-02: caller migration (req.user.userId → req.userId) depends on this middleware API"
    - "41-03 onward: gem award, stats, profile routes all use requireAuth/requireConnected"

tech-stack:
  added:
    - jose: "^6.1.3 — jwtVerify for Supabase JWT validation"
    - "@supabase/supabase-js": "^2.98.0 — admin client for tier/admin DB queries"
  patterns:
    - "Module-level singleton client (supabaseAdmin) — not per-request"
    - "Module-level TextEncoder secret key — encoded once, reused per request"
    - "Schema cast pattern: (supabaseAdmin as any).schema('connect') for non-typed schemas"
    - "Export alias bridge: authenticateToken = requireAuth for backward compat"

key-files:
  created:
    - path: "backend/src/config/supabase.ts"
      description: "supabaseAdmin singleton — createClient with Database type, persistSession: false"
  modified:
    - path: "backend/src/middleware/auth.ts"
      description: "Fully replaced — removed tokenUtils, added requireAuth/optionalAuth/requireConnected/requireAdmin"
    - path: "backend/.env.example"
      description: "Added SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET"
    - path: "backend/package.json"
      description: "Added jose and @supabase/supabase-js to dependencies"

decisions:
  - id: "41-01-A"
    decision: "authenticateToken exported as alias for requireAuth (not removed)"
    rationale: "Multiple caller files still import authenticateToken — removing would break compilation. Plan 02 migrates all callers then removes the alias."
    alternatives: ["Remove immediately (breaks callers)", "Rename in callers now (scope creep for Plan 01)"]
  - id: "41-01-B"
    decision: "requireAdmin uses admin_users table (not user_roles join)"
    rationale: "admin_users is correctly typed in database.types.ts; user_roles join would require untyped schema access or schema cast"
    alternatives: ["user_roles join (complex, untyped)", "admin_users boolean column (not in schema)"]
  - id: "41-01-C"
    decision: "connect schema accessed via (supabaseAdmin as any).schema('connect')"
    rationale: "connect schema is not included in database.types.ts — TypeScript type system has no knowledge of it. Cast to any is the documented workaround."
    alternatives: ["Add connect schema to types generation (requires schema exposure)", "Separate untyped client for connect schema"]

metrics:
  duration: "~4 minutes"
  completed: "2026-02-28"
  tasks-completed: 2
  tasks-total: 2
  commits: 2
---

# Phase 41 Plan 01: Install Packages and Replace Auth Middleware Summary

**One-liner:** Replaced tokenUtils JWT auth with jose jwtVerify against Supabase JWT secret; added requireConnected and requireAdmin guards.

## What Was Built

Phase 41 Plan 01 establishes the authentication foundation for the Supabase/Empowered Identity migration. The entire `auth.ts` middleware module was replaced — removing all references to `tokenUtils`, `isTokenBlacklisted`, `verifyAccessToken`, and the old `req.user: TokenPayload` pattern — and replaced with four production-ready middleware functions backed by the Supabase service role client.

Two new packages were installed (`jose` for JWT verification, `@supabase/supabase-js` for the admin client) and a module-level singleton client was created in `backend/src/config/supabase.ts`.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install packages and create Supabase admin client | ef05fee | package.json, backend/src/config/supabase.ts, .env.example |
| 2 | Replace auth.ts middleware entirely | 9c74b21 | backend/src/middleware/auth.ts |

## Middleware API Surface

After this plan, `backend/src/middleware/auth.ts` exports:

| Export | Type | Purpose |
|--------|------|---------|
| `requireAuth` | async middleware | Validates Supabase JWT; sets `req.userId` + `req.accessToken`; 401 on failure |
| `authenticateToken` | alias → requireAuth | Backward compat for existing callers; removed in Plan 02 |
| `optionalAuth` | async middleware | Same verification but continues as anonymous on missing/invalid token |
| `requireConnected` | async middleware | Queries `connect.connected_profiles` for `verification_status = 'verified'`; 403 if not |
| `requireAdmin` | async middleware | Queries `public.admin_users` for UUID; 401 if unauthed, 403 if not admin |

Express `Request` type now declares:
- `req.userId?: string` — UUID from Supabase JWT `sub` claim
- `req.accessToken?: string` — raw JWT for downstream use
- `req.user` no longer declared (removed)

## Decisions Made

**41-01-A: authenticateToken alias preserved**
Existing callers still import `authenticateToken`. Removing it immediately would break TypeScript compilation in 6+ files. The alias is a temporary bridge — Plan 02 will migrate all callers and remove it.

**41-01-B: admin_users table for admin check**
The `admin_users` table is correctly typed in `database.types.ts`. A `user_roles` join would require schema casts or untyped access. Simple UUID lookup in a typed table is more maintainable.

**41-01-C: `(supabaseAdmin as any).schema('connect')` cast**
The `connect` schema (Empowered Accounts platform) is not included in the TypeScript types generated for this project. The `as any` cast is the documented pattern for accessing non-typed schemas via supabase-js.

## Verification Results

All plan verification checks passed:
- `grep -r "from 'jose'"` — found in auth.ts
- `grep -r "supabaseAdmin"` — found in config/supabase.ts (export) and auth.ts (import + use)
- `grep "SUPABASE" .env.example` — all 4 vars present
- `grep -c "tokenUtils" auth.ts` — 0 (no old imports remain)
- `npx tsc --noEmit` — 0 errors originating from auth.ts itself; all remaining errors are in caller files (rateLimiter.ts, feedback.ts, game.ts, profile.ts) that reference `req.user` — expected, to be fixed in Plan 02

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

Plan 02 can start immediately. It needs to migrate all caller files from `req.user.userId` to `req.userId`:
- `backend/src/middleware/rateLimiter.ts`
- `backend/src/routes/feedback.ts`
- `backend/src/routes/game.ts`
- `backend/src/routes/profile.ts`

And any other files that import `authenticateToken` by name (to be updated to import `requireAuth` instead).
