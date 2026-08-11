# Phase 59: Oregon State Collection - Research

**Researched:** 2026-03-09
**Domain:** State collection scaffolding, Oregon civic content generation, locale config authoring, mixed-durability question pattern, collection activation
**Confidence:** HIGH

---

## Summary

Phase 59 follows the established state collection pattern exactly: scaffold, author locale config with voice guidance, generate with `--fetch-sources`, curate in admin panel, add the state capitol banner image, audit, and activate. No new infrastructure is required. The full pipeline — `scaffold-collection.ts`, `generate-locale-questions.ts` (with automatic semantic dedup), `audit-collection-readiness.ts`, `activate-collection.ts`, and `verify-post-activation.ts` — is reusable as-is.

Oregon has a strong, distinctive civic identity and several genuinely surprising civic facts that make excellent trivia material: it has no lieutenant governor (the Secretary of State succeeds the governor), it pioneered vote-by-mail (first state to conduct all-mail elections, 1998), the bottle bill (first in the US, 1971), statewide land-use planning (Senate Bill 100, 1973), and the Death with Dignity Act (1997, first in the US). The ballot initiative process itself was adopted in 1902, making Oregon one of the earliest direct-democracy states. These civic innovations should each get 1–2 questions per CONTEXT.md.

The state-only curation rule is strictly enforced: Salem appears only as the state capital (no Salem city facts), Portland may appear only in statewide context, and the test for any question is "Could a future Eugene, Salem, Bend, or Portland collection own this question?" Oregon's 9 federally recognized tribes get a light 1–2 question touch on tribal presence, not governance specifics.

