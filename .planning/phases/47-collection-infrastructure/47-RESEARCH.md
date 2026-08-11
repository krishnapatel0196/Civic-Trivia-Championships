# Phase 47: Collection Infrastructure - Research

**Researched:** 2026-03-01
**Domain:** Collection hierarchy data model, generation pipeline registration
**Confidence:** HIGH — all findings based on direct codebase inspection

## Summary

Phase 47 addresses two infrastructure gaps revealed as the project scaled from city-only collections to multi-tier (federal/state/city) collections. The first gap is `COLLECTION_HIERARCHY` — a hardcoded TypeScript map in `backend/src/services/embeddings/types.ts` that maps collection display names to tier strings. This map must be maintained manually whenever a new collection is added, and its name-based lookup is fragile. The second gap is that state collection configs live in a `state-configs/` subdirectory and are served by a completely separate script (`generate-state-questions.ts` with `--state` flag), rather than being registered in the unified `generate-locale-questions.ts` workflow that the scaffold/activate CLIs expect.

The fix for INFRA-01 is to add a `tier` column to the `trivia.collections` table, populate it for all existing collections, and replace the hardcoded map lookup with a runtime DB query. All consumers of `COLLECTION_HIERARCHY` (three backend files) need to be updated to use the DB-sourced value. The UI's `CollectionPicker.tsx` uses a slug-based heuristic (not `COLLECTION_HIERARCHY`) and may also benefit from receiving tier from the API.

The fix for INFRA-02 is to make `generate-locale-questions.ts` discover state configs automatically from the `state-configs/` subdirectory — either by dynamic import scanning or by updating `scaffold-collection.ts` to register state configs in the same `supportedLocales` map. The key constraint is "no code changes to workflow itself" when adding a new state config file.

**Primary recommendation:** Add `tier text NOT NULL` column to `collections` table with a DB migration, update all consumers to read tier from DB, and make `generate-locale-questions.ts` auto-discover `state-configs/*.ts` files alongside the city configs.

## Standard Stack

This phase involves no new library dependencies. All work is within the existing stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | existing | DB schema + migration | Already used throughout |
| drizzle-kit | existing | Generate SQL migrations | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | existing | Run TypeScript scripts | Already used for all backend scripts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DB tier column | Keep hardcoded map | Hardcoded map requires code changes per new collection — defeats infrastructure goal |
| Auto-discovery of state configs | Manually register each state | Manual registration is INFRA-02's current problem |

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure

After phase 47, the generation config structure becomes:

```
backend/src/scripts/content-generation/locale-configs/
├── bloomington-in.ts       # city config (already registered)
├── fremont-ca.ts           # city config (already registered)
├── los-angeles-ca.ts       # city config (already registered)
├── norwich-uk.ts           # city config (already registered)
└── state-configs/
    ├── indiana.ts          # state config (needs registration)
    └── california.ts       # state config (needs registration)
```

After INFRA-02, `generate-locale-questions.ts` supports:
```bash
npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale indiana-state
npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale california-state
```

### Pattern 1: DB Migration for Tier Column (INFRA-01)

**What:** Add `tier text NOT NULL DEFAULT 'city'` column to `trivia.collections` table. Set correct values for all existing collections. Update Drizzle schema.
**When to use:** Whenever a new attribute needs to be collection-specific and runtime-queryable.

The migration must:
1. Add column with a safe default
2. UPDATE each collection row with the correct tier value
3. After backfill, optionally drop the default or tighten the constraint

**Example migration SQL:**
```sql
ALTER TABLE trivia.collections ADD COLUMN tier text NOT NULL DEFAULT 'city';
UPDATE trivia.collections SET tier = 'federal' WHERE slug = 'federal';
UPDATE trivia.collections SET tier = 'state' WHERE slug IN ('indiana-state', 'california-state');
-- cities stay at default 'city'
```

