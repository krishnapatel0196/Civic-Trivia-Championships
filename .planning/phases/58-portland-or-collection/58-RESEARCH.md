# Phase 58: Portland, OR Collection - Research

**Researched:** 2026-03-09
**Domain:** City collection scaffolding, Portland civic content generation, new council structure (Jan 2025), mixed-durability question pattern, collection activation
**Confidence:** HIGH

## Summary

Phase 58 follows the established city collection pattern: scaffold, author locale config with voice guidance function, generate questions using the batch pipeline with automated semantic dedup (Phase 57), curate, add banner image, activate, and write a playbook retrospective. No new infrastructure is required. The full pipeline — `scaffold-collection.ts`, `generate-locale-questions.ts` (with integrated semantic dedup), `audit-collection-readiness.ts` (with expiring ratio warning), `activate-collection.ts`, and `verify-post-activation.ts` — is reusable as-is.

The critical differentiator for Portland vs. prior city collections is the Jan 2025 government restructuring. Portland was the last major US city with a commission form of government (adopted 1913, abolished by Measure 26-228 in November 2022). The new structure — effective January 1, 2025 — replaces the 5-member commission with a 12-member council across 4 geographic districts (3 councilors per district) using multi-winner ranked-choice voting. The mayor is no longer a council member; they now lead the executive branch and appoint a City Administrator. This structural change provides both durable trivia (how the new system works, what replaced what) and expiring questions (current mayor, current council members by district, current city auditor). The CONTEXT.md mandates 25–30% expiring questions and explicitly requires questions naming the current mayor, council members by district, and city auditor with correct `expiresAt` dates.

The staggered term schedule is essential for accurate `expiresAt` values: Districts 1 and 2 councilors serve 4-year terms (expire January 2029); Districts 3 and 4 councilors serve 2-year terms and are up for re-election in 2026 (expire January 2027); the Mayor (Keith Wilson) serves 4 years (expires January 2029); the City Auditor (Simone Rede) serves 4 years (expires January 2029).

**Primary recommendation:** Run `scaffold-collection.ts --name "Portland, OR" --slug portland-or --prefix por --theme "#1B6B3A"`, immediately revert any corruption to `generate-locale-questions.ts` (Scaffold Bug 2), add the locale config and `buildPortlandVoiceGuidance()` function, seed the DB, then generate with `--fetch-sources`.

## Standard Stack

No new libraries required. All tools are in-project.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `scaffold-collection.ts` | Automates seed entry, locale config file, generator registration | Established pattern for all city collections |
| `generate-locale-questions.ts` | Batch question generation with RAG source fetching + integrated semantic dedup (Phase 57) | Established pipeline; semantic dedup now runs automatically |
| `audit-collection-readiness.ts` | Pre-activation blocking gate (net count ≥ 50) + expiring ratio warning (Phase 57) | Built in Phase 48; ratio warning added Phase 57 |
| `activate-collection.ts` | Flips `isActive` and promotes draft questions to active | Parameterized for any slug/prefix since Phase 47 |
| `verify-post-activation.ts` | Post-activation API verification | Built in Phase 48 for exactly this use case |
| `system-prompt.ts` | AI content generation prompt builder | Add `buildPortlandVoiceGuidance()` here |

### No Installation Required
All dependencies are in-project. No `npm install` needed.

**Scaffold command:**
```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Portland, OR" \
  --slug portland-or \
  --prefix por \
  --theme "#1B6B3A"
```

## Architecture Patterns

### Recommended Project Structure Changes
```
backend/src/scripts/content-generation/
├── locale-configs/
│   └── portland-or.ts               # NEW — locale config with topics + source URLs
├── prompts/
│   └── system-prompt.ts             # MODIFY — add buildPortlandVoiceGuidance()
│
backend/src/db/seed/
└── collections.ts                   # MODIFIED by scaffold-collection.ts

frontend/public/images/collections/
└── portland-or.jpg                  # NEW — banner image (Portland City Hall recommended)
```

### Pattern 1: Scaffold + Bug 2 Workaround (mandatory)

**What:** `scaffold-collection.ts` inserts a seed entry in `collections.ts`, creates the locale config stub, and attempts to register the locale in `generate-locale-questions.ts`. Scaffold Bug 2 (confirmed present in Phases 49, 50, 51, 52) corrupts `generate-locale-questions.ts` by inserting a `step3` string into a TypeScript type annotation line.

**Always do immediately after scaffold:**
```bash
# After running scaffold-collection.ts:
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If the file is modified, revert it:
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts
```

City collections DO need a manual registration entry in `generate-locale-questions.ts` in the `supportedLocales` object (unlike state collections which use auto-discovery). After reverting the corrupted file, manually add `'portland-or'` to the `supportedLocales` map at the correct path: `'./locale-configs/portland-or.js'`.

### Pattern 2: Locale Config Structure (Portland-specific)

**Config variable name:** `portlandOrConfig` (derived by `deriveConfigVarName('portland-or')`)

The locale config uses the same LocaleConfig type as all city configs. Import pattern:
```typescript
import type { LocaleConfig } from './bloomington-in.js';
```

Key config values:
- `locale`: `'portland-or'`
- `externalIdPrefix`: `'por'` (not in use by any existing collection)
- `collectionSlug`: `'portland-or'`
- `targetQuestions`: 90 (80+ required; overshoot factor of 1.3 targets ~117 generated)
- `batchSize`: 25
- `overshootFactor`: 1.3

