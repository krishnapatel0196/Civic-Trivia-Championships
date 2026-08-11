---
phase: 49-cambridge-ma-collection
plan: "01"
subsystem: content-generation
tags: [scaffold, locale-config, system-prompt, cambridge-ma, civic-trivia, plan-e, ranked-choice]

# Dependency graph
requires:
  - phase: 48-activate-banked-collections
    provides: standard collection activation workflow (audit → curate → activate → verify)
provides:
  - Cambridge MA seed entry in collections.ts (sortOrder 8, tier city, theme #1E3A5F)
  - cambridge-ma.ts locale config with 6 topic categories and 17 source URLs
  - buildCambridgeVoiceGuidance() in system-prompt.ts with full accuracy guidelines
  - cambridge-ma registered in generate-locale-questions.ts supportedLocales
affects:
  - 49-02 (generate-curate): uses cambridge-ma.ts and voice guidance directly
  - 49-03 (activate): uses seed entry and DB record

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "locale-config pattern: LocaleConfig import from bloomington-in.js, overshootFactor: 1.3"
    - "voice guidance pattern: locale-slug ternary chain in buildSystemPrompt() template literal"
    - "scaffold-then-replace pattern: run scaffold for registration, then overwrite stub with full config"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/cambridge-ma.ts
  modified:
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts
    - backend/src/scripts/content-generation/prompts/system-prompt.ts

key-decisions:
  - "Used scaffold-collection.ts to handle 3-file registration, then replaced stub with full config"
  - "Research-verified facts override CONTEXT.md: living wage May 1999 (not 1998, not first US city); City Hall Richardsonian Romanesque (not neoclassical)"
  - "Harvard/MIT strict limitation: universities cannot be primary civic subject in any question"
  - "City Manager vs Mayor distinction is CRITICAL accuracy requirement for Cambridge"
  - "cambridgeMaConfig variable name derived by scaffold from slug (cambridge-ma → cambridgeMa)"

patterns-established:
  - "Voice guidance functions placed adjacent to other locale guidance functions in system-prompt.ts"
  - "Scaffold step3 has insertion bug — manually verify and fix generate-locale-questions.ts after scaffold runs"

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 49 Plan 01: Cambridge MA Collection Scaffold Summary

**Cambridge MA collection scaffolded with Plan E government accuracy guidelines, research-corrected facts, and full locale config ready for question generation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T15:02:55Z
- **Completed:** 2026-03-02T15:09:39Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Scaffolded Cambridge MA collection to DB (sortOrder 8, tier city, theme #1E3A5F, isActive false)
- Authored full `cambridgeMaConfig` with 6 topic categories (city-government 30%, civic-history 25%, elections-voting 15%, civic-firsts-policy 15%, neighborhoods-community 10%, schools-libraries 5%) and 17 authoritative source URLs
- Added `buildCambridgeVoiceGuidance()` to system-prompt.ts with comprehensive accuracy guidelines covering Plan E City Manager structure, PR voting history, living wage accurate framing, Harvard/MIT limitation, and "feel seen" community representation

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the Cambridge collection** - `212f8aa` (feat)
2. **Task 2: Author the Cambridge locale config** - `b28933b` (feat)
3. **Task 3: Add Cambridge voice guidance to system-prompt.ts** - `fb5a5a3` (feat)
4. **Fix: Correct scaffold-corrupted registration** - `377dd3e` (fix)

## Files Created/Modified

- `backend/src/scripts/content-generation/locale-configs/cambridge-ma.ts` - Full Cambridge locale config with 6 topics, 17 source URLs, research-corrected accuracy notes
- `backend/src/db/seed/collections.ts` - Added Cambridge MA seed entry (sortOrder 8, fixed missing comma on Norwich entry)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Registered cambridge-ma in supportedLocales and cambridgeMaConfig in configKeys
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` - Added buildCambridgeVoiceGuidance() function and wired dispatch

## Decisions Made

- Used scaffold-collection.ts to automate 3-file registration, then replaced the stub with the full config — this is the established pattern for new collections
- Research-verified facts intentionally override CONTEXT.md where they diverge: living wage passed May 1999 (CONTEXT.md said 1998 and "first US city" — both wrong); Cambridge City Hall is Richardsonian Romanesque (CONTEXT.md said neoclassical — wrong)
- Harvard/MIT strict limitation enforced in voice guidance: universities cannot anchor any question; only incidental civic relationships (PILOT payments, zoning) are permitted
- City Manager vs Mayor distinction documented as CRITICAL in voice guidance — this is the most common misconception about Cambridge governance
- cambridgeMaConfig variable name confirmed from scaffold output (derives from slug: cambridge-ma → cambridgeMa + Config suffix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing trailing comma on Norwich entry in collections.ts**
- **Found during:** Task 1 (Scaffold the Cambridge collection)
- **Issue:** scaffold-collection.ts step1InsertSeedEntry sliced before `];` and inserted new entry, but the existing Norwich entry had no trailing comma — resulting in invalid TypeScript (two adjacent objects without comma separator)
- **Fix:** Added missing comma after Norwich entry's closing brace on line 87
- **Files modified:** `backend/src/db/seed/collections.ts`
- **Verification:** `npx tsx src/db/seed/seed.ts` ran successfully; Collections: 8 in summary
- **Committed in:** 212f8aa (Task 1 commit)

**2. [Rule 1 - Bug] Scaffold step3 corrupted generate-locale-questions.ts type declaration**
- **Found during:** Post-task final verification (TypeScript compile check)
- **Issue:** scaffold-collection.ts step3RegisterLocale inserted the cambridge-ma locale entry into the type declaration line of the `supportedLocales` const (the `Record<string, ...>` type annotation) rather than into the object body. This corrupted the TypeScript syntax with 14 TS errors.
- **Fix:** Restored correct type annotation line; placed cambridge-ma entry correctly inside the object body before the closing `};`
- **Files modified:** `backend/src/scripts/content-generation/generate-locale-questions.ts`
- **Verification:** `npx tsc --noEmit` returned clean (no output); cambridge-ma entry visible in supportedLocales object
- **Committed in:** 377dd3e (fix commit after Task 3)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs in scaffold-collection.ts output)
**Impact on plan:** Both bugs from scaffold script output, not plan logic. All fixes necessary for correctness. No scope creep. The scaffold script's step3 insertion algorithm has a structural flaw when the type declaration and opening brace span multiple conceptual regions — worth noting for future scaffolding.

## Issues Encountered

The scaffold-collection.ts script has two bugs:
1. Does not add trailing comma to the last existing entry before inserting new entries in collections.ts
2. step3RegisterLocale has an off-by-one in its brace-tracking that inserts the locale entry into the type declaration line rather than the object body

Both are auto-fixable (Rule 1) and were fixed immediately. The scaffold remains useful for the 3-file registration pattern despite these bugs.

## User Setup Required

None - no external service configuration required beyond the existing DATABASE_URL in backend/.env (already configured).

## Next Phase Readiness

- Cambridge MA collection exists in DB (isActive: false, ready for question generation)
- `generate-locale-questions.ts --locale cambridge-ma --fetch-sources` will run cleanly
- system-prompt.ts will inject Cambridge-specific voice guidance for localeSlug === 'cambridge-ma'
- Ready for Plan 49-02: generate questions using `--fetch-sources` then curate

---
*Phase: 49-cambridge-ma-collection*
*Completed: 2026-03-02*
