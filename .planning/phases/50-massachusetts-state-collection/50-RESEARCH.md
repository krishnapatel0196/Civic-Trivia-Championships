# Phase 50: Massachusetts State Collection - Research

**Researched:** 2026-03-02
**Domain:** State collection scaffolding, state config authoring, civic content generation, collection activation
**Confidence:** HIGH

## Summary

Phase 50 follows the established STATE collection pattern — the same infrastructure used for Indiana State (Phase ~30) and California State. No new scripts are required. The key files to produce are: (1) a seed entry in `collections.ts`, (2) a state config in `locale-configs/state-configs/massachusetts-state.ts` (NOT the city `locale-configs/` directory), and (3) a `massachusettsStateFeatures` string encoding the MA-specific voice guidance. Generation uses `generate-locale-questions.ts --locale massachusetts-state` (the unified generator auto-discovers state configs from the `state-configs/` subdirectory).

The scaffold-collection.ts script has a critical limitation for state collections: it writes the locale config to `locale-configs/` (the city directory), not `locale-configs/state-configs/`. For state collections, scaffold handles the seed entry and generate-locale-questions.ts registration correctly, but the generated locale config file must be manually moved to `locale-configs/state-configs/massachusetts-state.ts`. Alternatively, the seed entry and registration can be done manually following the Indiana/California pattern.

