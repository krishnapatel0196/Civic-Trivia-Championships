---
phase: quick-023
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/scripts/scaffold-collection.ts
  - backend/src/scripts/activate-collection.ts
autonomous: true

must_haves:
  truths:
    - "Running scaffold-collection with required flags creates all 4 files/edits without error"
    - "Running activate-collection with --slug and --prefix activates the collection and its draft questions"
    - "Running activate-collection with --dry-run shows what would happen without writing to DB"
  artifacts:
    - path: "backend/src/scripts/scaffold-collection.ts"
      provides: "CLI that scaffolds a new collection across 4 source files"
    - path: "backend/src/scripts/activate-collection.ts"
      provides: "CLI that activates a collection and its draft questions in DB"
  key_links:
    - from: "scaffold-collection.ts"
      to: "backend/src/db/seed/collections.ts"
      via: "fs.readFileSync + string insertion before closing bracket"
    - from: "scaffold-collection.ts"
      to: "backend/src/scripts/content-generation/generate-locale-questions.ts"
      via: "fs.readFileSync + string insertion into supportedLocales map and configKeys array"
    - from: "activate-collection.ts"
      to: "database"
      via: "Drizzle ORM update queries on collections and questions tables"
---

<objective>
Build two CLI scripts that automate collection management: `scaffold-collection.ts` (creates all source file entries for a new collection) and `activate-collection.ts` (parameterized DB activation replacing the hardcoded script).

Purpose: Eliminates error-prone manual file editing when adding collections, and replaces the hardcoded activate-collections.ts with a reusable parameterized version.
Output: Two working CLI scripts in `backend/src/scripts/`.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@backend/src/db/seed/collections.ts
@backend/src/scripts/content-generation/locale-configs/bloomington-in.ts
@backend/src/scripts/content-generation/generate-locale-questions.ts
@backend/src/services/embeddings/types.ts
@backend/src/scripts/activate-collections.ts
@backend/src/db/index.ts
@backend/src/db/schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create scaffold-collection CLI</name>
  <files>backend/src/scripts/scaffold-collection.ts</files>
  <action>
Create `backend/src/scripts/scaffold-collection.ts` — a CLI that automates 4 manual steps when adding a new collection.

**CLI argument parsing** (use manual process.argv parsing, matching the pattern in generate-locale-questions.ts):
- Required: `--name` (string, e.g. "Austin, TX"), `--slug` (string, e.g. austin-tx), `--prefix` (3-char string, e.g. aut), `--theme` (hex color, e.g. "#7C3AED")
- Optional: `--tier` (city|state|federal, default: "city"), `--sort-order` (number, default: auto-detect next available), `--locale-code` (default: "en-US"), `--description` (default: auto-generated)
- Print help with `--help`
- Validate: slug matches `/^[a-z0-9-]+$/`, prefix matches `/^[a-z]{2,4}$/`, theme matches `/^#[0-9A-Fa-f]{6}$/`, tier is valid enum

**Step 1 — Insert seed entry** into `backend/src/db/seed/collections.ts`:
- Read the file as string
- Find the last `}` before the closing `];` (use regex: find the position of the final `];` then insert before it)
- Compute sort-order: if not provided, parse existing entries and use max+1
- Derive `localeName` from `--name` (for cities: expand state abbreviation, e.g. "Austin, TX" -> "Austin, Texas"; if no comma, use name as-is)
- Derive `iconIdentifier`: for city tier use `flag-{2-letter-state-code-lowercase}` extracted from slug suffix (e.g. austin-tx -> flag-tx); for state tier use `state`; for federal use `flag-us`. If slug has no state suffix (e.g. norwich-uk), use `flag-{suffix}`.
- Insert a new object entry formatted identically to existing entries (2-space indent, trailing comma after closing brace)
- Set `isActive: false` always (activated later via activate-collection)

**Step 2 — Create locale config file** at `backend/src/scripts/content-generation/locale-configs/{slug}.ts`:
- Check file does not already exist (error if it does)
- Generate from bloomington-in.ts as template but with PLACEHOLDER content:
  - Import the `LocaleConfig` type from `./bloomington-in.js`
  - Export a camelCase config variable (e.g. `austinConfig` derived from slug by taking the part before the first hyphen and camelCasing)
  - Set `locale`, `name`, `externalIdPrefix`, `collectionSlug` from CLI args
  - Set `targetQuestions: 100`, `batchSize: 25`
  - Include 3 placeholder topic categories: `city-government`, `civic-history`, `local-services` (with generic descriptions using the collection name)
  - Include placeholder `topicDistribution` summing to 100
  - Include empty `sourceUrls: []` with a comment to fill in
- Print a note: "Edit {path} to customize topics and source URLs before generating questions"

**Step 3 — Add to generate-locale-questions.ts**:
- Read the file as string
- Find the `supportedLocales` object (search for `const supportedLocales:`) and insert a new entry BEFORE the closing `};` of that object. The entry format: `'<slug>': () => import('./locale-configs/<slug>.js') as Promise<{ <configVarName>Config: LocaleConfig }>,`
- Find the `configKeys` array (search for `const configKeys = [`) and insert the new config key name (e.g. `'austinConfig'`) before the closing `]`
- Be careful: use string search + splice, NOT regex replace on the whole file. Find the exact insertion points.

**Step 4 — Add to COLLECTION_HIERARCHY** in `backend/src/services/embeddings/types.ts`:
- Read the file as string
- Find the `COLLECTION_HIERARCHY` object's closing `};`
- Insert a new entry before the closing brace: `  '<name>': '<tier>',`
- The key should be the collection display name from `--name` (e.g. "Austin, TX")

