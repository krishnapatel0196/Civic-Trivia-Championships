# Phase 65: Auto-Regenerate Expired Questions - Research

**Researched:** 2026-03-15
**Domain:** Cron augmentation — expiry sweep + inline question generation + semantic dedup
**Confidence:** HIGH

## Summary

Phase 65 is entirely an internal codebase change: augment the existing `runExpirationSweep()` cron function in `backend/src/cron/expirationSweep.ts` so that each archived question immediately triggers generation and seeding of a single replacement question in the same topic. No new libraries are required. All building blocks exist and have been read in full.

The standard approach is to extract replacement logic into a standalone `generateReplacement()` helper function (called from within the expiry loop), pattern it on the `awardPlatformXp` never-throw design: wrap in try/catch, log structured warnings on failure, return a result type rather than throwing. The expiry DB write completes first; replacement generation is a best-effort follow-on. Semantic dedup runs against active-only questions using `runWithinCollectionSemanticDedup` (already in `generate-locale-questions.ts`) adapted for single-question scope, or a targeted embedding comparison.

The cron currently queries only `id`, `externalId`, and `expiresAt`. It must be extended to also select `subcategory` (the topic slug) and join `collectionQuestions` to resolve the collection slug needed for locale config lookup and seeding. The `tryLoadLocaleConfig` pattern from `audit-collection-readiness.ts` (returns null on miss) is the correct loader to reuse or copy.

**Primary recommendation:** Add a `generateReplacement(archivedQuestion, collectionSlug, config)` async function to `expirationSweep.ts` (or a new peer file `replacementGenerator.ts`), wrap it with try/catch so it never throws to the caller, call it after each successful DB archival, and log a structured summary at cron end.

## Standard Stack

All required tools are already in the project. No new npm packages needed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | (project version) | AI question generation | Already used in all generation scripts; `client` and `MODEL` exported from `anthropic-client.ts` |
| `drizzle-orm` | (project version) | DB queries | Already used throughout cron and generation pipeline |
| `openai` | (project version) | Embeddings for semantic dedup | Already used in `OpenAIEmbeddingService.ts` |
| `node-cron` | (project version) | Cron scheduling | Already registered in `startCron.ts` |

### Supporting (already in project)
| Module | Path | Purpose | When to Use |
|--------|------|---------|-------------|
| `anthropic-client.ts` | `src/scripts/content-generation/` | Exports `client` and `MODEL` | Single AI client used by all generators |
| `auditQuestion` | `src/services/qualityRules/index.ts` | Quality rules check | Run on every generated replacement before seeding |
| `runWithinCollectionSemanticDedup` | `generate-locale-questions.ts` | Semantic near-dedup | Adapt for single-question dedup scope |
| `OpenAIEmbeddingService` | `src/services/embeddings/` | Embeddings for cosine sim | Needed for semantic dedup of replacement |
| `SemanticDupDetector` | `src/services/embeddings/` | Near-dup pair detection | Used by `runWithinCollectionSemanticDedup` |
| `tryLoadLocaleConfig` | `src/scripts/audit-collection-readiness.ts` | Null-safe locale config loader | Must be extracted/reused in cron |
| `buildSystemPrompt` | `src/scripts/content-generation/prompts/system-prompt.ts` | System prompt builder | Used by all existing generators |
| `QuestionSchema` | `src/scripts/content-generation/question-schema.ts` | Zod parse of AI response | Validate single-question response |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended File Structure
```
backend/src/cron/
├── expirationSweep.ts        # Modified: add replacement call after archival
├── replacementGenerator.ts   # NEW: generateReplacement() helper
└── startCron.ts              # Unchanged
```

Alternative: inline `generateReplacement` into `expirationSweep.ts`. Either is fine. Separate file is cleaner given the function will be 80-120 lines.

### Pattern 1: Never-Throw Wrapper (mirrors awardPlatformXp)

