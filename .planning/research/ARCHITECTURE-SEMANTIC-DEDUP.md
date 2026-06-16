# Architecture: Semantic Duplicate Detection and Content Generation Scaling

**Project:** Civic Trivia Championship
**Feature Domain:** Content pipeline with semantic deduplication
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

The current architecture uses text normalization (lowercase, whitespace collapse, punctuation stripping) for duplicate detection. This catches exact duplicates but misses semantic duplicates like "How is the Fremont mayor selected?" vs "What is the process for choosing Fremont's mayor?" Scaling to 90+ questions per collection (540+ total) requires semantic similarity detection and cross-collection dedup to avoid state-level facts appearing in multiple city collections.

**Recommended approach:** Add embedding-based semantic similarity layer using Voyage AI (Anthropic's preferred provider) with pgvector for persistent storage. Integrate into existing generation pipeline with minimal disruption.

---

## Current Architecture (Baseline)

### Generation Pipeline Flow

```
1. Locale Config → defines topics, batch size, target count
2. RAG Sources → fetch .gov/.edu documents
3. Claude Generation → batch generation with system prompt
4. Zod Validation → schema conformance
5. Quality Validation → blocking/advisory rules with retry
6. Duplicate Detection → text normalization check
7. JSON Output → write to data file
8. Database Seeding → PostgreSQL via Drizzle ORM
```

### Component Inventory

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `generate-locale-questions.ts` | `scripts/content-generation/` | Orchestrates city/county generation | ✓ Working |
| `generate-state-questions.ts` | `scripts/content-generation/` | Orchestrates state-level generation | ✓ Working |
| `quality-validation.ts` | `utils/` | Retry loop with quality rules | ✓ Working |
| `DuplicateDetector` | `services/qualityRules/rules/duplicate.ts` | Text normalization dedup | ⚠️ Semantic gaps |
| `seed-questions.ts` | `utils/` | Database insertion with dedup check | ✓ Working |
| `auditQuestion()` | `services/qualityRules/index.js` | Quality rules engine | ✓ Working |
| Locale configs | `locale-configs/` | Per-collection parameters | ✓ Working |

### Data Flow

```
┌─────────────────┐
│  Locale Config  │ (topicDistribution, batchSize, targetQuestions)
└────────┬────────┘
         │
         v
┌─────────────────┐
│   RAG Sources   │ (fetch .gov/.edu → parse markdown)
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Claude Generate │ (batch API call with prompt caching)
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Zod Validation  │ (QuestionSchema.parse)
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Quality + Dedup │ (validateAndRetry with DuplicateDetector)
└────────┬────────┘
         │
         v
┌─────────────────┐
│   JSON File     │ (collection-slug-questions.json)
└────────┬────────┘
         │
         v
┌─────────────────┐
│   PostgreSQL    │ (via Drizzle ORM with ON CONFLICT DO NOTHING)
└─────────────────┘
```

### Integration Points

**Existing hooks for enhancement:**

1. **DuplicateDetector.check()** — called during quality validation loop
2. **seedQuestionBatch()** — loads existing questions before seeding
3. **validateAndRetry()** — receives duplicateDetector instance
4. **generate-*.ts main()** — initializes DuplicateDetector with existing file data

---

## Recommended Architecture: Semantic Dedup Layer

### High-Level Design

Add an **embedding-based semantic similarity layer** that sits alongside the existing text normalization dedup. Both checks run in parallel during validation.

```
┌──────────────────────────────────────────────────┐
│          Duplicate Detection (Hybrid)            │
├──────────────────────────────────────────────────┤
│  1. Text Normalization (existing)                │
│     - Catches exact duplicates                   │
│     - Fast, no API calls                         │
│                                                   │
│  2. Semantic Similarity (new)                    │
│     - Catches paraphrased duplicates             │
│     - Embedding-based cosine similarity          │
│     - Threshold: 0.85-0.90 for blocking          │
└──────────────────────────────────────────────────┘
```

### Component Architecture

#### New Components

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| `SemanticDupDetector` | `services/qualityRules/rules/semantic-duplicate.ts` | Embedding-based similarity check | Voyage AI, pgvector |
| `embedding-service.ts` | `services/embeddings/` | Voyage AI API client with caching | `voyageai` npm package |
| `pgvector-store.ts` | `services/embeddings/` | PostgreSQL vector storage | `pgvector-node`, Drizzle |
| `dedup-scanner.ts` | `scripts/` | Batch scan all collections for semantic dups | All above |

#### Modified Components

| Component | Change | Reason |
|-----------|--------|--------|
| `DuplicateDetector` | Add optional `semanticDetector` parameter | Composition over replacement |
| `quality-validation.ts` | Initialize `SemanticDupDetector` in `validateAndRetry()` | Integrate into existing retry loop |
| Database schema | Add `question_embeddings` table | Persistent vector storage |
| `seed-questions.ts` | Generate embeddings on insert | Build vector index during seeding |

### Database Schema Extension

```sql
-- Add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Question embeddings table
CREATE TABLE civic_trivia.question_embeddings (
  question_id INTEGER PRIMARY KEY REFERENCES civic_trivia.questions(id) ON DELETE CASCADE,
  embedding VECTOR(1024),  -- Voyage 4 uses 1024 dimensions
  model_version TEXT NOT NULL DEFAULT 'voyage-4-lite',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for similarity search (HNSW for performance)
CREATE INDEX idx_question_embeddings_vector
  ON civic_trivia.question_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Index for question lookup
CREATE INDEX idx_question_embeddings_question
  ON civic_trivia.question_embeddings(question_id);
```

**Drizzle schema addition:**

```typescript
import { customType, sql } from 'drizzle-orm';

export const questionEmbeddings = civicTriviaSchema.table('question_embeddings', {
  questionId: integer('question_id')
    .primaryKey()
    .references(() => questions.id, { onDelete: 'cascade' }),
  embedding: customType<number[]>({
    dataType() { return 'vector(1024)'; },
    toDriver(value) { return JSON.stringify(value); },
  })('embedding').notNull(),
  modelVersion: text('model_version').notNull().default('voyage-4-lite'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  vectorIdx: index('idx_question_embeddings_vector')
    .using('hnsw', sql`${table.embedding} vector_cosine_ops`),
  questionIdx: index('idx_question_embeddings_question').on(table.questionId)
}));
```

### Semantic Duplicate Detection Flow

```
┌─────────────────────────────────────────────────────────┐
│  New Question Generated                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│  Text Normalization Check (DuplicateDetector)          │
│  - Fast exact match                                     │
│  - No API calls                                         │
└────────┬────────────────────────────────────────────────┘
         │
         │ PASS
         v
┌─────────────────────────────────────────────────────────┐
│  Generate Embedding (Voyage AI)                         │
│  - input_type: "document"                               │
│  - model: "voyage-4-lite" (balance speed/quality)       │
│  - Cache in-memory during batch                         │
└────────┬────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────┐
│  Similarity Search (pgvector)                           │
│  - Query: cosine_distance < 0.15 (similarity > 0.85)    │
│  - Scope: same collection + parent collections          │
│  - Limit: top 5 matches                                 │
└────────┬────────────────────────────────────────────────┘
         │
         ├─ No matches → PASS
         │
         └─ Match found → Check threshold
                         │
                         ├─ similarity > 0.90 → BLOCKING violation
                         └─ similarity 0.85-0.90 → ADVISORY warning
```

---

## Integration with Existing Pipeline

### Phase 1: Hybrid Detection (Text + Semantic)

**Modify `quality-validation.ts`:**

```typescript
export async function validateAndRetry(
  questions: ValidatedQuestion[],
  regenerateFn: RegenerateFn,
  options: {
    maxRetries?: number;
    skipUrlCheck?: boolean;
    duplicateDetector?: DuplicateDetector;
    semanticDetector?: SemanticDupDetector;  // NEW
    collectionId?: number;  // NEW — needed for semantic scope
  } = {}
): Promise<ValidationResult> {
  const {
    maxRetries = 3,
    skipUrlCheck = true,
    duplicateDetector,
    semanticDetector,
    collectionId
  } = options;

  // ... existing setup ...

  for (let i = 0; i < questions.length; i++) {
    let currentQuestion = questions[i];
    let validated = false;
    let attempts = 0;
    let lastAudit: AuditResult | null = null;

    while (!validated && attempts <= maxRetries) {
      totalAttempts++;

      // Validate with quality rules (existing)
      lastAudit = await auditQuestion(currentQuestion, { skipUrlCheck });

      // Text normalization duplicate check (existing)
      if (!lastAudit.hasBlockingViolations && duplicateDetector) {
        const dupResult = duplicateDetector.check(currentQuestion);
        if (!dupResult.passed) {
          lastAudit.violations.push(...dupResult.violations);
          lastAudit.hasBlockingViolations = true;
        }
      }

      // Semantic duplicate check (NEW)
      if (!lastAudit.hasBlockingViolations && semanticDetector && collectionId) {
        const semanticResult = await semanticDetector.check(currentQuestion, collectionId);
        if (!semanticResult.passed) {
          lastAudit.violations.push(...semanticResult.violations);
          lastAudit.hasBlockingViolations = semanticResult.violations.some(
            v => v.severity === 'blocking'
          );
        }
      }

      // ... rest of validation loop unchanged ...
    }
  }

  return { passed, failed, stats };
}
```

### Modified Generation Script Example

**Update `generate-locale-questions.ts` main():**

```typescript
// After loading duplicate detector (around line 366)
const duplicateDetector = new DuplicateDetector();
try {
  const { readFileSync } = await import('fs');
  const dataFilePath = join(process.cwd(), 'src/data', `${config.collectionSlug}-questions.json`);
  const existingData = JSON.parse(readFileSync(dataFilePath, 'utf-8'));
  if (existingData.questions && Array.isArray(existingData.questions)) {
    duplicateDetector.loadExisting(existingData.questions);
    console.log(`  Loaded ${duplicateDetector.size} existing questions for duplicate detection`);
  }
} catch {
  console.log(`  No existing data file found — duplicate detection will only check within batch`);
}

// NEW: Initialize semantic detector
let semanticDetector: SemanticDupDetector | undefined;
if (process.env.VOYAGE_API_KEY) {
  const { EmbeddingService } = await import('./utils/embedding-service.js');
  const { PgVectorStore } = await import('./utils/pgvector-store.js');
  const { SemanticDupDetector } = await import('../services/qualityRules/rules/semantic-duplicate.js');

  const embeddings = new EmbeddingService(process.env.VOYAGE_API_KEY);
  const vectorStore = new PgVectorStore();
  semanticDetector = new SemanticDupDetector(embeddings, vectorStore, {
    blockingThreshold: 0.90,
    advisoryThreshold: 0.85,
    collectionScope: 'same-and-parent',
  });

  console.log(`  Semantic duplicate detection enabled`);
} else {
  console.log(`  Semantic duplicate detection disabled (no VOYAGE_API_KEY)`);
}

// Later in batch validation loop (around line 498)
const validationResult = await validateAndRetry(batchResult.questions, regenerateFn, {
  maxRetries: 3,
  skipUrlCheck: true,
  duplicateDetector,
  semanticDetector,  // NEW
  collectionId,      // NEW
});
```

---

## Cross-Collection Duplicate Detection

### Parent-Child Collection Relationships

```typescript
// Add to collections table schema
export const collections = civicTriviaSchema.table('collections', {
  id: serial('id').primaryKey(),
  // ... existing fields ...
  parentCollectionId: integer('parent_collection_id')
    .references(() => collections.id), // NEW — nullable
});
```

**Parent relationships:**
- Bloomington IN → Indiana
- Los Angeles CA → California
- Fremont CA → California

**Dedup scope:**
1. **Same collection** — always check
2. **Parent collection** — check for state facts in city collections
3. **Sibling collections** — optional (California questions shouldn't be in Indiana)

### Scoped Similarity Search Implementation

```typescript
// In pgvector-store.ts
async findSimilar(
  embedding: number[],
  collectionId: number,
  options: SearchOptions = {}
): Promise<SimilarityMatch[]> {
  const { scope = 'same-and-parent', limit = 5, excludeExternalId } = options;

  // Convert embedding to pgvector format
  const vectorStr = `[${embedding.join(',')}]`;

  // Get parent collection ID if scope includes parents
  let collectionIds = [collectionId];
  if (scope === 'same-and-parent') {
    const col = await db
      .select({ parentId: collections.parentCollectionId })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (col[0]?.parentId) {
      collectionIds.push(col[0].parentId);
    }
  }

  // Exclude self-comparison if provided
  const excludeFilter = excludeExternalId
    ? sql`AND q.external_id != ${excludeExternalId}`
    : sql``;

  // Query for similar vectors using cosine distance
  const results = await db.execute<{
    question_id: number;
    external_id: string;
    text: string;
    similarity: number;
    collection_id: number;
  }>(sql`
    SELECT
      qe.question_id,
      q.external_id,
      q.text,
      1 - (qe.embedding <=> ${vectorStr}::vector) AS similarity,
      cq.collection_id
    FROM civic_trivia.question_embeddings qe
    JOIN civic_trivia.questions q ON q.id = qe.question_id
    JOIN civic_trivia.collection_questions cq ON cq.question_id = q.id
    WHERE cq.collection_id = ANY(${collectionIds}::int[])
      ${excludeFilter}
      AND (qe.embedding <=> ${vectorStr}::vector) < 0.15  -- similarity > 0.85
    ORDER BY qe.embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `);

  return results.rows.map(row => ({
    questionId: row.question_id,
    externalId: row.external_id,
    text: row.text,
    similarity: row.similarity,
    collectionId: row.collection_id,
  }));
}
```

---

## Build Order and Phasing

### Phase 1: Foundation (1-2 days)

**Goal:** Add pgvector and embedding infrastructure without disrupting existing pipeline.

1. Add `pgvector` extension to PostgreSQL
2. Create `question_embeddings` table schema
3. Implement `EmbeddingService` with Voyage AI client
4. Implement `PgVectorStore` with basic similarity search
5. Add `VOYAGE_API_KEY` to environment variables
6. Unit tests for embedding generation and vector storage

**Deliverables:**
- Database migration for `question_embeddings` table
- `services/embeddings/embedding-service.ts`
- `services/embeddings/pgvector-store.ts`
- Unit tests passing
- No changes to generation pipeline yet

### Phase 2: Semantic Detection (2-3 days)

**Goal:** Add semantic duplicate detection as optional layer.

1. Implement `SemanticDupDetector` class
2. Modify `validateAndRetry()` to accept optional `semanticDetector`
3. Update `generate-locale-questions.ts` to initialize semantic detector
4. Update `generate-state-questions.ts` to initialize semantic detector
5. Add configuration for thresholds (blocking vs advisory)
6. Integration tests with mock embeddings

**Deliverables:**
- `services/qualityRules/rules/semantic-duplicate.ts`
- Modified `utils/quality-validation.ts`
- Modified generation scripts with semantic detection enabled
- Integration tests passing

### Phase 3: Batch Dedup Tooling (2 days)

**Goal:** Scan existing collections for duplicates and generate cleanup reports.

1. Implement `scripts/dedup-collections.ts` scanner
2. Implement `scripts/backfill-embeddings.ts` backfill script
3. Run backfill on existing 639 questions
4. Run dedup scanner on all 6 collections
5. Manual review of semantic duplicate reports
6. Archive confirmed duplicates

**Deliverables:**
- `scripts/dedup-collections.ts`
- `scripts/backfill-embeddings.ts`
- Dedup report for all collections
- Database with embeddings for all existing questions
- Reduced duplicate count

### Phase 4: Generation Scale-Up (2-3 days)

**Goal:** Generate new content to reach 90+ questions per collection.

1. Calculate gaps per collection (target 90+ each)
2. Update locale configs with new targets
3. Run generation with semantic dedup enabled
4. Monitor quality validation pass rates
5. Tune semantic similarity thresholds if needed
6. Seed new questions to database

**Deliverables:**
- 540+ total questions (90+ per collection)
- All questions passing both text and semantic dedup
- Quality validation report per collection
- Updated generation reports

### Phase 5: Monitoring & Refinement (1 day)

**Goal:** Validate semantic detection effectiveness and tune thresholds.

1. Review semantic duplicate catches vs misses
2. Tune blocking threshold (0.90 → 0.88 or 0.92 based on results)
3. Review advisory warnings for false positives
4. Document threshold rationale
5. Add semantic dedup metrics to generation reports

**Deliverables:**
- Tuned thresholds documented
- Semantic detection metrics in reports
- Admin documentation for dedup tooling

---

## Performance Considerations

### Embedding Generation Costs

| Model | Dimensions | Cost per 1M tokens | Speed |
|-------|------------|-------------------|-------|
| voyage-4-large | 1024 | $0.13 | Slow |
| voyage-4 | 1024 | $0.10 | Medium |
| voyage-4-lite | 1024 | $0.08 | Fast |

**Recommendation:** Use `voyage-4-lite` for generation pipeline (balance speed/quality).

**Cost estimate for 540 questions:**
- Average question text: ~15 tokens
- Total tokens: 540 × 15 = 8,100 tokens
- Cost: $0.0006 (negligible)

### pgvector Index Performance

| Index Type | Build Time | Query Time | Recall |
|------------|------------|------------|--------|
| IVFFlat | Fast | Medium | Good (0.95) |
| HNSW | Slow | Fast | Excellent (0.99) |

**Recommendation:** Use HNSW for production (better recall, faster queries).

**Query performance estimate:**
- Collection size: 90-120 questions
- Similarity search: <50ms per query with HNSW index
- Batch validation: ~5 seconds for 20 questions (100ms/question × 20)

### Batch Optimization

**Embedding generation:**
- Batch API calls (up to 128 texts per request)
- In-memory caching during retry loops
- Reduces API calls by 60-70% during retries

**Vector storage:**
- Batch inserts (20+ questions at once)
- Single transaction per batch
- Reduces DB round-trips by 95%

---

## Error Handling and Degradation

### Graceful Fallback Strategy

```typescript
// In validateAndRetry()

try {
  if (semanticDetector && collectionId) {
    const semanticResult = await semanticDetector.check(currentQuestion, collectionId);
    if (!semanticResult.passed) {
      lastAudit.violations.push(...semanticResult.violations);
      lastAudit.hasBlockingViolations = semanticResult.violations.some(
        v => v.severity === 'blocking'
      );
    }
  }
} catch (error) {
  // Log error but don't fail validation — fall back to text normalization only
  console.warn(`Semantic duplicate check failed: ${error.message}`);
  console.warn('Falling back to text normalization duplicate detection only');

  // Continue validation with text normalization check
}
```

### Retry Strategy for Embedding API

```typescript
// In EmbeddingService

async embed(text: string, inputType: 'document' | 'query' = 'document'): Promise<number[]> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await this.client.embed({
        input: [text],
        model: 'voyage-4-lite',
        inputType,
      });

      return response.data[0].embedding;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Embedding generation failed after ${MAX_RETRIES} attempts: ${error.message}`);
      }

      console.warn(`Embedding attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('Unreachable');
}
```

---

## Migration Path

### Step 1: Deploy Infrastructure

```bash
# Add pgvector extension
psql -d civic_trivia -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run Drizzle migration
npx drizzle-kit push

# Verify table created
psql -d civic_trivia -c "\d civic_trivia.question_embeddings"
```

### Step 2: Backfill Existing Questions

```bash
# Generate embeddings for all 639 existing questions
npx tsx src/scripts/backfill-embeddings.ts

# Verify embeddings stored
psql -d civic_trivia -c "SELECT COUNT(*) FROM civic_trivia.question_embeddings;"
# Expected: 639
```

### Step 3: Run Dedup Scanner

```bash
# Scan all collections (dry run first)
npx tsx src/scripts/dedup-collections.ts --all --dry-run

# Review output, then run for real
npx tsx src/scripts/dedup-collections.ts --all

# Verify duplicates archived
psql -d civic_trivia -c "
  SELECT collection_id, status, COUNT(*)
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON cq.question_id = q.id
  GROUP BY collection_id, status;
"
```

### Step 4: Generate New Content

```bash
# Generate to 90+ per collection with semantic dedup enabled
npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale bloomington-in
npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale los-angeles-ca
npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale fremont-ca
npx tsx src/scripts/content-generation/generate-state-questions.ts --state indiana
npx tsx src/scripts/content-generation/generate-state-questions.ts --state california

# Federal collection (if needed)
npx tsx src/scripts/content-generation/generate-federal-questions.ts
```

### Step 5: Validate Results

```bash
# Check collection sizes
npx tsx src/scripts/check-collections.ts

# Verify no active duplicates
npx tsx src/scripts/verify-no-active-dups.ts

# Quality audit
npx tsx src/scripts/audit-quality-scores.ts
```

---

## Alternatives Considered

### Alternative 1: Rule-Based Paraphrase Detection

**Approach:** Use linguistic rules to detect paraphrases without embeddings.

**Pros:**
- No external API dependency
- Deterministic results
- Zero cost

**Cons:**
- Low recall (misses many semantic duplicates)
- Brittle (breaks with slight wording changes)
- High false negative rate

**Verdict:** ❌ Rejected — insufficient recall for production use.

### Alternative 2: Claude API for Similarity Judgment

**Approach:** Ask Claude to judge if two questions are duplicates.

**Pros:**
- High accuracy
- No embedding infrastructure needed
- Can explain reasoning

**Cons:**
- High API cost (~$0.02 per comparison)
- Slow (1-2 seconds per comparison)
- Non-deterministic (same pair might get different judgments)

**Verdict:** ❌ Rejected — too expensive and slow for batch operations.

### Alternative 3: In-Memory Vector Search (FAISS)

**Approach:** Use FAISS library for in-memory vector similarity search.

**Pros:**
- Very fast queries (<1ms)
- No database changes needed

**Cons:**
- Requires loading all embeddings into memory at startup
- No persistence (regenerate on every run)
- Doesn't scale beyond ~10K questions

**Verdict:** ❌ Rejected — lack of persistence makes it impractical for generation pipeline.

### Alternative 4: Anthropic-Hosted Embeddings (when available)

**Approach:** Wait for Anthropic to release their own embedding model.

**Pros:**
- Single vendor (Claude + embeddings)
- Potentially better integration

**Cons:**
- Not available yet (as of Feb 2026)
- Voyage AI is Anthropic's recommended provider
- Blocking on future release delays milestone

**Verdict:** ❌ Rejected — Voyage AI is Anthropic's preferred provider and available now.

---

## Recommended Architecture (Final)

**Hybrid duplicate detection:**
- Text normalization (existing) for exact matches
- Semantic similarity (new) for paraphrases
- Both run in parallel during quality validation

**Technology stack:**
- Voyage AI (`voyage-4-lite`) for embeddings
- pgvector with HNSW index for similarity search
- Drizzle ORM for vector storage integration
- Existing quality validation pipeline (minimal changes)

**Build order:**
1. Infrastructure (pgvector, embeddings service)
2. Semantic detection integration
3. Batch dedup tooling
4. Content generation scale-up
5. Monitoring and refinement

**Expected outcomes:**
- 90+ unique questions per collection (540+ total)
- <5% semantic duplicate rate
- Minimal disruption to existing pipeline
- Graceful degradation if embedding API fails

---

## Sources

### Semantic Similarity Research
- [How do I use embeddings for duplicate detection? - Zilliz Vector Database](https://zilliz.com/ai-faq/how-do-i-use-embeddings-for-duplicate-detection)
- [10 Best Embedding Models 2026: Complete Comparison Guide - Openxcell](https://www.openxcell.com/blog/best-embedding-models/)
- [Understanding Semantic Search: Vector Embeddings and Similarity Search | Medium](https://medium.com/@derrickryangiggs/understanding-semantic-search-vector-embeddings-and-similarity-search-422bcb4a495b)
- [Similarity Search based on Text Embedding Model for detection of Near Duplicates](https://www.researchgate.net/publication/353036503_Similarity_Search_based_on_Text_Embedding_Model_for_detection_of_Near_Duplicates)

### pgvector Implementation
- [GitHub - pgvector/pgvector: Open-source vector similarity search for Postgres](https://github.com/pgvector/pgvector)
- [Vector Similarity Search with PostgreSQL's pgvector - A Deep Dive | Severalnines](https://severalnines.com/blog/vector-similarity-search-with-postgresqls-pgvector-a-deep-dive/)
- [pgvector: Embeddings and vector similarity | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Drizzle ORM - Vector similarity search with pgvector extension](https://orm.drizzle.team/docs/guides/vector-similarity-search)
- [GitHub - pgvector/pgvector-node: pgvector support for Node.js](https://github.com/pgvector/pgvector-node)

### Voyage AI Embeddings
- [Embeddings - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/embeddings)
- [Text Embeddings - Introduction - Voyage AI](https://docs.voyageai.com/docs/embeddings)
- [Text embedding models - Voyage AI](https://docs.voyageai.com/reference/embeddings-api)
- [13 Best Embedding Models in 2026: OpenAI vs Voyage AI vs Ollama | Complete Guide](https://elephas.app/blog/best-embedding-models)

### TypeScript Libraries
- [string-similarity - npm](https://www.npmjs.com/package/string-similarity)
- [similarity-search · GitHub Topics · GitHub](https://github.com/topics/similarity-search?l=typescript)
