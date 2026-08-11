# Phase 70: Gem Scoring & Wager Preview - Research

**Researched:** 2026-03-19
**Domain:** React/TypeScript game UI — backend scoring logic + frontend wager/results screen enhancements
**Confidence:** HIGH

## Summary

Phase 70 has two distinct parts: (1) update the backend `calculateProgression()` function to award gems based on final score rather than answer accuracy, and (2) add a live gem indicator to the wager screen so players see their projected gem outcome in real time.

The backend change is surgical — `calculateProgression()` currently takes `(correctAnswers, totalQuestions)` and does not receive `finalScore`. It must accept a new `finalScore` parameter and swap the accuracy-based 1-gem rule for a score-threshold rule. The call site in `game.ts` already has `results.totalScore` available at the point `calculateProgression` is called, so passing the new param requires no session restructuring.

The frontend changes are additive. The wager screen is a clean, standalone React component with existing `ifCorrect`/`ifWrong` computed values already derived from live slider state. The gem indicator is a new UI element that reads those live values. The results screen already renders gems via `GemIcon` and the `gemsEarned` field from `result.progression` — only the messaging copy and a tooltip need to change. Framer Motion 12 is installed and used throughout; color-fill transitions are the correct animation primitive. The existing `FlagButton` tooltip pattern (CSS hover, no library) and the `LearnMoreTooltip` (Framer Motion `AnimatePresence`) both demonstrate approaches — the score tooltip should follow the Framer Motion pattern as it needs to work on touch devices (hover-only CSS doesn't work on mobile).

**Primary recommendation:** Make the backend change first (add `finalScore` param, swap rule), then build the wager gem indicator as a self-contained sub-component inside `WagerScreen.tsx`, then update results screen messaging.

## Standard Stack

All libraries are already installed — no new dependencies required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.34.0 | Animation for gem indicator color transition | Already used in WagerScreen and ResultsScreen |
| React | ^18.2.0 | Component framework | Existing codebase |
| TypeScript | (tsconfig) | Type safety | Existing codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @headlessui/react | ^2.2.9 | Accessible UI primitives | Available for tooltip if needed — but see note below |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline Framer Motion color animate | CSS `transition` on style prop | CSS transition works fine for color; use it for the gem fill — simpler than motion value color animation |
| Custom hover tooltip | Headless UI `Popover` | Headless UI Popover is accessible and handles touch, but adds complexity; a simple inline state toggle is fine given existing pattern |

**Installation:** No new packages needed.

## Architecture Patterns

### Backend: calculateProgression() signature change

The current signature:
```typescript
// backend/src/services/progressionService.ts (current)
export function calculateProgression(
  correctAnswers: number,
  totalQuestions: number
): { xpEarned: number; gemsEarned: number }
```

The required change: add `finalScore` as a third parameter. The call site in `game.ts` line 397 already has `results.totalScore` in scope — it simply needs passing.

Call site (game.ts line ~397):
```typescript
const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions);
// becomes:
const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions, results.totalScore);
```

### Backend: New gem logic

```typescript
// Source: codebase inspection of progressionService.ts
export function calculateProgression(
  correctAnswers: number,
  totalQuestions: number,
  finalScore: number
): { xpEarned: number; gemsEarned: number } {
  const xpEarned = 50 + correctAnswers;

  const GEM_SCORE_THRESHOLD = 1000; // Named constant — makes threshold testable and findable

  const isPerfect = correctAnswers === totalQuestions;
  const gemsEarned = isPerfect ? 2 : finalScore >= GEM_SCORE_THRESHOLD ? 1 : 0;

  return { xpEarned, gemsEarned };
}
```

Note: `GEM_SCORE_THRESHOLD` as a named constant is recommended — it makes the value greppable and eliminates magic numbers in both the function body and any future callers. Export it so the frontend can import it or replicate it with confidence.

### Frontend: WagerScreen gem indicator

The wager screen already computes:
```typescript
const ifCorrect = currentScore + wagerAmount; // live, updates on drag
const ifWrong   = currentScore - wagerAmount; // live, updates on drag
```

The gem indicator reads `ifCorrect >= GEM_SCORE_THRESHOLD` (threshold replicated as a frontend constant) and uses a CSS color transition for the fill state change. The indicator has two elements:

1. **Gem visual above the slider** — an `<img src="/images/Blue_Gem.png">` (or inline SVG using `GemIcon`) that switches between full-color and desaturated/dim based on `ifCorrect >= threshold`
2. **"+1 Gem" inline text** — placed alongside the XP display (which only appears post-game, so on the wager screen this is a standalone reward preview row)

The wager screen does NOT currently have an XP display — the "+1 Gem" inline placement means adding a small reward-preview section to the wager card.

**Recommended layout for gem indicator area (above slider, inside wager card):**

```tsx
// Source: codebase inspection of WagerScreen.tsx layout
const GEM_SCORE_THRESHOLD = 1000;
const gemThresholdMet = ifCorrect >= GEM_SCORE_THRESHOLD;

// Above the slider input, inside the wager card div:
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '16px',
  transition: 'opacity 0.25s',
  opacity: gemThresholdMet ? 1 : 0.35,
}}>
  <img
    src="/images/Blue_Gem.png"
    alt="gem"
    style={{
      width: '24px',
      height: '24px',
      filter: gemThresholdMet ? 'none' : 'grayscale(1)',
      transition: 'filter 0.25s',
    }}
  />
  <span style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '18px',
    letterSpacing: '0.1em',
    color: gemThresholdMet ? C.gold : C.mutedFg,
    transition: 'color 0.25s',
  }}>
    +1 GEM IF CORRECT
  </span>
</div>
```

The CSS `transition` approach is correct here — the context decision says "Framer Motion smooth color/opacity transition" but CSS transitions on `style` props are idiomatic in this codebase for simple color switches (see WagerScreen.tsx button hover). Use `motion.div` with `animate` prop if a spring/ease curve is desired, but CSS transition is simpler and consistent.

### Frontend: Tooltip on score display

Both the wager screen score and the results screen score need a tap/hover tooltip: "Score 1,000+ to earn a gem. Perfect score earns 2 gems."

**Existing patterns:**

1. `FlagButton.tsx` uses a CSS hover tooltip (`group-hover:opacity-100`) — hover-only, not accessible on touch
2. `LearnMoreTooltip.tsx` uses Framer Motion `AnimatePresence` with auto-dismiss and tap-to-dismiss — handles touch, accessible

Use the `LearnMoreTooltip` pattern (state-controlled, Framer Motion) for the score tooltip since:
- Players are on mobile (touch devices need tap, not hover)
- The wager and results screens are game-critical paths
- Consistency with the existing animated tooltip component

Implementation approach: inline tooltip state in `WagerScreen` and `ResultsScreen` rather than extracting `LearnMoreTooltip` (which has game-specific auto-dismiss and Read More logic). A simple `ScoreTooltip` sub-component or inline state toggle is sufficient.

```tsx
// Pattern: inline tooltip with state toggle
const [showScoreTooltip, setShowScoreTooltip] = useState(false);

// Wrap the score display:
<div style={{ position: 'relative', display: 'inline-block' }}>
  <div
    onClick={() => setShowScoreTooltip(v => !v)}
    onMouseEnter={() => setShowScoreTooltip(true)}
    onMouseLeave={() => setShowScoreTooltip(false)}
    style={{ cursor: 'help' }}
    aria-describedby="score-tooltip"
  >
    {/* existing score display */}
  </div>
  <AnimatePresence>
    {showScoreTooltip && (
      <motion.div
        id="score-tooltip"
        role="tooltip"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '8px 12px',
          background: C.ink,
          color: C.paper,
          fontSize: '13px',
          whiteSpace: 'nowrap',
          zIndex: 10,
          fontFamily: "'Lora', Georgia, serif",
        }}
      >
        Score 1,000+ to earn a gem. Perfect score earns 2 gems.
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

### Frontend: Results screen gem messaging

The results screen already conditionally renders gems:
```tsx
// ResultsScreen.tsx line ~330 (current)
{result.progression.gemsEarned > 0 && (
  // renders gem icons + "+N GEM(S)" text
)}
```

New behavior required:
- **0 gems earned**: Add a message below the XP block — "Reach 1,000 points to earn a gem"
- **1 gem (score ≥1000, not perfect)**: Existing render is sufficient — no special copy needed
- **2 gems (perfect 8/8)**: Existing `isPerfectGame` badge + confetti is sufficient — no change

The 0-gem message should only show for authenticated users (inside the `result.progression` block, not the anonymous `Link account to earn XP` path). Current structure: the gems block is inside the `result.progression` conditional. Add a 0-gem encouragement message as an `else` within the gemsEarned block.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color fill animation | Custom JS color interpolation | CSS `transition` on inline style | Already used in WagerScreen button; framer motion is overkill for simple on/off color toggle |
| Tooltip positioning | Custom absolute-position math | `position: absolute; left: 50%; transform: translateX(-50%)` | Sufficient for centered tooltip on score elements |
| Touch-accessible tooltip | Custom pointer event handling | `onClick` toggle + `onMouseEnter/Leave` | Covers both hover (desktop) and tap (mobile) |
| Gem threshold duplication | Shared constant in shared file | Replicate `GEM_SCORE_THRESHOLD = 1000` in frontend | Frontend is display-only preview; backend stays authoritative. A simple frontend constant is fine |

**Key insight:** The threshold logic is intentionally replicated on the frontend for live preview — it does NOT need to be fetched from the backend. The backend remains the authoritative source for the actual gem award. The spec explicitly says "Frontend replicates the threshold logic locally."

## Common Pitfalls

### Pitfall 1: Off-by-one on "perfect game" detection
**What goes wrong:** Changing the gem logic could accidentally break the 2-gem perfect-game rule.
**Why it happens:** The `isPerfect` check (`correctAnswers === totalQuestions`) must be evaluated BEFORE the score threshold check. If the score check runs first and `finalScore >= 1000` for a perfect game, it short-circuits to 1 gem.
**How to avoid:** Evaluate `isPerfect` first: `isPerfect ? 2 : finalScore >= threshold ? 1 : 0`.
**Warning signs:** Test: perfect game (8/8) with score above 1000 must still yield 2 gems, not 1.

### Pitfall 2: `calculateProgression` call site not updated
**What goes wrong:** Adding `finalScore` as a required param but not updating the single call site in `game.ts` causes a TypeScript compile error.
**Why it happens:** There is exactly one call site (game.ts line ~397). It must be updated to pass `results.totalScore`.
**How to avoid:** Update both the function signature and the call site in the same task. TypeScript will catch it if missed.
**Warning signs:** `tsc` compilation error: "Expected 3 arguments, but got 2."

### Pitfall 3: Wager gem indicator triggers on "if wrong" score, not "if correct"
**What goes wrong:** The indicator lights up based on `currentScore` or `ifWrong` instead of `ifCorrect`.
**Why it happens:** Three score values exist on the wager screen: `currentScore`, `ifCorrect`, `ifWrong`. The spec requires the indicator to reflect `ifCorrect`.
**How to avoid:** `const gemThresholdMet = ifCorrect >= GEM_SCORE_THRESHOLD` — use `ifCorrect`, not `currentScore`.
**Warning signs:** Indicator is always lit when current score ≥ 1000 (ignoring wager risk).

### Pitfall 4: Score tooltip causes layout shift
**What goes wrong:** Adding `position: relative` to the score container causes it to expand or shift surrounding elements.
**Why it happens:** `display: inline-block` with `position: relative` wrapping a large score number can affect the layout.
**How to avoid:** Wrap only the score text span (not the entire score section) in the tooltip trigger, or use `position: absolute` tooltip anchored to a small info icon placed inline with the score.
**Warning signs:** Score section has visible spacing change when tooltip is added.

### Pitfall 5: Results screen 0-gem message shown to anonymous users
**What goes wrong:** The "Reach 1,000 points to earn a gem" message shows to players who aren't logged in, alongside the "Link account to earn XP" prompt — creating confusing dual messaging.
**Why it happens:** The 0-gem message is added without checking the `result.progression` context.
**How to avoid:** Place the 0-gem message strictly inside the `result.progression` block (authenticated path), not in the anonymous fallback.
**Warning signs:** Message appears on the anonymous play path.

### Pitfall 6: `ifCorrect` display bug when score is 0
**What goes wrong:** When `currentScore` is 0 and `wagerAmount` is 0, `ifCorrect = 0`, which is always below threshold — gem indicator always dim.
**Why it happens:** No points scored (all wrong + no wager). This is correct behavior — not a bug — but needs confirmation.
**How to avoid:** No action needed; this is correct. A player with 0 points cannot hit 1000.
**Warning signs:** None — this is expected behavior.

## Code Examples

### calculateProgression (updated)
```typescript
// Source: codebase inspection of backend/src/services/progressionService.ts
export const GEM_SCORE_THRESHOLD = 1000;

export function calculateProgression(
  correctAnswers: number,
  totalQuestions: number,
  finalScore: number
): { xpEarned: number; gemsEarned: number } {
  const xpEarned = 50 + correctAnswers;
  const isPerfect = correctAnswers === totalQuestions;
  const gemsEarned = isPerfect ? 2 : finalScore >= GEM_SCORE_THRESHOLD ? 1 : 0;
  return { xpEarned, gemsEarned };
}
```

### Call site update (game.ts)
```typescript
// Source: codebase inspection of backend/src/routes/game.ts line ~397
// BEFORE:
const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions);
// AFTER:
const { gemsEarned } = calculateProgression(results.totalCorrect, results.totalQuestions, results.totalScore);
```

`results.totalScore` is already available at this point — it comes from `sessionManager.getResults()` which returns a `GameSessionResult` with `totalScore: number`.

### Live gem threshold computation in WagerScreen
```typescript
// Source: codebase inspection of frontend/src/features/game/components/WagerScreen.tsx
// These already exist in the component:
const ifCorrect = currentScore + wagerAmount;
const ifWrong   = currentScore - wagerAmount;