### Pattern 3: Voice Guidance Function in system-prompt.ts

**What:** `buildSystemPrompt()` dispatches locale-specific guidance. Current dispatch chain (line 105):
```typescript
${QUALITY_GUIDELINES}${localeSlug === 'fremont-ca' ? buildFremontSensitivityInstructions() : ''}${localeSlug === 'norwich-uk' ? buildNorwichVoiceGuidance() : ''}${localeSlug === 'cambridge-ma' ? buildCambridgeVoiceGuidance() : ''}${localeSlug === 'plano-tx' ? buildPlanoVoiceGuidance() : ''}
```

Add Portland dispatch at the end:
```typescript
${QUALITY_GUIDELINES}${localeSlug === 'fremont-ca' ? buildFremontSensitivityInstructions() : ''}${localeSlug === 'norwich-uk' ? buildNorwichVoiceGuidance() : ''}${localeSlug === 'cambridge-ma' ? buildCambridgeVoiceGuidance() : ''}${localeSlug === 'plano-tx' ? buildPlanoVoiceGuidance() : ''}${localeSlug === 'portland-or' ? buildPortlandVoiceGuidance() : ''}
```

### Pattern 4: Generation Pipeline Command Sequence
```bash
cd backend

# Step 1: Fetch sources and generate (semantic dedup runs automatically after batches)
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale portland-or \
  --fetch-sources

# Step 2: Review generated draft questions (admin UI)
# Curate: archive questions that fail dinner-party test, are neighborhood-specific,
# use "Keep Portland Weird" framing, or confuse Portland city with the metro area
# Target: ≥80 clean questions pass quality gate (per phase spec)

# Step 3: Pre-activation audit
npx tsx src/scripts/audit-collection-readiness.ts --slug portland-or --prefix por

# Step 4: Activate
npx tsx src/scripts/activate-collection.ts --slug portland-or --prefix por --dry-run
npx tsx src/scripts/activate-collection.ts --slug portland-or --prefix por

# Step 5: Post-activation verify
npx tsx src/scripts/verify-post-activation.ts --slugs portland-or \
  --api-url https://civic-trivia-backend.onrender.com
```

### Pattern 5: Playbook Retrospective

After activation, append a completed retrospective to `.planning/COLLECTION-PLAYBOOK.md` using the retrospective template. This is a CONTEXT.md requirement (PLAYBOOK-02). The template is already in COLLECTION-PLAYBOOK.md under section 6.

### Anti-Patterns to Avoid

- **Neighborhood-specific questions:** CONTEXT.md explicitly prohibits Pearl District, Alberta Arts District, and other neighborhood trivia unless there is citywide significance.
- **"Keep Portland Weird" framing:** Cultural quirkiness is explicitly excluded. Questions must reflect real civic knowledge.
- **Portland city vs. metro confusion:** Questions must be scoped to Portland city proper. Beaverton, Gresham, and other metro cities are NOT Portland. The Tri-Met regional transit agency is metro; TriMet questions are acceptable but must be framed as a regional authority.
- **Old commission government framing:** Under the pre-2025 structure, council members directly ran city bureaus. This no longer applies. Questions about the old structure are acceptable as civic history; questions implying the current structure works the old way are wrong.
- **Calling council members "commissioners":** The new term is "councilor" (not commissioner). This is a hard accuracy requirement.
- **Trail Blazers, food carts, craft beer:** CONTEXT.md explicitly excludes all sports, food, and pop-culture content. Strict civic focus.
- **Missing expiresAt on expiring questions:** District 3 and 4 councilors' terms expire January 2027 (up for re-election in 2026). District 1 and 2 councilors' terms expire January 2029. Mayor and Auditor expire January 2029. Voice guidance must specify these dates precisely so the generator sets them correctly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collection DB entry + locale config + generator registration | Manual edits to 3 files | `scaffold-collection.ts --name "Portland, OR" --slug portland-or --prefix por --theme "#1B6B3A"` | Automates all 3 edits; handles config var naming, sort order detection |
| Pre-activation readiness gate | Custom count script | `audit-collection-readiness.ts --slug portland-or --prefix por` | Built in Phase 48; counts draft + active, factors expiring questions, blocks if net < 50, warns on ratio < 15% |
| Post-activation verification | Manual API check | `verify-post-activation.ts --slugs portland-or --api-url ...` | Checks collection present in API with questionCount ≥ 50 |
| Collection activation | Manual DB UPDATE | `activate-collection.ts --slug portland-or --prefix por` | Handles collection isActive flip + all matching draft questions in one operation |
| Near-duplicate detection | Manual scan-duplicates.ts pass | Automatic within-collection semantic dedup via `runWithinCollectionSemanticDedup()` wired into `generate-locale-questions.ts` (Phase 57) | No separate pass needed; runs automatically after batches if `OPENAI_API_KEY` is set |
| Portland City Hall banner image | Photography | Portland.gov photos (public domain), Wikimedia Commons, or Library of Congress | Public domain / freely licensed images available |

**Key insight:** The full activation pipeline from Phases 47–48, now extended by Phase 57's semantic dedup and ratio warning, handles all infrastructure needs. Phase 58 requires only content: locale config, voice guidance, question generation, and a banner image.

## Common Pitfalls

