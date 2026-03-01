# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 41 — Auth & Tier Integration (v1.8 Empowered Identity)

## Current Position

Phase: 41 of 44 in v1.8 (Auth & Tier Integration) — In progress
Plan: 1 of ? complete in Phase 41 (41-01 done)
Status: In progress
Last activity: 2026-02-28 — Completed 41-01-PLAN.md — packages installed, supabaseAdmin singleton created, auth.ts replaced with 4 Supabase JWT middleware functions

Progress: [████████░░] v1.0–v1.7 complete (109 plans); v1.8 plans 4/15 complete (40-01, 40-02, 40-03, 41-01)

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete
- v1.8 (Phases 40–44): In progress — Phase 40 complete, Phase 41 plan 01 done

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, fully populated (953 questions), TypeScript types generated
- Redis: Upstash (stirred-pika-7510)

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table. Key v1.8 decisions:

- Auth: `jwtVerify` (jose) against `SUPABASE_JWT_SECRET` — per accounts integration guide
- Admin: `admin_users` table UUID lookup (not user_roles join) — correctly typed in database.types.ts
- Gems: `award_gems` RPC, `p_gem_type: 'yellow'`, `p_source: 'civic_trivia'` — replaces local total_gems
- Stats: `trivia.player_stats` is trivia-specific (UUID user_id); not shared platform XP
- Anonymous play: preserved — only Connected tier earns gems and persistent stats
- Suspended accounts: blocked from gem earning and stat writes
- Identity management: links out to accounts platform — no in-trivia editing

**Phase 40-01 decisions:**
- Migration history repair: used `supabase migration repair --status reverted` to clear 24 pre-existing remote entries before pushing new trivia schema migration
- questionFlags.userId type: changed from INTEGER to UUID to match public.users(id) FK on shared Supabase
- PostgREST exposure requires manual Dashboard step (Settings > API > Exposed schemas: add "trivia") — SQL GRANTs alone insufficient

**Phase 40-02 decisions:**
- Supabase Management API /database/query used for target writes — DB password unavailable (PATCH /v1/projects/{ref} db_pass field accepted but did not propagate to pooler auth)
- Dollar-quoting ($JVAL$...$JVAL$::jsonb) for JSONB SQL literals — prevents double-escape of backslashes in markdown learning_content fields
- expiration_history NULL coalesced to [] — source allows NULL, target requires NOT NULL DEFAULT '[]'
- question_flags not migrated — integer user_id incompatible with UUID FK on target

**Phase 40-03 decisions:**
- stderr redirect (2>/dev/null) required when running `supabase gen types` to prevent "Initialising login role..." diagnostic from contaminating TypeScript output
- trivia schema confirmed already PostgREST-exposed — all 9 tables present in generated types (Dashboard step from 40-01 already done)
- Regeneration command: `SUPABASE_ACCESS_TOKEN=... npx supabase gen types --linked --lang typescript --schema public,trivia 2>/dev/null > backend/src/types/database.types.ts`

**Phase 41-01 decisions:**
- authenticateToken preserved as export alias for requireAuth — callers still reference it; Plan 02 migrates callers and removes alias
- Admin check uses admin_users table (typed in database.types.ts) not user_roles join (untyped)
- connect schema accessed via `(supabaseAdmin as any).schema('connect')` — connect schema not in generated types
- Caller TypeScript errors (req.user property missing) are expected; will be fixed in Plan 02

### Pending Todos

- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [x] Confirm Supabase credentials — DONE (PAT provided, project kxsdzaojfaibhuzmclfq linked)
- [x] Manual Supabase Dashboard step: Settings > API > Exposed schemas > add "trivia" — DONE (confirmed by 40-03 type generation showing all 9 trivia tables)
- [x] Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — DONE (confirmed in backend/.env)
- [ ] Plan 02: migrate all callers from req.user.userId to req.userId (rateLimiter.ts, feedback.ts, game.ts, profile.ts + any others)

### Blockers/Concerns

- Plan 02 caller migration required before backend compiles cleanly — 10 TypeScript errors in 4 files referencing req.user
- Review `empowered-accounts-integration-guide.md` (repo root) before Phase 43 for API contracts

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 41-01-PLAN.md — auth.ts replaced, supabaseAdmin created, packages installed
Resume file: None

Next action: Execute Phase 41 Plan 02 — migrate callers from req.user.userId to req.userId