// New constant (replicated from backend):
const GEM_SCORE_THRESHOLD = 1000;
const gemThresholdMet = ifCorrect >= GEM_SCORE_THRESHOLD;
```

### Gem image assets
```
/images/Blue_Gem.png  — confirmed in frontend/public/images/
/images/Red_Gem.png   — confirmed in frontend/public/images/ (not used here)
```

`GemIcon` (SVG) is the other option — it uses `currentColor`, so applying a yellow/gold color via the `style` prop gives the active state and a dim color (e.g., `C.mutedFg`) gives the inactive state.

### Framer Motion pattern (for gem indicator color transition)
```typescript
// Source: framer-motion ^12.34.0, confirmed installed
// WagerScreen currently uses motion.div only for entry animation.
// For the gem indicator, CSS transition is simpler and consistent
// with existing WagerScreen button hover pattern:
style={{
  color: gemThresholdMet ? C.gold : C.mutedFg,
  transition: 'color 0.25s, opacity 0.25s',
  opacity: gemThresholdMet ? 1 : 0.4,
}}
```

If a spring/bounce is desired on threshold-crossing (per the context decision of "Framer Motion smooth transition"), use `motion.div` with `animate={{ opacity: gemThresholdMet ? 1 : 0.35 }}` and `transition={{ duration: 0.25 }}` — this is functionally equivalent to CSS transition but uses Framer Motion.

### AnimatePresence tooltip (for score tooltip)
```typescript
// Source: codebase inspection of LearnMoreTooltip.tsx — existing pattern
import { motion, AnimatePresence } from 'framer-motion';

