---
phase: quick
plan: "016"
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/game/components/GameTimer.tsx
  - frontend/src/features/game/components/GameScreen.tsx
autonomous: true

must_haves:
  truths:
    - "Timer circle appears centered in the top bar row between score (left) and dots (right)"
    - "Collection title text appears above the progress dots on the right side"
    - "No 80px empty timer space exists between the top bar and the question card"
    - "Question card and answer options shift up, reclaiming the vertical space"
  artifacts:
    - path: "frontend/src/features/game/components/GameTimer.tsx"
      provides: "Configurable size prop for countdown circle"
      contains: "size"
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "Rearranged top bar with timer centered and collection title on right"
  key_links:
    - from: "GameScreen.tsx"
      to: "GameTimer.tsx"
      via: "size prop passed to GameTimer"
      pattern: "size=\\{\\d+\\}"
---

<objective>
Move the countdown timer into the top bar row (centered between score on left and progress dots on right). Place the collection title above the progress dots on the right side. Remove the 80px reserved timer space below the top bar so the question content area shifts up.

Purpose: Tighter vertical layout — the timer was wasting an entire row of space below the top bar. Embedding it in the top bar reclaims that space and keeps all HUD info in one scannable row.
Output: Updated GameTimer.tsx (accepts size prop) and GameScreen.tsx (rearranged top bar layout).
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/GameTimer.tsx
@frontend/src/features/game/components/ScoreDisplay.tsx
@frontend/src/features/game/components/ProgressDots.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add size prop to GameTimer and restructure top bar layout</name>
  <files>
    frontend/src/features/game/components/GameTimer.tsx
    frontend/src/features/game/components/GameScreen.tsx
  </files>
  <action>
**GameTimer.tsx changes:**
- Add an optional `size` prop to `GameTimerProps` interface: `size?: number` (default 80).
- Pass `size` to `CountdownCircleTimer`'s `size` prop instead of the hardcoded `80`.
- Adjust `strokeWidth` proportionally: when size < 60, use `strokeWidth={4}` instead of 6, otherwise keep 6.
- When size is smaller (< 60), use `text-lg` instead of `text-2xl` for the remaining time number, and hide the warning/critical SVG icons (they won't fit in a small circle). Use a conditional: if `size < 60`, don't render the isWarning SVG or the isCritical SVG.

**GameScreen.tsx changes:**

1. **Remove the collection name badge from its current position** (lines 366-370, the standalone div above the controls row that shows `state.collectionName`).

2. **Restructure the top bar controls row** (the `flex items-center justify-between` div, lines 373-392) to have THREE columns instead of two:
   - Left: `ScoreDisplay` (unchanged)
   - Center: The `GameTimer` component, moved here from the question area below. Use `size={48}` and `strokeWidth={4}`. Wrap it in a div with `absolute left-1/2 -translate-x-1/2` so it's truly centered in the row regardless of left/right content width. The parent controls row needs `relative` added.
   - Right: Collection name + ProgressDots + Q counter stacked vertically. Move the collection name into this right column, placed ABOVE the ProgressDots. Structure:
     ```
     <div className="flex flex-col items-end gap-0.5">
       {state.collectionName && (
         <div className="text-xs text-slate-500 font-medium tracking-wide uppercase truncate max-w-[160px]">
           {state.collectionName}
         </div>
       )}
       <ProgressDots ... />
       <span className="text-slate-500 text-[10px] ...">Q{n} of {total}</span>
     </div>
     ```
     Change from `items-center` to `items-end` so the right column is right-aligned.

3. **Remove the 80px timer wrapper from the question area.** Delete the entire div on lines 438-449:
   ```
   <div className="flex justify-center min-h-[80px] items-center">
     {(showOptions || ...) && (
       <GameTimer ... />
     )}
   </div>
   ```
   The timer is now in the top bar, so this reserved-space div is no longer needed.

4. **The timer in the top bar** should use the same conditional visibility as the old location: only render when `(showOptions || state.phase === 'locked' || state.phase === 'revealing' || (state.phase === 'selected' && state.currentQuestionIndex === state.questions.length - 1))`. When the timer is not shown (during question preview), the center space should just be empty. Keep the same props: `key={timerKey}`, `duration={...}`, `onTimeout={onTimeout}`, `onTimeUpdate={setCurrentTimeRemaining}`, `isPaused={...}`.

5. **Adjust the top-level HUD container** (line 364): change `flex flex-col items-center gap-2 mb-4 md:mb-8` — remove the `gap-2` since the collection name no longer needs its own row. Keep `mb-4 md:mb-8` or reduce to `mb-2 md:mb-4` to tighten things up since we reclaimed space.

6. **Adjust the question content area padding**: The `motion.div` at line 436 has `pt-2 md:pt-6`. Since the timer no longer occupies space above the question, reduce this to `pt-0 md:pt-2` so the question card sits closer to the top bar.
  </action>
  <verify>
Run `cd /c/Project\ Test/frontend && npx tsc --noEmit` to confirm no TypeScript errors. Visually inspect the game screen: timer should appear as a small circle centered in the top bar row, collection title should appear above the dots on the right, and the question card should be higher up on the screen with no empty gap where the timer used to be.
  </verify>
  <done>
Timer (48px circle) renders centered in the top bar between score and dots. Collection title appears right-aligned above the progress dots. The 80px reserved timer space is gone. Question content shifts up to fill the reclaimed space. No TypeScript errors.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Game screen shows timer centered in top bar row
- Collection title displays above progress dots on right side
- No empty 80px gap between top bar and question card
- Timer still functions correctly (countdown, color changes, timeout)
- Timer visibility still follows same conditional logic (hidden during question preview)
- Layout looks good on mobile and desktop widths
</verification>

<success_criteria>
- Timer is visually centered in the top bar row at 48px size
- Collection title is right-aligned above progress dots
- Question content area starts immediately after the top bar with no wasted vertical space
- All timer functionality preserved (countdown, pause, timeout, time-based color changes)
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/016-timer-to-top-bar-collection-title/016-SUMMARY.md`
</output>
