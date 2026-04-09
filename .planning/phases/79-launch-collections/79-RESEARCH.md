# Phase 79: Launch Collections - Research

**Researched:** 2026-04-09
**Domain:** International collection scaffold + RSS pipeline initial seeding
**Confidence:** HIGH — all findings from direct codebase inspection

## Summary

Phase 79 creates two International collections — War in Iran (fast volatility) and Climate Agreements (medium volatility) — and seeds each with 15+ active questions so both are live and playable at launch.

The pipeline infrastructure from Phase 78 is complete. The work is: scaffold two collections via `scaffold-collection.ts`, insert them into the DB via Supabase MCP SQL (scripts hang), write and customize their locale configs, run the RSS pipeline to generate 15+ active questions per collection, uncomment their entries in `pipelineCron.ts`, and add banner images.

**Critical blocker discovered:** The `/api/game/collections` endpoint filters out any collection with fewer than `MIN_QUESTION_THRESHOLD = 50` active questions (line 93, `game.ts`). A collection with only 15 questions will NOT appear in the collection picker. The plans must either: (a) lower this threshold for the international tier, or (b) run the pipeline enough times to reach 50+ questions before activation. Option (a) is a one-line code change and is the correct approach.

**Primary recommendation:** Add a per-tier threshold check so international collections require only 8 questions minimum (one full game) instead of 50. Implement this in `game.ts` before activating the collections.

## Standard Stack

### Core (all from Phase 78 — already in codebase)

| Tool | Location | Purpose |
|------|----------|---------|
| `scaffold-collection.ts` | `backend/src/scripts/scaffold-collection.ts` | Creates seed entry + locale config + registers in generate-locale-questions.ts |
| `run-pipeline.ts` | `backend/src/scripts/international/run-pipeline.ts` | RSS → claim extraction → question generation → DB write |
| `pipelineCron.ts` | `backend/src/cron/pipelineCron.ts` | Nightly cron; has commented-out entries for both collections |
| Supabase MCP SQL | Via MCP tool | Insert collections directly (scripts hang) |

### RSS Feeds (global, not per-collection)

`INTERNATIONAL_FEEDS` in `rss-ingestor.ts` is hardcoded to 4 global feeds:
- BBC World: `https://feeds.bbci.co.uk/news/world/rss.xml`
- NPR: `https://feeds.npr.org/1004/rss.xml`
- The Guardian: `https://www.theguardian.com/world/rss`
- DW: `https://rss.dw.com/rdf/rss-en-world`

**Key finding:** `run-pipeline.ts` calls `fetchAllFeeds(INTERNATIONAL_FEEDS)` hardcoded — it cannot be passed per-collection feeds. The `rssFeeds` field defined in `InternationalLocaleConfig` (in `bloomington-in.ts`) is NOT wired to the pipeline. Both War in Iran and Climate Agreements draw from the same 4 global feeds. This is fine at launch — all 4 feeds cover both Iran conflict and climate topics.

## Architecture Patterns

### Pattern 1: Scaffold → SQL insert → locale config → pipeline → activate

```
1. scaffold-collection.ts --tier international   (modifies 3 files)
2. Supabase MCP SQL INSERT INTO trivia.collections (scripts hang)
3. Edit generated locale config (it will be LocaleConfig, not InternationalLocaleConfig)
4. run-pipeline.ts --collection <slug> --prefix <prefix>  (run 2-3× for 15+ questions)
5. Uncomment entry in pipelineCron.ts
6. Add banner image
7. Verify collection appears in /api/game/collections
```

### Pattern 2: What scaffold-collection.ts generates for international tier

When `--tier international` is passed:
- `iconIdentifier` = `'globe'` (hardcoded via `deriveIconIdentifier`)
- Tier stored as `'international'` in the seed entry
- Locale config created from **city-government template** (not an international template) — the generated file uses `LocaleConfig`, not `InternationalLocaleConfig`
- Locale config registered in `generate-locale-questions.ts` — BUT international collections do NOT use `generate-locale-questions.ts` for content (they use the RSS pipeline). The registration is harmless but unused.

**Implication:** The locale config file created by scaffold for international collections is cosmetic metadata. It is not consumed by `run-pipeline.ts`. No `InternationalLocaleConfig` locale config file is required. The pipeline config for pipelineCron is just the inline object `{ collectionSlug, prefix, volatility }`.

