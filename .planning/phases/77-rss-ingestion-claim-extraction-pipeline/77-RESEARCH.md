# Phase 77: RSS Ingestion + Claim Extraction Pipeline - Research

**Researched:** 2026-04-09
**Domain:** RSS parsing, article extraction, named-entity deduplication, Anthropic structured outputs, Drizzle schema extension
**Confidence:** HIGH — all critical findings verified via direct codebase inspection or official documentation

## Summary

Phase 77 builds a backend pipeline in two sub-plans: (1) `RssIngestor` — fetch and parse four RSS feeds (BBC World, NPR, The Guardian, DW), extract article body text from URLs, apply a 300-word minimum gate, and isolate per-feed errors so bad feeds never abort the batch; (2) `ClaimExtractor + QuestionGenerator` — cluster stories via named-entity overlap within a 24-hour window, call Claude twice per cluster (Call 1: best claim extraction; Call 2: MCQ generation + quality gate), and write passing questions as `active` to the database.

The standard library choices are locked by what is already in the project or by the verified ecosystem leaders: `rss-parser@3.13.0` for feed parsing (needs install), `cheerio@1.2.0` for article body extraction (already installed), `compromise@14.x` for named-entity extraction (recommended — 180 KB, no model download, TypeScript-ready), and the existing `@anthropic-ai/sdk@0.74.0` for Claude calls. Structured outputs (`output_config.format`) are GA in SDK 0.74 and work with `claude-sonnet-4-5`.

Two schema changes are required before the pipeline can write: (1) `ALTER TABLE trivia.generation_jobs ADD COLUMN notes jsonb` and (2) `ALTER TABLE trivia.generation_jobs ADD COLUMN feeds_failed integer NOT NULL DEFAULT 0`, plus a matching `schema.ts` update. The existing `source.url` JSONB field on `trivia.questions` is the correct target for `source_url` — no new column needed. The quality gate decision (CONTEXT: failing = question not created; success criteria: failing = draft status) is a direct contradiction that must be resolved before planning.

**Primary recommendation:** Install `rss-parser`, use `compromise` for NER (no ML model needed), and use Anthropic structured outputs for both Claude calls to get guaranteed JSON. Phase must begin with a DDL step to add `notes` and `feeds_failed` to `generation_jobs`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| rss-parser | 3.13.0 | RSS/Atom feed parsing, custom fields | Only actively maintained lightweight RSS parser for Node; built-in TypeScript generics; supports `content:encoded` via customFields |
| cheerio | 1.2.0 | HTML parsing, body text extraction from article URLs | Already installed in project; jQuery-like API; `$('article, main, .content, body').text()` produces clean plain text |
| compromise | 14.x | Named entity extraction (people, places, orgs) from article body text | 180 KB, no model download, ~1 MB/sec throughput, `.people()` / `.places()` / `.organizations()` API, TypeScript ready |
| @anthropic-ai/sdk | 0.74.0 | Claude API calls (already installed) | Already installed; version 0.74 exports `OutputConfig` and `JSONOutputFormat` — structured outputs are supported |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| p-limit | 7.3.0 | Concurrency limit for article HTTP fetches | Already installed; limit concurrent fetches to avoid overwhelming article servers and hitting rate limits |
| zod | 4.3.6 | Validate structured output JSON from Claude calls | Already installed; use for runtime validation even with structured outputs (defense in depth) |
| drizzle-orm | 0.45.1 | DB writes (generation_jobs, questions, collection_questions) | Already installed; follow existing insert patterns from `replacementGenerator.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| compromise | wink-nlp | wink-nlp has more accurate NER but requires model file download and more setup; compromise is sufficient for "2+ shared named entities" clustering and is zero-config |
| compromise | simple regex (capitalized words) | Regex produces too many false positives (headlines, sentence-starts); compromise gives actual semantic tagging |
| compromise | @extractus/article-extractor | article-extractor is for full article extraction from URL; it overlaps with cheerio but is a separate dependency; since cheerio is already installed, use it directly for text extraction |
| rss-parser | node-feedparser | feedparser uses stream API (more complex), older maintenance pattern, not TypeScript-native |

**Installation:**
```bash
npm install rss-parser compromise
npm install --save-dev @types/rss-parser
```

Note: `compromise` ships its own types — no `@types/compromise` needed.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── scripts/
│   └── international/
│       ├── rss-ingestor.ts           # Plan 77-01: feed fetch, parse, extract, 300-word gate
│       ├── claim-extractor.ts        # Plan 77-02: story dedup, Call 1 (claim extraction)
│       ├── question-generator.ts     # Plan 77-02: Call 2 (MCQ generation + quality gate)
│       └── run-pipeline.ts           # Entry point: orchestrates 77-01 + 77-02 per collection
```

