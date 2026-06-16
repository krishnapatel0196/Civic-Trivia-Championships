# Phase 34: Scale to 90+ Questions - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Run the generation pipeline to bring all 5 non-Federal collections up to 90+ unique, high-quality questions, then seed new questions to the database. Federal collection is already sufficient (114 active). Existing active questions are not replaced — only new questions are added.

**Current gaps:**
| Collection | Active | Gap |
|---|---|---|
| Indiana State | 68 | +22 |
| California State | 55 | +35 |
| Bloomington, IN | 53 | +37 |
| Fremont, CA | 54 | +36 |
| Los Angeles, CA | 42 | +48 |

</domain>

<decisions>
## Implementation Decisions

### Review workflow
- Trust the pipeline — if questions pass quality rules and dedup, seed them without manual review
- No manual spot-check step; the existing 8 quality rules are considered sufficient
- Generic-but-valid questions are acceptable; no additional quality score floor beyond what the rules enforce
- Where generated JSON files live before seeding: Claude's discretion (whatever is cleaner given the pipeline structure)

### Generation target
- Overshoot to ~100–105 per collection (10–15% above 90) to give a buffer; quality rules filter the weakest out
- If a collection can't reach 90 despite retries (sources run dry): accept what the pipeline produces and ship it
- Model upgrade: use the latest Claude Sonnet model available at execution time (not the old claude-sonnet-4-5-20250929)

### Seeding approach
- Add-only: insert only new questions; existing 386 active questions are untouched
- New questions go live immediately on seed — no draft/pending staging step
- Seed timing (per-collection vs batch): Claude's discretion — pick whatever is safer and less error-prone

### Verification criteria
- Pass/fail: each of the 5 non-Federal collections has 90+ active questions
- Quality sanity check on newly generated questions: verify no blocking violations introduced
- Scope: re-audit new questions only — existing active questions are not re-audited

### Claude's Discretion
- JSON file handling: write directly to source JSON files or use a staging dir before merging — whichever fits the existing pipeline output structure
- Seeding timing: seed each collection as generated, or batch all 5 first — whichever is safer
- Verification script design: count queries + quality rule scan on new question IDs

</decisions>

<specifics>
## Specific Ideas

- The generation pipeline from Phase 33 (`generateQuestions.ts`) is the primary tool — this phase is execution, not architecture
- Pipeline already has overshoot-and-curate support from Phase 23 patterns; use that mechanism
- Quality rules from Phase 18 are the gate; no new rules needed
- Semantic dedup from Phase 31 is already integrated into the pipeline

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 34-scale-to-90-questions*
*Context gathered: 2026-02-23*
