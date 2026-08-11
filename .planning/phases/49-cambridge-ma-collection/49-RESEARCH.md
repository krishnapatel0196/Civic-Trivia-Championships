# Phase 49: Cambridge, MA Collection - Research

**Researched:** 2026-03-01
**Domain:** Collection scaffolding, locale config authoring, civic content generation, collection activation
**Confidence:** HIGH

## Summary

Phase 49 follows the established collection-creation pattern used for Fremont, Norwich, and Bloomington: scaffold a new collection entry, author a locale config with topics and source URLs, generate questions using the batch generation pipeline, curate to ≥50 passing quality rules, add a banner image, and activate. No new infrastructure is required — the full pipeline (scaffold-collection.ts, generate-locale-questions.ts, audit-collection-readiness.ts, activate-collection.ts, verify-post-activation.ts) is reusable as-is.

The primary new work in this phase is authoring the Cambridge-specific locale config (`cambridge-ma.ts`) and a Cambridge-specific voice/guidance function in `system-prompt.ts`. Cambridge requires locale-specific prompt guidance analogous to `buildFremontSensitivityInstructions()` and `buildNorwichVoiceGuidance()`, covering its distinctive government structures (Plan E City Manager form, 9-member at-large Council, proportional representation voting), content sensitivities (anti-partisan framing, no Harvard/MIT promotion, "feel seen" standard for all Cambridge communities), and factual calibrations (the PR adoption story, living wage ordinance, CRLS).

One significant factual correction from the CONTEXT.md must be flagged: Cambridge was NOT the first US city to pass a living wage ordinance — Baltimore was first in 1994. Cambridge passed its ordinance in May 1999. The CONTEXT.md states "1998" and "first US city" — both are incorrect based on verified sources. Questions about Cambridge's living wage ordinance should be framed accurately (e.g., "Cambridge passed a living wage ordinance in what year?") rather than asserting a false superlative.

**Primary recommendation:** Run `scaffold-collection.ts` first (generates boilerplate), then hand-edit the locale config with Cambridge-specific topics and source URLs from this document, then add `buildCambridgeVoiceGuidance()` to `system-prompt.ts` before generating questions.

## Standard Stack

No new libraries required. All tools are in-project.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `scaffold-collection.ts` | Automates seed entry, locale config file, generator registration | Established pattern for all city collections |
| `generate-locale-questions.ts` | Batch question generation with RAG source fetching | Established pipeline since Phase 24 |
| `audit-collection-readiness.ts` | Pre-activation blocking gate (net count ≥ 50) | Built in Phase 48 for exactly this use case |
| `activate-collection.ts` | Flips `isActive` and promotes draft questions to active | Parameterized for any slug/prefix since Phase 47 |
| `verify-post-activation.ts` | Post-activation API verification | Built in Phase 48 for exactly this use case |
| `system-prompt.ts` | AI content generation prompt builder | Add `buildCambridgeVoiceGuidance()` here |

### No Installation Required
All dependencies are in-project. No `npm install` needed.

**Scaffold command:**
```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Cambridge, MA" \
  --slug cambridge-ma \
  --prefix cam \
  --theme "#1E3A5F"
```

## Architecture Patterns

### Recommended Project Structure Changes
```
backend/src/scripts/content-generation/
├── locale-configs/
│   └── cambridge-ma.ts              # NEW — locale config with topics + source URLs
├── prompts/
│   └── system-prompt.ts             # MODIFY — add buildCambridgeVoiceGuidance()
│
backend/src/db/seed/
└── collections.ts                   # MODIFIED by scaffold-collection.ts

frontend/public/images/collections/
└── cambridge-ma.jpg                 # NEW — banner image (Cambridge City Hall)
```

### Pattern 1: Collection Scaffolding
**What:** `scaffold-collection.ts` inserts a seed entry in `collections.ts`, creates the locale config stub, and registers the locale in `generate-locale-questions.ts`. Run this FIRST before any manual editing.

**Important:** After running scaffold, the generated locale config stub is minimal. Replace its `topicCategories`, `topicDistribution`, and `sourceUrls` with the Cambridge-specific content from this document.

```bash
# Source: backend/src/scripts/scaffold-collection.ts
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Cambridge, MA" \
  --slug cambridge-ma \
  --prefix cam \
  --theme "#1E3A5F"

# Then seed to DB (creates the collection row)
npx tsx src/db/seed/seed.ts
```

### Pattern 2: Locale Config Structure (Cambridge-specific)
**What:** The locale config drives topic categories, distribution weights, and RAG source URLs. Follow the fremont-ca.ts model exactly — it is the closest precedent (city with unique history and distinctive civic structures).

**Config variable name:** `cambridgeMaConfig` (derived by `deriveConfigVarName('cambridge-ma')`)

