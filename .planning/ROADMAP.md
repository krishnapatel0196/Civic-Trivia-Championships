# Roadmap: Civic Trivia Championship

## Milestones

- ◆ **v2.2 Pipeline Intelligence** — Phases 63–68 (in progress)
- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-02-13)
- ✅ **v1.1 Production Hardening** — Phases 8–12 (shipped 2026-02-18)
- ✅ **v1.2 Community Collections** — Phases 13–17 (shipped 2026-02-19)
- ✅ **v1.3 Question Quality & Admin Tools** — Phases 18–22 (shipped 2026-02-20)
- ✅ **v1.4 Fremont, CA Collection** — Phases 23–26 (shipped 2026-02-21)
- ✅ **v1.5 Feedback Marks** — Phases 27–30 (shipped 2026-02-22)
- ✅ **v1.6 Content Quality & Scale** — Phases 31–34 (shipped 2026-02-24)
- ✅ **v1.7 Live Civic Intelligence** — Phases 35–39 (shipped 2026-02-27)
- ✅ **v1.8 Empowered Identity** — Phases 40–46 (shipped 2026-03-01)
- ✅ **v1.9 Geographic Expansion** — Phases 47–52 (shipped 2026-03-03)
- ✅ **v2.0 XP Integration** — Phases 53–56 (shipped 2026-03-08)
- ✅ **v2.1 Collection Excellence** — Phases 57–62 (shipped 2026-03-15) — [archive](milestones/v2.1-ROADMAP.md)

## Phases

### ◆ v2.2 Pipeline Intelligence (In Progress)

**Milestone Goal:** Automate the content operations lifecycle — fix the scaffold tooling bug, add structured officeholders to LocaleConfig so expiresAt is seeded automatically, extend the hourly expiry cron to regenerate fresh replacements, migrate gem awards to the new accounts API endpoint, add a leaderboard, and ship Santa Monica CA as the first collection built entirely with the new infrastructure.

#### Phase 63: Scaffold Fix
**Goal**: The scaffold tool runs cleanly without corrupting the generation pipeline
**Depends on**: Phase 62 (nothing functional, but establishes starting point for v2.2)
**Requirements**: TOOL-01
**Success Criteria** (what must be TRUE):
  1. Running `scaffold-collection.ts` leaves `generate-locale-questions.ts` byte-for-byte identical to its pre-scaffold state
  2. The post-scaffold `git checkout` workaround is no longer needed or documented as required
  3. An existing collection can be regenerated immediately after scaffolding a new one without manual intervention
**Plans**: 1 plan

Plans:
- [ ] 63-01-PLAN.md — Fix brace-depth scanner in step3RegisterLocale and verify with test scaffold

#### Phase 64: Structured Officeholders
**Goal**: LocaleConfig can declare officeholders once and the pipeline automatically seeds expiresAt on matching questions — zero manual targeted pass required
**Depends on**: Phase 63
**Requirements**: TOOL-02, TOOL-03, TOOL-04, TOOL-05
**Success Criteria** (what must be TRUE):
  1. A locale config with an `officeholders` array (name, role, termEnd) passes TypeScript type-checking without error
  2. Generation prompts include each officeholder's name and role when the field is present, visibly shaping AI output toward current-officeholder questions
  3. After generation, any question whose text references an officeholder by name has `expiresAt` automatically set to that officeholder's `termEnd` date — no manual pass needed
  4. `audit-collection-readiness.ts` reports how many officeholders have at least one question with matching `expiresAt`, and flags any officeholder with zero coverage
**Plans**: TBD

Plans:
- [ ] 64-01: Add `officeholders` field to LocaleConfig type and update prompt injection logic
- [ ] 64-02: Implement post-generation expiresAt auto-seeding and audit coverage reporting

#### Phase 65: Auto-Regenerate Expired Questions
**Goal**: When the hourly expiry cron archives an expired question, it automatically generates and seeds a fresh replacement in the same topic — the collection never shrinks
**Depends on**: Phase 64
**Requirements**: COPS-01, COPS-02, COPS-03, COPS-04
**Success Criteria** (what must be TRUE):
  1. Running the hourly cron when expired questions are present archives those questions AND seeds active replacements in a single pass — no separate step required
  2. Each replacement question shares the topic category of the question it replaces, maintaining collection topic balance
  3. Replacement questions are seeded directly as active (status = 'active'), not as drafts requiring admin review
  4. If replacement generation throws or returns an error, the expiry still completes and logs a warning — the cron never fails because of a generation error
**Plans**: TBD

Plans:
- [ ] 65-01: Extend hourly expiry cron with replacement generation and never-throw error handling

#### Phase 66: Gem Award Migration
**Goal**: CTC gem awards route through the accounts API — deprecated direct RPC removed, new endpoint wired with `TRIVIA_GEMS_KEY`
**Depends on**: Phase 65 (independent, but sequenced after content ops work)
**Requirements**: GEMS-01, GEMS-02
**Success Criteria** (what must be TRUE):
  1. `awardPlatformGems()` calls `POST /api/gems/award` with `TRIVIA_GEMS_KEY` — no direct Supabase RPC call remains
  2. `connect.credit_gems` RPC call is fully removed from the codebase
  3. `TRIVIA_GEMS_KEY` is validated on startup with a warning if missing (mirrors `TRIVIA_SERVICE_KEY` pattern)
  4. Gem awards still land correctly in the accounts gem ledger (verified in production)
