# Phase 37: Election Question Generation Script - Research

**Researched:** 2026-02-26
**Domain:** Claude API generation + Drizzle ORM DB inserts + React admin UI modals + timezone-aware date computation
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 37 adds an election-specific question generation pipeline. The generation is triggered either from a new CLI script or from a "Generate Questions" button added to the existing `ElectionsPage.tsx`. The generator calls the Claude API to produce draft questions linked to an `election_races` record via `electionRaceId`, sets `expiresAt` to end-of-day on the election date in the race's local timezone (computed with Node.js `Intl`), and seeds them as `status='draft'`.

The key codebase precedents are: `generateQuestions.ts` (CLI arg parsing + Claude API calls), `seed-questions.ts` (DB insertion pattern), and `admin.ts` routes (API endpoint + Drizzle update pattern). The modal UX follows `QualityComparisonModal.tsx` using `@headlessui/react` `Dialog` + `Transition`, which is already installed. No new libraries are needed for any part of this phase.

The hardest correctness problem is computing "end-of-day on election date in jurisdiction's local timezone" as a UTC timestamp, without any date library. This is solvable with built-in `Intl.DateTimeFormat`. A reusable `getEndOfDayUTC(localDateStr, tz)` helper function is verified working for both standard and DST-adjacent dates.

**Primary recommendation:** Build a self-contained `generate-election-questions.ts` script that is also importable as a function so the API route can call the same logic. Use `@headlessui/react` Dialog for the generation modal on the ElectionsPage.

---

## Standard Stack

No new libraries needed. Everything required is already installed.

### Core (already installed)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| `@anthropic-ai/sdk` | ^0.74.0 | Claude API client | Call Claude claude-sonnet-4-6 for question generation |
| `drizzle-orm` | ^0.45.1 | ORM + queries | Insert draft questions, update `questionsGenerated` flag, archive old questions |
| `zod` | ^4.3.6 | Validation | Validate Claude response structure (backend route) |
| `@headlessui/react` | ^2.2.9 | Modal component | Generation loading modal + error/success states |
| `react` | ^18.2.0 | Frontend | Add modal + button to ElectionsPage |
| `express` | ^4.18.2 | HTTP | New route `POST /api/admin/election-races/:id/generate` |

### No New Libraries Needed
- Timezone computation: `Intl.DateTimeFormat` built into Node 20 — no luxon/date-fns needed
- CLI parsing: `process.argv` — existing pattern, no library
- Question validation: existing `auditQuestion()` from quality rules engine
- Claude API: existing `@anthropic-ai/sdk` (already in devDependencies)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Intl.DateTimeFormat` for timezone | `luxon` or `date-fns-tz` | luxon is more ergonomic but not installed; built-in works correctly (verified) |
| `@headlessui/react` Dialog | Custom modal div | headlessui already installed and used in `QualityComparisonModal.tsx` |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── scripts/
│   └── generate-election-questions.ts   # NEW: CLI entry point
├── services/
│   └── generation/
│       └── ElectionQuestionGenerator.ts # NEW: core generation logic (importable)
└── routes/
    └── admin.ts                         # MODIFY: add POST /election-races/:id/generate

frontend/src/
└── pages/admin/
    └── ElectionsPage.tsx                # MODIFY: add Generate button, loading modal, result modal
```

### Pattern 1: CLI Script Structure

All CLI scripts follow this exact pattern (confirmed from `generateQuestions.ts`, `generate-locale-questions.ts`):

```typescript
// Source: backend/src/scripts/generateQuestions.ts — line 1-11
// Usage comment block at top listing all invocation variants
// import '../env.js'; // MUST be first import for dotenv
// parse args, validate, call main(), catch and process.exit(1)

// Usage:
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1 --force
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1 --dry-run
// Run from backend/ directory. Requires ANTHROPIC_API_KEY in .env.

import '../env.js'; // MUST be first import for dotenv
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/index.js';
// ...

interface CLIArgs {
  raceId: number;
  force: boolean;
  dryRun: boolean;
}

function parseArgs(): CLIArgs | null {
  const args = process.argv.slice(2);
  // ...
}
```

