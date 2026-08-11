# Phase 69: Game Flow Buttons - Research

**Researched:** 2026-03-19
**Domain:** React UI — game flow navigation, button UX, layout fitting
**Confidence:** HIGH

## Summary

Phase 69 replaces the existing tap-anywhere mechanic in `GameScreen.tsx` with explicitly labeled navigation buttons ("Next Question", "Last Question", "Game Recap"). The codebase was read directly — all findings are grounded in the actual source files, not speculation.

The tap-anywhere mechanic is currently implemented in two places in `GameScreen.tsx`: (1) an `onClick` handler on the root `<div>` that calls `nextQuestion()` when `state.phase === 'revealing'`, and (2) an animated tap-hint SVG icon (`/images/noun-tap-8166713-03B9D2.svg`) rendered as a fixed overlay during the revealing phase. Both must be removed. A button must replace them in the flow.

The button label logic is straightforward: `currentQuestionIndex` (0-based) drives the label. Q1–Q6 = index 0–5 = "Next Question". Q7 = index 6 = "Last Question". Q8 = index 7 = isFinalQuestion = the wager question — but after the wager question resolves, the game dispatches `NEXT_QUESTION` which transitions to `complete` phase, so "Game Recap" appears during `revealing` only when `isFinalQuestion === true`. The `nextQuestion()` function already handles all three transitions correctly — the button just needs to call it.

The game show aesthetic is established and must be matched: `Bebas Neue` display font, amber `#E8A020` accent, dark `#0F0D09` background, `#F5EDD8` warm cream text. The `LOCK IN` button in `AnswerGrid.tsx` and the `QUICK PLAY` button in the idle state are the two existing button style references to match exactly.

**Primary recommendation:** Add a `<NextStepButton>` component rendered inside the `revealing` phase section of `GameScreen.tsx`, positioned below the `AnswerGrid` (after the `LearnMoreButton` area). Remove the root div click handler and the tap hint SVG. Three label strings driven by `state.currentQuestionIndex` and `isFinalQuestion`.

---

## Standard Stack

No new dependencies required. Everything needed already exists in the project.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.34.0 | Button entrance animation | Already used throughout game screen |
| React | ^18.2.0 | Component rendering | Project standard |
| Tailwind CSS | ^3.4.1 | Layout utilities | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Bebas Neue (Google Font) | loaded via index.html | Display font for button label | Always — matches game show aesthetic |

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure

No new files strictly required. One new component file is recommended for cleanliness:

```
frontend/src/features/game/components/
├── GameScreen.tsx         # Remove onClick + tap hint; add NextStepButton in reveal section
├── NextStepButton.tsx     # NEW: isolated button component for game flow advancement
└── AnswerGrid.tsx         # No change needed
```

### Pattern 1: Conditional Label Based on Question Index

**What:** A single button component that computes its label from game state.
**When to use:** During `revealing` phase only.

**Example:**
```typescript
// Source: Direct codebase read — GameScreen.tsx, gameReducer.ts, useGameState.ts
// isFinalQuestion = state.currentQuestionIndex === state.totalQuestions - 1
// totalQuestions = 8 (confirmed)
// Q8 index = 7 = isFinalQuestion

function getButtonLabel(questionIndex: number, isFinalQuestion: boolean): string {
  if (isFinalQuestion) return 'GAME RECAP';
  if (questionIndex === 6) return 'LAST QUESTION'; // Q7, 0-based index 6
  return 'NEXT QUESTION';                           // Q1–Q6, indices 0–5
}
```

**Note on Q7 detection:** The `isFinalQuestion` flag from `useGameState` is `currentQuestionIndex === totalQuestions - 1`, which is index 7 for an 8-question game. Q7 (index 6) is therefore `currentQuestionIndex === state.totalQuestions - 2`, or simply `!isFinalQuestion && currentQuestionIndex === 6`. A cleaner approach: `currentQuestionIndex === totalQuestions - 2` using `state.totalQuestions` from the passed-down `state`.