**What:** The replacement function returns a result object instead of throwing. The expiry loop calls it, checks the result, logs accordingly. The cron's outer try/catch is never triggered by generation failures.

**When to use:** Any side-effect that must not abort the primary operation.

**Verified in codebase:** `progressionService.ts` lines 34-51 (`withRetry` helper), lines 169-233 (`awardPlatformXp`).

```typescript
// Pattern from progressionService.ts — adapt for replacement generation
async function generateReplacement(
  archivedQuestionId: number,
  archivedExternalId: string,
  topic: string,                // subcategory slug
  collectionSlug: string,
  collectionId: number,
): Promise<{ replaced: true } | { replaced: false; reason: string }> {
  try {
    // 1. Load locale config — null means silently skip
    const config = await tryLoadLocaleConfig(collectionSlug);
    if (!config) {
      return { replaced: false, reason: 'no-locale-config' };
    }

    // 2. Generate single question via Anthropic API (scoped to topic)
    // ... call client.messages.create with buildSystemPrompt(config.name, { [topic]: 1 })

    // 3. Parse and validate with QuestionSchema + auditQuestion()
    // ... retry once on parse fail or quality fail

    // 4. Semantic dedup check against active questions (excluding archived)
    // ... call embedding + cosine similarity; retry once if near-duplicate

    // 5. Seed as 'active' — insert + link to collectionQuestions
    // ... db.insert(questions).values({ ...newQuestion, status: 'active' })

    return { replaced: true };
  } catch (err) {
    return { replaced: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
```

### Pattern 2: Extended Expiry Query

The current cron selects only `id`, `externalId`, `expiresAt`. Must be extended to also select `subcategory` (topic slug) and join through `collectionQuestions` to resolve `collectionId` and `collectionSlug`.

**Verified in codebase:** `collectionQuestions` table has `collectionId` + `questionId` PK. `collections` table has `id`, `slug`, `name`. The expiry query must join these.

```typescript
// Extended query in runExpirationSweep()
const expiredQuestions = await db
  .select({
    id: questions.id,
    externalId: questions.externalId,
    expiresAt: questions.expiresAt,
    subcategory: questions.subcategory,         // topic slug for replacement
    collectionId: collectionQuestions.collectionId,
    collectionSlug: collections.slug,
  })
  .from(questions)
  .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
  .innerJoin(collections, eq(collections.id, collectionQuestions.collectionId))
  .where(
    and(
      isNotNull(questions.expiresAt),
      lte(questions.expiresAt, now),
      eq(questions.status, 'active')
    )
  );
// Source: direct codebase read of expirationSweep.ts + schema.ts
```

### Pattern 3: Cron Run Summary Log

**What:** Always-on structured JSON log at the end of each cron run, even when nothing happened.

**Existing example:** `expirationSweep.ts` line 97 already logs a sweep summary. Extend it to include replacement counts.

```typescript
// At end of runExpirationSweep(), extend existing summary log:
console.log(JSON.stringify({
  level: 'info',
  job: 'expiration-sweep',
  message: 'Sweep complete',
  newlyExpiredCount: expiredQuestions.length,
  replacedCount: replacedCount,
  skippedCount: skippedCount,           // quality fail, dedup fail, no config
  expiringSoonCount: expiringSoonQuestions.length,
  durationMs: Date.now() - startTime,
}));
// Source: expirationSweep.ts line 97-104
```

### Pattern 4: Order of Operations — Archival First

Archive the question in DB, then attempt replacement. This ensures the expiry always completes even if generation hangs or errors.

```typescript
// In the expiry loop (expirationSweep.ts), after the existing db.update:
await db.update(questions).set({ status: 'expired', ... }).where(eq(questions.id, question.id));
// ^^^ Archival committed to DB first

// Then attempt replacement (never-throw)
const result = await generateReplacement(question.id, question.externalId, question.subcategory, question.collectionSlug, question.collectionId);
if (!result.replaced) {
  console.log(JSON.stringify({
    level: 'warn',
    job: 'expiration-sweep',
    message: 'Replacement skipped',
    questionId: question.id,
    externalId: question.externalId,
    collectionSlug: question.collectionSlug,
    topic: question.subcategory,
    reason: result.reason,
  }));
  skippedCount++;
} else {
  replacedCount++;
}
```

