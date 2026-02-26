# Roadmap: Civic Trivia Championship

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-13)
- ✅ **v1.1 Production Hardening** - Phases 8-12 (shipped 2026-02-18)
- ✅ **v1.2 Community Collections** - Phases 13-17 (shipped 2026-02-19)
- ✅ **v1.3 Question Quality & Admin Tools** - Phases 18-22 (shipped 2026-02-20)
- ✅ **v1.4 Fremont CA Collection** - Phases 23-26 (shipped 2026-02-21)
- ✅ **v1.5 Feedback Marks** - Phases 27-30 (shipped 2026-02-22)
- ✅ **v1.6 Content Quality & Scale** - Phases 31-34 (shipped 2026-02-24)
- 🚧 **v1.7 Live Civic Intelligence** - Phases 35-38 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v1.6 (Phases 1-34) - SHIPPED</summary>

Phases 1-34 complete. See MILESTONES.md for full details.

- v1.0 MVP: Phases 1-7 (solo game flow, auth, 120 questions, scoring, XP/gems, WCAG AA)
- v1.1 Production Hardening: Phases 8-12 (Redis sessions, plausibility detection, UX improvements)
- v1.2 Community Collections: Phases 13-17 (PostgreSQL collections, Bloomington/LA, expiration cron)
- v1.3 Question Quality & Admin Tools: Phases 18-22 (quality rules engine, admin UI, Indiana/California collections)
- v1.4 Fremont CA Collection: Phases 23-26 (92 questions, generation pipeline, cultural sensitivity)
- v1.5 Feedback Marks: Phases 27-30 (in-game flagging, post-game elaboration, admin flag queue)
- v1.6 Content Quality & Scale: Phases 31-34 (semantic dedup, 268 duplicates archived, 519 active questions)

</details>

---

### 🚧 v1.7 Live Civic Intelligence (In Progress)

**Milestone Goal:** Make the trivia platform react to real civic events — election questions that appear when races are announced and expire on election day; a new UK city collection; and a quality rule that catches phone/address answers before they reach players.

---

#### Phase 35: Election Data Foundation + Quality Rule

**Goal:** The database is ready to store election races and the address/phone quality rule is enforcing content standards — no player-facing changes, but the infrastructure enabling the entire election pipeline is in place.

**Depends on:** Nothing (pure schema and quality rule additions)

**Requirements:** ELEC-01, ELEC-02, ELEC-03, QUAL-01, QUAL-02, QUAL-03, QUAL-04