```typescript
// Source: backend/src/scripts/content-generation/locale-configs/cambridge-ma.ts
import type { LocaleConfig } from './bloomington-in.js';

export const cambridgeMaConfig: LocaleConfig = {
  locale: 'cambridge-ma',
  name: 'Cambridge, MA',
  externalIdPrefix: 'cam',
  collectionSlug: 'cambridge-ma',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.3, // Generate ~130, curate to ~100

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Cambridge city government — Plan E City Manager charter, 9-member at-large City Council, Council-elected Mayor, city departments, and municipal services',
    },
    {
      slug: 'civic-history',
      name: 'Civic History',
      description: 'Cambridge founding (1630), colonial history, incorporation as a city (1846), four original villages, Cambridge City Hall (1888 Richardsonian Romanesque), and civic milestones',
    },
    {
      slug: 'elections-voting',
      name: 'Elections & Voting',
      description: 'Cambridge proportional representation/ranked-choice voting system — Plan E adoption (1940), two-year terms, at-large elections, how PR quota works, election schedule',
    },
    {
      slug: 'civic-firsts-policy',
      name: 'Civic Firsts & Policy',
      description: 'Cambridge civic innovations: living wage ordinance (1999), Affordable Housing Overlay, zoning history (first ordinance 1924), DNA research moratorium (1976), same-sex marriage (2004)',
    },
    {
      slug: 'neighborhoods-community',
      name: 'Neighborhoods & Community',
      description: 'East Cambridge, Cambridgeport, North Cambridge, Inman Square — Portuguese and Azorean community history, Haitian community, working families, housing advocacy, civic activists',
    },
    {
      slug: 'schools-libraries',
      name: 'Schools & Libraries',
      description: 'Cambridge Public Schools, Cambridge Rindge and Latin School (CRLS), Cambridge Public Library — civic roles and history',
    },
  ],

  topicDistribution: {
    'city-government': 30,      // City-government heavy per CONTEXT.md
    'civic-history': 25,        // Deep Cambridge history is the backbone
    'elections-voting': 15,     // Distinctive PR/RCV system deserves coverage
    'civic-firsts-policy': 15,  // Dinner-party-worthy civic facts
    'neighborhoods-community': 10, // "Feel seen" standard across whole city
    'schools-libraries': 5,     // CRLS and library civic roles
  },

  sourceUrls: [
    // Cambridge City Government (official)
    'https://www.cambridgema.gov/',
    'https://www.cambridgema.gov/departments/citycouncil',
    'https://www.cambridgema.gov/Departments/citymanagersoffice',
    'https://www.cambridgema.gov/departments/mayorsoffice',
    'https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections',
    'https://www.cambridgema.gov/historic/cambridgehistory',
    'https://www.cambridgema.gov/historic/cambridgehistory/elevenfacts',
    'https://www.cambridgema.gov/Departments/Purchasing/Publications/livingwageordinance',
    // Cambridge Community Development
    'https://www.cambridgema.gov/CDD',
    // Cambridge Election Commission
    'https://www.cambridgema.gov/Departments/electioncommission',
    // Cambridge Historical Commission
    'https://www.cambridgema.gov/historic',
    // Local journalism
    'https://www.cambridgeday.com',
    'https://www.wbur.org',
    // Cambridge Rindge and Latin School
    'https://crls.cpsd.us/about_crls/school_history',
    // Historical / civic institutions
    'https://historycambridge.org',
    // Wikipedia (supplementary for history)
    'https://en.wikipedia.org/wiki/Cambridge,_Massachusetts',
    'https://en.wikipedia.org/wiki/Cambridge_City_Hall_(Massachusetts)',
  ],
};
```

### Pattern 3: Locale-Specific Voice Guidance in system-prompt.ts
**What:** `buildSystemPrompt()` in `system-prompt.ts` already dispatches locale-specific guidance for `fremont-ca` and `norwich-uk`. Add a `buildCambridgeVoiceGuidance()` function and wire it in.

**Where to modify:** Line 104 in `system-prompt.ts` — the template literal dispatch:

```typescript
// Current (line 104 of system-prompt.ts):
${QUALITY_GUIDELINES}${localeSlug === 'fremont-ca' ? buildFremontSensitivityInstructions() : ''}${localeSlug === 'norwich-uk' ? buildNorwichVoiceGuidance() : ''}

// Add Cambridge dispatch:
${QUALITY_GUIDELINES}${localeSlug === 'fremont-ca' ? buildFremontSensitivityInstructions() : ''}${localeSlug === 'norwich-uk' ? buildNorwichVoiceGuidance() : ''}${localeSlug === 'cambridge-ma' ? buildCambridgeVoiceGuidance() : ''}
```

**Content for `buildCambridgeVoiceGuidance()`:** See Code Examples section below.