**Example Drizzle schema addition (backend/src/db/schema.ts):**
```typescript
// Source: codebase inspection - collections table definition
export const collections = triviaSchema.table('collections', {
  // ... existing columns
  tier: text('tier').notNull().default('city'), // 'federal' | 'state' | 'city'
  // ...
});
```

### Pattern 2: Runtime Hierarchy Lookup via DB (INFRA-01)

**What:** Replace the `COLLECTION_HIERARCHY` map lookup in `CollectionHierarchy.ts` and `ClusterBuilder.ts` with a DB-sourced map loaded once at scan time.
**When to use:** Any time static TypeScript maps encode data that belongs in the DB.

The three consumers of `COLLECTION_HIERARCHY`:

1. **`backend/src/services/generation/CollectionHierarchy.ts`** — `getCollectionTier(collectionName: string)` uses `COLLECTION_HIERARCHY[collectionName]` to look up by display name. After the fix, this lookup must either:
   - Accept a pre-loaded `Map<string, CollectionTier>` passed in as dependency, OR
   - Query the DB when needed

2. **`backend/src/services/embeddings/ClusterBuilder.ts`** — iterates collection names to get tiers for sort/recommendation logic. Needs the same lookup.

3. **`backend/src/scripts/scaffold-collection.ts`** — step 4 adds an entry to `COLLECTION_HIERARCHY`. After the fix, this step should instead UPDATE the `collections` table's `tier` column after seeding (or rely on the seed entry having the correct tier).

**Key insight:** The lookup key in `COLLECTION_HIERARCHY` is the collection **display name** (e.g., `'Indiana'`, `'Bloomington, IN'`), not the slug. The DB `collections` table has both. The cleanest approach is to build a `Map<collectionName, tier>` at query time from `SELECT name, tier FROM trivia.collections`.

**Example runtime approach for scan-duplicates.ts / ClusterBuilder:**
```typescript
// Source: codebase inspection
// Load tier map from DB once before scan
const rows = await db.select({ name: collections.name, tier: collections.tier }).from(collections);
const tierMap = new Map(rows.map(r => [r.name, r.tier as CollectionTier]));
// Pass tierMap into ClusterBuilder/CollectionHierarchy instead of using static COLLECTION_HIERARCHY
```

### Pattern 3: State Config Registration in generate-locale-questions.ts (INFRA-02)

**What:** Extend `loadLocaleConfig()` in `generate-locale-questions.ts` to also search `state-configs/` for locale slugs not found in the city config map.
**When to use:** Any time new collection tiers need to be supported without modifying the generation script.

The current `loadLocaleConfig()` function (lines 86–109 of `generate-locale-questions.ts`) uses a hardcoded `supportedLocales` map and a `configKeys` array. To support state configs without code changes when adding new states, the approach should be:

**Option A: Dynamic import with naming convention (recommended)**
- State configs export a named export matching `${configVarName}Config`
- Extend `loadLocaleConfig()` to check `state-configs/${locale}.ts` as a fallback when city config lookup fails
- The `stateFeatures` export is optional; if present, use the state-specific prompt; if absent, fall back to city prompt

**Option B: Register state configs in the same supportedLocales map**
- Update `scaffold-collection.ts` step 3 to add state configs into `supportedLocales` pointing to `locale-configs/state-configs/${slug}.ts`
- Simpler but still requires code change to add a new state config (violates INFRA-02 SC3)

**Option A is required by SC3.** Implementation sketch:
```typescript
// Source: codebase inspection of generate-locale-questions.ts structure
async function loadLocaleConfig(locale: string): Promise<{ config: LocaleConfig; stateFeatures?: string }> {
  // 1. Try city configs first (existing supportedLocales map)
  // 2. If not found, attempt: import(`./locale-configs/state-configs/${locale}.ts`)
  //    Look for config key by convention: any key ending in 'Config'
  //    Look for stateFeatures key by convention: any key ending in 'StateFeatures'
  // 3. If neither found, throw with helpful error message
}
```

The generation script then conditionally uses `buildStateSystemPrompt` (if stateFeatures exists) or `buildSystemPrompt` (city prompt).

