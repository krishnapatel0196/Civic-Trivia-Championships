# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 41 — Auth & Tier Integration (v1.8 Empowered Identity)

## Current Position

Phase: 41 of 44 in v1.8 (Auth & Tier Integration) — Phase complete
Plan: 2 of 2 complete in Phase 41 (41-01, 41-02 done)
Status: Phase 41 complete — ready for Phase 42
Last activity: 2026-03-01 — Completed 41-02-PLAN.md — all req.user callers migrated to req.userId, sessionService UUID-safe, TypeScript build clean

Progress: [████████░░] v1.0–v1.7 complete (109 plans); v1.8 plans 5/15 complete (40-01, 40-02, 40-03, 41-01, 41-02)

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete
- v1.8 (Phases 40–44): In progress — Phase 40 complete, Phase 41 complete

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

**Phase 41-02 decisions:**
- req.userId is now the canonical user identifier throughout all routes and middleware (string UUID)
- Profile routes use `as unknown as number` cast as explicit Phase 43 TODO markers — UUID users cannot reach legacy integer User model at runtime anyway
- Progression guard for UUID users: sets progressionAwarded=true with progression=null to prevent retry; Phase 42 implements award_gems RPC
- sessionService timerMultiplier defaults to 1.0 for UUID users (typeof session.userId === 'number' guard)
- getRateLimitStatus signature: userId changed from number to string to match UUID type

### Pending Todos

- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [x] Confirm Supabase credentials — DONE (PAT provided, project kxsdzaojfaibhuzmclfq linked)
- [x] Manual Supabase Dashboard step: Settings > API > Exposed schemas > add "trivia" — DONE (confirmed by 40-03 type generation showing all 9 trivia tables)
- [x] Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — DONE (confirmed in backend/.env)
- [x] Plan 02: migrate all callers from req.user.userId to req.userId — DONE (41-02 complete)

### Blockers/Concerns

- Review `empowered-accounts-integration-guide.md` (repo root) before Phase 43 for API contracts
- Phase 42: implement award_gems RPC for UUID user progression (TODO markers in game.ts)
- Phase 43: replace profile routes using legacy User model (as unknown as number cast markers in profile.ts)

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 41-02-PLAN.md — all req.user callers migrated to req.userId, clean TypeScript build
Resume file: None

Next action: Execute Phase 42 — award_gems RPC integration for UUID user progression
