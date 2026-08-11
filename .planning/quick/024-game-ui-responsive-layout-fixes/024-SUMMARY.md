# Quick Task 024 — Game UI Responsive Layout Fixes

## Summary

Fixed game screen layout so all content fits within the viewport on every screen size without scrolling, and fixed the play button spacing on mobile.

## Problem

A user on a laptop had to scroll down to see the answer choices, losing sight of the timer. The dashboard play button also lacked bottom spacing on mobile.

## Root Causes

1. `min-h-screen` on inner game container — allowed content to grow unbounded beyond viewport
2. `mb-[120px]` HUD bottom margin — 120px of wasted space between score/timer and question
3. `justify-center` on question+answers motion div — caused question to visibly jump when answers faded in after the 1-second preview
4. Dashboard play button image (`h-52`) overflowing its container (`h-16`) with no bottom margin, pushing into the collection picker on mobile

## Changes

| File | Change |
|------|--------|
| `frontend/src/features/game/components/GameScreen.tsx` | Constrained to `h-dvh`, HUD margin slashed, `justify-center` → `justify-start pt-12/pt-16`, answer padding tightened |
| `frontend/src/features/game/components/QuestionCard.tsx` | Question text `text-4xl` → `text-2xl/text-3xl` on desktop |
| `frontend/src/features/game/components/AnswerGrid.tsx` | Grid gap and button padding reduced (touch targets preserved at 48px min) |
| `frontend/src/pages/Dashboard.tsx` | Added `mb-16 sm:mb-0` to play button container for mobile spacing |

## Commits

- `64d0c25` feat(quick-024): viewport-constrained game layout — all content fits without scrolling
- `d5e1a7b` fix(quick-024): stop question jumping when answers fade in
- `18981a1` fix(quick-024): more vertical breathing room on desktop; play button mobile spacing
