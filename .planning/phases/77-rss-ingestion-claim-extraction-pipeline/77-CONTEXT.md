# Phase 77: RSS Ingestion + Claim Extraction Pipeline - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend pipeline that ingests 4 RSS feeds (BBC World, NPR, The Guardian, DW), extracts article text, deduplicates stories across feeds, and generates quality-gated MCQ questions via Claude — with per-feed error isolation. Cron scheduling and pool regulation are Phase 78. Collection launch is Phase 79.

</domain>

<decisions>
## Implementation Decisions

### Story Deduplication
- Hybrid approach: extract named entities from article body text, cluster articles within the same 24-hour window that share 2+ key named entities
- Applied to article body text (not just headlines) — headline-only matching is too brittle across publishers
- **2+ corroborating sources required** before any Claude call is made; stories covered by only one feed are skipped and logged
- Dedup runs before any Claude API call — no cost incurred for single-source or duplicate stories

### Claude Call Architecture
- **Two separate calls per story cluster** — each call has a single, focused responsibility
- **Call 1 (Claim Extraction):** Receives article bodies from the cluster; returns the single best verifiable claim, a fact_snapshot string, and a confidence_tier assignment
- **Call 2 (Question Generation + Quality Gate):** Receives the claim from Call 1; generates a complete MCQ question and assesses it against all four quality gates
- Claude decides question count per cluster based on story depth (typically 1, up to 2–3 for rich, multi-faceted stories)

### Question Composition (encoded in Call 2 prompt)
- Target ~15% of questions involving concrete numbers: budgets, percentages, dates, quantities — prioritize these when available in the source material
- Prefer verifiable, non-disputed facts over characterizations, assessments, or contested interpretations
- Examples of preferred question types: "Iran's annual military budget in 2025 was…?", "The US allocates what percentage of its budget to…?"
- Avoid questions requiring inference about motive, blame assignment, or outcome prediction

### Confidence Tiers
Three tiers assigned by Call 1:
- `high`: Concrete fact with a specific number, official statement, or dated event — directly stated in source
- `medium`: Well-supported characterization; multiple sources agree but involves some interpretation
- `low`: Prediction, intent assessment, or contested framing
- **Low-confidence claims are skipped entirely — no Call 2 is made**

### Quality Gate (Call 2)
Four blocking checks — failing any check means the question is not created (not even as draft):
1. **Partisan framing** — assigns blame, takes sides on disputed political questions
2. **Logical fallacies** — false dilemma, straw man, false cause in question or answer options
3. **Manipulative framing** — leading questions, loaded language, emotionally charged phrasing
4. **Unverifiability** — correct answer requires knowing private intent or predicting future outcomes

- Questions passing all four gates → `active` status
- Claude returns a `reason` string for any rejection; written to logs but not stored in DB (question is never created)

### Pipeline Observability
- Human-readable progress logs per feed and per story cluster outcome
- Log format example: `[BBC World] 12 articles → 4 clusters after dedup → 3 questions generated (1 blocked: partisan framing)`
- `generation_jobs` record includes a `notes` JSON field storing per-feed stats and per-cluster outcomes (not just aggregate counts)
- Failed feeds: log feed URL + error type, continue processing remaining feeds; `generation_jobs` captures `feeds_failed` count

### Claude's Discretion
- Exact named-entity extraction implementation (regex, NLP library, or simple proper-noun detection)
- Similarity threshold tuning for the 24-hour entity clustering
- Exact Call 1 and Call 2 prompt wording and JSON response schema
- How to handle articles where `<content:encoded>` and HTTP-fetched body differ significantly

</decisions>

<specifics>
## Specific Ideas

- "I want our questions to be free of logical fallacies and intentionally manipulative framings, even if our sources are not" — the quality gate should filter what sources can't
- Preferred question style: concrete and numerical — "The US spends how much of their budget on the Armed Forces?", "Iran's annual military budget in 2025 was...?" These are trivia-game gold: verifiable, not disputed, satisfying to get right
- User is wary of headline-only analysis — dedup and claim extraction should operate on full article body text

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 77-rss-ingestion-claim-extraction-pipeline*
*Context gathered: 2026-04-09*
