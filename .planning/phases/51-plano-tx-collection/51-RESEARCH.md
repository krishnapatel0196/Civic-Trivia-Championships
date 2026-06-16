# Phase 51: Plano, TX Collection - Research

**Researched:** 2026-03-02
**Domain:** City collection pipeline — scaffold, locale config, voice guidance, content generation, curation, activation
**Confidence:** HIGH

## Summary

Phase 51 follows the same city collection pipeline established in Phases 25 (Fremont), 43 (Cambridge), and 50 (Massachusetts State). The technical pipeline is fully mature and well-understood: scaffold → seed → locale config → voice guidance → generate → curate → banner image → activate → verify. No new tooling or infrastructure is needed.

Plano's content domain is rich and well-suited to the civic trivia format. The "growth story" framing (cotton farm to Sun Belt boomtown to corporate hub) provides durable narrative spine. The Balloon Capital of Texas designation is an ideal hook for early history — specific, surprising, and shareable. The council-manager government structure is the same form used by Cambridge (direct precedent), making the civic framing familiar. Corporate HQ civic angle (Toyota, JCPenney, Frito-Lay, Legacy West as city planning story) gives the collection contemporary civic relevance without brand promotion.

Key expiration dates are known: Mayor John Muns' second term expires 2029; City Manager Mark Israelson has no fixed term (appointed 2019, prefer structural questions). City council uses staggered four-year terms with odd-year elections. The 50/50 expiring/durable split is achievable: good durable topics (history, government structure, Balloon Capital, growth trajectory) plus natural expiring questions (current mayor, current council places, 2026 special election context).

**Primary recommendation:** Follow the Cambridge (Phase 49) pattern exactly. Scaffold with `--name "Plano, TX" --slug plano-tx --prefix pla --theme "#B45309"`, fix the two known scaffold bugs, hand-edit locale config with Plano-specific topics and source URLs, add `buildPlanoVoiceGuidance()` to system-prompt.ts, generate with `--fetch-sources`, curate to ≥50, add hot air balloon banner image, activate, verify.

## Standard Stack

This phase uses the project's existing collection pipeline — no new libraries or packages are needed.

### Core Pipeline Scripts
| Script | Purpose | How Used |
|--------|---------|----------|
| `scaffold-collection.ts` | Automates seed entry + locale config stub + generator registration | Run once with CLI args |
| `seed.ts` | Creates DB row from seed data | Run after scaffold |
| `generate-locale-questions.ts` | Calls Anthropic API, validates, seeds drafts | Run with `--locale plano-tx --fetch-sources` |
| `audit-collection-readiness.ts` | Pre-activation gate: verifies ≥50 net questions | Run before activation |
| `activate-collection.ts` | Flips collection + questions to active | Run with `--slug plano-tx --prefix pla` |
| `verify-post-activation.ts` | Post-activation API check | Run with `--slugs plano-tx` |

### Derived Parameters (AUTO-COMPUTED by scaffold)
| Parameter | Value | Derivation |
|-----------|-------|-----------|
| slug | `plano-tx` | User decision |
| prefix | `pla` | 3-char, matches slug prefix |
| configVarName | `planoTxConfig` | `deriveConfigVarName('plano-tx')` → parts: ['plano','tx'] → planoTx |
| localeName | `Plano, Texas` | `deriveLocaleName('Plano, TX', 'city')` → expands TX → Texas |
| iconIdentifier | `flag-tx` | `deriveIconIdentifier('plano-tx', 'city')` → last segment = tx |
| sortOrder | `10` | auto-detect max (9) + 1 |
| tier | `city` | default |