### Pattern 3: SQL INSERT for direct collection creation

Required fields from `trivia.collections` schema:

```sql
INSERT INTO trivia.collections (
  name, slug, description, locale_code, locale_name,
  icon_identifier, theme_color, tier, is_active, sort_order
) VALUES (
  'War in Iran',
  'war-in-iran',
  '<tagline>',
  'en-US',
  'War in Iran',
  'globe',
  '<hex_color>',
  'international',
  false,
  35
);
```

No nullable fields require special handling. All required fields listed above. `created_at` and `updated_at` default to `NOW()`. `id` is serial.

**collection_topics:** writePassingQuestions() lazy-creates the `world-news` topic and inserts it into `trivia.topics` if it doesn't exist. It does NOT insert `collection_topics` rows. For international collections, `collection_topics` rows are optional — the game selector doesn't use `collection_topics` for question filtering; it uses `collection_questions` only. The admin panel may use `collection_topics` for display. Insert one `collection_topics` row linking `world-news` topic to each collection after the topic is created by the first pipeline run.

**collection_questions:** `writePassingQuestions()` in `question-generator.ts` automatically inserts `collection_questions` rows (line 289-292). No manual insert needed — this is different from the city/state collection workflow.

### Pattern 4: Running the pipeline for initial seeding

The pipeline CLI signature:
```
npx tsx src/scripts/international/run-pipeline.ts \
  --collection <slug> \
  --prefix <prefix>
```

There is NO `--volatility` flag in the CLI (`parseArgs` does not parse it). Volatility defaults to `'fast'`. For Climate Agreements (medium volatility), the CLI cannot set medium volatility. Must call `runPipeline()` programmatically or use pipelineCron.

**Options for Climate Agreements initial seeding:**
1. Uncomment the climate-agreements entry in pipelineCron.ts and trigger the cron manually
2. Write a one-off script that calls `runPipeline('climate-agreements', 'clima', { volatility: 'medium', maxQuestions: 25 })`
3. Call `runPipeline()` directly from a REPL/ts-node session

Option 1 is cleanest — uncomment the cron entry, deploy/restart the server, and trigger one manual cron run. The planner should document this.

### Pattern 5: MIN_QUESTION_THRESHOLD fix required

In `backend/src/routes/game.ts` line 93:
```typescript
const filtered = rows.filter(r => r.questionCount >= MIN_QUESTION_THRESHOLD);
```

`MIN_QUESTION_THRESHOLD = 50` applies to ALL collections. International collections will have 15–30 questions at launch. They will be invisible in the collection picker until this is changed.

**Fix (single line change):**
```typescript
// game.ts, replace line 93:
const filtered = rows.filter(r => {
  const threshold = r.tier === 'international' ? 8 : MIN_QUESTION_THRESHOLD;
  return r.questionCount >= threshold;
});
```

This requires `tier` to be selected in the query, which it already is (line 66).

### Pattern 6: computeExpiresAt produces correct ranges

From `question-generator.ts`:
```typescript
const days: Record<Volatility, number> = {
  fast: 4,     // War in Iran: within 3–5 day requirement
  medium: 10,  // Climate Agreements: within 7–14 day requirement
  slow: 60,
  stable: 180,
};
```

Both ranges satisfy INTL-03 and INTL-04 requirements. Confirmed from source.

### Pattern 7: MAX_QUESTIONS_PER_RUN cap

`pipelineCron.ts` passes `maxQuestions: MAX_QUESTIONS_PER_RUN = 8` to each pipeline call. For initial seeding, we need 15+ questions, so at minimum 2 pipeline runs per collection are needed. The `maxQuestions` parameter caps clusters processed, not questions generated (1 cluster can yield 1–3 questions). Realistically, 3 pipeline runs should produce 15+ questions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| collection_questions insertion | Manual SQL inserts | writePassingQuestions() handles this automatically |
| RSS → questions pipeline | Custom ingestor | run-pipeline.ts is the complete pipeline |
| Expiry date calculation | Custom logic | computeExpiresAt(volatility) in question-generator.ts |
| Pool ceiling enforcement | Custom archiver | poolRegulator.ts handles this |

