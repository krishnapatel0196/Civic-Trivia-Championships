# Roadmap: Civic Trivia Championship

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-02-13)
- ✅ **v1.1 Production Hardening** — Phases 8–12 (shipped 2026-02-18)
- ✅ **v1.2 Community Collections** — Phases 13–17 (shipped 2026-02-19)
- ✅ **v1.3 Question Quality & Admin Tools** — Phases 18–22 (shipped 2026-02-20)
- ✅ **v1.4 Fremont, CA Collection** — Phases 23–26 (shipped 2026-02-21)
- ✅ **v1.5 Feedback Marks** — Phases 27–30 (shipped 2026-02-22)
- ✅ **v1.6 Content Quality & Scale** — Phases 31–34 (shipped 2026-02-24)
- ✅ **v1.7 Live Civic Intelligence** — Phases 35–39 (shipped 2026-02-27)
- 🚧 **v1.8 Empowered Identity** — Phases 40–44 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–7) — SHIPPED 2026-02-13</summary>

### Phase 1: Foundation Auth
**Goal**: Users can create accounts and access the game securely
**Plans**: 4 plans

### Phase 2: Game Core
**Goal**: Players can complete a full 10-question game session
**Plans**: 4 plans

### Phase 3: Scoring System
**Goal**: Server-side scoring with speed bonus runs correctly
**Plans**: 3 plans

### Phase 4: Learning Content
**Goal**: Players see explanations and Learn More for each question
**Plans**: 3 plans

### Phase 5: Progression & Profile
**Goal**: XP and gems accumulate; profile page shows history
**Plans**: 4 plans

### Phase 6: Wager Mechanics
**Goal**: Wager flow integrated into game at question 10
**Plans**: 3 plans

### Phase 7: Polish & Performance
**Goal**: WCAG AA, keyboard nav, FCP <1.5s, bundle <300KB
**Plans**: 5 plans

</details>

<details>
<summary>✅ v1.1 Production Hardening (Phases 8–12) — SHIPPED 2026-02-18</summary>

### Phase 8: Dev Tooling & Documentation
### Phase 9: Redis Session Migration
### Phase 10: Game UX Improvements
### Phase 11: Plausibility Enhancement
### Phase 12: Learning Content Expansion

</details>

<details>
<summary>✅ v1.2 Community Collections (Phases 13–17) — SHIPPED 2026-02-19</summary>

### Phase 13–17: Multi-collection system, question expiration, Bloomington IN and Los Angeles CA collections

</details>

<details>
<summary>✅ v1.3 Question Quality & Admin Tools (Phases 18–22) — SHIPPED 2026-02-20</summary>

### Phase 18–22: Quality rules engine, admin UI, Indiana and California state collections, AI generation pipeline

</details>

<details>
<summary>✅ v1.4 Fremont, CA Collection (Phases 23–26) — SHIPPED 2026-02-21</summary>

### Phase 23–26: Fremont collection (92 questions), enhanced generation pipeline, production verification

</details>

<details>
<summary>✅ v1.5 Feedback Marks (Phases 27–30) — SHIPPED 2026-02-22</summary>

### Phase 27–30: In-game flagging, post-game elaboration, admin flag review queue, AI URL repair

</details>

<details>
<summary>✅ v1.6 Content Quality & Scale (Phases 31–34) — SHIPPED 2026-02-24</summary>

### Phase 31–34: Semantic dedup infrastructure, 268 duplicates archived, self-validating generation pipeline, Indiana and California scaled to 90+

</details>

<details>
<summary>✅ v1.7 Live Civic Intelligence (Phases 35–39) — SHIPPED 2026-02-27</summary>

### Phase 35–39: Election pipeline (races table, question generation, daily cron, current-term follow-up, admin lifecycle UI), Norwich England collection, checkAddressPhone quality rule

</details>

---

### 🚧 v1.8 Empowered Identity (In Progress)

**Milestone Goal:** Replace the custom auth/gem/admin system with the shared Empowered Accounts platform. Civic Trivia becomes a fully integrated feature of the Empowered Vote ecosystem: Supabase JWT for identity, shared gem ledger, Connected tier guards, platform-level admin roles, and complete removal of the legacy local auth stack.

