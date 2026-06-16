# Pitfalls Research: v2.5 International Collections — Daily AI News Pipeline

**Project:** Civic Trivia Championship
**Researched:** 2026-04-08
**Focus:** RSS reliability, article fetching, AI claim quality, pool regulation, expiry, deduplication, nonpartisanship, admin review overload, collection muting, topic lifecycle
**Confidence:** MEDIUM — pipeline-specific patterns are reasoning from first principles + ecosystem research; no direct "news trivia pipeline" case studies found at this scale

---

## Critical Pitfalls

Mistakes that cause rewrites or player-facing content failures.

---

### Pitfall 1: RSS Feed Silent Failure — Feed Down Returns Cached Stale Content

**What goes wrong:** Node.js `fetch()` or `rss-parser` resolves successfully (HTTP 200) but the news outlet's CDN is serving a cached copy of yesterday's feed. The pipeline ingests the same 10 articles it already processed, generates no new questions (dedup blocks them), and logs "success." After 3 slow news days this looks like normal operation. After a week the International pool empties silently.

**Why it happens:** RSS CDNs frequently serve stale cached responses without `Cache-Control: no-cache` semantics. The `Last-Modified` and `ETag` headers exist but are often ignored by naive fetch implementations. There is no error to catch — the pipeline genuinely succeeded at fetching, just fetched nothing new.

**Consequences:** Pool drains. Players see fewer than 8 questions available for the International collection. Game picks questions from a tiny pool, repetition spikes, players notice. Because it looks like normal operation in logs, it goes undetected for days.

**Prevention:**
- Always send `If-None-Match` / `If-Modified-Since` headers and treat HTTP 304 as "no new content" (not "error"). Log it distinctly: `{ level: 'info', event: 'rss-not-modified', feed, since }`.
- Compare each ingested article's GUID/link against a `processed_article_urls` table before sending to Claude. If 0 new articles after dedup, emit a `{ level: 'warn', event: 'rss-no-new-articles', feed }` log — not `info`.
- Track a `last_new_article_at` timestamp per feed. If no new content in >48h, emit `{ level: 'warn', event: 'feed-stale', feed, hoursStale }`. Wire this to a Render alert.
- Pool health metric: count active International questions daily and alert if < 20.

**Detection — warning signs:**
- Feed fetch logs show success but `newArticlesIngested: 0` for multiple consecutive runs
- `pool_active_count` for International collection falling steadily
- No `rss-parse-error` events but also no new questions appearing in admin

**Phase:** Pipeline foundation (feed ingestion layer)

---

### Pitfall 2: Malformed RSS XML Crashes the Entire Batch

