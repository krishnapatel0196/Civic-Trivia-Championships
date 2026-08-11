# Phase 60: Washington, DC Collection - Research

**Researched:** 2026-03-12
**Domain:** District collection scaffolding, DC civic content generation, unique constitutional status framing, mixed-durability question pattern, collection activation
**Confidence:** HIGH

---

## Summary

Phase 60 follows the established collection pipeline exactly — scaffold, locale config, generate, curate, banner image, activate — with one critical structural decision: DC uses the `city` tier (the only valid tiers are `federal`, `state`, and `city`; there is no `district` tier in the schema). The district framing is expressed entirely through voice guidance in the locale config, not through a new tier value.

Washington, DC is a content-rich target. Unlike most US states (which hit the saturation wall at 50-70 unique questions per the Oregon retrospective), DC has a very dense civic identity: Home Rule Charter (1973), no voting Congressional representation, unique constitutional basis in Article I Section 8, an 8-ward council structure, Advisory Neighborhood Commissions, DC statehood debate, the non-voting Delegate role, the 23rd Amendment, and 5 individually elected executive officers. Content saturation is unlikely to be the main challenge. The bigger challenge is framing: DC should never be described as a "city" or a "state" — it is a federal district with elected local government, and every question should make the district framing legible.

The 2026 election creates a clean expiring-question structure: Mayor Muriel Bowser's term ends January 2, 2027 (she is not running again), Council Chair Phil Mendelson's term is also up in November 2026, and Attorney General Brian Schwalb's term ends January 2027. The non-voting Delegate Eleanor Holmes Norton is retiring in 2026. This means all four of DC's major expiring question targets (Mayor, Council Chair, AG, Delegate) change hands in November 2026 — set `expiresAt` to `"2027-01-02T00:00:00Z"` for all of them.

