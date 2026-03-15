# Requirements: Civic Trivia Championship v2.2 Pipeline Intelligence

**Defined:** 2026-03-15
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## v1 Requirements (this milestone)

### Tooling

- [x] **TOOL-01**: `scaffold-collection.ts` runs without corrupting `generate-locale-questions.ts` (Scaffold Bug 2 fix)
- [ ] **TOOL-02**: LocaleConfig has optional `officeholders` field (name, role, termEnd date)
- [ ] **TOOL-03**: Generation prompt injects officeholder names and roles when `officeholders` field is present
- [ ] **TOOL-04**: Post-generation step auto-sets `expiresAt` on questions referencing officeholders by name
- [ ] **TOOL-05**: `audit-collection-readiness.ts` reports officeholder `expiresAt` coverage

### Content Operations

- [ ] **COPS-01**: Hourly expiry cron archives expired questions AND triggers replacement generation for the same collection
- [ ] **COPS-02**: Replacement question generated in same topic category as the expired question
- [ ] **COPS-03**: Replacement seeded as active (replacing a previously-active question — no draft step)
- [ ] **COPS-04**: If regeneration fails, expiry proceeds silently (never-throw — mirrors `awardPlatformXp` pattern)

### Platform Integration

- [ ] **GEMS-01**: `awardPlatformGems()` migrated from deprecated `connect.credit_gems` RPC to `POST /api/gems/award` with `TRIVIA_GEMS_KEY`
- [ ] **GEMS-02**: `TRIVIA_GEMS_KEY` env var added and validated on startup; direct Supabase RPC call removed

### Leaderboard

- [ ] **LEAD-01**: Leaderboard page shows top players (username, tier, level, total XP) sourced from `GET /api/account/profile/:userId` on the accounts API
- [ ] **LEAD-02**: Leaderboard ranks by total XP, accessible without auth; logged-in user's own rank is highlighted

### Collections

- [ ] **COLL-01**: Santa Monica, CA collection scaffolded with locale config, topics, voice guidance, and banner image
- [ ] **COLL-02**: ~80-100 questions generated via AI pipeline with semantic dedup
- [ ] **COLL-03**: Collection activated in production (15-30% expiring ratio target; `officeholders` field used to auto-seed expiresAt)

## Future Requirements

*(None identified — v2.2 scope is fully captured above)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin review step for auto-generated replacements | Replacement inherits trust of the question it replaces; draft step adds friction without value |
| Bulk officeholder backfill for existing collections | Retroactive work; new collections will use the field going forward |
| Scraper-based officeholder data sourcing | Admin-entered locale config is precise and reliable; scrapers are fragile |
| Blue/red gem awards | CTC is authorized for yellow only; other gem types are out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOOL-01 | Phase 63 | Pending |
| TOOL-02 | Phase 64 | Pending |
| TOOL-03 | Phase 64 | Pending |
| TOOL-04 | Phase 64 | Pending |
| TOOL-05 | Phase 64 | Pending |
| COPS-01 | Phase 65 | Pending |
| COPS-02 | Phase 65 | Pending |
| COPS-03 | Phase 65 | Pending |
| COPS-04 | Phase 65 | Pending |
| GEMS-01 | Phase 66 | Pending |
| GEMS-02 | Phase 66 | Pending |
| LEAD-01 | Phase 67 | Pending |
| LEAD-02 | Phase 67 | Pending |
| COLL-01 | Phase 68 | Pending |
| COLL-02 | Phase 68 | Pending |
| COLL-03 | Phase 68 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 — gem migration and leaderboard added; Santa Monica renumbered to Phase 68*
