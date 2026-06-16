---
phase: 36-norwich-england-collection
verified: 2026-02-25T00:00:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: Norwich questions use UK civic terminology throughout (councillor, ward, by-election, MP)
    status: partial
    reason: Forbidden US terms are correctly absent (0 violations). UK terms present: councillor x3, ward x2, constituency x2, parish council x7. Gap - by-election and MP/Member of Parliament appear in 0 of 117 questions, in both question text and all answer options.
    artifacts:
      - path: "database: civic_trivia.questions WHERE external_id LIKE nor-%"
        issue: "by-election: 0 occurrences; MP/member of parliament: 0 occurrences across 117 questions and all answer options"
    missing:
      - At least 1-2 elections-democracy questions that include the term by-election
      - At least 1-2 questions referencing MP or Member of Parliament for Norwich North/South constituencies
---

# Phase 36: Norwich, England Collection Verification Report

**Phase Goal:** Players can select a Norwich, England collection from the collection picker and play a full game of local civic questions -- the platform's first non-US collection.
**Verified:** 2026-02-25T00:00:00Z
**Status:** gaps_found (1 partial gap on terminology coverage)
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Seventh collection card for Norwich, England appears on collection picker | VERIFIED | DB: is_active=true, sortOrder=7, 117 collection-question links; image at slug-based path |
| 2 | Starting a Norwich game delivers 10 questions covering all topic categories | VERIFIED | 117 active questions across 8 topics; game API filters isActive=true |
| 3 | Norwich questions use UK civic terminology (councillor, ward, by-election, MP) | PARTIAL | Forbidden US terms: 0. UK terms present but by-election=0, MP=0 across all 117 questions |
| 4 | Questions correctly attribute City Council vs Norfolk County Council | VERIFIED | 0 cross-tier attribution errors found |
| 5 | All Norwich questions have externalId prefixed with nor- | VERIFIED | 117/117 questions confirmed with nor- prefix |

**Score:** 4/5 truths verified (1 partial gap)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| backend/src/scripts/content-generation/locale-configs/norwich-uk.ts | VERIFIED | 119 lines, norwichConfig: 8 topics, nor prefix, en-GB source URLs, two-tier governance JSDoc |
| backend/src/scripts/content-generation/prompts/system-prompt.ts | VERIFIED | buildNorwichVoiceGuidance() defined, gated via localeSlug === norwich-uk conditional at line 104 |
| backend/src/db/seed/collections.ts | VERIFIED | Lines 71-80: norwich-uk entry, en-GB, theme #1B4332, sortOrder 7, flag-gb |
| backend/src/data/norwich-uk-questions.json | THIN | 13 lines scaffold only; questions live in DB, JSON not back-exported (non-blocking) |
| frontend/public/images/collections/norwich-uk.jpg | VERIFIED | 640x529 JPEG 142,949 bytes, CC-BY-SA 2.0 panoramic cityscape |
| backend/src/db/seed/seed-community.ts | VERIFIED | norwich-uk + norwich-uk-questions.json mapping in LOCALES array (line 59) |
| backend/src/scripts/merge-generated-questions.ts | VERIFIED | norwich-uk mapping in JSON_FILE_MAP (line 24) |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| CollectionCard.tsx | /images/collections/norwich-uk.jpg | slug-based src path | WIRED |
| useCollections.ts | /api/game/collections | apiRequest in useEffect | WIRED |
| game.ts GET /api/game/collections | collections table | isActive=true filter | WIRED |
| generate-locale-questions.ts | locale-configs/norwich-uk.js | supportedLocales map + configKeys | WIRED |
| system-prompt.ts buildSystemPrompt | buildNorwichVoiceGuidance() | localeSlug === norwich-uk conditional | WIRED |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| NORW-01 | SATISFIED | Collection active, en-GB, sortOrder 7, #1B4332, flag-gb icon |
| NORW-02 | SATISFIED | 117 active questions, 8 topic categories, 117 collection-question links |
| NORW-03 | PARTIAL | Forbidden US terms absent (0 violations); by-election and MP absent from all 117 questions |
| NORW-04 | SATISFIED | 0 cross-tier attribution errors verified |
| NORW-05 | SATISFIED | 117/117 questions use nor- prefix |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| backend/src/data/norwich-uk-questions.json | 13-line empty scaffold | Info | Non-blocking -- DB is authoritative source of truth |
| backend/src/db/seed/collections.ts line 79 | isActive: false (seed default) | Info | Non-blocking -- DB is_active=true; idempotent seed does not downgrade |

