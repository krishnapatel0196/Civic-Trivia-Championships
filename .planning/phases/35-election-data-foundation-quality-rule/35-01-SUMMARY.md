---
phase: 35-election-data-foundation-quality-rule
plan: 01
subsystem: database
tags: [drizzle, postgres, typescript, react, tailwind, admin-ui, election-races, jsonb]

# Dependency graph
requires:
  - phase: 34-content-quality-scale
    provides: existing admin.ts patterns, AdminLayout nav pattern, schema.ts structure
provides:
  - election_races table in civic_trivia schema with 11 columns (seat, election_type, election_date, timezone, jurisdiction, candidates JSONB, questions_generated, followup_generated, result, created_at)
  - questions.election_race_id nullable FK (ON DELETE SET NULL)
  - ElectionRace and NewElectionRace TypeScript types
  - GET /api/admin/election-races endpoint
  - POST /api/admin/election-races endpoint with Zod validation
  - ElectionsPage.tsx with race list table and dynamic candidate create form
  - Elections nav entry in AdminLayout sidebar
  - /admin/elections route in App.tsx
affects:
  - 35-02 (quality rule — no dependency on election races)
  - 37-election-question-generation (reads election_races, writes questions.election_race_id)
  - 38-election-followup-pipeline (reads election_races.followup_generated, questions.election_race_id)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin page pattern: useState for all form state (no react-hook-form), fetch with Bearer token, useEffect for data load"
    - "Election race CRUD: Zod validation on backend, plain HTML form on frontend"
    - "Dynamic candidate list: useState array with add/remove, filter empty names on submit"

key-files:
  created:
    - frontend/src/pages/admin/ElectionsPage.tsx
  modified:
    - backend/src/db/schema.ts
    - backend/src/routes/admin.ts
    - frontend/src/pages/admin/AdminLayout.tsx
    - frontend/src/App.tsx

key-decisions:
  - "Applied DDL directly via pg client (Node.js) because drizzle-kit push prompts interactively about create-vs-rename when new table detected — non-blocking workaround, schema.ts is still the source of truth"
  - "election_race_id is nullable FK on questions with ON DELETE SET NULL — preserves questions if race is deleted"
  - "Admin-entered races for v1.7 (no scraper) — form accepts all required fields including IANA timezone as plain text"

patterns-established:
  - "ElectionIcon SVG (clipboard with checkmark) follows existing icon pattern in AdminLayout.tsx"
  - "Election race form uses date input (YYYY-MM-DD) converted to ISO 8601 datetime (T00:00:00.000Z) before POST"

# Metrics
duration: 9min
completed: 2026-02-26
---

# Phase 35 Plan 01: Election Data Foundation Summary

**election_races Drizzle table with JSONB candidates + nullable FK on questions + admin CRUD UI and Elections sidebar nav**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-26T00:51:20Z
- **Completed:** 2026-02-26T01:00:37Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Created election_races table in civic_trivia schema with all 11 required columns including JSONB candidates array
- Added nullable election_race_id FK column to questions table (ON DELETE SET NULL) — foundation for all election question linking in Phases 37-38
- Built GET + POST admin API endpoints for election races with Zod validation, returning proper 201 on create
- Created ElectionsPage.tsx (271 lines) with race list table and full create form including dynamic add/remove candidate rows
- Wired Elections nav link into AdminLayout sidebar and /admin/elections route into App.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: election_races schema + election_race_id FK + db push** - `3248bfd` (feat)
2. **Task 2: Admin API endpoints + Elections page + nav integration** - `61d8228` (feat)

**Plan metadata:** (see below — docs commit)

## Files Created/Modified
- `backend/src/db/schema.ts` - Added electionRaces table definition before questions, electionRaceId FK on questions, ElectionRace/NewElectionRace type exports
- `backend/src/routes/admin.ts` - Added electionRaces import, GET /election-races and POST /election-races endpoints with Zod validation
- `frontend/src/pages/admin/ElectionsPage.tsx` - New page: race list table + create form with dynamic candidate management
- `frontend/src/pages/admin/AdminLayout.tsx` - Added Elections nav entry and ElectionIcon SVG component
- `frontend/src/App.tsx` - Added ElectionsPage import and /admin/elections route

## Decisions Made
- Applied DDL directly via `pg` client rather than `drizzle-kit push` interactive prompt — drizzle-kit v0.31.9 asks "create or rename?" when it detects a new table that has no matching table in the DB, which requires TTY interaction that can't be automated. The schema.ts is still the canonical source of truth; Drizzle's runtime ORM reads it correctly.
- Kept `electionDate` stored as UTC TIMESTAMPTZ with separate `timezone` text field (IANA) — the timezone is for display and scheduling context, not storage offset
- Create form converts `<input type="date">` value (YYYY-MM-DD) to ISO 8601 with T00:00:00.000Z suffix before POSTing, satisfying `z.string().datetime({ offset: true })`

## Deviations from Plan

None — plan executed exactly as written. The drizzle-kit interactive prompt workaround was anticipated in the plan's note about "drizzle-kit prompts about destructive changes" — applied DDL directly as a non-destructive equivalent.

## Issues Encountered
- `drizzle-kit push` requires TTY interaction for the "create or rename?" prompt when a new table is detected — cannot be piped or suppressed with `--force` (which only auto-approves data-loss statements). Applied the DDL directly via Node.js pg client with dotenv loaded. Database reflects schema.ts exactly; both `election_races` table and `questions.election_race_id` column verified to exist with correct types and FK constraint.

## User Setup Required

None — no external service configuration required. Database changes were applied directly.

## Next Phase Readiness
- election_races table is live and functional — Phase 37 (election question generation) can insert races and mark questionsGenerated/followupGenerated
- questions.election_race_id FK is in place — generated questions can be linked to their source race
- Admin UI at /admin/elections allows manual race entry with full candidate management
- No blockers for Phase 35-02 (address/phone quality rule) — it has no dependency on election races

---
*Phase: 35-election-data-foundation-quality-rule*
*Completed: 2026-02-26*
