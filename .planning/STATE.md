# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Planning next milestone — run `/gsd:new-milestone`

## Current Position

Phase: Not started (defining roadmap)
Plan: —
Status: Defining roadmap for v2.5
Last activity: 2026-04-08 — Milestone v2.5 International Collections started

Progress: [██████████] v1.0–v2.4 complete (Phases 1–74)

**Milestone history:**
- v1.0–v2.4 (Phases 1–74): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (26 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC, Biloxi MS, Mississippi, Santa Monica CA, Indio CA, Alexandria LA, Louisiana, Springfield MO, St. Louis MO, Missouri, Arizona, Tucson AZ, Phoenix AZ

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

v2.4 decisions archived to PROJECT.md. Key decisions from v2.4 milestone (2026-03-23):
- No auto-focus on CollectionPicker search input — mobile keyboard would pop up on screen load
- 150ms debounce on search (useDebounce) — responsive without per-keystroke re-renders
- Search matches collection name field only — "ariz" matches "Arizona" but not "Tucson, AZ"; users type "az" or city name
- Skip gem award API call when gemsEarned === 0 — avoids unnecessary HTTP POST
- DB state is authoritative verification for /create-collection skill output — no phase dirs required
- Push-based leaderboard cache invalidation (LEAD-F01) still deferred

### Pending Todos

- trivia_service DB role needs password reset via Supabase dashboard to work with pooler (currently using postgres superuser — functional but not ideal long-term)
- Tucson, AZ expiring ratio at 8.3% (8/96) — below 15% advisory target; ~6 more officeholder questions would close it (non-blocking)
- 4 human smoke tests for Phase 74 search UX (visual placement, flat-list transition feel, clear-to-restore, browser native clear button)

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
| 029 | Create collection for Indio, CA — 19th active collection, 169 questions (ica prefix) | 2026-03-20 | [029-create-collection-for-indio-ca](./quick/029-create-collection-for-indio-ca/) |
| 030 | Reposition score popup animations near top-left scoreboard (from screen-center) | 2026-03-20 | [030-points-speed-bonus-animate-over-scorebo](./quick/030-points-speed-bonus-animate-over-scorebo/) |
| 031 | Add admin archive question button in game — in-game moderation with verdict modal | 2026-03-24 | [031-add-admin-archive-question-button-in-gam](./quick/031-add-admin-archive-question-button-in-gam/) |

## Session Continuity

Last session: 2026-03-24
Stopped at: Quick task 031 complete — admin archive button in game
Resume file: None

Next action: Roadmap in progress for v2.5 International Collections (Phases 75+)