### Pattern 4: Generation Pipeline Command Sequence
```bash
cd backend

# Step 1: Fetch sources and generate
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale cambridge-ma \
  --fetch-sources

# Step 2: Review generated draft questions (admin UI or direct DB)
# Curate: archive questions that fail dinner-party test or quality rules
# Target: ≥50 clean questions pass quality gate

# Step 3: Pre-activation audit
npx tsx src/scripts/audit-collection-readiness.ts --slug cambridge-ma --prefix cam

# Step 4: Activate
npx tsx src/scripts/activate-collection.ts --slug cambridge-ma --prefix cam --dry-run
npx tsx src/scripts/activate-collection.ts --slug cambridge-ma --prefix cam

# Step 5: Post-activation verify
npx tsx src/scripts/verify-post-activation.ts --slugs cambridge-ma \
  --api-url https://civic-trivia-backend.onrender.com
```

### Pattern 5: Banner Image
**What:** `CollectionCard.tsx` reads `/images/collections/${collection.slug}.jpg`. The file must exist at `frontend/public/images/collections/cambridge-ma.jpg` before the collection is activated.

**Cambridge City Hall image:** The CONTEXT.md says "Cambridge City Hall (neoclassical building)" but the actual building is **Richardsonian Romanesque** (1888, 795 Massachusetts Ave, designed under H.H. Richardson's influence). This is a distinguished and photogenic civic building — still the right choice for the banner. Sources confirming style: Wikipedia, SAH Archipedia, Library of Congress.

**Image sourcing:** The Library of Congress Historic American Buildings Survey has documented photographs of Cambridge City Hall at `https://www.loc.gov/item/ma0217/`. These are public domain. Alternatively, Wikimedia Commons has Cambridge City Hall photographs freely available.

### Pattern 6: Frontend Category Routing (No Changes Required)
```typescript
// Source: frontend/src/features/collections/components/CollectionPicker.tsx line 12-16
function getCategory(slug: string): 'local' | 'state' | 'federal' {
  if (slug === 'federal') return 'federal';
  if (slug.endsWith('-state')) return 'state';
  return 'local';  // cambridge-ma -> 'local' automatically
}
// Alphabetical sort within local: Bloomington, Cambridge, Fremont, Los Angeles, Norwich
```

### Anti-Patterns to Avoid

- **Don't skip scaffold-collection.ts:** It automates three edits (collections.ts seed entry, locale config stub, generate-locale-questions.ts registration). Running scaffold first avoids manual registration errors.
- **Don't reuse civic_trivia schema:** All DB scripts must use Drizzle ORM from `../db/schema.js`. The `trivia` schema is the production schema since Phase 40.
- **Don't assert Cambridge was "first US city" for living wage:** Baltimore was first (1994). Cambridge passed its ordinance in May 1999. Framing as a superlative would be factually incorrect and embarrassing.
- **Don't include Harvard/MIT as topic areas:** CONTEXT.md explicitly forbids this. Civic non-profit work may appear incidentally; don't make it a topic category.
- **Don't use Harvard Crimson (`#A51C30`) as the theme color:** This would make the collection look like a Harvard ad, directly contradicting CONTEXT.md.
- **Don't forget the `overshootFactor`:** Set to 1.3 so generation produces ~130 questions for curation down to 100. This is the established pattern for achieving quality after curation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collection DB entry + locale config + generator registration | Manual edits to 3 files | `scaffold-collection.ts --name "Cambridge, MA" --slug cambridge-ma --prefix cam --theme "#1E3A5F"` | Automates all 3 edits correctly; handles config var naming, sort order detection |
| Pre-activation readiness gate | Custom count script | `audit-collection-readiness.ts --slug cambridge-ma --prefix cam` | Built in Phase 48; counts draft + active, factors expiring questions, blocks if net < 50 |
| Post-activation verification | Manual API check | `verify-post-activation.ts --slugs cambridge-ma --api-url ...` | Built in Phase 48; checks collection present in API with questionCount ≥ 50 |
| Collection activation | Manual DB UPDATE | `activate-collection.ts --slug cambridge-ma --prefix cam` | Handles collection isActive flip + all matching draft questions in one operation |
| Cambridge City Hall image | Original photo creation | Source from Library of Congress HABS (public domain) or Wikimedia Commons | LoC item `ma0217` has high-resolution documented photographs of Cambridge City Hall |

**Key insight:** The full activation pipeline already exists from Phases 47 and 48. Phase 49 requires no new infrastructure — only content (locale config, voice guidance, question generation, banner image).

## Common Pitfalls

### Pitfall 1: Living Wage Ordinance Factual Error
**What goes wrong:** A question asserts "Cambridge was the first US city to pass a living wage ordinance" — this is false.
**Why it happens:** The CONTEXT.md contains this claim. It appears to be incorrect: Baltimore was first in 1994; Cambridge passed its ordinance in May 1999 (not 1998).
**How to avoid:** Frame living wage questions as "Cambridge passed a living wage ordinance in what year?" (answer: 1999) rather than as a "first US city" superlative. The ordinance is still a significant civic fact worth covering — just frame it accurately.
**Warning signs:** Generated question says "Cambridge was the first US city" — archive this immediately; it will not survive fact-checking.
**Sources verifying this:** Harvard Crimson article (dated May 4, 1999) confirms ordinance passed May 1999. Shelterforce / Economic Policy Institute confirm Baltimore was first in 1994.

### Pitfall 2: Plan E PR Adoption Date Confusion
**What goes wrong:** A question says "Cambridge abolished PR voting in 1938 under controversy, then restored it in 1941."
**Why it happens:** The CONTEXT.md contains this framing, but it's misleading. The 1938 vote was a rejection of Plan E (which would have INTRODUCED PR), not an abolition of existing PR. Cambridge had no PR before 1938. Voters rejected Plan E in 1938, then adopted it in 1940, and held the first PR election in 1941.
**How to avoid:** Frame the story accurately: Cambridge voters REJECTED Plan E (city manager + PR) in November 1938, then APPROVED it two years later. First PR election: 1941. First Plan E government: January 1942.
**Warning signs:** Questions mentioning "restored" PR or "abolished in 1938" — these misrepresent the history.
**Sources:** Cambridge Municipal Elections page (official), FairVote Spotlight on Cambridge, Harvard Crimson reporting.

### Pitfall 3: City Hall Architecture Described as Neoclassical
**What goes wrong:** A question about Cambridge City Hall describes it as "neoclassical."
**Why it happens:** The CONTEXT.md says "neoclassical building." The actual building is Richardsonian Romanesque (1888, 795 Massachusetts Ave), inspired by H.H. Richardson's style — a Romanesque Revival with heavy stone arches, not a neoclassical columned building.
**How to avoid:** If questions are written about Cambridge City Hall, use the correct architectural style: Richardsonian Romanesque. Or avoid architecture-style questions altogether and focus on the building's civic role (it has housed Cambridge's city government since 1888).
**Warning signs:** Any question mentioning "neoclassical" or "classical columns" about City Hall.
**Source:** Wikipedia (Cambridge City Hall, Massachusetts), SAH Archipedia, Library of Congress HABS documentation.

