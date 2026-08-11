# Phase 34: Scale to 90+ Questions - Research

**Researched:** 2026-02-23
**Domain:** Question generation pipeline execution + database seeding
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 34 is primarily an execution phase: run the generation pipeline built in Phase 33 for each of 5 non-Federal collections, then merge the generated questions into the source JSON files and seed them to the database as active questions.

The critical finding is that `generateQuestions.ts` does NOT write to `src/data/` directly and does NOT seed the database. It writes standalone output JSON files to the `backend/` root directory. A merge step is required to append new questions into the canonical `src/data/*-questions.json` files before seeding. The seeding mechanism then reads from those JSON files.

A second critical finding: the `seed-community.ts` script handles Bloomington, LA, and Fremont, but NOT Indiana or California state collections. State collections need a different seeding path (`generate-state-questions.ts` seeds drafts directly; or a custom approach). For Phase 34, since questions go live immediately (no draft/pending), the plan must explicitly address how to insert state questions as `status='active'` rather than `status='draft'`.

**Primary recommendation:** Generate per collection with `generateQuestions.ts`, merge output into source JSON, then seed with collection-appropriate mechanism, updating status to `active` immediately.

---

## Pipeline Mechanics

### generateQuestions.ts - The Primary Tool

**Location:** `backend/src/scripts/generateQuestions.ts`

**Invocation (from backend/ directory):**
```bash
npx tsx src/scripts/generateQuestions.ts --collection <slug> --target <number>
npx tsx src/scripts/generateQuestions.ts --collection fremont-ca --target 105 --dry-run
npx tsx src/scripts/generateQuestions.ts --collection bloomington-in --target 105
```

**Supported collection slugs (as the script understands them):**
| Script slug | DB collection slug | JSON file | External ID prefix |
|-------------|--------------------|-----------|--------------------|
| `federal` | `federal` | `questions.json` | `fed` |
| `bloomington-in` | `bloomington-in` | `bloomington-in-questions.json` | `bloom` |
| `los-angeles-ca` | `los-angeles-ca` | `los-angeles-ca-questions.json` | `la` |
| `indiana` | `indiana-state` | `indiana-state-questions.json` | `ind` |
| `california` | `california-state` | `california-state-questions.json` | `cal` |
| `fremont-ca` | `fremont-ca` | `fremont-ca-questions.json` | `fre` |

**Important:** The script uses `indiana` and `california` (not `indiana-state` and `california-state`) as the CLI slugs. The JSON file map inside the script correctly points to `indiana-state-questions.json` and `california-state-questions.json`.

**What it reads:**
- Source JSON file from `backend/src/data/<collection>-questions.json` (for gap analysis based on `existingQuestions.length`)
- All active questions from the PostgreSQL database (for semantic dedup checks)

**What it writes:**
- `backend/generated-questions-<collection>-<timestamp>.json` — collection-compatible format `{ topics: [...], questions: [...] }` containing only newly accepted questions
- `backend/generation-report-<collection>-<timestamp>.json` — detailed generation report with stats, source diversity, skipped details

**What it does NOT do:**
- Does NOT write to `src/data/` directly
- Does NOT seed the database
- Does NOT modify any existing files

**Pipeline stages per question:**
1. Gap analysis (topic/difficulty distribution vs target)
2. Claude API call (`claude-sonnet-4-5-20250929` — needs upgrading per Phase 34 decision)
3. Quality audit via `auditQuestion()` — up to 3 retries with feedback on blocking violations
4. Semantic dedup check via `CollectionHierarchy.checkDuplicate()` — up to 3 retries
5. Source diversity tracking (soft warnings only, does not block)
6. Accept + generate embedding for intra-batch dedup, or skip/duplicate

**Rate limiting:** 1-second delay between each Claude API call (serial generation)

**Model parameter:** Currently hardcoded to `claude-sonnet-4-5-20250929` at line 276. Per Phase 34 decision, this should be updated to the latest available Claude Sonnet model at execution time. As of February 2026, the latest model is `claude-sonnet-4-6`.

**External ID counter:** Counter starts at `existingQuestions.length + 1` (based on JSON file count). This means if the JSON has 61 questions, new IDs start at `bloom-062`. Counter only increments on accepted questions.

---

## JSON File Structure and Locations

