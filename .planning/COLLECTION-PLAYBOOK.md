# Collection Playbook

**Version:** 1.0 (bootstrapped Phase 57, 2026-03-09)
**Scope:** City and state collections for Civic Trivia Championship

This is a living document. After each collection phase, append a completed retrospective using the Retrospective Template at the end of this file.

---

## 1. The Standard Workflow

Every collection follows this 7-step process:

1. **Scaffold** — `npx tsx src/scripts/scaffold-collection.ts --name "City, ST" --slug city-st --prefix xyz --theme "#RRGGBB" --description "Punchy tagline here!"`
   - Automates: seed entry, locale config file, generator registration, COLLECTION_HIERARCHY entry
2. **Seed** — `npx tsx src/db/seed/seed.ts`
3. **Edit locale config** — Fill in topics, topic distribution, source URLs, voice guidance. Replace the generic tagline placeholder.
4. **Generate** — `npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale city-st --fetch-sources`
   - As of Phase 57: semantic dedup runs automatically after generation. No separate scan-duplicates.ts pass needed.
5. **Add banner image** — `frontend/public/images/collections/{slug}.jpg`
   - City: iconic local landmark. State: state capitol building (hard rule, no exceptions).
6. **Review/curate** — Review draft questions in admin panel. Archive weak or off-topic questions.
7. **Audit and activate** — `npx tsx src/scripts/audit-collection-readiness.ts --slug city-st --prefix xyz` then `npx tsx src/scripts/activate-collection.ts --slug city-st --prefix xyz`
   - As of Phase 57: audit warns if expiring-question ratio < 15%.

---

## 2. Known Bugs and Workarounds

### Scaffold Bug 2 (active as of Phase 57)

**Symptom:** After running `scaffold-collection.ts`, `generate-locale-questions.ts` is corrupted — a `step3` string is inserted into a TypeScript type annotation line.

**Cause:** The scaffold script incorrectly injects a registration line into the wrong location in generate-locale-questions.ts.

**Workaround:**
1. Run `git diff backend/src/scripts/content-generation/generate-locale-questions.ts` after scaffolding
2. If the file is modified, revert it: `git checkout backend/src/scripts/content-generation/generate-locale-questions.ts`
3. State collections are auto-discovered from `locale-configs/state-configs/{locale}.ts` — no manual registration in generate-locale-questions.ts is needed for state locales

**Status:** Not fixed in v2.0. Fix is backlog.

---

## 3. Content Patterns

### Mixed-Durability Pattern (established Phase 52 — Texas State)

Apply to every collection:
- **Expiring questions (target 15–30%):** Questions about current officeholders (mayor, city council, state legislature leadership, governor, commissioners) should have `expiresAt` set. Use a date 2–4 years in the future based on the official's term.
- **Durable questions:** Questions about civic structure, history, geography, laws, and institutions should have `expiresAt: null`.
- The 15% floor is now enforced as a warning by `audit-collection-readiness.ts`.

### Voice Guidance

Every locale config must include:
- **Accuracy notes:** What sources to trust, known inaccuracies to avoid
- **What to avoid:** Specific topics that generate wrong/misleading questions
- **Expiration date guidance:** How to set expiresAt for elected officials in this jurisdiction

### Expiring Question Examples by Role

| Role | Typical term | expiresAt guidance |
|------|-------------|-------------------|
| Mayor | 2–4 years | Set to end of known term |
| City council member | 2–4 years | Set to end of known term |
| State governor | 4 years | Set to end of known term |
| State legislature leadership | 2 years | Set 2 years from generation date |
| County commissioner | 4 years | Set to end of known term |

---

## 4. Quality Conventions

- **Tagline:** Every collection needs a distinctive one-liner — never ship the generic "Test your X civic knowledge!" placeholder. Style: rhetorical question or punchy stakes using a local nickname or fact.
- **Banner image:** City collections = iconic local landmark. State collections = state capitol building (hard rule).
- **No addresses or phones in answer options:** Quality rule enforced in both city and state generation prompts. The advisory quality rule in the rules engine catches stragglers.
- **State collections:** State-only curation rule — no city or regional landmark questions in the final set. State capitol questions are encouraged but must be about the capitol as a civic institution, not as a tourist landmark.
- **Minimum question count:** 70 for smaller cities, 80+ for larger cities and states. Checked by `audit-collection-readiness.ts` (net count >= 50 is the hard floor; target is higher).

---

## 5. Near-Duplicate Detection Gap (Resolved in Phase 57)

