# Phase 64: Structured Officeholders - Research

**Researched:** 2026-03-15
**Domain:** TypeScript type extension, generation prompt injection, post-generation name matching, audit tooling
**Confidence:** HIGH

## Summary

Phase 64 adds an `officeholders` array to `LocaleConfig` and makes the generation pipeline do two things automatically: (1) inject an explicit officeholder block into generation prompts so the AI names officials specifically (not generically), and (2) scan generated question text post-generation to match officeholder names and seed `expiresAt` from `termEnd`. The audit script then reports coverage per officeholder.

The codebase was read in full. This is a well-understood internal system with no external libraries required — only TypeScript interface extension, string matching logic, and additions to two existing functions (`buildSystemPrompt`/`buildStateSystemPrompt` and the post-generation step in `generate-locale-questions.ts`). The audit script extension is similarly mechanical. No new npm packages are needed.

The core design risk is name-matching fidelity. The prompt injection strategy (Option B from CONTEXT.md) is already the right call: by explicitly naming officials in the prompt, the AI reliably writes their names verbatim, making substring matching highly effective. The existing manual scripts (`set-wdc-expires-at.ts`, `generate-biloxi-officeholder-questions.ts`) prove that keyword matching against question text is the battle-tested pattern already in this codebase.

**Primary recommendation:** Extend `LocaleConfig` with an `officeholders?: OfficeholderEntry[]` optional field, inject via a shared helper called from both `buildSystemPrompt` and `buildStateSystemPrompt`, and run a name-match seeder function immediately after `seedQuestionBatch` in the main generation loop.

## Standard Stack

No new libraries. This phase uses only what is already installed.

### Core (already in project)
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| TypeScript | project version | Type-safe `OfficeholderEntry` interface | Extend `LocaleConfig` in `bloomington-in.ts` |
| Zod | project version | Already validates `ValidatedQuestion.expiresAt` | No schema changes needed |
| Drizzle ORM | project version | DB updates for `expiresAt` on matched questions | Already used in `set-wdc-expires-at.ts` pattern |

**Installation:** None required.

## Architecture Patterns

### How the Current System Works (what Phase 64 extends)

**`LocaleConfig` (source of truth for all generation):**
Defined in `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts`.
All locale configs import `type { LocaleConfig }` from this file.
The scaffold script writes `import type { LocaleConfig }` into every new locale config it creates.
Adding a field here extends all configs simultaneously.

**Prompt construction flow:**
- City locales: `buildSystemPrompt(config.name, topicDistribution, config.locale)` in `system-prompt.ts`
- State locales: `buildStateSystemPrompt(stateName, stateFeatures, topicDistribution)` in `state-system-prompt.ts`
- Locale-specific voice guidance is appended via helper functions at the bottom of `system-prompt.ts`
- The officeholder block follows this same appended-section pattern

**Generation loop in `generate-locale-questions.ts`:**
```
[Step 1] Fetch sources (optional)
[Step 2] Load source documents
[Step 3] Set up DB topics
[Step 4] Generate questions in batches → validate → seedQuestionBatch()
[Step 5] runWithinCollectionSemanticDedup()
```
The auto-seeder for `expiresAt` runs as a new sub-step inside Step 4 immediately after `seedQuestionBatch()`.

**Existing manual `expiresAt` patterns to follow:**
- `set-wdc-expires-at.ts`: fetches questions by prefix, matches keywords in `q.text.toLowerCase()`, calls `db.update(questions).set({ expiresAt: ... }).where(eq(questions.id, q.id))`
- `generate-biloxi-officeholder-questions.ts`: hardcodes officeholder names in prompt, hardcodes `EXPIRES_AT` constant, seeds with `expiresAt` pre-set

Phase 64 makes these ad-hoc patterns systematic.

### Recommended Project Structure (new/modified files)

