# Phase 30: Admin Integration & Tech Debt - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate flag counts into the existing question explorer for contextual visibility during question management, fix 320 broken Learn More links from legacy CMS migration, and add production admin email configuration. No new admin pages — this wires existing data into existing UI and repairs tech debt.

</domain>

<decisions>
## Implementation Decisions

### Flag count display
- New dedicated "Flags" column in question explorer table (not a badge on existing column)
- Color-coded severity: red badge for >5 flags, orange for >2, gray for low — consistent with Phase 29 flag review styling
- Column is sortable (clickable header) and filterable ("Flagged only" or count threshold)
- In question detail panel: flag count badge + "View Flags" link in top metadata area (near collection, difficulty, quality score)

### Link repair strategy
- AI-assisted bulk discovery: script uses question text + answer to find relevant official source URLs
- Admin reviews batch results before committing
- URLs validated (HTTP 200 check) before saving — no new broken links
- Questions with no valid source: set source URL to null (Learn More button won't appear)
- Reusable admin tool, not one-time script — can scan for and fix broken links as content grows

### Cross-link navigation
- "View Flags" in question detail navigates same tab to /admin/flags?questionId=X (filtered to that question)
- Bidirectional: flag review also shows "Edit in Explorer" link per question
- "Edit in Explorer" deep links to /admin/questions?id=X with detail panel already open
- When flag review is filtered to single question: banner/chip showing "Showing flags for Question #123" with X to clear filter and see all

### Claude's Discretion
- ADMIN_EMAIL env var implementation details
- Exact filter UI controls for flag count threshold
- Link repair script internals (AI provider, batch size, retry logic)
- How to handle URL validation edge cases (redirects, slow responses)

</decisions>

<specifics>
## Specific Ideas

- Flag count color-coding should match the red/orange/gray severity scheme already used in Phase 29's flag review queue
- Cross-linking should feel seamless — admin bounces between explorer and flags without losing context
- Link repair tool should be reusable for future content additions, not just a migration script

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 30-admin-integration-tech-debt*
*Context gathered: 2026-02-22*
