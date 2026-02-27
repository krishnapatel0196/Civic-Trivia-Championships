# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Make civic learning fun through game show mechanics — play, not study
**Current focus:** v1.7 Live Civic Intelligence — COMPLETE ✅

## Current Position

Phase: 38 of 38 — COMPLETE ✅
Plan: 3/3 complete
Status: Phase 38 verified and approved — v1.7 milestone complete
Last activity: 2026-02-26 — Phase 38 verified (election cron + CurrentTermGenerator + three-tab ElectionsPage UI)

Progress: [████████████████████████] 110 plans complete (v1.0 through v1.6 + Phases 35–38) — v1.7 feature-complete

**Milestone progress:**
- v1.0 (Phases 1-7): Complete ✅
- v1.1 (Phases 8-12): Complete ✅
- v1.2 (Phases 13-17): Complete ✅
- v1.3 (Phases 18-22): Complete ✅
- v1.4 (Phases 23-26): Complete ✅
- v1.5 (Phases 27-30): Complete ✅
- v1.6 (Phases 31-34): Complete ✅ (shipped 2026-02-24)
- v1.7 (Phases 35-38): Complete ✅ (shipped 2026-02-26)

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase EV-Backend-Dev (civic_trivia schema)
- Redis: Upstash (stirred-pika-7510)
- GitHub: EmpoweredVote/Civic-Trivia-Championships

## Performance Metrics

**Velocity:**
- Total plans completed: 99 (26 v1.0 + 11 v1.1 + 15 v1.2 + 17 v1.3 + 6 v1.4 + 11 v1.5 + 13 v1.6)
- Quick tasks completed: 10
- Milestones shipped: 7 (v1.0 through v1.6)
- Total execution time: ~11 days (2026-02-13 → 2026-02-24)

**By Milestone:**

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-7 | 26 | 2026-02-13 |
| v1.1 Production Hardening | 8-12 | 11 | 2026-02-18 |
| v1.2 Community Collections | 13-17 | 15 | 2026-02-19 |
| v1.3 Quality & Admin | 18-22 | 17 | 2026-02-20 |
| v1.4 Fremont CA | 23-26 | 6 | 2026-02-21 |
| v1.5 Feedback Marks | 27-30 | 11 | 2026-02-22 |
| v1.6 Content Quality & Scale | 31-34 | 13 | 2026-02-24 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent v1.7 decisions:

