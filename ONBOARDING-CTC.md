# Civic Trivia Championships → Empowered Accounts Integration Guide

**Audience:** Claude working in the `empowered-ctc` codebase
**Accounts API:** `https://ev-accounts-api.onrender.com`
**Last updated:** 2026-03-16 (v1.4 — corrected headers and field names)

---

## What Accounts Provides to CTC

The Empowered Accounts system is the shared identity and progression layer for the entire Empowered Vote platform. CTC does not manage its own user records — every CTC user **is** an Empowered Accounts user, identified by the same UUID from the shared Supabase project.

What accounts owns that CTC uses:

| Concern | Owned By | How CTC Accesses It |
|---------|----------|---------------------|
| User identity (UUID, email, tier) | Accounts | `GET /api/account/me` with Bearer token |
| XP progression | Accounts | `POST /api/xp/award` with service key |
| Gem balance (yellow) | Accounts | `POST /api/gems/award` with service key |
| Level calculation | Accounts | Returned in `GET /api/account/me` as `xp.level` |

---

## Authentication

### User-Scoped Requests (on behalf of a logged-in user)

CTC receives a Supabase JWT when a user authenticates. Pass it as a Bearer token on any accounts API call:

```typescript
const response = await fetch('https://ev-accounts-api.onrender.com/api/account/me', {
  headers: {
    'Authorization': `Bearer ${supabaseAccessToken}`,
  },
});
```

The token comes from `supabase.auth.getSession()` → `session.access_token`. It is a standard Supabase JWT — no conversion needed.

### Service-Key Requests (server-to-server)

XP and gem awards are server-to-server calls using a shared secret. Do NOT expose service keys to the client.

```typescript
// XP award — use TRIVIA_SERVICE_KEY
const response = await fetch('https://ev-accounts-api.onrender.com/api/xp/award', {
  method: 'POST',
  headers: {
    'X-Service-Key': process.env.TRIVIA_SERVICE_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
});

// Gem award — use a separate key from GEMS_SERVICE_KEYS
const response = await fetch('https://ev-accounts-api.onrender.com/api/gems/award', {
  method: 'POST',
  headers: {
    'X-Service-Key': process.env.TRIVIA_GEMS_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
});
```

**Key setup:** Chris (the operator) sets matching key values in both CTC's environment and the accounts API environment. CTC does not generate or register keys — just use the values Chris provides.

---

## XP Awards

### Endpoint

```
POST /api/xp/award
X-Service-Key: <TRIVIA_SERVICE_KEY>
Content-Type: application/json
```

### Request Body

```typescript
{
  user_id: string;          // Supabase UUID of the user
  source: string;           // must be 'civic_trivia_championship_score'
  amount: number;           // positive integer
  idempotency_key: string;  // unique per award event — prevents double-award on retry
  metadata?: object;        // optional — include game/session context for the ledger
}
```

### Response

```typescript
// 200 — awarded (or duplicate)
{
  total_xp: number;
  level: number;
  is_duplicate: boolean;  // true if idempotencyKey was already used — no double-award
}

// 422 — source not permitted for this key
{ error: 'SOURCE_NOT_PERMITTED', message: "This service key is not authorized to award source '...'" }

// 401 — invalid or missing key
{ error: 'Missing or invalid X-Service-Key' }
```

### Idempotency

Always include a stable `idempotency_key` derived from the game event. If a network failure causes you to retry, the same key returns `is_duplicate: true` rather than awarding XP twice.

```typescript
const idempotency_key = `ctc-game-${gameId}-${userId}`;
```

### Permitted Source

The `TRIVIA_SERVICE_KEY` is authorized for exactly one source: `'civic_trivia_championship_score'`. Passing any other source returns 422.

### Example

```typescript
async function awardGameXp(userId: string, gameId: string, score: number) {
  const xpAmount = Math.floor(score / 10); // your XP calculation

  const res = await fetch(`${EMPOWERED_ACCOUNTS_API_URL}/api/xp/award`, {
    method: 'POST',
    headers: {
      'X-Service-Key': process.env.TRIVIA_SERVICE_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      source: 'civic_trivia_championship_score',
      amount: xpAmount,
      idempotency_key: `ctc-game-${gameId}-${userId}`,
      metadata: { gameId, score },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('[xp/award] failed:', err);
    return;
  }

  const data = await res.json();
  // data.level — user's new level (show a level-up toast if it changed)
  // data.is_duplicate — skip toast if true
}
```

---

## Gem Awards

CTC awards **yellow gems** for gameplay. Yellow gems are the Inform-tier currency — earned through civic engagement, spent in future features.

### Migration Required: Direct RPC → API Endpoint

CTC previously called `connect.credit_gems` via direct RPC. **That path is deprecated.** The v1.3 gem system requires going through the `POST /api/gems/award` endpoint. This gives CTC idempotency, per-key authorization, and a proper audit trail.

**Old pattern (remove this):**
```typescript
await supabase.schema('connect').rpc('credit_gems', {
  p_user_id: userId,
  p_amount: amount,
  p_source: 'ctc',
});
```

