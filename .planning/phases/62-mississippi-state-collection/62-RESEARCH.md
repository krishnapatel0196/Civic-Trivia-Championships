# Phase 62: Mississippi State Collection - Research

**Researched:** 2026-03-14
**Domain:** State collection scaffolding, Mississippi civic content generation, mixed-durability question pattern, collection activation, v2.1 milestone retrospective
**Confidence:** HIGH

---

## Summary

Phase 62 follows the established state collection pipeline exactly: scaffold → author locale config in `state-configs/` → seed → generate → curate → banner image → audit → activate → retrospective. No new infrastructure is required. The complete pipeline — `scaffold-collection.ts`, `generate-locale-questions.ts` (automatic semantic dedup), `audit-collection-readiness.ts`, `activate-collection.ts` — is fully proven across Oregon (Phase 59), Washington DC (Phase 60), and Biloxi (Phase 61).

Mississippi has a strong, distinctive civic identity. Its most productive content areas are: a powerful and detailed civil rights history (Medgar Evers, James Meredith, Fannie Lou Hamer, Freedom Summer 1964, Emmett Till murder), a politically distinctive government structure (Lt. Governor is one of the most powerful in the nation; governor is one of the weakest), the 2020 flag referendum (a civic legislative event with rich factual detail), statehood on December 10, 1817 as the 20th state, the Natchez Trace, the Mississippi River and Delta, the 1890 Constitution's voter suppression mechanisms, and significant statewide economic facts (No. 1 catfish producer, automotive industry presence, casino Gaming Control Act 1990, Stennis Space Center). The state-scale rule is critical: Jackson, Gulfport, Natchez, and Biloxi appear only when anchoring a statewide institution or event — never for city-level government.

The expiring question picture is well-defined. All current statewide elected officials (Governor, Lt. Governor, AG, Secretary of State, Treasurer, and others) were elected November 7, 2023 and their terms end January 13, 2028. The CONTEXT.md decision targets 7 expiring question subjects (Gov, Lt. Gov, AG, SoS, Treasurer + House Speaker + Lt. Speaker). Mississippi's state-scale structure — like Oregon — will likely yield 7–10% expiring questions naturally from the main generator; a targeted officeholder pass is required per the Phase 60/61 carry-forward rule. The Oregon ceiling pattern (7.4%) is the realistic worst case; hitting 15% is achievable if the officeholder pass seeds 2–3 questions per the 7 target offices.

**Primary recommendation:** Use prefix `mis`, slug `mississippi-state`, theme `#1A3A5C` (deep Gulf Coast navy blue), tier `state`, target 100 questions with 1.4x overshoot. Expect 2–3 generation runs and plan for supplementation of 20–30 questions from known gap topics — judiciary, Natchez Trace, Delta geography, economic policy, and Emmett Till civic impact. Follow the Oregon supplementation pattern exactly.

---

## Standard Stack

No new dependencies. The existing collection generation pipeline handles everything.

### Core Scripts

| Script | Purpose | Notes |
|--------|---------|-------|
| `scaffold-collection.ts` | Scaffold seed entry, locale config, generator registration | Apply Scaffold Bug 2 workaround immediately after (every time) |
| `generate-locale-questions.ts --locale mississippi-state --fetch-sources` | Content generation + automatic semantic dedup | State configs auto-discovered from `state-configs/` dir |
| `audit-collection-readiness.ts --slug mississippi-state --prefix mis` | Validate question count + expiring ratio | Warns if expiring < 15%; non-blocking |
| `activate-collection.ts --slug mississippi-state --prefix mis` | Activate collection | Use `--dry-run` first |

### Reference Files

| File | Purpose |
|------|---------|
| `backend/src/scripts/content-generation/locale-configs/state-configs/oregon-state.ts` | Best reference: config shape, two-export pattern (`*Config` + `*StateFeatures`), voice guidance depth |
| `backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts` | Reference for mixed-durability pattern, plural executive voice guidance |
| `backend/src/db/seed/collections.ts` | Add Mississippi State seed entry here (sortOrder: 16) |
| `.planning/COLLECTION-PLAYBOOK.md` | Retrospective template — fill and append at phase close; Phase 62 also adds milestone-level summary |

**Installation:** No new packages required.

---

## Architecture Patterns

### Locale Config Location

Mississippi State is a state collection. Config goes in:
```
backend/src/scripts/content-generation/locale-configs/state-configs/mississippi-state.ts
```

NOT in `locale-configs/` (city location). The generator auto-discovers state configs from the `state-configs/` directory — no manual registration in `generate-locale-questions.ts` is needed.

### Scaffold Command

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Mississippi" \
  --slug mississippi-state \
  --prefix mis \
  --theme "#1A3A5C" \
  --description "The birthplace of civil rights, country blues, and catfish. Do you know your Mississippi?"
```

**Immediately after scaffolding — mandatory Scaffold Bug 2 workaround:**
```bash
# Step 1: Check for corruption
git diff backend/src/scripts/content-generation/generate-locale-questions.ts

# Step 2: If file is modified, revert it
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts

# Step 3: Manually add import and config registration if needed
# (State configs are auto-discovered — no registration needed in generate-locale-questions.ts)

# Step 4: Verify localeName is short-form (not expanded)
# Should be: localeName: 'Mississippi'
# NOT: localeName: 'Mississippi, Mississippi'

# Step 5: Verify description doesn't have apostrophe string-termination bug
# If tagline contains an apostrophe, use double-quote string:
# description: "The birthplace of ..."  (double-quotes, not single-quotes)
```

Note: The description above contains no apostrophe, so no double-quote wrapping needed. If the tagline is changed to one with a contraction, use double quotes (Biloxi Phase 61 bug).

### Seed Entry

Add to `backend/src/db/seed/collections.ts` (sortOrder: 16 — after Biloxi at 15):

```typescript
{
  name: 'Mississippi',
  slug: 'mississippi-state',
  description: 'The birthplace of civil rights, country blues, and catfish. Do you know your Mississippi?',
  localeCode: 'en-US',
  localeName: 'Mississippi',
  iconIdentifier: 'state',
  themeColor: '#1A3A5C',
  tier: 'state',
  isActive: false,
  sortOrder: 16
}
```

### State Config Export Pattern

```typescript
// Source: oregon-state.ts pattern (two named exports)
import type { LocaleConfig } from '../bloomington-in.js';

