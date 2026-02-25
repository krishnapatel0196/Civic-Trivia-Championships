# Requirements: Civic Trivia Championship

**Defined:** 2026-02-25
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

---

## v1.7 Requirements

Requirements for the Live Civic Intelligence milestone. Continues from v1.6 (phases 31-34).

### Election Pipeline — Foundation

- [ ] **ELEC-01**: Admin can create an election race record with seat name, election type (primary/general/runoff/by-election), election date, jurisdiction, timezone, and candidate list (name, party, incumbent flag)
- [ ] **ELEC-02**: `election_races` PostgreSQL table exists with fields: seat, election_type, election_date, timezone, jurisdiction, candidates (JSONB), questions_generated, followup_generated, result, created_at
- [ ] **ELEC-03**: `questions` table has nullable `election_race_id` foreign key linking election questions to their race

### Election Pipeline — Question Generation

- [ ] **ELEC-04**: Admin can trigger question generation for a specific race from the admin election management UI
- [ ] **ELEC-05**: Election question generation produces questions referencing actual candidate names and seat from the race record
- [ ] **ELEC-06**: Generated election questions have `expiresAt` set to end-of-day on election date in the jurisdiction's local timezone (not UTC midnight)
- [ ] **ELEC-07**: Generated election questions are linked to their election race via `election_race_id`
- [ ] **ELEC-08**: Generated election questions enter `draft` status; admin activates before players see them
- [ ] **ELEC-09**: Election generation prompt includes MCQ construction guidance for small candidate pools (2 candidates) and crowded primaries (5+ candidates) to prevent degenerate answer options
- [ ] **ELEC-10**: After generation, `election_races.questions_generated` flag is set to `TRUE` to prevent duplicate generation runs

### Election Pipeline — Cron Detection

- [ ] **ELEC-11**: Daily cron job (6 AM) queries `election_races` for races within the next 60 days where `questions_generated = FALSE`
- [ ] **ELEC-12**: Cron job auto-triggers question generation for detected races without manual admin intervention
- [ ] **ELEC-13**: Cron job logs clearly when no upcoming elections are found (distinguishable from silent failure)
- [ ] **ELEC-14**: Cron idempotency: if generation script is called twice for the same race (flag not yet set), secondary existence check on `election_race_id` prevents duplicate questions

### Election Pipeline — Current Officeholder Stage

- [ ] **ELEC-15**: Admin can enter election result (winner name, term end date) for an expired election race from the admin election management UI
- [ ] **ELEC-16**: Admin can trigger current-term question generation after entering winner data
- [ ] **ELEC-17**: Current-term questions ("Who is the current [seat]?", "When does [officeholder]'s term expire?") are generated with `expiresAt` set to the term end date
- [ ] **ELEC-18**: After current-term generation, `election_races.followup_generated` flag is set to `TRUE`

### Election Pipeline — Admin UI

- [ ] **ELEC-19**: Admin election management page exists at `/admin/elections`
- [ ] **ELEC-20**: Page shows three sections: Active Elections (questions live), Pending Generation (questions_generated = FALSE), Awaiting Follow-up (expired, followup_generated = FALSE)
- [ ] **ELEC-21**: "Generate Now" button manually triggers generation for a pending race (bypasses cron for immediate need)
- [ ] **ELEC-22**: "Enter Result + Generate Current-Term Questions" action available for expired races awaiting follow-up; form captures winner name and term end date
- [ ] **ELEC-23**: Admin can update a race's candidate list (e.g., when a candidate withdraws) and re-trigger generation; previously generated questions are archived before regeneration

### Quality Rule

- [ ] **QUAL-01**: New advisory quality rule `checkAddressPhone` detects questions where any answer option contains a phone number (US or UK format) or street address
- [ ] **QUAL-02**: Rule is registered in the quality rules engine and runs as part of standard question validation
- [ ] **QUAL-03**: `audit-address-phone.ts` script scans all 519 active questions, outputs a report of flagged questions grouped by collection — no auto-archival
- [ ] **QUAL-04**: Admin reviews audit report and manually archives confirmed violations (phone numbers and explicit street addresses as answers)