Massachusetts has genuinely distinctive civic facts that make excellent trivia: the 1780 Constitution (world's oldest written constitution still in use), the legislature called "the General Court" (not "state assembly"), the Governor's Council (an elected 8-member body that confirms judicial appointments — very few states have this), county government abolition, 2006 health reform (Chapter 58), and 2004 Goodridge ruling. The CONTEXT.md accurately identifies all of these and provides strong accuracy guidance. The current Governor (Maura Healey) term ends January 2027 — expiring questions should use `"expiresAt": "2027-01-15T00:00:00Z"`.

**Primary recommendation:** Run scaffold with `--tier state`, move the locale config to `state-configs/`, write the full `massachusettsStateFeatures` string encoding all voice guidance from CONTEXT.md, then generate with the unified command `generate-locale-questions.ts --locale massachusetts-state --fetch-sources`.

## Standard Stack

No new libraries required. All tools are in-project.

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `scaffold-collection.ts` | Automates seed entry + generate-locale-questions.ts registration | Established pattern; use `--tier state` flag |
| `generate-locale-questions.ts` | Unified generator — auto-discovers state configs from `state-configs/` | Has been the correct tool since Indiana/California phases |
| `audit-collection-readiness.ts` | Pre-activation blocking gate (net count >= 50) | Built in Phase 48, reusable for any collection |
| `activate-collection.ts` | Flips `isActive` and promotes draft questions to active | Parameterized for any slug/prefix since Phase 47 |
| `verify-post-activation.ts` | Post-activation API verification | Built in Phase 48, reusable for any collection |

### State Config Discovery (No Registry Required)

`generate-locale-questions.ts` auto-discovers state configs via dynamic import fallback:
```typescript
// From generate-locale-questions.ts loadLocaleConfig():
const stateModule = await import(`./locale-configs/state-configs/${locale}.js`);
// Finds exports matching *Config (LocaleConfig) and *StateFeatures (string)
```

This means dropping `massachusetts-state.ts` in `state-configs/` is sufficient — no registry edits needed beyond what scaffold handles.

**Commands:**
```bash
cd backend

# Step 1: Scaffold (handles seed entry + generator registration)
npx tsx src/scripts/scaffold-collection.ts \
  --name "Massachusetts State" \
  --slug massachusetts-state \
  --prefix mas \
  --theme "#0C2340" \
  --tier state

# IMPORTANT: scaffold writes locale config to locale-configs/massachusetts-state.ts
# Move it to locale-configs/state-configs/massachusetts-state.ts
# Then replace its contents with the full state config (see Code Examples)

# Step 2: Seed to DB
npx tsx src/db/seed/seed.ts

# Step 3: Generate
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale massachusetts-state \
  --fetch-sources
```

## Architecture Patterns

### Recommended Project Structure Changes

```
backend/src/scripts/content-generation/
├── locale-configs/
│   └── state-configs/
│       ├── indiana-state.ts          # EXISTS
│       ├── california-state.ts       # EXISTS
│       └── massachusetts-state.ts   # NEW — state config
│
backend/src/db/seed/
└── collections.ts                   # MODIFIED by scaffold-collection.ts (new seed entry)

backend/src/scripts/content-generation/
└── generate-locale-questions.ts     # MODIFIED by scaffold (new supportedLocales entry for city path)
                                     # NOTE: state-configs/ auto-discovered — no extra edit needed

frontend/public/images/collections/
└── massachusetts-state.jpg          # NEW — banner image (State House gold dome)
```

### Pattern 1: State Config File Structure

**What:** A state config in `state-configs/` exports two named exports: `*Config` (LocaleConfig) and `*StateFeatures` (string). The generator finds them by suffix pattern.

**Config variable name for `massachusetts-state`:** `massachusettsStateConfig` (derived by `deriveConfigVarName('massachusetts-state')` → `massachsuttsState` → actually: parts are `['massachusetts', 'state']` → `massachusettsState`)

**Actual config var name:** `massachusettsStateConfig`
**State features var name:** `massachusettsStateFeatures`

```typescript
// Source: backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts
import type { LocaleConfig } from '../bloomington-in.js';

export const massachusettsStateConfig: LocaleConfig = {
  locale: 'massachusetts-state',
  name: 'Massachusetts',
  externalIdPrefix: 'mas',
  collectionSlug: 'massachusetts-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    // Government Structure (~40%)
    { slug: 'general-court', name: 'General Court', description: '...' },
    { slug: 'governor-executive', name: 'Governor & Executive Branch', description: '...' },
    { slug: 'governors-council', name: "Governor's Council", description: '...' },
    { slug: 'state-courts', name: 'State Courts & Judiciary', description: '...' },
    // Civic Processes (~30%)
    { slug: 'elections-voting', name: 'Elections & Voting', description: '...' },
    { slug: 'civic-policy', name: 'Civic Policy & Home Rule', description: '...' },
    // Broader Civics (~30%)
    { slug: 'civic-history', name: 'Massachusetts Civic History', description: '...' },
    { slug: 'state-constitution', name: 'Massachusetts Constitution', description: '...' },
  ],

  topicDistribution: {
    'general-court': 15,
    'governor-executive': 12,
    'governors-council': 8,
    'state-courts': 10,
    'elections-voting': 15,
    'civic-policy': 10,
    'civic-history': 15,
    'state-constitution': 15,
  },

  sourceUrls: [ /* see Sources section */ ],
};

export const massachusettsStateFeatures = `...`; // See Code Examples
```

### Pattern 2: State System Prompt Dispatch

**What:** `generate-locale-questions.ts` checks if `stateFeatures` is present. If so, it calls `buildStateSystemPrompt(config.name, stateFeatures, batchTopicDistribution)`. The state system prompt already exists in `state-system-prompt.ts` — no new prompt builder needed. Massachusetts-specific guidance lives entirely in the `massachusettsStateFeatures` string inside the config file.

**No changes to `system-prompt.ts` required.** This is the key difference from city collections (Cambridge needed a `buildCambridgeVoiceGuidance()` function in `system-prompt.ts`). State collections embed their voice guidance in the `*StateFeatures` export.

### Pattern 3: Generation Command

```bash
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale massachusetts-state \
  --fetch-sources
```

The `--fetch-sources` flag fetches all URLs in `sourceUrls` before generation. For the Massachusetts state collection, authoritative sources include `malegislature.gov`, `mass.gov`, and `sec.state.ma.us`.

### Pattern 4: Full Activation Pipeline

```bash
cd backend

# Pre-activation audit (must pass before activation)
npx tsx src/scripts/audit-collection-readiness.ts --slug massachusetts-state --prefix mas
# Exit 0 = READY (net >= 50)
# Exit 1 = BLOCKED (net < 50)

# Dry run activation check
npx tsx src/scripts/activate-collection.ts --slug massachusetts-state --prefix mas --dry-run

# Activate for real
npx tsx src/scripts/activate-collection.ts --slug massachusetts-state --prefix mas

# Post-activation verification
npx tsx src/scripts/verify-post-activation.ts \
  --slugs massachusetts-state \
  --api-url https://civic-trivia-backend.onrender.com
```

### Pattern 5: Banner Image

**What:** `CollectionCard.tsx` reads `/images/collections/${collection.slug}.jpg`. File must exist at `frontend/public/images/collections/massachusetts-state.jpg` before activation.

**Subject:** Massachusetts State House (24 Beacon Street, Boston). The gold dome is the defining civic symbol. Same pattern as Indiana State and California State (state capitol building). The dome was gilded with 23k gold in 1997 (Paul Revere's company originally covered it in copper in 1802). Designed by Charles Bulfinch, completed 1798, Federal architecture style, National Historic Landmark.

**Image sourcing:** Wikimedia Commons has many freely licensed photographs of the Massachusetts State House with its gold dome. The National Park Service also documents it. Prefer a landscape-oriented photo showing the full building with dome visible.

### Pattern 6: Frontend Category Routing (No Changes Required)

```typescript
// Source: frontend/src/features/collections/components/CollectionPicker.tsx
function getCategory(slug: string): 'local' | 'state' | 'federal' {
  if (slug === 'federal') return 'federal';
  if (slug.endsWith('-state')) return 'state'; // 'massachusetts-state' → 'state'
  return 'local';
}
// massachusetts-state is automatically routed to the 'State' section
```

### Anti-Patterns to Avoid

- **Don't put the state config in `locale-configs/` (city directory):** scaffold-collection.ts writes there by default. Move to `locale-configs/state-configs/massachusetts-state.ts`.
- **Don't add Massachusetts-specific guidance to `system-prompt.ts`:** Unlike city collections, state collections embed voice guidance in the `*StateFeatures` export, passed to `buildStateSystemPrompt()`. No new function in `system-prompt.ts` is needed.
- **Don't use `generate-state-questions.ts`:** That script is deprecated and has a hardcoded registry. The unified `generate-locale-questions.ts` is the correct tool.
- **Don't call the legislature "the state legislature," "state assembly," or "state congress":** It is **"the General Court."** Questions or prompts using any other name will produce factually wrong content.
- **Don't include Boston city facts:** Boston city government is out of scope. The State House and General Court are state-level. The Boston Marathon is not civic trivia for this collection.
- **Don't include Federal facts:** Massachusetts U.S. Senators and Representatives are federal subjects, not state subjects. The collection covers state government.
- **Don't include private companies:** Raytheon, Fidelity, General Electric are explicitly out of scope per CONTEXT.md.
- **Don't describe the 1780 Constitution as "one of the oldest":** It is the world's oldest functioning written constitution still in use — the specific superlative matters for factual accuracy.
- **Don't skip `--tier state` on scaffold:** Without it, the seed entry gets `tier: 'city'`, breaking the frontend category routing (it would appear in "Local" instead of "State").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collection DB entry | Manual edit to collections.ts | `scaffold-collection.ts --tier state` | Handles sort order auto-detection, iconIdentifier='state', tier field |
| State config registration | Manual edit to generate-locale-questions.ts | Scaffold handles the `supportedLocales` + `configKeys` edits | Auto-registration prevents typos in import path |
| Pre-activation readiness check | Custom count script | `audit-collection-readiness.ts --slug massachusetts-state --prefix mas` | Counts draft+active, subtracts expiring, blocks if net < 50 |
| Post-activation verification | Manual API check | `verify-post-activation.ts --slugs massachusetts-state` | Checks collection present in API with questionCount >= 50 |
| Collection activation | Manual DB UPDATE | `activate-collection.ts --slug massachusetts-state --prefix mas` | Handles collection isActive flip + all matching draft questions |
| State House banner image | Original photo creation | Source from Wikimedia Commons (CC-licensed) or NPS (public domain) | High-quality civic landmark photos freely available |

**Key insight:** The full state collection pipeline (scaffold → generate → audit → activate → verify) is proven infrastructure from Indiana State and California State. Phase 50 is purely content work — the only new code is the state config file.

## Common Pitfalls

### Pitfall 1: Scaffold Places Config in Wrong Directory

**What goes wrong:** After running scaffold-collection.ts, the locale config lands in `locale-configs/massachusetts-state.ts` (city directory). The generator's auto-discovery only looks in `locale-configs/state-configs/`. Trying to generate will fail with "Unknown locale massachusetts-state."

**Why it happens:** scaffold-collection.ts's `step2CreateLocaleConfig` always writes to `locale-configs/` — it has no awareness of state vs. city directory convention.

**How to avoid:** After running scaffold, immediately move the generated file:
```bash
mv backend/src/scripts/content-generation/locale-configs/massachusetts-state.ts \
   backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts
```
Then replace the stub content with the full state config (LocaleConfig + massachusettsStateFeatures).

**Warning signs:** `generate-locale-questions.ts` errors with "Unknown locale 'massachusetts-state'" even though scaffold ran successfully.

### Pitfall 2: Calling the Legislature by the Wrong Name

**What goes wrong:** Generated questions refer to "the Massachusetts state legislature," "state assembly," or similar. Players who know Massachusetts will find this immediately wrong.

**Why it happens:** AI generation defaults to generic US state legislature terminology. Without explicit instruction, it won't use "the General Court."

**How to avoid:** The `massachusettsStateFeatures` string must prominently state in the first paragraph: "The Massachusetts legislature is called **the General Court** — never refer to it as 'state legislature,' 'state assembly,' or 'state congress'." The topic category slug `general-court` (not `legislature`) reinforces this.

**Warning signs:** Any question with "state legislature," "state assembly," or "state congress" as subject — archive these immediately.

### Pitfall 3: Omitting the Governor's Council

**What goes wrong:** The Governor's Council doesn't appear in any questions despite being one of MA's most distinctive civic structures.

**Why it happens:** AI generation focuses on the most common state government structures (legislature, governor, courts). The Governor's Council is unusual enough that it requires explicit prompting.

**How to avoid:** Give `governors-council` its own topic category with an allocation of 8 questions. The stateFeatures must explain it: "Massachusetts has a **Governor's Executive Council** (Governor's Council) — an 8-member elected body (plus Lt. Governor as ex officio member) that confirms gubernatorial appointments to the judiciary and other positions. Only a handful of states have such a body."

**Warning signs:** Zero questions mentioning the Governor's Council after generation.

### Pitfall 4: Expiration Date Errors for Current Officials

**What goes wrong:** Questions about current officials (Governor, AG, Treasurer) are generated without `expiresAt` or with an incorrect date.

**Why it happens:** AI may not know when terms end, or may default to `null` for all questions.

**How to avoid:** The `massachusettsStateFeatures` must specify expiration dates:
- Governor Maura Healey: term began January 2023, 4-year term → `"expiresAt": "2027-01-15T00:00:00Z"`
- Attorney General Andrea Campbell: term began January 2023, 4-year term → `"expiresAt": "2027-01-15T00:00:00Z"`
- Treasurer Deb Goldberg: same → `"expiresAt": "2027-01-15T00:00:00Z"`
- General Court members: 2-year terms, elected November 2024 → `"expiresAt": "2027-01-01T00:00:00Z"`
- Governor's Councillors: 2-year terms, elected November 2024 → `"expiresAt": "2027-01-01T00:00:00Z"`
- Structural/historical questions: `"expiresAt": null`

**Note on 2026 elections:** Governor's Council elections are scheduled for November 2026. Any current Councillors named in questions should use `"expiresAt": "2027-01-15T00:00:00Z"`. The Governor's race is also November 2026.

**Warning signs:** Questions about current officials with `expiresAt: null`.

### Pitfall 5: Boston/State Conflation

**What goes wrong:** Questions attribute Boston city actions to Massachusetts state government, or vice versa. E.g., "The Massachusetts city council approved..." when the Boston City Council is a city body.

**Why it happens:** Boston is both the state capital and Massachusetts's largest city. The State House is in Boston. This geographical overlap creates confusion.

**How to avoid:** The stateFeatures must explicitly state: "Focus on state government and state history. Boston city facts (Boston City Council, Boston Mayor, Boston city departments) are NOT Massachusetts state facts. The State House is in Boston but is a state institution."

**Warning signs:** Questions mentioning "Boston City Council," "Boston Mayor," or Boston city budgets as state facts.

### Pitfall 6: County Government Confusion

**What goes wrong:** A question treats Middlesex County or Hampshire County as if they have functioning county government with elected county executives.

**Why it happens:** In most US states, counties have active elected governments. Massachusetts abolished most county governments in the late 1990s (Chapter 34B).

**How to avoid:** The stateFeatures must note: "Massachusetts abolished most county governments in the 1990s — counties exist as geographic/judicial districts but have no elected county government. The sheriff and register of deeds remain as elected officials but are now state employees. The specific abolished counties include Middlesex, Hampden, Worcester, Hampshire, Essex, and Berkshire."

**Warning signs:** Questions assuming county commissioners or county executives exist in Massachusetts.

### Pitfall 7: MCAS Graduation Requirement Now Changed

**What goes wrong:** A question states "Students must pass the MCAS to graduate from high school in Massachusetts" — this was true until recently but is no longer accurate.

**Why it happens:** MCAS as a graduation requirement was a long-standing Massachusetts policy. In late 2025, the state moved away from requiring it for graduation.

**How to avoid:** Frame MCAS questions around what it IS (the Massachusetts Comprehensive Assessment System, a statewide standardized test) rather than the graduation requirement angle. Or set `expiresAt` appropriately if writing about specific requirements. WBUR reporting confirms the change (search results show December 2025 WBUR article on this).

**Warning signs:** Questions asserting MCAS is currently required for graduation.

### Pitfall 8: 1780 Constitution Framing

**What goes wrong:** A question says the Massachusetts Constitution of 1780 is "one of the oldest written constitutions" rather than THE oldest functioning one still in use.

**Why it happens:** Generic hedging from the AI; overcautious framing.

**How to avoid:** The stateFeatures must state explicitly: "The Massachusetts Constitution of 1780 is the world's oldest functioning written constitution still in use. This superlative is accurate and documented — use it precisely, not as 'one of the oldest.'" The mass.gov official guide uses this framing.

**Warning signs:** Questions saying "one of the oldest" or "among the first."

### Pitfall 9: Scaffold Missing `--tier state`

**What goes wrong:** Running scaffold without `--tier state` produces a seed entry with `tier: 'city'`. The frontend then routes `massachusetts-state` to the "Local" section instead of the "State" section.

**Why it happens:** The scaffold default tier is `'city'`.

**How to avoid:** Always include `--tier state` in the scaffold command. After seeding, verify the DB row has `tier = 'state'`.

**Warning signs:** Massachusetts State appears in the "Local" section of the collection picker alongside city collections.

## Code Examples

### Massachusetts State Config (massachusetts-state.ts)

```typescript
// Source: backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts
// Pattern: follows indiana-state.ts and california-state.ts exactly

import type { LocaleConfig } from '../bloomington-in.js';

export const massachusettsStateConfig: LocaleConfig = {
  locale: 'massachusetts-state',
  name: 'Massachusetts',
  externalIdPrefix: 'mas',
  collectionSlug: 'massachusetts-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    // Government Structure (~40%)
    {
      slug: 'general-court',
      name: 'General Court',
      description: 'The Massachusetts General Court — the official name of the state legislature. Bicameral: 40-member Senate and 160-member House of Representatives. Composition, powers, how bills become law, legislative sessions, leadership.',
    },
    {
      slug: 'governor-executive',
      name: 'Governor & Executive Branch',
      description: 'Governor, Lieutenant Governor, and other elected constitutional officers. Term limits, executive powers, elected statewide offices (AG, Treasurer, Auditor, Secretary of State, Attorney General).',
    },
    {
      slug: 'governors-council',
      name: "Governor's Council",
      description: "The Massachusetts Governor's Executive Council — an 8-member elected body (plus Lt. Governor as ex officio) that confirms gubernatorial appointments to the judiciary and other positions. One of the few such bodies remaining in any US state.",
    },
    {
      slug: 'state-courts',
      name: 'State Courts & Judiciary',
      description: 'Massachusetts court system: Supreme Judicial Court (SJC), Appeals Court, Superior Court, District Courts. Judicial selection process, landmark SJC decisions, relationship to federal courts.',
    },
    // Civic Processes (~30%)
    {
      slug: 'elections-voting',
      name: 'Elections & Voting',
      description: 'State election procedures, voter registration, election administration, legislative and statewide election cycles, ballot questions.',
    },
    {
      slug: 'civic-policy',
      name: 'Civic Policy & Home Rule',
      description: 'Major state civic policy milestones (2006 Chapter 58 health reform, clean energy policy), home rule structure (1966 amendment), relationship between state and municipalities.',
    },
    // Broader Civics (~30%)
    {
      slug: 'civic-history',
      name: 'Massachusetts Civic History',
      description: 'Massachusetts civic history: Mayflower Compact (1620), colonial government, Shays\' Rebellion (1786–1787), abolitionism (William Lloyd Garrison, Massachusetts Anti-Slavery Society), women\'s suffrage, landmark SJC decisions with civic significance (Goodridge v. Dept. of Public Health, 2003).',
    },
    {
      slug: 'state-constitution',
      name: 'Massachusetts Constitution',
      description: 'The Massachusetts Constitution of 1780 — the world\'s oldest functioning written constitution still in use, drafted primarily by John Adams. Key provisions, the Declaration of Rights, constitutional amendment process.',
    },
  ],

  topicDistribution: {
    // Government Structure (40 questions)
    'general-court': 15,
    'governor-executive': 12,
    'governors-council': 8,
    'state-courts': 5,
    // Civic Processes (30 questions)
    'elections-voting': 15,
    'civic-policy': 15,
    // Broader Civics (30 questions)
    'civic-history': 15,
    'state-constitution': 15,
  },

  sourceUrls: [
    // Massachusetts state government
    'https://www.mass.gov',
    'https://www.mass.gov/topics/state-government',
    // Massachusetts General Court (legislature)
    'https://malegislature.gov',
    'https://malegislature.gov/Legislators/Members/Senate',
    'https://malegislature.gov/Legislators/Members/House',
    // Governor
    'https://www.mass.gov/orgs/governor-maura-healey-and-lt-governor-kim-driscoll',
    // Governor's Council
    'https://www.mass.gov/orgs/governors-council',
    // Secretary of State
    'https://www.sec.state.ma.us',
    // Massachusetts Constitution
    'https://www.mass.gov/guides/john-adams-the-massachusetts-constitution',
    'https://www.mass.gov/info-details/researching-the-history-of-amendments-to-the-massachusetts-constitution',
    // State courts
    'https://www.mass.gov/orgs/massachusetts-court-system',
    // Elections
    'https://www.sec.state.ma.us/ele',
    // Historical sources (supplementary)
    'https://en.wikipedia.org/wiki/Massachusetts',
    'https://en.wikipedia.org/wiki/Massachusetts_General_Court',
    'https://en.wikipedia.org/wiki/Constitution_of_Massachusetts',
    'https://en.wikipedia.org/wiki/Massachusetts_Governor%27s_Council',
    // Journalism
    'https://www.wbur.org',
  ],
};

export const massachusettsStateFeatures = `
Massachusetts has several unique features in its state government that MUST be accurately represented:

**CRITICAL: THE LEGISLATURE IS CALLED "THE GENERAL COURT"**
- NEVER call it "the state legislature," "state assembly," "state congress," or any other generic name
- The official name is the **Massachusetts General Court** — this is one of the most distinctive facts about Massachusetts civic government
- Bicameral: 40 Senate members (Senate districts) and 160 House of Representatives members
- Two-year sessions; members serve 2-year terms
- Senate President: Karen Spilka. Speaker of the House: Ron Mariano (as of 2025–2026 session)
- Legislative elections November 2024 → terms end January 2027

**GOVERNOR'S COUNCIL (GOVERNOR'S EXECUTIVE COUNCIL)**
- Massachusetts has an **8-member elected Governor's Council** (plus Lt. Governor as ex officio member)
- The Council is elected by district every two years
- Its primary civic role: recording advice and consent on gubernatorial appointments to the judiciary, Parole Board, Appellate Tax Board, and other positions; also warrants for the state treasury and pardons/commutations
- This is one of the only such bodies remaining in any US state — it is genuinely distinctive and surprising civic trivia
- Governor's Council elections: November 2026 (current Councillors' terms end January 2027)