export const mississippiStateConfig: LocaleConfig = {
  locale: 'mississippi-state',
  name: 'Mississippi',
  externalIdPrefix: 'mis',
  collectionSlug: 'mississippi-state',
  targetQuestions: 100,
  batchSize: 25,
  topicCategories: [ /* see Topic Distribution section below */ ],
  topicDistribution: { /* must sum to targetQuestions = 100 */ },
  sourceUrls: [ /* see Source URLs section below */ ],
};

export const mississippiStateFeatures = `
// Voice guidance injected into buildStateSystemPrompt()
// See full voice guidance content in Code Examples section
`;
```

### Anti-Patterns to Avoid

- **Including Jackson city government facts:** Jackson is the capital and can be referenced as the seat of state government. No Jackson mayor, city council, Ward districts, or Jackson-specific institutions. Apply zero-tolerance: if a question could belong to a future "Jackson, MS" city collection, cut it.
- **Gulfport, Biloxi, Natchez as subjects in their own right:** These cities appear only when anchoring a statewide institution or event. "The 2020 flag referendum was signed by Governor Reeves in Jackson" is OK; anything about Biloxi city government is a city-scale fact (already covered in Phase 61).
- **Editorializing on the flag change or civil rights history:** The CONTEXT.md decision mandates strictly neutral framing. "In what year did Mississippi replace its state flag?" is right. "Mississippi finally removed the Confederate symbol" is editorializing — cut it.
- **Including pop culture figures without civic connection:** Musicians, athletes with no civic angle are explicitly out of scope per CONTEXT.md. Medgar Evers, James Meredith, and Fannie Lou Hamer are in scope because of their civic/political contributions.
- **County government content:** 82 counties — explicitly excluded per CONTEXT.md. No county commissioner, county seat, or county government questions.
- **Government portal URLs as primary sources:** ms.gov pages return navigation content. Use Wikipedia article URLs as primary sources.
- **Confusing Tate Reeves' term end:** Reeves' second term ends January 13, 2028 (not January 2027 like Oregon's governor). Use `"2028-01-13T00:00:00Z"` for all current-term officeholders.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic near-duplicate removal | Manual scan-duplicates pass | Built into `generate-locale-questions.ts` (Phase 57) | Automatic; within-collection dedup at >0.85 cosine similarity |
| Expiring question ratio check | Manual count | `audit-collection-readiness.ts` | Warns if ratio < 15%; already integrated |
| Collection activation | Manual DB update | `activate-collection.ts --dry-run` then activate | Includes safety checks |
| Officeholder expiresAt | Rely on main generator | Targeted officeholder pass (modeled on `generate-biloxi-officeholder-questions.ts`) | Main generator does not reliably apply expiresAt even when locale config declares officeholders — confirmed in Phase 60 and Phase 61 |
| Pre-supplementation gap analysis | Guessing from memory | Query DB for draft questions mapped against topic areas | Systematic gap identification before manual insert pass (Oregon Phase 59 pattern) |

**Key insight:** Two things are confirmed-mandatory that are NOT handled by the main generator: (1) expiring `expiresAt` on officeholder questions requires a targeted pass; (2) reaching 80+ unique questions for a state collection typically requires 2–3 generation runs plus a supplementation pass (Oregon Pattern: 56 unique from 3 automated runs + 25 hand-crafted = 81 total).

---

## Mississippi Civic Facts for Voice Guidance

This is the core research payload — the facts the locale config MUST accurately represent.

### Government Structure (HIGH confidence — verified via Ballotpedia, Wikipedia, Mississippi Encyclopedia)

**Executive Branch Structure:**
Mississippi has a plural executive — multiple independently elected statewide officials. Unlike states where the Governor appoints most executive roles, Mississippi voters elect all of the following to 4-year terms:
- Governor (term-limited to 2 consecutive terms)
- Lieutenant Governor
- Attorney General
- Secretary of State
- Treasurer
- State Auditor
- Commissioner of Agriculture and Commerce
- Commissioner of Insurance
- Three-member Public Service Commission
- Three-member Transportation Commission

**Governor vs. Lt. Governor Power Dynamic (distinctive trivia):**
Political scientists consistently rank Mississippi's Governor as one of the *weakest* in the nation, and the Lt. Governor as one of the *most powerful*. The Lt. Governor is the only official who is a member of *two* branches of state government — simultaneously serving as president of the Senate and as a member of the executive branch. The Lt. Governor can vote in case of a tie, assigns bills to committees, largely sets the Senate's legislative agenda, and appoints committees and their chairs. Additionally, the Lt. Governor becomes acting governor whenever the governor leaves the state.

**Current Statewide Elected Officials and Term Expirations:**

All current statewide elected officials were elected November 7, 2023 and their 4-year terms end January 13, 2028.

| Office | Current Holder | Party | expiresAt |
|--------|---------------|-------|-----------|
| Governor | Tate Reeves | R | `"2028-01-13T00:00:00Z"` |
| Lieutenant Governor | Delbert Hosemann | R | `"2028-01-13T00:00:00Z"` |
| Attorney General | Lynn Fitch | R | `"2028-01-13T00:00:00Z"` |
| Secretary of State | Michael D. Watson Jr. | R | `"2028-01-13T00:00:00Z"` |
| Treasurer | David McRae | R | `"2028-01-13T00:00:00Z"` |
| State Auditor | Shad White | R | `"2028-01-13T00:00:00Z"` |

**Note on Tate Reeves:** Reeves is term-limited (2 consecutive terms) and cannot run for governor in 2027. A 2027 gubernatorial election will be held on November 2, 2027. Governor questions should use expiresAt `"2028-01-13T00:00:00Z"`.

**Note on Lynn Fitch:** First woman to serve as Mississippi Attorney General. Elected in 2019 (first term) and re-elected in 2023.

**Note on Michael Watson:** Watson announced in March 2026 he will not seek a third Secretary of State term and hinted at running for Lieutenant Governor in 2027. Questions about him as current SoS remain valid through the term end.

**Legislature (HIGH confidence — Wikipedia, Mississippi Legislature official site):**
- Bicameral: Mississippi State Senate (52 members) + Mississippi House of Representatives (122 members)
- Both chambers: 4-year terms, NOT 2-year terms (unlike most states)
- Mississippi Legislature meets in annual session starting in January
- Current House Speaker: Jason White
- Current Speaker Pro Tempore: Manly Barton
- Lt. Governor Delbert Hosemann serves as Senate President (per constitutional role)
- Senate President Pro Tempore: Dean Kirby
- Use `"2028-01-13T00:00:00Z"` for all legislative leadership expiring questions (same 4-year cycle as all officials elected Nov 2023)

**Judiciary (HIGH confidence — Mississippi courts.ms.gov, Ballotpedia):**
- Mississippi Supreme Court: 9 justices serving 8-year nonpartisan staggered terms, elected from 3 districts
- Current Chief Justice: Michael K. Randolph (most-senior-tenured justice)
- Two-tier appellate system: Supreme Court (court of last resort) + Mississippi Court of Appeals (intermediate appellate)
- Circuit Courts (trial courts of general jurisdiction), Chancery Courts, County Courts
- Judges are elected on nonpartisan ballots

### Mississippi History and Statehood (HIGH confidence — multiple encyclopedic sources)

- Mississippi admitted to the Union on **December 10, 1817** as the **20th state**
- First capital was Natchez (where the 1817 constitutional convention was held, near the town of Washington)
- Jackson became the permanent capital in 1822 (named for Andrew Jackson)
- Mississippi was part of the Mississippi Territory (est. 1798) before statehood
- First inhabited by numerous Native American tribes including the Natchez, Choctaw, and Chickasaw nations
- Mississippi's 1890 Constitution: Adopted to disenfranchise Black voters — required poll taxes and literacy tests; 134 convention delegates (133 white, 1 Black) despite state having 58% Black population; the 1890 Constitution explicitly removed references to "justice," "liberty," "right," and "freedom" from the preamble
- Current Mississippi Constitution: The 1890 constitution (as amended) remains the governing document — Mississippi has had 4 constitutions total (1817, 1832, 1869, 1890)

### Mississippi State Capitol (HIGH confidence — Wikipedia, MS Legislature official site)

- The current Mississippi State Capitol is the **third** capitol building in Jackson
  - First completed 1822 (no longer stands)
  - Second completed 1839 (now the **Old Capitol Museum**)
  - Third (current): built 1901–1903 on the site of the old state penitentiary
- Construction cost: more than $1 million (funded by back taxes from a lawsuit settlement with the Illinois Central Railroad — distinctive trivia)
- Architect: Theodore Link (St. Louis)
- Architectural style: Beaux Arts classicism
- Dimensions: 402 feet wide, 225 feet deep, 171,000 sq ft; central dome rises 180 feet above ground
- Designated Mississippi Landmark in 1986; National Historic Landmark in 2016
- The tympanum sculpture on the exterior depicts Mother Mississippi with her foot on a bale of cotton
- The Capitol Rally marker on the north side commemorates the 1966 "March Against Fear" (James Meredith march) — part of the Mississippi Freedom Trail
- Hall of Governors on first floor: portraits of governors since 1798 (Mississippi Territory) and 1817 (statehood)
- **Banner image for collection:** Must be the Mississippi State Capitol building (hard rule for all state collections)

### Mississippi Geography (HIGH confidence — multiple encyclopedic sources)

Key geographic facts at state scale (not city scale):
- The Mississippi River forms the entire western border of the state
- The Mississippi Delta region: the broad, flat alluvial floodplain in northwestern Mississippi between the Mississippi and Yazoo rivers. The "Delta" is economically and culturally one of the most distinctive regions in American history — birthplace of the blues, center of the cotton economy.
- Gulf Coast region: Mississippi has about 44 miles of coastline on the Gulf of Mexico
- Natchez Trace Parkway: A 444-mile scenic road (federal parkway under NPS jurisdiction) running from Natchez, MS to Nashville, TN, following the historic Natchez Trace trail used by Native Americans, European settlers, and traders
- Highest point: Woodall Mountain (806 feet) — one of the lowest state high points in the US (6th lowest)
- The Piney Woods region in southern Mississippi; the Black Belt prairie region in eastern Mississippi

### Civil Rights History (HIGH confidence — Wikipedia, NAACP, Freedom Summer documentation)

These are civic history facts, not cultural content. Treat with the same gravity as any other historical content.

**Medgar Evers:**
- NAACP's first field secretary in Mississippi (1954)
- Established new NAACP chapters, organized voter registration drives
- Supported James Meredith's effort to enroll at the University of Mississippi
- Assassinated at his home in Jackson on June 12, 1963
- His killer: Byron De La Beckwith (convicted in 1994, 31 years after the murder)
- His home is now the Medgar and Myrlie Evers Home National Monument

**James Meredith:**
- First African American student to enroll at the University of Mississippi (Ole Miss), 1962
- His enrollment required a US Supreme Court order and was blocked by state officials; after riots leaving 2 dead, he enrolled under protection of federal marshals
- In 1966, began the "March Against Fear" solo walk from Memphis to Jackson — after being shot, other civil rights leaders including Martin Luther King Jr. and Stokely Carmichael took up the march

**Fannie Lou Hamer:**
- Co-founded and became vice-chair of the Mississippi Freedom Democratic Party (MFDP) in 1964
- The MFDP was established after African Americans were excluded from the regular (all-white) Mississippi Democratic Party
- At the 1964 Democratic National Convention in Atlantic City, Hamer testified about voter suppression in Mississippi — her testimony was nationally televised
- Her "I'm sick and tired of being sick and tired" became one of the most famous phrases of the civil rights movement
- Born in Sunflower County, Mississippi; worked as a sharecropper before becoming a civil rights leader

**Freedom Summer (1964):**
- Organized voter registration campaign in Mississippi, summer of 1964
- Three workers — James Chaney (Black, Mississippi), Andrew Goodman (white, New York), Michael Schwerner (white, New York) — went missing June 21, 1964; found murdered, killed by Klan with law enforcement complicity
- In 1962, fewer than 7% of eligible Black Mississippi voters were registered — lowest rate in the country
- The murders galvanized national attention and contributed to passage of the Civil Rights Act of 1964 and Voting Rights Act of 1965

**Emmett Till:**
- 14-year-old Black teenager from Chicago visiting relatives in Money, Mississippi
- Murdered August 28, 1955 by Roy Bryant and J.W. Milam
- His mother Mamie Till-Mobley insisted on an open-casket funeral, with photos published in Jet magazine — galvanizing the national civil rights movement
- His murder is cited as one of the events that catalyzed the civil rights movement
- Emmett Till Antilynching Act signed into law by President Biden in 2022

**Mississippi Civil Rights Museum:**
- Located in Jackson, opened 2017
- Operated by the Mississippi Department of Archives and History (MDAH)
- This is a state civic institution — appropriate for the state collection

### 2020 Flag Referendum (HIGH confidence — Wikipedia, CNN, multiple news sources)

- Mississippi was the last state with a Confederate battle emblem in its state flag
- On June 28, 2020, the Mississippi Legislature passed HB 1796, retiring the old flag (which had featured the Confederate battle emblem in the canton since 1894) and creating a commission to design a new flag
- The commission received 2,000+ design submissions; on September 2, 2020, voted 8–1 to select the "New Magnolia Flag" design
- The new flag was placed on the November 3, 2020 ballot as a legislatively referred referendum
- Voters approved the new design 73% to 27%
- The new design features: a white magnolia flower on a blue background, with red and gold bars; text "In God We Trust" — officially called the "In God We Trust Flag"
- The new flag was officially signed into law by Governor Reeves on January 11, 2021
- The magnolia is the state flower and state tree — making the new flag design doubly symbolic
- Designer credit: Rocky Vaughan (overall layout), with support from Sue Anna Joe, Kara Giles, and Dominique Pugh (magnolia illustration)

**Neutral framing examples (from CONTEXT.md):**
- "In what year did Mississippi adopt a new state flag?" → Answer: 2020
- "What symbol did the 2020 Mississippi flag replace?" → Answer: the Confederate battle emblem
- "What image is featured on the Mississippi state flag adopted in 2020?" → Answer: a magnolia flower

### Mississippi Economy (MEDIUM confidence — multiple business/Britannica sources)

- Mississippi is the nation's No. 1 producer of **farm-raised catfish** (aquaculture, primarily in the Delta region)
- Mississippi ranks among the top 10 nationally for: cotton, sweet potatoes, broiler chickens, soybeans, rice, peanuts, pine lumber, pine pulpwood
- Mississippi ranks **3rd** nationally in sweet potato production
- The Mississippi Gaming Control Act was signed June 29, 1990 (HB 2), legalizing **dockside casino gambling** along the Gulf Coast and Mississippi River — specifically "dockside" (vessels in waterways)
- First legal casino under the new law opened August 1, 1992: Isle of Capri in Biloxi
- Tunica, MS is the third-largest gaming destination in the US (after Las Vegas and Atlantic City, at peak)
- Major automotive manufacturing presence: Nissan (Canton, MS; est. 2003), Toyota (Blue Springs, MS; est. 2011) — over 15,000 workers
- John C. Stennis Space Center: Located near Bay St. Louis on the Gulf Coast; one of NASA's primary rocket engine testing facilities; tested Saturn V engines used in the Apollo moon program
- Named for Senator John C. Stennis of Mississippi

### Mississippi State Symbols and Identity (HIGH confidence — official sources)

- **State nickname:** "The Magnolia State"
- **State motto:** "Virtute et Armis" (Latin: "By Valor and Arms")
- **State flower:** Magnolia (also state tree — the Southern magnolia or Magnolia grandiflora)
- **State bird:** Northern Mockingbird
- **State flag:** The 2020 "In God We Trust Flag" featuring the magnolia
- **Statehood:** December 10, 1817 (20th state)
- **Birthplace claim:** Mississippi calls itself the "Birthplace of America's Music" — blues, country, rock and roll, and gospel all have deep roots in Mississippi

---

## Recommended Configuration

### Slug, Prefix, Theme, Tier

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `--slug` | `mississippi-state` | Standard state-state format matching existing pattern (`oregon-state`, `texas-state`) |
| `--prefix` | `mis` | 3-letter, no conflicts with existing: `bli, lac, fre, nur, ins, cas, cam, mas, pla, tex, por, ore, wdc, bxl`. Note: `mas` is Massachusetts — do NOT use `mas`; `mis` is distinct |
| `--theme` | `#1A3A5C` | Deep Gulf Coast navy/midnight blue; evokes the Mississippi River and Gulf Coast; visually distinct from all existing collection colors |
| `--tier` | `state` | Standard state collection |
| `--sort-order` | `16` | After Biloxi, MS (sortOrder: 15) |

