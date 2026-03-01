# Requirements: Civic Trivia Championship

**Defined:** 2026-02-28
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

---

## v1.8 Requirements — Empowered Identity

Replace the custom auth/gem/admin system with the shared Empowered Accounts platform.

### Database Migration

- [ ] **DB-01**: Trivia tables created under `trivia` schema on shared Supabase project (aligned with platform conventions)
- [ ] **DB-02**: All user FK columns use UUID referencing `public.users(id)` (not integer from local users table)
- [ ] **DB-03**: Question and collection content migrated from current PostgreSQL to shared Supabase (636 active questions preserved)
- [ ] **DB-04**: RLS policies added to all `trivia` schema tables (service role bypasses; user-scoped reads enforce ownership)
- [ ] **DB-05**: TypeScript types regenerated: `supabase gen types` with `trivia` schema included

### Authentication

- [ ] **AUTH-01**: Backend `requireAuth` middleware uses `jwtVerify` (jose) against `SUPABASE_JWT_SECRET` — identical to integration guide pattern
- [ ] **AUTH-02**: `req.userId` is UUID string from JWT `sub` claim (replaces integer `req.user.id`)
- [ ] **AUTH-03**: `optionalAuth` middleware updated — sets `req.userId` if valid Supabase JWT present, continues unauthenticated otherwise
- [ ] **AUTH-04**: Frontend login calls Empowered Accounts `POST /api/auth/login` and stores returned access token
- [ ] **AUTH-05**: Frontend signup redirects to Empowered Accounts `POST /api/auth/signup` flow
- [ ] **AUTH-06**: Logout calls Empowered Accounts `POST /api/auth/logout` to invalidate session globally
- [ ] **AUTH-07**: Token refresh uses Empowered Accounts refresh token flow

### Tier Guards

- [ ] **TIER-01**: `requireConnected` middleware implemented — checks `connect.connected_profiles` via service role client
- [ ] **TIER-02**: Anonymous play preserved — players without accounts can play all collections without logging in
- [ ] **TIER-03**: Gem earning and persistent stats (games played, XP, best score) require Connected tier
- [ ] **TIER-04**: Suspended accounts (`account_standing = 'suspended'`) blocked from earning gems and submitting progression

### Gems

- [ ] **GEMS-01**: `award_gems` RPC called after authenticated game completion (`p_gem_type: 'yellow'`, `p_source: 'civic_trivia'`, `p_reason: 'game_completed'`)
- [ ] **GEMS-02**: Gem balance displayed on profile is read from Empowered Accounts `GET /api/gems/balance` (Connected required)
- [ ] **GEMS-03**: Local `total_gems` column removed from trivia data model

### XP & Progression

- [ ] **XP-01**: Game XP tracked in `trivia.player_stats` table (trivia-specific, not shared platform XP)
- [ ] **XP-02**: Stats (games played, best score, total correct, total questions) stored in `trivia.player_stats` keyed by UUID user_id
- [ ] **XP-03**: Stats only written for Connected+ users (anonymous and Inform-tier play is scoreless)

### Admin

- [ ] **ADMIN-01**: `requireAdmin` middleware checks `public.user_roles` table via service role client (not `is_admin` boolean)
- [ ] **ADMIN-02**: All existing admin routes continue to work under new admin guard
- [ ] **ADMIN-03**: Timer multiplier preference (trivia-specific setting) persisted in `trivia.player_prefs` table keyed by UUID user_id

### Profile Page

- [ ] **PROF-01**: Profile page displays trivia stats: games played, accuracy, best score, XP earned
- [ ] **PROF-02**: Profile page displays gem balance and tier badge sourced from Empowered Accounts API
- [ ] **PROF-03**: Name and display name shown from accounts API `GET /api/account/me` response
- [ ] **PROF-04**: Identity management actions (name change, avatar, password) link out to accounts platform — not editable within trivia UI

### Deprecation & Cleanup

- [ ] **DEP-01**: Custom `POST /api/auth/signup`, `/login`, `/logout`, `/refresh` routes removed from trivia backend
- [ ] **DEP-02**: `bcrypt` dependency removed (no local password hashing)
- [ ] **DEP-03**: Custom JWT utilities (`tokenUtils.ts`, `jwt.ts` config) removed
- [ ] **DEP-04**: Local `users` table removed from trivia schema (identity lives in accounts)
- [ ] **DEP-05**: `User.ts` model removed
- [ ] **DEP-06**: `authController.ts` removed
- [ ] **DEP-07**: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL` env vars removed
- [ ] **DEP-08**: `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `EMPOWERED_ACCOUNTS_URL` env vars added
- [ ] **DEP-09**: `.env.example` updated to reflect new env shape
- [ ] **DEP-10**: Redis token blacklist removed (Supabase handles session invalidation)