#### Phase 40: Database Migration

**Goal**: Trivia tables exist under the `trivia` schema on the shared Supabase project with UUID user FKs, all 636 questions migrated, RLS policies in place, and TypeScript types regenerated.
**Depends on**: Phase 39 (v1.7 complete)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, XP-01, ADMIN-03

**Success Criteria** (what must be TRUE):
1. All trivia tables are queryable under the `trivia` schema on the shared Supabase project (verified via psql or Supabase Studio)
2. All 636 active questions and all collection records are present and intact in the migrated database
3. Every user FK column in `trivia` schema tables is UUID type referencing `public.users(id)`, with no integer user columns remaining
4. RLS policies are active on all `trivia` schema tables such that service role bypasses and user-scoped rows enforce ownership
5. `supabase gen types` output includes `trivia` schema; generated types are committed and the TypeScript build passes

**Plans**: 3 plans

Plans:
- [ ] 40-01: Schema creation, RLS policies, and player_stats/player_prefs table definitions
- [ ] 40-02: Content migration (questions, collections, tags) from current Postgres to shared Supabase
- [ ] 40-03: Type generation and build verification

---

#### Phase 41: Auth & Tier Integration (Backend)

**Goal**: The backend validates Supabase JWTs, extracts UUID user identity, enforces Connected tier guards, and checks admin status via the platform `admin_users` table — all existing admin routes working under the new guards.
**Depends on**: Phase 40
**Requirements**: AUTH-01, AUTH-02, AUTH-03, TIER-01, TIER-02, ADMIN-01, ADMIN-02

**Success Criteria** (what must be TRUE):
1. A request with a valid Supabase JWT reaches protected routes with `req.userId` set to the UUID from the JWT `sub` claim; an invalid or absent JWT returns 401
2. Routes using `optionalAuth` accept both authenticated requests (with `req.userId` populated) and unauthenticated requests (userId undefined) without error
3. A request from a Connected-tier user passes `requireConnected`; a request from an anonymous or Inform-tier user is rejected with 403
4. All existing `/api/admin/*` routes return correct responses for a user whose UUID appears in `public.admin_users`, and 403 for any other user
5. Anonymous play (game start and question fetch with no auth header) continues to work without error

**Plans**: 2 plans

Plans:
- [x] 41-01-PLAN.md — Middleware foundation: install jose + supabase-js, create supabaseAdmin config, replace auth.ts with requireAuth/optionalAuth/requireConnected/requireAdmin
- [x] 41-02-PLAN.md — Caller migration: update all route handlers from req.user to req.userId, fix sessionService plausibility, fix progression guard, verify build

---

#### Phase 42: Gem & Progression Integration

**Goal**: Gem awards flow through the platform `award_gems` RPC, gem balance is read from the accounts API, persistent stats are stored in `trivia.player_stats` for Connected users only, and the local `total_gems` column is removed.
**Depends on**: Phase 41
**Requirements**: GEMS-01, GEMS-02, GEMS-03, XP-02, XP-03, TIER-03, TIER-04

**Success Criteria** (what must be TRUE):
1. After a Connected user completes a game, the `award_gems` RPC is called with `p_gem_type: 'yellow'`, `p_source: 'civic_trivia'`, and `p_reason: 'game_completed'`; the gem balance visible on the accounts platform increases
2. Stats (games played, best score, total correct, total questions) are written to `trivia.player_stats` for Connected users and not written for anonymous or Inform-tier players
3. A suspended account (`account_standing = 'suspended'`) attempting game submission does not earn gems and its stats are not updated
4. The `total_gems` column no longer exists in any trivia schema table and no backend code references it
5. Anonymous play completes without error and no gem/stat writes occur

**Plans**: 3 plans

Plans:
- [ ] 42-01: award_gems RPC integration in game completion endpoint
- [ ] 42-02: player_stats write logic with Connected-tier guard and suspension check
- [ ] 42-03: Remove total_gems column and all references

---

