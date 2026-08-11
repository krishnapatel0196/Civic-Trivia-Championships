# Phase 75: DB Foundation + Type System - Research

**Researched:** 2026-04-08
**Domain:** PostgreSQL schema extension via Supabase MCP SQL, TypeScript type system
**Confidence:** HIGH — all findings come from direct codebase inspection; no external library research needed

## Summary

Phase 75 is a pure internal codebase extension — no new dependencies, no new APIs. The work is:
(1) two new Supabase tables added via raw SQL through MCP, (2) three nullable columns added to `trivia.questions` via `ALTER TABLE`, (3) a new `'international'` value admitted into the `CollectionTier` type and all affected type guards/maps, (4) `scaffold-collection.ts` extended to accept `--tier international`, and (5) `replacementGenerator.ts` (the cron called by `expirationSweep.ts`) guarded to skip international collections.

All DB changes must be executed directly via Supabase MCP SQL — `seed.ts` and `activate-collection.ts` hang after `PostgreSQL connected` (confirmed known bug from project memory). Drizzle `schema.ts` is the source of truth for TypeScript types; it must be updated in sync with the SQL changes or type mismatches will appear at query call sites.

The biggest risk is the `CollectionTier` type fan-out: it is defined in `backend/src/services/embeddings/types.ts` and the `TIER_RANK` record is tied to it. Adding `'international'` must also update `TIER_RANK` and every cast site that does `row.tier as CollectionTier`. The expiration sweep skip guard must be placed in `replacementGenerator.ts` (not `expirationSweep.ts`) because the sweep itself is correct — only the *replacement generation* step must be skipped for international collections.

**Primary recommendation:** Execute all five work streams in one PR in this order: SQL DDL first (tables + columns) → schema.ts in sync → type fan-out → scaffold → cron guard. Validates end-to-end with a `SELECT` query and a `--dry-run` scaffold invocation.

## Standard Stack

No new packages. This phase uses the existing stack only.

### Core (already installed)
| Tool | Version | Purpose | Role in this phase |
|------|---------|---------|-------------------|
| drizzle-orm | ^0.45.1 | ORM + TypeScript types from schema | Extend `schema.ts` to reflect new columns and table |
| pg | ^8.11.3 | PostgreSQL driver | Unchanged |
| Supabase MCP SQL | — | Execute DDL against live DB | The ONLY mechanism for schema changes (seed.ts hangs) |
| TypeScript | (project version) | Type system | `CollectionTier`, `InternationalLocaleConfig` |

**No `npm install` step in this phase.**

## Architecture Patterns

### How DB Schema Changes Work in This Project

The project has a split approach:
- `backend/src/db/schema.ts` — Drizzle schema definition, the TypeScript source of truth
- Supabase MCP SQL — actual DDL execution against the live database
- Drizzle migration files in `backend/src/db/migrations/` — exist but are NOT used for live changes (the project applies DDL directly via MCP SQL, not via `drizzle-kit push`)

**Pattern for this phase:** Write the SQL DDL, run it via MCP SQL, then update `schema.ts` to match. Both must stay in sync or Drizzle query builders will generate wrong column references.

### Recommended Project Structure Changes

```
backend/src/
├── db/
│   └── schema.ts                           # ADD: generationJobs table + 3 new columns on questions
├── services/
│   └── embeddings/
│       └── types.ts                        # ADD 'international' to CollectionTier; update TIER_RANK
├── scripts/
│   └── scaffold-collection.ts              # ADD 'international' to validTiers; handle iconIdentifier
├── cron/
│   └── replacementGenerator.ts             # ADD tier === 'international' skip guard
└── scripts/content-generation/
    └── locale-configs/
        └── bloomington-in.ts               # ADD InternationalLocaleConfig export here (or new file)
```

### Pattern 1: Adding a Nullable Column to an Existing Table (SQL)

`ALTER TABLE ... ADD COLUMN` with no `NOT NULL` constraint is safe on a live table — existing rows get `NULL` for the new column, so no backfill is needed. The three new `trivia.questions` columns are all nullable per the success criteria.

