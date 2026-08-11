---
phase: 43-frontend-auth-profile
plan: "01"
subsystem: auth
tags: [zustand, vite, typescript, jwt, localStorage, supabase, react]

# Dependency graph
requires:
  - phase: 42-gem-progression-integration
    provides: Game routes with accountContext check and gem award; Phase 42 backend complete
  - phase: 41-backend-auth-migration
    provides: jwtVerify middleware using SUPABASE_JWT_SECRET; backend now validates Bearer tokens
provides:
  - AccountsUser type with string UUID id and tier field replacing integer User
  - Tier type alias ('inform' | 'connected' | 'empowered')
  - AuthResponse with snake_case fields (access_token, refresh_token, expires_in)
  - accountsApi.ts — dedicated fetch wrapper for Empowered Accounts API (no credentials:include)
  - accountsApiFetch<T> — generic fetch wrapper for accounts API routes
  - exchangeRefreshToken() — Supabase native /auth/v1/token refresh (localStorage-based)
  - fetchAccountProfile() — GET /api/account/me with Bearer token
  - authService.ts rewritten to use accountsApiFetch for login/signup/logout
  - authStore with tier and displayName fields; clearAuth removes ev_refresh_token
  - api.ts auto-attaches Bearer token and refreshes via exchangeRefreshToken on 401
  - AuthInitializer checks localStorage first; skips network call when no refresh token
  - .env.production has VITE_EMPOWERED_ACCOUNTS_URL
affects:
  - 43-02 (Login/Signup pages: fix access_token field name, remove name field, add return-to)
  - 43-03 (Profile page rewrite: dual-API fetch, tier badge, remove identity management)
  - 43-04 (Header.tsx, App.tsx: fix user.name and user.isAdmin references)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hybrid token storage: access token in Zustand memory, refresh token in localStorage as ev_refresh_token"
    - "Dual-API architecture: accountsApi.ts for Empowered Accounts, api.ts for trivia backend"
    - "Silent refresh: 401 interceptor in api.ts calls exchangeRefreshToken() (localStorage-based, not cookie)"
    - "Startup optimization: AuthInitializer skips network call when no ev_refresh_token in localStorage"
    - "accountsApiFetch never uses credentials:include — Bearer token only for cross-origin accounts API"

key-files:
  created:
    - frontend/src/services/accountsApi.ts
  modified:
    - frontend/src/types/auth.ts
    - frontend/src/services/authService.ts
    - frontend/src/store/authStore.ts
    - frontend/src/services/api.ts
    - frontend/src/components/AuthInitializer.tsx
    - frontend/.env.production

key-decisions:
  - "exchangeRefreshToken uses Supabase native /auth/v1/token?grant_type=refresh_token (not undocumented /api/auth/refresh)"
  - "accountsApiFetch is a standalone function, not importing from api.ts — avoids VITE_API_URL prefix contamination"
  - "AuthInitializer calls clearAuth + setLoading(false) immediately when no ev_refresh_token — no spinner for new visitors"
  - "api.ts auto-attaches Bearer token from store before every trivia backend request"
  - "SignupData.name removed — accounts API does not accept name at signup (Connected onboarding sets display_name)"

patterns-established:
  - "Pattern: accountsApiFetch<T>(path, options) — prepends ACCOUNTS_API_URL, no credentials:include, throws parsed error body"
  - "Pattern: exchangeRefreshToken() — reads localStorage, calls Supabase /auth/v1/token, rotates token, returns null on failure"
  - "Pattern: authStore.setAuth(token, user, extras?) — extras allows tier/displayName from login response"
  - "Pattern: authStore.clearAuth() — removes ev_refresh_token from localStorage alongside state reset"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 43 Plan 01: Auth Infrastructure Summary

**Rewired frontend auth infrastructure to Empowered Accounts API using hybrid token storage (access token in Zustand memory, refresh token in localStorage as ev_refresh_token) with Supabase native token refresh**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T04:33:48Z
- **Completed:** 2026-03-01T04:37:30Z
- **Tasks:** 2
- **Files modified:** 7 (6 modified, 1 created)

