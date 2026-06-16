---
phase: 68-santa-monica-ca-collection
plan: 02
subsystem: content
tags: [collection, santa-monica, activation, playbook]

requires:
  - phase: 68-01
    provides: 77 curated draft questions, banner image, locale config

provides:
  - Santa Monica, CA collection live in production (18th collection)
  - COLLECTION-PLAYBOOK.md retrospective appended
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  modified:
    - backend/src/db/seed/collections.ts
    - .planning/COLLECTION-PLAYBOOK.md
    - frontend/public/images/collections/santa-monica-ca.jpg

key-decisions:
  - "Activation succeeded: 77 questions, isActive: true confirmed via Supabase"
  - "Banner image iterated 3x during verification: night shot → daytime Oct 2021 → sunset pier (final)"
  - "Tagline shortened to 'Where Route 66 meets the Pacific.' per user feedback"

completed: 2026-03-18
---

# Plan 68-02: Activate Collection — Summary

**Santa Monica, CA activated as 18th collection — 77 questions live, sunset pier banner, playbook retrospective appended**

## Performance

- **Completed:** 2026-03-18
- **Tasks:** 2 (including checkpoint)
- **Files modified:** 3

## Accomplishments

- Activated Santa Monica, CA collection (77 questions, isActive: true)
- Verified live in production via /api/game/collections
- Appended Santa Monica retrospective to COLLECTION-PLAYBOOK.md
- Iterated banner image to final: sunset pier + ferris wheel from beach (Wikimedia Commons)
- Tagline shortened from rhetorical question to punchy declaration per user feedback

## Task Commits

1. **Task 1: Activate + retrospective** — `0df2d08` (feat), `7939ea4` (docs)
2. **Task 2: Checkpoint approved** — human verified live site
3. **Post-checkpoint fixes** — `7904002` tagline, `6c4102e` → `73b969d` → `4a0890c` banner iterations

## Files Created/Modified

- `backend/src/db/seed/collections.ts` — isActive: true, tagline shortened
- `.planning/COLLECTION-PLAYBOOK.md` — Santa Monica retrospective appended
- `frontend/public/images/collections/santa-monica-ca.jpg` — sunset pier + ferris wheel (final)

## Decisions Made

- Tagline shortened from full question to "Where Route 66 meets the Pacific." per user feedback
- Banner image: user selected sunset pier + ferris wheel shot from beach (commons.wikimedia.org/wiki/File:Santa_Monica_Pier_in_Los_Angeles.jpg)
- Three banner iterations before final selection — night shot too dark, daytime pier adequate, sunset pier preferred

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Banner image iterated post-checkpoint**

- **Found during:** Task 2 (post human-verify)
- **Issue:** Initial banner (pier at dusk) was too dark for UI legibility
- **Fix:** Replaced with daytime pier photo, then user-selected sunset pier + ferris wheel shot
- **Files modified:** `frontend/public/images/collections/santa-monica-ca.jpg`
- **Commits:** `6c4102e`, `73b969d`, `4a0890c`

**2. [Rule 1 - Bug] Tagline shortened post-checkpoint**

- **Found during:** User review after Task 2
- **Issue:** Tagline was verbose; user requested shorter punchy form
- **Fix:** Shortened to "Where Route 66 meets the Pacific."
- **Files modified:** `backend/src/db/seed/collections.ts`
- **Commit:** `7904002`

## Issues Encountered

- Initial banner image was too dark (night shot) — replaced with daytime, then user-selected sunset shot
- Expiring ratio for Santa Monica is 5.2% (below 15–30% target) — documented in Plan 01 retrospective; not re-generated

## Next Phase Readiness

- Phase 68 complete — all phases of v2.3 content done (Phase 67 leaderboard + Phase 68 Santa Monica)
- v2.2 Pipeline Intelligence (Phases 63–66) was previously completed
- Ready for milestone audit: /gsd:audit-milestone
- Active collections now 18 total