**CURRENT ELECTED OFFICIALS AND EXPIRATION DATES**
- Governor: Maura Healey (assumed office January 2023, 4-year term) → expiresAt: "2027-01-15T00:00:00Z"
- Lieutenant Governor: Kim Driscoll → expiresAt: "2027-01-15T00:00:00Z"
- Attorney General: Andrea Campbell (assumed office January 2023) → expiresAt: "2027-01-15T00:00:00Z"
- Treasurer: Deb Goldberg → expiresAt: "2027-01-15T00:00:00Z"
- Secretary of State: William Galvin (long-serving; term ends January 2027) → expiresAt: "2027-01-15T00:00:00Z"
- State Senate/House members: terms end January 2027 → expiresAt: "2027-01-01T00:00:00Z"
- Structural/historical questions: expiresAt: null
- Target roughly 50% expiring, 50% durable questions

**MASSACHUSETTS CONSTITUTION OF 1780**
- Drafted primarily by John Adams
- Ratified June 15, 1780; effective October 25, 1780
- The world's OLDEST FUNCTIONING WRITTEN CONSTITUTION still in use — use this precise superlative, not "one of the oldest"
- Served as a model for the US Constitution (1787)
- Includes a Declaration of Rights (predating the Bill of Rights)
- The constitutional amendment process requires two consecutive General Court sessions plus voter approval