### Pattern 5: tryLoadLocaleConfig (null-safe dynamic import)

**Verified in codebase:** `audit-collection-readiness.ts` lines 99-119. Returns `null` for unknown slugs; no throw. Must be extracted (copy or import) into the cron context.

The function tries two path variants (city locale and state-configs subdirectory), iterates module keys looking for an object with `locale` and `externalIdPrefix` fields.

**Note:** The cron runs in `backend/src/cron/` while locale configs live in `backend/src/scripts/content-generation/locale-configs/`. Dynamic import paths must be relative to the compiled output or use `resolve()` for absolute paths. The `audit-collection-readiness.ts` version uses relative paths from its own location — replicate the path resolution pattern carefully.

### Pattern 6: Embedding for Dedup on a Single Replacement

`runWithinCollectionSemanticDedup` in `generate-locale-questions.ts` embeds the full active collection, which is expensive for a single-question check. For Phase 65, the targeted approach is:

1. Embed the replacement question text.
2. Query active questions in the collection (excluding archived).
3. Embed each (use cache — `OpenAIEmbeddingService` with `.embedding-cache/` directory caches by text).
4. Compute cosine similarity against the replacement; skip if any score > 0.85.

Guard: if `OPENAI_API_KEY` is not set, skip dedup and log a warn (same guard as `runWithinCollectionSemanticDedup`).

### Anti-Patterns to Avoid

- **Throwing from generateReplacement:** Must return result object, never throw to caller. A throw would crash the expiry loop for all remaining questions.
- **Generating before archiving:** Race condition risk — if generation succeeds but archival fails, a duplicate active question exists.
- **Using `status: 'draft'` for replacement:** Replacements seed as `'active'` per COPS-03. `seedQuestionBatch()` uses `'draft'` — do NOT use that function. Insert directly with `status: 'active'`.
- **Using `BatchSchema` for parse:** The batch schema requires 15–30 questions minimum (line 70 in `question-schema.ts`). For a single replacement, use `QuestionSchema.parse(singleQuestion)` directly, not `BatchSchema.parse({ questions: [q] })`.
- **Including archived question in dedup scope:** The just-archived question has topic-identical content and will false-positive. Filter by `status = 'active'` only when building the dedup corpus.
- **Reusing `generate-replacements.ts`:** That script is designed for bulk Phase 19 archival backfill with complex gap analysis. Phase 65 needs a lean inline generator — do not call that script.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI client | Custom fetch to Anthropic API | `client` from `anthropic-client.ts` | Already configured with `maxRetries: 3`, `timeout: 120000` |
| System prompt | Custom prompt builder | `buildSystemPrompt()` from `prompts/system-prompt.ts` | Already encodes all quality guidelines and officeholder blocks |
| Question schema validation | Custom parser | `QuestionSchema.parse()` from `question-schema.ts` | Zod schema with all constraints baked in |
| Quality rules | Custom rule checks | `auditQuestion()` from `services/qualityRules/index.ts` | Full rules engine including advisory and blocking violations |
| Embedding service | Direct OpenAI API calls | `OpenAIEmbeddingService` | Already has disk cache at `.embedding-cache/`, rate limiter (`pLimit(10)`), and retry logic |
| Locale config loading | Custom dynamic import resolver | Copy `tryLoadLocaleConfig` from `audit-collection-readiness.ts` | Handles both city and state config path variants, returns null on miss |
| Retry loop | Custom retry implementation | `withRetry` from `progressionService.ts` (or inline) | Exponential backoff, max attempts, error capture — already tested |

