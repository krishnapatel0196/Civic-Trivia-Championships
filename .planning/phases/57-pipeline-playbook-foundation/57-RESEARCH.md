# Phase 57: Pipeline & Playbook Foundation - Research

**Researched:** 2026-03-09
**Domain:** Generation pipeline enhancement, pre-activation audit tooling, living playbook documentation
**Confidence:** HIGH — all findings based on direct codebase inspection

## Summary

Phase 57 has two implementation tracks and one documentation deliverable. Track A (PIPELINE-01) integrates semantic near-duplicate detection into `generate-locale-questions.ts` so the OpenAI embedding scan runs automatically after generation for each collection, instead of requiring a separate manual `scan-duplicates.ts` run. Track B (PIPELINE-02) extends `audit-collection-readiness.ts` to warn when a collection's expiring-question ratio is below 15%. The documentation deliverable (PLAYBOOK-01) creates `.planning/COLLECTION-PLAYBOOK.md` bootstrapped with learnings from Phases 47–52.

**Key infrastructure finding:** The semantic dedup services already exist and are production-tested. `OpenAIEmbeddingService`, `SemanticDupDetector`, `ClusterBuilder`, and `DuplicateDetector` are all in `backend/src/services/`. The `generate-locale-questions.ts` pipeline already uses `DuplicateDetector` (exact-text matching) but does NOT use the OpenAI embedding pipeline. The gap is precisely that semantic similarity checking (cosine similarity on embeddings) is absent from the generation workflow. `scan-duplicates.ts` implements this correctly but must be run separately.

**Second key finding:** `audit-collection-readiness.ts` already counts `expiresAt IS NOT NULL AND expiresAt <= 90 days` to compute a "net count" (total minus expiring). It does NOT currently check the ratio of expiring questions to total, nor warn when that ratio is below 15%. Adding this check is a small, surgical addition to the existing audit script.

**Primary recommendation:** Wire the existing semantic dedup services into the generation pipeline post-batch; add a ratio check to the audit script using queries that already exist in it; write the playbook from accumulated knowledge in phase summaries and STATE.md.

## Standard Stack

No new dependencies are needed. All libraries are already installed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | ^6.22.0 | OpenAI embedding API | Already in `package.json` dependencies (not devDependencies) |
| p-limit | ^7.3.0 | Concurrency control for embedding API calls | Already in `package.json` |
| @anthropic-ai/sdk | ^0.74.0 | Claude API for question generation | Already in devDependencies |

### Existing Internal Services (no new code needed)
| Service | Location | Purpose |
|---------|----------|---------|
| `OpenAIEmbeddingService` | `backend/src/services/embeddings/OpenAIEmbeddingService.ts` | Embeds question text, caches to `.embedding-cache/`, rate-limits with p-limit(10) |
| `SemanticDupDetector` | `backend/src/services/embeddings/SemanticDupDetector.ts` | Cosine similarity calculation, tier classification (>0.95 exact, >0.85 near-dup, >0.75 possible) |
| `ClusterBuilder` | `backend/src/services/embeddings/ClusterBuilder.ts` | Union-find clustering of similar pairs |
| `DuplicateDetector` | `backend/src/services/qualityRules/rules/duplicate.ts` | Exact-text dedup, already integrated in pipeline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI text-embedding-3-small | Skip semantic dedup in pipeline | Manual pass still required; defeats PIPELINE-01 requirement |
| In-pipeline semantic dedup | Background job after seeding | Adds complexity; requirement says "no separate manual pass" |
| Full cross-collection scan in pipeline | Per-collection scan only | Cross-collection scan at generation time is expensive and premature; cross-collection dedup is a post-activation concern |

**Installation:** None required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

No new files needed for PIPELINE-01 or PIPELINE-02. Changes are surgical additions to existing files:

```
backend/src/
├── scripts/
│   ├── content-generation/
│   │   └── generate-locale-questions.ts     # PIPELINE-01: add semantic dedup step after generation
│   └── audit-collection-readiness.ts         # PIPELINE-02: add expiring ratio check
└── services/
    └── embeddings/
        └── (all existing, no changes)

.planning/
└── COLLECTION-PLAYBOOK.md                    # PLAYBOOK-01: new file
```

### Pattern 1: Semantic Dedup as Post-Batch Step in generate-locale-questions.ts

**What:** After all batches are generated and seeded, run OpenAI embeddings on the new questions against existing collection questions, surface near-duplicates as a report, and auto-archive confirmed duplicates.

**When to use:** End of every `generate-locale-questions.ts` run (unless `--dry-run`).

