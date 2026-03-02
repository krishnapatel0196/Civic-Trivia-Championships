# Civic Trivia Championship

## What This Is

A game-show-style trivia experience that makes civic learning engaging, social, and repeatable. Players answer multiple-choice questions about government, policy, and civic systems while earning rewards and deepening their understanding of democracy. Includes admin tooling for question quality management, content generation, and collection health monitoring. This is the first feature being built for the Empowered.Vote platform.

## Core Value

Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## Requirements

### Validated

- Solo game flow (10 questions, timer, answer reveal, wager, results) — v1.0
- Server-side scoring with speed bonus and wager mechanics — v1.0
- Learning content with "Learn more" modals — v1.0
- XP/gems progression and user profile — v1.0
- Auth system (email/password, JWT, session persistence) — v1.0
- WCAG AA accessibility, keyboard nav, screen reader support — v1.0
- 120 question bank with mixed difficulty — v1.0
- Mobile responsive, FCP <1.5s, TTI <3s, bundle <300KB — v1.0
- Redis session storage with graceful degradation — v1.1
- Plausibility detection with difficulty-adjusted thresholds — v1.1
- Learning content expanded to 27.5% coverage (33/120) — v1.1
- Single-click answer selection, improved game UX — v1.1
- Anonymous play (no login required to play) — v1.1
- PostgreSQL-backed question collections with tag-based associations — v1.2
- Card-based collection picker at game start — v1.2
- Federal, Bloomington IN, and Los Angeles CA collections (320 total questions) — v1.2
- Question expiration system with hourly cron sweep and admin review — v1.2
- AI-powered locale-specific content generation tooling — v1.2
- Codified question quality rules (dinner party test, civic utility, no pure lookup facts) — v1.3
- Audit existing questions against quality rules, archive bad ones, generate replacements — v1.3
- Refined AI generation pipeline with quality rules baked in — v1.3
- Admin web UI for exploring collections, questions, and Learn More content — v1.3
- Question telemetry (encounter/correct counts) with difficulty rates in admin UI — v1.3
- Indiana and California state question collections — v1.3
- Admin question editing with quality re-scoring and optimistic updates — v1.3
- ✓ Fremont, CA question collection (92 questions with sources, expiration dates, learning content) — v1.4
- ✓ Fremont topics (city government, Alameda County, California state, civic history, local services, elections, landmarks, budget/finance) — v1.4
- ✓ Fremont collection card with Mission Peak banner image — v1.4
- ✓ Collection seeded, activated, and playable in production — v1.4
- ✓ In-game flagging with optimistic UI, rate limiting, idempotent storage — v1.5
- ✓ Post-game elaboration with reason chips and free-text feedback — v1.5
- ✓ Admin flag review queue with archive/dismiss/restore actions — v1.5
- ✓ Question explorer flag integration with severity badges and cross-navigation — v1.5
- ✓ AI-powered repair of 107 broken source URLs across 320 questions — v1.5
- ✓ ADMIN_EMAIL environment variable with validation — v1.5

- ✓ Semantic duplicate detection infrastructure (OpenAI embeddings, cosine similarity, union-find clustering) — v1.6
- ✓ 268 duplicates archived across 6 collections via human review workflow with admin UI and undo — v1.6
- ✓ Advanced duplicate detectors: answer leakage, same-source factoid clustering, inverse duplicates — v1.6
- ✓ Self-validating AI generation pipeline: gap analysis → Claude → quality retry → semantic dedup → source diversity — v1.6
- ✓ Indiana (97) and California (91) scaled to 90+ questions; 519 total active questions — v1.6
- ✓ Zero active duplicates and zero quality violations confirmed across all collections — v1.6