```
backend/src/scripts/content-generation/
├── locale-configs/
│   └── bloomington-in.ts          # ADD OfficeholderEntry interface + officeholders?: field to LocaleConfig
├── prompts/
│   ├── system-prompt.ts           # ADD buildOfficeholderBlock() helper; call from buildSystemPrompt()
│   └── state-system-prompt.ts     # Call buildOfficeholderBlock() from buildStateSystemPrompt()
├── utils/
│   └── seed-questions.ts          # (unchanged — expiresAt already seeded from ValidatedQuestion)
└── generate-locale-questions.ts   # ADD seedOfficeholderExpiresAt() called after seedQuestionBatch()

backend/src/scripts/
└── audit-collection-readiness.ts  # ADD officeholder coverage reporting section
```

### Pattern 1: OfficeholderEntry Type and LocaleConfig Extension

**What:** Add `OfficeholderEntry` interface and optional `officeholders` field to `LocaleConfig`.
**When to use:** All new locale configs going forward; existing configs get it when officeholders are known.

```typescript
// In bloomington-in.ts — ADD these before LocaleConfig interface

export interface OfficeholderEntry {
  name: string;       // Full name as it should appear in questions, e.g. "Andrew \"FoFo\" Gilich, Jr."
  role: string;       // Role label, e.g. "Mayor", "City Council, Ward 3"
  termEnd: string;    // ISO 8601 date string, e.g. "2029-06-01T00:00:00Z"
  district?: string;  // Optional plain text, e.g. "Ward 3" — prompt context only
}

export interface LocaleConfig {
  locale: string;
  name: string;
  externalIdPrefix: string;
  collectionSlug: string;
  targetQuestions: number;
  batchSize: number;
  overshootFactor?: number;
  topicCategories: TopicCategory[];
  topicDistribution: Record<string, number>;
  sourceUrls: string[];
  officeholders?: OfficeholderEntry[];  // NEW — optional, absent = no injection
}
```

### Pattern 2: Prompt Injection Block

**What:** Shared helper `buildOfficeholderBlock()` returns a string block or empty string.
**When to use:** Called from both `buildSystemPrompt` and `buildStateSystemPrompt` when `officeholders` is present.

The CONTEXT.md specifies Option B — explicit instruction to name officials specifically. This is load-bearing for matching.

```typescript
// In system-prompt.ts — ADD this helper function

export function buildOfficeholderBlock(officeholders: OfficeholderEntry[]): string {
  if (officeholders.length === 0) return '';

  const lines = officeholders.map(o => {
    const districtPart = o.district ? `, ${o.district}` : '';
    return `  - ${o.role}${districtPart}: ${o.name} (term ends ${o.termEnd.split('T')[0]})`;
  }).join('\n');

  return `

## OFFICEHOLDERS

These are active, named officials. Generate questions that name them SPECIFICALLY
(use their exact name — do NOT write "the current mayor" or "the current council member").
Set expiresAt to the term end date shown for each person.

${lines}`;
}
```

Calling convention in `buildSystemPrompt`:
```typescript
// At end of return template literal, append:
${config.officeholders && config.officeholders.length > 0
  ? buildOfficeholderBlock(config.officeholders)
  : ''}
```

`buildSystemPrompt` currently receives `config.name`, `topicDistribution`, and `localeSlug`. The `officeholders` field must also be passed. The signature becomes:
```typescript
export function buildSystemPrompt(
  localeName: string,
  topicDistribution: Record<string, number>,
  localeSlug?: string,
  officeholders?: OfficeholderEntry[]
): string
```

For `buildStateSystemPrompt`, the config itself is not passed — only extracted fields. Either pass `officeholders` as a parameter or pass the full config. Passing `officeholders?: OfficeholderEntry[]` as a fourth parameter keeps it consistent.

### Pattern 3: Post-Generation expiresAt Auto-Seeder

**What:** After each `seedQuestionBatch()`, scan newly seeded questions for officeholder name matches and update `expiresAt`.
**When to use:** Any time `officeholders` is present and non-empty in config. No-op if absent.

The seeder pattern follows `set-wdc-expires-at.ts` exactly — lowercase text match, db update per matching row.