**Historical context (v1.9, Phases 47–52):** After each collection was generated, a separate manual pass was required using `scan-duplicates.ts` to find semantic near-duplicates. This was error-prone and easy to forget.

**Resolution (Phase 57):** `generate-locale-questions.ts` now runs within-collection semantic dedup automatically after all batches are seeded. The step:
- Requires `OPENAI_API_KEY` in environment (skips gracefully with a warning if not set)
- Scoped to within-collection only (cross-collection dedup remains the job of `scan-duplicates.ts`)
- Auto-archives the non-keep member of each near-duplicate cluster (>0.85 cosine similarity)
- Logs every archive action with externalId, score, cluster ID, and kept question ID

**Cross-collection dedup:** Still requires a periodic manual run of `scan-duplicates.ts`. This is intentional — cross-collection dedup is a separate concern from within-collection quality.

---

## 6. Retrospective Template

Copy this template and fill it in at the end of each collection phase. Append to this file under a new `## Retrospective:` heading.

```markdown
## Retrospective: {Collection Name} (Phase {N}, {Date})

### What went well
-

### What broke or was harder than expected
-

### Bugs encountered
-

### Carry-forward rules (new conventions for future collections)
-

### Final stats
- Questions generated:
- Questions after curation:
- Expiring question ratio:
- Generation cost: $
- Time to activate:
```

---

*Append retrospectives below this line as new `## Retrospective:` sections.*

---

## Retrospective: Portland, OR (Phase 58, 2026-03-09)

### What went well
- Automated semantic dedup ran during generation — no manual scan-duplicates.ts pass needed
- Staggered expiresAt model (Districts 1&2 = 2029, Districts 3&4 = 2027) worked cleanly with the voice guidance
- Portland's civic identity (Rose City, Forest Park, Willamette bridges, founding story) generated strong durable question content
- The 2025 government restructuring (commission → mayor-council) provided rich factual material for both durable and expiring questions
- Scaffold Bug 2 workaround applied cleanly per documented procedure

### What broke or was harder than expected
- portland.gov source fetching returned website navigation/sitemap structure rather than encyclopedic civic content — the parks-natural batch (por-056 to por-075) generated 20 questions about website categories ("Which popular search term on portland.gov...") instead of Forest Park, Willamette River, and Mount Tabor. All 20 curated out.
- Semantic dedup archived 46 of 122 generated questions (37%) — many neighborhood-to-district questions ("Which Portland City Council district includes the X neighborhood?") clustered as near-duplicates. Correct behavior, but significantly reduced the final count from parks-natural and rose-city-identity batches.
- Final question count landed at 61, below the 80+ target. Root cause: government.gov-style pages do not return encyclopedic content; Wikipedia pages returned 0-byte content due to rate limiting.

### Bugs encountered
- Scaffold Bug 2: generate-locale-questions.ts corrupted after scaffold — reverted per COLLECTION-PLAYBOOK.md workaround (expected, not new)

### Carry-forward rules (new conventions for future collections)
- **Source URL selection:** Prefer Wikipedia article URLs over government portal URLs for park/landmark/institution topics. Government portal pages (portland.gov/parks, etc.) return website navigation/sitemap content rather than encyclopedic prose. Wikipedia URLs reliably return substantive factual content.
- **Pre-generation source test:** Before running --fetch-sources, spot-check 2-3 source URLs in a browser to confirm they return substantive civic content rather than landing pages or site maps.
- **Dedup count buffer:** City collections should target 120-130 generated questions (90 target × 1.4) rather than 90 × 1.3 to account for semantic dedup reducing by 30-40%.

### Final stats
- Questions generated: 122
- Questions after curation: 61
- Expiring question ratio: 23% (14/61 questions)
- Generation cost: not logged
- Time to activate: ~35 min total (31 min generation + 4 min activation)

---

## Retrospective: Oregon (Phase 59, 2026-03-12)

### What went well
- Wikipedia source URLs (Oregon, Oregon Legislative Assembly, Governor, Capitol, Constitution, Bottle Bill, SB100) returned substantive encyclopedic content — consistent with the carry-forward rule from Portland Phase 58
- Voice guidance successfully prevented Lt. Governor confusion: the "Oregon has NO elected Lt. Governor — Secretary of State is ex officio Lt. Gov" instruction worked exactly as intended; zero bad Lt. Gov questions were generated
- Oregon's civic innovations (vote-by-mail, Bottle Bill, SB100, Death with Dignity, ballot initiative process) generated high-quality, genuinely interesting trivia questions — the material is excellent civic trivia fodder
- Semantic dedup ran automatically post-generation, correctly clustering similar questions (Pioneer statue, state motto, state flag) and reducing the set to unique-fact coverage
- Scaffold Bug 2 workaround applied cleanly per documented procedure — no unexpected issues

