---
phase: 33-generation-pipeline-enhancement
plan: 02
subsystem: ai-generation
tags: [ai, anthropic, openai, claude, generation-pipeline, orchestration, quality-validation, deduplication]

# Dependency graph
requires:
  - phase: 33-01
    provides: GapAnalyzer, SourceTracker, CollectionHierarchy, generation types
  - phase: 31-semantic-deduplication
    provides: SemanticDupDetector, OpenAIEmbeddingService
  - phase: 18-quality-rules
    provides: auditQuestion, quality rule engine
provides:
  - Complete generation pipeline orchestrator (generateQuestions.ts)
  - CLI interface for collection-scoped question generation
  - Serial generation with quality retry loops and semantic dedup
  - JSON output in collection-compatible format + detailed reports
affects: [34-scale-to-90-plus]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Serial generation with 1-second rate limiting for Claude API"
    - "Multi-stage retry loop: quality (3x) -> dedup (3x) -> accept/skip"
    - "Intra-batch duplicate checking via batchEmbeddings Map"
    - "Collection-compatible JSON output (topics + questions arrays)"

key-files:
  created:
    - backend/src/scripts/generateQuestions.ts
  modified: []

key-decisions:
  - "Serial generation (not concurrent) prioritizes reliability over speed"
  - "Quality violations get feedback in retry prompts, duplicates get topic redirect"
  - "Advisory violations logged in report but don't block acceptance"
  - "External ID counter increments only on accepted questions"
  - "Output to JSON files (not database) for human review before seeding"

patterns-established:
  - "CLI args parser with required --collection and --target flags"
  - "Dry-run mode shows gap analysis without API calls"
  - "Two output files: questions JSON (for seeding) + report JSON (for audit)"
  - "Progress logging: [N/M] with attempt counts and accept/skip/duplicate status"

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 33 Plan 02: Generation Pipeline Enhancement Summary

**Self-validating generation pipeline operational: gap analysis → Claude generation → quality check → dedup check → JSON output with detailed reporting**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T23:22:20Z
- **Completed:** 2026-02-23T23:25:36Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Built generateQuestions.ts orchestration script (637 lines) integrating all Phase 33 services
- CLI interface with --collection, --target, --dry-run, --limit flags
- Multi-stage generation loop: Claude API → quality audit → semantic dedup → retry/accept
- Quality retry logic: blocking violations retry up to 3x with feedback, advisory violations log warnings
- Semantic deduplication checks both database questions AND intra-batch generated questions
- Hierarchy-aware dedup policy applied (Federal blocks State, State blocks City, siblings allow)
- Source diversity tracking with adaptive caps (15%/20%/25%) and soft warnings
- Output to collection-compatible JSON + detailed generation report JSON
- Validated with dry-run (gap analysis only) and live test (2 questions generated successfully)

## Task Commits

1. **Task 1: Build generateQuestions.ts orchestration script** - `b48dc71` (feat)
2. **Task 2: Validate pipeline with dry-run and limited generation test** - `4825d67` (test)

**Plan metadata:** (will be committed next)

## Files Created/Modified

- `backend/src/scripts/generateQuestions.ts` - Main generation pipeline orchestrator (NEW)

## Decisions Made

1. **Serial generation over concurrent:** Prioritizes reliability and rate limiting over speed (1-second delay between Claude calls)
2. **Retry prompt strategy:** Append quality feedback to original prompt for retries, include violation messages
3. **Intra-batch dedup tracking:** batchEmbeddings Map stores generated question embeddings to prevent batch-internal duplicates
4. **External ID allocation:** Counter increments only on accepted questions, skipped/duplicate attempts don't consume IDs
5. **Output format:** Two JSON files - questions (collection-compatible for seeding) + report (generation audit trail)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pipeline executed cleanly in both dry-run and live test modes.

## Validation Results

### Dry-Run Test (fremont-ca, target 90)
- ✓ Gap analysis computed correctly (19 questions needed, 17 generation slots)
- ✓ Topic gaps identified: elections-voting (4), budget-finance (5), others (1-2 each)
- ✓ Difficulty gaps identified: easy (20), hard (3)
- ✓ No API calls made in dry-run mode

### Live Test (fremont-ca, target 90, limit 2)
- ✓ Generated 2/2 questions successfully (100% acceptance rate)
- ✓ Both questions passed quality audit (score: 92.00 each)
- ✓ No duplicates detected (intra-batch or database)
- ✓ Source diversity warnings logged (fremont.gov 35.6%, acgov.org 20.5% exceed 15% cap)
- ✓ Questions JSON output in collection-compatible format (topics + questions arrays)
- ✓ Report JSON contains all GenerationReport fields (config, gapAnalysis, results, sourceDiversity, etc.)
- ✓ Embedding cache saved successfully

## Next Phase Readiness

**Phase 34 (Scale to 90+ Questions) READY.**

The generation pipeline is fully operational and validated:
- Gap analysis identifies what to generate (topic + difficulty slots)
- Serial generation with retry loops ensures quality
- Semantic dedup prevents duplicates (database + intra-batch)
- Source diversity tracking warns when caps exceeded
- Output format ready for database seeding

Phase 34 can run this pipeline for all 5 non-Federal collections to scale to 90+ questions each.

No blockers.

---
*Phase: 33-generation-pipeline-enhancement*
*Completed: 2026-02-23*