**Plans**: TBD

Plans:
- [ ] 66-01: Migrate awardPlatformGems() to POST /api/gems/award and add TRIVIA_GEMS_KEY env validation

#### Phase 67: Leaderboard
**Goal**: Players can see a ranked leaderboard of top CTC players, sourced from the accounts public profile API
**Depends on**: Phase 66 (accounts API integration work establishes pattern)
**Requirements**: LEAD-01, LEAD-02
**Success Criteria** (what must be TRUE):
  1. Leaderboard page is accessible without auth and shows top players ranked by total XP
  2. Each row shows username, tier badge, level, and total XP — sourced from `GET /api/account/profile/:userId`
  3. Logged-in user's own rank is visually highlighted if they appear on the leaderboard
  4. Page loads within performance budget (FCP <1.5s)
**Plans**: TBD

Plans:
- [ ] 67-01: Build leaderboard page with accounts public profile API integration

#### Phase 68: Santa Monica, CA Collection
**Goal**: Santa Monica, CA is a fully activated collection with 80–100 questions and uses the `officeholders` field to achieve 15–30% expiring ratio without a manual targeted pass
**Depends on**: Phase 64 (officeholders field must exist before scaffolding)
**Requirements**: COLL-01, COLL-02, COLL-03
**Success Criteria** (what must be TRUE):
  1. Santa Monica collection card appears in the collection picker and is playable in production
  2. Collection has 80–100 active questions across its defined topic categories, all passing quality rules
  3. Expiring question ratio is 15–30%, achieved via the `officeholders` field in locale config (no manual targeted pass)
  4. Semantic dedup ran automatically during generation and confirmed zero within-collection duplicates at activation
  5. Banner image is an iconic Santa Monica landmark (not a generic placeholder)
**Plans**: TBD

Plans:
- [ ] 68-01: Scaffold Santa Monica, generate questions, curate
- [ ] 68-02: Activate Santa Monica collection in production

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

<details>
<summary>✅ v1.9 Geographic Expansion (Phases 47–52) — SHIPPED 2026-03-03</summary>

- [x] Phase 47: Collection Infrastructure (3/3 plans) — completed 2026-03-02
- [x] Phase 48: Activate Banked Collections (1/1 plan) — completed 2026-03-03
- [x] Phase 49: Cambridge, MA Collection (3/3 plans) — completed 2026-03-02
- [x] Phase 50: Massachusetts State Collection (3/3 plans) — completed 2026-03-02
- [x] Phase 51: Plano, TX Collection (3/3 plans) — completed 2026-03-03
- [x] Phase 52: Texas State Collection (3/3 plans) — completed 2026-03-03

Full archive: [milestones/v1.9-ROADMAP.md](milestones/v1.9-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 XP Integration (Phases 53–56) — SHIPPED 2026-03-08</summary>

- [x] Phase 53: XP Backend Integration (1/1 plans) — completed 2026-03-05
- [x] Phase 54: XP Game UI (5/5 plans) — completed 2026-03-08
- [x] Phase 55: XP History Panel (3/3 plans) — completed 2026-03-08
- [x] Phase 56: Post-v2.0 XP Tech Debt (1/1 plans) — completed 2026-03-08

Full archive: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.1 Collection Excellence (Phases 57–62) — SHIPPED 2026-03-15</summary>

- [x] Phase 57: Pipeline & Playbook Foundation (2/2 plans) — completed 2026-03-09
- [x] Phase 58: Portland, OR Collection (3/3 plans) — completed 2026-03-09
- [x] Phase 59: Oregon State Collection (2/2 plans) — completed 2026-03-12
- [x] Phase 60: Washington, DC Collection (2/2 plans) — completed 2026-03-14
- [x] Phase 61: Biloxi, MS Collection (2/2 plans) — completed 2026-03-14
- [x] Phase 62: Mississippi State Collection (2/2 plans) — completed 2026-03-15

Full archive: [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md)

</details>

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
| 48. Activate Banked Collections | v1.9 | 1/1 | Complete | 2026-03-03 |
| 49. Cambridge, MA Collection | v1.9 | 3/3 | Complete | 2026-03-02 |
| 50. Massachusetts State Collection | v1.9 | 3/3 | Complete | 2026-03-02 |
| 51. Plano, TX Collection | v1.9 | 3/3 | Complete | 2026-03-03 |
| 52. Texas State Collection | v1.9 | 3/3 | Complete | 2026-03-03 |
| 53. XP Backend Integration | v2.0 | 1/1 | Complete | 2026-03-05 |
| 54. XP Game UI | v2.0 | 5/5 | Complete | 2026-03-08 |
| 55. XP History Panel | v2.0 | 3/3 | Complete | 2026-03-08 |
| 56. Post-v2.0 XP Tech Debt | v2.0 | 1/1 | Complete | 2026-03-08 |
| 57–62. Collection Excellence Phases | v2.1 | 13/13 | Complete | 2026-03-15 |
| 63. Scaffold Fix | v2.2 | 0/1 | Not started | - |
| 64. Structured Officeholders | v2.2 | 0/TBD | Not started | - |
| 65. Auto-Regenerate Expired Questions | v2.2 | 0/TBD | Not started | - |
| 66. Gem Award Migration | v2.2 | 0/TBD | Not started | - |
| 67. Leaderboard | v2.2 | 0/TBD | Not started | - |
| 68. Santa Monica, CA Collection | v2.2 | 0/TBD | Not started | - |
