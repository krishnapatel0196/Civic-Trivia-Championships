---
name: create-collection
description: Autonomously create a high-quality civic trivia collection for a city — research, write questions, scaffold, seed, and activate, all without extra API spend.
argument-hint: "<City, ST>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
  - WebFetch
  - mcp__supabase-local__execute_sql
  - mcp__supabase-local__list_tables
---

# /create-collection — Autonomous City Collection Builder

You are running the **create-collection** skill. Your job is to autonomously build a high-quality civic trivia collection for a city — from research through activation — **without calling any paid generation APIs beyond Claude Code itself**.

All research uses WebSearch + WebFetch. All questions are written by you directly. Questions are inserted via the Supabase MCP tool. The paid `generate-locale-questions.ts` pipeline is **NOT used**.

---

## STEP 0 — Gather Inputs

Parse the city from `$ARGUMENTS` if provided. Infer as much as you can, then ask only for what's missing.

**Required:**
- **City and state** — e.g. "Austin, TX"
- **Slug** — lowercase, hyphenated, e.g. `austin-tx`
- **External ID prefix** — 2–5 lowercase letters, unique. Convention: `[city-letters][state/country-code]` e.g. `alxla` (Alexandria LA), `austx` (Austin TX), `alxva` (Alexandria VA). Existing prefixes in use: `bli bxl cam cas fre ica ind ins lac mas mis nur ors pla por smo tex wdc`. Pick something that doesn't conflict and follows the convention.
- **Theme color** — hex, e.g. `#1A3A6B`. If not provided, suggest a color that matches the city's official colors or local identity and propose it to the user.

Show the user a summary table and get a go/no-go before proceeding.

---

## STEP 1 — City Research

Use **WebSearch** and **WebFetch** to research the city. Your goal is enough civic facts to write 80–100 high-quality questions spanning government, history, landmarks, services, and community.

### 1a. Core Wikipedia fetch
Always start here:
```
https://en.wikipedia.org/wiki/[City,_State]
```
Extract: founding date, government structure (mayor-council? council-manager? strong-mayor?), current mayor name + term end date, city council structure (how many members, districts/wards vs at-large), notable landmarks, institutions, economy, unique civic facts.

### 1b. Targeted web searches
Run WebSearch for:
- `"[City] city government council members 2025 2026"`
- `"[City] mayor [current year]"`
- `"[City] history founding landmark"`

Fetch promising Wikipedia or .gov/.edu results.

### 1c. Officeholder research
Find current:
- Mayor (name + term end date)
- All city council members (with ward/district if applicable)
- City Attorney or City Manager if separately elected/notable
- State Assembly member for this city's district
- State Senator for this city's district

Only include an officeholder if you found their name from a credible source. Mark uncertain names as `VERIFY` in voice guidance.

### 1d. Landmark deep dives
Fetch Wikipedia articles for 2–3 of the city's most notable landmarks or civic institutions.

### 1e. Source list
As you research, build a list of Wikipedia-first source URLs that returned substantive content. These go in the locale config.

---

## STEP 2 — Design the Locale Config

### 2a. Topic categories (4–7 topics for a city)
Good defaults:
- `city-government` — always include; target 18–22%
- `founding-history` — civic origin story; target 12–18%
- `landmarks-culture` — notable places, arts, events; target 15–20%
- `local-services` — transit, utilities, schools, emergency services; target 12–15%
- `economy-development` — major employers, industries; target 10–15%
- `community-environment` — parks, environment, demographics; target 8–12%

Rename or swap topics to reflect what's genuinely distinctive about this city. If it has a major unique angle (civil rights history, military base, port heritage, etc.), create a dedicated topic for it. **Topic distribution must sum to 100.**

### 2b. Voice guidance
Write a critical accuracy block (as a comment at the top of the locale config) covering:
- What makes this city's governance DIFFERENT from what you'd assume
- Common conflation traps (nearby larger city, county vs. city government confusion)
- Officeholder term dates
- Any content caps or unique restrictions
- The "no addresses or phone numbers in answer options" rule

