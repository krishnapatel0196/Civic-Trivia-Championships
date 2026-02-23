# Technology Stack: Semantic Deduplication & Batch Generation

**Project:** Civic Trivia Championship v1.6
**Researched:** 2026-02-22
**Focus:** Stack additions for semantic duplicate detection and efficient batch content generation

## Executive Summary

The v1.6 milestone requires detecting semantic duplicates across 639 questions in 6 collections and generating ~140 new unique questions. Current stack includes AI generation via Anthropic Claude API and quality validation engine, but lacks semantic similarity detection (only exact text matching exists). **PRIMARY RECOMMENDATION: Add OpenAI text-embedding-3-small + fast-cosine-similarity for semantic deduplication. AVOID pgvector, heavyweight vector databases, or production schema changes.** This is a one-time content audit workflow, not a runtime feature.

## Recommended Stack Additions

### Embedding Model: OpenAI text-embedding-3-small

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| `openai` | ^4.73.0 | Text embeddings for semantic similarity | Official SDK, 1536-dim vectors, $0.02/1M tokens standard ($0.01/1M batch) |

**Rationale:**
- **Cost-effective:** $0.02 per 1M tokens standard, $0.01 per 1M tokens batch (50% discount). Embedding 639 questions (~500 tokens each = 320K tokens) costs $0.0064 standard or $0.0032 batch.
- **Proven reliability:** OpenAI embeddings are battle-tested for semantic similarity tasks across millions of applications.
- **Simple integration:** Single npm package, straightforward API, no infrastructure dependencies.
- **Adequate dimensions:** 1536 dimensions captures semantic meaning sufficiently for trivia question similarity detection.
- **Batch API support:** For bulk embedding of existing questions, use Batch API for 50% cost savings (24-hour completion acceptable for one-time audit).
- **FREE for this project:** New OpenAI accounts get $5 free credits, enough to embed ~250M tokens (500,000 documents at 500 tokens each). This entire project needs <1M tokens total.

**Installation:**
```bash
cd backend
npm install openai
```

