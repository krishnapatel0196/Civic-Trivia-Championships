---
phase: 68-santa-monica-ca-collection
plan: 01
subsystem: content
tags: [collection, santa-monica, generation, officeholders, scaffold]

requires:
  - phase: 64-structured-officeholders
    provides: officeholders field in LocaleConfig, expiresAt auto-seeder

provides:
  - Santa Monica, CA locale config with 6 topic categories and 7 officeholders
  - 77 curated draft questions ready for activation
  - Banner image (Santa Monica Pier) at frontend/public/images/collections/santa-monica-ca.jpg
  - Santa Monica collection seed entry (isActive: false)

affects: [68-02]

tech-stack:
  added: []
  patterns: [officeholders field for expiresAt auto-seeding]

key-files:
  created:
    - backend/src/scripts/content-generation/locale-configs/santa-monica-ca.ts
    - frontend/public/images/collections/santa-monica-ca.jpg
  modified:
    - backend/src/db/seed/collections.ts
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "Expiring ratio 5.2% after curation — officeholder auto-seeder found few text matches (AI placed names as answer options); documented for retrospective, not re-generated"
  - "77 questions retained after curation (107 generated, 30 archived during review)"
  - "Banner image: Santa Monica Pier entrance photo from Wikimedia Commons (285KB)"

patterns-established:
  - "Santa Monica = independent city; SM/LA conflation is top curation concern"

completed: 2026-03-18
---

# Plan 68-01: Scaffold, Generate, Curate — Summary

**Santa Monica, CA scaffold complete: 77 curated draft questions, pier banner image, locale config with 7 officeholders and 6 topic categories**

## Performance

- **Duration:** ~30 min scaffold/config + ~17 min generation + curation
- **Completed:** 2026-03-18
- **Tasks:** 3 (including checkpoint)
- **Files modified:** 4

## Accomplishments

- Scaffolded Santa Monica, CA collection (slug: santa-monica-ca, prefix: smo, theme: #1E6B8A)
- Authored full locale config with 6 topic categories, 7 officeholders with termEnd dates, Wikipedia-first sources, and SM/LA anti-conflation voice guidance
- Generated 200 questions → 189 passed validation → 82 archived by semantic dedup → 107 draft → 77 after curation
- Added Santa Monica Pier banner image (285KB, from Wikimedia Commons)

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Scaffold and locale config | 5c7ea2b | feat |
| 2 | Generate questions and banner | ebb1c5c | feat |
| 3 | Human curation checkpoint | approved | — |

## Files Created/Modified

- `backend/src/scripts/content-generation/locale-configs/santa-monica-ca.ts` — Santa Monica locale config with 6 topics, 7 officeholders, voice guidance
- `backend/src/db/seed/collections.ts` — Santa Monica seed entry (isActive: false)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — santa-monica-ca registration
- `frontend/public/images/collections/santa-monica-ca.jpg` — Santa Monica Pier banner (285KB)

## Generation Stats

- Total generated: 200
- Passed validation: 189
- Semantic dedup archived: 82
- After dedup: 107 draft
- After human curation: 77 draft
- Cost: $2.04
- Duration: ~17 min

## Decisions Made

- **Expiring ratio 5.2% (target 15–30%):** The officeholder expiresAt auto-seeder found few name matches because the AI placed officeholder names primarily as answer options rather than in question text. This is a limitation of the name-match seeder pattern. Documented for retrospective — not re-generated since verdict is READY and 77 questions exceed the 50-question minimum.
- **77 questions after curation:** 107 draft → 30 archived during human review. Primary cuts: SM/LA conflation questions (referencing LAPD, LAUSD, LA Metro) and low-quality trivia.
- **Banner image:** Santa Monica Pier entrance photo from Wikimedia Commons (285KB). Pier is the canonical Santa Monica landmark.

## Deviations from Plan

None — plan executed as specified. Expiring ratio shortfall documented, not treated as a blocking issue.

## Issues Encountered

- **Officeholder expiresAt seeder achieved 5.2% ratio (below 15–30% target).** Root cause: AI generates questions like "Who is Santa Monica's mayor?" with the officeholder name as an answer option, not in the question text. The name-match seeder requires the name to appear in the question text. This is a systemic pattern now documented for the playbook retrospective. It is not a bug in the seeder — the seeder works correctly; the AI generation style does not produce text-embedded names.

## User Setup Required

None.

## Next Phase Readiness

- 77 curated draft questions ready for activation in Plan 68-02
- All SM/LA conflation questions cleared during curation
- Banner image confirmed in place
- Collection is NOT yet active (isActive: false in seed) — Plan 68-02 runs activate-collection.ts