Register in `package.json` scripts section:
```json
"generate-election-questions": "tsx src/scripts/generate-election-questions.ts"
```

Invocation convention (matching existing patterns):
```bash
# From backend/ directory:
npm run generate-election-questions -- --race-id 1
npm run generate-election-questions -- --race-id 1 --force
npm run generate-election-questions -- --race-id 1 --dry-run
```

Or directly:
```bash
npx tsx src/scripts/generate-election-questions.ts --race-id 1 --force
```

### Pattern 2: Shared Generation Logic (importable service)

The generation core should live in a service file so the API route can call it without re-implementing:

```typescript
// backend/src/services/generation/ElectionQuestionGenerator.ts

export interface GenerationResult {
  questionsCreated: number;
  archived: number;         // 0 unless force=true
  raceId: number;
  jurisdiction: string;
  collectionSlug: string;   // for "View in Explorer" link
}

export async function generateElectionQuestions(
  raceId: number,
  opts: { force?: boolean; dryRun?: boolean } = {}
): Promise<GenerationResult> {
  // 1. Load race from DB
  // 2. Check questionsGenerated + handle force
  // 3. Compute expiresAt (end-of-day in race.timezone)
  // 4. Determine question volume (15/10/8 by race type)
  // 5. Build system prompt with buildElectionSystemPrompt()
  // 6. Call Claude API
  // 7. Parse + validate response
  // 8. Insert draft questions with electionRaceId + expiresAt
  // 9. Set questionsGenerated = TRUE
  // 10. Return result
}
```

### Pattern 3: Claude API Call (existing pattern)

```typescript
// Source: backend/src/scripts/generateQuestions.ts — line 275-280
const response = await claudeClient.messages.create({
  model: 'claude-sonnet-4-6',  // Current model used in generateQuestions.ts
  max_tokens: 8192,            // Higher limit for multi-question batch
  messages: [{ role: 'user', content: prompt }],
  system: systemPrompt,        // Separate system role like locale scripts
});

const contentText = response.content[0].type === 'text' ? response.content[0].text : '';
// Parse JSON: contentText.match(/\{[\s\S]*\}/)
```

### Pattern 4: Question DB Insert (from seed-questions.ts)

```typescript
// Source: backend/src/scripts/content-generation/utils/seed-questions.ts — lines 146-181
// Elections generate as a batch of N questions — insert one by one with ON CONFLICT DO NOTHING

const inserted = await db
  .insert(questions)
  .values({
    externalId: question.externalId,   // 'elc-1-001' format (elc = election, raceId, seq)
    text: question.text,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    difficulty: question.difficulty,
    topicId,                           // REQUIRED: must look up from existing topics
    subcategory: question.topicCategory,
    source: question.source,
    learningContent: null,
    expiresAt: endOfDayUTC,            // REQUIRED: computed from race.electionDate + race.timezone
    status: 'draft' as const,          // Always draft
    expirationHistory: [],
    electionRaceId: race.id,           // NEW field — links to election_races
  })
  .onConflictDoNothing()
  .returning({ id: questions.id });

// Also link to collection (if questions appear in jurisdiction's collection):
await db
  .insert(collectionQuestions)
  .values({ collectionId, questionId })
  .onConflictDoNothing();
```

### Pattern 5: Drizzle Update (set questionsGenerated flag)

```typescript
// Source: backend/src/routes/admin.ts — lines 174-183 (update pattern)
await db
  .update(electionRaces)
  .set({ questionsGenerated: true })
  .where(eq(electionRaces.id, raceId));
```

For force-regenerate, first archive existing questions:
```typescript
// Archive previous election questions for this race
await db
  .update(questions)
  .set({
    status: 'archived',
    expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
    updatedAt: new Date()
  })
  .where(eq(questions.electionRaceId, raceId));

// Then reset flag before re-generating
await db
  .update(electionRaces)
  .set({ questionsGenerated: false })
  .where(eq(electionRaces.id, raceId));
```

### Pattern 6: Admin API Route

New route appended to `backend/src/routes/admin.ts` (before `export { router }`):