- Admin-entered race data for v1.7 (not scrapers) — scraping is v1.8+ per research finding that no reliable free API exists for US local elections
- claude-sonnet-4-6 hardcoded directly in ElectionQuestionGenerator (not the MODEL constant in anthropic-client.ts which is outdated at claude-sonnet-4-5)
- Collection slug passed explicitly as CLI/API parameter (not derived from jurisdiction string matching)
- Election cron resolves collection slug via collections.name = race.jurisdiction DB lookup (cron has no slug context)
- GenerationBlockedError from cron is idempotent skip — running cron twice for same race is expected, not an error
- lastCronRun stored as module-level mutable let in electionDetection.ts — no DB round-trip needed for admin banner
- FollowupBlockedError thrown when followupGenerated=true on enter-result call (idempotent 409 guard)
- elc-term-{raceId}-{seq} external ID format for current-term questions (distinct from elc- campaign questions)
- classified endpoint registered before GET /election-races to avoid Express :id param match on "classified"
- Awaiting Follow-up classification: election_date < now AND followup_generated = FALSE (regardless of questions_generated)
- Regenerate resolves collection slug from collections.name = race.jurisdiction (same pattern as cron)
- PUT /election-races/:id uses partial patch — only updates fields present in body
- elections-voting topic created lazily by resolveCollectionAndTopic if not present for the collection
- Force-regenerate uses timestamp-suffixed externalIds (elc-{raceId}-{ts36}-{seq}) to avoid ON CONFLICT DO NOTHING silently skipping new questions
- getEndOfDayUTC anchors on local noon (not midnight) to correctly handle DST spring-forward dates
- No Zod BatchSchema validation on election question responses (existing schema regex won't match elc- format)
- Advisory severity for address/phone quality rule — legitimate civic location questions can have address answers; flag for human review, no auto-archive
- Follow-up questions have expiresAt = NULL — "Who won?" is a permanent historic fact, not a time-limited question
- election_race_id as direct FK on questions (not junction table) — each election question belongs to exactly one race; simpler than junction table
- checkAddressPhone scans answer options ONLY — not question.text or explanation; civic bodies legitimately reference addresses
- Focused audit scripts import a single rule directly (not full auditQuestion) for clean single-rule reports
- drizzle-kit push interactive "create or rename?" prompt bypassed by applying DDL via pg client directly — schema.ts remains source of truth, workaround is safe and non-destructive
- election_race_id stored as UTC TIMESTAMPTZ; separate timezone TEXT field (IANA) used for display/scheduling context only
- Norwich uses en-GB localeCode — first non-US collection; all others are en-US
- Norwich batchSize 15 (not 25) — smaller topic-focused batches across 8 topic categories
- Norwich themeColor #1B4332 (deep forest green) — visually distinct from all existing collection colors
- Two-tier governance (City Council vs Norfolk County Council) encoded as critical accuracy requirement in Norwich voice guidance
- Norwich generation produced 117 questions (target 50-90); overshoot accepted as all passed quality validation
- Norwich image sourced from Geograph.org.uk CC-BY-SA 2.0 (Wikimedia CDN rate-limited curl); Node.js HTTPS with Referer header used as workaround
- Generation pipeline seeds questions as draft by default — activate via direct DB update after quality review
- Norwich is the platform's first non-US collection (en-GB); establishes pattern for future international collections

### Pending Todos

- [ ] Announce v1.2 Community Collections launch (320 total questions live)
- [ ] Invite volunteers to GitHub org
- [ ] Share live URLs with team
- [ ] Consider Phase 35 to selectively re-activate high-quality archived questions to close LA/Bloomington/Fremont gaps to 90

### Known Tech Debt (carried from v1.6)

- violation_count column may go stale if quality rules change without re-audit
- ILIKE search may degrade beyond 1000 questions (consider pg_trgm GIN index)
- useBlocker unavailable (requires createBrowserRouter) — sidebar nav during edit won't prompt for unsaved changes
- LA (88), Bloomington (75), Fremont (54) are source-exhausted — further generation unlikely without new source material
- Generation pipeline has cross-run duplicate risk: DB dedup baseline loaded at run start, requires post-seed dedup check
- generateQuestions.ts crashes for --collection federal (bare array format) — not exercised since Federal at 114
- Auto-resolve alert shows "undefined clusters" (API field name mismatch) — cosmetic only

### Blockers/Concerns

None — Phase 38 complete. Election cron (01) + CurrentTermQuestionGenerator + 6 endpoints (02) + three-tab admin UI (03) all executed. v1.7 Live Civic Intelligence feature-complete; ready for end-to-end verification and deployment.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 017 | Implement Easy Steps progressive difficulty game mode | 2026-02-21 | 9929989 | [017-easy-steps-progressive-difficulty-mode](./quick/017-easy-steps-progressive-difficulty-mode/) |
| 018 | Make Easy Steps truly adaptive with dynamic question selection | 2026-02-21 | ba9d39c | [018-fix-easy-steps-adaptive-difficulty](./quick/018-fix-easy-steps-adaptive-difficulty/) |
| 019 | Reduce mobile question size and remove redundant progress button | 2026-02-22 | 418e51f | [019-mobile-question-size-remove-progress-btn](./quick/019-mobile-question-size-remove-progress-btn/) |
| 020 | Fix pulsing tap icon 404 — commit missing SVG to repo | 2026-02-26 | fef1950 | [020-fix-pulsing-tap-icon-404-svg-and-play-re](./quick/020-fix-pulsing-tap-icon-404-svg-and-play-re/) |
| 021 | Fix SPA routing: add serve + start script for direct URL / refresh | 2026-02-26 | f86abda | [021-fix-spa-routing-direct-url-refresh](./quick/021-fix-spa-routing-direct-url-refresh/) |

## Session Continuity

Last session: 2026-02-26
Topic: Quick task 021 — Fix SPA routing (serve + start script for direct URL / refresh)
Stopped at: Completed 021-PLAN.md — serve dependency + npm start script committed
Resume file: None

Next action: Push to GitHub; verify Render redeploys with npm start; test direct URL access on /play, /admin, /elections

---
*v1.7 Live Civic Intelligence — roadmap created 2026-02-25*
