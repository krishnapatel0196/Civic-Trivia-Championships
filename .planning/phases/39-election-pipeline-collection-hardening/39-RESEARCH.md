# Phase 39: Election Pipeline Collection Hardening - Research

**Researched:** 2026-02-26
**Domain:** Backend Express routes (admin.ts), Frontend React page (ElectionsPage.tsx)
**Confidence:** HIGH — all findings are from direct codebase inspection

---

## Summary

This phase closes three specific, discrete operational risks in the election pipeline identified by the v1.7 audit. All three gaps were verified by reading the actual source files. The research is purely codebase archaeology — no external library research is needed. The work is surgical: add one endpoint, add one DB validation, and add one optional body parameter.

**Gap 1 — Jurisdiction dropdown uses game/collections (has 50-question floor).**
`ElectionsPage.tsx` line 107 fetches `${API_URL}/api/game/collections`. The game route (`routes/game.ts` line 91) filters out any collection with fewer than 50 active questions. A newly created jurisdiction collection (e.g., 0 questions yet) will never appear in the dropdown. The admin route only has `GET /collections/health` — a stats endpoint, not a list endpoint usable for dropdowns. The fix is to add `GET /api/admin/collections` that returns all collections without a floor.

**Gap 2 — POST /election-races accepts any jurisdiction string, no DB validation.**
`routes/admin.ts` line 1506 — the `createElectionRaceSchema` Zod schema validates only that `jurisdiction` is a non-empty string (max 200 chars). There is no subsequent DB lookup to confirm this name matches any `collections.name`. A typo ("Bloomignton, IN" instead of "Bloomington, IN") is silently stored. When `/regenerate` later tries to resolve the slug via `eq(collections.name, race.jurisdiction)`, it returns 400 "No collection found matching jurisdiction." The fix is to add a DB lookup after schema validation in `POST /election-races`.

**Gap 3 — POST /election-races/:id/regenerate resolves slug only from jurisdiction name.**
`routes/admin.ts` line 1675-1686 — the regenerate handler performs `WHERE collections.name = race.jurisdiction`. If the collection was renamed after the race was created, or if there is a case/spacing mismatch, the lookup fails with a generic 400. The frontend (`handleRegenConfirm`, line 391-397) sends no body to `/regenerate` at all. The fix is to accept an optional `collectionSlug` in the POST body; when present, use it directly instead of the name-based lookup.

**Primary recommendation:** Three isolated backend changes + one frontend change, each self-contained. No new tables, no migrations, no service layer changes. All work goes into `routes/admin.ts` and `ElectionsPage.tsx`.

---

## Standard Stack

This phase uses only what already exists in the project — no new libraries.

### Core (already installed)
| Component | Location | Purpose |
|-----------|----------|---------|
| Express Router | `backend/src/routes/admin.ts` | All admin endpoints live here |
| Drizzle ORM | `backend/src/db/` | DB queries — `collections` table already imported |
| Zod | `backend/src/routes/admin.ts` (top imports) | Schema validation — `z` already imported |
| React + fetch | `frontend/src/pages/admin/ElectionsPage.tsx` | Frontend data fetching |
| `authenticateToken + requireAdmin` middleware | Applied via `router.use()` at top of admin.ts | Auth — inherited automatically by any new route in admin.ts |

### No new dependencies needed
All three fixes use existing imports. The `collections` table is already imported in `admin.ts` line 4. The `eq` drizzle operator is already imported. Zod's `z` is already imported.

---

## Architecture Patterns

### How admin routes work

Admin router is mounted at `/api/admin` in `server.ts` line 71:
```typescript
app.use('/api/admin', adminRouter);
```

All routes in `routes/admin.ts` inherit auth via:
```typescript
// Line 18-19 in admin.ts
router.use(authenticateToken, requireAdmin);
```

So any new `router.get('/collections', ...)` added to `admin.ts` automatically becomes `GET /api/admin/collections` with admin auth enforced. No additional auth setup required.

### Existing admin collections endpoint pattern

The existing `GET /collections/health` (admin.ts line 634) shows the pattern for a collections query without the 50-question floor:

```typescript
router.get('/collections/health', async (req: Request, res: Response) => {
  const results = await db
    .select({ id: collections.id, name: collections.name, slug: collections.slug, ... })
    .from(collections)
    // NO question count filter — returns all collections
    .groupBy(collections.id)
    .orderBy(collections.sortOrder);
  res.json({ collections: collectionsData });
});
```

