# Project Milestones: Civic Trivia Championship

## v1.9 Geographic Expansion (Shipped: 2026-03-03)

**Delivered:** Expanded the playable collection set from 7 to 11 by activating two banked collections (Fremont CA, Norwich UK), launching four net-new collections (Cambridge MA, Massachusetts, Plano TX, Texas), and replacing all hardcoded collection infrastructure with a DB-driven, auto-discovery architecture.

**Phases completed:** 47–52 (16 plans total)

**Key accomplishments:**

- Eliminated hardcoded infrastructure debt: `COLLECTION_HIERARCHY` replaced with runtime DB tier lookups; state configs auto-discovered from `locale-configs/state-configs/` — zero hardcoded maps, all 12 collections work uniformly
- Activated two banked collections: Fremont CA (54 questions) and Norwich England (117 questions) with reusable `audit-collection-readiness.ts` + `verify-post-activation.ts` standardizing the activation workflow
- Launched Cambridge MA: 125 questions covering Plan E city manager governance, PR voting history, research-corrected civic facts (living wage May 1999, Richardsonian Romanesque City Hall), Harvard/MIT strict limits
- Launched Massachusetts State: 90 questions covering General Court, Governor's Council (8 dedicated — one of MA's most surprising civic facts), 1780 Constitution — Massachusetts State House gold dome banner
- Launched Plano TX: 85 questions covering Balloon Capital of Texas designation, Collin County context, corporate civic history (Frito-Lay, JCPenney, Toyota) — hot air balloon festival banner
- Launched Texas State: 60 curated questions (57 durable + 3 expiring) — biennial legislature, Railroad Commission, two courts of last resort, plural executive; established the **mixed-durability pattern** for future collections

**Stats:**

- ~125 files created/modified (~12,000 insertions)
- ~39,500 lines of TypeScript total (frontend + backend)
- 6 phases, 16 plans
- 2 days from first phase to ship (2026-03-01 → 2026-03-03)

**Git range:** `feat(47-01)` → `feat(52-03)` → `chore(audit): v1.9`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.8 Empowered Identity (Shipped: 2026-03-01)

**Delivered:** Replaced the custom auth/gem/admin stack with the shared Empowered Accounts platform — Supabase JWT identity, Connected tier guards, shared gem ledger via award_gems RPC, platform admin roles, and full removal of all legacy local auth infrastructure.

**Phases completed:** 40–46 (16 plans total)

**Key accomplishments:**

- Migrated all trivia tables to `trivia` schema on shared Supabase (kxsdzaojfaibhuzmclfq) — UUID FKs, 14 RLS policies, 953 questions, 7 collections, TypeScript types regenerated
- Replaced custom bcrypt/JWT auth with Supabase JWT verification (jose jwtVerify); admin guard via `public.admin_users` table lookup
- Wired gem awards through `award_gems` RPC (yellow gems, civic_trivia source); player stats in `trivia.player_stats` for Connected-tier users only; suspended accounts blocked
- Rewrote frontend auth for Empowered Accounts API — login, signup, logout, token refresh via Supabase native endpoint; hybrid access/refresh token storage
- Rebuilt profile page with trivia stats + accounts-sourced gem balance, tier badge, display name; identity management links out to accounts platform
- Fully removed legacy auth stack: 9 files deleted, 10 packages removed, users table dropped, custom JWT env vars removed, Redis token blacklist removed
- Hardened auth state with `tierResolved` flag in authStore — fixed AdminGuard race condition and admin access after expired-session re-login; dead exports (authenticateToken, requireConnected) removed

**Stats:**

- 106 files created/modified (14,012 insertions, 2,745 deletions)
- ~37,549 lines of TypeScript total (frontend + backend)
- 7 phases, 16 plans, 39 requirements delivered
- 2 days from start to ship (2026-02-28 → 2026-03-01)

**Git range:** `4be18d1` (docs(40): research) → `bb05597` (docs(46): complete)

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.7 Live Civic Intelligence (Shipped: 2026-02-27)

**Delivered:** End-to-end election question pipeline with admin race management, daily auto-detection cron, current-term follow-up generation, plus Norwich England as the platform's first non-US collection and an address/phone advisory quality rule.

**Phases completed:** 35-39 (10 plans total)

**Key accomplishments:**

