# Phase 67: Leaderboard - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

A ranked leaderboard page showing top CTC players by XP, accessible without authentication. Data sourced from the accounts public profile API. Logged-in users see their own rank highlighted; logged-out users see a sign-in prompt. Creating posts, social features, and per-collection leaderboards are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Page placement & entry
- Leaderboard accessible from two entry points: main nav link AND post-game results screen
- URL: `/leaderboard`
- Page has tab structure (All Time / This Week) — not a single flat view

### Tab structure
- **All Time** tab: ranked by total XP (all-time cumulative)
- **This Week** tab: ranked by XP earned in the rolling last 7 days (not calendar week)
- No other tabs in this phase

### Empty state
- If no data is available: motivational CTA — "No players yet — be the first!" with a Play button

### Row layout
- **Top 3**: Visual podium treatment (1st/2nd/3rd displayed prominently above the list)
- **Positions 4–25**: Standard ranked list below the podium
- Each entry shows: rank number, tier badge icon (colored bronze/silver/gold), colored initial avatar circle (from first letter of username), username, level, total XP
- Tier displayed as a small icon/badge colored by tier — not a text chip
- Username truncation: Claude's discretion, match existing app patterns

### Your rank — when IN the top 25
- Logged-in user's row gets an accent color background tint (app brand color at low opacity)

### Your rank — when NOT in the top 25
- Sticky "you" row pinned after the ranked list with a separator
- Shows logged-in user's rank, level, and XP even if outside top 25
- Duolingo-style — player always knows where they stand

### Logged-out behavior
- Leaderboard is fully visible to unauthenticated users (no auth wall)
- Where the sticky "you" row would appear: show "Sign in to see your rank" prompt instead

### Data scope & refresh
- Show top 25 players per tab
- ~5 minute cache (TTL) — not real-time fetch on every page load
- Researcher should verify whether the accounts API supports time-windowed XP (required for "This Week" tab) and per-user global rank (required for sticky "you" row)

### Claude's Discretion
- Username truncation approach (match existing app patterns)
- Exact podium visual design (dimensions, spacing, animation if any)
- Loading state while fetching leaderboard data
- Error state if the accounts API is unavailable
- Caching implementation details (server-side vs edge vs client-side SWR)

</decisions>

<specifics>
## Specific Ideas

- "This Week" tab should use rolling 7 days (last 168 hours), not a calendar week reset — simpler to implement, always feels live
- Sticky "you" row should show the gap to the next player above — motivating to see you're only X XP away from moving up
- Podium top-3 should have gold/silver/bronze visual differentiation — the game-show drama moment of the leaderboard

</specifics>

<deferred>
## Deferred Ideas

- Per-collection leaderboard tab ("By Collection") — future phase
- Weekly leaderboard with calendar-week reset and scheduled reset logic — deferred in favor of rolling 7 days
- Avatar/profile photo support — depends on accounts API exposing image URLs; not in this phase

</deferred>

---

*Phase: 67-leaderboard*
*Context gathered: 2026-03-16*
