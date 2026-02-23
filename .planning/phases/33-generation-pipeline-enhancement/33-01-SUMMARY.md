---
phase: 33-generation-pipeline-enhancement
plan: 01
subsystem: ai-generation
tags: [ai, anthropic, openai, embeddings, quality-rules, content-generation, gap-analysis, deduplication]

# Dependency graph
requires:
  - phase: 31-semantic-deduplication
    provides: SemanticDupDetector, OpenAIEmbeddingService, COLLECTION_HIERARCHY types
  - phase: 32-existing-collection-audit
    provides: Duplicate detection patterns and hierarchy policy
provides:
  - Generation pipeline service modules (types, gap analysis, source tracking, hierarchy-aware dedup)
  - 40/35/25 difficulty distribution with minimum 10 per topic
  - Adaptive source diversity caps (15%/20%/25%)
  - Cross-collection duplicate policy (parent blocks, sibling allows)
affects: [34-scale-to-90-plus]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gap analysis with redistribution for unreachable topics"
    - "Adaptive soft caps based on source availability"
    - "Hierarchy-aware duplicate detection (Federal > State > City)"
    - "Intra-batch duplicate checking for generation runs"

key-files:
  created:
    - backend/src/services/generation/types.ts
    - backend/src/services/generation/GapAnalyzer.ts
    - backend/src/services/generation/SourceTracker.ts
    - backend/src/services/generation/CollectionHierarchy.ts
  modified: []

key-decisions:
  - "40/35/25 easy/medium/hard distribution (updated from 30/40/30 for Easy Steps mode)"
  - "Minimum 10 questions per topic with redistribution for unreachable topics"
  - "15% source cap is soft warning (never blocks), scales to 20%/25% for source-poor locales"
  - "Parent-blocks-child hierarchy (Federal blocks State, State blocks City, siblings allow)"
  - "0.85 similarity threshold consistent with Phase 31-32 scanner"

patterns-established:
  - "Generation service modules in services/generation/ separate from orchestration scripts"
  - "Greedy generation plan builder prioritizing largest gaps in both topic and difficulty"
  - "Domain-based source tracking (strip www. prefix from hostname)"

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 33 Plan 01: Generation Pipeline Enhancement Summary

**Gap analysis, source diversity tracking, and hierarchy-aware deduplication services ready for generateQuestions.ts orchestrator (Plan 02)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T23:15:53Z
- **Completed:** 2026-02-23T23:18:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created four TypeScript service modules for generation pipeline: types, gap analysis, source tracking, and cross-collection deduplication
- GapAnalyzer implements 40/35/25 difficulty distribution (shifted from 30/40/30 to support Easy Steps mode) with minimum 10 questions per topic
- SourceTracker enforces adaptive 15%/20%/25% soft caps based on unique source count (never hard-blocks)
- CollectionHierarchy applies parent-blocks-child policy using 0.85 similarity threshold from Phase 31-32
- All services integrate cleanly with existing embeddings infrastructure (SemanticDupDetector, OpenAIEmbeddingService)

## Task Commits

1. **Task 1: Create generation types and GapAnalyzer** - `0550e57` (feat)
2. **Task 2: Create SourceTracker and CollectionHierarchy** - `86845fe` (feat)

**Plan metadata:** (will be committed next)

## Files Created/Modified

- `backend/src/services/generation/types.ts` - Generation config, gaps, results, and report types
- `backend/src/services/generation/GapAnalyzer.ts` - Topic/difficulty gap detection with redistribution for unreachable topics
- `backend/src/services/generation/SourceTracker.ts` - Source diversity tracking with adaptive caps (15%/20%/25%)
- `backend/src/services/generation/CollectionHierarchy.ts` - Cross-collection duplicate checking with hierarchy policy

## Decisions Made

1. **40/35/25 difficulty distribution:** Updated from 30/40/30 per CONTEXT.md to support Easy Steps progressive difficulty mode (needs more easy questions)
2. **Minimum 10 questions per topic:** Ensures balanced coverage across all topics, with redistribution if a topic can't reach minimum
3. **Soft source caps:** 15% standard cap is a warning (not blocking), scales to 20% for 4 sources or 25% for 3 or fewer
4. **Hierarchy policy:** Federal blocks State, State blocks City, siblings allow (consistent with Phase 32 decisions)
5. **0.85 similarity threshold:** Same as Phase 31-32 scanner for near-duplicate detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Ready for Plan 33-02 (generateQuestions.ts orchestrator). All building blocks in place:
- Gap analysis identifies what to generate (topic + difficulty slots)
- Source tracking warns when diversity cap exceeded
- CollectionHierarchy rejects parent/sibling duplicates during generation
- All services integrate with existing quality rules and embedding infrastructure

No blockers. Plan 02 can wire these services together into the main generation orchestrator.

---
*Phase: 33-generation-pipeline-enhancement*
*Completed: 2026-02-23*
