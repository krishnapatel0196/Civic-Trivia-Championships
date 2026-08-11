---
phase: 52-texas-state-collection
plan: "01"
subsystem: content
tags: [civic-trivia, collection-scaffold, state-config, mixed-durability, texas]

# Dependency graph
requires:
  - phase: 47-collection-hierarchy-infra
    provides: state-configs/ auto-discovery via dynamic import fallback in generate-locale-questions.ts
  - phase: 50-massachusetts-state-collection
    provides: state config pattern (two exports: *Config + *StateFeatures), overshootFactor field
  - phase: 51-plano-tx-collection
    provides: confirmed scaffold bugs (step3 inserts into type annotation line)
provides:
  - Texas State seed entry in collections.ts (tier='state', theme='#BF0D3E', sortOrder=11)
  - locale-configs/state-configs/texas-state.ts with full texasStateConfig and texasStateFeatures
  - First mixed-durability pattern: both expiring (expiresAt 2027-01-19) and durable questions in one collection
  - Texas State collection row in DB (isActive=false, ready for question generation)
affects:
  - 52-02: generate Texas State questions using --locale texas-state --fetch-sources
  - future state collections: mixed-durability pattern now established as viable option

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mixed-durability state config: texasStateFeatures instructs LLM to generate both expiring officeholder questions (expiresAt set) and durable structural questions (expiresAt null) in one run"
    - "State config auto-discovery: drop texas-state.ts in locale-configs/state-configs/ with *Config and *StateFeatures exports -- no registration in generate-locale-questions.ts needed"
    - "Scaffold bug workaround: revert step3 insertion from type annotation line, revert configKeys addition -- state path is automatic"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts
  modified:
    - backend/src/db/seed/collections.ts

key-decisions:
  - "texasStateConfig.name is 'Texas' (not 'Texas State') -- matches state collection display pattern from Phase 50"
  - "targetQuestions: 70 with overshootFactor: 1.3 -- generates 91 candidates for curation to 70"
  - "Mixed-durability pattern: first collection to explicitly instruct both durable and expiring questions; no fixed ratio required"
  - "expiresAt: '2027-01-19T00:00:00Z' for all current-officeholder questions (November 2026 election, January 2027 inauguration)"
  - "Comptroller caution: Glenn Hegar resigned February 2025, Kelly Hancock acting -- voice guidance instructs focus on ROLE not current officeholder"
  - "8 topic categories: state-legislature(14), governor-executive(12), distinctive-institutions(10), texas-history-identity(12), state-judiciary(6), texas-constitution(6), civic-landmarks(5), public-policy(5)"
  - "Scaffold Bug 2 confirmed again: step3 inserts into type annotation line not object body in generate-locale-questions.ts -- reverted; state auto-discovery handles registration"
  - "import path in state-configs/ must be '../bloomington-in.js' (not './bloomington-in.js') -- subdirectory requires parent traversal"

patterns-established:
  - "Mixed-durability: texasStateFeatures is the first to instruct mixed expiresAt usage -- future state collections may adopt this pattern when current-officeholder trivia is desired"
  - "State-only rule: explicitly prohibit city-specific facts by name in voice guidance (Austin city vs Austin state institutions distinction)"

# Metrics
duration: 8min
completed: 2026-03-03
---

# Phase 52 Plan 01: Texas State Collection Summary

**Texas State scaffolded with mixed-durability voice guidance -- biennial legislature, Railroad Commission, two courts of last resort, plural executive, expiresAt 2027-01-19 for officeholders**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T07:26:40Z
- **Completed:** 2026-03-03T07:35:00Z
- **Tasks:** 2
- **Files modified:** 2 (+ generate-locale-questions.ts reverted to HEAD)

## Accomplishments

- Scaffolded Texas State collection with `tier='state'`, `theme='#BF0D3E'`, `sortOrder=11` in collections.ts and DB
- Authored complete `texas-state.ts` with 8 topic categories, topicDistribution summing to 70, overshootFactor 1.3, 18 source URLs
- Established mixed-durability pattern in texasStateFeatures: first collection to instruct both expiring (expiresAt) and durable (null) questions in one run
- TypeScript compiles clean, dry-run confirms auto-discovery loads texas-state as `Type: State collection`, no city-path registration needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the Texas State collection** - `e607695` (feat)
2. **Task 2: Write the full Texas state config with mixed-durability voice guidance** - `c2b518f` (feat)

