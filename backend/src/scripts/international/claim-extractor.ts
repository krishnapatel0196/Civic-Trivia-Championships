import nlp from 'compromise';
import { client, MODEL } from '../../scripts/content-generation/anthropic-client.js';
import type { ParsedArticle } from './rss-ingestor.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoryCluster {
  articles: ParsedArticle[];
  sharedEntities: string[];
  representativeTitle: string;
}

export interface ClaimResult {
  claim: string;
  factSnapshot: string;
  confidenceTier: 'high' | 'medium' | 'low';
  sourceArticles: ParsedArticle[];
}

// ─── Named-Entity Extraction ──────────────────────────────────────────────────

/**
 * Extract named entities (people, places, organizations) from text using compromise NLP.
 * Returns lowercase, trimmed entities with minimum 3 characters.
 */
function extractEntities(text: string): Set<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (nlp as any)(text);
  const entities: string[] = [
    ...doc.people().out('array'),
    ...doc.places().out('array'),
    ...doc.organizations().out('array'),
  ];
  const normalized = entities
    .map((e: string) => e.toLowerCase().trim())
    .filter((e: string) => e.length >= 3);
  return new Set(normalized);
}

// ─── Story Clustering ─────────────────────────────────────────────────────────

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Cluster articles about the same story using named-entity overlap + 24-hour window.
 *
 * Algorithm:
 * 1. Extract entities for each article
 * 2. Greedy union-find: pair (i, j) joins same cluster if:
 *    - Both articles published within 24 hours of each other
 *    - They share 2+ named entities
 * 3. Filter out single-source clusters (2+ articles required)
 * 4. Compute sharedEntities (entities present in ALL cluster articles)
 * 5. representativeTitle = article with longest bodyText
 */
export function clusterArticles(articles: ParsedArticle[]): StoryCluster[] {
  if (articles.length === 0) return [];

  // Extract entities for each article
  const articleEntities: Array<{ article: ParsedArticle; entities: Set<string> }> =
    articles.map(article => ({
      article,
      entities: extractEntities(article.title + ' ' + article.bodyText.slice(0, 2000)),
    }));

  // Union-Find structures
  const parent: number[] = articleEntities.map((_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  }

  function union(x: number, y: number): void {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) {
      parent[rx] = ry;
    }
  }

  // Pairwise comparison
  for (let i = 0; i < articleEntities.length; i++) {
    for (let j = i + 1; j < articleEntities.length; j++) {
      const a = articleEntities[i];
      const b = articleEntities[j];

      // 24-hour window check
      const timeDiff = Math.abs(a.article.pubDate.getTime() - b.article.pubDate.getTime());
      if (timeDiff > TWENTY_FOUR_HOURS_MS) continue;

      // 2+ shared entities check
      let sharedCount = 0;
      for (const entity of a.entities) {
        if (b.entities.has(entity)) {
          sharedCount++;
          if (sharedCount >= 2) break;
        }
      }
      if (sharedCount < 2) continue;

      union(i, j);
    }
  }

  // Group by cluster root
  const clusterMap = new Map<number, number[]>();
  for (let i = 0; i < articleEntities.length; i++) {
    const root = find(i);
    if (!clusterMap.has(root)) {
      clusterMap.set(root, []);
    }
    clusterMap.get(root)!.push(i);
  }

  // Build StoryCluster objects, filter to 2+ articles
  const clusters: StoryCluster[] = [];

  for (const [, indices] of clusterMap) {
    if (indices.length < 2) {
      // Single-source story — skip
      const droppedArticle = articleEntities[indices[0]].article;
      console.log(
        `[Dedup] Skipped single-source story: "${droppedArticle.title}" (${droppedArticle.feedName})`,
      );
      continue;
    }

    const clusterArticles = indices.map(i => articleEntities[i].article);
    const clusterEntitySets = indices.map(i => articleEntities[i].entities);

    // Shared entities = entities present in ALL articles in cluster
    const firstSet = clusterEntitySets[0];
    const sharedEntities = [...firstSet].filter(entity =>
      clusterEntitySets.every(set => set.has(entity)),
    );

    // Representative title = article with longest bodyText
    const representative = clusterArticles.reduce((best, current) =>
      current.bodyText.length > best.bodyText.length ? current : best,
    );

    const feedNames = [...new Set(clusterArticles.map(a => a.feedName))];
    console.log(
      `[Dedup] Cluster: "${representative.title}" — ${clusterArticles.length} articles from [${feedNames.join(', ')}]`,
    );

    clusters.push({
      articles: clusterArticles,
      sharedEntities,
      representativeTitle: representative.title,
    });
  }

  return clusters;
}

// ─── Claude Call 1: Claim Extraction ─────────────────────────────────────────

const CLAIM_EXTRACTION_SCHEMA = {
  type: 'object' as const,
  properties: {
    claim: { type: 'string' as const },
    fact_snapshot: { type: 'string' as const },
    confidence_tier: {
      type: 'string' as const,
      enum: ['high', 'medium', 'low'],
    },
  },
  required: ['claim', 'fact_snapshot', 'confidence_tier'] as string[],
  additionalProperties: false,
};

const CLAIM_EXTRACTION_SYSTEM_PROMPT = `You are a civic trivia fact extractor. Given news articles about the same event from multiple sources, extract the single most verifiable factual claim suitable for a trivia question.

Rules:
- Pick ONE concrete, verifiable claim — prefer facts with specific numbers, dates, official statements, or named outcomes
- The claim must be directly stated in at least two of the provided sources (not inferred)
- Avoid claims about motive, intent, blame, or future predictions
- Assign confidence_tier: "high" for concrete facts directly stated with numbers/dates, "medium" for well-supported characterizations, "low" for predictions or contested framing
- fact_snapshot: A brief sentence capturing the factual state at time of publication`;

/**
 * Run Claude Call 1: extract the single most verifiable factual claim from a story cluster.
 *
 * Returns null if:
 * - confidence_tier is "low" (cost-saving skip)
 * - Claude call fails
 */
export async function extractClaim(cluster: StoryCluster): Promise<ClaimResult | null> {
  // Build user message — concatenate article bodies
  const articleTexts = cluster.articles
    .map(
      (article, index) =>
        `Source ${index + 1} (${article.feedName}): ${article.title}\n` +
        `Published: ${article.pubDate.toISOString()}\n` +
        `---\n` +
        article.bodyText.slice(0, 3000), // Limit per article to control token usage
    )
    .join('\n\n');

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: CLAIM_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: articleTexts }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output_config: { format: { type: 'json_schema', schema: CLAIM_EXTRACTION_SCHEMA } } as any,
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      console.error(
        `[ClaimExtractor] Unexpected response type: ${contentBlock.type} for cluster: "${cluster.representativeTitle}"`,
      );
      return null;
    }

    // Guaranteed valid JSON when using structured output
    const parsed = JSON.parse(contentBlock.text) as {
      claim: string;
      fact_snapshot: string;
      confidence_tier: 'high' | 'medium' | 'low';
    };

    // Low-confidence skip
    if (parsed.confidence_tier === 'low') {
      console.log(`[ClaimExtractor] Low-confidence claim skipped: "${parsed.claim}"`);
      return null;
    }

    return {
      claim: parsed.claim,
      factSnapshot: parsed.fact_snapshot,
      confidenceTier: parsed.confidence_tier,
      sourceArticles: cluster.articles,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[ClaimExtractor] Error extracting claim for cluster "${cluster.representativeTitle}": ${errorMsg}`,
    );
    return null;
  }
}
