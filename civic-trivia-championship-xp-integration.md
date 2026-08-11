# Empowered Accounts — XP Integration Context
### For: Civic Trivia Championship (CTC)

This document is a complete integration reference for the Civic Trivia Championship repo. It covers platform context, account architecture, XP system design, the full API contract, service key setup, error handling, and integration patterns for start and end-of-game screens.

Read this before writing any integration code.

---

## 1. Platform Context

### What is Empowered Vote?

Empowered Vote is a civic platform solving two problems: political polarization and civic impotence. It exists to help citizens find shared facts, unpack shared values, and create shared solutions. Every feature must be able to answer: *does this serve the user, or is it designed at their expense?*

The platform is organized into three pillars:

- **Inform** — Finding Shared Facts. Audience: everyone, no account required. Optimize for maximum reach. Uses game mechanics to make civic information engaging. Single-player experiences.
- **Connect** — Unpacking Shared Values. Authenticated, pseudonymous community. Identity-verified users with one voice per person.
- **Empower** — Creating Shared Solutions. Connected users who take on civic leadership. Full legal-name transparency.

**Civic Trivia Championship lives in the Inform Pillar.** Its primary audience is everyone. XP, however, is earned by and attributed to Connected-tier accounts — the game detects whether a player has a linked account and awards XP accordingly.

### The Bloomington Pilot

The v1 launch pilot is Bloomington, Indiana (Monroe County). Alpha cohort is small, invite-only — likely Indiana University students and local civic participants. Treat the user base as civic-minded early adopters, not casual gamers.

### Design Constraints That Affect CTC

- **No pay-to-win.** Gems and XP are never purchasable. Never suggest or build mechanics that let money substitute for participation.
- **Equity of Opportunity.** It will never cost money to connect or empower an account. If CTC awards XP for playing, it must award it for playing — not for paying.
- **Value-driven architecture.** System goals must align with user goals. Analytics, engagement loops, and game mechanics should serve the player's civic growth, not exploit attention.
- **Privacy by default.** Collect only what is necessary.

---

## 2. Account Architecture

### Three Tiers

Empowered Accounts uses additive child tables — not status flags. Tier is determined by the *presence of a child record*, not a flag on a wide table.

```
auth.users                       ← Supabase Auth
    └── public.users             ← platform identity extension
        ├── connect.connected_profiles   ← exists when Connected (verified)
        └── empower.empowered_profiles   ← exists when Empowered (civic leader)
```

| Tier | What it means | XP endpoints available |
|------|--------------|----------------------|
| **Inform** (no child record) | Unverified. Can play CTC. Cannot receive XP. | None |
| **Connected** | Identity-verified. Pseudonymous. One voice per person. | All XP endpoints |
| **Empowered** | Connected + civic leader. Legal name public. | All XP endpoints |

**XP is a Connected-tier feature.** Any call to award XP for a user without a `connected_profiles` row returns 404.

### User Identity

CTC needs the player's Empowered Accounts `user_id` — a UUID. This comes from your auth integration with Empowered Accounts (typically stored in session after the player links/logs into their account). The user must be Connected tier.

Anonymous (unlinked) players can play CTC but will not receive XP. Design your UI to surface a "link your account to earn XP" prompt for anonymous players.

### Display Names

Connected users use **pseudonyms** (`connected_profiles.display_name`). Legal names are only public for Empowered users. Always use the pseudonym in game-facing UI.

---

## 3. XP System Design

### What XP Is

XP (Experience Points) is an append-only ledger of civic participation across all Empowered Vote features. It is earned by playing games (CTC, Validation Quests), completing activities, and receiving admin gifts. Every transaction is permanently recorded with its source, amount, and optional metadata.

XP is a **cross-feature shared system**. CTC is one of several award sources. The level a player sees in CTC is their platform-wide level, earned across all Empowered Vote features.

### Ledger Architecture

- **Append-only.** No XP row is ever updated or deleted. The ledger is a permanent record.
- **Atomic.** The `award_xp` Postgres function acquires an advisory lock, inserts the ledger row, and updates the denormalized balance on `connected_profiles` in a single transaction. There is no multi-step JS logic CTC needs to worry about.
- **Denormalized balance.** `connected_profiles.total_xp` and `current_level` are kept in sync by the RPC — O(1) balance reads, no ledger sum queries.
- **Idempotency enforced at the database layer.** Duplicate `idempotency_key` values return the original transaction with `is_duplicate: true`. No second ledger row is ever inserted. CTC can safely retry on network failure.

