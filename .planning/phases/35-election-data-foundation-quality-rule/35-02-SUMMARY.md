---
phase: 35-election-data-foundation-quality-rule
plan: 02
subsystem: api
tags: [quality-rules, regex, audit, typescript]

requires:
  - phase: 31-34-content-quality-scale
    provides: quality rules engine (types, scoring, index, partisan rule pattern)

provides:
  - checkAddressPhone advisory quality rule (regex-based, options-only scan)
  - address-phone entry in SCORE_WEIGHTS (10-point deduction)
  - checkAddressPhone registered in ALL_SYNC_RULES (6 total rules)
  - audit-address-phone.ts read-only audit script
  - npm run audit-address-phone command

affects:
  - 35-03 (election data model — uses quality rules engine for new questions)
  - 36-37-38 (future phases — any phase generating questions will include address-phone rule)

tech-stack:
  added: []
  patterns:
    - "Advisory quality rules scan ONLY question.options — not text/explanation (civic bodies legitimately reference addresses)"
    - "Audit scripts are read-only: no db.update or db.delete, process.exit(0) on success"
    - "Group flagged questions by collection name for actionable human review"

key-files:
  created:
    - backend/src/services/qualityRules/rules/address-phone.ts
    - backend/src/scripts/audit-address-phone.ts
  modified:
    - backend/src/services/qualityRules/index.ts
    - backend/src/services/qualityRules/scoring.ts
    - backend/package.json

key-decisions:
  - "Scan options only — question.text and explanation legitimately contain addresses in civic questions"
  - "Advisory severity — some legitimate civic questions test knowledge of physical locations"
  - "10-point SCORE_WEIGHTS penalty — modest, consistent with other advisory rules"
  - "Audit script runs checkAddressPhone directly (not auditQuestion) for focused single-rule reporting"

patterns-established:
  - "Rule isolation: focused audit scripts import a single rule directly, not the full auditQuestion orchestrator"

duration: 2min
completed: 2026-02-26
---

# Phase 35 Plan 02: Address/Phone Quality Rule Summary

**checkAddressPhone advisory rule detects US/UK phone numbers and street addresses in answer options; scans 519 active questions — 2 flagged (Bloomington police address, California false positive), no auto-archival**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T00:51:57Z
- **Completed:** 2026-02-26T00:54:55Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created checkAddressPhone quality rule with three regex patterns (US phone, UK phone, street address) that scans only answer options
- Registered rule in ALL_SYNC_RULES array in quality rules engine (grows from 5 to 6 synchronous rules)
- Added 'address-phone': 10 weight to SCORE_WEIGHTS for scoring integration
- Built read-only audit-address-phone.ts script that scanned all 519 active questions and produced a grouped report (2 flagged: 1 true positive, 1 false positive demonstrating advisory necessity)

## Task Commits

Each task was committed atomically:

1. **Task 1: checkAddressPhone quality rule + engine registration** - `ef33607` (feat)
2. **Task 2: audit-address-phone.ts script + npm script** - `1204a2e` (feat)

**Plan metadata:** committed after SUMMARY.md and STATE.md (docs)

## Files Created/Modified

- `backend/src/services/qualityRules/rules/address-phone.ts` - New quality rule: US phone, UK phone, street address regex detection across answer options only
- `backend/src/services/qualityRules/index.ts` - Import and registration of checkAddressPhone in ALL_SYNC_RULES
- `backend/src/services/qualityRules/scoring.ts` - 'address-phone': 10 entry added to SCORE_WEIGHTS advisory section
- `backend/src/scripts/audit-address-phone.ts` - Read-only audit script: fetches all active questions, runs checkAddressPhone, reports by collection
- `backend/package.json` - Added "audit-address-phone" npm script entry after "audit-questions"

## Decisions Made

- Scan answer options only — not question.text or explanation. Civic question bodies legitimately contain addresses (e.g., "The Supreme Court is located at 1 First Street NE"). Only answer choices containing contact info indicate the anti-pattern.
- Advisory severity maintained — the audit run confirmed this is correct: cas-099 ("18 to vote in school board") is a regex false positive that regex matching alone cannot distinguish from a real address. Human review required.
- Focused audit script imports checkAddressPhone directly rather than calling auditQuestion(), allowing the report to surface only address/phone violations without noise from other rules.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The audit run revealed an interesting false positive (cas-099: "18 to vote in school board" matches the street address regex because "18" looks like a house number followed by text). This validates the decision to use advisory severity and require human review rather than auto-archival.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- checkAddressPhone is live in the quality rules engine — any new question validated through auditQuestion() will automatically include address/phone detection
- Two flagged questions (bli-097, cas-099) are ready for manual review in admin UI; bli-097 appears to be a genuine address-in-options question, cas-099 appears to be a false positive
- Quality rules engine now has 6 synchronous rules — engine architecture supports continued rule additions without structural changes
- Ready to proceed with Phase 35 Plan 03 (election data model)

---
*Phase: 35-election-data-foundation-quality-rule*
*Completed: 2026-02-26*
