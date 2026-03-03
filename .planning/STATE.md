# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v1.9 Geographic Expansion — Phase 51 COMPLETE, ready for Phase 52

## Current Position

Phase: 51 of 52 (Plano TX Collection) — COMPLETE
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-03-03 — Completed 51-03 (activate Plano TX collection — 85 questions live, human approved)

Progress: [██████████] v1.0–v1.8 complete (Phases 1–46) | v1.9 Phase 47 COMPLETE | v1.9 Phase 48 COMPLETE | v1.9 Phase 49 COMPLETE | v1.9 Phase 50 COMPLETE | v1.9 Phase 51 COMPLETE

**Milestone history:**
- v1.0–v1.8 (Phases 1–46): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (9 + Federal = 10 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana State, California State, Norwich England, Massachusetts State, Plano TX

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

**49-01 decisions:**
- scaffold-collection.ts has two bugs: (1) missing trailing comma before inserted entry in collections.ts; (2) step3 inserts locale entry into type declaration line rather than object body in generate-locale-questions.ts — both are Rule 1 auto-fixable
- Research-verified facts override CONTEXT.md: living wage May 1999 (not 1998, not first US city); City Hall Richardsonian Romanesque (not neoclassical)
- Harvard/MIT strict limitation: universities cannot anchor any Cambridge civic question
- City Manager vs Mayor distinction is CRITICAL accuracy requirement for Cambridge (Plan E charter)
- cambridgeMaConfig variable name is correct (scaffold derives from slug: cambridge-ma → cambridgeMa + Config)

**50-01 decisions:**
- massachusettsStateConfig.name is 'Massachusetts' (not 'Massachusetts State') — matches display pattern for state collections
- scaffold step3 bug confirmed again: inserts into type annotation line not object body — same fix applies (revert generate-locale-questions.ts to HEAD; state auto-discovery handles registration)
- 8 topic categories: general-court and governors-council each get own topic slug (both uniquely distinctive MA civic features)
- Governor's Council allocated 8 dedicated questions — one of MA's most surprising civic facts
- state-courts minimized to 5 questions (General Court and 1780 Constitution are more uniquely Massachusetts)

**51-01 decisions:**
- planoTxConfig variable name derived from slug: plano-tx -> planoTx + Config (scaffold convention)
- Bug 2 confirmed again: scaffold step3 inserts locale entry into type annotation line — fixed by moving into object body in generate-locale-questions.ts
- 5 topic categories chosen: city-government (30%), civic-history (25%), growth-story (20%), economic-development (15%), community-identity (10%)
- overshootFactor: 1.3 — generates 130 candidates, curate to 100
- Balloon Capital of Texas (1980, Governor Clements) flagged as DURABLE TOPIC in voice guidance
- Corporate civic angle rules: Frito-Lay 1985, JCPenney 1992, Toyota 2017 — civic significance only, no brand promotion
- Collin County vs. City of Plano disambiguation in voice guidance — common LLM attribution error

**51-02 decisions:**
- Generated 150 candidates → 135 passed validation → 47 near-duplicates archived manually post-review (semantic dedup gap in pipeline)
- pla-007 archived: "current" City Manager with no expiresAt — structural coverage handled by pla-002 and pla-015
- Collection is overwhelmingly durable (86/87) — voice guidance successfully suppressed current-officeholder trivia
- Near-duplicate detection gap: pipeline catches exact text matches only; semantic dedup requires manual pass — consistent pattern across city collections

**51-03 decisions:**
- Banner image: hot air balloon festival photo — directly evokes Balloon Capital of Texas designation (Governor Clements, 1980)
- 85 of 87 draft questions activated (2 already archived prior to activation run)

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

Last session: 2026-03-03
Stopped at: Completed 51-03-PLAN.md (activate Plano TX collection — 85 questions live, human approved)
Resume file: None

Next action: /gsd:plan-phase 52
