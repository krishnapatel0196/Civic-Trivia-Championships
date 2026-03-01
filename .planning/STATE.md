# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 45 — Auth State Hardening

## Current Position

Phase: 45 of 46 (Auth State Hardening) — In progress
Plan: 2 of 2 complete in Phase 45 (45-01 done, 45-02 done)
Status: 45-02 executed — Phase 43 VERIFICATION.md written (8/8 requirements), ADMIN-01 requirement text corrected
Last activity: 2026-03-01 — Completed 45-02-PLAN.md (Phase 43 verification and REQUIREMENTS.md correction)

Progress: [██████████] v1.0–v1.8 COMPLETE (phases 40-44 done); Phase 45 documentation audit closures complete

**Milestone progress:**
- v1.0–v1.7 (Phases 1–39): Complete
- v1.8 (Phases 40–44): **COMPLETE** — All 5 phases done, all 15 plans executed, all goals verified
- Phase 45 (Auth State Hardening): 2 plans complete (45-01 bug fixes, 45-02 doc audit closures)

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, fully populated (953 questions), TypeScript types generated
- Redis: Upstash (stirred-pika-7510)

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table. Key v1.8 decisions:

- Auth: `jwtVerify` (jose) against `SUPABASE_JWT_SECRET` — per accounts integration guide
- Admin: `admin_users` table UUID lookup (not user_roles join) — correctly typed in database.types.ts
- Gems: `award_gems` RPC, `p_gem_type: 'yellow'`, `p_source: 'civic_trivia'` — replaces local total_gems
- Stats: `trivia.player_stats` is trivia-specific (UUID user_id); not shared platform XP
- Anonymous play: preserved — only Connected tier earns gems and persistent stats
- Suspended accounts: blocked from gem earning and stat writes
- Identity management: links out to accounts platform — no in-trivia editing

**Phase 40-01 decisions:**
- Migration history repair: used `supabase migration repair --status reverted` to clear 24 pre-existing remote entries before pushing new trivia schema migration
- questionFlags.userId type: changed from INTEGER to UUID to match public.users(id) FK on shared Supabase
- PostgREST exposure requires manual Dashboard step (Settings > API > Exposed schemas: add "trivia") — SQL GRANTs alone insufficient

**Phase 40-02 decisions:**
- Supabase Management API /database/query used for target writes — DB password unavailable (PATCH /v1/projects/{ref} db_pass field accepted but did not propagate to pooler auth)
- Dollar-quoting ($JVAL$...$JVAL$::jsonb) for JSONB SQL literals — prevents double-escape of backslashes in markdown learning_content fields
- expiration_history NULL coalesced to [] — source allows NULL, target requires NOT NULL DEFAULT '[]'
- question_flags not migrated — integer user_id incompatible with UUID FK on target

**Phase 40-03 decisions:**
- stderr redirect (2>/dev/null) required when running `supabase gen types` to prevent "Initialising login role..." diagnostic from contaminating TypeScript output
- trivia schema confirmed already PostgREST-exposed — all 9 tables present in generated types (Dashboard step from 40-01 already done)
- Regeneration command: `SUPABASE_ACCESS_TOKEN=... npx supabase gen types --linked --lang typescript --schema public,trivia 2>/dev/null > backend/src/types/database.types.ts`

**Phase 41-01 decisions:**
- authenticateToken preserved as export alias for requireAuth — callers still reference it; Plan 02 migrates callers and removes alias
- Admin check uses admin_users table (typed in database.types.ts) not user_roles join (untyped)
- connect schema accessed via `(supabaseAdmin as any).schema('connect')` — connect schema not in generated types
- Caller TypeScript errors (req.user property missing) are expected; will be fixed in Plan 02

**Phase 41-02 decisions:**
- req.userId is now the canonical user identifier throughout all routes and middleware (string UUID)
- Profile routes use `as unknown as number` cast as explicit Phase 43 TODO markers — UUID users cannot reach legacy integer User model at runtime anyway
- Progression guard for UUID users: sets progressionAwarded=true with progression=null to prevent retry; Phase 42 implements award_gems RPC
- sessionService timerMultiplier defaults to 1.0 for UUID users (typeof session.userId === 'number' guard)
- getRateLimitStatus signature: userId changed from number to string to match UUID type

**Phase 42-01 decisions:**
- ADD COLUMN IF NOT EXISTS used for each column — idempotent migration safe for re-runs
- Supabase CLI was already authenticated from Phase 40 stored session — no SUPABASE_ACCESS_TOKEN env var needed; `npx supabase db push` worked directly
- Regeneration command confirmed: `npx supabase gen types --linked --lang typescript --schema public,trivia 2>/dev/null > backend/src/types/database.types.ts` (no SUPABASE_ACCESS_TOKEN needed when CLI already authenticated)

**Phase 42-02 decisions:**
- isConnected and isSuspended are NON-OPTIONAL booleans in GameSession — optional fields would silently allow gem awards to anonymous users since !undefined === true
- accessToken is optional (?) — anonymous sessions have no token, that's intentional
- awardPlatformGems uses (supabaseAdmin as any).rpc — consistent with Phase 41 connect schema pattern to avoid cross-schema type errors
- withRetry is internal to progressionService (not exported) — callers only see result objects
- current_streak and best_streak initialized to 1 on INSERT only, omitted from onConflictDoUpdate — real day-streak logic deferred to future phase
- gemsConfirmed param in upsertPlayerStats decouples stats write from RPC success — caller passes 0 if award_gems failed

