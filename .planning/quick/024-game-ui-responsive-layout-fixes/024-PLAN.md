---
phase: quick
plan: 024
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/GameScreen.tsx
  - frontend/src/features/game/components/QuestionCard.tsx
  - frontend/src/features/game/components/AnswerGrid.tsx
autonomous: false

must_haves:
  truths:
    - "All game content (timer, question, 4 answer buttons) is visible without scrolling on a 768px-tall laptop screen"
    - "Layout still works well on a 1080p+ desktop monitor (no excessive whitespace cramming)"
    - "Mobile layout (< 640px) remains functional with all answers visible"
    - "Reveal phase content (explanation, Learn More) does not break the viewport constraint"
  artifacts:
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "Viewport-constrained game layout using dvh/svh with flex distribution"
    - path: "frontend/src/features/game/components/QuestionCard.tsx"
      provides: "Responsive question text that scales with available space"
    - path: "frontend/src/features/game/components/AnswerGrid.tsx"
      provides: "Compact answer buttons that fit within the flex-allocated space"
  key_links:
    - from: "GameScreen.tsx outer div"
      to: "inner flex-col container"
      via: "h-dvh with overflow-hidden constrains all children to viewport"
    - from: "Top HUD section"
      to: "Question+Answers section"
      via: "flex-shrink-0 HUD + flex-1 content area distributes space correctly"
---

<objective>
Fix the game screen layout so ALL game content (timer, score, question text, and 4 answer choices) fits within the viewport on every screen size without scrolling.

Purpose: A real user on a laptop lost track of the timer because answers were below the fold. This is a critical gameplay issue -- if you can't see the timer and answers simultaneously, the game breaks.

Output: Modified GameScreen.tsx, QuestionCard.tsx, and AnswerGrid.tsx with viewport-constrained layout.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/QuestionCard.tsx
@frontend/src/features/game/components/AnswerGrid.tsx
@frontend/src/features/game/components/GameTimer.tsx
@frontend/src/features/game/components/ScoreDisplay.tsx
@frontend/tailwind.config.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Constrain GameScreen to viewport height and rebalance spacing</name>
  <files>
    frontend/src/features/game/components/GameScreen.tsx
    frontend/src/features/game/components/QuestionCard.tsx
    frontend/src/features/game/components/AnswerGrid.tsx
  </files>
  <action>
The root problem is that the main game screen uses `min-h-screen` (allows content to grow beyond viewport) with excessive fixed spacing. Fix as follows:

**GameScreen.tsx -- outer container (line ~354):**
- Change `min-h-screen` to `h-dvh` (dynamic viewport height, handles mobile address bar). Add fallback: `h-screen` as a preceding class so older browsers get something. Add `overflow-hidden` to prevent any scrolling during the active gameplay phases (answering, selected, locked).
- The full outer div class should be: `h-screen h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden`
- IMPORTANT: Only apply `overflow-hidden` on the outer game div. The revealing phase needs a different treatment (see below).

**GameScreen.tsx -- inner content container (line ~372):**
- Change `min-h-screen` to `h-full` so it fills but does not exceed the outer constrained height.
- Change `py-4 md:py-8` to `py-2 md:py-4` to reclaim vertical space.
- Resulting class: `relative h-full flex flex-col py-2 md:py-4 px-4`

**GameScreen.tsx -- Top HUD section (line ~374):**
- Change `mb-6 md:mb-[120px]` to `mb-2 md:mb-4` -- the old 120px margin was the single biggest space waster.
- Add `flex-shrink-0` so the HUD keeps its size and the question area takes remaining space.
- Resulting class: `flex flex-col items-center mb-2 md:mb-4 max-w-5xl mx-auto w-full flex-shrink-0`

**GameScreen.tsx -- Question+Answers motion.div (line ~456-462):**
- Change the className from `flex-1 flex flex-col items-center pt-0 md:pt-2 gap-2 md:gap-8 max-w-[700px] mx-auto w-full px-4` to:
  `flex-1 flex flex-col items-center justify-center gap-1 md:gap-3 max-w-[700px] mx-auto w-full px-4 min-h-0 overflow-y-auto`
- Key changes: `justify-center` centers content vertically when there's room; `gap-2 md:gap-8` reduced to `gap-1 md:gap-3`; removed pt-0/pt-2; added `min-h-0` (critical for flex children to allow shrinking below content size); added `overflow-y-auto` so if content still somehow overflows on very short screens, it scrolls within this area only (not the whole page).

**GameScreen.tsx -- Revealing phase special handling:**
- During the revealing phase, extra content appears (explanation box, Learn More button). For the revealing phase, the outer container should allow scrolling. Add a conditional: when `state.phase === 'revealing'`, swap `overflow-hidden` to `overflow-y-auto` on the outer container div. Implement this with a ternary in the className:
  `${state.phase === 'revealing' ? 'overflow-y-auto' : 'overflow-hidden'}`

