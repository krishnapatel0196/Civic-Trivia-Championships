---
phase: 53
status: human_needed
score: 4.5/5 must-haves verified
---

# Phase 53 Verification

**Phase Goal:** Award XP server-side after each game for Connected players
**Verified:** 2026-03-05
**Status:** human_needed
**Re-verification:** No -- initial verification

## Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Connected player completes a game -> XP award call made to Empowered Accounts API | VERIFIED | game.ts line 403: isConnected===true guard; line 412: session.xpResult = await awardPlatformXp(...) inside that guard |
| 2 | Awarded amount: 50 base + up to 150 variable (range 50-200) | VERIFIED | progressionService.ts lines 147-153: BASE_XP=50, VARIABLE_XP=150, scoreRatio=correctAnswers/totalQuestions, formula=BASE_XP+Math.round(scoreRatio*VARIABLE_XP). Range 50-200 confirmed. |
| 3 | Repeating same sessionId -> is_duplicate: true, no double-award | VERIFIED (with note) | Idempotency key ctc-game-{sessionId}-{userId} at game.ts line 411 sent as idempotency_key. progressionAwarded gate (line 395) prevents block re-running on warm session. isDuplicate mapped from is_duplicate (progressionService.ts line 212). Duplicate = success: confirmed=true, isDuplicate=true. |
| 4 | Inform/anonymous player -> no award call, no error | VERIFIED | Anonymous blocked at line 395. Inform-tier (isConnected:false) blocked at line 403. Both return progression.xp=null with no error. |
| 5 | TRIVIA_SERVICE_KEY and EMPOWERED_ACCOUNTS_API_URL documented and validated at startup | PARTIAL | Documented in .env.example lines 17-21. Startup validation: NOT present -- env.ts is only dotenv.config(). Call-time check in awardPlatformXp() lines 173-176 warns and returns {confirmed:false} if vars absent. Runtime-warn-on-call, not startup validation. |

## Artifacts

| Path | Required | Status | Notes |
|------|----------|--------|-------|
| backend/src/services/progressionService.ts | XpAwardResult, calculateXpAmount(), awardPlatformXp() | VERIFIED | All exported. Interface lines 127-137. calculateXpAmount lines 147-152. awardPlatformXp lines 165-224. withRetry, never-throw. |
| backend/src/services/sessionService.ts | xpResult on GameSession | VERIFIED | Line 64: xpResult?: XpAwardResult | null (Phase 53 comment). XpAwardResult imported from progressionService at line 12. |
| backend/src/routes/game.ts | XP call in Connected guard; xp in progression response | VERIFIED | Lines 409-412: calculateXpAmount called, key built, awardPlatformXp awaited, stored on session. Line 427: xp: session.xpResult ?? null. |
| backend/.env.example | Both env vars documented | VERIFIED | Lines 17-21 with comments distinguishing from EMPOWERED_ACCOUNTS_URL. |
| backend/src/env.ts | Startup validation | NOT PRESENT | Only dotenv.config(). No validation, no new var references. |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|--------|
| game.ts results route | awardPlatformXp() | import + call | WIRED | Line 4 imports; line 412 calls inside Connected guard |
| game.ts | idempotency key | string template | WIRED | Line 411: ctc-game-{sessionId}-{userId} -- matches spec |
| awardPlatformXp | EMPOWERED_ACCOUNTS_API_URL | process.env | WIRED | progressionService.ts line 170; call-time guard line 173 |
| awardPlatformXp | POST /api/xp/award | fetch | WIRED | progressionService.ts line 179 |
| awardPlatformXp | X-Service-Key header | request headers | WIRED | progressionService.ts line 183 |
| awardPlatformXp | source: civic_trivia_championship_score | body | WIRED | progressionService.ts line 188: hardcoded |
| session.xpResult | progression.xp field | assignment | WIRED | game.ts line 427: xp: session.xpResult ?? null |
| session.xpResult | saveSession() | mutation before save | WIRED | xpResult set line 412; saveSession() at line 442 |
| non-Connected path | no XP call | isConnected guard | WIRED | XP call strictly inside isConnected===true block; outside returns xp:null |

## Gaps

### Must-Have 5 -- Partial: Startup validation absent from env.ts

backend/src/env.ts contains only dotenv.config(). No startup validation for TRIVIA_SERVICE_KEY or EMPOWERED_ACCOUNTS_API_URL.

The research document discussed this tradeoff and recommended the call-time pattern over a startup crash, noting the app should still serve non-Connected players when XP vars are absent. The implementation followed that recommendation: awardPlatformXp() warns and returns {confirmed:false} when vars are absent.

Whether this satisfies validated at startup depends on interpretation:
- If validated means any runtime check that prevents misuse -- the call-time guard satisfies it
- If validated means checked at process startup before serving requests -- it does not

Operational impact: missing XP vars cause silent skips for Connected players with no crash or data corruption. An operator who misconfigures these vars will not see a startup error.

## Human Verification Required

### 1. Idempotency on repeated /results calls

**Test:** With XP env vars configured, complete a game as a Connected player. Call GET /results/:sessionId a second time.
**Expected:** Second call returns xp.isDuplicate: true with xp.confirmed: true. No double-award in Empowered Accounts ledger.
**Why human:** The progressionAwarded gate prevents the second API call on a warm in-memory session. Confirming the gate persists correctly after a Redis-backed session reload requires a live environment.

### 2. Full Connected player award flow (integration)

**Test:** Configure both XP env vars against a real or sandbox Empowered Accounts environment. Complete a game as a Connected player. Inspect GET /results/:sessionId response.
**Expected:** progression.xp is non-null with confirmed: true, amount between 50-200 reflecting actual score, level and totalXp present.
**Why human:** API contract verified structurally; correct header name, source string, and idempotency key format require a live call to confirm.

### 3. Non-Connected player receives null XP with no errors

**Test:** Complete a game as an Inform-tier user (authenticated, isConnected: false) and as anonymous. Inspect GET /results/:sessionId.
**Expected:** progression.xp is null for both. No XP-related errors in server logs.
**Why human:** Code path is correct structurally; confirming no log noise requires a live run.

## Notes on Implementation Choices

**Metadata body differs from research spec:** Research proposed sending score, correct_answers, total_questions, perfect_game in metadata. Implementation sends metadata: { game_id: idempotencyKey } only. No impact on correctness or idempotency but Empowered Accounts API receives no per-game performance context.

**progressionAwarded gate covers XP re-award on warm sessions:** The !session.progressionAwarded check at game.ts line 395 means a second /results call on the same in-memory session will not re-call awardPlatformXp -- the persisted session.xpResult is returned directly.

---

*Verified: 2026-03-05*
*Verifier: Claude (gsd-verifier)*