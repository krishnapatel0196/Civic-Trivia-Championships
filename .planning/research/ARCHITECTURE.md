# Architecture Research: v2.5 International Collections

**Project:** Civic Trivia Championship
**Researched:** 2026-04-08
**Scope:** International Collections pipeline integration with existing production architecture

---

## Existing Architecture Baseline

Read from codebase directly. Key facts that constrain all integration decisions:

### Cron system

- **File:** `backend/src/cron/startCron.ts`
- Uses `node-cron` directly. Two jobs registered at server startup:
  - `startExpirationCron()` — hourly at `:00`
  - `startElectionDetectionCron()` — daily at 06:00 America/New_York
- `startServer()` in `backend/src/server.ts` calls both on line 33–36.
- Pattern: each cron job is a named export from a separate file (`expirationSweep.ts`, `electionDetection.ts`). `startCron.ts` registers the schedule, the worker file does the work.

### DB schema (Drizzle, `trivia` Postgres schema)

- **File:** `backend/src/db/schema.ts`
- `collections`: id, name, slug, description, localeCode, localeName, iconIdentifier, themeColor, tier (`'federal'|'state'|'city'`), isActive, sortOrder, createdAt, updatedAt
- `questions`: id, externalId (unique), text, options (jsonb), correctAnswer, explanation, difficulty, topicId, subcategory, source (jsonb), learningContent (jsonb), expiresAt, status (`'active'|'expired'|'archived'`), expirationHistory (jsonb), encounterCount, correctCount, qualityScore, violationCount, flagCount, electionRaceId
- `collectionQuestions`: (collectionId, questionId) compound PK junction table
- `questionFlags`: userId (uuid), questionId, sessionId, reasons (jsonb), elaborationText
- `playerPrefs`: userId (uuid), timerMultiplier

### Question generation

- Locale configs live in `backend/src/scripts/content-generation/locale-configs/`.
- `generate-locale-questions.ts` drives batch generation for static collections.
- Quality gate: `backend/src/services/qualityRules/index.ts` — `auditQuestion()`.
- RAG: `backend/src/scripts/content-generation/rag/fetch-sources.ts` + `parse-sources.ts`.
- Model: `claude-sonnet-4-5` via `backend/src/scripts/content-generation/anthropic-client.ts`.
- Semantic dedup: `backend/src/services/embeddings/` (OpenAI embeddings, cosine similarity > 0.85 threshold).

### Tier hierarchy

- `CollectionTier = 'federal' | 'state' | 'city'`
- Defined in `backend/src/services/embeddings/types.ts` with `TIER_RANK: { federal:3, state:2, city:1 }`
- `CollectionHierarchy.ts` enforces: parent/same blocks, sibling/child allows

### Collection picker (frontend)

- **File:** `frontend/src/features/collections/components/CollectionPicker.tsx`
- Groups by `getCategory()`: `federal → 'federal'`, `state → 'state'`, all else → `'local'`
- Group order hard-coded: `['local', 'state', 'federal']`
- Labels from `GROUP_LABELS` object
- `CollectionSummary.tier: 'federal' | 'state' | 'city'` — TypeScript union in `frontend/src/features/collections/types.ts`

### Admin routes

- **File:** `backend/src/routes/admin.ts` — archive/review questions, election set management
- Auth pattern: `requireAuth, requireAdmin` middleware applied to entire router

---

## DB Schema Changes Required

### 1. `trivia.collections` — add `international` tier value

The `tier` column is `text` with no DB-level constraint — it uses application-level enforcement. Adding `'international'` requires:

- No DDL migration for the column itself (text field, no CHECK constraint in schema.ts)
- Update application type in `backend/src/services/embeddings/types.ts`:
  ```typescript
  export type CollectionTier = 'federal' | 'state' | 'city' | 'international';
  export const TIER_RANK: Record<CollectionTier, number> = {
    federal: 3,
    state: 2,
    city: 1,
    international: 1,  // peers with city in dedup hierarchy
  };
  ```