- Election pipeline foundation: `election_races` PostgreSQL table (11 columns, JSONB candidates), `questions.election_race_id` FK, admin race creation UI at `/admin/elections` with dynamic candidate management
- `ElectionQuestionGenerator` service: timezone-aware expiry via `Intl.DateTimeFormat` noon-anchor (DST-safe), idempotency via `questionsGenerated` flag, `GenerationBlockedError`, candidate-count-aware MCQ prompts
- Daily 6 AM Eastern election detection cron auto-generates questions for races within 60 days; `GenerationBlockedError` treated as idempotent skip; structured JSON logging with `lastCronRun` in-memory state
- Full election lifecycle admin UI: three-tab `/admin/elections` (Active / Pending / Awaiting Follow-up); `CurrentTermQuestionGenerator` triggered by winner + term end date entry; re-generate archives old questions before creating new
- Phase 39 pipeline hardening: unfiltered `GET /api/admin/collections` (no 50-question floor), jurisdiction DB validation on race creation (400 on mismatch), `collectionSlug` override on `/regenerate`
- Norwich, England collection: platform's first non-US collection (en-GB), 117 questions across 8 topic categories, two-tier governance accuracy rules (City Council vs Norfolk County Council), deep forest green card
- `checkAddressPhone` advisory quality rule with 3 regex patterns; audit script for all active questions; QUAL-04 awaits admin manual review of flagged questions

**Stats:**

- 51+ files created/modified (56 commits)
- ~35,771 lines of TypeScript total (cumulative: ~11,400 frontend + ~24,370 backend)
- 5 phases, 10 plans, 27 requirements (25 satisfied, 1 partial, 1 pending-by-design)
- 3 days from start to ship (2026-02-25 → 2026-02-27)

**Git range:** `feat(36-02)` → `docs(39)`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.6 Content Quality & Scale (Shipped: 2026-02-24)

**Delivered:** Semantic deduplication infrastructure and AI content scaling — 268 duplicate questions identified and archived across 6 collections, self-validating generation pipeline built, Indiana and California scaled to 90+ questions, zero active duplicates confirmed across all 519 questions.

**Phases completed:** 31-34 (13 plans total)

**Key accomplishments:**