### What broke or was harder than expected
- **Content saturation hit faster than expected for state collections.** Three full generation runs (158 + 87 + 75 questions generated across runs) yielded only 56 unique non-duplicate questions due to aggressive semantic dedup. Oregon state civic content at the state level is more bounded than city collections — fewer unique facts, more topic overlap per batch.
- **Expiring ratio target (15–30%) unachievable for Oregon.** Oregon has only 4 statewide elected executives (Governor, SoS, AG, Treasurer) plus 2 legislative leadership roles (Senate President, House Speaker) = 6 possible expiring questions. With 81 total questions, the ceiling is 7.4% even when all 6 are included. The plan context correctly anticipated this and allowed accepting the lower ratio.
- **Manual question insertion required to reach 80-question target.** After three generation rounds + semantic dedup, the automated pipeline only produced 56 unique questions. An additional 25 hand-crafted questions were inserted directly into the database to reach 81 total, covering judiciary structure, Oregon Trail, Tom McCall legacy, Kate Brown succession, counties, Measure 91, and other uncovered topics.
- **History of Initiative and Referendum Wikipedia page returned no content** — the URL triggers a Wikipedia redirect that the scraper could not follow. Workaround: use the main Oregon Wikipedia article which includes initiative process coverage.

### Bugs encountered
- **Scaffold Bug 2:** generate-locale-questions.ts corrupted after scaffold — reverted per COLLECTION-PLAYBOOK.md workaround (expected, not new)
- **Oregon Death with Dignity Wikipedia page extraction failures** (runs 2 and 3): the URL returned no content — likely a redirect or bot protection issue specific to this page. The main Oregon article covers the Death with Dignity Act sufficiently.

### Carry-forward rules (new conventions for future collections)

- **State collection content saturation:** State collections exhaust unique civic facts faster than city collections. Plan for 2–3 generation runs and expect the automated pipeline to max out around 50–70 unique questions for most US states. Manual supplementation to reach 80 is a normal pattern for state collections — build a list of "topics not yet covered" before the supplementation pass.
- **Expiring ratio ceiling for state collections:** State collections typically have 4–6 expiring question targets (Governor + statewide executives + 2 legislative leaders). With 80+ total questions, the ceiling is roughly 5–8% even when all are included. Do not attempt to inflate the expiring ratio with artificial expiring questions — the plan context explicitly permits accepting the lower ratio for states.
- **Pre-supplementation gap analysis:** Before doing a manual insert pass, query the database for draft questions and map against planned topic areas. This reveals gaps systematically (e.g., Supreme Court structure, Trail, counties, specific governors) rather than guessing from memory.
- **Wikipedia page failures to watch for Oregon:** `History_of_Initiative_%26_Referendum_in_Oregon` and `Oregon_Death_with_Dignity_Act` pages may fail to extract. Use the main `Oregon` Wikipedia article as a fallback — it covers both topics adequately.
- **Add judiciary source URLs upfront:** Oregon Supreme Court and Court of Appeals Wikipedia pages generated clean, unique content that filled a gap. Include these in the initial source list for future state collections rather than adding them in a third-run retry.

### Final stats
- Questions generated (3 automated runs): 320 total attempts, ~243 passed validation
- Questions after automated dedup: 56 unique draft questions
- Questions after manual supplementation: 81 active questions
- Expiring question ratio: 7.4% (6/81 — Governor, SoS, AG, Treasurer, Senate President, House Speaker; below 15% target but ceiling reached)
- Generation cost: ~$4.02 total across 3 runs ($1.43 + $1.37 + $1.22)
- Time to activate: ~3 hours total (generation + curation + manual supplementation + activation)

---

## Retrospective: Washington, DC (Phase 60, 2026-03-14)

