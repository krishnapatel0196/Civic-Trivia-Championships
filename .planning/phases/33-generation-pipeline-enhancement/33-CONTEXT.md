# Phase 33: Generation Pipeline Enhancement - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the AI content generation pipeline (from Phases 16/23) to integrate with semantic deduplication (Phase 31-32) and enforce cross-question quality rules during generation. The pipeline should be self-contained and repeatable — reliable enough that adding a new collection is "configure and run," not "plan a milestone."

</domain>

<decisions>
## Implementation Decisions

### Human review gates
- Auto-accept questions that pass all 8 quality rules and dedup check — no human review needed
- Advisory (non-blocking) quality violations: retry once with feedback, then accept either way
- Blocking quality violations: retry up to 3 times with quality feedback, then skip that question
- Generate a summary report at the end: counts of generated, accepted, rejected (by reason)

### Duplicate handling
- Auto-reject and retry when a generated question is flagged as a semantic duplicate
- Check duplicates within the same generation batch (intra-batch), not just against the database
- Use the same similarity threshold as the Phase 31-32 scanner — consistent standard
- **Cross-collection hierarchy logic:**
  - Reject if duplicate exists in a **parent** collection (Federal blocks State, State blocks City)
  - Allow if "duplicate" is in a **sibling** collection (different city, different state)
  - Structurally similar locale-specific questions are expected across siblings (e.g., "Who is our mayor?" in every city)

### Gap-filling strategy
- Pipeline auto-detects gaps: analyzes current collection to identify underrepresented topics and difficulty imbalances
- **Updated difficulty distribution target: 40% easy / 35% medium / 25% hard** (shifted from 30/40/30 to support Easy Steps progressive difficulty mode)
- Standardize topic categories across collection types, but include a collection-specific "identity" topic that lets each locale's character shine
- When a topic can't reach the minimum count, redistribute — generate extra in stronger topics to keep total count up
- Tone: questions should feel fun and useful to know, not like a test

### Source diversity
- 15% source cap is a soft warning, not a hard block — log warnings but accept high-quality questions even if source is over-represented
- For locales with limited online sources, scale the cap with availability (e.g., allow 25% if only 4-5 sources exist)
- Source granularity: Claude's discretion on whether to track by domain, URL, or category
- Source diversity tracking is persistent across generation runs — measured against the full collection, not just the current batch

### Claude's Discretion
- Source granularity level for diversity tracking (domain vs category)
- Exact topic categories and how the "identity" topic is structured per locale
- Technical implementation of gap detection algorithm
- Batch size and generation ordering

</decisions>

<specifics>
## Specific Ideas

- "I would love to upgrade this system so that it becomes easier and more reliable to create more collections without needing to do a Milestone for each. We have lots of areas to build collections for, so let's iron out the process as best we can with the intent of automating to get more collections faster."
- Easy Steps mode needs more easy questions — the 40/35/25 distribution is driven by this game mode
- Questions should feel fun and useful to know — not like a test or quiz

</specifics>

<deferred>
## Deferred Ideas

- **One-command collection creation** — Full automation from locale config through generate, validate, seed, and deploy. Phase 33 builds the generation piece; full end-to-end automation is a future capability.

</deferred>

---

*Phase: 33-generation-pipeline-enhancement*
*Context gathered: 2026-02-23*
