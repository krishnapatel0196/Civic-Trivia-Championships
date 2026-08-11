# Phase 38: Election Cron + Current-Term Stage + Admin Election UI - Research

**Researched:** 2026-02-26
**Domain:** node-cron scheduling + Drizzle ORM queries + React tab UI + Headless UI modals + election lifecycle state machine
**Confidence:** HIGH (all findings from direct codebase inspection + verified node-cron v4 TypeScript definitions)

---

## Summary

Phase 38 completes the election lifecycle by adding three components that build directly on Phase 37's foundation: (1) a daily cron that auto-detects and generates questions for upcoming races, (2) a current-term question generator triggered when admin enters election results, and (3) a redesigned admin Elections page with three tab sections. All required libraries are already installed. No new dependencies are needed.

The existing codebase provides all building blocks. `node-cron` v4.2.1 is installed and used for the hourly expiration sweep — the new election cron follows the exact same pattern but adds `{ timezone: 'America/New_York' }` to the `schedule()` options object (verified from `TaskOptions` TypeScript definition). The `generateElectionQuestions()` function from `ElectionQuestionGenerator.ts` is already callable as a library function; the cron imports it directly. The current-term generator is a new service that parallels this but uses different prompts and sets `expiresAt` to the winner's term end date. The admin UI rebuilds `ElectionsPage.tsx` from the current flat table into a three-tab layout using the existing `@headlessui/react` Tab component.

The schema already supports everything this phase needs: `election_races.questions_generated`, `election_races.followup_generated`, `election_races.result`, `questions.expires_at`, and `questions.election_race_id`. No migration is required.

**Primary recommendation:** Build `electionDetection.ts` as a standalone async function (mirrors `expirationSweep.ts`), register it in `startCron.ts` alongside the expiration cron, implement `CurrentTermQuestionGenerator.ts` as a companion to `ElectionQuestionGenerator.ts`, add the API endpoints to `admin.ts`, and rebuild `ElectionsPage.tsx` using `@headlessui/react` `Tab`/`TabGroup` components.

---

## Standard Stack

No new libraries needed. Everything required is already installed.

### Core (already installed)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| `node-cron` | ^4.2.1 | Cron scheduling | Daily 6 AM Eastern election detection cron |
| `@anthropic-ai/sdk` | ^0.74.0 | Claude API | Current-term question generation via Claude |
| `drizzle-orm` | ^0.45.1 | ORM + queries | Query races within 60 days, update followup_generated flag |
| `@headlessui/react` | ^2.2.9 | Tab + Dialog | Three-tab Elections page, Enter Result modal, Re-generate confirm modal |
| `zod` | ^4.3.6 | Validation | Validate enter-result API request body |
| `express` | ^4.18.2 | HTTP | New admin API endpoints |

### node-cron v4 Timezone API (verified from TypeScript definition)
```typescript
// TaskOptions interface — confirmed from node-cron/dist/esm/tasks/scheduled-task.d.ts
type TaskOptions = {
  timezone?: string;   // IANA timezone string
  name?: string;
  noOverlap?: boolean;
  maxExecutions?: number;
  maxRandomDelay?: number;
};

// Schedule with timezone:
cron.schedule('0 6 * * *', async () => {
  await runElectionDetection();
}, { timezone: 'America/New_York' });
```

### headlessui/react Tab API (v2.x — installed version)
```tsx
// Tab group for three-section layout
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

<TabGroup>
  <TabList className="flex gap-1 border-b border-gray-200">
    <Tab className={({ selected }) => selected ? 'border-b-2 border-red-700 ...' : '...'}>
      Active Elections
    </Tab>
    <Tab>Pending Generation</Tab>
    <Tab>Awaiting Follow-up</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>...</TabPanel>
    <TabPanel>...</TabPanel>
    <TabPanel>...</TabPanel>
  </TabPanels>
</TabGroup>
```

### No New Libraries Needed
- Timezone computation (for current-term expiresAt): existing `getEndOfDayUTC()` from `ElectionQuestionGenerator.ts` — already handles IANA timezone + DST correctly. For term-end dates, pass term-end date string + jurisdiction timezone.
- Tab UI: `@headlessui/react` Tab family (same package, already installed) — not currently used in admin pages but is part of the installed headlessui v2 package.
- Toast notifications: implement as simple timed-visibility state pattern (no library) — consistent with existing admin modals.

