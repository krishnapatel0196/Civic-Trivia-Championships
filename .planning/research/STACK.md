# Stack Research: v1.7 Live Civic Intelligence

**Project:** Civic Trivia Championship
**Researched:** 2026-02-25
**Focus:** Election data sourcing, scheduling, UK civic data for Norwich

---

## Summary Recommendation

**US local elections:** No reliable free API exists for city-level candidate data. The practical approach for v1.7 is **admin-entered race data** (as the Architecture doc concludes), with the election pipeline ready to accept automated scraping when a data source is chosen. Ballotpedia is the gold standard but paid.

**UK elections:** Democracy Club is a **free, open API** with comprehensive candidate data for all UK local elections. Ideal for Norwich.

**Scheduling:** node-cron is already installed and running. No new dependency needed.

---

## US Election Data Sources

### Option Comparison

| Source | Coverage | Cost | Local elections | Candidate data | Status |
|--------|----------|------|----------------|----------------|--------|
| **Ballotpedia API** | Comprehensive, 31 states for 2026 | Paid subscription (contact data@ballotpedia.org) | ✓ City/county level | ✓ Name, party, incumbency, election date | Active |
| **Google Civic Information API** | Federal/state representatives | Free with API key | ✗ Representatives API deprecated April 2025 | ✗ Candidate data removed | Partially deprecated |
| **Democracy Works Elections API** | Federal, state, county, municipal (>5k population) | Paid (contact for pricing) | ✓ | Limited — election dates and ballot info, not full candidate lists | Active |
| **OpenStates** | State legislature only | Free tier | ✗ No local elections | ✗ | Active but wrong scope |
| **County/state portals (scraped)** | Jurisdiction-specific | Free | ✓ Best coverage | ✓ Official source | Fragile HTML |

### Recommendation: Admin Entry for v1.7, Ballotpedia for v1.8+

County election portals (acvote.alamedacountyca.gov for Fremont, etc.) are the authoritative source but have no structured API — only HTML pages. Scraping them is brittle (structure changes with each election cycle).

**For v1.7:** Admin manually enters race data into `election_races` table. The generation pipeline is built to consume this data. This delivers the full election question lifecycle without the fragility of web scraping.

**For v1.8+:** Evaluate Ballotpedia's paid API or build targeted scrapers for specific county portals. The pipeline architecture already supports this — scraping just populates `election_races`.

**Key finding:** Alameda County (Fremont) has a 2026 Direct Primary scheduled for June 2, 2026. The candidate filing period is currently open. Official data is at acvote.alamedacountyca.gov.

---

## UK Election Data Sources

### Democracy Club — Recommended ✓

**URL:** https://democracyclub.org.uk / https://candidates.democracyclub.org.uk

- **Cost:** Free (open data, Creative Commons license)
- **Coverage:** Every UK election from district council level upward
- **Data:** Candidate name, party, ward/constituency, election date, result (after election)
- **API:** REST API available, plus free CSV downloads
- **2025 elections:** Full data for May 2025 local elections already available
- **Norwich:** Norwich City Council elections are covered (13 wards, 3 councillors each)
- **Norfolk County Council elections:** Also covered (separate from City Council)

**Elections API endpoint:**
```
GET https://elections.democracyclub.org.uk/api/elections/?current=true&format=json
GET https://candidates.democracyclub.org.uk/api/people/?format=json&election_id=local.norwich.2026-05-07
```

**No API key required for read access.** Rate limiting applies (standard REST API).

### Electoral Commission UK
- **URL:** https://www.electoralcommission.org.uk
- **Data:** Election dates, registration deadlines, general election guidance
- **Not a candidate database** — for election calendar/dates only

### Recommendation for Norwich
Use Democracy Club for:
1. Confirming Norwich City Council election dates
2. Sourcing candidate data when generating election questions for Norwich collection
3. Finding councillor names for non-election civic questions ("Who is the councillor for [ward]?")

---

## Scheduling

### No New Dependencies Needed

`node-cron` is already installed and running the hourly expiration sweep. Adding a daily election detection job is a one-line addition to `startCron.ts` (see ARCHITECTURE.md).

```typescript
cron.schedule('0 6 * * *', async () => {
  await runElectionDetection();
});
```