## Detailed Findings by Must-Have

### Must-Have 1: Seventh collection card on collection picker

VERIFIED.

Database row confirmed: id=16, is_active=true, sort_order=7, locale_code=en-GB, theme_color=#1B4332, icon_identifier=flag-gb. 117 active collection-question links.

CollectionPicker.tsx groups by getCategory(slug): norwich-uk does not end in -state and is not federal, so it appears in the Local group alongside Bloomington, Fremont, and Los Angeles. CollectionCard.tsx renders the image via src=/images/collections/{slug}.jpg -- norwich-uk.jpg confirmed present (142,949 bytes). The API endpoint game.ts filters isActive=true -- norwich-uk passes.

### Must-Have 2: Game delivers 10 questions covering Norwich topics

VERIFIED.

117 active questions with 117 collection-question links. Topic distribution: civic-history (15), norfolk-county (15), landmarks-institutions (15), city-council-mechanics (15), economy-culture (15), city-council-services (15), sports-community (14), elections-democracy (13). All 8 planned topic categories populated. All 117 questions have status=active.

### Must-Have 3: UK civic terminology

PARTIAL.

Forbidden US terms scan (all 117 questions, text + all answer options):
- council member: 0
- zip code: 0
- congressman: 0
- senator: 0
- special election: 0
- precinct: 2 -- VALID. Questions nor-033 and nor-073 ask about the area surrounding Norwich Cathedral. Correct answer is The Close; The Precinct is a wrong-answer distractor. Cathedral precinct is standard UK English geographic terminology, not the forbidden US civic usage.

UK terms confirmed present:
- councillor: 3 questions
- ward: 2 questions
- constituency: 2 questions
- parish council: 7 questions

UK terms absent (gap against plan requirements):
- by-election: 0 of 117 questions
- MP / Member of Parliament: 0 of 117 questions

The elections-democracy subcategory (13 questions) covers ward structure (nor-107), councillors per ward (nor-108), councillor term length (nor-109), parliamentary constituencies (nor-110, nor-111), government structure (nor-112), and education attribution (nor-113) -- but not by-elections or MPs. The plan voice guidance explicitly required both as UK-required terminology.

### Must-Have 4: Two-tier attribution correctness

VERIFIED.

Automated scan: 0 questions attributing roads/schools/social care to Norwich City Council. 0 questions attributing housing/planning/bin collections to Norfolk County Council.

Spot-check of five structurally suspicious questions (county-tier topics in city-council-services subcategory):
- nor-017 Which council is responsible for roads and highways in Norwich? Correct answer: Norfolk County Council. CORRECT.
- nor-022 Which authority manages state schools and education in Norwich? Correct answer: Norfolk County Council. CORRECT.
- nor-030 Which council is responsible for street lighting in Norwich? Correct answer: Norfolk County Council. CORRECT.
- nor-012 Which authority is responsible for public health in Norwich? Correct answer: Norfolk County Council. CORRECT.
- nor-113 Which council is responsible for education services in Norwich? Correct answer: Norfolk County Council. CORRECT.

These are correctly designed knowledge-test questions teaching the two-tier distinction. Not attribution errors.

### Must-Have 5: nor- external ID prefix

VERIFIED.

117/117 questions match nor-%. 0 violations. IDs span nor-001 through nor-119 with some sequence gaps (normal for a curated generation run where some generated questions were not kept). First five: nor-001, nor-002, nor-003, nor-004, nor-005.

## Human Verification Required

### 1. Collection Picker Visual Rendering

**Test:** Open the live app collection picker screen.
**Expected:** Norwich, England card visible in the Local group with deep forest green theme (#1B4332) and panoramic Norwich cityscape image.
**Why human:** Image loading, visual layout, and card group placement require visual inspection.

### 2. Full Game Playability

**Test:** Select Norwich, England from the collection picker and complete a 10-question game.
**Expected:** All 10 questions cover Norwich/Norfolk civic topics; questions read as authentically British; no US terminology appears in question text or answer options.
**Why human:** Game flow, question rendering, and subjective voice authenticity require interactive play.

### 3. By-Election / MP Gap Assessment

**Test:** Review elections-democracy questions during gameplay and assess whether the absence of by-election and MP terminology is a noticeable quality gap.
**Expected per original plan:** At least some questions should reference by-elections or MPs given the voice guidance explicitly required these terms.
**Why human:** Whether 0 occurrences of by-election and MP across 117 questions is a material quality gap (requiring new questions) or an acceptable omission requires editorial judgment.

---

_Verified: 2026-02-25T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
