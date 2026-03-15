# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.
**Current focus:** v2.1 Collection Excellence — ALL PHASES COMPLETE (Phases 57–62 shipped)

## Current Position

Phase: 62 of 62 (Mississippi State Collection) — COMPLETE
Plan: 02 of 2 — complete
Status: Phase 62 complete — v2.1 MILESTONE COMPLETE
Last activity: 2026-03-15 — Completed 62-02: Mississippi State activated (86q, 15.1% expiring, New State Capitol banner, v2.1 milestone summary + retrospective appended to COLLECTION-PLAYBOOK.md)

Progress: [██████████] v1.0–v2.1 complete (Phases 1–62) | 16 collections active | ~2,800 questions | v2.1 ALL phases complete ✓

**Milestone history:**
- v1.0–v2.0 (Phases 1–56): All Complete — see .planning/MILESTONES.md

**Deployment Status:**
- Frontend LIVE: https://civic-trivia-frontend.onrender.com / https://ctc.empowered.vote
- Backend LIVE: https://civic-trivia-backend.onrender.com
- Database: Supabase shared project (kxsdzaojfaibhuzmclfq) — trivia schema deployed, TypeScript types generated
- Redis: Upstash (stirred-pika-7510)
- Active collections (14 total — including Washington DC pending activation): Federal, Bloomington IN, Fremont CA, Los Angeles CA, Indiana, California, Norwich England, Cambridge MA, Massachusetts, Plano TX, Texas, Portland OR, Oregon, Washington DC (inactive)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key decisions relevant to v2.1:
- Near-duplicate detection gap: CLOSED (57-01) — runWithinCollectionSemanticDedup() now auto-runs after generation; manual scan-duplicates.ts pass no longer required per collection
- Within-collection dedup uses empty tierMap for ClusterBuilder — quality score then externalId alphabetical order breaks ties (correct for single-collection context)
- Expiring ratio warning non-blocking (57-02): exit 0 even when ratio < 15% — enforcing as a block would gate older collections; forward-looking quality nudge only
- Two-query expiry model (57-02): expiringRatioCount (IS NOT NULL, no date filter) for ratio warning; expiringCount (90-day window) for netCount blocker
- COLLECTION-PLAYBOOK.md (57-02): lives in .planning/ root as cross-phase living document; append retrospective after each collection phase
- Mixed-durability pattern established (Texas State): expiring + durable questions in one collection; target 15–30% expiring
- State-only curation rule: city/regional landmarks prohibited by name in state collections
- Scaffold Bug 2 (known): step3 inserts into type annotation line — revert generate-locale-questions.ts to HEAD; state auto-discovery handles registration
- Washington DC framing: district tier (not city, not state); DC Council + Mayor structure; Home Rule Charter 1973; no voting Congressional representation
- Portland 58-01: 61 questions accepted below 80 target — source docs returned website nav content causing parks-natural batch to generate website topics; 61 is above 50-minimum READY threshold with 23% expiring
- Portland staggered terms (58-01): Districts 1&2 = 2029, Districts 3&4 = 2027, Mayor/Auditor = 2029; councilor not commissioner since Jan 2025
- Source quality watchpoint (58-01): verify portland.gov-style source fetches return substantive content before generation; government sites often return navigation/sitemap pages with minimal prose
- Portland OR activated with 61 questions (58-02): below 80 target but above 50 READY threshold; 23% expiring ratio within 15-30% window; collection live in production
- Source URL carry-forward (58-02): prefer Wikipedia article URLs over government portal URLs for park/landmark topics; spot-check 2-3 sources before generation; target 1.4x question buffer for city collections
- Wikipedia API fix (58-03): fetch-sources.ts now routes en.wikipedia.org/wiki/ URLs through w/api.php extracts API — HTML scraping was blocked by Wikipedia bot protection (0 bytes). Fix is universal for all future collections.
- Portland OR gap closure (58-03): reached 83 active questions; 18.1% expiring ratio; CONTENT-01 satisfied
- Oregon State expiring ratio ceiling (59-02): 7.4% (6/81) is structural ceiling for state collections — Governor, SoS, AG, Treasurer, Senate President, House Speaker exhausts all viable expiring targets; accepted per plan context (do not force artificial expiring questions)
- State collection content saturation (59-02): automated pipeline yields 50-70 unique questions for most US states; manual supplementation to reach 80 is a normal pattern — plan for it upfront
- Oregon supplementation pattern (59-02): inserted 25 hand-crafted questions on uncovered topics (judiciary, Oregon Trail, Tom McCall, Kate Brown succession, Measure 91, counties) after 3 generation runs hit dedup wall
- Washington DC city tier (60-01): DC uses city tier (no district tier in schema); district framing expressed via voice guidance; city-level content density yielded 103 draft questions from one generation run — strong result
- Washington DC scaffold corrections (60-01): Scaffold Bug 2 triggered — reverted generate-locale-questions.ts and manually registered; also corrected localeName and iconIdentifier post-scaffold
- Washington DC expiring ratio gap (60-01): generator did not set expiresAt on any questions; curator must manually set during curation checkpoint: Mayor Bowser 2027-01-02, Chair Mendelson 2027-01-02, AG Schwalb 2027-01-02, Delegate 2027-01-03
- Biloxi, MS scaffold (61-01): Scaffold Bug 2 triggered again — revert + manual registration is the standard pattern for city collections; also fixed apostrophe syntax error in collections.ts description (use double-quote strings for taglines with apostrophes)
- Biloxi, MS generation (61-01): 155 draft questions after semantic dedup from 190 seeded; 3 Wikipedia sources returned 0 chars but main Biloxi article provided sufficient coverage; expiring ratio 0% — targeted officeholder pass in 61-02
- Biloxi, MS curation (61-01): curator removed casino questions (over 9-question cap), muted others; 144 draft questions post-curation; Ward 4 name "Jamie Creel" not flagged — confirmed carry-forward for officeholder pass
- Biloxi, MS activation (61-02): 26 officeholder questions added via 3-pass strategy (bxl-401 to bxl-436, all expiresAt 2029-06-01); 15.3% expiring ratio achieved; 170 total active questions; Biloxi Lighthouse banner (CC BY-SA 3.0, 1200x900); Phase 61 complete
- Large council budget rule (61-02): 7-ward council requires 2q/ward-member (forward + reverse lookup) + 4q/mayor to reach 15% expiring target in 130-170 question pool; single-pass at 1q/ward only reaches ~8-9%
- Mississippi State scaffold (62-01): Scaffold Bug 2 triggered (5th consecutive) — revert + manual registration; localeName='Mississippi' (short form)
- Mississippi State generation (62-01): 107 draft questions after 1 full pass + partial second; 83 after human curation
- Mississippi State activation (62-02): 3 targeted questions added (mis-401-403, expiresAt 2028-01-13); 15.1% expiring ratio; 86 active questions; New State Capitol banner (public domain, 339KB); v2.1 COMPLETE
- State collection officeholder gap (62-02): Speaker Pro Tem consistently missed by generation; must be listed by name in locale config or added manually

