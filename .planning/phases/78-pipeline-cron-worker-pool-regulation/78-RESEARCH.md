# Phase 78: Pipeline Cron Worker + Pool Regulation - Research

**Researched:** 2026-04-09
**Domain:** node-cron scheduling, Drizzle ORM query patterns, pool regulation logic, generation_jobs schema extension
**Confidence:** HIGH — all critical findings verified via direct codebase inspection

## Summary

Phase 78 wires the Phase 77 pipeline (`run-pipeline.ts`) to a nightly cron schedule and adds pool regulation logic that archives stale current-events questions before generating new ones. The core infrastructure already exists: `node-cron@4.2.1` is installed, `startCron.ts` is the established registration point, and `generationJobs` schema already captures the six columns required (collection_slug, status, questions_generated, questions_flagged, questions_activated, timestamps). The pipeline entry point (`runPipeline()`) is already exported from `run-pipeline.ts` and accepts `collectionSlug`, `prefix`, and `{ dryRun }` options.

Three schema gaps must be resolved before planning tasks write code: (1) `questions` table has no `volatility` column — this is net-new and must be added via DDL and `schema.ts`; (2) `generation_jobs` has no `reason` text column for skip/failure reasons — the CONTEXT requires it, but the current schema stores only structured `notes` JSONB; (3) `generation_jobs.status` currently uses `'pending'` / `'running'` / `'completed'` / `'failed'` — the CONTEXT adds `'skipped'` as a valid status. All three must be handled in a DDL-first task.

The volatility classification is collection-config-driven per CONTEXT. The `InternationalLocaleConfig` interface (in `bloomington-in.ts`) must gain a `volatility` field. The pipeline must set `expiresAt` on questions at write time based on the collection's default volatility. Pool regulation queries need to distinguish "Current Events layer" (fast/medium volatility) from "History layer" (slow/stable) — this means the `volatility` column on `questions` is the discriminator for all archival logic.

**Primary recommendation:** Add `volatility` column to `questions` table and `reason` column to `generation_jobs` via DDL first; add `volatility` to `InternationalLocaleConfig`; then build the cron registration and pool regulation service following the exact patterns from `startCron.ts` and `expirationSweep.ts`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-cron | 4.2.1 | Cron scheduling inside server process | Already installed; already used for expiration sweep (hourly) and election detection (daily 6AM ET); `TaskOptions.timezone` supports IANA strings |
| drizzle-orm | 0.45.1 | DB queries for pool regulation, generation_jobs writes | Already installed; all existing DB patterns use Drizzle |
| @anthropic-ai/sdk | 0.74.0 | Transitive — pipeline calls Claude | Already used by run-pipeline.ts |

### No New Dependencies Required
Phase 78 has no new library installs. All needed libraries are already installed:
- `node-cron` for scheduling
- `drizzle-orm` for pool queries and archival writes
- `run-pipeline.ts` exports `runPipeline()` for direct invocation

**Installation:**
```bash
# No new installs needed
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── cron/
│   ├── startCron.ts              # ADD: startPipelineCron() registration here
│   ├── expirationSweep.ts        # Existing — model for error handling
│   ├── electionDetection.ts      # Existing — model for per-item loop + summary
│   ├── pipelineCron.ts           # NEW: runPipelineCron() — orchestrates all collections
│   └── poolRegulator.ts          # NEW: regulatePool() — archive excess current-events questions
├── scripts/international/
│   ├── run-pipeline.ts           # Existing — runPipeline() is the callable entry point
│   └── [other Phase 77 files]
├── db/schema.ts                  # MODIFY: add volatility to questions, reason to generation_jobs
└── server.ts                     # MODIFY: add startPipelineCron() call
```

### Pattern 1: Cron Registration in startCron.ts
**What:** Add `startPipelineCron()` to the existing `startCron.ts` — the established registration point for all crons in this project. Register at `'0 2 * * *'` with `{ timezone: 'America/New_York' }`.
**When to use:** Always — this is the project's cron pattern.