This mirrors the existing pattern: `scripts/content-generation/` has a main orchestrator (`generate-locale-questions.ts`), a client (`anthropic-client.ts`), and utilities. The international pipeline should be a peer directory, not mixed into the domestic generation path.

### Pattern 1: Per-Feed Error Isolation (try/catch per feed)
**What:** Wrap each feed fetch+parse in its own try/catch. Collect results and errors independently, never let one feed's failure propagate.
**When to use:** Always — this is success criterion 1.

```typescript
// Source: direct codebase pattern from replacementGenerator.ts error handling
interface FeedResult {
  feedUrl: string;
  articles: ParsedArticle[];
  error?: string;
}

async function fetchAllFeeds(feedUrls: string[]): Promise<FeedResult[]> {
  return Promise.all(
    feedUrls.map(async (url) => {
      try {
        const articles = await fetchAndParseFeed(url);
        return { feedUrl: url, articles };
      } catch (err) {
        console.log(`[RssIngestor] Feed failed: ${url} — ${err instanceof Error ? err.message : String(err)}`);
        return { feedUrl: url, articles: [], error: err instanceof Error ? err.message : String(err) };
      }
    })
  );
}
```

### Pattern 2: rss-parser with content:encoded custom field
**What:** Configure rss-parser to capture `content:encoded` (partial HTML article text included in some feeds) in addition to standard fields.
**When to use:** BBC World does NOT include `content:encoded`; NPR includes a partial excerpt in `content:encoded`. Always configure it; fall back to HTTP fetch for body text.

```typescript
// Source: rss-parser GitHub README (verified)
import Parser from 'rss-parser';

type CustomItem = {
  'content:encoded'?: string;
};

const parser = new Parser<Record<string, never>, CustomItem>({
  customFields: {
    item: [['content:encoded', 'content:encoded']],
  },
  timeout: 10000,  // 10 second timeout per feed
  headers: { 'User-Agent': 'CivicTriviaBot/1.0' },
});

const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
// Each item: { title, link, pubDate, guid, description, 'content:encoded'? }
```

### Pattern 3: Article Body Extraction via cheerio + native fetch
**What:** Fetch the article URL, load HTML with cheerio, extract text from article/main/body selectors in priority order.
**When to use:** When `content:encoded` is absent or < 300 words. Applied after RSS parse.

```typescript
// Source: cheerio.js.org docs (verified) + codebase pattern
import * as cheerio from 'cheerio';

async function extractArticleText(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CivicTriviaBot/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  // Try article content selectors in priority order
  for (const selector of ['article', 'main', '[class*="article"]', '[class*="content"]', 'body']) {
    const text = $(selector).text().replace(/\s+/g, ' ').trim();
    if (text.length > 200) return text;
  }
  return null;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
```

### Pattern 4: Named-Entity Deduplication with compromise
**What:** Extract proper nouns/entities from article body text, then cluster articles within a 24-hour window that share 2+ named entities.
**When to use:** After all articles are fetched and body text extracted; before any Claude call.

```typescript
// Source: compromise GitHub README (verified)
import nlp from 'compromise';

function extractNamedEntities(text: string): Set<string> {
  const doc = nlp(text);
  const entities = new Set<string>();

  // Extract people, places, organizations — normalize to lowercase for comparison
  for (const person of doc.people().out('array') as string[]) {
    entities.add(person.toLowerCase().trim());
  }
  for (const place of doc.places().out('array') as string[]) {
    entities.add(place.toLowerCase().trim());
  }
  for (const org of doc.organizations().out('array') as string[]) {
    entities.add(org.toLowerCase().trim());
  }

  return entities;
}

function articlesShareEntities(a: Set<string>, b: Set<string>, threshold = 2): boolean {
  let shared = 0;
  for (const entity of a) {
    if (b.has(entity)) {
      shared++;
      if (shared >= threshold) return true;
    }
  }
  return false;
}
```

