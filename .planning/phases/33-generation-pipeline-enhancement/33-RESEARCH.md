# Phase 33: Generation Pipeline Enhancement - Research

**Researched:** 2026-02-23
**Domain:** AI content generation pipeline with quality validation and semantic deduplication
**Confidence:** HIGH

## Summary

This phase integrates semantic deduplication (Phase 31-32) and cross-question quality rules into the existing AI generation pipeline (Phases 16/23), transforming it from a manual, batch-oriented tool into a production-grade, self-validating system. The goal is to make collection creation reliable enough that "adding a new locale" becomes "configure and run" rather than "plan a milestone."

The standard approach combines multi-tier error handling (retry with feedback at generation time, blocking vs advisory violation handling, cross-collection duplicate detection) with gap analysis (automatic detection of underrepresented topics and difficulty imbalances) and source diversity tracking. Modern LLM pipelines emphasize human-in-the-loop for critical decisions while automating recoverable errors, structured retry logic with quality feedback, and batch processing with clear success/failure reporting.

The existing codebase already has the foundation: `generateLearningContent.ts` handles Claude API calls with exponential backoff, `qualityRules/index.ts` provides 8 synchronous + async rules with blocking/advisory severity, and `embeddings/SemanticDupDetector.ts` computes cosine similarity with configurable thresholds (0.95 exact, 0.85 near-duplicate, 0.75 possible). The CONTEXT.md decisions lock in the human review gates and cross-collection hierarchy logic, leaving source granularity and gap detection algorithms to Claude's discretion.

**Primary recommendation:** Build a new `generateQuestions.ts` script that orchestrates generation → quality check → dedup check → retry/accept loops, with a final summary report. Reuse all existing services (Anthropic SDK, quality rules, SemanticDupDetector, OpenAIEmbeddingService) without modification. Focus on orchestration logic, not new abstractions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.74.0 | Claude API for question generation | Already integrated in Phase 16/23, supports Claude Opus 4.6 |
| openai | 6.22.0 | Embeddings API (text-embedding-3-small) | Phase 31-32 semantic deduplication, 1536-dim vectors |
| p-limit | 7.3.0 | Concurrency control for API calls | Already used in OpenAIEmbeddingService for rate limiting |
| drizzle-orm | 0.45.1 | Database queries for existing questions | Fetch active questions + collections for dedup checks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | 4.7.0 | TypeScript execution for scripts | All generation/seeding scripts use this |
| zod | 4.3.6 | Runtime validation of generated JSON | Validate Claude's question output structure |
| dotenv | 16.3.1 | Environment variable loading | API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Anthropic SDK | LangChain / LlamaIndex | Requirements doc explicitly rejects "heavy AI frameworks" — simple API calls sufficient |
| In-memory embeddings | pgvector / Pinecone | Requirements doc explicitly rejects vector databases — "overkill for one-time audit" |
| Custom retry logic | Tenacity / retry libraries | Anthropic SDK has built-in `maxRetries: 3`, already works well |

**Installation:**
```bash
# All dependencies already installed (see backend/package.json)
# No new packages required for Phase 33
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── scripts/
│   ├── generateQuestions.ts         # NEW: Main orchestration script (Phase 33)
│   ├── generateLearningContent.ts   # Existing: Learning content for existing questions
│   └── scan-duplicates.ts           # Existing: Phase 31-32 duplicate scanner
├── services/
│   ├── qualityRules/                # Existing: 8 rules with blocking/advisory severity
│   ├── embeddings/                  # Existing: OpenAI embeddings + semantic similarity
│   └── generation/                  # NEW: Generation-specific logic
│       ├── types.ts                 # Generation config, batch state types
│       ├── GapAnalyzer.ts           # Gap detection (topic/difficulty distribution)
│       ├── SourceTracker.ts         # Source diversity enforcement (15% cap)
│       └── CollectionHierarchy.ts   # Cross-collection duplicate policy (Federal > State > City)
└── data/
    └── [collection]-questions.json  # Existing: JSON source files (readonly during generation)
```

### Pattern 1: Multi-Stage Generation Pipeline with Feedback Loops
**What:** Generate → Quality Check → Dedup Check → Retry/Accept, with up to 3 retry attempts that include quality feedback in the prompt.

**When to use:** Any AI content generation where output must meet quality standards before acceptance.

