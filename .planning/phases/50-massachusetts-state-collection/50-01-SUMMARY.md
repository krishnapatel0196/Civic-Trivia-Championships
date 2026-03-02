---
phase: 50-massachusetts-state-collection
plan: "01"
subsystem: collections
tags: [typescript, civic-trivia, state-collection, scaffold, locale-config, seed]

# Dependency graph
requires:
  - phase: 47-collection-hierarchy-infra
    provides: state-configs/ auto-discovery in generate-locale-questions.ts, tier column in DB
  - phase: 49-cambridge-ma-collection
    provides: scaffold bug documentation (trailing comma fix, step3 insertion point fix)
provides:
  - Massachusetts State seed entry in collections.ts (tier='state', theme='#0C2340', sortOrder=9)
  - locale-configs/state-configs/massachusetts-state.ts with full config and voice guidance
  - DB row for Massachusetts State collection (isActive=false, ready for generation)
affects:
  - 50-02 (question generation uses massachusettsStateConfig and massachusettsStateFeatures)
  - 50-03 (activation uses the seed entry created here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State config auto-discovery: drop file in state-configs/ subdirectory, no registration needed"
    - "massachusettsStateFeatures export: all voice guidance lives in config file, not system-prompt.ts"
    - "Scaffold bug pattern: step3 inserts into type declaration instead of object body — revert city-path registration for state collections"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts
  modified:
    - backend/src/db/seed/collections.ts

key-decisions:
  - "scaffold-collection.ts step3 inserts 'massachusetts-state' into type annotation line (known bug from Phase 49) — fix by reverting generate-locale-questions.ts to HEAD state"
  - "massachusettsStateConfig.name is 'Massachusetts' (not 'Massachusetts State') — matches the display pattern for state collections"
  - "8 topic categories chosen: general-court and governors-council as distinct topics (unique MA civic features)"
  - "Governor's Council given its own topic slug due to uniqueness — 8 questions specifically about this body"

patterns-established:
  - "State config placement: always locale-configs/state-configs/{slug}.ts, never locale-configs/{slug}.ts"
  - "Two exports required per state config: {name}Config (LocaleConfig) and {name}StateFeatures (string)"
  - "No system-prompt.ts changes needed for state collections — stateFeatures string handles all voice guidance"

# Metrics
duration: 10min
completed: 2026-03-02
---

# Phase 50 Plan 01: Massachusetts State Collection Scaffold Summary

**Massachusetts State collection scaffolded with full LocaleConfig (8 topics, 100-question distribution, 17 source URLs) and comprehensive voice guidance string covering General Court naming, Governor's Council uniqueness, 1780 Constitution superlative, and county abolition**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-02T23:07:49Z
- **Completed:** 2026-03-02T23:18:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Scaffolded Massachusetts State collection with `tier='state'`, `theme='#0C2340'`, `sortOrder=9` in collections.ts
- Wrote complete `massachusettsStateConfig` with 8 topic categories covering MA's distinctive civic structures (General Court, Governor's Council, 1780 Constitution, county abolition)
- Wrote `massachusettsStateFeatures` voice guidance string with critical accuracy rules for question generation
- Seeded DB: Massachusetts State collection row exists (`isActive=false`, ready for generation)
- Verified `generate-locale-questions.ts --locale massachusetts-state --dry-run` loads correctly via state auto-discovery

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the Massachusetts State collection** - `951df7c` (feat)
2. **Task 2: Write the full Massachusetts state config** - `c07febf` (feat)

**Plan metadata:** `(pending — created in final commit step)`

## Files Created/Modified

- `backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts` - Full state config: 8 topic categories, topicDistribution summing to 100, 17 source URLs, massachusettsStateFeatures voice guidance string
- `backend/src/db/seed/collections.ts` - Massachusetts State seed entry (tier='state', theme='#0C2340', sortOrder=9, isActive=false)

## Decisions Made

- `massachusettsStateConfig.name` is `'Massachusetts'` (not `'Massachusetts State'`) — matches display pattern used by indiana and california state configs
- 8 topic categories rather than the standard 8 — General Court and Governor's Council each get their own topic slug due to their distinctive nature in MA civic government
- Governor's Council allocated 8 questions specifically — it's one of MA's most surprising civic facts and merits dedicated coverage
- `state-courts` allocated only 5 questions (smallest category) — most structural court info is covered by other states; MA's SJC is distinctive but the 1780 Constitution and General Court are more unique civic content

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scaffold step3 inserted locale entry into type annotation line**

- **Found during:** Task 1 (scaffold run)
- **Issue:** `scaffold-collection.ts` step3 inserted `'massachusetts-state': () => import(...)` directly into the type declaration `Record<string, () => Promise<{ default?: LocaleConfig; [key: string]: unknown ... }>>` rather than the object body — same bug documented in Phase 49
- **Fix:** Reverted `generate-locale-questions.ts` to its HEAD state (identical to pre-scaffold), which is the correct state — state locales are auto-discovered from `state-configs/` and need no city-path registration
- **Files modified:** `backend/src/scripts/content-generation/generate-locale-questions.ts` (reverted to HEAD; net diff = 0)
- **Verification:** `git diff HEAD -- generate-locale-questions.ts` shows no changes; `grep massachusetts generate-locale-questions.ts` returns no results (correct)
- **Committed in:** 951df7c (Task 1 commit — file at HEAD state, not staged)

**2. [Rule 1 - Bug] Scaffold also added `'massachusettsStateConfig'` to configKeys**

- **Found during:** Task 1 (scaffold run)
- **Issue:** Step3 also appended `'massachusettsStateConfig'` to the `configKeys` array. This is wrong for state configs — the configKeys array is only used in the city path loader; state configs use a separate auto-discovery path that doesn't use configKeys
- **Fix:** Included in the revert to HEAD — configKeys array restored to its pre-scaffold state
- **Verification:** Same as above — file matches HEAD

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug, both part of the known scaffold bug pattern from Phase 49)
**Impact on plan:** Both auto-fixes necessary for correctness. The scaffold bug is documented and handled. No scope creep.

## Issues Encountered

- Scaffold's `step3RegisterLocale` function uses brace-depth counting to find the end of the `supportedLocales` object, but its insertion point calculation is off by the size of the type annotation — it ends up inserting into the type declaration rather than the value body. This is the same documented bug from Phase 49 (49-01 decisions). The fix is always the same: revert `generate-locale-questions.ts` to HEAD for state collections (state auto-discovery makes city-path registration unnecessary anyway).

## User Setup Required

None — no external service configuration required beyond what's already set up.

## Next Phase Readiness

- Ready for 50-02: `generate-locale-questions.ts --locale massachusetts-state --fetch-sources` can run cleanly
- massachusettsStateConfig provides 17 source URLs for RAG fetch
- massachusettsStateFeatures provides all voice guidance for `buildStateSystemPrompt()`
- DB collection row exists (`isActive=false`) — generator can look up collectionId by slug
- No blockers for question generation

---
*Phase: 50-massachusetts-state-collection*
*Completed: 2026-03-02*
