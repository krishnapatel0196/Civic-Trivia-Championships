# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Planning next milestone (v1.9)

## Current Position

Phase: Not started (next milestone not yet planned)
Plan: Not started
Status: Ready to plan next milestone
Last activity: 2026-03-01 — Completed quick task 023: Scaffold and activate collection CLIs

Progress: [██████████] v1.0–v1.8 (Phases 1–46) — ALL SHIPPED

**Milestone history:**
- v1.0–v1.8 (Phases 1–46): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, 953 questions, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key v1.8 decisions:
- Auth: `jwtVerify` (jose) against `SUPABASE_JWT_SECRET` — per accounts integration guide
- Admin: `admin_users` table UUID lookup (typed in database.types.ts)
- Gems: `award_gems` RPC, `p_gem_type: 'yellow'`, `p_source: 'civic_trivia'`
- Stats: `trivia.player_stats` is trivia-specific; not shared platform XP
- Anonymous play: preserved — only Connected tier earns gems and persistent stats
- `tierResolved` flag in authStore fixes AdminGuard race condition
- `requireConnected` removed from Express — tier enforcement is frontend-only
- `setAuth` sets `tierResolved: true` — fixes admin access after expired session

### Pending Todos

- [ ] Set EMPOWERED_ACCOUNTS_URL in backend/.env (required for gem awards — code complete, runtime path blocked without this)
- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [ ] "Manage your Empowered Account" link on profile — ACCOUNTS_API_URL points to API; needs VITE_EMPOWERED_ACCOUNTS_WEB_URL env var or hardcoded platform URL

### Blockers/Concerns

- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not confirmed as frontend env vars — token refresh may fall back to ACCOUNTS_API_URL if absent

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed quick task 023 — scaffold-collection and activate-collection CLIs
Resume file: None

Next action: `/gsd:new-milestone` to plan v1.9
