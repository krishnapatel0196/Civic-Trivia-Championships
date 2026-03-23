# Roadmap: Civic Trivia Championship

## Milestones

- ✅ **v2.2 Pipeline Intelligence** — Phases 63–68 (shipped 2026-03-18) — [archive](milestones/v2.2-ROADMAP.md)
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
- ✅ **v2.3 UX & Rewards Polish** — Phases 69–71 (shipped 2026-03-19)
- 🔄 **v2.4 Geographic Expansion + Collection UX** — Phases 72–74 (in progress)

## Phases

<details>
<summary>🔄 v2.4 Geographic Expansion + Collection UX (Phases 72–74) — IN PROGRESS</summary>

### Phase 72: Arizona State Collection

**Goal:** Players can choose and play the Arizona state collection in production.

**Dependencies:** None — /create-collection skill operates end-to-end autonomously.

**Requirements:** COLL-01

**Success Criteria:**
1. Arizona collection card appears in the State tier of the collection picker.
2. A player can start and complete a full 8-question game from the Arizona collection.
3. The collection has at least 80 active questions meeting the established quality bar (no blocking violations, zero active duplicates confirmed by semantic dedup).
4. At least 15% of questions are expiring (officeholder questions with expiresAt set), or the structural ceiling is documented if that ratio cannot be reached.

---

### Phase 73: Tucson, AZ City Collection

**Goal:** Players can choose and play the Tucson, AZ city collection in production.

**Dependencies:** Phase 72 (Arizona state collection active — establishes AZ-specific quality guidance that informs Tucson locale config voice guidance and strict state-scale boundary).

**Requirements:** COLL-02

**Success Criteria:**
1. Tucson collection card appears in the City tier of the collection picker.
2. A player can start and complete a full 8-question game from the Tucson collection.
3. The collection has at least 80 active questions with zero overlap with Phase 72 Arizona state questions (city-only scope enforced).
4. At least 15% of questions are expiring (councilmember + mayor officeholder questions with expiresAt set).

---

### Phase 74: Collection Picker Search/Filter

**Goal:** Players can find any collection instantly by typing, without scrolling through the full grouped list.

**Dependencies:** None — pure frontend feature; no backend changes required.

**Requirements:** PICK-01, PICK-02, PICK-03, PICK-04, PICK-05

**Success Criteria:**
1. A search input is visible at the top of the collection picker screen before any interaction.
2. Typing a partial name (e.g., "ariz") shows only matching collections in a flat list, collapsing all tier groupings while the input is non-empty.
3. Clearing the input (by deleting text or pressing the clear button) immediately restores the full grouped view with Federal / State / City sections intact.
4. The filter is case-insensitive — typing "ARIZONA" and "arizona" produce identical results.

</details>

<details>
<summary>✅ v2.2 Pipeline Intelligence (Phases 63–68) — SHIPPED 2026-03-18</summary>

- [x] Phase 63: Scaffold Fix (1/1 plan) — completed 2026-03-15
- [x] Phase 64: Structured Officeholders (2/2 plans) — completed 2026-03-15
- [x] Phase 65: Auto-Regenerate Expired Questions (2/2 plans) — completed 2026-03-15
- [x] Phase 66: Gem Award Migration (1/1 plan) — completed 2026-03-15
- [x] Phase 67: Leaderboard (3/3 plans) — completed 2026-03-17
- [x] Phase 68: Santa Monica, CA Collection (3/3 plans) — completed 2026-03-18

Full archive: [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md)

</details>

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

<details>
<summary>✅ v2.3 UX & Rewards Polish (Phases 69–71) — SHIPPED 2026-03-19</summary>

- [x] Phase 69: Game Flow Buttons (1/1 plan) — completed 2026-03-19
- [x] Phase 70: Gem Scoring & Wager Preview (3/3 plans) — completed 2026-03-19
- [x] Phase 71: Leaderboard Cache Fix (1/1 plan) — completed 2026-03-19

Full archive: [milestones/v2.3-ROADMAP.md](milestones/v2.3-ROADMAP.md)

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
| 63. Scaffold Fix | v2.2 | 1/1 | Complete | 2026-03-15 |
| 64. Structured Officeholders | v2.2 | 2/2 | Complete | 2026-03-15 |
| 65. Auto-Regenerate Expired Questions | v2.2 | 2/2 | Complete | 2026-03-15 |
| 66. Gem Award Migration | v2.2 | 1/1 | Complete | 2026-03-15 |
| 67. Leaderboard | v2.2 | 3/3 | Complete | 2026-03-17 |
| 68. Santa Monica, CA Collection | v2.2 | 3/3 | Complete | 2026-03-18 |
| 69–71. UX & Rewards Polish Phases | v2.3 | 5/5 | Complete | 2026-03-19 |
| 72. Arizona State Collection | v2.4 | 0/— | Pending | — |
| 73. Tucson, AZ City Collection | v2.4 | 0/— | Pending | — |
| 74. Collection Picker Search/Filter | v2.4 | 0/— | Pending | — |
