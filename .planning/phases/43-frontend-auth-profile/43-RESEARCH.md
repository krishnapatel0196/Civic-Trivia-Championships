# Phase 43: Frontend Auth & Profile — Research

**Researched:** 2026-02-28
**Domain:** React/Zustand frontend auth rewire + profile page redesign
**Confidence:** HIGH

---

## Summary

Phase 43 rewires the frontend auth layer to call the Empowered Accounts API (login, signup, logout, token refresh) instead of the local backend's `/auth/*` routes. It also redesigns the Profile page to show identity data sourced from the accounts API (display name, tier badge, XP, gem balance) alongside existing trivia stats, and removes all local identity management (name edit, avatar upload, password change).

The existing codebase is already well-structured for this work. The auth store (`authStore.ts`), auth service (`authService.ts`), and `AuthInitializer.tsx` are clean and straightforward — they just point at the wrong base URL and carry a stale `AuthResponse` shape that expects `accessToken` (camelCase) instead of the accounts API's `access_token` (snake_case). The api.ts interceptor has a refresh mechanism that uses cookies and `/auth/refresh` — both of which don't apply to the accounts API. This interceptor is the largest surgery area in Phase 43.

The key architectural decision is hybrid token storage: access token in Zustand memory (in-session only), refresh token in `localStorage` (survives page reloads). The current code uses cookie-based sessions — that entire mechanism is replaced. The Profile page currently has ~200 lines of identity-management state (name editing, password changing, avatar uploading) that are removed and replaced with a single external link.

**Primary recommendation:** Build a dedicated `accountsApi.ts` module for all Empowered Accounts calls, update `authStore.ts` to add `refreshToken` (not persisted — stored in `localStorage` directly), replace `api.ts`'s cookie-based refresh with localStorage-based refresh, and rewrite `AuthInitializer.tsx` to check for a stored refresh token instead of calling `/auth/refresh`.

---

## Standard Stack

No new libraries are needed. The full implementation uses what is already installed.

### Core (already installed)
| Library | Version | Purpose | Role in Phase 43 |
|---------|---------|---------|-----------------|
| `zustand` | ^4.4.7 | State management | Auth store holds access token in memory |
| `react-router-dom` | ^6.21.1 | Routing + navigation | `useLocation`, `useNavigate`, `useSearchParams` for return-to |
| React 18 | ^18.2.0 | UI framework | Profile page rewrite |
| Vite | ^5.0.11 | Build/env | `VITE_EMPOWERED_ACCOUNTS_URL` env var |

### No New Packages Required
All auth patterns (fetch, localStorage, Zustand) are native or already present. Do not add:
- `axios` — not in project, not needed
- `@supabase/supabase-js` — frontend does not call Supabase directly
- `zustand/middleware` persist — not appropriate; refresh token stored in raw localStorage with direct reads/writes

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Structure for Phase 43 Changes

```
frontend/src/
├── services/
│   ├── api.ts                    # MODIFY: replace cookie refresh with localStorage refresh
│   ├── authService.ts            # MODIFY: point at accounts API, fix response shape
│   ├── accountsApi.ts            # NEW: dedicated client for Empowered Accounts API calls
│   └── profileService.ts         # MODIFY: add fetchAccountProfile(), remove name/avatar/password fns
├── store/
│   └── authStore.ts              # MODIFY: add tier, displayName; update setAuth signature
├── types/
│   └── auth.ts                   # MODIFY: add AccountsUser shape, tier type, AuthResponse fix
├── components/
│   ├── AuthInitializer.tsx       # MODIFY: check localStorage refresh token instead of cookie
│   └── ProtectedRoute.tsx        # MODIFY: add Connected-tier check for profile redirect
├── pages/
│   ├── Login.tsx                 # MODIFY: add return-to navigation, fix response field name
│   ├── Signup.tsx                # MODIFY: add return-to navigation; remove name field
│   └── Profile.tsx               # REWRITE: remove identity mgmt, add accounts data
└── .env.production               # MODIFY: add VITE_EMPOWERED_ACCOUNTS_URL
```