#### Phase 43: Frontend Auth & Profile

**Goal**: Frontend login, signup, logout, and token refresh all call the Empowered Accounts API; the profile page shows trivia-specific stats plus accounts-sourced gem balance, tier badge, and display name, with identity management actions linking out to the accounts platform.
**Depends on**: Phase 42
**Requirements**: AUTH-04, AUTH-05, AUTH-06, AUTH-07, PROF-01, PROF-02, PROF-03, PROF-04

**Success Criteria** (what must be TRUE):
1. Clicking "Log In" submits credentials to Empowered Accounts `POST /api/auth/login`, stores the returned access token, and the user reaches the game home screen authenticated
2. Clicking "Sign Up" initiates the Empowered Accounts `POST /api/auth/signup` flow; new accounts are created on the accounts platform, not locally
3. Clicking "Log Out" calls Empowered Accounts `POST /api/auth/logout` and the frontend clears the stored token; subsequent requests are unauthenticated
4. The profile page displays the Connected user's trivia stats (games played, accuracy, best score, XP), gem balance, tier badge, and display name sourced from respective APIs
5. Identity management actions (name change, password, avatar) are absent from the trivia profile UI and replaced with a link to the accounts platform

**Plans**: 3 plans

Plans:
- [ ] 43-01: Frontend auth service rewrite (login, signup, logout, token refresh) → accounts API
- [ ] 43-02: Profile page redesign (trivia stats + accounts API data; link out for identity management)

---

#### Phase 44: Deprecation & Cleanup

**Goal**: All legacy local auth infrastructure is removed — no bcrypt, no custom JWT utilities, no local users table, no orphaned auth routes, no stale env vars — leaving the codebase clean with only Supabase-based auth remaining.
**Depends on**: Phase 43
**Requirements**: DEP-01, DEP-02, DEP-03, DEP-04, DEP-05, DEP-06, DEP-07, DEP-08, DEP-09, DEP-10

**Success Criteria** (what must be TRUE):
1. The trivia backend has no `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, or `/api/auth/refresh` routes; attempts to call them return 404
2. The `bcrypt` package is absent from `package.json` and `node_modules`; `tokenUtils.ts`, `jwt.ts`, `authController.ts`, and `User.ts` do not exist in the codebase
3. The local `users` table is dropped from the database; no active queries reference it
4. `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_EMAIL` are absent from `.env.example` and all env validation logic
5. `.env.example` lists `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `EMPOWERED_ACCOUNTS_URL`; the Redis token blacklist code path is fully removed

**Plans**: 3 plans

Plans:
- [ ] 44-01: Remove auth routes, controllers, JWT utilities, User model, and bcrypt dependency
- [ ] 44-02: Drop local users table, remove Redis blacklist, update env vars and documentation

---

## Progress

**Execution Order:** 40 → 41 → 42 → 43 → 44

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–7. MVP Phases | v1.0 | 26/26 | Complete | 2026-02-13 |
| 8–12. Hardening Phases | v1.1 | 11/11 | Complete | 2026-02-18 |
| 13–17. Collections Phases | v1.2 | 15/15 | Complete | 2026-02-19 |
| 18–22. Quality Phases | v1.3 | 17/17 | Complete | 2026-02-20 |
| 23–26. Fremont Phases | v1.4 | 6/6 | Complete | 2026-02-21 |
| 27–30. Feedback Phases | v1.5 | 11/11 | Complete | 2026-02-22 |
| 31–34. Scale Phases | v1.6 | 13/13 | Complete | 2026-02-24 |
| 35–39. Election Phases | v1.7 | 10/10 | Complete | 2026-02-27 |
| 40. Database Migration | v1.8 | 3/3 | Complete | 2026-02-28 |
| 41. Auth & Tier Integration | v1.8 | 2/2 | Complete | 2026-02-28 |
| 42. Gem & Progression Integration | v1.8 | 0/TBD | Not started | - |
| 43. Frontend Auth & Profile | v1.8 | 0/TBD | Not started | - |
| 44. Deprecation & Cleanup | v1.8 | 0/TBD | Not started | - |