**Canonical source JSON files (truth for seeding):**
- `backend/src/data/bloomington-in-questions.json` — 61 questions (8 topics)
- `backend/src/data/los-angeles-ca-questions.json` — 52 questions (8 topics)
- `backend/src/data/fremont-ca-questions.json` — 71 questions (8 topics)
- `backend/src/data/indiana-state-questions.json` — 84 questions (8 topics)
- `backend/src/data/california-state-questions.json` — 83 questions (8 topics)

**JSON file structure:**
```json
{
  "topics": [
    { "slug": "city-government", "name": "City Government", "description": "..." }
  ],
  "questions": [
    {
      "externalId": "bli-001",
      "text": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1,
      "explanation": "...",
      "difficulty": "easy",
      "topicCategory": "city-government",
      "source": { "name": "Source Name", "url": "https://..." },
      "expiresAt": null
    }
  ]
}
```

**Generated output format** (from `generateQuestions.ts`) matches this structure exactly — the `questions` array in the output file can be directly appended to the source JSON `questions` array. Topics array in the output is a copy from the source, not new topics.

**Merge operation:** Read generated output JSON, extract `questions` array, append to source JSON `questions` array, write back. No transformation needed.

---

## Seeding Mechanism

### Two Distinct Seeding Paths

**Path 1: Bloomington, LA, Fremont (locale/city collections)**

`npm run db:seed:community` runs `seed-community.ts` which reads from:
- `src/data/bloomington-in-questions.json`
- `src/data/los-angeles-ca-questions.json`
- `src/data/fremont-ca-questions.json`

This script inserts questions with `status: 'active'` directly (line 154 in seed-community.ts). It uses `ON CONFLICT DO NOTHING` on `externalId` — idempotent and add-only. Also ensures collection is set to `isActive: true`.

**IMPORTANT:** The `LOCALES` array in `seed-community.ts` only includes bloomington-in, los-angeles-ca, and fremont-ca. Indiana and California are NOT included.

**Path 2: Indiana, California (state collections)**

No equivalent `db:seed:state` script exists. Options:
- `generate-state-questions.ts` seeds directly but uses `status='draft'` (needs activation after)
- `generateQuestions.ts` does NOT seed at all (outputs JSON only)
- The `activate-collections.ts` script handles activation by prefix pattern: `ins-%` for Indiana, `cas-%` for California

**Add-only constraint:** Both `seed-community.ts` and `seedQuestionBatch()` use `ON CONFLICT DO NOTHING` on `externalId`. Existing questions are never touched. This satisfies the add-only requirement.

**Seeding state questions — cleanest approach for Phase 34:**
Since the generated JSON from `generateQuestions.ts` uses the same format as the community seed files, the plan can:
1. Append new questions to `indiana-state-questions.json` and `california-state-questions.json`
2. Seed them using a modified version of `seed-community.ts` or a custom seeding script that also handles state collections

**Database schema for questions (relevant fields):**
- `external_id`: text, unique — collision protection
- `status`: text, default `'active'` — determines visibility
- `topic_id`: FK to topics table — must exist before question insert
- `subcategory`: text — stores topicCategory slug
- `collection_questions`: junction table linking questions to collections

---

## Quality Rules and Gates

**8 quality rules** across 5 rule functions (confirmed by inspection of `backend/src/services/qualityRules/`):

| Rule ID | Function | Severity | What it checks |
|---------|----------|----------|----------------|
| `ambiguous-answers` | `checkAmbiguousAnswers` | **BLOCKING** | Answer options >70% Jaccard similarity |
| `vague-qualifiers` | `checkVagueQualifiers` | **BLOCKING** | Words: best, most important, primarily, generally, typically, mainly, usually, often, commonly, frequently |
| `pure-lookup` | `checkPureLookup` | **BLOCKING** | Obscure dates/years/ordinal holders with no civic utility (allowlist for foundational knowledge) |
| `broken-learn-more` | `checkLearnMoreLink` | **BLOCKING** | Dead source URLs (404, 500, connection failure) |
| `partisan-framing` | `checkPartisanFraming` | advisory | Partisan keywords in text/explanation |
| `learn-more-timeout` | `checkLearnMoreLink` | advisory | Source URL timeout |
| `weak-explanation` | `checkStructuralQuality` | advisory | Explanation < 30 characters |
| `short-question` | `checkStructuralQuality` | advisory | Question text < 20 characters |
| `long-question` | `checkStructuralQuality` | advisory | Question text > 500 characters |
| `missing-citation` | `checkStructuralQuality` | advisory | Explanation lacks "According to", source name, or URL |
| `missing-options` | `checkStructuralQuality` | advisory | Not exactly 4 options, or empty options |