```typescript
// Source: backend/src/cron/startCron.ts (direct inspection)
// Existing election detection cron as the exact model:
export function startElectionDetectionCron(): void {
  cron.schedule('0 6 * * *', async () => {
    await runElectionDetection();
  }, { timezone: 'America/New_York' });
  console.log('Election detection cron registered (runs daily at 6:00 AM Eastern)');
}

// New registration (same pattern, different time):
export function startPipelineCron(): void {
  cron.schedule('0 2 * * *', async () => {
    await runPipelineCron();
  }, { timezone: 'America/New_York' });
  console.log('International pipeline cron registered (runs daily at 2:00 AM Eastern)');
}
```

### Pattern 2: Per-Collection Orchestration Loop
**What:** `pipelineCron.ts` queries all active international collections, runs each through the throttle check, pool regulation, and pipeline call inside a per-collection try/catch. One collection failure never stops the others.
**When to use:** Always for the cron worker — mirrors `electionDetection.ts` per-item loop.

```typescript
// Source: backend/src/cron/electionDetection.ts (direct inspection) — per-item try/catch model
export async function runPipelineCron(): Promise<void> {
  const startTime = Date.now();

  // Query all active international collections
  const internationalCollections = await db
    .select({ id: collections.id, slug: collections.slug })
    .from(collections)
    .where(and(eq(collections.isActive, true), eq(collections.tier, 'international')));

  for (const collection of internationalCollections) {
    try {
      await runCollectionPipeline(collection.slug, collection.id);
    } catch (err) {
      // Log error; continue to next collection
      console.log(JSON.stringify({
        level: 'error',
        job: 'pipeline-cron',
        collectionSlug: collection.slug,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  console.log(JSON.stringify({
    level: 'info',
    job: 'pipeline-cron',
    message: 'Cron run complete',
    collectionsProcessed: internationalCollections.length,
    durationMs: Date.now() - startTime,
  }));
}
```

### Pattern 3: Throttle Guard (Draft Count Check)
**What:** Count `status = 'draft'` questions for the collection. If count > 20, skip the pipeline for this run. Write a `generation_jobs` row with `status = 'skipped'` and `reason = 'draft-backlog-exceeded'`. No RSS fetch, no Claude calls.
**When to use:** First check per collection before any pipeline work.

```typescript
// Count draft questions for the collection via collection_questions join
const [draftCountRow] = await db
  .select({ count: sql<number>`COUNT(*)::int` })
  .from(questions)
  .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
  .where(
    and(
      eq(collectionQuestions.collectionId, collectionId),
      eq(questions.status, 'draft')
    )
  );
const draftCount = draftCountRow?.count ?? 0;

if (draftCount > 20) {
  // Write skipped job row
  await db.insert(generationJobs).values({
    collectionSlug,
    status: 'skipped',
    questionsGenerated: 0,
    questionsFlagged: 0,
    questionsActivated: 0,
    reason: 'draft-backlog-exceeded',  // requires new column
  });
  console.log(JSON.stringify({ level: 'info', job: 'pipeline-cron',
    message: 'Collection skipped — draft backlog > 20',
    collectionSlug, draftCount }));
  return;
}
```

### Pattern 4: Pool Regulation — Archive Current Events to Target 72
**What:** Count active questions with `volatility IN ('fast', 'medium')` for the collection. If count > 72, archive the oldest ones (by `created_at` ascending) until count equals 72. `fast` questions archived before `medium` questions if still above target.
**When to use:** After throttle check, before calling `runPipeline()`.

