# Phase 54: XP Game UI (Start + End Screen) - Research

**Researched:** 2026-03-05
**Domain:** React UI / Framer Motion / XP data integration (frontend-only phase)
**Confidence:** HIGH

## Summary

Phase 54 is a pure frontend implementation phase. The backend XP award logic (Phase 53) is complete. All data flows, component locations, and API contracts have been confirmed by reading source code directly. No external library research was needed — this phase uses tools already in the project.

The start screen is the `idle` phase render path inside `GameScreen.tsx`. The end screen is `ResultsScreen.tsx`. Both are standalone components. The existing `ResultsScreen` already has scaffolding for XP display — it animates `+XP` using `framer-motion`'s `animate()` — but it reads a `progression.xpEarned` field that does NOT exist in the backend response. The backend returns `progression.xp` (an `XpAwardResult` object). This is a type mismatch that Phase 54 must fix.

Connected vs. non-Connected status is determined by `useAuthStore((s) => s.tier)` — tier `'connected'` or `'empowered'` means Connected. The user's UUID is available from `useAuthStore((s) => s.user?.id)`. The start-screen XP data must be fetched from the Empowered Accounts API at `GET /api/xp/:userId` (a public endpoint that requires no auth header). The CTC backend does NOT have a proxy for this — the frontend calls the Accounts API directly via `VITE_EMPOWERED_ACCOUNTS_URL`.

**Primary recommendation:** Fix the `Progression` type mismatch first (align types with actual backend shape), then build XP strip and level-up overlay as new components, then wire into the existing start/end screen render paths.

---

## Standard Stack

This phase uses only existing project dependencies — no new installs required.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.34.0 | All animations | Already used throughout GameScreen and ResultsScreen |
| tailwindcss | ^3.4.1 | All styling | Only CSS approach in this project |
| zustand | ^4.4.7 | Auth state | Already provides tier and user.id |
| react | ^18.2.0 | Component framework | Project standard |

### No New Dependencies Needed

Framer-motion covers the pop/flash XP animation, the full-screen level-up overlay, and the progress bar animation. CSS transitions via Tailwind handle the progress bar fill. The `useReducedMotion` hook is already implemented and used in both GameScreen and ResultsScreen — must be respected in all new animations.

**Installation:** None required.

---

## Architecture Patterns

### Recommended New Files

```
frontend/src/
├── features/game/components/
│   ├── XpStrip.tsx           # Start screen: level + progress bar + XP numbers
│   ├── XpReveal.tsx          # End screen: +XP award with pop animation + updated bar
│   └── LevelUpOverlay.tsx    # Full-screen level-up modal (auto-dismisses 2s / tap)
├── hooks/
│   └── usePlayerXp.ts        # Fetches GET /api/xp/:userId on start screen mount
└── types/game.ts             # Update Progression type to match backend
```

### Pattern 1: Start Screen — Idle Phase in GameScreen.tsx

The start screen is the `state.phase === 'idle'` render branch inside `GameScreen.tsx` (lines 307–327). Currently it renders a full-page gradient with a centered title and "Quick Play" button. The XP strip goes **below** the existing layout (after the Play button, not inside the top bar).

The top bar (score, timer, collection, progress dots) is only rendered during active gameplay phases, NOT in the idle phase. So the idle phase renders entirely separately — there is no "top bar" on the start screen to worry about. The XP strip is a new UI below the game title and Play button.

**Current idle phase render:**
```tsx
// Source: frontend/src/features/game/components/GameScreen.tsx lines 307-327
if (state.phase === 'idle') {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-8">
          Civic Trivia Challenge
        </h1>
        <button onClick={startGame} ...>Quick Play</button>
      </motion.div>
    </div>
  );
}
```

The new XP strip appears below the Play button, inside the `motion.div`, as a separate section.

**How to detect Connected:** Read `useAuthStore((s) => s.tier)` — `'connected'` or `'empowered'` means Connected. User UUID is `useAuthStore((s) => s.user?.id)`.

### Pattern 2: Fetching Start-Screen XP (usePlayerXp hook)