```typescript
// In generate-locale-questions.ts — ADD this function

async function seedOfficeholderExpiresAt(
  config: LocaleConfig,
  officeholders: OfficeholderEntry[]
): Promise<{ updated: number }> {
  if (officeholders.length === 0) return { updated: 0 };

  const { db } = await import('../../db/index.js');
  const { questions } = await import('../../db/schema.js');
  const { sql } = await import('drizzle-orm');

  const prefixPattern = config.externalIdPrefix + '-%';

  // Fetch all draft questions for this collection
  const rows = await db
    .select({ id: questions.id, externalId: questions.externalId, text: questions.text })
    .from(questions)
    .where(sql`${questions.externalId} LIKE ${prefixPattern} AND ${questions.status} = 'draft' AND ${questions.expiresAt} IS NULL`);

  let updated = 0;

  for (const official of officeholders) {
    const nameLower = official.name.toLowerCase();
    const termEnd = new Date(official.termEnd);

    // Find questions whose text contains the official's name (case-insensitive)
    const matches = rows.filter(q => q.text.toLowerCase().includes(nameLower));

    for (const q of matches) {
      await db
        .update(questions)
        .set({ expiresAt: termEnd })
        .where(sql`${questions.id} = ${q.id}`);

      console.log(`  [Officeholder seeder] Set expiresAt ${official.termEnd.split('T')[0]} on ${q.externalId} (matched: ${official.name})`);
      updated++;
    }
  }

  return { updated };
}
```

Calling location in main generation loop, after each batch's `seedQuestionBatch`:
```typescript
if (!args.dryRun && collectionId !== null && config.officeholders && config.officeholders.length > 0) {
  const { updated } = await seedOfficeholderExpiresAt(config, config.officeholders);
  console.log(`  Officeholder expiresAt seeded: ${updated} question(s) updated`);
}
```

### Pattern 4: Audit Coverage Reporting

**What:** `audit-collection-readiness.ts` loads the locale config, reads its `officeholders` array, and cross-references against questions with `expiresAt IS NOT NULL` and names matching each official.
**When to use:** Always runs when `officeholders` is present. Non-blocking (warn only).

The audit script currently receives only `--slug` and `--prefix`. To access the `officeholders` array, it needs to load the locale config dynamically.

```typescript
// In audit-collection-readiness.ts — ADD after expiring ratio check

// Officeholder coverage check (non-blocking, warn only)
// Load locale config dynamically if available
const localeConfig = await tryLoadLocaleConfig(slug);
if (localeConfig?.officeholders && localeConfig.officeholders.length > 0) {
  console.log('  Officeholder Coverage:');

  const allWithExpiry = await db
    .select({ text: questions.text, expiresAt: questions.expiresAt })
    .from(questions)
    .where(sql`
      ${questions.externalId} LIKE ${prefixPattern}
      AND ${questions.status} IN ('draft', 'active')
      AND ${questions.expiresAt} IS NOT NULL
    `);

  let zeroCoverageCount = 0;
  for (const official of localeConfig.officeholders) {
    const nameLower = official.name.toLowerCase();
    const covered = allWithExpiry.filter(q => q.text.toLowerCase().includes(nameLower));
    const status = covered.length === 0 ? 'WARNING: 0 questions' : `${covered.length} question(s)`;
    console.log(`    ${official.role} — ${official.name}: ${status}`);
    if (covered.length === 0) zeroCoverageCount++;
  }

  if (zeroCoverageCount > 0) {
    console.warn(`  WARNING: ${zeroCoverageCount} officeholder(s) have zero question coverage.`);
    console.warn(`  Consider re-running generation with officeholders defined in locale config.`);
    console.warn('');
  }
}
```

`tryLoadLocaleConfig` is a helper that wraps the dynamic import logic already in `generate-locale-questions.ts` but returns `null` on failure (non-blocking for audit).

### Anti-Patterns to Avoid

