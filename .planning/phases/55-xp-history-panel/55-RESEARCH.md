# Phase 55: XP History Panel - Research

**Researched:** 2026-03-08
**Domain:** Profile page tab layout + backend XP history proxy endpoint + paginated list UI
**Confidence:** HIGH — all findings from direct codebase inspection and authoritative integration guide

---

## Summary

Phase 55 has two distinct halves: a new backend proxy route and a new frontend profile tab. The backend must add `GET /api/xp/me/history` to `profile.ts` — this endpoint proxies to the Empowered Accounts API's `GET /api/xp/me/history`, enforcing Connected-tier restriction and adding CTC's Bearer JWT forwarding. The frontend transforms `Profile.tsx` from a flat-scroll page into a two-tab layout (Overview / XP History), where the History tab only renders for Connected players.

**Critical finding:** The `GET /api/xp/me/history` endpoint does NOT yet exist in the codebase. The phase context statement "Phase 53 shipped: GET /api/xp/me/history backend endpoint exists" is incorrect. Phase 53 only added `awardPlatformXp()`. The history route must be built in Phase 55. The Empowered Accounts API contract for this endpoint is documented in `civic-trivia-championship-xp-integration.md` and confirmed readable — it uses `limit`/`offset` pagination (not page numbers), returns `{ transactions, total, limit, offset }`, and requires Bearer JWT auth on the Accounts API end. The CTC backend will forward the user's JWT directly.

The Profile page currently has no tab concept — it is a vertical scroll of three sections (hero/identity, statistics, settings). Adding tabs requires a `activeTab` state variable and conditional rendering of the section content. All existing profile sections become the "Overview" tab. Non-Connected players see no tab UI and get the existing layout unchanged.

**Primary recommendation:** Build the backend proxy route first (Plan 1), then build the frontend tab layout and XP History panel (Plan 2). No new npm packages required.

---

## Standard Stack

No new npm dependencies needed. All required tools are already installed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.2.0 | Component framework | Project standard |
| framer-motion | ^12.34.0 | Optional: tab content transitions | Already installed, already used in Profile-adjacent components |
| tailwindcss | ^3.4.1 | All styling | Only CSS approach in this project |
| zustand | ^4.4.7 | Auth state (tier, accessToken) | Already provides tier, user.id, accessToken |
| Node.js fetch | Built-in (Node 18+) | Backend proxy calls to Accounts API | Already used in progressionService.ts |

### Existing Project Patterns (reuse directly)
| Pattern | Location | Phase 55 Use |
|---------|----------|--------------|
| `requireAuth` middleware | `backend/src/middleware/auth.ts` | Gate `/api/xp/me/history` backend route |
| `checkAccountContext` | `backend/src/services/progressionService.ts` | Verify Connected tier on the history endpoint |
| `apiRequest()` | `frontend/src/services/api.ts` | Fetch history from CTC backend with auto-Bearer + token refresh |
| `useAuthStore` | `frontend/src/store/authStore.ts` | Read `tier`, `accessToken`, `user.id` for tab visibility |
| `XpIcon` | `frontend/src/components/icons/XpIcon.tsx` | Use in +XP badge in history rows |
| Error state pattern | `Profile.tsx` lines 131-134 | Same amber warning banner for API failure |
| Loading state pattern | `Profile.tsx` lines 110-121 | Same spinner while loading |
| `XpReveal.tsx` | `frontend/src/features/game/components/XpReveal.tsx` | XP badge style reference (reuse styling, not full component) |

**No new npm packages required.**

---

## Architecture Patterns

### Recommended File Changes

```
backend/src/
└── routes/
    └── profile.ts          # Add GET /xp/history route (proxies to Accounts API)

frontend/src/
├── pages/
│   └── Profile.tsx         # Refactor: two-tab layout, XP History tab content
└── services/
    └── profileService.ts   # Add fetchXpHistory() function
```

No new files required. All changes fit in existing files.

### Pattern 1: Backend XP History Proxy Route

The route lives in `backend/src/routes/profile.ts`, registered under the existing `router.use(requireAuth)` umbrella (already applied at line 11). Add after the existing `/settings` route.

**Connected-tier enforcement:** Call `checkAccountContext(req.accessToken!)` from `progressionService.ts`. Return 403 if `!isConnected`. This mirrors the pattern used in `game.ts` for XP award gating.