- Update `frontend/src/features/collections/types.ts`:
  ```typescript
  export interface CollectionSummary {
    tier: 'federal' | 'state' | 'city' | 'international';
    ...
  }
  ```
- Update `scaffold-collection.ts` to accept `--tier international`
- No `parent_collection_id` needed. `tier: 'international'` is sufficient for grouping. Country-level grouping within the picker can use name prefix or a separate `countryCode` field if needed later — defer until actual multi-country scale.

### 2. `trivia.questions` — new columns

Three new nullable columns on the existing questions table:

```sql
ALTER TABLE trivia.questions
  ADD COLUMN fact_snapshot   text,
  ADD COLUMN confidence_tier text,
  ADD COLUMN generation_job_id integer REFERENCES trivia.generation_jobs(id) ON DELETE SET NULL;
```

Drizzle schema additions in `backend/src/db/schema.ts`:

```typescript
factSnapshot:      text('fact_snapshot'),                      // nullable — raw source text captured at generation time
confidenceTier:    text('confidence_tier'),                    // nullable — 'high' | 'medium' | 'low'
generationJobId:   integer('generation_job_id')
  .references(() => generationJobs.id, { onDelete: 'set null' }),  // nullable FK
```

All three columns are nullable so existing questions are unaffected. `fact_snapshot` stores the RSS item or fetched article excerpt that the question was derived from — critical for the admin archive-incorrect flow (reviewer can see "what the AI was told"). `confidence_tier` encodes how many independent sources confirmed the claim (high = 2+, medium = 1, low = inferred).

### 3. `trivia.generation_jobs` — new table

Tracks each run of the daily international pipeline. One row per pipeline execution per collection.

```sql
CREATE TABLE trivia.generation_jobs (
  id                serial PRIMARY KEY,
  collection_slug   text        NOT NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  status            text        NOT NULL DEFAULT 'running',  -- 'running' | 'complete' | 'failed'
  sources_fetched   integer     NOT NULL DEFAULT 0,
  claims_extracted  integer     NOT NULL DEFAULT 0,
  questions_generated integer   NOT NULL DEFAULT 0,
  questions_inserted  integer   NOT NULL DEFAULT 0,
  questions_archived  integer   NOT NULL DEFAULT 0,
  error_message     text,
  metadata          jsonb
);
```

Drizzle table definition belongs in `backend/src/db/schema.ts` alongside the other tables.

`metadata jsonb` carries pipeline-run details (RSS feed URLs used, quality gate failure reasons, dedup rejections) without requiring schema changes per new field.

`status = 'running'` at start. Set to `'complete'` or `'failed'` at end. Any unfinished row older than 2 hours at next run start = stale, treat as failed.

### 4. `trivia.user_collection_mutes` — new table

Lets players mute international collections (well-being control).

```sql
CREATE TABLE trivia.user_collection_mutes (
  user_id       uuid    NOT NULL,
  collection_id integer NOT NULL REFERENCES trivia.collections(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection_id)
);

CREATE INDEX idx_user_collection_mutes_user ON trivia.user_collection_mutes(user_id);
```

Drizzle definition in `backend/src/db/schema.ts`. `user_id` is UUID referencing `public.users(id)` on shared Supabase project (same pattern as `questionFlags`, `playerStats`).

The `GET /api/game/collections` endpoint in `backend/src/routes/game.ts` must join this table to filter out muted collections for authenticated users. For anonymous users, show all active collections.

---

## New Components

### Daily International Pipeline — Cron Job

**Pattern:** Follow exact same pattern as `electionDetection.ts` + `startCron.ts`.

| File | Type | Responsibility |
|------|------|---------------|
| `backend/src/cron/internationalPipeline.ts` | Worker | One run: for each active international collection, fetch RSS/HTTP sources, extract claims, generate questions, apply quality gate, regulate pool size |
| `backend/src/cron/startCron.ts` | Modified | Register `startInternationalPipelineCron()` alongside existing two crons |

Schedule recommendation: daily at 02:00 America/New_York (after nightly low-traffic period, before morning play). Registration in `startCron.ts`:

```typescript
export function startInternationalPipelineCron(): void {
  cron.schedule('0 2 * * *', async () => {
    await runInternationalPipeline();
  }, { timezone: 'America/New_York' });
  console.log('International pipeline cron registered (runs daily at 2:00 AM Eastern)');
}
```

Call `startInternationalPipelineCron()` in `startServer()` in `backend/src/server.ts`.

### RSS / HTTP Ingestion Service

New service file, NOT a script — it runs in-process as part of the cron worker.

**File:** `backend/src/services/international/RssIngestor.ts`

Responsibilities:
- Fetch RSS feeds (use `fast-xml-parser` or native XML parsing — already using `cheerio` for HTML, can reuse)
- Fetch plain HTTP pages for collections without RSS
- Deduplicate items by URL + pubDate within a single run (don't re-process items seen in the last 48 hours)
- Return structured `SourceItem[]`: `{ url, title, pubDate, rawText }`

**Deduplication across runs:** A `processedUrls` set in `metadata` jsonb on the `generation_jobs` table is insufficient for cross-run dedup. A better approach is a lightweight in-memory LRU or a dedicated `trivia.processed_source_urls` table. Recommendation: start with a `Set<string>` persisted to a jsonb column on the collection's most recent completed job row. Simpler than a new table; revisit if URL volume grows.

**File:** `backend/src/services/international/ClaimExtractor.ts`

Responsibilities:
- Takes `SourceItem[]`, calls Claude (via `anthropic-client.ts`) with a structured extraction prompt
- Returns `Claim[]`: `{ statement, confidence: 'high'|'medium'|'low', sourceUrl, sourceTitle, rawText }`
- Target: 3–8 verifiable claims per source item
- NOT full question generation — claims are the fact-extracted intermediate representation

### International Locale Config Format

New locale config type, extending `LocaleConfig` from `bloomington-in.ts`:

**File:** `backend/src/scripts/content-generation/locale-configs/international/` (new subdirectory)

```typescript
export interface InternationalLocaleConfig extends LocaleConfig {
  country: string;             // ISO 3166-1 alpha-2, e.g. 'GB', 'DE'
  rssFeedUrls: string[];       // Primary ingestion feeds
  httpFallbackUrls: string[];  // Supplement if RSS thin
  expirationDays: {            // Per-topic volatility config
    default: number;           // 7 days default
    [topicSlug: string]: number; // override per topic
  };
  poolTarget: { min: number; max: number }; // e.g. { min: 40, max: 80 }
}
```

### Pool Regulator

**File:** `backend/src/services/international/PoolRegulator.ts`

Queries the active question count for a collection. If count > `poolTarget.max`, archives oldest questions (by `createdAt`) to bring down to `max`. If count < `poolTarget.min`, logs a warning (generation pipeline already attempted to fill). This runs as a step inside `internationalPipeline.ts` after question insertion.

---

## Modified Components

| Component | File | Change | Why |
|-----------|------|--------|-----|
| `startCron.ts` | `backend/src/cron/startCron.ts` | Register `startInternationalPipelineCron()` | One file owns all cron registration |
| `server.ts` | `backend/src/server.ts` | Call `startInternationalPipelineCron()` in `startServer()` | Server startup initializes all crons |
| `schema.ts` | `backend/src/db/schema.ts` | Add `generationJobs`, `userCollectionMutes` tables; add `factSnapshot`, `confidenceTier`, `generationJobId` columns to `questions` | Schema source of truth |
| `embeddings/types.ts` | `backend/src/services/embeddings/types.ts` | Add `'international'` to `CollectionTier` union and `TIER_RANK` | Dedup hierarchy must handle the new tier |
| `scaffold-collection.ts` | `backend/src/scripts/scaffold-collection.ts` | Accept `--tier international`; write `InternationalLocaleConfig` template instead of `LocaleConfig` | International collections scaffold differently |
| `game.ts` (routes) | `backend/src/routes/game.ts` | `GET /api/game/collections`: left-join `userCollectionMutes` when userId present; filter muted collections from response | Muting must affect collection picker |
| `CollectionPicker.tsx` | `frontend/src/features/collections/components/CollectionPicker.tsx` | Add `'international'` to `getCategory()`, add to `grouped` order, add to `GROUP_LABELS` | New tier section in picker |
| `types.ts` (frontend) | `frontend/src/features/collections/types.ts` | Extend `CollectionSummary.tier` union to include `'international'` | TypeScript type coverage |
| `admin.ts` (routes) | `backend/src/routes/admin.ts` | Add `GET /api/admin/generation-jobs` (list recent pipeline runs), `POST /api/admin/questions/:id/archive` if not already present | Admin visibility into pipeline health |

---

## Collection Picker UI Changes

### Current grouping logic

`CollectionPicker.tsx` line 14–18: `getCategory()` maps `tier` to display group. The group order at line 36 is `['local', 'state', 'federal']` — hard-coded array.

### Minimum change to add International section

1. In `frontend/src/features/collections/types.ts`: extend union.
2. In `CollectionPicker.tsx`:
   - `getCategory()`: add `if (collection.tier === 'international') return 'international';`
   - `GROUP_LABELS`: add `international: 'International'`
   - `grouped` array: add `'international'` to the order array. Placement recommendation: between `'local'` and `'state'` — `['local', 'international', 'state', 'federal']`.

The search/filter path already handles any tier transparently (it just filters by name string), so no changes needed there.

### Muting controls placement

Muting is a player preference, not a collection discovery feature. Recommended placement: on the collection card itself (a small "mute" toggle visible after selection, or in a settings panel). Do not add it to `CollectionPicker.tsx` directly — that component is display-only. Add muting affordance to `CollectionCard.tsx` or a dedicated `CollectionSettingsDrawer` component. API surface: `POST /api/users/profile/mutes { collectionId }` and `DELETE /api/users/profile/mutes/:collectionId`, handled in `backend/src/routes/profile.ts`.

---

## `parent_collection_id` Decision

Verdict: do not add it for v2.5.

`tier: 'international'` is sufficient for picker grouping. Country-level sub-grouping (if needed when there are 10+ international collections across multiple countries) can be solved by sorting on `localeCode` (ISO country prefix) within the International section — no schema change required. A `parent_collection_id` FK would only add value if questions were shared across a parent-child pair, which is not part of the v2.5 design.

---

## Build Order (What Blocks What)

### Phase 1: DB Foundation

Must be first because every subsequent phase depends on it.

1. Add `generation_jobs` table to schema.ts + Drizzle migration
2. Add `user_collection_mutes` table to schema.ts + Drizzle migration
3. Add `factSnapshot`, `confidenceTier`, `generationJobId` columns to `questions` table
4. Extend `CollectionTier` type to include `'international'` in `embeddings/types.ts`
5. Update `TIER_RANK` to include `international: 1`

**Unblocks:** All other phases.

### Phase 2: International Locale Config + Scaffold

Build before the pipeline because the pipeline consumes locale configs.

1. Define `InternationalLocaleConfig` interface (extend `LocaleConfig`)
2. Create `backend/src/scripts/content-generation/locale-configs/international/` subdirectory
3. Write the first international locale config (e.g., Norwich, UK — already has a locale config at `norwich-uk.ts` to reference)
4. Update `scaffold-collection.ts` to support `--tier international` and generate `InternationalLocaleConfig` templates

**Unblocks:** Phase 3 (pipeline needs a locale config to run against).

### Phase 3: RSS Ingestion + Claim Extraction

Build before the cron because the cron calls these services.

1. `backend/src/services/international/RssIngestor.ts`
2. `backend/src/services/international/ClaimExtractor.ts`
3. Unit tests / manual smoke test scripts

**Unblocks:** Phase 4 (pipeline worker calls these).

### Phase 4: Pipeline Cron Worker

Depends on Phase 1 (schema), Phase 2 (locale config), Phase 3 (ingestor + extractor).

1. `backend/src/services/international/PoolRegulator.ts`
2. `backend/src/cron/internationalPipeline.ts` — orchestrates: ingest → extract → generate → quality gate → dedup → insert → regulate
3. Modify `backend/src/cron/startCron.ts` to register the new cron
4. Modify `backend/src/server.ts` to call `startInternationalPipelineCron()`

**Note:** The quality gate (`auditQuestion()`) and semantic dedup (`SemanticDupDetector`) are called without modification. The `fact_snapshot` and `confidence_tier` columns are populated here.

### Phase 5: Collection Picker + Muting UI

Depends on Phase 1 (schema for mutes), Phase 4 (international collections must exist to test against).

1. Update `frontend/src/features/collections/types.ts`
2. Update `frontend/src/features/collections/components/CollectionPicker.tsx`
3. Muting: update `backend/src/routes/game.ts` (`/collections` endpoint join)
4. Muting: add `POST/DELETE /api/users/profile/mutes` routes in `backend/src/routes/profile.ts`
5. Muting: add mute toggle to `CollectionCard.tsx` or new settings component

**Unblocks:** Player-facing muting.

### Phase 6: Admin Visibility

Can be built in parallel with Phase 5. Depends on Phase 1 + Phase 4.

1. `GET /api/admin/generation-jobs` endpoint in `backend/src/routes/admin.ts`
2. Admin UI panel for pipeline job history (new `AdminPage` component or tab on existing admin)
3. Admin archive-incorrect flow wired to `fact_snapshot` display

---

## Data Flow Diagram

```
[RSS Feeds / HTTP Pages]
        |
        v
RssIngestor.ts
  → SourceItem[]
        |
        v
ClaimExtractor.ts (Claude API)
  → Claim[] (with confidence_tier, fact_snapshot)
        |
        v
QuestionGenerator (reuses anthropic-client + buildSystemPrompt)
  → ValidatedQuestion[]
        |
        v
auditQuestion() (existing quality rules engine)
        |
        v
SemanticDupDetector (existing dedup)
        |
        v
DB INSERT trivia.questions (with factSnapshot, confidenceTier, generationJobId)
DB INSERT trivia.collection_questions
        |
        v
PoolRegulator.ts
  → Archive oldest questions if count > max
```

---

## Integration Points Summary

| Concern | Existing File | Change Type |
|---------|--------------|-------------|
| Cron registration | `backend/src/cron/startCron.ts` | Add one export call |
| Server startup | `backend/src/server.ts` | Add one call in startServer() |
| Schema | `backend/src/db/schema.ts` | Add 2 tables, 3 columns |
| Tier type | `backend/src/services/embeddings/types.ts` | Extend union + TIER_RANK |
| Collection API | `backend/src/routes/game.ts` | Join mutes table, filter muted |
| Admin API | `backend/src/routes/admin.ts` | Add generation-jobs endpoint |
| Profile API | `backend/src/routes/profile.ts` | Add mute/unmute endpoints |
| Locale config type | `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` | Export extended interface (or new file) |
| Scaffold script | `backend/src/scripts/scaffold-collection.ts` | Support --tier international |
| Picker grouping | `frontend/src/features/collections/components/CollectionPicker.tsx` | Add international category |
| Picker type | `frontend/src/features/collections/types.ts` | Extend tier union |

**New files required:**
- `backend/src/cron/internationalPipeline.ts`
- `backend/src/services/international/RssIngestor.ts`
- `backend/src/services/international/ClaimExtractor.ts`
- `backend/src/services/international/PoolRegulator.ts`
- `backend/src/scripts/content-generation/locale-configs/international/{slug}.ts` (one per collection)

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Cron integration pattern | HIGH | Read startCron.ts, electionDetection.ts directly |
| DB schema changes | HIGH | Read schema.ts directly; column types follow existing patterns |
| Collection picker changes | HIGH | Read CollectionPicker.tsx directly; changes are minimal |
| Pipeline worker design | MEDIUM | Pattern inferred from replacementGenerator.ts + ElectionQuestionGenerator.ts; no exact precedent for RSS ingestion |
| Pool regulation logic | MEDIUM | Design is straightforward; exact threshold behavior needs testing |
| Muting endpoint design | MEDIUM | Pattern consistent with questionFlags (uuid user_id); endpoint path follows existing profile routes |
