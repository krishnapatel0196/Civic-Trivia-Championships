# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 40 — Database Migration (v1.8 Empowered Identity)

## Current Position

Phase: 40 of 44 in v1.8 (Database Migration)
Plan: 1 of 3 complete in Phase 40
Status: In progress — Plan 40-01 complete
Last activity: 2026-02-28 — Completed 40-01 (trivia schema deployed to shared Supabase)

Progress: [████████░░] v1.0–v1.7 complete (109 plans); v1.8 plan 1/15 complete

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete ✅
- v1.8 (Phases 40–44): In progress — Phase 40 plan 1/3 done

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed; data migration pending (40-02)
- Redis: Upstash (stirred-pika-7510)

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table. Key v1.8 decisions:

- Auth: `jwtVerify` (jose) against `SUPABASE_JWT_SECRET` — per accounts integration guide
- Admin: `public.user_roles` table via service role client — replaces boolean `is_admin`
- Gems: `award_gems` RPC, `p_gem_type: 'yellow'`, `p_source: 'civic_trivia'` — replaces local total_gems
- Stats: `trivia.player_stats` is trivia-specific (UUID user_id); not shared platform XP
- Anonymous play: preserved — only Connected tier earns gems and persistent stats
- Suspended accounts: blocked from gem earning and stat writes
- Identity management: links out to accounts platform — no in-trivia editing

**Phase 40-01 decisions:**
- Migration history repair: used `supabase migration repair --status reverted` to clear 24 pre-existing remote entries before pushing new trivia schema migration
- questionFlags.userId type: changed from INTEGER to UUID to match public.users(id) FK on shared Supabase
- PostgREST exposure requires manual Dashboard step (Settings > API > Exposed schemas: add "trivia") — SQL GRANTs alone insufficient

### Pending Todos

- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [x] Confirm Supabase credentials — DONE (PAT provided, project kxsdzaojfaibhuzmclfq linked)
- [ ] Manual Supabase Dashboard step: Settings > API > Exposed schemas > add "trivia" (required before Phase 40-03 or any PostgREST API calls)
- [ ] Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, EMPOWERED_ACCOUNTS_URL for Phase 40-03 env migration

### Blockers/Concerns

- PostgREST will not expose trivia schema until manual Dashboard step is done (Settings > API > Exposed schemas)
- Phase 40-03 backend env migration will require SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — confirm these are available before starting 40-03
- Review `empowered-accounts-integration-guide.md` (repo root) before Phase 43 for API contracts

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 40-01-PLAN.md — trivia schema deployed to shared Supabase project
Resume file: None

Next action: /gsd:execute-phase 40-02 — Phase 40 Plan 02: Data Migration (pg_dump from EV-Backend-Dev, restore to shared Supabase trivia schema)