### Pattern 1: Dual-API Architecture (accounts vs. trivia backend)

The frontend now calls TWO APIs:
- **Trivia backend** (`VITE_API_URL`): game data, trivia stats, Extended Time preference — existing `apiRequest()` in `api.ts`
- **Empowered Accounts API** (`VITE_EMPOWERED_ACCOUNTS_URL`): login, signup, logout, token refresh, `GET /api/account/me`

These must NOT share a base URL. The solution is a dedicated `accountsApi.ts` with its own `fetch` wrapper.

```typescript
// frontend/src/services/accountsApi.ts
// Source: empowered-accounts-integration-guide.md (project file)
export const ACCOUNTS_URL = import.meta.env.VITE_EMPOWERED_ACCOUNTS_URL;

export async function accountsRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${ACCOUNTS_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }
  return response.json();
}
```

**Why separate:** The accounts API does not use `credentials: 'include'` (no cookies). The trivia backend `api.ts` uses cookies for legacy compatibility. Mixing them would require per-call overrides everywhere.

### Pattern 2: Hybrid Token Storage

Access token in Zustand (memory only). Refresh token in `localStorage` (raw, not via Zustand persist middleware).

```typescript
// Storing refresh token — called after login
localStorage.setItem('ev_refresh_token', refreshToken);

// Reading refresh token — called by AuthInitializer on startup
const storedRefresh = localStorage.getItem('ev_refresh_token');

// Clearing — called on logout or auth failure
localStorage.removeItem('ev_refresh_token');
```

**Key:** Use a namespaced key (`ev_refresh_token`) to avoid collisions with the collection picker's existing `localStorage` usage. The `useCollections.ts` hook already uses `localStorage` for `STORAGE_KEY` (collection preference), so there is precedent and no conflict risk.

### Pattern 3: AuthInitializer Startup Check

The current `AuthInitializer.tsx` calls `/auth/refresh` unconditionally on startup (blocking render). The new pattern checks `localStorage` for a refresh token first — if none, immediately resolves as unauthenticated (no network call).

```typescript
// frontend/src/components/AuthInitializer.tsx
// Source: codebase inspection + accounts integration guide
useEffect(() => {
  const initializeAuth = async () => {
    const storedRefresh = localStorage.getItem('ev_refresh_token');

    if (!storedRefresh) {
      // No returning user — resolve immediately, no network call
      clearAuth();
      return;
    }

    try {
      // Exchange refresh token for new access token
      const data = await exchangeRefreshToken(storedRefresh);
      // data shape: { access_token, refresh_token, expires_in, user }
      localStorage.setItem('ev_refresh_token', data.refresh_token);
      setAuth(data.access_token, data.user);
    } catch {
      // Refresh token expired or invalid — clean up
      localStorage.removeItem('ev_refresh_token');
      clearAuth();
    }
  };

  initializeAuth();
}, []);
```

**Optimization:** When `localStorage.getItem('ev_refresh_token')` is null, `setLoading(false)` is called synchronously — the UI does not show the spinner at all for fresh visitors. Only returning users (who have a stored refresh token) see the loading state.

### Pattern 4: Interceptor-Based Silent Refresh in api.ts

The existing `api.ts` has a refresh interceptor that triggers on 401. The pattern is sound but points at the wrong endpoint and reads from the wrong storage. Replace:

```typescript
// BEFORE (current api.ts) — cookie-based, local backend
async function refreshToken(): Promise<string | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',  // reads from cookie
    ...
  });
  const data = await response.json();
  useAuthStore.getState().setAuth(data.accessToken, data.user); // camelCase
}

// AFTER — localStorage-based, accounts API
async function refreshToken(): Promise<string | null> {
  const storedRefresh = localStorage.getItem('ev_refresh_token');
  if (!storedRefresh) return null;

  const response = await fetch(`${ACCOUNTS_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: storedRefresh }),
  });

  if (!response.ok) {
    localStorage.removeItem('ev_refresh_token');
    return null;
  }

  const data = await response.json();
  // data.access_token (snake_case from accounts API)
  localStorage.setItem('ev_refresh_token', data.refresh_token);
  useAuthStore.getState().setAuth(data.access_token, mapAccountsUser(data.user));
  return data.access_token;
}
```

The existing `isRefreshing` boolean guard against concurrent refresh loops is correct — keep it. The `requestQueue` pattern (queue requests during refresh, replay after) is at Claude's discretion; the existing single-retry approach is acceptable for this app.

### Pattern 5: Return-To Navigation

React Router v6 provides `useLocation` and `useNavigate`. The return-to URL is passed as a search param `?from=<encoded path>` set by the caller (e.g., `ProtectedRoute` redirecting to login), and consumed by `Login` and `Signup` after successful auth.

```typescript
// In ProtectedRoute.tsx — redirect with from param
// Source: react-router-dom v6, useLocation in AdminLayout.tsx (same project)
const location = useLocation();
return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;

// In Login.tsx — read and navigate after auth
const [searchParams] = useSearchParams();
const from = searchParams.get('from') || '/';
// after setAuth():
navigate(from, { replace: true });
```

**Security note:** Validate that `from` starts with `/` (internal path only) before navigating. Never redirect to an external URL from the `from` param.

### Pattern 6: AuthStore Shape Update

The `User` type currently has `id: number` (legacy integer ID from the old PostgreSQL `users` table). Accounts API users have UUID string IDs. The store needs an updated type:

```typescript
// types/auth.ts — updated
export interface AccountsUser {
  id: string;           // UUID from accounts API
  email: string;
  tier: 'inform' | 'connected' | 'empowered';
  displayName?: string; // from connected_profile.display_name (Connected+ only)
  isAdmin?: boolean;    // checked separately if needed
}

export interface AuthResponse {
  access_token: string;    // accounts API uses snake_case
  refresh_token: string;
  expires_in: number;      // 3600 seconds
  user: {
    id: string;
    email: string;
    tier: 'inform' | 'connected' | 'empowered';
  };
}
```

The `User` interface with `id: number` should be kept for backward compatibility during the transition (legacy integer-ID paths may still exist in admin routes). Introduce `AccountsUser` as a parallel type, and update `authStore.ts` to hold either.

### Pattern 7: Profile Page Data Sources

The redesigned Profile page makes TWO parallel API calls and renders when both complete (per CONTEXT decision: single loading state, then partial-load warnings if either fails):

```typescript
// Profile.tsx — parallel fetch pattern
const [triviaStats, setTriviaStats] = useState<ProfileStats | null>(null);
const [accountData, setAccountData] = useState<AccountProfile | null>(null);
const [triviaError, setTriviaError] = useState<string | null>(null);
const [accountError, setAccountError] = useState<string | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadAll = async () => {
    const [triviaResult, accountResult] = await Promise.allSettled([
      fetchProfile(),          // trivia backend: games played, accuracy, etc.
      fetchAccountProfile(),   // accounts API: GET /api/account/me
    ]);

    if (triviaResult.status === 'fulfilled') {
      setTriviaStats(triviaResult.value);
    } else {
      setTriviaError("Couldn't load your trivia stats.");
    }

    if (accountResult.status === 'fulfilled') {
      setAccountData(accountResult.value);
    } else {
      setAccountError("Couldn't load your account info.");
    }

    setLoading(false);
  };

  loadAll();
}, []);
```

**`Promise.allSettled` is the correct primitive here** — it never rejects even if one call fails, which is exactly what the CONTEXT partial-load behavior requires.

### Pattern 8: Tier Badge Inline with Display Name

Per CONTEXT: tier badge sits directly next to display name as a small inline label. Tailwind implementation pattern:

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-3xl font-bold text-white">{accountData.display_name}</h1>
  <TierBadge tier={accountData.tier} />
</div>
```