**Forwarding to Accounts API:** Pass `req.accessToken` as Bearer JWT to the Accounts API. The user's own JWT is accepted by the Accounts API for `GET /api/xp/me/history` (same shared Supabase project).

**Pagination:** The Accounts API uses `limit`/`offset`. The CTC backend receives `?page=N&pageSize=20` from the frontend, converts to `limit=20&offset=(page-1)*20`, proxies the response.

```typescript
// Source: civic-trivia-championship-xp-integration.md + progressionService.ts pattern
// In backend/src/routes/profile.ts, add after the /settings route:

router.get('/xp/history', async (req: Request, res: Response): Promise<void> => {
  try {
    // Enforce Connected tier
    const { isConnected } = await checkAccountContext(req.accessToken!);
    if (!isConnected) {
      res.status(403).json({ error: 'Connected tier required' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const accountsUrl = process.env.EMPOWERED_ACCOUNTS_URL;
    if (!accountsUrl) {
      res.status(503).json({ error: 'XP service not configured' });
      return;
    }

    const resp = await fetch(
      `${accountsUrl}/api/xp/me/history?limit=${pageSize}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${req.accessToken}` } }
    );

    if (!resp.ok) {
      console.error(`[profile] XP history API returned ${resp.status}`);
      res.status(502).json({ error: 'Failed to fetch XP history' });
      return;
    }

    const data = await resp.json();
    // data: { transactions, total, limit, offset }
    res.json({
      entries: data.transactions,
      total: data.total,
      page,
      pageSize,
      totalPages: Math.ceil(data.total / pageSize),
    });
  } catch (error) {
    console.error('[profile] XP history error:', error);
    res.status(500).json({ error: 'Failed to fetch XP history' });
  }
});
```

**Note:** Use `EMPOWERED_ACCOUNTS_URL` (the existing var used by `checkAccountContext`) — NOT `EMPOWERED_ACCOUNTS_API_URL` (which is the service-key endpoint for server-side awards). The history endpoint uses user-JWT auth against the same host as `checkAccountContext`.

### Pattern 2: Frontend profileService Addition

Add `fetchXpHistory()` to `frontend/src/services/profileService.ts`, using `apiRequest()` from `api.ts` (auto-adds Bearer token, handles 401 refresh):

```typescript
// Source: profileService.ts existing pattern + api.ts apiRequest() usage
export interface XpHistoryEntry {
  id: string;
  source: string;
  amount: number;
  metadata: { score?: number; [key: string]: unknown } | null;
  created_at: string;   // ISO 8601 timestamp
  is_duplicate?: boolean;
}

export interface XpHistoryResponse {
  entries: XpHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchXpHistory(page: number): Promise<XpHistoryResponse> {
  return apiRequest<XpHistoryResponse>(`/api/users/profile/xp/history?page=${page}`);
}
```

### Pattern 3: Profile Page Two-Tab Layout

`Profile.tsx` currently has no tabs. The refactor adds `activeTab: 'overview' | 'history'` state. The tab bar only renders for Connected players. Non-Connected players see the existing content with no change.

**Tab visibility guard:**
```typescript
// Source: authStore.ts tier field + Profile.tsx pattern
const tier = useAuthStore((s) => s.tier);
const isConnected = tier === 'connected' || tier === 'empowered';
// Tab bar: only render if isConnected
// Default active tab: 'overview' — never default to 'history'
```

**Tab bar placement:** Between the hero section (accounts identity card) and the content sections. The existing Statistics and Settings sections become the Overview tab content.

**Tab render structure:**
```tsx
{/* Tab bar — Connected only */}
{isConnected && (
  <div className="flex border-b border-slate-700">
    <button
      onClick={() => setActiveTab('overview')}
      className={`px-6 py-3 text-sm font-semibold transition-colors ${
        activeTab === 'overview'
          ? 'text-teal-400 border-b-2 border-teal-400'
          : 'text-slate-400 hover:text-slate-300'
      }`}
    >
      Overview
    </button>
    <button
      onClick={() => setActiveTab('history')}
      className={`px-6 py-3 text-sm font-semibold transition-colors ${
        activeTab === 'history'
          ? 'text-teal-400 border-b-2 border-teal-400'
          : 'text-slate-400 hover:text-slate-300'
      }`}
    >
      XP History
    </button>
  </div>
)}

{/* Overview tab */}
{(!isConnected || activeTab === 'overview') && (
  <>
    {/* existing Statistics section */}
    {/* existing Settings section */}
  </>
)}

{/* History tab */}
{isConnected && activeTab === 'history' && (
  <XpHistoryPanel />
)}
```

