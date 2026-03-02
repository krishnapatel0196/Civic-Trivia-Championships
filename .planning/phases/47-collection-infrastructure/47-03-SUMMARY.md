---
phase: 47-collection-infrastructure
plan: 03
subsystem: infra
tags: [content-generation, state-configs, auto-discovery, typescript, question-generator]

# Dependency graph
requires:
  - phase: 47-collection-infrastructure (plan 01)
    provides: state config files renamed to indiana-state.ts and california-state.ts (already completed in 47-01)
provides:
  - generate-locale-questions.ts with LoadedConfig interface and state config auto-discovery
  - State system prompt (buildStateSystemPrompt) used in both generateBatch and regenerateFn retry paths
  - DEPRECATED notice in generate-state-questions.ts with redirect to unified command
affects:
  - Phase 50 (Massachusetts): use --locale massachusetts-state with unified generator
  - Phase 52 (Texas): use --locale texas-state with unified generator
  - Any future state collection: drop a file in state-configs/ and run unified generator

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LoadedConfig interface: type-safe return from loadLocaleConfig replacing any side-channel"
    - "Auto-discovery pattern: dynamic import fallback from state-configs/{locale}.ts"
    - "Unified generator pattern: single script handles both city and state locales"

key-files:
  created: []
  modified:
    - backend/src/scripts/content-generation/generate-locale-questions.ts
    - backend/src/scripts/content-generation/generate-state-questions.ts
    - backend/src/scripts/content-generation/locale-configs/state-configs/indiana-state.ts (renamed in 47-01)
    - backend/src/scripts/content-generation/locale-configs/state-configs/california-state.ts (renamed in 47-01)

key-decisions:
  - "State config auto-discovery via dynamic import fallback — no registry needed"
  - "LoadedConfig interface instead of any side-channel for stateFeatures"
  - "Both generateBatch AND regenerateFn use buildStateSystemPrompt for state locales"
  - "generate-state-questions.ts deprecated but still functional during transition"

patterns-established:
  - "Adding a new state: drop state-configs/{slug}.ts with *Config and *StateFeatures exports — no generator code changes required"
  - "State config naming: file name must match locale slug (indiana-state.ts for --locale indiana-state)"

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 47 Plan 03: State Config Auto-Discovery Summary

**Unified question generator auto-discovers state configs from state-configs/ subdirectory, making --locale indiana-state and --locale california-state work identically to city locales**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T01:02:03Z
- **Completed:** 2026-03-02T01:10:19Z
- **Tasks:** 2
- **Files modified:** 2 (state config renames were already completed in 47-01)

## Accomplishments

- `generate-locale-questions.ts` now auto-discovers state configs from `state-configs/{locale}.ts` via dynamic import fallback — zero registry maintenance needed for new states
- Both the primary `generateBatch` path and the `regenerateFn` retry path correctly use `buildStateSystemPrompt` when `stateFeatures` is present — state questions that fail validation are retried with the correct prompt
- `LoadedConfig` interface provides type-safe return from `loadLocaleConfig`, eliminating the `as any` side-channel pattern
- `generate-state-questions.ts` shows deprecation notice redirecting users to the unified command

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename state config files to match locale slugs** - `83876c6` (feat — completed in 47-01, already committed)
2. **Task 2: Add state config auto-discovery and deprecation notice** - `d27b3c6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Unified generator with LoadedConfig interface, auto-discovery fallback, conditional state prompt in both generateBatch and regenerateFn, updated help text
- `backend/src/scripts/content-generation/generate-state-questions.ts` - Added DEPRECATED console.warn to main(), import paths already pointed to renamed files
- `backend/src/scripts/content-generation/locale-configs/state-configs/indiana-state.ts` - Renamed from indiana.ts (committed in 47-01)
- `backend/src/scripts/content-generation/locale-configs/state-configs/california-state.ts` - Renamed from california.ts (committed in 47-01)

## Decisions Made

- **Auto-discovery via dynamic import fallback** rather than a maintained registry. When a locale isn't in `supportedLocales`, try `import('./locale-configs/state-configs/${locale}.js')`. If the module is not found, throw a helpful error. No central list to update.
- **LoadedConfig interface** makes `stateFeatures` an optional typed field rather than a mutable side-channel on the config object (which would require `as any` casting).
- **regenerateFn must also use buildStateSystemPrompt** — validated during plan review and confirmed in implementation. Missing this would cause state question retries to get the city prompt, producing incorrect regenerated questions.
- **Kept generate-state-questions.ts functional** with a deprecation warning rather than removing it immediately. Allows any existing automation referencing the old script to keep working during transition.

## Deviations from Plan

### Discovery: Task 1 already completed in prior commit

- **Found during:** Task 1 execution
- **Issue:** `git mv` commands for indiana.ts → indiana-state.ts and california.ts → california-state.ts were already executed as part of the 47-01 commit (`83876c6`). The state-configs directory already had the renamed files.
- **Fix:** Verified files exist at correct paths, skipped re-running git mv. The state-configs are already correctly named.
- **Impact:** None — files at correct locations, Task 1 done criteria satisfied.

### Discovery: generate-state-questions.ts import paths already updated

- **Found during:** Task 2 execution
- **Issue:** The `loadStateConfig()` function in `generate-state-questions.ts` already used `indiana-state.js` and `california-state.js` import paths (updated in 47-01 commit).
- **Fix:** Only needed to add the deprecation notice to `main()`.
- **Impact:** None — functionality correct, only the deprecation notice remained to add.

---

**Total deviations:** 2 discovered (both prior work, no actual code fixes needed)
**Impact on plan:** Both discoveries were pre-completed work from 47-01. Task 2 still required substantive changes to generate-locale-questions.ts (LoadedConfig interface, auto-discovery, state prompt in both paths, help text update).

## Issues Encountered

The plan's verification grep `grep -A 30 'regenerateFn' ... | grep 'buildStateSystemPrompt'` returns no matches because the `regenerateFn` closure body is ~43 lines deep before reaching the `buildStateSystemPrompt` call — beyond the 30-line window. The implementation is correct at lines 493-494; the grep window is too narrow for this closure. Verified via `grep -n 'buildStateSystemPrompt'` showing hits at both line 197 (generateBatch) and line 493 (inside regenerateFn body).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- INFRA-02 complete: state collections now use the unified generation workflow
- Adding Massachusetts (Phase 50): create `state-configs/massachusetts-state.ts` with `massachusettsConfig` and `massachusettsStateFeatures` exports, run `--locale massachusetts-state`
- Adding Texas (Phase 52): create `state-configs/texas-state.ts`, run `--locale texas-state`
- No code changes to generate-locale-questions.ts needed for new states
- Phase 47 plan 02 (Collection Hierarchy) is the remaining plan in this phase

---
*Phase: 47-collection-infrastructure*
*Completed: 2026-03-02*
