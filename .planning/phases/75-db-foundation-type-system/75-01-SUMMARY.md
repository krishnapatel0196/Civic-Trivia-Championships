---
phase: 75-db-foundation-type-system
plan: 01
subsystem: database
tags: [drizzle, postgres, supabase, schema, international-collections, generation-jobs]

# Dependency graph
requires: []
provides:
  - trivia.generation_jobs table with status tracking and collection_slug index
  - trivia.user_collection_mutes table with composite PK (user_id, collection_id)
  - trivia.questions.fact_snapshot nullable text column
  - trivia.questions.confidence_tier nullable text column
  - trivia.questions.generation_job_id nullable FK to generation_jobs
  - Drizzle schema.ts generationJobs and userCollectionMutes table definitions
  - Exported TypeScript types: GenerationJob, NewGenerationJob, UserCollectionMute, NewUserCollectionMute
affects:
  - 75-02 (expirationSweep guard — uses schema types)
  - 76-feed-ingestor (inserts into generation_jobs)
  - 77-question-generator (writes fact_snapshot, confidence_tier, generation_job_id)
  - 78-quality-gate (reads generation_jobs status)
  - 79-launch-collections (queries generation_jobs)
  - 80-admin-visibility (reads generation_jobs for dashboard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "triviaSchema.table() pattern for all new tables (consistent with existing schema)"
    - "generationJobs placed before questions in schema.ts to satisfy FK forward-reference"
    - "DDL applied directly via Supabase MCP SQL (no drizzle-kit push or migration files)"

key-files:
  created: []
  modified:
    - backend/src/db/schema.ts

key-decisions:
  - "user_collection_mutes table created now but muting UI deferred to v2.6 — table exists, feature does not"
  - "DDL executed via Supabase MCP SQL (not drizzle-kit), consistent with project convention for schema changes"
  - "All new question columns are nullable — no backfill required, existing questions unaffected"

patterns-established:
  - "FK ordering pattern: referenced table must be defined before referencing table in schema.ts"

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 75 Plan 01: DB Foundation + Type System Summary

**Two new tables (generation_jobs, user_collection_mutes) and three nullable question columns establish the complete DB foundation for the v2.5 International Collections pipeline**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T05:24:21Z
- **Completed:** 2026-04-09T05:28:32Z
- **Tasks:** 2
- **Files modified:** 1 (backend/src/db/schema.ts)

## Accomplishments

- Created `trivia.generation_jobs` table with status tracking, question counters, and two indexes (collection_slug, status)
- Created `trivia.user_collection_mutes` table with composite PK (user_id, collection_id) and user index
- Added three nullable columns to `trivia.questions`: fact_snapshot, confidence_tier, generation_job_id (FK to generation_jobs)
- Updated Drizzle schema.ts with all new definitions, placed generationJobs before questions to satisfy FK reference order
- Exported four new TypeScript types: GenerationJob, NewGenerationJob, UserCollectionMute, NewUserCollectionMute
- TypeScript compilation (`npx tsc --noEmit`) passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Execute SQL DDL via Supabase MCP SQL** — DB-only, no local files to commit
2. **Task 2: Update schema.ts to match live DB** — `98bfc62` (feat)

**Plan metadata:** committed below (docs)

## Files Created/Modified

- `backend/src/db/schema.ts` — Added generationJobs table, userCollectionMutes table, 3 new question columns, 4 exported types

## Decisions Made

- Used Supabase MCP SQL (`npx supabase db query --linked --file`) rather than drizzle-kit push — consistent with project convention for direct schema modifications
- Ordered DDL statements carefully: generation_jobs created before ALTER TABLE questions adds the FK column
- user_collection_mutes table created in this phase even though the muting UI is deferred to v2.6 — keeps DB foundation complete for all downstream phases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Supabase CLI `db query --linked "..."` with multiline SQL in the shell argument caused syntax error (400). Resolved by writing SQL to a temp file and using `--file` flag. Standard workaround, not a blocker.

## User Setup Required

None - no external service configuration required beyond the Supabase linked project already configured.

## Next Phase Readiness

- All tables and columns exist in the live DB; verified via information_schema queries
- schema.ts matches live DB exactly; TypeScript compiles cleanly
- Phase 75-02 (expirationSweep guard) and Phases 76-80 can proceed — DB foundation is complete
- No blockers

---
*Phase: 75-db-foundation-type-system*
*Completed: 2026-04-09*