### Pattern 4: XP History Panel Component

The panel lives inside Profile.tsx (no separate file needed unless complex). It manages its own `page`, `data`, `loading`, `error` state and triggers a fetch when `activeTab === 'history'` first becomes true (or when page changes).

**Data fetching trigger:** Use `useEffect` with `[activeTab, page]` dependencies. Fetch only when `activeTab === 'history'`.

**Pagination:** Display `page` and `totalPages`. Previous/Next buttons (disable Previous on page 1, Next on last page). Total count header "47 games played" from `data.total`.

**Row format:** Each row renders: date | collection name | score | correct answers | +XP badge

The `source` field from the Accounts API will always be `"civic_trivia_championship_score"` for CTC games. The `metadata` field will contain `{ game_id: string }` only (per Phase 53 implementation — score/correct_answers metadata was NOT included in the actual implementation despite being in the spec). This is a known gap documented in the Phase 53 verification notes.

**Collection name resolution:** The Accounts API `metadata` does NOT include collection name — Phase 53's `awardPlatformXp()` only passes `{ game_id: idempotencyKey }` as metadata. Score and correct_answers are also absent. The display decision for Phase 55 must account for this: "N/A" or omit the collection column entirely, or use the `game_id` (which is the idempotency key format `ctc-game-{sessionId}-{userId}`) as an identifier only.

**Date formatting (per decisions):**
- Within last 7 days: relative ("2 days ago") — use `Date.now() - new Date(created_at).getTime()` comparison
- 7+ days ago: absolute date ("Mar 6") — use `new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(created_at))`

**Duplicate indicator:** If metadata contains `is_duplicate: true` on the transaction, show neutral inline label "Already counted". Per the Accounts API spec, `is_duplicate` is a flag on the award response, not stored in transaction metadata — so the history entries will NOT have an `is_duplicate` field. The decision CONTEXT mentions it, but the data is not available in `GET /api/xp/me/history` transactions. See Open Questions.

**+XP badge styling:** Echo XpReveal's teal/cyan palette: `text-cyan-400 font-bold` with `XpIcon`. Do NOT reuse the XpReveal component itself — it takes a full `XpResult` with level/progress bar context which the history entries don't have.

### Pattern 5: Empty State

```tsx
{data.total === 0 && (
  <div className="py-12 text-center space-y-4">
    <p className="text-slate-400">No games yet — play your first game to start earning XP!</p>
    <button
      onClick={() => navigate('/play')}
      className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
    >
      Play a Game
    </button>
  </div>
)}
```

Use `navigate('/play')` from `useNavigate()` — same as the existing empty-state CTA in the Statistics section (Profile.tsx line 229).

### Pattern 6: Loading Skeleton (Claude's Discretion)

While history is loading, render 3-5 skeleton rows as grey placeholder `div`s:

```tsx
{loading && (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
    ))}
  </div>
)}
```

Tailwind `animate-pulse` is built-in — no extra library needed.

### Pattern 7: Error State (Claude's Discretion)

Match the existing error pattern in Profile.tsx (amber banner):

```tsx
{error && (
  <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
    Couldn't load XP history. Try refreshing the page.
  </div>
)}
```

### Anti-Patterns to Avoid

