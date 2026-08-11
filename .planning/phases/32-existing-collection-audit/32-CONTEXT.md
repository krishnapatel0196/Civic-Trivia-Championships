# Phase 32: Existing Collection Audit - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Scan all 639 existing questions across 6 collections for duplicates using Phase 31 infrastructure, review findings through an admin UI, and archive confirmed duplicates from both the database and JSON source files. This phase audits existing content — it does not generate new content or modify the generation pipeline.

</domain>

<decisions>
## Implementation Decisions

### Review workflow
- Admin UI review queue (not CLI-only) for reviewing duplicate findings
- Clustered group display — all related duplicates shown together, not just pairs
- Select one question to keep per cluster, all others archived automatically
- Auto-resolve available for high-confidence duplicates (90%+ similarity) — automatically keeps the higher-quality question, with undo/review option
- Manual review required for everything below 90% similarity

### Keep vs archive criteria
- Claude's composite ranking for which question to keep (quality score, content completeness, source links — weighed together)
- Pure quality wins — no factoring in difficulty distribution gaps (Phase 34 fills those)
- Soft archive — mark as archived in DB (can restore if needed), but remove from JSON source files
- JSON source files kept in sync with DB — archived questions removed from JSON

### Similarity threshold
- Moderate dedup aggressiveness — flag same-thing questions AND questions so close they feel repetitive to a player, even if technically asking different angles
- Auto-resolve threshold: 90%+ similarity (clearly redundant, auto-keep higher quality)
- Lower bound for flagging: Claude's discretion based on scanner output distribution
- Similarity scores displayed in admin UI for each pair/cluster to aid judgment

### Cross-collection handling
- Federal collection is canonical — duplicates between Federal and locale collections are removed from the locale
- State wins over city — duplicates between state (e.g., Indiana) and city (e.g., Bloomington IN) collections are removed from the city collection
- Hierarchy: Federal > State > City
- Collection drops below 90 questions are acceptable — Phase 34 generates replacements
- Organization of within-collection vs cross-collection review: Claude's discretion

### Claude's Discretion
- Composite ranking algorithm for "best question" in a cluster
- Lower bound similarity threshold for flagging (based on scanner output distribution)
- Whether to separate within-collection and cross-collection duplicates in the review UI
- Admin UI layout and interaction patterns for the review queue

</decisions>

<specifics>
## Specific Ideas

- Auto-resolve with undo mirrors the existing archive/restore pattern from the Phase 29 flag review queue
- Similarity scores visible so the admin can calibrate their intuition over time
- Collection hierarchy (Federal > State > City) is a clear rule, not case-by-case judgment

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-existing-collection-audit*
*Context gathered: 2026-02-23*
