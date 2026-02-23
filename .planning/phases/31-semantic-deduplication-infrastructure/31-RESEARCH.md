# Phase 31: Semantic Deduplication Infrastructure - Research

**Researched:** 2026-02-22
**Domain:** Embedding-based similarity detection, duplicate clustering, CLI tooling
**Confidence:** HIGH

## Summary

This research covers building hybrid duplicate detection infrastructure using OpenAI embeddings combined with text normalization. The standard approach uses text-embedding-3-small for cost-effective semantic comparison (~700 questions), cosine similarity for vector comparison, and union-find for transitive closure clustering. The implementation follows existing project patterns (TypeScript CLI with flags, dual JSON/markdown reporting similar to audit-questions.ts).

Key findings:
- OpenAI text-embedding-3-small ($0.02/1M tokens) is the right choice for this scale - text-embedding-3-large costs 6.5x more for marginal quality improvement
- p-limit (already in package.json) is ideal for rate limiting concurrent API calls
- Union-find algorithm efficiently clusters duplicates through transitive closure (if A=B and B=C, then cluster ABC)
- Cosine similarity is the standard metric for comparing embedding vectors
- CLI pattern from audit-questions.ts provides proven template for scanner tool

**Primary recommendation:** Use text-embedding-3-small with p-limit concurrency control (10 concurrent requests), implement union-find clustering, generate dual JSON/markdown reports following audit-questions.ts pattern.

## Standard Stack

The established libraries/tools for embedding-based duplicate detection:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | ^6.22.0 | OpenAI API client for embeddings | Official TypeScript SDK, auto-retry, type-safe |
| p-limit | ^7.3.0 | Concurrency control for API calls | Already in project, simple promise-based rate limiting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| commander | ^12.0.0 | CLI argument parsing | Industry standard for TypeScript CLIs, Git-style subcommands |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| text-embedding-3-small | text-embedding-3-large | 6.5x cost increase for marginal quality gain (54.9% vs 44.0% MIRACL score) |
| p-limit | p-queue | p-queue adds complexity (pause/resume, introspection) not needed for simple concurrency |
| commander | yargs | Yargs more verbose for subcommands, commander cleaner for Git-style CLI |

**Installation:**
```bash
npm install openai
npm install --save-dev @types/node
# p-limit already installed
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── services/
│   └── embeddings/
│       ├── OpenAIEmbeddingService.ts    # API wrapper with caching
│       ├── SemanticDupDetector.ts       # Similarity calculation
│       └── ClusterBuilder.ts            # Union-find clustering
├── scripts/
│   └── scan-duplicates.ts               # CLI entry point
└── .embedding-cache/                    # JSON cache (gitignored)
    └── embeddings-{timestamp}.json
```

### Pattern 1: Embedding Service with Caching
**What:** Wrapper around OpenAI API that caches embeddings to avoid re-computing for same text
**When to use:** Any embedding generation - caching essential to avoid wasting API calls on repeated scans
**Example:**
```typescript
// Source: Combining OpenAI SDK patterns + audit-questions.ts structure
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export class OpenAIEmbeddingService {
  private client: OpenAI;
  private cache: Map<string, number[]> = new Map();
  private limit = pLimit(10); // 10 concurrent requests
  private cacheFile: string;

  constructor(apiKey: string, cacheFile = '.embedding-cache/embeddings.json') {
    this.client = new OpenAI({
      apiKey,
      maxRetries: 3,
      timeout: 120000,
    });
    this.cacheFile = cacheFile;
    this.loadCache();
  }

  private loadCache(): void {
    if (existsSync(this.cacheFile)) {
      const data = JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
      this.cache = new Map(Object.entries(data));
    }
  }

  async embed(text: string): Promise<number[]> {
    const normalized = text.toLowerCase().trim();

    if (this.cache.has(normalized)) {
      return this.cache.get(normalized)!;
    }

    return this.limit(async () => {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: normalized,
      });

      const embedding = response.data[0].embedding;
      this.cache.set(normalized, embedding);
      return embedding;
    });
  }

  saveCache(): void {
    const data = Object.fromEntries(this.cache);
    writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
  }
}
```