**QuestionCard.tsx -- question text sizing:**
- Change the question text div class from `text-xl md:text-4xl font-bold text-center leading-snug md:leading-relaxed` to:
  `text-lg md:text-2xl lg:text-3xl font-bold text-center leading-snug`
- This reduces the desktop question text from text-4xl (36px) to text-2xl (24px) on medium screens and text-3xl (30px) on large screens. The mobile size drops from text-xl (20px) to text-lg (18px). This is the second biggest space saver.
- Also change the gap on the outer div from `gap-2 md:gap-4` to `gap-1 md:gap-2`.

**AnswerGrid.tsx -- reduce padding and gaps:**
- Change the answer grid gap from `gap-2 md:gap-4` to `gap-2 md:gap-3` (line ~123).
- Change `mb-3 md:mb-6` to `mb-2 md:mb-3` on the grid div.
- Change the answer option wrapper (motion.div around the answers, line ~500 in GameScreen) padding from `pt-2 md:pt-[20px] pb-4 md:pb-[40px]` to `pt-1 md:pt-2 pb-2 md:pb-3`.
- Change answer button padding from `p-3 md:p-4` to `p-2.5 md:p-3` (line ~161 in AnswerGrid.tsx). Keep `min-h-[48px]` for touch accessibility.
- Change the explanation box `mb-4` to `mb-2` (line ~236 in AnswerGrid.tsx).

**DO NOT change:**
- Timer size or the min-h-[80px] timer container -- the timer is fine
- Any animation logic, game state handling, or keyboard handlers
- The idle, wager, or final-announcement phase layouts (they use their own min-h-screen which is correct for centering content)
- Any component APIs or prop interfaces
- The 2-column grid layout on md+ screens for answers
  </action>
  <verify>
    1. Run `cd frontend && npx tsc --noEmit` to verify no TypeScript errors.
    2. Run `cd frontend && npm run build` to verify the build succeeds.
    3. Visually inspect at multiple viewport heights in dev tools:
       - 640px height (small laptop) -- all 4 answers + timer visible without scrolling
       - 768px height (typical laptop) -- comfortable layout, no scroll needed
       - 900px height (standard monitor) -- nice spacing, not cramped
       - 1080px height (full HD) -- content centered nicely
       - 375x667 (iPhone SE) -- all content fits
  </verify>
  <done>
    - On a 768px-tall viewport, the game screen shows timer, question, and all 4 answer buttons without any scrolling
    - On a 640px-tall viewport, all gameplay content is visible (may be tighter but no scroll)
    - On 1080p desktop, layout looks good with centered content and comfortable spacing
    - During the revealing phase, if explanation + Learn More push beyond viewport, the content area scrolls (not the whole page)
    - Mobile layout remains fully functional
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Viewport-constrained game layout that fits timer + question + answers on every screen size without scrolling</what-built>
  <how-to-verify>
    1. Start the frontend dev server: `cd frontend && npm run dev`
    2. Open the game in Chrome and start a round of trivia
    3. Test at these viewport sizes (use Chrome DevTools responsive mode, Ctrl+Shift+M):
       a. **Laptop (1366x768):** Can you see the timer AND all 4 answers at the same time? No scrolling needed?
       b. **Small laptop (1280x640):** Same check -- timer + all answers visible?
       c. **Desktop (1920x1080):** Does it look good? Not too cramped?
       d. **Mobile (375x667 iPhone SE):** All answers visible?
       e. **Mobile (390x844 iPhone 14):** Comfortable spacing?
    4. Play through a full game:
       - During answering: everything fits, no scroll
       - After selecting an answer: Lock In button visible
       - During reveal: explanation may cause scroll in the content area (acceptable), but timer area stays pinned
       - Final question: the amber badge + question + answers all fit
    5. Verify the revealing phase: after answering, does the explanation text and "Learn More" button appear correctly? On a short screen, can you scroll within the content area to see them?
  </how-to-verify>
  <resume-signal>Type "approved" if layout works across screen sizes, or describe which viewport/phase has issues</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- All game content fits in viewport on 768px height screen without scrolling
- Revealing phase gracefully handles extra content
- No visual regressions on desktop or mobile
</verification>

<success_criteria>
- A user on a typical laptop (1366x768) can see the timer, question text, and all 4 answer choices simultaneously without scrolling
- Mobile users see all content without scrolling during gameplay
- Desktop users get a comfortable, well-spaced layout (not overly cramped)
- The revealing phase (with explanation) allows scrolling within the content area if needed
</success_criteria>

<output>
After completion, create `.planning/quick/024-game-ui-responsive-layout-fixes/024-SUMMARY.md`
</output>
