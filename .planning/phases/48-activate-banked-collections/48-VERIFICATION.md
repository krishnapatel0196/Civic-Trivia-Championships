---
phase: 48-activate-banked-collections
verified: 2026-03-02T04:19:32Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 48: Activate Banked Collections -- Verification Report

**Phase Goal:** Fremont CA and Norwich UK are live and playable in production for all users
**Verified:** 2026-03-02T04:19:32Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Fremont, CA collection card appears in the collection picker and a player can start a game with Fremont questions | VERIFIED | fremont-ca.jpg (40 KB) exists; getCategory returns local; production API: 54 questions confirmed |
| 2 | Norwich, England collection card appears in the collection picker and a player can start a game with Norwich questions | VERIFIED | norwich-uk.jpg (143 KB) exists; getCategory returns local; production API: 117 questions confirmed |
| 3 | Both collections return >= 50 active questions via the collections API (is_active = true) | VERIFIED | SUMMARY documents production API output: Fremont 54, Norwich 117; game.ts enforces MIN_QUESTION_THRESHOLD=50 and filters by isActive=true |
| 4 | No non-curated Fremont draft questions were accidentally promoted to active | VERIFIED | SUMMARY confirms 25 non-curated drafts remain as draft; audit shows 54 active (curated) + 25 draft (non-curated) |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/scripts/audit-collection-readiness.ts` | Pre-activation blocking readiness gate (CLI) | VERIFIED | 205 lines, Drizzle ORM, no stubs, exits 0/1 correctly |
| `backend/src/scripts/verify-post-activation.ts` | Post-activation API verification (CLI) | VERIFIED | 201 lines, native fetch, no stubs, exits 0/1 correctly |
| `backend/src/scripts/content-generation/curate-fremont-questions.ts` (modified) | civic_trivia bug fixed -- uses Drizzle ORM | VERIFIED | 365 lines; zero civic_trivia references; Drizzle join at lines 333-343 confirmed |
| `frontend/public/images/collections/fremont-ca.jpg` | Banner image for Fremont CA | VERIFIED | 40,443 bytes, modified 2026-02-21 |
| `frontend/public/images/collections/norwich-uk.jpg` | Banner image for Norwich UK | VERIFIED | 142,949 bytes, modified 2026-02-25 |
| `frontend/src/features/collections/components/CollectionPicker.tsx` | getCategory routes both slugs to local | VERIFIED | getCategory() at line 12: neither slug matches federal or -state suffix; both fall through to return local |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `audit-collection-readiness.ts` | trivia.questions + trivia.collections | Drizzle ORM .select().from() | WIRED | Lines 115-165: three Drizzle select queries; zero civic_trivia or raw schema prefix |
| `verify-post-activation.ts` | /api/game/collections | Native fetch at line 118 | WIRED | fetch(endpoint) where endpoint = apiUrl + /api/game/collections; response parsed; slug presence + questionCount >= 50 checked |
| `activate-collection.ts` (existing) | trivia.collections.isActive | Drizzle ORM update | WIRED | Existing script confirmed; SUMMARY shows both collections active in DB |
| `curate-fremont-questions.ts` | trivia.collection_questions | Drizzle ORM innerJoin at line 336 | WIRED | collectionQuestions imported from schema.js; inner join counts active Fremont questions |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| Fremont collection card appears in picker and game is playable | SATISFIED | 54 active questions in production API; banner image + category routing confirmed |
| Norwich collection card appears in picker and game is playable | SATISFIED | 117 active questions in production API; banner image + category routing confirmed |
| Both collections return >= 50 active questions (is_active = true confirmed) | SATISFIED | game.ts MIN_QUESTION_THRESHOLD=50 + isActive=true filter; API presence proves both conditions |
| No non-curated Fremont drafts accidentally promoted | SATISFIED | Audit: 54 active (curated), 25 draft (non-curated) remain as draft |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -- | -- | -- | -- |

No TODO, FIXME, placeholder, stub, or empty-return patterns found in any of the three
files created or modified in this phase.

---

### Human Verification Required

The following items require human verification in the live application. All automated
code checks pass; these are runtime and visual confirmations.

#### 1. Fremont CA game start and completion

**Test:** Navigate to the collection picker in production. Find Fremont, CA under the
Local section. Select it and start a game. Answer questions through to completion.
**Expected:** The collection card appears with the Fremont banner image. Questions are
Fremont-specific civic trivia. A full game of 10 questions completes without errors.
**Why human:** End-to-end game completion (routing, question delivery, score tracking)
cannot be verified programmatically from file inspection alone.

#### 2. Norwich, England game start and completion

**Test:** Navigate to the collection picker in production. Find Norwich, England under
the Local section. Select it and start a game. Answer questions through to completion.
**Expected:** The collection card appears with the Norwich banner image. Questions are
Norwich-specific civic trivia. A full game of 10 questions completes without errors.
**Why human:** End-to-end game completion cannot be verified programmatically.

#### 3. Local section sort order in picker

**Test:** Open the collection picker in production and inspect the Local section.
**Expected:** Collections appear in alphabetical order: Bloomington, IN -- Fremont, CA
-- Los Angeles, CA -- Norwich, England.
**Why human:** Visual sort order in the rendered UI must be confirmed by inspection.

---

## Gaps Summary

No gaps. All four must-haves are verified.

**Artifact verification:**

Both banner images exist at the correct paths: fremont-ca.jpg (40,443 bytes, modified
2026-02-21) and norwich-uk.jpg (142,949 bytes, modified 2026-02-25).

CollectionPicker.tsx getCategory() at line 12 routes both fremont-ca and norwich-uk to
the local category via the unchanged fallthrough logic. No code changes required.

audit-collection-readiness.ts (205 lines): Drizzle ORM queries on questions and
collections tables, --slug/--prefix CLI args, READY/NOT READY verdict, exit code
0 (READY) or 1 (BLOCKED), zero civic_trivia references, zero stub patterns.

verify-post-activation.ts (201 lines): calls /api/game/collections via native Node 18
fetch, checks slug presence and questionCount >= 50 for each slug, exits 0 if all
pass or 1 if any fail, zero stub patterns.

**civic_trivia fix confirmed:**

The curate-fremont-questions.ts active-count query previously used raw SQL referencing
civic_trivia.questions and civic_trivia.collection_questions. That block has been
replaced with a Drizzle ORM innerJoin query (lines 333-343). A grep for civic_trivia
across the entire file returns zero matches.

**Production verification documented:**

SUMMARY.md records the verify-post-activation.ts output run against production
(civic-trivia-backend.onrender.com):

  [PASS] Fremont, CA (fremont-ca) -- 54 active questions
  [PASS] Norwich, England (norwich-uk) -- 117 active questions
  Total collections in API: 7
  All success criteria met.

The game.ts GET /collections endpoint enforces isActive=true (line 75) and filters out
collections with questionCount < MIN_QUESTION_THRESHOLD (50) at lines 91-92. API
presence is structural proof that is_active=true AND questionCount>=50 for both.

**Curation safety confirmed:**

The audit shows Fremont has 54 active questions (the curated subset) and 25 draft
questions (non-curated remainder). The non-curated drafts were not promoted.
curate-fremont-questions.ts --mode activate --all-curated was completed prior to
collection activation, and activate-collection.ts found 0 remaining drafts to promote.

Three human verification items are flagged for runtime confirmation of visual appearance
and gameplay, but all code-level checks pass. Phase 48 goal is achieved.

---

_Verified: 2026-03-02T04:19:32Z_
_Verifier: Claude (gsd-verifier)_
