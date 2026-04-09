# Project Research Summary

**Project:** Civic Trivia Championship v2.5 — International Collections
**Domain:** Daily AI-powered news pipeline + international tier for civic trivia
**Researched:** 2026-04-08
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

v2.5 adds a new "International" tier to the collection picker backed by a daily AI news pipeline. The pipeline ingests RSS feeds from curated sources (Tier 1: .gov/UN, Tier 2: BBC/NPR/Guardian/DW), fetches article text using Mozilla Readability, extracts verifiable factual claims via Claude, and stores generated questions as drafts for admin review before activation. The architecture fits cleanly into the existing codebase: one new cron job, one new service directory, two new DB tables plus three new columns on questions, and two new npm packages. Zero new paid APIs are required.

The primary technical risks are not in generation quality but in feed reliability: silent stale cache responses, paywall-truncated articles, and JS-rendered pages that return empty bodies. The recommended mitigation is an RSS-body-first strategy (use the `<content:encoded>` field as primary text rather than fetching the full article URL), which bypasses both paywall and JS-rendering issues.

The most important product risk is admin review queue overload. The daily pipeline must target 5–8 auto-approved questions per collection per day. Quality gates should be calibrated so that questions failing any advisory rule are blocked rather than queued for the International tier — the pipeline should err toward omission. Collection muting is essential for launch: without a well-being opt-out, the product ships potentially distressing news content with no player control.

---

## Key Findings

### Recommended Stack Additions

```bash
npm install feedsmith @mozilla/readability jsdom
```

| Package | Version | Purpose |
|---------|---------|---------|
| `feedsmith` | ^2.8.0 | RSS/Atom/JSON feed parsing with full namespace support. Preferred over `rss-parser` (3 years stale) for international feeds: handles Dublin Core and Media RSS namespaces used by international broadcasters. |
| `@mozilla/readability` | ^0.6.0 | Extracts article body text from arbitrary news HTML without per-site CSS selectors. Exact library used by Firefox Reader View. |
| `jsdom` | ^29.0.2 | Required DOM environment for Readability in Node.js. |

**Verified RSS feeds (2026-04-08):**
- BBC World: `https://feeds.bbci.co.uk/news/world/rss.xml` — confirmed active
- NPR World: `https://feeds.npr.org/1004/rss.xml` — confirmed active
- The Guardian: `https://www.theguardian.com/world/rss` — confirmed active
- DW: `https://rss.dw.com/rdf/rss-en-world` — confirmed active
- Reuters: **no official RSS** (discontinued June 2020) — exclude
- AP News: **no official RSS** — needs alternative sourcing before Phase 2

Feed list must be data-driven (DB or config file) — not hardcoded.

---

### Table Stakes Features

| Feature | Why Required |
|---------|-------------|
| Daily RSS ingestion pipeline with draft generation | Freshness is the entire value proposition of the tier |
| Per-question volatility classification (`fast`/`medium`/`slow`/`stable`) | Single expiry window produces either empty pools or stale facts |
| Admin review queue (draft → active) | Safety gate on AI-generated news content; extends existing queue |
| Pool floor monitoring + admin alert | Pool can drain silently; admin needs warning before players hit empty states |
| International section in collection picker with freshness indicator | Structural separation from Federal/State/City; signals content is live |
| Collection-level Pause (mute) with well-being framing | Without this, distressing news content has no player opt-out |
| Source attribution on questions | Admin must verify claims; players need provenance on controversial answers |
| At least 2 standalone topic collections at launch | A single collection is insufficient to demonstrate the tier |

**Anti-features (do not build in v2.5):** Fully automated publish, question-level muting/keyword filtering, real-time question updates mid-session, infinite pool growth without ceiling.

---

### Architecture Approach

The pipeline is a new service directory (`backend/src/services/international/`) with four files orchestrated by a new cron job.

```
RSS Feeds / HTTP Pages
  → RssIngestor.ts → SourceItem[]
  → ClaimExtractor.ts (Claude) → Claim[]
  → QuestionGenerator (reuses anthropic-client) → ValidatedQuestion[]
  → auditQuestion() (existing, unmodified)
  → SemanticDupDetector (existing, unmodified)
  → INSERT trivia.questions + collection_questions
  → PoolRegulator.ts (archive oldest if count > ceiling)
```

