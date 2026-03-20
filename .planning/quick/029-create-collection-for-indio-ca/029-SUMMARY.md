# Quick Task 029 — Create Collection for Indio, CA

**Status:** Complete
**Date:** 2026-03-20
**Commits:** fdae5f3, 6595b54

## What Was Done

Created and activated a new civic trivia collection for Indio, CA — the "City of Festivals" in the Coachella Valley.

### Task 1: Scaffold + Seed + Locale Config (fdae5f3)
- Scaffolded `indio-ca` collection with theme `#D97706` (desert amber)
- Wrote full locale config with 6 topic categories targeting 130 questions
- Registered in `generate-locale-questions.ts` and `collections.ts` seed
- Seeded collection to database

### Task 2: Generate + Activate (6595b54)
- Generated 169 questions across 6 topic batches
- Fixed prefix collision: Indiana already uses `ind-085+`, so re-prefixed all Indio draft questions from `ind-116..ind-290` → `ica-001..ica-169` in DB and updated locale config
- Downloaded banner image: Shields Date Garden (Wikimedia Commons CC-BY, 800×450px)
- Activated collection: 169 questions live

## Key Details

| Field | Value |
|-------|-------|
| Slug | `indio-ca` |
| Prefix | `ica` (corrected from `ind` — conflict with Indiana) |
| Theme | `#D97706` (desert amber) |
| Questions | 169 active |
| Topics | city-government, civic-history, landmarks-culture, local-services, economy-development, community-environment |
| Banner | Shields Date Garden, Indio CA (Wikimedia Commons) |

## Issues Encountered

**Prefix collision:** The planner selected `ind` as the prefix, believing it was unused (per memory). In reality, Indiana had already expanded from `ins-` to `ind-085+` questions in a later generation run. Resolved by re-prefixing all 169 Indio draft questions to `ica-` via SQL UPDATE before activation.

Note: Memory updated — Indiana uses both `ins` and `ind` prefixes.