**After all 4 steps**, print a clear summary:
```
Collection scaffolded successfully!

Files modified:
  - backend/src/db/seed/collections.ts (new seed entry)
  - backend/src/scripts/content-generation/locale-configs/{slug}.ts (created)
  - backend/src/scripts/content-generation/generate-locale-questions.ts (locale registered)
  - backend/src/services/embeddings/types.ts (hierarchy entry added)

Next steps:
  1. Edit locale config: backend/src/scripts/content-generation/locale-configs/{slug}.ts
     - Customize topic categories and source URLs
  2. Seed the collection to DB:
     cd backend && npx tsx src/db/seed/seed.ts
  3. Generate questions:
     cd backend && npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale {slug} --fetch-sources
  4. Add banner image:
     frontend/public/images/collections/{slug}.jpg
  5. Activate when ready:
     cd backend && npx tsx src/scripts/activate-collection.ts --slug {slug} --prefix {prefix}
```

**Important implementation notes:**
- Use `import { readFileSync, writeFileSync, existsSync } from 'fs'` and `import { resolve, join } from 'path'` — synchronous fs is fine for a CLI script
- Resolve all file paths relative to `process.cwd()` (script runs from backend/ dir)
- Use `process.exit(1)` on validation errors with clear messages
- Do NOT use AST manipulation — string search + splice is the right approach here
  </action>
  <verify>
Run from the backend directory:
```
npx tsx src/scripts/scaffold-collection.ts --help
```
Should print usage info without errors.

Then do a dry verification by checking TypeScript compilation:
```
npx tsc --noEmit src/scripts/scaffold-collection.ts
```
  </verify>
  <done>
Script compiles, `--help` prints usage, all 4 file modification functions are implemented with proper string insertion logic. Script validates all required flags and prints clear next-steps after running.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create activate-collection CLI</name>
  <files>backend/src/scripts/activate-collection.ts</files>
  <action>
Create `backend/src/scripts/activate-collection.ts` — a parameterized CLI that replaces the hardcoded `activate-collections.ts`.

**CLI argument parsing:**
- Required: `--slug` (string), `--prefix` (string, the external_id prefix like "aut")
- Optional: `--dry-run` (boolean flag — show what would happen without writing)
- Print help with `--help`
- Validate: slug is non-empty, prefix matches `/^[a-z]{2,4}$/`

**Implementation:**
- Use `import 'dotenv/config'` at top (same as existing activate-collections.ts)
- Use `import { db } from '../db/index.js'`
- Use `import { collections, questions } from '../db/schema.js'`
- Use `import { eq, sql } from 'drizzle-orm'`

**Step 1 — Verify collection exists:**
```typescript
const [collection] = await db.select({ id: collections.id, name: collections.name, isActive: collections.isActive })
  .from(collections)
  .where(eq(collections.slug, slug))
  .limit(1);
```
If not found, print error and exit. If already active, print warning but continue.

**Step 2 — Count draft questions:**
```typescript
const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`);
```
Print the count. If count is 0, print warning "No draft questions found with prefix '{prefix}-*'. Nothing to activate." and skip question activation. If count < 50, print warning "Only {count} draft questions found (recommended: 50+). Proceeding anyway."

**Step 3 — If `--dry-run`**, print summary of what WOULD happen and exit:
```
DRY RUN — no changes made.
Would activate:
  Collection: {name} ({slug}) — currently {active/inactive}
  Questions: {count} draft questions matching '{prefix}-*'
```

**Step 4 — Activate collection:**
```typescript
await db.update(collections)
  .set({ isActive: true, updatedAt: sql`NOW()` })
  .where(eq(collections.slug, slug));
```

**Step 5 — Activate questions** (only if count > 0):
```typescript
const activated = await db.update(questions)
  .set({ status: 'active', updatedAt: sql`NOW()` })
  .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`)
  .returning({ externalId: questions.externalId });
```

**Step 6 — Print summary:**
```
Activation complete!
  Collection: {name} ({slug}) — now active
  Questions activated: {activated.length}
```

Then `process.exit(0)`.

**Wrap entire main in try/catch** with `process.exit(1)` on error, matching the pattern in the existing activate-collections.ts.
  </action>
  <verify>
Run from the backend directory:
```
npx tsx src/scripts/activate-collection.ts --help
```
Should print usage info.

Then verify TypeScript compiles:
```
npx tsc --noEmit src/scripts/activate-collection.ts
```

Then test dry-run against an existing collection:
```
npx tsx src/scripts/activate-collection.ts --slug bloomington-in --prefix bli --dry-run
```
Should show the dry-run summary without making changes.
  </verify>
  <done>
Script compiles, `--help` prints usage, `--dry-run` with an existing slug/prefix shows the correct count and summary without modifying the database. Script validates required flags, handles missing collections gracefully, and prints a clear activation summary.
  </done>
</task>

</tasks>

<verification>
1. Both scripts compile without TypeScript errors: `cd backend && npx tsc --noEmit src/scripts/scaffold-collection.ts src/scripts/activate-collection.ts`
2. Both scripts print help with `--help` flag
3. scaffold-collection validates and rejects bad input (missing flags, invalid slug format, invalid hex color)
4. activate-collection --dry-run works against an existing collection without side effects
</verification>

<success_criteria>
- scaffold-collection.ts exists and handles all 4 file modifications (seed entry, locale config, generate-locale registration, hierarchy entry)
- activate-collection.ts exists and performs parameterized activation with --dry-run support
- Both scripts have clear CLI help output and input validation
- Both scripts compile cleanly with TypeScript
</success_criteria>

<output>
After completion, create `.planning/quick/023-scaffold-and-activate-collection-cli/023-SUMMARY.md`
</output>