### Pitfall 4: Harvard/MIT Questions Sneaking In
**What goes wrong:** Generated questions focus on Harvard or MIT as subjects rather than their civic roles.
**Why it happens:** Cambridge is globally associated with both universities; Claude's training heavily associates "Cambridge, MA" with Harvard and MIT.
**How to avoid:** The `buildCambridgeVoiceGuidance()` function must explicitly exclude questions where Harvard/MIT is the primary civic subject. Their civic non-profit work (e.g., land use agreements with the city, relationship to the Cambridge Employment Plan) may appear incidentally but must not be the topic anchor.
**Warning signs:** More than 2-3 questions with Harvard or MIT as the named subject in the question text.

### Pitfall 5: Mayor vs. City Manager Confusion
**What goes wrong:** Questions describe Cambridge's Mayor as the chief executive with broad powers.
**Why it happens:** In most US cities, the mayor is the chief executive. In Cambridge, the Mayor is the presiding officer of the City Council (elected by fellow councillors), while the City Manager (appointed by the Council) is the chief executive. This is a counterintuitive structure.
**How to avoid:** The voice guidance must explicitly clarify the distinction. Good questions would be: "What is the primary role of the Cambridge Mayor?" (answer: presiding officer of City Council, not chief executive) or "Who is Cambridge's chief executive?" (answer: the City Manager).
**Warning signs:** Questions describing the Mayor as having executive authority over city departments.

### Pitfall 6: Expiring Questions for Current Officials
**What goes wrong:** Questions about "Who is the current City Manager?" are generated without `expiresAt`.
**Why it happens:** The system prompt instructs setting `expiresAt` for current-official questions. Cambridge City Council members have 2-year terms (odd-year elections). City Manager is appointed — term is indefinite unless removed.
**How to avoid:** The voice guidance should specify expiration dates:
- City Council members: terms end January 2028 (elected November 2025 → 2-year term → `"expiresAt": "2028-01-01T00:00:00Z"`)
- City Manager (Yi-An Huang, appointed 2023): no fixed expiration date — use `null` or set 4 years from appointment; CONTEXT.md says ~50% expiring questions, but focus on structure over specific names
- Mayor (elected by Council after each election): `"expiresAt": "2028-01-01T00:00:00Z"`
**Warning signs:** Questions with null expiresAt about current-officeholder names.