```typescript
// Source: Drizzle patterns from expirationSweep.ts (direct inspection) — archive update model
async function regulatePool(collectionId: number, collectionSlug: string): Promise<number> {
  // Count current events (fast + medium) active questions
  const [countRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(questions)
    .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
    .where(
      and(
        eq(collectionQuestions.collectionId, collectionId),
        eq(questions.status, 'active'),
        inArray(questions.volatility, ['fast', 'medium'])  // requires new column
      )
    );

  const currentCount = countRow?.count ?? 0;
  const TARGET = 72;
  let archived = 0;

  if (currentCount <= TARGET) return 0;  // No regulation needed

  const toArchive = currentCount - TARGET;

  // Archive fast-first: oldest created_at ascending
  const fastCandidates = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
    .where(
      and(
        eq(collectionQuestions.collectionId, collectionId),
        eq(questions.status, 'active'),
        eq(questions.volatility, 'fast')
      )
    )
    .orderBy(asc(questions.createdAt))
    .limit(toArchive);

  // Archive in batches — fast first
  for (const q of fastCandidates) {
    await db.update(questions)
      .set({
        status: 'archived',
        expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([{
          action: 'archived',
          timestamp: new Date().toISOString(),
        }])}::jsonb`,
      })
      .where(eq(questions.id, q.id));
    archived++;
    if (archived >= toArchive) break;
  }

  // If still need more, archive medium questions
  if (archived < toArchive) {
    const remaining = toArchive - archived;
    const mediumCandidates = await db
      .select({ id: questions.id })
      .from(questions)
      .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
      .where(
        and(
          eq(collectionQuestions.collectionId, collectionId),
          eq(questions.status, 'active'),
          eq(questions.volatility, 'medium')
        )
      )
      .orderBy(asc(questions.createdAt))
      .limit(remaining);

    for (const q of mediumCandidates) {
      await db.update(questions)
        .set({ status: 'archived', expirationHistory: /* same */ })
        .where(eq(questions.id, q.id));
      archived++;
    }
  }

  return archived;
}
```

### Pattern 5: generation_jobs Write — One Row Per Collection Per Run
**What:** Create the job row at start (status `'running'`), update it at end with final status and counts. Follow the exact pattern from `run-pipeline.ts`.
**When to use:** Every collection run, including skipped runs.

```typescript
// Source: backend/src/scripts/international/run-pipeline.ts lines 80-89 (direct inspection)
// Create at start:
const [job] = await db.insert(generationJobs).values({
  collectionSlug,
  status: 'running',
  questionsGenerated: 0,
  questionsFlagged: 0,
  questionsActivated: 0,
}).returning({ id: generationJobs.id });

// Update at end:
await db.update(generationJobs)
  .set({
    status: finalStatus,  // 'success' | 'failed' | 'skipped'
    questionsGenerated: totalGenerated,
    questionsFlagged: totalFlagged,
    questionsActivated: totalGenerated,
    reason: failureOrSkipReason ?? null,  // requires new column
    updatedAt: sql`NOW()`,
  })
  .where(eq(generationJobs.id, job.id));