## Common Pitfalls

### Pitfall 1: 50-Question Threshold Blocks Collection Picker
**What goes wrong:** Collections with 15 questions activate successfully but never appear in the UI. Players cannot find them.
**Why it happens:** `MIN_QUESTION_THRESHOLD = 50` in game.ts is applied universally.
**How to avoid:** Patch game.ts before activating — add tier-conditional threshold (8 questions minimum for international).
**Warning signs:** Collection is `is_active = true` in DB but not visible in the picker.

### Pitfall 2: Climate Agreements Gets Wrong Volatility from CLI
**What goes wrong:** Running `run-pipeline.ts --collection climate-agreements --prefix clima` writes all questions with `volatility = 'fast'` and `expiresAt = now + 4 days` instead of 10 days.
**Why it happens:** CLI has no `--volatility` flag; `runPipeline()` defaults to `'fast'`.
**How to avoid:** Use pipelineCron uncomment + manual trigger, OR write an inline script that calls `runPipeline('climate-agreements', 'clima', { volatility: 'medium' })` directly.
**Warning signs:** Questions in DB show `volatility = 'fast'` and `expires_at` only 4 days out.

### Pitfall 3: Locale Config Template Is City-Flavored
**What goes wrong:** Scaffold generates a `LocaleConfig` with `city-government`, `civic-history`, `local-services` topics. These are irrelevant for an international news collection.
**Why it happens:** `step2CreateLocaleConfig()` uses a city-government template for all tiers.
**How to avoid:** After scaffold, replace the locale config with topics appropriate for the collection (e.g., `conflict-events`, `diplomacy-agreements`, `humanitarian-impact` for War in Iran). This is cosmetic since the pipeline doesn't use the locale config.
**Warning signs:** N/A — the locale config for international collections is NOT consumed by the pipeline, so wrong topics have no runtime effect.

### Pitfall 4: Scaffold Registers International Locales in generate-locale-questions.ts
**What goes wrong:** `scaffold-collection.ts --tier international` registers the slug in `supportedLocales` in `generate-locale-questions.ts`. Running `generate-locale-questions.ts --locale war-in-iran` would fail or produce wrong content.
**Why it happens:** scaffold-collection.ts step3 registers all tiers uniformly.
**How to avoid:** Never run `generate-locale-questions.ts` for international collections. Use `run-pipeline.ts` exclusively.
**Warning signs:** No warning needed — as long as executors use run-pipeline.ts for international collections.

### Pitfall 5: collection_topics Rows Not Auto-Created
**What goes wrong:** `writePassingQuestions()` creates the `world-news` topic and `collection_questions` rows, but does NOT create `collection_topics` rows. The admin panel may show no topics linked.
**Why it happens:** writePassingQuestions() links questions to the world-news topic via `topicId` on the question row, and writes `collection_questions`, but doesn't write `collection_topics`.
**How to avoid:** After the first pipeline run, insert one `collection_topics` row per collection:
```sql
INSERT INTO trivia.collection_topics (collection_id, topic_id, created_at)
SELECT c.id, t.id, NOW()
FROM trivia.collections c, trivia.topics t
WHERE c.slug IN ('war-in-iran', 'climate-agreements')
  AND t.slug = 'world-news'
ON CONFLICT DO NOTHING;
```
**Warning signs:** Admin panel shows collection with 0 topics.

### Pitfall 6: activate-collection.ts Script Hangs
**What goes wrong:** Running `npx tsx src/scripts/activate-collection.ts` hangs after "PostgreSQL connected".
**Why it happens:** Documented in project memory as a known issue since 2026-03-22.
**How to avoid:** Set `is_active = true` via Supabase MCP SQL instead:
```sql
UPDATE trivia.collections SET is_active = true, updated_at = NOW()
WHERE slug IN ('war-in-iran', 'climate-agreements');
```

### Pitfall 7: Pipeline Needs Collection in DB Before Running
**What goes wrong:** `run-pipeline.ts` throws "Collection not found in DB: war-in-iran" on first run.
**Why it happens:** Pipeline verifies collection exists before proceeding (lines 73-80 of run-pipeline.ts).
**How to avoid:** Insert collection into DB via Supabase MCP SQL BEFORE running the pipeline.

