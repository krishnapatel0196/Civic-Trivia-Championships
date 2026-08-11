# Phase 52: Texas State Collection - Research

**Researched:** 2026-03-02
**Domain:** State collection scaffolding, state config authoring, Texas civic content generation, mixed-durability question pattern, collection activation
**Confidence:** HIGH

## Summary

Phase 52 follows the same state collection pattern established by Indiana State, California State, and Massachusetts State (Phase 50). The infrastructure is fully mature: scaffold → move config to state-configs/ → seed → generate → curate → banner → activate → verify. No new scripts or infrastructure are needed.

The key differentiators for Texas State vs. prior state collections are: (1) the new **mixed-durability question pattern** (first time explicitly adopted — both durable and expiring questions, no fixed ratio); (2) a **dedicated texas-history-identity category** (Republic of Texas era, independence, annexation); and (3) **Texas's uniquely distinctive institutions** as primary content hooks — the Railroad Commission (founded as railroad regulator, now regulates oil/gas and no longer railroads), the Lt. Governor's outsized Senate presidential power, the Comptroller's plural executive role, and the biennial 140-day legislative sessions. The Texas Capitol's intentional height superiority over the US Capitol (302.64 ft vs. 288 ft) is a standout durable trivia question and a compelling banner image subject.

Expiration dates are time-sensitive: Governor Greg Abbott's current term expires January 2027 (running for fourth term in November 2026 election); Lt. Governor Dan Patrick's current term expires January 19, 2027 (running for fourth term); Attorney General Ken Paxton's term expires January 2027 (but is running for US Senate, not re-election as AG). All statewide elected officials' terms expire in January 2027 following the November 2026 election. This means "expiring" officeholder questions have approximately 10-month shelf life from launch — that's fine and expected under the new pattern.

**Primary recommendation:** Follow the Massachusetts State (Phase 50) pattern exactly. Scaffold with `--tier state`, move config to `locale-configs/state-configs/texas-state.ts`, revert the city-path registration in generate-locale-questions.ts, write the full texas-state config with 8 categories and the `texasStateFeatures` voice guidance string (no changes to system-prompt.ts needed), seed, generate with `--fetch-sources`, curate to ≥50, add Texas Capitol banner image, activate, verify.

## Standard Stack

This phase uses the project's existing state collection pipeline. No new libraries or packages are needed.

### Core Pipeline Scripts
| Script | Purpose | How Used |
|--------|---------|----------|
| `scaffold-collection.ts` | Automates seed entry + locale config stub + generator registration | Run once with `--tier state` flag |
| `seed.ts` | Creates DB row from seed data | Run after full config is written |
| `generate-locale-questions.ts` | Calls Anthropic API, validates, seeds drafts | Run with `--locale texas-state --fetch-sources` |
| `audit-collection-readiness.ts` | Pre-activation gate: verifies ≥50 net questions | Run before activation |
| `activate-collection.ts` | Flips collection + questions to active | Run with `--slug texas-state --prefix tex` |
| `verify-post-activation.ts` | Post-activation API check | Run with `--slugs texas-state` |

### Derived Parameters
| Parameter | Value | Derivation |
|-----------|-------|-----------|
| slug | `texas-state` | Follows state slug pattern (matches indiana-state, california-state, massachusetts-state) |
| prefix | `tex` | 3-char, matches slug prefix |
| configVarName | `texasStateConfig` | Pattern: `{state}StateConfig` |
| featuresVarName | `texasStateFeatures` | Pattern: `{state}StateFeatures` (matches MA pattern) |
| localeName | `Texas State` | Matches indiana-state → `Indiana State` pattern |
| iconIdentifier | `state` | All state collections use `'state'` (verified in collections.ts) |
| sortOrder | `11` | Current max is 10 (plano-tx) → +1 |
| tier | `state` | MUST pass `--tier state` to scaffold or the seed entry gets `tier: 'city'` |