```typescript
// POST /election-races/:id/generate — trigger question generation for a race
router.post('/election-races/:id/generate', async (req: Request, res: Response) => {
  try {
    const raceId = parseInt(req.params.id, 10);
    if (isNaN(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    const force = req.body.force === true;

    const result = await generateElectionQuestions(raceId, { force });
    return res.status(200).json({
      questionsCreated: result.questionsCreated,
      archived: result.archived,
      jurisdiction: result.jurisdiction,
      collectionSlug: result.collectionSlug,
    });
  } catch (error) {
    if (error instanceof GenerationBlockedError) {
      // Hard block: questions_generated = true, no force
      return res.status(409).json({
        error: 'already_generated',
        message: error.message,
        existingCount: error.existingCount,
        generatedAt: error.generatedAt,
      });
    }
    console.error('Failed to generate election questions:', error);
    return res.status(500).json({ error: 'Failed to generate election questions' });
  }
});
```

### Pattern 7: Frontend Modal (headlessui Dialog)

```typescript
// Source: frontend/src/pages/admin/components/QualityComparisonModal.tsx — line 1-2
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// Generation modal structure (loading state):
<Transition show={isGenerating} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={() => {}}>
    {/* Backdrop */}
    <Transition.Child as={Fragment} ...>
      <div className="fixed inset-0 bg-black bg-opacity-40" />
    </Transition.Child>
    {/* Panel */}
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Transition.Child as={Fragment} ...>
        <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <Dialog.Title>Generating Questions</Dialog.Title>
          <p className="mt-2 text-sm text-gray-600">
            Generating questions for {race.seat}...
          </p>
          {/* Spinner or progress indicator */}
        </Dialog.Panel>
      </Transition.Child>
    </div>
  </Dialog>
</Transition>
```

### Pattern 8: Timezone-Aware End-of-Day Computation

**Critical correctness requirement (ELEC-06).** No external library available. Use built-in `Intl`:

```typescript
// Verified working with Node 20 built-ins — no external library needed
// Handles DST transitions correctly (verified for spring-forward dates)
function getEndOfDayUTC(localDateStr: string, tz: string): Date {
  // localDateStr: 'YYYY-MM-DD' — the election date in the jurisdiction's timezone
  // tz: IANA timezone string (e.g., 'America/Indiana/Indianapolis')

  // Use local noon as reference (avoids midnight DST edge cases)
  const noonUtcGuess = new Date(localDateStr + 'T12:00:00.000Z');

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(noonUtcGuess);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0';
  const localHour = parseInt(get('hour'), 10);
  const localMin = parseInt(get('minute'), 10);
  const localSec = parseInt(get('second'), 10);

  // Back-compute UTC equivalent of local noon, then local midnight, then end-of-day
  const utcOfLocalNoon = new Date(
    noonUtcGuess.getTime()
    - (localHour - 12) * 3600000
    - localMin * 60000
    - localSec * 1000
  );
  const utcOfLocalMidnight = new Date(utcOfLocalNoon.getTime() - 12 * 3600000);
  const utcOfEndOfDay = new Date(utcOfLocalMidnight.getTime() + 24 * 3600000 - 1);

  return utcOfEndOfDay;
}

// Verified outputs:
// getEndOfDayUTC('2026-11-03', 'America/Indiana/Indianapolis')
// → 2026-11-04T04:59:59.999Z (Indianapolis = UTC-5 in November)
// Formats back to: 11/03/2026, 23:59:59 in Indianapolis ✓
//
// getEndOfDayUTC('2026-03-08', 'America/New_York')
// → 2026-03-09T03:59:59.999Z (DST spring-forward day)
// Formats back to: 03/08/2026, 23:59:59 in New York ✓
```

**The election date stored in DB is UTC.** The `electionDate` column is `TIMESTAMPTZ` stored as UTC. When computing the local date string for `getEndOfDayUTC`, extract the local date from the UTC timestamp using the race's `timezone` field:

```typescript
// Extract local date from the UTC election_date stored in DB
const race = await db.select().from(electionRaces).where(eq(electionRaces.id, raceId)).limit(1);
const electionDateUTC = race[0].electionDate; // JS Date object (UTC)

// Get the local date string (YYYY-MM-DD) in the jurisdiction's timezone
const localDateStr = new Intl.DateTimeFormat('en-CA', {
  timeZone: race[0].timezone,
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(electionDateUTC);
// 'en-CA' gives YYYY-MM-DD format natively

const expiresAt = getEndOfDayUTC(localDateStr, race[0].timezone);
```

### Pattern 9: ExternalId Format for Election Questions

Existing patterns: `bli-001` (Bloomington), `fre-001` (Fremont), `fed-001` (Federal). Election questions need a unique prefix and should not conflict with collection questions. Use `elc-{raceId}-{seq}` format:

```typescript
// e.g., for raceId=1, question 3: 'elc-1-003'
const externalId = `elc-${raceId}-${String(seqNum).padStart(3, '0')}`;
```

This keeps raceId in the ID, preventing conflicts across races. The `externalId` must be unique across all questions (DB constraint: `unique()`).

### Pattern 10: Topic ID Resolution for Election Questions

`questions.topicId` is `NOT NULL` — every question requires a topic. Election questions belong to the jurisdiction's collection, which has existing topics (e.g., `elections-voting`). The generator must resolve the `elections-voting` topic ID for the jurisdiction.

```typescript
// Look up the 'elections-voting' topic for the jurisdiction's collection
// Step 1: Find collection by jurisdiction slug (derived from race.jurisdiction)
// Step 2: Find 'elections-voting' topic linked to that collection
// Fallback: use any topic linked to the collection

const electionsTopic = await db
  .select({ topicId: collectionTopics.topicId })
  .from(collectionTopics)
  .innerJoin(topics, eq(collectionTopics.topicId, topics.id))
  .where(
    and(
      eq(collectionTopics.collectionId, collectionId),
      eq(topics.slug, 'elections-voting')
    )
  )
  .limit(1);

const topicId = electionsTopic[0]?.topicId;
// If not found, fall back to first topic in the collection
```

**Open question:** The generator needs to know which collection the race belongs to (for topicId resolution + `collectionQuestions` linking). The `election_races` table has `jurisdiction` (e.g., `'Bloomington, IN'`) but not `collection_slug`. This mapping must be derived. Options:
1. Look up collection by matching jurisdiction text against collection names (fragile)
2. Add a `collection_slug` field to `election_races` (schema change)
3. Pass collection slug as a CLI arg / API parameter

**Recommendation:** Pass `collection_slug` as a required parameter (CLI: `--collection bloomington-in`, API: `{ collectionSlug: 'bloomington-in' }` in request body). This is explicit and avoids string matching. Alternatively, add it to the `election_races` table — this was not part of Phase 35, so would need a schema change. A third option: if the jurisdiction is unique per collection, do a DB lookup joining on name similarity. The cleanest solution for Phase 37 is to pass it explicitly or add it to the race table.

### Pattern 11: Questions Explorer "View in Explorer" Link

The questions explorer URL for filtering by collection:

```
/admin/questions?collection=bloomington-in&status=draft
```

The "View in Explorer" link in the success state should deep-link to this URL. The `collection` param is the collection slug. The CONTEXT says "filtered by jurisdiction" — this translates to filtered by the collection whose `localeCode`/`slug` matches the jurisdiction.

```typescript
// In ElectionsPage.tsx — success state link
import { Link } from 'react-router-dom';

<Link
  to={`/admin/questions?collection=${result.collectionSlug}&status=draft`}
  className="text-red-700 underline hover:text-red-900"
>
  View in Explorer
</Link>
```

### Anti-Patterns to Avoid