### Pattern 5: Anthropic Structured Outputs for Claude Calls
**What:** Use `output_config.format` (GA in SDK 0.74) for both Call 1 and Call 2 to get guaranteed JSON from Claude — no `JSON.parse()` retry loop needed.
**When to use:** Both Claude calls in this pipeline.

```typescript
// Source: Anthropic official docs — platform.claude.com/docs/en/build-with-claude/structured-outputs (verified)
import { client, MODEL } from '../content-generation/anthropic-client.js';

// Call 1: Claim Extraction
const call1Response = await client.messages.create({
  model: MODEL,
  max_tokens: 1024,
  system: CLAIM_EXTRACTION_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: articleBodiesText }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          fact_snapshot: { type: 'string' },
          confidence_tier: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['claim', 'fact_snapshot', 'confidence_tier'],
        additionalProperties: false,
      },
    },
  },
});

const textBlock = call1Response.content.find((b) => b.type === 'text');
const claim = JSON.parse(textBlock!.text);  // guaranteed valid JSON
```

### Pattern 6: Two-Call Architecture
**What:** Call 1 receives article bodies, returns claim + fact_snapshot + confidence_tier. Call 2 receives the claim, returns MCQ questions + quality gate assessments.
**When to use:** Per-cluster. Skip Call 2 if confidence_tier === 'low'.

```typescript
// Call 2: Question Generation + Quality Gate
const call2Schema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          correctAnswer: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          quality_gate: {
            type: 'object',
            properties: {
              passed: { type: 'boolean' },
              reason: { type: 'string' },
            },
            required: ['passed', 'reason'],
            additionalProperties: false,
          },
        },
        required: ['text', 'options', 'correctAnswer', 'explanation', 'difficulty', 'quality_gate'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};
```

### Pattern 7: DB Write — questions + collection_questions + generation_jobs
**What:** Follow the exact pattern from `replacementGenerator.ts` for question inserts.
**When to use:** After a question passes quality gate.

```typescript
// Source: backend/src/cron/replacementGenerator.ts (direct inspection)
// Questions insert:
const inserted = await db
  .insert(questionsTable)
  .values({
    externalId: generatedExternalId,
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    topicId,
    subcategory: 'world-news',
    source: { name: feedName, url: articleUrl },
    factSnapshot: claim.fact_snapshot,
    confidenceTier: claim.confidence_tier,
    generationJobId: jobId,
    status: 'active',
    expirationHistory: [],
  })
  .onConflictDoNothing()
  .returning({ id: questionsTable.id });

// collection_questions insert (required — questions won't appear in game without it):
await db
  .insert(collectionQuestions)
  .values({ collectionId, questionId: inserted[0].id })
  .onConflictDoNothing();
```

### Pattern 8: generation_jobs Record with notes Field
**What:** Create a job record at pipeline start, update it at end with per-feed stats in the `notes` JSONB field. The `notes` and `feeds_failed` columns do NOT yet exist in `schema.ts` — this phase must add them via DDL.
**When to use:** Beginning and end of each pipeline run.

```typescript
// Schema extension required — add to generation_jobs in schema.ts:
// notes: jsonb('notes').$type<GenerationJobNotes>(),
// feedsFailed: integer('feeds_failed').notNull().default(0),

interface GenerationJobNotes {
  feedStats: Array<{
    feedUrl: string;
    articlesFound: number;
    clustersFormed: number;
    questionsGenerated: number;
    questionsBlocked: number;
    blockReasons: string[];
    error?: string;
  }>;
}
```