### Pattern 2: Button Styled to Match Game Aesthetic

**What:** Inline styles matching the existing `LOCK IN` / `QUICK PLAY` button style.
**Source:** `AnswerGrid.tsx` lines 291–313 and `GameScreen.tsx` lines 335–355.

```typescript
// Source: Direct codebase read — AnswerGrid.tsx and GameScreen.tsx
<motion.button
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
  onClick={onAdvance}
  style={{
    padding: '14px 40px',
    background: '#E8A020',
    color: '#0F0D09',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '20px',
    letterSpacing: '0.14em',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    minHeight: '52px',
    transition: 'background 0.15s',
  }}
  onMouseEnter={e => (e.currentTarget.style.background = '#C88010')}
  onMouseLeave={e => (e.currentTarget.style.background = '#E8A020')}
>
  {label}
</motion.button>
```

### Pattern 3: Removing the Tap-Anywhere Mechanic

Two surgical removals in `GameScreen.tsx`:

1. **Root div onClick** (line 406–409): Remove the entire `onClick` handler from the root `<div>`. The `h-screen h-[100dvh]` wrapper div currently has:
   ```tsx
   onClick={() => {
     if (state.phase === 'revealing' && !isLearnMoreOpen) {
       nextQuestion();
     }
   }}
   ```
   Remove the `onClick` entirely (or keep the div but without the handler).

2. **Tap hint SVG overlay** (lines 633–646): Remove the entire `<motion.img>` block:
   ```tsx
   {state.phase === 'revealing' && (
     <motion.img
       src="/images/noun-tap-8166713-03B9D2.svg"
       ...
     />
   )}
   ```

3. **`overflow-y-auto` during revealing** (line 403): Currently `state.phase === 'revealing' ? 'overflow-y-auto' : 'overflow-hidden'`. After adding an explicit button, the reveal section may need scroll if content + button overflows on small viewports — but FLOW-05 requires no scrolling. This condition should be reviewed: the button should fit within the `h-screen h-[100dvh]` container without triggering scroll.

### Pattern 4: Keyboard Support Preserved

The existing Space/Enter keyboard handler for reveal phase (lines 217–230) already calls `nextQuestion()` directly. This must be **kept** — it provides keyboard navigation that the button also handles. The button is additive to the keyboard shortcut, not a replacement.

```typescript
// Source: GameScreen.tsx lines 217–230 — keep as-is
useEffect(() => {
  if (state.phase !== 'revealing') return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isLearnMoreOpen) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      nextQuestion();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [state.phase, isLearnMoreOpen, nextQuestion]);
```

### Pattern 5: Layout Fit Without Scrolling (FLOW-05)

**The challenge:** `GameScreen.tsx` currently switches to `overflow-y-auto` during `revealing` phase to accommodate explanation text + Learn More button potentially overflowing. Adding a navigation button adds more vertical height.

**Current layout vertical stack during revealing:**
1. Top HUD row (score, timer 80px, progress) — ~100px
2. Final question badge (if applicable) — ~28px
3. QuestionCard — ~80–100px
4. AnswerGrid (4 options, 52px min-height each + gaps) — ~250px
5. Explanation block — ~80–120px
6. Learn More button (if applicable) — ~44px
7. **NEW: Navigation button** — ~52px
8. Padding — ~16px mobile, 32px desktop

**The timer is the primary space reclaim lever.** FLOW-05 explicitly states "timer may be repositioned or resized to achieve this." The timer is currently `size={80}` with a `min-h-[80px]` container. Options in priority order:
- Reduce timer size to 56–64px during/after revealing phase (no layout impact on answer phase)
- Move timer to same row as a compact element during revealing only
- Timer can be hidden entirely during revealing (no countdown is active)

