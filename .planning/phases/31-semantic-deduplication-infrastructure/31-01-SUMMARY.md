---
phase: 31-semantic-deduplication-infrastructure
plan: 01
subsystem: embeddings
tags: [openai, embeddings, semantic-similarity, cosine-similarity, clustering, union-find, deduplication]

# Dependency graph
requires:
  - phase: none
    provides: Greenfield implementation
provides:
  - OpenAI text-embedding-3-small wrapper with disk caching and rate limiting
  - Cosine similarity computation with tiered classification (exact/near-duplicate/possible)
  - Union-find clustering algorithm for transitive duplicate grouping
  - Collection hierarchy logic (Federal > State > City) for cross-tier recommendations
  - Type definitions for semantic deduplication pipeline
affects: [32-semantic-audit-and-migration, 33-generation-pipeline-dedup-gate]

# Tech tracking
tech-stack:
  added: [openai@6.22.0]
  patterns: [disk-based embedding cache, union-find clustering, tiered similarity classification, collection hierarchy recommendations]

key-files:
  created:
    - backend/src/services/embeddings/types.ts
    - backend/src/services/embeddings/OpenAIEmbeddingService.ts
    - backend/src/services/embeddings/SemanticDupDetector.ts
    - backend/src/services/embeddings/ClusterBuilder.ts
  modified:
    - backend/package.json
    - backend/package-lock.json

key-decisions:
  - "Use text-embedding-3-small (1536 dimensions) for balance of cost and accuracy"
  - "Cache embeddings to disk at .embedding-cache/ to avoid re-calling API for unchanged text"
  - "Rate limit to 10 concurrent OpenAI API calls via p-limit"
  - "Classify similarities into tiers: exact (>0.95), near-duplicate (>0.85), possible (>0.75)"
  - "Use union-find with path compression for clustering duplicate pairs"
  - "Apply collection hierarchy (Federal > State > City) when recommending which question to keep"
  - "Use quality score as tiebreaker within same collection tier"

patterns-established:
  - "Embedding cache pattern: normalize text (lowercase, trim, collapse whitespace) before storing"
  - "Batch processing pattern: continue on individual failures, report progress via callback"
  - "Fast path optimization: check normalized text similarity before expensive embedding comparison"
  - "Union-find clustering: transitive closure for grouping N-way duplicates from pairwise similarities"

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 31 Plan 01: Semantic Deduplication Infrastructure Summary

**OpenAI embedding service with disk caching (1536-dim vectors), cosine similarity detection with tiered thresholds, and union-find clustering for cross-collection duplicate grouping**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T06:45:30Z
- **Completed:** 2026-02-23T06:47:42Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created OpenAIEmbeddingService wrapping text-embedding-3-small API with disk-based cache and p-limit(10) rate limiting
- Built SemanticDupDetector with cosine similarity computation and tiered classification (exact/near-duplicate/possible/unrelated)
- Implemented ClusterBuilder using union-find algorithm with path compression for transitive duplicate grouping
- Established collection hierarchy logic (Federal > State > City) for cross-tier deduplication recommendations
- Defined comprehensive TypeScript types for the entire semantic deduplication pipeline

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OpenAI SDK and create shared types** - `2935c35` (chore)
2. **Task 2: Create OpenAIEmbeddingService, SemanticDupDetector, and ClusterBuilder** - `7e34ce0` (feat)

## Files Created/Modified

**Created:**
- `backend/src/services/embeddings/types.ts` - Type definitions: SimilarityTier, SimilarityResult, QuestionForDedup, DuplicateCluster, ClusterRecommendation, CollectionTier hierarchy constants
- `backend/src/services/embeddings/OpenAIEmbeddingService.ts` - OpenAI embedding wrapper with disk cache (.embedding-cache/embeddings.json), p-limit(10) concurrency control, batch processing with progress callbacks
- `backend/src/services/embeddings/SemanticDupDetector.ts` - Cosine similarity calculation, tiered classification (>0.95 exact, >0.85 near-duplicate, >0.75 possible), fast normalized text comparison, prepareTextForEmbedding (question + all options)
- `backend/src/services/embeddings/ClusterBuilder.ts` - Union-find with path compression, transitive closure clustering, collection hierarchy recommendations (Federal > State > City), quality score tiebreaker

**Modified:**
- `backend/package.json` - Added openai@6.22.0 dependency
- `backend/package-lock.json` - Lockfile update

## Decisions Made

1. **text-embedding-3-small model** - Balances cost ($0.02 per 1M tokens) with 1536-dimensional accuracy sufficient for question similarity detection
2. **Disk-based cache** - Store embeddings at `.embedding-cache/embeddings.json` to avoid redundant API calls across scan runs
3. **p-limit(10) concurrency** - Respect OpenAI rate limits while maintaining reasonable throughput
4. **Tiered similarity thresholds** - >0.95 exact (likely character-level duplicates), >0.85 near-duplicate (semantic match), >0.75 possible (human review needed)
5. **Union-find clustering** - Handles transitive duplicates (A≈B, B≈C → cluster{A,B,C}) via path compression for O(α(n)) amortized complexity
6. **Collection hierarchy** - Federal questions take precedence over State, which take precedence over City when recommending which duplicate to keep
7. **Quality score tiebreaker** - Within same collection tier, keep the question with higher quality score; if tied, use alphabetical externalId for stability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [31-USER-SETUP.md](./31-USER-SETUP.md) for:
- OPENAI_API_KEY environment variable
- OpenAI Dashboard configuration
- Verification commands

## Next Phase Readiness

**Ready for Phase 32 (Semantic Audit and Migration):**
- All three core services implemented and type-safe
- OpenAIEmbeddingService ready to generate embeddings for all questions in database
- SemanticDupDetector ready to compute pairwise similarities
- ClusterBuilder ready to group duplicates and generate archive recommendations

**Ready for Phase 33 (Generation Pipeline Dedup Gate):**
- Services are stateless and reusable in generation context
- prepareTextForEmbedding() consistent with audit approach
- Similarity thresholds configurable for stricter generation-time checks

**No blockers or concerns.**

---
*Phase: 31-semantic-deduplication-infrastructure*
*Completed: 2026-02-23*