### Theme Color Recommendation (Claude's Discretion)
Existing colors to avoid: deep blue (#1E3A8A, #1E3A5F, #0C2340), deep red (#991B1B), emerald green (#047857), ocean blue (#0369A1), golden brown (#92400E), forest green (#1B4332), amber/burnt orange (#B45309).

**Recommendation: `#BF1B2C` (Texas flag red)** — the red from the Texas state flag is the most natural civic color for Texas, immediately recognizable, and distinct from all existing palette colors. Not used by any current collection.

Alternative: `#003087` (Lone Star navy) — the deep navy from the Texas flag stripe, slightly distinct from existing #1E3A8A deep blue, but close enough to potentially confuse. Prefer the red.

**Installation:** No new packages required. All tooling is already installed.

## Architecture Patterns

### State Config File Location (CRITICAL — differs from city collections)
```
backend/src/scripts/content-generation/locale-configs/state-configs/
├── indiana-state.ts        # Pattern reference (simplest)
├── california-state.ts     # Pattern reference
├── massachusetts-state.ts  # CLOSEST MATCH — use as primary template
└── texas-state.ts          # NEW — create here
```

### Pattern 1: Scaffold + Fix + Move (State-Specific Steps)
**What:** Run scaffold, fix two known bugs, MOVE config to state-configs/, REVERT the city-path registration.
**When to use:** This 4-step correction is required for ALL state collections.

Known scaffold bugs (consistent across all phases, verified in Phase 49-50 notes):

1. **Missing trailing comma in collections.ts** — The inserted entry may miss its trailing comma before `];`. Fix immediately after scaffold.

2. **Wrong insertion point in generate-locale-questions.ts** — Step 3 inserts `'texas-state': () => import(...)` into the type declaration line rather than the object body. Fix by moving to correct location.

**State-specific additional steps after scaffold:**
- Move locale config from `locale-configs/texas-state.ts` → `locale-configs/state-configs/texas-state.ts` (scaffold writes to city directory)
- Revert the `'texas-state'` entry scaffold added to `supportedLocales` in generate-locale-questions.ts — state configs are auto-discovered from `state-configs/` subdirectory; the city-path entry is wrong and will cause a path error

```bash
# Run from backend/ directory
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Texas State" \
  --slug texas-state \
  --prefix tex \
  --theme "#BF1B2C" \
  --tier state

# Move config to state-configs/ directory
mv src/scripts/content-generation/locale-configs/texas-state.ts \
   src/scripts/content-generation/locale-configs/state-configs/texas-state.ts

# Then: fix two scaffold bugs AND revert city-path registration in generate-locale-questions.ts
# Then: write full config (Task 2), THEN seed
```

### Pattern 2: State Config File Structure (Massachusetts Template)
**What:** Two exports in `locale-configs/state-configs/texas-state.ts`:
1. `texasStateConfig: LocaleConfig` — topic structure, distribution, source URLs
2. `texasStateFeatures: string` — all voice guidance; replaces the need for system-prompt.ts changes

**When to use:** Write both exports before running seed.ts. No changes to system-prompt.ts.

```typescript
// Source: locale-configs/state-configs/massachusetts-state.ts pattern
import type { LocaleConfig } from '../bloomington-in.js';

export const texasStateConfig: LocaleConfig = {
  locale: 'texas-state',
  name: 'Texas State',
  externalIdPrefix: 'tex',
  collectionSlug: 'texas-state',
  targetQuestions: 100,
  batchSize: 25,
  // Note: state configs do NOT use overshootFactor (unlike city configs)
  // targetQuestions: 100 generates ~100 questions, curate to ≥50

  topicCategories: [...],
  topicDistribution: {...},
  sourceUrls: [...],
};

export const texasStateFeatures = `
[voice guidance string — see Code Examples section]
`;
```

### Pattern 3: 8-Category Topic Structure (Claude's Discretion)

**Recommendation: Fold distinctive Texas institutions into state-government category; give texas-history-identity its own dedicated category as decided.**

| Topic | Slug | Questions | Rationale |
|-------|------|-----------|-----------|
| Texas History & Identity | `texas-history-identity` | 15 | Republic of Texas era, independence (1836), annexation (1845), San Jacinto, Alamo civic significance — user-decided dedicated category |
| State Government Structure | `state-government` | 15 | Legislature (Senate + House), Governor, Lt. Governor's Senate presidency power, plural executive overview, biennial sessions, 140-day limit |
| Distinctive Texas Institutions | `texas-institutions` | 15 | Railroad Commission (named for railroads, now regulates oil/gas), Comptroller, General Land Office, Agriculture Commissioner — Texas's plural executive is especially rich here |
| Elections & Voting | `elections-voting` | 12 | State election procedures, voter registration (county-based registrars), Secretary of State as chief election officer, primary cycles |
| Texas Constitution | `state-constitution` | 12 | 1876 Constitution (second-longest in US, third-most-amended), amendment process (2/3 legislature + majority voters), distinctive homestead protections, reaction to Reconstruction context |
| State Courts & Judiciary | `state-courts` | 10 | TWO courts of last resort (Texas Supreme Court for civil/juvenile + Court of Criminal Appeals for criminal/death penalty) — uniquely distinctive, excellent trivia hook |
| Civic Policy & Landmarks | `civic-policy` | 11 | Texas Capitol (taller than US Capitol by 14.64 ft, red granite, opened 1888), ERCOT/state energy grid (Texas's independent grid is a distinctive civic fact), state agency structure |
| Texas Civic History | `civic-history` | 10 | Statehood as 28th state (December 29, 1845), 9-year Republic, state motto, state symbols with civic significance |

**Total: 100 questions** (generate 100, curate to ≥50)

**Note on folding vs. splitting Texas institutions:** Folding Railroad Commission + Comptroller + plural executive into a single `texas-institutions` category (rather than a shared `state-government` category) lets the generator focus deeply on what makes Texas distinctive without diluting government structure coverage. The Massachusetts model with `governors-council` as its own category supports splitting out highly distinctive institutions.

### Anti-Patterns to Avoid
- **City-specific facts:** No question may name a specific Texas city (Austin-the-city facts out, Austin-the-state-capital-institution facts in)
- **Writing `system-prompt.ts`:** State voice guidance lives entirely in `texasStateFeatures` string — do NOT modify system-prompt.ts
- **Missing `--tier state`:** Without this flag, scaffold creates a `tier: 'city'` seed entry; the collection will appear in the wrong section
- **Forgetting the state-configs move:** If config stays in `locale-configs/` (city directory), the auto-discovery from `state-configs/` won't find it
- **Federal subjects:** US Senators Ted Cruz and John Cornyn are federal subjects, not Texas state subjects
- **Sports/corporate framing:** No questions about the Cowboys, Astros, or Texas-headquartered companies as commercial subjects

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question quality validation | Custom validators | `audit-collection-readiness.ts` | Pipeline already handles quality gates |
| Duplicate detection | Manual de-dup | Built-in `DuplicateDetector` in generator | Already runs per-batch |
| Expiration date management | Ad-hoc expiresAt logic | `expiresAt` field in question schema + voice guidance | Generator sets per-question based on nature |
| Voice guidance injection | Inline prompt tweaks | `texasStateFeatures` string in config file | Follows MA pattern; no system-prompt.ts changes |
| Collection activation | Manual SQL | `activate-collection.ts --dry-run` first | Dry-run safety + count warnings |
| Post-activation check | Manual API test | `verify-post-activation.ts` | Structured exit codes |
| State config discovery | Manual registration | Auto-discovery from `state-configs/` subdirectory | No code changes needed for new states |

**Key insight:** The only new work for this phase is content and configuration. All tooling exists. The mixed-durability pattern is implemented through voice guidance in `texasStateFeatures` — no schema or pipeline changes required.

## Common Pitfalls

### Pitfall 1: Missing --tier state Flag
**What goes wrong:** Scaffold creates seed entry with `tier: 'city'`. The Texas State collection appears in the "Local" section of the collection picker instead of the "State" section.
**Why it happens:** Default scaffold behavior is `tier: 'city'`. State collections require explicit `--tier state`.
**How to avoid:** Always include `--tier state` in the scaffold command. Verify the seed entry in collections.ts immediately after scaffold.
**Warning signs:** TypeScript compilation succeeds but the collection appears in wrong UI section after activation.

### Pitfall 2: Config Not Moved to state-configs/
**What goes wrong:** `generate-locale-questions.ts --locale texas-state` throws "Unknown locale" at runtime — auto-discovery only searches `state-configs/` subdirectory.
**Why it happens:** Scaffold writes the locale config stub to `locale-configs/texas-state.ts` (city directory). State configs must be in `locale-configs/state-configs/`.
**How to avoid:** Immediately after scaffold, run `mv locale-configs/texas-state.ts locale-configs/state-configs/texas-state.ts`.
**Warning signs:** `generate-locale-questions.ts --locale texas-state --dry-run` exits with "Unknown locale texas-state" error.

### Pitfall 3: City-Path Registration Not Reverted
**What goes wrong:** Scaffold adds `'texas-state': () => import('./locale-configs/texas-state.js')` (city path) to `supportedLocales` in generate-locale-questions.ts. When the generator runs, it tries to import from the city path (which doesn't exist after the move), causing a module not found error.
**Why it happens:** Scaffold doesn't know about the state-configs/ auto-discovery pattern.
**How to avoid:** After scaffold, open generate-locale-questions.ts, find the `'texas-state'` entry in `supportedLocales`, and remove it. State configs are auto-discovered — no manual registration needed.
**Warning signs:** Runtime `MODULE_NOT_FOUND` error mentioning `./locale-configs/texas-state.js`.

### Pitfall 4: Scaffold Bugs (Trailing Comma + Wrong Insertion Point)
**What goes wrong:** collections.ts TypeScript error OR generate-locale-questions.ts runtime error.
**Why it happens:** Two consistent scaffold bugs: (1) missing trailing comma in collections.ts insertion; (2) supportedLocales insertion into type declaration line rather than object body.
**How to avoid:** After scaffold, inspect both files before running seed.ts.
**Warning signs:** TypeScript compilation error in collections.ts; runtime error about unexpected token.

### Pitfall 5: Seeding Before Full Config Is Written
**What goes wrong:** seed.ts runs with the scaffold-generated stub (minimal config). The DB row exists but the config is incomplete, causing a mismatch.
**Why it happens:** Eagerness to see the collection in DB before finishing the config.
**How to avoid:** Complete the full `texasStateConfig` and `texasStateFeatures` content BEFORE running seed.ts.
**Warning signs:** Dry-run generation fails because topics/distribution don't match what was seeded.

### Pitfall 6: Officeholder Questions Without expiresAt
**What goes wrong:** Questions naming specific current officials (Abbott, Patrick, Paxton, Nelson) are generated without `expiresAt`, so they stay active indefinitely even after terms expire.
**Why it happens:** Generator doesn't set expiresAt unless voice guidance explicitly instructs it to.
**How to avoid:** `texasStateFeatures` must explicitly instruct: for officeholder questions, set expiresAt to the term end date. All current statewide elected officials' terms expire in January 2027 (post-November 2026 election).
**Warning signs:** Questions about "current" officials have `expiresAt: null` in the DB.

### Pitfall 7: Austin City vs. Austin State Institution Confusion
**What goes wrong:** A question references the City of Austin (e.g., Austin City Council, Austin Mayor) as a Texas state government subject.
**Why it happens:** Austin is where state institutions are physically located; it's easy to conflate city and state.
**How to avoid:** Voice guidance must explicitly state: Austin state institutions (Capitol building, Governor's Mansion, state agencies at 1700 N. Congress etc.) = in scope. Austin city government (Mayor, City Council, Austin ISD, Austin city services) = out of scope.
**Warning signs:** Questions about Austin's city council, mayor, or city-specific policies in the draft question set.

### Pitfall 8: Railroad Commission Mis-Described
**What goes wrong:** A question describes the Railroad Commission as regulating railroads, when it actually regulates oil/gas (railroad oversight was transferred to TxDOT in 2005).
**Why it happens:** The Commission's name implies railroad regulation, but that function was removed.
**How to avoid:** Voice guidance must explicitly state: Railroad Commission now regulates oil, gas, pipelines, LP-gas, coal/uranium mining — NOT railroads. Railroad functions transferred to TxDOT effective October 1, 2005.
**Warning signs:** Draft questions describe the RRC as a transportation regulator.

### Pitfall 9: Texas Judiciary — One Supreme Court vs. Two
**What goes wrong:** A question refers to "the Texas Supreme Court" as the highest court for all cases, when Texas has two courts of last resort (one for civil, one for criminal).
**Why it happens:** Most states have a single supreme court; Texas is an exception.
**How to avoid:** Voice guidance must explicitly cover: Texas Supreme Court = civil/juvenile only; Texas Court of Criminal Appeals = criminal cases including death penalty. Both are courts of last resort.
**Warning signs:** Questions asserting the Texas Supreme Court is the highest court for criminal cases.

### Pitfall 10: 2026 Election Context — Terms Expire Sooner Than Expected
**What goes wrong:** Questions about current officials are set to expire too late (e.g., 2031) because the researcher missed that 2026 is a statewide election year.
**Why it happens:** All statewide Texas elected officials have 4-year terms and their current terms end January 2027 after the November 2026 election.
**How to avoid:** Set expiresAt to "2027-01-20T00:00:00Z" for all current statewide officeholders. Note that the March 3, 2026 primary has already occurred (today is March 2, 2026); the general election is November 3, 2026.
**Warning signs:** expiresAt set to 2031 or later for any currently serving official.

## Code Examples

Verified patterns from the existing codebase and research:

### Scaffold Command
```bash
# Run from backend/ directory
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Texas State" \
  --slug texas-state \
  --prefix tex \
  --theme "#BF1B2C" \
  --tier state
```

### State Config File — texasStateConfig Export
```typescript
// Source: massachusetts-state.ts pattern, adapted for Texas
import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Texas state configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Texas State collection.
 *
 * CRITICAL ACCURACY NOTES:
 * - The Railroad Commission no longer regulates railroads — it regulates oil, gas, pipelines (since 1919/2005)
 * - Texas has TWO courts of last resort: Texas Supreme Court (civil) + Court of Criminal Appeals (criminal)
 * - All current statewide officials' terms expire January 2027 (2026 is a statewide election year)
 * - Austin CITY facts are NOT Texas STATE facts (Mayor, City Council, Austin ISD are city subjects)
 * - Federal subjects (US Senators Cruz, Cornyn) are NOT state subjects
 * - Questions should be a MIX of durable civic facts AND expiring current-officeholder questions
 */
export const texasStateConfig: LocaleConfig = {
  locale: 'texas-state',
  name: 'Texas State',
  externalIdPrefix: 'tex',
  collectionSlug: 'texas-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'texas-history-identity',
      name: 'Texas History & Identity',
      description: 'Republic of Texas era (1836-1845): Declaration of Independence (March 2, 1836), Battle of San Jacinto (April 21, 1836), Sam Houston as first elected president of the Republic, annexation as 28th state (December 29, 1845). Texas as the only state with the constitutional right to subdivide into up to five states. State motto: "Friendship" (from the Caddo word "Tejas"). Texas statehood and its unique path to the Union via prior sovereign republic status.',
    },
    {
      slug: 'state-government',
      name: 'State Government Structure',
      description: 'Texas Legislature: bicameral, 31-member Senate + 150-member House. Biennial sessions starting second Tuesday in January of odd-numbered years, up to 140 days. Governor (4-year terms, no term limits), Lieutenant Governor as President of the Texas Senate (commonly described as most powerful statewide elected role because of Senate control). Plural executive overview: multiple independently elected statewide officers.',
    },
    {
      slug: 'texas-institutions',
      name: 'Texas Distinctive Institutions',
      description: 'Railroad Commission of Texas: established 1891 to regulate railroads; now regulates oil, gas, pipelines, LP-gas, and coal/uranium mining — no longer regulates railroads (transferred to TxDOT 2005). Three elected commissioners, 6-year overlapping terms. Comptroller of Public Accounts (revenue estimating, tax collection, state treasury management). General Land Office (public lands, veterans programs). Agriculture Commissioner. These together form Texas\'s plural executive — each major office independently elected, limiting any single officer\'s power.',
    },
    {
      slug: 'elections-voting',
      name: 'Elections & Voting',
      description: 'Texas election procedures: voter registration administered by county voter registrars (county-based system). Secretary of State is the chief state elections officer. Primary elections March of even-numbered years. General elections November of even-numbered years. 30-day pre-election registration deadline. Texas open primary: voters may choose either party primary without prior registration.',
    },
    {
      slug: 'state-constitution',
      name: 'Texas Constitution',
      description: 'Texas Constitution of 1876: current governing constitution, drafted in reaction to Reconstruction-era centralized government. Second-longest state constitution in the US (more than 63,000 words; only Alabama\'s is longer). Third-most-amended state constitution (530+ amendments approved as of 2024). Amendment process: two-thirds vote of both legislative chambers + majority voter approval. Notable provisions: homestead protections (homes cannot be forced-sold for most debts), prohibition on state income tax (enshrined by 1993 amendment).',
    },
    {
      slug: 'state-courts',
      name: 'State Courts & Judiciary',
      description: 'Texas has TWO courts of last resort — a uniquely distinctive structure: (1) Texas Supreme Court: final appellate jurisdiction for civil and juvenile cases; (2) Texas Court of Criminal Appeals: final appellate jurisdiction for criminal cases, exclusive jurisdiction over death penalty appeals. Each has 9 justices/judges elected in partisan statewide elections. 14 intermediate Courts of Appeals (plus the Fifteenth Court of Appeals, established 2023, for state government civil cases). Judicial vacancies filled by gubernatorial appointment until next election.',
    },
    {
      slug: 'civic-policy',
      name: 'Civic Policy & Landmarks',
      description: 'Texas State Capitol: completed 1888, 302.64 feet tall (14.64 feet taller than US Capitol at 288 feet), built of Sunset Red granite from Marble Falls. Designated National Historic Landmark. Cornerstone laid March 2, 1885 (Texas Independence Day). Texas\'s independent electrical grid (ERCOT — Electric Reliability Council of Texas): Texas operates its own interconnected grid, largely separate from other US grids, overseen by the Public Utility Commission of Texas. State agency structure and major state-funded programs.',
    },
    {
      slug: 'civic-history',
      name: 'Texas Civic History',
      description: 'Texas as 28th state (December 29, 1845). Texas Constitution of 1869 vs. current 1876 Constitution. Reconstruction-era Texas government context. Texas\'s right to subdivide (resolution of annexation). Texas State Cemetery, official state symbols with civic meaning. The Alamo (mission and battle site) as a civic landmark in San Antonio — the Battle of the Alamo (February-March 1836) as a turning point in the Texas Revolution.',
    },
  ],

  topicDistribution: {
    // Texas History & Identity (15 questions)
    'texas-history-identity': 15,
    // State Government (15 questions)
    'state-government': 15,
    // Distinctive Institutions (15 questions)
    'texas-institutions': 15,
    // Elections & Voting (12 questions)
    'elections-voting': 12,
    // Constitution (12 questions)
    'state-constitution': 12,
    // Courts (10 questions)
    'state-courts': 10,
    // Policy & Landmarks (11 questions)
    'civic-policy': 11,
    // Civic History (10 questions)
    'civic-history': 10,
  },

  sourceUrls: [
    // Texas state government portal
    'https://www.texas.gov',
    // Governor's office
    'https://gov.texas.gov/',
    // Lieutenant Governor / Texas Senate
    'https://www.ltgov.texas.gov/',
    'https://senate.texas.gov/',
    // Texas House
    'https://house.texas.gov/',
    // Texas Legislature Online
    'https://capitol.texas.gov/',
    // Attorney General
    'https://www.texasattorneygeneral.gov/',
    // Comptroller
    'https://comptroller.texas.gov./',
    // Secretary of State (elections)
    'https://www.sos.state.tx.us/',
    'https://www.sos.state.tx.us/elections/index.shtml',
    // Railroad Commission
    'https://www.rrc.texas.gov/about-us/',
    // General Land Office
    'https://www.glo.texas.gov/',
    // Texas Supreme Court
    'https://www.txcourts.gov/',
    // Texas State Preservation Board (Capitol)
    'https://tspb.texas.gov/',
    // Texas State Historical Association (civic history)
    'https://www.tshaonline.org/handbook/entries/republic-of-texas',
    'https://www.tshaonline.org/handbook/entries/constitution-of-1876',
    // Wikipedia (supplementary)
    'https://en.wikipedia.org/wiki/Texas',
    'https://en.wikipedia.org/wiki/Texas_Legislature',
    'https://en.wikipedia.org/wiki/Railroad_Commission_of_Texas',
    // VoteTexas.gov
    'https://www.votetexas.gov/',
  ],
};
```

### State Config File — texasStateFeatures Export
```typescript
/**
 * Texas-specific features to inject into state system prompt.
 * This string is passed to buildStateSystemPrompt() and serves as all voice guidance
 * for Texas question generation. No changes to system-prompt.ts are needed.
 */
export const texasStateFeatures = `
Texas has several uniquely distinctive features in its state government that MUST be accurately represented:

**MIXED DURABILITY — CRITICAL REQUIREMENT**
Generate a mix of durable civic facts AND expiring current-officeholder questions. For each question, set expiresAt based on its nature:
- Questions naming current officeholders or time-sensitive facts → set expiresAt to the term end date
- Questions about government structure, constitutional provisions, history, civic landmarks → expiresAt: null (durable)
Generate as many of each type as the topic supports. Do NOT restrict yourself to only one type.

**CURRENT ELECTED OFFICIALS AND EXPIRATION DATES**
All statewide Texas elected officers have 4-year terms. The November 2026 election determines new term holders; new terms begin January 2027.
- Governor: Greg Abbott (current term expires January 2027) → expiresAt: "2027-01-20T00:00:00Z"
- Lieutenant Governor: Dan Patrick (current term expires January 19, 2027) → expiresAt: "2027-01-20T00:00:00Z"
- Attorney General: Ken Paxton (current term expires January 2027; running for US Senate, not re-election) → expiresAt: "2027-01-20T00:00:00Z"
- Comptroller: Kelly Hancock (acting, took over from Glenn Hegar who resigned July 2025 to become Texas A&M chancellor) → expiresAt: "2027-01-20T00:00:00Z"
- Land Commissioner: Dawn Buckingham → expiresAt: "2027-01-20T00:00:00Z"
- Agriculture Commissioner: Sid Miller → expiresAt: "2027-01-20T00:00:00Z"
- Secretary of State: Jane Nelson (appointed January 5, 2023 by Gov. Abbott; appointed, not elected) → expiresAt: null (appointed, no fixed public term)
- Texas Senate leadership: Dan Patrick as President (term through Jan 2027); House Speaker: Dustin Burrows (89th Legislature, 2025-2026 session)
- Structural/historical questions: expiresAt: null

**THE LIEUTENANT GOVERNOR'S DISTINCTIVE POWER**
- The Lieutenant Governor of Texas serves as the PRESIDENT OF THE TEXAS SENATE — not just as a tie-breaking presider
- The Lt. Gov. controls the Senate's standing committees, agenda, and procedural rules
- The Lt. Gov. co-chairs the Legislative Budget Board (which develops the state budget) and sits on the Legislative Redistricting Board
- This combination of powers makes the Texas Lt. Governor role commonly described as "the most powerful statewide elected office in Texas"
- "Who is the Lt. Governor of Texas?" is a compelling, high-value civic question — generate this type

**RAILROAD COMMISSION — CRITICAL ACCURACY**
- The Railroad Commission of Texas was established in 1891 to regulate railroads (unjust rates, discrimination)
- It began regulating oil and gas pipelines in 1917, oil/gas production in 1919
- Railroad oversight was transferred to the Texas Department of Transportation (TxDOT) effective October 1, 2005
- The Railroad Commission NOW regulates: oil and gas exploration/production, pipelines, LP-gas, natural gas utilities, coal and uranium surface mining
- The Railroad Commission DOES NOT regulate railroads — this is a famous civic paradox and an excellent trivia question
- Three commissioners elected statewide to overlapping 6-year terms

**TEXAS LEGISLATURE — BIENNIAL SESSIONS**
- Bicameral: 31 senators (4-year terms) + 150 representatives (2-year terms)
- Regular sessions: starts second Tuesday in January of ODD-NUMBERED years only; maximum 140 days
- Texas has a "citizen legislature" — legislators are not full-time; they have other careers
- 89th Legislature: 2025 session (current). Speaker of the House: Dustin Burrows. Lt. Gov. Dan Patrick presides over Senate.
- Governor may call Special Sessions (each limited to 30 days, specific subjects only)
- This biennial/part-time structure is one of Texas's most distinctive legislative features

**TEXAS'S TWO SUPREME COURTS**
- Texas is one of only two US states with TWO courts of last resort (the other is Oklahoma)
- Texas Supreme Court: final appellate jurisdiction for CIVIL and juvenile cases only (9 justices)
- Texas Court of Criminal Appeals: final appellate jurisdiction for CRIMINAL cases; exclusive jurisdiction over death penalty appeals (9 judges)
- Both courts: justices/judges elected in partisan statewide elections; governor fills vacancies between elections
- "Which Texas court handles death penalty appeals?" is an excellent durable question

**TEXAS CONSTITUTION OF 1876**
- Texas's current constitution, adopted February 15, 1876, in reaction to the centralized Reconstruction-era government
- SECOND-LONGEST state constitution in the US (more than 63,000 words; only Alabama's is longer)
- THIRD-MOST-AMENDED state constitution (714 amendments proposed 1876-2024; 530 approved)
- Amendment process: two-thirds vote in each legislative chamber + majority of voters in a referendum
- Key provisions: homestead exemption (homes protected from forced sale for most debts), prohibition on a state income tax (constitutional amendment approved 1993)
- The 1876 constitution replaced the 1869 constitution (Reconstruction era); Texans deliberately weakened executive power

**TEXAS HISTORY & IDENTITY**
- Republic of Texas: declared independence March 2, 1836 (Texas Independence Day) at Washington-on-the-Brazos
- Battle of San Jacinto: April 21, 1836 — Sam Houston's forces defeated Santa Anna's army in 18 minutes; Santa Anna captured, signed Treaty of Velasco granting Texas independence
- Texas annexation: admitted as the 28th US state on December 29, 1845; transfer of power from Republic to state government February 19, 1846
- Sam Houston: first elected president of the Republic of Texas, also later Governor of Texas
- Texas retained its public lands (other states ceded public lands to the federal government) — a distinctive condition of annexation
- Texas has the constitutional right to subdivide into up to five states (Resolution of Annexation, 1845) — a famous civic fact
- Texas Independence Day: March 2 (celebrated as a state holiday)
- San Jacinto Day: April 21 (state holiday)

**TEXAS CAPITAL AND CIVIC LANDMARKS**
- Texas State Capitol: located in Austin. Completed April 21, 1888 (San Jacinto Day). Designed by Elijah E. Myers.
- Built from Sunset Red granite quarried near Marble Falls, Texas (contributed by prison labor as part of land payment)
- Height: 302.64 feet — intentionally 14.64 feet TALLER than the US Capitol (288 feet). This was deliberate.
- Contains 360,000 square feet of floor space — more than any other state capitol building
- Designated a National Historic Landmark
- Cornerstone laid March 2, 1885 (Texas Independence Day) — deliberate symbolic date
- "Everything is bigger in Texas" — the Capitol's intentional height superiority is a shareable, surprising civic tidbit

**TEXAS ENERGY GRID (ERCOT)**
- Texas operates its own independent electrical grid — ERCOT (Electric Reliability Council of Texas)
- ERCOT covers about 90% of Texas's electric load; largely separate from the Eastern and Western interconnections
- ERCOT is overseen by the Public Utility Commission of Texas (PUCT) — a state agency
- Texas chose this independent grid structure to avoid federal regulation (FERC has limited jurisdiction over ERCOT)
- Frame civically: what ERCOT is, why Texas has its own grid, who oversees it

**PLURAL EXECUTIVE**
- Texas intentionally diffuses executive power among multiple independently elected officials
- Independently elected: Governor, Lieutenant Governor, Attorney General, Comptroller, Land Commissioner, Agriculture Commissioner, Railroad Commission (3 members)
- Secretary of State is appointed (not elected) — one of the few major offices not directly elected
- No single executive holds all power; the Governor cannot unilaterally appoint or remove most of these officials

**WHAT TO AVOID — STATE/CITY BOUNDARY**
- The hard rule: NO question may reference a specific Texas CITY. Every question must be about statewide institutions, laws, events, or history.
- Austin STATE INSTITUTIONS are in scope: Texas Capitol building, Governor's Mansion (state property), state agencies headquartered in Austin.
- Austin CITY GOVERNMENT is out of scope: Austin Mayor, Austin City Council, Austin City Manager, Austin ISD, Austin city services.
- Dallas, Houston, San Antonio, Fort Worth, Plano, El Paso — do not mention any of these cities in any question.
- The Alamo in San Antonio: frame as a statewide historic/civic landmark (Battle of the Alamo was a decisive event in Texas independence), not as a "San Antonio attraction."

**WHAT TO AVOID — FEDERAL/SPORTS/COMMERCIAL**
- US Senators Ted Cruz and John Cornyn are FEDERAL subjects — out of scope
- No questions about Texas's congressional delegation (House members, Senators) — federal subjects
- No questions about the Cowboys, Texans, Astros, Rangers, or other sports teams
- No questions about Texas-headquartered companies (Exxon, AT&T, Dell) as corporate subjects
- No questions about private universities (UT Austin's academic rankings, Texas A&M programs) as institutional subjects
- Apply the dinner party test: "Is this a surprising, shareable civic fact a civically engaged Texan would be proud to know?" PASS: "What is the only Texas court with jurisdiction over death penalty appeals?" FAIL: "What is the budget of the Texas Department of Agriculture?"

**DIFFICULTY CALIBRATION**
Over-index on EASY and MEDIUM questions. Accessible civic tidbits first.
EASY: "What number state was Texas when it joined the Union?" → 28th
EASY: "What is the Texas state motto?" → Friendship
EASY: "How tall is the Texas State Capitol compared to the US Capitol?" → 14.64 feet taller (or: taller)
MEDIUM: "What agency does the Texas Railroad Commission actually regulate today?" → oil and gas (not railroads)
HARD: "What vote threshold does the Texas Legislature need to propose a constitutional amendment?" → two-thirds of each chamber
NEVER ask for: addresses, phone numbers, budget line items, obscure agency sub-divisions
`;
```

### Activation Commands (in order)
```bash
# From backend/ directory:

# 1. Pre-activation gate
npx tsx src/scripts/audit-collection-readiness.ts --slug texas-state --prefix tex

# 2. Dry run first
npx tsx src/scripts/activate-collection.ts --slug texas-state --prefix tex --dry-run

# 3. Actual activation
npx tsx src/scripts/activate-collection.ts --slug texas-state --prefix tex

# 4. Post-activation verify
npx tsx src/scripts/verify-post-activation.ts --slugs texas-state
```

### Dry-Run Test Before Seeding
```bash
# Verify auto-discovery works BEFORE running seed.ts
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale texas-state \
  --dry-run
# Should exit 0 without "Unknown locale" error
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Durable-only state questions (no officeholders) | Mixed durability: durable + expiring current-officeholder questions | Phase 52 (new pattern) | Generator now produces both; expiresAt set per-question based on nature |
| Voice guidance in system-prompt.ts per locale | `stateFeatures` string exported from config file | Phase 50 (MA pattern) | No system-prompt.ts changes needed for new states |
| Hardcoded locale list in generator | Auto-discovery from `state-configs/` subdirectory | Phase 25+ | No code changes needed to support new states |
| Manual seed entry creation | scaffold-collection.ts with `--tier state` | Phase 25+ | Automates seed row; `--tier state` flag required |
| Per-phase verify scripts | `verify-post-activation.ts --slugs texas-state` | Phase 36+ | Reusable; takes `--slugs` arg |

**Deprecated/outdated:**
- `buildXxxVoiceGuidance()` functions in system-prompt.ts: Still used for CITY collections (buildCambridgeVoiceGuidance, buildPlanoVoiceGuidance). State collections use the stateFeatures export pattern instead — do NOT add a buildTexasStateVoiceGuidance() function to system-prompt.ts.

## Texas Civic Facts Reference

Key verified facts for content quality checks (HIGH confidence from official Texas government sources and Texas State Historical Association):

### Current Officials (HIGH confidence — verified March 2, 2026)
- Governor: Greg Abbott (R), term expires January 2027, running for 4th term Nov 2026
- Lt. Governor / Senate President: Dan Patrick (R), term expires January 19, 2027, running for 4th term Nov 2026
- Attorney General: Ken Paxton (R), term expires January 2027, running for US Senate (not re-election as AG)
- Comptroller: Kelly Hancock (acting, since Glenn Hegar resigned July 2025 for Texas A&M chancellorship); 2026 primary has multiple candidates
- Land Commissioner: Dawn Buckingham (R), term expires January 2027
- Agriculture Commissioner: Sid Miller (R), term expires January 2027
- Secretary of State: Jane Nelson (appointed, not elected), appointed January 5, 2023 by Gov. Abbott
- 89th Texas Legislature House Speaker: Dustin Burrows

### Legislature (HIGH confidence — Texas Legislature Online)
- Senate: 31 members, 4-year terms
- House: 150 members, 2-year terms
- Regular sessions: odd-numbered years only, 140-day maximum, starts second Tuesday in January
- Current session: 89th Legislature (2025)

### Judiciary (HIGH confidence — Texas Courts official structure)
- Texas Supreme Court: 9 justices, civil/juvenile jurisdiction, partisan election
- Texas Court of Criminal Appeals: 9 judges, criminal/death penalty jurisdiction, partisan election
- 15 intermediate Courts of Appeals (14 general + 15th Court established 2023 for state government civil cases)
- Judicial selection: partisan statewide election; vacancies by gubernatorial appointment

### Texas Capitol (HIGH confidence — Texas State Preservation Board + multiple sources)
- Height: 302.64 feet (intentionally taller than US Capitol's 288 feet by 14.64 feet)
- Architect: Elijah E. Myers
- Construction: 1882-1888, red granite from Marble Falls
- Opened: April 21, 1888 (San Jacinto Day)
- Cornerstone: March 2, 1885 (Texas Independence Day)
- Designation: National Historic Landmark
- Floor space: 360,000 sq ft (most of any state capitol)

### Railroad Commission (HIGH confidence — RRC official website)
- Established: 1891 (railroad regulation)
- Oil/gas jurisdiction: began 1917 (pipelines), 1919 (oil/gas production)
- Railroad oversight transferred to TxDOT: October 1, 2005 (House Bill 2702)
- Current jurisdiction: oil/gas, pipelines, LP-gas, natural gas utilities, coal/uranium surface mining
- Structure: 3 commissioners, elected statewide, overlapping 6-year terms

### Texas Constitution (HIGH confidence — Texas State Library + TSHA)
- Current constitution: 1876 (replaces 1869 Reconstruction-era constitution)
- Length: more than 63,000 words (second-longest in US after Alabama)
- Amendments: 714 proposed 1876-2024; 530 approved; third-most-amended state constitution
- Amendment process: two-thirds each legislative chamber + majority voter approval
- No state income tax: enshrined by constitutional amendment approved by voters in 1993
- Homestead exemption: homes protected from forced sale for most debts

### Texas History (HIGH confidence — TSHA + Texas State Library)
- Texas Declaration of Independence: March 2, 1836 (Texas Independence Day)
- Battle of San Jacinto: April 21, 1836 (18-minute battle, Santa Anna captured)
- Treaty of Velasco: signed by Santa Anna granting Texas independence
- Texas as republic: 1836-1845 (9 years, 9 months)
- Statehood: 28th state, December 29, 1845
- Transfer of power Republic→State: February 19, 1846
- Sam Houston: first elected president of Republic of Texas, also later Texas Governor
- Texas retained public lands (unique annexation condition)
- Subdivision right: Resolution of Annexation allows Texas to subdivide into up to 5 states

## Banner Image

**Subject:** Texas State Capitol exterior, showing the full dome — consistent with Massachusetts State House pattern (clearly signals state government).

**Recommended source:** Wikimedia Commons — Category:Texas_State_Capitol. Multiple high-resolution exterior photographs available. Filter for freely licensed images (CC-BY, CC-BY-SA, or public domain).

**Composition guidance:** Wide-angle shot from the south or southeast showing full height of building is ideal — the intentional height superiority over the US Capitol is a civic story, and a low-angle wide shot emphasizes the dramatic dome. The building's red granite exterior in Texas sunlight photographs well.

**Specific files to check on Wikimedia Commons (as of research date):**
- `File:Texas State Capitol building-front left front oblique view.JPG` — 2,822×1,373 px (already landscape-ish ratio, good starting point)
- `File:Texas State Capitol building-oblique view.JPG` — 2,209×1,582 px
- Search `commons.wikimedia.org/wiki/Category:Texas_State_Capitol` for best current options

**Image requirements (matching existing banners):**
- Format: JPG
- Width: 960px (existing banners are all 960px wide)
- Height: 576-675px (heights vary across existing banners — any in this range is acceptable)
- Destination: `frontend/public/images/collections/texas-state.jpg`

## Open Questions

1. **Comptroller vacancy — Kelly Hancock as acting vs. confirmed**
   - What we know: Glenn Hegar resigned July 1, 2025 to become Texas A&M chancellor; Kelly Hancock became acting Comptroller. The 2026 Republican primary (March 3, 2026) has multiple candidates.
   - What's unclear: Whether Kelly Hancock won the March 3, 2026 primary (primary was today — results not yet available at time of research). The general election is November 2026.
   - Recommendation: Write Comptroller questions about the ROLE and powers (tax collection, revenue estimation, state treasury management) rather than the current officeholder name. If a name question is written, use "acting Comptroller" and set expiresAt: "2027-01-20T00:00:00Z". Voice guidance should flag this office as particularly volatile.

2. **Senate President Pro Tem after Brandon Creighton's resignation**
   - What we know: Brandon Creighton was President Pro Tem of the Texas Senate for the 89th Legislature, then resigned October 2, 2025 to become Texas Tech chancellor. A replacement was appointed.
   - What's unclear: Who the current Senate President Pro Tem is as of early 2026.
   - Recommendation: Voice guidance should note that the President Pro Tem is a temporary presider when the Lt. Gov. is absent — structurally interesting but not as high-priority as the Lt. Gov. role. Write structural questions ("What role does the Texas Lt. Governor play in the Senate?") over naming the current Pro Tem.

3. **Texas Constitution — no state income tax framing**
   - What we know: Texas has no state income tax, protected by constitutional amendment approved November 1993.
   - What's unclear: Whether questions about this provision are better framed as "Texas has no state income tax" (civic fact) or as a constitutional amendment question. Both framings work.
   - Recommendation: Frame as a constitutional provision ("Which Texas constitutional amendment prohibits a state income tax?"). This frames it civically rather than as a tax policy position.

## Sources

### Primary (HIGH confidence)
- `locale-configs/state-configs/massachusetts-state.ts` — State config template pattern verified by reading source
- `locale-configs/state-configs/indiana-state.ts` — Simpler state config pattern
- `backend/src/db/seed/collections.ts` — Existing seed entries verified (sortOrder, iconIdentifier, tier patterns)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — Auto-discovery pattern from state-configs/ verified by reading source
- https://gov.texas.gov/ — Governor's office (Greg Abbott confirmed)
- https://www.ltgov.texas.gov/ — Lt. Governor's office (Dan Patrick confirmed, term through January 2027)
- https://ballotpedia.org/Dan_Patrick — Term expiration January 19, 2027 verified
- https://ballotpedia.org/Texas_gubernatorial_election,_2026 — Abbott term end January 2027 verified
- https://www.sos.state.tx.us/about/sosbio.shtml — Secretary of State Jane Nelson, appointed January 5, 2023
- https://www.rrc.texas.gov/about-us/ — Railroad Commission current regulatory scope
- https://tspb.texas.gov/ — Texas Capitol height (302.64 ft), construction history
- Planning phase docs: 50-RESEARCH.md, 50-01-PLAN.md, 50-02-PLAN.md, 50-03-PLAN.md — State collection pipeline patterns verified

### Secondary (MEDIUM confidence)
- https://www.tshaonline.org/handbook/entries/constitution-of-1876 — Texas Constitution 1876 length, amendment process
- https://www.tshaonline.org/handbook/entries/republic-of-texas — Republic of Texas civic history
- https://ballotpedia.org/Ken_Paxton — AG Paxton term, running for US Senate (not AG re-election)
- Texas Legislature Wikipedia article — Legislative structure (31 Senate, 150 House, biennial sessions, 140-day limit) — cross-referenced with official Texas Legislature Online
- Texas Railroad Commission Wikipedia article — History of regulatory evolution, 2005 railroad transfer to TxDOT

### Tertiary (LOW confidence — for content inspiration, verify at generation time)
- https://www.texaspolicyresearch.com/understanding-the-texas-court-system/ — Texas two-court structure
- WebSearch results on Glenn Hegar resignation and Kelly Hancock succession (single news source, verify at generation time)

## Metadata

**Confidence breakdown:**
- Standard stack (pipeline): HIGH — Massachusetts State (Phase 50) is direct precedent; all scripts verified
- Architecture (state config pattern): HIGH — verified by reading massachusetts-state.ts and phase 50 PLANs
- Civic facts — officials and terms: HIGH — verified with official state government websites and Ballotpedia
- Civic facts — constitutional/historical: HIGH — TSHA + Texas State Library (authoritative state sources)
- Civic facts — Comptroller succession: MEDIUM — news sources confirm Hancock as acting; primary outcome unclear (election was today)
- Topic structure (8 categories): HIGH — follows MA pattern, addresses all CONTEXT.md decisions
- Voice guidance content: HIGH — all specific facts verified with official sources before inclusion
- Pitfalls: HIGH — scaffold bugs verified across phases 49-51; Texas-specific pitfalls derived from verified civic facts

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (pipeline stable; officeholder facts valid through November 2026 election; constitutional/historical facts are stable)
