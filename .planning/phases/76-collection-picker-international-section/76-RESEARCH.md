# Phase 76: Collection Picker International Section - Research

**Researched:** 2026-04-08
**Domain:** React UI extension + Drizzle ORM backend query
**Confidence:** HIGH

## Summary

Phase 76 adds an "International" section to the player-facing `CollectionPicker` component and surfaces a freshness timestamp ("Updated 3h ago" / "Updated Apr 9") on each International collection card. The research is grounded entirely in the existing codebase — no external libraries are needed.

The `CollectionSummary.tier` union already includes `'international'` (landed in Phase 75-02). The `CollectionPicker` currently groups into `local | state | federal` using a typed constant array. Adding `international` requires: (1) extending that array, (2) updating the `getCategory` function, (3) adding the section header, and (4) adding a freshness indicator field to the API response and frontend type.

For freshness formatting, the codebase already has two hand-rolled helpers that cover exactly this spec: `formatRelativeTime` in `ElectionsPage.tsx` (minutes/hours/days relative) and a date function in `Profile.tsx` using `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })`. A single shared utility combining the two behaviors (< 24h: relative; >= 24h: calendar date) should be extracted to `frontend/src/utils/formatFreshness.ts`.

**Primary recommendation:** Extend the existing `CollectionPicker` grouping array, add `latestQuestionAt` to `CollectionSummary`, compute it via `MAX(questions.created_at)` in the `/api/game/collections` query, and write a `formatFreshness` utility that handles both the relative and calendar branches.

## Standard Stack

This phase is pure internal extension — no new npm packages required.

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.2.0 | UI components | Project baseline |
| TypeScript | ^5.3.3 | Type safety | Project baseline |
| Drizzle ORM | in backend | SQL query builder | Existing DB layer |

### New Code (zero new dependencies)
| Utility | Location | Purpose |
|---------|----------|---------|
| `formatFreshness(isoString)` | `frontend/src/utils/formatFreshness.ts` | < 24h → relative ("3h ago"); >= 24h → "Apr 9" |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `formatFreshness` | `date-fns` (not installed) | date-fns is more complete but adds a dependency; the two-branch spec is simple enough for ~10 lines of native JS |
| New API field `latestQuestionAt` on `CollectionSummary` | Separate `/api/game/collections/:id/freshness` endpoint | New field on existing query is simpler; a separate endpoint adds a round-trip per card |

**Installation:** None required.

## Architecture Patterns

### Recommended File Changes
```
frontend/src/features/collections/
├── types.ts                     # Add latestQuestionAt?: string | null
├── components/
│   ├── CollectionPicker.tsx     # Extend grouping array + section header
│   └── CollectionCard.tsx       # Render freshness indicator for international tier

frontend/src/utils/
└── formatFreshness.ts           # New shared utility

backend/src/routes/
└── game.ts                      # Add MAX(q.created_at) to /collections query
```

### Pattern 1: Extending the Grouping Array

The current `CollectionPicker` uses:
```typescript
// Source: frontend/src/features/collections/components/CollectionPicker.tsx
const grouped = (['local', 'state', 'federal'] as const)
  .map((category) => ({
    category,
    label: GROUP_LABELS[category],
    collections: collections
      .filter((c) => getCategory(c) === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .filter((g) => g.collections.length > 0);
```

Extend by:
1. Adding `'international'` to the `as const` array (after `'federal'`) — order = Local → State → Federal → International
2. Adding `international: 'International'` to `GROUP_LABELS`
3. Updating `getCategory` to return `'international'` when `collection.tier === 'international'`

The `.filter((g) => g.collections.length > 0)` already handles the "hide when empty" requirement — no extra logic needed.

### Pattern 2: Section Header — match existing style exactly

Current section headers use:
```typescript
// Source: frontend/src/features/collections/components/CollectionPicker.tsx (line 121-131)
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
  <span style={{
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '0.18em',
    fontSize: '13px',
    color: '#9A8878',
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
  <div style={{ flex: 1, borderTop: '1px solid #DDD5C3' }} />
</div>
```

No change to this rendering path — the label comes from `GROUP_LABELS[category]`. Setting `international: 'INTERNATIONAL'` in `GROUP_LABELS` is sufficient to get the exact styling specified in CONTEXT.md (color `#9A8878`, same horizontal rule, Bebas Neue).

### Pattern 3: Freshness Indicator on CollectionCard

The freshness indicator is shown only for international collections, below the description text, with the same visual weight as the admin question count row (`10px Bebas Neue`, color `#9A8878`).

Current admin question count row (existing pattern to match):
```typescript
// Source: frontend/src/features/collections/components/CollectionCard.tsx (line 102-111)
{isAdmin && (
  <div style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '10px',
    letterSpacing: '0.1em',
    color: '#9A8878',
    marginTop: '6px',
  }}>
    {collection.questionCount} QUESTIONS
  </div>
)}
```

Freshness indicator should use the same style block, conditioned on `collection.tier === 'international' && collection.latestQuestionAt != null`.

### Pattern 4: formatFreshness Utility

Based on existing patterns already in the codebase:

```typescript
// Adapted from ElectionsPage.tsx formatRelativeTime + Profile.tsx formatDate
// Source: frontend/src/pages/admin/ElectionsPage.tsx (line 79-88)
// Source: frontend/src/pages/Profile.tsx (line 75-80)

export function formatFreshness(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  // >= 24h: calendar date
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(isoString));
  return `Updated ${label}`;
}
```

This exactly matches the spec:
- "Updated 45m ago" (< 1h)
- "Updated 3h ago" (< 24h)
- "Updated Apr 9" (>= 24h)

### Pattern 5: Backend — Adding latestQuestionAt to the /collections query

Current query selects `COUNT(DISTINCT collectionQuestions.questionId)`. The freshness timestamp is the MAX of `questions.createdAt` for active, non-expired questions in the collection.

Drizzle extension:
```typescript
// Source: backend/src/routes/game.ts (lines 59-89)
// Add alongside the existing COUNT aggregate:
latestQuestionAt: sql<string | null>`MAX(${questions.createdAt})`.as('latestQuestionAt'),
```

The `MAX` aggregate returns `null` for a collection with zero matching questions. The filter `questionCount >= MIN_QUESTION_THRESHOLD` already gates out empty collections, so in practice `latestQuestionAt` will always be a valid timestamp for collections surfaced to the client. However, the frontend type should still be `string | null` for defensive coding.

### Anti-Patterns to Avoid
- **Separate API endpoint for freshness:** Would force N requests for N international collections on page load. Use the existing aggregate query instead.
- **Filtering international in getCategory as a catch-all default:** Keep `'international'` as an explicit branch — don't fall through to `'local'`.
- **Showing freshness on domestic cards:** The spec limits freshness to international cards only. Domestic cards have no `latestQuestionAt` semantic meaning.
- **Including year in the calendar format:** Spec shows "Updated Apr 9" (no year). `Intl.DateTimeFormat` without `year` field produces this correctly.
- **Adding date-fns as a dependency:** The two-branch spec is fully covered by native JS + `Intl`. No external dependency is justified.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time formatting | Custom recursive formatter | Extend `ElectionsPage.formatRelativeTime` pattern (native) | Already proven in codebase, 10 lines |
| Calendar date formatting | String manipulation | `Intl.DateTimeFormat` (already used in `Profile.tsx`) | Handles locale, zero-pads, browser-native |
| Section hiding when empty | Explicit `if international.length === 0` guard | `.filter((g) => g.collections.length > 0)` already in CollectionPicker | Re-using existing filter is simpler and more robust |
| SQL max timestamp | Application-level sort + pick | `MAX(questions.created_at)` Drizzle aggregate | Correct aggregate, performed DB-side |

## Common Pitfalls

### Pitfall 1: getCategory catches 'international' as 'local'
**What goes wrong:** The existing `getCategory` function returns `'local'` as the default. If `'international'` tier is not explicitly handled, international collections silently appear in the "Local" section.
**Why it happens:** The original function only checks `'federal'` and `'state'` explicitly.
**How to avoid:** Add `if (collection.tier === 'international') return 'international';` before the default return.
**Warning signs:** International collections appear under "LOCAL" section header during testing.

### Pitfall 2: GROUP_LABELS missing 'international' key causes TypeScript error
**What goes wrong:** `GROUP_LABELS` is typed `Record<string, string>` — currently OK — but if it is ever narrowed to a typed enum, a missing key would compile-error. More immediately: if you accidentally look up `GROUP_LABELS['international']` before adding the key, you get `undefined` rendered as the label.
**How to avoid:** Add `international: 'INTERNATIONAL'` to `GROUP_LABELS` in the same commit as the grouping array extension.

### Pitfall 3: latestQuestionAt not propagated through the filter chain
**What goes wrong:** The `filtered` array in the search/filter path is derived directly from `collections` — it will include `latestQuestionAt` automatically as long as the field is on `CollectionSummary`. No extra handling required for search to work.
**Why it might be missed:** Developers sometimes add a field to the grouped path but forget it passes through the flat search path unchanged.
**How to avoid:** Confirm `CollectionSummary.latestQuestionAt` is typed on the interface (not just the API response), so both code paths get it for free.

### Pitfall 4: Edge case — international collection with zero active questions
**What goes wrong:** The backend filters out collections below `MIN_QUESTION_THRESHOLD` (50) so this shouldn't occur. But `MAX(questions.created_at)` returns `NULL` for a collection with zero qualifying question rows. If the SQL type is not handled as nullable, TypeScript casts it as `string` and `new Date(null)` produces `Invalid Date`.
**How to avoid:** Type `latestQuestionAt` as `string | null` in both the backend response and frontend `CollectionSummary`. Render `null` as nothing (omit the indicator entirely) — no fallback text.

### Pitfall 5: Section order regression
**What goes wrong:** Changing the `as const` array order in `CollectionPicker` accidentally reorders domestic sections.
**How to avoid:** The array must be `['local', 'state', 'federal', 'international'] as const` — `international` appended last. Verify render order in the browser after the change.