- **Don't call the Accounts API directly from the frontend for history.** The `GET /api/xp/me/history` Accounts API endpoint requires the user's JWT — the frontend has this token, but CTC's pattern is to always proxy through CTC backend. This is consistent with how `checkAccountContext` works and allows CTC to add logging, caching, or transformation later.
- **Don't use `accountsApiFetch()` for the history call.** Use `apiRequest()` (goes through CTC backend). The `accountsApiFetch()` wrapper is for direct Accounts API calls (like `fetchAccountProfile`) — not the pattern for this endpoint.
- **Don't render the tab bar for non-Connected players.** The spec is explicit: non-Connected players see no tab chrome. The entire tab layout must be gated on `isConnected`.
- **Don't default the active tab to 'history'.** Always default to 'overview' — it's less disorienting and loads immediately.
- **Don't use `EMPOWERED_ACCOUNTS_API_URL` for the history proxy.** That env var is for service-key (server-to-server) XP awards. The history endpoint uses user JWT auth via `EMPOWERED_ACCOUNTS_URL`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative date formatting | Custom date math | `Date.now()` diff + `Intl.DateTimeFormat` | Intl handles locale, edge cases; no library needed |
| Token refresh on 401 | Manual retry logic | `apiRequest()` from `api.ts` | Already implements token refresh on 401 with `exchangeRefreshToken()` |
| Loading placeholder | Custom skeleton library | Tailwind `animate-pulse` + `bg-slate-700` divs | Already in use elsewhere; zero dependencies |
| Connected-tier check | New middleware | `checkAccountContext()` from `progressionService.ts` | Already handles the EMPOWERED_ACCOUNTS_URL call pattern |
| Pagination math | Custom utility | Inline `Math.ceil(total / pageSize)` | Simple enough to inline; no utility needed |
| XP badge icon | SVG inline | `XpIcon` from `components/icons/XpIcon.tsx` | Already exists, already used in Profile hero |

**Key insight:** This phase reuses existing infrastructure at every layer. There is very little net-new code — the main work is wiring existing patterns together.

---

## Common Pitfalls

### Pitfall 1: Missing Metadata — Score and Collection Not Available in History
**What goes wrong:** Planner assumes history entries contain score, correct_answers, and collection name from the Accounts API.
**Why it happens:** The XP integration guide's example metadata shows `{ "score": 850, "rank": 2 }` but Phase 53's actual implementation sends `metadata: { game_id: idempotencyKey }` only. Score, correct_answers, and collection name were NOT stored in metadata.
**How to avoid:** The History tab row columns "collection name | score | correct answers" as specified in CONTEXT.md cannot be populated from the Accounts API response alone. The planner must either: (a) include these fields in the metadata when awarding XP (requires a game.ts change), or (b) accept that these columns show placeholder values. See Open Questions #1.
**Warning signs:** Row columns showing undefined or "N/A" for all entries.

### Pitfall 2: is_duplicate Not Available in History Transactions
**What goes wrong:** Implementing "Already counted" indicator based on `transaction.is_duplicate` which doesn't exist.
**Why it happens:** `is_duplicate` is returned by the AWARD endpoint when a game is replayed — it's an idempotency check flag, not stored in the transaction ledger. History transactions are unique by definition.
**How to avoid:** Do NOT implement `is_duplicate` row indicator based on transaction data. If the planner wants to retain the "Already counted" indicator decision from CONTEXT.md, it would require storing `is_duplicate` in metadata at award time (same root cause as Pitfall 1).
**Warning signs:** Trying to read `entry.is_duplicate` returns undefined for all rows.

### Pitfall 3: Using EMPOWERED_ACCOUNTS_API_URL Instead of EMPOWERED_ACCOUNTS_URL
**What goes wrong:** Backend history proxy uses `EMPOWERED_ACCOUNTS_API_URL` (service-key endpoint) instead of `EMPOWERED_ACCOUNTS_URL` (user-JWT endpoint).
**Why it happens:** Two env vars exist with similar names for different auth methods.
**How to avoid:** `GET /api/xp/me/history` requires user Bearer JWT — use `EMPOWERED_ACCOUNTS_URL`. The `EMPOWERED_ACCOUNTS_API_URL` is only for `POST /api/xp/award` with `X-Service-Key` header.
**Warning signs:** 401 or 403 responses from Accounts API when testing history endpoint.

### Pitfall 4: Tab Bar Visible for Non-Connected Players
**What goes wrong:** Tab bar renders for Inform-tier users, showing a "XP History" tab with an error/empty state.
**Why it happens:** Missing the Connected-tier guard around the tab UI.
**How to avoid:** Gate the entire tab bar on `tier === 'connected' || tier === 'empowered'`. Non-Connected users see no tabs and experience the profile page exactly as it is today.
**Warning signs:** Inform-tier test user sees tabs.

### Pitfall 5: Tier Not Yet Resolved When Profile Mounts
**What goes wrong:** Profile page mounts, `tier` is null (not yet resolved), tab bar flickers in and out.
**Why it happens:** The auth store sets `tierResolved: false` initially. The `fetchAccountProfile` call in Profile.tsx resolves the tier asynchronously.
**How to avoid:** Check `tierResolved` before rendering the tab bar, or rely on the existing `loading` state (tier is resolved during the initial `load()` call that already runs on mount). Since the tab bar should only appear after the profile loads, guard tab rendering with `!loading && isConnected`.
**Warning signs:** Tab bar flash on page load for non-Connected users.