- **Generating questions without a `topicId`:** The `questions.topicId` column is `NOT NULL`. Every question insert will fail without a valid topic ID. Resolve the topic before insertion.
- **Using UTC midnight as `expiresAt`:** The requirement is end-of-day in the jurisdiction's local timezone. Storing UTC midnight is a correctness error (players in that timezone would see the question "expire" at midnight UTC, which is mid-day local).
- **Setting `status = 'active'` on generated questions:** Always use `status = 'draft'`. Admin activates manually (ELEC-08).
- **Calling `questions.electionRaceId` without linking to `collectionQuestions`:** Questions with only `electionRaceId` set but no collection link won't appear in the question explorer (which joins on `collection_questions`). The generator must insert into `collection_questions` as well.
- **Force-regenerating without archiving first:** The spec says "previous questions are archived, then new draft questions are created." Don't skip archiving — questions with no collection link could become orphaned.
- **Using `drizzle-kit generate` instead of `push`:** This project uses `drizzle-kit push` for all schema changes.
- **Calling Claude without a system prompt:** The locale generation scripts separate system prompt from user message (messages.create with `system:` param). Follow the same pattern for election generation.
- **Hard-coding `'claude-sonnet-4-5'`:** The `anthropic-client.ts` MODEL constant uses `'claude-sonnet-4-5'` but `generateQuestions.ts` directly uses `'claude-sonnet-4-6'`. Use `'claude-sonnet-4-6'` for consistency with the latest script.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal/overlay UI | Custom CSS + z-index div | `@headlessui/react` Dialog | Already installed, used in `QualityComparisonModal.tsx` |
| CLI arg parsing | `minimist` or `commander` | `process.argv` manual parse | Consistent with all existing scripts |
| Quality validation | Custom rule checks | `auditQuestion()` from quality rules engine | Full suite of blocking/advisory rules already built |
| DB question insert | Raw SQL | `db.insert(questions).values(...).returning()` | Established Drizzle pattern from seed-questions.ts |
| Drizzle migrations | `db:generate` + `db:migrate` | `npm run db:migrate` (drizzle-kit push) | Project-wide convention |
| Timezone lib | luxon/date-fns-tz | `Intl.DateTimeFormat` (built-in Node 20) | No library to install; verified correct |

**Key insight:** The generation pipeline already has all the required building blocks. This phase assembles them in a new configuration specific to election races.

---

## Common Pitfalls

### Pitfall 1: Missing topicId on Election Questions
**What goes wrong:** `db.insert(questions).values({...})` throws a foreign key constraint violation because `topicId` is `NOT NULL NOT REFERENCES NULL`.
**Why it happens:** Election generation doesn't have a locale config with topic categories — it needs to look up the existing topic for the jurisdiction.
**How to avoid:** Before inserting any question, resolve the `topicId` from the jurisdiction's collection. If the collection has an `elections-voting` topic, use that. Fail fast if no topic is found.
**Warning signs:** `PostgreSQL error: null value in column "topic_id" violates not-null constraint`

### Pitfall 2: expiresAt Uses UTC Midnight Not Local End-of-Day
**What goes wrong:** Setting `expiresAt = new Date(race.electionDate)` stores UTC midnight of the election date, not end-of-day in local time. For a race in Indianapolis (UTC-5), UTC midnight = 7pm local the day before.
**Why it happens:** Developers treat the stored UTC timestamp as "midnight on election day" when it's only midnight in UTC.
**How to avoid:** Always compute `expiresAt` using `getEndOfDayUTC(localDateStr, race.timezone)`. The local date string is extracted from the DB date using `Intl.DateTimeFormat('en-CA', { timeZone: race.timezone })`.
**Warning signs:** ELEC-06 verification test fails — `expiresAt` does not equal 23:59:59.999 in local timezone.

### Pitfall 3: Hard Block Without Useful Error Info
**What goes wrong:** When `questionsGenerated = TRUE` and no `--force`, the UI shows a generic error without telling the admin how many questions exist or when they were generated.
**Why it happens:** Route returns 409 with minimal info.
**How to avoid:** When returning the 409 error, include `existingCount` (count of questions with this `electionRaceId`) and `generatedAt` (from `createdAt` of latest such question). The UI error modal shows: question count + "Force Regenerate will archive [N] questions" + Confirm button.

### Pitfall 4: No Collection Link = Questions Don't Appear in Explorer
**What goes wrong:** Questions are inserted into `questions` with `electionRaceId` set, but not into `collection_questions`. The question explorer JOIN on `collection_questions` means these questions never appear.
**Why it happens:** `electionRaceId` feels like sufficient routing — but the explorer uses collection filtering.
**How to avoid:** After inserting each question, also insert into `collection_questions`. The collectionId comes from the jurisdiction's collection.

