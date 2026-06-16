# Phase 74: Collection Picker Search/Filter - Research

**Researched:** 2026-03-23
**Domain:** React component state management, client-side filtering, UI pattern
**Confidence:** HIGH

## Summary

This is a pure frontend feature with zero backend involvement. All collections are already loaded client-side by `useCollections`, making filtering a straightforward derived-state problem. The target component is `CollectionPicker.tsx`, which renders a grouped (Federal / State / Local) card grid using inline styles exclusively — no CSS modules, no separate stylesheet.

The feature requires: (1) a search `<input>` element inserted above the grouped view, (2) a `useState` string for the query, and (3) conditional rendering logic that switches between the grouped view and a flat filtered list. A `useDebounce` hook already exists in the project at `frontend/src/hooks/useDebounce.ts` and should be used for the search query to avoid unnecessary re-renders on fast typing.

The styling convention throughout the collection feature is **inline styles with design token values**. The `useTheme()` hook exposes the `C` color token object. The component must follow this exact pattern — no Tailwind utility classes on new elements (the existing component uses Tailwind only on a single `className="flex flex-col sm:flex-row gap-3 pb-2"` for the skeleton loading row; all other layout is inline style).

**Primary recommendation:** Add `useState` for search query directly inside `CollectionPicker`, debounce it with the existing `useDebounce` hook (150–200ms), derive `filteredCollections` from the prop, and toggle between grouped JSX and flat JSX based on whether query is non-empty.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | Component state + rendering | Already in use; `useState` for query |
| TypeScript | 5.3.3 | Type safety | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useDebounce` (project hook) | n/a | Debounce search query | Already exists at `frontend/src/hooks/useDebounce.ts`; use for search to avoid jank on mobile |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Internal `useState` in CollectionPicker | Lift state to Dashboard | No benefit — Dashboard doesn't need query; keep it local |
| `useDebounce` | No debounce | 26 items is small enough that debounce is optional, but it's free since hook exists |
| Flat `<input>` | Shared `<Input>` component | `Input` component uses dark Tailwind styles (`bg-slate-700`, `text-white`) — wrong for the warm parchment theme. Use a plain `<input>` with inline styles matching the design system |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

No new files required. All changes are contained within:
```
frontend/src/features/collections/
├── components/
│   └── CollectionPicker.tsx   ← all changes here
└── hooks/
    └── useDebounce.ts         ← imported, not modified
```

### Pattern 1: Local Query State + Derived Filtered List

**What:** `useState` for the raw query string inside `CollectionPicker`. `useMemo` or inline derivation computes the filtered flat list. Renders either flat list or grouped view depending on whether query is truthy.

**When to use:** Any time the filter state is component-local and the data is already in memory.

**Example:**
```typescript
// Source: direct reading of CollectionPicker.tsx + useDebounce.ts
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 150);

const filtered = debouncedQuery.trim()
  ? collections.filter(c =>
      c.name.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
    )
  : [];

const isFiltering = debouncedQuery.trim().length > 0;
```

### Pattern 2: Toggle Between Grouped and Flat Rendering

**What:** The main return renders: (A) search input always visible, (B) when `isFiltering === true`, render a flat `auto-fill` grid of filtered cards; when `isFiltering === false`, render the existing `grouped` map.

**When to use:** This is the exact pattern required by the success criteria.

**Example:**
```typescript
// Flat list view (query active)
{isFiltering && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
    {filtered.map(collection => (
      <CollectionCard key={collection.id} collection={collection} isSelected={selectedId === collection.id} onSelect={onSelect} />
    ))}
    {filtered.length === 0 && (
      <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', fontSize: '13px', color: '#7A6A5A', gridColumn: '1 / -1' }}>
        No collections match "{debouncedQuery}"
      </p>
    )}
  </div>
)}