### Pitfall 6: History Fetched on Initial Tab='Overview' Load
**What goes wrong:** History API call fires when profile page loads even though user is on Overview tab.
**Why it happens:** Effect runs without checking which tab is active.
**How to avoid:** Trigger history fetch only when `activeTab === 'history'`. Use a flag or trigger within the effect dependencies.
**Warning signs:** Unnecessary `/api/users/profile/xp/history` request on every profile page visit.

### Pitfall 7: Pagination Not Reset When Tab Switches
**What goes wrong:** User navigates away and back to History tab, page is still 3 from previous visit.
**Why it happens:** Page state persists in component state across tab switches.
**How to avoid:** Reset `page` to 1 when `activeTab` changes to `'history'` (or reset on tab deactivation). Simplest: use `useEffect(() => { setPage(1); }, [activeTab])`.
**Warning signs:** Page 3 shown immediately when switching back to History.

---

## Code Examples

### Accounts API History Response Shape
```typescript
// Source: civic-trivia-championship-xp-integration.md section "GET /api/xp/me/history"
// Accounts API returns (newest-first):
{
  transactions: [
    {
      id: string,            // transaction UUID
      source: string,        // "civic_trivia_championship_score"
      amount: number,        // XP awarded (50-200)
      metadata: { game_id: string } | null,  // Phase 53 actual metadata (game_id only)
      created_at: string,    // ISO 8601 timestamp
    }
  ],
  total: number,   // total count across all pages
  limit: number,   // requested limit
  offset: number,  // requested offset
}
```

### Relative Date Formatting (no library)
```typescript
// Source: CONTEXT.md decisions + standard JS Date API
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  // Produces: "Mar 6"
}
```

### Connected Tier Detection in Frontend
```typescript
// Source: frontend/src/store/authStore.ts + Profile.tsx pattern
import { useAuthStore } from '../store/authStore';

const tier = useAuthStore((s) => s.tier);
const isConnected = tier === 'connected' || tier === 'empowered';
```

### Backend Route Registration
```typescript
// Source: backend/src/server.ts — profile router registered at /api/users/profile
// New route in backend/src/routes/profile.ts:
// Full path: GET /api/users/profile/xp/history
// The router.use(requireAuth) at line 11 already protects all routes in this file
```

### XP Badge Row (History Row Format)
```tsx
// Source: XpReveal.tsx color scheme (cyan-400 for XP)
// Each history row:
<div className="flex items-center justify-between py-3 border-b border-slate-700">
  <span className="text-slate-400 text-sm w-24">{formatDate(entry.created_at)}</span>
  <span className="text-slate-300 flex-1 mx-4">CTC Game</span>
  <div className="flex items-center gap-1 text-cyan-400 font-bold">
    <XpIcon className="w-4 h-4" />
    <span>+{entry.amount}</span>
  </div>
</div>
```

Note: Collection name column from CONTEXT.md decisions is not achievable from current data (see Pitfall 1 and Open Questions). Use "CTC Game" or similar placeholder until metadata is enriched.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Profile page = flat scroll (no tabs) | Two-tab layout (Overview / XP History) | Profile.tsx requires tab state refactor |
| No XP history endpoint in CTC | New backend proxy route | One new route in profile.ts |
| Phase 53 metadata = `{ game_id }` only | Metadata missing score/collection | History rows show XP amount + date only; score/collection require retroactive fix |

**Deprecated/outdated:**
- The additional_context claim "Phase 53 shipped: GET /api/xp/me/history backend endpoint exists" is INCORRECT. Phase 53 verification confirms only `awardPlatformXp()` was added. The history endpoint is Phase 55 work.

---

## Open Questions

1. **Metadata gap: score, correct_answers, collection name not stored**
   - What we know: Phase 53's `awardPlatformXp()` sends `metadata: { game_id: idempotencyKey }` only (Phase 53 verification note: "Metadata body differs from research spec"). The Accounts API history transactions will NOT contain score, correct_answers, or collection name.
   - What's unclear: Should Phase 55 also patch `awardPlatformXp()` to include richer metadata (score, correct_answers, collection slug), or should the history panel accept sparse data?
   - Recommendation: Include a Plan 1 task to enrich the metadata in `awardPlatformXp()` before building the UI. The CONTEXT.md decisions specify "score | correct answers" columns — fulfilling this requires metadata enrichment. This does NOT require re-awarding XP; it only affects new games going forward.

