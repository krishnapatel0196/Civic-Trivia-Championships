# Phase 55: XP History Panel - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an XP History tab to the profile page where Connected players can review their past game sessions — date, collection, score, and XP earned. The panel is only visible to Connected players. Non-Connected players see no tab UI. Inform/anonymous players are unaffected.

</domain>

<decisions>
## Implementation Decisions

### Panel placement & layout
- Profile page gains a two-tab layout: **"Overview"** (existing content) and **"XP History"** (new)
- Tabs are persistent — clicking History replaces the main content area with the history list
- Non-Connected players see no tab UI at all — profile page displays as it does today (Overview content only, no tab chrome)
- Section label within the History tab: **"XP History"**
- Each history entry displays as a **simple list row** (not cards)

### Entry content & detail
- Row columns: **date | collection name | score | correct answers | +XP badge**
- Date format: relative for entries within the last 7 days (e.g., "2 days ago"), absolute date for older entries (e.g., "Mar 6")
- XP amount displayed as a **badge/chip** styled consistently with how XpReveal shows it on the results screen
- Duplicate games (`is_duplicate: true`) get a **neutral inline indicator** (e.g., "Already counted") explaining why XP may appear lower

### Pagination & loading
- **Numbered pages** — classic pagination with page controls
- **20 entries per page** on initial and subsequent loads
- **Total count** displayed at the top of the history tab (e.g., "47 games played") before the list

### Data source
- History fetched from the **Empowered Accounts XP API** — not CTC's local game session records
- Backend endpoint required to proxy/aggregate XP transaction history for the authenticated user

### Empty state
- Connected player with no history: friendly message + CTA — e.g., "No games yet — play your first game to start earning XP!" with a link/button to play
- No dark patterns — the CTA is present but not pushy

### Claude's Discretion
- Error state when XP API call fails — use judgment consistent with other API error states in the app
- Loading skeleton design while history is fetching
- Exact tab styling, spacing, and pagination control design

</decisions>

<specifics>
## Specific Ideas

- The "+XP" badge should visually echo the XpReveal component introduced in Phase 54 — reuse if feasible
- "Already counted" duplicate indicator should be subtle/neutral — no negative framing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 55-xp-history-panel*
*Context gathered: 2026-03-08*
