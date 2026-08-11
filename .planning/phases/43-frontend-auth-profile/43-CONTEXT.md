# Phase 43: Frontend Auth & Profile - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewire frontend auth (login, signup, logout, token refresh) to call the Empowered Accounts API instead of local backend routes. Redesign the profile page to show trivia-specific stats plus accounts-sourced identity data (display name, tier badge, XP, gem balance), with identity management actions replaced by a link out to the accounts platform.

</domain>

<decisions>
## Implementation Decisions

### Auth UI presentation
- Keep existing dedicated pages (`/login`, `/signup`) — already exist and work well
- Keep existing visual design (dark slate gradient, card layout) — just rewire the API calls underneath
- Add return-to navigation: after login or signup, return the user to wherever they were, not always to `/`
- Rationale: future features may prompt users to connect their account from anywhere in the app

### Token storage & session behavior
- Hybrid storage: access token in Zustand memory (fast, not persisted), refresh token in localStorage (survives page reloads)
- The Empowered Accounts API returns both `access_token` and `refresh_token` in the login response body — no HTTP-only cookie
- Silent background token refresh when access token expires — implementation details at Claude's discretion
- Auth initializer behavior on startup (loading UX, invisible check for returning users) — Claude's discretion

### Profile page layout & hierarchy
- Profile page is **Connected+ only** — Inform-tier and unauthenticated users are redirected to the signup page (which has a login link)
- Hero section shows: display name with tier badge inline, email, XP (from `connected_profile.xp`), gem balance (from accounts API), avatar
- Tier badge sits directly next to the display name as a small inline label
- Identity management (name edit, avatar upload, password change) is **removed** — replaced by a single "Manage your Empowered account →" button in the hero section linking to the accounts platform
- Trivia stats section (games played, best score, overall accuracy) stays as-is — trivia-specific data from trivia backend
- Extended Time setting stays as-is — trivia-specific preference

### Loading & error states
- Profile page: single loading state — wait for both the trivia backend and accounts API before rendering
- If accounts API fails: show trivia stats with a "couldn't load account info" warning in place of identity data
- If trivia stats fail: show accounts identity data with a "couldn't load stats" warning in the stats section
- Auth page errors (wrong password, suspended account, etc.): keep existing red banner pattern above the form

### Claude's Discretion
- Silent token refresh implementation (when to trigger, how to queue requests during refresh)
- Auth initializer startup behavior optimization (faster check for returning users)
- Exact wording and visual styling of "Manage your Empowered account →" CTA
- Exact wording and visual styling of partial-load warning banners on profile page
- Handling edge cases: what if refresh token in localStorage is expired/invalid on startup

</decisions>

<specifics>
## Specific Ideas

- Return-to navigation is important for future UX: as more features require Connected tier, users will be prompted to connect from various places in the app — they should always land back where they were
- The accounts API `GET /api/account/me` returns `display_name`, `tier`, `account_standing`, `connected_profile.xp`, `connected_profile.gem_balance` — all needed for the profile hero in one call
- Empowered Accounts login response shape: `{ access_token, refresh_token, expires_in: 3600, user: { id, email, tier } }` — note field name is `access_token` (not `accessToken` like current local API)
- No `/api/auth/refresh` route is documented in the integration guide — researcher should verify the actual refresh endpoint against the accounts API

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 43-frontend-auth-profile*
*Context gathered: 2026-02-28*