### Pitfall 1: Scaffold Bug 2 Corrupting generate-locale-questions.ts
**What goes wrong:** After `scaffold-collection.ts` runs, `generate-locale-questions.ts` has a `step3` string inserted into a TypeScript type annotation line, causing TypeScript compilation errors.
**Why it happens:** Known scaffold script bug, present since Phase 49; not fixed.
**How to avoid:** Immediately run `git diff backend/src/scripts/content-generation/generate-locale-questions.ts` after scaffold. If modified, revert with `git checkout`. Then manually add the `portland-or` entry to the `supportedLocales` object at the correct city locale-configs path.
**Warning signs:** TypeScript compilation errors in `generate-locale-questions.ts` after scaffold runs.

### Pitfall 2: Expiring Question expiresAt Confusion (Staggered Terms)
**What goes wrong:** All councilor questions get the same expiresAt, ignoring that Districts 3 and 4 have 2-year terms (expire Jan 2027) while Districts 1 and 2 have 4-year terms (expire Jan 2029).
**Why it happens:** Staggered terms are counterintuitive; the generator will default to a single expiry unless the voice guidance is explicit.
**How to avoid:** The voice guidance must spell out each district's term-end date explicitly:
- Districts 1 and 2 councilors: `"expiresAt": "2029-01-01T00:00:00Z"`
- Districts 3 and 4 councilors: `"expiresAt": "2027-01-01T00:00:00Z"` (up for election November 2026)
- Mayor (Keith Wilson): `"expiresAt": "2029-01-01T00:00:00Z"`
- City Auditor (Simone Rede): `"expiresAt": "2029-01-01T00:00:00Z"`
**Warning signs:** All councilor questions have the same expiresAt date.

### Pitfall 3: Old Commissioner Terminology
**What goes wrong:** Questions refer to Portland city council members as "commissioners" — this was correct before 2025, is now wrong.
**Why it happens:** Portland's pre-2025 commission government used "commissioner" terminology; the generator's training data is heavy with the old terminology.
**How to avoid:** The voice guidance must explicitly state the terminology change: "Portland council members are now called 'councilors' — NOT 'commissioners'. The commission form of government ended January 1, 2025."
**Warning signs:** Any question or answer option using "commissioner" for a current city council seat.

### Pitfall 4: Portland City vs. Metro Area Confusion
**What goes wrong:** Questions treat the greater Portland metro area (Beaverton, Gresham, Lake Oswego, Hillsboro, etc.) as if it were Portland city proper.
**Why it happens:** The generator may conflate the metro area with the city; many Oregon civic facts involve metro-level bodies (Metro Council, TriMet).
**How to avoid:** Voice guidance must explicitly state that questions must be scoped to Portland city proper, not the greater Portland metro. Metro regional government (Metro Council) is acceptable only if explicitly labeled as a metro-level body. Beaverton, Gresham, Hillsboro, Lake Oswego, etc. are NOT Portland.
**Warning signs:** Questions about Beaverton city government or framing metro facts as Portland city facts.

### Pitfall 5: Failing to Meet 80+ Question Target
**What goes wrong:** After curation, the collection has fewer than 80 questions passing quality standards, missing the Phase 58 success criterion.
**Why it happens:** Portland has many potential neighborhood/culture topics that the CONTEXT.md explicitly excludes; this narrows the valid topic space. Over-curation of borderline questions can push the count too low.
**How to avoid:** Set `targetQuestions: 90` with `overshootFactor: 1.3` (generates ~117). The voice guidance must be rich enough to produce high-quality civic content across all topic areas. If the count after curation is below 80, run a supplemental generation batch targeting weak topic areas.
**Warning signs:** Audit script reports net count between 50 and 80.

### Pitfall 6: Civic Content vs. Cultural Quirkiness Bleed-Through
**What goes wrong:** Generated questions include "Keep Portland Weird" references, food cart culture, craft beer scene, or Trail Blazers trivia.
**Why it happens:** Portland's cultural identity is strongly associated with these elements; the generator draws on them naturally.
**How to avoid:** Voice guidance must explicitly list what to exclude and provide positive examples of what Portland civic content looks like. Apply the dinner-party-civic-fact test: "Is this a fact a civically engaged Portland resident would be proud to know about their city government?"
**Warning signs:** Questions mentioning food carts, craft breweries, Powell's as "quirky," Trail Blazers, "Keep Portland Weird" framing.

### Pitfall 7: Missing Playbook Retrospective
**What goes wrong:** Phase completes without appending the retrospective to COLLECTION-PLAYBOOK.md.
**Why it happens:** The retrospective is easy to skip once activation is done.
**How to avoid:** Include the retrospective as the final explicit task in the plan. The template is in `.planning/COLLECTION-PLAYBOOK.md` section 6. This is required by PLAYBOOK-02 in the phase spec and stated as a success criterion.
**Warning signs:** Phase 58 VERIFICATION completes without a retrospective section in COLLECTION-PLAYBOOK.md.

## Code Examples

### Scaffold + Revert Sequence
```bash
# Source: established pattern from Phases 49, 50, 51, 52
cd backend

# Step 1: Scaffold
npx tsx src/scripts/scaffold-collection.ts \
  --name "Portland, OR" \
  --slug portland-or \
  --prefix por \
  --theme "#1B6B3A"

# Step 2: Check and revert Scaffold Bug 2
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If modified:
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts

# Step 3: Manually add to supportedLocales in generate-locale-questions.ts
# Find the supportedLocales object and add:
# 'portland-or': './locale-configs/portland-or.js',
```