**Recommended approach:** The timer is already visually static (paused, shows 0 or remaining time) during `revealing` phase. The `min-h-[80px]` container reserves 80px even when nothing is changing. Reducing to `size={56}` during reveal is the least-invasive fix. Alternatively, the timer container can collapse to 0 height when paused during reveal since its value is informational only at that point.

### Anti-Patterns to Avoid

- **Putting the button inside `AnswerGrid.tsx`:** The navigation button is a game-flow concern, not an answer-grid concern. Keep it in `GameScreen.tsx` or a dedicated component rendered by `GameScreen.tsx`.
- **Using a different visual style than existing buttons:** The `LOCK IN` button is the reference. The new buttons must use the same Bebas Neue / amber / #0F0D09 design.
- **Removing Space/Enter keyboard support:** That handler is the accessibility path. Keep it. The button and keyboard shortcut coexist.
- **Adding `overflow-y: auto` as a fix:** FLOW-05 explicitly forbids scrolling. Fix the layout to fit instead of enabling scroll.
- **Animating with a long delay:** The current `LOCK IN` uses `delay: 0` and `AnswerGrid` explanation uses `delay: 0.45`. The nav button should appear after the explanation is visible — `delay: 0.5–0.6` is appropriate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Enter animation | Custom CSS keyframe | framer-motion `initial/animate` | Already in use everywhere in the game; consistent easing |
| Hover state management | `useState` hover flag | CSS via `onMouseEnter/Leave` inline styles | Already the pattern in `LOCK IN` and `QUICK PLAY` buttons |
| Button focus ring | Custom outline | Global CSS in `index.css` — `.focus-ring-primary:focus-visible` class | Already defined; apply `focus-ring-primary` className |

**Key insight:** This phase is pure UI composition — no new libraries, no new patterns. The entire implementation reuses existing conventions from `AnswerGrid.tsx` and `GameScreen.tsx`.

---

## Common Pitfalls

### Pitfall 1: Button Rendering During Wrong Phase

**What goes wrong:** The button appears during `locked` or `answering` phase due to a condition check error.
**Why it happens:** The `revealing` phase check is straightforward but there are adjacent phases (`locked`, `selected`, `answering`) that also involve visible answers.
**How to avoid:** Render `<NextStepButton>` only when `state.phase === 'revealing'`.
**Warning signs:** Button visible before answer is shown, or button missing after reveal.

### Pitfall 2: Double-Advance on Button + Root Click

**What goes wrong:** If the root `<div>` onClick is not fully removed, clicking the button also triggers the parent `onClick`, calling `nextQuestion()` twice.
**Why it happens:** Event propagation from the button bubbles to the root div.
**How to avoid:** Fully remove the root `<div>` onClick handler (not just guard it). Alternatively, add `e.stopPropagation()` on the button click — but full removal is cleaner.
**Warning signs:** Skipping a question when clicking the nav button.

### Pitfall 3: Scroll Appearing on Mobile

**What goes wrong:** The full reveal layout (question + answers + explanation + Learn More + nav button) overflows the `h-[100dvh]` container on a 375px-wide, 667px-tall viewport (iPhone SE).
**Why it happens:** The cumulative height of all reveal elements exceeds viewport height.
**How to avoid:** Reduce `GameTimer` size during reveal phase (`size={56}` not `size={80}`), which recovers ~24px. The `min-h-[80px]` container also needs to shrink — change to `min-h-[56px]` or conditional height.
**Warning signs:** Vertical scrollbar appearing on mobile during reveal.

### Pitfall 4: "Last Question" Label Appearing on Wrong Question

**What goes wrong:** "Last Question" label appears on Q8 (wager question) instead of Q7, or on Q6.
**Why it happens:** Off-by-one error in index comparison; `totalQuestions` is 8, `finalIndex` is 7 (0-based).
**How to avoid:** Use `state.currentQuestionIndex === state.totalQuestions - 2` for "Last Question" and `isFinalQuestion` (= index 7) for "Game Recap". Q1–Q6 are indices 0–5. Q7 is index 6 = `totalQuestions - 2` = 6.
**Warning signs:** "Last Question" shows on the wager question screen, or "Game Recap" shows on Q7.

