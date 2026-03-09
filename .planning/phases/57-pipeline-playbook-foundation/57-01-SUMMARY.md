---
phase: 57-pipeline-playbook-foundation
plan: 01
subsystem: content-generation
tags: [openai, embeddings, semantic-dedup, content-pipeline, typescript]

# Dependency graph
requires:
  - phase: 56-scan-duplicates
    provides: OpenAIEmbeddingService, SemanticDupDetector, ClusterBuilder infrastructure
provides:
  - Automatic within-collection semantic dedup as a post-batch step in generate-locale-questions.ts
  - runWithinCollectionSemanticDedup() function with OPENAI_API_KEY guard and prefix-filtered scope
affects:
  - 57-02 (expiring-question ratio enforcement — also modifies generation pipeline)
  - Any future collection generation runs (dedup now runs automatically)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic import pattern for embedding services in ESM scripts (avoids top-level import issues)"
    - "Post-batch pipeline step gated on !dryRun — side-effect operations never run in dry-run mode"
    - "Prefix-filtered DB query for within-collection scoping (prefix + '-%' LIKE pattern)"

key-files:
  created: []
  modified:
    - backend/src/scripts/content-generation/generate-locale-questions.ts

key-decisions:
  - "Semantic dedup scoped to within-collection only (prefix-filtered) — cross-collection remains scan-duplicates.ts responsibility"
  - "Empty tierMap passed to ClusterBuilder for within-collection runs — quality score and externalId break ties instead of collection tier"
  - "Per-question DB update error is caught and logged, not thrown — one failed archive does not abort the whole dedup step"
  - "Step called after saveReport() so report reflects actual seeded count, not post-archive count"

patterns-established:
  - "Graceful degradation on missing OPENAI_API_KEY: print warning, return early, do not crash"
  - "Dynamic import for services inside async pipeline functions (consistent with existing DB import pattern in same file)"

# Metrics
duration: ~8min
completed: 2026-03-09
---

# Phase 57 Plan 01: Pipeline & Playbook Foundation — Semantic Dedup Integration Summary

**Semantic near-duplicate detection auto-runs after generation via runWithinCollectionSemanticDedup(), eliminating the manual scan-duplicates.ts pass required in v1.9**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-09T18:06:58Z
- **Completed:** 2026-03-09T18:14:00Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Added `runWithinCollectionSemanticDedup(prefix, collectionSlug)` to `generate-locale-questions.ts` — queries draft/active questions prefix-filtered to the current collection, embeds via OpenAIEmbeddingService (with shared `.embedding-cache`), finds near-duplicate pairs (>0.85 cosine similarity), builds clusters, and archives duplicates in the DB
- Wired the call into `main()` after `saveReport()` and before the Final Summary block, gated on `!args.dryRun`
- OPENAI_API_KEY guard: if unset, prints warning and skips cleanly — generation still completes normally
- Each archived question is logged with externalId, similarity score, cluster ID, and the kept question's externalId

## Task Commits

Each task was committed atomically:

1. **Task 1: Add runWithinCollectionSemanticDedup()** - `2f61664` (feat)
2. **Task 2: Wire into main() after batch seeding** - `e8b3fa0` (feat)

## Files Created/Modified

- `backend/src/scripts/content-generation/generate-locale-questions.ts` — Added 116-line `runWithinCollectionSemanticDedup()` function and 5-line call site in `main()`

## Decisions Made

- **Empty tierMap for within-collection clusters:** ClusterBuilder requires a `Map<string, CollectionTier>` but within a single collection there is no cross-tier hierarchy. Passing an empty map causes ClusterBuilder to fall back to quality score then externalId alphabetical order for keep/archive decisions — which is the correct behavior within a collection.
- **Step 5 placement after saveReport():** The generation report reflects questions seeded during batches. Running dedup after the report is saved means the report count is accurate; archived questions are a post-processing result separate from the generation report.
- **Dynamic import pattern:** All embedding services imported via `await import(...)` inside the async function body, consistent with the existing DB import pattern in the same file, to avoid top-level ESM import issues when the script is run with tsx.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. OPENAI_API_KEY is already used by the embeddings infrastructure; if not set, the dedup step skips gracefully.

## Next Phase Readiness

- Plan 57-01 complete. `generate-locale-questions.ts` now has integrated semantic dedup.
- Plan 57-02 (expiring-question ratio enforcement) is ready to execute — it modifies the same file with a ratio warning step.
- No blockers.

---
*Phase: 57-pipeline-playbook-foundation*
*Completed: 2026-03-09*