```tsx
// TierBadge component (new, small)
function TierBadge({ tier }: { tier: 'inform' | 'connected' | 'empowered' }) {
  const styles = {
    inform: 'bg-slate-700 text-slate-300',
    connected: 'bg-teal-900/50 text-teal-400 border border-teal-600/40',
    empowered: 'bg-purple-900/50 text-purple-400 border border-purple-600/40',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[tier]}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}
```

### Pattern 9: Profile Page Access Guard

Per CONTEXT: Profile page is Connected+ only. Unauthenticated users and Inform-tier users redirect to `/signup`. Two options:

**Option A (recommended):** Check tier inside Profile.tsx itself, since `GET /api/account/me` is already called there and returns tier. If tier is `'inform'` after load, redirect to `/signup`.

**Option B:** Add tier check to `ProtectedRoute` or create a `ConnectedRoute` wrapper.

Option A is simpler and avoids an extra route wrapper. The tier check happens naturally as part of the `fetchAccountProfile()` call — no extra round trip.

```typescript
// In Profile.tsx, after accountResult resolves:
if (accountResult.status === 'fulfilled') {
  const profile = accountResult.value;
  if (profile.tier === 'inform') {
    navigate('/signup', { replace: true });
    return;
  }
  setAccountData(profile);
}
```

### Anti-Patterns to Avoid

- **Do not call `credentials: 'include'` against the accounts API** — it's a different origin; cookies don't apply and this header causes CORS issues with cross-origin requests.
- **Do not store the access token in localStorage** — intentional design decision per CONTEXT. Memory-only for access tokens.
- **Do not use Zustand `persist` middleware for the refresh token** — it serializes the entire store. Direct `localStorage.setItem/getItem` is cleaner and keeps the concern isolated.
- **Do not call both APIs from `AuthInitializer`** — `AuthInitializer` only restores the session token. The `GET /api/account/me` call happens lazily on Profile page load.
- **Do not share the `apiRequest` function from `api.ts` for accounts API calls** — `api.ts` always prepends `VITE_API_URL` (trivia backend). The accounts URL is different.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request queuing during token refresh | Custom observable / event emitter | Keep existing `isRefreshing` boolean + single retry | Simpler, sufficient for this app's concurrency |
| JWT expiry detection | Decode JWT client-side, set timer | Rely on 401 response to trigger refresh | Server is authoritative; client-side decode adds complexity |
| Token persistence across tabs | Zustand `persist` + `BroadcastChannel` | Raw `localStorage` read/write | Out of scope; single-tab behavior is sufficient |
| Tier badge color system | Separate theming config | Inline Tailwind conditionals in `TierBadge` | Three tiers only; no abstraction needed |

**Key insight:** The existing `isRefreshing` guard in `api.ts` is the right shape for this project. Don't complicate it.

---

## Critical Finding: Token Refresh Endpoint

