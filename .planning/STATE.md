# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Planning next milestone — v2.3 complete, run `/gsd:new-milestone`

## Current Position

Phase: 71 of 71 — all phases complete
Plan: N/A
Status: v2.3 milestone complete — ready to plan next milestone
Last activity: 2026-03-19 — v2.3 milestone archived (Phases 69–71)

Progress: [██████████] v1.0–v2.3 complete (Phases 1–71)

**Milestone history:**
- v1.0–v2.3 (Phases 1–71): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (18 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC, Biloxi MS, Mississippi, Santa Monica CA

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

None — v2.3 complete.

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

## Session Continuity

Last session: 2026-03-19
Stopped at: Quick task 027 — awaiting human-verify checkpoint approval
Resume file: None

Next action: `/gsd:new-milestone` — plan next milestone
