# Phase 68: Santa Monica, CA Collection — Research

**Researched:** 2026-03-17
**Domain:** Civic trivia collection — content generation, locale config, officeholders
**Confidence:** HIGH (codebase patterns), MEDIUM (officeholder data — from city website + press), LOW (state legislators — district confirmed, names need verification)

---

## Summary

This phase scaffolds and activates a Santa Monica, CA civic trivia collection using the established collection pipeline. The key novelty is using the `officeholders` field (introduced in Phase 64) to auto-seed `expiresAt` on current-officeholder questions, targeting 15–30% expiring ratio without a manual pass.

Santa Monica operates a council-manager government with a 7-member at-large City Council, a mayor elected annually by the council, and a separately elected city attorney and city clerk. City Council members serve 4-year staggered terms, with elections in even years. The current council is split between two cohorts expiring December 2026 (3 members) and December 2028 (4 members).

The dominant accuracy risk is the SM/LA conflation problem: Santa Monica is an independent city entirely separate from Los Angeles city government. The AI will need explicit, repeated instructions to avoid attributing LA County government, LAUSD, LAPD, or LA city policies to Santa Monica.

**Primary recommendation:** Use the `officeholders` field for mayor + 2 key council members + city attorney to hit 15–30% expiring. Fill in state legislators at LOW confidence in locale config, with a curation note to verify before activation.

---

## Scaffold Command

Confidence: HIGH (read from scaffold-collection.ts directly)

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Santa Monica, CA" \
  --slug santa-monica-ca \
  --prefix smo \
  --theme "#1E6B8A" \
  --tier city \
  --description "Where Route 66 meets the Pacific — how well do you know the city at the end of the road?"