**COUNTY GOVERNMENT ABOLITION**
- Massachusetts abolished most county governments in the late 1990s under Chapter 34B (Mass. General Laws)
- Abolished counties include: Middlesex, Hampden, Worcester, Hampshire, Essex, Berkshire (six of 14)
- Counties now function as geographic/judicial districts, NOT as units of government
- Sheriffs remain as elected officials but are now state employees (e.g., Middlesex Sheriff became a state agency in 1997)
- Do NOT write questions implying counties have elected executives or county commissions

**CIVIC POLICY MILESTONES (non-partisan framing required)**
- **2006 Chapter 58 Health Reform:** Massachusetts was the first state to pass near-universal health care coverage. Signed by Governor Mitt Romney on April 12, 2006. Created the Health Connector. Became model for the 2010 ACA. Frame as civic milestone — what it DID (near-universal coverage, employer requirements, state insurance exchange), not which party supported or opposed it.
- **2004 Goodridge v. Department of Public Health:** The Massachusetts Supreme Judicial Court (SJC) ruled that the Massachusetts Constitution requires the state to recognize same-sex marriage. Decision: November 18, 2003; first licenses issued May 17, 2004. Massachusetts was the FIRST US state to legally recognize same-sex marriage. Frame structurally — what the SJC decided and why it was constitutionally grounded.
- **MCAS:** The Massachusetts Comprehensive Assessment System is the state's standardized test. Note: as of late 2025, MCAS is no longer required for high school graduation (this changed). Frame questions carefully — "what does MCAS stand for?" and "what does MCAS measure?" are safe; avoid asserting it is a graduation requirement.
- **Clean energy:** Massachusetts has enacted significant renewable energy legislation (offshore wind, clean energy standards). Frame civically: who sets energy policy, what agencies govern it, not partisan outcomes.

