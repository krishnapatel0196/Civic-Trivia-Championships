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
- ✅ **v1.9 Geographic Expansion** — Phases 47–52 (shipped 2026-03-03)
- ✅ **v2.0 XP Integration** — Phases 53–55 (shipped 2026-03-08)

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

<details open>
<summary>🔧 v2.0 XP Integration (Phases 53–56) — in progress</summary>

### Phase 53: XP Backend Integration
**Goal:** Award XP server-side after each game for Connected players
**Requirements:** XP-01, XP-02, XP-03, XP-04, XP-05
**Plans:** 1 plan
**Success criteria:**
1. Connected player completes a game → XP award call made to Empowered Accounts API
2. Awarded amount reflects score-proportional formula with participation floor
3. Repeating the same gameId returns `is_duplicate: true` — no double-award
4. Inform/anonymous player completes a game → no award call made, no error
5. `TRIVIA_SERVICE_KEY` and `EMPOWERED_ACCOUNTS_API_URL` env vars documented and validated at startup

Plans:
- [ ] 53-01-PLAN.md — XpAwardResult interface, calculateXpAmount, awardPlatformXp, game.ts wiring, env docs

### Phase 54: XP Game UI (Start + End Screen)
**Goal:** Connected players see their level/XP before and after every game
**Requirements:** XPS-01, XPS-02, XPE-01, XPE-02, XPE-03, XPE-04
**Plans:** 5 plans
**Success criteria:**
1. Connected player on start screen sees current level and XP progress bar
2. Non-Connected player on start screen sees "Link account to earn XP" prompt (not XP panel)
3. End screen shows `+{amount} XP` after game results
4. Level-up triggers a visible animation; no animation when level unchanged
5. Progress bar shows post-award position in current level
6. `is_duplicate` response shows neutral message — no reward animation

Plans:
- [x] 54-01-PLAN.md — Fix Progression type (XpResult), update useGameState mapping
- [x] 54-02-PLAN.md — usePlayerXp hook, XpStrip component
- [x] 54-03-PLAN.md — XpReveal component, LevelUpOverlay component
- [x] 54-04-PLAN.md — Wire GameScreen idle (XpStrip/prompt), Game.tsx priorLevel state
- [x] 54-05-PLAN.md — Update ResultsScreen: integrate XpReveal, LevelUpOverlay, non-Connected prompt

### Phase 55: XP History Panel
**Goal:** Players can review their CTC XP transaction history on the profile page
**Requirements:** XPH-01, XPH-02
**Plans:** 3 plans
**Success criteria:**
1. Profile page has an XP history section listing past game sessions
2. Each entry shows date, XP earned, and game context (score, correct answers)
3. History loads paginated and handles empty state gracefully
4. Panel is only visible to Connected players; hidden for Inform/anonymous

Plans:
- [x] 55-01-PLAN.md — Enrich awardPlatformXp() metadata (score, correctAnswers, collectionSlug)
- [x] 55-02-PLAN.md — Add GET /api/users/profile/xp/history proxy route
- [x] 55-03-PLAN.md — Profile.tsx two-tab layout and XP History panel (frontend)

### Phase 56: Post-v2.0 XP Tech Debt
**Goal:** Close three low-impact tech debt items identified in v2.0 audit
**Plans:** 1 plan
**Gap Closure:** TD-1, TD-2, TD-3 from v2.0-MILESTONE-AUDIT.md
**Success criteria:**
1. `env.ts` logs a startup warning when `TRIVIA_SERVICE_KEY` or `EMPOWERED_ACCOUNTS_API_URL` are absent
2. `isDuplicate` in XP award metadata is set from API response (not placeholder `false`) — or confirmed RPC sources from platform flag
3. XP result persisted beyond Redis TTL so repeated `/results` calls return correct state for Connected players

Plans:
- [ ] 56-01-PLAN.md — env startup validation, isDuplicate two-pass fix, xpResult persistence

- [x] Phase 53: XP Backend Integration (1/1 plans) — completed 2026-03-05
- [x] Phase 54: XP Game UI (5/5 plans) — completed 2026-03-08
- [x] Phase 55: XP History Panel (3/3 plans) — completed 2026-03-08
- [ ] Phase 56: Post-v2.0 XP Tech Debt (0/1 plans) — pending

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
| 56. Post-v2.0 XP Tech Debt | v2.0 | 0/1 | Pending | — |