---

## Architecture Patterns

### Recommended File Structure

```
backend/src/cron/
├── startCron.ts                     # MODIFY: register startElectionDetectionCron()
├── expirationSweep.ts               # EXISTING (unchanged)
└── electionDetection.ts             # NEW: runElectionDetection() function

backend/src/services/generation/
├── ElectionQuestionGenerator.ts     # EXISTING (unchanged — called by cron)
└── CurrentTermQuestionGenerator.ts  # NEW: generateCurrentTermQuestions()

backend/src/routes/
└── admin.ts                         # MODIFY: add 3 new endpoints

frontend/src/pages/admin/
└── ElectionsPage.tsx                # REWRITE: three-tab layout
```

### Pattern 1: Cron Job Structure (mirrors expirationSweep.ts)

The election detection cron follows the exact same pattern as `expirationSweep.ts`:
- Exported as a standalone `runElectionDetection()` async function
- Called inside `cron.schedule()` in `startCron.ts`
- Returns void, logs structured JSON
- Handles errors with try/catch, logs and continues

```typescript
// backend/src/cron/electionDetection.ts
import cron from 'node-cron';
import { db } from '../db/index.js';
import { electionRaces } from '../db/schema.js';
import { and, eq, lte, gte, sql } from 'drizzle-orm';
import { generateElectionQuestions } from '../services/generation/ElectionQuestionGenerator.js';

export async function runElectionDetection(): Promise<void> {
  const startTime = Date.now();
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Query: election_date between now and +60 days, questions_generated = false
  const pendingRaces = await db
    .select()
    .from(electionRaces)
    .where(
      and(
        eq(electionRaces.questionsGenerated, false),
        gte(electionRaces.electionDate, now),
        lte(electionRaces.electionDate, sixtyDaysFromNow)
      )
    );

  // Explicit log when no races found (ELEC-13: distinguishable from silent failure)
  if (pendingRaces.length === 0) {
    console.log(JSON.stringify({
      level: 'info',
      job: 'election-detection',
      message: 'No upcoming elections found',
      durationMs: Date.now() - startTime,
    }));
    return;
  }

  // Process each race with per-race retry (up to 3x) and continue-on-failure
  let processed = 0;
  const failures: Array<{ raceId: number; error: string }> = [];

  for (const race of pendingRaces) {
    // Determine collection slug from jurisdiction (stored as collection name)
    // Need to resolve collection slug from jurisdiction string
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await generateElectionQuestions(race.id, collectionSlug, { force: false });
        processed++;
        success = true;
        break;
      } catch (err) {
        if (attempt === 3) {
          failures.push({ raceId: race.id, error: err instanceof Error ? err.message : String(err) });
        }
      }
    }
  }

  // Log summary (stored for admin banner — see cron summary storage)
  console.log(JSON.stringify({
    level: 'info',
    job: 'election-detection',
    message: 'Election detection complete',
    racesDetected: pendingRaces.length,
    processed,
    failures: failures.length,
    failureDetails: failures,
    durationMs: Date.now() - startTime,
    timestamp: now.toISOString(),
  }));
}
```

**Critical detail:** The cron requires a `collectionSlug` for each race, but the race only stores `jurisdiction` (a display name like "Bloomington, IN"). The cron must resolve the collection slug from the jurisdiction. Two options:
1. Match `collections.name === race.jurisdiction` (current admin UI approach)
2. Add a `collectionSlug` field to `election_races` schema

**Recommendation:** Resolve via `collections.name = race.jurisdiction` lookup — this is what the existing admin UI does. If no collection matches, log as failure and skip.

### Pattern 2: Cron Registration in startCron.ts

```typescript
// backend/src/cron/startCron.ts — modified
import cron from 'node-cron';
import { runExpirationSweep } from './expirationSweep.js';
import { runElectionDetection } from './electionDetection.js';

export function startExpirationCron(): void {
  cron.schedule('0 * * * *', async () => {
    await runExpirationSweep();
  });
  console.log('Expiration cron job registered (runs hourly at :00)');
}

export function startElectionDetectionCron(): void {
  cron.schedule('0 6 * * *', async () => {
    await runElectionDetection();
  }, { timezone: 'America/New_York' });
  console.log('Election detection cron job registered (runs daily at 6 AM Eastern)');
}
```