**HOME RULE STRUCTURE**
- Massachusetts granted home rule authority to cities and towns via a 1966 constitutional amendment (effective 1967)
- Municipalities may self-govern on matters not inconsistent with state law
- State legislature cannot enact special laws affecting a single municipality without that community's consent (with narrow exceptions)

**SHAYS' REBELLION (1786–1787)**
- Armed uprising by Western Massachusetts farmers protesting debt and tax collection
- Led by Daniel Shays, a Revolutionary War veteran
- Rebels closed courts, liberated debtors from jail, attempted to seize the Springfield Armory
- Significance: accelerated calls to reform the Articles of Confederation, contributing to the 1787 Constitutional Convention
- The Massachusetts legislature subsequently eased debtor laws as a result

**CIVIC HISTORY ANCHORS**
- Mayflower Compact (1620): one of the earliest frameworks for self-governance in North America
- Plymouth Colony (1620) and Massachusetts Bay Colony (1630) — two distinct original settlements
- Abolitionism: Massachusetts was a center of the abolitionist movement; William Lloyd Garrison founded The Liberator newspaper in Boston (1831); Massachusetts Anti-Slavery Society (1835)
- Women's suffrage: Massachusetts ratified the 19th Amendment in 1920; key organizing history

**WHAT TO AVOID**
- Don't write questions about Federal-level subjects: Massachusetts US Senators (Senators Warren and Markey are federal subjects, not state subjects)
- Don't write questions about Boston city government: Boston City Council, Boston Mayor are city — not state — subjects
- Don't write questions about private companies: Raytheon, Fidelity, General Electric are out of scope
- Don't write questions about Boston sports teams or Harvard/MIT as institutions
- Don't write questions about current-year specific events — stick to structural facts and established civic history
- Apply the dinner party test: "Is this a surprising, shareable civic tidbit?" PASS examples: "What's the official name of the Massachusetts state legislature?" FAIL examples: "What is the budget for the Massachusetts Department of Revenue?"
`;
```