### Pattern 2: Cosine Similarity Calculation
**What:** Compare two embedding vectors to get similarity score (0 to 1)
**When to use:** After embedding pairs of questions, before clustering
**Example:**
```typescript
// Source: Standard cosine similarity algorithm
export class SemanticDupDetector {
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static getSimilarityTier(score: number): 'exact' | 'near-duplicate' | 'possible' | 'unrelated' {
    if (score > 0.95) return 'exact';
    if (score > 0.85) return 'near-duplicate';
    if (score > 0.75) return 'possible';
    return 'unrelated';
  }
}
```

### Pattern 3: Union-Find Clustering
**What:** Group duplicates into clusters (if A=B and B=C, then cluster ABC together)
**When to use:** After finding all pairwise similarities above threshold
**Example:**
```typescript
// Source: Standard union-find with path compression
export class ClusterBuilder {
  private parent: Map<string, string> = new Map();

  find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      return id;
    }

    // Path compression
    const root = this.parent.get(id)!;
    if (root !== id) {
      this.parent.set(id, this.find(root));
    }
    return this.parent.get(id)!;
  }

  union(id1: string, id2: string): void {
    const root1 = this.find(id1);
    const root2 = this.find(id2);

    if (root1 !== root2) {
      this.parent.set(root2, root1);
    }
  }

  getClusters(): Map<string, string[]> {
    const clusters = new Map<string, string[]>();

    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(id);
    }

    // Return only clusters with 2+ members
    return new Map(
      Array.from(clusters.entries()).filter(([, members]) => members.length > 1)
    );
  }
}
```