### Level Scale

Levels are computed from `total_xp` via a pure arithmetic function. The thresholds are **locked** — they will not change post-launch.

| Levels | XP per level | Cumulative XP range |
|--------|-------------|-------------------|
| 1–3 | 2,000 XP | 0 – 5,999 |
| 4–9 | 3,000 XP | 6,000 – 23,999 |
| 10–29 | 4,000 XP | 24,000 – 103,999 |
| 30+ | 5,000 XP | 104,000+ |

Quick reference:
- 0 XP → Level 1 (0 / 2,000 in level)
- 2,000 XP → Level 2 (0 / 2,000)
- 5,999 XP → Level 3 (1,999 / 2,000) — one XP from Tier 2
- 6,000 XP → Level 4 (0 / 3,000)
- 24,000 XP → Level 10 (0 / 4,000)
- 104,000 XP → Level 30 (0 / 5,000)

### XP Sources

The platform recognizes exactly three XP sources. The CTC service key is authorized **only** for `civic_trivia_championship_score`. Any other source returns 422.

```
civic_trivia_championship_score   ← CTC's authorized source
validation_quest_completion
admin_gift
```

---

## 4. Service Key Setup

CTC communicates with the XP award endpoint using a service key. The key is a shared secret that proves the request is coming from CTC's server (never from a browser).

### On the Empowered Accounts server

Add to `.env`:
```
TRIVIA_SERVICE_KEY=<your-secret-key>
```

The key slot is already registered in the codebase. `TRIVIA_SERVICE_KEY` is pre-authorized for the `civic_trivia_championship_score` source.

### On CTC's server

Store the same value as an env var and send it on every award request:
```
X-Service-Key: <your-secret-key>
```

### Critical: Never expose the service key to the browser

The key must live in CTC's server environment only. Award XP from your backend, not from client-side JavaScript. If the key leaks, any service could award arbitrary XP to arbitrary users under the `civic_trivia_championship_score` source.

---

## 5. API Reference

Base URL: your Empowered Accounts Express backend (e.g., `https://empowered-accounts-backend.onrender.com`)

All routes: `/api/` prefix.

---

### `GET /api/xp/:userId`

Fetch a player's current XP profile. Call this before the game starts to show their current level on the start screen.

**Auth:** None — public endpoint.

**Parameters:**
- `:userId` — player's Empowered Accounts UUID

**Response 200:**
```json
{
  "level": 5,
  "total_xp": 6100,
  "xp_in_level": 100,
  "xp_to_next_level": 2900
}
```

**Errors:**
| Status | Body | Meaning |
|--------|------|---------|
| 400 | `{ "error": "Invalid userId format" }` | Not a valid UUID |
| 404 | `{ "error": "User not found or not Connected tier" }` | User doesn't exist or is Inform-tier only |
| 500 | `{ "code": "INTERNAL_ERROR" }` | Server error — surface gracefully |

**Progress bar calculation:**
```js
const levelSize = xp_in_level + xp_to_next_level;
const progress = xp_in_level / levelSize; // 0.0–1.0
```

---

### `POST /api/xp/award`

Award XP after a game session. Call this from CTC's **server** after the game ends. The response contains the player's updated level state — no second fetch needed for the end screen.

**Auth:** `X-Service-Key` header (server-to-server only).

**Headers:**
```
X-Service-Key: <your-secret-key>
Content-Type: application/json
```

**Request body:**
```json
{
  "user_id": "650e8400-e29b-41d4-a716-446655440001",
  "source": "civic_trivia_championship_score",
  "amount": 150,
  "idempotency_key": "ctc-game-<gameId>-<userId>",
  "metadata": {
    "score": 850,
    "rank": 2,
    "correct_answers": 9,
    "total_questions": 10
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user_id` | UUID string | Yes | Player's Empowered Accounts ID |
| `source` | string | Yes | Must be exactly `"civic_trivia_championship_score"` |
| `amount` | positive integer | Yes | XP to award — your scoring formula determines this |
| `idempotency_key` | string (1–255 chars) | Yes | Unique per game session. See idempotency section. |
| `metadata` | object | No | Any game context. Stored in the XP ledger. Visible in Empowered admin tool. |