**Key design decision:** Semantic dedup in the pipeline should be scoped to within-collection only (same collection slug). Cross-collection dedup is handled by the standalone `scan-duplicates.ts` post-activation workflow. This keeps the pipeline fast (50–120 questions vs. 1,484+ across all collections) and avoids requiring `OPENAI_API_KEY` for all operators.

**Implementation approach:**
1. After all batch generation and seeding completes, query the DB for all questions with this collection's external ID prefix
2. Instantiate `OpenAIEmbeddingService` with the same cache dir as `scan-duplicates.ts`
3. Embed all questions using `SemanticDupDetector.prepareTextForEmbedding(q)` (question text + answer options)
4. Find pairs above `near-duplicate` threshold (>0.85) using `SemanticDupDetector.findAllPairs()`
5. Build clusters using `ClusterBuilder`
6. Print a summary: "Found N near-duplicate clusters. Auto-archiving X questions (keeping Y)."
7. Auto-archive the non-keep members of each cluster by setting `status = 'archived'` in the DB
8. Log which questions were archived and which were kept (with cluster IDs for traceability)

**Guard:** Only run if `OPENAI_API_KEY` is set in environment. Print a clear warning and skip gracefully if not set:
```
[Semantic Dedup] OPENAI_API_KEY not set — skipping semantic duplicate check.
Run scan-duplicates.ts manually after generation to check for semantic duplicates.
```

**Example (pattern from existing scan-duplicates.ts):**
```typescript
// Source: backend/src/scripts/scan-duplicates.ts lines 516–546
const embeddingService = new OpenAIEmbeddingService({
  apiKey: process.env.OPENAI_API_KEY,
  cacheDir: resolve(process.cwd(), '.embedding-cache'),
});

const textsToEmbed = questions.map(q => ({
  id: q.externalId,
  text: SemanticDupDetector.prepareTextForEmbedding(q),
}));

const embeddings = await embeddingService.embedBatch(textsToEmbed);
embeddingService.saveCache();

const pairs = SemanticDupDetector.findAllPairs(questions, embeddings, 'near-duplicate');
const tierMap = await loadCollectionTierMap();
const clusterBuilder = new ClusterBuilder(tierMap);
const clusters = clusterBuilder.buildClusters(pairs, questionMap);
```

### Pattern 2: Expiring Ratio Check in audit-collection-readiness.ts

**What:** After the existing net-count check, add a ratio check: count total questions (draft + active) and count those with `expiresAt IS NOT NULL`. Compute ratio. If ratio < 15%, print a WARNING but do NOT block (exit 0 still, since this is a quality target not a hard gate).

**When to use:** Every `audit-collection-readiness.ts` run.

**Key design decision:** The ratio check is a WARNING, not a BLOCK. The existing script exits 1 only when `netCount < 50`. The expiring ratio check should print a visible warning but not change the exit code. Rationale: collections can be legitimately durable-heavy (Federal collection, historical collections) and blocking activation on ratio alone would be too aggressive.

**Implementation approach — surgical addition to existing Step 5 area:**
```typescript
// After Step 4 (expiringCount calculation), add:

// Step 5b: Expiring ratio check
const [expiringCountResult2] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(
    sql`
      ${questions.externalId} LIKE ${prefixPattern}
      AND ${questions.status} IN ('draft', 'active')
      AND ${questions.expiresAt} IS NOT NULL
    `
  );

const expiringRatioCount = expiringCountResult2?.count ?? 0;
const expiringRatio = totalCount > 0 ? expiringRatioCount / totalCount : 0;
const expiringRatioPercent = Math.round(expiringRatio * 100);
const EXPIRING_RATIO_MIN = 0.15;
const expiringRatioOk = expiringRatio >= EXPIRING_RATIO_MIN;
```

**Print in the audit report:**
```
  Expiring Ratio:  X% (Y questions with expiresAt set)
  Target Ratio:    15–30%
  Verdict:         [OK | WARNING: Below 15% target]
```

**Note:** The existing `expiringCount` query already counts `expiresAt IS NOT NULL AND expiresAt <= 90 days` (for net count). The ratio query should count ALL questions with any non-null expiresAt, regardless of how soon they expire. These are two different counts for two different purposes.

### Pattern 3: COLLECTION-PLAYBOOK.md Structure

**What:** A living markdown document at `.planning/COLLECTION-PLAYBOOK.md` that serves as institutional memory for the collection creation workflow.

