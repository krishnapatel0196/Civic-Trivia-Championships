# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v1.9 Geographic Expansion — Phase 48: Activate Banked Collections COMPLETE

## Current Position

Phase: 48 of 52 (Activate Banked Collections)
Plan: 1 of 1 in current phase
Status: Phase complete — all plans done
Last activity: 2026-03-02 — Completed 48-01-PLAN.md (activate Fremont CA + Norwich England)

Progress: [██████████] v1.0–v1.8 complete (Phases 1–46) | v1.9 Phase 47 COMPLETE | v1.9 Phase 48 COMPLETE

**Milestone history:**
- v1.0–v1.8 (Phases 1–46): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (7): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana State, California State, Norwich England

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key decisions relevant to v1.9:
- Collection hierarchy: DB-driven at runtime (INFRA-01 eliminates hardcoded map) — COMPLETE
- State configs gap: state-configs/ registered in generate-locale-questions.ts workflow (INFRA-02) — COMPLETE
- Generation strategy: overshoot-and-curate, quality-gate, semantic dedup — established pipeline
- Quality over quantity: 50 compelling questions is the floor; don't force past source exhaustion

**47-01 decisions:**
- Tier stored as text column (not enum) — easier to extend without DDL changes
- DEFAULT 'city' — most common tier, new collections default correctly
- State config files renamed to match slug convention (indiana-state, california-state)

**47-02 decisions:**
- Dynamic imports in loadCollectionTierMap() to avoid circular dependency (types.ts imported early)
- Constructor injection for tierMap: ClusterBuilder(tierMap) and CollectionHierarchy(embeddingService, tierMap)
- CollectionHierarchy static methods converted to instance methods (consistent with injected state)
- COLLECTION_NAMES keys corrected from 'indiana'/'california' to 'indiana-state'/'california-state' (slug alignment)
- All 7 seed entries get explicit tier values for correctness on dev re-seed

**47-03 decisions:**
- State config auto-discovery via dynamic import fallback — no registry to maintain, drop file in state-configs/ and it works
- LoadedConfig interface replaces `as any` side-channel for stateFeatures
- Both generateBatch AND regenerateFn use buildStateSystemPrompt for state locales (retry path must match generation path)
- generate-state-questions.ts deprecated with redirect notice, kept functional during transition

**48-01 decisions:**
- Both Fremont CA and Norwich England were already active in DB before this plan ran (prior session activation confirmed)
- Fremont 25 remaining non-curated drafts intentionally left as draft (plan Pitfall 4 honored)
- Norwich prefix is `nor` (not `nur`) — confirmed by locale-config externalIdPrefix
- Standard collection activation workflow established: audit-collection-readiness.ts → curate (if needed) → activate-collection.ts → verify-post-activation.ts

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

Last session: 2026-03-02
Stopped at: Phase 48 complete — 48-01-PLAN.md executed (Fremont CA + Norwich England verified live, 2 reusable scripts created)
Resume file: None

Next action: `/gsd:discuss-phase 49` or `/gsd:plan-phase 49`