**Why NOT Voyage AI (Anthropic's recommended provider):**
- Voyage-3.5-lite costs $0.02/1M tokens (same as OpenAI) but has smaller free tier (200M tokens vs OpenAI's $5 credit).
- Voyage-3.5 produces 1024-dim vectors vs OpenAI's 1536-dim (lower resolution for similarity).
- No compelling advantage for this use case. OpenAI is simpler (existing ecosystem familiarity) and sufficient.

**Why NOT Anthropic Claude embeddings:**
- Anthropic does not offer its own embedding model, partners with Voyage AI instead.

**Sources:**
- [OpenAI Embeddings API Pricing](https://costgoat.com/pricing/openai-embeddings)
- [OpenAI Batch API](https://platform.openai.com/docs/api-reference/batch)
- [Anthropic Embeddings Documentation](https://platform.claude.com/docs/en/build-with-claude/embeddings)

### Vector Similarity: fast-cosine-similarity

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| `fast-cosine-similarity` | ^1.2.2 | Compute cosine similarity between embedding vectors | 3x faster than alternatives, TypeScript support, zero dependencies |

**Rationale:**
- **Performance:** Benchmarked 3.43x faster than `compute-cosine-similarity` for high-dimension vectors.
- **Lightweight:** No dependencies, ~2KB package size.
- **TypeScript native:** First-class TypeScript support, no @types package needed.
- **Optimized for embeddings:** Built specifically for high-dimension vectors like OpenAI embeddings (1536-dim).
- **Dead simple API:** `similarity(vectorA, vectorB)` returns float 0-1.

**Installation:**
```bash
cd backend
npm install fast-cosine-similarity
```

**Why NOT alternatives:**
- `compute-cosine-similarity`: 3x slower, same functionality.
- `cosine-similarity`: Older, less maintained, no TypeScript support.
- Roll-your-own: Not worth it. fast-cosine-similarity is already optimized with SIMD-like operations where available.

**Sources:**
- [fast-cosine-similarity npm](https://www.npmjs.com/package/fast-cosine-similarity)
- [npm cosine similarity packages comparison](https://www.npmjs.com/search?q=keywords:cosine+similarity)

### Concurrency Control: p-limit (ALREADY INSTALLED)

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| `p-limit` | ^7.3.0 | Control concurrent API requests during batch embedding | ALREADY IN PACKAGE.JSON — 80M+ weekly downloads, simple, reliable |

**Rationale:**
- **Already installed:** package.json line 32 shows `p-limit: ^7.3.0` — no new dependency needed.
- **Rate limit compliance:** OpenAI standard API has rate limits (10K RPM, 2M TPM for tier 1). p-limit ensures we don't exceed these.
- **Proven at scale:** 80M+ weekly downloads, used by major OSS projects.
- **Simple API:** `const limit = pLimit(5); await Promise.all(items.map(item => limit(() => embedItem(item))))` — self-explanatory.

**Usage pattern for embedding workflow:**
```typescript
import pLimit from 'p-limit';
import OpenAI from 'openai';

const openai = new OpenAI();
const limit = pLimit(10); // 10 concurrent requests

const embeddings = await Promise.all(
  questions.map(q => limit(async () => {
    const result = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q.text,
    });
    return result.data[0].embedding;
  }))
);
```

**Sources:**
- [p-limit npm](https://www.npmjs.com/package/p-limit)
- [p-limit GitHub](https://github.com/sindresorhus/p-limit)

## Anti-Recommendations: What NOT to Add

### DO NOT: pgvector PostgreSQL Extension

**Why avoid:**
- **Overkill for one-time audit:** pgvector is for runtime semantic search queries. This milestone is a one-time content audit, not a production feature.
- **Database schema migration:** Requires adding vector column to questions table, migration script, index creation. Unnecessary complexity.
- **Production risk:** Changing production schema for a content audit workflow is poor separation of concerns.
- **Not needed for similarity checks:** Cosine similarity between two vectors is a 10-line TypeScript function. pgvector's value is for "find 10 nearest neighbors to this vector" queries across millions of rows. We have 639 questions — in-memory comparison is trivial.

**Use pgvector only if:** Future feature requires runtime semantic search (e.g., "suggest similar questions" in admin UI). Not this milestone.

**Sources:**
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector use cases](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/)

### DO NOT: Vector Databases (Pinecone, Weaviate, Qdrant)

**Why avoid:**
- **External dependency:** Adds another service to manage, environment variables to configure, deployment complexity.
- **Cost:** Even free tiers add ongoing operational overhead. OpenAI free credits are sufficient.
- **Scale mismatch:** Vector databases shine at millions/billions of vectors. We have <1,000 questions. In-memory Map<externalId, embedding> is instant lookup.
- **Workflow mismatch:** This is a one-time audit + batch generation workflow, not a persistent production data store.

**Use vector database only if:** Building a production semantic search feature across tens of thousands of questions. Not this milestone.

**Sources:**
- [Vector database comparison 2026](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)

### DO NOT: LangChain

**Why avoid:**
- **Heavyweight abstraction:** LangChain is 100+ KB of dependencies for embedding model abstraction. We need one embedding call pattern, not a framework.
- **Unnecessary complexity:** Direct OpenAI SDK is 3 lines of code. LangChain adds layers of abstraction that obfuscate simple operations.
- **Not using RAG features:** LangChain's value is RAG pipelines, vector store integrations, chain composition. We're just embedding question text for similarity comparison.

**Use LangChain only if:** Building complex RAG workflows with multiple embedding models, vector stores, and chain compositions. Not this milestone.

**Sources:**
- [LangChain embeddings integrations](https://js.langchain.com/docs/integrations/text_embedding/)

### DO NOT: Embeddings.js

**Why avoid:**
- **Less mature:** Smaller community than OpenAI official SDK.
- **Abstraction without value:** Adds abstraction layer over OpenAI SDK without solving a real problem. Direct SDK usage is already simple.
- **Local embedding models:** Embeddings.js supports local embedding models, but OpenAI's quality is higher and free credits make cost a non-issue.

**Sources:**
- [Embeddings.js GitHub](https://github.com/themaximalist/embeddings.js/)

## Integration Architecture

### Workflow Overview

```
1. Load all questions from JSON files
   └─> Parse 6 collection files into Question[]

2. Batch embed questions via OpenAI
   ├─> Use Batch API for existing questions (50% discount, 24h acceptable)
   ├─> Use standard API for new questions (need results immediately)
   └─> Store embeddings in Map<externalId, number[]>

3. Find semantic duplicates
   ├─> For each question pair within collection:
   │   └─> If cosine similarity > 0.85, flag as duplicate
   └─> Store duplicate groups

4. Human review
   ├─> Generate report: duplicate groups with similarity scores
   ├─> Admin picks best version from each group
   └─> Archive others

5. Generate new questions
   ├─> Embed new question immediately after generation
   ├─> Check similarity against existing embeddings
   └─> If similarity > 0.85, reject and regenerate

6. Update JSON files, seed to database
```

### Similarity Threshold Recommendations

Based on semantic similarity research for question deduplication:

| Similarity Score | Interpretation | Action |
|-----------------|----------------|---------|
| 0.95 - 1.0 | Near-identical paraphrase | Auto-flag as duplicate |
| 0.85 - 0.95 | Semantic duplicate, different wording | Flag for human review |
| 0.70 - 0.85 | Related topic, distinct question | Keep both |
| < 0.70 | Different questions | No action |

**Recommended threshold: 0.85** (flag for human review, don't auto-archive).

### Code Structure

**New files:**
```
backend/src/scripts/content-generation/utils/
  ├─ semantic-dedup.ts          # Core deduplication logic
  │  ├─ embedQuestion(text: string): Promise<number[]>
  │  ├─ findDuplicates(questions: Question[], threshold: number): DuplicateGroup[]
  │  └─ generateDedupReport(groups: DuplicateGroup[]): Report
  │
  └─ embedding-cache.ts          # Embedding storage for generation
     ├─ EmbeddingCache class (Map wrapper)
     ├─ checkSimilarity(newQuestion: Question, threshold: number): SimilarQuestion[]
     └─ add(externalId: string, embedding: number[]): void

backend/src/scripts/
  ├─ deduplicate-questions.ts    # CLI: audit collections, generate report
  └─ generate-with-dedup.ts      # Updated generation pipeline with dedup checks
```

**Integration with existing quality validation:**
```typescript
// In quality-validation.ts validateAndRetry()
// Add semantic dedup check alongside existing rules

export async function validateAndRetry(
  questions: ValidatedQuestion[],
  regenerateFn: RegenerateFn,
  options: {
    maxRetries?: number;
    skipUrlCheck?: boolean;
    duplicateDetector?: DuplicateDetector; // Existing exact-text detector
    embeddingCache?: EmbeddingCache;       // NEW: semantic dedup
    semanticThreshold?: number;             // NEW: default 0.85
  } = {}
): Promise<ValidationResult> {
  // ... existing code ...

  // After existing duplicate check, add semantic check
  if (!lastAudit.hasBlockingViolations && embeddingCache) {
    const embedding = await embedQuestion(currentQuestion.text);
    const similar = embeddingCache.checkSimilarity(currentQuestion, semanticThreshold);
    if (similar.length > 0) {
      lastAudit.violations.push({
        rule: 'semantic-duplicate',
        severity: 'blocking',
        message: `Semantically similar to existing question`,
        evidence: `Similar to ${similar[0].externalId} (${(similar[0].similarity * 100).toFixed(1)}% match)`,
      });
      lastAudit.hasBlockingViolations = true;
    } else {
      // No duplicate, cache this embedding
      embeddingCache.add(currentQuestion.externalId, embedding);
    }
  }

  // ... existing retry loop ...
}
```

### Environment Variables

**Add to backend/.env:**
```bash
# OpenAI Embeddings (for semantic duplicate detection)
OPENAI_API_KEY=sk-...
```

**No other configuration needed.** OpenAI SDK auto-detects API key from environment.

## Cost Analysis

### One-Time Audit (Existing 639 Questions)

**Embedding cost:**
- 639 questions × ~500 tokens/question = 319,500 tokens (~320K)
- Batch API: 320K ÷ 1M × $0.01 = **$0.0032**
- Standard API: 320K ÷ 1M × $0.02 = **$0.0064**

**Recommendation:** Use Batch API. 24-hour completion is acceptable for one-time audit. Save 50%.

### New Question Generation (~140 Questions)

**Embedding cost:**
- 140 questions × ~500 tokens/question = 70,000 tokens
- Must use standard API (need immediate results for validation retry loop)
- 70K ÷ 1M × $0.02 = **$0.0014**

**Combined generation cost:**
- Embeddings: $0.0014
- Claude API generation (existing): ~$0.50 (based on existing generation logs)
- **Total: $0.50** (embedding cost is negligible)

### Total v1.6 Milestone Cost

- Audit embeddings: **$0.0032** (batch)
- Generation embeddings: **$0.0014**
- Claude generation API: **~$0.50** (prompt caching reduces this significantly)
- **Grand total: ~$0.51**

**Covered by free credits:** OpenAI's $5 free credit covers all embedding costs 1,500x over. This milestone costs essentially $0 for embeddings.

**Sources:**
- [OpenAI Embeddings Pricing Calculator](https://costgoat.com/pricing/openai-embeddings)
- [OpenAI Batch API FAQ](https://help.openai.com/en/articles/9197833-batch-api-faq)

## Performance Characteristics

### Batch Embedding Performance

**639 questions with concurrency limit = 10:**
- OpenAI standard API: ~3 seconds (10 concurrent requests × 64 batches × 5ms latency)
- OpenAI batch API: 24 hours (acceptable for one-time audit)

**Real-world timing:**
```
Embed 639 questions (standard API, p-limit=10): ~5 seconds
Find duplicates (cosine similarity, all pairs): ~0.2 seconds (639×639÷2 = 203,841 comparisons)
Total audit time: ~5 seconds
```

**Memory usage:**
- 639 embeddings × 1536 dimensions × 8 bytes/float = 7.8 MB
- Trivial for Node.js process (typical heap: 512 MB default)

### Generation Performance Impact

**Per-question overhead during generation:**
- Embed new question: ~50ms (standard API)
- Compare against 639 existing embeddings: <1ms (in-memory)
- **Total overhead: ~50ms per question**

**Impact on generation pipeline:**
- Existing generation time per question: ~5 seconds (Claude API call + validation)
- Added semantic dedup time: 50ms
- **Overhead: 1%** — negligible

## Rate Limits & Batching Strategy

### OpenAI Standard API Limits (Tier 1)

| Metric | Limit | Notes |
|--------|-------|-------|
| Requests per minute (RPM) | 10,000 | More than sufficient |
| Tokens per minute (TPM) | 2,000,000 | 639 questions = 320K tokens = well under limit |
| Tokens per request | 8,191 | Single question ~500 tokens = no issue |

**Strategy:** Use p-limit(10) for safety margin. No special batching needed.

### OpenAI Batch API Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Max batch size | 50,000 requests | 639 questions << 50K limit |
| Max file size | 200 MB | JSONL with 639 questions ~2 MB |
| Completion time | 24 hours | Acceptable for one-time audit |

**Strategy:** Submit all 639 questions as single batch for audit. 50% cost savings.

**Sources:**
- [OpenAI Batch API Reference](https://platform.openai.com/docs/api-reference/batch)
- [OpenAI Rate Limits Documentation](https://platform.openai.com/docs/guides/rate-limits)

## Migration Path & Rollback

### Phase 1: Audit (No Schema Changes)

**Add dependencies:**
```bash
npm install openai fast-cosine-similarity
```

**No database changes.** Embeddings stored in-memory during audit script execution.

**Rollback:** Remove npm packages. Zero risk.

### Phase 2: Integrate with Generation

**Update quality-validation.ts** to accept optional EmbeddingCache.

**No database changes.** Embeddings only used during generation, not persisted.

**Rollback:** Remove embeddingCache parameter, calls fall back to existing exact-text duplicate detection.

### Phase 3: Archive Duplicates (Manual)

**Human reviews duplicate report, archives questions via admin UI.**

**Uses existing archive functionality.** No new code paths.

**Rollback:** Unarchive questions via admin UI if needed.

### Phase 4: Generate New Content

**Use updated generation pipeline with semantic dedup.**

**No schema changes.** New questions follow existing seed process.

**Rollback:** If semantic dedup too aggressive, lower threshold in script. Already-generated questions unaffected.

## Success Metrics

### Deduplication Effectiveness

**Goal:** Identify and archive semantic duplicates across 639 questions.

**Measurement:**
- Number of duplicate groups found
- Average similarity score within groups
- Manual review confirmation rate (% of flagged pairs that human agrees are duplicates)

**Target:** Find 20-50 semantic duplicate groups (based on manual spot-check showing "significant semantic duplicates within and across collections").

### Generation Quality

**Goal:** Prevent generating new semantic duplicates.

**Measurement:**
- Number of new questions rejected for semantic similarity
- Regeneration attempts per question (should stay low if threshold tuned correctly)
- Post-generation audit: 0 semantic duplicates above 0.85 threshold

**Target:** <5% rejection rate for semantic duplicates during generation (indicates well-tuned threshold).

### Performance

**Goal:** Minimal overhead to existing generation pipeline.

**Measurement:**
- Time per question with/without semantic dedup
- Memory usage during generation
- API costs

**Target:**
- <100ms overhead per question
- <10MB additional memory usage
- <$0.01 embedding cost per 100 questions generated

## Dependencies Summary

### New Required Dependencies

```json
{
  "openai": "^4.73.0",
  "fast-cosine-similarity": "^1.2.2"
}
```

### New Environment Variables

```bash
OPENAI_API_KEY=sk-...  # Free $5 credit for new accounts
```

### No Other Changes

- **No database migrations**
- **No new services** (Redis, vector DB, etc.)
- **No schema changes**
- **No production infrastructure changes**

Total additional bundle size: ~50KB (openai SDK) + 2KB (fast-cosine-similarity) = **52KB**

This is well within the project's 300KB bundle limit, and these libraries are backend-only (not shipped to frontend).

## Alternative Considered: Anthropic Message Batches API

**What it is:** Anthropic's Message Batches API for 50% discount on async Claude API calls.

**Why not for embeddings:** Anthropic doesn't offer embeddings. This API is for text generation (messages.create), not embeddings.

**Potential use:** Could use Message Batches API for bulk question generation if generating 100+ questions at once. But existing generation pipeline already uses prompt caching for 90% cost savings, so Message Batches API offers marginal additional benefit.

**Verdict:** Not applicable for semantic deduplication. Not worth adding for generation (prompt caching already optimized).

**Sources:**
- [Anthropic Message Batches API](https://www.anthropic.com/engineering/advanced-tool-use)

## Conclusion

**Recommended additions for v1.6:**
1. `openai` npm package for text-embedding-3-small embeddings
2. `fast-cosine-similarity` for vector similarity computation
3. Use existing `p-limit` for rate limit compliance
4. New utility files: `semantic-dedup.ts` and `embedding-cache.ts`
5. Integrate EmbeddingCache with existing quality-validation.ts

**Total cost:** ~$0.51 (covered by OpenAI free credits)
**Total bundle impact:** +52KB backend-only
**Total complexity:** Minimal — two new utility files, no schema changes, no new services

**Anti-recommendations:**
- NO pgvector (overkill for one-time audit)
- NO vector databases (scale mismatch)
- NO LangChain (unnecessary abstraction)
- NO Voyage AI (OpenAI simpler and sufficient)

This approach provides semantic duplicate detection with minimal complexity, zero production risk, and negligible cost.
