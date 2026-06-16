---
phase: quick
plan: 022
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
---

<objective>
Investigate the codebase and produce a concise guide answering: "What would it take to make a new collection of questions?"

Purpose: Give the user a clear, actionable checklist of every touchpoint required to add a new collection -- from database rows to frontend assets -- so they can confidently scope the work next time.

Output: A printed guide (no files created/modified). The answer is the deliverable.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Produce the "New Collection" guide from codebase analysis</name>
  <files>(none -- output only)</files>
  <action>
Read the files listed below (most have already been analyzed during planning; re-read only to confirm specifics):

**Schema & ORM**
- `supabase/migrations/20260228000001_create_trivia_schema.sql` (canonical DDL)
- `backend/src/db/schema.ts` (Drizzle ORM definitions)

**Seed data**
- `backend/src/db/seed/collections.ts` (existing collection rows)
- `backend/src/db/seed/seed.ts` (how Federal collection is seeded)

**Content generation pipeline**
- `backend/src/scripts/content-generation/locale-configs/bloomington-in.ts` (LocaleConfig interface + example)
- `backend/src/scripts/content-generation/generate-locale-questions.ts` (CLI entrypoint)
- `backend/src/scripts/content-generation/utils/seed-questions.ts` (ensureLocaleTopics + seedQuestionBatch)

**Hierarchy / dedup**
- `backend/src/services/embeddings/types.ts` (COLLECTION_HIERARCHY map)
- `backend/src/services/generation/CollectionHierarchy.ts`

**Activation**
- `backend/src/scripts/activate-collections.ts`

**Frontend**
- `frontend/src/features/collections/types.ts` (CollectionSummary)
- `frontend/src/features/collections/hooks/useCollections.ts`
- `frontend/src/features/collections/components/CollectionCard.tsx`
- `frontend/public/images/collections/` (banner images, named `{slug}.jpg`)

**Game route**
- `backend/src/routes/game.ts` (GET /collections, MIN_QUESTION_THRESHOLD = 50)

Then produce a structured guide with:

1. **What a "collection" IS** -- the data model (collections table columns, junction tables, topics)
2. **Step-by-step checklist** to add a new collection, covering every touchpoint:
   - Add entry to `backend/src/db/seed/collections.ts` (all required fields)
   - Create a `LocaleConfig` file in `backend/src/scripts/content-generation/locale-configs/`
   - Register the config in the `--locale` switch inside `generate-locale-questions.ts`
   - Add the collection to `COLLECTION_HIERARCHY` in `backend/src/services/embeddings/types.ts` if dedup hierarchy applies
   - Add a banner image `frontend/public/images/collections/{slug}.jpg`
   - Run seed to insert the collection row
   - Run `generate-locale-questions.ts --locale {slug} --fetch-sources` to generate questions
   - Run activation script (or write a one-off) to set `is_active = true` and question `status = 'active'`
   - Verify: collection appears in GET /collections with >= 50 questions
3. **Existing tooling that "just works"** -- things you do NOT need to build:
   - Frontend auto-discovers active collections via API (no hardcoded list)
   - Question service is collection-scoped (no changes needed)
   - Seed utilities handle topic creation and collection-question linking
   - Duplicate detection respects collection hierarchy
   - CollectionCard renders any collection using themeColor + slug-based image
4. **Gaps / things that could be better:**
   - `COLLECTION_HIERARCHY` in embeddings/types.ts is a hardcoded map (not dynamic from DB)
   - `activate-collections.ts` uses hardcoded slugs (you need a new script or CLI flag per collection)
   - The `generate-locale-questions.ts` help text and locale switch must be updated manually
   - No admin UI to create collections (DB seed or raw SQL only)
   - `iconIdentifier` field on collections table is unused by the frontend (CollectionCard uses slug-based image path instead)

Print the guide directly to the user.
  </action>
  <verify>Guide is printed with all four sections. Cross-reference against the actual files to confirm accuracy.</verify>
  <done>User has a complete, accurate guide explaining every step and touchpoint for creating a new collection.</done>
</task>

</tasks>

<verification>
- Guide covers all 7+ touchpoints (seed data, locale config, registration, hierarchy, image, generation, activation)
- Guide identifies what already works automatically vs. what needs manual intervention
- Guide identifies concrete gaps in tooling
- All file paths referenced are real paths in the codebase
</verification>

<success_criteria>
User can read the guide and know exactly what files to touch, what scripts to run, and what gaps to work around when creating a new collection.
</success_criteria>

<output>
No SUMMARY needed -- this is a research/investigation quick plan. The printed guide IS the deliverable.
</output>
