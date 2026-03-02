# Roadmap: Civic Trivia Championship

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-02-13)
- ✅ **v1.1 Production Hardening** — Phases 8–12 (shipped 2026-02-18)
- ✅ **v1.2 Community Collections** — Phases 13–17 (shipped 2026-02-19)
- ✅ **v1.3 Question Quality & Admin Tools** — Phases 18–22 (shipped 2026-02-20)
- ✅ **v1.4 Fremont, CA Collection** — Phases 23–26 (shipped 2026-02-21)
- ✅ **v1.5 Feedback Marks** — Phases 27–30 (shipped 2026-02-22)
- ✅ **v1.6 Content Quality & Scale** — Phases 31–34 (shipped 2026-02-24)
- ✅ **v1.7 Live Civic Intelligence** — Phases 35–39 (shipped 2026-02-27)
- ✅ **v1.8 Empowered Identity** — Phases 40–46 (shipped 2026-03-01)
- 🚧 **v1.9 Geographic Expansion** — Phases 47–52 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–7) — SHIPPED 2026-02-13</summary>

### Phase 1: Foundation Auth
**Goal**: Users can create accounts and access the game securely
**Plans**: 4 plans

### Phase 2: Game Core
**Goal**: Players can complete a full 10-question game session
**Plans**: 4 plans

### Phase 3: Scoring System
**Goal**: Server-side scoring with speed bonus runs correctly
**Plans**: 3 plans

### Phase 4: Learning Content
**Goal**: Players see explanations and Learn More for each question
**Plans**: 3 plans

### Phase 5: Progression & Profile
**Goal**: XP and gems accumulate; profile page shows history
**Plans**: 4 plans

### Phase 6: Wager Mechanics
**Goal**: Wager flow integrated into game at question 10
**Plans**: 3 plans

### Phase 7: Polish & Performance
**Goal**: WCAG AA, keyboard nav, FCP <1.5s, bundle <300KB
**Plans**: 5 plans

</details>

<details>
<summary>✅ v1.1 Production Hardening (Phases 8–12) — SHIPPED 2026-02-18</summary>

### Phase 8: Dev Tooling & Documentation
### Phase 9: Redis Session Migration
### Phase 10: Game UX Improvements
### Phase 11: Plausibility Enhancement
### Phase 12: Learning Content Expansion

</details>

<details>
<summary>✅ v1.2 Community Collections (Phases 13–17) — SHIPPED 2026-02-19</summary>

### Phase 13–17: Multi-collection system, question expiration, Bloomington IN and Los Angeles CA collections

</details>

<details>
<summary>✅ v1.3 Question Quality & Admin Tools (Phases 18–22) — SHIPPED 2026-02-20</summary>

### Phase 18–22: Quality rules engine, admin UI, Indiana and California state collections, AI generation pipeline

</details>

<details>
<summary>✅ v1.4 Fremont, CA Collection (Phases 23–26) — SHIPPED 2026-02-21</summary>

### Phase 23–26: Fremont collection (92 questions), enhanced generation pipeline, production verification

</details>

<details>
<summary>✅ v1.5 Feedback Marks (Phases 27–30) — SHIPPED 2026-02-22</summary>

### Phase 27–30: In-game flagging, post-game elaboration, admin flag review queue, AI URL repair

</details>

<details>
<summary>✅ v1.6 Content Quality & Scale (Phases 31–34) — SHIPPED 2026-02-24</summary>

### Phase 31–34: Semantic dedup infrastructure, 268 duplicates archived, self-validating generation pipeline, Indiana and California scaled to 90+

</details>

<details>
<summary>✅ v1.7 Live Civic Intelligence (Phases 35–39) — SHIPPED 2026-02-27</summary>

### Phase 35–39: Election pipeline (races table, question generation, daily cron, current-term follow-up, admin lifecycle UI), Norwich England collection, checkAddressPhone quality rule

</details>

<details>
<summary>✅ v1.8 Empowered Identity (Phases 40–46) — SHIPPED 2026-03-01</summary>

- [x] Phase 40: Database Migration (3/3 plans) — completed 2026-02-28
- [x] Phase 41: Auth & Tier Integration (2/2 plans) — completed 2026-02-28
- [x] Phase 42: Gem & Progression Integration (3/3 plans) — completed 2026-03-01
- [x] Phase 43: Frontend Auth & Profile (3/3 plans) — completed 2026-03-01
- [x] Phase 44: Deprecation & Cleanup (2/2 plans) — completed 2026-03-01
- [x] Phase 45: Auth State Hardening (2/2 plans) — completed 2026-03-01
- [x] Phase 46: Auth Cleanup (1/1 plan) — completed 2026-03-01

Full archive: [milestones/v1.8-ROADMAP.md](milestones/v1.8-ROADMAP.md)

</details>

### v1.9 Geographic Expansion (In Progress)

**Milestone Goal:** Expand the playable collection set from 7 to 11 by activating two banked collections (Fremont CA, Norwich UK), adding two Massachusetts collections (Cambridge city, Massachusetts state), and two Texas collections (Plano city, Texas state). Eliminate hardcoded infrastructure debt that blocks future scaling.

#### Phase 47: Collection Infrastructure ✅
**Goal**: The generation and hierarchy system is database-driven and works uniformly for all collection types
**Depends on**: Phase 46
**Requirements**: INFRA-01, INFRA-02
**Completed**: 2026-03-02
**Success Criteria** (what must be TRUE):
  1. The collection hierarchy displayed in the UI reads tier data from the database at runtime — no hardcoded display-name map exists in embeddings/types.ts
  2. Running `generate-locale-questions.ts --locale <state-slug>` works for state collections the same way it works for city collections
  3. Adding a new state config file registers it in the generator workflow without code changes to the workflow itself
