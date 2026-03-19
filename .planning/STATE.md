# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.3 UX & Rewards Polish — COMPLETE (Phases 69–71 all shipped 2026-03-19)

## Current Position

Phase: 71 — Leaderboard Cache Fix
Plan: 01 of 01 — complete
Status: Phase complete — milestone v2.3 complete
Last activity: 2026-03-19 — Completed 71-01-PLAN.md (CACHE_TTL 300s → 60s, human-verified in production)

Progress: [██████████] v1.0–v2.3 complete (Phases 1–71)

**Milestone history:**
- v1.0–v2.2 (Phases 1–68): All Complete — see .planning/MILESTONES.md

**v2.3 phase status:**
- Phase 69: Game Flow Buttons — COMPLETE (2026-03-19)
- Phase 70: Gem Scoring & Wager Preview — COMPLETE (2026-03-19, all 3 plans)
- Phase 71: Leaderboard Cache Fix — COMPLETE (2026-03-19)

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (18 total): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC, Biloxi MS, Mississippi, Santa Monica CA

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

v2.2 decisions archived to PROJECT.md. Key decisions from v2.2 milestone (2026-03-14 → 2026-03-18):
- Tagline shortened to "Where Route 66 meets the Pacific." — punchy declaration over verbose rhetorical question
- Banner iterated 3x: night shot (too dark) → daytime pier → sunset pier + ferris wheel (final, user-selected)
- Santa Monica activated as 18th collection (77 questions, isActive: true); v2.3 content milestone complete

Key decisions from Phase 70 Plan 03 (2026-03-19):
- GEM_SCORE_THRESHOLD duplicated as local const in ResultsScreen (not imported) -- frontend cannot import from backend; value replication is intentional
- 0-gem message renders inside result.progression block -- anonymous users never see gem messaging
- Tooltip positioned bottom: -12px below TOTAL POINTS label -- avoids overlap with animated counter
- Existing gemsEarned > 0 display (1-gem and 2-gem) left unchanged -- plan specified no changes to those paths

Key decisions from Phase 70 Plan 02 (2026-03-19):
- GEM_SCORE_THRESHOLD local constant (not imported from backend) in WagerScreen — frontend standalone, manually kept in sync with progressionService.ts
- Gem indicator uses motion.div animate for color/opacity — simpler than variants for a one-off threshold transition
- Tooltip on score number triggered on both click and hover — covers mobile tap and desktop hover

Key decisions from Phase 70 Plan 01 (2026-03-19):
- GEM_SCORE_THRESHOLD = 1000 exported from progressionService.ts — wager preview UI (Phase 70-02) imports same constant
- Perfect game (8/8) checked before score threshold — preserves 2-gem award for flawless play even at low scores
- Score-based gem rule: finalScore >= 1000 earns 1 gem; replaces accuracy-based >= totalQuestions-2 rule

Key decisions from Phase 68 Plan 01 (2026-03-18):
- Expiring ratio 5.2% for Santa Monica (below 15–30% target) — AI places officeholder names as answer options, not in question text; name-match seeder can't find them; documented for playbook retrospective, not re-generated
- 77 questions retained after curation (107 draft → 30 archived for SM/LA conflation and low quality)
- Banner: Santa Monica Pier photo (285KB, Wikimedia Commons) — pier is the canonical local landmark

Key decisions from Phase 67 Plan 03 (2026-03-17):
- StickyYou rendered as page-bottom section (not position:sticky) — 25-row list has no scroll container; avoids sticky parent issues
- Privacy-by-default: other users' display names blanked on leaderboard; only authenticated user's own name shown; plain circle replaces ? avatar
- LEADERBOARD added to Header for both auth states: authenticated hamburger dropdown (between PROFILE and LOG OUT), unauthenticated nav link cluster
- Podium layout: 2nd-1st-3rd flex order, center card elevated via marginTop offset, Framer Motion stagger with useReducedMotion respect

