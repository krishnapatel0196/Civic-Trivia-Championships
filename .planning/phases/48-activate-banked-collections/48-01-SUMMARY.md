---
phase: 48-activate-banked-collections
plan: "01"
subsystem: collection-activation
tags: [collections, activation, fremont, norwich, readiness-audit, verification]

dependency-graph:
  requires: []
  provides:
    - audit-collection-readiness.ts (reusable pre-activation readiness gate)
    - verify-post-activation.ts (reusable post-activation API verification)
    - Fremont CA live and playable (54 active questions)
    - Norwich England live and playable (117 active questions)
  affects:
    - Future collection activations (use audit-collection-readiness.ts + verify-post-activation.ts as standard gate)

tech-stack:
  added: []
  patterns:
    - Drizzle ORM queries for question counting (no raw SQL civic_trivia references)
    - Native fetch for API verification (Node 18+ built-in)
    - Standard CLI arg parsing pattern (--flag value loop, no external parser)

key-files:
  created:
    - backend/src/scripts/audit-collection-readiness.ts
    - backend/src/scripts/verify-post-activation.ts
  modified:
    - backend/src/scripts/content-generation/curate-fremont-questions.ts

decisions:
  - "Both collections were already active in DB (prior session activation) — scripts verified and confirmed, no re-activation needed"
  - "Fremont 25 remaining drafts are non-curated and intentionally left as draft"
  - "Norwich prefix is nor (not nur) — confirmed by locale-config externalIdPrefix"
  - "Windows tsx exit code 127 is a libuv quirk, not a script error — output confirms success"

metrics:
  tasks-completed: 3
  tasks-total: 3
  duration: "~25 minutes"
  completed: "2026-03-02"
---

# Phase 48 Plan 01: Activate Banked Collections Summary

**One-liner:** Fremont CA (54 questions) and Norwich England (117 questions) activated and verified live via collections API with reusable audit and verification CLI scripts.

## What Was Built

Two reusable CLI scripts were created and both banked collections confirmed live:

### audit-collection-readiness.ts
Pre-activation blocking readiness gate for any collection. Counts draft, active, and near-expiring (within 90 days) questions by prefix pattern. Calculates net count and exits 0 (READY) or 1 (BLOCKED). Drizzle ORM only — no civic_trivia raw SQL.

### verify-post-activation.ts
Post-activation API verification. Fetches `/api/game/collections` from any backend URL and checks that each slug appears with `questionCount >= 50`. Exits 0 if all pass, 1 if any fail. Uses native Node 18+ fetch, no Drizzle imports.

### curate-fremont-questions.ts (fix)
Replaced `db.execute(sql\`SELECT FROM civic_trivia...\`)` with Drizzle ORM join query using imported `collectionQuestions` table reference (trivia schema).

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create audit-collection-readiness.ts and audit both collections | 41d8086 | backend/src/scripts/audit-collection-readiness.ts |
| 2 | Fix Fremont curation script and activate both collections | c7bd486 | backend/src/scripts/content-generation/curate-fremont-questions.ts |
| 3 | Create verify-post-activation.ts and confirm end-to-end playability | 1c61bbf | backend/src/scripts/verify-post-activation.ts |

## Audit Results

### Fremont CA (fre-)
- Draft: 25 | Active: 54 | Expiring: 0 | Net: 79 — **READY**
- Collection status: ACTIVE (is_active=true)
- Production API: PASS (54 active questions visible)
- 25 remaining non-curated drafts intentionally left as draft

### Norwich England (nor-)
- Draft: 0 | Active: 117 | Expiring: 0 | Net: 117 — **READY**
- Collection status: ACTIVE (is_active=true)
- Production API: PASS (117 active questions visible)

## Production Verification

Run against `https://civic-trivia-backend.onrender.com`:

```
[PASS] Fremont, CA (fremont-ca)
       54 active questions

[PASS] Norwich, England (norwich-uk)
       117 active questions

Total collections in API: 7
All success criteria met.
```

## Success Criteria Verification

| Criterion | Result |
|-----------|--------|
| Fremont appears in collection picker and is playable | PASS — 54 questions in API |
| Norwich appears in collection picker and is playable | PASS — 117 questions in API |
| Both return >= 50 active questions via collections API | PASS — 54 and 117 respectively |
| No non-curated Fremont drafts accidentally promoted | PASS — 25 non-curated drafts remain as draft |
| audit-collection-readiness.ts exists and is reusable | PASS |
| verify-post-activation.ts exists and is reusable | PASS |
| curate-fremont-questions.ts civic_trivia bug fixed | PASS — Drizzle ORM |
| Banner images exist (fremont-ca.jpg, norwich-uk.jpg) | PASS — 40KB and 143KB |
| Frontend category routing correct (both -> 'local') | PASS — getCategory() returns 'local' by default |

## Deviations from Plan

### Discovery: Both Collections Already Active

**Found during:** Task 1 (audit)
**Issue:** The audit report showed both collections as "already active" (ACTIVE status warning). Prior session work had already activated both collections.
**Impact:** Task 2's activation steps were skipped (no re-activation needed — collections confirmed live). The curate-fremont-questions.ts bug fix and the dry-run verification were still completed.
**Fremont curation state:** 54 active questions (curated set), 25 non-curated drafts remain as draft — exactly correct per plan's Pitfall 4 guidance.

### curated-fremont-ids.txt Not Found

**Found during:** Task 2 investigation
**Issue:** `src/scripts/content-generation/curated-fremont-ids.txt` does not exist in the current working tree (likely was a prior-session artifact). The curation step had already been run and 54 Fremont questions are active.
**Impact:** None — curation already completed, no action needed.

## Next Phase Readiness

- Phase 48 objective fully met: both collections live and playable
- No blockers for future phases
- Standard collection activation workflow is now: `audit-collection-readiness.ts` → curate (if needed) → `activate-collection.ts` → `verify-post-activation.ts`