## Code Examples

### SQL: Insert both collections directly (bypasses hanging scripts)

```sql
-- War in Iran
INSERT INTO trivia.collections (
  name, slug, description, locale_code, locale_name,
  icon_identifier, theme_color, tier, is_active, sort_order
) VALUES (
  'War in Iran',
  'war-in-iran',
  'The conflict shaping the region — how much do you know?',
  'en-US',
  'War in Iran',
  'globe',
  '#B91C1C',
  'international',
  false,
  35
);

-- Climate Agreements
INSERT INTO trivia.collections (
  name, slug, description, locale_code, locale_name,
  icon_identifier, theme_color, tier, is_active, sort_order
) VALUES (
  'Climate Agreements',
  'climate-agreements',
  'The planet is at the table — are you?',
  'en-US',
  'Climate Agreements',
  'globe',
  '#065F46',
  'international',
  false,
  36
);
```

### game.ts: Tier-conditional MIN_QUESTION_THRESHOLD

```typescript
// Source: backend/src/routes/game.ts, line 93 — replace with:
const MIN_INTERNATIONAL_THRESHOLD = 8;

const filtered = rows.filter(r => {
  const threshold = r.tier === 'international' ? MIN_INTERNATIONAL_THRESHOLD : MIN_QUESTION_THRESHOLD;
  return r.questionCount >= threshold;
});
```

### pipelineCron.ts: Uncomment both entries

```typescript
// Source: backend/src/cron/pipelineCron.ts, lines 29-30 — uncomment:
const INTERNATIONAL_COLLECTIONS: InternationalLocaleConfig[] = [
  { collectionSlug: 'war-in-iran', prefix: 'wiran', volatility: 'fast' },
  { collectionSlug: 'climate-agreements', prefix: 'clima', volatility: 'medium' },
];
```

### Initial pipeline seeding for War in Iran (fast volatility — CLI works)

```bash
cd backend
npx tsx src/scripts/international/run-pipeline.ts \
  --collection war-in-iran \
  --prefix wiran
# Run 2-3 times to reach 15+ questions
```

### Initial pipeline seeding for Climate Agreements (medium volatility — must use programmatic API)

```typescript
// One-off seed script: backend/src/scripts/international/seed-climate-agreements.ts
import 'dotenv/config';
import { runPipeline } from './run-pipeline.js';

await runPipeline('climate-agreements', 'clima', { volatility: 'medium', maxQuestions: 25 });
// Run 2× to reach 15+ questions (each run produces up to 8 passing questions from 25 clusters)
```

### SQL: Activate collections after questions are verified

```sql
UPDATE trivia.collections
SET is_active = true, updated_at = NOW()
WHERE slug IN ('war-in-iran', 'climate-agreements');
```

### SQL: Link world-news topic to collections (after first pipeline run)

```sql
INSERT INTO trivia.collection_topics (collection_id, topic_id, created_at)
SELECT c.id, t.id, NOW()
FROM trivia.collections c
CROSS JOIN trivia.topics t
WHERE c.slug IN ('war-in-iran', 'climate-agreements')
  AND t.slug = 'world-news'
ON CONFLICT DO NOTHING;
```

### SQL: Verify collection question counts post-pipeline

```sql
SELECT c.slug, c.tier, c.is_active,
  COUNT(CASE WHEN q.status = 'active' AND (q.expires_at IS NULL OR q.expires_at > NOW()) THEN 1 END) AS active_questions,
  MAX(q.created_at) AS latest_question_at
FROM trivia.collections c
LEFT JOIN trivia.collection_questions cq ON c.id = cq.collection_id
LEFT JOIN trivia.questions q ON cq.question_id = q.id
WHERE c.slug IN ('war-in-iran', 'climate-agreements')
GROUP BY c.id, c.slug, c.tier, c.is_active;
```

## Theme Colors and Taglines

These are Claude's discretion (no decisions locked in CONTEXT.md).

### War in Iran
- **Recommended theme color:** `#B91C1C` (red-700 — evokes conflict, urgency)
- **Tagline options:**
  - "The conflict shaping the region — how much do you know?"
  - "Headlines from the front lines — tested in real time."
  - "War reshapes everything — do you know how?"
