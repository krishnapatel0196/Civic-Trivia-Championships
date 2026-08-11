# Quick Task 022: What Would It Take to Make a New Collection?

## Result

Produced a complete guide covering all touchpoints for creating a new collection of questions in Civic Trivia Championship.

---

# What Would It Take to Make a New Collection?

## 1. What a "Collection" IS

A **collection** is a named, themed set of civic trivia questions scoped to a locale (city, state, or national). It is the top-level entry point for gameplay — when a player picks a collection, the game draws questions exclusively from that set.

**The data model spans five tables:**

| Table | Role |
|---|---|
| `trivia.collections` | One row per collection. Holds all display metadata. |
| `trivia.topics` | Reusable topic slugs (e.g., `city-government`, `elections-voting`). One row per topic. |
| `trivia.collection_topics` | Junction: which topics belong to which collection. |
| `trivia.questions` | Individual questions, each linked to one topic. |
| `trivia.collection_questions` | Junction: which questions belong to which collection. |

**The `trivia.collections` row has these required columns:**

| Column | Type | Description |
|---|---|---|
| `name` | TEXT | Display name, e.g. `"Bloomington, IN"` |
| `slug` | TEXT UNIQUE | URL-safe key used everywhere, e.g. `bloomington-in` |
| `description` | TEXT | One-sentence tagline shown on the card |
| `locale_code` | TEXT | BCP-47 code, e.g. `en-US` or `en-GB` |
| `locale_name` | TEXT | Human-readable locale, e.g. `"Bloomington, Indiana"` |
| `icon_identifier` | TEXT | Stored but not currently used by frontend (see Gaps) |
| `theme_color` | TEXT | 7-char hex like `#1E3A8A` — background fallback behind banner image |
| `is_active` | BOOLEAN | `false` until you explicitly activate. Controls API visibility. |
| `sort_order` | INTEGER | Position in the collection list (lower = earlier) |

**Questions are seeded with `status = 'draft'` and must be explicitly set to `status = 'active'` before they count toward the 50-question minimum.**

---

## 2. Step-by-Step Checklist

Every step is required. There is no shortcut that skips the database row or the 50-question floor.

### Step 1 — Add the collection row to the seed file

File: `backend/src/db/seed/collections.ts`

Append a new entry to the `collectionsData` array:

```ts
{
  name: 'My City, ST',
  slug: 'my-city-st',           // must be globally unique, URL-safe
  description: 'One punchy sentence about the locale.',
  localeCode: 'en-US',
  localeName: 'My City, State',
  iconIdentifier: 'flag-st',    // stored but unused by frontend — pick any string
  themeColor: '#123456',        // hex used as image fallback background
  isActive: false,              // always start false; activate later
  sortOrder: 8,                 // next available number after existing entries
}
```

Then run the seed to insert the row:

```bash
cd backend
npx tsx src/db/seed/seed.ts
```

The seed uses `ON CONFLICT DO NOTHING` on `slug`, so re-running is safe. The collection row must exist in the database before any of the generation tooling can run.

---

### Step 2 — Create a LocaleConfig file

File: `backend/src/scripts/content-generation/locale-configs/my-city-st.ts`

Copy `bloomington-in.ts` as a template. The `LocaleConfig` interface requires:

```ts
export const myCityConfig: LocaleConfig = {
  locale: 'my-city-st',           // must match slug exactly
  name: 'My City, ST',
  externalIdPrefix: 'mcs',        // 3-char prefix; must be globally unique across all collections
  collectionSlug: 'my-city-st',   // must match slug exactly
  targetQuestions: 100,           // how many questions to aim for
  batchSize: 25,                  // questions per API call; 25 is proven safe
  overshootFactor: 1.2,           // optional; generate 20% more than target for curation headroom

  topicCategories: [
    { slug: 'city-government', name: 'City Government', description: '...' },
    // ... 6-8 topics covering the civic landscape of your locale
  ],

  topicDistribution: {
    'city-government': 20,
    // ... per-topic targets summing to ~targetQuestions
  },

  sourceUrls: [
    'https://www.mycity.gov',
    // ... authoritative pages the AI will use for factual grounding
  ],
};
```

**Important:** The `externalIdPrefix` must be unique across all existing collections. Current prefixes in use: `bli` (Bloomington), `lac` (Los Angeles), `fre` (Fremont), `nur` (Norwich), `ins` (Indiana State), `cas` (California State).

---

### Step 3 — Register the config in the generator's locale switch

File: `backend/src/scripts/content-generation/generate-locale-questions.ts`

**Edit 1 — Add to `supportedLocales` map:**

```ts
'my-city-st': () => import('./locale-configs/my-city-st.js'),
```

**Edit 2 — Add to the `configKeys` array:**