// Grouped view (no query)
{!isFiltering && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '8px' }}>
    {grouped.map(...)} // existing code unchanged
  </div>
)}
```

### Pattern 3: Search Input Styling

**What:** The input element must match the warm parchment design system. It uses inline styles, not the shared `<Input>` component (which is styled for dark admin screens).

**Example:**
```typescript
<input
  type="search"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search collections…"
  aria-label="Search collections"
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    color: '#17120E',
    background: '#F5EDD8',
    border: '1px solid #C8BAA6',
    borderRadius: '3px',
    outline: 'none',
    marginBottom: '20px',
  }}
/>
```

The clear button for `type="search"` is provided natively by the browser's built-in clear (×) button — no custom implementation needed. The requirement states "clear button" — native `type="search"` delivers this on Chrome/Safari/Edge at zero cost.

### Anti-Patterns to Avoid

- **Using the shared `<Input>` component:** It applies dark Tailwind classes (`bg-slate-700 text-white`) that clash with the warm parchment aesthetic. Use a bare `<input>` with inline styles.
- **Lifting search state to Dashboard.tsx:** Dashboard doesn't need the query value. Keep state local.
- **Filtering during loading:** The loading state shows skeletons — search input should not render during loading, or should render disabled. Rendering it only after `!loading` matches the existing pattern (the grouped content already gates on `loading`).
- **Case-sensitive comparison:** Must use `.toLowerCase()` on both sides — the requirement explicitly calls this out.
- **Filtering on `collection.name` only:** The spec says "partial name" — filtering `name` alone is correct and sufficient. Do not over-engineer to search description/slug.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debouncing | Custom `setTimeout` in component | `useDebounce` from `frontend/src/hooks/useDebounce.ts` | Already exists, typed generically, tested pattern |
| Clear button | Custom SVG X button with state | Native `<input type="search">` | Browser provides native clear affordance; no JS needed |
| Fuzzy matching | Custom Levenshtein/Fuse.js | Simple `String.includes()` | 26 collections; `includes` is sufficient and fast |

**Key insight:** With only 26 collections loaded in memory, there is no performance case for anything more complex than `Array.filter` + `String.includes`. No library is needed.

## Common Pitfalls

### Pitfall 1: Search Input Visible During Loading
**What goes wrong:** Input appears but collections aren't loaded; user types into an empty list.
**Why it happens:** Loading and content renders are conditionally swapped.
**How to avoid:** Render the search input only within the non-loading branch (same `if (loading)` guard already used for the skeleton).
**Warning signs:** If the search input renders above the skeleton cards, it's in the wrong branch.

### Pitfall 2: Stale Query After Collection Load
**What goes wrong:** If user navigates away and back, a stale query might persist and confuse them.
**Why it happens:** `useState` persists for the lifetime of the component.
**How to avoid:** This is acceptable — the component unmounts on navigate. No special handling needed.

### Pitfall 3: Empty Results State Missing
**What goes wrong:** User types "xyz" and sees a blank area with no explanation.
**Why it happens:** Filtered array is empty but no empty state message is rendered.
**How to avoid:** Render a "No collections match…" message inside the flat list grid when `filtered.length === 0`. Use `gridColumn: '1 / -1'` so it spans the full grid width.

### Pitfall 4: Category Labels Appearing in Flat View
**What goes wrong:** "Local / State / Federal" section headers render in the flat filtered view.
**Why it happens:** Reusing the grouped render path for filtered results.
**How to avoid:** The flat path must be completely separate JSX, using only the `filtered` array — no `grouped` map.

### Pitfall 5: `type="search"` Clear Button Styling Gap
**What goes wrong:** The native clear button on `type="search"` inputs has browser-default styling that may not match the design.
**Why it happens:** Chrome/Safari style the `×` button differently.
**How to avoid:** Accept native clear button styling. The requirement says "clear button" — native satisfies this. If styling becomes a problem, add `::-webkit-search-cancel-button` CSS or switch to `type="text"` with a manual clear button (lower priority).

### Pitfall 6: CollectionPicker Props Not Passing `selectedId` to Flat View
**What goes wrong:** Cards in flat view don't show the selected state indicator.
**Why it happens:** `selectedId` not passed to `CollectionCard` in the flat render.
**How to avoid:** The flat list must pass `isSelected={selectedId === collection.id}` exactly as the grouped view does.

## Code Examples

### Complete Search State Logic
```typescript
// Source: derived from reading CollectionPicker.tsx + useDebounce.ts
import { useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

// Inside CollectionPicker component:
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 150);
const isFiltering = debouncedQuery.trim().length > 0;

