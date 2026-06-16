---
plan: 68-03
phase: 68-santa-monica-ca-collection
completed: 2026-03-18
status: complete
---

# Plan 68-03 Summary: Santa Monica Officeholder Questions

## What Was Built

14 officeholder questions inserted directly as active (status: 'active', not 'draft'), with `expiresAt` set, closing both verification gaps identified in 68-VERIFICATION.md. Questions cover all 7 Santa Monica officeholders: Mayor Caroline Torosis, Mayor Pro Tem Jesse Zwick, Council Members Lana Negrete and Ellis Raskin, City Attorney Douglas Sloan, State Assembly Member Rick Chavez Zbur (AD-51), and State Senator Maria Elena Durazo (SD-26). External IDs smo-401 through smo-414.

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| `backend/src/scripts/add-smo-officeholder-questions.ts` | Created | One-shot insertion script; 14 questions with expiresAt 2027-01-15 |
| 14 officeholder questions in DB | Active | smo-401 through smo-414; all 7 officeholders covered |

## Metrics After Gap Closure

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| Active questions | 77 | 91 | 80+ | PASS |
| Expiring ratio | 5.2% | 19.8% | 15–30% | PASS |

Final audit verdict: **READY** — all 7 officeholders confirmed with coverage.

## Commits

| Hash | Description |
|------|-------------|
| a0e647c | feat(68-03): add Santa Monica officeholder questions insertion script |

## Decisions

- Questions inserted as `active` directly (not `draft`) — gap closure for a live collection; no curation step needed
- `expiresAt` set to `2027-01-15` for all 14 questions — consistent with other officeholder expiry conventions
- Script is a one-shot runner (checks `smo-401` existence before inserting) — safe to re-run without duplicating

## Issues

None.
