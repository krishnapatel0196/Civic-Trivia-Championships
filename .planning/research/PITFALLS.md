# Pitfalls Research: v1.7 Live Civic Intelligence

**Project:** Civic Trivia Championship
**Researched:** 2026-02-25
**Focus:** Election data reliability, time-boxed question fragility, UK collection, quality audit risks

---

## Election Data Scraping Pitfalls

### 1. County portal HTML is structurally fragile — HIGH

**Description:** Each county/city election website has a unique layout that can change between election cycles without notice. A scraper that works in June 2026 may break by November 2026.

**Warning signs:** Empty candidate arrays returned from scraper; HTTP 200 but no data parsed.

**Prevention:** For v1.7, **admin enters race data manually** rather than scraping. This is the Architecture doc's explicit decision. Build the generation pipeline first; attach scraping behind it in v1.8 when the pipeline is stable and specific jurisdictions can be targeted.

**Phase:** Addressed by design — v1.7 uses admin entry, not automated scraping.

---

### 2. Candidate data appears late in filing periods — MEDIUM

**Description:** Official candidate lists aren't finalized until after the filing deadline. Alameda County's June 2026 primary has a filing period — generating questions before it closes risks creating questions about candidates who don't end up on the ballot.

**Warning signs:** Admin enters race data from early news reports; candidate later doesn't qualify.

**Prevention:** Admin should only enter race data after the official filing deadline passes and the candidate list is certified. Add a note in the admin UI: "Enter candidates after official filing deadline."

**Phase:** Document in admin UI instructions (Phase 5 — election admin UI).

---

### 3. Google Civic Information API — partial deprecation — MEDIUM

**Description:** Google deprecated the Representatives API in April 2025. The Elections API still exists but does not provide candidate lists — only election dates and voting logistics. Any plans to use Google Civic for candidate data will fail.

**Warning signs:** API returns election dates but empty candidates arrays.

**Prevention:** Do not use Google Civic Information API for candidate data. Use Democracy Club (UK) or admin entry (US).

**Phase:** Addressed in STACK.md — Google Civic explicitly excluded.

---

## Time-Boxed Question Generation Pitfalls

### 4. Candidate withdraws after questions go live — HIGH

**Description:** A candidate drops out of a race after election questions have been generated and activated. Players are now being quizzed on a question whose correct answer is wrong ("Alice Smith is running for [seat]" — but Alice withdrew last week).

**Warning signs:** News reports of candidate withdrawal; admin sees flagged questions mentioning the withdrawn candidate.

**Prevention:**
1. The `withdrew: boolean` field on the `candidates` JSONB array in `election_races` supports this case
2. When admin learns of withdrawal: (a) update the `candidates` record, (b) archive the affected questions, (c) regenerate with corrected candidate list
3. The admin ElectionManagementPage should show "Active Elections" section where admin can trigger "Regenerate" for a race with updated candidate data

**Phase:** Phase 5 (Admin election management UI) — add regenerate action.

---

### 5. Multiple choice construction for small candidate pools — MEDIUM

**Description:** For a 2-candidate race, a question "Who is running for [seat]?" with four MCQ options is trivially easy — players can deduce correct answer from partial knowledge. For a primary with 8 candidates, fitting all names into MCQ options is impossible.