### Anti-Patterns to Avoid
- **Using `BatchSchema.parse()` for international questions:** The existing `BatchSchema` enforces `externalId` regex pattern `/^[a-z]{2,5}-\d{3}$/` and expects 15–30 questions. International questions have different external IDs and single-question generation. Use Zod schemas tailored for international, not the domestic `BatchSchema`.
- **Running `generate-locale-questions.ts` flow for international:** The domestic generation script loads locale configs and generates in batches from source documents. International uses RSS feeds and a completely different two-call Claude architecture. New service files are required.
- **Fetching articles sequentially:** HTTP fetches for article bodies will dominate wall time. Use `p-limit` (already installed) to fan out concurrently but cap at 5 concurrent article fetches to avoid overwhelming servers.
- **Skipping `collection_questions` insert:** Per project memory, questions won't appear in the game without rows in `collection_questions`. The activate script does not populate this table — the pipeline must insert directly after each question insert.
- **Using `seed.ts` or `activate-collection.ts` for schema changes:** These scripts hang. All DDL must go through Supabase MCP SQL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS feed parsing | Custom XML parser | rss-parser | Handles malformed XML, Atom vs RSS 2.0 differences, encoding, date normalization |
| Named entity extraction | Regex for capitalized words | compromise | Regex matches sentence-starts, proper nouns in headings falsely; compromise gives semantic tagging (person vs place vs org) |
| JSON-guaranteed Claude responses | Retry loop on JSON.parse failure | `output_config.format: {type: 'json_schema'}` | SDK 0.74 supports structured outputs GA — no retries needed, no `jsonMatch` hack |
| Article word count | Custom tokenizer | `text.split(/\s+/).filter(Boolean).length` | Simple and sufficient; this is a gate, not a display metric |
| HTML-to-text | Custom regex stripping tags | `cheerio $('article').text()` | Cheerio handles nested elements, whitespace normalization, script/style exclusion automatically |

**Key insight:** This project already uses cheerio (1.2.0) and the Anthropic SDK (0.74.0) for other purposes. The only net-new library is `rss-parser` (and optionally `compromise`). Keep the install surface minimal.

## Common Pitfalls

### Pitfall 1: RSS Feeds Don't Include Full Article Text
**What goes wrong:** The pipeline sends only RSS description/snippet to Claude for claim extraction. BBC World in particular provides only a single-sentence description — not enough for reliable claim extraction.
**Why it happens:** BBC's RSS feed is explicitly "headline-only" — no `content:encoded`, description is ~20 words. NPR includes a partial `content:encoded` excerpt but not full text. Guardian and DW behavior is similar.
**How to avoid:** For every article, attempt HTTP fetch to extract article body via cheerio FIRST. Only fall back to `content:encoded` or `description` if the HTTP fetch fails or returns < 300 words. The 300-word gate applies to the best available text, not just the RSS excerpt.
**Warning signs:** Claude Call 1 returns low-confidence claims for BBC articles; claim text closely mirrors the headline rather than body content.

### Pitfall 2: Quality Gate Decision — draft vs not-created
**What goes wrong:** The CONTEXT.md says failing quality gate = question NOT created. Success criterion 4 says failing partisan framing = `draft` status. These are contradictory.
**Why it happens:** The success criteria appears to have been drafted before the CONTEXT decision was locked.
**How to avoid:** The planner must decide before writing Task 2. Recommendation: follow CONTEXT.md (questions failing quality gate are NOT created and are only logged). If the plan implements `draft` routing for monitoring, that is a deliberate deviation from CONTEXT.md that must be explicitly documented. Query status observable in the DB is `active` (passing) vs absent (failing).
**Warning signs:** Plan writes blocked questions as `draft` without explicitly acknowledging the CONTEXT contradiction.

### Pitfall 3: generation_jobs Missing notes and feeds_failed Columns
**What goes wrong:** The pipeline tries to write `notes` JSON and `feeds_failed` count to `generation_jobs`, but these columns don't exist in the current schema (confirmed by inspection of `schema.ts` lines 73–82).
**Why it happens:** Phase 75 created `generation_jobs` with 6 columns: id, collection_slug, status, questions_generated, questions_flagged, questions_activated, timestamps. The CONTEXT.md requirements for `notes` JSONB and `feeds_failed` integer were not part of Phase 75's scope.
**How to avoid:** Phase 77 Plan 01 must begin with a DDL step: `ALTER TABLE trivia.generation_jobs ADD COLUMN IF NOT EXISTS notes jsonb; ALTER TABLE trivia.generation_jobs ADD COLUMN IF NOT EXISTS feeds_failed integer NOT NULL DEFAULT 0;` — and update `schema.ts` to match before any pipeline code references these columns.
**Warning signs:** TypeScript error `Property 'notes' does not exist on type 'GenerationJob'` or Postgres error `column "notes" does not exist`.