**Key insight:** Every sub-problem in this phase already has a battle-tested solution in the codebase. The planner should wire existing pieces together, not build new ones.

## Common Pitfalls

### Pitfall 1: subcategory IS NULL on some questions

**What goes wrong:** `questions.subcategory` is nullable in the schema (`text('subcategory')` with no `.notNull()`). Some questions (especially old federal questions) may have `null` subcategory. Attempting to use a null topic for generation will produce an un-scoped prompt.

**How to avoid:** In `generateReplacement`, if `subcategory` is null, return `{ replaced: false, reason: 'no-topic' }` and log structured warning.

**Warning signs:** The WHERE clause on the query does not filter out null subcategory — add explicit null guard in the generator.

### Pitfall 2: A question may belong to multiple collections

**What goes wrong:** `collectionQuestions` is a many-to-many junction. A question could theoretically appear in multiple collections. The extended expiry query using `innerJoin` will return one row per collection membership. If a question is in two collections, it generates two replacements.

**How to avoid:** The Context states "17 active collections" and no cross-collection questions are known to exist. However, the query should either use `.limit(1)` on the collection join, or group and deduplicate. Safest: fetch expired questions first (without join), then for each question fetch its primary collection via a separate query with `.limit(1)`.

**Warning signs:** `replacedCount > expiredCount` in the summary log.

### Pitfall 3: externalId collision on regeneration

**What goes wrong:** The replacement question needs a new `externalId`. The existing pattern in `generate-locale-questions.ts` calculates an `idOffset` from the max existing ID (including archived). If the replacement generator doesn't do this, it may pick an ID already used (archived question IDs are still in the DB with `UNIQUE` constraint on `external_id`).

**How to avoid:** Before inserting, query `MAX(SUBSTRING(external_id FROM '[0-9]+')::int)` for the prefix to find the next safe ID. Pattern is in `generate-replacements.ts` lines 208-225 (`getNextExternalId` function).

**Warning signs:** `INSERT` fails with unique constraint violation on `external_id`.

### Pitfall 4: Dynamic import paths differ between cron and script contexts

**What goes wrong:** `tryLoadLocaleConfig` in `audit-collection-readiness.ts` uses relative paths `./content-generation/locale-configs/${slug}.js`. This works when the script runs from its own directory. The cron in `src/cron/` has a different relative path to the locale configs.

**How to avoid:** Use `fileURLToPath(import.meta.url)` + `dirname` + `resolve()` to build absolute paths, or recalculate the relative path based on cron file location. Alternatively, extract `tryLoadLocaleConfig` to a shared utility module both scripts import from.

**Warning signs:** Locale config returns null for all collections even when configs exist.

### Pitfall 5: OPENAI_API_KEY not set in Render cron environment

**What goes wrong:** Semantic dedup requires `OPENAI_API_KEY`. If not set in Render, the cron errors at dedup step if not guarded.

**How to avoid:** Same guard as `runWithinCollectionSemanticDedup`: `if (!process.env.OPENAI_API_KEY) { log warn; skip dedup; proceed to seed }`. Dedup is a quality enhancement, not a gate that should block replacement.

**Warning signs:** Cron fails with "OpenAI API key required" error in Render logs.

### Pitfall 6: AI response may include `"expiresAt"` on replacement questions

**What goes wrong:** The replacement question for an officeholder topic will include an `expiresAt` if the system prompt's officeholder block names current officials. This is correct behavior — the replacement will also expire when the term ends. No special handling needed; just ensure the seed logic respects the `expiresAt` field from the schema response.

**How to avoid:** Pass `config.officeholders` to `buildSystemPrompt` (as the existing generators do). The AI will set `expiresAt` correctly for officeholder questions.

### Pitfall 7: BatchSchema minimum count validation failure

**What goes wrong:** If the prompt asks for exactly 1 question and the response is parsed with `BatchSchema` (which requires 15–30 questions), Zod throws.