```

### Pattern 6: Volatility-Based expiresAt Assignment
**What:** When `writePassingQuestions()` writes a question, compute `expiresAt` from the collection's default volatility. Fast = 3–5 days, medium = 7–14 days, slow/stable = null (no expiry set by pipeline).
**When to use:** Inside `writePassingQuestions()` or as a wrapper — set at question insert time.

```typescript
// Volatility-to-expiresAt mapping (Claude's discretion on exact days within bands)
function computeExpiresAt(volatility: 'fast' | 'medium' | 'slow' | 'stable'): Date | null {
  const now = new Date();
  switch (volatility) {
    case 'fast':
      // 4 days (midpoint of 3–5 range)
      return new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    case 'medium':
      // 10 days (midpoint of 7–14 range)
      return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    case 'slow':
    case 'stable':
      return null;  // History questions do not expire via pipeline
  }
}
```

### Anti-Patterns to Avoid
- **Running pool regulation after generation:** The CONTEXT explicitly says "archive down to 72 BEFORE generating." If you regulate after, the ceiling can be exceeded on every run.
- **Archiving slow/stable questions:** Pool regulation must only touch `fast` and `medium` volatility questions. `slow`/`stable` (History layer) are never archived via pool regulation.
- **One generation_jobs row per cron invocation:** The CONTEXT says one row per **collection** per run. The cron orchestrator must not create a single "umbrella" job row.
- **Blocking the cron on one collection's Claude call:** The per-collection try/catch isolates failures. A Claude API timeout for one collection must not prevent subsequent collections from running.
- **Using `seed.ts` or `activate-collection.ts` for DDL:** Per project memory, these scripts hang. All DDL (`ALTER TABLE`) must go through Supabase MCP SQL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling | setInterval / setTimeout timer loop | node-cron `cron.schedule()` | Already installed, used in project; handles DST, missed runs, timezone; setInterval drifts |
| Pool count queries | Manual SQL string | Drizzle with `sql<number>\`COUNT(*)\`::int` | Consistent with all other DB queries; type-safe |
| Per-collection failure isolation | Manual tracking | Per-collection try/catch (same as electionDetection.ts) | Proven pattern in codebase |
| Archive order | Custom sort logic | `.orderBy(asc(questions.createdAt))` | Directly reflects "oldest by created_at" decision |
| Volatility-to-expiresAt calculation | Claude assessment per question | Collection-config-driven default | CONTEXT locks this — no per-question Claude call for volatility |

**Key insight:** The entire cron orchestration pattern (`startCron.ts` → per-item loop with try/catch → structured JSON logs → generation_jobs write) is already established in the codebase. Phase 78 follows this pattern exactly.

## Schema Changes Required

This is the most critical planning input. Phase 78 requires three schema additions:

### 1. `questions.volatility` (NEW COLUMN)
```sql
-- Run via Supabase MCP SQL
ALTER TABLE trivia.questions
  ADD COLUMN IF NOT EXISTS volatility text;
-- Values: 'fast' | 'medium' | 'slow' | 'stable' | NULL (for domestic questions)

-- Update schema.ts:
-- volatility: text('volatility'),  // nullable; null for domestic questions
```
This is the discriminator for the Current Events vs History layer distinction. Pool regulation, archival order, and expiresAt calculation all depend on it. **Without this column, pool regulation cannot distinguish Current Events from History questions.**

### 2. `generation_jobs.reason` (NEW COLUMN)
```sql
ALTER TABLE trivia.generation_jobs
  ADD COLUMN IF NOT EXISTS reason text;
-- Values: 'draft-backlog-exceeded' (skip), failure message (failed), null (success)

-- Update schema.ts:
-- reason: text('reason'),  // nullable
```
Required by CONTEXT: "Each row captures ... skip/failure reason if applicable."

