# Phase 37: Election Question Generation Script - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

A generation script (and matching UI trigger) that takes a real `election_races` record and produces draft questions linked to that race — containing real candidate names, correct expiry dates, and idempotency protection. Questions appear in the question explorer filtered by jurisdiction. No player-facing changes.

</domain>

<decisions>
## Implementation Decisions

### Question content shape
- Mixed type: seat-civics questions + candidate-about questions (not one or the other)
- Seat questions: mix of hyper-local (what does this specific office do?) and broader civic context (general rules for this type of office)
- Factual only — no candidate-vs-candidate comparisons
- Candidates field contains names only (no party, no bios) for Phase 37; generation draws on general knowledge for context around the seat/jurisdiction
- Future candidate pages will provide richer data; generation script should be structured to accommodate that later

### Question volume by race type
- Mayor: 15 questions
- Council seat: 10 questions
- Other: 8 questions
- Candidate/seat-civics weighting: Claude's discretion based on number of candidates and what makes interesting trivia

### Question targeting & expiry
- Questions appear in question explorer filtered by jurisdiction (no race-specific filter needed)
- Every generated question MUST have `expiresAt` set to end-of-day on election date in jurisdiction's local timezone
- `election_race_id` set on every generated question

### Trigger interface
- Both: CLI script (for dev/admin use) AND "Generate Questions" button on existing admin elections UI
- CLI invocation convention: Claude decides based on existing script patterns in the codebase
- UI loading state: modal/overlay with status text while generation runs (e.g., "Generating questions for [Race Name]...")
- Success state: "12 draft questions created. View in Explorer →" (count + direct link to filtered explorer)

### Idempotency & force-regenerate
- Hard block when `questions_generated = TRUE`: generation does not run, error is shown
- Force-regenerate included in Phase 37 (not deferred): `--force` flag on CLI, override option in UI
- When force-regenerating: previous questions are archived (status = archived), then new draft questions are created; `questions_generated` reset to TRUE
- UI error on block: modal showing question count + generation date + "Force Regenerate will archive [N] questions" with a confirm/force button

### Claude's Discretion
- CLI invocation pattern (consistent with existing scripts)
- Candidate/seat-civics question weighting per race
- Exact modal/overlay UX copy and layout
- System prompt structure for `buildElectionSystemPrompt()`

</decisions>

<specifics>
## Specific Ideas

- "For now, just names — down the line, candidate pages will have a lot more info to draw from." Implies the generation architecture should be extensible to richer candidate data without a rewrite.
- Questions MUST have expiration dates — this is a hard requirement, not optional metadata.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 37-election-question-generation-script*
*Context gathered: 2026-02-26*
