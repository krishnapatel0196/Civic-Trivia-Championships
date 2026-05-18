---
phase: quick-027
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/GameScreen.tsx
  - frontend/src/features/game/components/AnswerGrid.tsx
  - frontend/src/features/game/components/QuestionCard.tsx
autonomous: false

must_haves:
  truths:
    - "Game content is vertically centered on large PC screens instead of squished at top"
    - "All content (question + 4 answers + lock-in button) fits on screen without scrolling on all devices"
    - "Layout scales gracefully across mobile (375px), tablet (768px), laptop (1024px), desktop (1440px), and ultrawide (1920px+)"
    - "No UI elements are cut off or hidden at any breakpoint"
  artifacts:
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "Responsive vertical centering for main gameplay area"
    - path: "frontend/src/features/game/components/AnswerGrid.tsx"
      provides: "Responsive spacing and sizing for answer buttons"
    - path: "frontend/src/features/game/components/QuestionCard.tsx"
      provides: "Responsive question text sizing"
  key_links:
    - from: "GameScreen.tsx main content container"
      to: "AnswerGrid + QuestionCard"
      via: "flex layout with justify-center"
      pattern: "justify-center"
---

<objective>
Spread out the gameplay layout so it is vertically centered on screen and responsive across all device sizes. Currently the question/answer area hugs the top of the screen on large monitors, leaving wasted space below. Fix by vertically centering the content area, adding responsive spacing that scales with viewport height, and ensuring nothing requires scrolling on any screen size.

Purpose: Improve visual comfort on large PC screens while maintaining mobile/tablet usability.
Output: Updated GameScreen, AnswerGrid, and QuestionCard with responsive centered layout.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/AnswerGrid.tsx
@frontend/src/features/game/components/QuestionCard.tsx
@frontend/tailwind.config.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Vertically center gameplay content and add responsive spacing</name>
  <files>
    frontend/src/features/game/components/GameScreen.tsx
    frontend/src/features/game/components/AnswerGrid.tsx
    frontend/src/features/game/components/QuestionCard.tsx
  </files>
  <action>
In GameScreen.tsx, modify the main game screen layout (the return block starting at line ~409):

1. **Outer container** (line 411, `className="h-screen h-[100dvh] relative overflow-hidden"`): Keep as-is. This is the viewport boundary.

2. **Main content container** (line 426, `className="relative h-full flex flex-col py-2 md:py-4 px-4"`): Keep as-is. This is the full-height flex column.

3. **Top HUD section** (line 428): Keep `flex-shrink-0`. Change `mb-2 md:mb-4` to `mb-1` — let the flex gap handle spacing naturally. The HUD should stay at the top.

4. **Question + Answers area** (the `motion.div` at line 529-534): This is the KEY change. Currently:
   ```
   className="flex-1 flex flex-col items-center justify-start pt-4 md:pt-12 lg:pt-16 gap-1 md:gap-3 max-w-[700px] mx-auto w-full px-4 min-h-0 overflow-hidden"
   ```
   Change to:
   ```
   className="flex-1 flex flex-col items-center justify-center max-w-[700px] mx-auto w-full px-4 min-h-0 overflow-hidden gap-2 md:gap-4 lg:gap-5"
   ```
   Key changes:
   - `justify-start` -> `justify-center`: Centers content vertically in the available space
   - Remove fixed `pt-4 md:pt-12 lg:pt-16` padding-top: Let centering handle vertical position naturally
   - Increase gap to `gap-2 md:gap-4 lg:gap-5`: More breathing room between question and answers on larger screens

5. **AnswerGrid answer buttons** (in AnswerGrid.tsx line 182): Change the grid gap from `gap-2 md:gap-2.5` to `gap-2 md:gap-3 lg:gap-3.5` for more breathing room between answer cards on larger screens.

6. **AnswerGrid button min-height** (line 223): Change `minHeight: '52px'` to use a responsive approach. Replace the static `minHeight` with: `minHeight: 'clamp(48px, 6vh, 64px)'` — this scales the answer button height with viewport, giving more visual weight on large screens while staying compact on mobile.

7. **AnswerGrid button padding** (line 217): Change `padding: '10px 12px'` to `padding: 'clamp(8px, 1.2vh, 14px) clamp(12px, 1.5vw, 20px)'` — responsive padding that grows on larger screens.

8. **QuestionCard question text** (line 30 in QuestionCard.tsx): The font size `clamp(18px, 4vw, 26px)` is fine for width scaling but could use more room on tall screens. Change to `clamp(18px, 3.5vw, 28px)` — slightly larger max for big screens.

9. **QuestionCard gap** (line 12): Change `gap-2` to `gap-2 lg:gap-3` for more space between topic badge and question text on large screens.

Do NOT change:
- The idle/start screen layout (already uses `flex items-center justify-center`)
- The WagerScreen or FinalQuestionAnnouncement layouts
- Any game logic, state management, or event handlers
- The timer, score display, or progress dots components
- Any color values, font families, or animation timings
  </action>
  <verify>
Run `cd frontend && npm run build` — build succeeds with no errors. Visually inspect the diff to confirm only layout/spacing CSS classes and values changed, no logic changes.
  </verify>
  <done>
Build passes. The gameplay question+answer area uses `justify-center` instead of `justify-start`, responsive gaps/padding/sizing scale with viewport, and no fixed top padding pushes content upward.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Responsive centered gameplay layout that adapts to screen size</what-built>
  <how-to-verify>
    1. Open https://civic-trivia-frontend.onrender.com (or local dev server) on your large PC monitor
    2. Start a game from any collection
    3. Verify the question and answer buttons are vertically centered in the available space (not squished at the top)
    4. Verify all 4 answer buttons and the question are visible without scrolling
    5. Use browser DevTools to test responsive sizes:
       - Mobile (375x667): Content should be compact but fully visible, no scroll needed
       - Tablet (768x1024): Comfortable spacing, centered
       - Laptop (1366x768): Well-spaced, vertically centered
       - Desktop (1920x1080): Spread out nicely, centered vertically
       - Ultrawide (2560x1440): Still centered, not absurdly stretched
    6. Play through a question — verify the reveal phase (explanation + Next button) still fits on screen
    7. Check the Lock In button appears properly when an answer is selected
    8. Check the final question (Q8) wager badge + question still fits
  </how-to-verify>
  <resume-signal>Type "approved" or describe what needs adjustment (e.g., "too much gap on tablet", "answers still too high on 1440p")</resume-signal>
</task>

</tasks>

<verification>
- `cd frontend && npm run build` passes with zero errors
- Visual inspection on large PC screen shows centered layout
- No scrolling required at any standard viewport size
- Reveal phase (explanation + Learn More + Next button) fits without overflow
</verification>

<success_criteria>
- Gameplay content is vertically centered on screens >= 1080p tall
- All interactive elements (answers, lock-in, next) visible without scrolling on all devices from 375px to 2560px wide
- Spacing between elements scales proportionally with screen size
- No visual regressions on mobile or tablet layouts
</success_criteria>

<output>
After completion, create `.planning/quick/027-spread-out-gameplay-layout-centered-resp/027-SUMMARY.md`
</output>