**Sections to include based on accumulated learnings:**
1. **The Standard Workflow** — 7-step process (scaffold → seed → locale config → generate → curate → banner → activate)
2. **Known Bugs and Workarounds** — Scaffold Bug 2 (step3 inserts into type annotation line)
3. **Content Patterns** — Mixed-durability pattern, expiring ratio targets, voice guidance conventions
4. **Quality Conventions** — Tagline standards, banner image rules, no addresses/phones rule
5. **Near-Duplicate Detection Gap (Resolved)** — Historical note that v1.9 required manual pass; Phase 57 closes gap
6. **Retrospective Template** — Per-collection retrospective format ready to fill in

**Phase 47–52 learnings to bootstrap from:**
- Phase 47: DB-driven tier map; state auto-discovery via dynamic import in state-configs/
- Phase 48: Cambridge MA activation; note that city collections use city locale configs (not state-configs/)
- Phase 49: Cambridge MA — scaffold + generate + curate pattern confirmed
- Phase 50: Massachusetts State — first state collection with state-system-prompt
- Phase 51: Plano TX — city collection, standard city flow
- Phase 52: Texas State — mixed-durability pattern introduced; Scaffold Bug 2 documented; `stateFeatures` export pattern established

### Anti-Patterns to Avoid

- **Running semantic dedup separately after every collection:** PIPELINE-01 closes this gap; do not maintain a separate manual step
- **Blocking activation on expiring ratio:** The check is a warning, not a gate; some collections are legitimately durable-heavy
- **Using `expiresAt <= 90 days` for ratio calculation:** This is for the net-count (blocking) check; ratio uses ALL non-null expiresAt questions
- **Cross-collection semantic dedup in the pipeline:** Too expensive and premature at generation time; use `scan-duplicates.ts` post-activation
- **Requiring OPENAI_API_KEY for the pipeline to run:** Must degrade gracefully with a warning; not all generation runs need it

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic similarity calculation | Custom vector math | `SemanticDupDetector.cosineSimilarity()` + `findAllPairs()` | Already production-tested, includes tier classification |
| Embedding generation | Direct OpenAI calls | `OpenAIEmbeddingService.embedBatch()` | Rate limiting, caching, retry logic all included |
| Cluster building | Custom union-find | `ClusterBuilder.buildClusters()` | Handles transitive closure, tier-aware keep/archive recommendations |
| Text normalization for dedup | Custom text normalization | `normalizeText()` from `duplicate.ts` | Already used for exact dedup; consistent behavior |
| "Keep vs archive" recommendation | Custom ranking | `ClusterBuilder` recommendation logic | Already implements Federal > State > City tier preference + quality score fallback |

**Key insight:** The semantic dedup infrastructure from Phase 31 was explicitly designed as reusable services. Phase 57's job is to wire the pipeline to these services, not build new ones.

## Common Pitfalls

### Pitfall 1: Scope Creep on Semantic Dedup
**What goes wrong:** Trying to run cross-collection dedup in the pipeline (comparing all 1,484+ questions across all 12 collections).
**Why it happens:** `scan-duplicates.ts` does this, so it seems natural to replicate it.
**How to avoid:** Scope the pipeline semantic dedup to within-collection only. Cross-collection dedup is a post-activation governance concern. The pipeline dedup only needs to ensure new questions don't duplicate existing ones in the same collection.
**Warning signs:** Generation run taking >5 minutes for embedding alone.

### Pitfall 2: Blocking on Missing OPENAI_API_KEY
**What goes wrong:** Generation pipeline exits with error when `OPENAI_API_KEY` is not set, breaking developer workflows.
**Why it happens:** `OPENAI_API_KEY` is required by `scan-duplicates.ts` but NOT currently required by the generation pipeline (which uses `ANTHROPIC_API_KEY`).
**How to avoid:** Guard the semantic dedup block with `if (!process.env.OPENAI_API_KEY)` and skip gracefully with a printed warning.
**Warning signs:** `generate-locale-questions.ts` fails before generating any questions.

### Pitfall 3: Double-Counting in Expiring Ratio vs Net Count
**What goes wrong:** Using the same `expiresAt <= 90 days` query for both the net count and the ratio check produces incorrect ratios.
**Why it happens:** The existing `expiringCount` in `audit-collection-readiness.ts` counts only questions expiring within 90 days (for the net-count calculation). The ratio check should count ALL questions with any non-null `expiresAt`.
**How to avoid:** Write a separate SQL query for the ratio: `expiresAt IS NOT NULL` with no date filter.
**Warning signs:** A collection with 30% expiring questions (all expiring in 18 months) reports 0% ratio.

