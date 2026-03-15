---
phase: 64-structured-officeholders
plan: 01
subsystem: content-generation
tags: [typescript, locale-config, prompt-engineering, officeholders, content-pipeline]

# Dependency graph
requires:
  - phase: 63-scaffold-fix
    provides: scaffold-collection.ts brace scanner fix enabling clean config generation
provides:
  - OfficeholderEntry interface exported from bloomington-in.ts (name, role, termEnd, district?)
  - officeholders?: OfficeholderEntry[] optional field on LocaleConfig
  - buildOfficeholderBlock() helper with load-bearing "name them SPECIFICALLY" prompt instruction
  - officeholders parameter on buildSystemPrompt and buildStateSystemPrompt
  - Biloxi-MS config populated with 8 officeholders (mayor + 7 ward council)
  - Washington-DC config populated with 4 officeholders (mayor, chair, AG, delegate)
affects:
  - 64-02 (auto-seeder depends on OfficeholderEntry type and prompt injection)
  - Any future locale config that adds officeholders field
  - generate-locale-questions.ts call sites (all 4 now pass config.officeholders)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OfficeholderEntry interface as structured officeholder data contract"
    - "buildOfficeholderBlock() prompt injection helper with load-bearing specificity wording"
    - "Optional officeholders field on LocaleConfig — backward compatible, no existing config changes needed"

key-files:
  created: []
  modified:
    - backend/src/scripts/content-generation/locale-configs/bloomington-in.ts
    - backend/src/scripts/content-generation/prompts/system-prompt.ts
    - backend/src/scripts/content-generation/prompts/state-system-prompt.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts
    - backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts
    - backend/src/scripts/content-generation/locale-configs/washington-dc.ts

key-decisions:
  - "OfficeholderEntry lives in bloomington-in.ts (sole LocaleConfig source of truth) — all other files import from there"
  - "buildOfficeholderBlock wording is load-bearing: 'name them SPECIFICALLY / do NOT write the current mayor' — needed by Plan 02 auto-seeder"
  - "officeholders field is optional — backward compat, zero changes to 15 existing configs"
  - "Both city and state prompt builders get officeholders param — state collections may have governors etc."

patterns-established:
  - "Prompt injection via buildOfficeholderBlock appended at end of system prompt template literal"
  - "Import OfficeholderEntry type from locale-configs/bloomington-in.js (not a separate types file)"

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 64 Plan 01: Structured Officeholders — Type Foundation Summary

**OfficeholderEntry interface + buildOfficeholderBlock prompt injector wired to all generation call sites, with Biloxi-MS (8) and Washington-DC (4) officeholders populated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T19:46:55Z
- **Completed:** 2026-03-15T19:50:05Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added `OfficeholderEntry` interface and optional `officeholders?` field to `LocaleConfig` — zero breaking changes to 17 existing configs
- Built `buildOfficeholderBlock()` with load-bearing "name them SPECIFICALLY / do NOT write 'the current mayor'" instruction, exported from system-prompt.ts
- Updated `buildSystemPrompt` and `buildStateSystemPrompt` to accept officeholders param; all 4 call sites in generate-locale-questions.ts now pass `config.officeholders`
- Populated Biloxi-MS with 8 officeholders (Mayor FoFo Gilich + 7 ward council, all expire 2029-06-01)
- Populated Washington-DC with 4 officeholders (Bowser, Mendelson, Schwalb, Norton) matching existing voice guidance expiry dates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add OfficeholderEntry interface and update LocaleConfig type** - `b304eb0` (feat)
2. **Task 2: Build prompt injection helper and update all call sites** - `1e031a2` (feat)
3. **Task 3: Populate officeholders for Biloxi-MS and Washington-DC** - `b943a96` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` - Added OfficeholderEntry interface and officeholders? field on LocaleConfig
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` - Added OfficeholderEntry import, buildOfficeholderBlock export, officeholders param on buildSystemPrompt
- `backend/src/scripts/content-generation/prompts/state-system-prompt.ts` - Added OfficeholderEntry import, buildOfficeholderBlock import, officeholders param on buildStateSystemPrompt
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Updated all 4 call sites to pass config.officeholders
- `backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts` - Added officeholders array (8 entries)
- `backend/src/scripts/content-generation/locale-configs/washington-dc.ts` - Added officeholders array (4 entries)

## Decisions Made
- `OfficeholderEntry` defined in `bloomington-in.ts` (the sole `LocaleConfig` source of truth) so all other files have one canonical import path — no separate types file needed
- The `buildOfficeholderBlock` wording is explicitly documented as load-bearing in code comments — "name them SPECIFICALLY" and the "do NOT write 'the current mayor'" contrast are required for Plan 02's auto-seeder to detect named vs. generic officeholder questions
- `officeholders` field is optional on `LocaleConfig` — the 15 existing configs with no officeholders data need zero changes; undefined/absent is treated the same as empty array in prompt builder
- Both `buildSystemPrompt` (city) and `buildStateSystemPrompt` (state) receive the officeholders param, since state collections may eventually have governors, AGs, etc.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 auto-seeder can now import `OfficeholderEntry` from `bloomington-in.ts` and rely on prompt injection being present for any locale with `officeholders` populated
- The Biloxi-MS and Washington-DC configs are ready for regeneration runs with named officeholder questions
- Any city or state locale config can add `officeholders` to get prompt injection automatically — no generator changes needed

---
*Phase: 64-structured-officeholders*
*Completed: 2026-03-15*
