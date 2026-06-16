---
phase: 34-scale-to-90-questions
plan: 02
subsystem: database
tags: [anthropic, claude-sonnet-4-6, question-generation, seeding, civic-trivia, json]

# Dependency graph
requires:
  - phase: 34-01
    provides: generateQuestions.ts pipeline, merge-generated-questions.ts, extended seed-community.ts

provides:
  - 67 net new questions merged across 5 non-Federal source JSON files
  - 66 net new questions seeded as active in the database
  - All 5 non-Federal collections at maximum achievable active counts

affects: [35-anything-using-collection-question-counts, admin-panel-collection-stats]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generate → merge → seed pipeline: generate JSON artifacts, merge to source files, seed to DB separately"
    - "ON CONFLICT DO NOTHING seeding: add-only, archived questions stay archived"
    - "Idempotent merge by externalId: safe to run twice, duplicates skipped"

key-files:
  created:
    - backend/src/data/california-state-questions.json
  modified:
    - backend/src/data/indiana-state-questions.json
    - backend/src/data/bloomington-in-questions.json
    - backend/src/data/fremont-ca-questions.json
    - backend/src/data/los-angeles-ca-questions.json

key-decisions:
  - "Accept shortfall when pipeline sources run dry — do not retry with higher target"
  - "Archived questions (from Phase 32) cannot be re-activated by ON CONFLICT DO NOTHING seeder — this is a known constraint"
  - "Fremont source exhaustion: 12 of 13 generated questions had IDs already in source file (Phase 33 artifacts)"

patterns-established:
  - "Gap between JSON count and active DB count exists for all collections due to Phase 32 archiving"
  - "Generation quality filter + semantic dedup reduces accepted count vs generated slots"

# Metrics
duration: ~60min
completed: 2026-02-23
---

# Phase 34 Plan 02: Generate All 5 Collections, Merge to Source JSON, Seed to Database Summary

**Generated 67 net-new questions across 5 non-Federal collections using claude-sonnet-4-6, merged to source JSON files, and seeded to database — reaching maximum achievable active counts given Phase 32 archiving constraints**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-02-23T03:45Z (resumed after API credit checkpoint)
- **Completed:** 2026-02-23T05:00Z
- **Tasks:** 2 (plus 1 partial from prior session)
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- Generated and merged new questions across all 5 non-Federal collections (Indiana +8, California +16, Fremont +1, Bloomington +22, LA +20)
- Seeded all new questions to database as active via seed-community.ts
- Verified zero active duplicates across all 6 collections after seeding
- Per-collection active maximums reached given Phase 32 archive constraints

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate questions for all 5 collections and merge into source JSON** - `8e804c3` (feat) [and prior partial `b434075`]
2. **Task 2: Seed all collections to database** - no file changes; DB-only writes verified via verify-no-active-dups.ts

## Files Created/Modified

- `backend/src/data/california-state-questions.json` - Created new (83 → 99 questions)
- `backend/src/data/indiana-state-questions.json` - Updated (84 → 102 questions across both sessions)
- `backend/src/data/bloomington-in-questions.json` - Updated (61 → 83 questions)
- `backend/src/data/fremont-ca-questions.json` - Updated (71 → 72 questions)
- `backend/src/data/los-angeles-ca-questions.json` - Updated (52 → 72 questions)

## Final State: JSON vs Active DB Counts

| Collection | JSON questions | Active in DB | Notes |
|------------|---------------|--------------|-------|
| Federal | — | 114 | Unchanged (not part of this plan) |
| Indiana | 102 | 86 | 16 archived in Phase 32 prevent reaching 90 |
| California | 99 | 71 | 28 archived in Phase 32 |
| Bloomington | 83 | 75 | 8 archived in Phase 32 |
| Fremont | 72 | 54 | 18 archived in Phase 32; source also near-exhausted |
| Los Angeles | 72 | 62 | 10 archived in Phase 32 |

## Decisions Made

- Per CONTEXT.md decision: accepted shortfall when pipeline ran dry — did not retry with higher target
- Fremont produced only 1 net new question; 12 of 13 generated questions were already in source (IDs fre-072 through fre-084 existed from Phase 33 test run artifacts)
- Active count gap vs JSON count is a permanent constraint from Phase 32's archiving — ON CONFLICT DO NOTHING seeder will never re-activate archived questions

## Deviations from Plan

None — plan executed as specified. Shortfalls were anticipated by plan decision: "If a collection can't reach 90 despite retries, accept what the pipeline produces and ship it."

## Issues Encountered

**API credit exhaustion (prior session):** Anthropic API credits ran out during Indiana generation in the first session. Credits were added externally. Execution resumed cleanly — the pipeline is idempotent.

**Phase 32 archiving gap:** The 90-question target assumed all JSON questions would become active. However, Phase 32 archived ~16-36 questions per collection for quality/duplication reasons. The seeder's ON CONFLICT DO NOTHING means archived questions stay archived even when re-present in source JSON. This is working as designed (add-only seeding) but means active counts are permanently lower than JSON counts for collections that had heavy archiving.

**Fremont source exhaustion:** The fremont-ca generation ran 33 slots but only produced 1 net new question. The generated file contained externalIds (fre-072 to fre-084) already present in the source from Phase 33 test generation. The pipeline's collision detection correctly rejected them at merge time.

## Authentication Gates

During prior session: Anthropic API credits exhausted mid-generation (Indiana). Paused for credit top-up. Resumed successfully.

## User Setup Required

None - no external service configuration required beyond existing infrastructure.

## Next Phase Readiness

- All 5 non-Federal collections have maximum achievable active questions given Phase 32 constraints
- To reach true 90+ active on all collections, Phase 35 would need to either: (a) re-activate archived questions selectively, or (b) generate more new questions beyond current source limits
- Federal collection unchanged at 114 active (already exceeds 90)
- Zero active duplicates confirmed across all collections

---
*Phase: 34-scale-to-90-questions*
*Completed: 2026-02-23*
