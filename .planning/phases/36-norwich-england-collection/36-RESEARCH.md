# Phase 36: Norwich, England Collection - Research

**Researched:** 2026-02-25
**Domain:** UK civic content generation, first international collection, collection setup + generation pipeline
**Confidence:** HIGH

---

## Summary

Phase 36 adds the platform's first non-US collection: Norwich, England. The work spans three distinct areas: (1) collection metadata and locale config setup, (2) question generation with UK-specific prompt engineering, and (3) production seeding and activation. All three areas have clear precedents in the existing codebase.

The collection setup pattern is identical to prior phases — add a row to `collections.ts`, create a locale config in `locale-configs/`, and create a source JSON file in `src/data/`. The generation pipeline (`generateQuestions.ts`) already supports any collection slug with the correct `COLLECTION_NAMES`, `COLLECTION_PREFIXES`, and `JSON_FILE_MAP` entries. The seeding mechanism (`seed-community.ts`) already handles any collection in its `LOCALES` array. The critical new work is entirely in **prompt engineering**: the generation prompt hard-codes `"Generate a single U.S. civics trivia question"` and must be parameterized to emit UK civic vocabulary for Norwich.

The primary technical risk is two-tier attribution accuracy — confusing Norwich City Council (lower tier: housing, planning, leisure) with Norfolk County Council (upper tier: schools, roads, social care). This is a content accuracy problem, not an infrastructure problem. The prompt and a post-generation validation annotation check are the mitigations.

A significant contextual factor: Norfolk is undergoing Local Government Reorganisation (LGR) as of 2025-2026. The two-tier system (City + County) may be replaced by unitary authorities by 2028. Questions should describe the **current** two-tier structure while acknowledging this is a dynamic situation; avoid time-sensitive "current council leader" questions that will expire quickly.

**Primary recommendation:** Extend `generateQuestions.ts` with a locale-aware prompt builder that replaces "U.S. civics trivia question" with UK-appropriate framing when the collection is Norwich; all other pipeline infrastructure (gap analysis, dedup, merge, seed, activate) works unchanged after adding Norwich to the four lookup tables.

---

## Standard Stack

Phase 36 uses no new libraries. It extends the existing generation pipeline.

### Core Infrastructure (Already Exists)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `generateQuestions.ts` | `backend/src/scripts/generateQuestions.ts` | Main generation pipeline — gap analysis, Claude API, quality audit, dedup | Active |
| `merge-generated-questions.ts` | `backend/src/scripts/merge-generated-questions.ts` | Merges generated output JSON into canonical source JSON | Active |
| `seed-community.ts` | `backend/src/db/seed/seed-community.ts` | Seeds questions as `status='active'` from source JSON | Active |
| `collections.ts` seed | `backend/src/db/seed/collections.ts` | Collection metadata for `db:seed` | Active |
| Locale configs | `backend/src/scripts/content-generation/locale-configs/` | Topic definitions consumed by `generate-locale-questions.ts` (legacy path); also supplies topic structure to `generateQuestions.ts` indirectly via source JSON | Active |
| Quality rules engine | `backend/src/services/qualityRules/index.ts` | `auditQuestion()` — 4 blocking rules, advisory rules | Active |

### New Files Required
| File | Purpose |
|------|---------|
| `backend/src/scripts/content-generation/locale-configs/norwich-uk.ts` | Locale config: topic categories, distribution, source URLs |
| `backend/src/data/norwich-uk-questions.json` | Canonical source JSON (starts empty with topics, populated by generation) |

### No New Libraries
All dependencies (`@anthropic-ai/sdk`, `drizzle-orm`, `openai`, `tsx`, `zod`) are already installed.

---

## Architecture Patterns

### Pattern 1: Adding a New Collection (Established Pattern)

Every new collection requires four lookup table entries in `generateQuestions.ts` plus two new files:

```typescript
// backend/src/scripts/generateQuestions.ts — add to all four maps

const COLLECTION_NAMES: Record<string, string> = {
  // ... existing entries ...
  'norwich-uk': 'Norwich, England',
};

const COLLECTION_PREFIXES: Record<string, string> = {
  // ... existing entries ...
  'norwich-uk': 'nor',   // Decision: externalIdPrefix = 'nor'
};

const JSON_FILE_MAP: Record<string, string> = {
  // ... existing entries ...
  'norwich-uk': 'norwich-uk-questions.json',
};

// Also add to merge-generated-questions.ts JSON_FILE_MAP:
const JSON_FILE_MAP: Record<string, string> = {
  // ... existing entries ...
  'norwich-uk': 'norwich-uk-questions.json',
};
```