**New pattern:**
```typescript
await fetch(`${EMPOWERED_ACCOUNTS_API_URL}/api/gems/award`, {
  method: 'POST',
  headers: {
    'X-Service-Key': process.env.TRIVIA_GEMS_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: userId,
    gem_type: 'yellow',
    amount,
    idempotency_key: `ctc-gems-${gameId}-${userId}`,
  }),
});
```

### Endpoint

```
POST /api/gems/award
X-Service-Key: <TRIVIA_GEMS_KEY>
Content-Type: application/json
```

### Request Body

```typescript
{
  user_id: string;          // Supabase UUID of the user
  gem_type: 'yellow';       // CTC is authorized for yellow only
  amount: number;           // positive integer
  idempotency_key: string;  // unique per award event
}
```

### Response

```typescript
// 200
{
  gem_type: 'yellow';
  amount: number;
  new_balance: number;    // user's new yellow gem balance
  is_duplicate: boolean;
}

// 422 — gem type not permitted for this key
{ error: 'FORBIDDEN_GEM_TYPE' }
```

### Key Configuration (GEMS_SERVICE_KEYS)

The accounts API reads `GEMS_SERVICE_KEYS` as a JSON object mapping key → permitted gem types:

```json
{
  "<TRIVIA_GEMS_KEY_VALUE>": ["yellow"]
}
```

Chris sets this in the accounts API's Render environment. CTC only needs the key value — the `["yellow"]` scope is configured on the accounts side.

---

## Reading User State

To show a user their current XP, level, and gem balance:

```
GET /api/account/me
Authorization: Bearer <userJwt>
```

Response shape (Connected user):

```typescript
{
  id: string;
  tier: 'inform' | 'connected' | 'empowered';
  xp: {
    total: number;
    level: number;
    xp_in_level: number;    // XP earned within current level
    xp_to_next_level: number | null;  // null at max level
  };
  gems: {
    yellow: number;
    blue: number;
    red: number;
  };
  completed_onboarding: boolean;
  // ... other fields
}
```

**XP level thresholds** (for display purposes):
- Levels 1–3: 2,000 XP each
- Levels 4–9: 3,000 XP each
- Levels 10–29: 4,000 XP each
- Levels 30+: 5,000 XP each

`xp_in_level` and `xp_to_next_level` are already calculated — use them directly for progress bars. No need to reimplement the threshold logic.

**Inform-tier users** (no `connected_profiles` row) will have `xp` and `gems` as `null`. Guard accordingly:

```typescript
const xpLevel = meData.xp?.level ?? 0;
const yellowGems = meData.gems?.yellow ?? 0;
```

---

## User Identity

CTC and Accounts share the same Supabase project. A user's UUID is identical in both systems — no mapping required. The JWT CTC receives from Supabase Auth is the same JWT that Accounts verifies.

**Do not store user identity redundantly in CTC.** If you need to know a user's tier or display name, call `GET /api/account/me`.

---

## Public Profile

To display another user's profile (e.g., leaderboard):

```
GET /api/account/profile/:userId
```

No authentication required. Returns:

```typescript
{
  username: string;
  tier: 'inform' | 'connected' | 'empowered';
  level: number;
  total_xp: number;
  selected_topic_ids: string[];
  empowered_profile?: { ... };  // present for Empowered users
}
```

No gems, no tolerance_rating, no location. Safe to display publicly.

---

## Account Creation

CTC should **not** implement its own signup flow. Direct users to:

```
https://accounts.empowered.vote/signup?redirect=https://ctc.empowered.vote/play
```

After creating a Connected Account and confirming their email, users are redirected back to CTC. The `redirect` param only accepts `*.empowered.vote` domains — it will be ignored for external URLs.

---

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Invalid or missing Bearer token | Prompt re-login (user token) or check key config (service key) |
| 403 | Insufficient tier for this operation | Show upgrade prompt |
| 422 | Validation error (wrong source, wrong gem type, etc.) | Fix the request — do not retry |
| 429 | Rate limited | Back off and retry with exponential delay |
| 5xx | Server error | Log and retry with idempotency key — safe to retry |

Always include `idempotency_key` on award calls. 5xx responses are safe to retry because a duplicate key returns 200 with `is_duplicate: true` rather than double-awarding.

---

## Environment Variables CTC Needs

| Variable | Purpose | Value Source |
|----------|---------|--------------|
| `EMPOWERED_ACCOUNTS_URL` | Base URL for user-scoped calls (`GET /api/account/me`, etc.) | `https://ev-accounts-api.onrender.com` |
| `EMPOWERED_ACCOUNTS_API_URL` | Base URL for service-key award calls (XP, gems) | `https://ev-accounts-api.onrender.com` |
| `TRIVIA_SERVICE_KEY` | XP award auth | Chris provides; must match accounts API env |
| `TRIVIA_GEMS_KEY` | Gem award auth | Chris provides; must match accounts API `GEMS_SERVICE_KEYS` |

---

## What CTC Does NOT Own

- User account creation or deletion
- Password management
- Tier promotion or demotion
- XP ledger or gem ledger reads (beyond what `/api/account/me` returns)
- Tolerance Rating (internal to accounts, never exposed)

If CTC needs something from accounts that isn't in this doc, file a feature request against the `empowered-accounts` repo and tag it for Chris.
