# Phase 78: Pipeline Cron Worker + Pool Regulation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the Phase 77 pipeline to a nightly cron schedule, add pool regulation logic (archive stale current-events questions to make room for new ones), and log every run to `trivia.generation_jobs` — so International collections self-maintain without manual intervention.

Scope: scheduling, orchestration, pool size regulation, generation_jobs logging, auto-throttle guard. Building new collections is Phase 79.

</domain>

<decisions>
## Implementation Decisions

### Volatility Classification
- Collection-config-driven: each locale config declares a single default volatility (`fast`/`medium`/`slow`/`stable`)
- All questions generated for that collection inherit the config's default — no per-question Claude assessment
- Phase 79 locale configs will set: War in Iran = `fast`, Climate Agreements = `medium`

### Pool Architecture — Two Layers
The pool for each International collection has two distinct layers:

- **Current Events layer** (`fast`/`medium` volatility): generated nightly by the pipeline; rotates as news evolves
- **History layer** (`slow`/`stable` volatility): seeded at launch or added manually; permanent factual foundation

The 80-question ceiling applies **only to the Current Events layer**. History questions are never touched by pool regulation archival.

### Pool Regulation
- **Post-generation ceiling**: archive down to **72** before generating, so after generating up to 8 new questions the Current Events layer ends at ≤80
- **Archive order**: `fast` questions first (oldest `created_at` ascending), then `medium` if still over 72 target; `slow`/`stable` are never archived via pool regulation
- Regulation only triggers when Current Events count > 72 (i.e., archiving would happen before any generation in that run)

### Throttle Behavior
- When a collection's pending review (draft) count > 20: **skip the full pipeline** for that collection in the current run
- No partial execution — no RSS fetch, no Claude calls
- Log the skip in `generation_jobs` with status `skipped` and a reason field

### Run Failure Handling
- **Per-collection isolation**: each collection runs inside its own try/catch
- One collection's failure logs an error and continues — other collections are unaffected
- **One `generation_jobs` row per collection per run**, not one row per cron invocation
- Each row captures: `collection_slug`, `status` (success/failed/skipped), `questions_generated`, `questions_flagged`, `questions_activated`, run timestamp, skip/failure reason if applicable

### Claude's Discretion
- Exact `expiresAt` values within volatility bands (fast: 3–5 days, medium: 7–14 days, slow/stable: longer)
- Cron deployment mechanism (node-cron in server process vs. Render cron job)
- Edge-case handling when Current Events count is already below 72 (no archival needed)

</decisions>

<specifics>
## Specific Ideas

- The mission framing matters: International collections should blend "History" (shared factual foundation — military budgets, treaties, institutional structures) with "Current Events" (rotating, time-sensitive news). History questions are the stable layer; current events rotate through it. Don't let pipeline churn displace the evergreen foundation.
- The 80-question ceiling on Current Events is a starting point. Quality-at-scale is an open question — revisit after Phase 79 generates the first real batch.
- "Oldest by `created_at`" is the archive sort for current events: news questions lose relevance with age, not with proximity to expiry.

</specifics>

<deferred>
## Deferred Ideas

- **Monthly accuracy review for history/stable questions** — a periodic admin workflow to verify that `slow`/`stable` questions are still factually accurate (e.g., budget figures didn't change, institutions still exist). Belongs in a future admin phase.
- **Adjustable per-collection pool ceiling** — currently hard-coded at 80 Current Events questions. Could be made a per-collection config value if some collections warrant a tighter or looser cap after observing quality at scale.

</deferred>

---

*Phase: 78-pipeline-cron-worker-pool-regulation*
*Context gathered: 2026-04-09*