```sql
-- Source: direct codebase inspection of existing schema patterns
-- Run via Supabase MCP SQL

ALTER TABLE trivia.questions
  ADD COLUMN IF NOT EXISTS fact_snapshot text,
  ADD COLUMN IF NOT EXISTS confidence_tier text,
  ADD COLUMN IF NOT EXISTS generation_job_id integer REFERENCES trivia.generation_jobs(id) ON DELETE SET NULL;
```

**CRITICAL ORDER:** `generation_jobs` table must be created before adding `generation_job_id` FK column to `questions`. Run the `CREATE TABLE` for `generation_jobs` first.

### Pattern 2: Creating a New Table (SQL + schema.ts)

Follow the exact pattern of existing tables in `schema.ts`:
- Use `triviaSchema.table(...)` (not `pgTable(...)`) — all tables live in the `trivia` schema
- Import column types from `drizzle-orm/pg-core`
- Export `typeof table.$inferSelect` and `typeof table.$inferInsert` types at bottom of file

```typescript
// Source: backend/src/db/schema.ts inspection — existing table pattern

export const generationJobs = triviaSchema.table('generation_jobs', {
  id: serial('id').primaryKey(),
  collectionSlug: text('collection_slug').notNull(),
  status: text('status').notNull().default('pending'),
  questionsGenerated: integer('questions_generated').notNull().default(0),
  questionsFlagged: integer('questions_flagged').notNull().default(0),
  questionsActivated: integer('questions_activated').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
```

### Pattern 3: Extending CollectionTier (TypeScript)

`CollectionTier` is defined in `backend/src/services/embeddings/types.ts`. It feeds `TIER_RANK` and `loadCollectionTierMap()`. All three must change together.

```typescript
// Source: backend/src/services/embeddings/types.ts (current state)
// Current:
export type CollectionTier = 'federal' | 'state' | 'city';
export const TIER_RANK: Record<CollectionTier, number> = {
  federal: 3,
  state: 2,
  city: 1,
};

// After change:
export type CollectionTier = 'federal' | 'state' | 'city' | 'international';
export const TIER_RANK: Record<CollectionTier, number> = {
  federal: 3,
  state: 2,
  city: 1,
  international: 0,  // Never blocks anything; always lowest in dedup hierarchy
};
```

**Rank 0 for international:** International collections should never block dedup of other tiers. In `CollectionHierarchy.isParentOrSame()`, higher TIER_RANK blocks lower — giving international rank 0 means it never blocks anything, which is correct for v2.5.

### Pattern 4: scaffold-collection.ts Extension for International Tier

Three change sites in `scaffold-collection.ts`:

1. `validTiers` array (line 184): add `'international'`
2. `deriveIconIdentifier()` function (line 226): add `if (tier === 'international') return 'flag-globe';` (or similar — choose a consistent icon identifier; `flag-globe` is a placeholder, the planner should pick a value consistent with the frontend icon system)
3. Help text (line 149): update `city | state | federal` to `city | state | federal | international`
4. `deriveLocaleName()` (line 203): already returns `name` as-is for non-city tiers — international falls through correctly, no change needed

### Pattern 5: Cron Guard for International Collections

The replacement generator is called from `expirationSweep.ts` after each question is archived. The guard must be in `replacementGenerator.ts` (the `generateReplacement` function), because it is the right place to reject by collection tier.

**How to fetch the tier:** The `generateReplacement` function receives `collectionSlug` and `collectionId`. It must query the DB for the collection's tier before calling `tryLoadLocaleConfig`.

```typescript
// Source: backend/src/cron/replacementGenerator.ts inspection
// Add BEFORE the tryLoadLocaleConfig call (around line 52):

// Guard: skip replacement for international collections
const { db } = await import('../db/index.js');
const { collections } = await import('../db/schema.js');
const { eq } = await import('drizzle-orm');
const collectionRows = await db
  .select({ tier: collections.tier })
  .from(collections)
  .where(eq(collections.id, collectionId))
  .limit(1);
const collectionTier = collectionRows[0]?.tier;
if (collectionTier === 'international') {
  return { replaced: false, reason: 'international-collection-no-replacement' };
}
```

**Why here and not in expirationSweep.ts:** The sweep correctly archives expired questions regardless of collection. Only the downstream replacement generation must be skipped. Keeping the guard in `replacementGenerator.ts` makes it a single authoritative location regardless of future callers.

### Pattern 6: InternationalLocaleConfig Interface

