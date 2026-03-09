# Collection Playbook

**Version:** 1.0 (bootstrapped Phase 57, 2026-03-09)
**Scope:** City and state collections for Civic Trivia Championship

This is a living document. After each collection phase, append a completed retrospective using the Retrospective Template at the end of this file.

---

## 1. The Standard Workflow

Every collection follows this 7-step process:

1. **Scaffold** — `npx tsx src/scripts/scaffold-collection.ts --name "City, ST" --slug city-st --prefix xyz --theme "#RRGGBB" --description "Punchy tagline here!"`
   - Automates: seed entry, locale config file, generator registration, COLLECTION_HIERARCHY entry
2. **Seed** — `npx tsx src/db/seed/seed.ts`
3. **Edit locale config** — Fill in topics, topic distribution, source URLs, voice guidance. Replace the generic tagline placeholder.
4. **Generate** — `npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale city-st --fetch-sources`
   - As of Phase 57: semantic dedup runs automatically after generation. No separate scan-duplicates.ts pass needed.
5. **Add banner image** — `frontend/public/images/collections/{slug}.jpg`
   - City: iconic local landmark. State: state capitol building (hard rule, no exceptions).
6. **Review/curate** — Review draft questions in admin panel. Archive weak or off-topic questions.
7. **Audit and activate** — `npx tsx src/scripts/audit-collection-readiness.ts --slug city-st --prefix xyz` then `npx tsx src/scripts/activate-collection.ts --slug city-st --prefix xyz`
   - As of Phase 57: audit warns if expiring-question ratio < 15%.

---

## 2. Known Bugs and Workarounds

### Scaffold Bug 2 (active as of Phase 57)

**Symptom:** After running `scaffold-collection.ts`, `generate-locale-questions.ts` is corrupted — a `step3` string is inserted into a TypeScript type annotation line.

**Cause:** The scaffold script incorrectly injects a registration line into the wrong location in generate-locale-questions.ts.

**Workaround:**
1. Run `git diff backend/src/scripts/content-generation/generate-locale-questions.ts` after scaffolding
2. If the file is modified, revert it: `git checkout backend/src/scripts/content-generation/generate-locale-questions.ts`
3. State collections are auto-discovered from `locale-configs/state-configs/{locale}.ts` — no manual registration in generate-locale-questions.ts is needed for state locales

**Status:** Not fixed in v2.0. Fix is backlog.

---

## 3. Content Patterns

### Mixed-Durability Pattern (established Phase 52 — Texas State)

Apply to every collection:
- **Expiring questions (target 15–30%):** Questions about current officeholders (mayor, city council, state legislature leadership, governor, commissioners) should have `expiresAt` set. Use a date 2–4 years in the future based on the official's term.
- **Durable questions:** Questions about civic structure, history, geography, laws, and institutions should have `expiresAt: null`.
- The 15% floor is now enforced as a warning by `audit-collection-readiness.ts`.

### Voice Guidance

Every locale config must include:
- **Accuracy notes:** What sources to trust, known inaccuracies to avoid
- **What to avoid:** Specific topics that generate wrong/misleading questions
- **Expiration date guidance:** How to set expiresAt for elected officials in this jurisdiction

### Expiring Question Examples by Role

| Role | Typical term | expiresAt guidance |
|------|-------------|-------------------|
| Mayor | 2–4 years | Set to end of known term |
| City council member | 2–4 years | Set to end of known term |
| State governor | 4 years | Set to end of known term |
| State legislature leadership | 2 years | Set 2 years from generation date |
| County commissioner | 4 years | Set to end of known term |

---

## 4. Quality Conventions

- **Tagline:** Every collection needs a distinctive one-liner — never ship the generic "Test your X civic knowledge!" placeholder. Style: rhetorical question or punchy stakes using a local nickname or fact.
- **Banner image:** City collections = iconic local landmark. State collections = state capitol building (hard rule).
- **No addresses or phones in answer options:** Quality rule enforced in both city and state generation prompts. The advisory quality rule in the rules engine catches stragglers.
- **State collections:** State-only curation rule — no city or regional landmark questions in the final set. State capitol questions are encouraged but must be about the capitol as a civic institution, not as a tourist landmark.
- **Minimum question count:** 70 for smaller cities, 80+ for larger cities and states. Checked by `audit-collection-readiness.ts` (net count >= 50 is the hard floor; target is higher).

---

## 5. Near-Duplicate Detection Gap (Resolved in Phase 57)

**Historical context (v1.9, Phases 47–52):** After each collection was generated, a separate manual pass was required using `scan-duplicates.ts` to find semantic near-duplicates. This was error-prone and easy to forget.

**Resolution (Phase 57):** `generate-locale-questions.ts` now runs within-collection semantic dedup automatically after all batches are seeded. The step:
- Requires `OPENAI_API_KEY` in environment (skips gracefully with a warning if not set)
- Scoped to within-collection only (cross-collection dedup remains the job of `scan-duplicates.ts`)
- Auto-archives the non-keep member of each near-duplicate cluster (>0.85 cosine similarity)
- Logs every archive action with externalId, score, cluster ID, and kept question ID

**Cross-collection dedup:** Still requires a periodic manual run of `scan-duplicates.ts`. This is intentional — cross-collection dedup is a separate concern from within-collection quality.

---

## 6. Retrospective Template

Copy this template and fill it in at the end of each collection phase. Append to this file under a new `## Retrospective:` heading.

```markdown
## Retrospective: {Collection Name} (Phase {N}, {Date})

### What went well
-

### What broke or was harder than expected
-

### Bugs encountered
-

### Carry-forward rules (new conventions for future collections)
-

### Final stats
- Questions generated:
- Questions after curation:
- Expiring question ratio:
- Generation cost: $
- Time to activate:
```

---

*Append retrospectives below this line as new `## Retrospective:` sections.*

---
