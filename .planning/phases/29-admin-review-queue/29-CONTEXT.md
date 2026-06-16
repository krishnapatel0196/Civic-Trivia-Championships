# Phase 29: Admin Review Queue - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated admin page for triaging flagged questions. Admins see aggregated player feedback sorted by flag count and can archive or dismiss flags. Uses existing admin UI patterns (TanStack Table, sidebar nav). Creating new flag types, editing questions inline, or analytics are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Queue layout & density
- Table rows using TanStack Table, consistent with existing admin UI
- Rich columns: flag count, question text (truncated), collection name, reason breakdown (colored chips like "Confusing x3"), last flagged date
- Dropped unique flaggers column — flag count is sufficient since only authenticated users can flag
- Server-side pagination (25 per page)
- Two tabs: Active (default) and Archived — active shows unresolved flags, archived shows resolved/archived questions
- Empty state: simple message — "No flagged questions — players haven't flagged anything yet" with subtle icon

### Feedback presentation
- Show username of who submitted each flag — useful for identifying patterns or bad-faith flaggers
- Summary section at top of detail view: aggregate counts like "5 flags: 3 confusing, 2 wrong answer"
- Below summary, individual flag entries with reasons, elaboration text, username, date
- Elaboration text truncated to ~100 chars with "Show more" for longer text
- Detail view shows full question context: question text, all answer choices, correct answer, and learning content

### Archive action & states
- Archive = status change (set question status to "archived") — excluded from game queries, reversible
- Two actions available: Archive (remove from gameplay) and Dismiss Flags (keep question active, clear flag count to zero)
- One-click archive with undo toast (~5 seconds) — no confirmation dialog
- Archived tab has Restore button per question to bring it back to active pool

### Navigation & filtering
- "Flag Review" link in admin sidebar nav, same level as existing pages
- No badge count on sidebar link
- No filtering by flag reason — keep it simple, work through the list
- Multi-column sort via clickable column headers (flag count, date, collection)
- Default sort: most flagged first
- Collection dropdown filter to focus on specific community collection
- Detail view includes "Edit Question" link to open question in existing admin editor

### Claude's Discretion
- Detail view pattern (inline expand vs side panel) — pick what fits existing admin UI
- Exact chip colors for reason types
- Toast implementation for undo
- Dismiss flags confirmation behavior

</decisions>

<specifics>
## Specific Ideas

- Reason breakdown in table rows should use colored chips like "Confusing x3" "Wrong x2" — compact and scannable
- Archive/restore workflow should feel fast — one-click with undo, not modal-heavy
- Summary + list pattern for feedback detail: aggregate counts first, then individual entries below

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 29-admin-review-queue*
*Context gathered: 2026-02-21*
