---
phase: quick-031
plan: "01"
subsystem: game-ui
tags: [admin, game, archive, moderation]
requires: []
provides:
  - Admin-only archive button during reveal phase
  - In-game question moderation without leaving gameplay
  - Verdict notes recorded in expirationHistory
affects:
  - backend/src/routes/admin.ts
  - frontend/src/features/game/components/GameScreen.tsx
  - frontend/src/pages/Game.tsx
tech-stack:
  added: []
  patterns:
    - Conditional admin UI rendering via isAdmin from authStore
    - externalId-based API endpoint for frontend-friendly lookups
key-files:
  created:
    - frontend/src/features/game/components/AdminArchiveButton.tsx
    - frontend/src/features/game/components/AdminArchiveModal.tsx
  modified:
    - backend/src/routes/admin.ts
    - frontend/src/features/game/components/GameScreen.tsx
    - frontend/src/pages/Game.tsx
decisions:
  - "Archive button positioned top-left (left-2) to avoid overlap with FlagButton at top-right (right-2)"
  - "Verdict field is optional — modal submits null if left blank"
  - "archivedQuestions state uses [, setter] pattern — value not read yet (reserved for future badge display)"
  - "by-external-id endpoint added because game frontend only has externalId, not numeric DB id"
metrics:
  duration: "3m 28s"
  completed: "2026-03-24"
---

# Quick Task 031: Add Admin Archive Question Button in Game — Summary

**One-liner:** In-game admin archive button during reveal phase with verdict modal, using externalId endpoint for game-native lookups.

## What Was Built

Admins (Chris Andrews, Chris Cantrell) can now archive bad questions directly during gameplay without switching to the admin panel. During the reveal phase, a discrete archive icon appears in the top-left of the question card. Clicking it opens a modal where an optional verdict/reason can be typed before confirming. The question is immediately archived in the database with the verdict and admin's userId recorded in `expirationHistory`.

Non-admin users never see the button.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Enhance backend archive endpoint | 8bd62b8 | backend/src/routes/admin.ts |
| 2 | Create AdminArchiveButton + AdminArchiveModal | fdc16e2 | AdminArchiveButton.tsx, AdminArchiveModal.tsx |
| 3 | Wire into GameScreen and Game.tsx | 34f7802 | GameScreen.tsx, Game.tsx |

## Implementation Details

### Backend (Task 1)
- `POST /questions/:id/archive` — enhanced to accept optional `verdict` string; records `verdict` and `archivedBy` (admin UUID) in `expirationHistory` alongside existing `action` and `timestamp`
- `POST /questions/by-external-id/:externalId/archive` — new companion endpoint; same logic but looks up by `external_id` column. Required because the game frontend tracks questions by externalId (e.g. `"fre-001"`), not numeric DB id.
- Both endpoints already protected by `requireAuth, requireAdmin` via `router.use()` at line 19.

### Frontend Components (Task 2)
- `AdminArchiveButton`: discrete slate-500 archive box icon (5×5), tooltip on hover reading "Archive question (admin)". Mirrors FlagButton's styling pattern but uses archive-box SVG path.
- `AdminArchiveModal`: dark-themed fixed overlay (slate-800 card, rgba(0,0,0,0.7) backdrop). Optional verdict textarea, Cancel + Archive (red) buttons. Shows loading state during request, green "Archived" flash on success (800ms), inline error on failure.

### Wiring (Task 3)
- `GameScreen.tsx`: added `onArchiveQuestion?: (questionId: string) => void` prop; reads `isAdmin` and `accessToken` from authStore; renders `<AdminArchiveButton>` at `absolute top-2 left-2 z-10` during reveal phase when `isAdmin && accessToken` (FlagButton is at `right-2` — no overlap).
- `Game.tsx`: `handleArchiveQuestion` adds to local `archivedQuestions` Set (reserved for future badge/indicator UI). State resets with `flaggedQuestions` on game start.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Position: top-left (left-2) | FlagButton is at top-right (right-2) — symmetric placement, no overlap |
| Verdict optional | Admins should be able to archive quickly during live play; reason is helpful but not gating |
| by-external-id endpoint | Game state uses externalId throughout; adding a new endpoint is cleaner than changing game state to also track numeric DB IDs |
| archivedQuestions as [, setter] | Value not displayed yet — stored for future badge/indicator feature without causing TS unused-variable error |
| TODO comment in AdminArchiveButton | Noted future Dev Role (per-collection admin access) per plan instruction |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused state variable caused TypeScript error**

- **Found during:** Task 3 verification (`tsc --noEmit`)
- **Issue:** `archivedQuestions` state variable was declared and written to but never read in JSX — `noUnusedLocals` error TS6133
- **Fix:** Changed destructure to `[, setArchivedQuestions]` — keeps the setter for writes without exposing the unread value
- **Files modified:** frontend/src/pages/Game.tsx
- **Commit:** 34f7802 (inline fix before commit)

## Verification

- `cd backend && npx tsc --noEmit` — passes (no output)
- `cd frontend && npx tsc --noEmit` — passes (no output)
- Manual test path: Log in as admin → play game → answer question → reveal phase shows archive icon (top-left) → click opens modal → enter optional verdict → Archive → green flash → question archived in DB
- Non-admin test: archive button absent during reveal phase

## Next Phase Readiness

- No blockers
- Future: show "Archived" badge on question card after archiving (archivedQuestions Set is already in place)
- Future: Dev Role with per-collection admin access (TODO comment left in AdminArchiveButton.tsx)
