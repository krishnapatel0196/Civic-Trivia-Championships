---
phase: 63-scaffold-fix
plan: 01
subsystem: tooling
tags: [scaffold, typescript, code-generation, content-pipeline]

# Dependency graph
requires: []
provides:
  - Fixed scaffold-collection.ts step3RegisterLocale brace scanner
  - Post-write sanity check validating both insertion sites
  - Elimination of post-scaffold git checkout workaround
affects:
  - 64-structured-officeholders
  - 65-auto-regenerate-expired
  - 66-gems-migration
  - All future collection scaffolding operations

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brace scanner: start from ` = {` assignment, not from variable declaration with type annotation"
    - "Post-write sanity check pattern: read file back after write, assert expected strings present"

key-files:
  created: []
  modified:
    - backend/src/scripts/scaffold-collection.ts

key-decisions:
  - "Start brace scan from assignmentPos + 3 (opening { of object literal) not from supportedLocalesStart (start of type-annotated declaration)"
  - "Use content.indexOf(' = {', supportedLocalesStart) to skip past TypeScript type annotation braces"
  - "Removed dead-code closingBraceForLocales block that computed a position but never used it"

patterns-established:
  - "Brace scanner: find the = { assignment first, then count braces starting at depth 0 from there"
  - "Post-write sanity check: readFileSync after writeFileSync, assert slug and configVarName present"

# Metrics
duration: 12min
completed: 2026-03-15
---

# Phase 63 Plan 01: Scaffold Fix Summary

**Fixed scaffold-collection.ts brace scanner to start from the ` = {` object literal assignment instead of the TypeScript type annotation, eliminating Scaffold Bug 2 and the post-scaffold `git checkout` workaround**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-15T18:43:00Z
- **Completed:** 2026-03-15T18:55:45Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed the root cause of Scaffold Bug 2: brace scanner no longer counts braces in the TypeScript type annotation `Record<string, () => Promise<{ default?: LocaleConfig; [key: string]: unknown }>>` before reaching the actual object literal `= {`
- Removed dead-code block (lines 366-375) that computed `closingBraceForLocales` / `altClose` positions that were never used
- Added post-write sanity check that reads the file back after `writeFileSync` and asserts both the slug and `${configVarName}Config` appear — exits with error if either is missing
- Verified end-to-end: test scaffold run for "Test City, TX" produced exactly two clean additions (one in `supportedLocales`, one in `configKeys`) with zero corruption of existing lines or the type annotation

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix brace-depth scanner in step3RegisterLocale** - `3d60ad6` (fix)
2. **Task 2: Verify fix with test scaffold run** - verification only, no additional commit needed

## Files Created/Modified
- `backend/src/scripts/scaffold-collection.ts` - Fixed step3RegisterLocale: brace scanner starts from ` = {`, dead code removed, post-write sanity check added

## Decisions Made
- The `assignmentPos + 3` offset positions the scanner at the `{` character of ` = {` (space, equals, space, then `{`). This is correct: `content.indexOf(' = {', ...)` returns the index of the space before `=`, so `+3` skips ` = ` and lands on `{`.
- The brace depth starts at 0 with the scanner positioned at `{`, so the first character increments depth to 1 and the matching `}` decrements it back to 0 — correct closure detection.
- The `configKeys` array scanner was already correct (no type annotation with `[` brackets before the array literal) — left unchanged per plan.
- Post-write sanity check uses simple string inclusion (`written.includes(...)`) which is sufficient — the slug and configVarName are unique strings.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - the fix was straightforward once the root cause was confirmed by inspecting the actual `generate-locale-questions.ts` line 101:
```
const supportedLocales: Record<string, () => Promise<{ default?: LocaleConfig; [key: string]: unknown }>> = {
```
The type annotation contains `{`, `}`, `[`, `]` characters that threw off the old brace scanner.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Scaffold tool is now safe to run without any manual workaround
- All v2.2 collection phases (64–68) can proceed with confident scaffolding
- No blockers or concerns

---
*Phase: 63-scaffold-fix*
*Completed: 2026-03-15*
