# Project Research Summary

**Project:** Civic Trivia Championship v1.7 - Live Civic Intelligence
**Domain:** Election question pipeline, Norwich UK collection, quality rules
**Researched:** 2026-02-25
**Confidence:** HIGH

---

## Executive Summary

v1.7 adds three capabilities to the existing civic trivia platform: (1) time-boxed election questions that reflect real current races and expire on election day, (2) a quality rule blocking phone/address answers with retroactive audit, and (3) a Norwich, England collection. Research confirms all three are achievable with minimal new infrastructure — zero new npm packages required.

**The most important finding:** No reliable free API exists for US local election candidate data. Ballotpedia is paid; Google Civic deprecated its Representatives API in April 2025; OpenStates covers state legislature only. **The right approach for v1.7 is admin-entered race data**, with the generation pipeline designed to accept scraping later. This avoids fragile HTML scrapers while delivering the full election question lifecycle. Democracy Club provides free, open API data for UK elections (Norwich).

**Critical architecture insight:** The election pipeline needs a new `election_races` PostgreSQL table with a `questions_generated` flag for cron idempotency. In-memory is insufficient — the cron runs in a stateless process and would re-generate on every daily run without this flag. The existing hourly cron infrastructure extends cleanly with a single new daily job (6 AM, 60-day lookahead).

---

## Key Findings

### Recommended Stack

**No new npm dependencies needed for v1.7.** The election pipeline uses existing infrastructure:
- `node-cron` (already installed) — daily election detection job
- Drizzle ORM (already in use) — new `election_races` table schema
- Anthropic SDK (already installed) — election question generation
- PostgreSQL (Supabase, already in use) — election race data storage

**For UK election data (Norwich):** Democracy Club (`candidates.democracyclub.org.uk`) — free, open API, Creative Commons license, covers every UK election from district council level up. No API key required for read access. Covers Norwich City Council elections (13 wards, next election 2026).

**What NOT to use:**
- Google Civic Information API — Representatives endpoint deprecated April 2025
- OpenStates — state legislature only, not city council
- Playwright/Puppeteer for county portal scraping — heavy, brittle, v1.8+ consideration
- Ballotpedia API — paid subscription, not needed when admin entry achieves same result

### Expected Features

**Election pipeline table stakes:**
- Race-specific questions with real candidate names and seat names
- Expiration on election day (end of day, local timezone)
- Admin activation gate — draft → active flow prevents unreviewed content
- Election race DB record linking questions to races for follow-up workflow

**Election lifecycle (3 stages):**
1. Pre-election: who is running, what party, is there an incumbent (expires election day)
2. Post-primary: who won the primary, who advances to general (expires general election day)
3. Post-general: who won, historical result (no expiry — permanent civic fact)

**Norwich must-haves:**
- Explicit two-tier government framing (City Council vs Norfolk County Council)
- UK terminology throughout (councillor, ward, by-election, MP)
- ~55-90 questions across 6 categories (civic history, city government, landmarks, culture, Norfolk context, sports)

**Address/phone rule:**
- Advisory severity (not blocking) — legitimate civic location questions exist
- Flags any option containing a phone number or street address format
- Report-only audit script (no auto-archival)

### Architecture Approach

The Architecture agent produced a comprehensive spec (see ARCHITECTURE.md). Key decisions:

1. **`election_races` PostgreSQL table** — stores race metadata, candidate list (JSONB), `questions_generated` and `followup_generated` flags, and result. Required for cron idempotency across stateless process restarts.

2. **`election_race_id` FK on questions table** — nullable column linking election questions to their race. Enables admin UI to show all questions for a race and trigger follow-up generation.

3. **Candidate data as structured context, not RAG** — the existing pipeline uses scraped text documents as RAG. Candidate data (name, party, incumbent) is structured and should be injected as a formatted list in the user message, not as a text file.

4. **Admin activation gate on election questions** — generated questions go to `draft` status. Admin reviews and activates. This is the right balance for the auto-publish pipeline without a human review gate on regular generation.

5. **Advisory severity for address/phone rule** — "Where is City Hall located?" with a street address answer can be legitimate civic content. Advisory flag for human review, not automatic archival.

**Build order (from ARCHITECTURE.md):**
- Phase 1: DB schema (`election_races` table + `election_race_id` FK)
- Phase 2: Norwich collection (independent of election pipeline — ships playable collection immediately)
- Phase 3: Address/phone quality rule + audit (independent of election pipeline)
- Phase 4: Election generation script
- Phase 5: Election cron + detection
- Phase 6: Admin election management UI
- Phase 7: End-to-end verification