### Theme Color Rationale

| Color | Hex | Rationale | Decision |
|-------|-----|-----------|----------|
| Gulf Coast navy | `#1A3A5C` | Evokes the Mississippi River and Gulf Coast; deep and distinctive. No existing collection uses this navy range. | **RECOMMENDED** |
| Mississippi green | `#2D5016` | Forest/agriculture green — could work but risks confusion with Oregon (`#1B4A1E`) and Indiana | Alternative |
| Magnolia white | N/A | Too light for UI use | Rejected |

### Tagline

**Recommended:** `"The birthplace of civil rights, country blues, and catfish. Do you know your Mississippi?"`

Rationale: Anchors three authentic, surprising pillars of Mississippi identity in a single sentence. "Catfish" adds a light unexpected turn after serious civic references. Challenge-style format consistent with playbook style. No apostrophe (avoids Scaffold Bug 2 description-apostrophe issue).

**Alternative:** `"The Magnolia State has more civic history than you think."`

### Banner Image

Per playbook hard rule: **State collections = state capitol building.** Mississippi's state capitol in Jackson is a striking Beaux Arts dome building, visually distinctive with its 180-foot central dome.

**File to add:** `frontend/public/images/collections/mississippi-state.jpg`

---

## Recommended Topic Distribution

```typescript
topicCategories: [
  {
    slug: 'state-government',
    name: 'Mississippi State Government',
    description: 'Mississippi executive branch: plural executive with multiple independently elected officials. Governor Tate Reeves (R, term ends Jan 2028, term-limited — cannot run again). Lt. Governor Delbert Hosemann (R) — one of the most powerful Lt. Governors in the nation: serves as Senate President, votes on ties, assigns bills to committees, sets legislative agenda, appoints committee chairs, becomes acting Governor when Governor leaves the state. AG Lynn Fitch (R, first woman to hold the office). Secretary of State Michael Watson Jr. (R). Treasurer David McRae (R). All terms end January 13, 2028. Legislature: bicameral, Senate (52 members) + House (122 members), BOTH chambers on 4-year terms (not 2-year). Annual sessions. House Speaker Jason White; Lt. Governor Hosemann serves as Senate President; Senate Pro Tem Dean Kirby. Include both durable structure questions and expiring current-officeholder questions.',
  },
  {
    slug: 'civil-rights',
    name: 'Civil Rights History',
    description: 'Mississippi civil rights history treated as core civic content with the gravity of a civics textbook. Medgar Evers: NAACP first field secretary in Mississippi (1954); organized voter registration, established NAACP chapters; assassinated June 12, 1963 in Jackson; killer Byron De La Beckwith convicted in 1994; his home is now a National Monument. James Meredith: first Black student to enroll at University of Mississippi (Ole Miss) in 1962 under federal marshal protection after state blocked enrollment. Fannie Lou Hamer: co-founded Mississippi Freedom Democratic Party (MFDP) in 1964; testified at 1964 Democratic National Convention about voter suppression; "sick and tired of being sick and tired." Freedom Summer 1964: voter registration campaign; workers Chaney, Goodman, Schwerner murdered June 21, 1964 by Klan with law enforcement involvement. Emmett Till: murdered August 28, 1955 in Money, MS; open-casket funeral photos galvanized the civil rights movement. Mississippi Civil Rights Museum (Jackson, opened 2017, operated by MDAH). Do NOT editorialize — use factual framing throughout.',
  },
  {
    slug: 'history-statehood',
    name: 'History & Statehood',
    description: 'Mississippi statehood December 10, 1817 — 20th state admitted to the Union (signed by President James Monroe). Original capital: Natchez (constitutional convention held near Natchez in July 1817). Jackson became permanent capital in 1822 (named for Andrew Jackson). Mississippi Territory established 1798. Native nations: Natchez, Choctaw, Chickasaw. The 1890 Constitution: adopted specifically to disenfranchise Black voters via poll taxes and literacy tests; 134 delegates (133 white, 1 Black) despite 58% Black state population; removed "justice," "liberty," "right," "freedom" from preamble; remains the governing state constitution (as amended). Mississippi has had 4 constitutions: 1817, 1832, 1869, 1890. Mississippi State Capitol: third capitol in Jackson; built 1901–1903 on site of old state penitentiary; funded by Illinois Central Railroad back-taxes settlement; architect Theodore Link; Beaux Arts style; 180-foot dome; National Historic Landmark 2016. Old Capitol Museum (second capitol building, built 1839).',
  },
  {
    slug: 'flag-and-symbols',
    name: '2020 Flag & State Symbols',
    description: '2020 Mississippi flag referendum: Legislature passed HB 1796 on June 28, 2020, retiring the 1894 flag (which contained Confederate battle emblem in canton). Commission received 2,000+ design submissions; selected New Magnolia Flag September 2, 2020. Placed on November 3, 2020 ballot as legislatively referred referendum; approved 73% to 27%. Officially called "In God We Trust Flag." Features white magnolia on blue background with red and gold bars. Signed into law by Governor Reeves January 11, 2021. Framing must be strictly neutral — civic event only: referendum, legislative action, vote margin, new design features. State nickname: "The Magnolia State." State motto: "Virtute et Armis" (By Valor and Arms). State flower and tree: magnolia. State bird: Northern Mockingbird. Mississippi calls itself the "Birthplace of America\'s Music."',
  },
  {
    slug: 'geography',
    name: 'Geography & Natural Features',
    description: 'State-scale geographic facts only. Mississippi River: forms the entire western border of Mississippi — one of the most geographically defining features of any US state. Mississippi Delta: the broad alluvial floodplain in northwestern Mississippi between the Mississippi and Yazoo rivers; cotton economy, blues music birthplace, one of the most historically significant regions in American history. Gulf Coast: approximately 44 miles of coastline on the Gulf of Mexico. Natchez Trace Parkway: 444-mile federal parkway (National Park Service) running from Natchez, MS to Nashville, TN, following the historic Native American trail used by settlers and traders in the 18th–19th centuries. Woodall Mountain: Mississippi\'s highest point at 806 feet — one of the 6 lowest state high points in the US. No questions about specific cities except as anchors for state-scale facts.',
  },
  {
    slug: 'economy',
    name: 'Economy & Industry',
    description: 'Mississippi is the nation\'s No. 1 producer of farm-raised catfish (aquaculture, primarily the Delta region). Top agricultural commodities: broiler chickens, soybeans, cotton, corn, catfish, sweet potatoes, rice. Ranks 3rd nationally in sweet potato production. Mississippi Gaming Control Act signed June 29, 1990 (HB 2) — legalized dockside casino gambling along the Gulf Coast and Mississippi River; first casino under the new law opened August 1, 1992 (Isle of Capri, Biloxi). Tunica, MS: historically the third-largest gaming destination in the US. Major automotive manufacturing: Nissan plant in Canton (opened 2003), Toyota plant (opened 2011) — part of the "Auto Alley" corridor. John C. Stennis Space Center: on the Gulf Coast near Bay St. Louis; NASA primary rocket engine test facility; tested Saturn V engines for the Apollo moon program; named for longtime Mississippi Senator John C. Stennis. No casino company names or addresses in answer options.',
  },
  {
    slug: 'notable-mississippians',
    name: 'Notable Mississippians (Civic)',
    description: 'Civic-connected Mississippians only — no pure pop culture without civic angle. Medgar Evers, James Meredith, Fannie Lou Hamer covered separately in civil rights topic. Additional civic figures: John C. Stennis (U.S. Senator 1947–1989; longest-serving senator in Mississippi history; Space Center named for him; Chair of Senate Armed Services Committee). James K. Vardaman (Governor 1904–1908, U.S. Senator; complicated legacy — known for stridently racist policies but also progressive labor positions; studied in the context of Mississippi political history). Hiram Revels (first African American to serve in the U.S. Senate, representing Mississippi in 1870 during Reconstruction). The Evers family (Medgar + Myrlie Evers). These figures should appear in the context of their civic roles and historical significance, not as cultural trivia.',
  },
],

topicDistribution: {
  'state-government': 32,     // structure + current officeholders (expiring)
  'civil-rights': 20,         // Evers, Meredith, Hamer, Freedom Summer, Till
  'history-statehood': 16,    // 1817 statehood, capitol, 1890 constitution
  'flag-and-symbols': 8,      // 2020 referendum, state symbols
  'geography': 10,            // river, delta, Natchez Trace, Gulf Coast
  'economy': 8,               // catfish, gaming act, automotive, Stennis
  'notable-mississippians': 6, // civic figures not covered in civil rights
  // Total: 100
},
```

