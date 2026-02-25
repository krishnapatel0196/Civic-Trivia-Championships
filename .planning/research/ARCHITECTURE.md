# Architecture Research: v1.7 Live Civic Intelligence

**Project:** Civic Trivia Championship
**Researched:** 2026-02-25
**Scope:** Election question pipeline integration with existing architecture

---

## New Components

| Component | Type | Responsibility | Location |
|-----------|------|---------------|----------|
| `ElectionScraper` | Script | Fetch and parse candidate/race data from official election sources | `backend/src/scripts/content-generation/election/scrape-election-data.ts` |
| `generate-election-questions.ts` | Script | Election-aware question generation using candidate list as context | `backend/src/scripts/content-generation/election/generate-election-questions.ts` |
| `electionDetection.ts` | Cron job | Daily check: are there upcoming elections needing questions? | `backend/src/cron/electionDetection.ts` |
| `address-phone.ts` | Quality rule | Detect questions with phone/address answers (advisory) | `backend/src/services/qualityRules/rules/address-phone.ts` |
| `norwich-uk.ts` | Locale config | Norwich locale config — UK terminology, date formats, sources | `backend/src/scripts/content-generation/locale-configs/norwich-uk.ts` |
| `ElectionManagementPage.tsx` | Admin UI page | View expired election question sets, trigger follow-up generation | `frontend/src/pages/admin/ElectionManagementPage.tsx` |

---

## Modified Components

| Component | What Changes | Why |
|-----------|-------------|-----|
| `startCron.ts` | Register `electionDetectionCron` alongside existing expiration cron | One cron startup file manages all scheduled jobs |
| `qualityRules/index.ts` | Import and register `checkAddressPhone` in `ALL_SYNC_RULES` | New rule must run with existing rule set |
| `generate-locale-questions.ts` | Add `norwich-uk` to the `supportedLocales` map; add `norwichConfig` key to config-key extraction list | Norwich follows the identical code path as Fremont/Bloomington |
| `admin.ts` (routes) | Add `GET /admin/election-sets` and `POST /admin/election-sets/:id/generate-followup` endpoints | Admin UI needs data and action endpoints |
| `AdminLayout.tsx` | Add "Elections" nav link | Surface new page to admin |
| `App.tsx` | Add route `/admin/elections` | Wire up new page |
| `system-prompt.ts` | Add `buildElectionSystemPrompt()` function for election-specific generation instructions | Election questions need different framing than general civic questions |

---

## Data Model Changes

### New PostgreSQL Table: `election_races`

Election data needs to persist between the scrape run and the generation run, and again between generation and post-election follow-up. In-memory is insufficient — the cron job runs in a stateless process. A lightweight table is the right call.

```sql
CREATE TABLE civic_trivia.election_races (
  id SERIAL PRIMARY KEY,
  jurisdiction TEXT NOT NULL,          -- e.g. "fremont-ca", "norwich-uk"
  seat TEXT NOT NULL,                  -- e.g. "Mayor", "City Council District 3"
  election_type TEXT NOT NULL,         -- "primary" | "general" | "runoff" | "by-election"
  election_date DATE NOT NULL,         -- The actual election date
  candidates JSONB NOT NULL,           -- Array of candidate objects (see below)
  questions_generated BOOLEAN NOT NULL DEFAULT FALSE,
  followup_generated BOOLEAN NOT NULL DEFAULT FALSE,
  result JSONB,                        -- Null until after election; populated by admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- candidates JSONB shape:
-- [{ name: string, party: string | null, incumbent: boolean, withdrew: boolean }]

CREATE INDEX idx_election_races_jurisdiction ON civic_trivia.election_races(jurisdiction);
CREATE INDEX idx_election_races_election_date ON civic_trivia.election_races(election_date);
CREATE INDEX idx_election_races_questions_generated ON civic_trivia.election_races(questions_generated);
```

**Why a table, not JSON files:**
- The `questions_generated` and `followup_generated` flags prevent duplicate generation runs (the cron idempotency mechanism)
- The `result` column stores who won — the admin enters this when triggering follow-up generation
- JSON files can't be queried by cron jobs efficiently

### New Column: `election_race_id` on `questions` table

```sql
ALTER TABLE civic_trivia.questions
  ADD COLUMN election_race_id INTEGER REFERENCES civic_trivia.election_races(id);
```

**Why:** Allows admin to find all questions for a race (to show the "Generate Follow-up" button only when questions exist) and to group expired election questions by race in the UI. Nullable — regular civic questions have NULL here.

### Drizzle Schema Updates

`backend/src/db/schema.ts` gets:
- New `electionRaces` table definition mirroring the SQL above
- New `electionRaceId` nullable FK column on the `questions` table
- Exported TypeScript types: `ElectionRace`, `NewElectionRace`

