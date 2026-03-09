# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.1 Collection Excellence — Phase 57: Pipeline & Playbook Foundation

## Current Position

Phase: 57 of 62 (Pipeline & Playbook Foundation)
Plan: 02 of 02 complete — Phase 57 complete
Status: Phase complete, ready for Phase 58
Last activity: 2026-03-09 — Completed 57-02-PLAN.md (expiring ratio warning + COLLECTION-PLAYBOOK.md bootstrapped)

Progress: [██████████] v1.0–v2.0 complete (Phases 1–56) | 12 collections live | ~1,484 questions | v2.1 Phase 57 all plans shipped

**Milestone history:**
- v1.0–v2.0 (Phases 1–56): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (11 + Federal = 12 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key decisions relevant to v2.1:
- Near-duplicate detection gap: CLOSED (57-01) — runWithinCollectionSemanticDedup() now auto-runs after generation; manual scan-duplicates.ts pass no longer required per collection
- Within-collection dedup uses empty tierMap for ClusterBuilder — quality score then externalId alphabetical order breaks ties (correct for single-collection context)
- Expiring ratio warning non-blocking (57-02): exit 0 even when ratio < 15% — enforcing as a block would gate older collections; forward-looking quality nudge only
- Two-query expiry model (57-02): expiringRatioCount (IS NOT NULL, no date filter) for ratio warning; expiringCount (90-day window) for netCount blocker
- COLLECTION-PLAYBOOK.md (57-02): lives in .planning/ root as cross-phase living document; append retrospective after each collection phase
- Mixed-durability pattern established (Texas State): expiring + durable questions in one collection; target 15–30% expiring
- State-only curation rule: city/regional landmarks prohibited by name in state collections
- Scaffold Bug 2 (known): step3 inserts into type annotation line — revert generate-locale-questions.ts to HEAD; state auto-discovery handles registration
- Washington DC framing: district tier (not city, not state); DC Council + Mayor structure; Home Rule Charter 1973; no voting Congressional representation

### Pending Todos

- [x] **Enforce 15–30% expiring question ratio** — DONE (57-02): audit script warns when ratio < 15%
- [ ] **Auto-regenerate expired questions** — deferred to future milestone after ratio enforcement lands

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |
| 024 | Responsive game UI layout — no scrolling to see answers or timer | 2026-03-03 | [024-game-ui-responsive-layout-fixes](./quick/024-game-ui-responsive-layout-fixes/) |
| 025 | Mobile-friendly admin panel — card lists, full-screen panels, responsive layouts | 2026-03-09 | [025-mobile-friendly-admin-panel](./quick/025-mobile-friendly-admin-panel/) |

## Session Continuity

Last session: 2026-03-09
Stopped at: Completed 57-02-PLAN.md — Phase 57 fully complete
Resume file: None

Next action: Plan Phase 58 (Portland, OR collection)
