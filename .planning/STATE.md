# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v1.9 Geographic Expansion — Phase 47: Collection Infrastructure

## Current Position

Phase: 47 of 52 (Collection Infrastructure)
Plan: 3 of 3 in current phase
Status: In progress (plan 02 still pending)
Last activity: 2026-03-02 — Completed 47-03-PLAN.md (state config auto-discovery in unified generator)

Progress: [██████████] v1.0–v1.8 complete (Phases 1–46) | v1.9 in progress (Phase 47, plans 1 and 3 done, plan 2 pending)

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

Key decisions relevant to v1.9:
- Collection hierarchy: DB-driven at runtime (INFRA-01 eliminates hardcoded map)
- State configs gap: state-configs/ registered in generate-locale-questions.ts workflow (INFRA-02)
- Generation strategy: overshoot-and-curate, quality-gate, semantic dedup — established pipeline
- Quality over quantity: 50 compelling questions is the floor; don't force past source exhaustion

**47-01 decisions:**
- Tier stored as text column (not enum) — easier to extend without DDL changes
- DEFAULT 'city' — most common tier, new collections default correctly
- State config files renamed to match slug convention (indiana-state, california-state)

**47-03 decisions:**
- State config auto-discovery via dynamic import fallback — no registry to maintain, drop file in state-configs/ and it works
- LoadedConfig interface replaces `as any` side-channel for stateFeatures
- Both generateBatch AND regenerateFn use buildStateSystemPrompt for state locales (retry path must match generation path)
- generate-state-questions.ts deprecated with redirect notice, kept functional during transition

### Pending Todos

- [ ] Set EMPOWERED_ACCOUNTS_URL in backend/.env (required for gem awards)
- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment
- [ ] "Manage your Empowered Account" link on profile — needs VITE_EMPOWERED_ACCOUNTS_WEB_URL

### Blockers/Concerns

- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not confirmed as frontend env vars — token refresh may fall back to ACCOUNTS_API_URL if absent

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |

## Session Continuity

Last session: 2026-03-02T01:10:19Z
Stopped at: Completed 47-03-PLAN.md — state config auto-discovery in unified generator
Resume file: None

Next action: `/gsd:execute-phase 47` (execute plan 47-02: Collection Hierarchy DB-driven runtime)