### No New Tables for Norwich

Norwich uses the same `collections`, `topics`, `collection_topics`, and `questions` tables. The locale config pattern handles all collection setup. No schema changes needed for Norwich.

---

## Election Lifecycle Data Flow

```
Step 1 — SCRAPE (manual or cron-triggered)
  Script: scrape-election-data.ts --jurisdiction fremont-ca
  Action: Fetches official election calendar (acvote.alamedacountyca.gov, etc.)
  Output: Inserts rows into election_races (questions_generated = false)
  Note: Scraping logic is jurisdiction-specific. Start with manual data entry
        for v1.7 (admin creates race via admin UI or direct DB insert).
        Automated scraping is a v1.8+ enhancement.

Step 2 — DETECTION (daily cron)
  Job: electionDetectionCron (runs daily at 6:00 AM)
  Query: SELECT * FROM election_races
           WHERE election_date > NOW()
           AND election_date <= NOW() + INTERVAL '60 days'
           AND questions_generated = FALSE
  Action: For each detected race, invokes generate-election-questions.ts
  Idempotency: questions_generated flag prevents re-runs

Step 3 — GENERATION (triggered by detection)
  Script: generate-election-questions.ts --race-id <id>
  Input: ElectionRace record (seat, candidates[], election_date)
  Claude context: Candidate list injected as structured data in user message
                  (NOT as RAG source documents — this is structured facts, not scraped text)
  Prompt: "Generate N questions about the upcoming [SEAT] election.
           Candidates: [CAND1 (Party, incumbent)], [CAND2 (Party)]...
           Election date: [DATE]. Questions expire on election day."
  expiresAt: Set to election_date + "T23:59:59Z" (questions expire end of election day)
  Topics: Seeded into jurisdiction's existing collection (e.g., fremont-ca)
  Topic tag: "current-election" subcategory
  Status: 'draft' (admin activates)
  Post-generation: Update election_races SET questions_generated = TRUE

Step 4 — ADMIN ACTIVATION
  Admin sees new draft election questions in QuestionsPage (existing interface)
  Admin reviews, activates questions
  Questions are now live in the collection

Step 5 — QUESTIONS LIVE
  Election questions appear in game rotation alongside regular civic questions
  They have expiresAt set to election day

Step 6 — EXPIRATION (existing hourly cron)
  On/after election day, expirationSweep.ts automatically transitions questions
  status: 'active' → 'expired'
  No new code needed — this is the existing expiration pipeline

Step 7 — ADMIN TRIGGERS FOLLOW-UP
  Admin navigates to /admin/elections (ElectionManagementPage)
  Page shows: expired election question sets grouped by race
  For each expired race where followup_generated = FALSE:
    - Shows race name, election date, question count
    - "Enter Result" form: winner name, result notes
    - "Generate Follow-up Questions" button
  Admin enters winner information, clicks button
  POST /admin/election-sets/:id/generate-followup
    Body: { winnerId: string, winnerName: string, resultNotes: string }

Step 8 — FOLLOW-UP GENERATION
  Same script: generate-election-questions.ts --race-id <id> --followup
  Now has result data: winner known
  Claude prompt: "Generate N follow-up questions about the [SEAT] election result.
                  Winner: [NAME]. Generate retrospective questions:
                  'Who won the [SEAT] election on [DATE]?', etc."
  expiresAt: NULL (results are permanent civic facts)
  Status: 'draft' (admin activates)
  Post-generation: Update election_races SET followup_generated = TRUE, result = {...}
```

---

## Cron/Scheduling Integration

### How It Fits the Existing Pattern

`startCron.ts` currently registers one job. The v1.7 pattern extends it cleanly:

```typescript
// backend/src/cron/startCron.ts (modified)
import cron from 'node-cron';
import { runExpirationSweep } from './expirationSweep.js';
import { runElectionDetection } from './electionDetection.js';

export function startCrons(): void {
  // Existing: hourly expiration sweep
  cron.schedule('0 * * * *', async () => {
    await runExpirationSweep();
  });

  // New: daily election detection at 6 AM
  cron.schedule('0 6 * * *', async () => {
    await runElectionDetection();
  });

  console.log('Cron jobs registered: expiration (hourly), election detection (daily 6AM)');
}
```

### Election Detection Cron Logic

`backend/src/cron/electionDetection.ts`:

```
runElectionDetection():
  1. Query: upcoming races (election_date in next 60 days, questions_generated = FALSE)
  2. For each race:
     a. Spawn generate-election-questions.ts as a child process
        OR call a shared generation function directly (prefer direct call for simplicity)
     b. Log outcome (generated N questions for race X)
  3. Log summary (checked N jurisdictions, triggered generation for M races)
```