**What goes wrong:** One feed in the list (say, an international broadcaster's feed) serves XML with illegal UTF-8 sequences, unescaped `&` characters, or CDATA sections containing embedded HTML tags with unescaped `<`. The Node.js XML parser throws a SAXError. If the error bubbles up uncaught, the entire daily batch aborts — all feeds fail, not just the malformed one.

**Why it happens:** `rss-parser` and `node-feedparser` expose per-item SAX errors that resume by default, but a structurally broken document (non-well-formed XML) throws synchronously and kills the parse stream. International news outlets are more likely to have encoding issues (Arabic, Chinese, Cyrillic diacritics mixed with Western charset declarations).

**Consequences:** Entire pipeline batch fails silently or crashes the cron process. Pool receives zero new questions. Because the cron process on Render is shared with `electionDetection` and `expirationSweep`, a crash here can prevent those from running too (depends on `startCron.ts` error handling).

**Prevention:**
- Wrap each feed's fetch+parse in an isolated `try/catch`. Never `await Promise.all([feeds...])` without per-item error isolation. Use `Promise.allSettled()` and log rejections per feed.
- Use `rss-parser`'s `customFields` and set a `defaultRSS` timeout of 10s per feed (not global). `AbortSignal.timeout(10000)` on each individual fetch call.
- Pre-validate: run a quick `Buffer.from(rawXml).toString('utf-8')` pass to strip null bytes before parsing. This catches the most common encoding corruption.
- Log malformed feed errors with the feed URL so it can be removed from the active feed list without taking down the batch.

**Detection — warning signs:**
- `rss-parse-error` log with `fatal: true` occurring on international feed URLs
- Batch completes with `feedsAttempted: 5, feedsSucceeded: 4` — one feed consistently failing

**Phase:** Pipeline foundation (feed ingestion layer)

---

### Pitfall 3: Paywalled Articles Yield Thin Extraction, Claude Generates Hallucinated Questions

**What goes wrong:** BBC, Reuters, AP, and most major international outlets have partial paywalls or metered access. HTTP fetching the article URL returns a truncated preview (typically the first 2–3 paragraphs) rather than the full text. The pipeline passes this thin excerpt to Claude. Claude, trained on the full article from its training data, "helpfully" generates questions that reference facts from the body of the article — facts not present in the excerpt you actually fetched. The question's explanation cites the article URL, but the claim comes from Claude's parametric memory, not the fetched content.

**Why it happens:** Claude cannot distinguish between "I know this because it was in the source text I was given" versus "I know this from my training data." When asked to generate questions from thin content, it draws on training data to fill gaps. This is undetectable at generation time.

**Consequences:** Questions appear to be sourced and cited but are actually hallucinated claims dressed up with a real URL. The `source.url` field points to a real article that does not contain the cited fact. Players who follow the link find no corroboration. Player flags will eventually surface these.

**Prevention:**
- **Content length gate:** If the fetched article body is less than 300 words after extraction (using `@mozilla/readability` + jsdom), do not send to Claude. Log `{ event: 'article-too-short', url, wordCount }` and skip the article. Never send thin excerpts to the generation step.
- **Strict grounding instruction in system prompt:** "Generate questions ONLY about facts explicitly stated in the article text below. Do not use background knowledge. If you cannot generate 3 distinct questions from the provided text alone, return an empty array." This is not foolproof but reduces hallucination rate significantly.
- **Source URL verification in the existing quality rules engine:** The existing `checkLearnMoreLink` async rule already validates URLs. Extend it to confirm the article URL is still reachable (not 404) at the time of question generation. Questions with dead source URLs should be blocked.
- Robots.txt must be checked before fetching any domain. Use a cached robots.txt lookup (cache per domain, TTL 24h) and skip disallowed paths. This is also a legal/ToS risk, not just a technical one.

**Detection — warning signs:**
- Fetched article word count < 300 is a leading indicator
- Player flags on International questions with reason "wrong answer" or "answer not in source"
- `source.url` returns 200 but the article has a login modal in the HTML (detect: look for `<meta name="paywall"` or `class="paywall"` in the HTML)

**Phase:** Article fetching layer; generation prompt engineering

---

### Pitfall 4: Dynamic JS-Rendered Articles Return Empty Body

**What goes wrong:** Some international news sites (particularly regional outlets and government news agencies) render article text via client-side JavaScript. A plain `fetch()` to the article URL returns the HTML shell with empty `<article>` containers. `@mozilla/readability` extracts 0 words of content. The pipeline hits the content-length gate (Pitfall 3) and skips the article — which is correct behavior, but the operator doesn't know it's happening systemically for entire domains.

**Why it happens:** Plain HTTP fetching cannot execute JavaScript. Puppeteer/headless Chrome is the standard workaround but adds significant complexity (binary dependency, memory usage, render latency). This project explicitly avoids paid news APIs — the free alternative is extracting from the RSS feed summary text directly, which is nearly always server-rendered.

**Consequences:** If multiple feeds from the same region all use JS rendering, the International pool gets no coverage from that region, creating geographic blind spots in content. This may not be immediately obvious.

**Prevention:**
- **RSS-body-first strategy:** Most RSS feeds include a `<content:encoded>` or `<description>` field with a meaningful article summary (200–400 words). For international news, use this RSS body as the primary source text rather than fetching the full article. This is server-rendered, always available, and avoids JS rendering and paywall issues entirely.
- **Fallback indicator:** If `fetch()` article body < 300 words but RSS feed summary > 150 words, use the RSS summary as content source. Log which path was used: `{ contentSource: 'rss-summary' | 'full-article' }`.
- **Domain blocklist:** Track which article domains consistently return empty bodies (0 successful full extractions in 10 attempts). Add them to a `rss_feeds` table column `use_summary_only: boolean`. Operator-configurable without code changes.
- Do not add Puppeteer to this pipeline. The maintenance burden and memory overhead on Render are not justified for news trivia content generation.

**Detection — warning signs:**
- `contentSource: 'full-article'` never appearing in logs for a given feed domain
- Consistent `{ event: 'article-too-short', wordCount: 0-50 }` from the same domains

**Phase:** Article fetching layer

---

### Pitfall 5: Correct Answer Changes Before Expiry Date

**What goes wrong:** A question is generated from a breaking news article: "Which country did [leader] visit on [date]?" Answer: "France." Three days later a correction is published — it was Belgium. The question expires in 10 days. For those 10 days, the correct answer in the database is wrong.

A more common version: "Who is the [country]'s foreign minister?" generated from a news article about a diplomatic meeting. The minister resigns 5 days later. The question has a 14-day expiry. For 9 days the correct answer is a former minister.

**Why it happens:** News-sourced questions are derived from a single moment in time. Unlike officeholder questions (which expire when the term ends), news-sourced questions can be invalidated by events at any time between generation and expiry. The existing expiration sweep runs hourly but only archives at the pre-set `expiresAt` — it does not re-check whether the answer is still correct.

**Consequences:** Players answer incorrectly, see "Wrong! The correct answer was X" where X is now factually wrong. Player flags accumulate. When admin investigates, the source URL may already show the correction but the question's explanation still cites the original claim. Trust in the International collection degrades.

**Prevention:**
- **Volatile-topic expiry budget:** Apply a 3-day cap on `expiresAt` for any question derived from articles tagged as volatile (leadership changes, election results, conflict zone updates, sanctions, economic indicators). Apply a 7–14 day expiry for stable policy/diplomatic facts. Document the volatility tiers in the feed configuration.
- **Explanation as source of truth:** The question explanation must cite a verbatim claim from the article (e.g., "According to Reuters, [name] became foreign minister in [month] [year]"). This makes it easy to audit: does the explanation still match the source? The existing `checkLearnMoreLink` rule already checks that the URL is reachable — extend it to detect `<title>` changes (e.g., "CORRECTION:" or "UPDATE:" in article title) as a flag signal.
- **Flag velocity monitoring:** If a question receives 2+ flags within 24h of activation, auto-archive it rather than waiting for the expiry sweep. The existing `flagCount` column on `questions` table supports this — add a flag-velocity check to `expirationSweep.ts` or a separate monitor.
- **No "current leader of" questions with >7-day expiry.** This is a generation prompt rule. Any question whose correct answer is a named individual in a political office should have `expiresAt` set to `NOW + 7 days`, never longer.

**Detection — warning signs:**
- Questions with `flagCount >= 2` AND `status = 'active'` AND `createdAt > NOW - 14 days`
- Player flag reason "wrong answer" on recently-created International questions
- Source article URL title contains "UPDATE" or "CORRECTION"

**Phase:** Generation prompt engineering; expiry configuration; flag-velocity monitor

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or content quality drift.

---

### Pitfall 6: Same News Story From 10 Outlets Generates 10 Near-Identical Questions

**What goes wrong:** A major international event (summit, election, natural disaster) gets covered by every outlet in the RSS feed list. AP files the story; Reuters, BBC, Al Jazeera, and seven others all pick it up with minor rewording. Each article yields a question. The existing semantic dedup (`SemanticDupDetector`, NEAR_DUPLICATE threshold 0.85) catches near-identical question texts — but only within the International collection's existing question set. During a single pipeline run, all 10 questions are generated before any are inserted into the database, so the in-batch dedup check has no prior state to compare against.

**Why it happens:** The `DuplicateDetector` class is a per-session in-memory map. If the pipeline generates questions in batch without loading prior questions into the detector before each new question is checked, in-batch duplicates can slip through.

**Consequences:** 8–10 near-duplicate questions about the same event enter the draft queue simultaneously. Admin review queue floods with near-identical content. Even if most are archived manually, semantic dedup embeddings still cost API calls for each one.

**Prevention:**
- **Story-level deduplication before generation:** Before sending articles to Claude, cluster articles by story using URL domain + headline similarity (MinHash or simple normalized-title Jaccard similarity is sufficient). From each cluster, select the single highest-word-count article (usually the originating AP or Reuters story). Do not send the other articles in the cluster to Claude at all. This is the correct layer to apply dedup — upstream of generation, not downstream.
- **Article URL fingerprint table:** Maintain a `processed_articles` table with columns `(url_hash, headline_hash, processed_at, question_generated)`. Before fetching any article for generation, check against this table. This prevents the same article from being re-processed across pipeline runs, even if the RSS feed re-serves it.
- **In-batch dedup:** Load all existing International question texts into `DuplicateDetector` at the start of each pipeline run. After generating each question, call `detector.add()` before generating the next. This catches in-batch duplicates.

**Detection — warning signs:**
- Multiple questions in the draft queue with identical `source.url` domains and similar question text
- `SemanticDupDetector` flagging clusters of 5+ near-duplicates after a major news event
- Embedding API costs spike on days with single major events

**Phase:** Article clustering layer (upstream of generation)

---

### Pitfall 7: Nonpartisanship Drift via Source Selection and Framing

**What goes wrong:** Claude's existing political bias is well-documented (Anthropic's own "Measuring political bias in Claude" report, 2025). Even with `QUALITY_GUIDELINES` injected at generation time, two subtler failure modes exist in a news pipeline:

**Mode A — Source selection bias:** If the RSS feed list skews toward outlets with a particular editorial position (e.g., all Western, all English-language, all liberal broadsheets), the news *events* selected for question generation will skew toward those outlets' editorial priorities. Questions may systematically cover certain geopolitical frames and ignore others.

**Mode B — Framing inheritance:** Claude generates questions by summarizing claims from articles. If an article frames a policy as "controversial" or a leader as "authoritarian," Claude may inherit that framing in the question text or distractors even without using those exact words. The existing `checkPartisanFraming` rule only catches keyword-level violations — it does not detect inherited framing.

**Why it happens:** The partisan rule (`partisan.ts`) is a keyword list with the comment "this rule needs refinement." It was designed for US civic content, not international geopolitical content. Words that are neutral in US civic context ("extremist," "radical," "authoritarian") may appear legitimately in questions about international politics or may carry loaded framing the keyword list misses entirely.

**Consequences:** International collection develops a consistent geopolitical slant. Players from non-Western countries find the content biased or offensive. Questions about certain countries consistently frame events negatively. This is a long-term trust and brand risk.

**Prevention:**
- **Curated feed list with geographic and editorial diversity:** The RSS feed list must be explicitly designed with balance. Minimum: 2 feeds from non-Western perspectives (e.g., Al Jazeera English, NHK World, India's The Hindu). Document the editorial justification for each feed in the feed configuration.
- **Upgraded partisan check for international content:** Add an international-specific keyword block to `partisan.ts`: include loaded geopolitical framing terms ("authoritarian," "regime," "propaganda," "puppet," "terrorist" used as descriptors without attribution to a specific named party). These should be ADVISORY severity for International questions, triggering human review.
- **Attribution-only framing rule in generation prompt:** Add to `QUALITY_GUIDELINES`: "If an article uses characterizing language (e.g., 'controversial', 'authoritarian', 'radical'), do not inherit this framing in the question. Report only verifiable facts: what happened, when, where, by whom. If the only claims available are characterizations rather than facts, return an empty array."
- **Periodic framing audit:** Every 30 days, pull all International questions and run a batch analysis asking Claude to flag any that use characterizing (rather than factual) framing. This is a meta-audit, not a generation gate.

**Detection — warning signs:**
- Player flags with reason "biased" or "offensive" on International questions
- Questions about certain countries/regions systematically absent or present in the pool
- `checkPartisanFraming` advisory rate much higher for International than for domestic collections

**Phase:** Feed configuration (curation); generation prompt engineering; partisan rule extension

---

### Pitfall 8: Admin Review Queue Overload From Excessive Advisory Flags

**What goes wrong:** The generation pipeline runs daily and produces 15 questions. The existing quality rules engine marks 10 as advisory-only (non-blocking). These go into an admin review queue. Within a week: 70 items. Within a month: 300+ items. The admin (currently a single person based on the project structure) cannot process this queue alongside normal collection management. Unreviewed questions pile up; the International pool never grows because nothing clears the queue. Or, to avoid the backlog, the threshold is relaxed and advisory violations are auto-approved — defeating the purpose of the review gate.

**Why it happens:** The quality rules were designed for batch collection generation (generate 150 questions once, admin reviews over 2–3 days). A daily pipeline changes the math. Advisory violations that are acceptable to defer in a batch context become a perpetual treadmill in a daily context.

**Consequences:** Either the admin is overwhelmed and stops reviewing, or advisory violations are auto-approved and content quality drifts. Both outcomes degrade the International collection.

**Prevention:**
- **Calibrate the pipeline to target ~5 auto-approved questions/day.** This means the generation prompt must produce near-zero advisory violations. International questions must clear all advisory rules to auto-approve, not just blocking rules. The bar should be: if a question would require admin review, it's not good enough to generate.
- **Explicit generation constraint:** Add to `QUALITY_GUIDELINES`: "Neutral, objective language is required. If you cannot phrase a question in purely factual, neutral terms, do not generate it. Err toward omission rather than generating a reviewable question."
- **Advisory promotion for International tier:** Consider making partisan framing BLOCKING (not advisory) for International questions during this pipeline. This reduces advisory queue volume at the cost of slightly lower generation yield. A smaller pool of clean questions is preferable to a large pool of borderline ones.
- **Daily volume cap:** The pipeline should stop generating after 8 auto-approved questions in a single day. Excess volume creates more review burden than value.
- **Review queue visibility metric:** Surface `pending_review_count` on the admin dashboard as a health metric. If it exceeds 20, reduce daily generation until the queue clears.

**Detection — warning signs:**
- `advisory_only` violation count in generation logs trending upward
- Admin review queue growing faster than it is being cleared
- Questions accumulating in `draft` status for >3 days

**Phase:** Generation prompt engineering; admin pipeline UI; quality rules calibration

---

### Pitfall 9: Collection Muting Causes Stale Questions to Survive the Expiry Sweep

**What goes wrong:** The International collection is "muted" (some future admin concept: paused during a crisis or while content is being audited). During the muted period, the hourly `expirationSweep` continues running and archiving questions whose `expiresAt` has passed. When the collection is unmuted, the International question pool is now much smaller (many questions expired while muted) but the `collection_questions` join table still has rows for the expired questions because the expiry sweep correctly set their `status = 'expired'` but did not clean up `collection_questions`. Query result: `/api/game/collections` shows the collection as active with the correct count, but `questionService.ts`'s query (which filters `status = 'active'`) returns fewer questions than the count suggests.

**Why it happens:** The `collection_questions` table is a junction table that does not cascade on question status changes — only on question deletion. When a question expires (status → 'expired'), its `collection_questions` row remains. The `questionService.ts` query already correctly filters by `status = 'active'`, so it doesn't serve expired questions. But the collection metadata count (if cached or computed separately) may reflect total questions rather than active questions.

**Consequences:** Players see a collection advertised as having 50 questions but only 12 are actually active. In the worst case, `questionService.ts` cannot assemble a full 8-question game and falls back silently or throws. The game shows an incomplete session.

**Prevention:**
- Any "muting" mechanism must pause the expiry sweep's replacement generator for that collection, not just hide it from the picker. Replacements still need to run even during mute (or the pool starves worse when unmuted).
- The `/api/game/collections` endpoint should derive its question count from `COUNT(q.id) WHERE q.status = 'active'` joined through `collection_questions` — never from a cached or denormalized count column. Verify this is the case before implementing muting.
- Add a collection readiness check: before serving a collection in the game picker, verify `active_question_count >= 8`. If it falls below 8, flag the collection as needs-review, not just "active." The `audit-collection-readiness.ts` script already warns on low ratios — extend it to enforce a hard minimum.
- Any muting flag should be documented in the schema (e.g., `is_muted` boolean on `collections` table) rather than implemented as a soft mechanism (e.g., setting `is_active = false` and forgetting to re-enable).

**Detection — warning signs:**
- `active_question_count` for International collection below 16 (2x game size) after a mute/unmute cycle
- `questionService.ts` returning fewer than 8 questions for International collection (currently no handling for this edge case — would require investigation)
- `collection_questions` row count diverging significantly from active question count

**Phase:** Pool management; muting implementation (if built); expiry sweep review

---

### Pitfall 10: Topic Sub-Collection Goes Stale but Stays Active

**What goes wrong:** The International collection is subdivided by topic cluster (e.g., "Climate Policy," "Trade & Economics," "Conflict & Security"). The "Trade & Economics" cluster had active coverage in 2026-Q1 but the RSS feeds covering that topic area have gone stale (no new trade news fits the generation criteria). The cluster still exists in the database, still appears as a selectable topic, but hasn't received a new question in 6 weeks. Players who select "Trade & Economics" games see the same 15 questions on rotation every session. Semantic dedup prevents new questions from being generated because they're all near-duplicates of the existing 15.

**Why it happens:** There is no lifecycle management for topic clusters. The existing system creates topics once (via `seed.ts`) and never marks them as stale. The generation pipeline has no visibility into per-topic pool freshness. Semantic dedup is working correctly — it's preventing true duplicates — but the side effect is that a stale cluster becomes un-refreshable without human intervention.

**Consequences:** Players in the "Trade & Economics" cluster experience repetitive gameplay. Engagement metrics for that cluster decline. If the topic cluster is mandatory in game construction (weighted distribution), it degrades all International games, not just topic-specific ones.

**Prevention:**
- **Per-topic freshness tracking:** Add a `last_question_added_at` timestamp to the `topics` table (or to a `collection_topic_stats` view). Track when the most recent question was added per topic per collection.
- **Stale topic detection in the pipeline:** At the end of each pipeline run, log per-topic stats: `{ topic: 'trade-economics', newQuestionsAdded: 0, poolSize: 15, lastAddedDaysAgo: 42 }`. If `newQuestionsAdded: 0` for 14+ consecutive days for a topic with a pool < 30, emit `{ level: 'warn', event: 'topic-cluster-stale' }`.
- **Retirement mechanism:** When a topic cluster's pool has been stable for 30+ days and no new questions can be generated without duplicating existing ones, mark the cluster `is_stale: true`. The game picker should stop weighting stale clusters for question selection and fall back to non-stale clusters.
- **Duplicate threshold relaxation policy:** After 30 days of no new questions, consider raising the semantic dedup threshold from 0.85 to 0.90 for that specific cluster — allowing moderately fresh rephrasing of existing facts. This is a judgment call, not an automatic rule.
- **Feed-to-topic mapping:** Each RSS feed should be tagged with topic clusters it covers. If all feeds for a cluster have been stale for 7 days (no new articles), suppress generation for that cluster entirely rather than generating near-duplicates.

**Detection — warning signs:**
- `topic.last_question_added_at` more than 14 days ago for any active International topic
- Generation pipeline logs showing `allDuplicates: true` for a topic cluster consistently
- Player session diversity dropping for International games (same questions appearing in >40% of recent sessions)

**Phase:** Topic management; pipeline run reporting; pool health monitoring

---

## Minor Pitfalls

Mistakes that are fixable but add friction.

---

### Pitfall 11: HTTP Redirect Chains Break Source URL Storage

**What goes wrong:** The pipeline fetches `https://feeds.reuters.com/story/123` which redirects 3× to `https://www.reuters.com/world/article-slug-2026-04-07/`. The `source.url` field on the question stores the original feed URL (which will 404 in 30 days when the feed item expires), not the canonical article URL. Players who click "Learn More" get a broken link.

**Prevention:**
- Follow all redirects during fetching (default behavior for Node.js `fetch()`). After fetch completes, record `response.url` (the final URL after redirects) as `source.url`, not the original URL requested.
- The existing `checkLearnMoreLink` rule validates the source URL at generation time. Run it against the final URL, not the feed URL.

**Phase:** Article fetching layer

---

### Pitfall 12: Article Encoding Corruption Embeds Garbled Text in Questions

**What goes wrong:** An article from a non-Latin-script news source (Arabic, Japanese, Korean) is fetched. The encoding is declared as UTF-8 but the server sends ISO-8859-1 content. Node.js `fetch()` decodes it as UTF-8, producing mojibake. Claude attempts to generate questions from garbled text and either refuses (best case) or generates questions using the garbled characters in the question text or options (worst case). The question passes structural quality checks (length is fine, options are non-empty) and enters the pool.

**Prevention:**
- Check `Content-Type` response header for charset declaration. If charset is not UTF-8 or UTF-16, use `iconv-lite` to re-decode the buffer with the declared charset before passing to Readability.
- Add a character sanity check to the content extraction layer: if more than 10% of characters in the extracted text are outside the Basic Multilingual Plane or are replacement characters (`\uFFFD`), discard the article and log `{ event: 'encoding-error', url, charset }`.
- The quality rules engine currently has no check for non-ASCII characters in question text. For the initial International pipeline, questions should be English-only (generated from English-language articles). Enforce this in the generation prompt: "All questions must be in English."

**Phase:** Article fetching layer; content extraction

---

### Pitfall 13: Expiry Sweep Fires During Pool-Empty Window

**What goes wrong:** The hourly expiry sweep fires at 3:00 AM and archives 8 questions whose `expiresAt` has passed. The replacement generator (in `expirationSweep.ts`) attempts to generate replacements but the pipeline's daily ingestion hasn't run yet (scheduled for 6:00 AM). The replacement generator has no new source material and generates 0 replacements. From 3:00 AM to 6:00 AM, the International pool is below the 8-question minimum. Any player session started in that window gets an incomplete game.

**Why it happens:** The expiry sweep and the news pipeline run on independent schedules. The existing pipeline for domestic collections avoids this because replacement generation draws from Claude directly using locale config — not from an article source. The news pipeline replacement generator cannot generate without a fresh article.

**Prevention:**
- Schedule the daily news ingestion pipeline to run 2 hours before the expiry sweep. If expiry runs at hourly intervals, run news ingestion at least once per day at a time when the pool will be at its largest (after the previous day's questions are settled).
- Alternatively, maintain a minimum buffer: the pool should always have at least 16 active questions (2× game size). The generation pipeline's daily volume target should maintain this buffer, not just keep up with expiry. If the buffer is below 16 at generation time, the pipeline generates extra questions until the buffer is restored.
- The International pool's replacement generator should not follow the same pattern as `replacementGenerator.ts` (which generates a single replacement per expired question). Instead, the news pipeline replenishes the pool in batch once per day — the sweep just archives, it doesn't attempt to regenerate one-for-one.

**Phase:** Cron scheduling; pool buffer management

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| RSS ingestion layer | Silent stale cache (Pitfall 1) | ETags + per-feed staleness metric |
| Article fetching | Thin paywall content → hallucinated questions (Pitfall 3) | 300-word minimum gate; strict grounding prompt |
| Article fetching | JS-rendered articles (Pitfall 4) | RSS-body-first fallback strategy |
| Generation prompt | Answer changes before expiry (Pitfall 5) | Volatility-tier expiry caps; flag-velocity monitor |
| Deduplication layer | Same story, 10 outlets (Pitfall 6) | Story clustering upstream of generation |
| Generation prompt | Nonpartisanship drift (Pitfall 7) | Feed curation; attribution-only framing rule |
| Admin pipeline UI | Review queue overload (Pitfall 8) | Daily volume cap; advisory → blocking promotion |
| Pool management | Stale cluster → duplicate generation trap (Pitfall 10) | Per-topic freshness tracking; stale retirement |
| Cron scheduling | Expiry sweep outpaces ingestion (Pitfall 13) | Ingestion before sweep; 16-question buffer |

---

## Gaps and Low-Confidence Areas

- **Semantic dedup cost at scale:** The existing `SemanticDupDetector` uses OpenAI embeddings. For 15 articles/day × 3 questions/article = 45 questions/day, embedding costs are trivial. But story-level clustering (Pitfall 6) requires comparing article headlines against each other — this is a different, cheaper operation (Jaccard or SimHash on normalized titles), not embedding-based. LOW confidence on the right clustering approach without testing.

- **Render cron process isolation:** Whether a crash in the news pipeline cron job would propagate to kill `expirationSweep` and `electionDetection` depends on how `startCron.ts` is extended. The current `startCron.ts` registers cron jobs on the same process. This needs explicit error isolation in the implementation. LOW confidence on Render's behavior if the cron process throws unhandled.

- **RSS feed list for International tier:** The specific feeds to include are not part of this research — that is editorial scope. The pitfalls above assume a list of 5–10 international English-language RSS feeds exists. Feed selection itself is a content risk not fully addressed here.

---

*Research completed: 2026-04-08*