**Frequency decision:** Daily at 6 AM. Election data doesn't change hourly; daily is sufficient to detect races entering the 60-day generation window.

---

## Anti-Recommendations

| What | Why Not |
|------|---------|
| **Google Civic Information API (representatives)** | Deprecated April 2025. Elections API still works but doesn't provide candidate lists |
| **OpenStates** | State legislature only, not city council elections |
| **Playwright/Puppeteer for county scraping** | Heavy dependency (Chromium), complex maintenance, breaks on HTML changes. If scraping needed, use `cheerio` (HTML parsing) with `axios` (HTTP) — both lightweight |
| **pgvector or vector DB for election data** | Not needed — election races are structured relational data, not embeddings |
| **Paid election data subscription for v1.7** | Budget-inefficient when admin entry achieves the same result for initial build |

---

## Summary: New Dependencies for v1.7

| Dependency | Version | Purpose | Required? |
|------------|---------|---------|-----------|
| **No new npm packages required** | — | node-cron, axios/fetch already present | — |
| Democracy Club API | REST, no key | UK election candidates for Norwich | For Norwich election questions |
| Ballotpedia (optional) | Paid | US local candidate data | v1.8+ consideration |

**v1.7 needs zero new npm packages.** The election pipeline uses existing infrastructure: node-cron (scheduling), PostgreSQL (election_races table), Claude SDK (generation), Drizzle ORM (schema).

---

*Research completed: 2026-02-25*

---
---

# Stack Research: v2.5 International Collections — News Pipeline

**Project:** Civic Trivia Championship
**Researched:** 2026-04-08
**Focus:** RSS ingestion, article content extraction, news pipeline additions only

---

## Context: What Already Exists (Do Not Re-add)

Before recommending new packages, audit of the existing `backend/package.json` confirmed:

| Capability | Already Present | Package |
|------------|----------------|---------|
| HTTP requests | Yes — Node.js built-in `fetch` (stable since Node 21) | Native, no package |
| HTML parsing | Yes | `cheerio ^1.2.0` |
| Concurrency control | Yes | `p-limit ^7.3.0` |
| Scheduled jobs | Yes | `node-cron ^4.2.1` |
| AI generation | Yes | `@anthropic-ai/sdk ^0.74.0` (dev dep, used in scripts) |
| Database ORM | Yes | `drizzle-orm ^0.45.1` |
| TypeScript | Yes | `typescript ^5.3.3` |

The existing `fetch-sources.ts` already implements the HTTP + Cheerio pattern for article text extraction. The news pipeline will extend this pattern, not replace it.

**The project uses `"type": "module"` (ESM).** All new packages must support ESM imports or ship as dual CJS/ESM.

---

## New Capabilities Needed

| Capability | Status | Solution |
|------------|--------|----------|
| RSS/Atom feed parsing | Not present | Add `feedsmith` |
| Full article text extraction from news URLs | Partially present (Cheerio selector stripping in fetch-sources.ts) | Upgrade with `@mozilla/readability` + `jsdom` for news articles |

Only two new packages are needed.

---

## Recommended New Packages

### 1. feedsmith — RSS/Atom Feed Parser

**Install:** `npm install feedsmith`
**Current stable version:** 2.8.0 (published approximately 7 days before this research date; actively maintained)
**TypeScript:** Full TypeScript built-in, no `@types/` package needed
**Module support:** Dual CJS/ESM — compatible with the project's `"type": "module"` config
**Node.js requirement:** 14.0.0+

**Why feedsmith over rss-parser:**

`rss-parser` (v3.13.0) is the incumbent choice — widely used with 472+ dependents, stable, built-in TypeScript types. But it has not been updated in ~3 years. For an international news pipeline, namespace fidelity matters: `rss-parser` normalizes fields by merging `author`, `dc:creator`, and `creator` into a single property, and conflates date fields in ways that obscure source structure. International feeds (BBC World, Guardian, Al Jazeera, DW) use Dublin Core and Media RSS namespaces extensively.

`feedsmith` preserves the original feed structure exactly, benchmarks 4–5x faster than `rss-parser`, supports RSS 0.9x/2.0, Atom 0.3/1.0, RDF 0.9/1.0, JSON Feed 1.0/1.1, and 20+ namespaces (Dublin Core, iTunes, Media RSS, Podcast Index). It shipped its v2.8.0 release days before this research was completed, and DIYgod (creator of RSSHub, one of the most production-tested RSS platforms in existence) has publicly endorsed switching to it. The 2000+ test suite with 99% code coverage is a credibility signal for a library that parses real-world feeds.