- ✓ `election_races` table + `questions.election_race_id` FK; admin race creation UI at `/admin/elections` — v1.7
- ✓ `ElectionQuestionGenerator` service: timezone-aware expiry, idempotency, candidate-count-aware MCQ prompts — v1.7
- ✓ Daily 6 AM Eastern election detection cron: auto-generates questions for races within 60 days, idempotent — v1.7
- ✓ `CurrentTermQuestionGenerator`: admin enters winner + term end → current-term questions with term expiry — v1.7
- ✓ Three-tab `/admin/elections` UI: Active / Pending Generation / Awaiting Follow-up lifecycle management — v1.7
- ✓ Election pipeline hardening: unfiltered admin collections endpoint, jurisdiction DB validation, collectionSlug override — v1.7
- ✓ Norwich, England collection: 117 questions, en-GB locale, two-tier governance rules, playable in production — v1.7
- ✓ `checkAddressPhone` advisory quality rule + audit script for 519 active questions — v1.7

- ✓ Trivia tables migrated to `trivia` schema on shared Supabase (UUID FKs, 14 RLS policies, 953 questions, 7 collections) — v1.8
- ✓ Supabase JWT auth (jose jwtVerify) replacing custom bcrypt/JWT; admin guard via `public.admin_users` table — v1.8
- ✓ Gem awards via `award_gems` RPC (yellow gems, civic_trivia source); player stats in `trivia.player_stats` for Connected tier — v1.8
- ✓ Frontend rewired to Empowered Accounts API — login, signup, logout, token refresh; hybrid token storage — v1.8
- ✓ Profile page rebuilt: trivia stats + gem balance + tier badge + display name from accounts API — v1.8
- ✓ Legacy auth stack fully removed: 9 files deleted, 10 packages removed, users table dropped, custom JWT env vars removed — v1.8
- ✓ Auth state hardened: tierResolved flag, AdminGuard race condition fixed, dead exports removed — v1.8

### Active

*(v1.9 Geographic Expansion — in progress)*

**Infrastructure:**
- DB-driven COLLECTION_HIERARCHY (eliminate hardcoded display-name map in embeddings/types.ts)
- State collection configs registered in standard generator workflow (fix state-configs/ gap)

**Activate banked collections:**
- Fremont, CA collection active and playable in production
- Norwich, England collection active and playable in production

**New collections:**
- ✓ Cambridge, MA — scaffold, generate (125 questions), curate, activate
- Massachusetts State — scaffold, generate (50+ questions), curate, activate
- Plano, TX — scaffold, generate (50+ questions), curate, activate
- Texas State — scaffold, generate (50+ questions), curate, activate

### Out of Scope

- Team/multiplayer mode — Phase 2
- Real-time WebSocket features — Phase 2
- Events/hosted mode — Phase 4
- Question authoring tool — Phase 5
- Leaderboards — research needed, may add later
- OAuth login (Google, GitHub) — email/password sufficient for MVP
- Mobile native app — web-first approach
- Video/image questions — text-only for MVP
- Classroom dashboard — future consideration
- Location-based auto-assignment of collections — need more collections first
- Collection search/browse — not enough collections yet to need search
- Volunteer question authoring portal — AI generation + manual review sufficient for now
- Numeric/date answer questions (Wits & Wagers style) — requires multiplayer first
- Auto-difficulty calibration — collecting telemetry data, calibrate later
- Granular admin permissions (editor, reviewer roles) — boolean is_admin sufficient for now
- Real-time telemetry dashboard — batch/on-demand stats sufficient at current scale

## Context

**Current state (v1.8 shipped 2026-03-01, Phase 49 complete 2026-03-02):**
- 8 collections active: Federal, Bloomington IN, Los Angeles CA, Indiana State, California State, Fremont CA, Norwich UK, Cambridge MA (125 questions) — all on shared Supabase project (kxsdzaojfaibhuzmclfq)
- Identity: Supabase JWT auth (jose jwtVerify), Connected tier guards, `public.admin_users` admin check — all legacy bcrypt/JWT removed
- Gems: `award_gems` RPC (yellow, civic_trivia source); `trivia.player_stats` tracks games/score/accuracy for Connected users
- Frontend: accounts API for auth flows, profile page shows trivia stats + tier badge + gem balance
- Election pipeline: `election_races` table → question generation → daily 6 AM cron → current-term follow-up → admin lifecycle UI
- Quality rules engine with 9 rules; zero active duplicates, zero quality violations across all collections
- Self-validating AI generation pipeline: gap analysis → Claude → quality retry → semantic dedup → source diversity enforcement
- Admin UI: question explorer, collection health, inline editing, flag review queue, duplicate review, election management
- Player-driven quality curation: in-game flagging, post-game elaboration, admin triage
- Gameplay telemetry tracking encounter/correct counts per question
- Live: civic-trivia-frontend.onrender.com / civic-trivia-backend.onrender.com / ctc.empowered.vote