### Scaffold Command

```bash
# Source: backend/src/scripts/scaffold-collection.ts
cd backend

# Run scaffold with --tier state (CRITICAL — without this, tier defaults to 'city')
npx tsx src/scripts/scaffold-collection.ts \
  --name "Massachusetts State" \
  --slug massachusetts-state \
  --prefix mas \
  --theme "#0C2340" \
  --tier state

# IMMEDIATELY move the generated locale config from city to state-configs directory:
# (scaffold writes to locale-configs/massachusetts-state.ts)
# Move to locale-configs/state-configs/massachusetts-state.ts
# Then replace the stub with the full config shown above

# Seed to DB (after config is in the right place)
npx tsx src/db/seed/seed.ts
```

### Seed Entry (what scaffold inserts into collections.ts)

```typescript
// What scaffold-collection.ts inserts into backend/src/db/seed/collections.ts:
{
  name: 'Massachusetts State',
  slug: 'massachusetts-state',
  description: 'Test your Massachusetts State civic knowledge!',
  localeCode: 'en-US',
  localeName: 'Massachusetts State',
  iconIdentifier: 'state',
  themeColor: '#0C2340',
  tier: 'state',
  isActive: false,
  sortOrder: 9  // auto-detected as max+1
},
```

### Pre-Activation Audit

```bash
# Source: backend/src/scripts/audit-collection-readiness.ts
cd backend
npx tsx src/scripts/audit-collection-readiness.ts --slug massachusetts-state --prefix mas
# Exit 0 = READY (net count >= 50)
# Exit 1 = BLOCKED (net count < 50)
```

### Activation and Verification

```bash
# Source: backend/src/scripts/activate-collection.ts
cd backend
npx tsx src/scripts/activate-collection.ts --slug massachusetts-state --prefix mas --dry-run
npx tsx src/scripts/activate-collection.ts --slug massachusetts-state --prefix mas

# Source: backend/src/scripts/verify-post-activation.ts
npx tsx src/scripts/verify-post-activation.ts \
  --slugs massachusetts-state \
  --api-url https://civic-trivia-backend.onrender.com
```

## Massachusetts Civic Facts Reference (HIGH Confidence)

Verified facts for question authoring and voice guidance. All verified from official sources or multiple credible sources.

### Government Structure
- **Legislature name:** The General Court (NEVER "state legislature," "state assembly," etc.)
- **Senate:** 40 members; Senate President Karen Spilka (as of 2025–2026 session)
- **House:** 160 members; Speaker Ron Mariano (as of 2025–2026 session)
- **Total General Court members:** 200
- **Governor's Council:** 8 elected members (by district) + Lt. Governor (ex officio) = 9 total; elected every 2 years
- **Governor's Council role:** Confirms gubernatorial appointments to judiciary, Parole Board, other positions; also warrants for state treasury, pardons, commutations
- **Governor:** Maura Healey (assumed January 2023; running for 2nd term in November 2026)
- **Lt. Governor:** Kim Driscoll
- **Attorney General:** Andrea Campbell
- **Treasurer:** Deb Goldberg
- **Secretary of State:** William Galvin