**Note:** The score is informational only (starts 100, deducts per violation). Only `hasBlockingViolations` determines rejection. The 4 blocking rules are the gate.

**URL check is skipped during generation** (`skipUrlCheck: true` in `generateOneQuestion()`). This means `broken-learn-more` is never triggered during generation — URLs are not validated.

**Score weights:**
- Blocking violations: 25–40 points each
- Advisory violations: 5–15 points each

**Quality score distribution for new questions:** Advisory violations are logged but do not block. Questions passing generation typically score 85–100 (validated test result: 92/100 per Phase 33).

---

## Current State (Question Counts)

**JSON file counts (source of truth for gap analysis):**
| Collection | JSON file questions | DB active (from context) | Target (overshoot) | Gap to generate |
|------------|--------------------|--------------------------|--------------------|-----------------|
| Indiana State | 84 | 68 | 105 | ~21 |
| California State | 83 | 55 | 105 | ~22 |
| Bloomington, IN | 61 | 53 | 105 | ~44 |
| Fremont, CA | 71 | 54 | 105 | ~34 |
| Los Angeles, CA | 52 | 42 | 105 | ~53 |

**Important discrepancy:** The JSON file counts do NOT match the database active question counts from the CONTEXT.md. The DB active counts are lower because:
1. Some JSON questions may be archived/inactive in the DB (prior duplicate cleanup)
2. Some questions may be in the DB but archived after quality audit

The gap analyzer in `generateQuestions.ts` uses `existingQuestions.length` from the JSON file (not DB count). This means it will generate fewer questions than needed based on DB active counts. The planner must decide whether to target based on JSON count or DB count — or run a DB query first to get the real gap.

**External ID collision risk:** The counter starts at `existingQuestions.length + 1`. If JSON has 84 questions, new IDs start at `ind-085`. If some IDs in that range already exist in the DB (from prior runs), `ON CONFLICT DO NOTHING` will silently skip them. This is safe but can cause confusion in counts.

---

## Recommended Execution Strategy

### Per-Collection Generation Order

Generate in order of largest gap first (LA is hardest, do it last as a retry candidate):
1. Indiana (smallest gap, best warmup)
2. California State
3. Fremont, CA
4. Bloomington, IN
5. Los Angeles, CA (largest gap, ~53 questions)

### Step Sequence Per Collection

```
1. DRY RUN: npx tsx src/scripts/generateQuestions.ts --collection <slug> --target 105 --dry-run
   → Verify gap analysis is sane before spending API calls

2. GENERATE: npx tsx src/scripts/generateQuestions.ts --collection <slug> --target 105
   → Creates backend/generated-questions-<slug>-<timestamp>.json
   → Creates backend/generation-report-<slug>-<timestamp>.json

3. REVIEW REPORT: Check generation-report-*.json for:
   - accepted count vs target
   - skipped/duplicate counts
   - source diversity warnings

4. MERGE: Append generated questions to src/data/<collection>-questions.json
   (write a small script or do manually — see merge note below)

5. SEED: Run collection-appropriate seed command

6. VERIFY: Count active questions in DB for this collection
```

### Merge Approach

The merge is a simple array append. A small merge script should be written rather than doing it manually (less error prone). Pattern:
```typescript
// Read source JSON
const source = JSON.parse(readFileSync('src/data/bloomington-in-questions.json'));
// Read generated JSON
const generated = JSON.parse(readFileSync('backend/generated-questions-bloomington-in-<ts>.json'));
// Append (generated questions have fresh externalIds)
source.questions.push(...generated.questions);
// Write back
writeFileSync('src/data/bloomington-in-questions.json', JSON.stringify(source, null, 2));
```

### Seeding Commands

**For Bloomington, LA, Fremont:**
```bash
npm run db:seed:community
```
This is idempotent — safe to run after each merge. Seeds as `status='active'`.

**For Indiana, California:**
No existing script. Options:
- **Option A (cleanest):** Write a `seed-state-questions.ts` that mirrors `seed-community.ts` but reads from indiana/california JSON files and seeds as `active`
- **Option B:** Extend `seed-community.ts` `LOCALES` array to include `{ slug: 'indiana-state', file: 'indiana-state-questions.json' }` and `{ slug: 'california-state', file: 'california-state-questions.json' }`

Option B is simpler. The seed-community.ts logic already handles the general case.