- **Don't add `officeholders` to `ValidatedQuestion` or `QuestionSchema`:** The schema is AI output format, not config input. The officeholder block informs the AI what to write; matching happens post-generation against the text.
- **Don't fuzzy-match:** Use exact substring (case-insensitive). The prompt instructs the AI to use names specifically — if the AI changes the name, the matching correctly fails rather than false-positives.
- **Don't run the seeder before `seedQuestionBatch`:** The seeder queries the DB for the just-seeded rows. It must run after.
- **Don't scan questions that already have `expiresAt`:** Filter with `AND expiresAt IS NULL` in the seeder to avoid overwriting manually set dates.
- **Don't make audit blocking:** Zero-coverage officeholders are warnings, consistent with the expiring-ratio check pattern already in the script.
- **Don't hardcode officeholders into `buildSystemPrompt`'s locale-specific guidance blocks:** The existing voice guidance functions (Fremont, Norwich, Portland, etc.) contain hardcoded officeholder lists. Those are now migration targets — move them to `officeholders` array in the corresponding locale config. But this is cleanup work, not Phase 64's blocking scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy name matching | Levenshtein / embedding similarity | Exact substring (case-insensitive) | Prompt forces exact names; fuzzy adds false positives without benefit |
| Config loading in audit | A new config registry | Dynamic import of locale config file | Already done in `generate-locale-questions.ts`; copy the pattern |
| Separate "officeholder generation pass" | A new generator script | Existing generate-locale-questions.ts with officeholders in config | The whole point of Phase 64 is to eliminate separate scripts |

**Key insight:** The two manual scripts (`set-wdc-expires-at.ts`, `generate-biloxi-officeholder-questions.ts`) are the pain point this phase eliminates. Phase 64 integrates their logic into the standard pipeline.

## Common Pitfalls

### Pitfall 1: Prompt Injection Without Explicit "Name Them Specifically" Instruction

**What goes wrong:** If the prompt lists officials but doesn't explicitly say "use their exact name, not their title," the AI writes "the current mayor" or "the Ward 3 representative." The name matcher finds nothing.
**Why it happens:** LLMs default to generic civic framing unless explicitly told not to.
**How to avoid:** The CONTEXT.md decision is explicit: the instruction block must say "name them specifically." The word "specifically" and the contrast ("NOT 'the current mayor'") are load-bearing. Do not weaken this instruction.
**Warning signs:** Seeder reports 0 updates after generation when officeholders are defined.

### Pitfall 2: Seeder Runs on Already-Expired Questions

**What goes wrong:** A re-generation run scans all draft questions including ones from prior runs that already have `expiresAt` set. Overwrites a date that was manually corrected.
**Why it happens:** The seeder query didn't filter out non-null `expiresAt`.
**How to avoid:** Always include `AND ${questions.expiresAt} IS NULL` in the seeder query.
**Warning signs:** Log shows updates on questions that already had an expiration date.

### Pitfall 3: Audit Crashes if Locale Config Not Found

**What goes wrong:** `audit-collection-readiness.ts` tries to dynamically import a locale config file for a state locale (auto-discovered from subdirectory) but the path logic differs from city locales.
**Why it happens:** The audit script doesn't have the same two-path logic as `generate-locale-questions.ts`.
**How to avoid:** `tryLoadLocaleConfig` must handle both city and state config paths, and must return `null` (not throw) when the config isn't found. If `officeholders` is absent or config not found, skip the section silently.
**Warning signs:** Audit crashes for state locales after Phase 64.

### Pitfall 4: TypeScript Errors from `officeholders` Field in Scaffold Template

**What goes wrong:** The scaffold script (`scaffold-collection.ts`) generates locale config files with a hardcoded template. If the template doesn't include `officeholders` (which is optional), TypeScript is fine. But if the template is wrong, all new scaffolded locales break.
**Why it happens:** The scaffold template is a string literal in `scaffold-collection.ts` that references `LocaleConfig`.
**How to avoid:** Since `officeholders` is optional (`officeholders?: OfficeholderEntry[]`), the scaffold template does not need to include it. No scaffold change required. Verify by checking that the existing template-generated configs still pass `tsc` after the interface change.
**Warning signs:** TypeScript errors on existing locale configs after the interface change.

### Pitfall 5: `buildSystemPrompt` Signature Change Breaks `regenerateFn`

**What goes wrong:** `generate-locale-questions.ts` calls `buildSystemPrompt` inside the `regenerateFn` closure too (lines ~636-640 in the regeneration block). If the signature changes, both call sites must be updated.
**Why it happens:** The function is called in two places in the same file — main batch generation AND the regeneration retry path.
**How to avoid:** Search for all calls to `buildSystemPrompt` and `buildStateSystemPrompt` before editing signatures. There are exactly two calls to each in `generate-locale-questions.ts`.
**Warning signs:** TypeScript compile errors on `regenerateFn` after signature change.