### Pitfall 5: LearnMore Modal Interaction

**What goes wrong:** Pressing Space/Enter to advance when the Learn More modal is open inadvertently closes the modal AND advances the question.
**Why it happens:** The keyboard handler already guards against this (`if (isLearnMoreOpen) return`), but the button click does not.
**How to avoid:** The button's `onClick` should also be disabled or hidden when `isLearnMoreOpen` is true. Or pass `isLearnMoreOpen` to the button component and conditionally disable.
**Warning signs:** Modal closes and question advances in one action.

### Pitfall 6: Accessibility — Button Not Announced

**What goes wrong:** Screen reader doesn't announce the navigation button after reveal.
**Why it happens:** The `announce.polite()` call in the reveal effect (lines 273–293) already ends with "Press Space or tap Next to continue." — this message will need updating to "Press Space or click Next Question to continue." once the button is added.
**How to avoid:** Update the `announce.polite()` message in the reveal effect to reference the button label instead of "tap Next".
**Warning signs:** Screen reader announcement inconsistent with visible UI.

---

## Code Examples

### Full GameScreen.tsx Changes — Summary

```typescript
// Source: Direct codebase read — GameScreen.tsx

// REMOVE from root <div> (line 406–409):
// onClick={() => {
//   if (state.phase === 'revealing' && !isLearnMoreOpen) {
//     nextQuestion();
//   }
// }}

// REMOVE fixed overlay (lines 633–646):
// {state.phase === 'revealing' && (
//   <motion.img src="/images/noun-tap-8166713-03B9D2.svg" ... />
// )}

// ADD after LearnMoreButton section (after line 611):
{state.phase === 'revealing' && (
  <div
    className="flex justify-center mt-4 mb-2"
    onClick={(e) => e.stopPropagation()}
  >
    <NextStepButton
      questionIndex={state.currentQuestionIndex}
      totalQuestions={state.totalQuestions}
      isFinalQuestion={isFinalQuestion}
      isLearnMoreOpen={isLearnMoreOpen}
      onAdvance={nextQuestion}
    />
  </div>
)}
```

### NextStepButton Component

```typescript
// Source: Pattern derived from existing AnswerGrid.tsx LOCK IN button
import { motion } from 'framer-motion';

interface NextStepButtonProps {
  questionIndex: number;
  totalQuestions: number;
  isFinalQuestion: boolean;
  isLearnMoreOpen: boolean;
  onAdvance: () => void;
}

function getLabel(questionIndex: number, totalQuestions: number, isFinalQuestion: boolean): string {
  if (isFinalQuestion) return 'GAME RECAP';
  if (questionIndex === totalQuestions - 2) return 'LAST QUESTION';
  return 'NEXT QUESTION';
}

export function NextStepButton({
  questionIndex,
  totalQuestions,
  isFinalQuestion,
  isLearnMoreOpen,
  onAdvance,
}: NextStepButtonProps) {
  const label = getLabel(questionIndex, totalQuestions, isFinalQuestion);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      onClick={isLearnMoreOpen ? undefined : onAdvance}
      disabled={isLearnMoreOpen}
      className="focus-ring-primary"
      style={{
        padding: '14px 40px',
        background: '#E8A020',
        color: '#0F0D09',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '20px',
        letterSpacing: '0.14em',
        border: 'none',
        borderRadius: '2px',
        cursor: isLearnMoreOpen ? 'default' : 'pointer',
        minHeight: '52px',
        opacity: isLearnMoreOpen ? 0.4 : 1,
        transition: 'background 0.15s, opacity 0.15s',
      }}
      onMouseEnter={e => !isLearnMoreOpen && (e.currentTarget.style.background = '#C88010')}
      onMouseLeave={e => (e.currentTarget.style.background = '#E8A020')}
    >
      {label}
    </motion.button>
  );
}
```

