# Phase 67: Leaderboard - Research

**Researched:** 2026-03-16
**Domain:** React SPA leaderboard page + backend proxy route + accounts API integration
**Confidence:** HIGH (codebase verified directly; accounts API probed live)

---

## Summary

Phase 67 adds a `/leaderboard` page to the CTC frontend showing top 25 players by XP, with two tabs (All Time / This Week), a podium for the top 3, and a sticky "you" row for logged-in users. The data source is the Empowered Accounts API.

**Critical finding: the accounts API does NOT currently have a leaderboard endpoint.** Probing the live API at `https://ev-accounts-api.onrender.com` confirms no `/api/leaderboard`, `/api/account/leaderboard`, or bulk-ranking endpoint exists. The only public profile endpoint is `GET /api/account/profile/:userId` which returns a single user's profile — it cannot serve a ranked list. This means the CTC backend must implement its own leaderboard route that either (a) queries Supabase directly using the shared project, or (b) requests a new endpoint from the accounts API. **Option (a) — direct Supabase query — is the correct approach** given CTC shares the Supabase project `kxsdzaojfaibhuzmclfq` with accounts and the XP ledger is in that database.

For the "This Week" (rolling 7-day) tab, the CTC backend can query the Supabase `xp_transactions` (or equivalent) table with a `created_at > now() - interval '7 days'` filter. The per-user global rank for the sticky "you" row also requires a Supabase query, not an accounts API call. The ~5-minute TTL cache should be implemented at the backend route level using the existing in-memory/Redis storage infrastructure.

**Primary recommendation:** Build a `GET /api/leaderboard` route in the CTC backend that queries Supabase directly for both all-time and weekly tabs, returns pre-ranked data, and is cached for ~5 minutes using the existing `storageFactory`. The frontend fetches this CTC-backend endpoint, not the accounts API directly.

---

## Standard Stack

This phase adds no new npm dependencies. Everything needed is already in the project.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI rendering | Project standard |
| react-router-dom | 6.21.1 | Page routing + nav link | Already used for all routes |
| framer-motion | 12.34.0 | Podium animation, tab transition | Already used throughout game |
| zustand | 4.4.7 | `useAuthStore` for logged-in user state | Already used project-wide |
| tailwindcss | 3.4.1 | Utility classes for layout | Already used |

### Backend (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | project standard | Route handler for `/api/leaderboard` | All backend routes use this |
| drizzle-orm | project standard | Supabase queries | Used everywhere in backend |
| @supabase/supabase-js (admin) | project standard | Direct DB access via supabaseAdmin | Used in profile, admin routes |
| storageFactory (Redis/Memory) | project standard | 5-minute TTL cache | Already wired into server |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Backend Supabase query | Accounts API leaderboard endpoint | Accounts API has no such endpoint (verified live); would require Chris to build it first |
| Backend cache | Client-side SWR/React Query | No new libraries; backend cache works for all clients including unauthenticated |
| Custom tab component | @headlessui/react Tab | App uses inline style patterns consistently; @headlessui is installed but using it here would be inconsistent with the rest of the app which builds its own UI elements |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   └── Leaderboard.tsx          # New page component
├── features/
│   └── leaderboard/
│       ├── components/
│       │   ├── LeaderboardPodium.tsx    # Top-3 podium display
│       │   ├── LeaderboardRow.tsx       # Rank 4-25 row
│       │   ├── LeaderboardStickyYou.tsx # Sticky "you" row
│       │   └── LeaderboardTabs.tsx      # All Time / This Week tabs
│       ├── hooks/
│       │   └── useLeaderboard.ts        # Data fetching + cache
│       └── types.ts                     # LeaderboardEntry, LeaderboardResponse