---

## Recommended Source URLs

```typescript
sourceUrls: [
  // Primary Wikipedia sources (preferred over government portals)
  'https://en.wikipedia.org/wiki/Mississippi',
  'https://en.wikipedia.org/wiki/Government_of_Mississippi',
  'https://en.wikipedia.org/wiki/Mississippi_Legislature',
  'https://en.wikipedia.org/wiki/Governor_of_Mississippi',
  'https://en.wikipedia.org/wiki/Lieutenant_governor_of_Mississippi',
  'https://en.wikipedia.org/wiki/Mississippi_State_Capitol',
  'https://en.wikipedia.org/wiki/Constitution_of_Mississippi',
  // Civil rights — these are civic history, not cultural content
  'https://en.wikipedia.org/wiki/Medgar_Evers',
  'https://en.wikipedia.org/wiki/James_Meredith',
  'https://en.wikipedia.org/wiki/Fannie_Lou_Hamer',
  'https://en.wikipedia.org/wiki/Freedom_Summer',
  'https://en.wikipedia.org/wiki/Emmett_Till',
  // Flag and symbols
  'https://en.wikipedia.org/wiki/2020_Mississippi_flag_referendum',
  'https://en.wikipedia.org/wiki/Flag_of_Mississippi',
  // Geography and natural features
  'https://en.wikipedia.org/wiki/Mississippi_Delta',
  'https://en.wikipedia.org/wiki/Natchez_Trace_Parkway',
  // Economy
  'https://en.wikipedia.org/wiki/John_C._Stennis_Space_Center',
  // Judiciary
  'https://en.wikipedia.org/wiki/Supreme_Court_of_Mississippi',
],
```

