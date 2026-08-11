---
phase: 60-washington-dc-collection
plan: 01
subsystem: collections
tags: [content-generation, washington-dc, locale-config, scaffold, civic-trivia]

# Dependency graph
requires:
  - phase: 59-oregon-state-collection
    provides: scaffold pattern, locale config shape, generation pipeline, dedup system
  - phase: 58-portland-or-collection
    provides: Wikipedia source URL strategy, source quality watchpoint, city config shape
provides:
  - Washington DC collection scaffolded (slug: washington-dc, tier: city, sortOrder: 14)
  - washington-dc.ts locale config with 6 district-framing topic categories
  - 103 draft questions generated and semantically deduped (pending curation)
affects:
  - 60-02 (activation plan — depends on curated question set)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scaffold Bug 2 workaround: revert generate-locale-questions.ts after scaffold, manually apply clean city config registration"
    - "DC uses city tier (no district tier in schema); district framing expressed via voice guidance in locale config"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/washington-dc.ts
    - backend/src/scripts/data/reports/generation-washington-dc-2026-03-14.json
    - backend/src/scripts/data/sources/washington-dc/ (11 Wikipedia source files)
  modified:
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "DC uses city tier (not a separate 'district' tier) — district framing lives entirely in voice guidance"
  - "iconIdentifier set to flag-us (not flag-dc which is not a valid frontend icon)"
  - "localeName corrected from scaffold-generated 'Washington, Washington D.C.' to 'Washington, DC'"
  - "Scaffold Bug 2 revert applied: generate-locale-questions.ts reverted and manually patched with clean registration"
  - "3 Wikipedia source URLs skipped during fetch (District_of_Columbia_voting_rights, statehood_movement, District_of_Columbia_Delegate returned no extractable content)"
  - "Expiring ratio 0.0% after generation — generator did not apply expiresAt to officeholder questions; to be addressed in curation"

patterns-established:
  - "Washington DC pattern: 6 civic topics — government structure, constitutional status, courts/judiciary, ward/neighborhood structure, history, civic identity"
  - "DC forbidden content: federal institution questions belong in Federal collection, not DC collection"

# Metrics
duration: 18min (pre-checkpoint; generation was 759s / ~13min of that)
completed: 2026-03-14
---

# Phase 60 Plan 01: Washington DC Collection — Scaffold & Generate Summary

**Washington, DC collection scaffolded with 6 district-framing topic categories; 103 draft questions generated and semantically deduped from 150 raw — awaiting human curation checkpoint**

## Performance

- **Duration:** 18 min (pre-checkpoint)
- **Started:** 2026-03-14T00:07:02Z
- **Completed (checkpoint):** 2026-03-14T00:25:07Z
- **Tasks:** 2/3 complete (paused at checkpoint:human-verify)
- **Files modified:** 3 source files + 12 data files

## Accomplishments