### Pattern 4: Update scaffold-collection.ts for Tier (INFRA-01)

**What:** Replace step 4 in `scaffold-collection.ts` (which edits `COLLECTION_HIERARCHY` in types.ts) with a step that sets the `tier` value in the seed entry OR does a DB UPDATE after seeding.

The cleanest approach: add `tier` to the `NewCollection` seed data in `collections.ts`. Since `scaffold-collection.ts` writes the seed entry (step 1), it should include the tier field there:

```typescript
// In step1InsertSeedEntry, add tier field:
const newEntry = `  {
    name: '${args.name}',
    slug: '${args.slug}',
    tier: '${args.tier}',   // NEW
    // ... rest of fields
  },\n`;
```

Step 4 (which edits `types.ts`) becomes: remove the `COLLECTION_HIERARCHY` edit entirely, since the DB is now the source of truth.

### Anti-Patterns to Avoid

- **Keeping COLLECTION_HIERARCHY as a secondary cache:** The map becomes stale when DB changes. Remove it entirely after migration.
- **Querying the DB per-question in ClusterBuilder:** The tier map should be loaded once at the start of a scan, not fetched in the inner loop.
- **Using a flag-based approach to detect tier from slug in the UI:** The existing `getCategory()` slug heuristic in `CollectionPicker.tsx` is fragile. Once the API returns tier, use it directly.
- **Registering state configs in supportedLocales with their locale slug as key:** The state config locale values are `indiana-state` and `california-state`, but the current state script uses `--state indiana`. The unified approach should use the locale slug (`--locale indiana-state`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB migration for new column | Manual SQL | drizzle-kit generate + push | Already configured; keeps schema.ts and DB in sync |
| Tier type validation | Custom runtime check | TypeScript union `'federal' \| 'state' \| 'city'` + Zod | Type-safe at compile time |

**Key insight:** The tier column addition is a single-migration, single-backfill operation. Don't over-engineer it.

## Common Pitfalls

### Pitfall 1: COLLECTION_HIERARCHY uses collection name, not slug

**What goes wrong:** The map key is `'Indiana'` and `'Bloomington, IN'` — display names. The DB `collections` table has `name` (display name) and `slug` separately. A query using `slug` would fail to match what `CollectionHierarchy.ts` and `ClusterBuilder.ts` pass in.
**Why it happens:** The map was built from display names because that's what the `collections` JSON field in `questions` aggregation returns.
**How to avoid:** When building the runtime tier map, key it by `collections.name` (display name), not `collections.slug`. Check the actual SQL query in `scan-duplicates.ts` — it returns `array_agg(c.name)` (line ~80).
**Warning signs:** If tiers all return `undefined` after migration, check whether you're keying by name vs. slug.

### Pitfall 2: State config exports an extra `stateFeatures` string

**What goes wrong:** City locale configs export only `${configVar}Config`. State configs export both `${configVar}Config` AND `${configVar}StateFeatures`. A generic config loader that only looks for the config export will work, but will silently ignore `stateFeatures`, falling back to the city prompt which lacks state-specific context.
**Why it happens:** `generate-state-questions.ts` uses `buildStateSystemPrompt()` which takes `stateFeatures` as a parameter; `generate-locale-questions.ts` uses `buildSystemPrompt()` which doesn't.
**How to avoid:** When merging the workflows, detect whether a `stateFeatures` export exists and conditionally switch the prompt builder.
**Warning signs:** State questions generated via the unified script look like city questions (no government structure focus, no direct democracy content).

### Pitfall 3: Drizzle schema.ts out of sync with DB after migration

**What goes wrong:** Adding `tier` column to the DB via raw SQL but forgetting to add it to `schema.ts` means Drizzle queries won't include the column, and TypeScript types won't know about it.
**Why it happens:** Raw SQL migrations bypass Drizzle type generation.
**How to avoid:** Always update `schema.ts` before or alongside the migration. Run `drizzle-kit push` or generate a migration file from the updated schema.
**Warning signs:** TypeScript compile error when trying to select `collections.tier`.

### Pitfall 4: scaffold-collection.ts step 4 edits the now-removed COLLECTION_HIERARCHY

**What goes wrong:** After INFRA-01 removes `COLLECTION_HIERARCHY`, running `scaffold-collection.ts` still tries to edit `types.ts` and crashes or corrupts the file.
**Why it happens:** `scaffold-collection.ts` step 4 is hardcoded to edit `COLLECTION_HIERARCHY`.
**How to avoid:** Remove step 4 from `scaffold-collection.ts` (or replace it with a no-op comment) as part of INFRA-01 work.
**Warning signs:** `scaffold-collection.ts` throws "Could not find COLLECTION_HIERARCHY" error.

### Pitfall 5: generate-locale-questions.ts cannot find state-config by locale slug

**What goes wrong:** State configs use locale slugs `indiana-state` and `california-state`, but the state config filenames are `indiana.ts` and `california.ts`. A dynamic import path like `./locale-configs/state-configs/${locale}.ts` won't find `indiana.ts` when `--locale indiana-state` is passed.
**Why it happens:** The state configs predate the unified locale slug convention.
**How to avoid:** Either rename the state config files to match the locale slug (`indiana-state.ts`, `california-state.ts`), OR map locale slug → filename in the loader (e.g., strip `-state` suffix to find the file). Renaming is cleaner for the auto-discovery pattern.
**Warning signs:** Dynamic import throws "Cannot find module" for state locales.

## Code Examples

### Reading tier from DB in ClusterBuilder

```typescript
// Source: codebase inspection of ClusterBuilder.ts and db/schema.ts
// Load tier map once before building clusters
async function buildTierMap(db: DB): Promise<Map<string, CollectionTier>> {
  const rows = await db
    .select({ name: collections.name, tier: collections.tier })
    .from(collections);
  return new Map(rows.map(r => [r.name, r.tier as CollectionTier]));
}

// In ClusterBuilder, replace:
// const tier = COLLECTION_HIERARCHY[collection];
// with:
const tier = tierMap.get(collection);
```

### State config auto-discovery in generate-locale-questions.ts

```typescript
// Source: codebase inspection of generate-locale-questions.ts and state-configs/
async function loadLocaleConfig(locale: string): Promise<{ config: LocaleConfig; stateFeatures?: string }> {
  // 1. Try city configs (existing hardcoded map)
  const cityLocales: Record<string, ...> = { /* existing entries */ };
  if (cityLocales[locale]) {
    const module = await cityLocales[locale]();
    const config = extractConfig(module);
    return { config };
  }

  // 2. Try state configs by convention: state-configs/${locale}.ts
  //    State config files will be renamed to match locale slug
  try {
    const module = await import(`./locale-configs/state-configs/${locale}.js`);
    const config = extractConfig(module); // finds any key ending in 'Config'
    const stateFeatures = extractStateFeatures(module); // finds key ending in 'StateFeatures'
    return { config, stateFeatures };
  } catch {
    throw new Error(`Unknown locale "${locale}". City locales: ${Object.keys(cityLocales).join(', ')}; add state config at locale-configs/state-configs/${locale}.ts`);
  }
}
```

### Tier column in collections seed (scaffold-collection.ts step 1 output)

```typescript
// Source: codebase inspection of scaffold-collection.ts step1InsertSeedEntry
{
  name: 'Austin, TX',
  slug: 'austin-tx',
  tier: 'city',              // NEW — sourced from --tier arg
  description: 'Test your Austin, TX civic knowledge!',
  localeCode: 'en-US',
  localeName: 'Austin, Texas',
  iconIdentifier: 'flag-tx',
  themeColor: '#7C3AED',
  isActive: false,
  sortOrder: 8
},
```

### Frontend CollectionPicker.tsx with DB-sourced tier

```typescript
// Source: codebase inspection of CollectionPicker.tsx
// Current approach (fragile slug heuristic):
function getCategory(slug: string): 'local' | 'state' | 'federal' {
  if (slug === 'federal') return 'federal';
  if (slug.endsWith('-state')) return 'state';
  return 'local';
}

// After INFRA-01: API includes tier, use it directly
function getCategory(tier: string): 'local' | 'state' | 'federal' {
  if (tier === 'federal') return 'federal';
  if (tier === 'state') return 'state';
  return 'local';
}
```

Note: This requires adding `tier` to `CollectionSummary` type and to the `/collections` GET route response.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No tier concept | Hardcoded `COLLECTION_HIERARCHY` map in types.ts | Phase 31 (semantic dedup) | Works for small fixed collection set; breaks at scale |
| Manual state generation | Separate `generate-state-questions.ts` script | Phase 33-34 | Two-script split creates confusion; scaffolding assumes one script |
| Slug heuristic in UI | `getCategory()` with `-state` suffix check | Phase 15 | Works now but will break if non-standard slugs are added |

**Deprecated/outdated after this phase:**
- `COLLECTION_HIERARCHY` constant in `types.ts`: replaced by DB query
- `generate-state-questions.ts`: merged into `generate-locale-questions.ts` or deprecated with redirect note
- Step 4 in `scaffold-collection.ts` (edits COLLECTION_HIERARCHY): removed

## Open Questions

1. **Should `generate-state-questions.ts` be kept as a compatibility shim or deleted?**
   - What we know: It works today; deleting it would break any documented workflows
   - What's unclear: Whether anyone relies on `--state indiana` vs `--locale indiana-state`
   - Recommendation: Keep the file but add a deprecation notice at the top pointing to the unified command; do not delete yet.

2. **Should the frontend `CollectionPicker.tsx` slug heuristic be updated in this phase?**
   - What we know: The success criteria (SC1) specifically mentions `embeddings/types.ts`, not the frontend UI
   - What's unclear: Whether the phase scope includes the frontend tier display
   - Recommendation: Scope it in — it's a small change, and adding `tier` to the API response and `CollectionSummary` type is required anyway for the backend DB query to be useful end-to-end.

3. **Does `drizzle-kit` handle the `trivia` schema (non-public) correctly for migrations?**
   - What we know: The existing migration uses `CREATE SCHEMA "civic_trivia"` (old name). Current code uses `trivia` schema. Only one migration file exists.
   - What's unclear: Whether drizzle-kit push works cleanly on the shared Supabase project for the new migration
   - Recommendation: Test with `drizzle-kit push --dry-run` before applying. If push is risky on shared project, write the migration SQL manually.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of:
  - `backend/src/services/embeddings/types.ts` — COLLECTION_HIERARCHY definition
  - `backend/src/services/generation/CollectionHierarchy.ts` — consumer of COLLECTION_HIERARCHY
  - `backend/src/services/embeddings/ClusterBuilder.ts` — consumer of COLLECTION_HIERARCHY
  - `backend/src/scripts/scaffold-collection.ts` — step 4 edits COLLECTION_HIERARCHY
  - `backend/src/scripts/content-generation/generate-locale-questions.ts` — city config loader
  - `backend/src/scripts/content-generation/generate-state-questions.ts` — state config loader (separate)
  - `backend/src/scripts/content-generation/locale-configs/state-configs/indiana.ts` — state config structure
  - `backend/src/scripts/content-generation/locale-configs/state-configs/california.ts` — state config structure
  - `backend/src/db/schema.ts` — collections table (no tier column today)
  - `backend/src/db/seed/collections.ts` — seed data (no tier field today)
  - `frontend/src/features/collections/components/CollectionPicker.tsx` — slug heuristic for UI
  - `frontend/src/features/collections/types.ts` — CollectionSummary interface

### Secondary (MEDIUM confidence)
- None — this phase operates entirely on internal codebase patterns.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing tools
- Architecture: HIGH — direct code inspection of all files named in phase requirements
- Pitfalls: HIGH — pitfalls derived from actual code structure (name vs. slug key, stateFeatures export, filename mismatch)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable internal codebase; changes only if files are modified)