The new `GET /collections` endpoint should follow the same pattern but return a simpler payload (just `id`, `name`, `slug` — what the dropdown needs).

### IMPORTANT: Route ordering matters in Express

The admin.ts file registers `GET /collections/health` (specific) before any `GET /collections` (generic). The new `GET /collections` must be registered EITHER before `/collections/health` (which would match first, but won't because Express uses exact-match for paths without params) or after — actually, since `/collections/health` and `/collections` are different paths with no param collision, ordering doesn't matter here. But as a precaution, register the new `GET /collections` route BEFORE `GET /collections/health` to be explicit about intent.

Contrast this with the election-races pattern where `/election-races/classified` must be registered BEFORE `/election-races/:id` (comment on line 1405-1406) because `:id` would match the string "classified". The collections case has no `:id` param, so no ordering conflict exists.

### Existing POST /election-races pattern

```typescript
// admin.ts lines 1490-1528 (current state)
const createElectionRaceSchema = z.object({
  seat: z.string().min(1).max(200),
  electionType: z.enum(['primary', 'general', 'runoff', 'by-election']),
  electionDate: z.string().datetime({ offset: true }),
  timezone: z.string().min(1),
  jurisdiction: z.string().min(1).max(200),  // ← ONLY format validation, no DB check
  candidates: z.array(...).default([]),
});

router.post('/election-races', async (req: Request, res: Response) => {
  const parsed = createElectionRaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { seat, electionType, electionDate, timezone, jurisdiction, candidates } = parsed.data;
  const [created] = await db.insert(electionRaces).values({ ... }).returning();
  return res.status(201).json({ race: created });
});
```

The fix inserts a DB lookup between schema validation and the insert:

```typescript
// After schema parse, before insert:
const [matchedCollection] = await db
  .select({ id: collections.id })
  .from(collections)
  .where(eq(collections.name, jurisdiction))
  .limit(1);

if (!matchedCollection) {
  return res.status(400).json({
    error: `No collection found matching jurisdiction "${jurisdiction}". Create the collection first.`
  });
}
```

### Existing regenerate endpoint — slug resolution logic

```typescript
// admin.ts lines 1675-1686 (current state)
// 2. Resolve collection slug from jurisdiction name
const [collectionRow] = await db
  .select({ slug: collections.slug })
  .from(collections)
  .where(eq(collections.name, race.jurisdiction))  // ← ONLY by name
  .limit(1);

if (!collectionRow) {
  return res.status(400).json({ error: 'No collection found matching jurisdiction.' });
}
const collectionSlug = collectionRow.slug;
```

The fix adds an optional `collectionSlug` body param that short-circuits the name lookup:

```typescript
router.post('/election-races/:id/regenerate', async (req: Request, res: Response) => {
  // ...
  const { collectionSlug: overrideSlug } = req.body ?? {};  // optional

  let collectionSlug: string;
  if (overrideSlug && typeof overrideSlug === 'string' && overrideSlug.trim()) {
    // Override: use slug directly, still verify it exists
    const [collectionRow] = await db
      .select({ slug: collections.slug })
      .from(collections)
      .where(eq(collections.slug, overrideSlug.trim()))
      .limit(1);
    if (!collectionRow) {
      return res.status(400).json({ error: `No collection found with slug "${overrideSlug}".` });
    }
    collectionSlug = collectionRow.slug;
  } else {
    // Fallback: existing name-based lookup
    const [collectionRow] = await db
      .select({ slug: collections.slug })
      .from(collections)
      .where(eq(collections.name, race.jurisdiction))
      .limit(1);
    if (!collectionRow) {
      return res.status(400).json({ error: 'No collection found matching jurisdiction.' });
    }
    collectionSlug = collectionRow.slug;
  }
```

### Frontend fetch pattern

The `ElectionsPage.tsx` collections fetch (lines 104-111):

```typescript
// CURRENT (broken for admin use case):
const [collections, setCollections] = useState<{ id: number; name: string; slug: string }[]>([]);
useEffect(() => {
  fetch(`${API_URL}/api/game/collections`)  // ← Uses game endpoint with 50-question floor
    .then(r => r.json())
    .then(data => setCollections(data.collections ?? data ?? []))
    .catch(() => {});
}, []);
```

The fix changes the fetch URL and adds auth header:

```typescript
useEffect(() => {
  if (!accessToken) return;
  fetch(`${API_URL}/api/admin/collections`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(r => r.json())
    .then(data => setCollections(data.collections ?? []))
    .catch(() => {});
}, [accessToken]);
```

Note: `accessToken` is already available in `ElectionsPage` from `useAuthStore()` (line 88). The dependency array should include `accessToken`.

---

## Collections Table Schema

From `backend/src/db/schema.ts`:

```typescript
export const collections = civicTriviaSchema.table('collections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),        // Used as jurisdiction identifier in election_races
  slug: text('slug').notNull().unique(), // Used by generateElectionQuestions()
  description: text('description').notNull(),
  localeCode: text('locale_code').notNull(),
  localeName: text('locale_name').notNull(),
  iconIdentifier: text('icon_identifier').notNull(),
  themeColor: text('theme_color').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
```

Key points:
- `name` is what gets stored as `election_races.jurisdiction` (the dropdown sets `value={c.name}`)
- `slug` is what `generateElectionQuestions()` takes as its parameter
- `isActive` does NOT need to be checked for the admin dropdown — an inactive collection can still be used for election questions (this is the whole point of the 50-question floor removal)
- There is NO unique constraint on `name` (only slug is unique). This means in theory two collections could have the same name — the DB lookup uses `.limit(1)` which is safe.

---

## What Each Success Criterion Requires

### SC1: ElectionsPage dropdown uses admin collections endpoint
**What to build:**
1. Backend: Add `router.get('/collections', ...)` to `admin.ts` — returns `{ collections: [{ id, name, slug }] }` for ALL collections (no floor, no isActive filter — admin sees everything)
2. Frontend: Change fetch URL from `/api/game/collections` to `/api/admin/collections` and add `Authorization` header

**Files changed:**
- `backend/src/routes/admin.ts` — add route
- `frontend/src/pages/admin/ElectionsPage.tsx` — change fetch URL + add auth header

**Test:** Create a new collection with 0 questions. It should appear in the dropdown. Under the old code, it would not.

### SC2: POST /election-races validates jurisdiction against DB
**What to build:**
1. Backend: In the `POST /election-races` handler (after Zod parse, before insert), query `collections` by `name = jurisdiction`. Return 400 with descriptive error if no match.

**Files changed:**
- `backend/src/routes/admin.ts` — modify existing POST handler

**Test:** POST with `jurisdiction: "Nonexistent Place"` must return 400. POST with a real `collections.name` must return 201.

**Implication for frontend:** When SC1 is working (dropdown populated from DB), users can only pick a `c.name` from the dropdown. This means SC2 is effectively guaranteed by the UI — but the backend validation is still needed for API robustness (direct API calls, cron-created races, future scripts).

### SC3: POST /election-races/:id/regenerate accepts optional collectionSlug override
**What to build:**
1. Backend: Read `req.body.collectionSlug` (optional). If present and non-empty, resolve by slug instead of by `collections.name = race.jurisdiction`. Still verify the slug exists.
2. Frontend: The confirm modal currently sends no body. Optionally expose a collection override input in the regen modal — OR leave the frontend unchanged and document that the override is an API-level capability. The success criterion says "a renamed collection can be regenerated by passing the current slug" — this implies an admin knowing to pass it, so a UI enhancement is optional but nice.

**Files changed:**
- `backend/src/routes/admin.ts` — modify existing regenerate handler (lines 1657-1757)
- Optionally: `frontend/src/pages/admin/ElectionsPage.tsx` — add collection slug input to regen modal

**Frontend consideration:** The regen confirm modal currently shows only "X active questions will be archived" and a Confirm button. To expose the `collectionSlug` override, the modal could show a pre-filled slug input (defaulting to the name-based lookup result) that an admin can override. This matches the existing pattern of the "Generate Questions" modal which already has a collection selector.

---

## What Already Exists (Do NOT Build)

| Thing | Status | Where |
|-------|--------|-------|
| `GET /api/admin/collections/health` | EXISTS | admin.ts line 634 |
| `GET /api/game/collections` | EXISTS (with 50-question floor) | game.ts line 54 |
| `POST /api/admin/election-races` | EXISTS (no jurisdiction validation) | admin.ts line 1506 |
| `POST /api/admin/election-races/:id/regenerate` | EXISTS (name-only lookup) | admin.ts line 1657 |
| `authenticateToken + requireAdmin` middleware | EXISTS, applied globally in admin.ts | middleware/auth.ts |
| `collections` table import in admin.ts | EXISTS | admin.ts line 4 |
| `eq` drizzle operator import | EXISTS | admin.ts line 5 |
| `z` (Zod) import | EXISTS | admin.ts line 8 |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Auth enforcement on new `/collections` route | Custom auth checks | Nothing — `router.use(authenticateToken, requireAdmin)` at top of admin.ts covers all routes in the file automatically |
| Slug/name lookup | Custom caching layer | Drizzle `.limit(1)` query — same pattern as line 1675-1686 |
| Frontend auth headers | Token extraction utilities | `useAuthStore().accessToken` already available in ElectionsPage |

---

## Common Pitfalls

### Pitfall 1: isActive filter on new admin collections endpoint
**What goes wrong:** Filtering by `isActive = true` in the new `/admin/collections` endpoint would reproduce the same problem as the game endpoint — a new collection (isActive might be false until manually activated) won't appear.
**Why it happens:** The developer copies the game endpoint logic.
**How to avoid:** The new admin endpoint should NOT filter by `isActive`. Return all collections regardless of activation status.
**Warning signs:** Test with a collection that has `is_active = false` — it should appear in the dropdown.

### Pitfall 2: Adding jurisdiction validation but forgetting the name is case-sensitive
**What goes wrong:** `eq(collections.name, jurisdiction)` is case-sensitive in PostgreSQL. If the collection name is "Bloomington, IN" but the user typed "bloomington, in" via a text input, it won't match.
**Why it happens:** SQL equality is case-sensitive for `text` columns.
**How to avoid:** Since SC1 ensures the dropdown populates from the DB, the user selects the exact name — case mismatch is prevented by the UI. For SC2's backend validation, using `eq` (exact match) is correct. The combination of SC1 + SC2 prevents the mismatch at the UI level.
**Warning signs:** If the frontend ever allows free-text input for jurisdiction (the fallback `<input>` when `collections.length === 0`), the validation can fail.

### Pitfall 3: collectionSlug override not verifying the slug exists
**What goes wrong:** The override path skips the slug existence check, so passing a bogus slug would reach `generateElectionQuestions()` which would throw "Collection not found" — a 500 error instead of a graceful 400.
**How to avoid:** Always verify the slug exists even in the override path (see code example above). `generateElectionQuestions()` already throws on missing slug, but the handler should catch this at the route level for a clean 400 response.

### Pitfall 4: Frontend regen modal sends no body — collectionSlug override silently ignored
**What goes wrong:** If the backend accepts `collectionSlug` from body but the frontend never sends it, the override feature exists but is invisible to admins who need it.
**How to avoid:** At minimum, the success criterion ("a renamed collection can be regenerated by passing the current slug") is an API-level guarantee — it can be tested via curl/Postman. If a UI for it is desired, the regen modal needs a collection selector similar to the "Generate Questions" modal.

---

## Code Examples

### New GET /admin/collections endpoint
```typescript
// Source: Codebase pattern from admin.ts (collections/health endpoint + game.ts collections endpoint)
// Add this BEFORE the GET /collections/health route in admin.ts

/**
 * GET /collections - List all collections (no question-count floor)
 * Used by ElectionsPage jurisdiction dropdown and any admin UI needing full collection list.
 * Returns ALL collections regardless of isActive status or question count.
 */
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        isActive: collections.isActive,
      })
      .from(collections)
      .orderBy(collections.sortOrder);

    res.json({ collections: result });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections', detail: error?.message || String(error) });
  }
});
```

### POST /election-races jurisdiction validation insert
```typescript
// Source: Codebase (admin.ts POST /election-races, lines 1506-1529)
// Insert after: `const { seat, electionType, ... } = parsed.data;`
// Insert before: `const [created] = await db.insert(electionRaces)...`

// Validate jurisdiction matches an existing collection name
const [matchedCollection] = await db
  .select({ id: collections.id })
  .from(collections)
  .where(eq(collections.name, jurisdiction))
  .limit(1);

if (!matchedCollection) {
  return res.status(400).json({
    error: `No collection found with name "${jurisdiction}". The jurisdiction must match a collection name exactly.`,
  });
}
```

### POST /election-races/:id/regenerate with optional collectionSlug override
```typescript
// Source: Codebase (admin.ts POST /election-races/:id/regenerate, current lines 1675-1686)
// Replace the existing "2. Resolve collection slug" block:

// 2. Resolve collection slug — use override if provided, else fall back to name lookup
const overrideSlug = typeof req.body?.collectionSlug === 'string' ? req.body.collectionSlug.trim() : '';

let collectionSlug: string;

if (overrideSlug) {
  // Override path: resolve by slug directly
  const [collectionBySlug] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.slug, overrideSlug))
    .limit(1);

  if (!collectionBySlug) {
    return res.status(400).json({ error: `No collection found with slug "${overrideSlug}".` });
  }
  collectionSlug = collectionBySlug.slug;
} else {
  // Default path: resolve by jurisdiction name (existing behavior)
  const [collectionByName] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.name, race.jurisdiction))
    .limit(1);

  if (!collectionByName) {
    return res.status(400).json({ error: 'No collection found matching jurisdiction.' });
  }
  collectionSlug = collectionByName.slug;
}
```

### Frontend fetch change in ElectionsPage.tsx
```typescript
// Source: Codebase (ElectionsPage.tsx, lines 104-111)
// Replace the existing useEffect:

useEffect(() => {
  if (!accessToken) return;
  fetch(`${API_URL}/api/admin/collections`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(r => r.json())
    .then(data => setCollections(data.collections ?? []))
    .catch(() => {});
}, [accessToken]);
```

---

## State of the Art

This is all internal-stack work. No state-of-the-art considerations — use the same Drizzle/Express/React patterns already established in the codebase.

---

## Open Questions

### 1. Should the regen modal expose a collection override in the UI?
- **What we know:** SC3 says "a renamed collection can be regenerated by passing the current slug" — this language implies an API-level capability, not necessarily a UI one.
- **What's unclear:** Whether the planner wants a UI field added to the regen confirmation modal.
- **Recommendation:** Implement backend first (required). Add a UI override selector to the regen modal as an enhancement — it parallels the existing "Generate Questions" collection prompt modal (lines 904-955) and uses the same `collections` state.

### 2. Should POST /election-races also validate on update (PUT)?
- **What we know:** The `PUT /election-races/:id` endpoint (lines 1764-1809) also accepts `jurisdiction` updates. Currently no DB validation there either.
- **What's unclear:** Whether audit issue #2 covers PUT as well as POST.
- **Recommendation:** The phase description says "backend validates jurisdiction on race creation" — specifically mentions creation, not update. Limit scope to POST only for this phase. Note it as a potential follow-up.

---

## Sources

### Primary (HIGH confidence)
- Direct read of `backend/src/routes/admin.ts` — confirmed all admin route registrations, collections/health endpoint, POST /election-races handler, POST /election-races/:id/regenerate handler
- Direct read of `backend/src/routes/game.ts` — confirmed MIN_QUESTION_THRESHOLD = 50 constant and filter logic at lines 15-16 and 91
- Direct read of `frontend/src/pages/admin/ElectionsPage.tsx` — confirmed game/collections fetch (line 107), jurisdiction dropdown rendering (lines 554-575, 1098-1118), regen confirm sends no body (lines 387-416)
- Direct read of `backend/src/db/schema.ts` — confirmed collections table fields (name, slug, isActive, sortOrder)
- Direct read of `backend/src/services/generation/ElectionQuestionGenerator.ts` — confirmed `generateElectionQuestions()` takes `collectionSlug` param and resolves by slug (not name)
- Direct read of `backend/src/middleware/auth.ts` — confirmed `authenticateToken` and `requireAdmin` middleware pattern

---

## Metadata

**Confidence breakdown:**
- Gap identification: HIGH — read the exact lines in question
- Fix approach: HIGH — same patterns used throughout the file
- Code examples: HIGH — adapted from adjacent existing code in the same file
- Route ordering concern: HIGH — verified by reading the classified/id route ordering comment in admin.ts line 1405-1406

**Research date:** 2026-02-26
**Valid until:** Until admin.ts or ElectionsPage.tsx changes significantly (stable for 90+ days given the scope)