Then in `server.ts`, call `startElectionDetectionCron()` alongside `startExpirationCron()`.

### Pattern 3: Idempotency (ELEC-14)

The `generateElectionQuestions()` function already checks `race.questionsGenerated` before generating. If `questions_generated = TRUE`, it throws `GenerationBlockedError`. The cron queries for `questions_generated = FALSE` races, so the flag check is redundant — but the secondary existence check in `generateElectionQuestions()` provides defense-in-depth against race conditions.

The cron must call `generateElectionQuestions()` with `force: false` — never with `force: true` — so the idempotency guard is always active.

### Pattern 4: Current-Term Generator

New service `CurrentTermQuestionGenerator.ts` parallels `ElectionQuestionGenerator.ts`:

```typescript
// Interface for the API call body
interface EnterResultInput {
  winnerName: string;
  termEndDate: string;  // YYYY-MM-DD
}

// Return type matches admin API response
interface CurrentTermResult {
  questionsCreated: number;
  raceId: number;
  jurisdiction: string;
  collectionSlug: string;
}

export async function generateCurrentTermQuestions(
  raceId: number,
  collectionSlug: string,
  opts: { winnerName: string; termEndDate: string }
): Promise<CurrentTermResult>
```

Steps inside:
1. Load race from DB (same as ElectionQuestionGenerator)
2. Check `followup_generated` — if TRUE, throw error (idempotency)
3. Build current-term prompt: "Who is the current [seat]?", "When does [winner]'s term expire?", role/responsibilities questions
4. Set `expiresAt` = term end date (full day end, same `getEndOfDayUTC()` helper, using race timezone)
5. External ID scheme: `elc-term-{raceId}-{seq}` (distinct from campaign questions `elc-{raceId}-{seq}`)
6. Insert questions with `status: 'draft'`, `electionRaceId: raceId`
7. Update `election_races.followup_generated = TRUE` and `election_races.result = winnerName`
8. Return result

**Current-term question count:** Recommend 5-8 questions. The seat is already established so fewer questions are needed vs. campaign (which covers both seat civics AND candidate facts). Target: 6 questions (enough for educational value without redundancy — covers "who is the current holder", "when does term expire", "what powers does the office have", "what has the officeholder done" style Qs).

**Current-term expiresAt:** Use `getEndOfDayUTC(termEndDate, race.timezone)` — reuses the exact same helper that computes election-day expiry. Term end date is a date string; the race timezone is available on the `electionRaces` record.

### Pattern 5: Three-Tab Admin UI

The tab layout replaces the current flat race table in `ElectionsPage.tsx`. Each tab represents a stage in the election lifecycle:

| Tab | Filter Logic | Actions |
|-----|-------------|---------|
| Active Elections | `questions_generated = TRUE AND election_date > now` | "Re-generate" button (with confirm modal) |
| Pending Generation | `questions_generated = FALSE` | "Generate Now" + "Edit Race" + "Delete Race" buttons |
| Awaiting Follow-up | `election_date < now AND followup_generated = FALSE` | "Enter Result" button (opens modal) |

**Classification logic:** The backend `GET /api/admin/election-races` endpoint should return races with computed classification. Two options:
1. Return raw data, classify in frontend (simpler)
2. Return three separate arrays from a single endpoint (cleaner for the tab UI)

**Recommendation:** Single endpoint returns `{ activeElections, pendingGeneration, awaitingFollowup }` — avoids triple fetch and keeps classification logic server-side where it's easier to test.

### Pattern 6: Re-generate Flow (Destructive Confirm Modal)

The re-generate button on Active Elections tab opens a confirm modal BEFORE calling the API. The modal shows the count of existing active questions that will be archived.

```tsx
// State needed:
const [regenRace, setRegenRace] = useState<ElectionRace | null>(null);
const [regenQuestionCount, setRegenQuestionCount] = useState(0);
const [showRegenConfirm, setShowRegenConfirm] = useState(false);

// Click handler: fetch count first, then show modal
const handleRegenClick = async (race: ElectionRace) => {
  // GET /api/admin/election-races/:id/question-count
  const count = await fetchQuestionCount(race.id);
  setRegenRace(race);
  setRegenQuestionCount(count);
  setShowRegenConfirm(true);
};
```

