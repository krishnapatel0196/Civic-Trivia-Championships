# Phase 35: Election Data Foundation + Quality Rule - Research

**Researched:** 2026-02-25
**Domain:** Drizzle ORM schema migrations, PostgreSQL JSONB, quality rules engine extension, admin UI CRUD
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 35 has two independent tracks: (1) a DB schema + Drizzle types track for the `election_races` table and `election_race_id` FK, and (2) a quality rules engine extension for `checkAddressPhone`. Both tracks have clear precedents in the existing codebase.

The schema track follows the exact same pattern as all other Drizzle tables in `backend/src/db/schema.ts`. The project uses `drizzle-kit push` (not `generate`+`migrate`) for schema changes — confirmed by `package.json`. The migration journal has only one entry (the initial migration), meaning all subsequent schema changes have been applied with `drizzle-kit push` directly to Supabase. The new `election_races` table uses a JSONB column for `candidates`, matching the existing JSONB pattern for `options`, `source`, and `learningContent`.

The quality rules track follows the established engine pattern: one new file in `backend/src/services/qualityRules/rules/`, registered in `ALL_SYNC_RULES` in `index.ts`, and a weight entry in `scoring.ts`. The `checkAddressPhone` rule is ADVISORY (flag, don't block). The audit script follows the exact pattern of `audit-questions.ts` but scopes output to address/phone flagged questions grouped by collection.

The admin UI for creating election races follows the existing admin page pattern: a new page component under `frontend/src/pages/admin/`, a new route in `App.tsx`, and a nav link added to `AdminLayout.tsx`. The project does NOT use react-hook-form or zod on the frontend — form state is managed with plain `useState`.

**Primary recommendation:** Follow existing patterns exactly — no new libraries needed for either track.

---

## Standard Stack

This phase requires no new libraries. Everything needed already exists in the project.

### Core (already installed)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| `drizzle-orm` | ^0.45.1 | ORM + schema definition | Define `election_races` table, add FK to `questions` |
| `drizzle-kit` | ^0.31.9 | Schema push tool | `npm run db:migrate` to push schema changes |
| `pg` | ^8.11.3 | PostgreSQL driver | Unchanged |
| `zod` | ^4.3.6 | Backend validation | Validate election race create/update requests |
| `express` | ^4.18.2 | HTTP routing | New admin API route `/api/admin/election-races` |
| `react` | ^18.2.0 | Frontend | Admin UI form |
| `react-router-dom` | ^6.21.1 | Frontend routing | New route `/admin/elections` |
| `tailwindcss` | ^3.4.1 | Frontend styling | Admin form styling |

### No New Libraries Needed
The quality rule uses only regex — no phone/address parsing library required.
The admin form uses plain `useState` — no form library required.
The audit script uses existing DB access and quality rules engine — no new tooling.

---

## Architecture Patterns

### Project Structure (existing, confirmed)

```
backend/src/
├── db/
│   ├── schema.ts           # ADD: electionRaces table + electionRaceId FK on questions
│   ├── index.ts            # No changes (re-exports db + schema)
│   └── migrations/         # drizzle-kit push manages this
├── routes/
│   └── admin.ts            # ADD: election race CRUD routes
├── services/
│   └── qualityRules/
│       ├── index.ts        # ADD: checkAddressPhone to ALL_SYNC_RULES
│       ├── scoring.ts      # ADD: 'address-phone' weight entry
│       └── rules/
│           └── address-phone.ts  # NEW: checkAddressPhone rule
└── scripts/
    └── audit-address-phone.ts    # NEW: audit script

frontend/src/
├── pages/
│   └── admin/
│       ├── AdminLayout.tsx   # ADD: "Elections" nav link
│       └── ElectionsPage.tsx # NEW: election race list + create form
└── App.tsx                   # ADD: /admin/elections route
```

### Pattern 1: Drizzle Table Definition

All tables in `schema.ts` follow this exact pattern (confirmed from `schema.ts`):

```typescript
// Source: backend/src/db/schema.ts (existing pattern)
export const electionRaces = civicTriviaSchema.table('election_races', {
  id: serial('id').primaryKey(),
  seat: text('seat').notNull(),
  electionType: text('election_type').notNull(), // 'primary' | 'general' | 'runoff' | 'by-election'
  electionDate: timestamp('election_date', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  candidates: jsonb('candidates').$type<Array<{
    name: string;
    party: string;
    incumbent: boolean;
  }>>().notNull().default([]),
  questionsGenerated: boolean('questions_generated').notNull().default(false),
  followupGenerated: boolean('followup_generated').notNull().default(false),
  result: text('result'), // nullable — filled after election resolves
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports follow every table definition
export type ElectionRace = typeof electionRaces.$inferSelect;
export type NewElectionRace = typeof electionRaces.$inferInsert;
```

### Pattern 2: Nullable FK Column Addition

Adding `election_race_id` to `questions` follows the same pattern as other nullable FKs (e.g., `expiresAt`, `learningContent`). It must be added inside the existing `questions` table definition in `schema.ts`:

```typescript
// Source: backend/src/db/schema.ts — ADD inside questions table definition
electionRaceId: integer('election_race_id')
  .references(() => electionRaces.id, { onDelete: 'set null' }),
  // nullable — omit .notNull() to make it nullable
```

**Critical:** The `electionRaces` table definition must appear BEFORE the `questions` table definition in `schema.ts` because `questions` references it. JavaScript/TypeScript `references()` calls use arrow functions to defer evaluation, so this order matters only for Drizzle's internal resolution.

### Pattern 3: Schema Push (not generate+migrate)

The project uses `drizzle-kit push` for all schema changes, NOT `drizzle-kit generate` + `drizzle-kit migrate`:

```bash
# Source: backend/package.json
npm run db:migrate   # runs: drizzle-kit push
```

`drizzle-kit push` directly applies schema changes to the database without creating migration files. The `migrations/` folder is for the initial snapshot only. **Do NOT run `npm run db:generate`** — it will generate a new migration file that is not needed and may conflict.

### Pattern 4: Quality Rule File Structure

All rules follow this exact pattern (confirmed from `ambiguity.ts`, `structural.ts`, `partisan.ts`):

```typescript
// Source: backend/src/services/qualityRules/rules/address-phone.ts (to create)
import { RuleResult, QuestionInput, Violation } from '../types.js';

const US_PHONE_REGEX = /(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const UK_PHONE_REGEX = /(\+44[-.\s]?)?\(?(0\d{1,4})\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;
const STREET_ADDRESS_REGEX = /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\.?\b/i;

export function checkAddressPhone(question: QuestionInput): RuleResult {
  const violations: Violation[] = [];

  for (const option of question.options) {
    const evidence: string[] = [];

    if (US_PHONE_REGEX.test(option)) evidence.push(`US phone in option: "${option}"`);
    if (UK_PHONE_REGEX.test(option)) evidence.push(`UK phone in option: "${option}"`);
    if (STREET_ADDRESS_REGEX.test(option)) evidence.push(`Street address in option: "${option}"`);

    if (evidence.length > 0) {
      violations.push({
        rule: 'address-phone',
        severity: 'advisory',
        message: 'Answer option contains a phone number or street address',
        evidence: evidence.join('; '),
      });
    }
  }

  return { passed: violations.length === 0, violations };
}
```

### Pattern 5: Register Rule in Engine

```typescript
// Source: backend/src/services/qualityRules/index.ts — modify ALL_SYNC_RULES
import { checkAddressPhone } from './rules/address-phone.js';

export const ALL_SYNC_RULES: QualityRule[] = [
  checkAmbiguousAnswers,
  checkVagueQualifiers,
  checkPureLookup,
  checkStructuralQuality,
  checkPartisanFraming,
  checkAddressPhone,  // ADD
];
```

```typescript
// Source: backend/src/services/qualityRules/scoring.ts — add weight
export const SCORE_WEIGHTS: Record<string, number> = {
  // ... existing weights ...
  'address-phone': 10,  // ADD — advisory, modest penalty
};
```

### Pattern 6: Admin API Route

All admin routes are in `backend/src/routes/admin.ts`, authenticated with `authenticateToken, requireAdmin` middleware applied at the router level. New routes append to the existing file:

```typescript
// Source: backend/src/routes/admin.ts (existing pattern)
import { electionRaces } from '../db/schema.js';

// GET /api/admin/election-races — list all
router.get('/election-races', async (req: Request, res: Response) => { ... });

// POST /api/admin/election-races — create new
router.post('/election-races', async (req: Request, res: Response) => { ... });
```

### Pattern 7: Admin Frontend Page

Frontend admin pages use this structure (confirmed from `AdminDashboard.tsx`, `FlagReviewPage.tsx`):

```typescript
// Source: frontend/src/pages/admin/ElectionsPage.tsx (to create)
import { useState, useEffect } from 'react';
import { API_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export function ElectionsPage() {
  const { accessToken } = useAuthStore();
  const [races, setRaces] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // form state: useState for each field
  // fetch on mount, POST on submit
}
```

Route registration in `App.tsx`:
```typescript
// Source: frontend/src/App.tsx — add inside admin route block
<Route path="elections" element={<ElectionsPage />} />
```

Nav link in `AdminLayout.tsx`:
```typescript
// Source: frontend/src/pages/admin/AdminLayout.tsx — add to navigation array
{ name: 'Elections', href: '/admin/elections', icon: ElectionIcon },
```

### Pattern 8: Audit Script Structure

The `audit-address-phone.ts` script follows `audit-questions.ts` exactly:

```typescript
// Source: backend/src/scripts/audit-address-phone.ts (to create)
import '../env.js';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import { checkAddressPhone } from '../services/qualityRules/rules/address-phone.js';

// 1. Fetch all active questions with collection names (same SQL as audit-questions.ts)
// 2. Run checkAddressPhone on options for each question
// 3. Group flagged questions by collection name
// 4. Print report to console (no file write needed, no auto-archival)
// 5. process.exit(0)
```

Add to `package.json` scripts:
```json
"audit-address-phone": "tsx src/scripts/audit-address-phone.ts"
```

### Anti-Patterns to Avoid

- **Using `drizzle-kit generate` instead of `push`:** This project uses push. Running generate creates unwanted migration files.
- **Putting the new rule in `ALL_ASYNC_RULES`:** `checkAddressPhone` is synchronous (pure regex). It belongs in `ALL_SYNC_RULES`.
- **Adding `electionRaceId` FK as `notNull()`:** The requirements specify nullable FK. Every existing election question starts with null.
- **Creating a junction table for `election_race_id`:** Requirements explicitly specify a direct FK on `questions` — each election question belongs to exactly one race.
- **Building the frontend form with react-hook-form or zod:** These are not installed on the frontend. Use plain `useState` like all other admin forms.
- **Defining `electionRaces` after `questions` in schema.ts without arrow function:** Drizzle references use `() => electionRaces.id` (arrow function), so ordering in the file doesn't cause errors, but defining it before `questions` is cleaner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone regex | Custom validator | Standard regex patterns (see Pattern 4) | Well-established patterns for US/UK formats |
| DB migration | Manual SQL file | `npm run db:migrate` (drizzle-kit push) | Project's established workflow |
| Admin auth | Custom middleware | Existing `authenticateToken, requireAdmin` | Already applied at router level |
| JSONB typing | Generic `jsonb()` | `jsonb().$type<Array<{...}>>()` | Drizzle's established pattern in this project |

**Key insight:** Both the quality rule engine and admin patterns are fully established in the codebase. The implementation is straightforward pattern-following, not novel architecture.

---

## Common Pitfalls

### Pitfall 1: drizzle-kit push vs generate
**What goes wrong:** Running `npm run db:generate` creates a new SQL migration file in `migrations/`. But the project doesn't use `drizzle-kit migrate` — it uses `drizzle-kit push`. A generated migration file would then be orphaned and cause confusion on next push.
**Why it happens:** Developers assume `generate` + `migrate` is the workflow.
**How to avoid:** Only run `npm run db:migrate` (which is `drizzle-kit push`). Do not run `npm run db:generate`.
**Warning signs:** New `.sql` files appearing in `backend/src/db/migrations/` after schema changes.

### Pitfall 2: FK ordering in schema.ts
**What goes wrong:** If `election_race_id` references `electionRaces.id` but `electionRaces` is defined after `questions` in the file, Drizzle may have trouble resolving the reference at definition time.
**Why it happens:** JavaScript closures defer evaluation, but Drizzle processes the schema in file order.
**How to avoid:** Define `electionRaces` table BEFORE `questions` table in `schema.ts`, or confirm the arrow function `() => electionRaces.id` defers evaluation correctly. The existing `topics` → `questions` pattern (topics defined first, questions reference topics) is the safe pattern to follow.
**Warning signs:** TypeScript error on `references(() => electionRaces.id)` saying `electionRaces` is used before initialization.

### Pitfall 3: Address regex false positives
**What goes wrong:** A broad street address regex like `\d+\s+\w+\s+(Street|Ave...)` will match question text that contains legitimate civic addresses as *subject matter* (e.g., "The Supreme Court is located at 1 First Street NE") — but the rule should only scan `options`, not `question.text` or `explanation`.
**Why it happens:** Overly broad scanning scope.
**How to avoid:** `checkAddressPhone` must only scan `question.options` (the answer choices), not the question text or explanation. Civic questions legitimately reference addresses in the question body.
**Warning signs:** High false-positive count when running `audit-address-phone.ts` — many questions flagged that are clearly fine.

### Pitfall 4: Missing `.js` extension in imports
**What goes wrong:** TypeScript with `"type": "module"` (confirmed in `backend/package.json`) requires `.js` extensions on all local imports even for `.ts` source files.
**Why it happens:** ESM resolution requires explicit file extensions.
**How to avoid:** All imports in the new rule file use `.js` extension: `import { RuleResult, QuestionInput, Violation } from '../types.js';`
**Warning signs:** `Error [ERR_MODULE_NOT_FOUND]` at runtime.

### Pitfall 5: Admin form missing Bearer token
**What goes wrong:** Admin API calls fail with 401 if the Authorization header is missing.
**Why it happens:** The admin router uses `authenticateToken` middleware.
**How to avoid:** All fetch calls in admin pages include `'Authorization': \`Bearer ${accessToken}\`` header. Confirmed pattern in `AdminDashboard.tsx`.
**Warning signs:** 401 responses from `/api/admin/election-races`.

### Pitfall 6: election_type constraint
**What goes wrong:** The `election_type` field should be constrained to valid values. Without a CHECK constraint, invalid strings can be inserted.
**How to avoid:** Either add a PostgreSQL CHECK constraint in the schema definition, or validate in the Zod schema on the backend route handler. Given this project's pattern (see `check_difficulty` constraint in the initial migration), a CHECK constraint in Drizzle is preferred:
```typescript
// Drizzle doesn't support inline CHECK constraints directly —
// use Zod validation in the route handler for election_type
```
Actually, checking the existing schema: the `difficulty` CHECK constraint is in the raw SQL migration file (`0001_create_collections_topics_questions.sql`), not in the Drizzle schema definition. With `drizzle-kit push`, you can add Postgres-level constraints but the `pgSchema.table()` API uses `check()` from `drizzle-orm/pg-core`. Use Zod validation on the backend for simplicity.

---

## Code Examples

Verified patterns from direct codebase inspection:

### JSONB Column with Typed Array (existing pattern)
```typescript
// Source: backend/src/db/schema.ts (options column, line 58)
options: jsonb('options').$type<string[]>().notNull(),

// For candidates:
candidates: jsonb('candidates').$type<Array<{
  name: string;
  party: string;
  incumbent: boolean;
}>>().notNull().default([]),
```

### Nullable Column (existing pattern)
```typescript
// Source: backend/src/db/schema.ts (learningContent, line 70-74)
learningContent: jsonb('learning_content').$type<{...}>(), // no .notNull() = nullable

// For election_race_id:
electionRaceId: integer('election_race_id')
  .references(() => electionRaces.id, { onDelete: 'set null' }),
```

### Admin Route Handler Pattern (existing)
```typescript
// Source: backend/src/routes/admin.ts (router.get pattern)
router.get('/election-races', async (req: Request, res: Response) => {
  try {
    const races = await db.select().from(electionRaces).orderBy(desc(electionRaces.createdAt));
    res.json({ races });
  } catch (error) {
    console.error('Failed to fetch election races:', error);
    res.status(500).json({ error: 'Failed to fetch election races' });
  }
});
```

### Raw SQL Aggregation Pattern (existing, for audit script)
```typescript
// Source: backend/src/scripts/audit-questions.ts (fetchQuestions)
const result = await db.execute(sql`
  SELECT
    q.id, q.external_id as "externalId", q.text, q.options,
    q.correct_answer as "correctAnswer", q.explanation, q.difficulty, q.source,
    array_agg(c.name ORDER BY c.name) as "collectionNames"
  FROM civic_trivia.questions q
  JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
  JOIN civic_trivia.collections c ON cq.collection_id = c.id
  WHERE q.status = 'active'
  GROUP BY q.id, q.external_id, q.text, q.options, q.correct_answer, q.explanation, q.difficulty, q.source
  ORDER BY q.id
`);
return result.rows as unknown as QuestionRow[];
```

### Quality Score with New Rule (scoring.ts update)
```typescript
// Source: backend/src/services/qualityRules/scoring.ts
export const SCORE_WEIGHTS: Record<string, number> = {
  // Blocking violations (worst offenses)
  'ambiguous-answers': 40,
  'vague-qualifiers': 30,
  'pure-lookup': 25,
  'broken-learn-more': 40,
  // Advisory violations (flagged but not blocking)
  'partisan-framing': 15,
  'learn-more-timeout': 5,
  'weak-explanation': 10,
  'short-question': 5,
  'long-question': 5,
  'missing-citation': 8,
  'missing-options': 10,
  'address-phone': 10,  // ADD — modest advisory penalty
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Phase |
|--------------|------------------|----------------------|
| Manual SQL migrations | `drizzle-kit push` (confirmed) | Run `npm run db:migrate` only |
| Junction table for question-to-entity relationships | Direct FK (already decided) | `election_race_id` column on `questions` |
| File-based question data | DB-first with Drizzle schema | New table defined in schema.ts, types exported |

---

## Key Implementation Details

### election_races Table — Field Decisions

Based on requirements (ELEC-02):
- `seat` — `text().notNull()` (e.g., "Mayor of Bloomington")
- `election_type` — `text().notNull()` — values: `'primary' | 'general' | 'runoff' | 'by-election'`
- `election_date` — `timestamp('election_date', { withTimezone: true }).notNull()`
- `timezone` — `text().notNull()` (e.g., `'America/Indiana/Indianapolis'`, IANA format)
- `jurisdiction` — `text().notNull()` (e.g., `'Bloomington, IN'`)
- `candidates` — `jsonb().$type<Array<{name: string; party: string; incumbent: boolean}>>().notNull().default([])`
- `questions_generated` — `boolean().notNull().default(false)`
- `followup_generated` — `boolean().notNull().default(false)`
- `result` — `text()` — nullable, filled post-election
- `created_at` — `timestamp({ withTimezone: true }).defaultNow().notNull()`

No index needed on `election_races` for v1.7 — table will have very few rows.

### questions.election_race_id FK

```typescript
// Added inside existing questions table definition
electionRaceId: integer('election_race_id')
  .references(() => electionRaces.id, { onDelete: 'set null' }),
```

`ON DELETE SET NULL` means if an election race is deleted, the questions lose their race link but remain active. This is the safe default.

### checkAddressPhone — Scope and Regex

**Scan scope:** Only `question.options` (the 4 answer choices). NOT `question.text`, NOT `question.explanation`.

**Why:** Civic questions legitimately contain addresses and phone numbers in the question body (e.g., "The White House is located at 1600 Pennsylvania Avenue..."). The problem is answer *choices* that contain addresses/phones, which would suggest the question is asking players to memorize contact info rather than test civic knowledge.

**Regex patterns to implement:**

US phone: `/(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/`
UK phone: `/(\+44[\s.-]?)?\(?0\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/`
Street address: `/\d{1,5}\s+[A-Za-z\s]{2,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\.?\b/i`

### audit-address-phone.ts — Report Format

Requirements say: "grouped report of flagged questions" with "no auto-archival". Output format:

```
=== ADDRESS/PHONE AUDIT REPORT ===
Total active questions scanned: 519
Questions flagged: X

--- Flagged by Collection ---

[Collection Name] (Y flagged)
  - q001: "Which office can you contact at 555-1234?" | option: "City Hall (555-1234)"
  - q002: ...
```

No markdown file write needed (unlike `audit-questions.ts`). Console output only is sufficient, but a markdown file write following the existing pattern is also acceptable.

### Admin UI — ElectionsPage Form Fields

Per ELEC-01, the create form needs:
- Seat name (text input)
- Election type (select: primary/general/runoff/by-election)
- Election date (date input)
- Jurisdiction (text input)
- Timezone (text input or select — IANA timezone IDs)
- Candidate list (dynamic: add/remove candidates, each with name, party, incumbent checkbox)

The candidate list is the most complex part. Use an array in `useState` with add/remove handlers. No drag-and-drop needed (unlike `SortableOption.tsx` used in question editing).

---

## Open Questions

1. **Where to place `electionRaces` in schema.ts relative to `questions`?**
   - What we know: `questions` references `electionRaces.id` via FK. Arrow function in `references()` defers evaluation.
   - What's unclear: Does Drizzle require the referenced table to be defined first in the file for `drizzle-kit push` to work correctly?
   - Recommendation: Define `electionRaces` before `questions` in `schema.ts` to be safe. This follows the `topics` → `questions` pattern (topics are defined first, questions reference topics).

2. **Should the audit script write a markdown report file or console-only?**
   - What we know: QUAL-03 says "outputs a report" — could be console or file. `audit-questions.ts` writes a markdown file.
   - What's unclear: Not specified in requirements.
   - Recommendation: Match existing pattern and write a markdown file (`audit-address-phone-report.md`) for archivability, but make it console-first since "no auto-archival" is the emphasis.

3. **Does `drizzle-kit push` handle adding a nullable FK column to an existing table safely?**
   - What we know: `drizzle-kit push` is used for all schema changes. Adding a nullable column to an existing table is a safe DDL operation in PostgreSQL (no table rewrite needed).
   - What's unclear: Whether Drizzle detects the change correctly when `questions` already has many rows.
   - Recommendation: This is a standard `ALTER TABLE ADD COLUMN ... REFERENCES ...` which PostgreSQL handles safely with existing rows defaulting to NULL. Confirm with a direct DB query after push.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `backend/src/db/schema.ts` — table definition patterns, JSONB typing, nullable columns, FK references
- `backend/src/services/qualityRules/index.ts` — rule registration pattern, ALL_SYNC_RULES
- `backend/src/services/qualityRules/scoring.ts` — SCORE_WEIGHTS structure
- `backend/src/services/qualityRules/rules/structural.ts` — rule file structure
- `backend/src/services/qualityRules/rules/partisan.ts` — advisory rule pattern
- `backend/src/scripts/audit-questions.ts` — audit script pattern (fetch, scan, report)
- `backend/src/routes/admin.ts` — admin route pattern, auth middleware
- `backend/src/db/migrations/0001_create_collections_topics_questions.sql` — migration format
- `backend/package.json` — confirmed `db:migrate = drizzle-kit push`, NOT generate+migrate
- `backend/drizzle.config.ts` — schemaFilter: `['civic_trivia']`
- `frontend/src/pages/admin/AdminLayout.tsx` — nav link pattern
- `frontend/src/pages/admin/AdminDashboard.tsx` — admin page pattern, fetch with Bearer token
- `frontend/src/App.tsx` — admin route registration pattern
- `frontend/package.json` — confirmed no react-hook-form, no zod on frontend

### Secondary (MEDIUM confidence)
- N/A — all findings from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and node_modules
- Architecture: HIGH — confirmed from direct inspection of schema.ts, qualityRules/, admin.ts, admin pages
- Pitfalls: HIGH — identified from direct inspection of existing code patterns and project conventions
- Regex patterns: MEDIUM — standard patterns, but false-positive rate against real data is unknown until the audit runs

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (schema and rules engine are stable; no fast-moving dependencies)