// Use AnimatePresence + motion.div for enter/exit
<AnimatePresence>
  {showTooltip && (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      role="tooltip"
      // ... positioning styles
    />
  )}
</AnimatePresence>
```

### Results screen 0-gem message placement
```tsx
// Source: codebase inspection of ResultsScreen.tsx lines ~327-351
// AFTER XpReveal and INSIDE the result.progression conditional block:
{result.progression.gemsEarned > 0 ? (
  <div>
    {/* existing gem icon + count rendering */}
  </div>
) : (
  <p style={{
    fontStyle: 'italic',
    fontSize: '13px',
    color: C.muted,
    margin: result.progression.xp?.confirmed ? '12px 0 0' : '0',
  }}>
    Reach 1,000 points to earn a gem
  </p>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Accuracy-based gems (≥6/8 = 1 gem) | Score-based gems (≥1000 = 1 gem) | Phase 70 | Players can earn gems with imperfect accuracy if they score high on wagers |
| No gem feedback during wager | Live gem indicator on wager screen | Phase 70 | Players can make informed wager decisions based on gem outcome |

**Deprecated/outdated after this phase:**
- `correctAnswers >= totalQuestions - 2` condition in `calculateProgression()`: remove entirely, no dead code retention

## Open Questions

1. **Should `GEM_SCORE_THRESHOLD` be exported from progressionService.ts for test use?**
   - What we know: There are no backend test files currently (`backend/src/**/*.test.ts` — none found)
   - What's unclear: Whether a future test suite would benefit from the export
   - Recommendation: Export it (`export const GEM_SCORE_THRESHOLD = 1000`) — costs nothing, enables future tests and frontend import

2. **Framer Motion animate vs CSS transition for gem indicator**
   - What we know: Context says "Framer Motion smooth color/opacity transition." WagerScreen currently only uses `motion.div` for page-entry animation; simple style transitions use CSS `transition` property on inline styles (see button hover).
   - What's unclear: Whether the context decision strictly requires `motion.div animate` or if CSS transition satisfies "Framer Motion consistent with existing patterns."
   - Recommendation: Use `motion.div` with `animate` prop for the gem indicator wrapper — this satisfies the context requirement and is consistent with ResultsScreen where `motion.div` is used extensively. CSS transition fallback is acceptable if the animator prefers it.

3. **`wagerAmount` can exceed new-score back below 1000 from a score above 1000**
   - What we know: Context explicitly handles this: "If correct: [score]" and "If wrong: [score]" covers it. Gem indicator reacts to `ifCorrect`.
   - What's unclear: Nothing — context is clear. No extra warning UI needed beyond what `ifCorrect`/`ifWrong` already shows.
   - Recommendation: No additional work needed; the live score display covers the edge case.

## Sources

### Primary (HIGH confidence)
- Codebase: `backend/src/services/progressionService.ts` — current `calculateProgression()` implementation and full signature
- Codebase: `backend/src/routes/game.ts` — call site at line ~397, `results.totalScore` availability confirmed
- Codebase: `backend/src/services/sessionService.ts` — `GameSessionResult.totalScore` field confirmed
- Codebase: `frontend/src/features/game/components/WagerScreen.tsx` — full component, `ifCorrect`/`ifWrong` computed values, existing layout
- Codebase: `frontend/src/features/game/components/ResultsScreen.tsx` — gem rendering block (lines ~314-366), `GemIcon` usage
- Codebase: `frontend/src/features/game/components/LearnMoreTooltip.tsx` — Framer Motion AnimatePresence tooltip pattern
- Codebase: `frontend/src/features/game/components/FlagButton.tsx` — CSS hover tooltip pattern
- Codebase: `frontend/src/components/icons/GemIcon.tsx` — SVG gem icon using `currentColor`
- Codebase: `frontend/public/images/` — `Blue_Gem.png` and `Red_Gem.png` confirmed present
- Codebase: `frontend/package.json` — framer-motion `^12.34.0`, React `^18.2.0`, @headlessui/react `^2.2.9`
- Codebase: `frontend/src/hooks/useTheme.ts` — `C.gold`, `C.mutedFg`, `C.gems` color tokens confirmed

### Secondary (MEDIUM confidence)
- None needed — all findings from direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries directly inspected in package.json
- Architecture: HIGH — call sites, data flow, and component structure inspected directly
- Pitfalls: HIGH — derived from direct code reading; edge cases verified against actual data flow

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable codebase; no fast-moving external dependencies)
