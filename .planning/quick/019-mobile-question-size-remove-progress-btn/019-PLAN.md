---
phase: quick-019
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/QuestionCard.tsx
  - frontend/src/features/game/components/GameScreen.tsx
autonomous: true

must_haves:
  truths:
    - "Question text is smaller and less padded on mobile so questions fit in the top third of the screen"
    - "The four answer options are visible without scrolling on a standard mobile viewport"
    - "The teal 'Next Question' / 'See Results' progress button no longer appears during the reveal phase"
    - "Clicking/tapping anywhere on the screen still advances to the next question (existing behavior preserved)"
    - "Desktop layout remains visually unchanged or very close to current"
  artifacts:
    - path: "frontend/src/features/game/components/QuestionCard.tsx"
      provides: "Reduced mobile font size and padding for question text"
      contains: "text-xl"
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "No teal progress button, tighter mobile spacing"
  key_links:
    - from: "GameScreen.tsx"
      to: "nextQuestion()"
      via: "onClick handler on main container div"
      pattern: "onClick.*nextQuestion"
---

<objective>
Optimize the mobile game UI by reducing question text size/padding and removing the redundant teal progress button.

Purpose: On mobile, question text is oversized, causing questions to consume too much screen space. Single words can fill an entire line. Combined with the "Next Question" button that duplicates the tap-anywhere-to-advance behavior, the answer options get pushed below the fold. This fix ensures questions stay in the top third with all four answer options visible without scrolling.

Output: Modified QuestionCard.tsx and GameScreen.tsx with mobile-optimized sizing and no progress button.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/QuestionCard.tsx
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/AnswerGrid.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reduce question text size and padding on mobile</name>
  <files>frontend/src/features/game/components/QuestionCard.tsx</files>
  <files>frontend/src/features/game/components/GameScreen.tsx</files>
  <action>
In QuestionCard.tsx:
- Change the question text classes from `text-3xl md:text-4xl font-bold text-center leading-relaxed` to `text-xl md:text-4xl font-bold text-center leading-snug md:leading-relaxed`. This reduces mobile from 30px to 20px and tightens line height on mobile.
- Change the container padding from `px-6` to `px-2 md:px-6` to reduce horizontal padding on mobile.
- Change `gap-4` to `gap-2 md:gap-4` to tighten vertical spacing between topic badge and question text on mobile.

In GameScreen.tsx:
- On the top HUD margin (line 374), change `mb-[70px] md:mb-[120px]` to `mb-6 md:mb-[120px]` to reduce the gap between the HUD and question on mobile.
- On the main motion.div (line 462), change `gap-3 md:gap-8` to `gap-2 md:gap-8` to tighten mobile spacing between question and answers.
- On the AnswerGrid wrapper (line 500), change `pt-[20px] pb-[40px]` to `pt-2 md:pt-[20px] pb-4 md:pb-[40px]` to reduce answer grid padding on mobile.

These changes preserve the desktop layout (md: breakpoint keeps all current values) while significantly compressing the mobile layout so questions and all four answers fit on screen together.
  </action>
  <verify>Run `cd "C:/Project Test/frontend" && npx tsc --noEmit` to confirm no type errors. Visually inspect that the classes are responsive (mobile values before md: breakpoint, desktop values after).</verify>
  <done>QuestionCard uses text-xl on mobile (up from text-3xl), reduced padding and line height on mobile, tighter vertical spacing in GameScreen. Desktop layout unchanged via md: breakpoint overrides.</done>
</task>

<task type="auto">
  <name>Task 2: Remove the teal progress button from reveal phase</name>
  <files>frontend/src/features/game/components/GameScreen.tsx</files>
  <action>
In GameScreen.tsx, remove the entire "Next Question button" block (the section wrapped in the `{state.phase === 'revealing' && (` conditional around lines 535-548). This is the `motion.button` with classes including `bg-teal-600` that shows "Next Question" or "See Results" text.

Remove the entire block:
```
{state.phase === 'revealing' && (
  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
    <motion.button ... >
      {state.currentQuestionIndex < state.totalQuestions - 1 ? 'Next Question' : 'See Results'}
    </motion.button>
  </div>
)}
```

This is safe to remove because:
1. The parent div (line 354-361) already has an `onClick` handler that calls `nextQuestion()` when `state.phase === 'revealing'`
2. Space/Enter key handler (lines 208-222) also calls `nextQuestion()` during reveal phase
3. The button was redundant with the "click anywhere to advance" pattern

Do NOT remove the "Lock In" button in AnswerGrid.tsx — that serves a different purpose (confirming answer selection before reveal).

Also do NOT remove the LearnMoreButton or its tooltip — those are interactive elements that use `e.stopPropagation()` to prevent advancing.
  </action>
  <verify>Run `cd "C:/Project Test/frontend" && npx tsc --noEmit` to confirm no type errors. Grep the file for "Next Question" to confirm the button text is gone. Verify the parent onClick handler for nextQuestion still exists.</verify>
  <done>The teal "Next Question" / "See Results" button no longer renders during the reveal phase. Tap-anywhere and keyboard navigation still advance to the next question.</done>
</task>

</tasks>

<verification>
1. `cd "C:/Project Test/frontend" && npx tsc --noEmit` passes with no errors
2. `cd "C:/Project Test/frontend" && npm run build` completes successfully
3. QuestionCard.tsx contains `text-xl md:text-4xl` (not `text-3xl md:text-4xl`)
4. GameScreen.tsx does NOT contain a motion.button with "Next Question" text
5. GameScreen.tsx STILL contains the parent div onClick handler calling nextQuestion()
6. AnswerGrid.tsx "Lock In" button is unchanged
</verification>

<success_criteria>
- Question text is visibly smaller on mobile (text-xl vs text-3xl = 33% reduction)
- Mobile padding reduced (px-2 vs px-6, tighter gaps and margins)
- Questions should fit in roughly the top third of a mobile screen with answers visible below
- No teal progress button visible during answer reveal phase
- Tap-anywhere and keyboard shortcuts still advance through questions
- Desktop experience is unchanged (all md: breakpoint values preserved)
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/019-mobile-question-size-remove-progress-btn/019-SUMMARY.md`
</output>