**Frequency decision: Daily at 6 AM**
- Rationale: Election data doesn't change hourly. Daily is sufficient to catch new races entered into the system without hammering the Claude API unnecessarily.
- The 60-day lookahead gives enough lead time for content generation and admin review before election day.

**Idempotency: `questions_generated` flag**
- The flag on `election_races` is the single source of truth.
- If the cron runs daily and finds `questions_generated = FALSE` for a race that already has questions (edge case: flag not updated), the generation script checks for existing questions with the `election_race_id` before generating.
- Double protection: flag + existence check.

**Duplicate generation prevention:**
- Flag approach is simple and reliable for the expected volume (a handful of elections at a time, not thousands).
- No distributed lock needed at this scale.

---

## Admin UI Changes

### New Page: ElectionManagementPage (`/admin/elections`)

**Purpose:** Single screen for the entire post-election workflow.

**Layout:**
```
Header: "Election Management"

Section: "Active Elections" (election_date > today, questions_generated = TRUE)
  Table: Race | Jurisdiction | Election Date | Questions Active | Days Until
  Action: None (informational — questions are live)

Section: "Pending Generation" (election_date > today, questions_generated = FALSE)
  Table: Race | Jurisdiction | Election Date | Days Until
  Action: "Generate Now" button (manual trigger, bypasses cron)
  Note: Normally cron handles this; manual trigger for immediate need

Section: "Awaiting Follow-up" (election_date <= today, followup_generated = FALSE)
  Table: Race | Jurisdiction | Election Date | Questions Expired | ---
  Action per row:
    - "Enter Result + Generate Follow-up" button
    - Inline form appears: Winner Name (text), Notes (textarea)
    - Confirm button → POST /admin/election-sets/:id/generate-followup
```

**No new complexity.** This page follows the exact same pattern as existing admin pages:
- Fetch data from a new admin endpoint
- Display in a table
- Call a POST endpoint on button click
- Show success/error state

### Existing Pages — Minimal Changes

**QuestionsPage:** No changes needed. Election questions appear in the standard question explorer with `subcategory: 'current-election'`. Admin can filter by this subcategory to find them.

**AdminDashboard:** No changes for v1.7. Collection health stats still apply.

**AdminLayout:** Add one nav link: "Elections" → `/admin/elections`.

---

## Norwich Collection Integration

Norwich follows the identical code path as Fremont, Bloomington, and Los Angeles. No architectural changes needed — only new config and source files.

**New files:**
```
backend/src/scripts/content-generation/locale-configs/norwich-uk.ts
backend/src/scripts/data/sources/norwich-uk/  (directory, populated by --fetch-sources)
```

**`generate-locale-questions.ts` changes:**
1. Add `'norwich-uk'` to `supportedLocales` map
2. Add `'norwichConfig'` to the config-key extraction list

**UK-specific config notes (to document in `norwich-uk.ts`):**

```typescript
// Terminology differences to document in config comments:
// - "councillor" not "council member"
// - "ward" not "district"
// - Date format awareness: Claude should be instructed to write dates
//   in UK format where appropriate (day-month-year)
// - Currency: "£" not "$", "pence" not "cents"
// - Local government tier: City Council → County Council → Parliament
//   (different from US city → county → state structure)
// - Sources: norwich.gov.uk, norfolk.gov.uk, electoral commission
```

The system prompt already has a `localeSlug` parameter used for Fremont-specific instructions. The same extension point handles Norwich-specific instructions without structural changes.

**externalIdPrefix:** `nor` (follows existing 3-char pattern: `bli`, `fre`, `lac`)

---

## Address/Phone Quality Rule Integration

### Rule Implementation

The new rule file follows the exact existing pattern:

**`backend/src/services/qualityRules/rules/address-phone.ts`:**

```typescript
// Pattern: same shape as ambiguity.ts, lookup.ts, partisan.ts
// Export: checkAddressPhone(question: QuestionInput): RuleResult
// Severity: advisory (not blocking — might be a legitimate question about
//           where a government office is located)

// Detection targets in options[]:
//   - Phone numbers: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/ or /\(\d{3}\)\s*\d{3}/
//   - UK numbers: /\b\d{5}\s\d{6}\b/ or /\b01\d{9}\b/
//   - Street addresses: /\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Way|Court|Ct)\b/i
//   - UK postcodes: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i

// Advisory, not blocking: A question like "Where is City Hall located?"
// with address options is arguably valid civic content. Flag for human review.
```

**Registration in `qualityRules/index.ts`:**