**DB changes required:**
1. `trivia.generation_jobs` — new table (id, collection_slug, status, counts, metadata jsonb)
2. `trivia.user_collection_mutes` — new table (user_id uuid, collection_id FK, compound PK)
3. Three new nullable columns on `trivia.questions`: `fact_snapshot text`, `confidence_tier text`, `generation_job_id integer FK`
4. `CollectionTier` type: extend to `'federal' | 'state' | 'city' | 'international'`
5. `CollectionPicker.tsx`: new `'international'` category; group order `['local', 'international', 'state', 'federal']`

**Cron scheduling:** International pipeline at 02:00 AM Eastern — before the expiry sweep window to replenish the pool before questions expire. Maintain a 16-question buffer minimum.

---

### Top 5 Pitfalls to Avoid

1. **Silent stale RSS cache drains the pool without errors.** RSS CDNs serve cached responses as HTTP 200 with 0 new articles. Prevention: send `If-None-Match`/`If-Modified-Since`; log `warn` when 0 new articles after dedup; alert if stale > 48h; alert admin if active count < 20.

2. **Paywall-truncated articles cause Claude to hallucinate from training data.** Under 300 words causes Claude to fill gaps from parametric memory. Prevention: 300-word minimum gate; RSS-body-first strategy (`<content:encoded>` as primary source); grounding-only prompt ("generate only from the text below").

3. **One malformed XML feed crashes the entire daily batch.** Prevention: per-feed `try/catch` isolation; `Promise.allSettled()` not `Promise.all()`; log offending feed URL.

4. **Admin review queue overload from advisory violations.** Prevention: promote partisan framing from advisory to **blocking** for International questions; cap daily generation at **8 auto-approved questions** per collection per run; surface `pending_review_count` on admin dashboard and throttle if > 20.

5. **Correct answer changes before expiry date.** Prevention: 3-day `expiresAt` cap for any "current leader" questions; flag-velocity monitor auto-archives questions receiving 2+ flags within 24h; detect "UPDATE:" or "CORRECTION:" in source titles as re-review trigger.

---

### Recommended Build Order

| Phase | Name | Depends On |
|-------|------|-----------|
| 1 | DB Foundation + Type System | — |
| 2 | International Locale Config + Scaffold Support | Phase 1 |
| 3 | RSS Ingestion + Claim Extraction Services | Phase 1 |
| 4 | Pipeline Cron Worker + Pool Regulation | Phases 1–3 |
| 5 | Collection Picker + Muting UI | Phase 1 |
| 6 | Admin Visibility Panel | Phases 1, 4 |

Phases 5 and 6 are parallel.

---

### Open Questions Requiring Decisions Before/During Build

1. **Which topics launch at v2.5?** Apply threshold: 40+ distinct questions sustainable for 30+ days with civic/policy dimension. Decide before Phase 2.
2. **AP News sourcing.** No official AP RSS. Options: (a) skip AP; (b) use verified aggregator. Decide before Phase 2.
3. **`expirationSweep.ts` interaction.** Does the existing replacement generator attempt to generate replacements for expired International questions? If yes, add guard: `if (collection.tier === 'international') skip replacement generation`. Investigate before Phase 4.
4. **Story clustering algorithm.** Jaccard similarity on normalized titles is LOW confidence at 15+ feeds. Design as a replaceable function.
5. **Volatility classification calibration.** Monitor `fast`/`medium`/`slow` distribution in first 30 days post-launch.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Package versions verified. Feed URLs confirmed active. Reuters discontinuation confirmed. |
| Features | MEDIUM | Pool management and muting patterns synthesized from analogous systems — no identical news-trivia pipeline case study exists. |
| Architecture | HIGH | Written from direct codebase reading. DB schema, type definitions, and file paths are exact. |
| Pitfalls | MEDIUM | Top 5 pitfalls are concrete and mechanistic. Edge-case pitfalls inferred from first principles. |

**Overall: MEDIUM-HIGH**

---

*Research completed: 2026-04-08*
*Ready for roadmap: yes*