**Tech stack:** React 18, TypeScript, Vite, Tailwind, Framer Motion, Node.js, Express, Supabase (PostgreSQL), Redis (Upstash), jose, Drizzle ORM
- Frontend: ~11,400 LOC TypeScript/React
- Backend: ~26,000 LOC TypeScript/Express (estimated post-v1.8 cleanup)

**Question quality philosophy:**
- "Dinner party test" — would knowing this answer be worth sharing at dinner?
- Civic utility — the knowledge should make you a more informed citizen
- Recall satisfaction — pulling up something you didn't think you knew feels great
- Reasoning possible — you can work toward the answer, not just know it or not
- Anti-patterns: phone numbers, addresses, obscure dates, pure lookup facts with no civic value
- Easy questions are welcome — "Who is your mayor?" feels fair and memorable
- Quality rules codified as TypeScript functions with blocking/advisory severity

**Tech stack:** React 18, TypeScript, Vite, Tailwind, Framer Motion, Node.js, Express, PostgreSQL (Supabase), Redis (Upstash), JWT
- Frontend: ~11,400 LOC TypeScript/React
- Backend: ~15,200 LOC TypeScript/Express
- Live: civic-trivia-frontend.onrender.com / civic-trivia-backend.onrender.com

**Design principles (from design doc):**
1. Play, Not Study — Game show aesthetics, exciting pacing, friendly competition
2. Learn Through Discovery — Questions reveal interesting facts, explanations satisfy curiosity
3. Inclusive Competition — Anyone can play regardless of prior knowledge
4. No Dark Patterns — No daily streaks, loss aversion, or social pressure

**Visual direction:**
- Subtle game show stage aesthetic (curtains, spotlights, modern/clean)
- Empowered.Vote teal + warm accents (red theme for admin areas)
- Typography: Poppins or similar (confident, slightly playful)
- Modest celebrations (subtle confetti, not over-the-top)

**Timer design:**
- Circular progress (like iOS Screen Time)
- Color shifts: Teal → Yellow (50%) → Orange (25%) → Red (final 3s)
- No numeric countdown (reduces anxiety)

**Tone:**
- Never "wrong" — use "not quite"
- Focus on teaching, not judging
- Explanations are neutral, informative (1-3 sentences)
- Sources cited for data-heavy facts

**Reference doc:** `civic-trivia-championship-complete.md` contains full screen specs, interaction patterns, and detailed guidelines.

## Constraints