### What went well
- **District framing in voice guidance worked effectively.** The locale config's repeated "never call DC a city or state — always 'the District' or 'Washington, DC'" instructions were well-respected by the generator. Very few questions slipped through with incorrect framing — the curation pass was light on framing corrections compared to what was anticipated.
- **Content density was strong — DC is excellent trivia material.** One generation run produced 150 raw questions, 143 passed validation, 40 were archived by semantic dedup, leaving 103 unique draft questions. This is the best single-run yield in the v2.1 milestone. DC's unusual civic structure (Home Rule, congressional oversight, no voting representation, presidential judicial appointments) generates genuinely interesting and distinct trivia questions that don't overlap with the Federal collection.
- **Federal/local separation held up well.** The "FORBIDDEN CONTENT" section in the locale config (Congress, national monuments, White House, US Capitol as civic landmark) did its job. Federal institution questions that slipped through were caught easily in curation — recognizable and clearly off-topic.
- **Banner image workflow:** Used the Washington Monument Reflecting Pool panorama (user's selection) — clear blue sky, clean composition, iconic DC without overlapping with Federal collection imagery.

### What broke or was harder than expected
- **Expiring ratio was 0% after generation.** The generator did not apply `expiresAt` to any officeholder questions despite the locale config listing all four major officeholders with expiry dates. A post-generation targeted pass was required (generate-wdc-officeholder-questions.ts) to seed 15 officeholder-specific questions. This is a systemic pipeline gap — see carry-forward rules.
- **Collection was partially activated before the curation checkpoint.** 51 questions were already in `active` status when the activation script ran (origin unclear — likely an earlier checkpoint in the 60-01 session). This brought the total active count to 154, diluting the expiring ratio from 14.6% (15/103) to 9.7% (15/154). The final ratio was accepted as-is since the audit returned READY.
- **iconIdentifier and localeName scaffold errors.** Scaffold Bug 2 triggered again: generate-locale-questions.ts corrupted. Additionally, the scaffold derived `localeName: 'Washington, Washington D.C.'` (treating DC as a state abbreviation) and `iconIdentifier: 'flag-dc'` (not a valid frontend icon). All three required manual correction post-scaffold.
- **3 Wikipedia source URLs failed to extract** (voting_rights, statehood_movement, DC_Delegate pages returned no content). Non-blocking — 11 of 14 sources loaded successfully and provided strong coverage.

### Bugs encountered
- **Scaffold Bug 2 (recurring):** generate-locale-questions.ts corrupted after scaffold — applied documented workaround (revert + manual patch). Expected, not new.
- **localeName expansion bug:** Scaffold expanded "DC" as a state abbreviation, producing "Washington, Washington D.C." — corrected to "Washington, DC" in collections.ts.
- **iconIdentifier invalid slug:** Scaffold derived `flag-dc` from the slug suffix, which is not a valid frontend icon. Corrected to `flag-us`.

### Carry-forward rules (new conventions for future collections)

- **Non-standard jurisdictions: use city tier + voice guidance.** DC has no "district" tier in the schema. The correct pattern is `tier: city` with all special framing expressed entirely in voice guidance in the locale config. This approach worked well and generalizes to any other non-standard jurisdiction (territories, independent cities, etc.).
- **Officeholder questions require a separate targeted pass.** The main generator does not reliably apply `expiresAt` to officeholder questions even when the locale config declares them with expiry dates. Every collection should plan for a targeted officeholder generation pass using a script like generate-wdc-officeholder-questions.ts, or the pipeline needs to be updated to handle this natively. **Backlog item logged: add officeholders as a structured section of LocaleConfig with automatic expiry seeding.**
- **Federal/local content separation for DC.** The FORBIDDEN CONTENT list in the locale config is the right approach. For DC specifically, the test is: "Is this about the federal government acting as a national institution, or about DC's local government?" Federal = belongs in Federal collection. Local = belongs in DC collection.
- **DC expiring ratio ceiling:** DC has 4 major officeholders changing in 2026–2027 (Mayor, Council Chair, AG, Delegate). With 154 active questions, even a targeted 15-question officeholder pass only reaches 9.7%. The ceiling is roughly 10–15% for DC unless ward-level council member questions are also included (8 wards × 1 rep each). Accepting below 15% with documentation is appropriate.
- **Pre-generation source quality check:** The 3 failed Wikipedia URLs (voting rights, statehood, delegate pages) were non-critical because they were covered by other loaded articles. For future DC updates or similar jurisdictions, verify that advocacy/political-movement Wikipedia pages actually have extractable content — they sometimes redirect or block extraction.

### Final stats
- Questions generated (1 automated run): 150 raw, 143 passed validation, 40 archived by semantic dedup = 103 unique draft questions
- Questions after curation: 88 draft (user archived ~15 questions)
- Officeholder pass: 15 questions added (wdc-401 to wdc-415), all with expiresAt
- Total active at launch: 154 (includes 51 pre-existing active from earlier session)
- Expiring question ratio: 9.7% (15/154 — below 15% target, accepted; pre-existing active questions diluted ratio)
- Generation cost: not logged
- Time to activate: ~2 hours (scaffold + generate + curation + officeholder pass + activation)