### Pitfall 6: `expiresAt` ISO String Format in `termEnd`

**What goes wrong:** `new Date(official.termEnd)` fails silently or produces an incorrect date if `termEnd` isn't a full ISO 8601 string.
**Why it happens:** Config authors might write `"2029-06-01"` (date only) instead of `"2029-06-01T00:00:00Z"`.
**How to avoid:** Validate `termEnd` in a TypeScript way — add a JSDoc comment to `OfficeholderEntry` that `termEnd` must be ISO 8601 with timezone. Optionally add a runtime check in the seeder that logs a warning if `new Date(termEnd).toString() === 'Invalid Date'`.
**Warning signs:** `expiresAt` set to `null` or `Invalid Date` in DB for matched questions.

## Code Examples

### Adding officeholders to an existing locale config

```typescript
// In backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts
// (showing the pattern — actual officeholders already listed in file comments)

export const biloxiMsConfig: LocaleConfig = {
  locale: 'biloxi-ms',
  name: 'Biloxi, MS',
  // ... existing fields ...
  officeholders: [
    { name: 'Andrew "FoFo" Gilich, Jr.', role: 'Mayor', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Wayne Gray', role: 'City Council', district: 'Ward 1', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Anthony Marshall', role: 'City Council', district: 'Ward 2', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Mike Nail', role: 'City Council', district: 'Ward 3', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Jamie Creel', role: 'City Council', district: 'Ward 4', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Paul Tisdale', role: 'City Council', district: 'Ward 5', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'Kenny Glavan', role: 'City Council', district: 'Ward 6', termEnd: '2029-06-01T00:00:00Z' },
    { name: 'David Shoemaker', role: 'City Council', district: 'Ward 7', termEnd: '2029-06-01T00:00:00Z' },
  ],
};
```

### The prompt block as it renders

Given the above Biloxi config, `buildOfficeholderBlock()` would produce:

```
## OFFICEHOLDERS

These are active, named officials. Generate questions that name them SPECIFICALLY
(use their exact name — do NOT write "the current mayor" or "the current council member").
Set expiresAt to the term end date shown for each person.

  - Mayor: Andrew "FoFo" Gilich, Jr. (term ends 2029-06-01)
  - City Council, Ward 1: Wayne Gray (term ends 2029-06-01)
  - City Council, Ward 2: Anthony Marshall (term ends 2029-06-01)
  - City Council, Ward 3: Mike Nail (term ends 2029-06-01)
  - City Council, Ward 4: Jamie Creel (term ends 2029-06-01)
  - City Council, Ward 5: Paul Tisdale (term ends 2029-06-01)
  - City Council, Ward 6: Kenny Glavan (term ends 2029-06-01)
  - City Council, Ward 7: David Shoemaker (term ends 2029-06-01)
```

### Seeder name-matching logic (from `set-wdc-expires-at.ts` pattern)

```typescript
// This pattern is battle-tested in set-wdc-expires-at.ts
const nameLower = official.name.toLowerCase();
const matches = rows.filter(q => q.text.toLowerCase().includes(nameLower));
```

### DB update for expiresAt (from `set-wdc-expires-at.ts`)

```typescript
// Source: backend/src/scripts/set-wdc-expires-at.ts (line 87)
await db.update(questions)
  .set({ expiresAt: group.expiresAt })
  .where(eq(questions.id, q.id));
```

## State of the Art

| Old Approach | Current Approach (Phase 64) | Impact |
|---|---|---|
| One-off scripts per collection (set-wdc-expires-at.ts, generate-biloxi-officeholder-questions.ts) | `officeholders` array in locale config; automatic seeding | No manual targeted pass after generation |
| Officeholder names in topic category descriptions (biloxi-ms.ts, washington-dc.ts voice guidance blocks) | Structured `OfficeholderEntry[]` array with typed fields | Machine-readable; directly drives prompt injection and matching |
| Manual comment-block in locale config file header | Structured `officeholders` array | Single source of truth; type-checked |
| Audit only reports expiring ratio | Audit also reports per-officeholder coverage | Surfaces gaps before activation |