- **Tech stack**: React 18+, TypeScript, Vite, Tailwind, Framer Motion, Node.js, Express, Supabase (PostgreSQL), Redis (Upstash), jose, Drizzle ORM
- **Performance**: FCP <1.5s, TTI <3s, bundle <300KB gzipped
- **Accessibility**: WCAG AA compliance required
- **Content**: 953 active questions across 7 collections (zero duplicates, zero quality violations), all source URLs validated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Email/password auth only for MVP | Reduces complexity, OAuth can be added later | Good — sufficient for current usage |
| No leaderboards initially | Could discourage low-performers, needs research | Good — revisit if user demand |
| Visual timer (no digits) | Reduces anxiety while maintaining urgency | Good — positive feedback |
| "Not quite" instead of "Wrong" | Maintains encouraging tone | Good — matches brand tone |
| Tag-based collections over rigid categories | Questions can belong to multiple collections (e.g., Indiana + Bloomington) | Good — enabled clean multi-collection system |
| Quality over quantity for local sets | 50 compelling questions beats 100 half-compelling; target ~120 but don't force it | Good — 100 per locale with strong quality |
| AI-generated + human-reviewed content | AI kickstarts local question banks, volunteers refine over time | Good — efficient pipeline |
| Auto-remove + notify on expiration | Time-sensitive questions drop from rotation and flag for review | Good — admin review UI in place |
| Codify quality rules before scaling content | Phone number questions revealed need for explicit quality criteria | Good — 8 rules with blocking/advisory severity |
| Lightweight telemetry over complex analytics | Two columns (encounter_count, correct_count) give 80% of value | Good — simple and effective |
| Boolean is_admin over roles table | Only a few admins needed; RBAC adds unnecessary complexity | Good — simple and sufficient |
| Red admin theme vs teal player theme | Clear visual separation between admin and player experiences | Good — instantly distinguishable |
| Quality score informational, blocking flag actionable | Score (0-100) for sorting/display, hasBlockingViolations for archival decisions | Good — separates severity levels |
| URL validation deferred for legacy content | All 320 original questions have broken source.url links from CMS migration | Debt — needs dedicated URL update pass |
| State template 40/30/30 topic distribution | Government/civic processes/broader civics avoids "too bureaucratic" feel | Good — balanced content |
| Stable option IDs for drag-and-drop | Options tracked by opt-0/opt-1 ID, not array index, so correct answer follows during reorder | Good — prevents correctAnswer drift |
| History + culture heavy distribution for Fremont | Civic-history=20, landmarks-culture=18 (38% total) honors Fremont's unique consolidation story | Good — distinctive content |
| Overshoot-and-curate generation strategy | Generate 130%, curate to target — provides quality buffer for topic balancing | Good — 92 curated from 123 |
| Cultural sensitivity framework in prompts | Ohlone present-tense, Afghan-American heritage focus, Tesla civic-only, Mission San Jose disambiguation | Good — human spot-check approved |
| Quality guidelines in all locale system prompts | Embed Phase 21 quality rules in generation prompts to reduce validation retries | Good — benefits all future generation |
| Status-filtered question exports | Export only active questions, not drafts — applied to all collections | Good — data integrity improvement |
| Accept 92 questions (below 95 target) | Quality over quantity, all 8 topics represented with minimum 10 each | Good — within acceptable range |
| Fail-open rate limiting on Redis errors | Rate limiting is abuse prevention not security; allow users through if Redis down | Good — availability preserved |
| Denormalize flag_count on questions table | Avoid COUNT(*) aggregation queries on every question fetch | Good — efficient sorting/filtering |
| No rate limiter on batch elaboration | Infrequent post-game action, not an abuse vector | Good — simplicity |
| Equal Skip/Submit button weight | No dark pattern pushing Submit; respect user choice equally | Good — matches brand principles |
| Elaboration after results, not before | User-directed: flag on results screen, elaborate when leaving | Good — better UX flow |
| pendingAction pattern for navigation intercept | Capture Play Again/Home intent, show elaboration, then execute | Good — clean flow control |
| Custom undo toast over Sonner library | 50-line hook avoids 3KB dependency for single use case | Good — minimal bundle impact |
| Hard delete flags on dismiss | Simpler than soft delete; no audit trail needed for dismissed flags | Good — simplicity |
| AI URL suggestions limited to .gov/.edu/civic orgs | Authoritative sources only for civic content | Good — source quality |
| Null source URL for unrepairable links | Better than displaying broken "Learn More" link to users | Good — clean UX |
| text-embedding-3-small for semantic dedup | Balances cost ($0.02/1M tokens) with 1536-dimensional accuracy sufficient for question similarity | Good — effective detection |
| Disk-based embedding cache (.embedding-cache/) | Avoid redundant API calls across scan runs; embeddings stable for unchanged question text | Good — cost and speed |
| Union-find clustering for duplicates | Handles transitive groupings (A≈B, B≈C → one cluster) with O(α(n)) amortized complexity | Good — correct groupings |
| Federal > State > City hierarchy policy | Cross-collection duplicates resolved by keeping the question in the more general collection | Good — consistent curation |
| Human review required for duplicate archival | Educational content curation requires human judgment — auto-resolve at 0.90 threshold only | Good — content quality |
| Accept source exhaustion as collection ceiling | LA/Bloomington/Fremont sources dry after 5+ generation rounds — accepted shortfalls, not endless retries | Good — avoids quality degradation |
| Archive higher-numbered externalId on conflict | Preserves established question IDs with potential user history; discards newly-generated duplicates | Good — data integrity |
| Serial generation (not concurrent) | Reliability over speed for question generation — avoids race conditions in dedup checks | Good — correctness |
| Admin-entered race data for v1.7 (no scrapers) | No reliable free API for US local elections; scraping fragile; admin entry achieves same result | Good — practical for launch |
| `claude-sonnet-4-6` hardcoded in ElectionQuestionGenerator | MODEL constant in anthropic-client.ts was outdated at claude-sonnet-4-5; direct string avoids accidental regression | Good — correct model used |
| Collection slug explicit (not derived from jurisdiction) | String-matching jurisdictions to slugs is fragile; explicit slug parameter is precise and safe | Good — avoids silent mismatches |
| `GenerationBlockedError` as idempotent skip in cron | Running cron twice for same race is expected — treating it as failure would cause false alerts | Good — clean cron semantics |
| `lastCronRun` in-memory module state | Admin banner needs cron status without DB round-trip; module-level let is simple and low-latency | Good — minimal complexity |
| Advisory severity for address/phone rule | Legitimate civic questions can reference addresses; flag for human review, not auto-archive | Good — avoids false positives |
| `election_race_id` as direct FK on questions | Each election question belongs to exactly one race; junction table adds unnecessary complexity | Good — simpler model |
| `checkAddressPhone` scans options only | Question.text and explanation legitimately reference addresses; options contain the answer | Good — correct targeting |
| en-GB localeCode for Norwich | First non-US collection; establishes pattern for future international collections | Good — correct locale treatment |
| Two-tier governance in Norwich voice guidance | City vs County Council attribution encoded as critical accuracy requirement | Good — prevents misattribution |
| DDL applied directly via pg client for election schema | drizzle-kit push requires TTY for create-vs-rename prompt; pg client is safe and non-destructive | Good — unblocked without workaround harm |
| Follow-up questions have `expiresAt = NULL` | "Who won?" is permanent historic fact — time-limiting it would silently hide civic history | Good — correct semantics |
| Jurisdiction validation at runtime (no FK) | DB lookup against `collections.name` gives informative 400; FK would give opaque constraint error | Good — better error UX |
| collectionSlug override with optional chaining | `req.body` may be undefined when frontend sends no body; `?.collectionSlug` prevents TypeError | Good — defensive practice |
| Supabase JWT auth (jose jwtVerify) over custom middleware | Aligns with Empowered Accounts integration guide; SUPABASE_JWT_SECRET verified once per app start | Good — accounts alignment |
| `admin_users` table lookup for admin check | Typed in database.types.ts; `user_roles` join was untyped — table approach is simpler and type-safe | Good — correct and typed |
| `award_gems` RPC with `p_gem_type: 'yellow'` | Platform-level gem ledger; `civic_trivia` source enables per-app tracking on accounts platform | Good — correct RPC params |
| Connected tier check at award time (not session start) | `checkAccountContext` fires at session start; tier gate applied at game result — separation of concerns | Good — clean architecture |
| `tierResolved` flag in authStore | Prevents AdminGuard rendering before authoritative tier arrives from accounts API; all 4 AuthInitializer exits set it | Good — fixes race condition |
| `requireConnected` removed from Express | Frontend handles tier gates; no Express route gated on Connected tier in trivia app | Good — correct removal |
| `storageFactory.getRawClient()` for rate limiter | Rate limiter reuses the factory's Redis connection rather than importing a deleted legacyRedis export | Good — clean architecture |
| Token refresh uses Supabase native `/auth/v1/token` | No custom `/api/auth/refresh` route documented in integration guide; direct Supabase endpoint is correct | Good — platform alignment |
| `setAuth` sets `tierResolved: true` | Fixes admin access after expired-session re-login — login flow establishes complete auth state | Good — closes medium-severity gap |
| Migration history repair via `supabase migration repair` | 24 pre-existing remote entries cleared before pushing new trivia schema; safe and correct approach | Good — migration hygiene |

---
*Last updated: 2026-03-01 after v1.9 milestone start*
