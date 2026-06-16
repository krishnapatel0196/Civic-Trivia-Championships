# Phase 48: Activate Banked Collections - Research

**Researched:** 2026-03-01
**Domain:** Collection activation gate — DB state audit, readiness verification, is_active flip, post-activation UI verification
**Confidence:** HIGH

## Summary

Phase 48 activates Fremont CA and Norwich UK from banked (inactive) to live. Both collections have questions in the database as `draft` status. Fremont has 92 curated question IDs ready to activate; Norwich has 117 questions inserted as draft. The activation machinery (`activate-collection.ts`) already exists and is parameterized. The gap is the pre-activation readiness audit — the existing script warns on low counts but does not block; the context decisions require a blocking gate.

The standard flow for each collection is: (1) run a readiness audit that counts draft questions, accounts for expiring questions, and blocks if the net active count would fall below 50; (2) if the count check passes, run `activate-collection.ts` to flip `isActive` and promote draft questions to active; (3) run a post-activation verification script that queries the live collections API and confirms the collection appears with `is_active = true` and `questionCount >= 50`.

The critical context decision left to Claude's discretion is whether the readiness check is a separate script (`audit-collection-readiness.ts`) or a built-in gate within `activate-collection.ts`. Based on the codebase patterns, a **separate audit script** is recommended — it matches the existing separation of concerns (`check-fremont-status.ts`, `check-fremont-questions.ts`, `verify-fremont-final.ts` are all standalone), is easier to run in dry-run mode before committing to activation, and produces a report the planner can document.

**Primary recommendation:** Build `audit-collection-readiness.ts` as a standalone script with `--slug` and `--prefix` parameters. Run it before `activate-collection.ts`. Build `verify-post-activation.ts` as the success-criteria verification script that queries the API and validates all criteria programmatically.

## Standard Stack

No new libraries are needed. This phase uses the existing project stack exclusively.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Drizzle ORM | existing | DB queries for audit and activation | Already used everywhere; type-safe, uses `trivia` schema via `triviaSchema` |
| `tsx` | existing | Run TypeScript scripts | Already used for all backend scripts |
| Node `fetch` | built-in | HTTP call to `/api/game/collections` for post-activation check | No new dep needed |
| dotenv/config | existing | Load DATABASE_URL | Already used in all scripts |

### No Installation Required
All dependencies are in-project. No `npm install` needed.

## Architecture Patterns

### Recommended Script Structure

```
backend/src/scripts/
├── audit-collection-readiness.ts    # NEW — pre-activation blocking audit
│                                    #   --slug X --prefix Y
│                                    #   exits 1 if not ready, 0 if ready
│
├── activate-collection.ts           # EXISTING — flip isActive + promote drafts
│                                    #   --slug X --prefix Y [--dry-run]
│
└── verify-post-activation.ts        # NEW — post-activation API verification
                                     #   --slug X (queries /api/game/collections)
```

### Pattern 1: Readiness Audit Script (`audit-collection-readiness.ts`)
**What:** Queries draft question counts for a collection by prefix, factors in near-term expirations, blocks activation if net count < 50.
**When to use:** Before every activation run.

```typescript
// Pattern: Drizzle ORM query — trivia schema, NOT civic_trivia
// Source: backend/src/routes/game.ts lines 58-103 (the /collections endpoint logic)

import 'dotenv/config';
import { db } from '../db/index.js';
import { collections, questions, collectionQuestions } from '../db/schema.js';
import { eq, sql, isNull, gt, and, lt } from 'drizzle-orm';

// Count draft questions for prefix (questions that would be activated)
const [countResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`);

// Count of those drafts that would expire within 90 days of activation
const nearTermCutoff = new Date();
nearTermCutoff.setDate(nearTermCutoff.getDate() + 90);

