---
phase: quick-030
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/ScorePopup.tsx
  - frontend/src/features/game/components/GameScreen.tsx
autonomous: true

must_haves:
  truths:
    - "When a correct answer is revealed, the +points and +speed bonus text animate near the score display in the top-left, not centered on screen"
    - "Timeout 'Time's up!' popup still appears centered on screen (unchanged)"
    - "Wrong answers still trigger shake/flash on the score display (unchanged)"
  artifacts:
    - path: "frontend/src/features/game/components/ScorePopup.tsx"
      provides: "Repositioned point animation anchored near the scoreboard"
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "ScorePopup positioned relative to score display area"
  key_links:
    - from: "ScorePopup.tsx"
      to: "ScoreDisplay area"
      via: "Absolute positioning relative to the top-left score region"
      pattern: "top.*left|score.*region"
---

<objective>
Reposition the correct-answer point animations (+base, +speed bonus) so they appear near the scoreboard (top-left HUD area) instead of dead-center on screen.

Purpose: The score is in the top-left corner; animating points there creates a visual connection between earning points and the score incrementing.
Output: Updated ScorePopup.tsx with top-left anchored animation, minor GameScreen.tsx adjustment if needed.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/ScorePopup.tsx
@frontend/src/features/game/components/ScoreDisplay.tsx
@frontend/src/features/game/components/GameScreen.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reposition ScorePopup to animate near the scoreboard</name>
  <files>frontend/src/features/game/components/ScorePopup.tsx, frontend/src/features/game/components/GameScreen.tsx</files>
  <action>
Modify ScorePopup.tsx to position the correct-answer animations (base points and speed bonus) near the top-left score display instead of screen-center.

Current behavior:
- The outer div uses `fixed inset-0 flex items-center justify-center` which centers everything on screen
- Base points animate from y:20 to y:-40 (upward from center)
- Speed bonus animates from y:20 to y:-80 (further upward from center)
- Timeout popup also uses the same centered layout

Changes to ScorePopup.tsx:
1. For the CORRECT answer branch (the return starting at line 58), change the outer container from `fixed inset-0 flex items-center justify-center` to `fixed top-0 left-0 z-20 pointer-events-none`. Position the inner container with explicit top/left values to place it near the score display area — use approximately `top: 40px; left: 16px` (matching the HUD padding).
2. Change the base points animation: initial y:20 -> animate to y:0 with a slight rightward drift (x: 0 -> x: 40) so it appears to float out from the score number. Keep the spring physics.
3. Change the speed bonus animation similarly, offset slightly below the base points (y: 24).
4. Keep both popups using `absolute` positioning relative to the inner container, remove the `left-1/2 -translate-x-1/2` centering classes, and use `left-0` or `text-left` instead.
5. Keep the TIMEOUT branch (lines 29-50) centered on screen — do NOT change that positioning.
6. Scale the text down slightly since it will be near the compact scoreboard: base points from `text-5xl` to `text-3xl`, speed bonus from `text-2xl` to `text-lg`.

In GameScreen.tsx:
- No changes needed — the ScorePopup is already rendered at the top level of the component (not inside the HUD grid), and using fixed positioning will work fine.
- Verify the z-index of ScorePopup (z-20) is above the HUD but below modals (z-30).
  </action>
  <verify>
Run `cd "C:/Project Test/frontend" && npx tsc --noEmit` to confirm no type errors.
Visually: the +points text should appear near the top-left score number, not in the center of the screen. The "Time's up!" popup should still be centered.
  </verify>
  <done>
- Correct-answer point animations (+base, +speed bonus) appear anchored near the top-left scoreboard area
- Timeout popup remains centered on screen
- Wrong-answer shake/flash behavior is unaffected
- No TypeScript errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification of repositioned animations</name>
  <what-built>Point animations now appear near the scoreboard in the top-left instead of screen-center</what-built>
  <how-to-verify>
1. Open the game at https://ctc.empowered.vote (or localhost dev server)
2. Start a Quick Play round on any collection
3. Answer a question correctly — observe that "+100" and "+XX speed bonus" appear near the score number in the top-left corner, not in the center of the screen
4. Let a question time out — observe that "Time's up!" still appears centered on screen
5. Answer a question wrong — observe that the score display still shakes with a red flash
6. Check on mobile viewport (narrow screen) — the animation should still be visible and not clipped off-screen
  </how-to-verify>
  <resume-signal>Type "approved" or describe any positioning/sizing issues to adjust</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Correct-answer animations render near top-left score area
- Timeout popup still centered
- Wrong-answer shake/flash unchanged
</verification>

<success_criteria>
Point and speed bonus animations appear near the scoreboard instead of centered on the answer buttons. All other game feedback (timeout, wrong answer) is unaffected.
</success_criteria>

<output>
After completion, create `.planning/quick/030-points-speed-bonus-animate-over-scorebo/030-SUMMARY.md`
</output>