The Empowered Accounts API `GET /api/xp/:userId` is a **public endpoint** — no auth header needed. It is called directly from the frontend using `ACCOUNTS_API_URL` from `accountsApi.ts`.

```typescript
// Source: accountsApi.ts shows ACCOUNTS_API_URL = VITE_EMPOWERED_ACCOUNTS_URL || 'http://localhost:3001'
// GET /api/xp/:userId - public, no auth
// Response: { level: number, total_xp: number, xp_in_level: number, xp_to_next_level: number }
// 404 = user not Connected (should show link prompt instead)
```

The hook should:
1. Only fire when tier is `'connected'` or `'empowered'` AND `user.id` is defined
2. Fetch on mount, return `{ data, loading, error }` shape
3. On 404: return null data (non-Connected path, show link prompt)
4. On other error: return null data (graceful degradation, don't block gameplay)

Pre-game level must be stored (in a ref or state) so the end screen can detect level-up by comparing `priorLevel` to `progression.xp.level`.

### Pattern 3: End Screen — Fixing ResultsScreen.tsx

`ResultsScreen.tsx` already has XP animation code but reads from `result.progression.xpEarned` — a field that does NOT exist in the actual backend response. The backend returns:

```typescript
// Actual backend shape (from progressionService.ts XpAwardResult):
progression: {
  gemsEarned: number,
  gemsConfirmed: boolean,
  xp: {
    confirmed: boolean,
    isDuplicate?: boolean,
    transactionId?: string,
    amount?: number,       // XP awarded this game
    level?: number,        // new level after award
    totalXp?: number,
    xpInLevel?: number,
    xpToNextLevel?: number,
    error?: string,
  } | null,
  stats: { ... } | null,
}
```

The frontend `Progression` type in `game.ts` is:
```typescript
// Current (incorrect):
export type Progression = { xpEarned: number; gemsEarned: number; }
```

This must be updated to reflect the actual backend shape so the end screen can access `progression.xp.amount`, `progression.xp.level`, `progression.xp.isDuplicate`, etc.

### Pattern 4: Level-Up Overlay Pattern (modeled on CelebrationEffects)

The existing `CelebrationEffects.tsx` is the closest model for the level-up overlay — it:
- Uses `AnimatePresence` + `motion.div` with `initial/animate/exit`
- Is `fixed` positioned, `z-40`, `pointer-events-none`
- Auto-dismisses after 2 seconds
- Shows a label text with Tailwind styling

The level-up overlay differs: it needs `pointer-events-auto` (tap-to-dismiss), full-screen coverage, and a 2-second auto-dismiss with a `useEffect` + `setTimeout`. The design is Claude's discretion — recommend a clean centered card on a semi-transparent dark overlay (`bg-black/70`), no confetti (that's reserved for perfect games).

### Pattern 5: Progress Bar

Use a Tailwind `div` with percentage-width transition:
```tsx
// Standard pattern in this codebase
const progress = xp_in_level / (xp_in_level + xp_to_next_level); // 0.0–1.0
<div className="h-2 bg-slate-700 rounded-full overflow-hidden">
  <div
    className="h-full bg-teal-500 rounded-full transition-all duration-700"
    style={{ width: `${Math.round(progress * 100)}%` }}
  />
</div>
```

No library needed — CSS transition is sufficient. The `framer-motion` `animate()` approach (used for score animation in ResultsScreen) is overkill for a progress bar.

### Pattern 6: Non-Connected Link Prompt

The prompt text "Link account to earn XP" must navigate to the Empowered login/connection flow. The URL is `ACCOUNTS_WEB_URL` from `accountsApi.ts` (env: `VITE_EMPOWERED_ACCOUNTS_WEB_URL`, default `https://ev-accounts.onrender.com`).

```tsx
// Same pattern as Profile.tsx line 159-171
<a href={ACCOUNTS_WEB_URL} target="_blank" rel="noopener noreferrer"
   className="text-slate-400 text-sm hover:text-slate-300 transition-colors">
  Link account to earn XP
</a>
```

No ghost XP preview. No aggressive styling. Low-pressure per the "no dark patterns" principle.

### Anti-Patterns to Avoid

