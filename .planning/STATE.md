# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 78 — Pipeline Cron Worker + Pool Regulation (v2.5 International Collections)

## Current Position

Phase: 78 of 80 (Pipeline Cron Worker + Pool Regulation)
Plan: 1 of 2 in current phase
Status: Plan 1 complete
Last activity: 2026-04-09 — Completed 78-01 (Schema DDL + Generator Foundations)

Progress: [██████████] v1.0–v2.4 complete (Phases 1–74); v2.5 Phases 75–80 pending

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema
- Redis: Upstash (stirred-pika-7510)
- Active collections (34 total): Federal + 21 local + 12 state (see MEMORY.md for full list)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Phase 78-01 decisions (2026-04-09):
- volatility default is 'fast' — existing CLI usage unaffected; backward compatible
- maxQuestions defaults to undefined (no cap) — backward-compatible CLI behavior preserved
- computeExpiresAt uses midpoint of each volatility band: fast=4d, medium=10d, slow=60d, stable=180d
- ESM import guard pattern established: process.argv[1] === fileURLToPath(import.meta.url)
- parseArgs process.exit calls retained in parseArgs() (only called from isDirectRun block)

Phase 77-02 decisions (2026-04-09):
- Low-confidence claims skip Claude Call 2 entirely — extractClaim() returns null, lowConfidenceSkipped counter incremented
- Quality gate is Claude-side in structured output (not post-hoc filter) — failing questions never written to DB
- No draft writes: CONTEXT.md overrides roadmap "save as draft" — questions are active or discarded
- World-news topic lazy-created in writePassingQuestions — no migration dependency
- Notes JSON cast as any to extend beyond narrow generationJobs schema type — widening deferred to future phase
- Dry-run mode skips all Claude calls (clusterArticles runs free) — preserves API budget during testing
- external_id format for international: {prefix}-{NNNN} (4-digit zero-padded)

Phase 77-01 decisions (2026-04-09):
- Feed list stored as typed const array (INTERNATIONAL_FEEDS) in rss-ingestor.ts — not hardcoded in logic, easily swappable to DB/config in Plan 77-02
- articlesSkipped tracked inside processFeed but not in FeedResult.articles (only passing articles stored) — notes JSON currently sets articlesSkipped=0; Plan 77-02 can extend
- HTTP-fetch-first / content:encoded-fallback body extraction strategy confirmed per CONTEXT.md (plan had it reversed in prose, CONTEXT.md is authoritative)
- rss-parser ships own types — @types/rss-parser does not exist on npm

Phase 76-01 decisions (2026-04-09):
- International section appears after Federal in collection picker: Local > State > Federal > International
- Freshness indicator gated on tier === 'international' (not just latestQuestionAt presence) — backend returns field for all tiers
- formatFreshness: < 1m = just now, < 60m = Xm ago, < 24h = Xh ago, >= 24h = Mon D (Intl.DateTimeFormat, no date-fns)
- Same Bebas Neue / #9A8878 / 10px style for freshness indicator as admin question count row

Phase 75-01 decisions (2026-04-09):
- DB Foundation complete: generation_jobs, user_collection_mutes tables created; questions.fact_snapshot, confidence_tier, generation_job_id columns added
- DDL applied directly via Supabase MCP SQL (consistent with project convention — no drizzle-kit push)
- generationJobs placed before questions in schema.ts to satisfy FK forward-reference order
- Supabase CLI multiline SQL in shell arg causes 400 error; use --file flag as standard workaround

v2.5 decisions at roadmap time (2026-04-08):
- International pipeline uses RSS-body-first strategy (`<content:encoded>` primary, HTTP fallback) — bypasses paywall and JS-rendering issues without extra packages
- Partisan framing is a BLOCKING quality gate for International content (not advisory) — err toward omission over queue overload
- expirationSweep.ts replacement generator must skip tier === 'international' collections — guard added in Phase 75 alongside schema work
- Phases 79 (launch collections) and 80 (admin visibility) are independent and can execute in parallel
- user_collection_mutes table is created in Phase 75 (DB foundation) but the muting UI is deferred to v2.6 — table exists, feature does not
- Reuters excluded (discontinued RSS June 2020); AP News excluded (no official RSS); 4 confirmed feeds: BBC World, NPR, The Guardian, DW
- Feed list stored in DB or config file — never hardcoded

### Pending Todos

- trivia_service DB role needs password reset via Supabase dashboard (non-blocking; using postgres superuser currently)
- Tucson, AZ expiring ratio at 8.3% — below 15% advisory target; ~6 more officeholder questions would close it (non-blocking)
- Decide AP News sourcing strategy before Phase 79 (skip AP or use verified aggregator)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-09T20:23:58Z
Stopped at: Completed 78-01-PLAN.md (Schema DDL + Generator Foundations)
Resume file: None

Next action: Execute 78-02 (poolRegulator + pipelineCron + server wiring)