**Pre-generation spot-check:** Verify 2–3 of these URLs return substantive article content before running `--fetch-sources`. The main Mississippi article and the civil rights figure articles (Evers, Meredith, Hamer) are confirmed to be substantive.

**Expected failures:** Based on the 3-source-failure pattern from prior phases (Oregon, DC, Biloxi), expect 2–4 of the smaller Wikipedia articles to return 0 characters. Non-blocking: the main Mississippi article and civil rights articles should provide broad coverage. Do not delay generation to investigate failures.

---

## Expiring Questions Strategy

**All current statewide elected officials were elected November 7, 2023; 4-year terms; terms end January 13, 2028.**

```typescript
// Governor Tate Reeves (R, second term, term-limited)
// Lt. Governor Delbert Hosemann (R)
// Attorney General Lynn Fitch (R, first woman to hold the office)
// Secretary of State Michael Watson Jr. (R)
// State Treasurer David McRae (R)
expiresAt: "2028-01-13T00:00:00Z"

// House Speaker Jason White
// Lt. Speaker (Speaker Pro Tempore) Manly Barton
// Senate President Pro Tempore Dean Kirby
// (Lt. Gov Hosemann also serves as Senate President — covered above)
expiresAt: "2028-01-13T00:00:00Z"  // same 4-year cycle (Mississippi legislators serve 4-year terms)

// All structural, historical, geographic, and civic-innovation facts
expiresAt: null
```