**How to avoid:** Use `QuestionSchema.parse(parsedQuestion)` for single-question responses. Confirmed: `QuestionSchema` is exported from `question-schema.ts` at line 77.

## Code Examples

Verified patterns from codebase reads:

### Null-Safe Locale Config Loader
```typescript
// Source: audit-collection-readiness.ts lines 99-119
async function tryLoadLocaleConfig(slug: string): Promise<LocaleConfig | null> {
  const paths = [
    `./content-generation/locale-configs/${slug}.js`,
    `./content-generation/locale-configs/state-configs/${slug}.js`,
  ];
  for (const path of paths) {
    try {
      const mod = await import(path);
      for (const key of Object.keys(mod)) {
        const val = mod[key];
        if (val && typeof val === 'object' && 'locale' in val && 'externalIdPrefix' in val) {
          return val as LocaleConfig;
        }
      }
    } catch {
      // File not found — try next path
    }
  }
  return null;
}
```

### External ID Calculation
```typescript
// Source: generate-replacements.ts lines 208-225 (getNextExternalId)
async function getNextExternalId(collectionId: number, prefix: string): Promise<number> {
  const result = await db
    .select({
      maxId: sql<string>`MAX(SUBSTRING(${questionsTable.externalId} FROM '[0-9]+')::int)`,
    })
    .from(questionsTable)
    .innerJoin(collectionQuestions, eq(questionsTable.id, collectionQuestions.questionId))
    .where(
      and(
        eq(collectionQuestions.collectionId, collectionId),
        sql`${questionsTable.externalId} LIKE ${prefix + '-%'}`
      )
    );
  const maxId = result[0]?.maxId ? parseInt(result[0].maxId, 10) : 0;
  return maxId + 1;
}
```

### Seed Single Question as Active
```typescript
// Source: generate-replacements.ts lines 455-513 (seedReplacements), adapted
// Key difference from seedQuestionBatch(): status is 'active', not 'draft'
const newQuestion = {
  externalId: question.externalId,
  text: question.text,
  options: question.options,
  correctAnswer: question.correctAnswer,
  explanation: question.explanation,
  difficulty: question.difficulty,
  topicId,
  subcategory: question.topicCategory,
  source: question.source,
  learningContent: null,
  expiresAt: question.expiresAt ? new Date(question.expiresAt) : null,
  status: 'active' as const,   // NOTE: 'active', not 'draft'
  expirationHistory: [],
};
const inserted = await db
  .insert(questionsTable)
  .values(newQuestion)
  .onConflictDoNothing()
  .returning({ id: questionsTable.id });
// Then insert collectionQuestions link
```

### Structured Warning Log Pattern
```typescript
// Source: expirationSweep.ts lines 50-58 (existing pattern)
console.log(JSON.stringify({
  level: 'warn',
  job: 'expiration-sweep',
  message: 'Replacement skipped',
  questionId: question.id,
  externalId: question.externalId,
  collectionSlug: collectionSlug,
  topic: question.subcategory,
  reason: 'quality-fail' | 'near-duplicate' | 'no-locale-config' | 'parse-error' | string,
}));
```

### Always-On Cron Summary
```typescript
// Source: expirationSweep.ts lines 96-104 (extend existing summary)
console.log(JSON.stringify({
  level: 'info',
  job: 'expiration-sweep',
  message: 'Sweep complete',
  newlyExpiredCount: expiredQuestions.length,
  replacedCount,   // NEW
  skippedCount,    // NEW
  expiringSoonCount: expiringSoonQuestions.length,
  durationMs: Date.now() - startTime,
}));
```

## State of the Art

| Old Approach | Current Approach | Impact for Phase 65 |
|--------------|------------------|---------------------|
| Bulk replacement scripts (generate-replacements.ts) | Inline cron replacement per expired question | Don't use the script; build inline generator |
| `seedQuestionBatch()` with `status: 'draft'` | Direct insert with `status: 'active'` | Must insert directly, not via seedQuestionBatch |
| Full collection semantic dedup (all questions) | Targeted single-question embedding comparison | Faster in cron context; fewer OpenAI calls |