Key decisions from Phase 67 Plan 02 (2026-03-17):
- useRef (not useState) for per-tab leaderboard cache — avoids re-render on cache write; cache lives for component lifetime
- refetchTick counter in useEffect deps enables forced refetch without resetting cache state
- API_URL (VITE_API_URL = CTC backend) used for leaderboard fetch, not ACCOUNTS_API_URL — consistent with Plan 01
- Top-3 entries rendered as plain LeaderboardRow until Plan 03 replaces with podium component

Key decisions from Phase 67 Plan 01 (2026-03-17):
- Direct supabaseAdmin.schema('connect').from() access works — no SECURITY DEFINER function needed for connect schema tables
- Leaderboard cache uses storageFactory.getRawClient() (raw Redis) + module-level Map fallback — SessionStorage abstraction is typed for GameSession, cannot store arbitrary strings
- Tier derived from connect.connected_profiles.verification_status: 'verified' → 'connected', else 'inform' (empowered not distinguishable from DB alone)
- This-week XP aggregated in JS after fetching xp_transactions for rolling 7 days (Supabase JS client has no GROUP BY)
- Cache keys: entries shared (leaderboard:entries:{tab}), rank personalized (leaderboard:rank:{tab}:{userId})
- connect.connected_profiles confirmed as XP source: user_id, display_name, total_xp, current_level, verification_status
- connect.xp_transactions confirmed as weekly XP source: user_id, amount, created_at

Key decisions from Phase 66 Plan 01 (2026-03-15):
- awardPlatformGems uses plain try/catch (no withRetry) — contrast with awardPlatformXp which retries 3x
- TRIVIA_GEMS_KEY is a separate scoped key (not TRIVIA_SERVICE_KEY) — scope ["yellow"] configured on accounts side
- gemType hardcoded to 'yellow' — not caller-configurable
- Warning-only startup validation for TRIVIA_GEMS_KEY — server boots without it, awards fail gracefully at runtime
- connect.credit_gems Supabase RPC fully removed from TypeScript (DB function itself untouched)

Key decisions relevant to v2.2 (from ONBOARDING-CTC.md):
- Gem award migration (GEMS-01): `connect.credit_gems` direct RPC deprecated; new endpoint is `POST /api/gems/award` with `TRIVIA_GEMS_KEY`; key scope ["yellow"] configured on accounts side by Chris — COMPLETED in Phase 66
- Leaderboard data source (LEAD-01): `GET /api/account/profile/:userId` on accounts API — no auth required, returns username/tier/level/total_xp; no gems or sensitive data
- Accounts URL: ONBOARDING-CTC.md uses `ACCOUNTS_URL` (= `https://ev-accounts-api.onrender.com`); CTC currently uses `EMPOWERED_ACCOUNTS_API_URL` — verify alignment before Phase 66
- `xp_in_level` and `xp_to_next_level` returned by `GET /api/account/me` — use directly, no need to recompute thresholds client-side

Key decisions relevant to v2.2 (from prior milestones):
- Scaffold Bug 2 (FIXED in Phase 63): brace scanner now starts from ` = {` assignment, not type annotation — no post-scaffold git checkout needed
- State officeholder gap (62-02): Speaker Pro Tem consistently missed — must be listed by name in locale config; structured officeholders field (Phase 64) is the systemic fix
- Large council officeholder budget (61-02): 7-ward council needs 2q/ward + 4q/mayor to hit 15% expiring; structured officeholders field removes need for manual targeted pass
- Auto-regenerate expired questions deferred from v2.1 — Phase 65 scope; mirrors awardPlatformXp never-throw pattern
- Mixed-durability pattern established (Texas State): expiring + durable questions in one collection; target 15–30% expiring

Key decisions from Phase 64 Plan 01 (2026-03-15):
- OfficeholderEntry lives in bloomington-in.ts (sole LocaleConfig source of truth) — one canonical import path for all consumers
- buildOfficeholderBlock wording is load-bearing: "name them SPECIFICALLY / do NOT write 'the current mayor'" — required for Plan 02 auto-seeder
- officeholders field is optional — 17 existing configs need zero changes; undefined treated as empty array in prompt builder
- Both city and state prompt builders get officeholders param for future state-level officeholder use

