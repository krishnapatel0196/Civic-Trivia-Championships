---
phase: 37-election-question-generation-script
verified: 2026-02-26T19:19:01Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 37: Election Question Generation Script - Verification Report

**Phase Goal:** Admin can manually trigger election question generation for a specific race and see draft questions appear in the question explorer. Questions reference real candidate names, carry correct expiry dates, and link back to their race.
**Verified:** 2026-02-26T19:19:01Z
**Status:** passed
**Re-verification:** No - initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin triggers generation from UI; draft questions appear in explorer | VERIFIED | Generate button in race table Actions column (ElectionsPage.tsx line 484-489). POST to /api/admin/election-races/:id/generate with Bearer token (line 190-197). Success modal links to /admin/questions with collection and status=draft query params (line 604). |
| 2 | Generated questions contain real candidate names and seat name | VERIFIED | buildElectionSystemPrompt (line 136) embeds race.candidates names array and race.seat directly in the Claude system prompt. subcategory set to election-race per question. |
| 3 | expiresAt is end-of-day in jurisdiction local timezone not UTC midnight | VERIFIED | getEndOfDayUTC function (lines 68-96) uses Intl.DateTimeFormat with noon-anchor for DST safety. Uses toISOString split at line 390 to avoid UTC date shift. expiresAt applied on every question insert at line 505. |
| 4 | Each generated question has election_race_id set to originating race | VERIFIED | Insert at line 494-511 includes electionRaceId: raceId. Schema column election_race_id is FK to election_races.id with onDelete set null (schema.ts line 107-108). |
| 5 | After generation questionsGenerated=TRUE; second trigger shows error not duplicates | VERIFIED | questionsGenerated set true at line 532-534. GenerationBlockedError thrown at line 337-348 when flag is TRUE and force=false. API returns 409 with existingCount (admin.ts line 1449-1455). UI shows blocked modal (ElectionsPage.tsx line 633-657). |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| backend/src/services/generation/ElectionQuestionGenerator.ts | Core generation logic | VERIFIED | 547 lines. Exports GenerationResult, GenerationBlockedError, getEndOfDayUTC, getQuestionTarget, buildExternalId, buildElectionSystemPrompt, resolveCollectionAndTopic, generateElectionQuestions. All real implementations. |
| backend/src/scripts/generate-election-questions.ts | CLI entry point | VERIFIED | 151 lines. Imports generateElectionQuestions and GenerationBlockedError. Handles --race-id, --collection, --force, --dry-run, --help. process.exit on success/failure. |
| backend/src/routes/admin.ts | POST /election-races/:id/generate endpoint | VERIFIED | Route at line 1429 in 1467-line file. Returns 200/400/404/409/500. Wired to generateElectionQuestions at line 1441. Mounted at /api/admin by server.ts at line 68. |
| frontend/src/pages/admin/ElectionsPage.tsx | Generate button and 4 modals | VERIFIED | 677 lines. Generate button (line 483-490). 4 modals: slug prompt (499-563), loading spinner (565-584), success with View in Explorer (586-622), blocked/error with Force Regenerate (624-674). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| generate-election-questions.ts | ElectionQuestionGenerator.ts | import generateElectionQuestions | WIRED | Line 11-14 imports generateElectionQuestions and GenerationBlockedError; called at line 113. |
| ElectionQuestionGenerator.ts | Claude API | client.messages.create | WIRED | Line 406-411: client.messages.create with model claude-sonnet-4-6, max_tokens 8192. client imported from anthropic-client.js at line 12. |
| ElectionQuestionGenerator.ts | questions table | db.insert(questions) | WIRED | Line 494-511: db.insert with electionRaceId, expiresAt, status draft, subcategory election-race. |
| ElectionQuestionGenerator.ts | collection_questions table | db.insert(collectionQuestions) | WIRED | Line 517-520: db.insert with collectionId and questionId per inserted question. |
| ElectionQuestionGenerator.ts | election_races.questionsGenerated | db.update set questionsGenerated true | WIRED | Line 531-534. Reset to false on force-regenerate at line 376-379. |
| admin.ts | ElectionQuestionGenerator.ts | import generateElectionQuestions | WIRED | admin.ts line 11: import present; called at line 1441. |
| ElectionsPage.tsx | POST /api/admin/election-races/:id/generate | fetch POST with Bearer token | WIRED | Line 190-197: fetch with POST method, Authorization header, JSON body. Response handling at lines 199-209. |
| ElectionsPage.tsx | /admin/questions with collection and status=draft | Link in success modal | WIRED | Line 603-609: Link with collectionSlug and status=draft. onClick closes modal. |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| Admin manually triggers election question generation | SATISFIED | Generate button per race row; POST endpoint on backend |
| Draft questions appear in the question explorer | SATISFIED | Questions inserted with status draft; View in Explorer link |
| Questions reference real candidate names and seat name | SATISFIED | buildElectionSystemPrompt embeds race.candidates names and race.seat in Claude prompt |
| expiresAt set to end-of-day in local timezone | SATISFIED | getEndOfDayUTC uses Intl.DateTimeFormat noon-anchor for DST safety |
| election_race_id links each question to originating race | SATISFIED | electionRaceId: raceId in insert; FK in schema |
| Second trigger shows error/no-op not duplicates | SATISFIED | questionsGenerated flag + GenerationBlockedError + 409 + blocked modal |
| Force Regenerate archives existing and creates new | SATISFIED | Archives via status=archived, resets flag, timestamp-suffixed externalIds |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|---------|
| None | --- | --- | --- |

No TODO/FIXME markers, placeholder content, empty return stubs, or console-log-only handlers found in any of the four key files.

---

### Human Verification Status

Plan 02 included a blocking human-verify checkpoint completed during phase execution.
Per 37-02-SUMMARY.md, verified on the live Render deployment:

1. CLI --help and --dry-run: Verified working. Dry-run generated 15 questions for Bloomington Mayor race.
2. UI Generate flow: Verified. Button opens collection dropdown, loading modal shows, success modal shows count and View in Explorer link.
3. Idempotency: Verified. Second Generate click shows blocked modal with Force Regenerate button.
4. Draft questions in explorer: Verified. Questions appear filtered by collection and draft status.
5. Question content: Verified. Questions reference real candidate names per human approval sign-off.

---

### Gaps Summary

No gaps found. All 5 observable truths are structurally supported. All 4 required artifacts exist, are substantive, and are fully wired. All 8 critical links are verified connected.

Historical note (not a gap): an off-by-one expiresAt bug existed in an early iteration where using new Date with YYYY-MM-DD interpreted it as UTC midnight and shifted the local date. Fixed in commit 54ad76c by switching to toISOString split at line 390. The fix is in place.

---

_Verified: 2026-02-26T19:19:01Z_
_Verifier: Claude (gsd-verifier)_