**Target 7 expiring question subjects (per CONTEXT.md):** Governor, Lt. Governor, AG, SoS, Treasurer (5 constitutional officers) + House Speaker + Lt. Speaker = 7 total. At 2–3 questions per subject, that yields 14–21 expiring questions. Against a 100-question target, 15% = 15 questions needed.

**Realistic expiring ratio:** With 7 target subjects at 2q/subject = 14 expiring questions minimum. This is right at the 15% threshold for 100 questions. The main generator will likely not reliably set expiresAt on officeholder questions (confirmed pattern from Phases 60 and 61). Plan for a targeted officeholder pass modeled on `generate-biloxi-officeholder-questions.ts`. Budget for 2q per subject = 14 questions, which just hits 15%. Writing 3q for the Governor and Lt. Governor (the most civically distinctive offices) would provide a comfortable buffer.

---

## v2.1 Milestone Retrospective Structure

Phase 62 closes the v2.1 milestone. The retrospective must include two parts:

### Part A: Mississippi State Collection Retrospective (standard format)
Use the standard template from COLLECTION-PLAYBOOK.md:
- What went well
- What broke or was harder than expected
- Bugs encountered
- Carry-forward rules (new conventions)
- Final stats

### Part B: v2.1 Milestone Summary (new section — appended immediately after Part A)
This is a milestone-level summary capturing the full arc of Phases 57–62. Per CONTEXT.md:
- **5 collections shipped:** Portland OR (city), Oregon (state), Washington DC (city), Biloxi MS (city), Mississippi (state)
- **Pipeline hardening achievements:** Semantic dedup (Phase 57), expiring ratio enforcement (audit-collection-readiness.ts Phase 57), officeholder targeted pass pattern (Phase 60–61), 3-pass expiring ratio strategy (Phase 61), source URL guidance (Wikipedia-first, Phase 58)
- **Key patterns that emerged:** State collections saturate at 50–70 unique questions from automated runs (supplementation is normal); expiring ratio ceiling for states ~7–10% from main generator; Scaffold Bug 2 is confirmed persistent across all phases
- **Vision for future `/create-collection` skill:** A single command that scaffolds, generates, curates, and publishes a collection from just a city/state/topic input — distilling all playbook learnings into an automated workflow. This retrospective serves as the reference document for that future skill.

Format for the milestone summary section:
```markdown
## Milestone Summary: v2.1 (Phases 57–62)

### Collections shipped
[list]

### Pipeline hardening
[list of improvements]

### Persistent patterns and carry-forward rules
[list of patterns that now apply to every future collection]

### Vision: The future /create-collection skill
[paragraph describing the vision the playbook now enables]
```

---

## Common Pitfalls

### Pitfall 1: Editorializing on civil rights history or the flag change
**What goes wrong:** Questions use editorial language ("finally removed," "long-overdue," "shameful symbol") instead of neutral civic framing.
**Why it happens:** These are genuinely charged topics and training data contains opinionated coverage.
**How to avoid:** Voice guidance must repeat the tone rule twice: "civic educator voice — factual framing, same standard as any other historical topic. No humor. No editorial commentary."
**Warning signs:** Any question using evaluative language that isn't a direct historical quote.