### Pitfall 5: Degenerate MCQ Options for 2-Candidate Races
**What goes wrong:** For a race with only 2 candidates, asking "Who are the candidates?" requires listing both in the answer. For "Which candidate is the incumbent?", there are only 2 options (one per candidate) — padding with 2 invented names creates obviously wrong distractors.
**Why it happens:** Standard 4-option MCQ format breaks down for tiny candidate pools.
**How to avoid:** ELEC-09 requires MCQ construction guidance in the system prompt. The `buildElectionSystemPrompt()` function must include:
- For 2-candidate races: focus on seat/office questions where distractors can be other offices, terms, or roles — avoid "which candidate" questions unless framed around role/platform facts
- For 5+ candidate primaries: focus on one or two specific candidates per question rather than comprehensive comparisons
**Warning signs:** Generated questions with distractors that are obviously invented names or "None of the above"

### Pitfall 6: ExternalId Collisions
**What goes wrong:** `externalId` has a `UNIQUE` constraint. If generation is run twice (even with force), re-inserted questions with the same `elc-1-001` ID will silently be skipped by `onConflictDoNothing`.
**Why it happens:** Sequence numbers restart from 001 on each generation run.
**How to avoid:** On force-regenerate, use a timestamp suffix: `elc-{raceId}-{timestamp}-{seq}`. Or archive by updating status, then insert fresh records with unique IDs. The simplest safe approach: always use `elc-{raceId}-{Date.now()}-{seq}` so force runs never collide.

### Pitfall 7: Generation Timeout From the API Route
**What goes wrong:** The frontend POST to `/api/admin/election-races/:id/generate` waits for the full generation run (may take 30-90 seconds for 10-15 questions). The HTTP connection times out or the user's browser gives up.
**Why it happens:** Generating 15 questions with 3 retries each against the Claude API is slow.
**How to avoid two approaches:**
1. **Synchronous with long timeout**: Set Express timeout to 300 seconds, show a spinner in the UI. Simpler but risky.
2. **Async with polling**: Return immediately with `{ jobId }`, poll a status endpoint. More complex.
**Recommendation:** For Phase 37, use the synchronous approach with frontend-side user feedback (modal says "This may take 1-2 minutes..."). The generation of 8-15 questions should complete in under 60 seconds. Add a `timeout: 120000` to the Express route.

---

## Code Examples

Verified patterns from direct codebase inspection:

### Existing Admin Drizzle Update Pattern
```typescript
// Source: backend/src/routes/admin.ts — lines 220-228
const [updatedQuestion] = await db
  .update(questions)
  .set({
    status: 'archived',
    expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
    updatedAt: new Date()
  })
  .where(eq(questions.id, questionId))
  .returning();
```

### Headlessui Modal Pattern (already in codebase)
```typescript
// Source: frontend/src/pages/admin/components/QualityComparisonModal.tsx — lines 51-53
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

return (
  <Transition show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment}
        enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
        leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
      </Transition.Child>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Transition.Child as={Fragment} ...>
          <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            {/* content */}
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>
);
```