**The integration guide does NOT document a `/api/auth/refresh` endpoint.** The route table in Section 13 of the integration guide lists only:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/complete-onboarding`

There is no `/api/auth/refresh` in the documented API surface.

**The CONTEXT.md notes this explicitly:** "No `/api/auth/refresh` route is documented in the integration guide — researcher should verify the actual refresh endpoint against the accounts API."

**What we know:** The accounts API returns a `refresh_token` in the login response. The accounts backend is Express 4.x connecting to Supabase. Supabase Auth provides token refresh natively.

**Likely endpoint shapes (not confirmed — LOW confidence):**
1. `POST /api/auth/refresh` with body `{ refresh_token: "..." }` — most common Express pattern
2. Supabase native: `POST /auth/v1/token?grant_type=refresh_token` with body `{ refresh_token }` — bypasses the accounts Express layer entirely and calls Supabase Auth directly

**Recommendation for planning:** Treat this as an open question. The planner should add a task to confirm the refresh endpoint before implementing the refresh logic. The fallback is calling Supabase Auth's token endpoint directly since the JWT is a standard Supabase JWT.

---

## Common Pitfalls

### Pitfall 1: snake_case vs camelCase Response Fields
**What goes wrong:** The Empowered Accounts API returns `access_token` and `refresh_token` (snake_case). The existing `authService.ts` and `AuthResponse` type expect `accessToken` (camelCase) because the legacy local backend uses camelCase. Calling `response.accessToken` returns `undefined` — auth silently fails, store is never populated.
**Why it happens:** The types were written for the old API. TypeScript won't catch this if the type says `accessToken: string` — it just assigns `undefined` and the type lies.
**How to avoid:** Update `AuthResponse` type to match the accounts API exactly (`access_token`, `refresh_token`). Do this before writing any auth calls.
**Warning signs:** User appears logged out immediately after login; `useAuthStore.getState().accessToken` is null after successful login response.

### Pitfall 2: Signup Field Mismatch — name Field
**What goes wrong:** Current `Signup.tsx` sends `{ name, email, password }` to the local backend. The accounts API `POST /api/auth/signup` accepts only `{ email, password }` — the `name` field is not accepted at signup. Display name is set during the Connected tier onboarding flow, not at account creation.
**Why it happens:** The local backend had a `name` field on the `users` table. The accounts API does not.
**How to avoid:** Remove the `name` field from the signup form entirely. Remove `name` from `SignupData` type.
**Warning signs:** Signup returns validation errors or the field is silently ignored.

### Pitfall 3: Profile Page Redirect Logic (Inform users)
**What goes wrong:** If the tier check happens before `fetchAccountProfile()` resolves (e.g., checking authStore tier), Inform users might briefly see the profile page before being redirected, causing flash of unauthorized content.
**Why it happens:** The tier isn't available until the accounts API responds; checking a stale authStore value is unreliable.
**How to avoid:** Perform the tier check inside the `fetchAccountProfile()` resolution, not in a `useEffect` that runs before data loads. The loading spinner covers this window naturally.

### Pitfall 4: Redirect Loop — ProtectedRoute + Login + Return-To
**What goes wrong:** `ProtectedRoute` redirects to `/login?from=/profile`. Login redirects back to `/profile` after auth. If the user is Inform-tier, Profile redirects to `/signup`. If Signup auto-logins and navigates to `/profile` again, you get a loop.
**Why it happens:** The `from` param points to `/profile` which Inform users can't access.
**How to avoid:** After signup auto-login, navigate to `/` (dashboard), not to the `from` param. The `from` param is for login flows only, where the user already had the intent to visit a specific page. Signup is a new user who has no prior context.

### Pitfall 5: `credentials: 'include'` on Accounts API Calls
**What goes wrong:** The accounts API is at a different origin from the trivia backend. `credentials: 'include'` on cross-origin requests requires `Access-Control-Allow-Credentials: true` on the accounts API server, which it may not set. This causes CORS errors.
**Why it happens:** `api.ts` sets `credentials: 'include'` in `defaultOptions`. If `accountsApi.ts` inherits this or if a developer copies `apiRequest` and forgets to remove it, CORS fails silently with a network error.
**How to avoid:** `accountsApi.ts` must NOT include `credentials: 'include'`. It uses Bearer token auth only.

### Pitfall 6: Double Fetch on Profile Page (authStore + API)
**What goes wrong:** Profile page is refactored to call `GET /api/account/me`. But `authStore` already has the `user` object (from login). Developer is tempted to read `displayName` from the store instead of waiting for the API. The store's `user` only has `{ id, email, tier }` from the login response — not `display_name`, `xp`, or `gem_balance`.
**Why it happens:** The login response `user` shape is minimal. Full profile requires `GET /api/account/me`.
**How to avoid:** Do not short-circuit the `GET /api/account/me` call. Always fetch from the accounts API on Profile page load. The store holds only what's needed for auth (token, email, tier) — not for display.

### Pitfall 7: Stale isRefreshing Flag
**What goes wrong:** The `isRefreshing` flag in `api.ts` is a module-level variable. If a refresh request throws an unhandled exception (not inside the `finally` block), `isRefreshing` is never reset to `false`. All subsequent requests see `isRefreshing = true` and skip the retry, failing with 401 forever for the rest of the session.
**Why it happens:** The current `api.ts` does reset `isRefreshing = false` in a `finally` block — but only for the `trivia backend` refresh path. The new accounts API refresh path must also ensure `finally { isRefreshing = false }`.
**How to avoid:** Wrap the new refresh logic in the same `finally` reset. Confirm the reset is present after refactoring.

---

## Code Examples

### Complete AuthStore Update

```typescript
// frontend/src/store/authStore.ts
// Source: codebase inspection (current authStore.ts) + accounts API response shape
import { create } from 'zustand';

