# Phase 31: Semantic Deduplication Infrastructure - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build hybrid duplicate detection (text + embeddings) with a CLI scanner tool that can scan all 6 collections and generate duplicate reports. This phase builds the infrastructure — Phase 32 uses it to audit existing questions.

</domain>

<decisions>
## Implementation Decisions

### Similarity Thresholds
- Tiered system with three levels: exact (>0.95), near-duplicate (>0.85), possible (>0.75)
- Tier actions for Phase 32: exact = auto-archive, near-duplicate = manual review, possible = report-only
- Comparison scope: embed full question text + all answer choices together
- Hybrid approach: fast normalized text comparison first (catches copy-paste dupes), then embeddings for semantic similarity on remaining pairs

### Report Format
- Duplicates grouped as clusters (not pairs) — all related questions grouped together
- Dual output: JSON as source of truth + generated markdown summary for human review
- Markdown report shows full question text + all answers for side-by-side comparison within each cluster
- Report includes recommendation for which question to keep in each cluster (based on quality score and completeness)

### Cross-Collection Policy
- Hierarchy: Federal > State > City — duplicates kept in the broader collection
- Federal/local overlap: keep in Federal, remove from local collection
- State/city overlap: keep in state, remove from city collection
- City/city overlap: keep in both — different audiences, both retain relevant content
- Within same collection: always resolve to one — keep the higher quality question

### Scanner CLI Behavior
- Default scope: all collections + cross-collection comparison (most thorough)
- Dry-run mode: generates full report + shows proposed actions (what WOULD be archived/kept)
- Data source: scans the live database (source of truth for active questions)
- Reports saved to `.planning/dedup-reports/`

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for embedding service integration and CLI design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-semantic-deduplication-infrastructure*
*Context gathered: 2026-02-22*