The tradeoff: feedsmith is younger than rss-parser (~1 year vs 7+ years). For a pipeline built fresh for v2.5, the recency and correctness advantages outweigh the incumbency advantage.

**Basic usage:**

```typescript
import { parseFeed } from 'feedsmith';

const result = parseFeed(xmlString);
// result.type is 'rss' | 'atom' | 'rdf' | 'json'
// result.feed contains the parsed feed
const items = result.feed.items ?? [];
```

**Source:** https://feedsmith.dev/ — https://github.com/macieklamberski/feedsmith

---

### 2. @mozilla/readability + jsdom — Full Article Text Extraction

**Install:** `npm install @mozilla/readability jsdom`

| Package | Current Version | Last Active | Confidence |
|---------|----------------|-------------|------------|
| `@mozilla/readability` | 0.6.0 | Nov 2025 (commit date verified) | HIGH |
| `jsdom` | 29.0.2 | Apr 7, 2026 (release date verified) | HIGH |

**TypeScript:** Both include type definitions. `@types/jsdom` exists but is not needed — the packages bundle their own declarations.

**Why @mozilla/readability:**

This is the exact library Mozilla uses for Firefox Reader View. It implements the canonical algorithm for extracting article body text from arbitrary HTML pages — handling paywalled stubs, nav stripping, sidebar removal, and boilerplate detection. It returns `title`, `byline`, `content`, `textContent`, `excerpt`, and `publishedTime` as structured fields.

The existing `fetch-sources.ts` already uses Cheerio with custom CSS selector stripping (`$('script, style, nav, footer...').remove()`). That approach works for known-structure government pages with stable HTML. It is fragile for news articles from dozens of international outlets, which have widely varying layouts, deeply nested article containers, and aggressive sidebar/related-content injection. Readability solves this generically without per-site selectors.

**Why jsdom as the DOM provider:**

Readability requires a DOM document object. In Node.js, jsdom is the only production-grade option for this. The alternative, `linkedom`, is ~3x lighter in memory but lacks the DOM compliance Readability depends on (Readability internally calls `querySelectorAll`, `createElement`, `cloneNode` in ways that linkedom handles inconsistently). jsdom v29.0.2 was released April 7, 2026 — actively maintained. At ~60MB per parse operation versus linkedom's ~20MB, the tradeoff favors correctness: a news pipeline processing 50–100 articles/day does not require linkedom's memory savings.

**Usage pattern for the pipeline:**

```typescript
import { JSDOM } from 'jsdom';
import { Readability, isProbablyReaderable } from '@mozilla/readability';

async function extractArticleText(html: string, url: string): Promise<string | null> {
  const dom = new JSDOM(html, { url });
  if (!isProbablyReaderable(dom.window.document)) {
    return null; // not an article page — skip
  }
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent ?? null;
}
```

`isProbablyReaderable()` is the critical gate — call it before `parse()` to skip non-article pages (homepages, search results, category pages) that would return garbage text. This is especially important when following RSS feed links that occasionally point to tag pages.

**Security note:** If article HTML is ever rendered back to users, run through DOMPurify first. For this pipeline (text goes to Claude, never to a browser), this is not required.

**Sources:** https://github.com/mozilla/readability — https://philna.sh/blog/2025/01/09/html-content-retrieval-augmented-generation-readability-js/

---

## HTTP Fetching: No New Package Needed

Use Node.js built-in `fetch` with `AbortSignal.timeout()`. This is already the pattern in `fetch-sources.ts` and works identically for fetching RSS XML and article HTML. No `axios`, `got`, `node-fetch`, or `undici` package is needed.

```typescript
const response = await fetch(url, {
  headers: {
    'User-Agent': 'CivicTriviaBot/1.0 (news pipeline; contact news@empowered.vote)',
    'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
  },
  signal: AbortSignal.timeout(15000),
});
```

The same `User-Agent` pattern should be preserved — it is already configured in the existing codebase as a best-practice courtesy header for public servers.

---

## Concurrency and Scheduling: Already Present