Per context decisions: active questions are archived, draft questions are deleted. The backend force-regenerate endpoint handles this (already in `generateElectionQuestions()` with `force: true` — but the existing force logic archives ALL questions including drafts). The CONTEXT.md specifies: "active questions archived, draft questions deleted." This differs from the current force logic which archives everything. The backend endpoint needs to be updated or a separate endpoint created.

**Decision:** Add a new endpoint `POST /election-races/:id/regenerate` that explicitly handles the differentiated archive/delete behavior per the context spec.

### Pattern 7: Cron Summary Banner

The admin Elections page shows a "last run summary banner" with timestamp, races processed, and failures.

The cron cannot write to the database without adding a new table. Options:
1. Store the last run result in memory on the backend (lost on restart)
2. Add a simple key-value store using a small DB table or JSON file
3. Store in the existing database as a config record

**Recommendation:** Store cron last-run summary in a module-level variable in `electionDetection.ts` that gets exported. The admin endpoint `GET /api/admin/election-races` queries this in-memory state and includes it in the response. This is ephemeral but adequate — the banner just shows "last run X minutes ago, processed Y races". On server restart it shows null/empty (acceptable).

```typescript
// electionDetection.ts exports:
export interface CronRunSummary {
  timestamp: string;
  racesDetected: number;
  processed: number;
  failures: number;
}
export let lastCronRun: CronRunSummary | null = null;
```

### Anti-Patterns to Avoid

- **Don't call `generateElectionQuestions()` with `force: true` from the cron** — the cron only processes races where `questions_generated = FALSE`, so force is never needed. Force is an admin-only operation.
- **Don't store cron run state in a new DB table** — adds schema migration complexity for a status display. In-memory is sufficient for this use case.
- **Don't re-use the `elc-{raceId}-{seq}` external ID scheme for current-term questions** — current-term questions are a different type; they need a distinct prefix to avoid conflicts (`elc-term-{raceId}-{seq}`).
- **Don't pass `election_date` as the term end date** — current-term questions expire when the TERM ends, not when the election happened. The `termEndDate` field from the Enter Result form is the `expiresAt` source.
- **Don't archive campaign questions on result entry** — the context spec is explicit: "Old campaign questions (expired on election day): leave as-is, no additional action on result entry." The Enter Result flow only generates new current-term questions; it does not touch the old expired campaign questions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling with timezone | Custom timer loop | `node-cron` v4 with `{ timezone: 'America/New_York' }` option | Already installed, handles DST, validated in TypeScript types |
| End-of-day UTC computation | Custom date math | `getEndOfDayUTC()` from `ElectionQuestionGenerator.ts` | Already written, handles DST edge cases, reusable |
| Tab UI | Custom tab state + aria | `@headlessui/react` `TabGroup`/`Tab`/`TabPanel` | Already installed, handles keyboard nav + accessibility |
| Confirmation modal | Custom div overlay | `@headlessui/react` `Dialog` + `Transition` | Pattern established in existing `ElectionsPage.tsx` |
| Claude API call | Raw HTTP fetch | `@anthropic-ai/sdk` `client.messages.create()` | Pattern established in `ElectionQuestionGenerator.ts` |

**Key insight:** This phase is primarily composition of already-built pieces. The hard work is in getting the lifecycle state machine right (which races go in which tab, what each action does), not in building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Collection Slug Resolution in Cron

**What goes wrong:** The cron knows a race's `jurisdiction` (e.g., "Bloomington, IN") but `generateElectionQuestions()` requires a `collectionSlug` (e.g., "bloomington-in"). If the cron can't find the matching collection, generation fails.

**Why it happens:** `election_races` stores jurisdiction as a display name, not a slug. This was fine for manual admin UI use (where the collection picker provides the slug), but the cron has no interactive picker.

**How to avoid:** The cron should look up the collection by matching `collections.name = race.jurisdiction`. If no match, log the race as failed with a clear error message: "No collection found matching jurisdiction '{jurisdiction}' — skipping race {id}". This is distinguishable from a generation failure.