```typescript
// Add to ALL_SYNC_RULES array:
import { checkAddressPhone } from './rules/address-phone.js';

export const ALL_SYNC_RULES: QualityRule[] = [
  checkAmbiguousAnswers,
  checkVagueQualifiers,
  checkPureLookup,
  checkStructuralQuality,
  checkPartisanFraming,
  checkAddressPhone,  // NEW
];
```

**Re-audit script:**

Following the pattern of `audit-questions.ts`, create:
```
backend/src/scripts/audit-address-phone.ts
```

This mirrors the existing audit scripts:
1. Load all active questions from DB
2. Run `checkAddressPhone` on each
3. Report violations grouped by collection
4. Output count of advisory flags found
5. No auto-archival — advisory only, human reviews

---

## Build Order

The dependencies between v1.7 components are clear. Build in this sequence:

**Phase 1: Data model foundation**
- Add `election_races` table to schema and run migration
- Add `election_race_id` column to `questions` table
- Update `backend/src/db/schema.ts` with Drizzle types
- Verify DB migrations apply cleanly
- _Depends on:_ nothing (pure schema work)

**Phase 2: Norwich collection**
- Create `norwich-uk.ts` locale config
- Add `norwich-uk` to `generate-locale-questions.ts` supported locales
- Fetch sources, generate questions, seed, activate
- _Depends on:_ nothing (pure config extension, existing code path)
- _Delivers:_ New playable collection immediately

**Phase 3: Address/phone quality rule**
- Create `address-phone.ts` rule file
- Register in `qualityRules/index.ts`
- Create `audit-address-phone.ts` script
- Run audit on existing questions, review findings
- _Depends on:_ nothing (pure addition to quality rules engine)

**Phase 4: Election generation script**
- Create `generate-election-questions.ts` (election-aware variant)
- Create `buildElectionSystemPrompt()` in system-prompt.ts
- Test with manual race data (skip cron for now)
- Verify `expiresAt = election_date` is set correctly during seeding
- Verify `election_race_id` is linked on inserted questions
- _Depends on:_ Phase 1 (election_races table must exist)

**Phase 5: Election cron + detection**
- Create `electionDetection.ts` cron logic
- Modify `startCron.ts` to register election detection job
- Test detection query finds upcoming races with `questions_generated = FALSE`
- _Depends on:_ Phase 1 (election_races table), Phase 4 (generation script)

**Phase 6: Admin election management UI**
- Create `ElectionManagementPage.tsx`
- Add `GET /admin/election-sets` endpoint to `admin.ts`
- Add `POST /admin/election-sets/:id/generate-followup` endpoint
- Add nav link in `AdminLayout.tsx`
- Add route in `App.tsx`
- _Depends on:_ Phase 1 (data), Phase 4 (generation), Phase 5 (cron populates election_races)

**Phase 7: End-to-end verification**
- Manually create a test race in `election_races`
- Trigger election detection (manual or wait for cron)
- Verify questions generated with correct `expiresAt` and `election_race_id`
- Admin activates questions, verifies they appear in game
- Simulate expiration (set `expiresAt` to past date, run sweep)
- Use admin UI to enter result and trigger follow-up generation
- Verify follow-up questions have `expiresAt = NULL`
- _Depends on:_ All prior phases

---

## Key Design Decisions

**Decision: Manual race entry for v1.7, automated scraping later**

Automated election data scraping is jurisdiction-specific and fragile (election websites differ wildly). For v1.7, admin enters race data into `election_races` directly (or via a simple admin form). The cron detection logic is built now so scraping can be added behind it later without changing downstream code.

**Decision: Candidate list as structured context, not RAG source**

The existing pipeline injects scraped text documents as RAG context. Candidate data is structured (name, party, incumbent flag) — not prose. It should be injected as a formatted list in the user message, not as a scraped text file. This produces cleaner, more controlled generation.

**Decision: election_race_id FK on questions table (not a separate junction table)**

Each election question belongs to exactly one race. A direct FK column is simpler than a junction table and avoids a JOIN on every admin query. Nullable because regular civic questions don't have a race.

**Decision: Follow-up questions have `expiresAt = NULL`**

"Who won the 2026 Fremont mayoral election?" is a permanent historical fact. It should not expire. Only pre-election questions (who is running, what date is the election) expire on election day.

**Decision: Advisory severity for address/phone rule**

Questions about where government offices are located can legitimately have address answers. The rule flags for human review rather than auto-archiving.

**Decision: `norwich-uk` follows the existing locale config pattern exactly**

No new abstractions, no new pipeline stages. The UK-specific content differences (councillor vs councilmember, £ vs $) are handled via config comments and locale-specific system prompt instructions — the same mechanism used for Fremont's sensitivity guidelines.

---

*Research completed: 2026-02-25*