- **Don't create a new XP fetch in ResultsScreen.** The XP data already arrives via `result.progression.xp` from the existing `GET /api/game/results/:sessionId` call. No second fetch needed.
- **Don't call GET /api/xp/:userId after the game.** It's only needed for the start screen. The end screen uses the award response data.
- **Don't skip the Progression type fix.** If the type stays wrong, TypeScript will not catch the mismatch and the XP display will silently show 0.
- **Don't animate the level-up overlay with framer-motion scale if reducedMotion is true.** Use `useReducedMotion()` to show a static version instead.
- **Don't block game start while XP is loading.** The XP fetch is fire-and-forget — if it hasn't resolved, show a loading skeleton for the XP strip but enable the Play button immediately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation framework | Custom CSS keyframes | framer-motion (already installed) | Full project consistency, AnimatePresence for mount/unmount |
| Auth state | New auth context | `useAuthStore` from zustand | Already provides `tier`, `user.id`, `isAuthenticated` |
| Reduced-motion detection | `window.matchMedia` calls | `useReducedMotion()` hook | Already implemented, used everywhere |
| API base URL | Hardcoded strings | `ACCOUNTS_API_URL` from accountsApi.ts | Already env-var-driven |
| XP level calculation | Frontend level math | Use values returned by API | `level`, `xpInLevel`, `xpToNextLevel` all come from the API — no math needed |

**Key insight:** All infrastructure (animation, auth, API URLs, motion preference) already exists. This phase wires them together.

---

## Common Pitfalls

### Pitfall 1: The Progression Type Mismatch
**What goes wrong:** `ResultsScreen.tsx` reads `result.progression.xpEarned` which doesn't exist in the actual backend response. The backend puts XP data in `result.progression.xp.amount`. Existing XP display was already broken before Phase 54.
**Why it happens:** The `Progression` type in `game.ts` was written before the XP backend was designed, and never updated to match.
**How to avoid:** Update `Progression` type in `game.ts` to match the actual backend shape. Update `useGameState.ts`'s fetch of `progression` (it casts as `Progression` — will need the new type). Update `ResultsScreen.tsx` to read `result.progression.xp.amount` for XP.
**Warning signs:** `displayXP` stays at 0 or `result.progression.xpEarned` is `undefined`.

### Pitfall 2: Calling GET /api/xp/:userId When User is Not Connected
**What goes wrong:** A 404 from the Accounts API (user not Connected) throws an error, XP panel breaks.
**Why it happens:** The endpoint returns 404 for non-Connected users — it's by design, not a network error.
**How to avoid:** Check tier BEFORE making the fetch. Only call `GET /api/xp/:userId` if `tier === 'connected' || tier === 'empowered'`. Treat 404 as "not connected", not as an error.
**Warning signs:** Error state on XP panel for Inform-tier users.

### Pitfall 3: Pre-Game Level Not Stored for Level-Up Detection
**What goes wrong:** Level-up cannot be detected because the pre-game level was never saved before the game started.
**Why it happens:** The award response gives you `level` (the NEW level) but not the old level. Level-up detection requires comparing old to new.
**How to avoid:** Store `priorLevel` from the start-screen XP fetch in a `useRef` or state in `useGameState` or `Game.tsx`. Pass it to `ResultsScreen` for comparison.
**Warning signs:** Level-up overlay never shows, or always shows.

### Pitfall 4: is_duplicate Treated as an Award
**What goes wrong:** If `progression.xp.isDuplicate === true`, the game was already recorded — no new XP was awarded. Showing the reward animation would be incorrect.
**Why it happens:** The idempotency system returns the original transaction data even on duplicate, so `amount` and `level` are still populated.
**How to avoid:** Check `progression.xp.isDuplicate` FIRST. If true: show neutral grey message (no animation, no award display). If false: show normal reward animation.
**Warning signs:** Duplicate games show the XP pop animation.

### Pitfall 5: XP Fetch Blocks the Play Button
**What goes wrong:** User can't start game while XP is still loading.
**Why it happens:** Tying game start to XP data resolution.
**How to avoid:** XP fetch is independent of game start. Show loading skeleton in the XP strip, but the Play button works immediately. If the game starts before XP loads, the start-screen XP data is just unavailable (pre-game level detection fails gracefully — no level-up overlay, which is acceptable).