**Warning signs:** Races getting detected but logged as failures with "Collection not found" errors.

### Pitfall 2: Cron Running During Server Restart (Missed Executions)

**What goes wrong:** If the server restarts at 6 AM Eastern, the cron tick may be missed. node-cron does not run missed jobs on startup.

**Why it happens:** node-cron fires when the process is running at the scheduled time; it has no persistence.

**How to avoid:** This is acceptable for this use case — the election cron is a "nice to have" automation, not a hard requirement. Admins can use "Generate Now" for any missed races. Document this behavior in the cron log startup message.

**Warning signs:** No log entries for the election detection job after a server restart near 6 AM.

### Pitfall 3: Duplicate Follow-up Generation

**What goes wrong:** Admin clicks "Enter Result" twice, generating two sets of current-term questions for the same race.

**Why it happens:** If the API doesn't check `followup_generated` before proceeding, two calls will insert two sets of questions and potentially set `followup_generated = TRUE` twice (which is idempotent for the flag but creates duplicate questions).

**How to avoid:** The `generateCurrentTermQuestions()` function must check `followup_generated = TRUE` at the start and return an error (similar to how `generateElectionQuestions()` throws `GenerationBlockedError` when `questionsGenerated = TRUE`). The API route returns 409 with a helpful message.

**Warning signs:** A race with `followup_generated = TRUE` has more questions than expected.

### Pitfall 4: Re-generate Tab Filtering Logic

**What goes wrong:** A race with `questions_generated = TRUE` that has already passed its `election_date` appears in the "Active Elections" tab when it should be in "Awaiting Follow-up" (or both).

**Why it happens:** The tab classification criteria overlap for races that are both "generated" AND "expired AND not followed-up".

**How to avoid:** Classify races strictly by priority:
1. **Awaiting Follow-up:** `election_date < now AND followup_generated = FALSE` — regardless of `questions_generated`
2. **Active Elections:** `questions_generated = TRUE AND election_date >= now`
3. **Pending Generation:** `questions_generated = FALSE AND election_date >= now`

Races where `followup_generated = TRUE` (fully complete) don't appear in any tab by default — they are archived/done. Consider whether to show a "Completed" section or just exclude them.

### Pitfall 5: expiresAt for Current-Term Questions

**What goes wrong:** `termEndDate` from the admin form is a date string like "2030-01-15". Passing it directly as `new Date("2030-01-15")` creates midnight UTC, not end-of-day in the jurisdiction's timezone.

**Why it happens:** JavaScript's `new Date("YYYY-MM-DD")` parses as UTC midnight, which could be the previous day in the jurisdiction's local time.

**How to avoid:** Use `getEndOfDayUTC(termEndDate, race.timezone)` — the same helper used for campaign question expiry. This ensures the question stays active through the last moment of the term end date in the jurisdiction's local timezone.

**Warning signs:** Current-term questions expiring a few hours early relative to the expected term end date.

---

## Code Examples

Verified patterns from the existing codebase:

### node-cron v4 Schedule with Timezone
```typescript
// Source: node-cron/dist/esm/tasks/scheduled-task.d.ts (verified from installed package)
// Schedule for 6 AM Eastern time daily:
cron.schedule('0 6 * * *', async () => {
  await runElectionDetection();
}, { timezone: 'America/New_York' });
```

### Drizzle Query: Races Within 60 Days with questions_generated = FALSE
```typescript
// Source: mirrors expirationSweep.ts pattern using drizzle-orm operators
import { and, eq, lte, gte } from 'drizzle-orm';

const now = new Date();
const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

const pendingRaces = await db
  .select()
  .from(electionRaces)
  .where(
    and(
      eq(electionRaces.questionsGenerated, false),
      gte(electionRaces.electionDate, now),
      lte(electionRaces.electionDate, sixtyDaysFromNow)
    )
  );
```