### Pattern 2: Collection Metadata in Seed File

```typescript
// backend/src/db/seed/collections.ts — add new entry
{
  name: 'Norwich, England',
  slug: 'norwich-uk',
  description: 'Local democracy, history & culture in the heart of Norfolk',
  localeCode: 'en-GB',       // First non-en-US collection
  localeName: 'Norwich, Norfolk, England',
  iconIdentifier: 'norwich-cathedral',  // or 'cow-tower' — see Open Questions
  themeColor: '#1B4332',     // Deep forest green (Norfolk/cathedral stone — distinct from all existing colors)
  isActive: false,           // Activate after questions reviewed
  sortOrder: 7               // After current 6 collections
}
```

**Existing theme colors to avoid:**
- `#1E3A8A` — Federal (deep blue) — also Indiana State uses same
- `#991B1B` — Bloomington (deep red)
- `#047857` — Fremont (emerald green) — close to Norwich green
- `#0369A1` — Los Angeles (ocean blue)
- `#92400E` — California State (golden brown)

**Recommendation for Norwich:** `#1B4332` (very deep forest green, distinct from Fremont's `#047857` emerald) or `#1E3A5F` (dark navy, evokes Norfolk coastline). Either passes WCAG AA for white text. Planner should confirm which is more visually distinct in the UI.

### Pattern 3: Source JSON File Structure

The canonical source JSON must be created before running `generateQuestions.ts` (it reads from this file for gap analysis):

```json
{
  "topics": [
    { "slug": "city-government", "name": "City Government", "description": "Norwich City Council — councillors, wards, leader, cabinet, and how decisions are made" },
    { "slug": "norfolk-county", "name": "Norfolk County Context", "description": "Norfolk County Council responsibilities — schools, roads, social care — and how county and city tiers interact" },
    { "slug": "civic-history", "name": "Civic History", "description": "Norwich's medieval charter (1194), city walls, historic milestones, past mayors, and civic heritage" },
    { "slug": "landmarks-institutions", "name": "Landmarks & Institutions", "description": "Norwich Cathedral, Norwich Castle, Cow Tower, the Lanes, UEA, Norfolk and Norwich Hospital, and civic institutions" },
    { "slug": "economy-culture", "name": "Economy & Culture", "description": "Norwich's economy, creative industries, Norwich City FC, arts scene, Norwich 12 medieval churches, market" },
    { "slug": "sports-community", "name": "Sports & Community", "description": "Norwich City FC (the Canaries), community sports, local clubs, and civic community life" }
  ],
  "questions": []
}
```

### Pattern 4: Locale-Aware Generation Prompt

**This is the critical new engineering work.** The current `buildGenerationPrompt()` in `generateQuestions.ts` hard-codes US civic framing:

```typescript
// Current (line 196):
let prompt = `Generate a single U.S. civics trivia question for the "${collectionName}" collection.`
```

For Norwich, this must emit UK civic framing. The cleanest approach is a locale-aware prompt function:

```typescript
// Proposed change to generateQuestions.ts
function buildGenerationPrompt(
  slot: GenerationSlot,
  topicConfig: TopicConfig,
  collectionName: string,
  collectionSlug: string,   // Already a parameter
  previousViolations?: string
): string {
  const today = new Date().toISOString().split('T')[0];

  // Locale-specific framing
  const isUK = collectionSlug === 'norwich-uk';
  const civicsFraming = isUK
    ? `Generate a single UK civic trivia question for the "${collectionName}" collection.`
    : `Generate a single U.S. civics trivia question for the "${collectionName}" collection.`;

  const voiceGuidance = isUK ? buildNorwichVoiceGuidance() : '';

  let prompt = `${civicsFraming}
...
${voiceGuidance}`;
```

```typescript
function buildNorwichVoiceGuidance(): string {
  return `
**UK Civic Voice Requirements (CRITICAL):**
- Write as if coming from a Norwich local — not an American describing England
- Use ONLY UK civic terminology throughout:
  - CORRECT: councillor, ward, by-election, MP, constituency, parish council, cabinet member
  - WRONG: city council member, district, special election, congressman, city hall
- Two-tier government clarity:
  - Norwich City Council (lower tier) is responsible for: housing, planning, leisure, waste collection, environmental health, licensing
  - Norfolk County Council (upper tier) is responsible for: schools/education, roads/highways, social care, libraries, fire service
  - NEVER attribute a county service to the City Council or vice versa
- Questions must feel native to Norfolk, not translated from US civic templates
- References to currency: pounds (£), not dollars
- Date format: day/month/year (e.g., "7 May 2026"), not month/day/year
- Postcodes (e.g., NR1, NR2) are valid local references — do not confuse with US zip codes
`;
}
```

### Pattern 5: Seeding Norwich via seed-community.ts

Add Norwich to the `LOCALES` array in `seed-community.ts`:

```typescript
const LOCALES = [
  { slug: 'bloomington-in', file: 'bloomington-in-questions.json' },
  { slug: 'los-angeles-ca', file: 'los-angeles-ca-questions.json' },
  { slug: 'fremont-ca', file: 'fremont-ca-questions.json' },
  { slug: 'indiana-state', file: 'indiana-state-questions.json' },
  { slug: 'california-state', file: 'california-state-questions.json' },
  { slug: 'norwich-uk', file: 'norwich-uk-questions.json' },  // NEW
];
```

`seed-community.ts` already handles topics upsert, collection activation (`isActive: true`), and question seeding as `status='active'`. No other changes needed to this file.

### Anti-Patterns to Avoid

- **Hard-coding "U.S." in prompt for Norwich:** The generation prompt at line 196 of `generateQuestions.ts` explicitly says "U.S. civics trivia question" — this will cause Claude to generate American-style questions with American terminology. Must be parameterized.
- **Activating collection before questions are reviewed:** Keep `isActive: false` in the seed file; `seed-community.ts` sets `isActive: true` on seed run — this is expected behavior. The plan should include a separate review step before running seed.
- **Using `generate-locale-questions.ts` instead of `generateQuestions.ts`:** The legacy batch generation script (`content-generation/generate-locale-questions.ts`) is a separate pipeline from the current Phase 33/34 pipeline (`generateQuestions.ts`). For consistency with phases 33/34, use `generateQuestions.ts`.
- **Skipping the collection row in the DB before running generation:** `generateQuestions.ts` does not seed the DB; but the collection row must exist in the DB before `seed-community.ts` can seed questions (it looks up the collection by slug). Run `npm run db:seed` first.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UK phone number detection | New regex in quality rules | Existing `UK_PHONE_REGEX` in `address-phone.ts` | Already implemented — pattern `(\+44[\s.-]?)?\(?0\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}` |
| UK postcode detection | New quality rule | No rule needed — postcodes in OPTIONS would be advisory; in question text they're expected. See Pitfall 3 | UK postcodes don't match US phone pattern; structural rule only scans options |
| Gap analysis for Norwich | Custom count script | `generateQuestions.ts --dry-run` | Built-in gap analysis shows exactly what topics/difficulties need questions |
| Topic upsert | Manual DB inserts | `seed-community.ts` topic loop | Already handles upsert + junction table linking |
| Duplicate detection across DB | Custom similarity check | `CollectionHierarchy.checkDuplicate()` + `SemanticDupDetector` | Already integrated in `generateQuestions.ts`; checks against all active questions |
| Image creation | Custom tooling | Drop a `.jpg` file to `frontend/public/images/collections/norwich-uk.jpg` | `CollectionCard.tsx` looks up `/images/collections/${collection.slug}.jpg` — just needs the file |

**Key insight:** The generation pipeline is a generic engine. It reads topics from the source JSON, generates questions one at a time with gap analysis, runs quality audit and dedup — all collection-agnostic. The only Norwich-specific work is the locale-aware prompt framing.

---

## Common Pitfalls

### Pitfall 1: US Civic Language in Generated Questions
**What goes wrong:** Claude generates questions using American terms — "city council member" instead of "councillor", "special election" instead of "by-election", "mayor" with US connotations rather than the ceremonial Norwich Lord Mayor vs. the political Leader of the Council.
**Why it happens:** `buildGenerationPrompt()` currently says "U.S. civics trivia question" and the model defaults to American framing. The collection name "Norwich, England" alone is insufficient to override this.
**How to avoid:** Explicitly replace the U.S. framing in the prompt for the `norwich-uk` slug. Include a UK terminology blocklist in the prompt guidance (do not use: mayor as political head, city hall, congressman, zip code, special election).
**Warning signs:** Generated questions mention "Mayor of Norwich" as if elected and politically powerful (the Lord Mayor is ceremonial; the Leader of the Council holds political power); questions use "city council members" instead of "councillors".

### Pitfall 2: Two-Tier Attribution Errors
**What goes wrong:** A generated question says "Norwich City Council is responsible for schools" (wrong — Norfolk County Council handles education) or "Norfolk County Council manages housing" (wrong — Norwich City Council manages housing).
**Why it happens:** The two-tier English local government system is genuinely confusing. Claude's training data likely contains many pages where the split is unclear.
**How to avoid:**
1. Embed explicit responsibility split in every generation prompt (see Pattern 4 above)
2. Post-generation validation check: scan accepted questions for known cross-tier attribution errors using keyword matching (e.g., question about "city council" + "schools" = flag for review)
3. During admin review, flag any question where the tier is ambiguous

**City Council (lower tier) responsibilities:** housing, planning/development, leisure (parks, sports centres), waste collection, environmental health, licensing, council tax collection, benefits
**County Council (upper tier) responsibilities:** schools/education, highways/roads, social care (adults + children), libraries, fire and rescue, public health, trading standards

**Warning signs:** Questions attributing schools/roads/social care to Norwich City Council; questions attributing housing/planning to Norfolk County Council.

### Pitfall 3: Quality Rule False Positives for UK Formats
**What goes wrong:** The `checkAddressPhone` rule scans answer options for phone numbers. UK phone numbers (format: `020 7946 0958` or `+44 20 7946 0958`) already have a `UK_PHONE_REGEX` pattern in `address-phone.ts`. Norwich postcodes (e.g., `NR1 3JQ`, `NR2 4TQ`) do NOT match any existing pattern (they are short alphanumeric sequences that don't resemble street addresses or phone numbers).
**Why it happens:** No new issue — the UK phone regex already exists. Postcodes will not trigger false positives.
**How to avoid:** No rule changes needed. The `checkAddressPhone` rule is advisory (not blocking), so if a legitimate civic question has a UK phone number in an answer (e.g., "What is the main number for Norwich City Council?"), it will be flagged for admin review — the correct behavior per CONTEXT.md decisions.
**Warning signs:** If generation produces questions with phone numbers as answer options (would be a quality issue regardless of UK/US), they will be caught. No action needed.

### Pitfall 4: LGR (Local Government Reorganisation) Creates Time-Sensitive Questions
**What goes wrong:** Questions describe the two-tier structure as permanent, or reference "current" councillors, when Norfolk is actively undergoing reorganisation. If unitary councils go live around April 2028, questions about "the two-tier system" become outdated.
**Why it happens:** The CONTEXT.md correctly targets current operations, but Norwich's governance structure is in active transition (LGR proposed, possible elections May 2027, go-live April 2028 if approved).
**How to avoid:**
- Prefer structural/procedural questions over questions about current leadership (avoid "Who is the current Leader of Norwich City Council?" — this expires quickly)
- For questions about the two-tier system, frame them as describing the current arrangement rather than a permanent structure
- Set `expiresAt` only for genuinely time-limited facts (confirmed current officeholders)
- Document the LGR context in the locale config file so future reviewers understand why some questions may age out quickly
**Warning signs:** Many questions about "current" council leaders without `expiresAt` set; questions asserting the two-tier structure will never change.

### Pitfall 5: Collection Image File Missing
**What goes wrong:** The Norwich collection card shows a blank image (gray box) because `CollectionCard.tsx` tries to load `/images/collections/norwich-uk.jpg` — which doesn't exist yet.
**Why it happens:** `CollectionCard.tsx` hard-codes the image path as `/images/collections/${collection.slug}.jpg`. The file must exist in `frontend/public/images/collections/`.
**How to avoid:** Add `norwich-uk.jpg` to `frontend/public/images/collections/` as part of the phase. The CONTEXT.md decision is to use Norwich Cathedral or Cow Tower as the landmark image.
**Warning signs:** Collection card shows a blank banner area or broken image icon; browser network tab shows 404 for `norwich-uk.jpg`.

### Pitfall 6: External ID Counter Collision
**What goes wrong:** `generateQuestions.ts` sets `externalIdCounter = existingQuestions.length + 1`. Since the source JSON starts at 0 questions, the first generated question gets ID `nor-001`. If the script is run in multiple partial batches, each run restarts the counter from the current JSON file count. If questions from a prior run are already in the JSON but the next run starts from the same offset, IDs can collide.
**Why it happens:** The counter is derived from JSON file count at load time, not from the DB.
**How to avoid:** After each generation run, run `merge-generated-questions.ts` before the next generation run. This way the JSON count reflects accepted questions, and the next run starts from the correct offset. Do not generate without merging between runs.
**Warning signs:** `ON CONFLICT DO NOTHING` silently skips questions during seeding; generation report shows fewer questions than expected in DB.

---

## Code Examples

### Norwich Locale Config File

```typescript
// backend/src/scripts/content-generation/locale-configs/norwich-uk.ts
import type { LocaleConfig } from './bloomington-in.js';

/**
 * Norwich, England locale configuration for civic trivia question generation.
 *
 * TWO-TIER GOVERNANCE (critical — embed in all generation prompts):
 * - Norwich City Council (lower tier): housing, planning, leisure, waste, environmental health
 * - Norfolk County Council (upper tier): education/schools, highways/roads, social care, libraries, fire
 *
 * LOCAL GOVERNMENT REORGANISATION (LGR) context:
 * - Norfolk is undergoing possible LGR; current two-tier system may transition to unitary by 2028
 * - Elections deferred from May 2025; next Norwich City Council election scheduled May 2026
 * - Generate questions about current structure; avoid questions that assume permanence
 *
 * ELECTION SCHEDULE:
 * - Norwich City Council: 39 councillors, 13 wards (3 per ward), elections 3 years out of 4
 * - Next election: 7 May 2026 (13 seats, one per ward)
 * - Political note: No overall control since November 2023 (was Labour majority 2012-2023)
 *
 * KEY TERMINOLOGY (must use; do not use US equivalents):
 * - councillor (not "council member")
 * - ward (not "district")
 * - by-election (not "special election")
 * - MP / constituency (not "congressman" / "district")
 * - Lord Mayor (ceremonial role, different from US elected mayor)
 * - Leader of the Council (political head; NOT the Lord Mayor)
 */
export const norwichConfig: LocaleConfig = {
  locale: 'norwich-uk',
  name: 'Norwich, England',
  externalIdPrefix: 'nor',
  collectionSlug: 'norwich-uk',
  targetQuestions: 90,
  batchSize: 25,
  overshootFactor: 1.2,  // Generate ~108, aim for 90 passing validation

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Norwich City Council — 39 councillors, 13 wards, leader and cabinet system, how decisions are made, and what services the city tier provides (housing, planning, leisure)',
    },
    {
      slug: 'norfolk-county',
      name: 'Norfolk County Context',
      description: 'Norfolk County Council responsibilities (schools, roads, social care) and how the two-tier system affects Norwich residents',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Norwich\'s 1194 royal charter, medieval city walls, historic milestones, civic governance through the ages, past Lord Mayors, and how Norwich became a city',
    },
    {
      slug: 'landmarks-institutions',
      name: 'Landmarks & Institutions',
      description: 'Norwich Cathedral (1096), Norwich Castle, Cow Tower, The Lanes, UEA, Norfolk and Norwich University Hospital, and civic institutions',
    },
    {
      slug: 'economy-culture',
      name: 'Economy & Culture',
      description: 'Norwich\'s economy, creative industries, the Norwich Market, arts scene, Norwich 12 medieval churches, and cultural identity',
    },
    {
      slug: 'sports-community',
      name: 'Sports & Community',
      description: 'Norwich City FC (the Canaries, Carrow Road), community sports, local clubs, and civic community life',
    },
  ],

  // Target distribution (sums to 90): heavy on city-government per CONTEXT.md 50%+ decision
  topicDistribution: {
    'city-government': 25,        // 28% — council mechanics, roles, services, procedures
    'norfolk-county': 20,         // 22% — county tier context; city/county split clarity
    'civic-history': 18,          // 20% — medieval charter to present
    'landmarks-institutions': 12, // 13% — cathedral, castle, civic institutions
    'economy-culture': 9,         // 10% — market, arts, Norwich 12, culture
    'sports-community': 6,        // 7%  — Canaries, community
  },

  sourceUrls: [
    // Norwich City Council
    'https://www.norwich.gov.uk',
    'https://www.norwich.gov.uk/your-council-explained',
    'https://www.norwich.gov.uk/your-council-explained/how-council-run-and-who-makes-decisions/councillors-and-decision-making',
    'https://www.norwich.gov.uk/your-council-explained/elections-and-voting',
    'https://www.norwich.gov.uk/housing',
    'https://www.norwich.gov.uk/planning',
    // Norfolk County Council
    'https://www.norfolk.gov.uk',
    'https://www.norfolk.gov.uk/article/39430/',  // Local councils overview
    // Norwich Castle (reopened August 2025)
    'https://norwich.castle.museum',
    // Wikipedia (reliable for civic history)
    'https://en.wikipedia.org/wiki/Norwich',
    'https://en.wikipedia.org/wiki/Norwich_City_Council',
    'https://en.wikipedia.org/wiki/Norfolk_County_Council',
    // BBC local and other civic sources
    'https://www.bbc.co.uk/news/england/norfolk',
  ],
};
```

### Norwich Source JSON File (Initial State)

```json
// backend/src/data/norwich-uk-questions.json
{
  "topics": [
    {
      "slug": "city-government",
      "name": "City Government",
      "description": "Norwich City Council — 39 councillors, 13 wards, leader and cabinet system, how decisions are made, and what services the city tier provides (housing, planning, leisure)"
    },
    {
      "slug": "norfolk-county",
      "name": "Norfolk County Context",
      "description": "Norfolk County Council responsibilities (schools, roads, social care) and how the two-tier system affects Norwich residents"
    },
    {
      "slug": "civic-history",
      "name": "Civic History",
      "description": "Norwich's 1194 royal charter, medieval city walls, historic milestones, and how Norwich became a city"
    },
    {
      "slug": "landmarks-institutions",
      "name": "Landmarks & Institutions",
      "description": "Norwich Cathedral, Norwich Castle, Cow Tower, The Lanes, UEA, and civic institutions"
    },
    {
      "slug": "economy-culture",
      "name": "Economy & Culture",
      "description": "Norwich's economy, creative industries, Norwich Market, arts scene, Norwich 12 medieval churches"
    },
    {
      "slug": "sports-community",
      "name": "Sports & Community",
      "description": "Norwich City FC, community sports, local clubs"
    }
  ],
  "questions": []
}
```

### Adding Norwich to generateQuestions.ts

```typescript
// Four lookup table changes in backend/src/scripts/generateQuestions.ts:

const COLLECTION_NAMES: Record<string, string> = {
  'federal': 'Federal Civics',
  'bloomington-in': 'Bloomington, IN',
  'los-angeles-ca': 'Los Angeles, CA',
  'indiana': 'Indiana',
  'california': 'California',
  'fremont-ca': 'Fremont, CA',
  'norwich-uk': 'Norwich, England',   // ADD
};

const COLLECTION_PREFIXES: Record<string, string> = {
  'federal': 'fed',
  'bloomington-in': 'bloom',
  'los-angeles-ca': 'la',
  'indiana': 'ind',
  'california': 'cal',
  'fremont-ca': 'fre',
  'norwich-uk': 'nor',   // ADD
};

const JSON_FILE_MAP: Record<string, string> = {
  'federal': 'questions.json',
  'bloomington-in': 'bloomington-in-questions.json',
  'los-angeles-ca': 'los-angeles-ca-questions.json',
  'indiana': 'indiana-state-questions.json',
  'california': 'california-state-questions.json',
  'fremont-ca': 'fremont-ca-questions.json',
  'norwich-uk': 'norwich-uk-questions.json',   // ADD
};

// Also in merge-generated-questions.ts JSON_FILE_MAP:
'norwich-uk': 'norwich-uk-questions.json',   // ADD
```

### Generation Command Pattern

```bash
# From backend/ directory

# Step 1: Dry run to see gap analysis
npx tsx src/scripts/generateQuestions.ts --collection norwich-uk --target 90 --dry-run

# Step 2: Generate with limit first (test)
npx tsx src/scripts/generateQuestions.ts --collection norwich-uk --target 90 --limit 5

# Step 3: Full generation
npx tsx src/scripts/generateQuestions.ts --collection norwich-uk --target 90

# Step 4: Merge output to source JSON
npx tsx src/scripts/merge-generated-questions.ts \
  --input ./generated-questions-norwich-uk-<timestamp>.json \
  --collection norwich-uk

# Step 5: Seed to DB
npm run db:seed          # Creates collection row
npm run db:seed:community  # Seeds questions as active

# Step 6: Verify
npx tsx src/scripts/verify-no-active-dups.ts
```

---

## Norwich Civic Knowledge Reference

This section documents key facts that should inform generation prompts and question content. Accuracy is HIGH (sourced from Wikipedia, official council sites, and UK Parliament records).

### Norwich City Council Structure
- **Councillors:** 39 total, 13 wards, 3 councillors per ward
- **Elections:** 3 years out of 4; one councillor per ward elected each cycle; 4-year terms
- **Next election:** 7 May 2026 (13 seats)
- **Leadership model:** Leader and Cabinet system (not directly elected mayor) — political leadership held by the Leader of the Council
- **Lord Mayor:** Ceremonial role, typically rotates annually — NOT the political head
- **Current political control:** No overall control (since November 2023; previously Labour majority from 2012)
- **Services:** Housing, planning, leisure, waste collection, environmental health, licensing

### Norfolk County Council
- **Responsibilities (upper tier):** Education/schools, highways/roads, adult social care, children's services, libraries, fire and rescue, public health, trading standards
- **LGR status:** Norfolk is undergoing Local Government Reorganisation — possible transition to unitary authorities by April 2028; elections to shadow councils possibly May 2027
- **Note:** As of February 2026, Norfolk County Council indicated intent to withdraw from LGR process — situation is active and fluid

### Norwich Parliamentary Representation
- **Constituencies:** Norwich North and Norwich South (separate since 1950; originally one constituency from 1298)
- **Original representation:** Two MPs returned to Parliament continuously from 1298 until the Reform Act 1832

### Civic History Key Dates
- **1067:** William the Conqueror founds Norwich Castle (motte and bailey)
- **1094-1096:** Herbert de Losinga begins Norwich Cathedral construction
- **1158:** Earliest surviving charter (Bloomington's equivalent founding moment)
- **1194:** Royal charter from Richard I — grants right to elect own reeve (key civic milestone; Norwich referred to as a "city")
- **1254-1344:** Medieval city walls constructed (enclosing about 320 acres)
- **August 2025:** Norwich Castle reopens after £27m "Royal Palace Reborn" redevelopment

### Two-Tier Responsibility Reference (for prompt embedding)

| Service | Responsible Body |
|---------|-----------------|
| Housing | Norwich City Council |
| Planning & development | Norwich City Council |
| Leisure (parks, sports centres) | Norwich City Council |
| Waste collection | Norwich City Council |
| Environmental health | Norwich City Council |
| Licensing (pubs, taxis) | Norwich City Council |
| Council tax administration | Norwich City Council |
| Schools / Education | Norfolk County Council |
| Highways / Roads | Norfolk County Council |
| Adult social care | Norfolk County Council |
| Children's services | Norfolk County Council |
| Libraries | Norfolk County Council |
| Fire and rescue | Norfolk County Council |
| Public health | Norfolk County Council |
| Trading standards | Norfolk County Council |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Batch generation with `generate-locale-questions.ts` | Single-question pipeline with `generateQuestions.ts` | Phase 33 | Semantic dedup, gap analysis, per-question retry with feedback |
| US-only collections | First international (UK) collection | Phase 36 | Requires locale-aware prompt parameterization |
| All collections share US prompt framing | Locale-specific prompt framing by collection slug | Phase 36 (new) | Enables non-US civic vocabulary in generation |
| Manual JSON file creation | `seed-community.ts` reads from JSON and seeds as active | Phase 34 | Idempotent, reliable seeding |

---

## Open Questions

### 1. Landmark Image Selection
- **What we know:** CONTEXT.md specifies Norwich Cathedral or Cow Tower. Both are iconic Norwich landmarks. Norwich Castle was reopened in August 2025 after a £27m restoration — it may be the most photogenic current option.
- **What's unclear:** Which image best matches the visual style of existing collection cards (which use relatively simple, high-contrast landmark photos).
- **Recommendation:** Norwich Cathedral (the Norman cathedral at the heart of the city, most internationally recognizable). A freely licensed image would need to be sourced. This is Claude's Discretion per CONTEXT.md.

### 2. Theme Color
- **What we know:** Existing colors are `#1E3A8A` (deep blue), `#991B1B` (deep red), `#047857` (emerald green), `#0369A1` (ocean blue), `#92400E` (golden brown). Norwich Cathedral is built from Caen limestone (cream/golden). Norfolk has a strong association with agricultural green.
- **What's unclear:** Whether to evoke "English countryside green" or "medieval stone" palette.
- **Recommendation:** `#1B4332` (deep forest green — dark enough for white text, distinct from Fremont's `#047857`). WCAG AA contrast ratio: deep green with white text exceeds 4.5:1. Alternative: `#78350F` (deep amber/brown, evokes limestone) if green feels too close to Fremont.

### 3. localeCode for Norwich
- **What we know:** All existing collections use `localeCode: 'en-US'`. Norwich is English-language UK content.
- **What's unclear:** Whether `localeCode` is used anywhere in runtime logic (e.g., date formatting, display). A search of the codebase shows `locale_code` stored in the DB schema but not consumed in any frontend or API logic.
- **Recommendation:** Use `localeCode: 'en-GB'` for correctness and future-proofing, even if currently unused in display logic. This correctly signals UK English for any future locale-aware features.

### 4. US Terms Blocklist in Prompt
- **What we know:** The CONTEXT.md specifies a "US terms blocklist" as Claude's Discretion. The most dangerous terms are those that sound neutral but carry US-specific meaning.
- **Recommendation:** Embed directly in the `buildNorwichVoiceGuidance()` function. Priority blocklist:
  - "mayor" without qualifier (use "Lord Mayor" for the ceremonial role, "Leader of the Council" for political head)
  - "city hall" → "the council"
  - "city council member" → "councillor"
  - "special election" → "by-election"
  - "zip code" → "postcode"
  - "congressman" / "representative" → "MP" or "Member of Parliament"
  - "senator" → (no equivalent; describe structure)
  - "governor" → (no equivalent; describe structure)
  - "primary election" → (not directly equivalent in UK; use "selection" or describe the system)

### 5. Validation Check for Tier Attribution
- **What we know:** The CONTEXT.md requires a post-generation validation check for tier attribution errors. The existing quality rules engine (`auditQuestion`) does not have a rule for this.
- **What's unclear:** Whether to add a new rule to the quality engine or handle it as a generation-time admin annotation.
- **Recommendation:** Keep it lightweight — add a simple keyword scan in the generation script (not the quality rules engine) that flags questions where city-government topic mentions county-tier keywords (schools, roads, social care). Log as a warning in the generation report; admin reviews these during the review step. Do NOT block generation — false positives are likely (e.g., "How does Norwich City Council interact with Norfolk County Council on road decisions?").

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `backend/src/scripts/generateQuestions.ts` — current generation pipeline mechanics, prompt structure, collection lookup tables
- Direct inspection of `backend/src/scripts/merge-generated-questions.ts` — merge mechanics
- Direct inspection of `backend/src/db/seed/seed-community.ts` — seeding mechanics, LOCALES array
- Direct inspection of `backend/src/db/seed/collections.ts` — existing collection metadata pattern
- Direct inspection of `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — `LocaleConfig` interface
- Direct inspection of `backend/src/scripts/content-generation/locale-configs/fremont-ca.ts` — locale config with sensitivity instructions (direct model for Norwich config)
- Direct inspection of `backend/src/scripts/content-generation/prompts/system-prompt.ts` — `buildFremontSensitivityInstructions()` pattern
- Direct inspection of `backend/src/services/qualityRules/rules/address-phone.ts` — `UK_PHONE_REGEX` already implemented
- Direct JSON file count: `norwich-uk-questions.json` does not yet exist; `bloomington-in-questions.json` has 83 questions, etc.
- Phase 21, 23, 34 RESEARCH.md documents — architecture pattern continuity
- [Norwich City Council official site](https://www.norwich.gov.uk/your-council-explained) — council structure
- [Norwich City Council - Wikipedia](https://en.wikipedia.org/wiki/Norwich_City_Council) — 39 councillors, 13 wards, election schedule, political history

### Secondary (MEDIUM confidence)
- [Norfolk County Council - Local Government Reorganisation FAQs](https://www.norfolk.gov.uk/article/71143/Local-government-reorganisation-FAQs) — LGR timeline and proposals
- [Proposals for LGR in Norfolk and Suffolk - GOV.UK](https://www.gov.uk/government/consultations/local-government-reorganisation-in-norfolk-and-suffolk/proposals-for-local-government-reorganisation-in-norfolk-and-suffolk) — government consultation details
- [2026 Norwich City Council election - Wikipedia](https://en.wikipedia.org/wiki/2026_Norwich_City_Council_election) — election date confirmed May 7, 2026
- [Norwich Castle reopening August 2025](https://historicengland.org.uk/listing/the-list/list-entry/1372724) — £27m "Royal Palace Reborn" project
- [Norwich - Wikipedia](https://en.wikipedia.org/wiki/Norwich) — civic history, charter dates, cathedral founding
- WebSearch results: Norfolk two-tier structure (County = schools/roads/social care; City = housing/planning/leisure)

### Tertiary (LOW confidence)
- [Local government in England, Scotland and Wales - UK in a Changing Europe](https://ukandeu.ac.uk/explainers/local-government-in-england-scotland-and-wales/) — general two-tier structure explanation (general context only)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure exists; direct codebase inspection confirms what needs to be added (four lookup table entries + two new files)
- Architecture: HIGH — established pattern from Fremont, Bloomington, LA; no ambiguity about what files to create or modify
- UK civic terminology: HIGH — verified against official council websites and Wikipedia
- Two-tier responsibility split: HIGH — confirmed from official Norfolk County Council FAQ and Norwich City Council about pages
- LGR situation: MEDIUM — actively in flux as of February 2026; timeline confirmed but outcomes uncertain
- Pitfalls: HIGH — derived from direct code inspection (US prompt hardcoding, image file pattern from CollectionCard.tsx, ID counter logic from generateQuestions.ts)
- Theme color/image: LOW — Claude's Discretion items; recommendations made but no authoritative source

**Research date:** 2026-02-25
**Valid until:** 2026-04-25 (60 days — generation pipeline stable; LGR situation may evolve but doesn't block this phase)
