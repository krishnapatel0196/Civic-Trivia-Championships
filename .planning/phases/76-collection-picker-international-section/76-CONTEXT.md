# Phase 76: Collection Picker International Section - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an "International" section to the collection picker UI, displayed alongside the existing Federal/State/Local sections. Each International collection card shows a freshness indicator derived from the most recent active question's `created_at` timestamp. The section hides entirely when no International collections are active. The existing search/filter (Phase 74) must correctly match International collections by name.

No backend changes beyond what's needed to surface the freshness timestamp on the collections API response.

</domain>

<decisions>
## Implementation Decisions

### Section placement
- International section appears **bottom** — after Federal
- Final order: Local → State → Federal → International
- Rationale: natural geographic escalation; keeps familiar domestic order intact

### Freshness indicator format
- While same-day (< 24h): relative time — "Updated 3h ago", "Updated 45m ago"
- After 24h: calendar date — "Updated Apr 9"
- Stale content (pipeline failed for days): show the honest age — no warning indicator, no special styling
  - Admin panel (Phase 80) handles stale alerts; the player-facing card just shows the timestamp
- Position on card: below the description text, small and muted — same visual weight as the admin question count row

### Card visual treatment
- Same card design as domestic collections — no globe icon, no "LIVE" badge, no additional visual differentiation
- The freshness indicator alone distinguishes International cards; the section header does the rest

### Section header style
- Same Bebas Neue small-caps treatment as "LOCAL", "STATE", "FEDERAL"
- Color: #9A8878, same horizontal rule
- Label text: "INTERNATIONAL" — no subtitle, no icon

### Claude's Discretion
- Exact time-ago formatting library or implementation (date-fns, manual, etc.)
- How the backend surfaces the freshness timestamp (new field on CollectionSummary, separate endpoint, etc.)
- Handling the edge case where an International collection somehow has zero active questions (shouldn't occur per SC #3, but safe fallback)

</decisions>

<specifics>
## Specific Ideas

- The freshness indicator is secondary info — not the headline. Style it like the admin question count (small, muted, below description).
- No design changes to the card itself — consistency with domestic cards was the explicit preference.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 76-collection-picker-international-section*
*Context gathered: 2026-04-09*