### Portland Locale Config Skeleton
```typescript
// Source: pattern from backend/src/scripts/content-generation/locale-configs/plano-tx.ts
import type { LocaleConfig } from './bloomington-in.js';

export const portlandOrConfig: LocaleConfig = {
  locale: 'portland-or',
  name: 'Portland, OR',
  externalIdPrefix: 'por',
  collectionSlug: 'portland-or',
  targetQuestions: 90,
  batchSize: 25,
  overshootFactor: 1.3,

  topicCategories: [
    // ~40% city government — balanced between new 2025 council structure and historical Portland government facts
    {
      slug: 'city-government-structure',
      name: 'City Government Structure',
      description: 'New 2025 mayor-council government: 12-member council across 4 geographic districts, 3 councilors per district, multi-winner ranked-choice voting. Mayor leads executive branch, appoints City Administrator. History of Portland\'s commission government (adopted 1913, last major US city to use it, abolished 2022 by Measure 26-228). City Auditor role.',
    },
    {
      slug: 'city-officials',
      name: 'City Officials',
      description: 'Current Portland mayor Keith Wilson (took office Jan 2025, 4-year term). 12 city councilors across 4 districts (Districts 1 & 2: 4-year terms to 2029; Districts 3 & 4: 2-year terms to 2027). City Auditor Simone Rede (term to 2029). City Administrator role (appointed by mayor). Former mayor and commissioner structure as civic history.',
    },
    // ~60% civic knowledge (history, landmarks, parks, cultural institutions)
    {
      slug: 'portland-history',
      name: 'Portland History & Founding',
      description: 'Portland founding (1843 land claim by Lovejoy & Pettygrove), the coin toss naming Portland (1845 Portland Penny — an 1835 copper penny now at the Oregon Historical Society), incorporation (February 8, 1851), Stumptown nickname origin (tree stumps from rapid clearing), Oregon Trail connection, Oregon statehood (1859). Historical civic growth along the Willamette River.',
    },
    {
      slug: 'parks-natural-landmarks',
      name: 'Parks & Natural Landmarks',
      description: 'Forest Park (5,100+ acres, one of the largest urban forests in the US, formally dedicated 1948, Olmsted Brothers plan 1903), Willamette River (divides city east/west), Washington Park, Mount Tabor (extinct volcano within city limits), Columbia River confluence. 12 bridges across the Willamette River (Bridge City nickname): Hawthorne Bridge (oldest vertical-lift bridge still in operation in America, opened 1910), Steel Bridge, Burnside Bridge.',
    },
    {
      slug: 'cultural-institutions',
      name: 'Cultural Institutions',
      description: 'OMSI — Oregon Museum of Science and Industry (founded 1944, current east bank Willamette location opened 1992, 5 exhibit halls, planetarium, WWII submarine on site). Portland Art Museum (founded 1892, opened 1895). Oregon Zoo in Washington Park (founded 1888, oldest zoo west of the Mississippi, origins from Richard Knight\'s pharmacy collection). Powell\'s Books (civic landmark — largest independent bookstore in the world, citywide significance). Portland Rose Festival (first held 1907). International Rose Test Garden in Washington Park (established 1917, oldest continuously operating public rose test garden in the US).',
    },
    {
      slug: 'rose-city-identity',
      name: 'Rose City & Civic Identity',
      description: 'Rose City and City of Roses nicknames — first reference 1888, Portland Rose Festival since 1907, International Rose Test Garden since 1917 with 7,000+ rose plants of 550 varieties. Portland\'s civic identity markers: incorporated as a city February 8, 1851; named in a coin toss (1845 Portland Penny at Oregon Historical Society). Stumptown origin. Bridge City nickname (12 bridges across the Willamette).',
    },
  ],

  topicDistribution: {
    'city-government-structure': 20,
    'city-officials': 16,
    'portland-history': 15,
    'parks-natural-landmarks': 15,
    'cultural-institutions': 14,
    'rose-city-identity': 10,
  },

  sourceUrls: [
    'https://www.portland.gov/',
    'https://www.portland.gov/council',
    'https://www.portland.gov/council/districts',
    'https://www.portland.gov/mayor/keith-wilson',
    'https://www.portland.gov/auditor',
    'https://www.portland.gov/transition/overview',
    'https://www.portland.gov/parks/forest-park',
    'https://www.portland.gov/parks/washington-park-international-rose-test-garden',
    'https://www.oregonencyclopedia.org/articles/portland_commission_government/',
    'https://www.oregonencyclopedia.org/articles/portland_penny/',
    'https://forestparkconservancy.org/forest-park/facts/',
    'https://omsi.edu/',
    'https://portlandartmuseum.org/mission-and-history/',
    'https://en.wikipedia.org/wiki/Oregon_Zoo',
    'https://en.wikipedia.org/wiki/List_of_bridges_in_Portland,_Oregon',
    'https://en.wikipedia.org/wiki/Hawthorne_Bridge',
    'https://en.wikipedia.org/wiki/Forest_Park_(Portland,_Oregon)',
    'https://en.wikipedia.org/wiki/International_Rose_Test_Garden',
    'https://opb.org',
    'https://en.wikipedia.org/wiki/Portland,_Oregon',
    'https://en.wikipedia.org/wiki/History_of_Portland,_Oregon',
    'https://en.wikipedia.org/wiki/Government_of_Portland,_Oregon',
  ],
};
```

