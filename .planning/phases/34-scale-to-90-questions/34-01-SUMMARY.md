---
phase: 34-scale-to-90-questions
plan: 01
subsystem: content-generation
tags: [anthropic, claude, typescript, json, seeding, generation-pipeline]

# Dependency graph
requires:
  - phase: 33-generation-pipeline-enhancement
    provides: generateQuestions.ts orchestrator with gap analysis, quality check, semantic dedup
provides:
  - generateQuestions.ts updated to use claude-sonnet-4-6 model
  - seed-community.ts extended to cover all 5 non-Federal collections including Indiana and California
  - merge-generated-questions.ts utility to append generated output into canonical source JSON files
affects: [34-02-bulk-generation, 34-03-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Merge utility pattern: read generated JSON, check externalId collisions, append to source file, write back"
    - "LOCALES array pattern in seed-community.ts: extend by adding slug+file entries only"

key-files:
  created:
    - backend/src/scripts/merge-generated-questions.ts
  modified:
    - backend/src/scripts/generateQuestions.ts
    - backend/src/db/seed/seed-community.ts

key-decisions:
  - "Use claude-sonnet-4-6 (not claude-sonnet-4-5-20250929) for question generation"
  - "Extend LOCALES in seed-community.ts (2 entries) rather than writing a new seed script — reuses tested idempotent logic"
  - "merge-generated-questions.ts operates on JSON files only (no database) — separation of concerns"
  - "Collision detection by externalId makes merge idempotent — safe to run twice"

patterns-established:
  - "merge-generated-questions.ts: --input <generated-file> --collection <slug> appends to src/data/<file>.json"
  - "seed-community.ts LOCALES: add { slug, file } entry for any new non-Federal collection"

# Metrics
duration: 15min
completed: 2026-02-23
---

# Phase 34 Plan 01: Pipeline Preparation Summary

**Updated generation model to claude-sonnet-4-6, extended community seeding to cover Indiana and California state collections, and created merge-generated-questions.ts to append pipeline output into canonical source JSON files.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-23T18:48:57Z
- **Completed:** 2026-02-23T18:58:00Z
- **Tasks:** 2 of 2
- **Files modified:** 3

## Accomplishments
- generateQuestions.ts now uses claude-sonnet-4-6 (replacing the stale claude-sonnet-4-5-20250929 model)
- seed-community.ts LOCALES extended from 3 to 5 entries — indiana-state and california-state collections can now be seeded as active
- merge-generated-questions.ts created: CLI utility that appends generated questions to source JSON files with duplicate externalId protection

## Task Commits

Each task was committed atomically:

1. **Task 1: Update model and extend seed-community.ts for state collections** - `9435f13` (feat)
2. **Task 2: Create merge-generated-questions.ts utility script** - `732cd49` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/scripts/generateQuestions.ts` - Changed model from claude-sonnet-4-5-20250929 to claude-sonnet-4-6 (line 276)
- `backend/src/db/seed/seed-community.ts` - Added indiana-state and california-state entries to LOCALES array
- `backend/src/scripts/merge-generated-questions.ts` - New utility: merges generated question JSON files into canonical source data files

## Decisions Made
- Extended the existing LOCALES array in seed-community.ts rather than creating a new script — the existing logic is tested, idempotent, and handles topic upserts, ON CONFLICT DO NOTHING, and collection linking
- merge-generated-questions.ts has no database interaction by design — keeps the script fast and dependency-free for the merge step of the pipeline
- Collision detection uses externalId to make the merge idempotent — running the script twice on the same generated file produces the same result

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 engineering gaps from research are closed
- Phase 34-02 (bulk generation) can now run generateQuestions.ts against all 5 collections using the updated model
- After generation, merge-generated-questions.ts merges output into source JSON files
- After merge, seed-community.ts (now covering all 5 collections) seeds the new questions as active

---
*Phase: 34-scale-to-90-questions*
*Completed: 2026-02-23*