### Pitfall 7: Theme Color Conflict with Existing Collections
**What goes wrong:** Using Harvard Crimson (`#A51C30`) or a deep red theme makes the collection look Harvard-branded and conflicts with Bloomington's `#991B1B`.
**How to avoid:** Use `#1E3A5F` (deep navy blue — civic, Massachusetts, distinct from all existing colors). See Theme Color Recommendation section below.

## Code Examples

### Cambridge Voice Guidance Function (for system-prompt.ts)

```typescript
// Source: Add to backend/src/scripts/content-generation/prompts/system-prompt.ts
// Follow the pattern of buildFremontSensitivityInstructions() and buildNorwichVoiceGuidance()

function buildCambridgeVoiceGuidance(): string {
  return `

## Cambridge, MA — Specific Content Guidelines

### Government Structure (CRITICAL accuracy requirement)

Cambridge uses the **Plan E** City Manager form of government. The key distinction from most US cities:

- **City Manager** (currently Yi-An Huang) = CHIEF EXECUTIVE. Appointed by City Council. Runs all city departments, implements policy, manages the budget. This is NOT an elected position.
- **Mayor** = PRESIDING OFFICER of City Council. Elected by fellow City Councillors from among themselves, not directly by voters. The Mayor chairs Council meetings but does NOT have executive powers like a typical US mayor.
- **City Council** = 9 members, ALL elected at-large (no districts). Voters can rank all candidates. Two-year terms. Elections in odd-numbered years (November).

Questions about Cambridge leadership MUST reflect this distinction:
- CORRECT: "In Cambridge's Plan E charter, who is the chief executive responsible for running city departments?"
  → Answer: The City Manager
- WRONG: Any question implying the Mayor has executive powers over city departments

### Proportional Representation / Ranked-Choice Voting

Cambridge has used proportional representation (PR) since 1941, following voter approval of Plan E in 1940.

Key facts for accurate questions:
- Cambridge voters REJECTED Plan E in November 1938 (margin: 1,767 votes)
- Cambridge voters APPROVED Plan E in 1940 (margin: 7,552 votes)
- First PR election: 1941; first Plan E government took office: January 1942
- The system is PR (proportional representation) — a form of ranked-choice voting
- Any group with more than 1/10th of votes cast can elect at least one of the nine council members
- Five referenda to repeal PR (1952, 1953, 1957, 1961, 1965) — PR survived all five

Do NOT describe Plan E as Cambridge "abolishing" PR in 1938 — PR did not exist in Cambridge before 1938. The 1938 vote rejected introducing it.

### Living Wage Ordinance — Accurate Framing

Cambridge passed a living wage ordinance in **May 1999** (not 1998).

DO NOT frame this as Cambridge being the "first US city" — Baltimore passed the first US living wage ordinance in 1994. Cambridge's ordinance is still a significant civic fact worth covering; frame it accurately:
- CORRECT: "Cambridge passed its living wage ordinance in what year?" → Answer: 1999
- WRONG: "Cambridge became the first US city to pass a living wage ordinance in ____" → This is factually incorrect

### Harvard and MIT — Strict Limitation

This collection is NOT about Harvard or MIT.
- Do NOT write questions where Harvard or MIT is the primary civic subject
- Their civic/non-profit relationships to Cambridge city government MAY appear incidentally (e.g., PILOT payments, zoning agreements) but must not anchor a question
- Any question where removing the university name makes it meaningless is NOT a valid Cambridge civic question

### "Feel Seen" Standard — Represent the Whole City