- Washington, DC collection seeded (sortOrder: 14, themeColor: #C41E3A, tier: city, isActive: false)
- Locale config authored with 6 topics, rich voice guidance, DC constitutional framing, explicit forbidden-content rules
- 150 questions generated, 143 passed validation, 40 archived by semantic dedup — 103 active draft questions
- All 3 Wikipedia source failures were non-critical (voting rights, statehood, delegate articles); 11 sources loaded successfully

## Task Commits

1. **Task 1: Scaffold Washington DC and author locale config** - `c291e4f` (feat)
2. **Task 2: Generate Washington DC questions** - `d4d5821` (feat)

## Files Created/Modified

- `backend/src/scripts/content-generation/locale-configs/washington-dc.ts` — Full locale config with 6 topic categories, district framing, forbidden content voice guidance
- `backend/src/db/seed/collections.ts` — Washington, DC seed entry added (sortOrder 14)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — City config registration for washington-dc/washingtonDcConfig
- `backend/src/scripts/data/reports/generation-washington-dc-2026-03-14.json` — Generation report
- `backend/src/scripts/data/sources/washington-dc/` — 11 Wikipedia source files for RAG

## Decisions Made

- **City tier for DC:** No district tier exists in the schema. DC uses `city` tier with district framing expressed entirely via voice guidance in the locale config. This is consistent with the decision logged in STATE.md.
- **iconIdentifier = flag-us:** The scaffold auto-derives `flag-dc` from the slug suffix, but this is not a valid frontend icon. Changed to `flag-us` which is appropriate for the US capital district.
- **localeName correction:** Scaffold expanded "DC" as a state abbreviation to "Washington D.C.", producing "Washington, Washington D.C." — corrected to "Washington, DC".
- **Scaffold Bug 2 revert applied:** generate-locale-questions.ts was corrupted (locale entry string injected into type annotation). Reverted to HEAD and manually applied clean import + configKeys entry.
- **Expiring ratio gap:** Generator did not apply `expiresAt` to current-officeholder questions. Curation checkpoint will need the curator to manually set expiresAt on Mayor Bowser (2027-01-02), Council Chair Mendelson (2027-01-02), AG Schwalb (2027-01-02), and DC Delegate questions (2027-01-03).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scaffold-generated localeName and iconIdentifier incorrect**

- **Found during:** Task 1 (scaffold step 4 verification)
- **Issue:** Scaffold derived `localeName: 'Washington, Washington D.C.'` (expanded "DC" as state abbreviation) and `iconIdentifier: 'flag-dc'` (not a valid frontend icon)
- **Fix:** Corrected localeName to `'Washington, DC'` and iconIdentifier to `'flag-us'` directly in collections.ts after scaffold ran
- **Files modified:** `backend/src/db/seed/collections.ts`
- **Verification:** Verified correct values in file before seeding
- **Committed in:** c291e4f (Task 1 commit)

**2. [Rule 3 - Blocking] Scaffold Bug 2 triggered — generate-locale-questions.ts corrupted**

- **Found during:** Task 1 (post-scaffold diff check)
- **Issue:** Step 3 of scaffold injected the new locale entry string directly into the TypeScript type annotation line, corrupting the file
- **Fix:** Reverted generate-locale-questions.ts to HEAD with `git checkout`, then manually added washington-dc entry to supportedLocales and 'washingtonDcConfig' to configKeys array
- **Files modified:** `backend/src/scripts/content-generation/generate-locale-questions.ts`
- **Verification:** TypeScript compiled clean (`npx tsc --noEmit` zero errors)
- **Committed in:** c291e4f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered

- **3 Wikipedia source URLs skipped:** `District_of_Columbia_voting_rights`, `Washington_D.C._statehood_movement`, and `District_of_Columbia_Delegate` returned no extractable content via the w/api.php endpoint. This is acceptable — 11 of 14 sources loaded successfully, providing strong coverage. The voting rights and statehood topics are covered by the main Washington, DC Wikipedia article (which loaded at 81,347 chars).
- **Batch 5 (dc-history) had 6 validation failures:** The "in what year" pure-lookup rule was triggered repeatedly for DC history questions, plus a retry-loop issue where regeneration kept producing the same duplicate question text. 6 questions from that batch were dropped. History topic ended with 19 questions (vs 25 target). Acceptable given the overall 103 active question count.
- **Expiring ratio = 0.0%:** Generation did not apply `expiresAt` to any questions. The curator must manually set expiration dates on officeholder questions during the curation checkpoint.

## Next Phase Readiness

- **Awaiting curation:** 103 draft questions in admin panel, ready for review
- **Curation priorities:** Archive federal institution questions (Congress, monuments, White House); set expiresAt on Mayor Bowser (2027-01-02), Council Chair Mendelson (2027-01-02), AG Schwalb (2027-01-02), Delegate (2027-01-03); verify no "city"/"state" language; confirm no US Capitol vs Wilson Building confusion
- **Gap-fill note:** If curation drops count below 80, run a targeted generation pass on dc-history or constitutional-status topics
- **Blocker:** None — checkpoint awaits human approval before plan 02 (activation)

---
*Phase: 60-washington-dc-collection*
*Completed (checkpoint): 2026-03-14*