### Massachusetts Constitution
- **Year:** 1780 (ratified June 15, effective October 25)
- **Author:** Primarily John Adams
- **Status:** World's oldest functioning written constitution still in use (verified by mass.gov and multiple authoritative sources)
- **Includes:** Declaration of Rights (predating the federal Bill of Rights)
- **Amendment process:** Two consecutive General Court sessions + voter approval

### County Government
- **Abolished counties:** Middlesex, Hampden, Worcester, Hampshire, Essex, Berkshire (6 of 14)
- **Middlesex:** Abolished 1997 (Chapter 48 of Acts of 1997); Sheriff became state employee
- **Hampshire:** Abolished 1998 (Chapter 34B); Sheriff became state employee
- **Remaining structure:** Counties as geographic/judicial districts; sheriffs and registers of deeds remain as elected officials (but are state employees for abolished counties)

### Civic Policy Milestones
- **Chapter 58 (2006):** Signed April 12, 2006 by Governor Romney; first state near-universal health care; model for ACA 2010
- **Goodridge (2003/2004):** SJC decision November 18, 2003; first same-sex marriage licenses issued May 17, 2004; Massachusetts was first US state
- **Shays' Rebellion:** 1786–1787; Western Massachusetts; accelerated Articles of Confederation reform; led to 1787 Constitutional Convention

### State House
- **Address:** 24 Beacon Street, Boston
- **Architect:** Charles Bulfinch
- **Completed:** January 1798
- **Dome:** Originally wood; covered in copper by Paul Revere's company (1802); gilded with 23k gold (1997, $1.5 million)
- **Significance:** National Historic Landmark; Federal architecture style
- **Pine cone:** The dome is topped with a gilded pine cone (symbolizing lumber industry importance)

### Home Rule
- **Adopted:** 1966 constitutional amendment (effective 1967)
- **Key provision:** Municipalities may self-govern on matters not inconsistent with state law; state legislature cannot enact special laws affecting a single municipality without that municipality's consent

## Theme Color Recommendation

**Recommendation: `#0C2340` (Massachusetts navy — deep navy blue)**

Rationale:
- The Massachusetts state flag features a blue field; naval blue is deeply associated with Massachusetts civic identity
- Existing colors to avoid: `#1E3A8A` (federal deep blue), `#991B1B` (Bloomington red), `#047857` (Fremont green), `#0369A1` (LA ocean blue), `#92400E` (CA State golden brown), `#1B4332` (Norwich deep forest green), `#1E3A5F` (Cambridge navy), `#1E3A8A` (Indiana State)
- `#0C2340` is perceptibly darker/more saturated than `#1E3A5F` (Cambridge) and distinctly different from `#1E3A8A` (federal/Indiana State)
- Passes WCAG AA contrast ratio for white text
- Evokes Massachusetts civic tradition without party associations