## Accomplishments
- Created dedicated accountsApi.ts fetch wrapper for Empowered Accounts API — zero credentials:include, Bearer token auth only
- Replaced cookie-based refreshToken() in api.ts with localStorage-based exchangeRefreshToken() using Supabase /auth/v1/token
- AuthInitializer now skips all network calls for unauthenticated users (no spinner, no latency on first visit)
- Auth store now carries tier and displayName alongside access token for UI consumption
- AccountsUser type replaces integer-id User type — UUID strings throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Update auth types, create accountsApi.ts, rewrite authService.ts** - `8850836` (feat)
2. **Task 2: Update authStore, rewrite api.ts interceptor, rewrite AuthInitializer** - `6ea841c` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified
- `frontend/src/types/auth.ts` — Replaced User with AccountsUser (string id, tier); snake_case AuthResponse; SignupData without name; Tier type alias; AccountProfile interface
- `frontend/src/services/accountsApi.ts` — NEW: accountsApiFetch wrapper, exchangeRefreshToken (Supabase native), fetchAccountProfile
- `frontend/src/services/authService.ts` — Rewritten to use accountsApiFetch for login/signup/logout; removed refresh method
- `frontend/src/store/authStore.ts` — Added tier and displayName fields; updated setAuth signature; clearAuth removes ev_refresh_token; removed setUserName; added setDisplayName
- `frontend/src/services/api.ts` — Removed credentials:include and cookie-based refreshToken(); added auto-Bearer-token attachment; 401 handler uses exchangeRefreshToken
- `frontend/src/components/AuthInitializer.tsx` — Checks localStorage for ev_refresh_token first; no network call when absent; uses exchangeRefreshToken from accountsApi
- `frontend/.env.production` — Added VITE_EMPOWERED_ACCOUNTS_URL=https://empowered-accounts.onrender.com

## Decisions Made

1. **Token refresh endpoint: Supabase native vs. undocumented /api/auth/refresh**
   - The integration guide does not document a /api/auth/refresh route on the accounts Express API
   - Decision: Use Supabase native `/auth/v1/token?grant_type=refresh_token` with apikey header
   - This works because the accounts API issues standard Supabase JWTs from the same project
   - The VITE_SUPABASE_URL env var is optional — falls back to ACCOUNTS_API_URL if not set (works if accounts API proxies Supabase auth at the same base URL)

2. **accountsApiFetch as standalone function, not extending apiRequest**
   - apiRequest always prepends VITE_API_URL (trivia backend)
   - accountsApiFetch prepends VITE_EMPOWERED_ACCOUNTS_URL
   - Keeping them fully separate avoids per-call URL overrides and CORS header leakage

3. **AuthInitializer immediately resolves for unauthenticated users**
   - Old behavior: always called /auth/refresh on startup (network roundtrip blocking render)
   - New behavior: localStorage check is synchronous; if no ev_refresh_token, calls clearAuth + setLoading(false) immediately
   - Result: unauthenticated/new users never see the loading spinner

4. **api.ts auto-attaches Bearer token for all trivia backend requests**
   - Old behavior: callers had to manually add Authorization header
   - New behavior: apiRequest reads from authStore on each call and attaches header automatically
   - Callers passing Authorization headers in options still work (their header overrides the default)

## Deviations from Plan

None — plan executed exactly as written.

The plan noted token refresh endpoint uncertainty (LOW confidence). This was resolved at implementation time by using Supabase native /auth/v1/token, which is the correct approach per the integration guide's note that accounts API issues standard Supabase JWTs.

## Issues Encountered

None — TypeScript errors are all in pages that will be fixed in subsequent plans (Login.tsx, Signup.tsx, Profile.tsx, Header.tsx, App.tsx, Admin pages). All infrastructure files (types, services, store, AuthInitializer) compile cleanly.

## User Setup Required

**Environment variable must be added to production deployment:**
- `VITE_EMPOWERED_ACCOUNTS_URL` — set to the Empowered Accounts API production URL
- Already added to `frontend/.env.production` as `https://empowered-accounts.onrender.com`
- Verify this URL matches the actual accounts API deployment before releasing

**Optional (for Supabase native token refresh):**
- `VITE_SUPABASE_URL` — Supabase project URL (enables direct Supabase Auth endpoint)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (required as apikey header for Supabase Auth)
- If these are not set, exchangeRefreshToken falls back to using ACCOUNTS_API_URL as the Supabase base URL

## Next Phase Readiness

**Ready for Plan 02:**
- All infrastructure is in place: types, accountsApi, authService, authStore, api.ts interceptor, AuthInitializer
- Plan 02 should fix Login.tsx (access_token field, return-to navigation), Signup.tsx (remove name field, return-to navigation)
- Remaining TypeScript errors: 10 errors in pages/layouts — all in files not yet updated for new types

**Blockers/Concerns:**
- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not yet confirmed as frontend env vars — if absent at runtime, exchangeRefreshToken uses ACCOUNTS_API_URL as fallback which may or may not proxy Supabase auth
- Login.tsx still reads response.accessToken (camelCase) — will throw undefined after next login until Plan 02 fixes it
- Profile.tsx still calls authStore.setUserName — Plan 02/03 must remove this call

---
*Phase: 43-frontend-auth-profile*
*Completed: 2026-03-01*