**Primary recommendation:** Use prefix `wdc`, slug `washington-dc`, theme `#C41E3A` (DC crimson, matching the District's official colors and flag), tier `city`, target 100 questions (1.4x buffer), and frame all questions as district-level facts — never "city" or "state."

---

## Standard Stack

No new dependencies. The existing collection pipeline handles everything.

### Core Scripts
| Script | Purpose | Notes |
|--------|---------|-------|
| `scaffold-collection.ts` | Scaffold seed entry, locale config, generator registration | Use `--tier city` (no district tier); apply Scaffold Bug 2 workaround immediately after |
| `generate-locale-questions.ts --locale washington-dc --fetch-sources` | Content generation + automatic semantic dedup | City collections use locale-configs/{slug}.ts |
| `audit-collection-readiness.ts --slug washington-dc --prefix wdc` | Validate question count + expiring ratio | Warns if expiring < 15% |
| `activate-collection.ts --slug washington-dc --prefix wdc` | Activate collection | Use `--dry-run` first |
| `verify-post-activation.ts` | Post-activation sanity check | Standard step |

### Reference Files
| File | Purpose |
|------|---------|
| `backend/src/scripts/content-generation/locale-configs/portland-or.ts` | Best reference for city locale config shape (city government, expiring/durable mix, voice guidance structure) |
| `backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts` | Best reference for mixed-durability voice guidance pattern and plural-executive framing |
| `backend/src/db/seed/collections.ts` | Add DC seed entry here (sortOrder: 14) |
| `.planning/COLLECTION-PLAYBOOK.md` | Retrospective template — fill and append at phase close |

**Installation:** No new packages required.

---

## Architecture Patterns

### Locale Config Location

DC is a city collection (not a state collection), so the config goes in:
```
backend/src/scripts/content-generation/locale-configs/washington-dc.ts
```
NOT in `state-configs/`. The generator discovers city configs from this directory.

### Scaffold Command

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Washington, DC" \
  --slug washington-dc \
  --prefix wdc \
  --theme "#C41E3A" \
  --tier city \
  --description "The District has no senators. Does that stump you?" \
  --sort-order 14
```

**Immediately after scaffolding:**
```bash
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If modified, revert (Scaffold Bug 2 workaround):
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts
```

Note: City collections DO need registration in `generate-locale-questions.ts` (unlike state collections which are auto-discovered). However, the scaffold script handles this automatically — the revert is only needed if the script corrupts the file.

### Seed Entry

Add to `backend/src/db/seed/collections.ts` (sortOrder: 14):

```typescript
{
  name: 'Washington, DC',
  slug: 'washington-dc',
  description: 'The District has no senators. Does that stump you?',
  localeCode: 'en-US',
  localeName: 'Washington, D.C.',
  iconIdentifier: 'flag-dc',
  themeColor: '#C41E3A',  // DC crimson
  tier: 'city',
  isActive: false,
  sortOrder: 14
}
```

Note: `iconIdentifier: 'flag-dc'` may need to fall back to `'flag-us'` or another valid identifier — check what identifiers are supported by the frontend before setting. The scaffold script will set it to the default for city tier; adjust manually if needed.

### Locale Config Shape

```typescript
// Source: portland-or.ts pattern (city config, not state config)
import type { LocaleConfig } from './bloomington-in.js';

export const washingtonDcConfig: LocaleConfig = {
  locale: 'washington-dc',
  name: 'Washington, DC',
  externalIdPrefix: 'wdc',
  collectionSlug: 'washington-dc',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.4,
  topicCategories: [ /* see below */ ],
  topicDistribution: { /* must sum to targetQuestions */ },
  sourceUrls: [ /* prefer Wikipedia URLs */ ],
};
```

Note: City configs export a single named export (`washingtonDcConfig`), not the two-export pattern used by state configs (`*Config` + `*StateFeatures`). Voice guidance for city configs is written directly into the `description` field of each `topicCategories` entry, not as a separate export.

### Anti-Patterns to Avoid

- **Using `tier: 'state'` or creating a new `tier: 'district'`:** The schema only supports `federal | state | city`. Use `city`. District framing is voice guidance, not a DB tier.
- **Calling DC a "city" in voice guidance:** Questions should say "the District" or "Washington, DC" — never "the city of Washington" or "Washington city government." The locale config voice guidance must enforce this explicitly.
- **Calling DC a "state" in voice guidance:** DC is not a state. Congress can override DC legislation. DC has no senators or voting House members. These distinctions matter.
- **Treating the US Capitol as DC's local government landmark:** The US Capitol is a federal institution, not DC's local government. DC's local government landmark is the John A. Wilson Building (DC City Hall), at 1350 Pennsylvania Ave NW.
- **Government portal URLs (dc.gov subdomains) as primary sources:** Per Portland Phase 58 and Oregon Phase 59 carry-forward rules, government portal pages return navigation/sitemap content. Use Wikipedia article URLs.
- **Confusion between federal AG and DC AG:** The US Attorney General (federal) and the DC Attorney General (local elected office) are separate positions. Questions about the DC AG should be clear they mean the local elected officer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic near-duplicate removal | Manual scan-duplicates.ts pass | Built into generate-locale-questions.ts (Phase 57) | Automatic after generation; within-collection dedup runs at >0.85 cosine similarity |
| Expiring question ratio check | Manual count | `audit-collection-readiness.ts` | Warns if ratio < 15%; already integrated |
| Collection activation | Manual DB update | `activate-collection.ts --dry-run` then activate | Includes safety checks |
| Question framing for district status | Per-question editing | Voice guidance in topicCategories descriptions | Generator injects framing guidance into every batch prompt |

**Key insight:** The framing challenge (district vs city vs state) is entirely solved by voice guidance in the locale config — no code changes needed. Write the guidance clearly and the generator handles it.

---

## DC Civic Facts for Voice Guidance

This is the core research payload — the facts the locale config MUST accurately represent.

### Government Structure (HIGH confidence — verified via dccouncil.gov, multiple news sources)

**DC is a federal district, not a state or city:**
- Created by Article I, Section 8, Clause 17 of the US Constitution, which gave Congress exclusive legislative authority over the capital district
- Congress can review, modify, or block any legislation passed by the DC Council
- Congress retains authority over the District's budget
- DC has no voting representation in the US House or Senate
- DC is not eligible for constitutional amendments (cannot ratify amendments)
- "Taxation Without Representation" is DC's motto on its license plates — a direct reference to this lack of representation

**Home Rule Charter (1973):**
- District of Columbia Home Rule Act enacted by Congress on December 24, 1973
- Approved by DC voters in a referendum in May 1974 (4-to-1 margin)
- Established the first directly elected Mayor and 13-member Council in DC's modern history
- DC residents had not elected local government since 1871 (governed by presidentially-appointed commissioners from 1874)
- Before Home Rule: DC had a Board of Commissioners (3 commissioners, 2 appointed by the President, 1 an Army Corps of Engineers officer)

**DC Council Structure (HIGH confidence — dccouncil.gov):**
- 13 members total: 1 Chairman elected at-large + 4 at-large members + 8 ward members (1 per ward)
- All members serve 4-year terms
- No term limits
- The Council can be overridden by Congress (30-day review period for legislation)
- Current Council Chair: Phil Mendelson (term expires January 2027)

**DC 8 Wards:**
- DC is divided into 8 wards, each represented by one Council member
- Ward boundaries were redrawn after each decennial census
- Advisory Neighborhood Commissions (ANCs): 37 ANCs elected within the 8-ward structure, each representing about 2,000 residents; established 1974, first elections 1975

**Elected Executive Officers:**
| Office | Current Holder | Party | Term End | expiresAt |
|--------|---------------|-------|----------|-----------|
| Mayor | Muriel Bowser | D | January 2, 2027 (not running for 4th term) | `"2027-01-02T00:00:00Z"` |
| Attorney General | Brian Schwalb | D | January 2027 (took office January 2, 2023) | `"2027-01-02T00:00:00Z"` |
| Council Chair | Phil Mendelson | D | January 2027 (up for election November 2026) | `"2027-01-02T00:00:00Z"` |

Note: DC Attorney General became an elected position in 2015 (previously appointed by the Mayor). This structural change is excellent trivia material.

**Non-Voting Delegate to Congress:**
- DC has a non-voting Delegate to the US House of Representatives (not a full voting member)
- The Delegate can vote in committee but NOT on the House floor
- DC has NO senators
- Eleanor Holmes Norton served as Delegate from 1991-2026; she announced retirement in January 2026
- The 2026 election will choose a new Delegate; the new Delegate takes office January 2027
- expiresAt for Delegate questions: `"2027-01-03T00:00:00Z"` (new Congress sworn in Jan 3)

Note: Because Norton is retiring and the question "Who is DC's delegate?" will have a new answer by January 2027, questions naming Norton should have expiresAt set. Durable questions about the ROLE of the delegate (non-voting, committee powers, etc.) should have `expiresAt: null`.

**23rd Amendment (1961):**
- Ratified March 29, 1961
- Gave DC residents the right to vote in presidential elections
- DC receives electoral votes equal to the least-populous state (currently 3 electoral votes)
- DC residents could not vote in presidential elections before 1964
- The amendment did NOT grant Congressional voting representation

**DC Court Structure (HIGH confidence — court websites, Britannica):**
- DC Superior Court: trial court, Chief Judge + 50 associate judges, hears criminal and civil cases
- DC Court of Appeals: DC's highest court (equivalent to a state supreme court), Chief Judge + 8 associate judges
- CRITICAL: All DC judges are appointed by the President of the United States and confirmed by the US Senate — NOT elected or appointed by the Mayor. This is a consequence of DC's federal status and is excellent trivia material.

**DC Statehood Debate:**
- DC residents have advocated for statehood since the 1980s
- The 1978 DC Voting Rights Amendment would have given DC full state-like representation; passed Congress by 2/3 majority but was ratified by only 16 of 38 required states and expired in 1985
- DC statehood bill has passed the House twice (2019, 2021) but not the Senate
- The proposed state name is "Washington, Douglass Commonwealth" (honoring Frederick Douglass)
- If DC became a state, the 23rd Amendment would give electoral votes to the 3 White House electors — considered a constitutional paradox; any statehood bill would need to address this

### Key Trivia Content Areas

**Must-include topics (HIGH value civic trivia):**
1. Home Rule Charter 1973 — when, what it granted, who approved it
2. No voting Congressional representation — the core DC civic fact
3. 23rd Amendment — DC presidential voting rights since 1964
4. DC Council structure — 13 members, 8 wards + 5 at-large
5. Congressional override authority — Congress can block DC laws (30-day review)
6. DC AG became elected in 2015 (before that: appointed)
7. DC judges are presidentially appointed (not elected or appointed by Mayor)
8. Advisory Neighborhood Commissions — hyper-local elected representation
9. John A. Wilson Building — DC's actual City Hall (NOT the US Capitol)
10. Home Rule void periods — DC went 103 years without elected local government (1871-1974)
11. "Taxation Without Representation" license plate motto
12. Marion Barry — 4-term Mayor, DC's longest-serving Mayor, Office of Mayor established under Home Rule
13. DC population larger than Wyoming and Vermont — yet no Senate representation
14. DC statehood debate — proposed name "Washington, Douglass Commonwealth"
15. Non-voting Delegate role — can vote in committee, not on floor

---

## Common Pitfalls

### Pitfall 1: Calling DC a "city" in questions
**What goes wrong:** Questions refer to "Washington City" or "the city of Washington" or describe the DC Council as a "city council."
**Why it happens:** DC is commonly described as a city in casual usage; generator may default to this framing.
**How to avoid:** Voice guidance must explicitly state: "NEVER call DC a 'city' in questions. Always refer to it as 'the District,' 'Washington, DC,' or 'the District of Columbia.' The DC Council is 'the Council of the District of Columbia,' not a 'city council.'"
**Warning signs:** Any question using the word "city" to describe DC's local government.

### Pitfall 2: Confusing federal DC institutions with DC local government
**What goes wrong:** Questions ask about Congress, the Supreme Court, or the White House as if they are DC's local government institutions.
**Why it happens:** DC IS both the federal capital and a local jurisdiction — the confusion is natural.
**How to avoid:** Voice guidance: "Questions must be about DC's LOCAL government — the Mayor, DC Council, DC courts (Superior Court and Court of Appeals), DC Attorney General, and DC Delegate to Congress. Federal institutions (US Congress, US Supreme Court, White House) are NOT DC local government — they would belong in the Federal collection."
**Warning signs:** Any question about Congress making DC laws, the President appointing DC's Mayor, or the Supreme Court as DC's highest court.

### Pitfall 3: Treating the US Capitol as DC's civic landmark
**What goes wrong:** The US Capitol appears as DC's "city hall" or primary civic landmark in questions.
**Why it happens:** The US Capitol is the most visually prominent building in DC.
**How to avoid:** Voice guidance: "The John A. Wilson Building (1350 Pennsylvania Ave NW) is DC's City Hall where the Mayor and Council work. The US Capitol is a federal building where Congress meets — it is NOT a DC local government building." The banner image should be the DC City Hall (John A. Wilson Building) or another distinctly DC local landmark — NOT the US Capitol (which appears in the Federal collection) and NOT the US Capitol dome.
**Warning signs:** Any question about the US Capitol in the context of DC's local government.

### Pitfall 4: Expiring question ratio — all four major expiring targets change in 2026
**What goes wrong:** Questions naming current Mayor, Council Chair, AG, and Delegate all expire simultaneously in January 2027.
**Why it happens:** All of DC's major elected positions are up in the November 2026 election.
**How to avoid:** This is expected and correct — set expiresAt to `"2027-01-02T00:00:00Z"` for Mayor, AG, and Council Chair; `"2027-01-03T00:00:00Z"` for the Delegate (new Congress sworn in Jan 3). The collection will need a question refresh after January 2027. Document this in the retrospective.
**Warning signs:** None — this is a known structural feature of the DC election cycle.

### Pitfall 5: Government portal URLs returning navigation content
**What goes wrong:** dc.gov, dccouncil.gov, and mayor.dc.gov pages return website navigation or press releases rather than encyclopedic civic content.
**Why it happens:** Confirmed pattern from Portland (Phase 58) and Oregon (Phase 59) retrospectives.
**How to avoid:** Use Wikipedia article URLs as primary sources. Spot-check 2-3 source URLs before running `--fetch-sources`.
**Warning signs:** Questions that sound like website category names or agency descriptions.

### Pitfall 6: Including national monuments as DC civic questions
**What goes wrong:** Questions about the Lincoln Memorial, Washington Monument, Jefferson Memorial appear in the DC collection — but these are federal memorials managed by the National Park Service, not DC civic institutions.
**Why it happens:** These landmarks are physically in DC and are iconic DC images.
**How to avoid:** Voice guidance: "Questions about national monuments (Lincoln Memorial, Washington Monument, Jefferson Memorial, WWII Memorial, etc.) belong in the Federal collection, not DC's local collection. DC civic questions are about the local government, the district's history of self-governance, and the DC-specific institutions."
**Warning signs:** Questions about National Mall monuments or Smithsonian museums in the context of DC local governance.

### Pitfall 7: Content saturation unlikely but plan for gap-fill
**What goes wrong:** Three generation runs yield 50-70 unique questions; supplementation required.
**Why it happens:** Oregon hit this wall at the state level; DC has more topic variety but similar bounded facts.
**How to avoid:** DC's civic identity is exceptionally rich (constitutional status, Home Rule history, ANC system, court structure, statehood debate, notable Mayors, ward system) — content saturation is less likely than Oregon. However, plan for one or two gap-fill passes if needed. Pre-draft a "topics not yet covered" checklist before any supplementation pass.
**Warning signs:** After two generation runs, if fewer than 60 unique questions exist, plan for a manual supplementation pass.

---

## Code Examples

### ExpiresAt Values for DC Officeholders

```typescript
// Mayor Muriel Bowser (term ends January 2, 2027; not seeking 4th term)
expiresAt: "2027-01-02T00:00:00Z"

// DC Attorney General Brian Schwalb (4-year term, took office January 2023)
expiresAt: "2027-01-02T00:00:00Z"

// Council Chair Phil Mendelson (up for election November 2026)
expiresAt: "2027-01-02T00:00:00Z"

// Non-voting Delegate to Congress (new Congress sworn in Jan 3)
// Eleanor Holmes Norton retiring; new delegate elected November 2026
expiresAt: "2027-01-03T00:00:00Z"

// Structural/historical/durable facts (Home Rule Charter, 23rd Amendment, ward structure, etc.)
expiresAt: null
```

### Recommended Source URLs for Washington, DC

```typescript
sourceUrls: [
  // Primary civic structure — Wikipedia (preferred over government portals)
  'https://en.wikipedia.org/wiki/Washington,_D.C.',
  'https://en.wikipedia.org/wiki/District_of_Columbia_home_rule',
  'https://en.wikipedia.org/wiki/District_of_Columbia_Home_Rule_Act',
  'https://en.wikipedia.org/wiki/Council_of_the_District_of_Columbia',
  'https://en.wikipedia.org/wiki/Government_of_the_District_of_Columbia',
  'https://en.wikipedia.org/wiki/Mayor_of_the_District_of_Columbia',
  // Constitutional status
  'https://en.wikipedia.org/wiki/Twenty-third_Amendment_to_the_United_States_Constitution',
  'https://en.wikipedia.org/wiki/District_of_Columbia_voting_rights',
  'https://en.wikipedia.org/wiki/Washington_D.C._statehood_movement',
  // Court structure
  'https://en.wikipedia.org/wiki/District_of_Columbia_Court_of_Appeals',
  'https://en.wikipedia.org/wiki/Superior_Court_of_the_District_of_Columbia',
  // History
  'https://en.wikipedia.org/wiki/History_of_Washington,_D.C.',
  // Delegate
  'https://en.wikipedia.org/wiki/District_of_Columbia_Delegate',
  // Advisory Neighborhood Commissions
  'https://en.wikipedia.org/wiki/Advisory_Neighborhood_Commission',
  // Government pages (supplementary only — verify before using)
  'https://dccouncil.gov/dc-home-rule/',
  'https://statehood.dc.gov/page/dc-governance',
],
```

### Recommended Topic Distribution

```typescript
topicCategories: [
  {
    slug: 'dc-government-structure',
    name: 'DC Government & Home Rule',
    description: 'The DC Council (13 members: Chairman + 4 at-large + 8 ward representatives), Mayor (executive; 4-year term; no term limits), DC Attorney General (elected since 2015), Home Rule Charter (1973, Congress enacted December 24; voters approved May 1974), 103 years without elected government (1871-1974), Board of Commissioners predecessor government, Congressional override authority (30-day review). FRAMING: Always "the District" — never "city government."',
  },
  {
    slug: 'constitutional-status',
    name: 'Constitutional Status & Representation',
    description: 'Article I Section 8 Clause 17 (District Clause — congressional authority), no voting representation in Congress (no senators, no voting House member), non-voting Delegate (votes in committee, not on floor), 23rd Amendment (1961, ratified 1961, took effect 1964 presidential election, DC receives electoral votes equal to least-populous state — currently 3), "Taxation Without Representation" license plate motto, DC Voting Rights Amendment (1978, passed Congress but expired 1985 without ratification), DC statehood debate (proposed name: Washington, Douglass Commonwealth).',
  },
  {
    slug: 'dc-courts-judiciary',
    name: 'DC Courts',
    description: 'DC Superior Court (trial court, Chief Judge + 50 associate judges), DC Court of Appeals (highest court in DC, Chief Judge + 8 associate judges), CRITICAL: all DC judges appointed by the President of the United States and confirmed by the US Senate — NOT elected, NOT appointed by the Mayor. This is a consequence of DC\'s federal status. Federal courts in DC (US District Court, DC Circuit) are NOT DC local courts.',
  },
  {
    slug: 'ward-neighborhood-structure',
    name: 'Wards & Neighborhoods',
    description: 'DC divided into 8 wards (each with 1 Council representative), Advisory Neighborhood Commissions (ANCs) — 37 ANCs created by Home Rule Act, first elections 1975; each represents ~2,000 residents within wards. ANCs are advisory — they vote on local issues but cannot pass binding laws. Ward boundaries redrawn after each census. DC is also divided into quadrants (NW, NE, SE, SW) radiating from the Capitol building.',
  },
  {
    slug: 'dc-history',
    name: 'DC History & Founding',
    description: 'Founding: Capital established by Congress in 1790 (Residence Act), President Washington selected Potomac site; capital moved from Philadelphia in 1800. Pierre Charles L\'Enfant\'s original city plan (1791). DC created from land ceded by Maryland and Virginia (Virginia\'s portion retroceded in 1846). Marion Barry — 4-term Mayor (1979-91, 1995-99), DC\'s most prominent Mayor. Sharon Pratt became first Black woman elected Mayor of a major US city (1991). DC budget: subject to Congressional approval.',
  },
  {
    slug: 'dc-civic-identity',
    name: 'DC Civic Identity',
    description: 'John A. Wilson Building — DC City Hall (1350 Pennsylvania Avenue NW), where the Mayor and DC Council work; NOT to be confused with the US Capitol. DC population ~700,000 (larger than Wyoming and Vermont but with no Senate representation). "Chocolate City" nickname (historical, from 1970s population demographics). DC Public Schools (DCPS) — under DC government, not federal control. DC budget process: submitted by Mayor, passed by Council, subject to Congressional appropriation review.',
  },
],

topicDistribution: {
  'dc-government-structure': 30,      // highest allocation — core civic content
  'constitutional-status': 25,        // DC's defining civic feature
  'dc-courts-judiciary': 15,          // distinctive judicial appointment structure
  'ward-neighborhood-structure': 10,  // hyperlocal civic engagement structure
  'dc-history': 12,                   // founding, notable mayors
  'dc-civic-identity': 8,             // City Hall, population facts, civic pride
  // Total: 100
},
```

### Generation Command

```bash
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale washington-dc \
  --fetch-sources
```

### Audit and Activation

```bash
cd backend
# Audit first
npx tsx src/scripts/audit-collection-readiness.ts --slug washington-dc --prefix wdc

# Dry run activation
npx tsx src/scripts/activate-collection.ts --slug washington-dc --prefix wdc --dry-run

# Activate
npx tsx src/scripts/activate-collection.ts --slug washington-dc --prefix wdc
```

---

## Configuration Reference

### Slug, Prefix, Theme, Tier

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `--slug` | `washington-dc` | Standard format matching existing city collections (portland-or, cambridge-ma, etc.) |
| `--prefix` | `wdc` | 3-letter, no conflicts with existing: `bli, lac, fre, nur, ins, cas, cam, mas, pla, tex, por, ore` |
| `--theme` | `#C41E3A` | DC crimson — matches the DC flag's red color (white field with red stars and bar from the Washington coat of arms); visually distinct from all existing collection colors |
| `--tier` | `city` | The only valid options are `federal`, `state`, `city`. No `district` tier exists in the schema. District framing goes in voice guidance. |
| `--sort-order` | `14` | Next after Oregon (sortOrder: 13) |

### Theme Color Options Considered

| Color | Hex | Rationale | Decision |
|-------|-----|-----------|----------|
| DC crimson (flag red) | `#C41E3A` | Matches DC's official flag — white with 2 red horizontal bars and 3 red stars. Highly recognizable. | **RECOMMENDED** |
| DC flag background (white) | N/A | White background not suitable for UI cards | Rejected |
| Federal blue (like Federal collection) | `#1E3A8A` | Too similar to existing Federal collection color | Rejected |

### Banner Image

**Banner image for DC: DC City Hall (John A. Wilson Building)**

Per the playbook: "City collections = iconic local landmark." The banner should NOT be:
- The US Capitol (federal building, appears in Federal collection)
- The Lincoln Memorial or Washington Monument (federal monuments, National Park Service)
- The White House (federal building)

The banner SHOULD be one of:
1. **John A. Wilson Building (DC City Hall)** — 1350 Pennsylvania Avenue NW; the actual seat of DC's local government. A Beaux-Arts building from 1908. Strongly recommended as the most distinctly DC local government image.
2. **DC Flag/skyline** — The DC flag (3 red stars and 2 red bars) is one of the most distinctive city flags in the US. A skyline shot including the flag could work.
3. **DC Judicial Court building** — The DC Court of Appeals building is another landmark of DC self-governance.

**File to add:** `frontend/public/images/collections/washington-dc.jpg`

### Tagline

**Recommended:** `"The District has no senators. Does that stump you?"`

Rationale: Uses a specific, surprising civic fact (no Senate representation); asks a challenge question in line with playbook style; "the District" framing is built in from the first word; accurately represents the most unusual aspect of DC civic life.

**Alternatives:**
- `"No senators, no voting House seat. Quiz the District."` — direct, punchy
- `"Home rule, no Senate, and three electoral votes. Ready?"` — covers more ground
- `"Taxed without representation since 1791. Think you know D.C.?"` — historical framing

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Manual scan-duplicates.ts after generation | Automatic semantic dedup in generate-locale-questions.ts | Phase 57 | No separate dedup pass needed |
| Government portal URLs as primary sources | Wikipedia article URLs preferred | Phase 58 learning | Higher quality source content |
| 70 targetQuestions for state/city | 100 targetQuestions | Phase 50 (MA), confirmed across Portland and Oregon | 80+ active question target requires higher buffer |
| Expiring ratio: no floor | Expiring ratio: 15% floor warning | Phase 57 | audit-collection-readiness.ts warns; document if below |
| No pre-generation source check | Spot-check 2-3 source URLs before --fetch-sources | Phase 58 learning | Catches navigation-only pages |

**Scaffold Bug 2 remains active:** After `scaffold-collection.ts`, check and revert `generate-locale-questions.ts` if modified. City collections DO need registration in that file, but the scaffold handles it — only revert if the file is corrupted (i.e., an extra string was incorrectly injected into a type annotation line).

---

## Open Questions

1. **`iconIdentifier` for DC**
   - What we know: Existing entries use values like `flag-us`, `flag-ca`, `flag-or`, `flag-tx`, `flag-in`, `flag-ma`, `flag-gb`, `state`. The scaffold will use a default.
   - What's unclear: Whether `flag-dc` is a valid iconIdentifier supported by the frontend; the DC flag is distinctive.
   - Recommendation: Let the scaffold set the default; check what value it generates against the frontend's supported identifiers. If `flag-dc` is not supported, `flag-us` is the appropriate fallback.

2. **Expiring question ratio ceiling**
   - What we know: DC has four major expiring question targets (Mayor, Council Chair, AG, Delegate). With 80+ questions, the ceiling is 5% with just those four. However, individual ward council members (8 ward seats + 4 at-large) are also expiring targets.
   - What's unclear: Whether generating ward-level council member questions provides enough distinct content to reach 15%.
   - Recommendation: Include questions about current ward representatives (Phil Mendelson as Chair, plus 2-3 at-large members). If ratio still falls below 15%, document in retrospective with rationale — the Oregon pattern applies here too: do not force artificial expiring questions.

3. **Whether City Hall (John A Wilson Building) banner image is sourceable**
   - What we know: The John A. Wilson Building is a public building; photos exist.
   - What's unclear: Whether an appropriate-quality, appropriately-licensed image has been pre-sourced.
   - Recommendation: Planner should include a task to provide `frontend/public/images/collections/washington-dc.jpg` showing the John A. Wilson Building or another distinctly DC local landmark.

---

## Sources

### Primary (HIGH confidence)
- DC Council official site (dccouncil.gov/dc-home-rule) — Home Rule Act details, council structure, Congressional oversight
- Smithsonian Magazine: "How the 1973 D.C. Home Rule Act Enabled the Nation's Capital to Govern Itself" — history and context
- US Attorney General for DC (oag.dc.gov) — Brian Schwalb's office, AG term confirmed as 4 years starting January 2023
- NBC Washington (nbcwashington.com) — Mayor Bowser's retirement announcement, term end January 2, 2027
- GovTrack / Congress.gov — Eleanor Holmes Norton retirement (January 2026 announcement)
- Brennan Center for Justice — DC Statehood facts, proposed name "Washington, Douglass Commonwealth"

### Secondary (MEDIUM confidence — WebSearch verified with multiple sources)
- Multiple DC news sources (WUSA9, WTOP, NBC Washington) confirming 2026 DC election timing and candidates: Mayor, Council Chair, Delegate all on November 2026 ballot
- FindLaw / Constitution Center — 23rd Amendment facts (1961 ratification, DC gets electoral votes equal to least-populous state)
- Britannica / Wikipedia — DC Superior Court structure (50 associate judges), DC Court of Appeals (8 associate judges), presidential appointment of DC judges

### Tertiary (LOW confidence — single or secondary sources, flag for validation)
- Ward Council Member expiration dates: term end dates for individual at-large members not independently verified. Confirm before including specific at-large members' names in voice guidance.
- "Washington, Douglass Commonwealth" as proposed statehood name: confirmed in multiple sources but should be noted as subject to change if new legislation is introduced.

---

## Metadata

**Confidence breakdown:**
- Standard pipeline (scaffold, generate, audit, activate): HIGH — identical to Portland/Oregon pipeline; no new tools
- DC government structure (Mayor, Council, Home Rule): HIGH — verified via official DC government sources and multiple news sources
- Constitutional status (no voting Congress, 23rd Amendment): HIGH — verified via Congress.gov, Constitution Center, Brennan Center
- Current officeholders and term dates: HIGH — Mayor Bowser confirmed retiring Jan 2027; AG Schwalb 4-year term confirmed; Council Chair Mendelson up Nov 2026
- DC court structure (presidential appointment): HIGH — confirmed Britannica, multiple official sources
- Tier decision (use `city` not `district`): HIGH — verified directly in schema.ts (`'federal' | 'state' | 'city'` only)
- Banner image recommendation (Wilson Building): MEDIUM — appropriate choice given playbook rules, but image sourcing not confirmed

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days; officeholder accuracy stable until November 2026 election)