- Semantic dedup infrastructure: OpenAI text-embedding-3-small service with disk-based cache, cosine similarity with tiered thresholds (exact/near-duplicate/possible), union-find clustering for transitive grouping
- 268 duplicates identified and archived via admin review UI at /admin/duplicates with cluster cards, auto-resolve, and 30-second undo
- Advanced duplicate detectors: answer leakage (one question reveals another's answer), same-source factoid clustering, inverse duplicates (complementary question pairs)
- Self-validating generation pipeline: gap analysis → Claude → quality retry loop → semantic dedup gate → source diversity enforcement → JSON output
- Indiana (97 active) and California (91 active) scaled past 90-question target; LA/Bloomington/Fremont confirmed source-exhausted at maximum achievable counts
- Zero active duplicates and zero quality violations across all 519 active questions (verify-phase34-final.ts exits 0)

**Stats:**

- 89 files created/modified (19,798 insertions, 2,700 deletions)
- ~32,033 lines of TypeScript (19,674 backend + 12,359 frontend)
- 4 phases, 13 plans, 18 requirements delivered
- 2 days from start to ship (2026-02-22 → 2026-02-24)

**Git range:** `chore(31-01)` → `fix: add missing duplicate.ts rule to fix build`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.5 Feedback Marks (Shipped: 2026-02-22)

**Delivered:** Player-driven quality curation system — in-game flagging with post-game elaboration, admin flag review queue with archive/dismiss/restore actions, question explorer flag integration, and AI-powered repair of 107 broken source URLs.

**Phases completed:** 27-30 (11 plans total)

**Key accomplishments:**
- In-game flagging with optimistic UI, rate limiting (10/15min), and idempotent storage for authenticated players
- Post-game elaboration flow with reason chips and free-text feedback, batch submitted after results review
- Admin flag review queue with Active/Archived tabs, sortable flag counts, archive/dismiss/restore with undo toast
- Question explorer flag integration with severity badges, flagged filter, and bidirectional cross-navigation
- AI-powered broken link repair tool fixed 107 broken source URLs across 320 original questions
- ADMIN_EMAIL environment variable with validation for production admin configuration

**Stats:**
- 61 files created/modified (10,038 insertions, 152 deletions)
- ~26,576 lines of TypeScript (cumulative: 11,418 frontend + 15,158 backend)
- 4 phases, 11 plans, 23 requirements delivered
- 2 days from start to ship (2026-02-21 → 2026-02-22)

**Git range:** `feat(27-01)` → `feat(30-04)`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.4 Fremont, CA Collection (Shipped: 2026-02-21)

**Delivered:** Fremont, CA community collection with 92 culturally-validated questions, enhanced AI generation pipeline with quality validation retry loop, and comprehensive production verification.

**Phases completed:** 23-26 (6 plans total)

**Key accomplishments:**
- Fremont, CA collection with 92 questions across 8 topic categories (city gov, county, state, civic history, services, elections, landmarks, budget)
- Enhanced AI generation pipeline with overshoot-and-curate strategy, quality validation retry loop, and cultural sensitivity framework
- Human-reviewed content for Ohlone, Afghan-American, Tesla/NUMMI, and Mission San Jose sensitivity
- Status-filtered question exports benefiting all collections
- Mission Peak banner image and full seed-to-production deployment
- Comprehensive production verification script with all 7 criteria passing

**Stats:**
- 53 files created/modified
- ~24,700 lines of TypeScript (cumulative)
- 4 phases, 6 plans, 19 requirements delivered
- 2 days from start to ship (2026-02-20 → 2026-02-21)

**Git range:** `feat(23-01)` → `feat(26-01)`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.3 Question Quality & Admin Tools (Shipped: 2026-02-20)

**Delivered:** Quality framework and admin tooling to scale question collections — codified quality rules, audited and improved existing content, built admin exploration and editing UI, enhanced AI generation pipeline, and added Indiana and California state collections.

**Phases completed:** 18-22 (17 plans total)

**Key accomplishments:**
- Built quality rules engine with 8 rules, blocking/advisory severity, and 0-100 scoring
- Audited all 320 questions, archived 9 failing blocking rules, generated 38 replacements
- Created admin UI with question explorer, detail panel, collection health dashboard, and inline editing
- Developed quality-gated AI generation pipeline with retry-and-feedback loop
- Added state-level generation template and produced Indiana (100) and California (98) collections
- Expanded content to 547 playable questions across 5 collections

**Stats:**
- 109 files created/modified
- ~20,000 lines of TypeScript (cumulative)
- 5 phases, 17 plans, 23 requirements delivered
- 2 days from start to ship (2026-02-19 → 2026-02-20)

**Git range:** `docs(18)` → `docs(22)`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.2 Community Collections (Shipped: 2026-02-19)

**Delivered:** Multi-collection trivia system with community-specific question banks for Bloomington IN and Los Angeles CA, plus question expiration and admin review tools.

**Phases completed:** 13-17 (15 plans total)

**Key accomplishments:**
- Migrated question data from JSON to PostgreSQL with full relational schema
- Built QuestionService for collection-scoped, difficulty-balanced question selection
- Implemented card-based collection picker with end-to-end game flow wiring
- Added question expiration system with hourly cron sweep and admin review UI
- Generated 200 community questions via AI + human review pipeline
- Deployed 320 playable questions across 3 collections to production

**Stats:**
- 76 files created/modified
- 11,588 lines of TypeScript added
- 5 phases, 15 plans
- 2 days from start to ship (2026-02-18 → 2026-02-19)

**Git range:** `docs(13)` → `fix(17)`

**What's next:** TBD — start with `/gsd:new-milestone`

---

## v1.1 Production Hardening (Shipped: 2026-02-18)

**Delivered:** Tech debt cleanup — Redis sessions, game UX improvements, plausibility detection, and learning content expansion.

**Phases completed:** 8-12 (11 plans total)

**Key accomplishments:**
- Fixed dev tooling and completed v1.0 documentation gaps
- Migrated game sessions to Redis with graceful fallback
- Single-click answer selection and improved visual hierarchy
- Difficulty-adjusted plausibility detection with speed bonus penalties
- Learning content expanded from 15% to 27.5% coverage

**Stats:**
- 5 phases, 11 plans, 12 requirements delivered

**Git range:** `feat(08)` → `feat(12)`

---

## v1.0 MVP (Shipped: 2026-02-13)

**Delivered:** Complete solo trivia game with authentication, 10-question game flow, server-side scoring, learning content, XP/gems progression, wager mechanics, and WCAG AA accessibility.

**Phases completed:** 1-7 (26 plans total)

**Key accomplishments:**
- Full auth system (email/password, JWT, session persistence)
- Game show-style trivia flow with timer, answer reveal, and explanations
- Server-side scoring with speed bonus and wager mechanics
- XP/gems progression system with user profiles
- 120 civic trivia questions with mixed difficulty
- WCAG AA accessibility, keyboard navigation, screen reader support

**Stats:**
- 7 phases, 26 plans, 50 requirements delivered

**Git range:** `feat(01)` → `feat(07)`

---