### Screen Reader Announcement Update

```typescript
// Source: GameScreen.tsx lines 284–290 — update these messages
// OLD:
// "Press Space or tap Next to continue."
// NEW — in the reveal useEffect announce.polite() call:
if (latestAnswer.correct) {
  message = `Correct! The answer is ${correctLetter}, ${correctText}. You earned ${latestAnswer.totalPoints} points. Press Space or click ${buttonLabel} to continue.`;
} else if (latestAnswer.selectedOption !== null) {
  message = `Not quite. The correct answer was ${correctLetter}, ${correctText}. Press Space or click ${buttonLabel} to continue.`;
} else {
  message = `Time's up. The correct answer was ${correctLetter}, ${correctText}. Press Space or click ${buttonLabel} to continue.`;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tap-anywhere entire screen | Explicit labeled button | Phase 69 | Eliminates ambiguity for new users; clearer affordance |
| Animated tap SVG icon | No icon needed | Phase 69 | Removes visual noise; button text is self-documenting |

**Deprecated/outdated after Phase 69:**
- Root `<div>` onClick for game progression: removed
- `/images/noun-tap-8166713-03B9D2.svg` tap hint image: no longer rendered (file can remain but is unused)
- Screen reader message "tap Next": replaced with button label

---

## Open Questions

1. **Timer visibility during revealing phase**
   - What we know: Timer is currently shown during `revealing` (line 440 condition includes `state.phase === 'revealing'`), size 80px. It is paused and static during reveal.
   - What's unclear: Whether reducing timer size or hiding it during reveal would help vertical fit. FLOW-05 says "timer may be repositioned or resized" — this is explicit permission.
   - Recommendation: Reduce to `size={56}` during reveal phase. Implement via conditional: `size={state.phase === 'revealing' ? 56 : 80}`. This recovers ~24px height without hiding information.

2. **`overflow-y-auto` during revealing — remove or keep?**
   - What we know: Currently `state.phase === 'revealing' ? 'overflow-y-auto' : 'overflow-hidden'`. This was added to handle long explanation text.
   - What's unclear: Whether the new layout (with timer shrunk) will still occasionally overflow on shortest phones.
   - Recommendation: Change to `overflow-hidden` for both phases (no scroll). If overflow still occurs, reduce font sizes or answer option padding in the reveal state — those are the largest variable-height elements. Verify on 375×667 viewport.

3. **`overflow-y: auto` on the inner `motion.div` (line 529)**
   - What we know: The inner flex container has `min-h-0 overflow-y-auto` as Tailwind classes.
   - What's unclear: Whether the `overflow-y-auto` on the inner container should also be removed.
   - Recommendation: Remove `overflow-y-auto` from that inner container too once the outer container is confirmed non-scrolling. Test both.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `frontend/src/features/game/components/GameScreen.tsx` — full source
- Direct codebase read: `frontend/src/features/game/gameReducer.ts` — full source
- Direct codebase read: `frontend/src/features/game/hooks/useGameState.ts` — full source
- Direct codebase read: `frontend/src/features/game/components/AnswerGrid.tsx` — full source
- Direct codebase read: `frontend/src/features/game/components/GameTimer.tsx` — full source
- Direct codebase read: `frontend/src/types/game.ts` — full source
- Direct codebase read: `frontend/package.json` — dependency versions
- Direct codebase read: `frontend/src/index.css` — focus ring classes

### Secondary (MEDIUM confidence)
None needed — all findings are from direct source code inspection.

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions read from package.json directly
- Architecture: HIGH — all patterns derived from reading actual source files
- Pitfalls: HIGH — all pitfalls identified from reading actual code paths
- Layout fit analysis: MEDIUM — vertical pixel estimates are approximations; actual test on device needed

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable UI codebase; no fast-moving dependencies)