## Files Created/Modified

- `backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts` - Full state config with texasStateConfig (8 topics, 70 target, 18 sources) and texasStateFeatures (mixed-durability voice guidance)
- `backend/src/db/seed/collections.ts` - Texas State seed entry added (tier='state', themeColor='#BF0D3E', isActive=false, sortOrder=11)

## Decisions Made

- **texasStateConfig.name is 'Texas'** (not 'Texas State') -- matches state display convention from Phase 50 decision
- **targetQuestions: 70 with overshootFactor: 1.3** -- generates 91 candidates for quality curation
- **Mixed-durability pattern (first collection):** texasStateFeatures explicitly instructs LLM to generate both expiring officeholder questions (expiresAt: "2027-01-19T00:00:00Z") and durable structural/historical facts (expiresAt: null) -- no fixed ratio
- **expiresAt: "2027-01-19T00:00:00Z"** for all current-officeholder questions (November 2026 election, January 19, 2027 inauguration)
- **Comptroller caution:** Glenn Hegar resigned February 2025; Kelly Hancock acting -- voice guidance instructs focus on role/powers, not current officeholder name; flag for manual review
- **8 topic categories:** state-legislature(14), governor-executive(12), distinctive-institutions(10), texas-history-identity(12), state-judiciary(6), texas-constitution(6), civic-landmarks(5), public-policy(5)
- **Scaffold Bug 2 confirmed again:** scaffold step3 inserts texas-state entry into type annotation line of generate-locale-questions.ts -- reverted to HEAD; state auto-discovery handles registration
- **Import path fix:** state-configs/ requires `../bloomington-in.js` not `./bloomington-in.js`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scaffold inserted texas-state into type annotation line in generate-locale-questions.ts**
- **Found during:** Task 1 (scaffold execution)
- **Issue:** Scaffold step3 injected `'texas-state': () => import(...)` into the type declaration line rather than the object body, creating malformed TypeScript. Also added `'texasStateConfig'` to configKeys array (not needed for state auto-discovery).
- **Fix:** Reverted the type annotation line to clean form; removed texasStateConfig from configKeys array. Both changes bring the file back to exact HEAD state -- state auto-discovery handles texas-state via dynamic import fallback.
- **Files modified:** backend/src/scripts/content-generation/generate-locale-questions.ts (reverted to HEAD)
- **Verification:** `git diff HEAD generate-locale-questions.ts` shows no diff (clean revert). `grep texas generate-locale-questions.ts` returns empty.
- **Committed in:** e607695 (Task 1 commit)

**2. [Rule 1 - Bug] Scaffold-generated import path used wrong relative depth**
- **Found during:** Task 2 (writing full config)
- **Issue:** Stub generated by scaffold used `import type { LocaleConfig } from './bloomington-in.js'` -- correct for city locale-configs/ but wrong after moving to state-configs/ subdirectory.
- **Fix:** Changed to `../bloomington-in.js` (parent directory traversal) when writing the full file.
- **Files modified:** backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts
- **Verification:** `npx tsc --noEmit` produces no errors.
- **Committed in:** c2b518f (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both are recurring scaffold bugs documented in prior phases (49, 50, 51). No scope creep. Auto-fixed correctly per deviation rules.

## Issues Encountered

None - scaffold bugs were anticipated and handled per prior phase experience.

## User Setup Required

None - no external service configuration required. Texas State collection row is in DB with isActive=false. Ready for question generation.

## Next Phase Readiness

- Texas State collection row exists in DB (isActive=false)
- texas-state.ts is in the correct location (locale-configs/state-configs/) with both required exports
- Run `cd backend && npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale texas-state --fetch-sources` to generate questions
- After curation: `cd backend && npx tsx src/scripts/activate-collection.ts --slug texas-state --prefix tex`
- Add banner image: `frontend/public/images/collections/texas-state.jpg`

---
*Phase: 52-texas-state-collection*
*Completed: 2026-03-03*
