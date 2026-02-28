# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 40 — Database Migration (v1.8 Empowered Identity)

## Current Position

Phase: 40 of 44 in v1.8 (Database Migration)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-28 — v1.8 roadmap created; Phase 40 is next

Progress: [████████░░] v1.0–v1.7 complete (109 plans); v1.8 not started (5 phases remain)

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete ✅
- v1.8 (Phases 40–44): Not started

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase EV-Backend-Dev (to be migrated to shared Supabase, trivia schema)
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

### Pending Todos

- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [ ] Confirm Supabase credentials available before Phase 40 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, EMPOWERED_ACCOUNTS_URL)

### Blockers/Concerns

- Phase 40 requires shared Supabase project access — confirm credentials before starting
- Review `empowered-accounts-integration-guide.md` (repo root) before Phase 43 for API contracts

## Session Continuity

Last session: 2026-02-28
Stopped at: v1.8 roadmap written; ROADMAP.md and STATE.md created
Resume file: None

Next action: /gsd:plan-phase 40 — plan Phase 40: Database Migration