export type Tier = 'inform' | 'connected' | 'empowered';

export interface AccountsUser {
  id: string;       // UUID
  email: string;
  tier: Tier;
  displayName?: string;  // populated from GET /api/account/me separately
  isAdmin?: boolean;
}

interface AuthStore {
  accessToken: string | null;
  user: AccountsUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  timerMultiplier: number;

  setAuth: (token: string, user: AccountsUser) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setTimerMultiplier: (multiplier: number) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  timerMultiplier: 1.0,

  setAuth: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true, isLoading: false }),

  clearAuth: () => {
    localStorage.removeItem('ev_refresh_token');
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false, timerMultiplier: 1.0 });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setTimerMultiplier: (multiplier) => set({ timerMultiplier: multiplier }),
}));
```

### Login Page: Return-To Navigation

```typescript
// frontend/src/pages/Login.tsx (key changes only)
// Source: react-router-dom v6, same pattern as FlagReviewPage.tsx in this project
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    // ...existing error handling...
    const response = await authService.login({ email, password });
    // response.access_token (snake_case from accounts API)
    setAuth(response.access_token, {
      id: response.user.id,
      email: response.user.email,
      tier: response.user.tier,
    });
    // Store refresh token in localStorage
    localStorage.setItem('ev_refresh_token', response.refresh_token);

    // Return-to navigation
    const from = searchParams.get('from');
    const destination = from && from.startsWith('/') ? from : '/';
    navigate(destination, { replace: true });
  };
  // ...
}
```

### AuthInitializer: localStorage-Based Startup

```typescript
// frontend/src/components/AuthInitializer.tsx
// Source: codebase inspection, integration guide
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { exchangeRefreshToken } from '../services/accountsApi';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedRefresh = localStorage.getItem('ev_refresh_token');

      if (!storedRefresh) {
        // No stored session — resolve immediately, no spinner for new visitors
        setLoading(false);
        return;
      }

      try {
        const data = await exchangeRefreshToken(storedRefresh);
        localStorage.setItem('ev_refresh_token', data.refresh_token);
        setAuth(data.access_token, {
          id: data.user.id,
          email: data.user.email,
          tier: data.user.tier,
        });
      } catch {
        localStorage.removeItem('ev_refresh_token');
        clearAuth();
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-600" />
      </div>
    );
  }

  return <>{children}</>;
}
```

### ProtectedRoute: Return-To Redirect

```typescript
// frontend/src/components/ProtectedRoute.tsx
// Source: codebase inspection + react-router-dom v6 useLocation (used in Game.tsx in this project)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
```

### Profile Page: Parallel Fetch with Partial-Load Handling

```typescript
// frontend/src/pages/Profile.tsx (fetch logic)
// Source: codebase inspection + CONTEXT decisions
const [loading, setLoading] = useState(true);
const [triviaStats, setTriviaStats] = useState<ProfileStats | null>(null);
const [accountData, setAccountData] = useState<AccountProfile | null>(null);
const [triviaError, setTriviaError] = useState<string | null>(null);
const [accountError, setAccountError] = useState<string | null>(null);

