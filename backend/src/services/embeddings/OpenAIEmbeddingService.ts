/**
 * OpenAI Embedding Service
 * Wraps OpenAI embeddings API with caching and rate limiting
 */

import OpenAI from 'openai';
import pLimit from 'p-limit';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingServiceConfig {
  apiKey: string;
  cacheDir?: string;
}

export class OpenAIEmbeddingService {
  private client: OpenAI;
  private limiter: ReturnType<typeof pLimit>;
  private cache: Map<string, number[]>;
  private cacheDir: string;
  private cachePath: string;
  private stats = { hits: 0, misses: 0 };

  constructor(config: EmbeddingServiceConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: 3,
      timeout: 120000,
    });

    this.limiter = pLimit(10);

    // Set up cache directory
    this.cacheDir = config.cacheDir || resolve(__dirname, '../../../.embedding-cache');
    this.cachePath = resolve(this.cacheDir, 'embeddings.json');

    // Create cache directory if needed
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    // Load cache from disk
    this.cache = this.loadCache();
  }

  private loadCache(): Map<string, number[]> {
    if (!existsSync(this.cachePath)) {
      return new Map();
    }

    try {
      const data = readFileSync(this.cachePath, 'utf-8');
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj));
    } catch (err) {
      console.warn('Failed to load embedding cache:', err);
      return new Map();
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  async embed(text: string): Promise<number[]> {
    const normalized = this.normalizeText(text);

    // Check cache
    if (this.cache.has(normalized)) {
      this.stats.hits++;
      return this.cache.get(normalized)!;
    }

    // Call API (rate-limited)
    this.stats.misses++;
    const embedding = await this.limiter(async () => {
      const response = await this.client.embeddings.create({
        model: MODEL,
        input: text,
      });
      return response.data[0].embedding;
    });

    // Store in cache
    this.cache.set(normalized, embedding);

    return embedding;
  }

  async embedBatch(
    items: Array<{ id: string; text: string }>,
    onProgress?: (done: number, total: number) => void
  ): Promise<Map<string, number[]>> {
    const results = new Map<string, number[]>();
    let completed = 0;

    for (const item of items) {
      try {
        const embedding = await this.embed(item.text);
        results.set(item.id, embedding);
      } catch (err) {
        console.error(`Failed to embed item ${item.id}:`, err);
        // Continue with remaining items
      }

      completed++;
      if (onProgress) {
        onProgress(completed, items.length);
      }
    }

    return results;
  }

  saveCache(): void {
    try {
      const obj = Object.fromEntries(this.cache);
      writeFileSync(this.cachePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save embedding cache:', err);
    }
  }

  getCacheStats(): { hits: number; misses: number; total: number } {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      total: this.stats.hits + this.stats.misses,
    };
  }
}