const filtered = isFiltering
  ? collections.filter(c =>
      c.name.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
    )
  : [];
```

### Search Input Element
```typescript
// Plain <input> with inline styles matching the parchment design system
<input
  type="search"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search collections…"
  aria-label="Search collections"
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    color: '#17120E',
    background: '#F5EDD8',
    border: '1px solid #C8BAA6',
    borderRadius: '3px',
    outline: 'none',
    marginBottom: '20px',
  }}
/>
```

### Empty State Message
```typescript
// Inside flat view grid, when filtered.length === 0
<p style={{
  fontFamily: "'Lora', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '13px',
  color: '#7A6A5A',
  gridColumn: '1 / -1',
  padding: '8px 0',
}}>
  No collections match "{debouncedQuery}"
</p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No search | Grouped list only | Phase 74 adds this | Players must scroll 26 cards |

**Deprecated/outdated:**
- Nothing deprecated. The existing grouped rendering code stays intact — the search path is additive, not replacing it.

## Open Questions

1. **Focus behavior on mobile**
   - What we know: Mobile keyboards pop up when an input is focused, potentially scrolling the user away from the cards.
   - What's unclear: Whether auto-focus on the search input is desired.
   - Recommendation: Do NOT auto-focus the search input. Let users tap it intentionally. This avoids the keyboard popping up on every Dashboard load.

2. **`type="search"` vs `type="text"` for clear button**
   - What we know: `type="search"` provides a native clear button on Chrome/Safari/Edge. Firefox does not show one natively.
   - What's unclear: Whether Firefox users need a custom clear button.
   - Recommendation: Use `type="search"` and accept the Firefox gap for now. The requirement says "clear button" — keyboard Delete key always works as fallback. If a custom X button is required later, that's a follow-up task.

3. **Dark mode theming for search input**
   - What we know: The project has `useTheme()` with LIGHT/DARK token sets. The CollectionPicker currently doesn't use `useTheme()` — it hardcodes LIGHT values directly.
   - What's unclear: Whether the search input should be dark-mode-aware.
   - Recommendation: Match the existing component convention — hardcode LIGHT values directly (same as the rest of CollectionPicker). Dark mode support for CollectionPicker is out of scope for this phase.

## Sources

### Primary (HIGH confidence)
- Direct file read: `frontend/src/features/collections/components/CollectionPicker.tsx` — full component shape, rendering logic, styling approach
- Direct file read: `frontend/src/features/collections/types.ts` — CollectionSummary shape
- Direct file read: `frontend/src/hooks/useDebounce.ts` — hook signature and implementation
- Direct file read: `frontend/src/hooks/useTheme.ts` — color token system
- Direct file read: `frontend/src/features/collections/components/CollectionCard.tsx` — card props and styling
- Direct file read: `frontend/src/pages/Dashboard.tsx` — how CollectionPicker is consumed
- Direct file read: `frontend/src/components/ui/Input.tsx` — why NOT to reuse it

### Secondary (MEDIUM confidence)
- None needed — all relevant code was directly readable.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code directly read; no external library needed
- Architecture: HIGH — component shape fully understood, pattern is straightforward derived state
- Pitfalls: HIGH — identified from direct reading of component structure + React patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable — no external dependencies changing)