### Pitfall 4: Auto-Archiving Without Traceability
**What goes wrong:** Semantic dedup in the pipeline archives questions with no record of why, making it hard to reverse.
**Why it happens:** Automated archival without logging.
**How to avoid:** Log every archive action with: (a) the externalId archived, (b) the externalId it was a near-duplicate of, (c) the similarity score, and (d) the cluster ID. This mirrors the existing admin UI audit trail pattern.
**Warning signs:** Archived questions appear in DB with no explanation in logs.

### Pitfall 5: Playbook Becoming Stale Immediately
**What goes wrong:** COLLECTION-PLAYBOOK.md is written once and never updated as the workflow evolves.
**Why it happens:** No process for updating the playbook after each collection phase.
**How to avoid:** The retrospective template section should explicitly prompt "What changed in the workflow?" and "What should the playbook say differently?" The playbook is a living document, not a one-time artifact.
**Warning signs:** Playbook still references Scaffold Bug 2 as "known/open" after it's been fixed.

## Code Examples

Verified patterns from existing codebase:

### Fetching Collection Questions for Semantic Dedup (from scan-duplicates.ts pattern)
```typescript
// Source: backend/src/scripts/scan-duplicates.ts lines 69–124
// Adapted for single-collection within-pipeline use:
import { db } from '../../db/index.js';
import { sql } from 'drizzle-orm';

async function fetchCollectionQuestions(externalIdPrefix: string) {
  const prefixPattern = externalIdPrefix + '-%';
  const result = await db.execute(sql`
    SELECT
      q.external_id as "externalId",
      q.text,
      q.options,
      q.correct_answer as "correctAnswer",
      q.quality_score as "qualityScore",
      array_agg(c.name ORDER BY c.name) as "collections"
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    JOIN civic_trivia.collections c ON cq.collection_id = c.id
    WHERE q.status IN ('draft', 'active')
      AND q.external_id LIKE ${prefixPattern}
    GROUP BY q.id, q.external_id, q.text, q.options, q.correct_answer, q.quality_score
    ORDER BY q.external_id
  `);
  return result.rows;
}
```

### Expiring Ratio Query (new, distinct from existing net-count query)
```typescript
// Source: Based on existing audit-collection-readiness.ts pattern (lines 132–165)
// This is the RATIO query — counts ALL non-null expiresAt, no date filter:
const [expiringRatioResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(
    sql`
      ${questions.externalId} LIKE ${prefixPattern}
      AND ${questions.status} IN ('draft', 'active')
      AND ${questions.expiresAt} IS NOT NULL
    `
  );
// Compare with EXISTING net-count query which has: AND ${questions.expiresAt} <= ${ninetyDaysFromNow}
// The ratio query intentionally omits that date filter.
```

### Graceful OPENAI_API_KEY Guard
```typescript
// Source: pattern from generate-locale-questions.ts env check (line 349)
if (!process.env.OPENAI_API_KEY) {
  console.log('\n[Semantic Dedup] OPENAI_API_KEY not set — skipping semantic duplicate check.');
  console.log('  To enable: add OPENAI_API_KEY to backend/.env and re-run.');
  // Continue — this is not a fatal error
} else {
  // Run semantic dedup
}
```

