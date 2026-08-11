# Empowered Accounts — Integration Guide

**Version:** v1.0 (2026-02-28)
**Audience:** Developers and AI assistants integrating a new Empowered Vote feature with the shared account system.
**Purpose:** This document is the authoritative reference for building against the Empowered Accounts API. Read it before writing any code that touches authentication, user identity, tiers, gems, roles, or admin.

---

## What This System Is

`empowered-accounts` is the foundational identity and trust layer for the Empowered Vote civic platform. It is a standalone Express 4.x / TypeScript backend connected to a shared Supabase project.

**Every feature on the platform shares this system.** There is no separate auth, no separate user table, no separate admin. When you integrate a new feature (Civic Trivia, Symposiums, Civil Civics, etc.), you plug into this system rather than building a parallel one.

**Core invariant:** A user's tier is determined by the *presence or absence of child records* — never by a status flag.

| Tier | Condition |
|------|-----------|
| Inform | No child records (base tier, signup lands here) |
| Connected | `connect.connected_profiles` row exists with `verification_status = 'verified'` |
| Empowered | `empower.empowered_profiles` row exists with `is_active = true` |

---

## 1. Authentication

### How Auth Works

Users authenticate via the accounts API. Authentication returns a standard **Supabase JWT**. That same JWT is valid for any service running in the same Supabase project — including your new feature's backend.

```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "..." }
Returns: {
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "...", "tier": "inform|connected|empowered" }
}
```

**All authenticated requests** use:
```
Authorization: Bearer <access_token>
```

### Verifying JWTs in Your Feature's Backend

Copy this middleware pattern exactly:

```typescript
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7); // strip "Bearer "
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

**Environment variables your feature needs** (same values as the accounts backend):

```
SUPABASE_URL=<shared project URL>
SUPABASE_ANON_KEY=<shared anon key>
SUPABASE_SERVICE_ROLE_KEY=<shared service role key>
SUPABASE_JWT_SECRET=<shared JWT secret>
```

These come from the same Supabase project. Ask the project owner for credentials.

### Other Auth Routes

| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/auth/signup` | None | Create account (email + password). Rate: 10/15min/IP. |
| `POST /api/auth/logout` | Auth | Invalidate session globally. Always 200. |
| `POST /api/auth/complete-onboarding` | Auth+Connected | Mark onboarding done on `connected_profiles`. |

---

## 2. Tier System and Guards

### The Three Tiers

**Inform** — Base tier. Anyone who signs up. Can use compass and view public content. Cannot participate in civic features, generate invites, or hold roles.

**Connected** — Identity-verified. Required for civic participation (posting, connecting, earning gems). A user becomes Connected by completing the invite + verification flow.

**Empowered** — Civic leaders. Publicly accountable. Required for Symposium speaking, Empowered candidacy. Users self-elect and must consent to public disclosure.

### Checking Tiers in Your Feature

**Option A (fast, recommended):** Call the accounts API with the user's JWT.

```
GET /api/account/me
Authorization: Bearer <access_token>
Returns: { tier: "inform" | "connected" | "empowered", ... }
```

**Option B (direct DB query, for your own backend):** Query Supabase directly using the service role client.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// requireConnected guard
export async function requireConnected(req, res, next) {
  const { data } = await supabaseAdmin
    .schema('connect')
    .from('connected_profiles')
    .select('verification_status')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (!data || data.verification_status !== 'verified') {
    return res.status(403).json({ error: 'Connected account required' });
  }
  next();
}