- **Constraint:** Taglines must be ≤64 chars. The first option is 55 chars.

### Climate Agreements
- **Recommended theme color:** `#065F46` (emerald-800 — evokes climate/environment)
- **Tagline options:**
  - "The planet is at the table — are you?"
  - "Targets, treaties, timelines — how sharp is your climate IQ?"
  - "From Paris to COP — do you know the deals?"
- **Constraint:** Taglines must be ≤64 chars. All three options are within limit.

## Banner Images

Convention for international collections: no established pattern exists yet (norwich-uk.jpg is the only prior international-ish collection, using a local landmark image). Recommendation:

- **War in Iran:** Use a recognizable geopolitical visual — Iranian flag, Tehran cityscape, or UN emblem. Avoid conflict imagery.
- **Climate Agreements:** Use a COP/UNFCCC visual — globe with leaf motif, or a prominent UN climate summit photo.

Both slugs require files at:
- `frontend/public/images/collections/war-in-iran.jpg`
- `frontend/public/images/collections/climate-agreements.jpg`

The `activate-collection.ts` script (if used) requires these before running. Since activation is done via SQL, the banner requirement is enforced by the plan verification step, not by the script.

## Open Questions

1. **Per-collection RSS feed filtering**
   - What we know: `run-pipeline.ts` uses `INTERNATIONAL_FEEDS` (all 4 feeds, global) regardless of which collection is being populated. The `InternationalLocaleConfig.rssFeeds` field in `bloomington-in.ts` is not wired to the pipeline.
   - What's unclear: Should Phase 79 wire per-collection feeds, or accept that both collections draw from the same global feeds?
   - Recommendation: Accept global feeds for Phase 79 launch. All 4 feeds (BBC, NPR, Guardian, DW) cover both Iran and Climate topics. Per-collection feed routing is a future enhancement.

2. **Banner image sourcing**
   - What we know: Convention exists for city (landmark) and state (capitol building) but not international.
   - What's unclear: Whether executor should generate/find images or wait for manual upload.
   - Recommendation: Plan should include a task to add banner images; executor can use a symbolic placeholder or public domain image.

3. **Min threshold value for international tier**
   - What we know: 50 is too high for a freshly launched collection with fast expiry.
   - What's unclear: Whether 8 (one game) is too low from a UX perspective.
   - Recommendation: Use 8 as the minimum (one full game is playable). The pool should grow quickly via daily cron runs.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `backend/src/routes/game.ts` — MIN_QUESTION_THRESHOLD (line 16, 93)
- `backend/src/scripts/international/run-pipeline.ts` — pipeline CLI, InternationalLocaleConfig, volatility default
- `backend/src/scripts/international/question-generator.ts` — computeExpiresAt, writePassingQuestions
- `backend/src/scripts/international/rss-ingestor.ts` — INTERNATIONAL_FEEDS hardcoded global feeds
- `backend/src/cron/pipelineCron.ts` — commented-out entries, MAX_QUESTIONS_PER_RUN=8
- `backend/src/scripts/scaffold-collection.ts` — --tier international support, city template used for all tiers
- `backend/src/db/schema.ts` — collections table schema, required fields
- `backend/src/db/seed/collections.ts` — current max sortOrder is 34
- `backend/src/scripts/activate-collection.ts` — hangs after "PostgreSQL connected"
- `frontend/src/features/collections/components/CollectionPicker.tsx` — international tier grouping
- `frontend/src/features/collections/components/CollectionCard.tsx` — freshness indicator for international
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` — InternationalLocaleConfig interface definition

## Metadata

**Confidence breakdown:**
- MIN_QUESTION_THRESHOLD blocker: HIGH — read directly from game.ts line 93
- Climate Agreements no --volatility CLI flag: HIGH — read directly from run-pipeline.ts parseArgs()
- writePassingQuestions auto-inserts collection_questions: HIGH — read directly from question-generator.ts lines 289-292
- collection_topics not auto-created: HIGH — verified writePassingQuestions does not insert them
- scaffold generates city template for international: HIGH — read step2CreateLocaleConfig directly
- seed.ts/activate-collection.ts hang: HIGH — documented in project memory, confirmed
- Theme colors and taglines: LOW — Claude's recommendation, no locked decisions

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (30 days — codebase is stable)
