# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** Phase 75 — DB Foundation + Type System (v2.5 International Collections)

## Current Position

Phase: 75 of 80 (DB Foundation + Type System)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-04-08 — v2.5 roadmap created; Phase 75 is next

Progress: [██████████] v1.0–v2.4 complete (Phases 1–74); v2.5 Phases 75–80 pending

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema
- Redis: Upstash (stirred-pika-7510)
- Active collections (34 total): Federal + 21 local + 12 state (see MEMORY.md for full list)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

v2.5 decisions at roadmap time (2026-04-08):
- International pipeline uses RSS-body-first strategy (`<content:encoded>` primary, HTTP fallback) — bypasses paywall and JS-rendering issues without extra packages
- Partisan framing is a BLOCKING quality gate for International content (not advisory) — err toward omission over queue overload
- expirationSweep.ts replacement generator must skip tier === 'international' collections — guard added in Phase 75 alongside schema work
- Phases 79 (launch collections) and 80 (admin visibility) are independent and can execute in parallel
- user_collection_mutes table is created in Phase 75 (DB foundation) but the muting UI is deferred to v2.6 — table exists, feature does not
- Reuters excluded (discontinued RSS June 2020); AP News excluded (no official RSS); 4 confirmed feeds: BBC World, NPR, The Guardian, DW
- Feed list stored in DB or config file — never hardcoded

### Pending Todos

- trivia_service DB role needs password reset via Supabase dashboard (non-blocking; using postgres superuser currently)
- Tucson, AZ expiring ratio at 8.3% — below 15% advisory target; ~6 more officeholder questions would close it (non-blocking)
- Decide AP News sourcing strategy before Phase 77 (skip AP or use verified aggregator)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-08
Stopped at: v2.5 roadmap written; ready to plan Phase 75
Resume file: None

Next action: `/gsd:plan-phase 75`