### Critical Pitfalls

Top 5 by severity:

1. **Candidate withdraws after questions go live (HIGH)** — Questions become factually wrong mid-election. Prevention: `withdrew` field on candidate JSONB + admin "Regenerate" action in election management UI.

2. **Cron double-generation if flag not set atomically (HIGH)** — Race generates questions twice, creating duplicates. Prevention: Set `questions_generated = TRUE` immediately when generation starts (not after); add secondary existence check.

3. **Timezone mismatch expiring questions before polls close (MEDIUM)** — Pacific-time elections expire at 4:59 PM local if stored as UTC. Prevention: `timezone` column on `election_races`; convert to UTC using jurisdiction's local timezone.

4. **Norfolk County Council vs Norwich City Council confusion (HIGH)** — Wrong attribution of responsibilities (roads, schools) to city vs county. Prevention: Explicit two-tier structure explanation in `norwich-uk.ts` system prompt.

5. **Retroactive audit auto-archiving legitimate questions (MEDIUM)** — Address rule shouldn't auto-archive "Where is City Hall located?". Prevention: Audit script is report-only; admin reviews flags manually.

---

## Implications for Roadmap

Research confirms the 7-phase build order from ARCHITECTURE.md. Suggested phase structure continuing from Phase 34:

### Phase 35: Election Data Foundation
**Goal:** DB schema changes (election_races table) and address/phone quality rule + audit
**Delivers:**
- `election_races` table with all required columns (seat, candidates JSONB, election_date, timezone, flags, result)
- `election_race_id` FK on questions table
- `address-phone.ts` quality rule (advisory severity)
- `audit-address-phone.ts` report script
- Audit run on existing 519 questions, human review of flagged questions

**Why first:** DB schema must exist before election generation (Phase 37 depends on it). Quality rule is independent and delivers immediate value.

### Phase 36: Norwich, England Collection
**Goal:** 50-90 local Norwich questions live in new collection
**Delivers:**
- `norwich-uk.ts` locale config with UK terminology, two-tier government framing
- Question generation (targeting 60-70 questions, source-limited)
- Collection seeded and activated in production

**Why second:** Completely independent of election pipeline. Delivers a playable collection immediately without waiting for the election pipeline phases.

### Phase 37: Election Question Generation Script
**Goal:** `generate-election-questions.ts` that consumes a race record and produces expiring questions
**Delivers:**
- Election-aware generation with candidate list as structured context
- `expiresAt` = election_date in jurisdiction's local timezone
- `election_race_id` FK linked on all generated questions
- `buildElectionSystemPrompt()` with MCQ guidance for small/large candidate pools
- Test with manually-entered race data

**Depends on:** Phase 35 (election_races table)

### Phase 38: Election Cron + Admin UI
**Goal:** Daily automated election detection and admin election management page
**Delivers:**
- `electionDetection.ts` cron job (daily 6 AM, 60-day lookahead, idempotency via flag)
- `startCron.ts` updated to register new job
- `ElectionManagementPage.tsx` at /admin/elections
- "Active", "Pending Generation", "Awaiting Follow-up" sections
- "Generate Follow-up" action with winner entry form
- End-to-end verification: create test race → cron detects → questions generated → expire → admin enters result → follow-up generated

**Depends on:** Phase 35 (schema), Phase 37 (generation script)

---

## Research Flags

**During planning/execution:**

1. **Norwich question count** — target is 50-90 but actual count will be source-limited. Expect ~60-70 before sources run dry (similar to Fremont's 54). Don't force 90.

2. **Address/phone audit false positive rate** — regex may catch "3 branches of government" type content if not carefully constrained. Test on sample before running full 519-question audit.

3. **Election MCQ for small candidate pools** — generation prompt needs explicit guidance for 2-candidate and 8+ candidate races. This is non-trivial prompt engineering; allow iteration in Phase 37.

4. **Follow-up generation prompt design** — "Who won?" questions are structurally simple, but the generation prompt needs to produce meaningfully different questions at each lifecycle stage without duplicating what was asked before the election.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new npm dependencies confirmed. Democracy Club API verified as free and active. |
| Features | HIGH | Election lifecycle stages are clear. Norwich example questions drafted and fact-checked. Address/phone detection patterns specified. |
| Architecture | HIGH | Architecture agent read codebase directly. Build order validated against actual file structure. |
| Pitfalls | HIGH | Top pitfalls are concrete and actionable. Timezone issue and double-generation risk specifically identified with prevention strategies. |

**Overall confidence: HIGH**

---

*Research completed: 2026-02-25*
*Ready for roadmap: yes*
