# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 40 — Database Migration (v1.8 Empowered Identity)

## Current Position

Phase: 40 of 44 in v1.8 (Database Migration)
Plan: 3 of 3 complete in Phase 40 (40-01, 40-03 done; 40-02 is data migration, may be skipped)
Status: Phase 40 plans 40-01 and 40-03 complete — 40-02 (data migration) pending
Last activity: 2026-02-28 — Completed 40-03 (TypeScript types generated from shared Supabase)

Progress: [████████░░] v1.0–v1.7 complete (109 plans); v1.8 plans 2/15 complete (40-01, 40-03)

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete
- v1.8 (Phases 40–44): In progress — Phase 40 plans 40-01 and 40-03 done

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed; TypeScript types generated; data migration pending (40-02)
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

**Phase 40-03 decisions:**
- stderr redirect (2>/dev/null) required when running `supabase gen types` to prevent "Initialising login role..." diagnostic from contaminating TypeScript output
- trivia schema confirmed already PostgREST-exposed — all 9 tables present in generated types (Dashboard step from 40-01 already done)
- Regeneration command: `SUPABASE_ACCESS_TOKEN=... npx supabase gen types --linked --lang typescript --schema public,trivia 2>/dev/null > backend/src/types/database.types.ts`

### Pending Todos

- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [x] Confirm Supabase credentials — DONE (PAT provided, project kxsdzaojfaibhuzmclfq linked)
- [x] Manual Supabase Dashboard step: Settings > API > Exposed schemas > add "trivia" — DONE (confirmed by 40-03 type generation showing all 9 trivia tables)
- [ ] Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, EMPOWERED_ACCOUNTS_URL for Phase 41 backend env migration

### Blockers/Concerns

- Phase 41 backend env migration will require SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — confirm these are available before starting Phase 41
- Review `empowered-accounts-integration-guide.md` (repo root) before Phase 43 for API contracts

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 40-03-PLAN.md — TypeScript types generated from shared Supabase (database.types.ts, 1,950 lines, build passing)
Resume file: None

Next action: /gsd:execute-phase 40-02 — Phase 40 Plan 02: Data Migration (pg_dump from EV-Backend-Dev, restore to shared Supabase trivia schema) OR skip to Phase 41 if data migration was already handled