**Primary recommendation:** Use prefix `ore` (3-letter, no conflicts with existing prefixes), theme color `#1B4A1E` (deep Oregon forest green, visually distinct from Portland OR's `#1B6B3A`), target 100 questions with a 1.4x buffer (target 140 generated), and set all statewide elected official `expiresAt` to `"2027-01-20T00:00:00Z"` (January 2027 gubernatorial inauguration).

---

## Standard Stack

This phase uses zero new dependencies. The existing collection generation pipeline handles everything.

### Core Scripts
| Script | Purpose | Notes |
|--------|---------|-------|
| `scaffold-collection.ts` | Scaffold seed entry, locale config, generator registration | Apply Scaffold Bug 2 workaround immediately after |
| `generate-locale-questions.ts --locale oregon-state --fetch-sources` | Content generation + automatic semantic dedup | State configs auto-discovered from state-configs/ dir |
| `audit-collection-readiness.ts --slug oregon-state --prefix ore` | Validate question count + expiring ratio | Warns if expiring < 15% |
| `activate-collection.ts --slug oregon-state --prefix ore` | Activate collection | Use `--dry-run` first |
| `verify-post-activation.ts` | Post-activation sanity check | Standard step |

### Reference Files
| File | Purpose |
|------|---------|
| `backend/src/scripts/content-generation/locale-configs/state-configs/texas-state.ts` | Best reference: mixed-durability pattern, detailed voice guidance structure |
| `backend/src/scripts/content-generation/locale-configs/state-configs/massachusetts-state.ts` | Reference for 100-question state target, topic distribution |
| `backend/src/db/seed/collections.ts` | Add Oregon State seed entry here (sortOrder: 13) |
| `.planning/COLLECTION-PLAYBOOK.md` | Retrospective template — fill and append at phase close |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Locale Config Structure

State locale configs live at:
```
backend/src/scripts/content-generation/locale-configs/state-configs/oregon-state.ts
```

The file exports two named exports (the generator auto-discovers both):
- `oregonStateConfig: LocaleConfig` — topic categories, distribution, source URLs
- `oregonStateFeatures: string` — voice guidance injected into `buildStateSystemPrompt()`

### Pattern: Oregon State Config Shape

```typescript
// Source: texas-state.ts and massachusetts-state.ts reference pattern
export const oregonStateConfig: LocaleConfig = {
  locale: 'oregon-state',
  name: 'Oregon',
  externalIdPrefix: 'ore',
  collectionSlug: 'oregon-state',
  targetQuestions: 100,
  batchSize: 25,
  // ... topicCategories, topicDistribution, sourceUrls
};

export const oregonStateFeatures = `
Oregon has several unique civic features that MUST be accurately represented:
// ... voice guidance
`;
```

### Scaffold Command

```bash
cd backend
npx tsx src/scripts/scaffold-collection.ts \
  --name "Oregon" \
  --slug oregon-state \
  --prefix ore \
  --theme "#1B4A1E" \
  --description "Can you pass the Beaver State's civic test?"
```

**Immediately after scaffolding:**
```bash
git diff backend/src/scripts/content-generation/generate-locale-questions.ts
# If modified, revert (Scaffold Bug 2 workaround):
git checkout backend/src/scripts/content-generation/generate-locale-questions.ts
```

### Seed Entry to Add

Add to `backend/src/db/seed/collections.ts` (sortOrder: 13):

```typescript
{
  name: 'Oregon',
  slug: 'oregon-state',
  description: 'Can you pass the Beaver State\'s civic test?',
  localeCode: 'en-US',
  localeName: 'Oregon',
  iconIdentifier: 'state',
  themeColor: '#1B4A1E',  // deep Oregon forest green
  tier: 'state',
  isActive: false,
  sortOrder: 13
}
```

### Anti-Patterns to Avoid

- **Using government portal URLs as primary sources:** oregon.gov and oregonlegislature.gov pages return navigation/sitemap content rather than encyclopedic prose. Use Wikipedia article URLs as primary sources; add government portals as supplementary.
- **Setting targetQuestions to 70 (Texas pattern):** Oregon targets 80+ active questions (state minimum). Set targetQuestions: 100 and rely on semantic dedup reducing the generated pool appropriately.
- **Over-indexing on civic innovations:** CONTEXT.md caps each civic innovation (vote-by-mail, bottle bill, land use, etc.) at 1–2 questions. Resist the temptation to generate more — these topics cluster heavily and dedup will archive them.
- **Including Salem city content:** Salem appears ONLY as the state capital location. No Salem city council, Salem mayor, Salem local institutions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic near-duplicate removal | Manual scan-duplicates.ts pass | Built into generate-locale-questions.ts (Phase 57) | Automatic after generation; within-collection dedup runs at >0.85 cosine similarity |
| Expiring question ratio check | Manual count | audit-collection-readiness.ts | Warns if ratio < 15%; already integrated |
| Collection activation | Manual DB update | activate-collection.ts --dry-run then activate | Includes safety checks |
| State system prompt construction | Editing system-prompt.ts | buildStateSystemPrompt() picks up oregonStateFeatures automatically | Generator auto-detects stateFeatures export |

**Key insight:** State collections are auto-discovered — no registration in generate-locale-questions.ts is needed. The generator finds any file in `state-configs/` with a `*Config` and `*StateFeatures` export.

---

## Oregon Civic Facts for Voice Guidance

This is the core research payload — the facts the locale config MUST accurately represent.

### Government Structure (HIGH confidence — verified via Ballotpedia, Oregon Blue Book)

**No Lieutenant Governor (Oregon's most distinctive civic fact):**
- Oregon abolished the Lt. Governor role; the Secretary of State serves as ex officio Lt. Governor
- Secretary of State is first in the line of succession if the Governor dies, resigns, or is removed
- Example: Secretary of State Kate Brown became Governor in 2015 when John Kitzhaber resigned
- A 2025 legislative measure (HJR 16) is moving toward establishing a formal Lt. Governor office; first Lt. Gov election expected November 2028
- This succession structure is rare and excellent trivia material

**Elected Statewide Executives and Term Expirations:**
| Office | Current Holder | Party | Term End | expiresAt |
|--------|---------------|-------|----------|-----------|
| Governor | Tina Kotek | D | January 2027 (up for election Nov 2026) | `"2027-01-20T00:00:00Z"` |
| Secretary of State | Tobias Read | D | January 2029 (took office Jan 6, 2025) | `"2029-01-15T00:00:00Z"` |
| Attorney General | Dan Rayfield | D | January 2029 (took office Dec 31, 2024) | `"2029-01-15T00:00:00Z"` |
| State Treasurer | Elizabeth Steiner | D | January 2029 (elected Nov 2024) | `"2029-01-15T00:00:00Z"` |

NOTE: Governor Kotek is running for reelection in 2026. Her current term expires January 2027. Setting expiresAt to January 2027 is correct — if she wins, the question would need refreshing; if she loses, it is already expired.

**Legislative Assembly:**
- Bicameral: Oregon State Senate (30 members, 4-year staggered terms) + Oregon House of Representatives (60 members, 2-year terms)
- Full-time legislature; meets annually (not biennial like Texas or Indiana)
- No term limits for either chamber
- Current Senate President: Rob Wagner (D, Lake Oswego)
- Current House Speaker: Julie Fahey (D)
- Senate President and House Speaker: use `"2027-01-01T00:00:00Z"` for expiresAt (2-year legislative terms)

**Judiciary:**
- Oregon Supreme Court: highest court, 7 justices
- Oregon Court of Appeals: intermediate appellate court
- Judges are elected on nonpartisan ballots (unlike Texas's partisan elections)

**Oregon Constitution:**
- Adopted 1857, went into effect February 14, 1859 upon admission to the Union
- Framers drew heavily from the Indiana Constitution (over half the content derived from it)
- Amended via initiative process (simple majority of voters) or legislative referral (simple majority in both chambers + voter approval)
- First amended in 1902 when voters adopted the initiative and referendum process (Measure 1)

### Oregon Civic Innovations (HIGH confidence — verified via official sources and Wikipedia)

**Vote-by-Mail (1998):**
- Oregon Ballot Measure 60, passed November 3, 1998, by 69.4% to 30.6%
- Made Oregon the first state in the US to conduct all elections exclusively by mail
- Oregon was the first state to conduct a vote-by-mail presidential general election in 2000
- Administered by the Secretary of State

**Bottle Bill (1971 — first in the US):**
- House Bill 1036 (Oregon Bottle Bill), enacted 1971, went into effect October 1, 1972
- First bottle deposit law in the United States
- Original 5-cent deposit on beer and soft drink containers
- Reduced beverage container litter by 83% by 1974
- Governor Tom McCall was a champion of the bill (also a key voice on land-use planning)

**Statewide Land Use Planning (1973):**
- Senate Bill 100, signed May 29, 1973 by Governor Tom McCall
- Created the Land Conservation and Development Commission (LCDC)
- Required every Oregon city and county to prepare a comprehensive plan meeting statewide goals
- Oregon was the first state to mandate comprehensive statewide land-use planning
- Creates Urban Growth Boundaries (UGBs) around cities to contain sprawl

**Ballot Initiative Process (1902):**
- Oregon Constitution amended in 1902 (Measure 1) to establish initiative and referendum
- Oregon was the third state to adopt this system (after South Dakota and Utah)
- Since 1902: 377 initiative measures placed on ballot; 132 passed
- Oregon voters can amend the state constitution directly via initiative petition

**Death with Dignity Act (1997):**
- Went into effect October 27, 1997
- Oregon's was the first medical aid in dying law in the United States
- Allows terminally ill adults to obtain physician prescription for life-ending medication
- Passed as Ballot Measure 16 in 1994; survived a repeal attempt (Measure 51) in 1997

**First Cannabis Decriminalization (1973):**
- Oregon was the first state to decriminalize cannabis possession in 1973
- Later, Measure 91 (2014) legalized recreational cannabis (effective July 1, 2015)
- Measure 91 was part of the 2014 wave (alongside Colorado 2012; Oregon, Alaska, DC in 2014)

### Oregon State Capitol (MEDIUM-HIGH confidence — Wikipedia, Oregon Encyclopedia)

- Third capitol building (first two destroyed by fires in 1855 and 1935)
- Current building completed 1938, built with PWA (New Deal) funding
- Art Deco/Moderne design; white Vermont marble exterior
- Topped by a gilded bronze "Pioneer" statue by sculptor Ulric Ellerhusen
- Added to National Register of Historic Places on June 29, 1988
- Located in Salem — acceptable to reference as seat of state government
- Banner image for collection: Oregon State Capitol building (hard rule for state collections)

### Oregon's 9 Federally Recognized Tribes (HIGH confidence — Oregon ODHS, Multnomah County Library)

Oregon has exactly 9 federally recognized tribes:
1. Burns Paiute Tribe
2. Confederated Tribes of Coos, Lower Umpqua and Siuslaw Indians
3. Coquille Indian Tribe
4. Cow Creek Band of Umpqua Tribe of Indians
5. Confederated Tribes of Grand Ronde
6. Klamath Tribes
7. Confederated Tribes of Siletz
8. Confederated Tribes of the Umatilla Indian Reservation
9. Confederated Tribes of Warm Springs

Tribal question framing per CONTEXT.md: Light touch — 1–2 questions on tribal presence (e.g., "How many federally recognized tribes does Oregon have?"). Do NOT go deep on specific tribal governance structures. Oregon was also the first state to pass a state-tribal government-to-government relations law (worth noting in voice guidance).

### Claude's Discretion Items (recommendations)

**Topic distribution percentages:** Based on Texas State and Massachusetts patterns, recommend:
- Government structure (~35%): legislature, governor/executive, distinctive institutions (no-LtGov, succession)
- Oregon civic innovations (~20%): vote-by-mail, bottle bill, land use, ballot initiative, Death with Dignity
- History & statehood (~15%): 1857 constitution, statehood Feb 14 1859, notable governors, Oregon Trail
- Public policy & statewide law (~15%): courts, elections, tribal government relations
- Culture & identity (~15%): civic identity, state symbols used in civic context, 9 tribes light touch

**Oregon nickname and motto:**
- Nickname: "the Beaver State" — include as 1 question (distinctive, verifiable)
- State motto: "Alis Volat Propriis" (She Flies With Her Own Wings) — include as 1 question (memorable Latin motto)
- Oregon is also the only state with a different design on each side of its state flag (beaver on reverse, state seal on obverse) — include if space permits; excellent trivia

**External ID prefix:** `ore` — not in use (existing: bli, lac, fre, nur, ins, cas, cam, mas, pla, tex, por)

**Theme color:** `#1B4A1E` — deep Oregon forest green. Rationale: Oregon's identity is strongly tied to forests, the outdoors, and the Pacific Northwest. Portland OR uses `#1B6B3A` (brighter green); Oregon State should use a darker, more muted green to be visually distinct while maintaining thematic coherence.

**Tagline recommendation:** `"Can you pass the Beaver State's civic test?"` — uses the state nickname, poses a challenge. Alternatives: `"Oregon's been first so many times. Can you keep up?"` (references civic innovation leadership).

---

## Common Pitfalls

### Pitfall 1: Including Portland-specific content
**What goes wrong:** Generator produces questions about Portland's new 2025 council structure, Portland parks, Portland bridges — none of which are Oregon state-level facts.
**Why it happens:** Portland dominates Oregon news coverage; source material naturally skews toward Portland.
**How to avoid:** Voice guidance must explicitly enumerate Portland as excluded. The test: "Is this a fact about Oregon as a whole, or about Portland specifically?" Portland may appear only as the largest city or in statewide-policy context.
**Warning signs:** Any question mentioning Portland city council, Portland mayor, Rose City, Forest Park, Willamette bridges, or Portland neighborhoods.

### Pitfall 2: Salem city facts disguised as state capital facts
**What goes wrong:** Questions about Salem's local government, Salem landmarks, or Salem civic life appear because Salem is the capital.
**Why it happens:** Source URLs for state government often return Salem-specific content.
**How to avoid:** Voice guidance: "Salem appears ONLY as the location of the state capitol. Questions about Salem's mayor, city council, or local institutions are city facts, not state facts."
**Warning signs:** Any question that would belong in a hypothetical "Salem, OR" city collection.

### Pitfall 3: Government portal URLs returning navigation content
**What goes wrong:** oregon.gov, oregonlegislature.gov, and sos.oregon.gov often return landing pages or site navigation rather than encyclopedic prose, producing poor questions.
**Why it happens:** Portland Phase 58 demonstrated this clearly: government.gov-style pages returned website category listings, not civic facts.
**How to avoid:** Use Wikipedia article URLs as primary sources. Add government portals as secondary/supplementary. Pre-generation source test: spot-check 2-3 source URLs before running `--fetch-sources`.
**Warning signs:** Questions that sound like website category names ("Which section of oregon.gov covers…").

### Pitfall 4: Confusing the no-Lieutenant-Governor fact
**What goes wrong:** Voice guidance is ambiguous about whether Oregon has a Lt. Governor, causing generated questions to give incorrect information.
**Why it happens:** Oregon is in the process of transitioning (HJR 16 in 2025 moves toward creating a formal Lt. Gov); the current situation is nuanced.
**How to avoid:** Voice guidance must state clearly: "Oregon currently has NO elected Lt. Governor. The Secretary of State serves as ex officio Lt. Governor and succeeds the Governor. A formal Lt. Governor position may be established by 2028, but as of 2026 none exists."
**Warning signs:** Any question implying Oregon has an elected Lt. Governor.

### Pitfall 5: Overshoot buffer too small for semantic dedup
**What goes wrong:** Generate 100 × 1.3 = 130 questions; dedup archives 35-40%; end up with 78-85 active questions, barely meeting the 80+ target.
**Why it happens:** Portland Phase 58 generated 122 questions and landed at only 61 after dedup (50% reduction). State collections with topic repetition risk similar dedup rates.
**How to avoid:** Set `targetQuestions: 100` (not 70). With the default overshoot behavior, this generates ~130 questions. If the dedup rate mirrors Portland (35-50%), final count will be 65-85. If count falls short of 80 after curation, run a gap-fill batch targeting the weakest topic categories.
**Warning signs:** After generation, if the raw count before dedup is under 120, expect risk of falling below 80 active questions.

### Pitfall 6: Expiring question ratio below 15%
**What goes wrong:** Only Governor and Secretary of State generate obvious expiring questions; if those two topics produce only 8-10 questions each, the ratio falls below 15% of 80 = 12 expiring questions.
**Why it happens:** Oregon's civic innovations are durable (not tied to current officeholders). The expiring bucket is smaller than Texas (plural executive with many elected officers).
**How to avoid:** CONTEXT.md decision: if Governor + Secretary of State + AG + Treasurer don't reach 15%, expand to Senate President (Rob Wagner) and House Speaker (Julie Fahey). Per CONTEXT.md, if even legislative leadership doesn't reach 15%, accept the lower ratio with documentation rather than forcing artificial expiring questions.
**Warning signs:** `audit-collection-readiness.ts` will warn. Document rationale in retrospective if below 15%.

---

## Code Examples

### State Config Export Pattern

```typescript
// Source: texas-state.ts and massachusetts-state.ts — both use this exact pattern
import type { LocaleConfig } from '../bloomington-in.js';

export const oregonStateConfig: LocaleConfig = {
  locale: 'oregon-state',
  name: 'Oregon',
  externalIdPrefix: 'ore',
  collectionSlug: 'oregon-state',
  targetQuestions: 100,
  batchSize: 25,
  topicCategories: [ /* ... */ ],
  topicDistribution: { /* must sum to targetQuestions */ },
  sourceUrls: [ /* prefer Wikipedia URLs over government portals */ ],
};

export const oregonStateFeatures = `
Oregon has several unique features that MUST be accurately represented:
// ...
`;
```

### ExpiresAt Values for Oregon Officeholders

```typescript
// Governor Tina Kotek (term ends Jan 2027, 2026 election)
expiresAt: "2027-01-20T00:00:00Z"

// Secretary of State Tobias Read (term ends Jan 2029)
// Attorney General Dan Rayfield (term ends Jan 2029)
// State Treasurer Elizabeth Steiner (term ends Jan 2029)
expiresAt: "2029-01-15T00:00:00Z"

// Senate President Rob Wagner (2-year legislative term)
// House Speaker Julie Fahey (2-year legislative term)
expiresAt: "2027-01-01T00:00:00Z"

// Structural/historical/durable facts
expiresAt: null
```

### Generation Command

```bash
cd backend
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale oregon-state \
  --fetch-sources
```

### Audit and Activation

```bash
cd backend
# Audit first
npx tsx src/scripts/audit-collection-readiness.ts --slug oregon-state --prefix ore

# Dry run activation
npx tsx src/scripts/activate-collection.ts --slug oregon-state --prefix ore --dry-run

# Activate
npx tsx src/scripts/activate-collection.ts --slug oregon-state --prefix ore
```

### Recommended Source URLs for Oregon State

```typescript
sourceUrls: [
  // Wikipedia primary sources (preferred over government portals)
  'https://en.wikipedia.org/wiki/Oregon',
  'https://en.wikipedia.org/wiki/Oregon_Legislative_Assembly',
  'https://en.wikipedia.org/wiki/Governor_of_Oregon',
  'https://en.wikipedia.org/wiki/Oregon_State_Capitol',
  'https://en.wikipedia.org/wiki/Constitution_of_Oregon',
  'https://en.wikipedia.org/wiki/Vote-by-mail_in_Oregon',
  'https://en.wikipedia.org/wiki/Oregon_Bottle_Bill',
  'https://en.wikipedia.org/wiki/Oregon_Land_Conservation_and_Development_Act_of_1973',
  'https://en.wikipedia.org/wiki/Oregon_Death_with_Dignity_Act',
  'https://en.wikipedia.org/wiki/History_of_Initiative_%26_Referendum_in_Oregon',
  'https://en.wikipedia.org/wiki/Oregon_Secretary_of_State',
  // Government sources (supplementary — check before using)
  'https://www.oregonlegislature.gov',
  'https://sos.oregon.gov/blue-book/Pages/state/executive/governor.aspx',
  // Oregon Encyclopedia (substantive prose content)
  'https://www.oregonencyclopedia.org/articles/senate_bill_100/',
],
```

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| Manual scan-duplicates.ts after generation | Automatic semantic dedup in generate-locale-questions.ts | Phase 57 | No separate dedup pass needed |
| Government portal URLs as primary sources | Wikipedia article URLs preferred | Phase 58 learning | Higher quality source content; fewer navigation/sitemap questions |
| 70 targetQuestions for state | 100 targetQuestions for state | Phase 50 (MA), confirmed Phase 52 (TX) | 80+ active question target requires higher buffer |
| Expiring ratio: no floor | Expiring ratio: 15% floor warning | Phase 57 | audit-collection-readiness.ts warns; document if below |
| No pre-generation source check | Spot-check 2-3 source URLs before --fetch-sources | Phase 58 learning | Catches navigation-only pages before wasting generation budget |

**Scaffold Bug 2 remains active:** After `scaffold-collection.ts`, check and revert `generate-locale-questions.ts` if modified. State collections do NOT need registration in that file.

---

## Open Questions

1. **Oregon Capitol banner image availability**
   - What we know: Banner image must be a state capitol photo (hard rule for state collections). The Oregon State Capitol is a distinctive Art Deco building with white Vermont marble and the Pioneer bronze statue.
   - What's unclear: No high-quality, appropriately licensed image has been pre-sourced.
   - Recommendation: Planner should include a task to source/provide `frontend/public/images/collections/oregon-state.jpg`. The building has a distinctive silhouette; many quality photos exist publicly.

2. **LtGov transition (HJR 16)**
   - What we know: Oregon HJR 16 (2025) proposes establishing a formal Lt. Governor position; if passed, first election would be November 2028.
   - What's unclear: Whether HJR 16 passed and was referred to voters, or is still in process as of generation date.
   - Recommendation: Voice guidance should note "As of 2026, Oregon has no elected Lt. Governor." Avoid forward-looking statements about the 2028 transition in generated questions.

3. **Exact generation count needed**
   - What we know: Portland generated 122 raw questions and landed at 61 after dedup (50% reduction). Oregon State's topics (civic innovations, government structure) may cluster more predictably than Portland's neighborhood/district questions.
   - What's unclear: Dedup rate for state collections specifically — the rate may be lower (20-30%) because state questions are more factually diverse.
   - Recommendation: Plan for a gap-fill batch if active question count after initial generation + curation is below 80. Do not over-generate upfront; trust the audit step to surface gaps.

---

## Sources

### Primary (HIGH confidence)
- Oregon ODHS Tribal Affairs — oregons-nine-tribes (verified list of 9 federally recognized tribes): https://www.oregon.gov/odhs/tribal-affairs/pages/tribes.aspx
- Oregon Blue Book (Secretary of State) — government structure, officeholder bios: https://sos.oregon.gov/blue-book/
- Oregon Department of Justice — Attorney General Dan Rayfield profile: https://www.doj.state.or.us/oregon-department-of-justice/office-of-the-attorney-general/attorney-general-dan-rayfield/
- Oregon DEQ — Bottle Bill history: https://www.oregon.gov/deq/recycling/pages/bottle-bill.aspx
- Oregon LCD — Land use planning history: https://www.oregon.gov/lcd/OP/Pages/History.aspx

### Secondary (MEDIUM confidence — WebSearch verified with official sources)
- Ballotpedia: Oregon state executive offices, Tina Kotek reelection 2026, Tobias Read Secretary of State, Elizabeth Steiner Treasurer
- Oregon Capital Chronicle: Kotek reelection announcement (Dec 4, 2025), Rayfield AG early swearing-in (Jan 3, 2025)
- OPB: Steiner winning Treasurer race (Nov 5, 2024)
- Multnomah County Library: Oregon's nine tribes list confirmation

### Tertiary (LOW confidence — single source, not independently verified)
- Oregon's planned Lt. Governor transition via HJR 16 (2025 bill): reported in WebSearch results but legislative status not independently verified. Treat as informational background only; do not generate questions about it.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — identical pipeline to all prior state collections; no new tools
- Oregon government structure: HIGH — verified via Oregon Blue Book, Ballotpedia, official DOJ site
- Current officeholders and term dates: HIGH — multiple confirmed sources; all took office Jan 2025 or have confirmed reelection plans
- Civic innovations (vote-by-mail, bottle bill, SB100, Death with Dignity): HIGH — verified via official Oregon sources and Wikipedia
- Pitfalls: HIGH — directly derived from Portland Phase 58 retrospective and prior state collection patterns
- No-LtGov fact: HIGH — confirmed via Oregon Blue Book and multiple sources; HJR 16 transition is LOW (unverified status)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days; officeholder accuracy stable until next election cycle)
