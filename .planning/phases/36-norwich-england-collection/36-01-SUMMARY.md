---
phase: 36-norwich-england-collection
plan: 01
subsystem: content-generation
tags: [locale-config, content-generation, seed, typescript, norwich, england, uk]

# Dependency graph
requires:
  - phase: 23-26-fremont-ca
    provides: LocaleConfig interface, generate-locale-questions.ts locale loader pattern, seed infrastructure

provides:
  - norwich-uk locale config with 8 topics, 90 target questions, batchSize 15, en-GB source URLs
  - buildNorwichVoiceGuidance() in system-prompt.ts, gated on norwich-uk slug
  - Norwich collection entry in seed/collections.ts (en-GB locale, inactive)
  - norwich-uk registered in seed-community.ts, merge-generated-questions.ts, and generate-locale-questions.ts

affects:
  - 36-02 (content generation run will use norwichConfig and buildNorwichVoiceGuidance)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locale config pattern extended to first non-US collection (en-GB localeCode)"
    - "Per-locale voice guidance functions in system-prompt.ts gated by localeSlug conditional"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/norwich-uk.ts
  modified:
    - backend/src/scripts/content-generation/prompts/system-prompt.ts
    - backend/src/db/seed/collections.ts
    - backend/src/db/seed/seed-community.ts
    - backend/src/scripts/merge-generated-questions.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "en-GB localeCode used for Norwich — first non-US collection, all others are en-US"
  - "batchSize 15 (not 25) for smaller topic-focused batches across 8 topics"
  - "overshootFactor 1.2: generate ~108, curate to 90"
  - "themeColor #1B4332 (deep forest green) — visually distinct from all existing collection colors"
  - "isActive: false — collection activated after questions seeded and reviewed in Phase 36 Plan 02"
  - "Two-tier governance distinction (City Council vs County Council) encoded as critical accuracy requirement in voice guidance"

patterns-established:
  - "New locales follow the same four-point registration: collectionsData, LOCALES, JSON_FILE_MAP, supportedLocales/configKeys"
  - "Voice guidance functions (buildXxxVoiceGuidance) are private (not exported) and gated on localeSlug in buildSystemPrompt return string"

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 36 Plan 01: Norwich Infrastructure Summary

**Norwich locale config (8 topics, 90 questions, en-GB), buildNorwichVoiceGuidance() with UK terminology and two-tier governance rules, and norwich-uk registered in all four pipeline entry points**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-26T05:16:49Z
- **Completed:** 2026-02-26T05:19:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created norwich-uk.ts locale config: 8 topic categories, 90 target questions, 'nor' external ID prefix, batchSize 15, overshootFactor 1.2, 10 en-GB source URLs
- Added buildNorwichVoiceGuidance() to system-prompt.ts: UK terminology requirements, forbidden US terms, two-tier government attribution rules, Lord Mayor clarification
- Registered norwich-uk in all four pipeline points: collectionsData (seed), LOCALES (community seed), JSON_FILE_MAP (merge), supportedLocales+configKeys (generation loader)
- Full TypeScript compilation passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Norwich locale config + voice guidance prompt** - `a323f2b` (feat)
2. **Task 2: Register Norwich in collection seed, community seed, merge script, and generation loader** - `6a86654` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/src/scripts/content-generation/locale-configs/norwich-uk.ts` - Norwich locale config with 8 topics, 90 target, 'nor' prefix, en-GB source URLs
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` - Added buildNorwichVoiceGuidance() and gated call on norwich-uk slug
- `backend/src/db/seed/collections.ts` - Norwich collection entry: en-GB, deep forest green, sortOrder 7, inactive
- `backend/src/db/seed/seed-community.ts` - Added norwich-uk to LOCALES array
- `backend/src/scripts/merge-generated-questions.ts` - Added norwich-uk to JSON_FILE_MAP
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - Added norwichConfig to supportedLocales and configKeys

## Decisions Made
- **en-GB localeCode:** Norwich is the first non-US collection; all existing entries use en-US. en-GB signals correct locale treatment.
- **batchSize 15:** Smaller than US locales (25) for tighter topic focus across 8 categories. Each batch covers roughly 1-2 topics.
- **overshootFactor 1.2:** Generate ~108, curate to 90 — conservative overshoot since Norwich has fewer public sources than LA or Fremont.
- **themeColor #1B4332:** Deep forest green chosen for visual distinction from existing colors (deep blue, deep red, emerald, ocean blue, golden brown).
- **isActive: false:** Collection stays hidden until questions are generated, reviewed, and seeded in Plan 02.
- **Two-tier governance in voice guidance:** Critical accuracy requirement encoded as a named section so the LLM doesn't attribute county responsibilities (roads, schools) to the city council.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All infrastructure ready for Plan 02 (generation run)
- Run `npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale norwich-uk --fetch-sources` from backend/ to start generation
- After generation and review, run `npm run db:seed` then `npm run db:seed:community` to seed Norwich questions
- No blockers.

---
*Phase: 36-norwich-england-collection*
*Completed: 2026-02-26*
