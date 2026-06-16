---
phase: 52-texas-state-collection
plan: "02"
subsystem: content
tags: [civic-trivia, question-generation, curation, mixed-durability, texas, ercot, state-only-rule]

# Dependency graph
requires:
  - phase: 52-01
    provides: texas-state.ts config with texasStateFeatures mixed-durability voice guidance, collection row in DB
provides:
  - 60 curated draft Texas State questions in DB (57 durable, 3 expiring)
  - audit-collection-readiness READY at 60 net questions (threshold: 50)
  - ERCOT cluster reduced to 3 canonical questions (tex-019, tex-082, tex-091)
  - Established state-only rule application: city-specific landmark questions archived
  - tex-023 expiresAt fixed to NULL (historical convened date is durable fact)
affects:
  - 52-03: activate Texas State collection using these 60 curated draft questions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Curation script pattern: archive-tex-curation.ts archives by named category groups with per-ID reason strings"
    - "State-only rule: city/regional landmarks archived, statewide historical sites (Washington-on-the-Brazos, San Jacinto Battleground) kept"
    - "ERCOT cluster management: 12-question ERCOT cluster reduced to 3 best angles (uniqueness, %, transmission miles)"

key-files:
  created:
    - backend/src/scripts/archive-tex-curation.ts
    - backend/src/scripts/check-tex-questions.ts
    - backend/src/scripts/check-tex-questions-full.ts
  modified: []

key-decisions:
  - "ERCOT cluster: keep tex-019 (90% stat), tex-082 (55,000 miles transmission lines), tex-091 (TX grid uniqueness vs US grids) — archive 9 others"
  - "tex-023 expiresAt → NULL: 89th Legislature convened Jan 14, 2025 is a historical fact, not expiring officeholder data"
  - "state-only rule strictly applied: Port Isabel Lighthouse, Presidio La Bahia, Casa Navarro, French Legation, Fulton Mansion all archived as city/regional sites"
  - "Final set: 93 generated → 33 archived → 60 net (57 durable, 3 expiring: Abbott, Paxton, Burrows)"
  - "Washington-on-the-Brazos and San Jacinto Battleground kept: statewide historical events, not city-specific"

patterns-established:
  - "ERCOT cluster handling: pick 3 best angles (uniqueness, key metric, operations stat), archive all others regardless of phrasing variation"
  - "Mixed-durability confirmation: generation successfully produced both durable and expiring questions; 3 expiring (current officeholders) confirmed with expiresAt 2027-01-19"
  - "tex-023 expiresAt fix pattern: session-convened dates are historical facts, archive expiresAt if incorrectly set"

# Metrics
duration: 25min
completed: 2026-03-03
---

# Phase 52 Plan 02: Texas State Collection Summary

**93 Texas State questions generated and curated to 60 (33 archived): near-duplicates eliminated, ERCOT cluster reduced to 3, city-specific landmarks removed, audit READY at 60 net**

## Performance

- **Duration:** ~25 min (generation complete prior session; curation in this session)
- **Started:** 2026-03-03 (generation in prior session as Task 1; curation post-checkpoint)
- **Completed:** 2026-03-03
- **Tasks:** 1 (generation, prior session) + 1 (curation, post-checkpoint user request)
- **Files modified:** 3 new scripts created

## Accomplishments

- Generated 93 Texas State draft questions using the configured pipeline with `--fetch-sources` and mixed-durability voice guidance from `texasStateFeatures`
- Curated to 60 high-quality questions by archiving 33: 17 near-duplicates, 9 ERCOT cluster excess, 6 city-specific landmark violations, 1 low-value lookup
- Confirmed mixed-durability pattern works: 57 durable (structural/historical) + 3 expiring (current officeholders Greg Abbott, Ken Paxton, Dustin Burrows with expiresAt 2027-01-19)
- Fixed tex-023 expiresAt → NULL (89th Legislature convened date is historical fact, not expiring data)
- Readiness audit exits 0 (READY) with 60 net questions — 10 above threshold

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate Texas State questions** - `acc3a3a` (feat — prior session)
2. **Task 2: Archive duplicates and out-of-scope questions** - `547c414` (chore)

## Files Created/Modified

- `backend/src/scripts/archive-tex-curation.ts` - Curation archival script: archives 33 tex- questions by category (dups, ERCOT cluster, city-specific, low-value)
- `backend/src/scripts/check-tex-questions.ts` - Inspection helper: lists all tex- questions with text, answer, expires status
- `backend/src/scripts/check-tex-questions-full.ts` - Inspection helper: lists all tex- questions with full options for curation review

## Question Set: Final State

| Category | Count (final) |
|---|---|
| state-legislature | 10 |
| governor-executive | 10 |
| distinctive-institutions | 5 |
| texas-history-identity | 10 |
| state-judiciary | 10 |
| texas-constitution | 10 |
| civic-landmarks | 3 |
| public-policy | 2 |
| **Total** | **60** |

**Durability split:**
- Durable (expiresAt: null): 57
- Expiring (expiresAt: 2027-01-19): 3 (tex-005 Greg Abbott, tex-008 Ken Paxton, tex-018 Dustin Burrows)

**Note:** tex-023 "When did the 89th Texas Legislature convene?" was originally generated with expiresAt set; this was corrected to NULL since a historical convened date does not expire.

## Decisions Made

- **ERCOT cluster reduced to 3:** From 12 ERCOT questions, kept the 3 most compelling angles: tex-019 (90% of Texas electric load), tex-082 (55,000 miles of transmission lines), tex-091 (TX grid uniqueness — operates independently from two main US grids). Archived 9 others as redundant variations.
- **State-only rule applied strictly:** Port Isabel Lighthouse, Presidio La Bahia, Casa Navarro, French Legation (Austin), and Fulton Mansion archived as city/regional sites. Washington-on-the-Brazos and San Jacinto Battleground kept (statewide historical events that created Texas).
- **tex-023 expiresAt → NULL:** The 89th Legislature convened January 14, 2025 — this is a historical fact, not subject to election-cycle expiration.
- **Near-duplicate scope:** 17 pairs/clusters removed where question text was semantically identical (same fact, different phrasing). Legislative term lengths, Battle of San Jacinto, Republic of Texas years, Railroad Commissioners count, Lt. Governor as Senate presider — all had 2-4 copies.

## Deviations from Plan

### User-Requested Scope Expansion

The checkpoint task originally specified "approved" or "describe issues to fix." User requested: "Can you archive all the duplicates and flagged questions?" This was more extensive curation than the plan described (plan mentioned tex-087 and some examples; user wanted a full pass).

**Action taken:** Performed full curation pass — inspected all 93 questions, identified 33 for archival across 4 categories, executed archival, verified readiness. This is appropriate deviation Rule 2 (critical curation work to meet quality standards before activation).

No other deviations.

---

**Total deviations:** 1 (user-expanded scope — appropriate, no scope creep beyond plan intent)
**Impact on plan:** Curation is the intended outcome of this plan. Full pass is better than partial pass.

## Issues Encountered

None — archival script ran cleanly, readiness audit passed on first run with 60 net questions (10 above threshold).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 60 curated draft Texas State questions in DB, all passing quality rules
- Mixed-durability confirmed: 57 durable + 3 expiring (expiresAt 2027-01-19)
- Readiness audit: READY (exits 0, net 60 >= threshold 50)
- Next step: `cd backend && npx tsx src/scripts/activate-collection.ts --slug texas-state --prefix tex`
- Add banner image: `frontend/public/images/collections/texas-state.jpg` before activation

---
*Phase: 52-texas-state-collection*
*Completed: 2026-03-03*
