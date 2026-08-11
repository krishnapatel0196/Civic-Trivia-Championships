---
phase: 44-deprecation-cleanup
plan: 02
subsystem: infra
tags: [typescript, dotenv, supabase, migrations, env-config]

# Dependency graph
requires:
  - phase: 44-deprecation-cleanup (plan 01)
    provides: Clean backend/src tree with all legacy auth code removed; TypeScript compiles clean
provides:
  - backend/src/env.ts with dotenv loading only (no ADMIN_EMAIL validation or export)
  - backend/.env.example with clean template (no JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL)
  - supabase/migrations/20260301000002_drop_legacy_users_table.sql safety guard
  - Verified TypeScript build passes with zero errors post all Phase 44 cleanup
  - Zero stale references confirmed across entire backend/src
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase migration guard pattern: DROP TABLE IF EXISTS with schema-qualified name and CASCADE for safety-only migrations that may never execute"

key-files:
  created:
    - supabase/migrations/20260301000002_drop_legacy_users_table.sql
  modified:
    - backend/src/env.ts
    - backend/.env.example

key-decisions:
  - "SUPABASE_JWT_SECRET in auth.ts matches JWT_SECRET substring in grep — confirmed not a legacy var; active Supabase JWT secret for jose jwtVerify in auth middleware"
  - "Migration is a safety guard only: trivia.users never existed in shared Supabase project (kxsdzaojfaibhuzmclfq); DROP TABLE IF EXISTS is idempotent and harmless"

patterns-established:
  - "env.ts is a side-effect-only import: loads dotenv, exports nothing — all env var access is via process.env at point of use"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 44 Plan 02: Deprecation Cleanup — Env Config and Migration Summary

**env.ts stripped to dotenv-load-only, .env.example rewritten without JWT_SECRET/JWT_REFRESH_SECRET/ADMIN_EMAIL, Supabase migration safety guard created, and full backend sweep confirms zero stale references with clean TypeScript build**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-01T18:39:38Z
- **Completed:** 2026-03-01T18:43:01Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed ADMIN_EMAIL validation block and export from `backend/src/env.ts` — file is now a pure side-effect import that loads dotenv and exports nothing
- Rewrote `backend/.env.example` to reflect current env shape: removed JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL; preserved all Supabase vars, REDIS_URL, EMPOWERED_ACCOUNTS_URL, OPENAI_API_KEY
- Created `supabase/migrations/20260301000002_drop_legacy_users_table.sql` with safe `DROP TABLE IF EXISTS trivia.users CASCADE` guard (legacy table never existed in Supabase project; migration is idempotent)
- Verified TypeScript compiles with zero errors and server starts cleanly (Redis connects, all modules load, port 3000 binds)
- Full stale reference sweep confirmed zero hits across all deleted module patterns, legacy packages, legacy env vars, integer user branches, and deprecated method names

## Task Commits

Each task was committed atomically:

1. **Task 1: Update env config, create migration, clean .env.example** - `c13c330` (chore)
2. **Task 2: Full build verification and stale reference sweep** - `1eeffd7` (chore)

## Files Created/Modified

- `backend/src/env.ts` - Stripped to dotenv loading only; removed ADMIN_EMAIL validation and export (lines 11-17)
- `backend/.env.example` - Rewritten: removed JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL; reorganized with DATABASE_URL comment updated; Supabase block moved up
- `supabase/migrations/20260301000002_drop_legacy_users_table.sql` - New migration: `DROP TABLE IF EXISTS trivia.users CASCADE` with explanatory comments

## Decisions Made

- **SUPABASE_JWT_SECRET substring match:** The stale reference grep pattern `JWT_SECRET` matched `SUPABASE_JWT_SECRET` in `auth.ts`. Confirmed this is active current code (jose `jwtVerify` against Supabase JWT secret) — not a legacy var. The bare `JWT_SECRET` and `JWT_REFRESH_SECRET` vars are absent.
- **Migration as safety guard:** `trivia.users` never existed in the shared Supabase project (kxsdzaojfaibhuzmclfq). The migration exists to formally document that intent and run `IF EXISTS` idempotently during any future schema push. `public.users` (Supabase Auth built-in) is explicitly not touched.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 44 is complete. Both plans executed successfully:
- 44-01: 9 legacy files deleted, 10 packages uninstalled, 7 files surgically cleaned, TypeScript clean
- 44-02: env.ts cleaned, .env.example rewritten, migration created, full sweep confirmed zero stale refs

v1.8 Empowered Identity milestone is complete. All phases 40-44 executed.

Remaining operational note from STATE.md: `EMPOWERED_ACCOUNTS_URL` env var must be set in backend/.env (Render) for gem awards to function at runtime — the code is complete and correct.

---
*Phase: 44-deprecation-cleanup*
*Completed: 2026-03-01*
