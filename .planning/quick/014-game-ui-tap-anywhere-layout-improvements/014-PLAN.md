---
phase: quick-014
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/GameScreen.tsx
  - frontend/src/features/game/components/ScoreDisplay.tsx
autonomous: true

must_haves:
  truths:
    - "Tapping/clicking anywhere on the screen (that is not another interactive button) advances to the next question during reveal phase"
    - "Question counter (Q3 OF 8) is positioned under the progress dots on the right side"
    - "Points display is anchored to the top-left corner of the screen"
    - "The close/quit X button is removed from the top HUD"
    - "Summary content at bottom of reveal is visible without scrolling on mobile"
  artifacts:
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "Tap-anywhere handler, layout restructure, X button removal"
    - path: "frontend/src/features/game/components/ScoreDisplay.tsx"
      provides: "Compact score display suitable for top-left corner placement"
  key_links:
    - from: "GameScreen.tsx background div"
      to: "nextQuestion()"
      via: "onClick handler on outermost container during reveal phase"
      pattern: "onClick.*nextQuestion"
---

<objective>
Four UI improvements to the game screen during play:
1. Tap/click anywhere (not on another button) to advance during reveal phase
2. Move "Q3 OF 8" counter under the progress dots on the right
3. Put points display in the top-left corner (always visible, not conditionally centered)
4. Remove the X close button from the top bar

These changes reduce clutter, make advancing more natural on mobile, and ensure the summary/explanation text is visible without scrolling by reclaiming vertical space.

Purpose: Polish the game UI for better mobile usability after the tap-to-continue feature was added in quick task 013.
Output: Updated GameScreen.tsx and ScoreDisplay.tsx with all four layout changes.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/ScoreDisplay.tsx
@frontend/src/features/game/components/ProgressDots.tsx
@frontend/src/features/game/components/AnswerGrid.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure top HUD layout and add tap-anywhere handler</name>
  <files>
    frontend/src/features/game/components/GameScreen.tsx
    frontend/src/features/game/components/ScoreDisplay.tsx
  </files>
  <action>
In GameScreen.tsx, make these four changes:

**1. Tap-anywhere to advance during reveal:**
- Add an `onClick` handler on the outermost `div` (line 359, the `min-h-screen` container) that calls `nextQuestion()` ONLY when `state.phase === 'revealing'` AND `!isLearnMoreOpen`.
- To prevent button clicks from also triggering advance, add `e.stopPropagation()` on: the LearnMoreButton wrapper div, the "Next Question" button, and the quit dialog. The answer option buttons are already `disabled` during reveal so they won't conflict, but the LearnMoreButton and Next Question button need stopPropagation.
- The existing "Next Question" button should REMAIN as a visible affordance (it still calls nextQuestion on click), but tapping the background also works.

**2. Move question counter under progress dots:**
- In the controls row (lines 381-413), remove the centered `Q{N} of {total}` span.
- Under the `<ProgressDots>` component, add the question counter as a small label: `<span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Q{state.currentQuestionIndex + 1} of {state.questions.length}</span>`.
- Wrap the ProgressDots and this new label in a `<div className="flex flex-col items-center gap-0.5">` so the counter sits directly beneath the dots.

**3. Move points to top-left corner:**
- Remove the conditional centered `<ScoreDisplay>` block (lines 417-425).
- Instead, place `<ScoreDisplay>` in the top-left of the controls row where the quit button currently is. It should always be visible during the main game (not conditionally hidden during answering).
- Make ScoreDisplay more compact for corner placement: In ScoreDisplay.tsx, add an optional `compact` prop (boolean, default false). When `compact={true}`: use `text-xl` instead of `text-3xl` for the score, `px-3 py-1.5` instead of `px-6 py-3` for padding, and hide the "pts" label. Pass `compact={true}` from GameScreen.
- The controls row becomes: [ScoreDisplay (left)] ... [ProgressDots + counter (right)].

**4. Remove the X close button:**
- Delete the quit button JSX entirely (lines 383-401). The user can still quit via the pause overlay (Escape key triggers it). Also remove `handleQuitClick`, `handleQuitCancel`, `handleQuitConfirm` handlers, the `showQuitDialog` state, and the `<ConfirmDialog>` component at the bottom since there is no way to trigger it anymore. Remove the `ConfirmDialog` import if unused.
- This reclaims ~48px+ of vertical space, helping the explanation/summary text be visible without scrolling.

**Important considerations:**
- The controls row `justify-between` still works with two items (score left, dots right).
- Keep the collection name badge above the controls row as-is.
- The tap-anywhere handler must NOT fire when the user taps inside the LearnMoreModal (the modal has its own overlay, but double-check it won't bubble). The modal is rendered as a portal/overlay, so clicks on it should not bubble to the game container. If the modal is rendered inside the game div, add `e.stopPropagation()` on the modal wrapper.
  </action>
  <verify>
Run `cd /c/Project\ Test/frontend && npx tsc --noEmit` - zero TypeScript errors.
Run `cd /c/Project\ Test/frontend && npm run build` - production build succeeds.
Visually confirm in the built output that:
- No X button in the JSX
- Score display is in the controls row (left side)
- Question counter is under progress dots
- onClick handler on the container div checks for revealing phase
  </verify>
  <done>
- Outermost game div has onClick that calls nextQuestion() when phase is 'revealing' and LearnMoreModal is not open
- X close button is fully removed along with quit dialog state/handlers
- Score display renders in top-left of controls row with compact styling
- Question counter ("Q3 OF 8") renders directly under the progress dots on the right
- TypeScript compiles with zero errors
- Production build succeeds
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual and functional verification</name>
  <what-built>
Four game UI changes: tap-anywhere advance, question counter moved under dots, points in top-left, X button removed.
  </what-built>
  <how-to-verify>
1. Run `cd /c/Project\ Test/frontend && npm run dev` and open the game
2. Start a game and answer a question to reach the reveal phase
3. Verify the layout:
   - Top-left: compact points display (score number, no "pts" label)
   - Top-right: progress dots with "Q1 OF 8" underneath
   - No X close button visible anywhere
4. During reveal phase:
   - Tap/click on the dark background area -> should advance to next question
   - Tap the "Learn More" button -> should open modal, NOT advance
   - Tap the "Next Question" button -> should advance (still works as before)
5. Scroll check on mobile viewport (use Chrome DevTools responsive mode ~375px width):
   - The explanation text at the bottom of reveal should be visible without scrolling
6. Press Escape during answering phase -> pause overlay should still work (this is the only way to quit now)
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- Tap anywhere on background during reveal advances to next question
- Tapping interactive elements (Learn More, Next Question) does NOT double-trigger
- Score visible in top-left at all times during gameplay
- Question counter positioned under progress dots
- No X button present; quit still accessible via Escape -> pause overlay
</verification>

<success_criteria>
- All four UI changes implemented and working
- No regressions to existing game flow (answering, locking in, reveal animations, Learn More modal)
- TypeScript and build pass cleanly
- Mobile layout shows explanation without scrolling
</success_criteria>

<output>
After completion, create `.planning/quick/014-game-ui-tap-anywhere-layout-improvements/014-SUMMARY.md`
</output>
