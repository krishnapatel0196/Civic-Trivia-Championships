# Phase 66: Gem Award Migration - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the deprecated `connect.credit_gems` Supabase RPC call in `awardPlatformGems()` with `POST /api/gems/award` on the accounts API, secured with `TRIVIA_GEMS_KEY`. Code-only migration — no UI changes, no new capability. The DB-level RPC function may remain as unused infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Error handling
- Silent fail — mirror `awardPlatformXp` never-throw pattern exactly
- Wrap the API call in try/catch, log a warning on failure, return without throwing
- No retry — game session completes normally even if gem award fails
- A failed gem award is never surfaced to the player

### Key validation
- Validate `TRIVIA_GEMS_KEY` at startup with a warning if missing — mirror `TRIVIA_SERVICE_KEY` pattern
- Warning-only: server boots normally without the key; gem awards will silently fail at runtime
- Hard startup failure is explicitly NOT wanted (would cause redeploy loop on Render for a misconfigured key)

### Removal scope
- Code-only removal: delete the `connect.credit_gems` RPC call from TypeScript and any wrappers/type references
- Do NOT drop the Supabase DB function or revoke DB permissions — leave it as unused, no migration needed
- Future DB cleanup is optional and can happen in a maintenance pass if desired

### Production verification
- After deploy: manual play test — complete a game and confirm gems incremented in the accounts gem ledger
- Watch Render logs for the first few gem award calls to confirm no errors
- No diagnostic script needed

### Claude's Discretion
- Exact log message wording for the warning and error cases
- Where in the startup validation file `TRIVIA_GEMS_KEY` check is added (alongside `TRIVIA_SERVICE_KEY` is natural)
- HTTP client details (timeout, headers) — follow existing `awardPlatformXp` implementation exactly

</decisions>

<specifics>
## Specific Ideas

- The roadmap explicitly calls out "mirrors awardPlatformXp never-throw pattern" — the implementation should be shaped directly after `awardPlatformXp()`, not designed independently
- `TRIVIA_GEMS_KEY` scope is `["yellow"]` — configured on the accounts side by Chris (see ONBOARDING-CTC.md)
- Accounts API base URL: `EMPOWERED_ACCOUNTS_API_URL` (same env var used by XP integration)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 66-gem-award-migration*
*Context gathered: 2026-03-15*