// requireEmpowered guard
export async function requireEmpowered(req, res, next) {
  const { data } = await supabaseAdmin
    .schema('empower')
    .from('empowered_profiles')
    .select('is_active')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (!data || !data.is_active) {
    return res.status(403).json({ error: 'Empowered account required' });
  }
  next();
}
```

**Use tier guards for all features that require civic trust.** For example, Civic Trivia Championships should require Connected tier to prevent bot spam on leaderboards.

---

## 3. Full Account Profile

Use this route to get the complete user context — tier, standing, gem balance, roles, and profile info.

```
GET /api/account/me
Authorization: Bearer <access_token>

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "avatar_url": null,
  "tier": "connected",
  "account_standing": "active",          // "active" | "suspended"
  "connected_profile": {                  // present if Connected+
    "display_name": "Jane Doe",
    "verification_status": "verified",
    "tolerance_rating": 8.50,            // private — owner only
    "xp": 120,
    "gem_balance": 45,
    "completed_onboarding": true,
    "created_at": "2026-01-15T..."
  },
  "empowered_profile": {                  // present if Empowered
    "legal_name": "Jane Mary Doe",       // private — owner only
    "is_active": true,
    "candidate_page_slug": "jane-doe-a3b4",
    "empowered_at": "2026-02-01T...",
    "demoted_at": null
  }
}
```

**Privacy rules (enforced at API layer):**
- `tolerance_rating` and `legal_name` are **never** returned to non-owners. Do not expose these in your feature's API responses.
- `account_standing: "suspended"` users should be blocked from participation in your feature. Check standing before allowing civic actions.

---

## 4. Invite Flow (How Users Become Connected)

This is built and complete — your feature does not implement this, but you need to understand it for user journeys.

1. **Signup is open.** `POST /api/auth/signup` requires only email + password. No invite code. User lands at Inform tier.

2. **Invite codes gate Connected tier.** A Connected user generates a code via `POST /api/invites/send`. Format: `XXXX-XXXX` (e.g., `A3B7-XK29`).

3. **User enters the code to start verification.** `POST /api/connect/start { code: "A3B7-XK29" }` — claims the code and opens a verification session.

4. **User fills in profile.** `PATCH /api/connect/step` with display_name, legal_name, location, home_address.

5. **User finalizes.** `POST /api/connect/complete` — atomically creates the `connected_profiles` row. User is now Connected.

**Your feature's job:** Check tier. If not Connected, direct users to the invite flow (handled by the accounts system).

---

## 5. Gem System

Gems are the platform's reward currency. There are three types:

| Type | Color | Awarded for |
|------|-------|-------------|
| `red` | ev-red | Empower / civic leadership actions |
| `blue` | ev-teal | Connect / community actions |
| `yellow` | ev-yellow | Inform / civic knowledge actions |

**Civic Trivia** should award **yellow gems** (Inform/civic knowledge domain).

### Awarding Gems from Your Feature

Call the `award_gems` Postgres RPC via the service role client:

```typescript
const { error } = await supabaseAdmin.rpc('award_gems', {
  p_user_id: userId,
  p_gem_type: 'yellow',
  p_amount: 50,
  p_reason: 'trivia_championship_win',
  p_source: 'civic_trivia',
});

if (error) throw new Error(`Gem award failed: ${error.message}`);
```

Awards are immediately visible in:
- `GET /api/gems/balance` — user's gem balance
- `GET /api/gems/transactions` — transaction history
- Admin dashboard — all transactions visible to admins

**Do not implement a separate gem system.** Use this RPC.

### Reading Gem Balances

```
GET /api/gems/balance
Authorization: Bearer <access_token>   (Connected tier required)
Returns: { gem_balance: 45 }

GET /api/gems/transactions
Authorization: Bearer <access_token>   (Connected tier required)
Query: gem_type?, limit (max 100), offset
```

---

## 6. Role System

Roles are platform-wide labels that grant additional permissions (e.g., "Tournament Host", "Moderator"). They are managed by admins.

```
GET /api/roles              — All active roles in the system (public)
GET /api/roles/me           — Current user's role grants (Connected required)
```

**Admin role management:**
```
POST /api/admin/roles/grant   — Grant a role to a user
POST /api/admin/roles/revoke  — Revoke a role
```

If your feature has a "host" or "moderator" concept, use roles rather than building a separate permission layer.

---

## 7. Admin System

The admin system is complete and shared. All admin routes require a user with the admin role.

**Admin routes relevant to new features:**

| Route | Description |
|-------|-------------|
| `GET /api/admin/accounts` | Search/filter all accounts |
| `GET /api/admin/accounts/:userId` | Full account detail (all private fields) |
| `POST /api/admin/accounts/:userId/suspend` | Suspend an account |
| `POST /api/admin/accounts/:userId/unsuspend` | Unsuspend |
| `POST /api/admin/roles/grant` | Grant a role (e.g., "Tournament Host") |
| `POST /api/admin/roles/revoke` | Revoke a role |
| `POST /api/admin/invites` | Create an admin invite code (no Connected requirement) |
| `GET /api/admin/dashboard` | Cohort stats |

**Admin auth pattern:**

```typescript
// Your feature's admin middleware is identical
export async function requireAdmin(req, res, next) {
  // requireAuth must run first (sets req.userId)
  const { data } = await supabaseAdmin
    .from('user_roles')      // check the actual table name in backend/src/
    .select('role')
    .eq('user_id', req.userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!data) return res.status(403).json({ error: 'Admin required' });
  next();
}
```

If your feature needs admin UI, extend the existing React admin tool (`/admin`) or call the admin API routes from your own UI. The auth pattern is the same.

---

## 8. Database Conventions

When adding a new feature schema to the shared Supabase project:

1. **Create your own schema.** Never add tables to `public`, `connect`, `empower`, or `inform`. Use a namespaced schema (e.g., `trivia`, `symposium`, `civics`).

```sql
CREATE SCHEMA trivia;
CREATE TABLE trivia.championships (...);
CREATE TABLE trivia.player_scores (
  user_id UUID NOT NULL REFERENCES public.users(id),
  ...
);
```

2. **Use `SECURITY DEFINER` functions for multi-table writes.** Never chain JS awaits for operations that must be atomic. If you need to insert two rows together (e.g., create championship + register host), use a Postgres RPC.

3. **Use the service role client for writes only.** For reads that feed API responses, use a per-request user-scoped client with RLS. Do not use the service role client for reads.

4. **Reference `public.users(id)` for foreign keys** to user records. Never reference `auth.users` directly from application tables.

---

## 9. Compass Data (Read-Only for Most Features)

The Empowered Compass is a political calibration tool. Civic Trivia may want to read compass data to:
- Personalize question categories to a user's civic interests
- Compare player calibrations on a leaderboard

```
GET /api/compass/topics      — All live topics with stances (optional auth)
GET /api/compass/answers     — Authenticated user's own answers
GET /api/compass/progress    — Calibration completeness (0–100%)
```

**Do not write to compass tables directly.** Only the accounts API modifies compass data (via `POST /api/compass/answers`).

---

## 10. Public Candidate Profiles

```
GET /api/candidates/:slug         — Public profile (no auth required)
GET /api/candidates/:slug/answers — Candidate's compass answers
GET /api/essentials/candidates/:zip — Active candidates by ZIP code
```

These are public endpoints. Any feature that surfaces civic leaders can call them.

---

## 11. How to Add Your Feature's Schema

Concrete checklist for a new feature (e.g., Civic Trivia Championships):

```
[ ] Create schema: CREATE SCHEMA trivia;
[ ] Tables reference public.users(id) for user FKs
[ ] RLS policies added to trivia tables (service role bypasses, user-scoped client enforces)
[ ] Run supabase db push or include in a numbered migration file (supabase/migrations/)
[ ] Generate updated TypeScript types:
    supabase gen types --linked --lang typescript --schema public,connect,empower,inform,trivia \
      > backend/src/types/database.types.ts