**Example:**
```typescript
// Orchestration pattern for generateQuestions.ts
async function generateQuestion(
  prompt: string,
  existingQuestions: QuestionForDedup[],
  batchQuestions: Question[], // Already generated in this batch (intra-batch dedup)
  attempt: number = 1
): Promise<{ question: Question; status: 'accepted' | 'skipped'; violations: Violation[] }> {
  // 1. Generate with Claude
  const generated = await claudeClient.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const question = parseQuestionFromResponse(generated);

  // 2. Quality check (blocking vs advisory)
  const auditResult = await auditQuestion(question);

  if (auditResult.hasBlockingViolations) {
    if (attempt < 3) {
      // Retry with quality feedback
      const feedbackPrompt = buildRetryPrompt(prompt, question, auditResult.violations);
      return generateQuestion(feedbackPrompt, existingQuestions, batchQuestions, attempt + 1);
    } else {
      // Skip after 3 attempts
      return { question, status: 'skipped', violations: auditResult.violations };
    }
  }

  // 3. Semantic dedup check (database + intra-batch)
  const isDuplicate = await checkDuplicate(question, existingQuestions, batchQuestions);

  if (isDuplicate) {
    if (attempt < 3) {
      // Retry with duplicate feedback
      const feedbackPrompt = buildDuplicateRetryPrompt(prompt, question);
      return generateQuestion(feedbackPrompt, existingQuestions, batchQuestions, attempt + 1);
    } else {
      return { question, status: 'skipped', violations: [{ rule: 'semantic-duplicate', severity: 'blocking', message: 'Duplicate after 3 retries' }] };
    }
  }

  // 4. Advisory violations: accept with warning
  return { question, status: 'accepted', violations: auditResult.violations };
}
```