**Response 200:**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "650e8400-e29b-41d4-a716-446655440001",
  "source": "civic_trivia_championship_score",
  "amount": 150,
  "created_at": "2026-03-04T10:30:00.000Z",
  "level": 6,
  "total_xp": 6250,
  "xp_in_level": 250,
  "xp_to_next_level": 2750,
  "is_duplicate": false
}
```

**Key fields for the end screen:**
- `amount` — XP just awarded. Show as `+150 XP`.
- `level` — player's new level after the award.
- `total_xp` — new cumulative XP.
- `xp_in_level` / `xp_to_next_level` — for updated progress bar.
- `is_duplicate` — `true` if this idempotency key was already processed. XP was NOT awarded again. Show a neutral "game already recorded" message rather than a reward animation.

**Errors:**
| Status | Body | Meaning |
|--------|------|---------|
| 401 | `{ "error": "Missing or invalid X-Service-Key" }` | Key missing or wrong |
| 404 | `{ "error": "User not found or not Connected tier" }` | Player is not Connected |
| 422 | `{ "code": "SOURCE_NOT_PERMITTED", ... }` | Key used wrong source |
| 422 | `{ "code": "VALIDATION_ERROR", ... }` | Bad body shape (invalid UUID, non-positive amount, etc.) |
| 500 | `{ "code": "INTERNAL_ERROR" }` | Server error |

---

### `GET /api/xp/me/history`

Fetch the authenticated player's full paginated XP history. Optional — only needed if CTC wants to show a history panel.

**Auth:** Bearer JWT (`Authorization: Bearer <supabase-jwt>`). User must be Connected tier.

**Query params:**
- `limit` — 1–100, default 50
- `offset` — default 0

**Response 200:**
```json
{
  "transactions": [
    {
      "id": "...",
      "source": "civic_trivia_championship_score",
      "amount": 150,
      "metadata": { "score": 850, "rank": 2 },
      "created_at": "2026-03-04T10:30:00.000Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

Transactions are returned newest-first.

---

## 6. Idempotency

Idempotency prevents double-awarding XP if a request is retried after a network failure.

### Rules

- Every game session must produce exactly one unique `idempotency_key`.
- Reusing the same key always returns the original transaction with `is_duplicate: true`. No second XP row is ever written.
- Keys are permanent — they live in the database forever.

### Recommended key pattern

```
ctc-game-<gameId>-<userId>
```

Example: `ctc-game-a1b2c3d4-650e8400-e29b-41d4-a716-446655440001`

The `gameId` should be a server-generated unique ID for the game session, created before the game starts. Never use client-generated IDs as the sole source.

### Safe retry pattern

```js
async function awardGameXp(gameId, userId, amount, metadata) {
  const idempotencyKey = `ctc-game-${gameId}-${userId}`;

  const response = await fetch('/api/xp/award', {
    method: 'POST',
    headers: {
      'X-Service-Key': process.env.TRIVIA_SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      source: 'civic_trivia_championship_score',
      amount,
      idempotency_key: idempotencyKey,
      metadata,
    }),
  });

  if (!response.ok) {
    // handle errors — see error table above
  }

  const result = await response.json();

  if (result.is_duplicate) {
    // game was already recorded — show neutral message
  } else {
    // show reward animation with result.amount, result.level
  }

  return result;
}
```

---

## 7. Integration Patterns

### Start Screen

Fetch the player's level before the game so they see their current standing:

```js
// On start screen mount, if player has a linked Empowered account
async function loadPlayerXp(userId) {
  const res = await fetch(`/api/xp/${userId}`);
  if (res.status === 404) {
    // player not Connected — hide XP panel or show "link account" prompt
    return null;
  }
  return res.json(); // { level, total_xp, xp_in_level, xp_to_next_level }
}
```

Suggested start screen display:
- "Level 5" — large, prominent
- Progress bar: `xp_in_level / (xp_in_level + xp_to_next_level)`
- `total_xp` shown as cumulative if desired (e.g., "6,100 total XP")

### End Screen — Detecting a Level-Up

Store the pre-game level from the start screen fetch. Compare to `level` in the award response:

```js
const priorLevel = startData.level;         // from GET /api/xp/:userId
const awardResult = await awardGameXp(...); // from POST /api/xp/award

const didLevelUp = awardResult.level > priorLevel;
const levelsGained = awardResult.level - priorLevel;

if (didLevelUp) {
  showLevelUpAnimation(priorLevel, awardResult.level);
}

showXpGain({
  earned: awardResult.amount,          // "+150 XP"
  newLevel: awardResult.level,
  newTotal: awardResult.total_xp,
  xpInLevel: awardResult.xp_in_level,
  xpToNext: awardResult.xp_to_next_level,
});
```

### Handling Non-Connected Players

Not all CTC players will have a Connected account. The XP system is opt-in at the platform level. Design for both cases:

```
Player has linked Empowered account (Connected tier)
  → Show XP earned, level, progress bar on start/end screen
  → Award XP server-side after game ends

Player has no linked account (Inform tier / anonymous)
  → Hide XP panel entirely
  → Show "Create a free account to track your XP and level up" prompt
  → Do NOT call POST /api/xp/award (it will 404 and is unnecessary)
```

---

## 8. Metadata Best Practices

The `metadata` field is stored permanently in the XP ledger and is visible to Empowered admins. Use it to capture enough context for a human to understand each award without needing to cross-reference CTC's own database.

Recommended fields:
```json
{
  "score": 850,
  "correct_answers": 9,
  "total_questions": 10,
  "rank": 2,
  "total_players": 24,
  "game_mode": "championship",
  "category": "local-government",
  "perfect_game": false
}
```

Do not store PII (email, display name, IP address) in metadata.

---

## 9. XP Scoring Formula Guidance

The XP system does not mandate a particular formula — CTC decides how much XP to award per game. Some considerations aligned with platform values:

- **Participation > perfection.** Award meaningful XP for completing a game, not just winning. The goal is civic learning, not gatekeeping rewards behind high scores.
- **Score-proportional scaling is fine.** It is acceptable and expected that higher scores yield more XP. Just ensure a baseline award exists for participation.
- **Consider a perfect-game bonus.** A flat bonus for 100% correct is reasonable and motivating. If you use a separate transaction for bonuses, ensure each uses its own idempotency key (e.g., `ctc-game-<gameId>-<userId>-perfect-bonus`).
- **Do not cap awards to discourage play.** The platform has no daily XP cap. Players earning XP through repeated genuine play is a feature, not a problem.

---

## 10. Infrastructure Notes

The Empowered Accounts API is hosted on **Render** (Express 4.x on Node.js). A few things to be aware of:

- **All routes are prefixed `/api/`.** Never call a route without this prefix.
- **Cold starts.** The free Render tier can have ~50 second restarts if the service hasn't been pinged recently. UptimeRobot is configured to ping `/api/health` every 5 minutes to mitigate this. Expect occasional latency on the first request of the day.
- **Health check.** `GET /api/health` returns `{ status: "ok", timestamp: <ms> }`. Use this to verify connectivity before game sessions if needed.
- **HTTPS only.** HTTP requests are automatically upgraded to HTTPS by Render.

---

## 11. What to Ask Empowered Accounts For

Before going live, coordinate with the Empowered Accounts maintainer for:

1. **`TRIVIA_SERVICE_KEY` value** — you need the actual secret string to put in your env.
2. **Production API base URL** — the Render deployment URL for the accounts backend.
3. **Staging/dev environment access** — a dev instance for testing before Alpha launch.

---

## 12. Quick Reference

### Endpoints summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/xp/:userId` | None | Get player's current level + XP (start screen) |
| `POST` | `/api/xp/award` | `X-Service-Key` | Award XP after game ends (server-to-server) |
| `GET` | `/api/xp/me/history` | JWT (Connected) | Player's XP transaction history (optional) |
| `GET` | `/api/health` | None | Service health check |

### Level thresholds (locked)

| Levels | XP per level |
|--------|-------------|
| 1–3 | 2,000 |
| 4–9 | 3,000 |
| 10–29 | 4,000 |
| 30+ | 5,000 |

### Required env var (CTC server)

```
TRIVIA_SERVICE_KEY=<value from Empowered Accounts maintainer>
EMPOWERED_ACCOUNTS_API_URL=https://<your-api-host>
```

### Idempotency key pattern

```
ctc-game-<gameId>-<userId>
ctc-game-<gameId>-<userId>-perfect-bonus   (if using separate bonus award)
```

---

*Empowered Accounts v1.1 — shipped 2026-03-04*
*Maintainer: Chris — Founder, Empowered Vote*