### Pitfall 6: Freshness indicator appears on domestic cards
**What goes wrong:** If the `CollectionCard` renders the freshness indicator whenever `latestQuestionAt` is non-null (without checking `tier === 'international'`), it would appear on domestic cards too (they also get a `latestQuestionAt` from the query).
**How to avoid:** Gate the freshness indicator on `collection.tier === 'international'`, not just on `collection.latestQuestionAt != null`.

## Code Examples

### formatFreshness utility (new file)
```typescript
// frontend/src/utils/formatFreshness.ts
// Adapted from ElectionsPage.tsx (line 79-88) and Profile.tsx (line 75-80)
export function formatFreshness(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(isoString));
  return `Updated ${label}`;
}
```

### CollectionSummary type extension
```typescript
// frontend/src/features/collections/types.ts
export interface CollectionSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  themeColor: string;
  questionCount: number;
  tier: 'federal' | 'state' | 'city' | 'international';
  latestQuestionAt?: string | null;  // NEW — only meaningful for international tier
}
```

### Backend query extension (Drizzle)
```typescript
// backend/src/routes/game.ts — inside the .select({}) block
latestQuestionAt: sql<string | null>`MAX(${questions.createdAt})`.as('latestQuestionAt'),
```

No change to `.groupBy()` or `.orderBy()` needed — `MAX` is an aggregate, compatible with the existing `groupBy(collections.id)`.

### getCategory extension
```typescript
// frontend/src/features/collections/components/CollectionPicker.tsx
function getCategory(collection: CollectionSummary): 'local' | 'state' | 'federal' | 'international' {
  if (collection.tier === 'federal') return 'federal';
  if (collection.tier === 'state') return 'state';
  if (collection.tier === 'international') return 'international';
  return 'local';
}
```

### GROUP_LABELS extension
```typescript
const GROUP_LABELS: Record<string, string> = {
  local:         'Local',
  state:         'State',
  federal:       'Federal',
  international: 'International',
};
```

### Grouping array extension
```typescript
const grouped = (['local', 'state', 'federal', 'international'] as const)
  .map((category) => ({ ... }))
  .filter((g) => g.collections.length > 0);
```

### Freshness indicator in CollectionCard
```typescript
// Below the description div, before closing the card body div
{collection.tier === 'international' && collection.latestQuestionAt && (
  <div style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '10px',
    letterSpacing: '0.1em',
    color: '#9A8878',
    marginTop: '6px',
  }}>
    {formatFreshness(collection.latestQuestionAt)}
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | Applies Here |
|--------------|------------------|--------------|
| Three-section picker (local/state/federal) | Four-section picker (+international) | This phase |
| `tier` union: 3 values | `tier` union: 4 values (landed Phase 75-02) | Already done |
| No freshness on collections | `latestQuestionAt` field from MAX aggregate | This phase |

## Open Questions

1. **`latestQuestionAt` for domestic collections**
   - What we know: The backend query would return `latestQuestionAt` for all collections (the aggregate runs for every group), not just international ones.
   - What's unclear: Should domestic collection rows include `latestQuestionAt` in the JSON response, or should it be suppressed?
   - Recommendation: Include it in all rows — it's free SQL data. The frontend ignores it for non-international cards. No backend conditional needed.

2. **Sort order within International section**
   - What we know: The spec says International appears after Federal; domestic sort is alphabetical (`a.name.localeCompare(b.name)`).
   - What's unclear: Whether International cards within the section should also sort alphabetically or by some other property (e.g., `sortOrder` column, freshness).
   - Recommendation: Use alphabetical — consistent with all other sections. The `sortOrder` column isn't relevant here since International collections don't compete with each other for ordering priority.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection:
  - `frontend/src/features/collections/components/CollectionPicker.tsx` — full implementation read
  - `frontend/src/features/collections/components/CollectionCard.tsx` — full implementation read
  - `frontend/src/features/collections/types.ts` — confirmed `'international'` already in tier union
  - `backend/src/routes/game.ts` — full `/collections` query read
  - `backend/src/db/schema.ts` — full schema read, confirmed `questions.createdAt` column
  - `backend/src/services/embeddings/types.ts` — confirmed `CollectionTier` includes `'international'`
  - `frontend/src/pages/admin/ElectionsPage.tsx` (lines 79-88) — `formatRelativeTime` pattern
  - `frontend/src/pages/Profile.tsx` (lines 75-80) — `Intl.DateTimeFormat` pattern for calendar date
  - `frontend/src/features/collections/components/CollectionCardSkeleton.tsx` — skeleton structure confirmed
  - `frontend/src/hooks/useTheme.ts` — color tokens confirmed (`#9A8878` = `C.mutedFg`)
  - `frontend/package.json` — confirmed no date-fns or moment in dependencies

### Secondary (MEDIUM confidence)
- None needed — all findings verified from direct code inspection.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and direct codebase read
- Architecture: HIGH — patterns derived directly from existing CollectionPicker, CollectionCard, and route code
- Pitfalls: HIGH — derived from reading the actual implementation gaps

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable codebase; only invalidated if CollectionPicker or game.ts route is substantially refactored)