[ ] Copy auth middleware from backend/src/middleware/auth.ts
[ ] Copy tier guard pattern from backend/src/middleware/tierGuards.ts
[ ] New Express routes added to backend/src/routes/ (or your own service)
[ ] Admin routes for your feature added to backend/src/routes/admin.ts
[ ] All mutations logged to admin_audit_log if they affect user standing/access
```

---

## 12. What You Must Not Build

If you're integrating a new feature, these already exist. Do not build parallel versions:

| Component | Use Instead |
|-----------|-------------|
| User signup / login | `POST /api/auth/signup`, `POST /api/auth/login` |
| JWT verification middleware | Copy from `backend/src/middleware/auth.ts` |
| Tier checking | Copy from `backend/src/middleware/tierGuards.ts` |
| Invite system | `POST /api/invites/send`, `POST /api/connect/start` |
| Gem ledger | `award_gems` RPC |
| Role system | `POST /api/admin/roles/grant` |
| Admin user management | `GET /api/admin/accounts`, suspend/unsuspend routes |
| Social graph | `GET /api/social/following`, peer connection routes |

---

## 13. Key API Routes at a Glance

Base URL: `https://<host>/api`

| Domain | Routes | Notes |
|--------|--------|-------|
| Health | `GET /health` | No auth |
| Auth | signup, login, logout, complete-onboarding | |
| Account | `GET /me`, `PATCH /me` | |
| Invites | send, claim, list | Connected required to send |
| Connect | start, step, complete, status, compass-import | Full enrollment flow |
| Compass | 11 routes | Topics, answers, politicians |
| Empower | preflight, confirm, demote | Connected required |
| Gems | balance, transactions | Connected required |
| Roles | list all, list mine | |
| Social | 9 routes | Peer connections + follows |
| Admin | 21 routes | requireAdmin |
| Candidates | by slug, by ZIP | Public |

Full route reference: see `empowered-accounts-design.md` or `.planning/quick/001-invite-flow-and-civic-trivia-integration/FINDINGS.md` in the accounts repo.

---

## 14. Quick Reference: Error Codes

| Code | Error | Meaning |
|------|-------|---------|
| 401 | Missing/invalid token | No valid JWT |
| 403 | Tier required | User is below required tier |
| 403 | Suspended | `account_standing = 'suspended'` |
| 404 | INVALID_CODE | Invite code not found |
| 409 | CODE_ALREADY_CLAIMED | Invite code already used |
| 409 | ALREADY_CONNECTED | User is already Connected |
| 409 | INVITE_LIMIT_REACHED | Generator already has 5 unclaimed codes |
| 410 | CODE_EXPIRED | Invite code past expiration |
| 403 | SELF_INVITE_BLOCKED | User tried to claim their own code |

---

## For AI Assistants Working in a Feature Repo

If you are Claude (or another AI assistant) working in a separate feature repository (e.g., `civic-trivia`):

1. **Shared Supabase project** — use the same `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET` as the accounts backend.
2. **Copy auth middleware verbatim** — do not rewrite JWT verification. The pattern above is tested and audited.
3. **Add your schema under a new namespace** (e.g., `CREATE SCHEMA trivia`) — never modify `public`, `connect`, `empower`, or `inform` tables.
4. **For gem awards**, call the `award_gems` RPC via service role. Do not insert gem records directly.
5. **For admin actions**, call the existing admin API routes. Do not build a separate admin auth system.
6. **Check `account_standing`** before allowing any civic action. A suspended user should not be able to submit answers, earn gems, or appear on leaderboards.
7. **Never expose `tolerance_rating` or `legal_name`** in API responses — these are private owner-only fields enforced at the serialization layer.