### Pitfall 6: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY Not in .env
**What goes wrong:** Token refresh fails, users can't stay logged in.
**Why it happens:** These vars are used in `accountsApi.ts` `exchangeRefreshToken()` to call the Supabase native refresh endpoint. They may not be set in the frontend `.env`.
**How to avoid:** This was flagged as a concern in Phase 53 context. Phase 54 doesn't add new auth code, so this is not a Phase 54 blocker — but verify they're set if testing auth-dependent flows.
**Warning signs:** Auth state lost after token expiry.

---

## Code Examples

### Reading Connected Tier from Auth Store
```typescript
// Source: frontend/src/store/authStore.ts + frontend/src/types/auth.ts
import { useAuthStore } from '../../../store/authStore';

const tier = useAuthStore((s) => s.tier);
const userId = useAuthStore((s) => s.user?.id);

const isConnected = tier === 'connected' || tier === 'empowered';
```

### Fetching Start-Screen XP
```typescript
// Source: frontend/src/services/accountsApi.ts (ACCOUNTS_API_URL pattern)
// GET /api/xp/:userId — public, no auth header needed
// Response: { level, total_xp, xp_in_level, xp_to_next_level }
const res = await fetch(`${ACCOUNTS_API_URL}/api/xp/${userId}`);
if (res.status === 404) return null; // not Connected
if (!res.ok) throw new Error(`XP fetch failed: ${res.status}`);
return res.json();
```

### Progress Bar Percentage
```typescript
// Source: civic-trivia-championship-xp-integration.md section 5
const progress = xp_in_level / (xp_in_level + xp_to_next_level); // 0.0–1.0
// Display: "1,240 / 2,000 XP" where 1240 = xp_in_level, 2000 = xp_in_level + xp_to_next_level
const xpNeeded = xp_in_level + xp_to_next_level;
```

### XP Pop Animation (Framer Motion)
```tsx
// Source: framer-motion pattern used in GameScreen.tsx (timeout flash) and ResultsScreen.tsx
// Scale + fade pop for +XP display
<AnimatePresence>
  {showXp && (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      +{xpAmount} XP
    </motion.div>
  )}
</AnimatePresence>
```

### Level-Up Overlay Auto-Dismiss Pattern
```tsx
// Source: CelebrationEffects.tsx (2-second auto-dismiss pattern)
useEffect(() => {
  if (!showLevelUp) return;
  const timeout = setTimeout(() => setShowLevelUp(false), 2000);
  return () => clearTimeout(timeout);
}, [showLevelUp]);

// Tap to dismiss: onClick={() => setShowLevelUp(false)} on the overlay div
```

### Detecting Level-Up on End Screen
```typescript
// Source: civic-trivia-championship-xp-integration.md section 7
const didLevelUp = progression.xp?.level > priorLevel;
// priorLevel = value stored from GET /api/xp/:userId before the game started
```

### Updated Progression Type (fix required)
```typescript
// Source: backend progressionService.ts XpAwardResult interface + game.ts route
// Replace the current Progression type in game.ts:
export type XpResult = {
  confirmed: boolean;
  isDuplicate?: boolean;
  amount?: number;       // XP awarded this game — use for "+{amount} XP" display
  level?: number;        // new level after award — use for level-up detection
  totalXp?: number;
  xpInLevel?: number;   // current position in level — use for progress bar
  xpToNextLevel?: number; // remaining XP to next level — use for progress bar
  error?: string;
};

export type Progression = {
  gemsEarned: number;
  gemsConfirmed: boolean;
  xp: XpResult | null;
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Progression.xpEarned` (frontend type) | `Progression.xp.amount` (backend shape) | Phase 53 (just shipped) | Type fix required in Phase 54 |
| No XP on game UI | XP on start + end screens | Phase 54 (this phase) | New components needed |

**Deprecated/outdated:**
- `Progression.xpEarned: number` — never matched the backend. Fix in Phase 54.
- `Progression.gemsEarned: number` — exists in backend but as a separate top-level field alongside `xp`. Current frontend type matches this field correctly.

---

## Open Questions

