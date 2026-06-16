---
phase: 65-auto-regenerate-expired-questions
verified: 2026-03-15T21:11:47Z
status: passed
score: 4/4 must-haves verified
gaps: []
---

# Phase 65: Auto-Regenerate Expired Questions Verification Report

**Phase Goal:** When the hourly expiry cron archives an expired question, it automatically generates and seeds a fresh replacement in the same topic — the collection never shrinks
**Verified:** 2026-03-15T21:11:47Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running the hourly cron when expired questions are present archives those questions AND seeds active replacements in a single pass — no separate step required | VERIFIED | `expirationSweep.ts` calls `generateReplacement()` inside the same for-loop iteration that performs `db.update(status: 'expired')`. The cron registered in `startCron.ts` at `0 * * * *` runs `runExpirationSweep()` as a single function. No separate invocation required. |
| 2 | Each replacement question shares the topic category of the question it replaces, maintaining collection topic balance | VERIFIED | `expirationSweep.ts` passes `question.subcategory` as the `topic` param to `generateReplacement()`. In `replacementGenerator.ts` the topic drives the Anthropic prompt via `{ [topic]: 1 }` as the topic distribution, scoping generation to exactly that topic. |
| 3 | Replacement questions are seeded directly as active (status = 'active'), not as drafts requiring admin review | VERIFIED | `replacementGenerator.ts` line 270: `status: 'active' as const` in the direct `db3.insert(questionsTable2)` call. Does not call `seedQuestionBatch()` (which hardcodes 'draft'). |
| 4 | If replacement generation throws or returns an error, the expiry still completes and logs a warning — the cron never fails because of a generation error | VERIFIED | Two-layer protection: (a) `generateReplacement()` wraps its entire body in a try/catch (line 45, catch at line 305) that converts any exception to `{ replaced: false, reason: err.message }` — it never throws to the caller. (b) `expirationSweep.ts` does not add a second try/catch around the call — it trusts the ReplacementResult type. When `result.replaced === false`, the sweep logs a structured `level: 'warn'` entry and increments `skippedCount`, then continues the loop. The archival `db.update` on line 64–70 is `await`-ed and committed before `generateReplacement()` is ever called. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/cron/replacementGenerator.ts` | generateReplacement() helper + tryLoadLocaleConfig + getNextExternalId | VERIFIED | 379 lines. Exports `generateReplacement` and `ReplacementResult`. Contains internal `tryLoadLocaleConfig()` with absolute path resolution via `fileURLToPath(import.meta.url)` and `getNextExternalId()` querying all statuses. |
| `backend/src/cron/expirationSweep.ts` | Extended expiry sweep with replacement generation | VERIFIED | 173 lines. Imports and calls `generateReplacement`. Extended query joins `collectionQuestions` and `collections`. Includes Set-based multi-collection dedup, replacement counters, and enhanced summary log. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `expirationSweep.ts` | `replacementGenerator.ts` | `import { generateReplacement }` | WIRED | Line 4: `import { generateReplacement } from './replacementGenerator.js'`. Called at line 83. |
| `expirationSweep.ts` | `db/schema.ts` | `innerJoin(collectionQuestions...)` + `innerJoin(collections...)` | WIRED | Lines 32–33: `innerJoin(collectionQuestions, ...)` and `innerJoin(collections, ...)`. Both imported at top of file. |
| `replacementGenerator.ts` | `anthropic-client.ts` | `import { client, MODEL }` | WIRED | Line 58: dynamic import of `client` and `MODEL` from `anthropic-client.js`. Used in `client.messages.create()` call. |
| `replacementGenerator.ts` | `question-schema.ts` | `QuestionSchema.parse` | WIRED | Line 60: dynamic import of `QuestionSchema`. Used at lines 117 and 217 — BatchSchema not referenced anywhere. |
| `replacementGenerator.ts` | `qualityRules/index.ts` | `auditQuestion` | WIRED | Line 61: dynamic import of `auditQuestion`. Called at line 128 with `{ skipUrlCheck: true }`. |
| `replacementGenerator.ts` | `db/schema.ts` | `db.insert(questions)` | WIRED | Lines 255–289: direct insert into `questions` and `collectionQuestions` with `status: 'active' as const`. |
| `startCron.ts` | `expirationSweep.ts` | `runExpirationSweep()` | WIRED | `startCron.ts` line 14: schedules `runExpirationSweep()` hourly at `0 * * * *`. |

### Requirements Coverage

All 4 COPS requirements from the phase roadmap:

| Requirement | Status | Notes |
|-------------|--------|-------|
| COPS-01: Cron archives expired questions AND triggers replacement in single pass | SATISFIED | Archive (`db.update`) and `generateReplacement()` are sequential steps in the same for-loop iteration of `runExpirationSweep()`. |
| COPS-02: Replacement shares topic of archived question | SATISFIED | `question.subcategory` passed as `topic` param; used as sole topic in `{ [topic]: 1 }` prompt distribution. |
| COPS-03: Replacement seeded as 'active' directly | SATISFIED | Direct insert with `status: 'active' as const`; `seedQuestionBatch` not used. |
| COPS-04: Generation error never crashes the cron | SATISFIED | Outer try/catch in `generateReplacement()` (line 45–310) converts all errors to `ReplacementResult`. Sweep logs warn and continues. |

### Anti-Patterns Found

No blockers or warnings found.

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| `replacementGenerator.ts` | `return null` (line 348 — `tryLoadLocaleConfig` return) | Info | Intentional design — null signals "no config found", handled by caller |
| `expirationSweep.ts` | None | — | Clean implementation |

### Human Verification Required

None. All critical paths are verifiable by code inspection:
- The never-throw contract is structurally enforced by the outer try/catch
- The topic pass-through is a direct parameter chain with no intermediate transformation
- The `status: 'active' as const` is a literal type with no conditional branch
- The archive-first ordering is `await`-enforced (synchronous in the async loop)

### TypeScript Compilation

`npx tsc --noEmit` from `backend/` passes with zero errors across both cron files.

---

## Summary

Phase 65 goal is fully achieved. The expiration sweep (`runExpirationSweep`) is a single function registered on the hourly cron. When it runs, it:

1. Queries expired active questions with full collection context (subcategory, collectionId, collectionSlug) via joined query
2. Deduplicates multi-collection rows so each question generates at most one replacement
3. For each expired question: archives it (`status: 'expired'`) unconditionally, then calls `generateReplacement()`
4. `generateReplacement()` generates via Anthropic API scoped to the exact topic, validates with `auditQuestion`, deduplicates semantically against active-only questions, allocates a collision-safe externalId, and inserts with `status: 'active'`
5. On any failure in generation, `generateReplacement()` returns `{ replaced: false, reason }` — the cron logs a structured warning and continues; the archival already committed

The collection never shrinks as a result of expiry provided the generation pipeline succeeds. When it fails, the question is archived (net -1) and the failure reason is logged for monitoring. This matches the stated goal exactly.

---

_Verified: 2026-03-15T21:11:47Z_
_Verifier: Claude (gsd-verifier)_
