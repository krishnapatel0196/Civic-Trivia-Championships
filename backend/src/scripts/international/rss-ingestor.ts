import 'dotenv/config';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedArticle {
  title: string;
  url: string;        // item.link
  pubDate: Date;      // parsed from item.isoDate or item.pubDate
  feedName: string;   // human-readable feed name (e.g., "BBC World")
  feedUrl: string;    // the RSS feed URL
  bodyText: string;   // extracted article text (passed 300-word gate)
  guid: string;       // item.guid or item.link as fallback
}

export interface FeedResult {
  feedUrl: string;
  feedName: string;
  articles: ParsedArticle[];
  error?: string;     // populated if feed fetch failed
}

// ─── Feed Configuration ───────────────────────────────────────────────────────

export const INTERNATIONAL_FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-world' },
] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── Article Text Extraction ──────────────────────────────────────────────────

/**
 * Fetch an article URL and extract its body text via cheerio.
 * Tries selectors in priority order; returns null on fetch error or no content.
 */
export async function extractArticleText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CivicTriviaBot/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const selectors = [
      'article',
      'main',
      '[class*="article"]',
      '[class*="content"]',
      'body',
    ];

    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length) {
        const text = el.text().replace(/\s+/g, ' ').trim();
        if (text.length > 200) {
          return text;
        }
      }
    }

    return null;
  } catch {
    // Fetch error, timeout, 403, etc. — caller handles gracefully
    return null;
  }
}

// ─── RSS Text Extraction ──────────────────────────────────────────────────────

/**
 * Extract body text from an RSS item's content:encoded field (strip HTML tags).
 */
function extractTextFromRssContent(content: string): string | null {
  if (!content) return null;
  const $ = cheerio.load(content);
  const text = $.root().text().replace(/\s+/g, ' ').trim();
  return text.length > 200 ? text : null;
}

// ─── Feed Fetching ────────────────────────────────────────────────────────────

type CustomItem = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  'content:encoded'?: string;
  content?: string;
  contentSnippet?: string;
};

/**
 * Fetch and parse a single RSS feed, extract article text, and apply the
 * 300-word gate. Returns FeedResult with articles array (empty on error).
 */
async function processFeed(
  feed: { name: string; url: string },
  parser: Parser<object, CustomItem>,
): Promise<FeedResult & { articlesSkipped: number }> {
  const { name: feedName, url: feedUrl } = feed;

  try {
    const parsed = await parser.parseURL(feedUrl);
    const articles: ParsedArticle[] = [];
    let articlesSkipped = 0;

    for (const item of parsed.items) {
      const title = item.title ?? '(no title)';
      const url = item.link ?? '';
      const guid = item.guid ?? item.link ?? '';

      if (!url) {
        articlesSkipped++;
        console.log(`[${feedName}] Skipped (no URL): ${title}`);
        continue;
      }

      // Parse pubDate
      const rawDate = item.isoDate ?? item.pubDate ?? '';
      const pubDate = rawDate ? new Date(rawDate) : null;
      if (!pubDate || isNaN(pubDate.getTime())) {
        articlesSkipped++;
        console.log(`[${feedName}] Skipped (invalid date): ${title}`);
        continue;
      }

      // RSS body-first strategy:
      // 1. Attempt HTTP fetch of article URL
      // 2. If HTTP fetch returns null or < 300 words, try content:encoded from RSS
      // 3. If still < 300 words, skip the article

      let bodyText: string | null = null;

      // Step 1: HTTP fetch
      const httpText = await extractArticleText(url);
      if (httpText && wordCount(httpText) >= 300) {
        bodyText = httpText;
      }

      // Step 2: Fall back to RSS content:encoded
      if (!bodyText) {
        const rssContent = item['content:encoded'] ?? item.content ?? item.contentSnippet ?? '';
        if (rssContent) {
          const rssText = extractTextFromRssContent(rssContent);
          if (rssText && wordCount(rssText) >= 300) {
            bodyText = rssText;
          }
        }
      }

      // Step 3: Gate — skip if still below 300 words
      if (!bodyText) {
        const bestAvailable = httpText ?? '';
        const wc = wordCount(bestAvailable);
        articlesSkipped++;
        console.log(`[${feedName}] Skipped (${wc} words): ${title}`);
        continue;
      }

      articles.push({
        title,
        url,
        pubDate,
        feedName,
        feedUrl,
        bodyText,
        guid,
      });
    }

    console.log(
      `[${feedName}] ${parsed.items.length} articles fetched, ${articles.length} passed 300-word gate, ${articlesSkipped} skipped`,
    );

    return { feedUrl, feedName, articles, articlesSkipped };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${feedName}] Feed error (${feedUrl}): ${errorMsg}`);
    return { feedUrl, feedName, articles: [], error: errorMsg, articlesSkipped: 0 };
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Fetch all configured RSS feeds with per-feed error isolation.
 * A single bad feed is logged and skipped; remaining feeds are processed.
 * Returns FeedResult[] for consumption by claim-extractor (Plan 77-02).
 */
export async function fetchAllFeeds(
  feeds: ReadonlyArray<{ name: string; url: string }> = INTERNATIONAL_FEEDS,
): Promise<FeedResult[]> {
  const parser = new Parser<object, CustomItem>({
    customFields: {
      item: ['content:encoded'],
    },
  });

  const results: FeedResult[] = [];

  for (const feed of feeds) {
    const result = await processFeed(feed, parser);
    results.push(result);
  }

  const totalArticles = results.reduce((sum, r) => sum + r.articles.length, 0);
  const failedFeeds = results.filter(r => r.error).length;
  console.log(
    `[fetchAllFeeds] Complete: ${results.length} feeds processed, ${failedFeeds} failed, ${totalArticles} articles ready`,
  );

  return results;
}
