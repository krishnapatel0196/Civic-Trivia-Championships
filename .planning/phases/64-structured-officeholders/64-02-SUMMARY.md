---
phase: 64-structured-officeholders
plan: 02
subsystem: content-generation
tags: [officeholders, expires-at, generation-pipeline, audit, locale-config, drizzle-orm]

# Dependency graph
requires:
  - phase: 64-01
    provides: OfficeholderEntry type in LocaleConfig, officeholders arrays in Biloxi-MS and Washington-DC configs, buildOfficeholderBlock in prompt builders
provides:
  - seedOfficeholderExpiresAt: post-generation seeder that sets expiresAt from officeholder termEnd via name-match
  - tryLoadLocaleConfig: helper in audit script that loads locale config by slug (city then state path)
  - Officeholder coverage reporting section in audit-collection-readiness.ts
affects:
  - phase-65-auto-regenerate: expiring questions now auto-tagged from structured officeholders data
  - any future collection additions: officeholders field in locale config auto-flows into expiresAt seeding

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Post-generation seeding pattern: seedOfficeholderExpiresAt runs after seedQuestionBatch in generation loop"
    - "Graceful locale config loading: tryLoadLocaleConfig tries city path then state-configs path, returns null on miss"
    - "IS NULL safety filter: expiresAt seeder only touches null dates to preserve manual corrections"
    - "Non-blocking audit warnings: zero-coverage officeholders warn but do not affect exit code"

key-files:
  created: []
  modified:
    - backend/src/scripts/content-generation/generate-locale-questions.ts
    - backend/src/scripts/audit-collection-readiness.ts

key-decisions:
  - "seedOfficeholderExpiresAt uses dynamic imports for db/questions/sql (consistent with runWithinCollectionSemanticDedup pattern in the same file)"
  - "expiresAt IS NULL filter in seeder query is mandatory — prevents overwriting manually corrected expiry dates"
  - "tryLoadLocaleConfig returns null (not throws) for collections without locale configs — all 17 existing collections silently skip the coverage section"
  - "Officeholder coverage section is non-blocking — zero-coverage count produces warnings only, consistent with expiring-ratio warning pattern above it"

patterns-established:
  - "Post-generation automation: any new post-seeding step follows the same !args.dryRun + config.field guard pattern"
  - "Audit section ordering: blocking checks first (net count), then non-blocking warnings (expiring ratio, officeholder coverage)"

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 64 Plan 02: Structured Officeholders — Pipeline Integration Summary

**Post-generation expiresAt auto-seeder wired into generation pipeline; audit script gains per-officeholder coverage reporting via tryLoadLocaleConfig**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T19:53:28Z
- **Completed:** 2026-03-15T19:56:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `seedOfficeholderExpiresAt` function added to generation pipeline: scans draft+active questions with `expiresAt IS NULL`, matches officeholder names case-insensitively, sets `expiresAt` to `termEnd` date — eliminating the manual targeted-pass step
- `tryLoadLocaleConfig` helper added to audit script: tries `locale-configs/{slug}.js` then `locale-configs/state-configs/{slug}.js`, returns `null` for collections without configs
- Officeholder Coverage section added to audit output: reports per-officeholder question count, warns on zero-coverage officeholders (non-blocking), silently skips for collections with no `officeholders` array

## Task Commits

Each task was committed atomically:

1. **Task 1: Add seedOfficeholderExpiresAt to generation pipeline** - `a745227` (feat)
2. **Task 2: Add officeholder coverage reporting to audit script** - `7a4b743` (feat)

**Plan metadata:** _(docs commit follows this summary)_

## Files Created/Modified

- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Added `OfficeholderEntry` import, `seedOfficeholderExpiresAt` function, and call site after `seedQuestionBatch`
- `backend/src/scripts/audit-collection-readiness.ts` - Added `LocaleConfig` import, `tryLoadLocaleConfig` helper, and officeholder coverage reporting section

## Decisions Made

- `seedOfficeholderExpiresAt` uses dynamic imports for `db`/`questions`/`sql` — consistent with the existing `runWithinCollectionSemanticDedup` pattern in the same file (avoids top-level DB connection at import time)
- `expiresAt IS NULL` filter in the seeder query is non-negotiable — prevents overwriting manually corrected expiry dates on re-runs
- `tryLoadLocaleConfig` returns `null` rather than throwing — all 17 existing collections without `officeholders` arrays silently produce no output in the audit, no migration required
- Officeholder coverage section exits with code 0 regardless of zero-coverage count — mirrors the existing expiring-ratio warning pattern

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 64 complete: `OfficeholderEntry` type, prompt injection (Plan 01), post-generation expiresAt seeder, and audit coverage reporting (Plan 02) all shipped
- Collections with `officeholders` defined (Biloxi-MS, Washington-DC) will automatically get `expiresAt` set on next generation run
- Phase 65 (auto-regenerate expired questions) can rely on `expiresAt` being set systematically from structured officeholders data

---
*Phase: 64-structured-officeholders*
*Completed: 2026-03-15*