### Portland Voice Guidance Function Skeleton (for system-prompt.ts)
```typescript
// Source: follows pattern of buildPlanoVoiceGuidance() and buildCambridgeVoiceGuidance()
function buildPortlandVoiceGuidance(): string {
  return `

## Portland, OR — Specific Content Guidelines

### Government Structure (CRITICAL accuracy requirement)

Portland uses a MAYOR-COUNCIL form of government effective January 1, 2025 — replacing a commission
form of government that Portland had used since 1913. Portland was the last major US city with a
commission form of government. Ballot Measure 26-228, approved by over 58% of Portland voters in
November 2022, abolished it.

THE NEW STRUCTURE (as of January 1, 2025):
- **City Council** = 12 members across 4 geographic districts (Districts 1, 2, 3, 4)
  - 3 councilors per district, elected by multi-winner ranked-choice voting
  - Council members are called COUNCILORS — NOT commissioners (that was the old title)
  - Council focuses on setting policy; does NOT directly oversee city bureaus
- **Mayor (Keith Wilson)** = Leads the EXECUTIVE BRANCH. Does NOT sit on the City Council.
  - Mayor appoints the City Administrator, city attorney, and police chief (with Council approval)
  - Mayor's term: 4 years, began January 2025, expires January 2029
  - expiresAt for Mayor Wilson questions: "2029-01-01T00:00:00Z"
- **City Administrator** = Oversees day-to-day operations of all city departments; reports to Mayor.
  An appointed professional role (not elected). This is a NEW position created by the 2022 charter reform.
- **City Auditor (Simone Rede)** = Independently elected, 4-year term began January 2025, expires January 2029.
  expiresAt for Auditor Rede questions: "2029-01-01T00:00:00Z"

THE OLD STRUCTURE (civic history — acceptable for durable questions):
- Under the commission form (1913–2024): 5-member City Council where each commissioner directly
  oversaw city bureaus (water, parks, police, etc.). The mayor was one of the 5 commissioners.
- Portland adopted commission government in May 1913 by a margin of only 292 votes (out of 34,342 cast).

CORRECT: "Under Portland's new 2025 charter, how many members serve on the City Council?" → 12
WRONG: Any question implying current councilors oversee city bureaus (that was the old structure)
WRONG: Referring to current council members as "commissioners"

### Staggered Term Schedule — CRITICAL for expiresAt accuracy

Portland's 12 council seats have staggered terms to create future election cycles:
- Districts 1 and 2: Councilors elected in November 2024 serve FOUR-YEAR terms → expiresAt: "2029-01-01T00:00:00Z"
  - District 1: Candace Avalos, Jamie Dunphy, Loretta Smith
  - District 2: Sameer Kanal, Elana Pirtle-Guiney, Dan Ryan
- Districts 3 and 4: Councilors elected in November 2024 serve TWO-YEAR terms (to stagger future elections) → expiresAt: "2027-01-01T00:00:00Z"
  - District 3: Tiffany Koyama Lane, Angelita Morillo, Steve Novick
  - District 4: Olivia Clark, Mitch Green, Eric Zimmerman
- Mayor Keith Wilson: 4-year term → expiresAt: "2029-01-01T00:00:00Z"
- Auditor Simone Rede: 4-year term → expiresAt: "2029-01-01T00:00:00Z"

When generating questions about current officeholders, set expiresAt to the correct date per district.
For structural questions (how the system works, number of districts, etc.): expiresAt null.

### Portland City vs. Metro Area (CRITICAL scope rule)

This collection is about the CITY OF PORTLAND — not the greater Portland metro area.
- Beaverton, Gresham, Hillsboro, Lake Oswego, Tigard, Tualatin are NOT Portland.
- Do NOT write questions treating these cities as Portland.
- TriMet (regional transit) is a metro-level agency — acceptable as context but frame as regional.
- The Metro regional government (Metro Council) is a separate governmental body — not Portland city government.
- CORRECT: "Portland is Oregon's most populous city." (Portland city proper)
- WRONG: "The Portland metro area is home to X million people." (this is the metro, not the city)

### Excluded Topics (strict civic focus — per phase requirements)

DO NOT generate questions about:
- Portland Trail Blazers, Timbers, Thorns, or any professional sports teams
- Food cart culture, craft beer, coffee culture
- "Keep Portland Weird" slogan or cultural quirkiness
- Specific neighborhoods (Pearl District, Alberta Arts District) unless the connection is citywide significance
- Private individuals not holding civic office
- Powell's Books as a "weird/quirky" Portland fact — acceptable ONLY as civic cultural institution (largest independent bookstore in the world, civic significance)

### Portland Civic Facts (accuracy calibration)

**Founding and Name:**
- Land claim: 1843 by Asa Lovejoy (Boston) and William Overton; Overton sold to Francis Pettygrove (Portland, Maine) for $50 (half the 640-acre claim)
- Naming coin toss: 1845 dinner in Oregon City — Pettygrove won two-out-of-three tosses; Portland named after Portland, Maine (not Boston)
- The Portland Penny (an 1835 copper penny used for the toss) is on display at the Oregon Historical Society
- Incorporated: February 8, 1851
- "Stumptown" nickname: from the era of rapid growth (post-1847) when trees were felled so fast the stumps were left behind; locals whitewashed them so people wouldn't trip on them

**Rose City identity:**
- First reference to Portland as "City of Roses": visitors to an 1888 Episcopal Church convention
- Portland Rose Festival: first held in 1907 (continues annually)
- International Rose Test Garden in Washington Park: established 1917, dedicated 1924 — the oldest continuously operating public rose test garden in the United States; 7,000+ rose plants of 550 varieties