const [expiringResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(sql`
    ${questions.externalId} LIKE ${prefix + '-%'}
    AND ${questions.status} = 'draft'
    AND ${questions.expiresAt} IS NOT NULL
    AND ${questions.expiresAt} < ${nearTermCutoff}
  `);

const totalDraft = countResult?.count ?? 0;
const expiringCount = expiringResult?.count ?? 0;
const netCount = totalDraft - expiringCount;

// Pass/fail gate
if (netCount < 50) {
  console.error(`BLOCKED: Net question count ${netCount} < 50 minimum.`);
  process.exit(1); // Non-zero exit blocks activation in pipeline
}
```

### Pattern 2: Activation (existing `activate-collection.ts`)
**What:** Sets `isActive = true` on collection and promotes all draft questions matching prefix to `active`.
**When to use:** After audit passes.

```bash
# Source: backend/src/scripts/activate-collection.ts
cd backend
npx tsx src/scripts/activate-collection.ts --slug fremont-ca --prefix fre --dry-run
npx tsx src/scripts/activate-collection.ts --slug fremont-ca --prefix fre
```

Key behavior of existing script:
- Verifies collection exists in DB
- Counts draft questions matching `{prefix}-%`
- Warns (does not block) if `draftCount < 50`
- Sets `collections.isActive = true`
- Sets all matching `questions.status = 'draft'` to `'active'`

### Pattern 3: Post-Activation Verification Script (`verify-post-activation.ts`)
**What:** Queries `/api/game/collections` endpoint and verifies collection appears with correct data.
**When to use:** After `activate-collection.ts` completes.

```typescript
// Source pattern: backend/src/routes/game.ts — the /collections endpoint
// Returns: { collections: CollectionSummary[] } where MIN_QUESTION_THRESHOLD = 50 filters apply

// The API already enforces the 50-question minimum and expiry filtering:
// filtered = rows.filter(r => r.questionCount >= MIN_QUESTION_THRESHOLD)
// So if the collection appears in API response, it means is_active=true AND questionCount>=50

const response = await fetch(`${process.env.API_BASE_URL}/api/game/collections`);
const { collections } = await response.json();
const collection = collections.find(c => c.slug === slug);

if (!collection) {
  console.error(`FAIL: Collection ${slug} not found in API response`);
  process.exit(1);
}
if (collection.questionCount < 50) {
  console.error(`FAIL: questionCount ${collection.questionCount} < 50`);
  process.exit(1);
}
console.log(`PASS: ${collection.name} — ${collection.questionCount} active questions`);
```

### Pattern 4: Schema Name — CRITICAL
**What:** All new scripts MUST use Drizzle ORM (which references `triviaSchema = pgSchema('trivia')`) or qualify raw SQL with `trivia.` schema name.

**NEVER use `civic_trivia.` in new scripts.** Several existing scripts (`check-fremont-questions.ts`, `check-fremont-status.ts`, `verify-fremont-final.ts`, `verify-activation.ts`) use the old `civic_trivia.` schema name and will fail against the production `trivia` schema.

```typescript
// CORRECT — Drizzle ORM (schema is trivia via triviaSchema)
import { questions, collections } from '../db/schema.js';
const result = await db.select().from(collections).where(...);

// CORRECT — raw SQL with correct schema
await db.execute(sql`SELECT COUNT(*) FROM trivia.collections WHERE ...`);

// WRONG — old schema name, will fail in production
await db.execute(sql`SELECT COUNT(*) FROM civic_trivia.collections WHERE ...`);
```

### Pattern 5: Norwich External ID Prefix
Norwich locale config specifies `externalIdPrefix: 'nor'` (NOT `'nur'` as noted in MEMORY.md). The generation report for `norwich-uk-2026-02-26` inserted 117 questions with `nor-` prefixed IDs. Use `--prefix nor` for all Norwich activation and audit commands.

```bash
# Fremont
npx tsx src/scripts/activate-collection.ts --slug fremont-ca --prefix fre

# Norwich — prefix is 'nor', not 'nur'
npx tsx src/scripts/activate-collection.ts --slug norwich-uk --prefix nor
```

### Anti-Patterns to Avoid
- **Using `civic_trivia.` in raw SQL**: Will fail on production `trivia` schema. Use Drizzle ORM or `trivia.` prefix.
- **Skipping the audit**: `activate-collection.ts` warns but does not block on low counts. The audit script must be run first and its exit code checked.
- **Relying on fremont-ca-questions.json for DB state**: The JSON file has 72 questions; the DB has more (92+ curated, some from different generation runs). Always query the DB directly.
- **Using `verify-fremont-final.ts` as-is**: It uses `civic_trivia.` schema and will fail. The new verification script must be written fresh.
- **Forgetting `collection_questions` join**: Questions in `trivia.questions` are linked to a collection via `trivia.collection_questions`. An audit that only queries by `externalId LIKE 'fre-%'` counts questions in the question table, which is correct for prefix-based queries. However, the API counts via `collection_questions` join. Both approaches yield the same result as long as questions were properly linked during generation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collection activation | Custom UPDATE logic | `activate-collection.ts --slug X --prefix Y` | Already handles collection + questions in one transaction |
| Question count | Custom SQL | Drizzle ORM query on `collectionQuestions` join | Reuses same join pattern as API; already tested |
| Near-term expiry calculation | Date math from scratch | `new Date(); d.setDate(d.getDate() + 90)` | Simple JS date, no library needed |
| API verification | Parse HTML | `fetch('/api/game/collections')` JSON response | Collections endpoint already returns exactly what's needed |

**Key insight:** The activation infrastructure is complete. This phase is configuration and verification, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Schema Name Mismatch
**What goes wrong:** Raw SQL using `civic_trivia.` schema will fail with "schema does not exist" in production because the database uses `trivia` schema (v1.8 migration).
**Why it happens:** Many existing scripts pre-date the v1.8 schema migration and were never updated. Copy-pasting from them propagates the error.
**How to avoid:** Always use Drizzle ORM table references (`questions`, `collections` from `schema.ts`) or raw SQL with `trivia.` prefix.
**Warning signs:** `relation "civic_trivia.questions" does not exist` error.

### Pitfall 2: Norwich Prefix Discrepancy
**What goes wrong:** Using `nur` prefix (from MEMORY.md) instead of `nor` (from actual locale config).
**Why it happens:** MEMORY.md says `nur-` but the locale config at `locale-configs/norwich-uk.ts` line 36 specifies `externalIdPrefix: 'nor'`. The generation report confirms `nor-` IDs were inserted.
**How to avoid:** Always derive prefix from the locale config file, not from MEMORY.md or assumptions.
**Warning signs:** "No draft questions found with prefix 'nur-*'" from `activate-collection.ts`.

### Pitfall 3: Fremont Question Count Uncertainty
**What goes wrong:** Assuming the `fremont-ca-questions.json` count (72) reflects DB state.
**Why it happens:** Multiple Fremont generation runs happened at different times. The JSON data file, the curated IDs file (92 IDs), and the DB are separate artifacts. The DB is the source of truth.
**How to avoid:** Run the readiness audit script against the DB directly; don't infer from JSON files.
**Warning signs:** Count from audit script differs from JSON file count.

### Pitfall 4: Fremont Needs Curate-Then-Activate Two-Step
**What goes wrong:** Running `activate-collection.ts --slug fremont-ca --prefix fre` only activates ALL draft questions — but curation already identified 92 specific questions to keep. The uncurated remainder should stay as draft or be archived, not accidentally activated.
**Why it happens:** `activate-collection.ts` activates ALL questions matching `fre-%` with `status='draft'`, not just the curated subset.
**How to avoid:** The readiness audit must also check whether the curated-fremont-ids.txt IDs have been activated (via `curate-fremont-questions.ts --mode activate --all-curated`). If not, that step must run BEFORE `activate-collection.ts`. If it has already run, those 92 are now `active` and `activate-collection.ts` won't affect them (it only touches drafts).
**Warning signs:** Question count after activation is higher than expected (e.g., 92 becomes 130+ because extra drafts got promoted).

### Pitfall 5: The Collections API Enforces MIN_QUESTION_THRESHOLD
**What goes wrong:** Collection is marked `is_active=true` but does not appear in the API response and therefore not in the frontend.
**Why it happens:** `game.ts` line 92 filters out collections with `questionCount < 50`. If the activation puts fewer than 50 questions in `active` status, the collection is invisible.
**How to avoid:** The readiness audit verifies net count >= 50 before activation.
**Warning signs:** Collection doesn't appear in frontend picker despite `is_active=true` in DB.

### Pitfall 6: Expiry Logic in Collections API
**What goes wrong:** Collection shows fewer questions than expected after activation.
**Why it happens:** The `/api/game/collections` endpoint filters questions by `expiresAt IS NULL OR expiresAt > NOW()`. Questions with past expiry dates count as 0 even if `status='active'`.
**How to avoid:** The audit script checks for near-term expiries. None of the Fremont questions in the JSON have non-null `expiresAt` (all 72 have `"expiresAt": null`). Norwich generation used the city prompt which may have set expiry on council-member-specific questions.
**Warning signs:** Collection appears in API but with lower `questionCount` than total active in DB.

## Code Examples

### Readiness Audit — Key DB Query
```typescript
// Source: Derived from backend/src/routes/game.ts lines 58-103
// Uses Drizzle ORM (trivia schema), counts draft questions + expiration check

import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions } from '../db/schema.js';
import { sql, eq, and, isNull, gt, lt } from 'drizzle-orm';

