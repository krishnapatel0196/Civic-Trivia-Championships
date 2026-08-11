---
phase: 79-launch-collections
plan: 01
subsystem: content
tags: [international-collections, pipeline, game-api, supabase, typescript]

# Dependency graph
requires:
  - phase: 78-pipeline-cron-pool-regulation
    provides: runPipeline(), pipelineCron.ts skeleton with commented entries, poolRegulator
  - phase: 77-international-pipeline-core
    provides: run-pipeline.ts CLI, writePassingQuestions, world-news topic lazy creation
  - phase: 76-international-collection-ui
    provides: frontend International section in collection picker, game.ts tier/latestQuestionAt fields
provides:
  - War in Iran collection: active, tier=international, 15 active questions, fast volatility, 4-day expiry
  - game.ts tier-conditional MIN_QUESTION_THRESHOLD (8 for international, 50 for others)
  - pipelineCron.ts with both war-in-iran and climate-agreements entries uncommented
  - Banner image: Tehran skyline at frontend/public/images/collections/war-in-iran.jpg
  - Scaffold artifacts: locale config, seed entry, generator registration for war-in-iran
affects:
  - 79-02 (climate-agreements launch — pipelineCron.ts already ready)
  - 80-admin-visibility (war-in-iran will appear in admin panel)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tier-conditional question threshold: international collections use MIN_INTERNATIONAL_THRESHOLD=8, others MIN_QUESTION_THRESHOLD=50
    - Supabase CLI file-based SQL: `npx supabase db query --linked --file backend/file.sql` from project root
    - Pipeline run 3x approach: each run generates 4-6 questions from 3 RSS clusters; need 3 runs for 15

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/war-in-iran.ts
    - frontend/public/images/collections/war-in-iran.jpg
  modified:
    - backend/src/routes/game.ts
    - backend/src/cron/pipelineCron.ts
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "MIN_INTERNATIONAL_THRESHOLD=8 added to game.ts — filter is now tier-conditional, not global"
  - "Supabase CLI `--file` flag requires path relative to workdir (project root), not CWD"
  - "3 pipeline runs needed for 15 questions: RSS dedup produces 3 clusters per run, ~4-6 questions per cluster set"
  - "Banner image: Tehran skyline from Wikimedia Commons (CC-BY-SA), 1280x1011"

patterns-established:
  - "International collection DB insert: use `npx supabase db query --linked --file` from project root — seed.ts hangs"
  - "Pipeline runs iteratively: check count after each run, stop at target"
  - "collection_topics linkage: INSERT SELECT with ON CONFLICT DO NOTHING after first pipeline run (world-news topic lazy-created)"

# Metrics
duration: 26min
completed: 2026-04-09
---

# Phase 79 Plan 01: War in Iran Launch Summary

**War in Iran international collection activated with 15 fast-volatility questions (4-day expiry) and game.ts patched with tier-conditional threshold (8 for international, 50 for others)**

## Performance

- **Duration:** 26 min
- **Started:** 2026-04-09T21:57:55Z
- **Completed:** 2026-04-09T22:23:27Z
- **Tasks:** 2
- **Files modified:** 6 (+ 1 image)

## Accomplishments
- Fixed game.ts MIN_QUESTION_THRESHOLD blocker: international collections now show in picker with 8+ questions
- Uncommented both war-in-iran and climate-agreements entries in pipelineCron.ts
- Launched War in Iran: 15 active questions (wiran-0001 to wiran-0015), all with volatility=fast and expires_at ~4 days from creation
- Wired collection_topics: war-in-iran linked to world-news topic (id=749, lazy-created by first pipeline run)
- Added banner image: Tehran skyline, 1280x1011 JPEG from Wikimedia Commons

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold War in Iran + fix game.ts threshold + uncomment pipelineCron entries** - `532316c` (feat)
2. **Task 2: Insert into DB, run pipeline for 15+ questions, wire topics, add banner, activate** - `208f272` (feat)

**Plan metadata:** (committed below) (docs: complete war-in-iran-launch plan)

## Files Created/Modified
- `backend/src/routes/game.ts` - Added MIN_INTERNATIONAL_THRESHOLD=8, replaced filter with tier-conditional logic
- `backend/src/cron/pipelineCron.ts` - Uncommented war-in-iran and climate-agreements in INTERNATIONAL_COLLECTIONS array
- `backend/src/db/seed/collections.ts` - Added War in Iran seed entry (tier: international, sortOrder: 35)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Registered war-in-iran locale
- `backend/src/scripts/content-generation/locale-configs/war-in-iran.ts` - Created scaffold locale config (city-flavored template, cosmetic only for international)
- `frontend/public/images/collections/war-in-iran.jpg` - Tehran skyline banner image (Wikimedia Commons CC-BY-SA)

## Decisions Made
- `MIN_INTERNATIONAL_THRESHOLD=8` for international tier vs `MIN_QUESTION_THRESHOLD=50` for all others — keeps the filter inline in the route, no service layer changes
- Supabase CLI `--file` flag requires SQL files to be relative to the project's workdir (C:\Project Test), not the CWD — use `backend/file.sql` not `./file.sql`
- 3 pipeline runs needed for 15 questions: RSS feeds produce 3 multi-source clusters per run (single-source articles skipped by dedup), each cluster yields 4-6 questions
- Banner image: Tehran skyline from Wikimedia Commons (CC-BY-SA) — geographic/cityscape imagery, avoids conflict/violence, recognizable as Iran

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Supabase CLI SQL execution quirk:** `npx supabase db query --linked "SQL string"` returns 400 error ("String must contain at least 1 character"). Workaround: write SQL to a file and use `--file "backend/file.sql"` from the project root. This is consistent with the known Phase 75 note about CLI multiline SQL.

**Pipeline produces 4-6 questions per run, not 8:** The RSS dedup step reduces 91 raw articles to 3 multi-source clusters per run. Each cluster generates roughly 4-6 questions. Three runs were needed to reach 15 total. This is expected behavior given the current article pool and dedup algorithm.

## User Setup Required

**Banner image is from Wikimedia Commons (CC-BY-SA):** If the project needs a different image (higher res, different angle, commercial-license), replace `frontend/public/images/collections/war-in-iran.jpg`. Current image: North Tehran skyline, 1280x1011 JPEG, 435KB.

**Note on question quality:** The pipeline generated questions from current news clusters about the Iran-US ceasefire in April 2026. Questions reference specific dates, casualty figures, and negotiation details — all appropriately time-limited with 4-day expiry. No manual curation was done; the quality gate (Claude Call 2) blocked 0 questions, so all generated content passed the quality threshold.

## Next Phase Readiness
- Phase 79-02 (Climate Agreements launch) is fully unblocked: pipelineCron.ts already has the climate-agreements entry uncommented
- The `world-news` topic (id=749) now exists in the DB — climate-agreements pipeline run will find it and skip lazy creation
- game.ts threshold fix benefits climate-agreements automatically since it's also international tier
- Phase 80 (Admin Visibility) can proceed immediately — war-in-iran appears in admin with 15 questions and active status

---
*Phase: 79-launch-collections*
*Completed: 2026-04-09*
