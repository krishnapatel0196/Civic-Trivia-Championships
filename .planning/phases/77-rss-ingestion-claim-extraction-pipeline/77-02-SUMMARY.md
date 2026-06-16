---
phase: 77-rss-ingestion-claim-extraction-pipeline
plan: 02
subsystem: api
tags: [anthropic, claude, nlp, compromise, drizzle, international, rss, quality-gates, structured-output]

# Dependency graph
requires:
  - phase: 77-01
    provides: "rss-ingestor.ts (ParsedArticle, FeedResult, fetchAllFeeds), run-pipeline.ts scaffold, generation_jobs schema, rss-parser/compromise packages"
  - phase: 75-01
    provides: "questions.factSnapshot, confidenceTier, generationJobId columns; generationJobs table"
provides:
  - "claim-extractor.ts: named-entity clustering (compromise), 2+ source gate, Claude Call 1 with structured output, low-confidence skip"
  - "question-generator.ts: Claude Call 2 with four-gate quality check, active-only DB writes, collection_questions insert"
  - "run-pipeline.ts: full end-to-end orchestration with dry-run support and generation_jobs update"
affects: [79-international-collections-launch, 80-international-admin-visibility]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-call Claude architecture: Call 1 extracts claim + confidence tier, Call 2 generates MCQ — cost gating at both stages"
    - "Structured output (output_config.format.type = json_schema) for both Anthropic calls — guaranteed valid JSON"
    - "Greedy union-find clustering with 24h window + 2+ shared entity gate before any API call"
    - "Quality gate as Claude-side self-assessment (four blocking checks returned in json_schema output)"
    - "Lazy DB imports (ESM pattern) consistent with replacementGenerator.ts"

key-files:
  created:
    - backend/src/scripts/international/claim-extractor.ts
    - backend/src/scripts/international/question-generator.ts
  modified:
    - backend/src/scripts/international/run-pipeline.ts

key-decisions:
  - "Low-confidence claims skip Call 2 entirely — returned as null from extractClaim() before any question generation cost"
  - "Quality gate is Claude-side (embedded in json_schema output) not a post-hoc filter — simplifies architecture"
  - "Questions failing ANY quality gate are never written to DB (not draft, not flagged) — CONTEXT.md overrides roadmap 'save as draft'"
  - "source stored as { name: feedName, url: articleUrl } in existing JSONB source field — no schema change needed"
  - "World-news topic lazy-created on first write — no migration required"
  - "notes JSON in generation_jobs cast as any to extend beyond narrow schema type — acceptable until schema is widened"
  - "Dry-run mode: cluster logging only, no Claude calls, no DB writes — preserves Claude budget in testing"
  - "external_id format: {prefix}-{NNNN} (4-digit zero-padded) for international questions"

patterns-established:
  - "Two-call Claude pattern: Call 1 = extraction/classification, Call 2 = generation — applies to any future news-to-trivia pipeline"
  - "Structured output json_schema in both Claude calls — use output_config.format for guaranteed JSON parsing"
  - "Union-find clustering for multi-source story dedup — reusable for other ingestion pipelines"

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 77 Plan 02: Claim Extraction + Question Generation Summary

**Named-entity clustering (compromise) + two-call Claude pipeline converts deduplicated RSS story clusters into active quality-gated trivia questions with collection_questions rows**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T14:14:59Z
- **Completed:** 2026-04-09T14:19:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Story deduplication via greedy union-find clustering with 24h window and 2+ shared named-entity gate — single-source stories dropped before any Claude call
- Claude Call 1 (claim-extractor.ts): structured-output JSON schema extracts the single most verifiable claim from each cluster; low-confidence tier returns null, skipping Call 2
- Claude Call 2 (question-generator.ts): structured-output JSON schema generates 1–3 MCQ questions per claim with embedded four-gate quality assessment; only questions where quality_gate.passed === true are written to DB as active
- run-pipeline.ts wired end-to-end: ingest → dedup → extract claims → generate questions → write DB → update generation_jobs with comprehensive notes (clusters, lowConfidenceSkipped, questionsBlocked, blockReasons)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ClaimExtractor service (story dedup + Claude Call 1)** - `822dd2d` (feat)
2. **Task 2: Create QuestionGenerator + wire full pipeline in run-pipeline.ts** - `023e817` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `backend/src/scripts/international/claim-extractor.ts` — Named-entity extraction, union-find clustering, Claude Call 1 structured output, low-confidence skip
- `backend/src/scripts/international/question-generator.ts` — Claude Call 2 structured output, four-gate quality check, active-only DB writes with collection_questions insert
- `backend/src/scripts/international/run-pipeline.ts` — Full pipeline orchestration: dedup → extract → generate → write → update generation_jobs

## Decisions Made
- **Low-confidence skip before Call 2:** extractClaim() returns null for confidence_tier='low', preventing Claude Call 2 cost. Clusters that don't produce a claim are counted in lowConfidenceSkipped.
- **Quality gate is Claude-side:** The four blocking checks (partisan framing, fallacies, manipulative framing, unverifiability) are embedded in the json_schema structured output rather than applied post-hoc. Failing questions are logged but never written to DB.
- **No draft writes:** CONTEXT.md explicitly overrides the roadmap's "save as draft" language — questions either pass all four gates (inserted as active) or are discarded.
- **World-news topic lazy-created:** `writePassingQuestions` checks for the slug and inserts if missing, avoiding any migration dependency.
- **Notes JSON cast as any:** The generationJobs schema's `notes` JSONB type is narrow (feedStats only). Extended notes (clusters, blockReasons, etc.) are stored via `as any` cast — acceptable trade-off; schema can be widened in a later phase if needed.
- **Dry-run skips Claude calls:** In `--dry-run` mode, clusterArticles runs (free) but no extractClaim/generateQuestions calls are made — preserves Claude API budget during testing.

## Deviations from Plan

None — plan executed exactly as written. The `notes as any` cast to extend the JSONB type (rather than widening the schema.ts type) is a minor implementation detail, not a deviation from the plan's intent.

## Issues Encountered
None — TypeScript compiled cleanly on first attempt. The `output_config` structured output API (SDK 0.74.0) works as documented in plan notes.

## User Setup Required
None - no external service configuration required. The pipeline uses existing ANTHROPIC_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY environment variables already configured on Render.

## Next Phase Readiness
- Complete international pipeline is now operational: `npx tsx src/scripts/international/run-pipeline.ts --collection world-news --prefix wrld`
- Phase 79 (launch international collections) can proceed — run-pipeline.ts is the production entry point
- Phase 80 (admin visibility for international questions) can proceed independently
- generationJobs notes JSON includes blockReasons for debugging quality gate rejections at scale

---
*Phase: 77-rss-ingestion-claim-extraction-pipeline*
*Completed: 2026-04-09*