### Admin Fetch Pattern with Bearer Token
```typescript
// Source: frontend/src/pages/admin/ElectionsPage.tsx — lines 64-66
const res = await fetch(`${API_URL}/api/admin/election-races`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### New Admin POST with Body Pattern
```typescript
// Source: frontend/src/pages/admin/ElectionsPage.tsx — lines 113-127
const res = await fetch(`${API_URL}/api/admin/election-races`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ /* data */ }),
});
```

### Election Question System Prompt Structure (buildElectionSystemPrompt)
```typescript
// backend/src/services/generation/ElectionQuestionGenerator.ts (to create)
function buildElectionSystemPrompt(race: ElectionRace): string {
  const candidateNames = race.candidates.map(c => c.name).join(', ') || 'Unknown';
  const candidateCount = race.candidates.length;

  return `You are a civic education content creator generating trivia questions about an election race.

## Race Details
- Seat: ${race.seat}
- Election Type: ${race.electionType}
- Jurisdiction: ${race.jurisdiction}
- Election Date: ${race.electionDate.toISOString().split('T')[0]}
- Candidates: ${candidateNames}

## Question Types
Generate a mix of:
1. SEAT CIVICS questions (what does this office do? what powers does it have? how long is the term?)
   - Include both hyper-local specifics AND general rules for this type of office
2. CANDIDATE questions (factual, non-comparative — one candidate per question)
   - Stick to verifiable facts; no opinions, no party comparisons

## Factual Only — No Comparisons
Do NOT generate questions that compare candidates against each other.
Focus on facts about the seat and individual candidates.

## Answer Option Construction
${candidateCount === 2 ? `
### Small Pool (2 candidates)
- Avoid "Which candidate...?" questions where only 2 options exist (creates degenerate MCQ)
- For seat civics questions, use real government entities as distractors
- For candidate questions, focus on roles and verifiable facts
` : candidateCount >= 5 ? `
### Crowded Primary (${candidateCount} candidates)
- Focus one question on one candidate — don't try to list all candidates
- Distractors can be other candidates from the race (use real names, not invented ones)
- Seat civics questions can use other offices/jurisdictions as distractors
` : `
### Standard Pool (${candidateCount} candidates)
- Mix candidate questions with seat civics questions
- Distractors should be plausible alternatives: real neighboring jurisdictions, real terms, real government structures
`}

## Output Format
Return ONLY valid JSON:
{
  "questions": [
    {
      "text": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "According to [source], ...",
      "difficulty": "easy",
      "topicCategory": "election-race",
      "source": { "name": "Source", "url": "https://..." }
    }
  ]
}

${QUALITY_GUIDELINES}`;
}
```

### ExternalId Format for Election Questions
```typescript
// Use race ID + timestamp to guarantee uniqueness across force-regenerate runs
function buildExternalId(raceId: number, seq: number): string {
  return `elc-${raceId}-${String(seq).padStart(3, '0')}`;
}
// For force runs, add a timestamp discriminator to avoid ON CONFLICT DO NOTHING silently skipping:
function buildExternalIdForce(raceId: number, seq: number): string {
  const ts = Date.now().toString(36); // base-36 timestamp, e.g., 'lh3b4k'
  return `elc-${raceId}-${ts}-${String(seq).padStart(3, '0')}`;
}
```

### Question Volume by Race Type
```typescript
// Source: CONTEXT.md decisions
function getQuestionTarget(electionType: string): number {
  // Mayor elections: 15 questions
  // Council seat: 10 questions
  // Other: 8 questions
  // Note: 'mayor' detection is by checking race.seat.toLowerCase().includes('mayor')
  // 'council' detection: race.seat.toLowerCase().includes('council')
  const seat = electionType.toLowerCase();
  if (seat.includes('mayor')) return 15;
  if (seat.includes('council')) return 10;
  return 8;
}