### Pitfall 4: External ID Allocation for International Questions
**What goes wrong:** International questions don't follow the `{prefix}-\d{3}` pattern enforced by the existing `QuestionSchema`. Using the domestic external ID format will work syntactically but confusingly, as international questions can accumulate rapidly.
**Why it happens:** The domestic system assigns IDs like `bxl-001` through `bxl-NNN` based on `getNextExternalId()` querying max numeric suffix. If hundreds of international questions are generated, the 3-digit suffix format overflows visually (though not technically — PostgreSQL handles any integer).
**How to avoid:** Use the same `getNextExternalId()` pattern from `replacementGenerator.ts`, but allow 4-digit suffixes for international prefixes. The existing regex in `QuestionSchema` (`/^[a-z]{2,5}-\d{3}$/`) enforces exactly 3 digits — international questions should either use a custom schema or use zero-padded 4-digit IDs and NOT validate against `QuestionSchema`.
**Warning signs:** Zod validation error `externalId must match pattern like "bli-001"` for international IDs like `wrld-0001`.

### Pitfall 5: 24-Hour Window Implementation
**What goes wrong:** Articles from the same event published across feeds at different times get silently missed by the clustering window.
**Why it happens:** BBC may publish 6 hours before NPR picks up the same story. If the clustering window is defined as `pubDate within X hours of now` rather than `pubDate within X hours of each other`, articles are missed.
**How to avoid:** Cluster by `pubDate` proximity to each other (not to now). Two articles are in the same window if `abs(pubDateA - pubDateB) <= 24h`. Build the window from the earliest article's `pubDate`.
**Warning signs:** Stories covered by 3 feeds produce only 1-article clusters because pubDate spread exceeds window.

### Pitfall 6: compromise Proper Noun False Positives
**What goes wrong:** Compromise extracts too many low-quality entities (short words, common nouns misidentified), causing false clustering of unrelated stories.
**Why it happens:** "Iran" and "Iran" from two different stories genuinely match. But "House" (legislation) and "House" (building) both appear as entities.
**How to avoid:** Filter entities to minimum 3 characters; filter out stop-list words that compromise misclassifies. Apply a minimum entity length of 3 chars and ignore single-word entities that are generic nouns. The 2-entity threshold is the primary guard.
**Warning signs:** Unrelated stories cluster together because they share common entities like "Washington" or "United States".

## Code Examples

### rss-parser TypeScript with custom fields
```typescript
// Source: rss-parser GitHub README (verified via WebFetch)
import Parser from 'rss-parser';

type CustomItem = {
  'content:encoded'?: string;
  'media:thumbnail'?: { $: { url: string } };
};

const parser = new Parser<Record<string, never>, CustomItem>({
  customFields: {
    item: [['content:encoded', 'content:encoded']],
  },
  timeout: 10000,
  headers: { 'User-Agent': 'CivicTriviaBot/1.0' },
});

try {
  const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
  for (const item of feed.items) {
    const inFeedText = item['content:encoded'] || item.description || '';
    // item.link, item.pubDate, item.title, item.guid all available
  }
} catch (err) {
  // Network error, malformed XML — catch here, log, continue to next feed
}
```

### compromise named-entity extraction
```typescript
// Source: compromise GitHub README (verified via WebFetch)
import nlp from 'compromise';

function extractEntities(text: string): Set<string> {
  const doc = nlp(text);
  const result = new Set<string>();
  const addEntities = (arr: string[]) => {
    for (const e of arr) {
      const normalized = e.toLowerCase().trim();
      if (normalized.length >= 3) result.add(normalized);
    }
  };
  addEntities(doc.people().out('array') as string[]);
  addEntities(doc.places().out('array') as string[]);
  addEntities(doc.organizations().out('array') as string[]);
  return result;
}
```

