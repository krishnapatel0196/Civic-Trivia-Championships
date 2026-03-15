# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.2 Pipeline Intelligence — Phase 63: Scaffold Fix (6 phases total: 63–68)

## Current Position

Phase: 63 of 66 (Scaffold Fix)
Plan: —
Status: Ready to plan
Last activity: 2026-03-15 — Roadmap created for v2.2 Pipeline Intelligence (Phases 63–66)

Progress: [██████████] v1.0–v2.1 complete (Phases 1–62) | v2.2 roadmap defined (6 phases, 17 requirements) | Phase 63 ready to plan

**Milestone history:**
- v1.0–v2.1 (Phases 1–62): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (17 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC, Biloxi MS, Mississippi

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key decisions relevant to v2.2 (from ONBOARDING-CTC.md):
- Gem award migration (GEMS-01): `connect.credit_gems` direct RPC deprecated; new endpoint is `POST /api/gems/award` with `TRIVIA_GEMS_KEY`; key scope ["yellow"] configured on accounts side by Chris
- Leaderboard data source (LEAD-01): `GET /api/account/profile/:userId` on accounts API — no auth required, returns username/tier/level/total_xp; no gems or sensitive data
- Accounts URL: ONBOARDING-CTC.md uses `ACCOUNTS_URL` (= `https://ev-accounts-api.onrender.com`); CTC currently uses `EMPOWERED_ACCOUNTS_API_URL` — verify alignment before Phase 66
- `xp_in_level` and `xp_to_next_level` returned by `GET /api/account/me` — use directly, no need to recompute thresholds client-side

Key decisions relevant to v2.2 (from prior milestones):
- Scaffold Bug 2 (known): step3 inserts into type annotation line — revert generate-locale-questions.ts to HEAD; fix is Phase 63 scope
- State officeholder gap (62-02): Speaker Pro Tem consistently missed — must be listed by name in locale config; structured officeholders field (Phase 64) is the systemic fix
- Large council officeholder budget (61-02): 7-ward council needs 2q/ward + 4q/mayor to hit 15% expiring; structured officeholders field removes need for manual targeted pass
- Auto-regenerate expired questions deferred from v2.1 — Phase 65 scope; mirrors awardPlatformXp never-throw pattern
- Mixed-durability pattern established (Texas State): expiring + durable questions in one collection; target 15–30% expiring

### Pending Todos

All three v2.1 deferred items now addressed in v2.2 roadmap:
- [x] Fix Scaffold Bug 2 → Phase 63
- [x] Structured officeholders in LocaleConfig → Phase 64
- [x] Auto-regenerate expired questions → Phase 65

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |
| 024 | Responsive game UI layout — no scrolling to see answers or timer | 2026-03-03 | [024-game-ui-responsive-layout-fixes](./quick/024-game-ui-responsive-layout-fixes/) |
| 025 | Mobile-friendly admin panel — card lists, full-screen panels, responsive layouts | 2026-03-09 | [025-mobile-friendly-admin-panel](./quick/025-mobile-friendly-admin-panel/) |
| 026 | Push 32 commits to origin/master — fix Portland image 404, ship Phases 58–59 | 2026-03-12 | [026-fix-portland-image-404-and-push-portland](./quick/026-fix-portland-image-404-and-push-portland/) |

## Session Continuity

Last session: 2026-03-15
Stopped at: v2.2 roadmap created — Phases 63–68 defined, all 17 requirements mapped
Resume file: None

Next action: Run `/gsd:plan-phase 63` to start execution
