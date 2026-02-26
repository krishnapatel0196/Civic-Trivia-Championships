# Phase 38: Election Cron + Current-Term Stage + Admin Election UI - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the election lifecycle end-to-end: (1) daily cron auto-detects upcoming races and triggers question generation without admin action, (2) admin enters election results to trigger current-term questions that persist until term end, (3) admin UI to manage races across all lifecycle stages. Election data entry and the question generation engine are already built (Phases 35–37).

</domain>

<decisions>
## Implementation Decisions

### Admin UI layout
- Tab bar with three tabs: Active Elections, Pending Generation, Awaiting Follow-up
- Each race row shows: seat name + election date + jurisdiction + question count + status badge (Draft / Active / Expired)
- Pending Generation tab actions per row: "Generate Questions" + "Edit Race" + "Delete Race"
- Awaiting Follow-up tab: "Enter Result" button opens a modal (winner name + term end date fields)
- Active Elections tab: shows "Re-generate" button when `questions_generated = TRUE` (not locked after first generation)

### Cron behavior
- Schedule: 6 AM US Eastern daily
- Detection window: races with `election_date` within 60 days and `questions_generated = FALSE` — no minimum lead time (generate even day-before races)
- Error handling: retry failed race immediately up to 3x, then skip and log; continue with remaining races (don't halt entire run)
- Results visibility: last run summary banner on the Elections admin page showing timestamp, races processed, failures (if any)

### Re-trigger flow
- Destructive confirmation: modal with warning text stating how many existing questions will be archived ("Re-generating will archive X existing questions for this race. Continue?")
- What gets archived: active questions only — draft questions are deleted
- `questions_generated` resets to FALSE so re-generation can proceed
- Post-action: admin stays on elections page; success toast appears with new question count
- Re-generate button accessible on Active Elections tab (not just via Edit Race) — always shows confirmation modal first

### Current-term question type
- Focus: winner's role and responsibilities in office — "Who is the current [Seat]?" style questions
- `expiresAt` = term end date (these questions expire when the official leaves office and are rebuilt with new data for the next officeholder)
- Count: Claude's discretion — enough for educational value without redundancy
- Old campaign questions (expired on election day): leave as-is, no additional action on result entry

### Claude's Discretion
- Exact number of current-term questions to generate per race
- Cron logging format and verbosity
- Status badge color scheme across the three states

</decisions>

<specifics>
## Specific Ideas

- "Who is the current Mayor/Governor/President?" questions should expire when the term ends so they can be rebuilt with new data — this applies at local, state, and federal levels
- The distinction between permanent facts (NULL expiry: "Who won the 2024 Fremont mayoral race?") and current-term facts (term end date: "Who is the current Mayor of Fremont?") is deliberate and important

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 38-election-cron-current-term-admin-ui*
*Context gathered: 2026-02-26*