**Success Criteria** (what must be TRUE):
1. An `election_races` row can be inserted with seat, election_type, election_date, timezone, jurisdiction, candidates (JSONB), questions_generated, followup_generated, and result columns — confirmed by a direct DB query
2. The `questions` table has a nullable `election_race_id` foreign key column — confirmed by schema inspection
3. Admin can create an election race record through the admin UI with seat name, election type, election date, jurisdiction, timezone, and candidate list
4. Running the `audit-address-phone.ts` script against all 519 active questions produces a grouped report of flagged questions — no auto-archival occurs
5. The `checkAddressPhone` rule runs as part of standard question validation (quality score recalculated for any new question includes the rule's output)

**Plans:** 2 plans

Plans:
- [ ] 35-01-PLAN.md — election_races schema, election_race_id FK, admin API + Elections page
- [ ] 35-02-PLAN.md — checkAddressPhone quality rule, engine registration, audit script

---

#### Phase 36: Norwich, England Collection

**Goal:** Players can select a Norwich, England collection from the collection picker and play a full game of local civic questions — the platform's first non-US collection.

**Depends on:** Nothing (independent of election pipeline)

**Requirements:** NORW-01, NORW-02, NORW-03, NORW-04, NORW-05

**Success Criteria** (what must be TRUE):
1. A seventh collection card for Norwich, England appears on the collection picker screen in production
2. Starting a game with the Norwich collection delivers 10 questions covering Norwich City Council, Norfolk county context, civic history, landmarks, and local culture
3. Norwich questions use UK civic terminology throughout (councillor, ward, by-election, MP) — no US-specific terms
4. Questions correctly attribute responsibilities to Norwich City Council (housing, planning, leisure) vs Norfolk County Council (roads, schools, social care) — no cross-tier attribution errors
5. All Norwich questions have `externalId` prefixed with `nor` (e.g., `nor-001`)

**Plans:** TBD

Plans:
- [ ] 36-01: norwich-uk locale config, source fetch, question generation, seed, and activate

---

#### Phase 37: Election Question Generation Script

**Goal:** Admin can manually trigger election question generation for a specific race and see draft questions appear in the question explorer — questions reference real candidate names, carry correct expiry dates, and link back to their race.

**Depends on:** Phase 35 (election_races table must exist)

**Requirements:** ELEC-04, ELEC-05, ELEC-06, ELEC-07, ELEC-08, ELEC-09, ELEC-10

**Success Criteria** (what must be TRUE):
1. Admin triggers question generation for a test race from the admin election UI; draft questions appear in the question explorer filtered by the race's jurisdiction
2. Generated questions contain actual candidate names and the seat name from the race record (not placeholder text)
3. Each generated question has `expiresAt` set to end-of-day on election date in the jurisdiction's local timezone (e.g., a Fremont CA race expires at 23:59:59 Pacific, not UTC midnight)
4. Each generated question has `election_race_id` set to the originating race's ID — visible in question detail panel
5. After generation, `election_races.questions_generated` is TRUE for that race — a second manual trigger attempt shows an error or no-op rather than creating duplicates

**Plans:** TBD

Plans:
- [ ] 37-01: generate-election-questions.ts script, buildElectionSystemPrompt(), timezone expiry, idempotency flag

---

#### Phase 38: Election Cron + Current-Term Stage + Admin Election UI

**Goal:** The full election lifecycle runs end-to-end — the daily cron auto-detects upcoming races and generates questions; expired races await follow-up; admin enters the winner and triggers current-term questions that persist until the term ends.

**Depends on:** Phase 35 (schema), Phase 37 (generation script)

**Requirements:** ELEC-11, ELEC-12, ELEC-13, ELEC-14, ELEC-15, ELEC-16, ELEC-17, ELEC-18, ELEC-19, ELEC-20, ELEC-21, ELEC-22, ELEC-23

**Success Criteria** (what must be TRUE):
1. A race with `questions_generated = FALSE` and `election_date` within 60 days is auto-detected by the daily 6 AM cron — questions are generated without any admin action; cron logs explicitly state how many races were detected and processed
2. Running the cron twice for the same race does not create duplicate questions — the second run skips generation and logs the race as already processed
3. Admin navigates to `/admin/elections` and sees three distinct sections: Active Elections, Pending Generation, and Awaiting Follow-up — each populated correctly based on race state
4. Admin enters winner name and term end date for an expired race via the "Enter Result + Generate Current-Term Questions" form; current-term questions are generated with `expiresAt` set to the term end date; `followup_generated` is set to TRUE
5. Admin can update a race's candidate list and re-trigger generation; previously generated questions are archived before new questions are created

**Plans:** TBD

Plans:
- [ ] 38-01: electionDetection.ts cron job, startCron.ts registration, idempotency
- [ ] 38-02: Current-term question generation (follow-up stage, term-end expiry)
- [ ] 38-03: ElectionManagementPage.tsx, admin API endpoints, nav link, route

---

## Progress

**Execution Order:** 35 → 36 → 37 → 38

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-34 (v1.0-v1.6) | v1.0-v1.6 | 99/99 | Complete | 2026-02-24 |
| 35. Election Data Foundation + Quality Rule | v1.7 | 0/2 | Not started | - |
| 36. Norwich, England Collection | v1.7 | 0/1 | Not started | - |
| 37. Election Question Generation Script | v1.7 | 0/1 | Not started | - |
| 38. Election Cron + Current-Term Stage + Admin Election UI | v1.7 | 0/3 | Not started | - |