useEffect(() => {
  const loadAll = async () => {
    const [triviaResult, accountResult] = await Promise.allSettled([
      fetchProfile(),
      fetchAccountProfile(),
    ]);

    if (triviaResult.status === 'fulfilled') {
      setTriviaStats(triviaResult.value);
      useAuthStore.getState().setTimerMultiplier(triviaResult.value.timerMultiplier);
    } else {
      setTriviaError("Couldn't load your trivia stats. Your game history may be temporarily unavailable.");
    }

    if (accountResult.status === 'fulfilled') {
      const profile = accountResult.value;
      // Tier check: Inform users cannot access profile page
      if (profile.tier === 'inform') {
        navigate('/signup', { replace: true });
        return;
      }
      setAccountData(profile);
    } else {
      setAccountError("Couldn't load your account info. Identity data is temporarily unavailable.");
    }

    setLoading(false);
  };

  loadAll();
}, []);
```

### Accounts API Client Module

```typescript
// frontend/src/services/accountsApi.ts (new file)
// Source: integration guide + authStore pattern
import { useAuthStore } from '../store/authStore';

export const ACCOUNTS_URL = import.meta.env.VITE_EMPOWERED_ACCOUNTS_URL;

async function accountsRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${ACCOUNTS_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw errorData;
  }
  return response.json();
}

export interface AccountProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  tier: 'inform' | 'connected' | 'empowered';
  account_standing: 'active' | 'suspended';
  connected_profile?: {
    display_name: string;
    xp: number;
    gem_balance: number;
    verification_status: string;
    completed_onboarding: boolean;
  };
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  return accountsRequest<AccountProfile>('/api/account/me');
}