### Archive Near-Duplicate with Traceability
```typescript
// Source: pattern from archive-db-duplicates.ts + scan-duplicates.ts recommendation logic
import { eq } from 'drizzle-orm';

async function archiveNearDuplicate(
  externalIdToArchive: string,
  keepExternalId: string,
  score: number,
  clusterId: string
): Promise<void> {
  await db
    .update(questions)
    .set({ status: 'archived' })
    .where(eq(questions.externalId, externalIdToArchive));

  console.log(
    `  [Semantic Dedup] Archived ${externalIdToArchive} ` +
    `(near-duplicate of ${keepExternalId}, score: ${score.toFixed(3)}, cluster: ${clusterId})`
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `scan-duplicates.ts` after each collection | Semantic dedup integrated in pipeline | Phase 57 | No separate manual pass required |
| Net-count only in readiness audit | Net-count + expiring ratio warning | Phase 57 | Enforces 15–30% expiring target before activation |
| No collection workflow documentation | `COLLECTION-PLAYBOOK.md` | Phase 57 | Institutional memory captured; retrospective template standardized |
| Exact-text dedup only in pipeline | Exact-text + semantic near-dup in pipeline | Phase 57 | Near-duplicates caught at generation time, not post-activation |

**Current exact-text dedup (stays in place):**
- `DuplicateDetector` in `generate-locale-questions.ts` catches exact/normalized text matches within-batch and against the existing data file
- This runs synchronously, requires no API key, and handles the common case
- The new semantic dedup layer adds coverage for paraphrased near-duplicates that pass text normalization

## Open Questions

1. **Where to load existing collection questions for semantic dedup**
   - What we know: The pipeline currently loads from a local JSON data file (`src/data/{slug}-questions.json`) for the `DuplicateDetector`. For semantic dedup, we need the full text + options for cosine comparison.
   - What's unclear: Some newer collections (cambridge-ma, plano-tx, texas-state, massachusetts) do NOT have a corresponding data file in `src/data/`. The data file path is `src/data/{config.collectionSlug}-questions.json`.
   - Recommendation: Query the DB directly for the semantic dedup step (as `scan-duplicates.ts` does), not from the data file. This ensures completeness for all collections regardless of whether a local data file exists.

2. **Threshold for auto-archival in pipeline**
   - What we know: `scan-duplicates.ts` uses `near-duplicate` (>0.85) as the default minimum tier. The admin review workflow was used for v1.6 dedup.
   - What's unclear: Should the pipeline auto-archive without review, or just report?
   - Recommendation: Auto-archive `near-duplicate` (>0.85) tier and above without review — these are high-confidence duplicates. Print a summary table. Add `--skip-semantic-dedup` flag to allow bypassing for special cases.

3. **Performance impact on generation runs**
   - What we know: For a 90-question collection, embedding 90 questions at p-limit(10) takes ~9 API calls (10 concurrent), ~5–10 seconds.
   - What's unclear: Whether the embedding cache from previous runs will be hit.
   - Recommendation: Reuse the same cache dir as `scan-duplicates.ts` (`.embedding-cache/`). On subsequent runs for the same collection, cache hits will make the dedup step near-instant.

4. **Whether expiring ratio check should be retroactive for existing collections**
   - What we know: Federal and some city collections may have 0% expiring questions by design.
   - What's unclear: Should `audit-collection-readiness.ts` warn for already-active collections too?
   - Recommendation: The warning is appropriate for all collections (active or not). Federal collection is a known exception — its questions are structural/constitutional, not tied to current officials. The warning is advisory, not blocking, so the Federal collection can continue to print a warning without it causing CI failure.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `backend/src/scripts/content-generation/generate-locale-questions.ts` — full file read, lines 426–445 show existing DuplicateDetector integration and gap
- Direct codebase inspection: `backend/src/scripts/audit-collection-readiness.ts` — full file read, lines 152–165 show existing expiring count logic and gap
- Direct codebase inspection: `backend/src/scripts/scan-duplicates.ts` — full file read, lines 489–670 show semantic dedup pattern to replicate
- Direct codebase inspection: `backend/src/services/embeddings/` — all 5 files read; confirmed all services exist and are production-tested
- Direct codebase inspection: `backend/src/services/qualityRules/rules/duplicate.ts` — exact dedup service already integrated
- `.planning/STATE.md` — confirms PIPELINE-01 and PIPELINE-02 requirements, Scaffold Bug 2, mixed-durability pattern
- `backend/package.json` — confirms `openai` ^6.22.0 and `p-limit` ^7.3.0 are production dependencies

### Secondary (MEDIUM confidence)
- `.planning/phases/31-semantic-deduplication-infrastructure/31-RESEARCH.md` — prior research on OpenAI embedding approach; thresholds (>0.95/0.85/0.75) confirmed to be working values
- `.planning/phases/52-texas-state-collection/52-RESEARCH.md` — mixed-durability pattern first established here
- `.planning/phases/47-collection-infrastructure/47-RESEARCH.md` — state auto-discovery and DB tier map patterns

### Tertiary (LOW confidence)
- None — all critical findings verified from codebase directly.

## Metadata

**Confidence breakdown:**
- PIPELINE-01 (semantic dedup in pipeline): HIGH — existing services are complete; integration pattern is clear from scan-duplicates.ts
- PIPELINE-02 (expiring ratio check): HIGH — existing query structure in audit-collection-readiness.ts is minimal change
- PLAYBOOK-01 (collection playbook): HIGH — content is accumulated project knowledge, no technical unknowns
- Standard stack: HIGH — no new dependencies; all verified in package.json
- Architecture: HIGH — all based on direct codebase inspection of production-shipped code
- Pitfalls: HIGH — most based on observable gaps in current implementation

**Research date:** 2026-03-09
**Valid until:** ~60 days (stable codebase; main risk is new collection phases changing the workflow)
