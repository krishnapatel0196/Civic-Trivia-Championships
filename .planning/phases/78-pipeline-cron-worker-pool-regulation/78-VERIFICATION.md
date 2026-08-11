---
phase: 78-pipeline-cron-worker-pool-regulation
verified: 2026-04-09T00:00:00Z
status: passed
score: 15/15
---

# Phase 78 Verification

## Result: PASSED

**Score:** 15/15 must-haves verified

## Must-Have Checklist

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `volatility` column in `questions` table + schema.ts | PASS | `schema.ts` line 135: `volatility: text('volatility')` with comment `'fast' | 'medium' | 'slow' | 'stable'` |
| 2 | `reason` column in `generation_jobs` table + schema.ts | PASS | `schema.ts` line 89: `reason: text('reason')` with nullable annotation |
| 3 | `computeExpiresAt()` called in `writePassingQuestions` | PASS | `question-generator.ts` line 268: `expiresAt: computeExpiresAt(volatility)` inside the insert loop |
| 4 | `run-pipeline.ts` logs status `'success'` (not `'completed'`) | PASS | Line 106: `let pipelineStatus: 'success' | 'failed' = 'success'`; line 215: `status: pipelineStatus` |
| 5 | `InternationalLocaleConfig` interface with `volatility` field | PASS | `run-pipeline.ts` lines 47-52: interface exported with `collectionSlug`, `prefix`, `volatility: Volatility`, optional `maxQuestions` |
| 6 | `runPipeline()` accepts `maxQuestions` and slices clusters | PASS | `run-pipeline.ts` lines 59, 140-146: option accepted, `limitedClusters = clusters.slice(0, maxQuestions)` |
| 7 | ESM main-module guard in `run-pipeline.ts` | PASS | Lines 237-248: `fileURLToPath(import.meta.url)` guard with `.endsWith` fallbacks; only runs CLI when executed directly |
| 8 | `runPipeline()` throws Error (not process.exit) on missing collection | PASS | Lines 80-82: `throw new Error(\`Collection not found in DB: ${collectionSlug}\`)` |
| 9 | Nightly cron at `'0 2 * * *'` with `timezone: 'America/New_York'` | PASS | `startCron.ts` lines 43-45: `cron.schedule('0 2 * * *', ..., { timezone: 'America/New_York' })` |
| 10 | Per-collection try/catch in `pipelineCron.ts` | PASS | Lines 49-125: entire per-collection block wrapped in try/catch; one failure does not stop loop |
| 11 | One `generation_jobs` row per collection per run (success/failed/skipped) | PASS | Success: written by `run-pipeline.ts`; skipped: lines 83-92 in `pipelineCron.ts`; failed: lines 112-123 in catch block |
| 12 | `regulatePool()` archives oldest fast-then-medium when count > 72 | PASS | `poolRegulator.ts`: `POOL_CEILING = 72`; fetches fast candidates first (oldest ASC), then medium to cover remaining excess |
| 13 | Skips collection when draft count > 20 with `'skipped'` status and reason | PASS | `pipelineCron.ts` line 78: `draftCount > DRAFT_THROTTLE_LIMIT (20)`; writes `status: 'skipped'` with reason string |
| 14 | At most 8 new questions per collection per run | PASS | `pipelineCron.ts` line 34: `MAX_QUESTIONS_PER_RUN = 8`; passed as `maxQuestions: MAX_QUESTIONS_PER_RUN` |
| 15 | `startPipelineCron()` called in `server.ts` `startServer()` | PASS | `server.ts` line 39: `startPipelineCron()` inside `startServer()` function, after storage init |

## TypeScript Compilation

`npx tsc --noEmit` exits 0 — no type errors.

## Anti-Patterns Found

None. No TODOs, placeholder stubs, or empty handlers in any of the verified files.

## Notes

- `INTERNATIONAL_COLLECTIONS` array in `pipelineCron.ts` is currently empty (both entries commented out pending Phase 79 collection registration). This is intentional per the comment: "Phase 79 will add war-in-iran and climate-agreements entries here." The cron, regulation, throttle, and generation logic is fully wired and will activate when collections are registered. This is not a gap — the orchestration infrastructure is complete.
- Pool regulation correctly targets only `fast` and `medium` volatility questions; `slow` and `stable` questions are never archived by the regulator.
- The `reason` field is written for both `'skipped'` and `'failed'` job rows; null otherwise (correct per schema comment).

## Human Verification Items

None required. All phase goals are verifiable structurally. The cron timezone behavior (`America/New_York`) is declared in code and cannot be tested without a running server, but the configuration matches the requirement exactly.

---

_Verified: 2026-04-09_
_Verifier: Claude (gsd-verifier)_
