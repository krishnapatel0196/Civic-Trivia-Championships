---
phase: 28-progressive-disclosure-ui
plan: 01
subsystem: api, ui
tags: [express, drizzle, react, typescript, framer-motion, accessibility]

# Dependency graph
requires:
  - phase: 27-01-backend-foundation-inline-flagging
    provides: question_flags table, feedbackService pattern, express-validator usage
provides:
  - PATCH /api/feedback/flags/batch endpoint for transactional elaboration updates
  - updateFlagElaborations service function with db.transaction and question lookup
  - ReasonChip component with aria-pressed toggle for accessibility
  - FlaggedQuestionItem component with 4 reason chips and 500-char textarea
  - FeedbackElaborationScreen component with stagger animations and Skip/Submit actions
affects: [28-02-game-flow-integration, 29-admin-flag-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Batch update pattern: Single transaction for multiple elaboration updates"
    - "Multi-select chip buttons with aria-pressed for accessibility"
    - "Character counter with amber warning when remaining <= 50"
    - "Stagger animations with framer-motion for list items"

key-files:
  created:
    - backend/src/services/feedbackService.ts (updateFlagElaborations)
    - frontend/src/features/game/components/ReasonChip.tsx
    - frontend/src/features/game/components/FlaggedQuestionItem.tsx
    - frontend/src/features/game/components/FeedbackElaborationScreen.tsx
  modified:
    - backend/src/routes/feedback.ts (added PATCH /flags/batch)

key-decisions:
  - "No rate limiter on batch endpoint (infrequent post-game action, not abuse vector)"
  - "Null for empty reasons array or elaborationText (database normalization)"
  - "Equal visual weight for Skip and Submit buttons (both flex-1, full-width)"
  - "Amber for selected chips (matches flag button color), teal for submit (brand primary)"

patterns-established:
  - "Batch elaboration pattern: Array of { questionId, reasons, elaborationText } with transaction rollback on any error"
  - "Controlled textarea with slice(0, 500) defense + HTML maxLength attribute"
  - "useCallback for child component callbacks to prevent re-render loops"

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 28 Plan 01: Progressive Disclosure UI Summary

**PATCH /flags/batch transactional endpoint with ReasonChip, FlaggedQuestionItem, and FeedbackElaborationScreen components using amber/teal design and framer-motion stagger animations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T04:00:13Z
- **Completed:** 2026-02-22T04:02:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Backend batch elaboration endpoint validates 4 predefined reasons and 500-char max text
- All flag updates happen in single db.transaction for atomicity (all-or-nothing)
- ReasonChip toggle buttons with aria-pressed for screen reader accessibility
- FlaggedQuestionItem shows question text, 4 reason chips, textarea with live character counter (amber warning at 50 remaining)
- FeedbackElaborationScreen composes flagged questions list with stagger animations, equal-weight Skip/Submit buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend batch elaboration endpoint and service function** - `a251a81` (feat)
2. **Task 2: Frontend elaboration UI components** - `e60c136` (feat)

## Files Created/Modified
- `backend/src/services/feedbackService.ts` - Added updateFlagElaborations function using db.transaction, loops through elaborations array and updates question_flags rows
- `backend/src/routes/feedback.ts` - Added PATCH /flags/batch with express-validator (validates reason enum, 500-char max), no rate limiter
- `frontend/src/features/game/components/ReasonChip.tsx` - Multi-select chip button with aria-pressed, amber when selected, slate-700 unselected
- `frontend/src/features/game/components/FlaggedQuestionItem.tsx` - Per-question card with reason chips, textarea, character counter (amber when remaining <= 50)
- `frontend/src/features/game/components/FeedbackElaborationScreen.tsx` - Full-screen layout with stagger animations (0.1s delay per item), Skip and Submit buttons with flex-1 equal sizing

## Decisions Made
- **No rate limiter on batch endpoint:** Elaboration is infrequent, one-time post-game action. Not an abuse vector like inline flagging during gameplay. Rationale: Simplify implementation, avoid Redis complexity for low-frequency endpoint
- **Null for empty elaborations:** Store null instead of empty array/string for database normalization and query efficiency. Rationale: Cleaner schema, easier to filter for "has elaboration" in admin review
- **Equal button visual weight:** Skip and Submit both use flex-1 for full-width sizing. Rationale: No dark pattern pushing Submit - user choice is respected equally
- **Amber for chips, teal for submit:** Selected chips use amber-500 (matches FlagButton from Phase 27), Submit uses teal-600 (brand primary). Rationale: Visual consistency across flag-related UI, teal signals primary action

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
**TypeScript unused parameter warning:**
- **Issue:** sessionId parameter in FeedbackElaborationScreen was flagged as unused by TypeScript (error TS6133)
- **Resolution:** Added underscore prefix (_sessionId) to indicate intentionally unused. Parameter exists for interface documentation - parent component uses it when constructing API call
- **Impact:** Zero - TypeScript compilation succeeded after fix

## User Setup Required
None - no external service configuration required

## Next Phase Readiness
**Ready for Phase 28 Plan 02 (Game Flow Integration):**
- PATCH /flags/batch endpoint functional and validated
- All three UI components exported and typed
- Components match app styling (slate-900/800 gradient, teal primary, amber accents)
- API contract defined: parent passes flaggedQuestions array, sessionId, onSubmit callback

**Integration requirements for Plan 02:**
- Add feedbackFlags: string[] to GameState type (track which questions flagged during session)
- Wire FlagButton onToggle to update local feedbackFlags array
- Render FeedbackElaborationScreen after ResultsScreen when feedbackFlags.length > 0
- Implement onSubmit to call PATCH /flags/batch with JWT token
- Handle Skip to navigate to collection picker without API call

**No blockers:** All building blocks ready for game flow integration

---
*Phase: 28-progressive-disclosure-ui*
*Completed: 2026-02-22*
