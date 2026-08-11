---
phase: 29-admin-review-queue
plan: 03
type: execute
status: complete
completed: 2026-02-22

subsystem: admin-ui
tags: [admin, flags, moderation, ui, headless-ui, react, optimistic-ui, undo]

requires:
  - 29-01-api-endpoints
  - 29-02-flag-review-page

provides:
  - flag-detail-panel
  - archive-with-undo
  - dismiss-flags-action
  - restore-question-action

affects:
  - phase-30-broken-links

tech-stack:
  added: []
  patterns:
    - slide-over-detail-panel
    - optimistic-ui-updates
    - undo-toast-pattern
    - show-more-text-truncation

key-files:
  created:
    - frontend/src/pages/admin/components/FlagDetailPanel.tsx
  modified:
    - frontend/src/pages/admin/FlagReviewPage.tsx

decisions:
  - slug: undo-toast-implementation
    what: Custom undo toast with useRef timeout vs library (Sonner)
    why: Simple 50-line custom hook avoids 3KB dependency for single use case
    impact: No external toast library needed

  - slug: dismiss-no-undo
    what: Dismiss flags is permanent with confirm dialog only
    why: Dismiss does hard delete of flags — cannot be undone
    impact: Archive has undo, dismiss has confirm — clear UX distinction

  - slug: optimistic-then-api
    what: Optimistic local state update before API call
    why: Instant UI feedback, rollback on error via refreshKey
    impact: Feels fast, handles errors gracefully with full re-fetch

  - slug: elaboration-truncation-threshold
    what: Truncate elaboration text at 100 characters
    why: Keeps individual flag cards scannable, Show more for detail
    impact: Clean compact list view with expansion on demand

  - slug: close-panel-after-action
    what: Panel closes immediately after archive/dismiss/restore
    why: User performed action and moved on — seeing stale content is confusing
    impact: Snappy workflow, no lingering detail state

metrics:
  duration: 3min
  tasks: 2
  commits: 2
  files_created: 1
  files_modified: 1
  lines_added: ~750
---

# Phase 29 Plan 03: Flag Detail Panel & Actions Summary

**One-liner:** Slide-over detail panel with aggregate flag summary, individual flag entries showing usernames and elaboration, plus archive/dismiss/restore actions with optimistic updates and undo toast.

## What Was Built

Created `FlagDetailPanel.tsx` as a comprehensive slide-over panel following the exact pattern from `QuestionDetailPanel.tsx`. The panel provides admins with full context to make informed triage decisions:

**Flag Summary Section:**
- Aggregate counts: "5 flags: 3 confusing, 2 wrong answer"
- Colored reason chips matching table style (amber/confusing, red/wrong, blue/outdated, gray/boring)
- Red-toned summary box for high visibility

**Question Context Section:**
- Full question text (bold, large)
- All answer options with A/B/C/D labels
- Correct answer highlighted in green with checkmark icon
- Explanation in gray background box
- Source/Learn More link (external icon)
- Learning content paragraphs if available
- "Edit in Question Explorer" deep-link using `?search=${externalId}`

**Individual Flags Section:**
- Each flag in separate card (gray-50 background)
- Top row: username (bold) + date (right-aligned)
- Reasons row: colored chips (same as summary)
- Elaboration text with smart truncation:
  - If > 100 chars: show first 100 + "..." + "Show more" button
  - Clicking toggles full text display
  - "Show less" button when expanded
- "Flagged without details" for empty flags

**Action Buttons:**
- Active status: "Archive Question" (red) + "Dismiss Flags" (gray)
- Archived status: "Restore Question" (green)
- Disabled during pending API calls (prevents double-click)

**Undo Toast:**
- Custom implementation (no library): ~50 lines
- Fixed bottom-right position (z-50)
- Shows message + "Undo" button (amber) + close X
- 5-second auto-hide timeout
- Clears previous toast if new action taken

**Optimistic UI Flow:**

1. **Archive:**
   - Optimistically remove from parent table
   - Close detail panel
   - Show undo toast
   - Call PATCH `/api/admin/flags/:id/archive`
   - Undo callback: PATCH `/api/admin/flags/:id/restore` + trigger refresh
   - Error: trigger refresh to restore correct state

2. **Dismiss:**
   - Show confirm dialog: "Dismiss all flags for this question? This will remove all player feedback."
   - If confirmed: optimistically remove from table
   - Close panel
   - Call POST `/api/admin/flags/:id/dismiss`
   - No undo (permanent delete)
   - Error: trigger refresh

3. **Restore:**
   - Optimistically remove from archived tab
   - Close panel
   - Call PATCH `/api/admin/flags/:id/restore`
   - No undo needed (can just archive again)
   - Error: trigger refresh