backend/src/
├── routes/
│   └── leaderboard.ts           # New: GET /api/leaderboard?tab=all_time|this_week
└── server.ts                    # Register leaderboard router
```

### Pattern 1: Backend Leaderboard Route

The backend route queries Supabase directly, returning pre-ranked data for both tabs. It uses the existing `storageFactory` for a 5-minute cache.

**All-time tab:** Query the XP ledger or accounts profile data grouped by user, ordered by total XP descending, limit 25.

**This Week tab:** Same query but filtered to XP transactions with `created_at > NOW() - INTERVAL '7 days'`, summed per user, ordered descending.

**Per-user rank (sticky you):** Run `COUNT(*) WHERE total_xp > :userXp` + 1 from the same base query.

```typescript
// Source: existing pattern from backend/src/routes/profile.ts
// GET /api/leaderboard?tab=all_time|this_week&userId=<optional>
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const tab = req.query.tab === 'this_week' ? 'this_week' : 'all_time';
  const userId = req.query.userId as string | undefined;

  // Cache key includes tab (and userId if present for rank lookup)
  const cacheKey = `leaderboard:${tab}:${userId ?? 'anon'}`;
  const CACHE_TTL_SECONDS = 300; // 5 minutes

  const storage = storageFactory.getStorage();
  const cached = await storage.get(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  // ... Supabase query here (see Supabase Schema section) ...

  await storage.set(cacheKey, JSON.stringify(payload), CACHE_TTL_SECONDS);
  res.json(payload);
});
```

### Pattern 2: Frontend Data Fetching (useLeaderboard hook)

Match the `usePlayerXp` pattern — plain `fetch` with `useEffect`, loading/error states, no external libraries.

```typescript
// Source: frontend/src/hooks/usePlayerXp.ts (verified pattern)
export function useLeaderboard(tab: 'all_time' | 'this_week', userId: string | null) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ tab });
    if (userId) params.set('userId', userId);

    fetch(`${API_BASE}/api/leaderboard?${params}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(setData)
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setIsLoading(false));
  }, [tab, userId]);

  return { data, isLoading, error };
}
```

### Pattern 3: Routing — Public Page

`/leaderboard` is NOT a protected route. Add it like `/` and `/dashboard` in `App.tsx`:

```typescript
// Source: frontend/src/App.tsx (verified)
// Add inside <Routes> alongside other public routes:
<Route path="/leaderboard" element={<Leaderboard />} />
```

### Pattern 4: Nav Link in Header

The Header is a shared component used on every page. Add a "LEADERBOARD" nav link alongside "SIGN IN" / "SIGN UP" for unauthenticated users, and in the hamburger menu for authenticated users.

**Authenticated users:** Add a "LEADERBOARD" button to the hamburger dropdown (matches PROFILE / LOG OUT pattern exactly).

**Unauthenticated users:** Add a "LEADERBOARD" link alongside SIGN IN / SIGN UP in the right-side nav cluster.

```typescript
// Source: frontend/src/components/layout/Header.tsx (verified pattern)
// In hamburger dropdown (authenticated):
<button onClick={() => handleMenuItemClick(() => navigate('/leaderboard'))}
  style={{ /* same style as PROFILE button */ }}>
  LEADERBOARD
</button>

// In right-side nav (unauthenticated):
<Link to="/leaderboard"
  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', color: C.muted }}>
  LEADERBOARD
</Link>
```

### Pattern 5: Tab Component

No existing tab component in the codebase. Build a simple inline-styled tab strip matching the Bebas Neue + border-bottom active indicator style used elsewhere. No @headlessui Tab — the app uses inline patterns.

```typescript
// Pattern based on existing inline style conventions
function LeaderboardTabs({ active, onChange }: { active: 'all_time' | 'this_week'; onChange: (t: 'all_time' | 'this_week') => void }) {
  const { C } = useTheme();
  const tabs = [
    { key: 'all_time', label: 'ALL TIME' },
    { key: 'this_week', label: 'THIS WEEK' },
  ] as const;

  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.rule}`, marginBottom: '24px' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '10px 20px',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '15px',
          letterSpacing: '0.16em',
          color: active === t.key ? C.accent : C.muted,
          borderBottom: active === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
          background: 'none',
          border: 'none',
          borderBottom: active === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
          cursor: 'pointer',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

### Pattern 6: Sticky "You" Row

Use `position: sticky; bottom: 0` on the "you" row container. The container must be inside a scrollable element for sticky to work. Since this is a page-length list (not a fixed-height scroll container), "sticky bottom" will work when the list is long enough to scroll — the "you" row sticks to the bottom of the viewport as the user scrolls up through the list.

```typescript
// Source: MDN position:sticky — verified CSS behavior
// Sticky at bottom of scroll view
<div style={{
  position: 'sticky',
  bottom: 0,
  background: C.paper,
  borderTop: `2px solid ${C.rule}`,
  zIndex: 10,
  padding: '12px 16px',
}}>
  {/* Your rank row */}
</div>
```

**Important:** For `position: sticky; bottom: 0` to work on the "you" row, the scrolling container must be the `<html>` / `<body>` (which it is in this app — all pages use `min-height: 100vh` on a full-page div). This pattern will work without a fixed-height wrapper.

### Pattern 7: Podium Visual (Top 3)

Display positions 1, 2, 3 in a horizontal row with the gold (1st) center-elevated, silver (2nd) left, bronze (3rd) right — classic podium "2-1-3" layout. Use Framer Motion for a subtle entrance animation.

```typescript
// Gold/silver/bronze colors from existing tier color system
const PODIUM_COLORS = {
  1: { bg: '#B8860B', label: 'GOLD' },    // C.gold
  2: { bg: '#9A9A9A', label: 'SILVER' },
  3: { bg: '#8B4513', label: 'BRONZE' },
};

// Podium order: [2nd, 1st, 3rd] — center is tallest
const podiumOrder = [entries[1], entries[0], entries[2]];
```

### Pattern 8: Avatar Initial Circle

The existing `Avatar` component (`frontend/src/components/Avatar.tsx`) already implements deterministic color hashing from a name string and shows the first initial. Use it at a small size (e.g., `size={32}`) for each leaderboard row. Since `imageUrl` is not in scope for this phase (deferred), pass only `name`.

```typescript
// Source: frontend/src/components/Avatar.tsx (verified)
<Avatar name={entry.username} size={32} />
```

### Pattern 9: Tier Badge Icon

The `Profile.tsx` uses a text-chip `TierBadge`. The context specifies a small icon/badge colored by tier — not a text chip. Use a small colored circle or shield icon SVG sized ~16px, colored per tier:
- `inform` → C.muted (gray)
- `connected` → `#00657C` (light) / `#03B9D2` (dark)
- `empowered` → `#FF5740`

These colors are from the verified `useTierColor` hook.

### Anti-Patterns to Avoid

- **Direct accounts API calls from frontend for leaderboard data:** The accounts API has no leaderboard endpoint. Calling `GET /api/account/profile/:userId` per-player would be 25 sequential requests — do not do this.
- **Real-time polling:** Context specifies ~5-minute TTL, not live updates. Do not use WebSockets or short polling.
- **Storing leaderboard state in Zustand:** This is page-local UI state. Use component state + the `useLeaderboard` hook. Zustand is for global auth/theme state.
- **Auth-gating the page:** `/leaderboard` must be publicly accessible. Do NOT wrap in `<ProtectedRoute>`.
- **Calendar-week resets:** This Week = rolling 168 hours from now, not a Monday-reset week.

---

## Supabase Schema Investigation

The accounts API shares Supabase project `kxsdzaojfaibhuzmclfq`. CTC already uses `supabaseAdmin` to query the shared database in `profile.ts`. The XP system lives in the `connect` schema (based on the deprecated `connect.credit_gems` RPC and the `get_ctc_xp_history` function).

**What to query for leaderboard:**

The XP history function `get_ctc_xp_history` is available (used in `profile.ts`). For the leaderboard, we likely need to query:
- A `connect.xp_ledger` or `connect.xp_transactions` table (or similar) to get XP by user
- Or a `connect.connected_profiles` or `public.accounts` view that has `total_xp` per user

The ONBOARDING guide mentions `GET /api/account/me` returns `xp.total` and `level` — this data must be stored somewhere in the shared Supabase. The exact table name is **LOW confidence** (not documented in available sources). The planner should add a task to inspect the Supabase schema before writing the query, or ask Chris for the correct table name.

**Known Supabase functions available:**
- `get_ctc_xp_history(p_user_id, p_limit, p_offset)` — per-user XP history (SECURITY DEFINER, verified in profile.ts)

A new function `get_leaderboard(p_tab, p_limit)` may be needed if direct table access from the `connect` schema is blocked by PostgREST (same issue that required `get_ctc_xp_history`). This is an open question.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar initial circle | Custom styled div with letter | `Avatar` component (Avatar.tsx) | Already exists, deterministic color hash, handles edge cases |
| Leaderboard row animation | Custom CSS transition | `framer-motion` `motion.div` with `initial/animate` | Already installed, consistent with rest of app |
| Theme colors | Hardcoded hex | `useTheme()` → `C.*` tokens | Dark/light mode support |
| Tier color logic | Custom if/else | `useTierColor` pattern (copy the color logic, don't use the hook which reads auth state) | Consistent tier colors across app |
| Response caching | Custom Map with timers | `storageFactory.getStorage().set(key, value, ttl)` | Already wired, Redis-backed in production |

**Key insight:** This is a UI-heavy phase. The existing component library (Avatar, useTheme, framer-motion) covers 90% of what's needed. The main engineering challenge is the backend Supabase query to build the ranked list.

---

## Common Pitfalls

### Pitfall 1: Accounts API Has No Leaderboard Endpoint
**What goes wrong:** Developer assumes `GET /api/account/profile/:userId` or some accounts API endpoint returns a ranked list.
**Why it happens:** The ONBOARDING doc describes `GET /api/account/profile/:userId` for "leaderboard use" — but this is a single-user endpoint, not a bulk query.
**How to avoid:** Build leaderboard data in the CTC backend via direct Supabase query. Do NOT attempt 25 sequential profile fetches.
**Warning signs:** Frontend making 25+ requests on page load; "Invalid userId format" errors from accounts API.

### Pitfall 2: Supabase Schema Access for XP Data
**What goes wrong:** Query to `connect.connected_profiles` or `connect.xp_ledger` fails with "schema not exposed" or permission error.
**Why it happens:** The `connect` schema is not exposed via PostgREST (same issue that required the SECURITY DEFINER function workaround in profile.ts).
**How to avoid:** Use `supabaseAdmin` (service role key, bypasses PostgREST). If the table isn't accessible via `supabaseAdmin.from()`, create a SECURITY DEFINER function `get_leaderboard(tab, limit)` and call it via `supabaseAdmin.rpc()`.
**Warning signs:** 404 or "relation does not exist" errors from Supabase when querying connect schema tables.

### Pitfall 3: Sticky "You" Row Not Sticking
**What goes wrong:** `position: sticky; bottom: 0` doesn't work — the "you" row scrolls normally.
**Why it happens:** `position: sticky` requires the parent to be the scroll container and not have `overflow: hidden`. If a parent div has `overflow: hidden`, sticky breaks.
**How to avoid:** The "you" row must be a direct child of the scrollable container (body/html in this app). Do NOT wrap the entire page content in an `overflow: hidden` div.
**Warning signs:** "You" row scrolls away when user scrolls up through the list.

### Pitfall 4: Tab Switch Triggering Redundant Fetches
**What goes wrong:** Every tab switch re-fetches even though data was recently loaded.
**Why it happens:** `useEffect` with `[tab]` dependency re-runs on every switch.
**How to avoid:** Cache results per tab in component state: `const [cache, setCache] = useState<Record<string, LeaderboardResponse>>({})`. On tab switch, check cache before fetching. The backend also caches at 5 minutes, so redundant fetches are cheap, but the UI flicker is bad UX.
**Warning signs:** Loading spinner on every tab click.

### Pitfall 5: "This Week" Calculating Calendar Week Instead of Rolling 168h
**What goes wrong:** "This Week" resets at midnight Sunday instead of being rolling.
**Why it happens:** Developer uses `date_trunc('week', now())` in SQL instead of `now() - interval '7 days'`.
**How to avoid:** Use `WHERE created_at > NOW() - INTERVAL '7 days'` in the SQL query.
**Warning signs:** Tab feels like it resets at week boundary instead of always showing the last 7 days.

### Pitfall 6: XP Gap Display Computing Wrong Delta
**What goes wrong:** "You are X XP away from moving up" shows wrong number.
**Why it happens:** Computing `nextPlayerXp - userXp` but using cached/stale values.
**How to avoid:** The backend should include `gap_to_next: number` in the user rank response, computed server-side from the same query that determines rank.
**Warning signs:** Gap shows 0 or negative numbers.

### Pitfall 7: Podium Layout Breaking on Mobile
**What goes wrong:** Three-column podium is too narrow on small screens.
**Why it happens:** Fixed widths or side-by-side layout assumes wide screen.
**How to avoid:** Use `flexWrap: 'wrap'` fallback or ensure minimum touch target sizes. Podium columns should shrink gracefully. On very small screens (<320px), the username truncation (see Claude's Discretion) becomes important.
**Warning signs:** Usernames overflow podium cards on iPhone SE.

---

## Code Examples

### Backend Leaderboard Route (skeleton)

```typescript
// Source: pattern derived from backend/src/routes/profile.ts + game.ts
import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { storageFactory } from '../config/redis.js';

export const router = Router();

const CACHE_TTL = 300; // 5 minutes in seconds

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const tab = req.query.tab === 'this_week' ? 'this_week' : 'all_time';
  const userId = req.query.userId as string | undefined;
  const cacheKey = `leaderboard:${tab}:${userId ?? 'anon'}`;

  const storage = storageFactory.getStorage();
  const cached = await storage.get(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached as string));
    return;
  }

  try {
    // Call a Supabase RPC function (see open questions for exact table name)
    const { data, error } = await supabaseAdmin.rpc('get_leaderboard', {
      p_tab: tab,
      p_limit: 25,
      p_user_id: userId ?? null,
    });

    if (error) throw error;

    const payload = {
      tab,
      entries: data.entries,        // { rank, userId, username, tier, level, total_xp }[]
      userRank: data.user_rank,      // { rank, level, total_xp, gap_to_next } | null
      generatedAt: new Date().toISOString(),
    };

    await storage.set(cacheKey, JSON.stringify(payload), CACHE_TTL);
    res.json(payload);
  } catch (err) {
    console.error('[leaderboard] query failed:', err);
    res.status(503).json({ error: 'Leaderboard temporarily unavailable' });
  }
});
```

### Frontend LeaderboardRow Component

```typescript
// Source: patterns from frontend/src/pages/Profile.tsx (TierBadge, SectionHeader)
// and frontend/src/components/Avatar.tsx (verified)
function LeaderboardRow({ entry, isYou, C }: {
  entry: LeaderboardEntry;
  isYou: boolean;
  C: ColorTokens;
}) {
  const TIER_COLORS = {
    inform: C.muted,
    connected: '#00657C',
    empowered: '#FF5740',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      background: isYou ? `${C.accent}14` : 'transparent', // accent at ~8% opacity
      borderBottom: `1px solid ${C.ruleLight}`,
    }}>
      {/* Rank */}
      <span style={{ width: '28px', textAlign: 'right', fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '16px', letterSpacing: '0.08em', color: C.muted }}>
        {entry.rank}
      </span>

      {/* Tier badge dot */}
      <div style={{ width: '8px', height: '8px', borderRadius: '50%',
        background: TIER_COLORS[entry.tier], flexShrink: 0 }} />

      {/* Avatar */}
      <Avatar name={entry.username} size={28} />

      {/* Username + level */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '14px',
          color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.username}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px',
          letterSpacing: '0.1em', color: C.muted }}>
          LV {entry.level}
        </div>
      </div>

      {/* Total XP */}
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px',
        letterSpacing: '0.06em', color: C.amber, flexShrink: 0 }}>
        {entry.total_xp.toLocaleString()} XP
      </span>
    </div>
  );
}
```

### ResultsScreen: Add Leaderboard Button

```typescript
// Source: frontend/src/features/game/components/ResultsScreen.tsx lines 404-459
// Add a third button between PLAY AGAIN and HOME:
<button
  onClick={() => navigate('/leaderboard')}
  style={{
    display: 'block',
    width: '100%',
    padding: '14px',
    minHeight: '48px',
    background: 'transparent',
    color: C.muted,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '16px',
    letterSpacing: '0.2em',
    border: `1px solid ${C.rule}`,
    cursor: 'pointer',
    marginBottom: '10px',
  }}
>
  LEADERBOARD
</button>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Per-user profile fetch (25 requests) | Single backend query with pre-ranked data | Required — accounts API has no bulk endpoint |
| Calendar week reset ("This Week") | Rolling 168-hour window | Simpler, always feels live (context decision) |
| Text chip tier badge | Small colored dot/icon per tier | Context decision — matches game aesthetic |
| No leaderboard | `/leaderboard` page | New feature, Phase 67 |

---

## Claude's Discretion Recommendations

The context leaves these to Claude's judgment:

### Username Truncation
The existing app uses `overflow: hidden; text-overflow: ellipsis; whiteSpace: nowrap` on text elements inside flex containers (visible in multiple components). Use this pattern. Truncate usernames in the ranked list rows at the container boundary — no fixed character limit needed. For podium cards (top 3), truncate at ~12 characters max to prevent podium card overflow.

### Podium Visual Design
- **Layout:** 2nd-1st-3rd order (center elevated). 1st place card is ~20px taller than 2nd/3rd.
- **Dimensions:** ~90px wide cards on mobile, 110px on desktop. Avatar size 40px on podium (vs 28px in rows).
- **Animation:** Framer Motion `animate={{ y: [20, 0], opacity: [0, 1] }}` with 0.1s stagger between cards. Respect `useReducedMotion`.
- **Color:** Gold `#B8860B` (C.gold), Silver `#9A9A9A`, Bronze `#8B4513`.

### Loading State
Show a skeleton list of 5 gray rows (using `C.ruleLight` background) while fetching. Use `animate-pulse` Tailwind class. Duration: match `usePlayerXp` pattern — show loading immediately, resolve when fetch completes.

### Error State
Match the `DegradedBanner` pattern — a subdued message in the content area: "Leaderboard temporarily unavailable. Try again later." with C.muted color. Do NOT throw an error boundary for this — it's non-critical.

### Caching Implementation
Use backend-side caching via `storageFactory` (Redis in production, MemoryStorage in dev). This is cleaner than client SWR for an unauthenticated endpoint since all visitors share the same cached data. No client-side cache layer needed — the 5-minute TTL is enforced at the backend.

---

## Open Questions

1. **Supabase XP table name / schema for leaderboard query**
   - What we know: XP data lives in the shared Supabase project. `get_ctc_xp_history` function exists and is SECURITY DEFINER. `GET /api/xp/:userId` on accounts API returns `{ level, total_xp, xp_in_level, xp_to_next_level }`.
   - What's unclear: The exact table name(s) storing total XP per user (could be `connect.connected_profiles.total_xp`, `connect.xp_ledger`, or a computed column). The field name for XP transactions timestamp.
   - Recommendation: **The planner should add a task to inspect the Supabase schema** (`connect` schema tables) before writing the leaderboard SQL query. Alternatively, ask Chris for the correct table. If direct table access is blocked, create a `get_leaderboard` SECURITY DEFINER function.

2. **Whether the accounts API will add a `/api/xp/leaderboard` endpoint**
   - What we know: No such endpoint exists today (verified by probing the live API). The `/api/xp/:userId` route pattern would conflict with a `/api/xp/leaderboard` path.
   - What's unclear: Whether Chris plans to build this for other platform apps (which would make it available to CTC too).
   - Recommendation: Don't block on this. Build the CTC backend leaderboard route now. If accounts API adds one later, it's an easy swap.

3. **Per-user rank for "you" row when outside top 25**
   - What we know: The "you" row needs the user's global rank, level, and XP. Level and XP come from the existing `GET /api/xp/:userId` endpoint (already used in `usePlayerXp`). Global rank requires counting users with higher total XP.
   - What's unclear: Whether a rank function exists in Supabase or needs to be built.
   - Recommendation: Include `userId` as an optional query param on `GET /api/leaderboard?tab=all_time&userId=<uuid>`. Backend runs a rank calculation (e.g., `SELECT COUNT(*) + 1 WHERE total_xp > userTotalXp`) and includes it in the response.

---

## Sources

### Primary (HIGH confidence)
- `C:/Project Test/frontend/src/` — Direct codebase inspection: package.json, App.tsx, Header.tsx, useTheme.ts, useTierColor.ts, Avatar.tsx, ResultsScreen.tsx, usePlayerXp.ts, authStore.ts, accountsApi.ts, types/auth.ts
- `C:/Project Test/backend/src/` — Direct codebase inspection: server.ts, routes/profile.ts, routes/game.ts, config/redis.ts, services/progressionService.ts
- `C:/Project Test/ONBOARDING-CTC.md` — v1.4 accounts API reference (read in full)
- Live API probing: `https://ev-accounts-api.onrender.com` — confirmed no leaderboard endpoint exists; `/api/account/profile/:userId` returns single-user profile; `/api/xp/:userId` returns individual XP data

### Secondary (MEDIUM confidence)
- MDN Web Docs (`https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position`) — `position: sticky` with `bottom: 0` behavior verified

### Tertiary (LOW confidence)
- WebSearch results on leaderboard patterns — not used directly; codebase inspection drove all decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json directly
- Accounts API capabilities: HIGH — verified by probing live endpoint
- Architecture patterns: HIGH — derived from existing codebase patterns
- Supabase schema for leaderboard query: LOW — table name unknown, must inspect before writing query
- Sticky row CSS behavior: MEDIUM — MDN verified, but untested in this app's specific DOM structure

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack; accounts API endpoint status should be re-verified if planning is delayed)