### Model Upgrade

Before running generation, update line 276 in `generateQuestions.ts`:
```typescript
// Change from:
model: 'claude-sonnet-4-5-20250929',
// To:
model: 'claude-sonnet-4-6',
```

### Verification Query

After seeding each collection, verify active count:
```sql
SELECT c.slug, COUNT(*) as active_count
FROM civic_trivia.collection_questions cq
JOIN civic_trivia.collections c ON cq.collection_id = c.id
JOIN civic_trivia.questions q ON cq.question_id = q.id
WHERE q.status = 'active'
GROUP BY c.slug
ORDER BY c.slug;
```

Or use existing `verify-no-active-dups.ts` which prints active counts per collection.

---

## Risks and Gotchas

### Risk 1: JSON count vs DB active count divergence
**What:** `generateQuestions.ts` reads JSON file for gap analysis, but the real gap is measured in DB active questions. If JSON has more questions than DB active, the pipeline will generate fewer questions than needed to reach 90.
**Mitigation:** Before running, compare JSON count to DB active count. If divergent, either: (a) update the JSON to match DB active state by running export scripts, or (b) pass a higher `--target` to compensate.
**Confidence:** HIGH — this is confirmed by counting: e.g., Indiana JSON has 84 but DB has 68 active.

### Risk 2: Model name mismatch
**What:** Line 276 has `claude-sonnet-4-5-20250929`. If that model is deprecated or unavailable, generation will fail on first API call.
**Mitigation:** Update to `claude-sonnet-4-6` before running. Test with `--limit 1` first.
**Confidence:** HIGH — decision in CONTEXT.md explicitly calls this out.

### Risk 3: No seeding script for state collections
**What:** `seed-community.ts` does not include indiana-state or california-state. After merging new questions into the JSON, there is no ready-made command to seed them.
**Mitigation:** Write `seed-state-questions.ts` or extend `seed-community.ts` to include state slugs. This is a required piece of Phase 34.
**Confidence:** HIGH — confirmed by reading `seed-community.ts` LOCALES array.

### Risk 4: External ID collisions from prior generation tests
**What:** Phase 33 ran a live test that generated 2 questions for fremont-ca. Those may now be in the DB. If the counter re-generates the same ID range, `ON CONFLICT DO NOTHING` will silently skip them.
**Mitigation:** Check DB for any `fre-*` questions beyond the current JSON count before running. Use `verify-no-active-dups.ts` or a count query.
**Confidence:** MEDIUM — likely happened given Phase 33 live test, but may not affect all collections.

### Risk 5: Large LA gap (53+ questions) may hit source diversity limits
**What:** `generateQuestions.ts` warns on source diversity (15% cap per source). With 53 questions to generate for LA from a limited source pool, warnings are expected but don't block generation.
**Mitigation:** Accept diversity warnings, proceed. The pipeline handles this with soft warnings.
**Confidence:** HIGH — Phase 33 validation showed this warning pattern even for small runs.

### Risk 6: Rate limiting with large batches
**What:** 53 questions for LA = 53+ Claude API calls with 1-second delays = ~53+ minutes minimum. Plus retries and embedding calls.
**Mitigation:** Let it run. Each collection runs independently. No parallel execution needed.
**Confidence:** HIGH — serial design is intentional per Phase 33 decisions.

### Risk 7: seed-community.ts seeds as 'active' but the old generate-state-questions.ts seeds as 'draft'
**What:** If Indiana/California are seeded via `generate-state-questions.ts`, questions land as `draft` and don't go live. Phase 34 requires immediate activation.
**Mitigation:** Use the JSON merge + seed approach (reading from JSON files with `status='active'`), not `generate-state-questions.ts`.
**Confidence:** HIGH — confirmed by reading both scripts.

