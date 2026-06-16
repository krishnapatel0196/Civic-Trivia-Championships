---
phase: 37-election-question-generation-script
plan: 01
subsystem: api
tags: [anthropic, claude, election, question-generation, drizzle, timezone, intl, typescript]

# Dependency graph
requires:
  - phase: 35-election-data-foundation-quality-rule
    provides: election_races table with seat, timezone, candidates, questionsGenerated fields

provides:
  - ElectionQuestionGenerator.ts service with generateElectionQuestions() as main export
  - GenerationBlockedError for idempotency enforcement
  - getEndOfDayUTC for timezone-aware expiry computation
  - CLI script generate-election-questions.ts for admin/dev use
  - npm script "generate-election-questions" registered in package.json

affects:
  - 37-02 (API route plan that calls generateElectionQuestions from this service)
  - Future: any admin UI that triggers generation via POST endpoint

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Election questions use elc-{raceId}-{seq} external ID format"
    - "Force-regenerate archives via Drizzle sql template literal on expirationHistory JSONB"
    - "Timezone-aware end-of-day computed with Intl.DateTimeFormat anchored on local noon"
    - "Collection slug passed explicitly as parameter (not derived from jurisdiction string)"
    - "elections-voting topic created lazily via resolveCollectionAndTopic if not present"

key-files:
  created:
    - backend/src/services/generation/ElectionQuestionGenerator.ts
    - backend/src/scripts/generate-election-questions.ts
  modified:
    - backend/package.json

key-decisions:
  - "Use claude-sonnet-4-6 directly — not the MODEL constant in anthropic-client.ts (which is outdated at claude-sonnet-4-5)"
  - "Collection slug is a required parameter (not derived from jurisdiction string matching)"
  - "elections-voting topic created lazily: resolveCollectionAndTopic inserts it if absent"
  - "Force-regenerate uses timestamp-suffixed externalIds to avoid ON CONFLICT DO NOTHING silently skipping new questions"
  - "getEndOfDayUTC anchors on local noon (not midnight) to correctly handle DST spring-forward dates"
  - "No Zod schema validation on Claude response — loose field check only (existing BatchSchema regex won't match elc- format)"

patterns-established:
  - "generateElectionQuestions is importable — CLI and API route both call the same service"
  - "Questions inserted with status=draft, electionRaceId, expiresAt (end-of-day local tz), subcategory=election-race"

# Metrics
duration: 12min
completed: 2026-02-26
---

# Phase 37 Plan 01: Election Question Generator Summary

**Election-specific question generation service + CLI: calls claude-sonnet-4-6 with MCQ guidance conditional on candidate count, computes timezone-aware expiresAt via Intl, seeds draft questions to both questions and collection_questions tables, enforces idempotency via questionsGenerated flag**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-26T14:57:12Z
- **Completed:** 2026-02-26T15:09:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Built ElectionQuestionGenerator.ts service (554 lines) with 7 exported functions/classes
- CLI script with --race-id, --collection, --force, --dry-run, --help flags registered in package.json
- Timezone-aware expiresAt using Intl.DateTimeFormat (no external date library) — handles DST correctly
- Force-regenerate archives old questions before creating new ones with unique externalIds
- GenerationBlockedError thrown with existingCount + generatedAt when questionsGenerated=TRUE without --force

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ElectionQuestionGenerator service** - `32db3b6` (feat)
2. **Task 2: Create CLI script + register in package.json** - `7274c94` (feat)

## Files Created/Modified

- `backend/src/services/generation/ElectionQuestionGenerator.ts` - Core generation service: getEndOfDayUTC, getQuestionTarget, buildElectionSystemPrompt, buildExternalId, GenerationBlockedError, resolveCollectionAndTopic, generateElectionQuestions
- `backend/src/scripts/generate-election-questions.ts` - CLI entry point with arg parsing and GenerationBlockedError handling
- `backend/package.json` - Added "generate-election-questions" script entry

## Decisions Made

- **claude-sonnet-4-6 hardcoded directly:** The anthropic-client.ts MODEL constant is still at `claude-sonnet-4-5`. Plan specified to use `'claude-sonnet-4-6'` directly to match the current model. Not using the constant avoids accidentally regressing if the constant is ever updated.
- **Collection slug as required parameter:** Plan 02 will add a collectionSlug field to the API endpoint body. For CLI use, `--collection` is required. No string-matching against jurisdiction names.
- **Lazy topic creation in resolveCollectionAndTopic:** Rather than requiring admins to pre-create the elections-voting topic, the service creates it on first use (with onConflictDoNothing for safety).
- **Timestamp-suffixed externalIds on force runs:** `elc-{raceId}-{ts36}-{seq}` prevents ON CONFLICT DO NOTHING from silently skipping questions that were archived but still have the same externalId.
- **Intl noon-anchor approach for DST safety:** `getEndOfDayUTC` uses local noon as reference (not midnight), correctly computing end-of-day even on DST spring-forward dates where local midnight doesn't exist.
- **Loose validation (not Zod BatchSchema):** The existing BatchSchema has an externalId regex and minimum batch size that would reject election question format. Implemented simple field presence check instead.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly on first pass. Import verification confirmed all 7 exports present.

## User Setup Required

None — no external service configuration required beyond existing ANTHROPIC_API_KEY in .env.

## Next Phase Readiness

- ElectionQuestionGenerator service is ready for Plan 02 to import `generateElectionQuestions` and expose via `POST /api/admin/election-races/:id/generate`
- CLI is usable immediately for dev/admin seeding against real race IDs
- Service correctly enforces idempotency and force-regenerate archiving
- No blockers for Plan 02

---
*Phase: 37-election-question-generation-script*
*Completed: 2026-02-26*