Key decisions from Phase 64 Plan 02 (2026-03-15):
- seedOfficeholderExpiresAt uses dynamic imports for db/questions/sql (consistent with runWithinCollectionSemanticDedup pattern)
- expiresAt IS NULL filter in seeder query is mandatory — prevents overwriting manually corrected expiry dates on re-runs
- tryLoadLocaleConfig returns null (not throws) for collections without locale configs — 17 existing collections silently skip coverage section
- Officeholder coverage section is non-blocking — zero-coverage count warns only, consistent with expiring-ratio warning pattern

Key decisions from Phase 65 Plan 01 (2026-03-15):
- generateReplacement() is entirely wrapped in try/catch — returns { replaced: false, reason } on any error, never throws (mirrors awardPlatformXp pattern)
- QuestionSchema.parse used (not BatchSchema) — BatchSchema has min(15) constraint and throws on single-question AI response
- Direct insert with status 'active' (not seedQuestionBatch which hardcodes draft) — replacements must be immediately playable
- tryLoadLocaleConfig uses absolute paths via fileURLToPath + resolve() — relative paths break in cron context
- getNextExternalId queries ALL question statuses — archived IDs remain in DB with UNIQUE constraint
- Quality fail is non-retrying — cleanliness over gap-filling; single retry on parse-error and near-duplicate only

Key decisions from Phase 65 Plan 02 (2026-03-15):
- Set-based dedup on expiredRows required because innerJoin inflates rows for multi-collection questions — first collection wins
- generateReplacement call is AFTER db.update (archive-first) — archival stands even if replacement fails
- No second try/catch wrapper around generateReplacement — its own outer try/catch is sufficient; wrapping would mask bugs
- expiring-soon query left untouched — monitoring-only, replacement inappropriate for non-expired questions

### v2.3 Context

**Gem scoring rule change (Phase 70):**
- Old rule: 1 gem at correctAnswers >= totalQuestions - 2 (i.e., 6/8 or 7/8)
- New rule: 1 gem when finalScore >= 1000
- 2 gems for 8/8 perfect: unchanged
- Wager strategy now matters for gem earning — a player with 800 points can wager 400, hit correct, reach 1200, and earn a gem even with prior misses
- Max wager = floor(currentScore / 2); gem indicator threshold = currentScore + proposedWager >= 1000

**Leaderboard cache (Phase 71):**
- Current TTL: 300 seconds (5 minutes) — players see stale XP for up to 5 minutes after a game
- Fix: reduce to 60 seconds — acceptable lag, no architectural change needed
- Push-based cache invalidation (LEAD-F01) deferred to v2.4+

**Game flow (Phase 69) — COMPLETE:**
- NextStepButton component replaces tap-anywhere with contextual labels
- Q1–Q6: "NEXT QUESTION"; Q7: "LAST QUESTION"; Q8 wager: "GAME RECAP"
- Timer shrinks 80px → 56px during reveal phase to reclaim vertical space
- Both root div and inner motion.div use overflow-hidden — mobile 375x667 fits without scroll
- Label derived from props (isFinalQuestion, questionIndex, totalQuestions) — not hardcoded
- Disabled prop dims button to 0.4 opacity when LearnMore modal is open
- Tap-anywhere onClick and tap hint SVG fully removed from GameScreen

### Pending Todos

None — v2.3 roadmap complete, ready to plan phases.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |
| 024 | Responsive game UI layout — no scrolling to see answers or timer | 2026-03-03 | [024-game-ui-responsive-layout-fixes](./quick/024-game-ui-responsive-layout-fixes/) |
| 025 | Mobile-friendly admin panel — card lists, full-screen panels, responsive layouts | 2026-03-09 | [025-mobile-friendly-admin-panel](./quick/025-mobile-friendly-admin-panel/) |
| 026 | Push 32 commits to origin/master — fix Portland image 404, ship Phases 58–59 | 2026-03-12 | [026-fix-portland-image-404-and-push-portland](./quick/026-fix-portland-image-404-and-push-portland/) |

## Session Continuity

Last session: 2026-03-19
Stopped at: Completed Phase 71 — Leaderboard Cache Fix (1 plan, verified in production)
Resume file: None

Next action: `/gsd:audit-milestone` — audit v2.3 before archiving