**Plans**: 3 plans

Plans:
- [x] 47-01-PLAN.md — Add tier column to collections DB, update schema and API response
- [x] 47-02-PLAN.md — Replace hardcoded COLLECTION_HIERARCHY with DB lookups, update scaffold CLI
- [x] 47-03-PLAN.md — Unify state config discovery in generate-locale-questions.ts

#### Phase 48: Activate Banked Collections
**Goal**: Fremont CA and Norwich UK are live and playable in production for all users
**Depends on**: Phase 47
**Requirements**: ACT-01, ACT-02
**Success Criteria** (what must be TRUE):
  1. The Fremont, CA collection card appears in the collection picker and a player can start and complete a game using Fremont questions
  2. The Norwich, England collection card appears in the collection picker and a player can start and complete a game using Norwich questions
  3. Both collections return ≥50 active questions via the collections API (is_active = true confirmed)
**Plans**: 1 plan

Plans:
- [ ] 48-01-PLAN.md — Audit readiness, activate Fremont CA and Norwich UK, verify end-to-end playability

#### Phase 49: Cambridge, MA Collection
**Goal**: Cambridge, MA is a fully playable collection with ≥50 questions covering local civic topics
**Depends on**: Phase 48
**Requirements**: CAMB-01, CAMB-02, CAMB-03
**Success Criteria** (what must be TRUE):
  1. A Cambridge, MA locale config exists with Cambridge-specific topics (city government, Harvard/MIT civic context, housing policy, Cambridge City Council, elections) and source URLs, and the collection is registered in the generator hierarchy
  2. The Cambridge collection contains ≥50 active questions that pass all quality rules with zero blocking violations
  3. The Cambridge collection card is visible in the collection picker with a banner image and a player can complete a full game
**Plans**: TBD

Plans:
- [ ] 49-01: TBD

#### Phase 50: Massachusetts State Collection
**Goal**: Massachusetts State is a fully playable collection with ≥50 questions covering state civic topics
**Depends on**: Phase 49
**Requirements**: MASS-01, MASS-02, MASS-03
**Success Criteria** (what must be TRUE):
  1. A Massachusetts State locale config exists with state-level topics (legislature, governor, constitutional history, public policy, civic landmarks) and the collection is registered in the generator hierarchy
  2. The Massachusetts State collection contains ≥50 active questions that pass all quality rules with zero blocking violations
  3. The Massachusetts State collection is active and playable in production — collection card visible and full game completable
**Plans**: TBD

Plans:
- [ ] 50-01: TBD

#### Phase 51: Plano, TX Collection
**Goal**: Plano, TX is a fully playable collection with ≥50 questions covering local civic topics
**Depends on**: Phase 50
**Requirements**: PLAN-01, PLAN-02, PLAN-03
**Success Criteria** (what must be TRUE):
  1. A Plano, TX locale config exists with Plano-specific topics (city government, Collin County, city services, local history, elections) and source URLs, and the collection is registered in the generator hierarchy
  2. The Plano collection contains ≥50 active questions that pass all quality rules with zero blocking violations
  3. The Plano collection card is visible in the collection picker with a banner image and a player can complete a full game
**Plans**: TBD

Plans:
- [ ] 51-01: TBD

#### Phase 52: Texas State Collection
**Goal**: Texas State is a fully playable collection with ≥50 questions covering state civic topics
**Depends on**: Phase 51
**Requirements**: TEX-01, TEX-02, TEX-03
**Success Criteria** (what must be TRUE):
  1. A Texas State locale config exists with state-level topics (legislature, governor, constitutional history, public policy, civic landmarks) and the collection is registered in the generator hierarchy
  2. The Texas State collection contains ≥50 active questions that pass all quality rules with zero blocking violations
  3. The Texas State collection is active and playable in production — collection card visible and full game completable
**Plans**: TBD

Plans:
- [ ] 52-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–7. MVP Phases | v1.0 | 26/26 | Complete | 2026-02-13 |
| 8–12. Hardening Phases | v1.1 | 11/11 | Complete | 2026-02-18 |
| 13–17. Collections Phases | v1.2 | 15/15 | Complete | 2026-02-19 |
| 18–22. Quality Phases | v1.3 | 17/17 | Complete | 2026-02-20 |
| 23–26. Fremont Phases | v1.4 | 6/6 | Complete | 2026-02-21 |
| 27–30. Feedback Phases | v1.5 | 11/11 | Complete | 2026-02-22 |
| 31–34. Scale Phases | v1.6 | 13/13 | Complete | 2026-02-24 |
| 35–39. Election Phases | v1.7 | 10/10 | Complete | 2026-02-27 |
| 40–46. Empowered Identity Phases | v1.8 | 16/16 | Complete | 2026-03-01 |
| 47. Collection Infrastructure | v1.9 | 3/3 | Complete | 2026-03-02 |
| 48. Activate Banked Collections | v1.9 | 0/1 | Not started | - |
| 49. Cambridge, MA Collection | v1.9 | 0/TBD | Not started | - |
| 50. Massachusetts State Collection | v1.9 | 0/TBD | Not started | - |
| 51. Plano, TX Collection | v1.9 | 0/TBD | Not started | - |
| 52. Texas State Collection | v1.9 | 0/TBD | Not started | - |