### Color Theme Recommendation (Claude's Discretion)
Existing colors to avoid: deep blue (#1E3A8A, #1E3A5F, #0C2340), deep red (#991B1B), emerald green (#047857), ocean blue (#0369A1), golden brown (#92400E), forest green (#1B4332).

**Recommendation: `#B45309` (amber/burnt orange)** — evokes Texas warmth, sunset, and hot air balloon color palette. Distinct from all existing colors. Alternative: `#C2410C` (rust orange) — also thematically appropriate, equally distinct.

## Architecture Patterns

### Collection Pipeline Structure
```
backend/
├── src/db/seed/collections.ts              # Seed entry added by scaffold (step 1)
├── src/scripts/
│   ├── scaffold-collection.ts              # Run once: step1 + step2 + step3
│   ├── activate-collection.ts              # Activation: --slug plano-tx --prefix pla
│   ├── audit-collection-readiness.ts       # Pre-activation gate
│   ├── verify-post-activation.ts           # Post-activation API check
│   └── content-generation/
│       ├── generate-locale-questions.ts    # Generator (already registered by scaffold)
│       ├── locale-configs/
│       │   └── plano-tx.ts                 # Created by scaffold, filled manually
│       └── prompts/
│           └── system-prompt.ts            # Add buildPlanoVoiceGuidance() here
frontend/public/images/collections/
└── plano-tx.jpg                            # Hot air balloon banner image
```

### Pattern 1: Scaffold + Fix Bugs
**What:** Run scaffold-collection.ts, then manually fix two known bugs before seeding.
**When to use:** Always — bugs are consistent across all collections.

Known bugs in scaffold-collection.ts (documented in STATE.md):

1. **Missing trailing comma in collections.ts** — The inserted entry may be missing its trailing comma before the `]` closing bracket. Inspect the insertion point and add the comma if absent.

2. **Step 3 inserts locale entry into type declaration line** — In `generate-locale-questions.ts`, the `supportedLocales` registration inserts into the wrong position (type declaration line rather than object body). Inspect the file after scaffold and verify the `'plano-tx': () => import(...)` line is inside the object body, not appended to the type annotation.

Both bugs are "Rule 1 auto-fixable" — straightforward text edits that are easy to spot and correct.

### Pattern 2: Locale Config Structure (Cambridge Precedent)
**What:** Hand-edit the scaffolded locale config to add Plano-specific topics, distribution, and source URLs.
**When to use:** After scaffold, before seed and generation.

```typescript
// Source: cambridge-ma.ts as structural template
export const planoTxConfig: LocaleConfig = {
  locale: 'plano-tx',
  name: 'Plano, TX',
  externalIdPrefix: 'pla',
  collectionSlug: 'plano-tx',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.3,   // Generate 130, curate to ≥50

  topicCategories: [
    { slug: 'city-government', name: 'City Government', description: '...' },
    { slug: 'civic-history', name: 'Civic History', description: '...' },
    { slug: 'growth-story', name: 'Growth & Development', description: '...' },
    { slug: 'economic-development', name: 'Economic Development', description: '...' },
    { slug: 'community-identity', name: 'Community & Demographics', description: '...' },
  ],

  topicDistribution: {
    'city-government': 30,
    'civic-history': 25,
    'growth-story': 20,
    'economic-development': 15,
    'community-identity': 10,
  },

  sourceUrls: [ /* see Source URLs section below */ ],
};
```

**Note on overshootFactor:** Cambridge used 1.3. Plano should too — generate 130, expect 80-100 to pass quality validation, curate down to ≥50 compelling questions.

### Pattern 3: Voice Guidance Function
**What:** Add `buildPlanoVoiceGuidance()` to `system-prompt.ts`, activated via the `localeSlug === 'plano-tx'` branch in `buildSystemPrompt()`.
**When to use:** Before generation run.

The function pattern follows `buildCambridgeVoiceGuidance()` exactly:
```typescript
// In system-prompt.ts — add this function and wire it into buildSystemPrompt():
${localeSlug === 'plano-tx' ? buildPlanoVoiceGuidance() : ''}

function buildPlanoVoiceGuidance(): string {
  return `
## Plano, TX — Specific Content Guidelines
[See Code Examples section for full recommended content]
`;
}
```

### Pattern 4: Topic Distribution (Claude's Discretion)
**Recommendation:** 5 topics, 100-question target with 1.3 overshoot:

| Topic | Questions | Rationale |
|-------|-----------|-----------|
| `city-government` | 30 | Council-manager structure backbone (matches Cambridge emphasis) |
| `civic-history` | 25 | Balloon Capital, founding, railroads, cotton era — strong durable content |
| `growth-story` | 20 | Cotton farm → Sun Belt boomtown → corporate hub arc |
| `economic-development` | 15 | Toyota, JCPenney, Frito-Lay, Legacy West as civic planning story |
| `community-identity` | 10 | Demographics, Plano ISD, Asian American community as civic fact |

Total: 100 (with 1.3x overshoot = 130 generated, curate to ≥50)

### Anti-Patterns to Avoid
- **Corporate cheerleading:** "Which Fortune 500 company is headquartered at Legacy West?" is fine if civic-angled. "What model year did Toyota introduce in Plano?" is out of scope.
- **Address/phone number answers:** Never use these as correct answers.
- **Balloon trivia without civic hook:** "How many balloons competed in 2023?" is lookup trivia. "Who proclaimed Plano the Balloon Capital of Texas?" (Governor Bill Clements, 1980) is a durable civic fact.
- **Partisan framing:** No party labels, no characterization of policy as liberal/conservative.
- **Collin County confusion:** Know which services are city vs. county. Elections/voter registration/courts = County. Parks/planning/fire = City.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question quality validation | Custom validators | `audit-collection-readiness.ts` | Pipeline already handles quality gates |
| Duplicate detection | Manual de-dup | Built-in `DuplicateDetector` in generator | Already runs per-batch |
| Expiration date tracking | Ad-hoc logic | `expiresAt` field in question schema | Pipeline handles gracefully |
| Collection activation | Manual SQL | `activate-collection.ts --dry-run` first | Dry-run safety + count warnings |
| Post-activation check | Manual API test | `verify-post-activation.ts` | Structured exit codes |
| Voice/style guidance | Inline prompt tweaks | `buildPlanoVoiceGuidance()` in system-prompt.ts | Consistent with all other city collections |

**Key insight:** Every sub-problem in this phase has a pre-built solution in the pipeline. The work is content and configuration, not new tooling.

## Common Pitfalls

### Pitfall 1: Scaffold Bug — Missing Trailing Comma
**What goes wrong:** collections.ts fails TypeScript lint/compilation because the inserted entry is missing its trailing comma.
**Why it happens:** scaffold-collection.ts bug documented in STATE.md — the insertion doesn't always add the trailing comma.
**How to avoid:** After scaffold, open `backend/src/db/seed/collections.ts` and verify the new Plano entry ends with a comma before `];`.
**Warning signs:** TypeScript error mentioning unexpected token or parse failure on collections.ts.

### Pitfall 2: Scaffold Bug — Wrong Insertion Point in generate-locale-questions.ts
**What goes wrong:** The `'plano-tx': () => import(...)` line ends up appended to the type annotation instead of inside the object body, causing a runtime error when the locale is loaded.
**Why it happens:** scaffold-collection.ts step 3 insertion logic places the entry in the wrong location.
**How to avoid:** After scaffold, open `generate-locale-questions.ts`, find `const supportedLocales:`, and verify `'plano-tx': ...` is inside the `{ }` object body.
**Warning signs:** Runtime error like `Unknown locale "plano-tx"` when running generation.

### Pitfall 3: Generating Without Source Documents
**What goes wrong:** Questions have vague sources, fabricated URLs, or incorrect civic facts because the AI had no RAG grounding.
**Why it happens:** Running generate without `--fetch-sources` leaves no source documents in `src/scripts/data/sources/plano-tx/`.
**How to avoid:** Always run with `--fetch-sources` on first generation pass.
**Warning signs:** Quality audit shows source URL failures; explanations cite generic sources.

### Pitfall 4: Seeding Before Fixing Scaffold Bugs
**What goes wrong:** `seed.ts` either fails or inserts malformed data.
**Why it happens:** Running seed.ts before inspecting and fixing the two scaffold bugs.
**How to avoid:** Fix bugs first, then run seed.ts.
**Warning signs:** TypeScript compilation errors or seed.ts errors referencing collections.ts.

### Pitfall 5: Expiring vs. Durable Balance
**What goes wrong:** Collection skews too far toward expiring questions (>60%), creating refresh debt immediately after launch.
**Why it happens:** It's easy to write "Who is the current mayor?" style questions; structural questions require more research.
**How to avoid:** Track expiring question count during curation. Target ~50/50. Durable topics: founding history, government structure, Balloon Capital designation, growth statistics, Plano ISD civic role.
**Warning signs:** More than 30 of 50 curated questions have a non-null `expiresAt`.

### Pitfall 6: Confusing City vs. County Services
**What goes wrong:** Question attributes a Collin County responsibility to the City of Plano or vice versa.
**Why it happens:** Texas two-government layering is easy to conflate.
**How to avoid:** Know the split: Voter registration, elections, courts, property tax billing = Collin County. City planning, fire-rescue, parks, utilities, zoning = City of Plano.
**Warning signs:** Questions about voter registration that attribute it to the City of Plano.

### Pitfall 7: Corporate Questions Without Civic Angle
**What goes wrong:** Questions about Toyota, JCPenney, or Frito-Lay read as brand promotion rather than civic facts.
**Why it happens:** Corporate presence is so prominent in Plano that it's easy to drift from civic framing.
**How to avoid:** Every corporate question must have a civic hook: what the relocation meant for city planning, tax base, jobs, or infrastructure decisions. If removing the company name makes the question meaningless, it's probably out of scope.
**Warning signs:** Questions whose correct answer is a product name, stock ticker, or executive biography.

## Code Examples

Verified patterns from the existing codebase:

### Scaffold Command
```bash
# Run from backend/ directory
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Plano, TX" \
  --slug plano-tx \
  --prefix pla \
  --theme "#B45309"
```

### Locale Config — Recommended Topic Descriptions
```typescript
// Source: cambridge-ma.ts pattern, adapted for Plano
topicCategories: [
  {
    slug: 'city-government',
    name: 'City Government',
    description: 'Plano city government — council-manager structure, Mayor, 7-member City Council, City Manager, departments, and municipal services. Mayor and council serve staggered four-year terms, elected at-large.',
  },
  {
    slug: 'civic-history',
    name: 'Civic History',
    description: 'Plano founding (Peters Colony, 1840s), naming (Spanish "flat", 1852), incorporation (1873), Houston and Texas Central Railway (1872), 1881 fire, Balloon Capital of Texas designation (1980), Interurban Railway Museum.',
  },
  {
    slug: 'growth-story',
    name: 'Growth & Development',
    description: 'Plano\'s arc from cotton-farming community to Sun Belt boomtown — population explosion (17,872 in 1970 to 128,713 in 1990), city planning decisions, infrastructure expansion, land use transitions from farmland to suburbs.',
  },
  {
    slug: 'economic-development',
    name: 'Economic Development',
    description: 'Civic economic development story — Frito-Lay HQ relocation (1985), JCPenney HQ move from NYC (1992), Toyota North American HQ relocation from Torrance CA (2017), Legacy West as city-planned mixed-use development. Civic angles: zoning, economic agreements, city planning decisions.',
  },
  {
    slug: 'community-identity',
    name: 'Community & Demographics',
    description: 'Plano\'s demographic evolution — Asian American and South Asian community (largest Asian ethnic group: Asian Indian), Plano ISD civic role and academic reputation, demographic change as part of city\'s growth story. Represent the whole city.',
  },
],
```

### Source URLs for Locale Config
```typescript
sourceUrls: [
  'https://www.plano.gov/',
  'https://www.plano.gov/27/Government',
  'https://www.plano.gov/1345/Mayor-and-City-Council',
  'https://www.plano.gov/1348/Your-Mayor-and-City-Council-Members',
  'https://www.plano.gov/1317/City-Manager-Mark-Israelson',
  'https://www.plano.gov/1292/City-Management',
  'https://www.plano.gov/1797/City-of-Plano-History',
  'https://www.planotexas.org/192/The-Plano-Story',
  'https://www.planotomorrow.org/148/The-Plano-Story',
  'https://www.planoballoonfest.org/p/about',
  'https://en.wikipedia.org/wiki/Plano,_Texas',
  'https://en.wikipedia.org/wiki/Plano_Balloon_Festival',
  'https://www.tshaonline.org/handbook/entries/plano-tx',
  'https://interurbanrailwaymuseum.org/mission',
  'https://www.collincountytx.gov/Government',
],
```

### Voice Guidance Function — Recommended Content for buildPlanoVoiceGuidance()
```typescript
function buildPlanoVoiceGuidance(): string {
  return `

## Plano, TX — Specific Content Guidelines

### Government Structure (CRITICAL accuracy requirement)

Plano uses the **Council-Manager** form of government:

- **City Manager** (currently Mark Israelson, appointed May 2019) = CHIEF EXECUTIVE. Appointed by City Council. Manages all city departments and day-to-day operations. NOT elected.
- **Mayor** (currently John B. Muns, assumed office May 10, 2021; second term through 2029) = DIRECTLY ELECTED. Presides over City Council. Has one vote on Council like all other members.
- **City Council** = Mayor + 7 council members, ALL elected at-large (no districts). Four-year staggered terms. Two-term limit. Elections in odd-numbered years. Eight council places total.

### Balloon Capital of Texas (key durable topic)

- Governor Bill Clements proclaimed Plano the "Balloon Capital of Texas" in **1980**
- First Plano Balloon Rally: 1980 (50 pilots, 5 balloon launches, no official spectator area)
- In 1981, renamed Plano Hot Air Balloon Festival, relocated to Bob Woodruff Park
- Now held annually each September at Oak Point Park and Nature Preserve
- This is a DURABLE TOPIC — not time-sensitive, highly shareable civic trivia

### Founding and Name Origin (durable history)

- Settled by Peters Colony settlers, 1840s
- Post office established 1852; name "Plano" (Spanish for "flat") suggested by Dr. Henry Dye
- Houston and Texas Central Railway connected Plano to Dallas in **1872** — key growth catalyst
- Officially incorporated **1873** — elected mayor and board of aldermen
- 1881 fire destroyed 52 buildings, temporarily reduced to tent city — recovery by 1888

### Growth Story Calibration

- 1970 population: 17,872
- 1980 population: 72,000+ (more than quadrupled in one decade)
- 1990 population: 128,713 (72 square miles)
- Growth driven by Dallas expansion, Sun Belt migration, infrastructure investment
- City planners "kept up" with sewers, schools, and streets due to flat geography and grid planning

### Corporate Civic Angle (STRICT framing rules)

Mention companies ONLY in civic context:

- Frito-Lay: moved HQ to Plano **1985** → civic significance = thousands of jobs, economic development anchor
- JCPenney: moved HQ from New York City to Plano **1992** → civic significance = one of first major corporate relocations, city becoming business hub
- Toyota: announced North American HQ move from Torrance, CA to Plano; broke ground **January 2015**, operational by 2017 → civic significance = $350 million investment, 100-acre campus, accelerated Legacy West development
- Legacy West: 240-acre mixed-use development triggered by JCPenney's 2011 land development RFP → civic significance = city-planned urban development, brought JP Morgan Chase, Liberty Mutual, FedEx Office

FORBIDDEN: Product names, stock prices, production targets, Elon Musk (not a Plano story), corporate financial performance

### Collin County vs. City of Plano (avoid attribution errors)

Collin County provides: elections/voter registration, courts, property tax billing, vehicle registration, county sheriff, county jail, District Attorney, unincorporated road maintenance.

City of Plano provides: city planning and zoning, fire-rescue, parks and recreation, utilities, library system, animal services, environmental health, building permits.

Do NOT attribute county responsibilities to the City of Plano or vice versa.

### Community Identity (inclusive framing)

Plano's Asian American and South Asian community is the largest Asian ethnic group in the city (31,363 Asian Indian residents per recent census data; total Asian population ~22% of city). Reference as civic facts where they arise naturally — do NOT isolate as a separate identity topic. Examples:
- Cultural organizations, civic participation patterns
- Demographic change as part of the growth story

Plano ISD: serves over 50,000 students, consistently among top-performing Texas districts. Civic role = the school district as an institution shaped Plano's growth story and is a source of civic pride. Focus on the district's civic role, not specific school programs.

### Expiration Dates for Elected Officials

- Mayor John B. Muns (re-elected May 3, 2025): expiresAt "2029-05-01T00:00:00Z"
- City Council members (four-year terms, staggered odd-year elections): set expiresAt based on which "Place" and their election year
  - Places 2, 4, 6, 8 on 2023 cycle → next election 2027: expiresAt "2027-06-01T00:00:00Z"
  - Places 1, 3, 5, 7 on 2025 cycle (including 2026 special election Place 7) → next election 2029: expiresAt "2029-06-01T00:00:00Z"
- City Manager (appointed, no fixed term): expiresAt null — prefer structural questions about the City Manager ROLE over current-officeholder name questions
- For structural questions (e.g., "What form of government does Plano use?"): expiresAt null

### Difficulty Calibration (Plano-specific)

Over-index on EASY questions — the Easy Steps design requires accessible entry points.

EASY: civic-minded person is proud to share the tidbit
- "What Texas designation did Governor Clements give Plano in 1980?" → Balloon Capital of Texas
- "What form of government does Plano use, where an appointed professional manages city operations?" → Council-Manager
- "In what year was Plano officially incorporated?" → 1873

NEVER ask for:
- Addresses or phone numbers
- Internal process details
- Obscure budget line items
- Questions where only a city employee would know the answer

Apply the dinner party test rigorously.
`;
}
```

### Activation Commands (in order)
```bash
# From backend/ directory:

# 1. Pre-activation gate
npx tsx src/scripts/audit-collection-readiness.ts --slug plano-tx --prefix pla

# 2. Dry run first
npx tsx src/scripts/activate-collection.ts --slug plano-tx --prefix pla --dry-run

# 3. Actual activation
npx tsx src/scripts/activate-collection.ts --slug plano-tx --prefix pla

# 4. Post-activation verify
npx tsx src/scripts/verify-post-activation.ts --slugs plano-tx
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded locale list in generator | supportedLocales object + configKeys array | Phase 25+ | scaffold-collection.ts automates registration |
| Manual seed entry creation | scaffold-collection.ts step 1 | Phase 25+ | Automates DB seed row with tier, sortOrder, iconIdentifier |
| No voice guidance per locale | buildXxxVoiceGuidance() functions | Phase 25 (Fremont) | Per-locale accuracy and tone guidance |
| No overshootFactor | overshootFactor: 1.3 in locale config | Phase 43 (Cambridge) | Generate surplus, curate to quality floor |
| Per-phase verify scripts | verify-post-activation.ts (parameterized) | Phase 36+ | Reusable; takes --slugs arg |

**Current pipeline state:** Fully parameterized. No hardcoded phase-specific scripts needed.

## Civic Facts Reference

Key verified facts for planning (HIGH confidence from official sources and Texas State Historical Association):

### Government Structure (HIGH confidence — multiple sources)
- Form: Council-Manager
- Council: Mayor + 7 members = 8 total, all elected at-large
- Terms: 4 years, staggered, two-term limit
- Elections: odd-numbered years (May); Places 2/4/6/8 → 2023 cycle; Places 1/3/5/7 → 2025 cycle
- 2026 special election: Place 7, Shun Thomas won January 31, 2026
- Mayor: John B. Muns, re-elected May 3, 2025, term through 2029 (second and final term)
- City Manager: Mark Israelson, appointed January 2019, started May 2019 (no fixed term)

### History (HIGH confidence — Texas State Historical Association)
- Peters Colony settlers arrive: 1840s
- Post office established (name "Plano" approved): 1852
- Houston and Texas Central Railway: 1872
- Incorporation: 1873
- 1881 fire: destroyed 52 buildings
- Second railroad (St. Louis, Arkansas and Texas Railway): 1888
- Population 1890: 1,200
- Balloon Capital designation (Governor Bill Clements): 1980
- Population explosion: 17,872 (1970) → 72,000+ (1980) → 128,713 (1990)

### Economic Development Milestones (HIGH confidence — multiple sources)
- Frito-Lay HQ relocation to Plano: 1985
- JCPenney HQ relocation from NYC to Plano: 1992
- Toyota North American HQ: announced move from Torrance CA, broke ground January 2015
- Legacy West development: triggered by JCPenney's 2011 RFP; agreement with Karahan/KDC/Columbus 2014

### Demographics (MEDIUM confidence — census data sources)
- Total population: ~285,000+
- Asian population: ~22-24% of city
- Asian Indian specifically: ~31,363 (largest single Asian ethnic group in Plano per census data)
- Median household income: ~$112,253

## Open Questions

1. **City Manager expiration/structural question balance**
   - What we know: Mark Israelson has no fixed term; can be removed by Council at will
   - What's unclear: Whether a "Who is the current City Manager?" question would expire too quickly relative to our refresh cycle
   - Recommendation: Prefer structural questions ("What does Plano's City Manager do?" / "How is Plano's City Manager selected?") over name questions. If a name question is written, set expiresAt null and flag for manual refresh when personnel changes.

2. **Which specific Collin County relationship facts rise to civic significance threshold**
   - What we know: County provides elections/voter registration, courts, property tax billing; city provides planning, fire, parks, utilities
   - What's unclear: Whether the Collin County seat being in McKinney (not Plano, despite Plano being the largest city) is civic-trivia-worthy
   - Recommendation: Include the McKinney-as-county-seat fact as a durable question — it's genuinely surprising and civic-relevant.

3. **Exact council place cycle assignments**
   - What we know: Places 2/4/6/8 on 2023 cycle, Places 1/3/5/7 on 2025 cycle (approximately)
   - What's unclear: Whether all 8 places precisely match this cycle in practice (special elections can shift cycles)
   - Recommendation: Write expiring council-seat questions conservatively; set expiration at 2027 or 2029 depending on cycle, and verify against plano.gov/1348 at generation time.

4. **Banner image sourcing**
   - What we know: Decision is hot air balloon image; must be placed at `frontend/public/images/collections/plano-tx.jpg`
   - What's unclear: Whether a free-to-use, high-quality hot air balloon image is readily available
   - Recommendation: Source from Unsplash, Pexels, or official Plano Balloon Festival imagery (check usage rights); resize/optimize to match other collection banner dimensions.

## Sources

### Primary (HIGH confidence)
- https://www.plano.gov/ — Official Plano city website (government structure, departments)
- https://www.plano.gov/1345/Mayor-and-City-Council — Council-manager structure, council composition
- https://www.plano.gov/1317/City-Manager-Mark-Israelson — City Manager identity and role
- https://ballotpedia.org/Plano,_Texas — Election cycles, term lengths, council composition, demographics
- https://www.tshaonline.org/handbook/entries/plano-tx — Texas State Historical Association, authoritative civic history
- Existing codebase (scaffold-collection.ts, activate-collection.ts, system-prompt.ts, cambridge-ma.ts) — Pipeline patterns verified by reading source

### Secondary (MEDIUM confidence)
- https://en.wikipedia.org/wiki/Plano,_Texas — General civic facts, cross-referenced with TSHA
- https://en.wikipedia.org/wiki/Plano_Balloon_Festival — Balloon festival history, verified against local sources
- https://communityimpact.com/dallas-fort-worth/plano — Corporate HQ milestones, local news
- https://www.planotexas.org/ — Economic development office, Legacy West civic story

### Tertiary (LOW confidence — for content inspiration, verify at generation time)
- https://www.localprofile.com — Local civic news, demographic data
- https://planomagazine.com — Mark Israelson profile, local civic coverage
- https://interurbanrailwaymuseum.org/ — Interurban Railway Museum civic role

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pipeline is mature, all scripts read and verified
- Architecture: HIGH — Cambridge (Phase 49) is direct precedent, same pattern
- Civic facts: HIGH for government structure and history; MEDIUM for demographics and specific council place cycles
- Voice guidance: HIGH — buildCambridgeVoiceGuidance() is the template; Plano equivalent can be written confidently
- Pitfalls: HIGH — scaffold bugs documented in STATE.md and verified in code

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable pipeline; civic facts stable; expiration dates valid through 2027-2029)