### Pending Todos

- [x] **Enforce 15–30% expiring question ratio** — DONE (57-02): audit script warns when ratio < 15%
- [ ] **Auto-regenerate expired questions** — deferred to future milestone after ratio enforcement lands

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 022 | What would it take to make a new collection of questions? | 2026-03-01 | [022-what-would-it-take-to-make-a-new-collect](./quick/022-what-would-it-take-to-make-a-new-collect/) |
| 023 | Scaffold and activate collection CLIs | 2026-03-01 | [023-scaffold-and-activate-collection-cli](./quick/023-scaffold-and-activate-collection-cli/) |
| 024 | Responsive game UI layout — no scrolling to see answers or timer | 2026-03-03 | [024-game-ui-responsive-layout-fixes](./quick/024-game-ui-responsive-layout-fixes/) |
| 025 | Mobile-friendly admin panel — card lists, full-screen panels, responsive layouts | 2026-03-09 | [025-mobile-friendly-admin-panel](./quick/025-mobile-friendly-admin-panel/) |
| 026 | Push 32 commits to origin/master — fix Portland image 404, ship Phases 58–59 | 2026-03-12 | [026-fix-portland-image-404-and-push-portland](./quick/026-fix-portland-image-404-and-push-portland/) |

## Session Continuity

Last session: 2026-03-15
Stopped at: 62-02 complete — Mississippi State activated (86q, 15.1% expiring); v2.1 milestone complete
Resume file: None

Next action: Run `/gsd:audit-milestone` to verify v2.1 cross-phase integration, then `/gsd:complete-milestone` to archive v2.1 and plan v2.2