2. **is_duplicate indicator: no data available in history transactions**
   - What we know: `is_duplicate` is only returned by the award endpoint, not stored in the XP ledger. History transactions are unique rows by design.
   - What's unclear: CONTEXT.md decisions explicitly call for a "neutral inline indicator" for duplicates. This is unimplementable from history data alone unless `is_duplicate: true` is stored in `metadata` at award time.
   - Recommendation: Store `is_duplicate` in metadata when `awardPlatformXp()` detects a duplicate (same plan as metadata enrichment above). If this is deferred, drop the duplicate indicator from the history UI scope.

3. **Which collection was played: idempotency key deconstruction**
   - What we know: The `game_id` in metadata is `ctc-game-{sessionId}-{userId}` — the sessionId is a random UUID and cannot be decoded to a collection name.
   - What's unclear: Whether collection slug should be stored in metadata (recommended: yes).
   - Recommendation: Add `collection_slug` to the metadata in `awardPlatformXp()` call site in `game.ts`. The results route has access to `session.collectionSlug`.

---

## Sources

### Primary (HIGH confidence)
- Direct read: `C:/Project Test/backend/src/routes/profile.ts` — confirms NO history route exists; requireAuth pattern
- Direct read: `C:/Project Test/backend/src/server.ts` — confirmed routes registered; no XP routes beyond game.ts
- Direct read: `C:/Project Test/backend/src/services/progressionService.ts` — `awardPlatformXp()` actual implementation, `checkAccountContext()` pattern, `withRetry()` helper
- Direct read: `C:/Project Test/backend/src/middleware/auth.ts` — `requireAuth` middleware pattern
- Direct read: `C:/Project Test/frontend/src/pages/Profile.tsx` — full current profile page structure (290 lines)
- Direct read: `C:/Project Test/frontend/src/services/api.ts` — `apiRequest()` with Bearer auto-attach and 401 refresh
- Direct read: `C:/Project Test/frontend/src/services/accountsApi.ts` — `ACCOUNTS_API_URL`, `accountsApiFetch()` pattern
- Direct read: `C:/Project Test/frontend/src/store/authStore.ts` — `tier`, `accessToken`, `tierResolved` fields
- Direct read: `C:/Project Test/frontend/src/features/game/components/XpReveal.tsx` — XP badge style reference (cyan-400, XpIcon)
- Direct read: `C:/Project Test/frontend/src/hooks/usePlayerXp.ts` — XP fetch hook pattern for reference
- Direct read: `C:/Project Test/frontend/src/types/game.ts` — `XpResult` type, `Progression` type
- Direct read: `C:/Project Test/.planning/phases/53-xp-backend-integration/53-VERIFICATION.md` — confirms metadata gap (game_id only, not score/correct_answers)
- `C:/Project Test/civic-trivia-championship-xp-integration.md` — `GET /api/xp/me/history` contract: limit/offset pagination, response shape, auth requirement

### Secondary (MEDIUM confidence)
- `C:/Project Test/.planning/phases/54-xp-game-ui/54-RESEARCH.md` — XP UI patterns, framer-motion usage, `useReducedMotion` convention
- `C:/Project Test/.planning/phases/54-xp-game-ui/54-VERIFICATION.md` — confirms Phase 54 artifacts shipped correctly

### Not Needed
- Context7 / WebSearch not required — all findings from project source code and integration docs

---

## Metadata

**Confidence breakdown:**
- Backend route structure: HIGH — profile.ts read directly; no history route present
- Accounts API contract: HIGH — integration doc read directly
- Metadata gap (score/collection missing): HIGH — Phase 53 verification note confirms actual implementation
- Frontend tab pattern: HIGH — Profile.tsx read in full; no existing tabs
- is_duplicate in history: HIGH — API spec confirms it's not stored in transaction ledger
- env var selection (EMPOWERED_ACCOUNTS_URL vs EMPOWERED_ACCOUNTS_API_URL): HIGH — both confirmed by source

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable codebase; Accounts API contract is v1.1 from 2026-03-04)