```

**Key parameters:**
- `--name`: `"Santa Monica, CA"` — will expand to `"Santa Monica, California"` as localeName automatically
- `--slug`: `santa-monica-ca`
- `--prefix`: `smo` (3 chars, lowercase letters only, not yet allocated per project memory)
- `--theme`: See Theme Color section below
- `--tier`: `city` (default, can be omitted)
- `--description`: Required for production — see Tagline section

After scaffold, run seed:
```bash
cd backend && npx tsx src/db/seed/seed.ts
```

---

## Locale Config: officeholders Field Format

Confidence: HIGH (read from biloxi-ms.ts and bloomington-in.ts directly)

The `officeholders` field is optional on `LocaleConfig`. Each entry:

```typescript
export interface OfficeholderEntry {
  name: string;       // Full name as it should appear in questions
  role: string;       // Role label, e.g. "Mayor", "City Council"
  termEnd: string;    // ISO 8601 date string, e.g. "2026-12-01T00:00:00Z"
  district?: string;  // Optional plain text — prompt context only
}
```

Example pattern from biloxi-ms.ts:
```typescript
officeholders: [
  { name: 'Andrew "FoFo" Gilich, Jr.', role: 'Mayor', termEnd: '2029-06-01T00:00:00Z' },
  { name: 'Wayne Gray', role: 'City Council', district: 'Ward 1', termEnd: '2029-06-01T00:00:00Z' },
],
```

**IMPORTANT:** The `termEnd` drives `expiresAt` auto-seeding — entries with a `termEnd` produce expiring questions. This is the mechanism that replaces a manual targeted pass.

---

## Current Santa Monica Officeholders

Confidence: MEDIUM (sourced from smgov.net/departments/council/content.aspx?id=13705, verified 2026-03-17)

### City Council (all elected at-large, 4-year staggered terms)

| Name | Role | Term Expires | Notes |
|------|------|-------------|-------|
| Caroline Torosis | Mayor | December 2026 | Mayor is elected annually by council members; currently in the mayor seat |
| Jesse Zwick | Mayor Pro Tem / Council Member | December 2026 | Currently also serving as Mayor Pro Tem |
| Lana Negrete | Council Member | December 2026 | Third member of 2022 cohort |
| Dan Hall | Council Member | December 2028 | 2024 election cohort |
| Ellis Raskin | Council Member | December 2028 | 2024 election cohort |
| Barry Snell | Council Member | December 2028 | 2024 election cohort — was listed as "Mayor" in older DBpedia data (likely previous mayor rotation) |
| Natalya Zernitskaya | Council Member | December 2028 | 2024 election cohort |

**Term end date to use in officeholders field:**
- Cohort 1 (Torosis, Zwick, Negrete): `"2026-12-01T00:00:00Z"`
- Cohort 2 (Hall, Raskin, Snell, Zernitskaya): `"2028-12-01T00:00:00Z"`

**Note on Mayor:** Santa Monica's mayor is NOT directly elected — the City Council votes on who serves as mayor annually. Caroline Torosis currently holds the title. For expiring-question purposes, use term end `"2026-12-01T00:00:00Z"` for her council seat; the mayor title itself may rotate before then.

### City Attorney
- **Douglas Sloan** — appointed/hired by City Council as permanent city attorney (per SMDP reporting, May 2022). City attorney is elected separately in Santa Monica. Term end: **verify on smgov.net before generation** (standard CA city attorney terms are 4 years; if elected in 2022, likely expires ~2026).
- Use `termEnd: "2026-12-01T00:00:00Z"` as best estimate — flag for verification during curation.

### City Clerk
- **Denise Anderson-Warren** — appointed City Clerk in 2016, long-serving. No election or reappointment date confirmed in research. City clerk is elected in Santa Monica.
- Do NOT include in officeholders field without verified term date. Use structural questions about city clerk role instead.

### State Representatives (LOW confidence — district confirmed, names need verification)

**State Assembly — AD-51:**
- Representative: **Rick Chavez Zbur** (confirmed AD-51 from Ballotpedia + SMDP tag "Santa Monica's new AD-51")
- Term end: December 7, 2026
- Use `termEnd: "2026-12-07T00:00:00Z"`

**State Senate — SD-26:**
- Senator: **Maria Elena Durazo** (confirmed SD-26 from Ballotpedia)
- Term end: December 7, 2026
- Coverage of Santa Monica: SD-26 area is consistent with West LA geography, but not explicitly confirmed in research
- Use `termEnd: "2026-12-07T00:00:00Z"` — flag for verification during curation

**Verification instruction for locale config:** Add comment `// VERIFY district coverage at legislature.ca.gov before activation`

---

## Recommended officeholders Config for Phase 68

Based on the phase decision to include mayor + 2–3 most prominent council members + city attorney + state legislators:

```typescript
officeholders: [
  // City Council — Cohort 1 (expires Dec 2026)
  { name: 'Caroline Torosis', role: 'Mayor', termEnd: '2026-12-01T00:00:00Z' },
  { name: 'Jesse Zwick', role: 'City Council Member / Mayor Pro Tem', termEnd: '2026-12-01T00:00:00Z' },
  { name: 'Lana Negrete', role: 'City Council Member', termEnd: '2026-12-01T00:00:00Z' },
  // City Council — Cohort 2 (expires Dec 2028)
  { name: 'Ellis Raskin', role: 'City Council Member', termEnd: '2028-12-01T00:00:00Z' },
  // City Attorney (VERIFY term end — estimated 2026)
  { name: 'Douglas Sloan', role: 'City Attorney', termEnd: '2026-12-01T00:00:00Z' },
  // State representatives (VERIFY district coverage)
  { name: 'Rick Chavez Zbur', role: 'California State Assembly Member', district: 'AD-51', termEnd: '2026-12-07T00:00:00Z' },
  { name: 'Maria Elena Durazo', role: 'California State Senator', district: 'SD-26', termEnd: '2026-12-07T00:00:00Z' },
],
```

**Expected expiring question yield:** With 7 officeholders across 2 term-end dates, the generator should produce approximately 14–21 expiring questions out of ~130 generated (targeting 90–95 after curation), placing the expiring ratio at 15–22% — within the 15–30% target.