### Pitfall 2: Jackson city facts leaking into state collection
**What goes wrong:** Generator produces questions about Jackson's local government (mayor, city council, ward districts), Jackson State University as a local institution, or Jackson-specific civic organizations.
**Why it happens:** Jackson is the capital and dominates Mississippi news coverage. Source articles about Mississippi often blend state and city content.
**How to avoid:** Voice guidance: "Jackson appears ONLY as the seat of state government. No questions about Jackson city government, Jackson mayor, Jackson city council, or Jackson-specific facts."
**Warning signs:** Any question that could belong in a hypothetical "Jackson, MS" city collection.

### Pitfall 3: Main generator not applying expiresAt to officeholder questions
**What goes wrong:** Questions about Governor Reeves, Lt. Gov Hosemann, or AG Fitch are generated with `expiresAt: null` despite locale config listing all officeholders with expiry dates.
**Why it happens:** Confirmed systemic gap from Phase 60 (DC) and Phase 61 (Biloxi). The main generator does not reliably apply expiresAt.
**How to avoid:** Plan for a targeted officeholder generation pass (modeled on `generate-biloxi-officeholder-questions.ts`) from the start. Budget 2–3 questions per the 7 target offices.
**Warning signs:** `audit-collection-readiness.ts` reporting 0% or very low expiring ratio after generation.

### Pitfall 4: Content saturation after first generation run
**What goes wrong:** First generation run produces 140+ questions, semantic dedup reduces to 60–70 unique, final active count after curation falls below 80.
**Why it happens:** Oregon Phase 59 pattern — state collections exhaust unique civic facts faster than city collections. Content clusters heavily around the same facts.
**How to avoid:** Expect 2–3 generation runs. Before supplementation, query the database to identify topic gaps systematically (pre-supplementation gap analysis per Oregon Phase 59 pattern). Then do targeted supplementation on judiciary, Natchez Trace, Delta geography, economic policy, historical legislation.
**Warning signs:** After first run, if dedup leaves fewer than 70 unique questions, plan a second run targeting different topic categories before moving to manual supplementation.