1. **Where to store priorLevel for level-up detection**
   - What we know: `useGameState.ts` is where game lifecycle state lives; `Game.tsx` is the orchestrator; `ResultsScreen` receives `result` but not XP metadata.
   - What's unclear: Whether to store priorLevel in `useGameState` (would require changing its return type and passing it down) or in `Game.tsx` as local state.
   - Recommendation: Store `priorLevel` in `Game.tsx` as `useState<number | null>`. Set it from the start-screen XP fetch (new hook called from `Game.tsx`). Pass it to `ResultsScreen` as a new prop.

2. **Where to call GET /api/xp/:userId**
   - What we know: It must be called when the game is in `idle` phase and the user is Connected. The data is needed for the start-screen display AND for pre-game level storage.
   - Recommendation: Create `usePlayerXp(userId: string | undefined)` hook. Call it from `Game.tsx`. Pass loading/data state down to `GameScreen` for the idle phase render. This keeps `GameScreen` a pure display component.

3. **Gem display on end screen in Phase 54 scope**
   - What we know: `ResultsScreen` already renders `+{displayGems}` alongside `+{displayXP}`. The gem display reads `result.progression.gemsEarned` which DOES exist in the backend response (as a top-level field on progression).
   - What's unclear: Whether Phase 54 should also update the gems display to match the new Progression type shape, or leave it.
   - Recommendation: Update both XP and gems together when fixing the Progression type — they're in the same type definition. The gems field `gemsEarned` exists as `progression.gemsEarned` in both old and new shape, so the fix is minimal.

4. **VITE_EMPOWERED_ACCOUNTS_URL in .env**
   - What we know: `accountsApi.ts` uses `VITE_EMPOWERED_ACCOUNTS_URL` for the base URL. GET /api/xp/:userId is called against this URL.
   - What's unclear: Whether this env var is set in the frontend `.env` file.
   - Recommendation: Verify `.env` has `VITE_EMPOWERED_ACCOUNTS_URL` set. If missing, the XP fetch silently goes to `http://localhost:3001` which will 404 in production.

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `frontend/src/features/game/components/GameScreen.tsx` — start screen idle phase structure confirmed
- Direct source code read: `frontend/src/features/game/components/ResultsScreen.tsx` — end screen structure, existing XP animation, Progression field access
- Direct source code read: `frontend/src/features/game/hooks/useGameState.ts` — game lifecycle, progression fetch, priorLevel storage gap
- Direct source code read: `frontend/src/types/game.ts` — Progression type (confirmed mismatch)
- Direct source code read: `backend/src/services/progressionService.ts` — XpAwardResult interface, actual backend shape
- Direct source code read: `backend/src/routes/game.ts` — actual progression response shape confirmed
- Direct source code read: `frontend/src/store/authStore.ts` — tier field available, user.id available
- Direct source code read: `frontend/src/types/auth.ts` — Tier type: `'inform' | 'connected' | 'empowered'`
- Direct source code read: `frontend/src/services/accountsApi.ts` — ACCOUNTS_API_URL pattern for XP fetch
- Direct source code read: `frontend/package.json` — framer-motion ^12.34.0, tailwindcss ^3.4.1 confirmed

### Secondary (HIGH confidence — official project docs)
- `civic-trivia-championship-xp-integration.md` — GET /api/xp/:userId response shape, level-up detection pattern, progress bar formula
- `empowered-accounts-integration-guide.md` — Connected tier definition, Accounts API URLs

### Not Needed
- Context7 / WebSearch not required — all findings come from the project's own source code and official integration docs.

---

## Metadata

**Confidence breakdown:**
- Component locations and structure: HIGH — read from source
- Progression type mismatch: HIGH — confirmed by comparing backend XpAwardResult to frontend Progression type
- XP API shape: HIGH — confirmed from both progressionService.ts and the XP integration doc
- Animation patterns: HIGH — read from existing components (CelebrationEffects, ResultsScreen, GameScreen)
- Connected tier detection: HIGH — read from authStore and auth types
- priorLevel storage approach: MEDIUM — recommended pattern, not yet implemented anywhere

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable codebase — no fast-moving dependencies involved)