### Anthropic structured output (GA, SDK 0.74)
```typescript
// Source: Anthropic official docs — platform.claude.com/docs/en/build-with-claude/structured-outputs (verified)
// output_config.format is supported in installed SDK 0.74.0 (confirmed via messages.d.ts line 1059)

const response = await client.messages.create({
  model: MODEL,
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          fact_snapshot: { type: 'string' },
          confidence_tier: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['claim', 'fact_snapshot', 'confidence_tier'],
        additionalProperties: false,
      },
    },
  },
});

// response.content[0].text is guaranteed valid JSON matching the schema
const parsed = JSON.parse(response.content[0].text);
```

### generation_jobs DDL extension (required for Phase 77)
```sql
-- Run via Supabase MCP SQL before any pipeline code runs
ALTER TABLE trivia.generation_jobs
  ADD COLUMN IF NOT EXISTS notes jsonb,
  ADD COLUMN IF NOT EXISTS feeds_failed integer NOT NULL DEFAULT 0;
```

```typescript
// schema.ts addition — add to generationJobs table definition:
notes: jsonb('notes').$type<{
  feedStats: Array<{
    feedUrl: string;
    articlesFound: number;
    clustersFormed: number;
    questionsGenerated: number;
    questionsBlocked: number;
    blockReasons: string[];
    error?: string;
  }>;
}>(),
feedsFailed: integer('feeds_failed').notNull().default(0),
```