### 3. `generation_jobs.status` — `'skipped'` is a new valid value
The current schema comment says `'pending'` (default). The `run-pipeline.ts` uses `'running'` / `'completed'` / `'failed'`. Phase 78 adds `'skipped'` (throttle guard). No DDL needed (it's a text column), but code must explicitly set `'skipped'` and the planner must document the full valid set.

### 4. `InternationalLocaleConfig` — add `volatility` field (TypeScript only, no DDL)
```typescript
// Add to InternationalLocaleConfig in locale-configs/bloomington-in.ts:
export interface InternationalLocaleConfig extends LocaleConfig {
  rssFeeds: string[];
  confidenceTierDefault: 'high' | 'medium' | 'low';
  poolFloor: number;
  poolTarget: number;
  poolCeiling: number;
  volatility: 'fast' | 'medium' | 'slow' | 'stable';  // NEW — default for all generated questions
}
```

### 5. `run-pipeline.ts` must accept `volatility` parameter
`runPipeline()` currently accepts `(collectionSlug, prefix, { dryRun })`. Phase 78 needs the cron caller to pass the collection's default volatility so `writePassingQuestions()` can set `expiresAt`. Either pass `volatility` as a new parameter or have `runPipeline()` look up the locale config internally.

## Common Pitfalls

### Pitfall 1: Pool Regulation Count Includes Both Layers
**What goes wrong:** The 72-target archival removes `slow`/`stable` (History) questions, erasing the stable factual foundation.
**Why it happens:** Query forgetting to filter `volatility IN ('fast', 'medium')`.
**How to avoid:** Pool regulation queries MUST include `inArray(questions.volatility, ['fast', 'medium'])` in the WHERE clause. Never touch `slow`/`stable` questions.
**Warning signs:** After a regulation run, the History question count decreases.

### Pitfall 2: volatility Column is NULL for Phase 77 Questions Already Written
**What goes wrong:** Questions already written by Phase 77 have `volatility = NULL`. Pool regulation queries using `inArray(questions.volatility, ['fast', 'medium'])` won't match them (SQL: `NULL IN (...)` is NULL, not TRUE).
**Why it happens:** Phase 77 wrote questions before the `volatility` column existed.
**How to avoid:** After adding the `volatility` column, backfill existing international questions. Alternatively, treat `NULL volatility` on international collection questions as `'fast'` (the most conservative assumption — safest to archive). Document the chosen backfill strategy in the plan.
**Warning signs:** Pool regulation reports 0 questions archived even when the current-events count is clearly over 72.

### Pitfall 3: generation_jobs Status Mismatch Between run-pipeline.ts and Cron
**What goes wrong:** `run-pipeline.ts` sets status to `'completed'` or `'failed'`. CONTEXT says status should be `'success'` | `'failed'` | `'skipped'`. These conflict.
**Why it happens:** `run-pipeline.ts` was written in Phase 77 independently; CONTEXT was not yet locked.
**How to avoid:** The cron orchestrator should normalize the status when writing the generation_jobs row. Either: (a) update `run-pipeline.ts` to use `'success'` instead of `'completed'` (breaking change), or (b) the cron orchestrator accepts any status from `runPipeline()` and maps `'completed'` → `'success'` before writing the job row. Option (b) is less disruptive. Plan must choose and document.
**Warning signs:** Querying for `status = 'success'` returns no rows; `status = 'completed'` returns all successful runs.

### Pitfall 4: Cron Registered in server.ts But Not Imported
**What goes wrong:** `startPipelineCron()` is added to `startCron.ts` but `server.ts` is not updated to call it.
**Why it happens:** `startCron.ts` exports multiple functions; `server.ts` must explicitly import and call each one.
**How to avoid:** Check `server.ts` lines 14 and 33–36 — update BOTH the import and the call site.
**Warning signs:** Cron job never fires; no log line "International pipeline cron registered."

### Pitfall 5: Pool Regulation Triggered When Count Is Already ≤ 72
**What goes wrong:** Code runs archival logic unnecessarily when current-events count is 0–72.
**Why it happens:** Missing the early-return guard `if (currentCount <= TARGET) return 0`.
**How to avoid:** Check count first; if ≤ 72, skip archival entirely and proceed directly to generation. Log "no regulation needed" for observability.
**Warning signs:** Pool regulation reports 0 archived, but the log shows it still ran all queries.

### Pitfall 6: runPipeline() Called Without volatility — expiresAt is null for All Questions
**What goes wrong:** New questions are written with `expiresAt: null` because volatility was not passed to `writePassingQuestions()`.
**Why it happens:** `writePassingQuestions()` currently hardcodes `expiresAt: null` (Phase 77 wrote it this way — confirmed at line 247 of `question-generator.ts`).
**How to avoid:** Phase 78 must extend `writePassingQuestions()` to accept a `volatility` param and compute `expiresAt` via `computeExpiresAt(volatility)`. The cron must pass the collection's configured volatility.
**Warning signs:** All newly generated questions have `expires_at = NULL`; the expiration sweep never touches them; pool regulation never archives them (since they're NULL volatility).

## Code Examples

### Node-cron 4.x timezone registration (verified from installed 4.2.1)
```typescript
// Source: backend/node_modules/node-cron/dist/esm/tasks/scheduled-task.d.ts (direct inspection)
// TaskOptions.timezone is a string (IANA timezone identifier)
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  await runPipelineCron();
}, { timezone: 'America/New_York' });
// Fires at 02:00 AM Eastern — handles EDT/EST transitions automatically
```

### Drizzle: count active current-events questions in a collection
```typescript
// Source: Drizzle patterns from existing admin.ts and expirationSweep.ts (direct inspection)
import { db } from '../db/index.js';
import { questions, collectionQuestions } from '../db/schema.js';
import { eq, and, inArray, sql } from 'drizzle-orm';

const [{ count }] = await db
  .select({ count: sql<number>`COUNT(*)::int` })
  .from(questions)
  .innerJoin(collectionQuestions, eq(collectionQuestions.questionId, questions.id))
  .where(
    and(
      eq(collectionQuestions.collectionId, collectionId),
      eq(questions.status, 'active'),
      inArray(questions.volatility, ['fast', 'medium'])
    )
  );
```

### DDL for new columns (run via Supabase MCP SQL)
```sql
-- Must run before any Phase 78 code references these columns
ALTER TABLE trivia.questions
  ADD COLUMN IF NOT EXISTS volatility text;

ALTER TABLE trivia.generation_jobs
  ADD COLUMN IF NOT EXISTS reason text;
```

### schema.ts additions
```typescript
// In the questions table definition — add after confidenceTier:
volatility: text('volatility'),  // nullable; 'fast' | 'medium' | 'slow' | 'stable' | null

// In the generationJobs table definition — add after feedsFailed:
reason: text('reason'),  // nullable; populated for 'skipped' and 'failed' status rows
```

## Deployment: node-cron in Server Process (Recommended)

The existing cron pattern is node-cron inside the server process. The project has no `render.yaml`, no separate Render cron service — all scheduled work runs in the backend server.

**Decision recommendation (Claude's discretion area):** Continue with node-cron in server process. Rationale:
1. Existing expiration sweep and election detection already use this pattern — zero new infrastructure
2. No `render.yaml` means adding a Render cron service requires new Render configuration and a deploy step outside this codebase
3. The nightly pipeline run is not latency-sensitive — running inside the server process is appropriate
4. If the server is restarted at 02:00 AM (unlikely but possible), the run is skipped until the next night — acceptable for a nightly news pipeline

**Render cron job alternative** (only if explicit separation is needed): Would require a `render.yaml` with a `cron` service entry, separate build process, and environment variable replication. Not justified for this use case.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual pipeline runs via CLI | Scheduled nightly cron | Phase 78 | International collections self-maintain |
| No volatility on questions | `volatility` column on questions table | Phase 78 | Pool regulation can distinguish current-events from history |
| expiresAt: null for all international questions | Volatility-based expiresAt at write time | Phase 78 | Fast questions expire in 4 days; medium in 10 days |
| run-pipeline.ts as CLI-only script | runPipeline() callable from cron orchestrator | Phase 78 | Import and call vs subprocess spawn |

## Open Questions

1. **Status string: 'success' vs 'completed'**
   - What we know: `run-pipeline.ts` sets `pipelineStatus = 'completed'`. CONTEXT says `status` should be `'success'` | `'failed'` | `'skipped'`.
   - What's unclear: Should `run-pipeline.ts` be updated to use `'success'`, or should the cron orchestrator normalize?
   - Recommendation: Update `run-pipeline.ts` to use `'success'` instead of `'completed'` — it's a one-line change and makes the whole system consistent. The cron orchestrator then reads that status and writes it to `generation_jobs` unchanged.

2. **Backfill for Phase 77 questions with NULL volatility**
   - What we know: `question-generator.ts` writes `expiresAt: null` and there is no volatility column yet. Existing Phase 77 questions (if any were written to production) have NULL volatility.
   - What's unclear: Are there any Phase 77 questions in production? If so, what volatility should they get?
   - Recommendation: Planner should include a backfill step: `UPDATE trivia.questions SET volatility = 'fast' WHERE volatility IS NULL AND generation_job_id IS NOT NULL`. This conservatively marks all pipeline-generated questions as `fast`, making them eligible for pool regulation.

3. **expiresAt days within bands (Claude's discretion)**
   - What we know: Fast = 3–5 days, medium = 7–14 days. Exact values are discretionary.
   - Recommendation: Use midpoints (fast = 4 days, medium = 10 days) for predictability. This keeps daily generation sustainable and avoids thrashing the pool with very short expiry windows.

4. **collection_slug lookup for prefix in cron**
   - What we know: `runPipeline()` requires both `collectionSlug` and `prefix`. The collections table has `slug` but no `externalIdPrefix` column — that lives only in locale config files.
   - What's unclear: How does the cron orchestrator know the `prefix` for a collection it discovers via DB query?
   - Recommendation: Either (a) store `externalIdPrefix` on the collections table (requires DDL + migration), or (b) load the locale config file for each collection slug and read `externalIdPrefix` from it, or (c) hard-code a mapping in the cron orchestrator for the known international collections. Option (b) is most extensible and matches the `replacementGenerator.ts` pattern of loading locale configs at runtime.

5. **International collection tier in DB**
   - What we know: `collections.tier` comment says `'federal' | 'state' | 'city'` but `scaffold-collection.ts` and `replacementGenerator.ts` both reference `'international'` tier. The schema column type is `text` (not an enum), so `'international'` is accepted.
   - Confirmed: `replacementGenerator.ts` line 61 checks `tier === 'international'` — the value is already in use.
   - No issue: The cron query `where eq(collections.tier, 'international')` will correctly find international collections.

## Sources

### Primary (HIGH confidence)
- `backend/src/cron/startCron.ts` — direct inspection; node-cron schedule syntax, `{ timezone: 'America/New_York' }` option, registration pattern
- `backend/src/cron/electionDetection.ts` — direct inspection; per-item loop with try/catch, CronRunSummary type, lastCronRun in-memory state pattern
- `backend/src/cron/expirationSweep.ts` — direct inspection; archive-via-update pattern, `expirationHistory` append with `sql\`jsonb\``, structured JSON log format
- `backend/src/db/schema.ts` — direct inspection; `generationJobs` table columns (lines 73–91), `questions.status` allowed values (line 115), `questions.volatility` does NOT exist (confirmed absence)
- `backend/src/scripts/international/run-pipeline.ts` — direct inspection; `runPipeline()` signature, generation_jobs write pattern, `pipelineStatus = 'completed'` vs CONTEXT `'success'`
- `backend/src/scripts/international/question-generator.ts` — direct inspection; `expiresAt: null` hardcoded at line 247
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — direct inspection; `InternationalLocaleConfig` interface (lines 38–49); `volatility` field does NOT exist
- `backend/node_modules/node-cron/dist/esm/tasks/scheduled-task.d.ts` — direct inspection; `TaskOptions.timezone?: string` confirmed in v4.2.1
- `backend/package.json` — node-cron@^4.2.1 confirmed; no new dependencies needed

### Secondary (MEDIUM confidence)
- node-cron README.md (installed version) — cron syntax, ESM import pattern, field order reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed; no new dependencies needed
- Architecture: HIGH — all patterns derived from direct codebase inspection; electionDetection.ts and expirationSweep.ts are direct models
- Schema gaps: HIGH — volatility column absence and reason column absence confirmed by direct schema.ts inspection; backfill risk confirmed by question-generator.ts expiresAt: null inspection
- Pitfalls: HIGH — all pitfalls derived from specific code evidence (line numbers cited)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase; 30-day validity appropriate)