const prefix = 'fre'; // or 'nor'
const slug = 'fremont-ca'; // or 'norwich-uk'
const MIN_QUESTIONS = 50;
const NEAR_TERM_DAYS = 90;

// 1. Verify collection exists and is currently inactive
const [collection] = await db
  .select({ id: collections.id, name: collections.name, isActive: collections.isActive })
  .from(collections)
  .where(eq(collections.slug, slug))
  .limit(1);

// 2. Count draft questions for this collection via prefix
const [totalDraftResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`);

const totalDraft = totalDraftResult?.count ?? 0;

// 3. Count questions expiring within NEAR_TERM_DAYS
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() + NEAR_TERM_DAYS);

const [expiringResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(questions)
  .where(sql`
    ${questions.externalId} LIKE ${prefix + '-%'}
    AND ${questions.status} = 'draft'
    AND ${questions.expiresAt} IS NOT NULL
    AND ${questions.expiresAt} < ${cutoff.toISOString()}
  `);

const expiringCount = expiringResult?.count ?? 0;
const netCount = totalDraft - expiringCount;

// 4. Full report output
console.log(`Collection: ${collection.name}`);
console.log(`Draft questions: ${totalDraft}`);
console.log(`Expiring within ${NEAR_TERM_DAYS} days: ${expiringCount}`);
console.log(`Net question count: ${netCount}`);
console.log(`Minimum required: ${MIN_QUESTIONS}`);
console.log(`Status: ${netCount >= MIN_QUESTIONS ? 'READY' : 'NOT READY'}`);

if (netCount < MIN_QUESTIONS) {
  console.error(`\nBLOCKED: Need ${MIN_QUESTIONS - netCount} more questions.`);
  process.exit(1);
}
console.log('\nReadiness check PASSED. Safe to activate.');
process.exit(0);
```

### Activation (existing script)
```bash
# Source: backend/src/scripts/activate-collection.ts
cd backend

# Fremont
npx tsx src/scripts/activate-collection.ts --slug fremont-ca --prefix fre --dry-run
npx tsx src/scripts/activate-collection.ts --slug fremont-ca --prefix fre

# Norwich (prefix is 'nor' per locale-configs/norwich-uk.ts line 36)
npx tsx src/scripts/activate-collection.ts --slug norwich-uk --prefix nor --dry-run
npx tsx src/scripts/activate-collection.ts --slug norwich-uk --prefix nor
```

### Post-Activation API Verification
```typescript
// Source: Derived from frontend/src/features/collections/hooks/useCollections.ts
// and backend/src/routes/game.ts GET /collections

import 'dotenv/config';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const slugsToVerify = ['fremont-ca', 'norwich-uk'];

const response = await fetch(`${API_BASE}/api/game/collections`);
if (!response.ok) {
  console.error(`API returned ${response.status}`);
  process.exit(1);
}

const { collections } = await response.json();

for (const slug of slugsToVerify) {
  const collection = collections.find((c: any) => c.slug === slug);
  if (!collection) {
    console.error(`FAIL: ${slug} not in API response (is_active=false or <50 questions)`);
    process.exit(1);
  }
  if (collection.questionCount < 50) {
    console.error(`FAIL: ${slug} has ${collection.questionCount} questions (need >= 50)`);
    process.exit(1);
  }
  console.log(`PASS: ${collection.name} — ${collection.questionCount} active questions`);
}

console.log('\nAll success criteria met.');
process.exit(0);
```

### CollectionPicker Category Routing (existing, no changes needed)
```typescript
// Source: frontend/src/features/collections/components/CollectionPicker.tsx lines 12-16
// norwich-uk -> 'local' ✓ (doesn't match 'federal' or end with '-state')
// fremont-ca -> 'local' ✓

function getCategory(slug: string): 'local' | 'state' | 'federal' {
  if (slug === 'federal') return 'federal';
  if (slug.endsWith('-state')) return 'state';
  return 'local';  // fremont-ca, norwich-uk, bloomington-in, los-angeles-ca all land here
}

// Alphabetical sort within local section (name.localeCompare):
// Bloomington, IN < Fremont, CA < Los Angeles, CA < Norwich, England
// This exactly matches the CONTEXT.md decision for Local section order.
```

## Current State of Each Collection

### Fremont CA
| Item | State |
|------|-------|
| Collection row in DB | Exists, `is_active = false`, `sortOrder = 3` |
| Locale config | `backend/src/scripts/content-generation/locale-configs/fremont-ca.ts` |
| External ID prefix | `fre` |
| Questions in DB | ~92 curated IDs in `curated-fremont-ids.txt`; DB count must be confirmed via audit script |
| Questions status | Draft (curate script may need `--mode activate --all-curated` first) |
| expiresAt on questions | All 72 in JSON have `null`; DB-only questions may vary |
| Banner image | `frontend/public/images/collections/fremont-ca.jpg` (40KB) — exists |
| Slug categorization | `getCategory('fremont-ca')` returns `'local'` |

### Norwich UK
| Item | State |
|------|-------|
| Collection row in DB | Exists, `is_active = false`, `sortOrder = 7` |
| Locale config | `backend/src/scripts/content-generation/locale-configs/norwich-uk.ts` |
| External ID prefix | `nor` (NOT `nur`) |
| Questions in DB | 117 inserted per generation report `2026-02-26`; DB count must be confirmed via audit |
| Questions status | Draft (generation inserts as draft) |
| expiresAt on questions | System prompt guidance sets expiry on official-name questions; actual count unknown until audit |
| Banner image | `frontend/public/images/collections/norwich-uk.jpg` (143KB) — exists |
| Slug categorization | `getCategory('norwich-uk')` returns `'local'` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `activate-collections.ts` (hardcoded slugs) | `activate-collection.ts --slug X --prefix Y` | Phase ~25 | Parameterized; can activate any collection without code changes |
| `civic_trivia.` schema | `trivia.` schema (via `triviaSchema = pgSchema('trivia')`) | Phase 40 (v1.8 migration) | All new scripts MUST use `trivia`; old check/verify scripts with `civic_trivia.` are stale |
| No tier field | `tier` column on collections | Phase 47 | CollectionPicker groups by tier; no slug-based hacks needed |
| Hardcoded COLLECTION_HIERARCHY | DB-driven tier via `loadCollectionTierMap()` | Phase 47 | New collections just need a seed entry |

**Deprecated/outdated:**
- `verify-fremont-final.ts`: Uses `civic_trivia.` schema — DO NOT USE. Write a new verification script.
- `verify-activation.ts`: Uses `civic_trivia.` schema — DO NOT USE as-is.
- `check-fremont-questions.ts`, `check-fremont-status.ts`: Use `civic_trivia.` schema — will fail.
- `activate-collections.ts`: Hardcoded to Bloomington/LA/Indiana/California — not for new activations.

## Open Questions

1. **Fremont: curate-then-activate vs. activate-all**
   - What we know: `curated-fremont-ids.txt` has 92 IDs. `curate-fremont-questions.ts --mode activate --all-curated` sets those to `active`. `activate-collection.ts --prefix fre` would then find 0 remaining drafts (or a small number if some curated IDs weren't activated yet).
   - What's unclear: Whether the curate `--mode activate` step has already been run in production. If it was, the 92 questions are already `active` and `activate-collection.ts` just flips `isActive` on the collection. If it wasn't, need to run it first.
   - Recommendation: The audit script must check BOTH `status='draft'` AND `status='active'` for Fremont prefix to understand full picture. The readiness gate should count questions that will be `active` post-activation (current active + current draft).

2. **Norwich expiry count**
   - What we know: The city system prompt instructs setting `expiresAt` on official-name questions (e.g., "current councillor for X ward"). Norwich City Council uses rotation elections — some wards elect annually. Questions about specific councillors may have early expiry.
   - What's unclear: Exactly how many of the 117 generated questions have non-null `expiresAt` and how near-term they are.
   - Recommendation: Audit script surfaces this count. If net count drops below 50, generate additional questions targeting structural/policy topics that don't expire.

3. **Production vs. local DB for activation**
   - What we know: All scripts use `DATABASE_URL` from `.env`.
   - What's unclear: Whether the audit + activation should run against local dev DB or production Supabase.
   - Recommendation: Always run activation scripts against production Supabase (same `DATABASE_URL` as production). The questions were generated against the shared Supabase project. Local DB state is unreliable for activation decisions.

## Sources

### Primary (HIGH confidence)
- `backend/src/scripts/activate-collection.ts` — full implementation read; activation logic confirmed
- `backend/src/routes/game.ts` lines 15-104 — MIN_QUESTION_THRESHOLD=50, expiry filter, collections API
- `backend/src/db/schema.ts` — `triviaSchema = pgSchema('trivia')`, all table definitions
- `backend/src/config/database.ts` — `search_path=trivia` confirms schema name
- `frontend/src/features/collections/components/CollectionPicker.tsx` — `getCategory()` logic confirmed
- `backend/src/scripts/content-generation/locale-configs/norwich-uk.ts` line 36 — `externalIdPrefix: 'nor'`
- `backend/src/db/seed/collections.ts` — both collections seeded with `is_active: false`, correct slugs/sort orders
- `backend/src/scripts/data/reports/generation-norwich-uk-2026-02-26.json` — 117 questions inserted
- `backend/src/scripts/data/curated-fremont-ids.txt` — 92 curated IDs for Fremont
- `frontend/public/images/collections/` — confirmed `fremont-ca.jpg` and `norwich-uk.jpg` exist

### Secondary (MEDIUM confidence)
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` — Fremont expiry guidance (officials expire 2027), Norwich voice guidance (no specific expiry dates documented)
- `backend/src/data/fremont-ca-questions.json` — 72 questions in JSON, all with `expiresAt: null`; DB may differ

### Tertiary (LOW confidence)
- MEMORY.md `nur-` prefix for Norwich — contradicted by actual locale config; use `nor-` from source

## Metadata

**Confidence breakdown:**
- Current collection state (slugs, sort orders, is_active): HIGH — read from seed file and schema
- Activation command patterns: HIGH — read from activate-collection.ts source
- Question counts (Fremont 92, Norwich 117): HIGH for "were inserted", MEDIUM for "current DB state" (DB is live, may have changed)
- Schema name (`trivia` not `civic_trivia`): HIGH — confirmed via schema.ts and database.ts
- Norwich prefix (`nor` not `nur`): HIGH — confirmed via locale-configs/norwich-uk.ts
- Frontend category routing: HIGH — confirmed getCategory logic handles both slugs correctly
- Banner images: HIGH — directory listing confirmed both files exist
- Expiry details on Norwich questions: LOW — generation prompt implies some may be set, but DB count unknown

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable infrastructure, 30-day validity)