---

## v2 Requirements

Deferred to future milestones.

### Leaderboards (v1.9+)

- **LEAD-01**: Per-collection leaderboard showing top Connected players by score
- **LEAD-02**: Leaderboard pagination (top 25 per page)
- **LEAD-03**: Player's own rank shown even if outside top 25
- **LEAD-04**: Leaderboard gated to Connected tier (bot spam prevention via tier system)

### Social / Platform Integration (v2+)

- **SOC-01**: Player compass calibration data surfaced in trivia (personalized question category weighting)
- **SOC-02**: Trivia achievements visible on Connected profile
- **SOC-03**: Role-based Maven access for question authoring

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migrating existing player game history | Dev/MVP phase — no real user data worth preserving; fresh start with unified accounts |
| OAuth login (Google, GitHub) | Handled by Empowered Accounts system — not trivia's concern |
| Custom invite flow | Empowered Accounts handles Connected tier verification — not trivia's concern |
| In-trivia identity management (name, avatar, password) | Lives on accounts platform — link out |
| Leaderboards | Deferred to v1.9 — accounts integration is prerequisite, not co-deliverable |
| Compass data integration | Future enhancement — not needed for accounts migration |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 40 | Complete |
| DB-02 | Phase 40 | Complete |
| DB-03 | Phase 40 | Complete |
| DB-04 | Phase 40 | Complete |
| DB-05 | Phase 40 | Complete |
| AUTH-01 | Phase 41 | Complete |
| AUTH-02 | Phase 41 | Complete |
| AUTH-03 | Phase 41 | Complete |
| AUTH-04 | Phase 43 | Pending |
| AUTH-05 | Phase 43 | Pending |
| AUTH-06 | Phase 43 | Pending |
| AUTH-07 | Phase 43 | Pending |
| TIER-01 | Phase 41 | Complete |
| TIER-02 | Phase 41 | Complete |
| TIER-03 | Phase 42 | Pending |
| TIER-04 | Phase 42 | Pending |
| GEMS-01 | Phase 42 | Pending |
| GEMS-02 | Phase 42 | Pending |
| GEMS-03 | Phase 42 | Pending |
| XP-01 | Phase 40 | Complete |
| XP-02 | Phase 42 | Pending |
| XP-03 | Phase 42 | Pending |
| ADMIN-01 | Phase 41 | Complete |
| ADMIN-02 | Phase 41 | Complete |
| ADMIN-03 | Phase 40 | Complete |
| PROF-01 | Phase 43 | Pending |
| PROF-02 | Phase 43 | Pending |
| PROF-03 | Phase 43 | Pending |
| PROF-04 | Phase 43 | Pending |
| DEP-01 | Phase 44 | Pending |
| DEP-02 | Phase 44 | Pending |
| DEP-03 | Phase 44 | Pending |
| DEP-04 | Phase 44 | Pending |
| DEP-05 | Phase 44 | Pending |
| DEP-06 | Phase 44 | Pending |
| DEP-07 | Phase 44 | Pending |
| DEP-08 | Phase 44 | Pending |
| DEP-09 | Phase 44 | Pending |
| DEP-10 | Phase 44 | Pending |

**Coverage:**
- v1.8 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

| Phase | Requirements |
|-------|-------------|
| Phase 40 — Database Migration | DB-01, DB-02, DB-03, DB-04, DB-05, XP-01, ADMIN-03 (7) |
| Phase 41 — Auth & Tier Integration | AUTH-01, AUTH-02, AUTH-03, TIER-01, TIER-02, ADMIN-01, ADMIN-02 (7) |
| Phase 42 — Gem & Progression Integration | GEMS-01, GEMS-02, GEMS-03, XP-02, XP-03, TIER-03, TIER-04 (7) |
| Phase 43 — Frontend Auth & Profile | AUTH-04, AUTH-05, AUTH-06, AUTH-07, PROF-01, PROF-02, PROF-03, PROF-04 (8) |
| Phase 44 — Deprecation & Cleanup | DEP-01, DEP-02, DEP-03, DEP-04, DEP-05, DEP-06, DEP-07, DEP-08, DEP-09, DEP-10 (10) |

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 — traceability populated by roadmap creation*