**Forest Park:**
- 5,100+ acres of mostly second-growth forest in the Tualatin Mountains west of downtown
- One of the largest urban forests in the United States (exact ranking varies by source)
- Formally dedicated September 23, 1948 (originally 4,200 acres; expanded over time)
- Olmsted Brothers landscape firm commissioned in 1903 to develop a parks plan for Portland
- More than 80 miles of recreational trails

**Bridges:**
- Portland has 12 bridges spanning the Willamette River → "Bridge City" nickname
- Hawthorne Bridge: opened December 19, 1910; oldest vertical-lift bridge still in operation in America
- Steel Bridge: double-decker, accommodates cars, MAX light rail, freight, pedestrians, cyclists
- Burnside Bridge: completed 1926; first Willamette River bridge designed with architect input (Italian Renaissance-style towers)

**Cultural institutions:**
- Oregon Zoo (Washington Park): founded 1888; originated from Richard Knight's pharmacy animal collection; oldest zoo west of the Mississippi River
- Portland Art Museum: founded 1892 (Portland Art Association), opened 1895 in city library; current location at SW Park and SW Jefferson opened November 18, 1932
- OMSI (Oregon Museum of Science and Industry): founded 1944 (Oregon Museum Foundation); current east bank Willamette location opened 1992; includes submarine (USS Blueback), planetarium, 5 exhibit halls

**Government reform history:**
- Commission government adopted May 1913 (by only 292 votes out of 34,342 cast)
- Portland was the last major US city with a commission form of government
- Measure 26-228 approved November 2022 by 58%+ of voters — abolished commission government
- New mayor-council structure effective January 1, 2025
- Under the old commission government, elected commissioners directly managed city bureaus (police, water, parks, etc.) — this no longer applies

**Oregon statehood connection:**
- Oregon became the 33rd state on February 14, 1859
- Portland, already incorporated in 1851, became the commercial hub of the new state

### Tone and Framing

- Civic/government first — Portland's flavor comes through in content specifics, not in question tone
- Politically-charged topics: factual only — state facts neutrally ("Portland adopted a commission form of government in 1913" not "Portland led the way on progressive government reform")
- No neighborhood-specific trivia unless citywide significance
- Apply the dinner party test: "Is this a surprising, shareable civic tidbit a Portland resident would be proud to know?"
  PASS: "Portland was the last major US city to use a commission form of government — how many years did that system last?" (1913–2025 = 112 years)
  PASS: "How did Portland get its name — and what handheld object settled the dispute?"
  PASS: "How many bridges span Portland's Willamette River?"
  FAIL: "What food trend is Portland famous for?" (cultural quirkiness, excluded)
  FAIL: "Which Trail Blazers player was drafted first overall?" (sports, excluded)

### Difficulty Calibration

EASY: foundational civic facts a civically engaged Portland resident would know or could figure out
MEDIUM: requires some civic knowledge or local awareness
HARD: nuanced details, specific historical facts, specifics of the new council structure

Never ask for addresses, phone numbers, or obscure budget figures.
`;
}
```

### Seed After Config is Written
```bash
# Source: established pattern from Phases 49, 51, 52
cd backend
npx tsx src/db/seed/seed.ts
```

## Portland Civic Facts Reference

Verified facts for question authoring. Confidence noted per item.

### Government Structure (post-January 2025)
- **Form:** Mayor-council (replaced commission form, effective January 1, 2025)
- **City Council:** 12 members, 4 geographic districts, 3 councilors per district
- **Voting method:** Multi-winner ranked-choice voting (voters rank candidates per district)
- **Mayor (Keith Wilson):** Leads executive branch, does NOT sit on council; 4-year term (Jan 2025–Jan 2029)
- **City Administrator:** Appointed by Mayor; oversees day-to-day operations of all city departments. New role created by 2022 charter reform.
- **City Auditor (Simone Rede):** Independently elected; re-elected November 2024; term Jan 2025–Jan 2029
- **Councilors are NOT called commissioners** (old term, pre-2025)

### Council Members by District and Term Expiry
- **District 1 (4-year term, expires Jan 2029):** Candace Avalos, Jamie Dunphy, Loretta Smith
- **District 2 (4-year term, expires Jan 2029):** Sameer Kanal, Elana Pirtle-Guiney, Dan Ryan
- **District 3 (2-year term, expires Jan 2027 — up for election Nov 2026):** Tiffany Koyama Lane, Angelita Morillo, Steve Novick
- **District 4 (2-year term, expires Jan 2027 — up for election Nov 2026):** Olivia Clark, Mitch Green, Eric Zimmerman

Source: Multiple web sources (KGW, OPB, Wikipedia) — MEDIUM confidence on individual names; HIGH confidence on term staggering structure from official Portland.gov and KGW reporting.

### Government Reform History
- Commission government adopted: May 1913, by 292-vote margin (out of 34,342 cast)
- Portland was the last major US city with a commission form of government
- Commission form: "Galveston Plan" — elected commissioners each ran city bureaus directly
- Measure 26-228 approved: November 8, 2022, by 58%+ of voters
- New structure effective: January 1, 2025
- Source: oregonencyclopedia.org, Ballotpedia — MEDIUM confidence (multiple sources agree)