**Phase 42-03 decisions:**
- progression declared as any (not a union type) — avoids forcing discriminated union while legacy integer path still exists; Phase 44 will tighten the type
- saveSession called after progressionAwarded set — ensures idempotency if GET /results called twice by slow client
- accountContext check fires for all UUID users at session start (not just Connected-tier) — tier filtering happens at award time in GET /results
- GEMS-03 JSDoc @deprecated markers chosen over TODO comments — surfaces in IDE hover text and TypeDoc without requiring grep

**Phase 43-01 decisions:**
- Token refresh endpoint: Supabase native /auth/v1/token?grant_type=refresh_token used directly (no /api/auth/refresh route documented in integration guide)
- accountsApiFetch is standalone (not extending apiRequest) — avoids VITE_API_URL prefix and credentials:include contamination
- AuthInitializer immediately resolves unauthenticated state when no ev_refresh_token in localStorage (no spinner, no network call for new visitors)
- api.ts auto-attaches Bearer token from store for all trivia backend requests (callers no longer need to pass Authorization header manually)
- SignupData.name removed — accounts API does not accept name at signup; Connected onboarding flow sets display_name

**Phase 43-02 decisions:**
- Signup always navigates to / after registration — Inform-tier users cannot access /profile, from param would cause redirect loop
- Admin pill removed from Header — user.isAdmin does not exist on AccountsUser; route-level admin checks remain
- Open redirect guard in Login: from param validated to start with / before navigate is called
- displayName || user.email display pattern in Header — displayName populated by AuthInitializer from accounts profile, not from AccountsUser (which has no name field)

**Phase 43-03 decisions:**
- fetchAccountProfile imported from accountsApi.ts directly (not via authService) — already exported there from plan 01; plan spec referenced authService.fetchAccountProfile but that method was never added to authService
- AdminGuard uses user.tier === 'empowered' as admin check — AccountsUser has no isAdmin field; empowered tier is the appropriate frontend guard
- AdminDashboard/AdminLayout display user.email (no user.name on AccountsUser)
- CollectionCard isAdmin = user.tier === 'empowered' — empowered tier implies admin for question count display aria-label
- Timer update failures silently ignored in Profile — non-critical UX, no toast yet

**Phase 44-01 decisions:**
- getRawClient() on SessionStorageFactory: rateLimiter.ts imported deleted legacyRedis export; fixed by adding getRawClient() to storageFactory so rate limiter reuses the single Redis connection — no duplicate connection, clean architecture
- admin.ts flag response shape: flags[].username replaced by flags[].userId (UUID string) — accounts platform resolves display names; UUID is accurate
- profile.ts full rewrite: PATCH /name, PATCH /password, POST /avatar all required deleted User model; frontend does not call these routes so removed entirely
- GameSession.userId now string (not string | number) — anonymous sessions remain as 'anonymous' string; integer user path fully removed

**Phase 45-01 decisions:**
- tierResolved defaults to false in authStore; set to true in all 4 AuthInitializer exit paths (success, profile-fetch-failure, no-session, no-refresh-token)
- setLoading(false) moved into per-branch finally blocks — prevents AdminGuard from briefly seeing stale JWT-metadata tier before accounts API call completes
- AdminGuard uses store-level tier field (not user.tier) for empowered check — user.tier is stale JWT metadata after Supabase token refresh which does not reliably populate user_metadata.tier
- Profile.tsx accessToken null guard: early-return redirect to /login?from=/profile rather than passing empty string to Bearer header
- fetchAccountProfile failure in AuthInitializer silently swallowed — session remains valid, tier stays at JWT metadata fallback

### Pending Todos

- [ ] Set EMPOWERED_ACCOUNTS_URL in backend/.env (required for gem awards — code complete, runtime path blocked without this)
- [ ] Admin review of audit-address-phone report (QUAL-04 advisory items)
- [ ] Assess Norwich by-election/MP terminology gap — editorial judgment for content review
- [x] Confirm Supabase credentials — DONE (PAT provided, project kxsdzaojfaibhuzmclfq linked)
- [x] Manual Supabase Dashboard step: Settings > API > Exposed schemas > add "trivia" — DONE (confirmed by 40-03 type generation showing all 9 trivia tables)
- [x] Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY — DONE (confirmed in backend/.env)
- [x] Plan 02: migrate all callers from req.user.userId to req.userId — DONE (41-02 complete)

### Blockers/Concerns

- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not confirmed as frontend env vars — exchangeRefreshToken falls back to ACCOUNTS_API_URL if absent (token refresh may fail after ~1hr)
- Phase 44-01 complete: integer-user path removed, updateUserProgression deleted, User model deleted — GEMS-03 markers resolved
- "Manage your Empowered Account" link on profile broken — ACCOUNTS_API_URL points to API endpoint, not a user-facing web UI URL; needs a separate VITE_EMPOWERED_ACCOUNTS_WEB_URL env var or hardcoded platform URL

### Infrastructure Fixes Applied During Deploy (2026-03-01)

- DATABASE_URL: now using Session Pooler (aws-0-us-west-1, IPv4) — direct connection was IPv6-only, unreachable from Render
- backend/src/config/database.ts: added setDefaultResultOrder('ipv4first') as belt-and-suspenders
- backend/src/routes/profile.ts: replaced legacy User.getProfileStats/findById with player_stats + player_prefs Drizzle queries
- frontend Profile.tsx: null guard on display_name — Avatar and h1 fall back to email if display_name is null
- Render env vars added: FRONTEND_URL_ALT=https://ctc.empowered.vote, NODE_OPTIONS=--dns-result-order=ipv4first

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 45-01-PLAN.md — tierResolved flag, AdminGuard race fix, Profile.tsx tier sync and null guard all committed
Resume file: None

Next action: Phase 45-01 code changes now committed (8246b42, 4e151b9). Phase 46 gap-closure or other Phase 45 plans as needed.