### Risk 8: Topics must exist in DB before questions can be seeded
**What:** Questions reference `topicId` (FK). If any topic slugs in the JSON don't exist in the `topics` table, seeding will fail.
**Mitigation:** `seed-community.ts` (and the pattern it follows) handles topic upsert before question insert. Any new seeding script must do the same.
**Confidence:** HIGH — all existing seed scripts follow this pattern.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/scripts/generateQuestions.ts` | Main generation pipeline — run this |
| `backend/src/data/bloomington-in-questions.json` | Source JSON (61 questions) |
| `backend/src/data/los-angeles-ca-questions.json` | Source JSON (52 questions) |
| `backend/src/data/fremont-ca-questions.json` | Source JSON (71 questions) |
| `backend/src/data/indiana-state-questions.json` | Source JSON (84 questions) |
| `backend/src/data/california-state-questions.json` | Source JSON (83 questions) |
| `backend/src/db/seed/seed-community.ts` | Seeding for Bloomington/LA/Fremont (status='active') |
| `backend/src/scripts/activate-collections.ts` | Activates draft questions by prefix pattern |
| `backend/src/scripts/verify-no-active-dups.ts` | Verification — prints active counts per collection |
| `backend/src/services/qualityRules/index.ts` | Quality audit engine |
| `backend/src/services/generation/GapAnalyzer.ts` | Gap analysis logic |
| `backend/src/services/embeddings/types.ts` | COLLECTION_HIERARCHY definition |

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `backend/src/scripts/generateQuestions.ts` (637 lines, complete read)
- Direct inspection of `backend/src/db/seed/seed-community.ts` (full read)
- Direct inspection of `backend/src/services/qualityRules/index.ts`, `rules/`, `scoring.ts` (full read)
- Direct inspection of `backend/src/services/generation/GapAnalyzer.ts`, `types.ts` (full read)
- Direct inspection of `backend/src/services/generation/CollectionHierarchy.ts` (full read)
- Direct inspection of `backend/src/services/embeddings/types.ts` (full read)
- Shell command: question counts from JSON files (node -e one-liner)
- `.planning/phases/33-generation-pipeline-enhancement/33-02-SUMMARY.md` (Phase 33 completion state)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions re: model upgrade, target 105, add-only seeding

---

## Metadata

**Confidence breakdown:**
- Pipeline mechanics: HIGH — full source read, no ambiguity
- JSON file structure: HIGH — directly inspected
- Seeding mechanism: HIGH — confirmed gap in state seeding path
- Quality rules: HIGH — all 5 rule files read, scoring confirmed
- Current question counts: HIGH — counted directly from files
- Risks: HIGH — derived from confirmed code gaps

**Research date:** 2026-02-23
**Valid until:** Stable — no fast-moving dependencies; valid until codebase changes

---

## RESEARCH COMPLETE

**Phase:** 34 - Scale to 90+ Questions
**Confidence:** HIGH

### Key Findings

- `generateQuestions.ts` outputs to `backend/` root (not `src/data/`), requires explicit merge step before seeding
- State collections (Indiana, California) have no ready-made seeding script for `status='active'`; `seed-community.ts` only covers 3 city collections — a new or extended seed script is required
- JSON file question counts are HIGHER than DB active counts for most collections (e.g., Indiana JSON=84 but DB active=68), which will cause under-generation if the target is not adjusted to account for the real DB gap
- Model needs upgrading from `claude-sonnet-4-5-20250929` to `claude-sonnet-4-6` (one line change in `generateQuestions.ts:276`)
- Quality gate is 4 blocking rules; URL check is skipped during generation (only quality/ambiguity/lookup/partisan rules run)

### File Created

`C:/Project Test/.planning/phases/34-scale-to-90-questions/34-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Pipeline mechanics | HIGH | Full source inspection of generateQuestions.ts |
| JSON file structure | HIGH | Direct file inspection + shell count |
| Seeding mechanism | HIGH | Both seed scripts fully read; gap confirmed |
| Quality rules | HIGH | All rule files and scoring.ts read |
| Current question counts | HIGH | Shell command on actual files |
| Risks | HIGH | Derived from confirmed code gaps and Phase 33 test results |

### Open Questions

1. **Which DB active count to trust?** The CONTEXT.md gap table (Indiana=68, CA=55, Bloomington=53, Fremont=54, LA=42) vs JSON file counts (Indiana=84, CA=83, Bloomington=61, Fremont=71, LA=52). The pipeline uses JSON count for gap analysis. A pre-flight DB query should be run to confirm current active counts and calibrate the `--target` parameter accordingly.

2. **Phase 33 test artifact in DB?** The live test generated 2 fremont-ca questions — are they in the DB? If yes, the counter in generateQuestions.ts may produce a conflicting ID. A quick DB query (`SELECT external_id FROM civic_trivia.questions WHERE external_id LIKE 'fre-%' ORDER BY external_id DESC LIMIT 5`) should be run before generating for Fremont.

### Ready for Planning

Research complete. Planner can now create PLAN.md files with confidence about exact scripts to run, the merge step, the seeding gap for state collections, and the model upgrade needed.