export async function exchangeRefreshToken(refreshToken: string) {
  // NOTE: Endpoint not confirmed in integration guide — verify before implementing
  // Best guess: POST /api/auth/refresh with body { refresh_token }
  const response = await fetch(`${ACCOUNTS_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error('Refresh failed');
  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { id: string; email: string; tier: 'inform' | 'connected' | 'empowered' };
  }>;
}
```

---

## State of the Art

| Old Approach | New Approach | Impact |
|--------------|-------------|--------|
| Cookie-based sessions via `credentials: 'include'` | Bearer token from accounts API stored in memory/localStorage | Enables cross-origin auth |
| Single API target (`VITE_API_URL`) | Dual API: trivia backend + accounts API | Clean separation of concerns |
| Local `/auth/refresh` cookie refresh | localStorage refresh token + `POST /api/auth/refresh` | Works without HttpOnly cookie server |
| `accessToken` camelCase in `AuthResponse` | `access_token` snake_case from accounts API | Matches actual API contract |
| Name field in signup form | Email + password only | Matches accounts API `POST /api/auth/signup` |
| Profile page: all identity managed locally | Identity managed at accounts platform, linked out | Decoupled identity architecture |
| `id: number` (integer) on User type | `id: string` (UUID) on AccountsUser | Matches Supabase UUID identity |
| `navigate('/')` after login/signup | `navigate(from || '/')` | Enables deep-link return |

**Deprecated (remove in this phase):**
- `authService.refresh()` — calls local `/auth/refresh` with cookies; replaced by `exchangeRefreshToken()` in `accountsApi.ts`
- `updateName()`, `uploadAvatar()`, `updatePassword()` in `profileService.ts` — replaced by external link
- `setUserName()` action in `authStore.ts` — no longer needed; display name comes from accounts API
- `name` field in `SignupData` type — accounts API does not accept name at signup

---

## Open Questions

1. **Token refresh endpoint path** (HIGH priority — blocks implementation)
   - What we know: The accounts API issues `refresh_token` at login. The integration guide does not document a refresh endpoint.
   - What's unclear: Is it `POST /api/auth/refresh` with body `{ refresh_token }`? Or a direct Supabase Auth call?
   - Recommendation: The implementation task for `exchangeRefreshToken()` should be gated on a quick verification step. If unavailable, the fallback is calling Supabase Auth directly at `POST {SUPABASE_URL}/auth/v1/token?grant_type=refresh_token` with `{ refresh_token }` in the body — this bypasses the accounts Express layer but uses the same Supabase project.

2. **XP source for profile display** (MEDIUM priority)
   - What we know: `GET /api/account/me` returns `connected_profile.xp` (integer). Phase 42 decided to track trivia XP locally in `trivia.player_stats.total_xp`.
   - What's unclear: Which XP value does the profile hero display? The accounts platform XP (`connected_profile.xp`) or the trivia-local XP (`total_xp` from trivia backend)?
   - CONTEXT says: "XP (from `connected_profile.xp`)" — so the accounts API value. But trivia backend's `fetchProfile()` currently returns `totalXp`. The profile page needs to use `accountData.connected_profile.xp`, not `triviaStats.totalXp`.
   - Recommendation: Profile hero shows `connected_profile.xp` from accounts API. The local `totalXp` from the trivia backend is no longer displayed on the profile (it tracks trivia-only XP; the accounts XP is the canonical cross-platform value).

3. **Suspend check in api.ts interceptor** (LOW priority)
   - What we know: The accounts API returns `account_standing: "suspended"` on `GET /api/account/me`. The interceptor currently just handles 401s.
   - What's unclear: Should the frontend redirect suspended users to an informational page?
   - Recommendation: Out of scope for this phase. Game backend already blocks suspended users from earning rewards (Phase 42). Frontend can surface standing info on the profile page if `account_standing === 'suspended'` without a special interceptor.

4. **Avatar handling on profile page** (LOW priority)
   - What we know: `GET /api/account/me` returns `avatar_url: null` (accounts API manages avatars). Upload is removed from the profile page.
   - What's unclear: Should the `Avatar` component still render if `avatar_url` is null? It currently shows initials as fallback.
   - Recommendation: Keep the `Avatar` component with initials fallback. Remove the upload/click-to-upload behavior — avatar is managed at the accounts platform.

---

## Sources

### Primary (HIGH confidence)
- `C:/Project Test/empowered-accounts-integration-guide.md` — Accounts API routes, response shapes, auth patterns
- `C:/Project Test/frontend/src/services/api.ts` — Existing token refresh interceptor pattern
- `C:/Project Test/frontend/src/services/authService.ts` — Current auth API calls
- `C:/Project Test/frontend/src/store/authStore.ts` — Current Zustand store shape
- `C:/Project Test/frontend/src/components/AuthInitializer.tsx` — Current startup auth check
- `C:/Project Test/frontend/src/pages/Login.tsx` — Current login page
- `C:/Project Test/frontend/src/pages/Signup.tsx` — Current signup page
- `C:/Project Test/frontend/src/pages/Profile.tsx` — Current profile page (full code read)
- `C:/Project Test/frontend/src/services/profileService.ts` — Current profile API calls
- `C:/Project Test/frontend/src/App.tsx` — Route structure, ProtectedRoute usage
- `C:/Project Test/frontend/package.json` — zustand@4.4.7, react-router-dom@6.21.1

### Secondary (MEDIUM confidence)
- `C:/Project Test/.planning/phases/42-gem-progression-integration/42-RESEARCH.md` — Phase 42 research (XP decision, accounts API patterns)
- `C:/Project Test/empowered-vote-primer.md` — Platform architecture, tier system

### Tertiary (LOW confidence)
- Token refresh endpoint shape (`POST /api/auth/refresh` with `{ refresh_token }` body) — inferred from common Express patterns; not confirmed in integration guide

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing project packages, no new dependencies
- Architecture: HIGH — based on direct codebase inspection and confirmed API contracts
- Token refresh endpoint: LOW — not documented in integration guide; shape inferred
- Pitfalls: HIGH — all derived from direct code inspection of files being modified

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable domain; primary uncertainty is token refresh endpoint which is an integration detail)