**Alternative if too close to Cambridge (`#1E3A5F`):** `#7B2D34` (Massachusetts maroon — distinct warm tone, evokes the state seal's red colors, clearly different from all existing palette entries including Bloomington's `#991B1B`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual 3-file setup for new collections | `scaffold-collection.ts` automates seed, locale config, generator registration | Phase 47 | Run scaffold FIRST; don't manually edit these files (except moving state config to correct directory) |
| Separate state generator script | `generate-locale-questions.ts --locale {state-slug}` unified command | Phase 33 area | `generate-state-questions.ts` is explicitly deprecated; use unified command only |
| Hardcoded state config registry | Auto-discovery from `state-configs/` directory via dynamic import | Phase 33 area | Drop file in `state-configs/`, it works; no registry edits needed |
| Separate audit script per collection | `audit-collection-readiness.ts --slug X --prefix Y` reusable for any collection | Phase 48 | No new audit script needed |
| `civic_trivia.` schema | `trivia.` schema via Drizzle ORM | Phase 40 | All scripts must use Drizzle ORM from `../../db/schema.js` |

**Deprecated/outdated:**
- `generate-state-questions.ts`: Prints a deprecation warning and points to unified command. DO NOT USE.
- Any script using `civic_trivia.` schema prefix in SQL — DO NOT USE.
- `activate-collections.ts` (hardcoded for old collections) — use `activate-collection.ts --slug X --prefix Y`.

## Open Questions

1. **Scaffold behavior with `--tier state` and locale config placement**
   - What we know: scaffold always writes the locale config to `locale-configs/{slug}.ts` (not `state-configs/`). It correctly updates `supportedLocales` in generate-locale-questions.ts, which adds an import from `locale-configs/{slug}.js`. But the state auto-discovery path looks for `locale-configs/state-configs/{slug}.js`. The registration in supportedLocales is for the city path; the state auto-discovery uses a different code path.
   - What's unclear: Whether the generate-locale-questions.ts registration by scaffold (in `supportedLocales`) conflicts with the auto-discovery (which tries `state-configs/`). Looking at the code: city locales go through `supportedLocales` lookup; state locales fall through to auto-discovery when not found in `supportedLocales`. If scaffold adds `massachusetts-state` to `supportedLocales`, it will try to import from `locale-configs/massachusetts-state.js` — which won't exist after the file is moved to `state-configs/`. This would break generation.
   - Recommendation: After scaffold runs and the config is moved to `state-configs/`, also remove the `massachusetts-state` entry from `supportedLocales` in generate-locale-questions.ts (it was added by scaffold but points to the wrong path). The state auto-discovery will then handle it correctly. OR: Don't use scaffold for the config/registration steps at all — only use scaffold for the seed entry, then manually create the state config and skip the generate-locale-questions.ts registration (rely on auto-discovery).
   - **Safest approach:** Run scaffold for seed entry only, then manually create the state config file in `state-configs/`. After scaffold runs, revert the change to generate-locale-questions.ts (undo the `supportedLocales` entry scaffold added — it points to wrong path). The state config's auto-discovery handles registration.

2. **Whether to name the topic `governors-council` vs. `state-courts`**
   - What we know: Indiana State and California State use `state-courts` as a topic. For Massachusetts, the Governor's Council is so distinctive that it deserves its own topic. However, giving it 8 questions and the courts only 5 inverts the typical weighting.
   - Recommendation: Keep both `governors-council` (8 questions) and `state-courts` (5 questions) as separate topics. The Governor's Council IS the single most distinctive Massachusetts government structure — it warrants its own category. Courts can be a smaller category since they are less distinctive nationally.

3. **MCAS framing after 2025 graduation requirement change**
   - What we know: Massachusetts replaced the MCAS graduation requirement in late 2025 (WBUR reported December 2025). MCAS still exists as a testing program.
   - Recommendation: Questions about MCAS should focus on what it IS (Massachusetts Comprehensive Assessment System, statewide assessment), not the graduation requirement angle. If any generated question mentions "required to graduate," archive it. The stateFeatures should note: "MCAS is the statewide test, but it is no longer required for high school graduation (policy changed late 2025) — frame questions around what MCAS measures, not the graduation requirement."

## Sources

### Primary (HIGH confidence)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — full source read; state auto-discovery via `state-configs/` confirmed; `stateFeatures` presence triggers `buildStateSystemPrompt()`
- `backend/src/scripts/content-generation/locale-configs/state-configs/indiana-state.ts` — model file read; `LocaleConfig` + `*StateFeatures` export pattern confirmed
- `backend/src/scripts/content-generation/locale-configs/state-configs/california-state.ts` — model file read; identical pattern confirmed
- `backend/src/scripts/scaffold-collection.ts` — full source read; `--tier state` support confirmed; locale config placement issue in `locale-configs/` confirmed
- `backend/src/scripts/activate-collection.ts` — activation logic confirmed
- `backend/src/scripts/audit-collection-readiness.ts` — readiness audit confirmed
- `backend/src/scripts/verify-post-activation.ts` — post-activation verification confirmed
- `backend/src/db/seed/collections.ts` — existing collections and theme colors confirmed; `mas` prefix not in use
- `frontend/src/features/collections/components/CollectionPicker.tsx` — `getCategory()` routes `massachusetts-state` to `'state'` via `slug.endsWith('-state')`
- `backend/src/scripts/content-generation/prompts/state-system-prompt.ts` — state prompt builder read; `stateFeatures` injection point confirmed

### Secondary (MEDIUM confidence)
- WebSearch: Massachusetts General Court composition (40 Senate, 160 House = 200 total) — confirmed via Wikipedia + Ballotpedia + malegislature.gov results
- WebSearch: Governor's Council structure (8 elected + Lt. Governor ex officio) — confirmed via mass.gov + Ballotpedia + Wikipedia
- WebSearch: Governor Maura Healey took office January 2023, running for 2nd term November 2026 — confirmed WBUR, mass.gov
- WebSearch: Chapter 58 (2006) signed April 12, 2006 by Governor Romney — confirmed via malegislature.gov + Wikipedia + multiple legal sources
- WebSearch: Goodridge v. Dept. of Public Health — SJC decision November 18, 2003; first licenses May 17, 2004; first US state — confirmed via Constitution Center, Lambda Legal, WBUR
- WebSearch: Massachusetts Constitution 1780 — world's oldest functioning written constitution — confirmed via mass.gov official page title, Wikipedia, Constitution Center
- WebSearch: County government abolition — Middlesex (1997), Hampshire (1998), others via Chapter 34B — confirmed via mass.gov official pages for each Sheriff's office
- WebSearch: State House (24 Beacon Street, gold dome, Charles Bulfinch, 1798, 23k gold re-gilded 1997) — confirmed via NPS, Wikipedia, Freedom Trail official site
- WebSearch: Karen Spilka (Senate President), Ron Mariano (Speaker of House) — confirmed via Wikipedia + Legiscan
- WebSearch: Attorney General Andrea Campbell, Treasurer Deb Goldberg — confirmed via mass.gov + Ballotpedia

### Tertiary (LOW confidence)
- WebSearch: MCAS graduation requirement change (late 2025) — reported by WBUR and WBSM (December 2025) but not yet fully documented in official policy; recommendation is to avoid graduation requirement framing
- Theme color recommendation `#0C2340` — no official Massachusetts branding guide found; based on state flag color and distinctiveness from existing palette

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — all scripts read directly from codebase; established Indiana/California pattern confirmed
- Architecture patterns: HIGH — state-configs/ auto-discovery confirmed from source code
- Scaffold locale-config placement issue: HIGH — confirmed by reading scaffold source code directly
- Massachusetts government structure: HIGH — confirmed from official sources via WebSearch + official URLs
- Massachusetts civic facts (Constitution, SJC, county abolition): HIGH — multiple authoritative sources agree
- Current officials and expiration dates: MEDIUM — confirmed from mass.gov + Ballotpedia but term dates derived from standard 4-year cycle from 2023
- MCAS graduation requirement change: LOW — recent change, not fully documented; avoid asserting as fact in questions
- Theme color: MEDIUM — no official color guide; based on state flag and palette distinctiveness

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days — infrastructure is stable; civic facts are stable; current official names valid until January 2027 elections/inaugurations)