### Drizzle Query: Classify Races for Three-Tab Response
```typescript
// Source: schema.ts field definitions — all fields exist on electionRaces
const now = new Date();

// Active: generated + upcoming
const activeElections = await db.select().from(electionRaces)
  .where(and(eq(electionRaces.questionsGenerated, true), gte(electionRaces.electionDate, now)));

// Awaiting follow-up: past + not followed up (regardless of questions_generated)
const awaitingFollowup = await db.select().from(electionRaces)
  .where(and(lt(electionRaces.electionDate, now), eq(electionRaces.followupGenerated, false)));

// Pending generation: upcoming + not generated
const pendingGeneration = await db.select().from(electionRaces)
  .where(and(eq(electionRaces.questionsGenerated, false), gte(electionRaces.electionDate, now)));
```

### Enter Result Endpoint Schema (Zod)
```typescript
// Pattern from existing createElectionRaceSchema in admin.ts
const enterResultSchema = z.object({
  winnerName: z.string().min(1).max(200),
  termEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  collectionSlug: z.string().min(1),
});
```

### Re-generate Confirm Modal Count Fetch
```typescript
// New endpoint: GET /api/admin/election-races/:id/question-count
// Returns: { activeCount: number, draftCount: number }
// Frontend fetches this before showing the confirm modal

// Admin route handler:
router.get('/election-races/:id/question-count', async (req, res) => {
  const raceId = parseInt(req.params.id, 10);
  const activeCount = await db.select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(and(eq(questions.electionRaceId, raceId), eq(questions.status, 'active')));
  const draftCount = await db.select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(and(eq(questions.electionRaceId, raceId), eq(questions.status, 'draft')));
  res.json({ activeCount: Number(activeCount[0].count), draftCount: Number(draftCount[0].count) });
});
```

### Current-Term External ID Scheme
```typescript
// elc-term-{raceId}-{seq} — distinct from campaign IDs (elc-{raceId}-{seq})
function buildCurrentTermExternalId(raceId: number, seq: number): string {
  return `elc-term-${raceId}-${String(seq).padStart(3, '0')}`;
}
```

### Toast Pattern (from existing page pattern)
```tsx
// Simple in-page toast — no library needed
const [toast, setToast] = useState<{ message: string; visible: boolean }>({
  message: '', visible: false
});

const showToast = (message: string) => {
  setToast({ message, visible: true });
  setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
};

// Render:
{toast.visible && (
  <div className="fixed bottom-6 right-6 bg-green-700 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
    {toast.message}
  </div>
)}
```

### Status Badge Colors (Claude's Discretion)
Recommended color scheme (consistent with existing admin badge patterns):
- **Draft** (questions created but not active): `bg-amber-100 text-amber-700` — caution/pending
- **Active** (questions live, election upcoming): `bg-green-100 text-green-700` — live
- **Expired** (election day passed, awaiting follow-up): `bg-gray-100 text-gray-600` — neutral/dormant

