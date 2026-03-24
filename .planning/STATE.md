# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.4 — Geographic Expansion + Collection UX

## Current Position

Phase: 74 (collection-picker-search-filter) — In progress
Plan: 01 of ? completed
Status: Plan 74-01 complete — search/filter shipped
Last activity: 2026-03-23 — Completed 74-01-PLAN.md (CollectionPicker search/filter)

Progress: [██████████] v1.0–v2.3 complete (Phases 1–71) | v2.4 in progress (Phase 74 plan 01 done)

**Milestone history:**
- v1.0–v2.3 (Phases 1–71): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (24 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC, Biloxi MS, Mississippi, Santa Monica CA, Indio CA, Alexandria LA, Louisiana, Springfield MO, St. Louis MO, Missouri

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

v2.3 decisions archived to PROJECT.md. Key decisions from v2.3 milestone (2026-03-19):
- GEM_SCORE_THRESHOLD = 1000 exported from progressionService.ts — wager preview UI imports same constant
- Perfect game (8/8) checked before score threshold — preserves 2-gem award for flawless play at any score
- GEM_SCORE_THRESHOLD duplicated as local const in WagerScreen.tsx and ResultsScreen.tsx — frontend cannot import backend; value replication is intentional
- Timer shrinks to 56px during reveal — reclaims vertical space for NextStepButton; prevents scroll on 375×667
- CACHE_TTL = 60 (no env var override) — 60s is correct value; over-engineering avoided
- Push-based cache invalidation (LEAD-F01) deferred to v2.4+

### Pending Todos

- trivia_service DB role needs password reset via Supabase dashboard to work with pooler (currently using postgres superuser — functional but not ideal long-term)

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
| 027 | Spread out gameplay layout — vertically centered on large screens, responsive on mobile/tablet | 2026-03-19 | [027-spread-out-gameplay-layout-centered-resp](./quick/027-spread-out-gameplay-layout-centered-resp/) |
| 028 | Show pseudonyms for all leaderboard players — not emails or real names | 2026-03-19 | [028-leaderboard-show-pseudonyms](./quick/028-leaderboard-show-pseudonyms/) |
| 028 | Leaderboard show pseudonyms — all players shown, not just current user | 2026-03-19 | [028-leaderboard-show-pseudonyms](./quick/028-leaderboard-show-pseudonyms/) |
| 029 | Create collection for Indio, CA — 19th active collection, 169 questions (ica prefix) | 2026-03-20 | [029-create-collection-for-indio-ca](./quick/029-create-collection-for-indio-ca/) |
| 030 | Reposition score popup animations near top-left scoreboard (from screen-center) | 2026-03-20 | [030-points-speed-bonus-animate-over-scorebo](./quick/030-points-speed-bonus-animate-over-scorebo/) |

## Session Continuity

Last session: 2026-03-23
Stopped at: Completed 74-01-PLAN.md — CollectionPicker search/filter input
Resume file: None

Next action: Continue Phase 74 if more plans exist, or mark phase complete