`p-limit` (v7.3.0) is already installed. Use `pLimit(3)` for article fetches within a pipeline run, matching the existing pattern in `fetch-sources.ts`.

`node-cron` (v4.2.1) is already installed. The daily pipeline job integrates as one additional `cron.schedule()` call.

---

## RSS Feed Source Reality Check

One critical discovery: **Reuters discontinued their official RSS feeds in June 2020**. They are not available for this pipeline. Third-party feed generators exist (RSS.app, FiveFilters) but introduce a dependency on services we don't control.

**Verified working Tier 1 feeds as of April 2026:**

| Source | Feed URL | Notes |
|--------|----------|-------|
| BBC World News | `https://feeds.bbci.co.uk/news/world/rss.xml` | Confirmed active |
| NPR World | `https://feeds.npr.org/1004/rss.xml` | Confirmed active |
| NPR Top Stories | `https://feeds.npr.org/1001/rss.xml` | Confirmed active |
| AP News | Via `apnews.com` (no official RSS — use feedsmith's RSS detection or third-party) | Needs verification |
| The Guardian | `https://www.theguardian.com/world/rss` | Confirmed active |
| DW (Deutsche Welle) | `https://rss.dw.com/rdf/rss-en-world` | Confirmed active |

The pipeline's feed configuration should be data-driven (stored in DB or config file), not hardcoded, so feeds can be added/removed without deploys. A `news_feeds` table or JSON config with `{ name, url, tier, active }` is appropriate.

---

## What NOT to Add

| Package | Why Not |
|---------|---------|
| **Playwright / Puppeteer** | 150–300MB per browser instance. News articles from Tier 1 sources are static HTML — no JavaScript rendering needed. Adds Chromium as a binary dependency. |
| **axios / got / node-fetch** | Native `fetch` is stable (Node 21+), already used in the codebase, zero dependencies. No reason to add a wrapper. |
| **rss-parser** | Superseded by feedsmith for this use case. Slower, worse namespace support, ~3 years without updates. |
| **feedparser (node)** | Streams-based API designed for high-volume processing — unnecessary complexity for a daily cron pipeline handling dozens of feeds. Last meaningful update years ago. |
| **cheerio (new install)** | Already installed. Do not add a duplicate or different version. |
| **OpenAI SDK** | Already using Anthropic SDK. No need for a second AI provider package. |
| **DOMPurify** | Only needed if article HTML is rendered back to users. This pipeline sends text to Claude only — sanitization is unnecessary. |
| **linkedom** | Lighter than jsdom but not DOM-compliant enough for Readability. Use jsdom. |

---

## Complete New Dependencies Summary

```bash
npm install feedsmith @mozilla/readability jsdom
```

| Package | Version | Purpose | Adds to bundle |
|---------|---------|---------|---------------|
| `feedsmith` | ^2.8.0 | Parse RSS/Atom/JSON feeds from news sources | ~small (no Chromium) |
| `@mozilla/readability` | ^0.6.0 | Extract article body text from arbitrary HTML | Small |
| `jsdom` | ^29.0.2 | Provide DOM environment for Readability in Node.js | ~2MB |

Total new runtime dependencies: **3 packages**. No Chromium. No paid APIs. No new services.

---

## Integration Points with Existing Stack

| Existing Component | How Pipeline Connects |
|-------------------|----------------------|
| `node-cron` | Schedule daily pipeline run (e.g., `0 5 * * *`) alongside existing expiry sweep |
| Native `fetch` | Fetch RSS XML and article HTML — same pattern as `fetch-sources.ts` |
| `p-limit` | Rate-limit concurrent article fetches — same `pLimit(3)` pattern |
| `@anthropic-ai/sdk` | Send extracted article text + instructions to Claude for claim extraction and question generation |
| `drizzle-orm` + Supabase | Write generated questions to `trivia.questions` with `status: 'draft'` and appropriate `collection_id` |
| Existing quality rules engine | Run generated questions through existing rules before publish |
| Existing `expiresAt` system | News-derived questions get short expiry (30–90 days) — already supported by schema |

---

*Research completed: 2026-04-08*
*Verified sources: npm registry, github.com/mozilla/readability, github.com/macieklamberski/feedsmith, feedsmith.dev, github.com/cheeriojs/cheerio, github.com/jsdom/jsdom/releases*