### Current-Term Question Count Recommendation
Target **6 questions** per race for current-term (Claude's Discretion):
- 1 "Who is the current [seat]?" knowledge check
- 1 "When does [winner]'s term expire?" timeline question
- 2 seat-role/responsibility questions (powers, duties)
- 1 election context question ("Who won the [year] [seat] election?")
- 1 additional office-specific question

Rationale: Campaign questions cover both seat civics AND candidate facts (8-15 questions). Current-term questions focus narrowly on "who holds this office now" — 6 is sufficient for educational value without redundancy. Fewer is better here because these questions expire with the term and will be rebuilt.

---

## New API Endpoints Required

This phase adds the following endpoints to `backend/src/routes/admin.ts`:

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/election-races/classified` | Returns `{ activeElections, pendingGeneration, awaitingFollowup, cronLastRun }` | Admin |
| `GET` | `/election-races/:id/question-count` | Returns `{ activeCount, draftCount }` for re-generate confirm modal | Admin |
| `POST` | `/election-races/:id/enter-result` | Validates winner + term end, calls `generateCurrentTermQuestions()` | Admin |
| `POST` | `/election-races/:id/regenerate` | Archives active Q's, deletes draft Q's, resets `questions_generated`, calls generate | Admin |

The existing endpoints (`GET /election-races`, `POST /election-races`, `POST /election-races/:id/generate`) remain unchanged.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-cron v2/v3 (no timezone option) | node-cron v4 with `TaskOptions.timezone` | v4.0 release | Timezone scheduling is first-class, no need to compute UTC offset manually |
| `@headlessui/react` v1 `Tabs` | v2 `Tab`, `TabGroup`, `TabList`, `TabPanels` | headlessui v2 | API changed: no more compound component pattern, explicit named exports |

**Note on headlessui v2 Tabs:** The installed version is ^2.2.9. In headlessui v2, the Tab API changed significantly from v1. Use named exports: `Tab`, `TabGroup`, `TabList`, `TabPanels`, `TabPanel`. The v1 pattern `Tab.Group`, `Tab.List`, `Tab.Panels`, `Tab.Panel` does NOT work in v2.

---

## Open Questions

1. **Race editing — is there an existing Edit Race endpoint?**
   - What we know: The existing `POST /election-races` creates races. There is no `PUT /election-races/:id` endpoint visible in `admin.ts`.
   - What's unclear: The CONTEXT.md mentions an "Edit Race" button in Pending Generation tab. This requires an edit endpoint that's not yet implemented.
   - Recommendation: Add `PUT /election-races/:id` endpoint to admin.ts as part of task 38-03. Alternatively, confirm that "Edit Race" opens the existing Create form pre-populated with race data (inline editing pattern).

2. **Delete Race — cascade behavior**
   - What we know: `questions.election_race_id` references `election_races.id` with `onDelete: 'set null'` in the schema. Deleting a race sets `election_race_id` to NULL on all linked questions but does not delete the questions.
   - What's unclear: Is this the desired behavior when admin deletes a race from Pending Generation? Questions with null `election_race_id` become "orphaned" from the race perspective but remain valid questions.
   - Recommendation: Acceptable behavior — orphaned questions are still valid content. Document in the plan that deleting a race does not delete its questions.

3. **Cron collection slug resolution — races without matching collection**
   - What we know: The cron must resolve collection slug from `race.jurisdiction`. If no collection matches, the race can't be processed.
   - What's unclear: Should the cron log these as failures (with retry) or as "skipped" (permanent skip until manually fixed)?
   - Recommendation: Log as failures (not retried — no point retrying a missing collection), with a clear log message. Include these in the failures count in the cron summary banner.

---

## Sources

### Primary (HIGH confidence)
- `C:/Project Test/backend/node_modules/node-cron/dist/esm/tasks/scheduled-task.d.ts` — verified `TaskOptions.timezone` API
- `C:/Project Test/backend/node_modules/node-cron/dist/esm/node-cron.d.ts` — verified `schedule()` signature
- `C:/Project Test/backend/src/cron/expirationSweep.ts` — verified existing cron pattern to follow
- `C:/Project Test/backend/src/cron/startCron.ts` — verified registration pattern
- `C:/Project Test/backend/src/services/generation/ElectionQuestionGenerator.ts` — verified full generation API
- `C:/Project Test/backend/src/db/schema.ts` — verified all schema fields (questionsGenerated, followupGenerated, result, electionRaceId, expiresAt)
- `C:/Project Test/frontend/src/pages/admin/ElectionsPage.tsx` — verified current UI and existing modal patterns
- `C:/Project Test/frontend/src/pages/admin/AdminLayout.tsx` — verified admin nav (Elections link already exists)
- `C:/Project Test/frontend/src/App.tsx` — verified `/admin/elections` route already registered
- `C:/Project Test/backend/src/routes/admin.ts` — verified existing election race endpoints
- `C:/Project Test/backend/package.json` — verified node-cron ^4.2.1, @headlessui/react ^2.2.9 installed

### Secondary (MEDIUM confidence)
- headlessui v2 Tab API: verified from `@headlessui/react` ^2.2.9 being installed; Tab named export pattern confirmed from React docs and headlessui changelog

### Tertiary (LOW confidence — flag for validation)
- headlessui v2 exact `Tab` component prop names: verified at install time but not individually tested against this codebase's setup. Validate with a quick import check.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json + installed node_modules
- Architecture: HIGH — all patterns derived from existing codebase files
- node-cron timezone API: HIGH — verified from installed TypeScript definitions
- Pitfalls: HIGH — derived from schema analysis and existing code logic
- Current-term question count (6): MEDIUM — based on reasoning, not empirical data

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable libraries, 30-day validity)