### Norwich, England Collection

- [ ] **NORW-01**: `norwich-uk` locale config exists with UK civic terminology (councillor, ward, by-election, MP), two-tier government framing (City Council vs Norfolk County Council), and currency/date format guidance
- [ ] **NORW-02**: Norwich collection is generated with 50-90 questions targeting 6 categories: city government, civic history, landmarks/institutions, economy/culture, Norfolk county context, sports/community
- [ ] **NORW-03**: Norwich generation prompts explicitly distinguish Norwich City Council responsibilities (housing, planning, leisure) from Norfolk County Council responsibilities (roads, schools, social care)
- [ ] **NORW-04**: Norwich collection is seeded, activated, and playable in production with collection card
- [ ] **NORW-05**: `externalIdPrefix` for Norwich questions is `nor` (follows established 3-char pattern)

---

## Future Requirements

Requirements acknowledged but deferred to later milestones.

### Election Data Automation

- **ELEC-F01**: Automated scraper for Alameda County (Fremont) election portal to populate `election_races` without admin entry
- **ELEC-F02**: Automated scrapers for Monroe County (Bloomington), LA County election portals
- **ELEC-F03**: Democracy Club API integration for automated Norwich UK election data
- **ELEC-F04**: Election data change detection (candidate withdrawal auto-detection, race cancellation)

### Additional Collections

- **COLL-F01**: England/UK national collection (deferred — Norwich collection established first)
- **COLL-F02**: Additional UK city collections (Birmingham, Manchester, Bristol)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Policy position questions ("Which candidate supports X?") | Invites partisan framing; violates no-dark-patterns principle |
| Campaign finance questions | Rapidly outdated, highly variable, poor trivia value |
| Prediction questions ("Who will win?") | Speculation, not civic learning |
| Automated county portal scraping | Too fragile for v1.7; admin entry achieves same result; v1.8+ |
| England/UK national collection | Norwich must be established first; v1.8 |
| Real-time candidate data from Ballotpedia API | Paid subscription; not needed when admin entry works for initial build |

---

## Traceability

Phase numbering continues from Phase 34 (last v1.6 phase).

| Requirement | Phase | Status |
|-------------|-------|--------|
| ELEC-01 | Phase 35 | Pending |
| ELEC-02 | Phase 35 | Pending |
| ELEC-03 | Phase 35 | Pending |
| QUAL-01 | Phase 35 | Pending |
| QUAL-02 | Phase 35 | Pending |
| QUAL-03 | Phase 35 | Pending |
| QUAL-04 | Phase 35 | Pending |
| NORW-01 | Phase 36 | Pending |
| NORW-02 | Phase 36 | Pending |
| NORW-03 | Phase 36 | Pending |
| NORW-04 | Phase 36 | Pending |
| NORW-05 | Phase 36 | Pending |
| ELEC-04 | Phase 37 | Pending |
| ELEC-05 | Phase 37 | Pending |
| ELEC-06 | Phase 37 | Pending |
| ELEC-07 | Phase 37 | Pending |
| ELEC-08 | Phase 37 | Pending |
| ELEC-09 | Phase 37 | Pending |
| ELEC-10 | Phase 37 | Pending |
| ELEC-11 | Phase 38 | Pending |
| ELEC-12 | Phase 38 | Pending |
| ELEC-13 | Phase 38 | Pending |
| ELEC-14 | Phase 38 | Pending |
| ELEC-15 | Phase 38 | Pending |
| ELEC-16 | Phase 38 | Pending |
| ELEC-17 | Phase 38 | Pending |
| ELEC-18 | Phase 38 | Pending |
| ELEC-19 | Phase 38 | Pending |
| ELEC-20 | Phase 38 | Pending |
| ELEC-21 | Phase 38 | Pending |
| ELEC-22 | Phase 38 | Pending |
| ELEC-23 | Phase 38 | Pending |

**Coverage:**
- v1.7 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---

*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after initial v1.7 definition*