```ts
const configKeys = [..., 'myCityConfig'];
```

**Edit 3 — Update the `--help` text** so the `Supported:` list is accurate for future operators.

---

### Step 4 — Add to COLLECTION_HIERARCHY (dedup)

File: `backend/src/services/embeddings/types.ts`

```ts
export const COLLECTION_HIERARCHY: Record<string, CollectionTier> = {
  // ... existing entries ...
  'My City, ST': 'city',   // use the display name (not slug)
};
```

Note: the map keys are **display names** from `collections.name`, not slugs.

---

### Step 5 — Add a banner image

File: `frontend/public/images/collections/my-city-st.jpg`

The `CollectionCard` loads `/images/collections/{slug}.jpg`. If missing, the `themeColor` fallback is used — graceful, no error. Recommended: landscape ~400×224px (2:1 ratio).

---

### Step 6 — Generate questions

```bash
cd backend

# Fetch authoritative sources and generate all batches
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale my-city-st \
  --fetch-sources

# Dry-run a single batch to preview
npx tsx src/scripts/content-generation/generate-locale-questions.ts \
  --locale my-city-st \
  --batch 1 \
  --dry-run
```

Questions are seeded with `status = 'draft'` — invisible to players until activated.

Requires: `ANTHROPIC_API_KEY` and `DATABASE_URL` in `backend/.env`.

---

### Step 7 — Activate the collection

Write a one-off activation script or use Supabase SQL:

```sql
UPDATE trivia.collections SET is_active = true WHERE slug = 'my-city-st';
UPDATE trivia.questions SET status = 'active'
  WHERE external_id LIKE 'mcs-%' AND status = 'draft';
```

---

### Step 8 — Verify

```bash
curl https://civic-trivia-backend.onrender.com/api/game/collections | jq '.collections[] | {name, slug, questionCount}'
```

The collection appears only when `is_active = true` AND `questionCount >= 50` (the `MIN_QUESTION_THRESHOLD` in `game.ts`). If below 50, it is silently excluded — run more generation batches.

---

## 3. What Already Works Automatically

- **Frontend collection discovery** — `useCollections` hook is fully dynamic; no hardcoded list.
- **CollectionCard rendering** — renders any collection by slug; no code changes needed.
- **Question service scoping** — `selectQuestionsForGame(collectionId, ...)` is parameterized.
- **Adaptive game mode** — `easy-steps` mode works for any collectionId.
- **Topic creation and linking** — `ensureLocaleTopics()` idempotently creates topics and `collection_topics` rows.
- **Question-to-collection linking** — `seedQuestionBatch()` inserts `collection_questions` automatically.
- **Quality validation with retry** — up to 3 retries per failing question before seeding.
- **RLS / permissions** — Supabase RLS already allows public read; new collections are readable immediately.

---

## 4. Gaps / Things That Could Be Better

| Gap | File | Issue |
|---|---|---|
| `COLLECTION_HIERARCHY` is hardcoded | `services/embeddings/types.ts` | Uses display names as keys; fragile to renames; requires code edit + redeploy |
| `activate-collections.ts` hardcodes slugs | `scripts/activate-collections.ts` | No `--slug` flag; every new collection needs a new one-off script |
| Generator locale switch is manual | `generate-locale-questions.ts` | No auto-discovery; requires 2 code edits + rebuild |
| No admin UI for collection management | — | Non-developer admins cannot create/activate collections |
| `iconIdentifier` is dead weight | `collections` table | NOT NULL but frontend never reads it; `{slug}.jpg` is used instead |
| State configs not in generator switch | `locale-configs/state-configs/` | State collections generated via a separate (undocumented) workflow |

---

## Summary Table

| Step | File(s) | Automated? |
|---|---|---|
| 1. Add collection row | `seed/collections.ts` + `npm run db:seed` | Manual code edit |
| 2. Create LocaleConfig | `locale-configs/my-city-st.ts` | Manual (copy template) |
| 3. Register in generator | `generate-locale-questions.ts` (2 locations) | Manual code edit |
| 4. Add to hierarchy map | `services/embeddings/types.ts` | Manual code edit |
| 5. Add banner image | `frontend/public/images/collections/{slug}.jpg` | Manual asset |
| 6. Generate questions | `generate-locale-questions.ts --locale ... --fetch-sources` | Automated once registered |
| 7. Activate | One-off script or raw SQL | Manual |
| 8. Verify | `GET /api/game/collections` | Automated |
| Frontend display | — | Fully automatic |
| Topic/junction creation | — | Fully automatic |
| Duplicate detection | — | Fully automatic |

**Total manual work:** 1 new config file, 3 small edits to existing files, 1 image asset, 2 CLI runs (generate + activate).