---

## Topic Categories and Distribution

Confidence: HIGH (follows established city collection pattern, verified against biloxi-ms.ts, cambridge-ma.ts, los-angeles-ca.ts)

Target: **90–95 questions** after curation. Generate with `overshootFactor: 1.4` (130 generated → curate to ~90–95).

Set `targetQuestions: 130` with `overshootFactor: 1.4` in locale config.

### Recommended Topic Categories

| Slug | Name | % | ~Questions (of 130) | ~After Curation |
|------|------|---|---------------------|-----------------|
| `city-government` | City Government | 22% | 29 | ~20 |
| `civic-history` | Civic History | 18% | 23 | ~17 |
| `landmarks-culture` | Landmarks & Culture | 18% | 23 | ~17 |
| `local-services` | Local Services | 15% | 19 | ~14 |
| `economy-development` | Economy & Development | 15% | 19 | ~14 |
| `community-environment` | Community & Environment | 12% | 16 | ~12 |

**Total:** 100% → ~129 generated, ~94 after curation at typical 73% keep rate

### Topic Descriptions (for locale config)

**city-government (22%):** Santa Monica council-manager government structure — 7-member at-large City Council elected to staggered 4-year terms, mayor elected annually by council (not directly by voters), city manager role, city attorney, city clerk. Current mayor Caroline Torosis (term expires Dec 2026). Government offices at 1685 Main St. ALL officeholder questions MUST have expiresAt set. Mix structural/durable questions with current-officeholder expiring questions.

**civic-history (18%):** Santa Monica incorporated November 30, 1886. Named after Saint Monica (mother of Saint Augustine). Originally part of Rancho San Vicente y Santa Monica land grant (Arcadia Bandini de Baker and Robert Baker). John P. Jones (Nevada senator) laid out the town in 1875. Annexation by Los Angeles refused — Santa Monica has remained an independent city. 1984 Olympic marathon finish line at City Hall. 2028 Olympic venues.

**landmarks-culture (18%):** Santa Monica Pier (opened 1909, municipal pier owned/operated by City of Santa Monica, western terminus of historic Route 66, home to Pacific Park amusement park and Santa Monica Pier Aquarium). Third Street Promenade (pedestrian mall, major outdoor retail district). Palisades Park (clifftop park overlooking the Pacific). Santa Monica Place (shopping center). Civic Auditorium (notable music and event venue). Getty Villa nearby (Pacific Coast Highway, Malibu — NOT within city, use only as regional context if needed).

**local-services (15%):** Santa Monica Fire Department, Santa Monica Police Department (independent from LAPD), Big Blue Bus (city-operated transit system — NOT LA Metro, not LACMTA), Santa Monica Public Library, Heal the Bay, Santa Monica Airport (SMO — now closed/being converted to park per 2028 agreement), City services and recycling programs, Santa Monica Pier Corporation.

**economy-development (15%):** Silicon Beach tech hub (major tech company offices in Santa Monica area). Tourism and hospitality economy. Third Street Promenade retail district. Santa Monica Convention and Visitor Bureau. Bergamot Station arts complex (former Red Car trolley terminus, now arts center). Rent control — Santa Monica has one of the strongest rent control ordinances in California (since 1979). Housing policy and development tensions.