Cambridge has distinct communities beyond the university-adjacent population. Questions should reflect the whole city:
- East Cambridge: Working-class history, Portuguese/Azorean community (St. Anthony's Church, 1902), furniture factories, later Brazilian community
- Cambridgeport: Historical port community (designated port of delivery by Congress, 1805)
- North Cambridge: Haitian community (arrived 1970s+)
- Housing advocacy: Cambridge has a strong tenant and affordable housing movement
- Generate at least some questions that would resonate with long-time Cambridge families, not just university-associated residents

### Cambridge City Hall

Cambridge City Hall (795 Massachusetts Ave) is **Richardsonian Romanesque** style, built in 1888. It is NOT neoclassical. It features heavy stone construction with Romanesque arches, built with funds donated by local benefactor Frederick Hastings Rindge.

Do NOT describe it as neoclassical or as having classical columns.

### Cambridge Rindge and Latin School (CRLS)

CRLS is the city's only public high school, formed in 1977 by the merger of Rindge Technical School (founded 1888 as a national model vocational school) and Cambridge High and Latin School. It reflects the city's diverse demographics and civic values (Opportunity, Diversity, Respect). Questions about CRLS should focus on its civic role and history, not its notable alumni.

### Expiration Dates for Elected Officials

- City Council members (elected November 2025): expiresAt "2028-01-01T00:00:00Z"
- Mayor (elected by Council after November 2025 election): expiresAt "2028-01-01T00:00:00Z"
- City Manager (appointed, no fixed term): expiresAt null (or omit time-sensitive name questions; prefer structural questions about the City Manager role)
- For structural questions (e.g., "How are City Council members elected?"): expiresAt null

Per the CONTEXT.md, target roughly 50% expiring and 50% durable questions. Durable = structural/historical facts. Expiring = questions about specific current officeholders.

### Difficulty Calibration

Over-index on EASY questions — the Easy Steps design requires easy questions to let players get 2 correct before advancing.

EASY = facts a civic-minded Cambridge resident would know or could figure out from general knowledge
NEVER include questions whose answer is an address, phone number, or obscure budget line item.

Apply the dinner party test: "Is this a tidbit a civic-minded person would be proud to share?"
- PASS: "What form of government does Cambridge use, where voters rank all candidates for 9 council seats?"
- PASS: "In what year did Cambridge adopt its Plan E charter, introducing the city manager form of government?"
- FAIL: "What is the square footage of Cambridge City Hall?"`;
}
```

### Scaffold Command + Seed Sequence

```bash
# Source: backend/src/scripts/scaffold-collection.ts
cd backend

# Step 1: Scaffold (automates 3 file edits)
npx tsx src/scripts/scaffold-collection.ts \
  --name "Cambridge, MA" \
  --slug cambridge-ma \
  --prefix cam \
  --theme "#1E3A5F"

# Step 2: After scaffold, REPLACE the generated locale config stub with the full config
# File: backend/src/scripts/content-generation/locale-configs/cambridge-ma.ts
# (Replace topicCategories, topicDistribution, sourceUrls with Cambridge-specific content)

# Step 3: Seed collection to DB
npx tsx src/db/seed/seed.ts
```

### Generation with Source Fetching

```bash
# Source: backend/src/scripts/content-generation/generate-locale-questions.ts
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale cambridge-ma \
  --fetch-sources
```

### Pre-Activation Audit

```bash
# Source: backend/src/scripts/audit-collection-readiness.ts
cd backend
npx tsx src/scripts/audit-collection-readiness.ts --slug cambridge-ma --prefix cam
# Exit 0 = READY (net count ≥ 50)
# Exit 1 = BLOCKED (net count < 50)
```

### Activation and Verification

```bash
# Source: backend/src/scripts/activate-collection.ts
cd backend
npx tsx src/scripts/activate-collection.ts --slug cambridge-ma --prefix cam --dry-run
npx tsx src/scripts/activate-collection.ts --slug cambridge-ma --prefix cam

# Source: backend/src/scripts/verify-post-activation.ts
npx tsx src/scripts/verify-post-activation.ts \
  --slugs cambridge-ma \
  --api-url https://civic-trivia-backend.onrender.com
```

## Cambridge Civic Facts Reference

Verified facts for question authoring and system prompt. All HIGH confidence from official Cambridge sources and Wikipedia.

### Government Structure
- **Charter:** Plan E (City Manager form with Proportional Representation)
- **City Council:** 9 members, ALL at-large, 2-year terms, elected odd years (November)
- **Mayor:** Elected by City Councillors from among themselves; presiding officer, NOT chief executive
- **City Manager:** Appointed by City Council; chief executive; current: Yi-An Huang (appointed 2023)
- **School Committee:** 6 members, at-large, 2-year terms (separate body from City Council)

### Plan E / PR History
- 1938: Cambridge voters REJECT Plan E (margin: 1,767 votes against)
- 1940: Cambridge voters APPROVE Plan E (margin: 7,552 votes in favor)
- 1941: First proportional representation election held
- January 1942: First Plan E government takes office
- 1952, 1953, 1957, 1961, 1965: Five repeal referenda — PR survived all five
- Cambridge is the only Massachusetts city still using the system today

### Key Civic Milestones
- 1630: Puritan settlement (originally called Newtowne)
- 1636: Harvard College founded
- 1638: Renamed Cambridge
- 1846: Incorporated as a city; united Old Cambridge, Cambridgeport, East Cambridge
- 1888: Cambridge City Hall built (Richardsonian Romanesque, 795 Mass Ave)
  - Funded by Frederick Hastings Rindge
  - Remains Cambridge's primary civic building
- 1924: First Cambridge Zoning Ordinance
- 1976: Cambridge imposes moratorium on recombinant DNA research (citizen review panel)
- 1977: Cambridge passes DNA safety regulations (first US city to do so)
- 1977: Cambridge Rindge and Latin School formed (merger of Rindge Tech + Cambridge High and Latin)
- 1999: Cambridge passes living wage ordinance (May 1999; covers city contractors; $10/hr minimum)
- 2004: Massachusetts begins issuing same-sex marriage licenses; Cambridge issues first licenses in the state

### Cambridge City Hall
- Address: 795 Massachusetts Avenue
- Year built: 1888
- Style: Richardsonian Romanesque (NOT neoclassical)
- Funder: Frederick Hastings Rindge (local benefactor; also gave Rindge Technical School)
- Documentation: Library of Congress HABS Survey (item ma0217)

### Cambridge Communities (for "feel seen" questions)
- **East Cambridge:** Working-class historical core; Portuguese/Azorean immigrants from 1860s+; furniture factories (Irving & Casson, A.H. Davenport); now Brazilian community in Inman Square
- **Cambridgeport:** Canal port designated by Congress (1805); port of delivery history
- **North Cambridge:** Haitian community settled 1970s+
- **Old Cambridge:** Harvard Square area
- **St. Anthony's Church (East Cambridge, 1902):** Founded by Rev. Antonio Pimental; center of Portuguese community; Holy Ghost feast tradition continues

### Cambridge Rindge and Latin School (CRLS)
- Formed 1977 from merger of two schools
- Rindge Technical School: Founded 1888 as Cambridge Manual Training School; national model vocational school
- Cambridge High and Latin: College preparatory school
- Values: Opportunity, Diversity, Respect
- Only public high school in Cambridge
- Reflects city's full demographic and socioeconomic diversity

### Living Wage Ordinance
- Passed: May 1999 (City Council unanimous vote)
- Amount: $10/hr minimum for city contractors and workers
- Context: Part of a national living wage movement; NOT the first US ordinance (Baltimore was first, 1994)
- Dinner party tidbit worth covering — just frame accurately

### Local Sources and Credibility
- **cambridgema.gov** — Primary official source for all government facts
- **cambridgeday.com** — Active local nonprofit journalism (acquired by Cambridge News Inc. 2024); covers city council, housing, schools
- **historycambridge.org** — Cambridge Historical Society; civic and neighborhood history
- **cambridgema.gov/historic** — Cambridge Historical Commission; building and neighborhood history
- **wbur.org** — Regional public radio; solid civic coverage of Cambridge
- **Wikipedia (Cambridge, Massachusetts)** — Acceptable supplementary source for historical facts with official primaries

## Theme Color Recommendation

**Recommendation: `#1E3A5F` (deep navy blue)**

Rationale:
- Existing colors to avoid: `#1E3A8A` (federal deep blue), `#991B1B` (Bloomington red), `#047857` (Fremont green), `#0369A1` (LA ocean blue), `#92400E` (CA State golden brown), `#1B4332` (Norwich deep forest green)
- `#1E3A5F` is darker/more blue-black than the federal `#1E3A8A` (perceptibly different at UI scale)
- Evokes Massachusetts civic tradition without Harvard crimson associations
- Cambridge's municipal seal uses blue tones
- Passes WCAG AA contrast ratio for white text (≥ 4.5:1)

**Alternative if too close to federal:** `#374151` (slate gray — neutral, civic, classic New England town hall feel). Not warm, not political, clearly distinct from all existing colors.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual 3-file setup for new collections | `scaffold-collection.ts` automates seed, locale config, generator registration | Phase 47 | Run scaffold FIRST; don't manually edit these files |
| Separate audit script per collection | `audit-collection-readiness.ts --slug X --prefix Y` reusable for any collection | Phase 48 | No new audit script needed for Cambridge |
| Hardcoded `COLLECTION_HIERARCHY` | DB-driven tier via seed entry | Phase 47 | No TypeScript source file changes for tier |
| `civic_trivia.` schema | `trivia.` schema via Drizzle ORM | Phase 40 | All scripts must use Drizzle ORM from `../db/schema.js` |
| No locale-specific voice guidance | `buildFremontSensitivityInstructions()` + `buildNorwichVoiceGuidance()` pattern | Phases 33/36 | Add `buildCambridgeVoiceGuidance()` following same pattern |

**Deprecated/outdated:**
- Any script using `civic_trivia.` schema prefix in SQL — DO NOT USE for new scripts
- `activate-collections.ts` (hardcoded for old collections) — use `activate-collection.ts --slug X --prefix Y`

## Open Questions

1. **Cambridge City Hall banner image sourcing**
   - What we know: The building is at 795 Mass Ave, built 1888, Richardsonian Romanesque. Library of Congress has HABS documentation at `https://www.loc.gov/item/ma0217/` (public domain). Wikimedia Commons has photographs.
   - What's unclear: Which specific photograph angle is most visually compelling and matches existing banner image aspect ratios (other banners are landscape JPG at roughly 2:1 ratio).
   - Recommendation: Use the Library of Congress HABS image (public domain, high resolution). If not suitable for the aspect ratio, use Wikimedia Commons CC-BY images of Cambridge City Hall. Verify Creative Commons license before use.

2. **Exact expiration date for current City Manager**
   - What we know: Yi-An Huang was appointed City Manager in 2023. City Manager position has no fixed term; appointment continues at Council's discretion.
   - What's unclear: Whether to generate expiring questions about the City Manager by name. CONTEXT.md says ~50% expiring; but the City Manager isn't term-limited, making expiration arbitrary.
   - Recommendation: Prefer structural City Manager questions (role, responsibilities, appointment process) over name-specific questions. If name questions are generated, set `expiresAt` to `"2027-01-01T00:00:00Z"` as a conservative 4-year horizon from appointment.

3. **Topic weight for `neighborhoods-community`**
   - What we know: CONTEXT.md is explicit that the collection should represent the whole city (East Cambridge, Portuguese/Haitian communities, working families), not just the university-adjacent population.
   - What's unclear: Whether 10 questions adequately reflects this commitment or whether a larger allocation (15-20) is needed.
   - Recommendation: 10 questions is a reasonable allocation given the city-government-heavy mandate. The "feel seen" standard should be embedded in the voice guidance for ALL topics, not just a single neighborhood topic. A question about East Cambridge housing advocacy belongs in `civic-firsts-policy`; a question about the Portuguese community's founding of St. Anthony's Church belongs in `civic-history`. Topic allocation matters less than ensuring the voice guidance threads the "feel seen" standard throughout all topics.

## Sources

### Primary (HIGH confidence)
- `backend/src/scripts/scaffold-collection.ts` — full implementation read; CLI interface confirmed
- `backend/src/scripts/activate-collection.ts` — activation logic confirmed
- `backend/src/scripts/audit-collection-readiness.ts` — Phase 48 script, reusable for Cambridge
- `backend/src/scripts/verify-post-activation.ts` — Phase 48 script, reusable for Cambridge
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` — locale dispatch pattern confirmed
- `backend/src/scripts/content-generation/locale-configs/fremont-ca.ts` — model for Cambridge config
- `backend/src/db/seed/collections.ts` — existing collections, theme colors, `cam` prefix not in use
- `frontend/src/features/collections/components/CollectionPicker.tsx` — `getCategory()` routes `cambridge-ma` to `'local'` automatically
- `https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections` — Plan E adoption timeline (1938 rejection, 1940 approval, 1941 first election), 9 at-large Council members, 2-year terms
- `https://www.cambridgema.gov/historic/cambridgehistory/elevenfacts` — 11 little-known Cambridge history facts; confirmed four original villages, industrial history

### Secondary (MEDIUM confidence)
- `https://www.thecrimson.com/article/1999/5/4/city-council-approves-living-wage-ordinance/` — Living wage ordinance passed May 1999 (confirms 1999, not 1998)
- WebSearch: Baltimore was first US city with living wage ordinance (1994) — confirmed by multiple sources including Shelterforce/EPI; directly contradicts CONTEXT.md claim
- WebSearch: Cambridge City Council 2025 election results — 9 at-large members confirmed, Yi-An Huang as City Manager confirmed
- `https://en.wikipedia.org/wiki/City_Hall_(Cambridge,_Massachusetts)` — Richardsonian Romanesque style, 1888, 795 Mass Ave, Frederick Hastings Rindge donor
- `https://crls.cpsd.us/about_crls/school_history` — CRLS formed 1977 from Rindge + Cambridge High and Latin; three values: Opportunity, Diversity, Respect
- `https://historycambridge.org/articles/where-portuguese-families-found-a-new-home/` — Portuguese/Azorean community East Cambridge history, St. Anthony's Church 1902

### Tertiary (LOW confidence)
- WebSearch general results for Cambridge civic overview — useful for confirming general shape of government but unverified specifics should not appear in questions without official source

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — all scripts read directly from codebase; established pattern
- Architecture patterns: HIGH — identical to Fremont/Norwich; confirmed from source code
- Cambridge government structure: HIGH — confirmed from official cambridgema.gov election page
- Plan E PR history: HIGH — confirmed from official Cambridge election page; timeline is clear
- Living wage ordinance: HIGH (1999, not first US city) — Harvard Crimson article + multiple secondary sources confirm
- Cambridge City Hall style: HIGH (Richardsonian Romanesque, not neoclassical) — confirmed from Wikipedia, SAH Archipedia, LoC
- Theme color recommendation: MEDIUM — no official Cambridge branding guide found; recommendation based on visual distinctiveness from existing palette
- Banner image sourcing: MEDIUM — Library of Congress public domain images identified but aspect ratio suitability unverified

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (30 days — pipeline infrastructure is stable; Cambridge civic facts are stable)