`LocaleConfig` is defined and exported from `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts`. `InternationalLocaleConfig` should extend it with international-specific fields required by the RSS pipeline (Phases 76+). Exported from the same file to keep the interface hierarchy clear.

The international-specific required fields that downstream phases will need:
- `rssFeeds: string[]` — list of RSS feed URLs (replaces `sourceUrls` pattern from domestic configs; both can coexist)
- `confidenceTierDefault: 'high' | 'medium' | 'low'` — default confidence tier for generated questions
- `poolFloor: number` — minimum active questions before pipeline triggers
- `poolTarget: number` — target active question count
- `poolCeiling: number` — maximum active questions

```typescript
// Source: bloomington-in.ts LocaleConfig interface + FEATURES-INTERNATIONAL-COLLECTIONS.md research
export interface InternationalLocaleConfig extends LocaleConfig {
  rssFeeds: string[];               // RSS feed URLs for this collection (required for international)
  confidenceTierDefault: 'high' | 'medium' | 'low'; // Per-question confidence default
  poolFloor: number;                // Trigger generation when active count < floor
  poolTarget: number;               // Stop generating when active count >= target
  poolCeiling: number;              // Hard cap on active questions
}
```

### Pattern 7: user_collection_mutes Table

Per the locked decision: table is created in this phase; muting UI is deferred to v2.6. Table only, no application code beyond the schema definition.

```sql
-- Run via Supabase MCP SQL
CREATE TABLE IF NOT EXISTS trivia.user_collection_mutes (
  user_id uuid NOT NULL,         -- references public.users(id) on shared Supabase project
  collection_id integer NOT NULL REFERENCES trivia.collections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection_id)
);

CREATE INDEX idx_user_collection_mutes_user ON trivia.user_collection_mutes (user_id);
```

### Anti-Patterns to Avoid

- **Running seed.ts to apply schema changes:** seed.ts hangs after `PostgreSQL connected`. Use Supabase MCP SQL exclusively for all DDL in this project.
- **Adding NOT NULL columns without defaults to existing tables:** Existing rows get no value for a NOT NULL column, causing `constraint violation` errors at insert time for existing rows. The three new `questions` columns must be nullable.
- **Defining CollectionTier only in schema.ts:** The type is defined in `services/embeddings/types.ts`, not in `db/schema.ts`. Updating only `schema.ts` leaves the live type unchanged. Both files define tier-related code and both must be updated.
- **Placing the international skip guard in expirationSweep.ts:** The sweep itself is collection-tier-agnostic by design. The guard belongs in `replacementGenerator.ts` so any future caller of `generateReplacement` inherits the guard automatically.
- **Using `drizzle-kit push` or migration files for live DB changes:** This project applies DDL via Supabase MCP SQL directly. The migration files in `backend/src/db/migrations/` are historical artifacts from the early pre-Supabase phase and are not used.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema type inference | Manual type definitions | `typeof table.$inferSelect` / `typeof table.$inferInsert` | Already the project pattern; keeps types in sync with schema automatically |
| Nullable column typing | `type \| null` manually | Drizzle infers nullable from `.references()` without `.notNull()` | Drizzle auto-marks FK columns as nullable when `.notNull()` is absent |
| DB-level type validation | TypeScript-only checks | PostgreSQL CHECK constraint or `text` with application-level enum | The project uses `text` columns for enums (tier, status, difficulty) — no PG enum types |

## Common Pitfalls

### Pitfall 1: Schema.ts and SQL Out of Sync

**What goes wrong:** SQL DDL is applied via MCP but `schema.ts` is not updated (or vice versa). Drizzle query builders then reference columns that don't exist in the DB, or DB has columns that Drizzle doesn't know about. Errors appear at runtime when queries are executed, not at compile time.

**Why it happens:** The project uses a non-standard workflow (direct SQL, not drizzle-kit migrations). There is no automated sync check.

**How to avoid:** Apply SQL and update `schema.ts` in the same commit. Run a quick `SELECT id, fact_snapshot, confidence_tier, generation_job_id FROM trivia.questions LIMIT 1` via MCP after both changes to confirm the columns exist and the names match.

**Warning signs:** TypeScript error `Property 'factSnapshot' does not exist on type` or Postgres error `column "fact_snapshot" does not exist`.

### Pitfall 2: CollectionTier Cast Sites Not Updated

