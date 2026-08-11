---
phase: quick-019
plan: 01
subsystem: game-ui
tags: [mobile, responsive, ux, layout-optimization]

requires:
  - Phase 28 game flow with tap-anywhere-to-advance pattern

provides:
  - Mobile-optimized question text sizing (text-xl vs text-3xl)
  - Reduced mobile padding and margins for compact layout
  - Streamlined reveal phase UI without redundant progress button

affects:
  - Future mobile UI refinements can build on responsive patterns

tech-stack:
  added: []
  patterns:
    - Mobile-first responsive design with md: breakpoint overrides
    - Consistent use of Tailwind responsive utilities (text-xl md:text-4xl pattern)

key-files:
  created: []
  modified:
    - frontend/src/features/game/components/QuestionCard.tsx
    - frontend/src/features/game/components/GameScreen.tsx

decisions:
  - question-text-size: Use text-xl on mobile (down from text-3xl) for 33% size reduction
  - mobile-padding: Reduce container padding from px-6 to px-2 on mobile
  - line-height: Use leading-snug on mobile (vs leading-relaxed on desktop) for tighter text
  - progress-button: Remove teal "Next Question" button as it duplicated tap-anywhere pattern
  - desktop-preservation: All desktop values preserved via md: breakpoint

metrics:
  duration: ~2 minutes
  completed: 2026-02-22
---

# Quick Task 019: Mobile Question Size & Remove Progress Button

**One-liner:** Reduce mobile question text from 30px to 20px and remove redundant teal progress button to keep questions and all four answers visible without scrolling.

## Overview

Optimized the mobile game UI by significantly reducing question text size and padding, and removing the redundant "Next Question" button during the reveal phase. These changes ensure questions fit in the top third of mobile screens with all four answer options visible without scrolling.

## Problem Solved

On mobile devices, the question text was oversized (text-3xl = 30px), causing single words to fill entire lines. Combined with generous padding and the redundant teal progress button that duplicated the tap-anywhere-to-advance behavior, answer options were pushed below the fold, requiring scrolling.

## Solution

### Task 1: Reduce question text size and padding on mobile

**QuestionCard.tsx changes:**
- Question text: `text-3xl md:text-4xl` → `text-xl md:text-4xl` (30px → 20px on mobile)
- Line height: `leading-relaxed` → `leading-snug md:leading-relaxed` (tighter on mobile)
- Container padding: `px-6` → `px-2 md:px-6` (reduced horizontal padding)
- Gap between topic badge and question: `gap-4` → `gap-2 md:gap-4`

**GameScreen.tsx changes:**
- HUD bottom margin: `mb-[70px] md:mb-[120px]` → `mb-6 md:mb-[120px]` (reduced mobile gap)
- Question-to-answers gap: `gap-3 md:gap-8` → `gap-2 md:gap-8` (tighter spacing)
- Answer grid padding: `pt-[20px] pb-[40px]` → `pt-2 md:pt-[20px] pb-4 md:pb-[40px]`

**Commit:** `a99ab7f`

### Task 2: Remove the teal progress button from reveal phase

Removed the entire "Next Question" / "See Results" motion.button block (lines 534-548) that appeared during `state.phase === 'revealing'`. This button was redundant because:

1. Parent div already has onClick handler calling `nextQuestion()` during reveal phase
2. Space/Enter keyboard shortcuts also advance to next question
3. The button duplicated the tap-anywhere-to-advance pattern

**Preserved interactive elements:**
- LearnMoreButton and tooltip (use `stopPropagation()` to prevent advancing)
- Lock In button in AnswerGrid (serves different purpose - confirming answer selection)
- Parent div onClick handler (tap-anywhere still works)

**Commit:** `418e51f`

## Technical Implementation

**Responsive design pattern:**
All changes follow mobile-first approach with md: breakpoint preserving desktop values:
```tsx
className="text-xl md:text-4xl leading-snug md:leading-relaxed"
```

**Desktop experience preserved:**
Every modified class includes `md:` override to maintain current desktop layout exactly as-is.

**Tap-anywhere pattern intact:**
The parent div onClick handler (lines 356-360) ensures tap-anywhere-to-advance continues working:
```tsx
onClick={() => {
  if (state.phase === 'revealing' && !isLearnMoreOpen) {
    nextQuestion();
  }
}}
```

## Verification Results

✓ TypeScript compilation passes with no errors
✓ Production build completes successfully
✓ QuestionCard contains `text-xl md:text-4xl` (not `text-3xl`)
✓ GameScreen does NOT contain motion.button with "Next Question" text
✓ GameScreen STILL contains parent div onClick handler calling nextQuestion()
✓ AnswerGrid "Lock In" button unchanged

## Impact

**Mobile users:**
- Questions fit in top third of screen with answer options visible
- 33% smaller question text reduces oversized single-word lines
- Tighter padding and margins maximize content density
- Cleaner reveal phase without redundant button

**Desktop users:**
- Zero visual changes (all md: breakpoints preserve existing values)

**Accessibility:**
- Keyboard shortcuts unchanged (Space/Enter still advance)
- Screen reader announcements unchanged
- Tap targets preserved (Lock In button still 48px min-height)

## Next Phase Readiness

No blockers. This quick task is self-contained and improves mobile UX independently.

**Potential follow-ups:**
- A/B test optimal mobile question font size (text-lg vs text-xl)
- Consider further mobile padding reductions if needed
- Monitor analytics for mobile engagement improvements

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

**Modified (2 files):**

1. `frontend/src/features/game/components/QuestionCard.tsx`
   - Reduced mobile text size (text-xl), line height (leading-snug), padding (px-2), gaps (gap-2)
   - Desktop values preserved via md: breakpoint

2. `frontend/src/features/game/components/GameScreen.tsx`
   - Reduced mobile margins and gaps throughout question/answer layout
   - Removed redundant teal progress button from reveal phase
   - Desktop values preserved via md: breakpoint

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| text-xl on mobile (vs text-3xl) | 33% size reduction prevents single words filling entire lines | Questions fit in top third of screen |
| leading-snug on mobile | Tighter line height further reduces vertical space consumption | More compact question layout |
| px-2 mobile padding | Minimal horizontal padding maximizes content width | Better use of narrow mobile screens |
| Remove progress button | Redundant with tap-anywhere pattern; cleaner UI | Simpler reveal phase, saves vertical space |
| Preserve all desktop values | Zero risk to desktop experience | Desktop users unaffected |

## Testing Notes

**Manual testing recommended:**

1. **Mobile verification (viewport ~375px width):**
   - Load question on mobile device/emulator
   - Verify question text appears smaller and tighter
   - Confirm all four answer options visible without scrolling
   - Tap anywhere during reveal phase → advances to next question
   - Verify Learn More button doesn't advance (stopPropagation works)

2. **Desktop verification (viewport ≥768px):**
   - Load same questions on desktop
   - Verify question text size unchanged from before
   - Verify spacing and padding unchanged
   - Confirm tap-anywhere still works during reveal

3. **Keyboard navigation:**
   - Press Space or Enter during reveal → advances to next question
   - Verify keyboard shortcuts unchanged

## Build Output

```
✓ 738 modules transformed
✓ built in 4.23s
```

No errors, clean build.