**Deprecated/outdated:**
- `generate-replacements.ts` — bulk backfill tool for Phase 19, not for Phase 65 use. Do not invoke it from the cron.
- `seedQuestionBatch()` — forces `status: 'draft'`. Phase 65 replacements must be `'active'`.

## Open Questions

1. **Path resolution for locale configs from cron context**
   - What we know: `tryLoadLocaleConfig` in `audit-collection-readiness.ts` uses relative imports like `./content-generation/locale-configs/${slug}.js`
   - What's unclear: Whether these paths resolve correctly when the same code is run from `src/cron/` vs `src/scripts/` — compiled JS paths may differ
   - Recommendation: Test with one collection slug during implementation. If paths fail, use `fileURLToPath(import.meta.url)` + `resolve()` to build absolute import paths, or extract `tryLoadLocaleConfig` to a shared `src/services/` utility.

2. **Single-question AI prompt format**
   - What we know: The existing batch generators ask for 15–30 questions with `BatchSchema` validation
   - What's unclear: Whether asking for exactly 1 question with `QuestionSchema` direct parse will produce reliable output, or if the AI performs better with a small batch (e.g., ask for 3, keep the first that passes)
   - Recommendation: Start with exactly 1 question request using `QuestionSchema`; the retry-once pattern provides a safety net.

3. **Multi-collection question edge case**
   - What we know: Schema allows many-to-many collection membership; in practice all 17 collections are distinct
   - What's unclear: Whether any edge case question exists in multiple collections
   - Recommendation: Use `.limit(1)` on the collection lookup join (take first collection), log if multiple exist.

## Sources

### Primary (HIGH confidence)
- Direct codebase reads (all files listed below) — current implementations
  - `backend/src/cron/expirationSweep.ts` — existing expiry sweep implementation
  - `backend/src/cron/startCron.ts` — cron registration pattern
  - `backend/src/cron/electionDetection.ts` — error handling pattern for cron loops
  - `backend/src/services/progressionService.ts` — never-throw pattern (`awardPlatformXp`, `withRetry`)
  - `backend/src/scripts/content-generation/generate-locale-questions.ts` — `runWithinCollectionSemanticDedup`, `loadLocaleConfig`, generation pipeline
  - `backend/src/scripts/content-generation/generate-replacements.ts` — single-collection replacement seeding (active status), `getNextExternalId`
  - `backend/src/scripts/content-generation/anthropic-client.ts` — `MODEL` constant, client config
  - `backend/src/scripts/content-generation/question-schema.ts` — `QuestionSchema` vs `BatchSchema` distinction
  - `backend/src/scripts/content-generation/utils/quality-validation.ts` — `validateAndRetry`, `auditQuestion` integration
  - `backend/src/scripts/content-generation/utils/seed-questions.ts` — `seedQuestionBatch` (draft-only, do NOT use for replacements)
  - `backend/src/scripts/content-generation/prompts/system-prompt.ts` — `buildSystemPrompt` signature
  - `backend/src/scripts/audit-collection-readiness.ts` — `tryLoadLocaleConfig` pattern
  - `backend/src/services/embeddings/SemanticDupDetector.ts` — dedup thresholds (0.85 = near-duplicate)
  - `backend/src/services/embeddings/OpenAIEmbeddingService.ts` — embedding cache pattern
  - `backend/src/db/schema.ts` — questions table fields (subcategory nullable, status enum, expirationHistory)
  - `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — `LocaleConfig` interface

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools read directly from codebase
- Architecture: HIGH — all patterns verified in existing code
- Pitfalls: HIGH — identified from direct schema and implementation reads
- Order of operations: HIGH — verified against progressionService never-throw pattern

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable internal codebase; no external dependencies changed)