**Deprecated/outdated after Phase 64:**
- `set-wdc-expires-at.ts`: superseded once `washington-dc.ts` config gets an `officeholders` array and is re-generated (or the seeder runs retroactively on existing questions)
- `generate-biloxi-officeholder-questions.ts`: superseded once `biloxi-ms.ts` gets `officeholders` and re-generation is run
- Hardcoded officeholder lists in `buildNorwichVoiceGuidance()`, `buildCambridgeVoiceGuidance()`, `buildPlanoVoiceGuidance()`, `buildPortlandVoiceGuidance()`, `buildWashingtonDcVoiceGuidance()` — these are migration targets for a follow-up cleanup, not blocking Phase 64

## Open Questions

1. **Which locale configs get `officeholders` populated in Phase 64?**
   - What we know: The type extension and pipeline integration are complete even if `officeholders` is empty. The audit report is only visible when the array is populated.
   - What's unclear: The phase goal says "eliminating the manual targeted pass entirely." This implies at least a few existing configs should get their `officeholders` arrays filled in as part of Phase 64 to validate the end-to-end flow. Biloxi-MS and Washington-DC are the natural candidates since the manual scripts exist for them.
   - Recommendation: Populate `officeholders` for at least Biloxi-MS and Washington-DC (the two that have manual scripts) as part of Phase 64 to validate the full pipeline. Other locales can be added later.

2. **Should the seeder also patch existing active/draft questions retroactively (not just newly generated)?**
   - What we know: The seeder query filters `status = 'draft' AND expiresAt IS NULL`. Active questions with missing `expiresAt` would not be touched.
   - What's unclear: The phase goal mentions "after generation" — this suggests the seeder runs on newly generated questions only. But Biloxi and WDC have active questions with correctly set `expiresAt` from the old scripts, so retroactive patching of active questions isn't needed for them.
   - Recommendation: Scope the seeder to `status IN ('draft', 'active') AND expiresAt IS NULL` (include active too) so it can also be used to patch existing collections when officeholders are first added. This is safer than draft-only and matches the scope of `set-wdc-expires-at.ts`.

3. **How does the audit script load the locale config when `--slug` is passed but the locale file uses a different naming convention?**
   - What we know: City locale files use `{slug}.ts`, state locale files are in `state-configs/{slug}.ts`. The audit script would need to try both paths.
   - What's unclear: Whether the audit script needs a `--locale` flag or can auto-derive the path from `--slug`.
   - Recommendation: Auto-derive: try `locale-configs/{slug}.ts` first, then `locale-configs/state-configs/{slug}.ts`. Return `null` if neither exists (non-blocking).

## Sources

### Primary (HIGH confidence)
- Direct code reading of all relevant files — no external library dependencies; all findings are from the project source

Files read:
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — LocaleConfig interface
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — full generation pipeline
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` — prompt construction
- `backend/src/scripts/content-generation/prompts/state-system-prompt.ts` — state prompt construction
- `backend/src/scripts/content-generation/utils/seed-questions.ts` — question seeding
- `backend/src/scripts/content-generation/question-schema.ts` — ValidatedQuestion / expiresAt schema
- `backend/src/scripts/audit-collection-readiness.ts` — existing audit structure
- `backend/src/scripts/set-wdc-expires-at.ts` — expiresAt patching pattern
- `backend/src/scripts/content-generation/generate-biloxi-officeholder-questions.ts` — targeted officeholder generation pattern
- `backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts` — officeholder comments pattern
- `backend/src/scripts/content-generation/locale-configs/washington-dc.ts` — officeholder comments pattern
- `backend/src/db/schema.ts` — questions table structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external libraries; all patterns found in existing code
- Architecture: HIGH — direct code reading; all integration points identified
- Pitfalls: HIGH — derived from reading the actual code paths that will be modified

**Research date:** 2026-03-15
**Valid until:** 90 days (stable internal codebase, no fast-moving dependencies)