**community-environment (12%):** Santa Monica Bay and Heal the Bay advocacy. Santa Monica Mountains (Tongva/Chumash indigenous history — note Santa Monica's land was Tongva territory). Sustainable City Plan (Santa Monica has been a sustainability policy leader since the 1990s). Environmental programs. Neighborhood associations. LGBTQ+ community and history. Schools (Santa Monica-Malibu Unified School District — SMMUSD, not LAUSD).

---

## Theme Color

Confidence: MEDIUM (judgment based on coastal identity + existing color palette)

**Recommended: `#1E6B8A`** — Pacific ocean blue, deeper than the LA collection's `#0369A1`, evoking the Santa Monica Bay coastal character. Visually distinct from all existing colors in the seed file (verified: no existing collection uses this hex).

**Rationale:**
- LA collection uses `#0369A1` (bright ocean blue) — Santa Monica should be distinct but thematically coherent
- Fremont uses `#047857` (emerald green)
- A darker, slightly teal-shifted ocean blue (`#1E6B8A`) reads as "Santa Monica coastal" without duplicating LA

**Alternative if `#1E6B8A` feels too similar to LA:** `#0E5C78` (deeper teal-blue) or `#1A5276` (navy-teal).

---

## Banner Image Recommendation

Confidence: LOW (Wikimedia Commons pages returned 403 errors — could not directly verify license and resolution; recommendation based on known well-licensed files)

**Subject (locked decision):** Santa Monica Pier — most iconic, instantly recognizable landmark.

**Recommended Wikimedia search:** Executor should search Wikimedia Commons at `https://commons.wikimedia.org/wiki/Category:Santa_Monica_Pier` and look for:

1. **Preferred:** Public domain or CC0 images of the pier showing the full structure with the Pacific Ocean
2. **Acceptable:** CC-BY or CC-BY-SA images (attribution required in app if used)

**Known candidates to check (could not verify licenses due to 403 errors):**
- `File:Santa_Monica_Pier_and_beach_from_Palisades_Park_-_2012.jpg`
- `File:Santa_Monica_Pier_December_2010.jpg`
- `File:Santa_Monica_Pier_at_night,_2012.jpg`

**Fallback search query:** `site:commons.wikimedia.org "Santa Monica Pier" license:pd OR license:cc0`

**File destination:** `frontend/public/images/collections/santa-monica-ca.jpg`

**Framing guidance:** Aerial or wide-angle daytime shot showing the full pier structure extending into the Pacific — landmark character must be immediately obvious.

---

## Key Accuracy Risks and Voice Guidance

Confidence: HIGH (based on context decisions + research of SM/LA independence)

### CRITICAL: Santa Monica ≠ Los Angeles

This is the dominant accuracy risk. Santa Monica is an **independent city** within Los Angeles County but entirely separate from the City of Los Angeles. The AI will conflate them without strong, explicit guardrails.

Specifically avoid attributing these to Santa Monica:
- **LAPD** — Santa Monica has its own **Santa Monica Police Department (SMPD)**
- **LAUSD** — Santa Monica schools are in **Santa Monica-Malibu Unified School District (SMMUSD)**
- **LA Metro / LACMTA** — Santa Monica operates the **Big Blue Bus** (its own municipal transit)
- **Los Angeles City Council districts** — Santa Monica has its own at-large council
- **LA City Mayor** — has no jurisdiction over Santa Monica
- **LA County Board of Supervisors** — has county jurisdiction but is NOT the city government

### LA County is acceptable context only
LA County has some jurisdiction over Santa Monica (countywide services like LA County Sheriff mutual aid, superior courts), but questions should be about Santa Monica city government, not county government. LA may appear only as geographic context ("located in Los Angeles County").

### Civic Knowledge over Tourist Trivia
Santa Monica's fame is dominated by the pier, beach, and Route 66 mythology. Questions must reflect governance and civic identity, not tourist highlights. Apply the test: "Would a Santa Monica resident who never visits the pier still know this?"

### Route 66 Endpoint — Accuracy Detail
Route 66's traditional western endpoint is Santa Monica. The famous "End of the Trail" sign is on the Santa Monica Pier, though the official highway terminus historically ended at Lincoln Blvd and Olympic Blvd (before the pier signage). For question purposes, Santa Monica Pier is the culturally accepted terminus — this is safe for trivia.

### Mayor Election Mechanism
The Santa Monica mayor is NOT directly elected by voters. The City Council votes each December/January to elect one of their members as mayor for a one-year term. Questions about "how the mayor is chosen" must reflect this council-manager structure.

### City Attorney and City Clerk
Both are separately elected positions in Santa Monica (unlike many cities where they are appointed). This is a notable civic fact worth one or two questions.

### 2028 Olympics
Santa Monica is a host venue for the 2028 LA Olympics. This is current and durable enough for questions since the 2028 games are confirmed.

---

## Voice Guidance Block for Locale Config

```
CRITICAL ACCURACY NOTES:
- Santa Monica is its own independent city — NOT part of Los Angeles city government
  - Use SMPD (Santa Monica Police Department), NOT LAPD
  - Use SMMUSD (Santa Monica-Malibu Unified School District), NOT LAUSD
  - Use Big Blue Bus (city transit), NOT LA Metro / LACMTA
  - SM city council is at-large — NOT LA City Council districts
- Mayor is elected annually by City Council members, NOT directly by voters
- City Attorney and City Clerk are separately elected positions (notable civic fact)
- Route 66 western terminus: Santa Monica — the pier sign is the cultural endpoint
- Questions must reflect governance and civic identity, NOT tourist beach trivia
- LA appears only as geographic context ("in LA County"); do not attribute county government to city
- ALL officeholder questions MUST have expiresAt — verify termEnd dates during curation
- No addresses or phone numbers in answer options (quality rule)
- Verify state legislators (AD-51 / SD-26) district coverage before activation
```

---

## Activation Command

Confidence: HIGH (read from activate-collection.ts directly)

```bash
cd backend
# 1. Dry run first:
npx tsx src/scripts/activate-collection.ts --slug santa-monica-ca --prefix smo --dry-run

# 2. Run audit:
npx tsx src/scripts/audit-collection-readiness.ts --slug santa-monica-ca --prefix smo

# 3. Activate:
npx tsx src/scripts/activate-collection.ts --slug santa-monica-ca --prefix smo
```

`activate-collection.ts` warns if net question count < 50. The audit script exits 0 if ready (>= 50 questions).

---

## Architecture Patterns

Confidence: HIGH (verified against biloxi-ms.ts, cambridge-ma.ts, bloomington-in.ts, scaffold-collection.ts)

### Collection Flow (Standard)
1. `scaffold-collection.ts` → creates seed entry + locale config + registers in generator
2. `seed.ts` → writes collection to DB
3. Edit locale config: fill topics, descriptions, officeholders, sourceUrls
4. `generate-locale-questions.ts --locale santa-monica-ca --fetch-sources`
5. Add banner image to `frontend/public/images/collections/santa-monica-ca.jpg`
6. Review/curate draft questions in DB
7. `audit-collection-readiness.ts` → verify ≥ 50 net questions and 15–30% expiring
8. `activate-collection.ts` → set collection + questions to active

### officeholders Auto-Seeds expiresAt
The generator reads the `officeholders` array and uses `termEnd` values to auto-set `expiresAt` on questions mentioning those officeholders. No manual targeted pass is needed — this is the Phase 64 feature being used for the first time in production here.

### Source URLs: Wikipedia-first Rule
Per carry-forward rule from Phase 58-02: use Wikipedia as primary source, NOT the city government portal (which returns navigation/sitemap content instead of parseable facts).

### Recommended sourceUrls for Santa Monica
```typescript
sourceUrls: [
  'https://en.wikipedia.org/wiki/Santa_Monica,_California',
  'https://en.wikipedia.org/wiki/Santa_Monica_Pier',
  'https://en.wikipedia.org/wiki/Third_Street_Promenade',
  'https://en.wikipedia.org/wiki/Big_Blue_Bus',
  'https://en.wikipedia.org/wiki/Santa_Monica-Malibu_Unified_School_District',
  'https://en.wikipedia.org/wiki/Bergamot_Station',
  'https://en.wikipedia.org/wiki/Santa_Monica_Civic_Auditorium',
  'https://en.wikipedia.org/wiki/Santa_Monica_Airport',
  'https://en.wikipedia.org/wiki/Tongva',
  'https://www.smgov.net/departments/council/content.aspx?id=13705',
  'https://www.smgov.net/departments/council/',
],
```

---

## Tagline

**Locked angle (from context):** Pier + Route 66 endpoint + coastal character

**Recommended tagline:**
> "Where Route 66 meets the Pacific — how well do you know the city at the end of the road?"

**Shorter alternative (if display truncates):**
> "End of the road, start of the Pacific — do you know Santa Monica's civic story?"

**Shortest punchy version:**
> "The road ends here. Does your civic knowledge?"

The first option best captures the dual identity (Route 66 heritage + coastal city) and fits the rhetorical-question style used across the project.

---

## External ID Prefix

**`smo`** — 3 characters, all lowercase, matches `/^[a-z]{2,4}$/` validation, not currently allocated per project memory. Confirmed no conflict with existing prefixes: `bli`, `lac`, `fre`, `nur`, `ins`, `cas`, `cam`, `mas`, `pla`, `tex`, `por`, `ors`, `wdc`, `bxl`, `mis`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Semantic dedup | Custom duplicate detection | `runWithinCollectionSemanticDedup()` runs automatically after generation |
| expiresAt seeding | Manual post-generation script | officeholders field in locale config drives auto-seeding |
| Collection activation | Direct DB writes | `activate-collection.ts --slug santa-monica-ca --prefix smo` |
| Pre-activation checks | Manual count queries | `audit-collection-readiness.ts --slug santa-monica-ca --prefix smo` |

---

## Common Pitfalls

### Pitfall 1: SM/LA Conflation in Generation
**What goes wrong:** Generator produces questions attributing LAPD, LAUSD, or LA city council to Santa Monica.
**Why it happens:** Santa Monica's geography inside LA County makes the AI default to LA institutions.
**How to avoid:** Topic descriptions in locale config must name SMPD, SMMUSD, Big Blue Bus explicitly. Voice guidance must say "Santa Monica is its own city — not LA" multiple times in different topic descriptions.
**Warning signs:** Questions mentioning "Chief of Police" that sound like LAPD, school questions mentioning LAUSD.

### Pitfall 2: Mayor Role Mischaracterization
**What goes wrong:** Questions treat the mayor as a directly elected chief executive.
**Why it happens:** Most people assume mayors are directly elected.
**How to avoid:** City government topic description must state explicitly: "mayor elected annually by City Council, NOT directly by voters; city manager is chief executive."

### Pitfall 3: officeholders termEnd Date Format
**What goes wrong:** Using wrong date format or wrong year for term cohorts.
**Why it happens:** Two cohorts (2026 and 2028) require careful tracking.
**How to avoid:** Use ISO 8601 format `"2026-12-01T00:00:00Z"` and `"2028-12-01T00:00:00Z"`. Biloxi pattern uses `-06-01` for June elections; Santa Monica's December terms use `-12-01`.

### Pitfall 4: Tourist Trivia Dominance
**What goes wrong:** Collection becomes about beach/pier/Route 66 tourism, not civic governance.
**Why it happens:** Santa Monica's cultural identity is heavily pier/beach-focused.
**How to avoid:** Cap landmarks-culture at 18%, ensure city-government at 22% is the largest topic. Civic framing test: "Would this question appear on a Santa Monica citizenship test?"

### Pitfall 5: Expiring Ratio Below 15%
**What goes wrong:** After curation, fewer than 15% of questions have expiresAt.
**Why it happens:** Curating too aggressively removes officeholder questions.
**How to avoid:** Run `audit-collection-readiness.ts` before activation — it warns if ratio < 15%. Prioritize keeping expiring officeholder questions during curation.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual targeted pass for expiresAt | officeholders field auto-seeds expiresAt | Phase 64 | No manual pass needed |
| Separate scan-duplicates.ts | Automatic semantic dedup in generator | Phase 63 | No separate dedup step |
| Generic "Test your X civic knowledge!" tagline | Distinctive tagline required at scaffold time | Phase 63 | Pass --description flag or fix immediately after |

---

## Open Questions

1. **Douglas Sloan city attorney term end**
   - What we know: Hired as permanent city attorney per SMDP reporting ~May 2022; city attorney is elected in Santa Monica
   - What's unclear: Was he elected in 2022? What is the 4-year term end date?
   - Recommendation: Use `"2026-12-01T00:00:00Z"` as estimate, add curation note to verify at smgov.net

2. **Denise Anderson-Warren current status as city clerk**
   - What we know: Appointed 2016, per SMDP 2017 article
   - What's unclear: Has she been re-elected or replaced in 2024?
   - Recommendation: Do NOT include in officeholders without verified term date; use structural questions about city clerk role instead

3. **State legislators district coverage**
   - What we know: AD-51 (Rick Chavez Zbur) confirmed via "Santa Monica's new AD-51" SMDP tag; SD-26 (Maria Elena Durazo) confirmed as likely (West LA geography)
   - What's unclear: Exact district boundary confirmation for both
   - Recommendation: Include in officeholders with LOW-confidence comment; verify at legislature.ca.gov before activation

4. **Wikimedia Commons pier image license**
   - What we know: Pier is widely photographed; Commons should have multiple options
   - What's unclear: Couldn't verify specific file licenses due to 403 errors
   - Recommendation: Executor manually visits `https://commons.wikimedia.org/wiki/Category:Santa_Monica_Pier` to select best-licensed high-quality image

---

## Sources

### Primary (HIGH confidence)
- `C:/Project Test/backend/src/scripts/scaffold-collection.ts` — scaffold command signature
- `C:/Project Test/backend/src/scripts/activate-collection.ts` — activation command signature
- `C:/Project Test/backend/src/scripts/audit-collection-readiness.ts` — readiness audit
- `C:/Project Test/backend/src/scripts/content-generation/locale-configs/biloxi-ms.ts` — officeholders format
- `C:/Project Test/backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — LocaleConfig interface
- `C:/Project Test/backend/src/db/seed/collections.ts` — existing theme colors, prefix allocations

### Secondary (MEDIUM confidence)
- `https://www.smgov.net/departments/council/content.aspx?id=13705` — All 7 council members with term end dates, verified 2026-03-17
- `https://dbpedia.org/page/Santa_Monica,_California` — Incorporation 1886, council-manager government, population 93,076
- `https://dbpedia.org/page/Santa_Monica_Pier` — Pier opened 1909, Route 66 western terminus
- `https://ballotpedia.org/Maria_Elena_Durazo` — SD-26, term ends December 7, 2026
- `https://ballotpedia.org/Rick_Chavez_Zbur` — AD-51, term ends December 7, 2026
- `https://smdp.com/tag/city-attorney/` — Douglas Sloan hired as permanent city attorney ~2022
- `https://smdp.com/tag/city-clerk/` — Denise Anderson-Warren as city clerk (2017 data)

### Tertiary (LOW confidence)
- SMDP tag pages confirming "Santa Monica's new AD-51" for Rick Chavez Zbur — district coverage not explicitly confirmed
- SD-26 covering Santa Monica inferred from West LA geography, not explicit confirmation

---

## Metadata

**Confidence breakdown:**
- Scaffold/activation commands: HIGH — read directly from source scripts
- officeholders field format: HIGH — read directly from biloxi-ms.ts and bloomington-in.ts interfaces
- City council member names and terms: MEDIUM — from official city website, verified 2026-03-17
- City attorney name: MEDIUM — from SMDP reporting (2022); term end date LOW (estimated)
- City clerk: LOW — last confirmed 2017 only
- State legislators: MEDIUM (names confirmed via Ballotpedia) / LOW (district coverage of Santa Monica not explicitly confirmed)
- Theme color: MEDIUM — judgment call, no official color required
- Banner image: LOW — couldn't verify specific Commons file licenses

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (officeholder data valid until next election cycle; state legislators valid through their December 2026 terms)