**Source:** Based on existing `generateLearningContent.ts` retry pattern + [human-in-the-loop AI content quality patterns](https://www.dataforce.ai/blog/building-better-ai-best-practices-generative-ai-quality-rating)

### Pattern 2: Gap Analysis with Redistribution
**What:** Analyze current collection to identify underrepresented topics/difficulties, target generation toward gaps, redistribute if a topic can't reach minimum (10 questions per topic).

**When to use:** Maintaining balanced distributions across multiple dimensions (topic, difficulty) when some categories may have limited source material.

**Example:**
```typescript
// Gap detection pattern for GapAnalyzer.ts
interface CollectionGaps {
  topicGaps: Map<string, number>;      // topic slug -> questions needed
  difficultyGaps: Map<string, number>; // difficulty -> questions needed
  totalNeeded: number;
}

class GapAnalyzer {
  analyzeGaps(
    existingQuestions: Question[],
    targetCount: number,
    topics: TopicConfig[],
    difficultyDistribution: { easy: number; medium: number; hard: number } = { easy: 0.40, medium: 0.35, hard: 0.25 }
  ): CollectionGaps {
    // 1. Count current distribution
    const topicCounts = new Map<string, number>();
    const difficultyCounts = new Map<string, number>();

    for (const q of existingQuestions) {
      topicCounts.set(q.topicCategory, (topicCounts.get(q.topicCategory) || 0) + 1);
      difficultyCounts.set(q.difficulty, (difficultyCounts.get(q.difficulty) || 0) + 1);
    }

    // 2. Calculate topic gaps (minimum 10 per topic)
    const topicGaps = new Map<string, number>();
    for (const topic of topics) {
      const current = topicCounts.get(topic.slug) || 0;
      const target = Math.max(10, Math.floor(targetCount / topics.length)); // Equal distribution with 10 minimum
      if (current < target) {
        topicGaps.set(topic.slug, target - current);
      }
    }

    // 3. Calculate difficulty gaps (40/35/25 distribution)
    const difficultyGaps = new Map<string, number>();
    const difficultyTargets = {
      easy: Math.round(targetCount * difficultyDistribution.easy),
      medium: Math.round(targetCount * difficultyDistribution.medium),
      hard: Math.round(targetCount * difficultyDistribution.hard),
    };

    for (const [diff, target] of Object.entries(difficultyTargets)) {
      const current = difficultyCounts.get(diff) || 0;
      if (current < target) {
        difficultyGaps.set(diff, target - current);
      }
    }

    // 4. Redistribution: if a topic can't reach minimum, redistribute to others
    const unreachableTopics = this.detectUnreachableTopics(topicGaps, topics);
    if (unreachableTopics.length > 0) {
      this.redistributeGaps(topicGaps, unreachableTopics, topics);
    }

    return {
      topicGaps,
      difficultyGaps,
      totalNeeded: targetCount - existingQuestions.length,
    };
  }

  private detectUnreachableTopics(topicGaps: Map<string, number>, topics: TopicConfig[]): string[] {
    // Heuristic: If a topic needs >50% of total gap, likely unreachable
    // This is Claude's discretion — could also use historical generation success rates
    const totalGap = Array.from(topicGaps.values()).reduce((sum, n) => sum + n, 0);
    const unreachable: string[] = [];

    for (const [slug, needed] of topicGaps) {
      if (needed > totalGap * 0.5) {
        unreachable.push(slug);
      }
    }

    return unreachable;
  }

  private redistributeGaps(topicGaps: Map<string, number>, unreachableTopics: string[], topics: TopicConfig[]): void {
    // Remove unreachable topics, redistribute their quota to others
    let redistributeAmount = 0;
    for (const slug of unreachableTopics) {
      redistributeAmount += topicGaps.get(slug) || 0;
      topicGaps.delete(slug);
    }

    const remainingTopics = topics.filter(t => !unreachableTopics.includes(t.slug));
    const perTopic = Math.floor(redistributeAmount / remainingTopics.length);

    for (const topic of remainingTopics) {
      topicGaps.set(topic.slug, (topicGaps.get(topic.slug) || 0) + perTopic);
    }
  }
}
```

**Source:** Based on [content gap analysis patterns](https://www.yotpo.com/blog/modern-content-gap-analysis/) and [stratified sampling for balanced generation](https://arxiv.org/html/2505.22157)

### Pattern 3: Cross-Collection Duplicate Detection with Hierarchy Policy
**What:** Check duplicates not only against the same collection but also parent collections (Federal blocks State, State blocks City), while allowing sibling duplicates (different cities, different states).

**When to use:** Multi-tier content generation where shared foundational questions belong only in parent scopes.

**Example:**
```typescript
// Hierarchy-aware duplicate checking for CollectionHierarchy.ts
import { COLLECTION_HIERARCHY, TIER_RANK, type CollectionTier } from '../embeddings/types.js';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: string; // externalId of duplicate question
  reason?: string;      // Human-readable explanation
}

class CollectionHierarchy {
  /**
   * Check if generated question is a semantic duplicate of existing questions,
   * applying cross-collection hierarchy policy:
   * - Reject if duplicate exists in PARENT collection (higher tier)
   * - Reject if duplicate exists in SAME collection
   * - Allow if duplicate exists in SIBLING collection (same tier, different name)
   * - Allow if duplicate exists in CHILD collection (lower tier)
   */
  async checkDuplicate(
    generatedQuestion: Question,
    targetCollection: string,
    existingQuestions: QuestionForDedup[],
    embeddingService: OpenAIEmbeddingService
  ): Promise<DuplicateCheckResult> {
    // 1. Generate embedding for new question
    const generatedText = SemanticDupDetector.prepareTextForEmbedding(generatedQuestion);
    const generatedEmbedding = await embeddingService.embed(generatedText);

    // 2. Check similarity against all existing questions
    const targetTier = COLLECTION_HIERARCHY[targetCollection];
    const NEAR_DUPLICATE_THRESHOLD = 0.85; // Same as Phase 31-32 scanner

    for (const existing of existingQuestions) {
      const existingEmbedding = await embeddingService.embed(
        SemanticDupDetector.prepareTextForEmbedding(existing)
      );

      const similarity = SemanticDupDetector.cosineSimilarity(generatedEmbedding, existingEmbedding);

      if (similarity > NEAR_DUPLICATE_THRESHOLD) {
        // Found semantic duplicate — apply hierarchy policy
        const existingCollections = existing.collections;

        for (const existingCollection of existingCollections) {
          const existingTier = COLLECTION_HIERARCHY[existingCollection];

          // Case 1: Duplicate in parent collection (higher tier) — REJECT
          if (TIER_RANK[existingTier] > TIER_RANK[targetTier]) {
            return {
              isDuplicate: true,
              duplicateOf: existing.externalId,
              reason: `Duplicate exists in parent collection "${existingCollection}" (${existingTier} > ${targetTier})`,
            };
          }

          // Case 2: Duplicate in same collection — REJECT
          if (existingCollection === targetCollection) {
            return {
              isDuplicate: true,
              duplicateOf: existing.externalId,
              reason: `Duplicate exists in same collection "${targetCollection}"`,
            };
          }

          // Case 3: Duplicate in sibling (same tier, different name) — ALLOW
          // Case 4: Duplicate in child (lower tier) — ALLOW
          // Both cases: continue checking other questions
        }
      }
    }

    return { isDuplicate: false };
  }
}
```

**Source:** Existing `COLLECTION_HIERARCHY` and `TIER_RANK` in `backend/src/services/embeddings/types.ts` + CONTEXT.md cross-collection hierarchy decisions

### Pattern 4: Source Diversity Tracking with Adaptive Caps
**What:** Track source usage across the full collection (persistent), enforce 15% soft cap with warnings, scale cap upward for locales with limited sources (e.g., 25% if only 4-5 sources exist).

**When to use:** Content generation where source diversity matters but hard limits would block progress in source-poor environments.

**Example:**
```typescript
// Source diversity tracking for SourceTracker.ts
class SourceTracker {
  private sourceCounts: Map<string, number>;
  private totalQuestions: number;
  private baseCapPercentage: number = 0.15;

  constructor(existingQuestions: Question[]) {
    this.sourceCounts = new Map();
    this.totalQuestions = existingQuestions.length;

    // Count existing sources
    for (const q of existingQuestions) {
      const sourceKey = this.getSourceKey(q.source);
      this.sourceCounts.set(sourceKey, (this.sourceCounts.get(sourceKey) || 0) + 1);
    }
  }

  /**
   * Claude's discretion: source granularity level
   * Option 1: Track by domain (groups all pages from same site)
   * Option 2: Track by full URL (each page is separate)
   * Option 3: Track by category (group related sources)
   *
   * Recommendation: Track by domain for simplicity and to enforce true diversity
   */
  private getSourceKey(source: { name: string; url: string }): string {
    try {
      const url = new URL(source.url);
      return url.hostname.replace(/^www\./, ''); // Remove www. prefix
    } catch {
      return source.url; // Fallback to full URL if parsing fails
    }
  }

  /**
   * Check if adding this source would violate diversity cap
   * Returns { allowed: boolean, warning?: string }
   */
  checkSource(source: { name: string; url: string }): { allowed: boolean; warning?: string } {
    const sourceKey = this.getSourceKey(source);
    const currentCount = this.sourceCounts.get(sourceKey) || 0;
    const currentPercentage = currentCount / this.totalQuestions;

    // Adaptive cap: scale upward if total unique sources is low
    const uniqueSources = this.sourceCounts.size;
    const adaptiveCap = this.calculateAdaptiveCap(uniqueSources);

    if (currentPercentage >= adaptiveCap) {
      return {
        allowed: true, // Soft cap: log warning but accept
        warning: `Source "${sourceKey}" is at ${(currentPercentage * 100).toFixed(1)}% (${currentCount}/${this.totalQuestions}), exceeds ${(adaptiveCap * 100).toFixed(0)}% cap`,
      };
    }

    return { allowed: true };
  }

  /**
   * Adaptive cap: scale upward for source-poor locales
   * - 5+ unique sources: 15% cap (standard)
   * - 4 unique sources: 20% cap
   * - 3 or fewer: 25% cap
   */
  private calculateAdaptiveCap(uniqueSources: number): number {
    if (uniqueSources >= 5) return 0.15;
    if (uniqueSources === 4) return 0.20;
    return 0.25;
  }

  /**
   * Record that a new question used this source
   */
  recordSource(source: { name: string; url: string }): void {
    const sourceKey = this.getSourceKey(source);
    this.sourceCounts.set(sourceKey, (this.sourceCounts.get(sourceKey) || 0) + 1);
    this.totalQuestions++;
  }

  /**
   * Generate source diversity summary for final report
   */
  getSummary(): { sourceKey: string; count: number; percentage: number }[] {
    return Array.from(this.sourceCounts.entries())
      .map(([sourceKey, count]) => ({
        sourceKey,
        count,
        percentage: count / this.totalQuestions,
      }))
      .sort((a, b) => b.count - a.count); // Sort by most-used first
  }
}
```

**Source:** CONTEXT.md source diversity decisions + [data-efficient learning practices](https://zilliz.com/blog/data-deduplication-at-trillion-scale-solve-the-biggest-bottleneck-of-llm-training)

### Anti-Patterns to Avoid
- **Modifying existing services for generation-specific logic:** Keep `qualityRules`, `SemanticDupDetector`, `OpenAIEmbeddingService` unchanged — add new generation-specific services in `services/generation/` directory
- **Hard-blocking on source cap:** CONTEXT.md explicitly states 15% is a "soft warning, not a hard block" — log warnings but continue
- **Re-running full dedup scan per question:** Expensive (embeddings + cosine similarity for all pairs). Instead, embed new question once and compare only against existing + intra-batch questions
- **Ignoring advisory violations:** Log them in the final report for human review even if auto-accepted
- **Generating without gap analysis:** Random generation leads to imbalanced collections — always start with gap detection to prioritize underrepresented areas

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API rate limiting | Custom sleep/queue logic | `p-limit` (already installed) | Already used in `OpenAIEmbeddingService.ts` with `pLimit(10)`, handles concurrency correctly |
| Retry with exponential backoff | Custom retry loop | Anthropic SDK `maxRetries: 3` + manual backoff | SDK handles API retries automatically, manual backoff only needed for quality/dedup feedback loops |
| JSON parsing from LLM output | Regex extraction | Anthropic SDK structured output (when available) OR existing regex pattern | `generateLearningContent.ts` already has working pattern: `contentText.match(/\{[\s\S]*\}/);` |
| Cosine similarity computation | Custom vector math | `SemanticDupDetector.cosineSimilarity()` | Already implemented with dimension checks and zero-norm handling |
| Embedding generation | Direct OpenAI API calls | `OpenAIEmbeddingService` with caching | Caching saves 90%+ API cost on repeated runs, already handles rate limiting |
| Quality rule evaluation | Custom validation functions | `auditQuestion()` and `auditQuestions()` from `qualityRules/index.ts` | 8 rules already implemented (ambiguity, lookup, structural, partisan, link-check, vague qualifiers), returns blocking vs advisory |
| Database connection pooling | Custom pool management | Drizzle ORM (already configured) | Connection pooling handled automatically |
| Progress reporting | Console.log timestamps | Structured logging with counts | Follow pattern from `scan-duplicates.ts`: track completed/total, show percentage progress |

**Key insight:** Phase 33 is orchestration, not building new primitives. The codebase already has all the building blocks (Claude generation, quality rules, semantic dedup, embeddings, rate limiting). The challenge is wiring them together with the right retry/feedback loops and gap analysis logic, not implementing new AI/ML capabilities.

## Common Pitfalls

### Pitfall 1: Intra-Batch Duplicate Blindness
**What goes wrong:** Generate 50 questions in a batch, check each against database but not against the 49 others generated in the same batch. Result: batch contains internal duplicates that won't be caught until the next scan.

**Why it happens:** Natural to think "check against existing questions" = "check against database." Forget that the batch itself is accumulating questions that aren't yet in the database.

**How to avoid:** Maintain an in-memory array of batch-generated questions. When checking duplicates, check against BOTH `existingQuestions` (from database) AND `batchQuestions` (generated so far in this run).

**Warning signs:**
- "Why did the duplicate scanner (Phase 32) find duplicates in the collection I just generated?"
- Duplicate clusters where both questions have similar timestamps (generated in same batch)

### Pitfall 2: Prompt Feedback Loop Degeneracy
**What goes wrong:** After 2-3 retries with quality feedback, Claude's output becomes overly cautious or formulaic. Questions lose the "fun and useful to know" tone and start feeling like test prep.

**Why it happens:** Adding violation feedback to the prompt ("this answer was too similar to option B, make them more distinct") causes the model to overcorrect. By retry 3, the prompt is so loaded with constraints it generates boring, safe questions.

**How to avoid:**
- Limit retries to 3 attempts max (CONTEXT.md decision)
- For retry prompts, emphasize what to fix but don't copy-paste all original instructions — keep retry prompts focused and concise
- If blocking violations persist after 3 retries, skip the question rather than retry indefinitely

**Warning signs:**
- Generated questions all follow the same template structure
- Quality scores are perfect but questions feel repetitive
- Explanations are technically correct but joyless

### Pitfall 3: Gap Analysis Overfitting to Numeric Targets
**What goes wrong:** Gap analyzer produces mathematically perfect distribution (exactly 40% easy, 35% medium, 25% hard) but topics are unnatural (e.g., "10 questions about city budget process" when only 3-4 interesting budget facts exist for that locale).

**Why it happens:** Treating gap analysis as pure math problem rather than content problem. The 40/35/25 distribution is a target, not a law of physics.

**How to avoid:**
- Use difficulty distribution as a guide, not a hard constraint
- Allow topic redistribution when minimum (10 questions) can't be reached organically
- Prioritize quality over hitting exact percentages — 38% easy vs 40% easy is fine if questions are better

**Warning signs:**
- Generating many questions that fail quality rules (sign that topic is exhausted)
- Questions become increasingly specific/obscure to fill a topic quota
- Generated questions are technically correct but not "fun and useful to know"

### Pitfall 4: Cross-Collection Hierarchy Misapplication
**What goes wrong:** Reject a state-specific question (e.g., "California's ballot proposition system") from a city collection (Los Angeles) because a similar question exists in the California state collection, even though the city question provides city-specific context (e.g., "How does LA vote on state propositions?").

**Why it happens:** Implementing hierarchy policy too strictly — treating any similarity as a duplicate without considering whether the city-level question adds local context.

**How to avoid:**
- Use the same similarity threshold as Phase 31-32 (0.85 for near-duplicate) — this catches true duplicates while allowing locale-specific variations
- When logging rejected duplicates, include the similarity score so it's auditable
- CONTEXT.md expects "structurally similar locale-specific questions across siblings" — same question pattern (e.g., "Who is our mayor?") should exist in every city collection

**Warning signs:**
- City collections can't generate questions about state/county topics even when they add local context
- Generation logs show many rejections with similarity scores in 0.75-0.85 range (possible tier, not near-duplicate)
- City collections end up with only hyper-local questions (no state context, no county agencies)

### Pitfall 5: Source Diversity Tracker State Desync
**What goes wrong:** Source diversity tracker starts with existing collection counts, but if generation script crashes mid-run and is restarted, the tracker resets to initial state while the database may have partially updated. Next run has incorrect source counts.

**Why it happens:** Source tracker is in-memory only, not persisted. Assumes atomic generation runs (all-or-nothing).

**How to avoid:**
- Generation script should NOT write to database directly — output to JSON file (like `generateLearningContent.ts` does)
- Human reviews JSON file and runs separate seeding script to update database
- Source tracker always starts from database state (never tries to maintain cross-run state)

**Warning signs:**
- Source percentages don't match expected values after partial generation run
- Warnings about source cap violations for sources that were barely used
- Restart after crash shows different source counts than previous run

## Code Examples

Verified patterns from official sources:

### Anthropic SDK with Retry Pattern
```typescript
// Source: Existing generateLearningContent.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // Auto-detects ANTHROPIC_API_KEY

async function generateWithRetry(prompt: string, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const contentText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error);

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### Quality Rule Evaluation
```typescript
// Source: Existing qualityRules/index.ts
import { auditQuestion, auditQuestions, type AuditOptions } from './services/qualityRules/index.js';

// Single question audit
const result = await auditQuestion(question, { skipUrlCheck: false });

if (result.hasBlockingViolations) {
  console.log('Blocking violations found:');
  result.violations
    .filter(v => v.severity === 'blocking')
    .forEach(v => console.log(`  - ${v.rule}: ${v.message}`));
}

if (result.hasAdvisoryOnly) {
  console.log('Advisory violations (non-blocking):');
  result.violations.forEach(v => console.log(`  - ${v.rule}: ${v.message}`));
}

// Batch audit with concurrency control
const results = await auditQuestions(questions, {
  skipUrlCheck: false,
  concurrency: 10
});
```

### Semantic Duplicate Detection
```typescript
// Source: Existing embeddings/SemanticDupDetector.ts and OpenAIEmbeddingService.ts
import { OpenAIEmbeddingService } from './services/embeddings/OpenAIEmbeddingService.js';
import { SemanticDupDetector } from './services/embeddings/SemanticDupDetector.js';

const embeddingService = new OpenAIEmbeddingService({
  apiKey: process.env.OPENAI_API_KEY!,
  cacheDir: '.embedding-cache', // Persists across runs
});

// Prepare question text (includes all options)
const questionText = SemanticDupDetector.prepareTextForEmbedding(question);

// Generate embedding (cached automatically)
const embedding = await embeddingService.embed(questionText);

// Compare with existing question
const existingEmbedding = await embeddingService.embed(
  SemanticDupDetector.prepareTextForEmbedding(existingQuestion)
);

const similarity = SemanticDupDetector.cosineSimilarity(embedding, existingEmbedding);
const tier = SemanticDupDetector.getSimilarityTier(similarity); // 'exact' | 'near-duplicate' | 'possible' | 'unrelated'

// Thresholds from SemanticDupDetector.ts
// - exact: > 0.95
// - near-duplicate: > 0.85
// - possible: > 0.75
// - unrelated: <= 0.75

// Save cache at end of run
embeddingService.saveCache();
```

### Batch Processing with Progress Reporting
```typescript
// Source: Existing scan-duplicates.ts pattern
async function processBatch(
  items: string[],
  handler: (item: string) => Promise<Result>
): Promise<{ success: number; failed: number; results: Result[] }> {
  let successCount = 0;
  let failCount = 0;
  const results: Result[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] Processing ${item}...`);

    try {
      const result = await handler(item);
      results.push(result);
      successCount++;
      console.log(`  ✓ Success`);
    } catch (error) {
      console.error(`  ✗ Failed:`, error instanceof Error ? error.message : error);
      failCount++;
      // Continue with remaining items
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Batch complete: ${successCount} success, ${failCount} failed`);
  console.log('='.repeat(60));

  return { success: successCount, failed: failCount, results };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual question generation + separate quality check | Integrated generation pipeline with retry loops | 2026 (Phase 33) | Reduces manual QA cycles, ensures all generated questions meet standards before human review |
| Batch generate then scan for duplicates | Check duplicates during generation with intra-batch detection | 2026 (Phase 33) | Prevents generating duplicates in the first place, saves API costs on rejected questions |
| Fixed 15% source cap (hard limit) | Adaptive source cap scaled by locale availability | 2026 (Phase 33, CONTEXT.md) | Enables generation for source-poor locales (small cities) without compromising diversity for source-rich locales |
| Equal topic distribution (all topics same count) | Gap analysis with minimum per topic + redistribution | 2026 (Phase 33, CONTEXT.md) | Accommodates natural topic availability differences while maintaining minimum representation |
| 30/40/30 difficulty distribution | 40/35/25 distribution (more easy questions) | 2026-02-23 (CONTEXT.md) | Supports Easy Steps mode which needs more easy questions for progressive difficulty |

**Deprecated/outdated:**
- **LangChain for simple LLM pipelines**: Requirements doc explicitly rejects heavy AI frameworks for this project — direct SDK calls are simpler and more maintainable for straightforward prompt→response→validate flows
- **Vector databases for small collections**: Requirements doc explicitly rejects pgvector/Pinecone for this scale (~700 questions) — in-memory with disk caching is sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal batch size for generation runs**
   - What we know: Existing `generateLearningContent.ts` uses 1-second delay between requests for rate limiting. Anthropic SDK has `maxRetries: 3` built-in. No documented rate limits found for Claude API in current docs.
   - What's unclear: Is 10 concurrent requests (current `p-limit(10)` in OpenAIEmbeddingService) appropriate for Claude generation calls, or should it be lower? Anthropic SDK doesn't expose rate limit headers to guide backoff.
   - Recommendation: Start with serial processing (1 question at a time with 1-second delay, matching `generateLearningContent.ts` pattern). Add concurrency later if generation speed becomes a bottleneck. Prioritize reliability over speed for initial implementation.

2. **Topic category standardization across collection types**
   - What we know: CONTEXT.md mentions "standardize topic categories across collection types" but existing collections have different topic structures (Federal has "constitutional-principles", cities have "civic-history", "landmarks-culture").
   - What's unclear: Should Phase 33 enforce a standard taxonomy, or is this a Phase 34 (Content Scale-Up) concern when seeding all 5 collections?
   - Recommendation: Document topic standardization as a Phase 34 task. Phase 33 generation pipeline should work with whatever topics are defined in the collection config, not enforce a specific taxonomy.

3. **"Identity" topic definition per locale**
   - What we know: CONTEXT.md says "include a collection-specific 'identity' topic that lets each locale's character shine."
   - What's unclear: Is "identity" a literal topic slug (like "fremont-identity") or a conceptual category (questions about unique local characteristics distributed across existing topics)?
   - Recommendation: Treat "identity" as conceptual — generation prompts should include locale-specific context that naturally produces questions about what makes this place unique, rather than creating a separate "identity" topic category. Avoids awkward topic names.

4. **Retry prompt strategy: append vs replace**
   - What we know: After quality violation, retry with feedback. After duplicate detection, retry with different angle.
   - What's unclear: Should retry prompts append feedback to original prompt (growing larger each retry) or replace with focused correction prompt (stays concise)?
   - Recommendation: Start with append strategy (original prompt + "\n\nPrevious attempt failed: [feedback]. Please revise.") for first implementation. If Pitfall 2 (prompt degeneracy) occurs, switch to focused correction prompts. Test empirically during Phase 33 implementation.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `backend/src/scripts/generateLearningContent.ts` (Claude API integration with retry)
- Existing codebase: `backend/src/services/qualityRules/index.ts` (8 quality rules with blocking/advisory severity)
- Existing codebase: `backend/src/services/embeddings/SemanticDupDetector.ts` (cosine similarity thresholds: 0.95/0.85/0.75)
- Existing codebase: `backend/src/services/embeddings/OpenAIEmbeddingService.ts` (OpenAI text-embedding-3-small with caching)
- Existing codebase: `backend/package.json` (Anthropic SDK 0.74.0, OpenAI 6.22.0, p-limit 7.3.0)
- Phase 33 CONTEXT.md (locked decisions: human review gates, duplicate handling, gap-filling, source diversity)

### Secondary (MEDIUM confidence)
- [AI Content Quality Control: Complete Guide for 2026](https://koanthic.com/en/ai-content-quality-control-complete-guide-for-2026-2/) - Multi-tier quality validation with human-in-the-loop patterns
- [Building Better AI: Best Practices for Generative AI Quality Rating](https://www.dataforce.ai/blog/building-better-ai-best-practices-generative-ai-quality-rating) - Human oversight models (agent-assisted, human-in-the-loop, human-on-the-loop)
- [How to Implement Batch Error Handling](https://oneuptime.com/blog/post/2026-01-30-batch-processing-error-handling/view) - Transient vs permanent failures, retry strategies
- [NVIDIA NeMo-Curator: Semantic Deduplication](https://docs.nvidia.com/nemo/curator/latest/curate-text/process-data/deduplication/semdedup.html) - Production semantic dedup patterns with embeddings
- [Content Gap Analysis 2026: 10 Tips For AI Search](https://www.yotpo.com/blog/modern-content-gap-analysis/) - Gap detection with topic distribution balancing
- [Laser: Stratified Selective Sampling for Instruction Tuning](https://arxiv.org/html/2505.22157) - Difficulty classification with stratified sampling (September 2025)

### Tertiary (LOW confidence)
- WebSearch: "AI content generation pipeline quality validation retry logic best practices 2026" - General patterns, not library-specific
- WebSearch: "LLM generation batch processing error handling patterns 2026" - Multi-layer error handling architecture concepts
- WebSearch: "semantic duplicate detection embeddings generation pipeline integration 2026" - Multi-index embeddings and monitoring patterns
- WebSearch: "content gap analysis algorithms topic distribution balancing 2026" - Query fan-out and semantic coverage concepts
- WebSearch: "difficulty distribution classification stratified sampling data generation 2026" - Academic approaches to balanced data generation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and used in existing codebase, no new libraries required
- Architecture: HIGH - Based on existing working patterns in codebase (generateLearningContent.ts, scan-duplicates.ts, qualityRules), combined with CONTEXT.md locked decisions
- Pitfalls: MEDIUM - Derived from understanding common pipeline failure modes and project context, but not yet validated through implementation

**Research date:** 2026-02-23
**Valid until:** ~30 days (stable domain — AI generation patterns are well-established, main risk is Anthropic SDK API changes)