### 2c. Tagline
Write a distinctive one-liner. Style: rhetorical question OR punchy stakes using a local nickname or fact.

**BANNED:** `"Test your X civic knowledge!"` — that's the generic placeholder, never acceptable.

---

## STEP 3 — Scaffold and Seed

```bash
cd "C:/Project Test/backend" && npx tsx src/scripts/scaffold-collection.ts \
  --name "[City, ST]" \
  --slug [slug] \
  --prefix [prefix] \
  --theme "[#RRGGBB]" \
  --description "[tagline]"
```

Then seed:
```bash
cd "C:/Project Test/backend" && npx tsx src/db/seed/seed.ts
```

Verify seed output shows the new collection. Diagnose any errors before continuing.

---

## STEP 4 — Write the Locale Config File

The scaffold created a placeholder at:
```
C:/Project Test/backend/src/scripts/content-generation/locale-configs/[slug].ts
```

Replace its entire contents with a fully filled config. Use this structure:

```typescript
import type { LocaleConfig } from './bloomington-in.js';

/**
 * [City, ST] locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - [Key governance distinction]
 * - [Common conflation trap]
 * - [Unique elected offices if any]
 * - ALL officeholder questions MUST have expiresAt
 * - No addresses or phone numbers in answer options (quality rule)
 *
 * CURRENT OFFICEHOLDERS:
 * - Mayor: [Name] (term ends [YYYY-MM-DD])
 * - [Council members...]
 */
export const [camelCaseSlug]Config: LocaleConfig = {
  locale: '[slug]',
  name: '[City, ST]',
  externalIdPrefix: '[prefix]',
  collectionSlug: '[slug]',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    // 3–6 sentences of dense guidance per topic
    // Include specific facts, names, dates
    // Include what to AVOID for this topic
  ],

  topicDistribution: {
    // Must sum to 100
  },

  officeholders: [
    // Only if found from a credible source
    // { name: '...', role: '...', district: '...', termEnd: 'YYYY-MM-DDT00:00:00Z' }
  ],

  sourceUrls: [
    // Wikipedia-first; verify each URL returns substantive content
  ],
};
```

---

## STEP 5 — Look Up Collection ID

```sql
SELECT id, slug, "isActive" FROM collections WHERE slug = '[slug]';
```

Save this `id` — you'll use it in every question INSERT.

---

## STEP 6 — Write and Insert Questions

Write **80–100 high-quality civic trivia questions** directly from your research. No external generation API is called.

### Quality rules (enforce on every question)

1. **Question text** — Stands alone, specific, factual. No "in this city" ambiguity.
2. **4 answer options** — All real, plausible alternatives. No addresses or phone numbers.
3. **Correct answer** — 0-indexed (0=A, 1=B, 2=C, 3=D).
4. **Explanation** — Must start with `"According to [source name], ..."`. Cite the specific article or page.
5. **Difficulty mix** — ~40% easy, ~40% medium, ~20% hard.
6. **Topic distribution** — Follow the percentages from Step 2. For 90 questions: multiply each % by 0.9 for target counts per topic.
7. **External IDs** — `[prefix]-001`, `[prefix]-002`, etc. Sequential, no gaps.
8. **ExpiresAt** — Set to officeholder's termEnd for any current-officeholder question. NULL for durable questions.
9. **Source** — Every question needs `{ "name": "Wikipedia", "url": "..." }` or the actual source URL.
10. **Max 1 question per officeholder** — never two questions about the same person.

### Question type variety (aim for a mix per topic)
- **Structure questions** — how government works, term lengths, seat count — durable
- **History questions** — founding date, first X, historic events — durable
- **Current officeholder questions** — always expiring
- **Landmark questions** — what is X, when built, who designed Z — durable
- **Service/policy questions** — what board oversees X, what service the city provides — durable

### Batch insert via Supabase MCP

Insert in batches of ~20 using this SQL template:

```sql
INSERT INTO questions (
  "externalId", text, options, "correctAnswer", explanation,
  difficulty, "topicCategory", source, "expiresAt",
  status, "collectionId", "createdAt", "updatedAt"
) VALUES
(
  '[prefix]-001',
  'Question text here?',
  '["Option A", "Option B", "Option C", "Option D"]',
  0,
  'According to Wikipedia''s article on [City], ...',
  'easy',
  'city-government',
  '{"name": "Wikipedia", "url": "https://en.wikipedia.org/wiki/[City]"}',
  NULL,
  'draft',
  [collection_id],
  NOW(),
  NOW()
)
-- repeat...
;
```

After each batch, verify count:
```sql
SELECT COUNT(*) FROM questions WHERE "collectionId" = [collection_id] AND status = 'draft';
```

### Expiring question check

After all insertions:
```sql
SELECT
  COUNT(*) FILTER (WHERE "expiresAt" IS NOT NULL) AS expiring,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "expiresAt" IS NOT NULL) / COUNT(*), 1) AS pct
FROM questions
WHERE "collectionId" = [collection_id] AND status = 'draft';
```

**Target: 15–30% expiring.** If below 15%, write more officeholder questions.

---

## STEP 7 — Banner Image

Every collection needs a banner at:
```
C:/Project Test/frontend/public/images/collections/[slug].jpg
```

**City collections:** iconic local landmark. **State collections:** state capitol building (hard rule). Minimum 800px wide.

Search `"[City] [landmark] Wikimedia Commons free image"`. If you find a usable image URL, tell the user exactly what to download and where to save it. If not, give explicit instructions:

> "Please download an image of [specific landmark] from Wikimedia Commons and save it as `frontend/public/images/collections/[slug].jpg` (at least 800px wide)."

Do NOT skip — the activate script will fail without the banner.

---

## STEP 8 — Audit and Activate

### Audit
```bash
cd "C:/Project Test/backend" && npx tsx src/scripts/audit-collection-readiness.ts --slug [slug]
```
If it warns about expiring ratio or question count, address those before proceeding.

### Verify banner
```bash
ls "C:/Project Test/frontend/public/images/collections/[slug].jpg"
```

### Activate (dry run first)
```bash
cd "C:/Project Test/backend" && npx tsx src/scripts/activate-collection.ts --slug [slug] --prefix [prefix] --dry-run
```

Review output. If correct:
```bash
cd "C:/Project Test/backend" && npx tsx src/scripts/activate-collection.ts --slug [slug] --prefix [prefix]
```

---

## STEP 9 — Final Report

Print a summary:

```
✅ [City, ST] collection activated

Stats:
- Total active questions: N
- Expiring questions: N (N%)
- Topic breakdown: topic: N, ...
- External ID prefix: [prefix]
- Slug: [slug]
- Theme: [color]
- Banner: ✅ / ⚠️ pending

Officeholders covered: [list]
Sources used: [list]

Curation notes:
- [Topics that need review]
- [Officeholders marked VERIFY]
- [Any borderline questions to revisit]
```

---

## QUALITY CHECKLIST

- [ ] Every question stands alone — no "in this city" ambiguity
- [ ] No addresses or phone numbers in any answer option
- [ ] All current-officeholder questions have expiresAt set
- [ ] Max 1 question per officeholder
- [ ] Tagline is distinctive — not the generic placeholder
- [ ] Banner image exists at the correct path
- [ ] Expiring ratio is 15–30%
- [ ] Total active questions ≥ 80

---

## KNOWN PITFALLS

1. **Government .gov pages return nav content** — Wikipedia first, always.
2. **County vs. city confusion** — Verify the mayor you found governs the city, not the parish/county.
3. **Nearby-city confusion** — State clearly in questions. Don't let the big metro bleed in.
4. **At-large vs. district councils** — Verify before writing district-specific questions.
5. **State legislators** — Verify which Assembly/Senate district covers this city.
6. **Name spelling and nicknames** — Look up official spellings. Do not guess.
7. **Louisiana specifics** — Louisiana has parishes, not counties. The governing body above city level is a parish. Keep parish government out of city questions unless the city IS the parish seat and it matters.
