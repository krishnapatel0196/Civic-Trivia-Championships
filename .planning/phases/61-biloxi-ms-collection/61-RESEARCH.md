# Phase 61: Biloxi, MS Collection - Research

**Researched:** 2026-03-14
**Domain:** City collection scaffolding, Biloxi MS civic content generation, mixed-durability question pattern, collection activation
**Confidence:** HIGH

---

## Summary

Phase 61 follows the established collection pipeline exactly — scaffold, locale config, generate, curate, banner image, activate — identical to Portland (Phase 58), Oregon (Phase 59), and Washington DC (Phase 60). No new tools or scripts are required. All carry-forward rules from the playbook apply cleanly.

Biloxi is a content-rich coastal Mississippi city with several highly distinctive civic angles: it is one of the oldest European settlements in the Gulf South (founded 1699, French capital of Louisiana 1720-1723), it was famously the "Seafood Capital of the World" in the early 20th century, it hosts the civil rights Biloxi Wade-Ins (1959-1963, led by Dr. Gilbert R. Mason), it contains Keesler Air Force Base (home of the Air Force's 81st Training Wing and electronics training), Jefferson Davis's Beauvoir estate (last residence of the Confederate president), and has the longest man-made beach in the world (26 miles). The casino era post-1992 (Mississippi legalized gambling on water) gives it a recognizable modern identity. These angles provide robust, non-overlapping trivia content.

The expiring-question picture is straightforward: Mayor FoFo Gilich was re-elected in June 2025 for a third term — his term runs through approximately June 2029. All seven ward council members were also elected in the 2025 cycle, running through 2029. This means expiring questions expire ~June 2029. The 15% expiring-ratio target is achievable with mayor + 3-4 council members by name.

**Primary recommendation:** Use prefix `bxl`, slug `biloxi-ms`, theme `#0077A8` (Gulf Coast teal-blue), tier `city`, target 90 questions with overshootFactor 1.5 (~135 generated before dedup), and lead voice guidance with Biloxi's unique founding, seafood heritage, and civil rights history.

---

## Standard Stack

No new dependencies. The existing collection pipeline handles everything.

### Core Scripts
| Script | Purpose | Notes |
|--------|---------|-------|
| `scaffold-collection.ts` | Scaffold seed entry, locale config, generator registration | Apply Scaffold Bug 2 workaround immediately after |
| `generate-locale-questions.ts --locale biloxi-ms --fetch-sources` | Content generation + automatic semantic dedup | City configs go in locale-configs/ (not state-configs/) |
| `audit-collection-readiness.ts --slug biloxi-ms --prefix bxl` | Validate question count + expiring ratio | Warns if expiring < 15%; non-blocking |
| `activate-collection.ts --slug biloxi-ms --prefix bxl` | Activate collection | Use `--dry-run` first |

### Reference Files
| File | Purpose |
|------|---------|
| `backend/src/scripts/content-generation/locale-configs/portland-or.ts` | Best reference for city locale config shape |
| `backend/src/db/seed/collections.ts` | Add Biloxi seed entry here (sortOrder: 15) |
| `.planning/COLLECTION-PLAYBOOK.md` | Retrospective template — fill and append at phase close |

**Installation:** No new packages required.

---

## Architecture Patterns

### Locale Config Location

Biloxi is a city collection, so the config goes in:
```
backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts
```
NOT in `state-configs/`. The generator discovers city configs from this directory.

### Scaffold Command

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Biloxi, MS" \
  --slug biloxi-ms \
  --prefix bxl \
  --theme "#0077A8" \
  --tier city \
  --description "The Seafood Capital of the World is betting you don't know it." \
  --sort-order 15
```

**Immediately after scaffolding:**
```bash
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If modified, revert (Scaffold Bug 2 workaround):
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts
```

### Seed Entry

Add to `backend/src/db/seed/collections.ts` (sortOrder: 15):

```typescript
{
  name: 'Biloxi, MS',
  slug: 'biloxi-ms',
  description: 'The Seafood Capital of the World is betting you don\'t know it.',
  localeCode: 'en-US',
  localeName: 'Biloxi, Mississippi',
  iconIdentifier: 'flag-us',   // verify scaffold output; use 'flag-us' if 'flag-ms' not supported
  themeColor: '#0077A8',
  tier: 'city',
  isActive: false,
  sortOrder: 15
}
```

### Locale Config Shape

```typescript
// Source: portland-or.ts pattern
import type { LocaleConfig } from './bloomington-in.js';

export const biloxiMsConfig: LocaleConfig = {
  locale: 'biloxi-ms',
  name: 'Biloxi, MS',
  externalIdPrefix: 'bxl',
  collectionSlug: 'biloxi-ms',
  targetQuestions: 90,
  batchSize: 25,
  overshootFactor: 1.5,
  topicCategories: [ /* see Biloxi Civic Facts section below */ ],
  topicDistribution: { /* must sum to targetQuestions = 90 */ },
  sourceUrls: [ /* see Source URLs section below */ ],
};
```

### Anti-Patterns to Avoid

- **Calling Biloxi "the gambling capital":** Biloxi is now heavily casino-oriented, but the civic identity is seafood heritage, Gulf Coast history, and civil rights — not casinos. Casinos should appear as one economic fact, not the primary frame.
- **Confusing Beauvoir facts with Jefferson Davis national biographies:** Questions about Beauvoir should focus on its connection to Biloxi (his last home, Civil War history in the Gulf South) — keep the Beauvoir questions grounded in what it means for the city, not a general Jefferson Davis history quiz.
- **Mixing Harrison County facts with Biloxi city facts:** Biloxi is in Harrison County; Gulfport is the county seat. Don't attribute Harrison County government to Biloxi City or conflate Biloxi with Gulfport in questions.
- **Claiming the world's longest man-made beach belongs to Biloxi City exclusively:** It is the Harrison County Shore Protection Project beach (26 miles total, Henderson Point to Biloxi Lighthouse), not just within Biloxi city limits. Voice guidance: "…the Gulf Coast beach through Harrison County and Biloxi."
- **Government portal URLs:** biloxi.ms.us pages return navigation-heavy content. Use Wikipedia URLs as primary sources. Confirmed pattern from Portland (Phase 58) carry-forward.
- **Treating Keesler AFB as a Biloxi civic government institution:** Keesler is a federal military installation within Biloxi's city limits — questions about it should focus on its economic and historical relationship to Biloxi, not federal DoD governance.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic near-duplicate removal | Manual scan-duplicates.ts pass | Built into generate-locale-questions.ts (Phase 57) | Automatic after generation; within-collection dedup runs at >0.85 cosine similarity |
| Expiring question ratio check | Manual count | `audit-collection-readiness.ts` | Warns if ratio < 15%; already integrated |
| Collection activation | Manual DB update | `activate-collection.ts --dry-run` then activate | Includes safety checks |
| Officeholder expiresAt | Relying on generator | Targeted officeholder pass or curation | Generator doesn't reliably set expiresAt even when locale config declares officeholders (Phase 60 confirmed) |

**Key insight:** The officeholder expiresAt gap (confirmed in Phase 60) means a targeted pass or careful curation is mandatory to hit the 15% expiring ratio. Plan explicitly for this step.

---

## Biloxi Civic Facts for Voice Guidance

This is the core research payload — the facts the locale config MUST accurately represent.

### Government Structure (HIGH confidence — biloxi.ms.us official site, multiple news sources)

**Form of government:** Strong Mayor-Council. Voters approved this structure in 1978; it went into effect at the 1981 elections, replacing the prior commission form.

**Mayor:**
| Office | Current Holder | Term | expiresAt |
|--------|---------------|------|-----------|
| Mayor | Andrew M. "FoFo" Gilich, Jr. | 3rd term; re-elected June 3, 2025; 4-year term | `"2029-06-01T00:00:00Z"` |

Gilich was first elected by special election in May 2015, first full term 2017, second full term 2021, third full term 2025. He is a Republican. He ran against Independent Andy Linville and Libertarian Farren Santibanez in 2025, winning ~80% of the vote.

**City Council — 7 members, one per ward (HIGH confidence — biloxi.ms.us):**
| Ward | Member | Notes |
|------|--------|-------|
| 1 | Wayne Gray | Elected 2025 |
| 2 | Anthony Marshall | Elected 2025 (unseated incumbent Felix Gines) |
| 3 | Mike Nail | Elected 2025 |
| 4 | Jamie Creel | Elected 2025 (Fuller won per election results — verify name against biloxi.ms.us before including) |
| 5 | Paul Tisdale | Elected 2025 |
| 6 | Kenny Glavan | Elected 2025 |
| 7 | David Shoemaker | Elected 2025 |

Term length: 4 years. Mayor and all 7 council members on same 4-year cycle. Next election: 2029.

**expiresAt for all officeholders elected June 2025:** `"2029-06-01T00:00:00Z"`

Note: The Ward 4 seat had "Fuller" winning per one news source vs "Jamie Creel" per the city website — verify the biloxi.ms.us city council page directly before including Ward 4 representative's name in questions. The official site currently lists "Jamie Creel" so treat that as authoritative.

**City Hall location:** 140 Lameuse Street, Biloxi, MS 39530

**Not the county seat:** Harrison County's county seat is Gulfport, not Biloxi. Keep Biloxi city government questions distinct from Harrison County government.

---

### Key Civic Facts by Topic Area

#### Founding and Early History (HIGH confidence — multiple encyclopedic sources)

- Biloxi is one of the oldest European settlements in the Gulf South. French explorer Pierre Le Moyne d'Iberville founded the settlement in 1699, making it the first French settlement in what became Louisiana Territory.
- The city takes its name from the Biloxi (Bilocci) people, a Siouan-speaking Native American tribe that inhabited the area. The name is thought to mean "first people."
- Biloxi served as the capital of French Louisiana from 1720 to 1723 — just three years — before the capital moved to New Orleans.
- Spanish control followed French colonial rule. The area passed to the United States as part of West Florida annexation.

#### Seafood Industry (HIGH confidence — multiple sources including Biloxi Shrimp Co., Gulf Coast Heritage)

- Biloxi was nicknamed the "Seafood Capital of the World" — a designation earned in the early 20th century.
- At peak in the 1920s, as many as 40 seafood canneries operated in the city.
- The first cannery was built in Biloxi in 1881. The city became a hub for shrimping, oystering, and fishing.
- The Mississippi Gulf Coast produces a large share of the nation's oysters and shrimp (historically cited as ~70%).
- The seafood industry brought diverse immigrant communities to Biloxi, including Slavic (Yugoslavian), Asian, and Cajun workers.
- The Maritime & Seafood Industry Museum (established 1986) preserves this history; it is located in a historic former Coast Guard building.
- The industry declined in the mid-20th century; casinos replaced seafood as the dominant industry after 1992.

#### Biloxi Lighthouse (HIGH confidence — multiple sources)

- Built in 1848; one of the first cast-iron lighthouses in the American South.
- The lighthouse stands in the median of US Highway 90 — the only lighthouse in the United States that stands in the middle of a four-lane highway. This is the city's signature trivia fact.
- Has survived two of the most destructive hurricanes in US history: Hurricane Camille (1969) and Hurricane Katrina (2005).
- Water marks on the lighthouse record Katrina's storm surge at 21.5 feet above mean sea level and Camille's at 17.5 feet.
- Jefferson Davis was involved in legislation that funded the lighthouse; Beauvoir (his later home) is visible from the lighthouse.

#### Beauvoir — Jefferson Davis Estate (HIGH confidence — Wikipedia, multiple Civil War history sources)

- Beauvoir is the name of the antebellum estate located approximately 5 miles west of Biloxi on Beach Boulevard.
- Jefferson Davis, President of the Confederate States of America, lived at Beauvoir from 1877 until his death in 1889. It was his final home.
- Davis wrote "The Rise and Fall of the Confederate Government" (two volumes) while at Beauvoir.
- The estate was named "Beauvoir" (French for "beautiful view") by Sarah Dorsey, who initially owned it and later sold it to Davis.
- Beauvoir was badly damaged by Hurricane Katrina in 2005 and was fully restored, reopening on Jefferson Davis's 200th birthday, June 3, 2008.

#### Biloxi Wade-Ins — Civil Rights (HIGH confidence — Wikipedia, History.com, BlackPast.org)

- The Biloxi wade-ins were a series of civil rights protests at Biloxi's segregated Gulf Coast beaches between 1959 and 1963.
- Led by Dr. Gilbert R. Mason Sr., a local Black physician.
- First wade-in: May 14, 1959 — Mason went swimming at a segregated beach with friends and children.
- Second formal wade-in: April 24, 1960 — 125 Black residents gathered; white-led violence erupted in what became known as "Bloody Sunday" or the "Bloody Wade-in." The event drew national media attention.
- The wade-ins ultimately led to a 1968 federal court ruling opening Biloxi's beaches to all citizens.
- The protests gave birth to the Biloxi branch of the NAACP and sparked major voter registration drives in 1960.
- Considered a significant but underrecognized event in civil rights history — often described as Mississippi's first major public civil rights protest of the movement.

#### Keesler Air Force Base (HIGH confidence — keesler.af.mil, multiple military sources)

- Keesler Air Force Base is located entirely within Biloxi city limits.
- Originally established in 1939 as Keesler Army Field; grew significantly during World War II.
- The 81st Training Wing is the host unit and is the US Air Force's electronics training Center of Excellence. Keesler trains more than 28,000 students annually across 400+ courses in 37 career fields.
- During World War II, more than 7,000 Black soldiers were stationed at Keesler Field by autumn 1943, and Tuskegee Airmen connections exist.
- The 403rd Wing (Air Force Reserve) is also based at Keesler.
- Economic impact: Keesler contributes approximately $1.4 billion annually to the Mississippi Gulf Coast economy (historical figure).

#### Casino Era (MEDIUM confidence — multiple tourism/news sources)

- Mississippi legalized casino gambling on the water (in vessels) in 1990.
- The Isle of Capri opened in 1992 as Mississippi's first legal riverboat casino, in Biloxi.
- Biloxi now has approximately 8 major casino resorts along the Gulf Coast.
- Notable casinos: Beau Rivage Resort & Casino (MGM Resorts, opened 1999), Hard Rock Hotel & Casino Biloxi (opened June 30, 2007), IP Casino Resort Spa (formerly Imperial Palace), Harrah's Gulf Coast, Golden Nugget Biloxi (formerly Isle of Capri).
- Hurricane Katrina (August 29, 2005) destroyed nearly all casino buildings. IP Casino was the first to reopen; Beau Rivage reopened exactly one year after Katrina struck.
- Casinos must be on water per state law — many are built on permanent barge-like structures moored to shore.

#### Gulf Coast Geography and Beach (HIGH confidence — multiple sources)

- Biloxi is in Harrison County, Mississippi, on the Gulf Coast.
- The city sits on a peninsula bounded by the Biloxi Bay to the north and the Mississippi Sound to the south.
- The Harrison County Shore Protection Project created the longest man-made beach in the world — 26 miles of white sand along the Gulf Coast (Henderson Point to Biloxi Lighthouse area). This is a significant civic fact.
- Gulf Islands National Seashore lies offshore; Ship Island is part of this national seashore, approximately 12 miles offshore from Biloxi.
- Biloxi has a population of approximately 49,449 (2020 census), making it Mississippi's fourth-most-populous city.
- The city's median household income is below the state average, consistent with Mississippi's economic profile.

#### Notable Culture and Arts

- Ohr-O'Keefe Museum of Art: The museum celebrates George Ohr (1857-1918), known as the "Mad Potter of Biloxi," who created avant-garde ceramics decades before the avant-garde movement. Ohr's work was ignored in his lifetime but is now recognized as a precursor to abstract expressionism in American ceramics.
- Mardi Gras: Biloxi and the Mississippi Gulf Coast have celebrated Mardi Gras since the early French colonial period — predating New Orleans' Mardi Gras celebrations. The Gulf Coast Carnival Association has run Mardi Gras parades in Biloxi since 1908.

---

## Recommended Configuration

### Slug, Prefix, Theme, Tier

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `--slug` | `biloxi-ms` | Standard city-state format; matches existing pattern (portland-or, cambridge-ma, plano-tx) |
| `--prefix` | `bxl` | 3-letter, no conflicts with existing: `bli, lac, fre, nur, ins, cas, cam, mas, pla, tex, por, ore, wdc`. Note: `bli` is Bloomington — do NOT use `bil` |
| `--theme` | `#0077A8` | Gulf Coast teal-blue; evokes the Mississippi Sound and Biloxi's coastal identity; visually distinct from all existing collection colors |
| `--tier` | `city` | Standard city collection |
| `--sort-order` | `15` | Next after Washington DC (sortOrder: 14) |

### Theme Color Rationale

| Color | Hex | Rationale | Decision |
|-------|-----|-----------|----------|
| Gulf Coast teal-blue | `#0077A8` | Evokes the Mississippi Sound, Gulf of Mexico water color, and Biloxi's identity as a coastal city. No existing collection uses a blue in this range. | **RECOMMENDED** |
| Deep Gulf teal | `#005F7A` | Darker variant, more muted | Alternative if #0077A8 feels too bright |
| Casino gold/yellow | N/A | Evokes casinos, not civic heritage | Rejected |
| Seafood red | N/A | Too similar to DC crimson or Portland red themes | Rejected |

### Tagline

**Recommended:** `"The Seafood Capital of the World is betting you don't know it."`

Rationale: References both the historic seafood identity and the casino era in a single punchy line. Uses a specific, earned claim ("Seafood Capital of the World"). The "betting" wordplay is locally grounded, not generic. Challenge-style format consistent with playbook style.

**Alternatives:**
- `"Founded before New Orleans. Does that surprise you?"` — historical framing, uses founding year surprise
- `"A French capital, a lighthouse in traffic, and 26 miles of beach. Know your Biloxi."` — layered civic facts
- `"Where the Gulf meets civil rights history. Test your Biloxi."` — civic emphasis

### Banner Image

Per playbook: "City collections = iconic local landmark." Biloxi's signature landmark is the **Biloxi Lighthouse** — standing in the median of US Highway 90, with the Gulf Coast visible behind it. This is an immediately recognizable, visually striking image.

**Recommended:** Biloxi Lighthouse photo (the white cast-iron tower at the US-90 median, ideally with Gulf waters in background).

**Alternative:** Aerial or beach view showing the 26-mile Gulf Coast beach, with casino row skyline visible.

**File to add:** `frontend/public/images/collections/biloxi-ms.jpg`

---

## Recommended Topic Distribution

```typescript
topicCategories: [
  {
    slug: 'city-government',
    name: 'City Government',
    description: 'Biloxi strong Mayor-Council form of government (adopted 1978, effective 1981), Mayor Andrew "FoFo" Gilich (first elected by special election 2015; third term starting 2025; Republican), 7-member City Council with members from individual wards, City Hall at 140 Lameuse Street, Biloxi is in Harrison County (county seat is Gulfport — do not conflate). Mix of structure questions (durable) and current-officeholder questions (expiring). Current council members: Ward 1 Wayne Gray, Ward 2 Anthony Marshall, Ward 3 Mike Nail, Ward 4 Jamie Creel, Ward 5 Paul Tisdale, Ward 6 Kenny Glavan, Ward 7 David Shoemaker.',
  },
  {
    slug: 'founding-history',
    name: 'Founding & Early History',
    description: 'French colonial founding in 1699 by Pierre Le Moyne d\'Iberville — one of the first European settlements in the Gulf South. Named for the Biloxi (Bilocci) Native American people ("first people"). Capital of French Louisiana 1720–1723 before the capital moved to New Orleans. Spanish colonial period followed French. Diverse immigrant communities drawn by seafood industry (Slavic, Asian, Cajun workers). Do not confuse Biloxi with nearby Gulfport or with Mississippi state history generally.',
  },
  {
    slug: 'seafood-heritage',
    name: 'Seafood Heritage',
    description: 'Biloxi as "Seafood Capital of the World" — earned in the early 20th century. First cannery built 1881. Peak: 40+ seafood canneries in the 1920s. Shrimp, oyster, and fishing industries that made Biloxi famous. The Maritime & Seafood Industry Museum (established 1986) in a historic former Coast Guard building. Decline of the seafood industry and transition to casino economy post-1992. The Golden Fisherman statue (1977, 16 feet tall) commemorating the seafood industry.',
  },
  {
    slug: 'landmarks-culture',
    name: 'Landmarks & Culture',
    description: 'Biloxi Lighthouse (built 1848, one of the first cast-iron lighthouses in the South, stands in the MEDIAN of US Highway 90 — the only US lighthouse on a four-lane highway median, survived Camille and Katrina). Beauvoir estate (Jefferson Davis\'s final home 1877–1889, where he wrote "The Rise and Fall of the Confederate Government"; restored and reopened June 3, 2008 after Katrina damage). George Ohr "Mad Potter of Biloxi" (avant-garde ceramicist 1857–1918, Ohr-O\'Keefe Museum). Mardi Gras tradition (Gulf Coast Carnival Association parades since 1908; Mississippi Gulf Coast Mardi Gras predates New Orleans).',
  },
  {
    slug: 'civil-rights',
    name: 'Civil Rights History',
    description: 'Biloxi wade-ins (1959–1963) — led by Dr. Gilbert R. Mason Sr., a Black physician. First wade-in May 14, 1959. Second formal wade-in April 24, 1960 ("Bloody Sunday" — violence erupted when 125 Black residents gathered on segregated beach). The protests led to a 1968 federal court ruling opening Biloxi beaches to all citizens. Gave birth to the Biloxi NAACP branch and 1960 voter registration drives. Considered Mississippi\'s first major public civil rights protest of the civil rights movement.',
  },
  {
    slug: 'military-geography',
    name: 'Military & Geography',
    description: 'Keesler Air Force Base (within Biloxi city limits; established 1939 as Keesler Army Field; host unit is the 81st Training Wing — Air Force electronics training Center of Excellence; trains 28,000+ students per year in 400+ courses). Tuskegee Airmen connection: 7,000+ Black soldiers stationed at Keesler Field by autumn 1943. Gulf Coast geography: Biloxi peninsula on Mississippi Sound; Harrison County Shore Protection Project created the longest man-made beach in the world (26 miles of Gulf Coast beach). Gulf Islands National Seashore (Ship Island lies 12 miles offshore). Population: ~49,449 (2020 census), Mississippi\'s 4th-largest city.',
  },
  {
    slug: 'casino-resilience',
    name: 'Casino Era & Hurricane Resilience',
    description: 'Mississippi legalized casino gambling on water in 1990. Isle of Capri opened 1992 — Mississippi\'s first legal riverboat casino, in Biloxi. Current major casinos: Beau Rivage (MGM Resorts, opened 1999, 85,000 sq ft), Hard Rock Biloxi (opened June 30, 2007 after Katrina delays), IP Casino Resort Spa (formerly Imperial Palace), Harrah\'s Gulf Coast, Golden Nugget Biloxi. Hurricane Katrina (August 29, 2005): nearly 90% of Gulf Coast buildings destroyed. IP Casino first to reopen; Beau Rivage reopened exactly one year after Katrina. Hurricane Camille (1969) also devastated the coast. Biloxi Lighthouse survived both storms.',
  },
],

topicDistribution: {
  'city-government': 18,       // government structure + current officeholders
  'founding-history': 12,      // founding, French capital, name origin
  'seafood-heritage': 13,      // canneries, Seafood Capital, Maritime Museum
  'landmarks-culture': 16,     // lighthouse, Beauvoir, Ohr, Mardi Gras
  'civil-rights': 10,          // wade-ins, Mason, Bloody Sunday, 1968 ruling
  'military-geography': 12,    // Keesler, man-made beach, Ship Island
  'casino-resilience': 9,      // casino law, major casinos, Katrina recovery
  // Total: 90
},
```

---

## Recommended Source URLs

```typescript
sourceUrls: [
  // Primary civic and history — Wikipedia (preferred over government portals)
  'https://en.wikipedia.org/wiki/Biloxi,_Mississippi',
  'https://en.wikipedia.org/wiki/Biloxi_Lighthouse',
  'https://en.wikipedia.org/wiki/Beauvoir_(Biloxi,_Mississippi)',
  'https://en.wikipedia.org/wiki/Biloxi_wade-ins',
  'https://en.wikipedia.org/wiki/Keesler_Air_Force_Base',
  'https://en.wikipedia.org/wiki/Maritime_%26_Seafood_Industry_Museum',
  'https://en.wikipedia.org/wiki/George_Ohr',
  'https://en.wikipedia.org/wiki/Gulf_Islands_National_Seashore',
  // Mississippi Gulf Coast history
  'https://en.wikipedia.org/wiki/History_of_Biloxi,_Mississippi',
  // Civil rights specifics (cross-check before using; confirm article exists)
  'https://en.wikipedia.org/wiki/Gilbert_R._Mason_Sr.',
  // Biloxi people (tribe — founding name origin)
  'https://en.wikipedia.org/wiki/Biloxi_people',
  // Government portal (supplementary — verify content is substantive before using)
  'https://biloxi.ms.us/departments/city-council/',
  'https://biloxi.ms.us/departments/mayor/',
],
```

Pre-generation spot-check: Verify 2-3 of these Wikipedia URLs return substantive article content before running `--fetch-sources`. Wikipedia articles for Biloxi city and Biloxi Lighthouse are confirmed substantive. The `History_of_Biloxi,_Mississippi` article may redirect to the main Biloxi article — check before including as a separate URL.

---

## Expiring Questions Strategy

**All officeholders elected June 2025; 4-year terms; next election June 2029.**

```typescript
// Mayor Andrew "FoFo" Gilich (3rd term, re-elected June 3, 2025)
expiresAt: "2029-06-01T00:00:00Z"

// Any named city council member (all elected June 2025)
// Ward 1: Wayne Gray
// Ward 2: Anthony Marshall
// Ward 3: Mike Nail
// Ward 4: Jamie Creel
// Ward 5: Paul Tisdale
// Ward 6: Kenny Glavan
// Ward 7: David Shoemaker
expiresAt: "2029-06-01T00:00:00Z"

// Durable structural questions (government form, ward count, meeting schedule, etc.)
expiresAt: null
```

**Target 15% expiring ratio:** With 90 active questions, the target is 14+ expiring questions.

- Mayor question: ~2-3 expiring questions (Who is mayor, when elected, how many terms)
- Named ward council members: Include 4-5 council members by name = ~4-5 expiring questions
- This yields approximately 6-8 expiring questions from government structure alone.

To reach 14+, also generate expiring questions in other topics where applicable. However, the Biloxi civic content outside officeholders is largely durable (lighthouse history, wade-ins, founding, Keesler, seafood heritage, Beauvoir, casinos). This means the expiring ratio may land close to 15% but not comfortably above it.

**Recommendation:** Use the targeted officeholder pass (carry-forward from Phase 60) to ensure all 7 council members and the mayor have at least one named question with expiresAt set. This gives a reliable floor of ~8-10 expiring questions. If the ratio check flags below 15%, document in the retrospective — do not force artificial expiring questions.

---

## Common Pitfalls

### Pitfall 1: Using prefix `bil` (conflicts with Bloomington `bli`)
**What goes wrong:** `bil` looks natural for Biloxi but is visually close to `bli` (Bloomington IN). Could cause confusion or manual dedup issues.
**Why it happens:** `bil` is the obvious abbreviation.
**How to avoid:** Use `bxl` — visually distinct from all existing prefixes.
**Warning signs:** Any question with external ID starting `bil-`.

### Pitfall 2: Conflating Biloxi with Gulfport / Harrison County
**What goes wrong:** Questions state Biloxi is the county seat of Harrison County (it is not — Gulfport is) or attribute county-level government to the city.
**Why it happens:** Biloxi is the better-known city; references to "Harrison County" often appear in Biloxi context.
**How to avoid:** Voice guidance: "Biloxi is in Harrison County; the county seat is Gulfport. Questions should be about Biloxi city government only."
**Warning signs:** Any question mentioning the Harrison County Board of Supervisors or claiming Biloxi is the county seat.

### Pitfall 3: Generator under-applying expiresAt to officeholder questions
**What goes wrong:** Questions about Mayor Gilich or council members are generated with `expiresAt: null` even though the locale config voice guidance mentions them as expiring.
**Why it happens:** Confirmed pattern from Phase 60 (Washington DC). The main generator does not reliably apply expiresAt to officeholder questions.
**How to avoid:** Plan a targeted officeholder pass. During curation, manually check every question naming an elected official for correct expiresAt value.
**Warning signs:** Questions like "Who is the current mayor of Biloxi?" with `expiresAt: null` in the generated output.

### Pitfall 4: Casino questions dominating the collection
**What goes wrong:** The generator over-indexes on casino content (names, opening dates, room counts) because casino source URLs are prominent in searches.
**Why it happens:** Casinos are heavily marketed online and will appear in many source documents.
**How to avoid:** Keep `casino-resilience` capped at 9 questions in topic distribution. Do not add casino-heavy source URLs. If casino questions overflow, trim during curation.
**Warning signs:** More than 12-15% of questions being about specific casino properties.

### Pitfall 5: Man-made beach attribution error
**What goes wrong:** A question states "Biloxi has the world's longest man-made beach" when the beach spans Harrison County coastline, not strictly within Biloxi city limits.
**Why it happens:** Biloxi is the most prominent city in the area; the beach is commonly referenced in the context of Biloxi.
**How to avoid:** Voice guidance: "The Gulf Coast man-made beach (26 miles, created by the Harrison County Shore Protection Project) is commonly associated with Biloxi and the Mississippi Gulf Coast — this framing is acceptable as 'the Biloxi area beach' or 'Mississippi Gulf Coast beach,' but do not claim it is entirely within Biloxi city limits."
**Warning signs:** Questions asserting "located entirely within Biloxi."

### Pitfall 6: History_of_Biloxi Wikipedia redirect
**What goes wrong:** `https://en.wikipedia.org/wiki/History_of_Biloxi,_Mississippi` redirects to the main Biloxi article, causing a duplicate source without additional content.
**Why it happens:** Wikipedia sometimes merges history sections into the main article.
**How to avoid:** Spot-check this URL before including it. If it redirects, remove it from sourceUrls to avoid wasting a source slot.
**Warning signs:** The URL resolving to `https://en.wikipedia.org/wiki/Biloxi,_Mississippi`.

---

## Code Examples

### Scaffold Command (complete)

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Biloxi, MS" \
  --slug biloxi-ms \
  --prefix bxl \
  --theme "#0077A8" \
  --tier city \
  --description "The Seafood Capital of the World is betting you don't know it." \
  --sort-order 15
# Immediately check and revert generate-locale-questions.ts if modified (Scaffold Bug 2)
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
```

### Generation Command

```bash
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale biloxi-ms \
  --fetch-sources
```

### Audit and Activation

```bash
cd backend
# Audit readiness
npx tsx src/scripts/audit-collection-readiness.ts --slug biloxi-ms --prefix bxl

# Dry run activation
npx tsx src/scripts/activate-collection.ts --slug biloxi-ms --prefix bxl --dry-run

# Activate
npx tsx src/scripts/activate-collection.ts --slug biloxi-ms --prefix bxl
```

### ExpiresAt Values

```typescript
// All elected officials from June 2025 Biloxi elections
// Mayor FoFo Gilich + all 7 ward council members
expiresAt: "2029-06-01T00:00:00Z"

// All historical, structural, and geographic facts
expiresAt: null
```

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Manual scan-duplicates.ts after generation | Automatic semantic dedup in generate-locale-questions.ts | Phase 57 | No separate dedup pass needed |
| Government portal URLs as primary sources | Wikipedia article URLs preferred | Phase 58 learning | Higher quality source content |
| Generator expected to set expiresAt reliably | Targeted officeholder pass required | Phase 60 confirmed | Plan explicit officeholder curation step |
| Expiring ratio: no floor | Expiring ratio: 15% floor warning (non-blocking) | Phase 57 | audit-collection-readiness.ts warns; document if below |
| 70 targetQuestions for city | 90 targetQuestions with 1.5x overshoot (~135 generated) | Phase 58-60 pattern | 70+ active question target requires higher generation buffer |

**Scaffold Bug 2 remains active:** After `scaffold-collection.ts`, check and revert `generate-locale-questions.ts` if modified.

---

## Open Questions

1. **Ward 4 council member name discrepancy**
   - What we know: The biloxi.ms.us city council page currently lists "Jamie Creel" for Ward 4. One election results source referenced "Fuller" winning Ward 4.
   - What's unclear: Whether the election results source was referring to the 2025 election or a different race, or whether the city website reflects the final certified result.
   - Recommendation: During locale config authoring, verify biloxi.ms.us/departments/city-council/city-council-ward-4/ directly. Treat the official city website as authoritative. If uncertainty remains, write the Ward 4 question in structural form ("How many wards does Biloxi have?") rather than naming the member.

2. **Exact term expiration date for mayor and council**
   - What we know: Mississippi municipal elections use 4-year terms; the June 3, 2025 election confirmed Mayor Gilich's third term began. 4-year cycle = next election June 2029.
   - What's unclear: Whether the term start is June 3, 2025 (election day) or July/August 2025 after a certification and inauguration period.
   - Recommendation: Use `"2029-06-01T00:00:00Z"` as a safe approximation. This is conservative (before the actual expiration). If the exact inauguration date can be found, use that instead.

3. **Whether `History_of_Biloxi,_Mississippi` is a standalone Wikipedia article**
   - What we know: The main Biloxi article exists and is substantive. A "History of Biloxi" article may or may not exist as a standalone page vs redirect.
   - What's unclear: Article status at time of generation.
   - Recommendation: Spot-check before including in sourceUrls. If redirect, drop it.

4. **Expiring ratio ceiling**
   - What we know: With 90 questions and ~8-10 officeholder questions, the ratio floor is ~9-11%. To reach 15%, need 14+ expiring questions.
   - What's unclear: Whether Biloxi's civic content naturally yields enough named-official questions without forcing it.
   - Recommendation: Write 7 council member questions + 3 mayor questions = 10 expiring minimum. If the generation and curation process yields 14+, great. If not, document in retrospective — do not pad with low-quality expiring questions.

---

## Sources

### Primary (HIGH confidence)
- `https://biloxi.ms.us/departments/mayor/` — Current mayor name, re-election 2025 confirmed
- `https://biloxi.ms.us/departments/city-council/` — Current council member names by ward confirmed
- WLOX (wlox.com) — "Incumbent Andrew 'FoFo' Gilich reelected as mayor of Biloxi" (June 4, 2025) — election result, vote share (~80%), candidates
- WXXV25 (wxxv25.com) — "Biloxi Mayor Andrew 'FoFo' Gilich wins re-election" — confirms June 2025 election result
- Search result aggregation of multiple Biloxi civic sources — government structure (Mayor-Council, 7 wards, 4-year terms), confirmed across multiple sources

### Secondary (MEDIUM confidence — WebSearch verified with multiple credible sources)
- Wikipedia (Biloxi, Mississippi) — founding 1699, French capital 1720-1723, seafood capital, lighthouse, Beauvoir, Wade-ins, Keesler — multiple sources cross-reference these facts
- Wikipedia (Biloxi Lighthouse) — 1848 construction, cast-iron, US Highway 90 median placement, Camille and Katrina water marks
- Wikipedia (Biloxi wade-ins) — Mason, May 1959 and April 1960 dates, 1968 federal ruling
- Wikipedia (Keesler Air Force Base) — 1939 founding, 81st Training Wing, 28,000 students/year
- WorldRecordAcademy.org (2024) — 26-mile man-made beach record
- Multiple tourism sources (coastalmississippi.com, tripadvisor) — casino names and opening dates

### Tertiary (LOW confidence — single or secondary sources, flag for validation)
- Ward 4 council member name: "Jamie Creel" from biloxi.ms.us vs "Fuller" from election results — treat city website as authoritative but verify directly
- Exact term inauguration date: Approximated as June 2029 based on 4-year term length
- "Mardi Gras Gulf Coast predates New Orleans" claim: Mentioned in multiple tourism sources but not independently verified with encyclopedic source. Mark as LOW confidence — do not use in questions without verification.
- Casino room counts and gaming floor sizes: From tourism/marketing sources; not independently verified

---

## Metadata

**Confidence breakdown:**
- Collection pipeline (scaffold, generate, audit, activate): HIGH — identical to Portland/Oregon/DC pipeline; no new tools
- Government structure (Mayor-Council, 7 wards, 4-year terms): HIGH — verified via biloxi.ms.us + multiple news sources
- Current officeholder names and 2025 election results: HIGH — confirmed in multiple news outlets (WLOX, WXXV25) and biloxi.ms.us
- Term expiration date (2029): HIGH — 4-year term + June 2025 election = June 2029; exact inauguration date LOW
- Civic facts (founding, lighthouse, Beauvoir, wade-ins, Keesler): HIGH — all confirmed via Wikipedia articles and multiple secondary sources
- Seafood capital claim: HIGH — confirmed across multiple encyclopedic and local sources
- Man-made beach world record: MEDIUM — cited in WorldRecordAcademy.org (2024) and multiple tourism sources; credible but single formal record source
- Casino era facts: MEDIUM — from tourism sources, mostly corroborated across multiple sites
- Tagline and theme color: HIGH (reasoning) / requires human approval

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days; officeholder accuracy stable until June 2029 election cycle)