// Actually: the logic should inspect race.seat, not electionType
function getQuestionTarget(race: ElectionRace): number {
  const seat = race.seat.toLowerCase();
  if (seat.includes('mayor')) return 15;
  if (seat.includes('council')) return 10;
  return 8;
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Phase |
|--------------|------------------|----------------------|
| Manual question entry | Script-driven Claude generation | Follow `generateQuestions.ts` pattern |
| Collection-scoped generation | Race-scoped generation with `electionRaceId` | Set `electionRaceId` on every question; also link to collection |
| `expiresAt: null` (most questions) | `expiresAt` required for all election questions | Compute using `getEndOfDayUTC()` helper |
| Content-generation scripts write JSON files | Election script writes directly to DB | Follow `seed-questions.ts` direct DB insert pattern |

**Deprecated/outdated:**
- `anthropic-client.ts` MODEL constant uses `'claude-sonnet-4-5'` but `generateQuestions.ts` line 276 uses `'claude-sonnet-4-6'`. Use `'claude-sonnet-4-6'` for new code.

---

## Open Questions

1. **How does the generator know which collection the race belongs to?**
   - What we know: `election_races` has `jurisdiction` (e.g., `'Bloomington, IN'`), not a `collection_slug`. Questions must be in `collection_questions` to appear in the explorer.
   - What's unclear: Is there a reliable mapping from jurisdiction string to collection slug?
   - Recommendation: Either (a) add `collectionSlug` to `election_races` table as a new nullable text field (small schema change, use `drizzle-kit push`), or (b) require it as a parameter on the generate endpoint/CLI. Option (a) is cleaner and matches the race's data profile. Option (b) avoids a schema change. The planner should decide.

2. **Does the question explorer need a new "election_race" filter?**
   - What we know: CONTEXT says "Questions appear in question explorer filtered by jurisdiction" and "no race-specific filter needed."
   - What's unclear: "filtered by jurisdiction" = filtered by collection slug? Or filtered by the `search` param matching jurisdiction text?
   - Recommendation: Use the existing collection filter (`?collection=bloomington-in`) since election questions are linked to the jurisdiction's collection. The "View in Explorer" link in the success state uses `?collection={collectionSlug}&status=draft`. No new filter needed.

3. **What happens if the jurisdiction has no matching collection?**
   - What we know: Phase 35 added `election_races` for any jurisdiction. Collections are a fixed set (bloomington-in, los-angeles-ca, etc.).
   - What's unclear: Can a race be created for a jurisdiction that doesn't yet have a collection?
   - Recommendation: Add a validation check in the generator: if no matching collection is found, fail with a clear error. Don't silently insert questions without collection links.

4. **Quality validation on election questions?**
   - What we know: The existing `auditQuestion()` runs all quality rules. Some rules (like `checkAddressPhone`) scan options. Election questions may have candidate names as answer options, which could trigger false positives.
   - What's unclear: Whether existing quality rules are appropriate for election questions.
   - Recommendation: Run `auditQuestion()` with `{ skipUrlCheck: true }` (URL check is async and slow). Log violations but don't hard-block on advisory violations. Only hard-block on blocking violations (as generation does today).

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `backend/src/scripts/generateQuestions.ts` — CLI pattern, Claude API call, arg parsing, external ID format, model version
- `backend/src/scripts/content-generation/utils/seed-questions.ts` — DB insert pattern, status='draft', collection linking
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — batch generation pattern, `buildSystemPrompt` structure
- `backend/src/scripts/content-generation/prompts/system-prompt.ts` — system prompt structure, quality guidelines embedding
- `backend/src/scripts/content-generation/prompts/quality-guidelines.ts` — blocking rules content
- `backend/src/scripts/content-generation/anthropic-client.ts` — MODEL constant, Anthropic client config
- `backend/src/db/schema.ts` — confirmed `topicId NOT NULL`, `electionRaceId` nullable FK, `status='draft'` default
- `backend/src/routes/admin.ts` — admin route pattern, Drizzle update pattern, Zod validation, 409/201 patterns
- `backend/package.json` — confirmed `@anthropic-ai/sdk` in devDependencies, no date library installed
- `frontend/src/pages/admin/ElectionsPage.tsx` — existing admin page to modify, current race list table structure
- `frontend/src/pages/admin/components/QualityComparisonModal.tsx` — headlessui Dialog/Transition pattern
- `frontend/src/pages/admin/QuestionsPage.tsx` — explorer URL params, `?collection=slug&status=draft` pattern
- `frontend/package.json` — confirmed `@headlessui/react ^2.2.9` installed
- Node.js built-in `Intl.DateTimeFormat` — verified timezone-aware end-of-day computation (tested with real DST edge cases)

### Secondary (MEDIUM confidence)
- N/A — all findings from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json files; no new libraries required
- Architecture: HIGH — confirmed from direct inspection of 3 existing generation scripts and admin route patterns
- Timezone computation: HIGH — code verified working in Node 20 with multiple DST edge cases
- Pitfalls: HIGH — identified from schema constraints, route patterns, and existing generation script behavior
- Claude prompt structure: MEDIUM — buildElectionSystemPrompt structure is proposed based on existing system prompts; exact content effectiveness is untested

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable dependencies; @anthropic-ai/sdk and headlessui API patterns are stable)
