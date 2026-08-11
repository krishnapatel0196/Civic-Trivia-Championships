---
phase: 37-election-question-generation-script
plan: 02
subsystem: api, frontend
tags: [admin-ui, headlessui, election, question-generation, react, express]

# Dependency graph
requires:
  - plan: 37-01
    provides: generateElectionQuestions, GenerationBlockedError

provides:
  - POST /api/admin/election-races/:id/generate endpoint
  - Generate Questions button + 4 modals on ElectionsPage (prompt, loading, success, blocked/force)
  - Jurisdiction field dropdown populated from collections
  - Collection slug dropdown in generation prompt
  - Auto-fill collection slug from race jurisdiction on Generate click

affects:
  - Admin workflow: election question generation now triggerable from browser

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "headlessui Dialog+Transition pattern for admin modals (matches existing QualityComparisonModal pattern)"
    - "Collections fetched from /api/game/collections for jurisdiction and slug dropdowns"
    - "Auto-match collection slug by comparing race.jurisdiction to collection.name"

key-files:
  modified:
    - backend/src/routes/admin.ts
    - frontend/src/pages/admin/ElectionsPage.tsx
    - frontend/src/pages/admin/DuplicateReviewPage.tsx

key-decisions:
  - "500 error returns detail field with actual error message — aids live debugging"
  - "Jurisdiction field uses collection name as stored value (human-readable, no schema change)"
  - "Collection slug auto-fills in Generate dialog when jurisdiction matches a collection name exactly"
  - "Duplicate Review returns noReports:true gracefully when no scan files exist (live server has no local scan files)"

# Metrics
duration: ~session
completed: 2026-02-26
---

# Phase 37 Plan 02: Admin API Route + ElectionsPage UI Summary

**POST /election-races/:id/generate endpoint + ElectionsPage generation UI: Generate button per race row, collection slug dropdown, loading/success/blocked modals with Force Regenerate. Human-verified on live Render deployment.**

## Accomplishments

- `POST /api/admin/election-races/:id/generate` — calls generateElectionQuestions, returns 200/400/404/409/500 with detail field
- ElectionsPage: Generate button on each race row
- Collection slug prompt dialog replaced free-text with dropdown (fetched from /api/game/collections)
- Jurisdiction field in race creation form changed to collection dropdown (prevents invalid values)
- Auto-fills collection slug in Generate dialog when race jurisdiction matches a collection name
- Loading modal with spinner + "1–2 minutes" message during generation
- Success modal with question count + "View in Explorer" link to /admin/questions?collection={slug}&status=draft
- Blocked modal with existing count + Force Regenerate button (archives old, creates new)
- DuplicateReviewPage: graceful "no reports" state instead of red 500 error when scan files absent on live server

## Task Commits

1. **Task 1: Add POST endpoint** — `a9d7136`
2. **Task 2: Add Generate button + modals** — `3b45bdf`
3. **Fix: timezone ISO date bug** — `54ad76c`
4. **Fix: collection dropdown + better 500 detail** — `4802c15`
5. **Fix: jurisdiction dropdown + auto-fill** — `8f156b3`
6. **Fix: dedup graceful empty state** — `477ec61`

## Issues Encountered

- **ANTHROPIC_API_KEY missing on Render** — was not set in backend environment variables; added manually, resolved 500 error
- **expiresAt off by one day** — `new Date('2026-11-03')` stored as UTC midnight, formatted to local tz shifted date back; fixed by using `toISOString().split('T')[0]` instead of Intl formatter
- **Collection slug free-text caused "not found" errors** — replaced with dropdown; also added jurisdiction dropdown to prevent mismatched values at race creation time

## Deviations from Plan

- Added jurisdiction dropdown to race creation form (not in original plan) — needed to prevent slug mismatches
- Added auto-fill of collection slug in Generate dialog — UX improvement
- Added DuplicateReviewPage graceful state — unrelated fix discovered during live testing

## Human Verification

Verified on live Render deployment:
- ✓ CLI --help works
- ✓ CLI --dry-run generates 15 questions for Bloomington Mayor race
- ✓ UI Generate button opens collection prompt (dropdown)
- ✓ Loading modal shows during generation
- ✓ Success modal shows count + View in Explorer link
- ✓ Idempotency: second Generate shows blocked modal with Force Regenerate
- ✓ Draft questions appear in question explorer

---
*Phase: 37-election-question-generation-script*
*Completed: 2026-02-26*