### Log format (from CONTEXT.md)
```typescript
// Human-readable progress log per feed (as specified in CONTEXT.md)
console.log(`[BBC World] 12 articles → 4 clusters after dedup → 3 questions generated (1 blocked: partisan framing)`);

// generation_jobs.notes stores the machine-readable version of the same data
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse + retry loop for Claude responses | `output_config.format: {type: 'json_schema'}` structured outputs | Nov 2025 (GA) | No parse failures, no retry logic needed for malformed JSON |
| `output_format` (beta parameter) | `output_config.format` (GA parameter) | Nov 2025 beta → GA | Old `output_format` still works but is deprecated; use `output_config.format` in new code |
| `content:encoded` always available in news RSS | Feed-by-feed variation | Ongoing | BBC World has no `content:encoded`; NPR has partial excerpt; must always HTTP-fetch for full body |

**Deprecated/outdated:**
- `output_format` parameter in Anthropic SDK: deprecated in favor of `output_config.format`. Still works but will be removed in a future version.
- Using `BatchSchema.parse()` for international questions: `BatchSchema` expects 15–30 questions and the domestic `externalId` format. Not appropriate for single-question-per-cluster international generation.

## Open Questions

1. **Quality gate: not-created vs draft status**
   - What we know: CONTEXT.md is unambiguous — questions failing quality gate are NOT created; reason is logged but question record is never inserted. Success criterion 4 says they are saved as `draft`.
   - What's unclear: Which is authoritative?
   - Recommendation: Planner should treat CONTEXT.md as authoritative (not-created). If the PM wants draft routing for visibility, that is a scope addition that needs explicit acknowledgment. The planner should note this contradiction and default to CONTEXT behavior.

2. **source_url on questions — existing field vs new column**
   - What we know: Success criterion 5 says "`source_url` points to the originating article URL." The existing `trivia.questions.source` field is `jsonb {name: string, url: string}`. There is no standalone `source_url` column.
   - What's unclear: Whether "source_url" in the success criteria means a new dedicated column or the existing `source.url` JSON field.
   - Recommendation: Use the existing `source.url` inside the `source` JSONB field — this is the established pattern and is what `replacementGenerator.ts` uses (`source: { name: feedName, url: articleUrl }`). No new column needed. Plan tasks should verify this interpretation.

3. **external_id format for international questions**
   - What we know: The international collection will have an `externalIdPrefix` (e.g., `wrld` for a global news collection). The existing `QuestionSchema` regex enforces exactly 3 digits (`/^[a-z]{2,5}-\d{3}$/`). With potentially hundreds of international questions per run cycle, 3-digit IDs may exhaust quickly.
   - What's unclear: Should international questions use 4-digit suffixes (requires custom schema/skip QuestionSchema validation), or is the 3-digit pattern intentionally reused?
   - Recommendation: International questions should NOT go through `BatchSchema` or `QuestionSchema` (domestic schemas). Define a new `InternationalQuestionSchema` in `src/scripts/international/` that uses a flexible `externalId` pattern. This avoids polluting the domestic schema with international concerns.

4. **BBC World and Guardian article paywall/robot blocking**
   - What we know: BBC World articles are publicly accessible (confirmed by WebFetch). Guardian articles blocked our WebFetch call (HTTP error). DW articles also blocked.
   - What's unclear: Whether Guardian and DW block automated HTTP fetches in production or whether the block is specific to our test environment.
   - Recommendation: Implement the article fetch with a realistic User-Agent header and a polite delay. If the article fetch fails (403, redirect to paywall), fall back gracefully to `content:encoded` or `description` from the RSS feed. The 300-word gate will naturally filter out insufficient excerpts, causing those articles to be skipped (logged). This is acceptable behavior and avoids any terms-of-service issue.

5. **collection_id for the international news collection**
   - What we know: The pipeline must write to `trivia.collection_questions` with a `collectionId`. This phase (77) is the pipeline only — Phase 79 is collection launch.
   - What's unclear: Whether Phase 77 should be written to work with a hardcoded collection slug (e.g., `world-news`) that Phase 79 will later activate, or whether it should take `collectionSlug` as a runtime parameter.
   - Recommendation: Accept `collectionSlug` as a parameter (not hardcoded). This matches the pattern from `generate-locale-questions.ts` (`--locale` flag) and `replacementGenerator.ts` (receives `collectionSlug`). Phase 79 activates the collection; Phase 77 writes questions to whatever slug is passed.

## Sources

### Primary (HIGH confidence)
- `backend/src/db/schema.ts` — direct inspection; `generationJobs` table definition (lines 73–82), `questions` table with `factSnapshot`, `confidenceTier`, `generationJobId` columns (lines 122–124), `source` JSONB field (lines 97–100)
- `backend/src/cron/replacementGenerator.ts` — direct inspection; DB insert pattern, `getNextExternalId`, per-feed error handling model
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — direct inspection; Anthropic call pattern, JSON extraction via `responseText.match(/\{[\s\S]*\}/)` (to be replaced with structured outputs)
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — direct inspection; `InternationalLocaleConfig` interface (lines 38–49)
- `backend/node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts` — direct inspection; `OutputConfig` (line 415), `JSONOutputFormat` (line 252), `MessageCreateParams.output_config` (line 1059)
- Anthropic official docs — `platform.claude.com/docs/en/build-with-claude/structured-outputs` — structured outputs GA, `output_config.format` TypeScript example
- `backend/package.json` — cheerio 1.2.0 already installed; p-limit 7.3.0 already installed; rss-parser NOT installed

### Secondary (MEDIUM confidence)
- rss-parser GitHub README — `customFields` API for `content:encoded`, TypeScript generics, `timeout` option (verified via WebFetch)
- compromise GitHub README — `.people()`, `.places()`, `.organizations()`, `.out('array')` API (verified via WebFetch)
- WebFetch of `https://feeds.bbci.co.uk/news/world/rss.xml` — confirmed BBC World has no `content:encoded`, description only (1 sentence)
- WebFetch of `https://feeds.npr.org/1001/rss.xml` — confirmed NPR includes `content:encoded` with partial HTML excerpt
- cheerio.js.org/docs/basics/loading/ — `.text()` extraction from `$('body')` confirmed

### Tertiary (LOW confidence)
- Guardian and DW RSS feed content structure — WebFetch blocked; assumed similar to BBC/NPR based on industry norms for news RSS (HTTP fetch required for full body text)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — cheerio confirmed installed; @anthropic-ai/sdk 0.74 confirmed with OutputConfig support; rss-parser confirmed NOT installed; compromise API verified from official GitHub README
- Architecture: HIGH — all patterns derived from existing codebase inspection (replacementGenerator.ts, generate-locale-questions.ts) and official docs
- Pitfalls: HIGH — quality gate contradiction documented from CONTEXT vs success criteria; generation_jobs schema gap confirmed from direct schema.ts inspection; BBC World body text absence confirmed from live RSS fetch
- Feed content structure: MEDIUM — BBC and NPR confirmed via live fetch; Guardian and DW not directly confirmed (WebFetch blocked)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain; 30-day validity appropriate)