**Warning signs:** Generation script produces degenerate MCQ (3 options are the same person's name spelled differently, or all wrong options are clearly fictional).

**Prevention:**
- For 2-candidate races: frame as "Which of these candidates IS NOT running for [seat]?" or ask about party/incumbent status instead of raw name recall
- For crowded primaries (5+): ask about specific candidates ("Is [NAME] running for [SEAT]?") rather than listing all options; or ask "Which of these IS running?" with 1 correct + 3 names from other races
- Prompt engineer the election generation script with explicit MCQ construction guidance for small/large pools

**Phase:** Phase 4 (election generation script) — build MCQ guidance into system prompt.

---

### 6. Election questions duplicating regular civic questions — MEDIUM

**Description:** The collection already has regular civic questions about local government structures. Time-boxed election questions about the same seat could create near-duplicates ("Who is the Fremont City Council District 2 representative?" vs "Who is running for Fremont City Council District 2?").

**Warning signs:** Semantic dedup scan flags election questions as near-duplicates of existing questions.

**Prevention:** Election questions are categorized with `subcategory: 'current-election'` tag. The generation prompt should explicitly note existing questions about this seat and ensure election questions focus on the *current race* (who is running, when is the election) rather than general role descriptions. Post-generation semantic dedup scan should run.

**Phase:** Phase 4 (election generation) — include dedup check in generation pipeline.

---

## Scheduling/Automation Pitfalls

### 7. Double-generation from cron idempotency failure — HIGH

**Description:** If the `questions_generated` flag isn't set atomically, a cron run could trigger generation twice for the same race, creating duplicate election question sets.

**Warning signs:** Two sets of near-identical election questions in the draft queue for the same race.

**Prevention:**
1. Primary guard: `questions_generated = TRUE` flag set immediately after generation starts (not after completion)
2. Secondary guard: generation script checks for existing questions with `election_race_id` before generating
3. Both guards run in a database transaction where possible

**Phase:** Phase 4 (generation script) and Phase 5 (cron detection).

---

### 8. Election expires at wrong time due to timezone mismatch — MEDIUM

**Description:** Alameda County elections occur in Pacific time; Bloomington elections in Eastern time. If `expiresAt` is set to `election_date + "T23:59:59Z"` (UTC), California questions expire at 4:59 PM local time on election day — before polls close.

**Warning signs:** Players report election questions disappeared before polls closed.

**Prevention:** Set `expiresAt` to `election_date + "T23:59:59"` in the **jurisdiction's local timezone**, then convert to UTC for storage. The `election_races` table should include a `timezone` column (e.g., "America/Los_Angeles", "America/Indiana/Indianapolis", "Europe/London").

**Phase:** Phase 1 (schema) — add `timezone` column to `election_races`. Phase 4 (generation) — use timezone when setting `expiresAt`.

---

### 9. Cron running when no elections are in the 60-day window — LOW

**Description:** The daily cron job finds no races to generate questions for. This is not a bug but should log clearly to avoid false-alarm monitoring alerts.

**Warning signs:** Cron runs daily but no log output (looks like silent failure).

**Prevention:** Log clearly: "Election detection: checked N jurisdictions, no upcoming elections within 60 days." This distinguishes "nothing to do" from "something failed."

**Phase:** Phase 5 (cron implementation).

---

## Norwich Collection Pitfalls

### 10. Norfolk County Council vs Norwich City Council confusion — HIGH

**Description:** Norwich has a two-tier government: Norwich City Council (lower tier, city services) and Norfolk County Council (upper tier, roads/schools/social care). Questions that conflate the two will confuse players and spread civic misinformation.

**Warning signs:** Generated questions attribute county responsibilities (roads, schools) to City Council, or vice versa.

**Prevention:**
- The `norwich-uk.ts` locale config's system prompt must explicitly explain the two-tier structure and which body handles which functions
- Include a validation check: any question mentioning "county council" in a Norwich context should be reviewed

**Phase:** Phase 2 (Norwich generation config).

---

### 11. UK civic terminology errors — MEDIUM

**Description:** The generation model defaults to US civic terminology. UK questions using "councilmember", "district", "congressman", or "state" will read as incorrect to UK players.

**Warning signs:** Generated questions use "councilmember" instead of "councillor", "district" instead of "ward", "mayor" in a context where Norfolk has no directly-elected mayor.

**Prevention:** The `norwich-uk.ts` locale config system prompt must include explicit terminology substitutions:
- councillor (not "council member")
- ward (not "district")
- MP (not "congressman/representative")
- by-election (not "special election")
- council chamber (not "city hall")
- Note: Norwich does NOT have a directly-elected mayor — it has a ceremonial Lord Mayor elected by councillors

**Phase:** Phase 2 (Norwich generation config).

---

### 12. Outdated Norwich civic facts — MEDIUM

**Description:** Norwich City Council composition changes after each election. Questions like "Which party controls Norwich City Council?" may be outdated within a year.

**Warning signs:** Questions about party control or specific councillor names without expiration dates.

**Prevention:**
- Questions about party control should reference a specific election year: "Following the 2023 local elections, which party holds the majority on Norwich City Council?"
- Questions about individual councillors (not current officeholders) should not be generated as standing facts — use election questions instead
- Set expiration dates for current-officeholder questions (like the election pipeline does)

**Phase:** Phase 2 (Norwich generation) — include in system prompt guidelines.

---

## Quality Rule Retroactive Audit Pitfalls

### 13. Advisory rule auto-archives legitimate questions — MEDIUM

**Description:** The address/phone rule is set to advisory severity. If the audit script runs with auto-archive enabled (like some previous audit scripts), it could archive legitimate questions about government building locations.

**Warning signs:** Questions like "Where is the Monroe County Courthouse located?" archived without review.

**Prevention:**
- The `audit-address-phone.ts` script must **report only** — no auto-archival
- Output a CSV/list of flagged questions for human review
- Admin reviews and manually archives only the clear violations (actual phone numbers, numeric street addresses with no civic context)
- See also: ARCHITECTURE.md confirms advisory severity with no auto-archival

**Phase:** Phase 3 (quality rule + audit script).

---

### 14. Regex patterns catching non-address numeric content — LOW

**Description:** The address detection regex (`/\b\d+\s+[A-Z]/`) could match things like "3 branches of government" or "5 Supreme Court justices" as false positives.

**Warning signs:** High false positive rate in audit output — many flagged questions are clearly not addresses.

**Prevention:**
- Require the pattern to include an explicit street type suffix (Street, Road, Avenue, etc.) — not just any number + word
- The UK postcode regex is fairly specific and should have low false positives
- Phone number regex requires 10 digits in standard format — low false positive risk

**Phase:** Phase 3 (rule implementation) — test regex against sample questions before running full audit.

---

*Research completed: 2026-02-25*