**Integration with FlagReviewPage:**
- Added `selectedQuestionId` state (removed underscore prefix)
- Added `refreshKey` counter state for error recovery
- Implemented callback props:
  - `onQuestionArchived`: filter question from local state
  - `onFlagsDismissed`: filter question from local state
  - `onQuestionRestored`: filter question from local state
  - `onRefreshNeeded`: increment refreshKey to trigger re-fetch
- Render `<FlagDetailPanel>` at bottom of page with all props wired

## Deviations from Plan

None — plan executed exactly as written. All must_haves delivered, all key_links verified.

## Technical Challenges

**Challenge 1: NodeJS.Timeout type in browser context**
- **Issue:** `useRef<NodeJS.Timeout>()` caused TypeScript error in browser environment
- **Solution:** Changed to `useRef<number>()` — browser setTimeout returns number, not NodeJS type
- **Impact:** TypeScript compiles cleanly

**Challenge 2: Toast undo callback timing**
- **Issue:** If user clicks undo, need to immediately call restore API and hide toast
- **Solution:** Toast receives `onUndo` prop that calls `undoCallback()` then `hideToast()`
- **Impact:** Clean separation of concerns, easy to test

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 3831370 | feat(29-03): create FlagDetailPanel with question context and flag entries | FlagDetailPanel.tsx |
| c593f0b | feat(29-03): wire FlagDetailPanel with optimistic updates and undo toast | FlagReviewPage.tsx |

## Testing Notes

**Manual testing checklist:**
1. Click flagged question row → detail panel slides in from right
2. Verify aggregate summary shows correct reason counts
3. Verify individual flags show username, date, reasons, elaboration
4. Click "Show more" on long elaboration → expands full text
5. Click "Show less" → collapses back to 100 chars
6. Click "Archive Question" → question disappears from table, undo toast appears
7. Click "Undo" within 5 seconds → question restored, page refreshes
8. Wait 5+ seconds after archive → toast auto-hides
9. Click "Dismiss Flags" → confirm dialog appears
10. Confirm dismiss → question removed from table (permanent)
11. Switch to Archived tab → archived questions visible
12. Click archived question → detail panel shows "Restore Question" button
13. Click "Restore Question" → question removed from archived tab
14. Click "Edit in Question Explorer" → navigates to QuestionsPage with search pre-filled
15. API error during archive → error shown, refresh triggered to restore state

**TypeScript verification:**
```bash
cd frontend && npx tsc --noEmit
# Output: No errors (verified)
```

## Integration Points

**Consumes from 29-01 (API endpoints):**
- GET `/api/admin/flags/:questionId/detail` — fetch question + flags
- PATCH `/api/admin/flags/:questionId/archive` — archive question
- POST `/api/admin/flags/:questionId/dismiss` — dismiss all flags
- PATCH `/api/admin/flags/:questionId/restore` — restore archived question

**Integrates with 29-02 (Flag Review Page):**
- Uses `selectedQuestionId` state set by table row click handler
- Calls parent callbacks to optimistically update table data
- Triggers refresh via `refreshKey` increment on errors

**Affects Phase 30 (Broken Links):**
- "Edit in Question Explorer" link will allow admins to fix broken source URLs
- Phase 30 will add bulk source URL repair for legacy questions

## Next Phase Readiness

Phase 29 is now complete (3/3 plans). All ADMN requirements delivered:
- ADMN-01: Flag review queue with sorting/filtering ✓
- ADMN-02: Aggregate flag display with reason breakdown ✓
- ADMN-03: Individual flag entries with usernames ✓
- ADMN-04: Archive/dismiss/restore actions ✓

**Phase 30 blockers:** None

**Phase 30 inputs:**
- Admin can now see which questions have broken Learn More links
- Edit in Question Explorer link provides quick access to fix individual questions
- Phase 30 will add bulk source URL repair workflow

**Outstanding work:**
- None — all Phase 29 requirements complete

## Lessons Learned

**What worked well:**
- Reusing QuestionDetailPanel pattern made implementation straightforward
- Optimistic UI with refreshKey fallback handles errors gracefully
- Custom toast hook kept dependencies minimal (no Sonner needed)
- Show more/less toggle for elaboration is clean and intuitive

**What could improve:**
- Could add loading state indicator during API calls (currently just disables buttons)
- Could add toast for successful restore (currently silent success)
- Could batch multiple undo toasts if user performs multiple actions quickly

**For future phases:**
- Optimistic UI + refreshKey pattern works well — reuse for other admin actions
- Custom hooks for common UI patterns (toast, modals) keep bundle size down
- Deep-linking with search params (`?search=...`) is powerful for admin workflows

---

*Phase: 29-admin-review-queue*
*Plan: 03 of 03*
*Status: Complete*
*Duration: 3 minutes*