### Pitfall 5: Over-weighting casino/gaming content
**What goes wrong:** Generator over-produces casino content (gaming company names, specific casino names, room counts) because gaming industry is heavily represented in Mississippi coverage.
**Why it happens:** Phase 61 (Biloxi) showed casino cap at 9 questions was correct. Mississippi State's gaming content is more limited (policy/law only), but the risk is real.
**How to avoid:** Economy topic is capped at 8 questions total; gaming sub-topic should be no more than 2–3 questions (Gaming Control Act year/content, dockside requirement, Tunica's designation). Voice guidance: "Gaming questions should be about the policy and law (Gaming Control Act 1990), not casino company names, hotel room counts, or specific casino properties."
**Warning signs:** More than 3 questions about specific casino properties.

### Pitfall 6: Confusing Lt. Governor role with typical Lt. Governor
**What goes wrong:** Generator describes Mississippi's Lt. Governor as having a typical "successor to governor" role, missing the Senate President / dual-branch power that is Mississippi's most distinctive government structural fact.
**Why it happens:** Generic state government templates describe Lt. Governor simply as successor.
**How to avoid:** Voice guidance must state explicitly: "Mississippi's Lt. Governor is constitutionally unique — they are the ONLY state official who is a member of two branches of government simultaneously. The Lt. Governor serves as president of the Senate and exercises significant legislative power (assigns bills, appoints committees, sets agenda). This is a priority civic fact that should generate at least 1–2 questions."
**Warning signs:** Any Lt. Governor question that omits the Senate President role.

### Pitfall 7: Scaffold Bug 2 and description apostrophe
**What goes wrong:** Post-scaffold, `generate-locale-questions.ts` is corrupted. If tagline contains an apostrophe in a single-quote TypeScript string, the string is terminated early.
**Why it happens:** Scaffold Bug 2 confirmed in every collection from Phase 57 onward.
**How to avoid:** (1) Run `git diff` immediately after scaffold and revert if modified. (2) If tagline contains apostrophes, use double-quote string. The recommended tagline ("The birthplace of civil rights, country blues, and catfish. Do you know your Mississippi?") has no apostrophes — no issue.
**Warning signs:** TypeScript compiler error about unexpected identifier in seed file.

---

## Code Examples

### Scaffold Command (complete)

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Mississippi" \
  --slug mississippi-state \
  --prefix mis \
  --theme "#1A3A5C" \
  --description "The birthplace of civil rights, country blues, and catfish. Do you know your Mississippi?"

# Immediately check for Scaffold Bug 2
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If modified, revert:
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts
```

### Generation Commands

```bash
cd backend
# First run
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale mississippi-state \
  --fetch-sources

# If first run yields < 70 unique questions after dedup, run again:
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale mississippi-state \
  --fetch-sources
```

### Audit and Activation

```bash
cd backend
# Check readiness (expiring ratio, question count)
npx tsx src/scripts/audit-collection-readiness.ts --slug mississippi-state --prefix mis

# Dry run
npx tsx src/scripts/activate-collection.ts --slug mississippi-state --prefix mis --dry-run

# Activate
npx tsx src/scripts/activate-collection.ts --slug mississippi-state --prefix mis
```

### ExpiresAt Values

```typescript
// All statewide elected officials elected November 7, 2023
// Terms end January 13, 2028
// Governor Tate Reeves, Lt. Gov Delbert Hosemann, AG Lynn Fitch,
// SoS Michael Watson Jr., Treasurer David McRae, Auditor Shad White
// House Speaker Jason White, Speaker Pro Tem Manly Barton
// Senate Pro Tem Dean Kirby
expiresAt: "2028-01-13T00:00:00Z"

// All historical, structural, civic innovation, geographic, economic facts
expiresAt: null
```

### State Config File Header Pattern

```typescript
// File: backend/src/scripts/content-generation/locale-configs/state-configs/mississippi-state.ts
import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Mississippi state configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - All statewide elected officials' terms end January 13, 2028; use expiresAt: "2028-01-13T00:00:00Z"
 * - Governor Tate Reeves is term-limited; cannot run for re-election in 2027 gubernatorial race
 * - Lt. Governor Delbert Hosemann serves as SENATE PRESIDENT — one of the most powerful Lt. Govs in the nation
 * - Civil rights content: factual/neutral framing only — civic educator voice, no editorializing
 * - 2020 flag change: strictly neutral framing (legislative event, referendum margin, new design)
 * - State-only rule: Jackson/Gulfport/Biloxi/Natchez appear ONLY as anchors for state-level facts
 * - County government: explicitly excluded (82 counties too granular)
 */
export const mississippiStateConfig: LocaleConfig = { ... };

export const mississippiStateFeatures = `...`;
```

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Manual scan-duplicates.ts after generation | Automatic semantic dedup in generate-locale-questions.ts | Phase 57 | No separate dedup pass needed |
| Government portal URLs as primary sources | Wikipedia article URLs preferred | Phase 58 learning | Higher quality source content |
| Single generation run | 2–3 generation runs planned for state collections | Phase 59 (Oregon) | Expect content saturation; plan for supplementation |
| No supplementation plan | Supplementation of 20–25 hand-crafted questions is normal for state collections | Phase 59 (Oregon) | Budget time and a topic-gap list upfront |
| Generator expected to set expiresAt | Targeted officeholder pass required | Phase 60 confirmed, Phase 61 reinforced | Every collection needs explicit officeholder pass |
| 15% expiring ratio achievable for states | States typically max at 7–10% from main generator; officeholder pass can raise to 12–17% | Phase 59–61 | Accept below 15% for states with documentation if ceiling is reached |

---

## Open Questions

1. **Oregon supplementation model: exact count needed for Mississippi**
   - What we know: Oregon needed 25 hand-crafted questions after 3 automated runs yielding 56 unique questions. Mississippi's civic content domain is similar in size to Oregon's but has richer civil rights material.
   - What's unclear: Whether Mississippi's civil rights topic area will yield more unique questions per run than Oregon's civic innovations, or whether similar saturation will occur.
   - Recommendation: After the first generation run, run the pre-supplementation gap analysis. Civil rights content should be robust; the likely gaps will be in judiciary structure, economy details, historical legislation, and specific constitutional history. Prepare a 20-question supplementation list targeting these gap areas.

2. **Exact expiresAt for Mississippi statewide terms**
   - What we know: All statewide elected officials were elected November 7, 2023, to 4-year terms. Governor Tate Reeves' second term ends January 11, 2028 per Ballotpedia. Most sources confirm January 13, 2028 as the general term-end date for the 2023 class.
   - What's unclear: Whether January 11 (Reeves-specific) or January 13 (general inauguration day) is the exact date for all other officials. Some Mississippi sources cite January 13, 2020 as the inauguration date for the 2019 class.
   - Recommendation: Use `"2028-01-13T00:00:00Z"` as a safe approximation for all officials. This is within 2 days of the actual date and conservative. If exact dates matter for a specific question, note the approximation.

3. **Wikipedia page extraction reliability for civil rights articles**
   - What we know: The main Mississippi Wikipedia article and the Medgar Evers, James Meredith, Fannie Lou Hamer, and Freedom Summer articles are all confirmed to be substantive Wikipedia articles. The Biloxi experience showed some Wikipedia pages fail to extract via w/api.php.
   - What's unclear: Which of the 18 recommended source URLs may fail to extract at generation time.
   - Recommendation: The main Mississippi article and the 4 major civil rights articles should be sufficient fallback coverage. Do not add more than 20 source URLs — extra URLs often fail silently and waste batch budget.

4. **Michael Watson (SoS) transition — whether to include in questions**
   - What we know: Watson announced March 2026 that he will not seek a third term and hinted at running for Lt. Governor. His current term as SoS runs through January 2028.
   - What's unclear: Whether Watson will formally announce a Lt. Gov bid before the collection activates, which could affect how questions about the SoS office should be framed.
   - Recommendation: Questions about Watson as current Secretary of State are valid through January 2028. Frame them with expiresAt `"2028-01-13T00:00:00Z"`. Avoid questions about his future political plans.

---

## Sources

### Primary (HIGH confidence)
- Ballotpedia — Mississippi state executive offices, Tate Reeves, Delbert Hosemann (term dates, officeholder names, term limits)
- Wikipedia — Government of Mississippi, Mississippi Legislature, Mississippi State Capitol, Medgar Evers, James Meredith, Fannie Lou Hamer, Freedom Summer, Emmett Till, 2020 flag referendum
- Mississippi Legislature official site — House Speaker Jason White, Senate structure, Capitol history
- Mississippi Today (Mississippi journalism outlet) — 2023 election results, Michael Watson 2026 announcement

### Secondary (MEDIUM confidence — WebSearch verified with multiple sources)
- Multiple news sources (CNN, NBC News) — 2023 election results confirming Reeves re-election and Hosemann re-election
- Britannica — Mississippi economy (agriculture, manufacturing)
- WorldAtlas, Scout Cities — Key industries verification (catfish #1 producer, automotive manufacturing)
- Multiple sources — Gaming Control Act 1990 date and content (June 29, 1990, HB 2)

### Tertiary (LOW confidence — single source or unverified details)
- Exact January 13, 2028 term end date: Derived from 4-year term + November 2023 election + January 2020 inauguration date pattern; confirmed "January 2028" from multiple sources but exact day is estimated
- Casino opening date for Isle of Capri: "August 1, 1992" from gambling-industry sources; not independently verified with official Mississippi Gaming Commission source

---

## Metadata

**Confidence breakdown:**
- Standard stack (scaffold, generate, audit, activate): HIGH — identical pipeline to all prior state collections; no new tools
- Mississippi government structure and current officeholders: HIGH — verified via Ballotpedia, Wikipedia, news sources
- Term dates (January 2028): HIGH for year; MEDIUM for exact day (13th)
- Civil rights facts (Evers, Meredith, Hamer, Freedom Summer): HIGH — all confirmed via Wikipedia and multiple secondary sources
- 2020 flag referendum facts: HIGH — confirmed via Wikipedia, CNN, Smithsonian, NBC News
- State symbols, statehood date: HIGH — standard encyclopedic content
- Economy facts (catfish #1, gaming act): MEDIUM-HIGH — confirmed across multiple business and encyclopedia sources
- Topic distribution percentages: Claude's discretion — informed by prior state collection patterns
- Tagline and theme color: HIGH (reasoning) — requires human approval at planning/execution time
- Milestone retrospective structure: HIGH — directly from CONTEXT.md decisions

**Research date:** 2026-03-14
**Valid until:** 2026-04-13 (30 days; officeholder accuracy stable until January 2028 election cycle)
