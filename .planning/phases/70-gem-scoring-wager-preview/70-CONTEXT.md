# Phase 70: Gem Scoring & Wager Preview - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Change the gem-earning rule from accuracy-based (≥6/8 correct) to score-based (final score ≥1,000), and add a live gem indicator on the wager screen so players can see the gem outcome in real time. The 2-gem perfect-score rule (8/8 correct) is unchanged. Results screen communicates the updated rule via tooltip and 0-gem encouragement copy.

</domain>

<decisions>
## Implementation Decisions

### Gem indicator — placement and states
- Claude decides the exact placement on the wager screen
- Two indicator elements:
  1. A gem visual reference **above the wager slider** that lights up when threshold is met
  2. **"+1 Gem" inline with the XP display** — both rewards previewed together
- Active/inactive state: **color fill change only** — gem fills yellow when threshold met, outline-only (dim) when not
- Transition: **Framer Motion** smooth color/opacity transition (consistent with existing codebase patterns)

### Wager screen — live projected scores
- Both scores update **live as the player drags the slider**:
  - "If correct: [score]" and "If wrong: [score]" displayed below the slider
- Gem indicator reflects the "if correct" projected score in real time

### Wager screen — edge case: player already has ≥1000 pre-wager
- When currentScore ≥ 1000, player is already on track for a gem if they answer correctly
- If they drag the slider into "risky" territory where `currentScore - wager < 1000` (a wrong answer would drop them below threshold), show a **score-if-wrong warning below the slider**
- The if-correct / if-wrong live score display covers this naturally

### Wager screen — tooltip on score
- Score element on wager screen has a **hover/tap tooltip**: "Score 1,000+ to earn a gem. Perfect score earns 2 gems."

### Results screen — gem messaging
- **Tooltip on score** (same copy): "Score 1,000+ to earn a gem. Perfect score earns 2 gems."
- **0 gems earned**: Show "Reach 1,000 points to earn a gem"
- **1 gem earned** (score ≥1000, not perfect): Just show the gem count — no special copy
- **2 gems earned** (perfect 8/8): Claude decides treatment (existing perfect-score celebration likely sufficient)

### Backend scoring — calculateProgression()
- Update gem logic in `calculateProgression()`:
  - 2 gems if perfect (8/8 correct) — unchanged
  - 1 gem if finalScore ≥ 1000 — new rule (replaces accuracy-based rule)
  - 0 gems otherwise
- Both rules stay in `calculateProgression()` — no structural change
- Old accuracy-based rule (6/8 or 7/8 = 1 gem) **removed entirely** — no dead code
- Threshold constant (1000): Claude decides whether to extract as named constant
- Frontend replicates the threshold logic locally for the live wager preview (backend remains authoritative for final calculation)

### Claude's Discretion
- Exact placement of gem indicator within wager screen layout
- Whether GEM_SCORE_THRESHOLD is a named constant or inline value
- 2-gem results screen treatment (existing celebration likely fine)
- Tooltip component/implementation approach

</decisions>

<specifics>
## Specific Ideas

- "+1 Gem" label should appear beside the XP display — mirrors how XP reward is shown, keeps both reward previews together
- The gem indicator above the slider + the inline "+1 Gem" beside XP are two separate elements working together
- Live if-correct / if-wrong score display is the primary mechanism for communicating risk when ≥1000 pre-wager
- Tooltip pattern should be consistent between wager screen and results screen

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 70-gem-scoring-wager-preview*
*Context gathered: 2026-03-19*
