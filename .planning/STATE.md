# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.0 XP Integration

## Current Position

Phase: 56 of v2.0 (56-post-v2-xp-tech-debt)
Plan: 1 of 1 in phase
Status: Phase complete
Last activity: 2026-03-08 — Completed 56-01 (Post-v2.0 XP tech debt); Phase 56 fully shipped

Progress: [██████████] v1.0–v1.9 complete (Phases 1–52) | 12 collections live | v2.0 in progress (54/54+ in progress)

**Milestone history:**
- v1.0–v1.9 (Phases 1–52): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (11 + Federal = 12 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key decisions relevant to v2.0 (from v1.9):
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

**52-01 decisions:**
- texasStateConfig.name is 'Texas' (not 'Texas State') — matches state collection display pattern
- targetQuestions: 70 with overshootFactor: 1.3 — generates 91 candidates for curation to 70
- Mixed-durability pattern (FIRST collection): texasStateFeatures instructs both expiring (expiresAt) and durable (null) questions; no fixed ratio
- expiresAt: "2027-01-19T00:00:00Z" for all current-officeholder questions (November 2026 election)
- Comptroller caution: Glenn Hegar resigned February 2025; Kelly Hancock acting — voice guidance focuses on role/powers, not current name
- 8 topic categories: state-legislature(14), governor-executive(12), distinctive-institutions(10), texas-history-identity(12), state-judiciary(6), texas-constitution(6), civic-landmarks(5), public-policy(5)
- Scaffold Bug 2 confirmed again: step3 inserts into type annotation line — reverted to HEAD; state auto-discovery handles registration
- Import path in state-configs/ must be '../bloomington-in.js' (parent directory traversal required)

**52-02 decisions:**
- ERCOT cluster reduced to 3 best questions from 12: tex-019 (90% electric load), tex-082 (55,000 miles transmission), tex-091 (TX grid uniqueness vs US grids)
- State-only rule strictly applied: Port Isabel Lighthouse, Presidio La Bahia, Casa Navarro, French Legation, Fulton Mansion archived as city/regional sites
- Washington-on-the-Brazos and San Jacinto Battleground kept — statewide historical events, not city-specific
- tex-023 expiresAt corrected to NULL — 89th Legislature convened date is historical fact, not expiring officeholder data
- Final set: 93 generated → 33 archived → 60 net (57 durable, 3 expiring: Abbott, Paxton, Burrows)
- Near-duplicate detection gap persists: 17 semantic near-dups required manual pass (same pattern as city collections)

**53-01 decisions:**
- EMPOWERED_ACCOUNTS_API_URL is distinct from EMPOWERED_ACCOUNTS_URL — kept separate for independent configuration; existing EMPOWERED_ACCOUNTS_URL is used by checkAccountContext() and must not be renamed
- Idempotency key = ctc-game-{sessionId}-{userId} — sessionId is already server-generated randomUUID, serves as game identifier for XP deduplication without additional field
- is_duplicate: true from XP API treated as success — xpResult.confirmed=true, isDuplicate=true; no error, no retry
- XP award ordered before upsertPlayerStats — follows same pattern as gems (award platform resource first, then record local stats)
- awardPlatformXp() mirrors awardPlatformGems() pattern exactly: withRetry, never throws, returns result object

**54-01 decisions:**
- XpResult fields are all optional (except confirmed) — partial API responses remain valid; xp award may fail partially
- apiRequest<{ progression: any }> intentionally uses any to accept snake_case raw API shape before mapping
- gemsConfirmed: boolean added to Progression to track gem award confirmation (maps from raw.gemsConfirmed)
- xpMotionValue animates to xp?.amount ?? 0 — amount is per-game XP awarded (not cumulative totalXp)

**54-02 decisions:**
- 404 from /api/xp/:userId = not Connected (isConnected: false) — not an error; normal path for non-linked users
- No Authorization header on XP fetch — endpoint is public
- XP fraction math: xpNeeded = xpInLevel + xpToNextLevel; display is "xpInLevel / xpNeeded XP"
- XpStrip returns null when xpData is null — parent needs no conditional logic

**54-03 decisions:**
- Progress bar math: xpNeeded = xpInLevel + xpToNextLevel; progressPercent = xpInLevel / xpNeeded * 100
- LevelUpOverlay calls onDismiss after 300ms exit animation delay (reducedMotion: 0ms) to avoid flash
- XpIcon (existing SVG lightning bolt) used — no emoji fallback needed
- bg-cyan-500 progress bar fill, text-cyan-400 XP amount — consistent with XpStrip Plan 02 colors
- z-50 for LevelUpOverlay (higher than CelebrationEffects z-40) — renders on top of all overlays

**54-04 decisions:**
- isConnectedTier local var (not selector) — tier check runs inline before usePlayerXp call
- priorLevel useEffect guards with priorLevel === null — only sets once; Plan 05 resets via onLevelCaptured
- Non-Connected prompt hidden while isXpLoading is true — avoids flash of prompt before fetch resolves
- onLevelCaptured typed as any pending Plan 05 ResultsScreen interface update — expected TS error

**55-01 decisions:**
- isDuplicate: false at call time — actual duplicate status comes back in API response (session.xpResult.isDuplicate); history display should read is_duplicate from the transaction record itself, not our metadata field
- metadata parameter is optional — zero-arg callers compile without changes, no existing other callers to update
- collectionSlug fallback to 'federal-civics' in metadata mirrors the same fallback already used in results response body

**55-02 decisions:**
- EMPOWERED_ACCOUNTS_URL (not EMPOWERED_ACCOUNTS_API_URL) — user-JWT path, same as checkAccountContext()
- req.accessToken forwarded as Bearer — set by requireAuth middleware already applied at router level
- metadata fields use safe cast with null fallback — transactions without enriched metadata return null (not undefined) for consistent frontend handling
- is_duplicate used from transaction record directly — platform stores this from idempotency check, not from our metadata field
- pageSize fixed at 20 — not configurable via query param
- POST-CHECKPOINT FIX (ad2108f): Accounts API proxy replaced with direct Supabase RPC call to get_ctc_xp_history() SECURITY DEFINER function — connect schema not exposed via PostgREST; SECURITY DEFINER function is the correct pattern for cross-schema access from CTC backend

**55-03 decisions:**
- Tab bar renders only when tierResolved && isConnected — prevents flash of tab chrome before account fetch resolves
- heroSection always visible regardless of active tab — XP/gem totals stay anchored at top for Connected players
- formatDate() module-level function (no library) — relative within 7 days, absolute beyond
- Non-Connected players rendered via early return before tab state — zero structural impact on existing layout path

**56-01 decisions:**
- console.warn not process.exit for missing XP env vars — local dev must start cleanly without these vars set
- Underscore-prefixed _requiredForXp and _missing to avoid linter unused-var warnings in module scope
- saveSession optional ttlSeconds defaults to 3600 — all existing callers unchanged
- 86400s TTL only on post-award save — submitAnswer and adaptive-state saves keep 1h default
- isDuplicate removed from metadata input; XpAwardResult.isDuplicate (return type) preserved

### Pending Todos


### v2.0 Backlog (collection quality)

- [ ] **Enforce 15–30% expiring question ratio** — add `targetExpiringRatio` to `LocaleConfig`, check ratio in `audit-collection-readiness.ts`, warn during curation if below threshold
- [ ] **Auto-regenerate expired questions** — extend `expirationSweep.ts` to detect collections below minimum active count after expiry, trigger the generation pipeline for that collection, and queue output for human review

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |
| 024 | Responsive game UI layout — no scrolling to see answers or timer | 2026-03-03 | [024-game-ui-responsive-layout-fixes](./quick/024-game-ui-responsive-layout-fixes/) |

## Session Continuity

Last session: 2026-03-08
Stopped at: Completed 56-01 — Post-v2.0 XP tech debt; Phase 56 fully complete
Resume file: None

Next action: v2.0 milestone complete — all phases 53–56 shipped; ready for next planning cycle
