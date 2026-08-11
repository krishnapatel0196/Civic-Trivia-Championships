---
phase: 55-xp-history-panel
plan: 03
subsystem: ui
tags: [react, typescript, tailwind, profile, xp, pagination]

# Dependency graph
requires:
  - phase: 55-01
    provides: awardPlatformXp() with enriched metadata (score, correctAnswers, collectionSlug)
  - phase: 55-02
    provides: GET /api/users/profile/xp/history paginated endpoint

provides:
  - Two-tab Profile page (Overview / XP History) for Connected/Empowered tier
  - fetchXpHistory(page) service function with XpHistoryEntry and XpHistoryResponse types
  - History panel with paginated rows, date formatting, loading/empty/error states

affects:
  - Any future profile page work (tab structure must be preserved)
  - v2.0 phase planning referencing the completed XP history feature set

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tier-gated UI: tab chrome only rendered when tierResolved && isConnected — non-Connected path untouched
    - Relative/absolute date formatting without a library (module-level formatDate())
    - Paginated useEffect pattern: separate effects for tab-switch load and page-change load

key-files:
  created: []
  modified:
    - frontend/src/services/profileService.ts
    - frontend/src/pages/Profile.tsx

key-decisions:
  - "Tab bar renders only after tierResolved && isConnected — avoids flash of tab chrome before tier fetch resolves"
  - "heroSection always visible to Connected players regardless of active tab — XP/gem totals stay anchored at top"
  - "formatDate() is module-level (not component-level) — clean separation, no library dependency"
  - "Non-Connected players rendered via early return before tab logic — zero structural risk to existing layout"
  - "Deviation: Plan 02 backend was fixed post-checkpoint to bypass Empowered Accounts API proxy; frontend remains unchanged"

patterns-established:
  - "Tier-gated tab bar: !loading && tierResolved && isConnected guard prevents tab chrome flash"
  - "History fetch pattern: one useEffect for [activeTab, historyPage, isConnected], separate useEffect resets page on tab switch"

# Metrics
duration: ~113min (including checkpoint wait and deviation fix)
completed: 2026-03-08
---

# Phase 55 Plan 03: XP History Panel (Frontend) Summary

**Two-tab Profile page with paginated XP transaction history for Connected/Empowered players; non-Connected layout unchanged**

## Performance

- **Duration:** ~113 min total (auto tasks: ~3 min; checkpoint wait + human verification + deviation fix: ~110 min)
- **Started:** 2026-03-08T18:27:11Z
- **Completed:** 2026-03-08T20:20:41Z (deviation fix commit)
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 2

## Accomplishments

- Added `fetchXpHistory(page)`, `XpHistoryEntry`, and `XpHistoryResponse` to `profileService.ts` — clean service layer with auto-attached Bearer token via `apiRequest`
- Rebuilt `Profile.tsx` with two-tab layout (Overview / XP History); Connected/Empowered tier gets tab chrome, non-Connected sees the unchanged flat layout via early return
- XP History panel ships with all five states: loading skeleton (5 animate-pulse rows), error (amber banner), empty (friendly message + Play a Game button), paginated list rows, and pagination controls
- Live verification confirmed: history panel renders correctly on the live site at https://ctc.empowered.vote/profile

## Task Commits

1. **Task 1: Add fetchXpHistory() to profileService.ts** — `2a15f84` (feat)
2. **Task 2: Rebuild Profile.tsx with two-tab layout and XP History panel** — `6f72761` (feat)

**Plan metadata / STATE update:** `b1e8f24` (docs)

**Post-checkpoint deviation fix (backend, Plan 02):** `ad2108f` (fix) — see Deviations section

## Files Created/Modified

- `frontend/src/services/profileService.ts` — Added `XpHistoryEntry`, `XpHistoryResponse` interfaces and `fetchXpHistory(page)` function
- `frontend/src/pages/Profile.tsx` — Rebuilt with two-tab layout; added `formatDate()`, `XpBadge`, tab state, history fetch effects, history panel with all UI states
- `backend/src/routes/profile.ts` — Deviation fix: switched from Accounts API proxy to `get_ctc_xp_history()` Supabase RPC call (see Deviations)

## Decisions Made

- Tab bar renders only when `tierResolved && isConnected` — prevents a flash of tab chrome before the account fetch resolves on first load
- Hero section (avatar, display name, XP total, gem balance) stays visible regardless of active tab — anchors identity context while browsing history
- Non-Connected players rendered via early return before any tab state — zero structural impact on their layout path
- `formatDate()` is a module-level function, not inlined — keeps JSX readable and avoids library dependency for a simple relative/absolute date rule

## Deviations from Plan

### External Fix Required (Post-Checkpoint)

**[Backend deviation — Plan 02 route] Bypassed Accounts API proxy; switched to Supabase SECURITY DEFINER RPC**

- **Found during:** Human verification on live site (checkpoint step)
- **Issue:** `GET /api/users/profile/xp/history` was proxying to `EMPOWERED_ACCOUNTS_URL/api/xp/me/history`, but the Empowered Accounts API's `connect` schema was not exposed via PostgREST. The live endpoint was returning errors.
- **Fix:** Replaced the HTTP proxy in `backend/src/routes/profile.ts` with a direct Supabase RPC call to `get_ctc_xp_history()` — a `SECURITY DEFINER` function with full access to `connect.xp_transactions`. Response shape was preserved; frontend required no changes.
- **Files modified:** `backend/src/routes/profile.ts`
- **Committed in:** `ad2108f` (fix(55): query xp history via SECURITY DEFINER rpc instead of accounts API proxy)

---

**Total deviations:** 1 (external fix to Plan 02 backend; Plan 03 frontend executed exactly as written)
**Impact on plan:** Fix was necessary for live correctness. Frontend contract unchanged — same response shape, same endpoint path. No scope creep.

## Issues Encountered

None during frontend execution. The backend proxy issue was discovered during checkpoint verification and resolved post-approval via the `ad2108f` fix commit.

## User Setup Required

None — no new environment variables or external service configuration required.

## Next Phase Readiness

- Phase 55 is fully complete: XP award metadata enrichment (01), history endpoint (02), and history panel (03) all shipped and verified live
- The `get_ctc_xp_history()` Supabase RPC approach is now the established pattern for accessing `connect` schema data from the CTC backend — document this if future plans need similar cross-schema queries
- v2.0 XP integration is complete; the profile page is now the canonical place for players to review their XP earning history

---
*Phase: 55-xp-history-panel*
*Completed: 2026-03-08*
