# Phase 54: XP Game UI (Start + End Screen) - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add XP/level display to the game start screen and XP award reveal to the end screen for Connected players. Non-Connected players see a subtle link prompt. Creating or modifying the XP award logic is Phase 53 (complete).

</domain>

<decisions>
## Implementation Decisions

### Start screen XP panel
- Separate row below the existing top bar (not integrated into the bar itself)
- Shows: level number (e.g. "Level 7"), current XP / XP needed (e.g. "1,240 / 2,000 XP"), and a progress bar
- Level display is number only — no level name
- Only visible to Connected players; non-connected players see the link prompt instead

### End screen XP reveal
- `+{amount} XP` appears instantly with a brief pop/flash animation (scale + fade)
- Positioned alongside the score — equal visual weight, not above or below
- Shows updated progress bar in addition to the award number (post-award position in current level)
- Duplicate game (`is_duplicate: true`): XP area is shown but greyed out — no animation, no award number

### Level-up animation
- Full-screen overlay when a level-up occurs
- Shows new level number only (e.g. "Level 8") — no transition arrow
- Auto-dismisses after 2 seconds OR tap to dismiss, whichever comes first
- Visual style: Claude's discretion — fits existing design system

### Non-Connected prompt
- Start screen: subtle small text below the Play button — "Link account to earn XP"
- End screen: same subtle prompt — consistent reminder on both screens
- No ghost XP preview of what they would have earned
- Tapping the prompt goes directly to the Empowered login/connection flow

### Claude's Discretion
- Level-up overlay visual style (confetti vs clean vs burst effect)
- Exact progress bar visual design (color, height, rounded corners)
- Exact placement/sizing of XP strip on start screen
- Loading state while XP data is fetched

</decisions>

<specifics>
## Specific Ideas

- No specific visual references provided — open to Claude's judgment on styling
- The non-connected prompt should feel low-pressure: no guilt, no aggressive CTA — consistent with the project's "no dark patterns" principle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 54-xp-game-ui*
*Context gathered: 2026-03-05*