### Pattern 4: CLI with Dry-Run Mode
**What:** CLI tool with --dry-run flag that shows what would happen without executing
**When to use:** Any destructive operation - prevents accidents, allows preview
**Example:**
```typescript
// Source: audit-questions.ts flag parsing pattern
interface ScanFlags {
  dryRun: boolean;
  collections?: string[];
  skipCache: boolean;
}

function parseFlags(): ScanFlags {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    collections: args.find(a => a.startsWith('--collections='))?.split('=')[1]?.split(','),
    skipCache: args.includes('--skip-cache'),
  };
}

async function main() {
  const flags = parseFlags();

  console.log(`\n=== Duplicate Detection Scan ===`);
  console.log(`Mode: ${flags.dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  // ... scan logic ...

  if (flags.dryRun) {
    console.log('\nDRY RUN: No actions taken. Use without --dry-run to execute.');
  }
}
```

### Anti-Patterns to Avoid
- **Embedding full options array:** Embed question text + answer choices concatenated, not just question text (loses semantic context of what's being asked)
- **N² comparisons without optimization:** Use normalized text comparison first to catch exact duplicates before expensive embeddings
- **Ignoring transitive closure:** Comparing pairs without clustering (A=B, B=C) results in incomplete duplicate groups
- **Hard-coded thresholds:** Use tiered thresholds (>0.95, >0.85, >0.75) with different actions per tier

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrency limiting | Custom queue/throttle | p-limit | Handles promise chaining, already in project, battle-tested |
| Vector similarity | Manual math | Standard cosine similarity formula | Well-documented, numerically stable, O(n) complexity |
| Graph clustering | BFS/DFS traversal | Union-find with path compression | O(α(n)) amortized time, handles transitive closure elegantly |
| API retry logic | Custom backoff | OpenAI SDK maxRetries | SDK has exponential backoff, respects rate limit headers |
| CLI parsing | Manual argv parsing | commander | Handles help text, type validation, subcommands automatically |

**Key insight:** Embedding-based deduplication is algorithmically well-understood. Focus on integration (API calls, caching, reporting) not reinventing algorithms.

## Common Pitfalls

### Pitfall 1: Rate Limit Burnout
**What goes wrong:** Naive parallel embedding requests hit OpenAI rate limits (500 RPM), script crashes with 429 errors
**Why it happens:** ~700 questions = ~700 embedding calls; without throttling, all fire simultaneously
**How to avoid:** Use p-limit with conservative concurrency (10 concurrent), respect exponential backoff in SDK
**Warning signs:** 429 "Rate limit exceeded" errors in console, script hanging after initial batch

### Pitfall 2: Cache Invalidation Ignored
**What goes wrong:** Question text changes but cache returns stale embedding, duplicates missed or false positives
**Why it happens:** Cache key doesn't include question version/content hash, uses externalId as key
**How to avoid:** Use normalized question text as cache key (not externalId), cache keyed by content
**Warning signs:** Re-running scanner with modified question gives identical results

### Pitfall 3: Incomplete Text Comparison
**What goes wrong:** Questions with same text but different answer choices not detected as semantic duplicates
**Why it happens:** Embedding only question text, ignoring answer choices context
**How to avoid:** Concatenate question text + all answer options before embedding (matches user decision: "embed full question text + all answer choices together")
**Warning signs:** Two questions ask same thing with different answer sets, not flagged as duplicates

### Pitfall 4: Embedding Dimension Mismatch
**What goes wrong:** Cosine similarity calculation fails with dimension error after changing models
**Why it happens:** text-embedding-3-small = 1536 dimensions, text-embedding-3-large = 3072 dimensions; mixing cached embeddings
**How to avoid:** Include model name in cache file name, validate dimensions before similarity calculation
**Warning signs:** "Vectors must have same dimensions" error mid-scan

### Pitfall 5: Cross-Collection Policy Confusion
**What goes wrong:** Report shows duplicates but doesn't recommend correct "keep vs archive" action
**Why it happens:** Not implementing collection hierarchy (Federal > State > City) in recommendation logic
**How to avoid:** Implement collection tier ranking, recommendations follow hierarchy rules from CONTEXT.md
**Warning signs:** Report flags Federal/local duplicate but recommends keeping local version

### Pitfall 6: JSON Serialization of Large Embeddings
**What goes wrong:** Cache file grows to hundreds of MB, loading/parsing becomes slow
**Why it happens:** Storing 1536-dimension float arrays as JSON for 700 questions (not compressed)
**How to avoid:** This is acceptable for one-time scan (~1MB per 700 questions); for production, use binary format or vector DB
**Warning signs:** Cache file >10MB, noticeable delay on cache load

## Code Examples

Verified patterns from official sources:

### Batch Embedding with Error Handling
```typescript
// Source: OpenAI SDK docs + p-limit pattern
async function embedBatch(
  texts: string[],
  service: OpenAIEmbeddingService,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, number[]>> {
  const results = new Map<string, number[]>();
  let completed = 0;

  for (const text of texts) {
    try {
      const embedding = await service.embed(text);
      results.set(text, embedding);
      completed++;
      onProgress?.(completed, texts.length);
    } catch (error) {
      console.error(`Failed to embed: "${text.substring(0, 50)}..."`, error);
      // Continue processing other texts
    }
  }

  return results;
}
```

### Dual Report Generation (JSON + Markdown)
```typescript
// Source: audit-questions.ts report pattern
interface DuplicateCluster {
  clusterId: string;
  questions: Array<{
    externalId: string;
    text: string;
    options: string[];
    correctAnswer: number;
    collections: string[];
    qualityScore?: number;
  }>;
  similarities: Array<{ pair: [string, string]; score: number }>;
  recommendation: {
    keep: string;
    archive: string[];
    reason: string;
  };
}

function generateReports(clusters: DuplicateCluster[], outputDir: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // JSON source of truth
  const jsonPath = `${outputDir}/duplicates-${timestamp}.json`;
  writeFileSync(jsonPath, JSON.stringify(clusters, null, 2));

  // Markdown human review
  const mdPath = `${outputDir}/duplicates-${timestamp}.md`;
  const markdown = generateMarkdown(clusters);
  writeFileSync(mdPath, markdown);

  console.log(`\nReports generated:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  Markdown: ${mdPath}`);
}

function generateMarkdown(clusters: DuplicateCluster[]): string {
  let md = `# Duplicate Detection Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Clusters:** ${clusters.length}\n\n`;

  for (const cluster of clusters) {
    md += `## Cluster ${cluster.clusterId}\n\n`;
    md += `**Recommendation:** Keep \`${cluster.recommendation.keep}\`, archive ${cluster.recommendation.archive.length} duplicates\n`;
    md += `**Reason:** ${cluster.recommendation.reason}\n\n`;

    for (const q of cluster.questions) {
      md += `### ${q.externalId}\n`;
      md += `**Collections:** ${q.collections.join(', ')}\n`;
      md += `**Question:** ${q.text}\n`;
      md += `**Answers:**\n`;
      q.options.forEach((opt, i) => {
        const marker = i === q.correctAnswer ? '✓' : ' ';
        md += `  ${marker} ${i + 1}. ${opt}\n`;
      });
      md += '\n';
    }
  }

  return md;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| text-embedding-ada-002 | text-embedding-3-small | Jan 2024 | Better performance, 5x cheaper, 1536 dims vs 1536 dims |
| Manual retry logic | SDK maxRetries config | OpenAI SDK v4+ | Automatic exponential backoff, respects rate limit headers |
| Pairwise duplicate detection | Clustering with transitive closure | Standard practice | Groups all related duplicates together (A=B, B=C → cluster ABC) |
| Custom concurrent queue | p-limit | npm ecosystem | Simpler, promise-based, less code to maintain |

**Deprecated/outdated:**
- text-embedding-ada-002: Replaced by text-embedding-3-small (better quality, same dimensions, lower cost)
- pgvector for small datasets: Overkill for one-time ~700 question scan; in-memory sufficient
- LangChain for embeddings: Unnecessary abstraction layer when using OpenAI directly

## Open Questions

Things that couldn't be fully resolved:

1. **Embedding cache versioning strategy**
   - What we know: Cache keyed by normalized text avoids staleness
   - What's unclear: Best strategy if question text changes after embedding (manual cache invalidation? timestamp validation?)
   - Recommendation: For Phase 31, cache per scan session (timestamped file); Phase 32 can decide if persistent cache needed

2. **Optimal similarity thresholds**
   - What we know: User decided >0.95 exact, >0.85 near-duplicate, >0.75 possible
   - What's unclear: These are reasonable defaults but may need tuning based on actual data distribution
   - Recommendation: Implement configurable thresholds, Phase 32 may adjust based on real results

3. **Cross-collection comparison performance**
   - What we know: Need to compare questions across all 6 collections (global comparison)
   - What's unclear: Whether to pre-filter by collection before similarity or compare all pairs
   - Recommendation: Compare all pairs (simple, correct); optimization not needed for ~700 questions

## Sources

### Primary (HIGH confidence)
- [OpenAI Embeddings API Reference](https://developers.openai.com/api/reference/typescript/resources/embeddings/methods/create) - API parameters and usage
- [OpenAI npm Package v6.22.0](https://www.npmjs.com/package/openai) - Official TypeScript SDK
- [p-limit npm Package](https://www.npmjs.com/package/p-limit) - Concurrency control documentation
- [Rate Limits Best Practices | OpenAI](https://developers.openai.com/api/docs/guides/rate-limits/) - Official rate limiting guidance
- [Text Embedding Models Comparison 2026](https://www.openxcell.com/blog/best-embedding-models/) - Verified comparison of text-embedding-3-small vs large

### Secondary (MEDIUM confidence)
- [Cosine Similarity TypeScript Implementation](https://alexop.dev/posts/how-to-implement-a-cosine-similarity-function-in-typescript-for-vector-comparison/) - Algorithm explanation and code
- [Building TypeScript CLI 2026](https://hackers.pub/@hongminhee/2026/typescript-cli-2026) - Modern CLI patterns
- [Commander.js vs Yargs](https://npm-compare.com/commander,yargs) - CLI framework comparison
- [Union-Find Algorithm Deep Dive](https://www.numberanalytics.com/blog/union-find-algorithm-deep-dive) - Clustering algorithm explanation

### Tertiary (LOW confidence)
- [RAG Latency Optimization 2026](https://dasroot.net/posts/2026/02/rag-latency-optimization-vector-database-caching-hybrid-search/) - Embedding caching strategies (overkill for this use case)
- [Semantic Caching Techniques](https://redis.io/blog/10-techniques-for-semantic-cache-optimization/) - Advanced caching (production-scale, not needed for Phase 31)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenAI official SDK, p-limit already in use, commander industry standard
- Architecture: HIGH - Patterns verified in existing codebase (audit-questions.ts), algorithms well-documented
- Pitfalls: HIGH - Based on common embedding API issues (rate limits, cache invalidation) and project patterns

**Research date:** 2026-02-22
**Valid until:** ~90 days (embeddings API stable; main risk is pricing changes or new models)
