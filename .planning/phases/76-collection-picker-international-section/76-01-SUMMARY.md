---
phase: 76-collection-picker-international-section
plan: 01
subsystem: ui
tags: [react, typescript, drizzle-orm, intl, collection-picker]

# Dependency graph
requires:
  - phase: 75-db-foundation-type-system
    provides: international tier support in DB schema
provides:
  - International section in collection picker (Local > State > Federal > International order)
  - latestQuestionAt MAX aggregate in /collections backend response
  - formatFreshness utility for human-readable timestamps (relative < 24h, calendar >= 24h)
  - Freshness indicator on International collection cards only
affects:
  - 77-international-pipeline
  - 78-international-admin
  - 79-launch-international-collections
  - 80-admin-visibility

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }) for calendar-style dates without date-fns"
    - "Tier-gated UI: collection.tier === 'international' gates freshness display — not just field presence"
    - "SQL MAX aggregate alongside COUNT DISTINCT in grouped /collections query"

key-files:
  created:
    - frontend/src/utils/formatFreshness.ts
  modified:
    - backend/src/routes/game.ts
    - frontend/src/features/collections/types.ts
    - frontend/src/features/collections/components/CollectionPicker.tsx
    - frontend/src/features/collections/components/CollectionCard.tsx

key-decisions:
  - "International section appears AFTER Federal (Local > State > Federal > International)"
  - "Freshness indicator gated on tier === 'international' not latestQuestionAt presence — backend returns field for all tiers"
  - "No external date library — Intl.DateTimeFormat covers calendar formatting requirement"
  - "Same Bebas Neue / #9A8878 / 10px / 0.1em style as admin question count row for freshness indicator"

patterns-established:
  - "formatFreshness: < 1m = just now, < 60m = Xm ago, < 24h = Xh ago, >= 24h = Mon D"

# Metrics
duration: 3min
completed: 2026-04-09
---

# Phase 76 Plan 01: Collection Picker International Section Summary

**International section added to collection picker with MAX(created_at) freshness indicator, hidden when empty, using same Bebas Neue styling as existing domestic sections**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T06:35:02Z
- **Completed:** 2026-04-09T06:38:37Z
- **Tasks:** 2
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments
- Backend /collections now returns `latestQuestionAt` (MAX of questions.created_at) per collection via Drizzle SQL aggregate
- `formatFreshness` utility handles relative (< 24h) and calendar (>= 24h) formatting with no external dependencies
- Collection picker groups into 4 sections: Local, State, Federal, International — International hidden when empty via existing filter logic
- International cards render freshness indicator below description; domestic cards unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend latestQuestionAt + frontend type + formatFreshness utility** - `bca1c7a` (feat)
2. **Task 2: CollectionPicker International section + CollectionCard freshness indicator** - `439bba2` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `frontend/src/utils/formatFreshness.ts` - Freshness formatting utility (just now / Xm ago / Xh ago / Mon D)
- `backend/src/routes/game.ts` - Added `latestQuestionAt` MAX aggregate to /collections SELECT
- `frontend/src/features/collections/types.ts` - Added `latestQuestionAt?: string | null` to CollectionSummary
- `frontend/src/features/collections/components/CollectionPicker.tsx` - Extended getCategory, GROUP_LABELS, and grouped array for international
- `frontend/src/features/collections/components/CollectionCard.tsx` - Added formatFreshness import and conditional freshness indicator

## Decisions Made
- International section appears after Federal (geographic escalation order per CONTEXT.md)
- Freshness indicator is gated on `collection.tier === 'international'` — NOT just on `latestQuestionAt != null` because the backend returns the field for all collection tiers
- `Intl.DateTimeFormat` used for calendar formatting — no date-fns dependency needed
- Same Bebas Neue / #9A8878 / 10px / 0.1em letter-spacing style as admin question count row, per CONTEXT.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Collection picker is ready to display International collections as soon as any are activated (tier = 'international' + isActive = true + >= 50 questions)
- The empty-section filter hides International from all users until collections exist — zero visible change in production today
- Phase 77 (International pipeline) can proceed; this UI layer is ready to receive collections

---
*Phase: 76-collection-picker-international-section*
*Completed: 2026-04-09*
