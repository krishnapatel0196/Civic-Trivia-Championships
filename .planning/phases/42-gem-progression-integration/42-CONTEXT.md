# Phase 42: Gem & Progression Integration - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire gem awards through the platform `award_gems` RPC, write persistent stats to `trivia.player_stats` for Connected users only, and remove the local `total_gems` column. Anonymous and Inform-tier play continues unaffected. No frontend changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### Error handling
- `award_gems` RPC failure → silent fail: retry a small number of times, then log and continue. Game submission succeeds regardless.
- `player_stats` write failure → log and continue. Never fail the game submission due to a stat write error.
- User-facing: display a subtle disconnect icon (lower-left corner) when platform calls fail. Player can keep playing "offline" — they just won't earn rewards until connectivity is restored.
- Icon asset: `frontend/public/images/noun-disconnect-6883726-03B9D2.svg` (teal, matches app palette)

### Game result API response
- Include `gems_earned` in the game completion response (exact shape at Claude's discretion).
- Reflect actual outcome: if the gem award failed after retries, response should include a message like "We had trouble recording your rewards — we'll resolve this when your connection improves." Do not report gems as earned if the RPC failed.
- Include updated player stats (games played, best score, etc.) in the completion response so the frontend doesn't need a separate fetch.

### Suspension detection
- Check `account_standing` at **both** game start and game submission via `GET /api/account/me` on the accounts API.
- At game start: record suspension status in the game session. Do not block play — suspended users may still play.
- At game submission: read suspension flag from session to decide whether to skip gem award and stat write. No second live API call needed.
- Suspended users complete the game normally but earn no gems and no stats are written.

### Stats update logic
- UPSERT: one row per user in `trivia.player_stats` with running aggregates. No per-game history rows.
- `best_score` = highest single-game point total (raw score, not accuracy %).
- Stats written only for sessions **started** while Connected. Mid-session tier upgrades do not retroactively enable stat writes.
- Schema should include these fields (design now, populate what's available in Phase 42):
  - `games_played` (running count)
  - `best_score` (highest single-game points)
  - `total_correct` / `total_questions` (running totals)
  - `current_streak` / `best_streak` (playing streak in days)
  - `lifetime_gems` (total gems earned via trivia, tracked locally for display)

### XP integration
- Correct answers in trivia should increment **platform XP** on `connected_profile` (not a trivia-local counter).
- The accounts guide shows `award_gems` but no explicit `award_xp` RPC — researcher must confirm what mechanism the accounts API exposes for awarding XP.
- Attribution tracking ("14% of your XP came from Civic Trivia") is expected to come from the platform's own transaction/history mechanism. Researcher should confirm whether this is already supported or needs to be requested.

### Claude's Discretion
- Exact retry count and backoff strategy for failed platform calls
- Shape of `gems_earned` in the API response
- Whether disconnect icon appears as a persistent indicator or a transient toast
- How `lifetime_gems` is reconciled if a gem award was logged as failed (don't count it)

</decisions>

<specifics>
## Specific Ideas

- "Subtle disconnect icon in the lower-left corner" — asset already in repo at `frontend/public/images/noun-disconnect-6883726-03B9D2.svg`
- Game should feel playable "offline" — backend failures are invisible to gameplay, only the rewards side is affected
- Eventually: question selection will favor questions the player has never gotten right (noted for future phase, not Phase 42)

</specifics>

<deferred>
## Deferred Ideas

- **Per-collection accuracy tracking** (e.g., "Los Angeles: 48% correct") — requires a separate per-user/per-collection or per-user/per-question table. Future phase.
- **Badge system** — "Perfect game" badges, "collection mastered" badges. Future phase.
- **Personalized question selection** — populate game with ≥50% questions the player has never answered correctly. Future phase.

</deferred>

---

*Phase: 42-gem-progression-integration*
*Context gathered: 2026-02-28*
