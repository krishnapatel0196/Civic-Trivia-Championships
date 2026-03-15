---
phase: 65-auto-regenerate-expired-questions
plan: 01
subsystem: api
tags: [anthropic, quality-rules, embeddings, drizzle, cron, content-generation]

# Dependency graph
requires:
  - phase: 64-structured-officeholders
    provides: OfficeholderEntry type and buildOfficeholderBlock in system-prompt.ts
  - phase: 63-scaffold-collection
    provides: locale config pattern and generate-locale-questions.ts patterns
provides:
  - generateReplacement() helper — never-throw, all-in-one generation/validation/seed
  - ReplacementResult type — { replaced: true } | { replaced: false; reason: string }
  - tryLoadLocaleConfig() — absolute path resolution from cron context
  - getNextExternalId() — queries all statuses to avoid externalId collision
affects:
  - 65-02-PLAN (expiration sweep wires this helper into the cron loop)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - never-throw helper pattern (outer try/catch returns result object, mirrors awardPlatformXp)
    - dynamic imports for heavy modules (db, embeddings) consistent with runWithinCollectionSemanticDedup
    - absolute path resolution for dynamic locale config imports via import.meta.url

key-files:
  created:
    - backend/src/cron/replacementGenerator.ts
  modified: []

key-decisions:
  - "generateReplacement() is entirely wrapped in try/catch — returns { replaced: false, reason } on any error, never throws"
  - "QuestionSchema.parse used (not BatchSchema) — BatchSchema requires 15-30 questions minimum and throws on single-question response"
  - "Direct insert with status 'active' (not seedQuestionBatch which hardcodes draft)"
  - "tryLoadLocaleConfig uses absolute paths via import.meta.url + resolve() — relative paths break in cron context"
  - "getNextExternalId queries ALL question statuses (active, expired, archived) — archived IDs still in DB with UNIQUE constraint"
  - "Semantic dedup scopes to active-only questions — the just-archived question is excluded because its status is now expired"
  - "OPENAI_API_KEY guard skips dedup gracefully — logs structured warn and proceeds to seed"
  - "Quality fail is non-retrying — cleanliness over gap-filling; single retry on parse-error and near-duplicate only"

patterns-established:
  - "never-throw helper: outer try/catch returns result object for cron safety"
  - "getNextExternalId: query MAX(SUBSTRING(external_id FROM '[0-9]+')::int) across all statuses"
  - "tryLoadLocaleConfig: probe both city and state-configs paths with null return on miss"

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 65 Plan 01: replacementGenerator.ts Summary

**Never-throw generateReplacement() helper using Anthropic API + QuestionSchema + auditQuestion + semantic dedup, seeding directly as 'active' status**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T20:59:43Z
- **Completed:** 2026-03-15T21:02:40Z
- **Tasks:** 2 (task 2 is verification — no new code)
- **Files modified:** 1

## Accomplishments
- Created `replacementGenerator.ts` with `generateReplacement()` exported function and `ReplacementResult` type
- All 7 research pitfalls from 65-RESEARCH.md are addressed in the implementation
- TypeScript compiles cleanly with zero errors (`npx tsc --noEmit` passes)
- Module is ready for Plan 02 to import and wire into the expiration sweep cron

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Create and verify replacementGenerator.ts** - `922bbc3` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `backend/src/cron/replacementGenerator.ts` - generateReplacement() helper with tryLoadLocaleConfig() and getNextExternalId() internals

## Decisions Made
- QuestionSchema (not BatchSchema) — BatchSchema has a `min(15)` constraint and throws on single-question AI response; this is documented in the avoidance notes
- Direct insert with `status: 'active'` instead of `seedQuestionBatch()` — seedQuestionBatch hardcodes `status: 'draft'`, but replacements must be immediately playable
- Dynamic imports for db, drizzle-orm, embeddings — consistent with the `runWithinCollectionSemanticDedup` pattern used elsewhere in the codebase
- Absolute path construction via `fileURLToPath(import.meta.url)` + `resolve(__dirname, '..', 'scripts', ...)` — the cron directory is one level deeper than scripts, so relative imports would break at runtime
- `getNextExternalId` queries across all statuses (active, expired, archived) — archived questions remain in DB with a UNIQUE constraint on `external_id`, so they must be included in the MAX() query to avoid collision
- Quality fail is not retried — per 65-CONTEXT.md: "cleanliness over gap-filling"; only parse-error and near-duplicate trigger one retry each
- `expiresAt` passes through from the AI-generated question — officeholder replacement questions should still have expiry dates

## Deviations from Plan

None — plan executed exactly as written. All 7 pitfalls preemptively addressed:
1. Null subcategory guard: `if (topic === null) return { replaced: false, reason: 'no-topic' }`
2. Multi-collection: handled by Plan 02 query; `collectionId` param present
3. externalId collision: `getNextExternalId` queries ALL statuses
4. Dynamic import paths: absolute via `fileURLToPath` + `resolve`
5. OPENAI_API_KEY: guard at line 142, skips dedup with structured warn log
6. expiresAt passthrough: line 269 passes `parsedQuestion.expiresAt` through to insert
7. BatchSchema: not referenced anywhere in file; only `QuestionSchema` used

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required beyond env vars already in use.

## Next Phase Readiness
- `generateReplacement()` is ready to import in Plan 02 (`expirationSweep.ts` enhancement)
- Plan 02 needs to: query collection ID + subcategory for each expired question, call `generateReplacement()`, log the result
- No blockers.

---
*Phase: 65-auto-regenerate-expired-questions*
*Completed: 2026-03-15*
