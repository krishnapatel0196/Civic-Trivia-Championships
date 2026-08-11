---
phase: 31-semantic-deduplication-infrastructure
plan: 02
subsystem: tooling
tags: [cli, openai, embeddings, duplicate-detection, reporting, cross-collection-analysis]

# Dependency graph
requires:
  - phase: 31-01
    provides: OpenAIEmbeddingService, SemanticDupDetector, ClusterBuilder core services
provides:
  - CLI scanner tool that orchestrates embedding services into complete duplicate detection workflow
  - Dual JSON and markdown report generation in .planning/dedup-reports/
  - Cross-collection duplicate detection with global comparison (not per-collection)
  - CLI flags for filtering (--collections, --min-tier, --skip-cache, --dry-run)
  - npm run scan-duplicates command for easy execution
affects: [32-semantic-audit-and-migration, 33-generation-pipeline-dedup-gate]

# Tech tracking
tech-stack:
  added: []
  patterns: [CLI reporting pattern with dual JSON/markdown output, progress tracking with cache statistics, SQL query for active questions with collection memberships]

key-files:
  created:
    - backend/src/scripts/scan-duplicates.ts
    - .planning/dedup-reports/.gitkeep
  modified:
    - backend/package.json
    - backend/.env.example
    - .gitignore

key-decisions:
  - "Default to dry-run mode - tool generates reports only, never modifies database"
  - "Dual report format: JSON for machine processing, markdown for human review"
  - "Save reports to .planning/dedup-reports/ with timestamp in filename"
  - "Show full question text + all answers in markdown for side-by-side comparison"
  - "Global cross-collection comparison (not per-collection isolation)"
  - "Gitignore reports but track directory with .gitkeep"
  - "Display cache statistics (hits/misses) for transparency and optimization"

patterns-established:
  - "CLI tool structure: parseFlags → fetch data → validate API keys → process → generate reports → print summary"
  - "Progress tracking pattern: periodic console updates showing done/total and cache hits"
  - "Report timestamp format: YYYY-MM-DD-HHmmss for sortable filenames"
  - "Markdown report structure: summary table → cluster-by-cluster breakdown with full question details and pairwise similarities"

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 31 Plan 02: CLI Scanner Tool Summary

**CLI scanner with hybrid text+embedding detection, cross-collection comparison, union-find clustering, and dual JSON/markdown reports showing full question context for human review**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T06:52:13Z
- **Completed:** 2026-02-23T06:55:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built scan-duplicates CLI tool (340 lines) that orchestrates all embedding services from Plan 01 into complete workflow
- Implemented SQL query fetching all active questions with collection memberships for global cross-collection comparison
- Created dual report generation: JSON for machine processing, markdown for human review with full question text and answers
- Wired up npm run scan-duplicates command with CLI flags for filtering and control
- Configured environment and gitignore for OpenAI API key and embedding cache

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scan-duplicates CLI tool** - `694d88b` (feat)
2. **Task 2: Wire up npm script, env config, and gitignore** - `4d4c55e` (chore)

## Files Created/Modified

**Created:**
- `backend/src/scripts/scan-duplicates.ts` - CLI tool that fetches questions, validates API key, embeds via OpenAIEmbeddingService, finds pairs via SemanticDupDetector, builds clusters via ClusterBuilder, and generates dual reports
- `.planning/dedup-reports/.gitkeep` - Tracks report directory while gitignoring generated reports

**Modified:**
- `backend/package.json` - Added "scan-duplicates" npm script
- `backend/.env.example` - Added OPENAI_API_KEY with usage comment
- `.gitignore` - Added backend/.embedding-cache/, .planning/dedup-reports/*.json, .planning/dedup-reports/*.md

## Decisions Made

1. **Default to dry-run mode** - Tool always runs in report-only mode (no database modifications) to match Phase 31 scope. Explicit --dry-run flag clarifies behavior to users.

2. **Dual report format** - JSON provides machine-readable cluster data for automation, markdown provides human-readable side-by-side comparison with full question text and all 4 answer options with checkmarks on correct answers.

3. **Global cross-collection comparison** - Questions compared across all 6 collections (or filtered subset via --collections flag), not isolated per-collection. Enables detecting duplicates between Federal/State/City tiers.

4. **Timestamp-based filenames** - Reports saved as `duplicates-YYYY-MM-DD-HHmmss.json/md` for sortability and non-collision across multiple scan runs.

5. **Cache statistics display** - Show cache hits/misses in both progress output and final summary for transparency about API usage and optimization opportunities.

6. **Gitignore reports** - Reports are generated artifacts for local review, not committed to git. Directory tracked via .gitkeep for convenience.

7. **CLI flags for control** - `--collections` for filtering, `--min-tier` for threshold control, `--skip-cache` for forcing re-embedding, `--dry-run` for explicit mode clarity.

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
- CLI scanner complete and ready to run against production database
- Dual reports provide both machine-readable data (JSON) and human review (markdown)
- Cross-collection comparison enables identifying Federal/State/City duplicate hierarchies
- Embedding cache will persist across runs for efficient re-scanning

**Ready for Phase 33 (Generation Pipeline Dedup Gate):**
- Scanner workflow demonstrates how to integrate embedding services into pipeline
- prepareTextForEmbedding() pattern established for consistent text normalization
- Similarity tier thresholds can be configured for stricter generation-time checks

**No blockers or concerns.**

---
*Phase: 31-semantic-deduplication-infrastructure*
*Completed: 2026-02-23*
