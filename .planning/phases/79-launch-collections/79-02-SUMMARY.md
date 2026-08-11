---
phase: 79-launch-collections
plan: 02
subsystem: content
tags: [international-collections, pipeline, supabase, typescript, climate]

# Dependency graph
requires:
  - phase: 79-01-launch-collections
    provides: game.ts MIN_INTERNATIONAL_THRESHOLD=8, pipelineCron.ts climate-agreements entry uncommented, world-news topic (id=749) in DB
  - phase: 78-pipeline-cron-pool-regulation
    provides: runPipeline() with volatility option, writePassingQuestions auto-inserts collection_questions rows
  - phase: 77-international-pipeline-core
    provides: rss-ingestor, claim-extractor, question-generator, run-pipeline CLI
provides:
  - Climate Agreements collection: active, tier=international, 17 active questions, medium volatility, ~10-day expiry
  - seed-climate-agreements.ts: one-off programmatic pipeline runner with volatility=medium
  - Banner image: Blue Marble Earth (NASA public domain) at frontend/public/images/collections/climate-agreements.jpg
  - Scaffold artifacts: locale config, seed entry, generator registration for climate-agreements
affects:
  - 80-admin-visibility (climate-agreements will appear in admin panel)
  - pipelineCron nightly runs (clima- prefix will now refresh questions automatically)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - One-off seed script pattern: create {collection}-seed script that calls runPipeline() with non-default volatility option
    - NASA public domain images: suitable for international/global-topic collections (no attribution required)

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/climate-agreements.ts
    - backend/src/scripts/international/seed-climate-agreements.ts
    - frontend/public/images/collections/climate-agreements.jpg
  modified:
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "seed-climate-agreements.ts calls runPipeline() programmatically with volatility=medium (CLI has no --volatility flag)"
  - "Blue Marble Earth photo (Apollo 17, NASA public domain) chosen as banner — global/environmental imagery, no attribution required"
  - "3 pipeline runs produced 17 questions: same RSS feed dynamics as war-in-iran (3 clusters per run, ~5-6 questions each)"
  - "collection_topics wired after pipeline runs (world-news topic id=749 already existed from 79-01)"

patterns-established:
  - "International collection activation: scaffold → SQL insert → pipeline runs → wire topics → add banner → SQL activate"
  - "Medium volatility = expires_at set to +10 days (computeExpiresAt midpoint for medium band)"

# Metrics
duration: 21min
completed: 2026-04-09
---

# Phase 79 Plan 02: Climate Agreements Launch Summary

**Climate Agreements international collection activated with 17 medium-volatility questions (~10-day expiry) completing Phase 79 dual-collection international launch**

## Performance

- **Duration:** 21 min
- **Started:** 2026-04-09T22:27:01Z
- **Completed:** 2026-04-09T22:48:11Z
- **Tasks:** 2
- **Files modified:** 5 (+ 1 image)

## Accomplishments
- Scaffolded Climate Agreements via scaffold-collection.ts (tier=international, prefix=clima, sortOrder=36)
- Created seed-climate-agreements.ts: calls runPipeline() with volatility=medium, enabling ~10-day question expiry
- Inserted collection into DB (id=267) and ran pipeline 3 times to generate 17 active questions (clima-0001 to clima-0017)
- All questions verified: volatility=medium, expires_at = April 19 2026 (~10 days from creation)
- Wired collection_topics: climate-agreements linked to world-news (topic_id=749)
- Added Blue Marble Earth banner (NASA public domain, 1280x1281 JPEG, 421KB)
- Full Phase 79 verification passed: both war-in-iran (15 questions, fast) and climate-agreements (17 questions, medium) active

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Climate Agreements + create medium-volatility seed script** - `8090213` (feat)
2. **Task 2: Insert into DB, run pipeline for 15+ questions, wire topics, add banner, activate** - `7e1e462` (feat)

**Plan metadata:** (committed below) (docs: complete climate-agreements-launch plan)

## Files Created/Modified
- `backend/src/db/seed/collections.ts` - Added Climate Agreements seed entry (tier: international, sortOrder: 36)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Registered climate-agreements locale
- `backend/src/scripts/content-generation/locale-configs/climate-agreements.ts` - Created scaffold locale config
- `backend/src/scripts/international/seed-climate-agreements.ts` - One-off seed script with volatility=medium
- `frontend/public/images/collections/climate-agreements.jpg` - Blue Marble Earth banner image (NASA public domain)

## Decisions Made
- `seed-climate-agreements.ts` calls `runPipeline()` programmatically with `{ volatility: 'medium' }` — the CLI has no `--volatility` flag so a one-off script is the correct pattern for non-default volatility
- Blue Marble Earth photo (Apollo 17, NASA public domain) chosen as banner — recognizable global imagery appropriate for a climate agreements collection; no attribution required
- 3 pipeline runs executed: RSS dedup produces 3 multi-source clusters per run (~5-6 questions each), same dynamics as war-in-iran
- Did not set `maxQuestions` cap in the seed script — unlimited seeding on first run per plan specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Supabase CLI SQL execution quirk (consistent with Phase 75/79-01):** `npx supabase db query --linked "SQL string"` returns 400 error. Used `--file` flag with SQL written to `backend/*.sql` files from the project root. This is the established workaround.

**Wikimedia Commons image download redirect:** First two curl attempts returned HTML (403/redirect response). Used direct NASA source for the Blue Marble Earth image instead: `upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg`. This URL worked correctly.

**Volatility query ambiguous column:** The initial `check-volatility.sql` had `SELECT ... created_at` without table alias — Postgres rejected it as ambiguous. Fixed by qualifying all columns as `q.created_at`.

## User Setup Required

**Banner image note:** Current banner is the Blue Marble Earth photo from Apollo 17 (NASA public domain, no attribution required). If a different image is preferred (e.g., COP summit, solar panels, wind turbines), replace `frontend/public/images/collections/climate-agreements.jpg`. Image should be 1280px wide JPEG.

## Next Phase Readiness
- Phase 79 fully complete: both international collections (war-in-iran, climate-agreements) are active with 15+ questions
- Phase 80 (Admin Visibility) can proceed immediately — both collections appear in admin
- pipelineCron.ts will refresh both collections nightly once deployed (both entries already uncommented in 79-01)
- The seed-climate-agreements.ts script can be re-run if question count drops below threshold before nightly cron takes over

---
*Phase: 79-launch-collections*
*Completed: 2026-04-09*