### Founding and Name
- Land claim: 1843 by Asa Lovejoy and William Overton; sold to Francis Pettygrove
- Coin toss year: 1845; Pettygrove won (named Portland after Portland, Maine)
- Portland Penny: 1835 copper penny used in the toss; now at Oregon Historical Society
- Incorporated: February 8, 1851
- "Stumptown" nickname: rapid growth post-1847; tree stumps left in streets, whitewashed for visibility
- Source: oregonencyclopedia.org/articles/portland_penny/, multiple web sources — HIGH confidence

### Rose City Identity
- First "City of Roses" reference: 1888 (Episcopal Church convention visitors)
- Portland Rose Festival: first held 1907 (continues annually)
- International Rose Test Garden: established 1917, dedicated June 1924; oldest continuously operating public rose test garden in the US; 7,000+ plants, 550 varieties
- Located in Washington Park
- Source: WebSearch (multiple sources agree) — MEDIUM confidence

### Forest Park
- Size: 5,100+ acres
- Character: One of the largest urban forests in the US (exact national ranking varies by source)
- Location: Tualatin Mountains west of downtown
- Formally dedicated: September 23, 1948 (originally 4,200 acres)
- Trail system: 80+ miles including Wildwood Trail
- Olmsted Brothers: commissioned 1903 to develop Portland parks plan
- Source: forestparkconservancy.org, Wikipedia — MEDIUM confidence

### Willamette River Bridges
- Count: 12 bridges span the Willamette River
- "Bridge City" nickname derives from this count
- Hawthorne Bridge: opened December 19, 1910; oldest vertical-lift bridge still in operation in America
- Steel Bridge: double-decker; accommodates cars, MAX light rail, freight, pedestrians, cyclists; first US bridge dedicated to light rail + pedestrians/cyclists
- Burnside Bridge: completed 1926; first Willamette River bridge designed with architect input (Italian Renaissance-style towers)
- Source: Wikipedia, Multnomah County, KGW — MEDIUM confidence