**What goes wrong:** `loadCollectionTierMap()` casts `row.tier as CollectionTier`. If `'international'` is not in the type union, TypeScript will type-check the cast without error (it's `as`, not a real assertion), but runtime code using the returned map will get `undefined` from `TIER_RANK['international']` and produce `NaN` in rank comparisons.

**Why it happens:** `as` casts bypass TypeScript's type narrowing — the cast succeeds even when the value doesn't match the union.

**How to avoid:** After updating `CollectionTier`, update `TIER_RANK` to include `international: 0`. Check `CollectionHierarchy.isParentOrSame()` — it uses `TIER_RANK[existingTier]` and `TIER_RANK[targetTier]`; if either returns `undefined`, the comparison falls through to `false` (allow), which is safe but should be explicit.

**Warning signs:** `TIER_RANK['international']` returns `undefined` at runtime; no TypeScript compile error because `as` bypasses the check.

### Pitfall 3: generation_job_id FK Added Before generation_jobs Table Exists

**What goes wrong:** If `ALTER TABLE trivia.questions ADD COLUMN generation_job_id integer REFERENCES trivia.generation_jobs(id)` is run before `CREATE TABLE trivia.generation_jobs`, Postgres returns `ERROR: relation "trivia.generation_jobs" does not exist`.

**How to avoid:** Always run DDL statements in dependency order: create referenced table first, then add FK column. Use `IF NOT EXISTS` on both statements.

### Pitfall 4: scaffold-collection.ts --tier international Produces Wrong Icon

**What goes wrong:** `deriveIconIdentifier()` handles `federal` and `state` explicitly, then falls through to city logic which extracts the last hyphen-segment of the slug. A slug like `war-ukraine` would produce `flag-ukraine` — an icon identifier that doesn't exist in the frontend icon system.

**How to avoid:** Add an explicit `if (tier === 'international') return 'flag-globe';` branch (or whatever icon identifier the frontend uses for international/globe) before the city fallthrough.

**Warning signs:** Frontend renders a broken/missing icon on the collection card for international collections.

### Pitfall 5: InternationalLocaleConfig Not Exported From a Stable Location

**What goes wrong:** If `InternationalLocaleConfig` is defined in an ad-hoc file, downstream phases (76–80) will import from different locations, creating import drift. The replacementGenerator and generate-locale-questions both import `LocaleConfig` from `bloomington-in.ts` — this is the established canonical location.

**How to avoid:** Export `InternationalLocaleConfig` from `bloomington-in.ts` alongside `LocaleConfig`, `TopicCategory`, and `OfficeholderEntry`. This keeps all config shape types in one canonical source.

## Code Examples

### Creating generation_jobs table via MCP SQL

```sql
-- Source: existing schema.ts table patterns
CREATE TABLE IF NOT EXISTS trivia.generation_jobs (
  id serial PRIMARY KEY,
  collection_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  questions_generated integer NOT NULL DEFAULT 0,
  questions_flagged integer NOT NULL DEFAULT 0,
  questions_activated integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_collection_slug
  ON trivia.generation_jobs (collection_slug);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status
  ON trivia.generation_jobs (status);
```

### Adding nullable columns to trivia.questions via MCP SQL

```sql
-- Source: existing schema.ts nullable column patterns (e.g., description, result, expiresAt)
-- NOTE: generation_jobs must exist before this runs (FK constraint)
ALTER TABLE trivia.questions
  ADD COLUMN IF NOT EXISTS fact_snapshot text,
  ADD COLUMN IF NOT EXISTS confidence_tier text,
  ADD COLUMN IF NOT EXISTS generation_job_id integer
    REFERENCES trivia.generation_jobs(id) ON DELETE SET NULL;
```

### Corresponding schema.ts additions

```typescript
// Source: backend/src/db/schema.ts — add to questions table definition
// Add these three columns inside the questions table definition, after electionRaceId:
factSnapshot: text('fact_snapshot'),                          // nullable
confidenceTier: text('confidence_tier'),                      // nullable
generationJobId: integer('generation_job_id')
  .references(() => generationJobs.id, { onDelete: 'set null' }),  // nullable FK

// Add new table (before questions table so the FK reference resolves):
export const generationJobs = triviaSchema.table('generation_jobs', {
  id: serial('id').primaryKey(),
  collectionSlug: text('collection_slug').notNull(),
  status: text('status').notNull().default('pending'),
  questionsGenerated: integer('questions_generated').notNull().default(0),
  questionsFlagged: integer('questions_flagged').notNull().default(0),
  questionsActivated: integer('questions_activated').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
```

### Verification query (run after DDL)

```sql
-- Confirm new tables exist and return results without error
SELECT id, collection_slug, status, questions_generated, questions_flagged, questions_activated
FROM trivia.generation_jobs
LIMIT 1;

-- Confirm new columns exist on questions table
SELECT id, fact_snapshot, confidence_tier, generation_job_id
FROM trivia.questions
LIMIT 1;

-- Confirm user_collection_mutes table exists
SELECT user_id, collection_id FROM trivia.user_collection_mutes LIMIT 1;
```

## State of the Art

| Old Approach | Current Approach | Impact for this Phase |
|--------------|------------------|----------------------|
| `CollectionTier = 'federal' \| 'state' \| 'city'` | Add `'international'` | Must add rank 0 to TIER_RANK; update all cast sites |
| No generation_jobs tracking | New `generation_jobs` table | Pipeline phases 76+ write job records here |
| No fact snapshot on questions | `fact_snapshot text` nullable | International pipeline stores extracted fact here at generation time |
| No confidence tier on questions | `confidence_tier text` nullable | International pipeline tags questions with 'high'/'medium'/'low' |
| No collection muting | `user_collection_mutes` table created | UI deferred to v2.6; table exists now |

## Open Questions

1. **Icon identifier for international tier in scaffold**
   - What we know: `deriveIconIdentifier()` must return a string that maps to a real icon in the frontend icon system
   - What's unclear: What icon identifier string does the frontend use for a globe/international concept? The planner should check `frontend/src/` for existing icon identifier patterns before hardcoding `'flag-globe'`
   - Recommendation: Grep frontend for existing `iconIdentifier` usages to find the right string; default to `'flag-globe'` if none exists and document that it requires a frontend icon asset

2. **generation_job_id referential integrity**
   - What we know: The column must be a nullable FK to `trivia.generation_jobs(id)`
   - What's unclear: Whether `ON DELETE SET NULL` or `ON DELETE CASCADE` is correct — if a generation job record is deleted, should the questions lose their job link or be deleted too?
   - Recommendation: Use `ON DELETE SET NULL` — questions are valuable independent of the job that created them; deleting the job tracking record should not cascade to deleting questions

3. **Feed list storage (DB vs config file)**
   - What we know: The locked decision says "Feed list stored in DB or config file — never hardcoded"
   - What's unclear: Phase 75 is DB foundation — should a `feeds` table be created here, or is it deferred to the pipeline phase (76)?
   - Recommendation: Defer the `feeds` table to Phase 76 (pipeline foundation). Phase 75's scope is the questions schema, generation_jobs table, and type system. The `InternationalLocaleConfig.rssFeeds` field handles feed list for the type system — the DB feed table is pipeline concern.

## Sources

### Primary (HIGH confidence)
- `backend/src/db/schema.ts` — direct inspection; all existing table/column patterns
- `backend/src/services/embeddings/types.ts` — direct inspection; `CollectionTier`, `TIER_RANK`, `loadCollectionTierMap`
- `backend/src/scripts/scaffold-collection.ts` — direct inspection; `validTiers`, `deriveIconIdentifier`, tier handling
- `backend/src/cron/replacementGenerator.ts` — direct inspection; existing guard patterns, call site in `expirationSweep.ts`
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — direct inspection; `LocaleConfig` interface definition
- `backend/src/db/seed/collections.ts` — direct inspection; `tier` field values in use
- `.planning/research/FEATURES-INTERNATIONAL-COLLECTIONS.md` — project research on pool management, field requirements

### Secondary (MEDIUM confidence)
- `backend/src/services/generation/CollectionHierarchy.ts` — direct inspection; `isParentOrSame()` tier rank logic; confirms rank 0 is safe for international

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; confirmed from package.json and existing imports
- Architecture: HIGH — all patterns verified from direct codebase inspection
- Pitfalls: HIGH — derived from actual code paths (DDL ordering, cast sites, existing guard patterns)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable codebase; 30-day validity appropriate)
