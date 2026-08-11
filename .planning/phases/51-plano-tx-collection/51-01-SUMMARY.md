---
phase: 51-plano-tx-collection
plan: "01"
subsystem: content-generation
tags: [plano-tx, locale-config, scaffold, voice-guidance, system-prompt, civic-trivia]

# Dependency graph
requires:
  - phase: 49-cambridge-ma-collection
    provides: scaffold-collection.ts with known bugs documented, cambridge-ma.ts locale config as model
  - phase: 50-massachusetts-state-collection
    provides: completed phase 50, seed.ts workflow confirmed
provides:
  - Plano TX collection seed entry in collections.ts (sortOrder 10, tier city, isActive false)
  - plano-tx.ts locale config with 5 topic categories and 15 source URLs
  - buildPlanoVoiceGuidance() function in system-prompt.ts with Council-Manager, Balloon Capital, corporate civic angle rules
  - plano-tx registered in generate-locale-questions.ts supportedLocales + configKeys
affects:
  - 51-02 (question generation for plano-tx — will use this locale config and voice guidance)
  - generate-locale-questions.ts --locale plano-tx --fetch-sources is now ready to run

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locale config pattern: 5 Plano-specific topic categories with civic angles replacing generic stub"
    - "Voice guidance pattern: Council-Manager structure disambiguation (City Manager = exec, Mayor = presiding)"
    - "Corporate civic angle pattern: companies mentioned only for zoning/economic development facts, never product/stock"

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/plano-tx.ts
    - .planning/phases/51-plano-tx-collection/51-01-SUMMARY.md
  modified:
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts
    - backend/src/scripts/content-generation/prompts/system-prompt.ts

key-decisions:
  - "planoTxConfig variable name derived from slug: plano-tx -> planoTx + Config (scaffold convention)"
  - "Bug 2 confirmed again: scaffold step3 inserts locale entry into type annotation line — fixed by moving into object body"
  - "5 topic categories (not 3 stub): city-government 30%, civic-history 25%, growth-story 20%, economic-development 15%, community-identity 10%"
  - "overshootFactor: 1.3 (same as cambridge-ma) — generates 130 questions, curate down to 100"
  - "Balloon Capital of Texas (1980) flagged as DURABLE TOPIC in voice guidance — high-value shareable civic trivia"
  - "Corporate civic angle: Frito-Lay 1985, JCPenney 1992, Toyota 2017 — civic significance only, no brand promotion"
  - "Collin County vs. City of Plano disambiguation in voice guidance — attribution errors are common failure mode"

patterns-established:
  - "Plano-specific: Council-Manager government — always distinguish City Manager (exec, appointed) from Mayor (presiding, elected)"
  - "Voice guidance placement: buildPlanoVoiceGuidance() placed after buildCambridgeVoiceGuidance() in system-prompt.ts"

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 51 Plan 01: Scaffold Plano TX Collection Summary

**Plano TX collection scaffolded with 5-category locale config (30/25/20/15/10 distribution), 15 source URLs, and Council-Manager voice guidance wired into the generation prompt**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-03T02:13:46Z
- **Completed:** 2026-03-03T02:19:00Z
- **Tasks:** 2 of 2
- **Files modified:** 4

## Accomplishments

- scaffold-collection.ts ran for plano-tx — created seed entry (sortOrder: 10), locale config stub, and registered in generate-locale-questions.ts
- Both known scaffold bugs fixed: Bug 2 (type annotation insertion) corrected; Bug 1 (trailing comma) was clean from scaffold
- seed.ts succeeded: 10 total collections now seeded, Plano TX included
- plano-tx.ts replaced with full locale config: 5 civic-focused topic categories, distribution summing to 100%, 15 authoritative source URLs
- buildPlanoVoiceGuidance() authored and wired — covers Council-Manager structure, Balloon Capital of Texas, growth story calibration, corporate civic angle rules, Collin County disambiguation, community identity framing, and expiration date guidance
- Zero TypeScript compilation errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the Plano collection and fix known bugs** - `d9f6ab1` (feat)
2. **Task 2: Author the Plano locale config and add voice guidance** - `e5d25c0` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/db/seed/collections.ts` - Added Plano TX seed entry (name, slug, theme #B45309, tier city, sortOrder 10)
- `backend/src/scripts/content-generation/locale-configs/plano-tx.ts` - Full locale config with 5 topics and 15 source URLs
- `backend/src/scripts/content-generation/generate-locale-questions.ts` - plano-tx added to supportedLocales object and planoTxConfig in configKeys array
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` - buildPlanoVoiceGuidance() function added and dispatch ternary wired

## Decisions Made

- **planoTxConfig variable name:** Derived by scaffold convention (slug: plano-tx -> planoTx + Config). Matches the cambridge-ma -> cambridgeMaConfig pattern.
- **5 topic categories (not 3):** Replaced generic stub (city-government/civic-history/local-services) with Plano-specific categories including growth-story (Sun Belt expansion) and economic-development (corporate HQ relocations) — these are the distinctive civic stories of Plano.
- **overshootFactor: 1.3:** Generates 130 candidates, curate to 100 — same strategy as Cambridge MA.
- **Balloon Capital of Texas flagged as DURABLE TOPIC:** 1980 designation by Governor Clements is highly shareable, not time-sensitive, and specific to Plano. High-value trivia anchor.
- **Corporate civic angle rules:** Companies (Frito-Lay, JCPenney, Toyota, Legacy West) mentioned only for zoning decisions, economic development facts, and city planning context — never for products or corporate performance.
- **Collin County disambiguation in voice guidance:** Common LLM failure mode is attributing county services to the city; voice guidance proactively lists what each level provides.
- **buildPlanoVoiceGuidance() positioned after buildCambridgeVoiceGuidance():** Consistent placement pattern — each new city gets added after the previous one.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Bug 2: plano-tx entry inserted into type annotation line in generate-locale-questions.ts**

- **Found during:** Task 1 (Scaffold the Plano collection and fix known bugs)
- **Issue:** scaffold-collection.ts step3 inserted `'plano-tx': () => import(...)` into the type annotation line (`Record<string, () => Promise<{ default?: LocaleConfig; [key: string]: unknown     'plano-tx': ...`) instead of into the object body
- **Fix:** Removed the mangled type annotation and inserted plano-tx entry correctly inside the supportedLocales object body after cambridge-ma, restoring the clean type signature
- **Files modified:** backend/src/scripts/content-generation/generate-locale-questions.ts
- **Verification:** TypeScript compiles clean; grep confirms plano-tx appears inside the object body
- **Committed in:** d9f6ab1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Expected and documented bug — plan explicitly called this out. No scope creep.

## Issues Encountered

None — scaffold bug was anticipated and documented in the plan. Fix was straightforward (manual Edit).

## User Setup Required

None — no external service configuration required. Next step is question generation which requires ANTHROPIC_API_KEY (already in backend/.env from prior phases).

## Next Phase Readiness

- Plano TX locale config ready: `npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale plano-tx --fetch-sources` will run cleanly
- Voice guidance wired — buildPlanoVoiceGuidance() will inject into generation prompts for quality calibration
- Collection in DB as isActive: false — will be activated after questions are reviewed and curated
- No blockers for question generation phase

---
*Phase: 51-plano-tx-collection*
*Completed: 2026-03-02*
