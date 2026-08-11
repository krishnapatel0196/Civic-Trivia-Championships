---
phase: 53-xp-backend-integration
plan: 01
subsystem: api
tags: [xp, progression, empowered-accounts, fetch, idempotency, connected-tier]

# Dependency graph
requires:
  - phase: 42-gem-progression-integration
    provides: "awardPlatformGems pattern, withRetry helper, GameSession.isConnected/isSuspended flags"
provides:
  - XpAwardResult interface exported from progressionService.ts
  - calculateXpAmount() — 50–200 XP based on correctAnswers/totalQuestions ratio
  - awardPlatformXp() — POST /api/xp/award with X-Service-Key, withRetry, never-throw
  - GameSession.xpResult field for session persistence
  - XP award wired into game.ts results route inside isConnected guard
  - EMPOWERED_ACCOUNTS_API_URL and TRIVIA_SERVICE_KEY documented in .env.example
affects:
  - phase: 54-xp-frontend-ui (consumes xp field from progression response)
  - Any phase reading progression response shape from GET /results/:sessionId

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service-key auth: POST /api/xp/award uses X-Service-Key header (not Bearer token)"
    - "Idempotency key pattern: ctc-game-{sessionId}-{userId} where sessionId is server-generated UUID"
    - "Never-throw pattern for external API calls: awardPlatformXp mirrors awardPlatformGems"
    - "Guard pattern: XP call strictly inside isConnected && !isSuspended guard"

key-files:
  created: []
  modified:
    - backend/src/services/progressionService.ts
    - backend/src/services/sessionService.ts
    - backend/src/routes/game.ts
    - backend/.env.example

key-decisions:
  - "EMPOWERED_ACCOUNTS_API_URL is a distinct var from EMPOWERED_ACCOUNTS_URL — separate for independent configuration"
  - "Idempotency key uses sessionId (server-generated UUID) rather than a separate gameId field"
  - "XP award placed BEFORE upsertPlayerStats but AFTER awardPlatformGems — ordering follows gems pattern"
  - "is_duplicate: true from API is treated as success — xpResult.confirmed=true, isDuplicate=true"

patterns-established:
  - "XP formula: BASE_XP=50, VARIABLE_XP=150, score ratio applied to variable portion (range 50–200)"
  - "External API calls use withRetry (3 attempts, exponential backoff) and never throw"
  - "session.xpResult persisted to session before saveSession() so re-fetching results is idempotent"

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 53 Plan 01: XP Backend Integration Summary

**Server-side XP award to Connected players via Empowered Accounts API: 50–200 XP per game using score-proportional formula, idempotent by sessionId, non-Connected players silently skipped**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T16:33:39Z
- **Completed:** 2026-03-05T16:37:19Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `XpAwardResult` interface, `calculateXpAmount()`, and `awardPlatformXp()` to progressionService.ts — mirrors the existing `awardPlatformGems` pattern with withRetry and never-throw contract
- Wired `awardPlatformXp()` into game.ts results route strictly inside the `isConnected && !isSuspended` guard; `session.xpResult` persisted before `saveSession()` for idempotency
- Documented `EMPOWERED_ACCOUNTS_API_URL` and `TRIVIA_SERVICE_KEY` in `.env.example` with clear comments explaining their relationship to the existing `EMPOWERED_ACCOUNTS_URL`

## Task Commits

Each task was committed atomically:

1. **Task 1: XpAwardResult interface, calculateXpAmount(), awardPlatformXp(), GameSession.xpResult** - `ef1416e` (feat)
2. **Task 2: Wire awardPlatformXp() into game.ts results route** - `d01f1e2` (feat)
3. **Task 3: Document env vars in .env.example** - `391f509` (chore)

**Plan metadata:** `[pending docs commit]` (docs: complete plan)

## Files Created/Modified

- `backend/src/services/progressionService.ts` — Added `XpAwardResult` interface, `calculateXpAmount()`, `awardPlatformXp()` (all exported)
- `backend/src/services/sessionService.ts` — Added `xpResult?: XpAwardResult | null` to `GameSession` interface; added import of `XpAwardResult`
- `backend/src/routes/game.ts` — Added `calculateXpAmount`/`awardPlatformXp` to import; wired XP award call inside `isConnected` guard; added `xp: session.xpResult ?? null` to progression response
- `backend/.env.example` — Added `EMPOWERED_ACCOUNTS_API_URL` and `TRIVIA_SERVICE_KEY` with descriptive comments

## Decisions Made

- **EMPOWERED_ACCOUNTS_API_URL is distinct from EMPOWERED_ACCOUNTS_URL**: kept separate so production can route XP awards to a different endpoint if needed. The existing `EMPOWERED_ACCOUNTS_URL` is used by `checkAccountContext()` for tier verification and must not be renamed.
- **Idempotency key = `ctc-game-{sessionId}-{userId}`**: sessionId is already a server-generated `randomUUID()`, so it serves as the game identifier for XP deduplication without requiring a separate field.
- **`is_duplicate: true` treated as success**: `xpResult.confirmed = true, isDuplicate = true` — correct behavior per XP API contract; no error, no retry.
- **XP award before upsertPlayerStats**: follows the same ordering as gems (award platform resource first, then record local stats).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration:**

Add these two environment variables to your backend `.env` (and Render/deployment environment):

```
# Empowered Accounts XP award API
EMPOWERED_ACCOUNTS_API_URL=https://your-empowered-accounts-api.com
TRIVIA_SERVICE_KEY=your-trivia-service-key-here
```

- `EMPOWERED_ACCOUNTS_API_URL` — base URL for the Empowered Accounts API (may be the same host as `EMPOWERED_ACCOUNTS_URL` or different)
- `TRIVIA_SERVICE_KEY` — service-to-service auth key provided by Empowered Accounts; never expose to browser clients

If either var is missing, `awardPlatformXp()` logs a warning and returns `{ confirmed: false, error: 'Missing env vars' }` — game result still succeeds.

## Next Phase Readiness

- Phase 54 (XP Frontend UI) can now consume the `xp` field from `GET /results/:sessionId` progression response
- The `xp` field is always present for Connected players (`xpResult` object) and `null` for Inform/anonymous
- `xpResult.isDuplicate` will be `true` on repeated fetches of the same session — UI should treat this as success
- Backend is ready for Phase 54 integration; no further backend changes needed for basic XP display

---
*Phase: 53-xp-backend-integration*
*Completed: 2026-03-05*