### Cultural Institutions
- **Oregon Zoo:** Founded 1888 (Portland City Council accepted Richard Knight's animal collection November 7, 1888); oldest zoo west of the Mississippi River; located in Washington Park
- **Portland Art Museum:** Founded 1892 (Portland Art Association); opened 1895 in city library; current location at SW Park and SW Jefferson opened November 18, 1932
- **OMSI:** Oregon Museum Foundation established November 5, 1944; public opening August 3, 1958 (original Washington Park location); current east bank Willamette location opened 1992; includes USS Blueback submarine
- **Powell's Books:** Acceptable civic cultural anchor (largest independent bookstore in the world) — civic significance only, not as "weird Portland" quirkiness
- Source: Wikipedia, museum official sites, WebSearch — MEDIUM confidence on founding dates (Oregon Zoo/Portland Art Museum), HIGH confidence on OMSI (official site)

## Theme Color Recommendation

**Recommendation: `#1B6B3A` (forest green)**

Rationale:
- Portland's defining natural landmark is Forest Park — the urban forest. Forest green evokes this immediately.
- "Rose City" might suggest pink/red but existing colors already include deep red (`#991B1B` — Bloomington) and crimson (`#BF0D3E` — Texas).
- Existing colors to avoid: `#1E3A8A` (federal blue), `#991B1B` (Bloomington red), `#047857` (Fremont emerald green), `#0369A1` (LA ocean blue), `#92400E` (CA golden brown), `#1B4332` (Norwich deep forest green), `#1E3A5F` (Cambridge navy), `#0C2340` (Massachusetts dark blue), `#B45309` (Plano amber), `#BF0D3E` (Texas crimson)
- `#1B6B3A` is a medium-deep forest green, clearly distinct from Fremont's `#047857` (brighter emerald) and Norwich's `#1B4332` (darker forest). Portland's forested character justifies green.
- Passes WCAG AA contrast ratio for white text.

**Alternative:** `#3D5C8A` (muted Pacific Northwest blue — Willamette River / Pacific Northwest sky reference, distinct from federal `#1E3A8A`).

## Banner Image Recommendation

**Recommendation: Portland City Hall or Portland Building**

Per CONTEXT.md: banner image should be an iconic Portland citywide landmark — not a neighborhood.

Options:
1. **Portland City Hall** (1333 SW 5th Ave, completed 1895) — civic seat of government; Renaissance Revival architecture; photogenic and symbolically appropriate
2. **The Portland Building** (1120 SW 5th Ave, completed 1982) — famous postmodern Michael Graves building housing city offices; distinctive appearance; one of the most recognized civic buildings in the US
3. **Hawthorne Bridge** — iconic bridge, "Bridge City" connection, civic significance, visually distinctive
4. **International Rose Test Garden** — "Rose City" connection, civic park, visually compelling

Image sourcing: Portland.gov has city photography available; Wikimedia Commons has freely licensed images of all these landmarks. The Library of Congress HABS/HAER program has documented Portland's bridges and some historic buildings.

**Strongest recommendation:** Portland City Hall — most directly reflects the civic government angle of the collection and has the clearest "seat of government" civic identity.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `scan-duplicates.ts` after each collection | Semantic dedup integrated in `generate-locale-questions.ts` | Phase 57 | No separate manual pass needed for Portland |
| Net-count only in readiness audit | Net-count + expiring ratio warning (15% minimum) | Phase 57 | Audit will warn if Portland's expiring ratio is below 15%; target is 25–30% |
| No playbook retrospective standard | COLLECTION-PLAYBOOK.md with retrospective template | Phase 57 | Phase 58 must append a retrospective after activation |
| Portland's commission government | Mayor-council with 12-district council | January 2025 | All Portland government questions must reflect new structure; "commissioner" terminology is obsolete |
| 5 at-large commissioners | 12 district councilors (3 per district) | January 2025 | Expiring questions target mayor, each district's 3 councilors, and auditor |

**Deprecated/outdated:**
- "Commissioner" as title for Portland city council members: replaced by "councilor" as of January 2025
- Commission form of government: abolished January 1, 2025 — acceptable only as civic history
- Portland as "last major US city with commission government": this was true until January 2025; now a historical fact

## Open Questions

1. **Exact term-end date format for Districts 3 & 4 councilors**
   - What we know: Districts 3 and 4 councilors serve 2-year terms, up for election November 2026.
   - What's unclear: The exact swearing-in date for the new class (January 1, 2027 or a specific date in January 2027).
   - Recommendation: Use `"2027-01-01T00:00:00Z"` as the expiry — conservative and consistent with how other collections handle term-end dates.

2. **Confirmed current City Administrator name**
   - What we know: Michael Jordan agreed to serve as interim City Administrator; Mayor Wilson announced a new appointment in December 2025 from "a fast-growing Colorado city."
   - What's unclear: The confirmed permanent City Administrator's name as of March 2026.
   - Recommendation: Voice guidance should instruct the generator to ask structural questions about the City Administrator ROLE rather than name-specific questions — consistent with how the Cambridge and Plano city manager pattern was handled.

3. **Whether Portland City Hall or the Portland Building is the stronger banner**
   - What we know: Both are iconic. Portland City Hall is older (1895) and more traditionally civic. The Portland Building (1982) is more architecturally distinctive (postmodern, famous).
   - What's unclear: Which is more recognizable to Portland residents as the symbol of city government.
   - Recommendation: Portland City Hall — it is the traditional seat of government and more directly evokes civic identity. The Portland Building is a better fit if visual distinctiveness is the priority.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `backend/src/scripts/content-generation/prompts/system-prompt.ts` — confirmed dispatch chain pattern, all existing locale guidance functions, addition point at line 105
- Direct codebase inspection: `backend/src/scripts/content-generation/locale-configs/plano-tx.ts` — model for Portland locale config structure
- Direct codebase inspection: `backend/src/db/seed/collections.ts` — all existing theme colors and slugs confirmed; `portland-or` not present; `por` prefix not in use
- Direct codebase inspection: `.planning/COLLECTION-PLAYBOOK.md` — retrospective template confirmed in section 6
- `.planning/phases/57-*/57-01-SUMMARY.md` and `57-02-SUMMARY.md` — confirmed semantic dedup and expiring ratio warning are live in the pipeline as of Phase 57

### Secondary (MEDIUM confidence)
- `https://www.portland.gov/transition/overview` — new 2025 government structure confirmed (4 districts, 12 members, City Administrator role, staggered terms)
- `https://www.portland.gov/auditor/simone-rede` — Auditor Simone Rede, re-elected November 2024, term began January 2025
- WebSearch (multiple sources including KGW, OPB, Wikipedia): Portland council member names by district, staggered term structure (Districts 1 & 2: 4-year; Districts 3 & 4: 2-year)
- WebSearch (multiple sources): Keith Wilson as mayor, 4-year term (Jan 2025–Jan 2029)
- WebSearch (oregonencyclopedia.org, Ballotpedia): Measure 26-228, commission government history, adoption 1913
- WebSearch (oregonencyclopedia.org, multiple): Portland Penny, coin toss naming history, February 8, 1851 incorporation
- WebSearch (forestparkconservancy.org, Wikipedia): Forest Park size 5,100+ acres, 1948 dedication, Olmsted 1903
- WebSearch (Wikipedia, official museum sites): Oregon Zoo 1888, Portland Art Museum 1892, OMSI 1944/1992
- WebSearch (multiple sources): Rose City nickname 1888, Rose Festival 1907, Rose Test Garden 1917
- WebSearch (Wikipedia, Multnomah County): 12 bridges, Hawthorne Bridge oldest vertical-lift in America (1910)

### Tertiary (LOW confidence)
- Individual Portland city councilor names by district — verified from multiple web sources but could shift between now and generation; confirm against portland.gov/council before writing voice guidance

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — all scripts confirmed from codebase; Phase 57 pipeline changes confirmed from summaries
- Architecture patterns: HIGH — identical to established city collection pattern from Phases 49 and 51
- Portland government structure (post-Jan 2025): MEDIUM-HIGH — confirmed from portland.gov official sources and multiple news sources
- Staggered term schedule: MEDIUM — confirmed from multiple sources (KGW, Willamette Week, Wikipedia)
- Current councilor names: MEDIUM — confirmed from news sources but should be spot-checked before voice guidance authoring
- Historical civic facts (founding, Rose City, Forest Park, bridges, institutions): MEDIUM — confirmed from multiple sources but unverified against official portland.gov documentation for each item
- Theme color recommendation: MEDIUM — recommendation based on visual distinctiveness from existing palette; no official Portland brand guide found
- Banner image recommendation: MEDIUM — civic appropriateness reasoning; no official guidance

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — pipeline infrastructure is stable; Portland civic facts are stable; councilor names are stable for 30 days though Districts 3 & 4 may change after November 2026 election)
