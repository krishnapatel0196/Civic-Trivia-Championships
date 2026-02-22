# Phase 29: Admin Review Queue - Research

**Researched:** 2026-02-22
**Domain:** Admin interface for content moderation
**Confidence:** HIGH

## Summary

This phase implements a flagged questions review page for admins using established patterns from the existing admin UI. The codebase already has a mature admin section with React 18.2, TypeScript, TailwindCSS, and plain HTML tables (not TanStack Table as initially mentioned in CONTEXT). The backend uses Express with Drizzle ORM, and the database schema already includes the `question_flags` table with denormalized `flag_count` on questions.

The standard approach is server-side pagination with URL-based filtering (using React Router's useSearchParams), plain HTML tables with clickable headers for sorting, and Headless UI for accessible tabs. For toast notifications (undo action), the recommended modern approach is using a lightweight library like Sonner or implementing a simple custom solution with React state and timeouts.

The existing codebase patterns are well-established and should be followed exactly—no need for external table libraries. The admin UI already demonstrates the correct patterns in QuestionsPage.tsx, including detail panels, pagination, filtering, and optimistic updates.

**Primary recommendation:** Follow existing admin UI patterns exactly (plain tables, URL-based state, Headless UI tabs) and leverage denormalized flag_count for efficient sorting.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI framework | Already in project, stable version |
| TypeScript | 5.3.3 | Type safety | Already in project |
| TailwindCSS | 3.4.1 | Styling | Existing admin UI uses it exclusively |
| React Router | 6.21.1 | Routing & URL state | Already handles searchParams in admin pages |
| Drizzle ORM | 0.45.1 | Database queries | Backend standard, handles joins/aggregations |
| Express | 4.18.2 | HTTP server | Backend standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Headless UI | 2.2.9 | Accessible tabs | Already installed, CONTEXT specifies tabs UI |
| Zod | 4.3.6 | API validation | Backend validation standard |
| express-validator | 7.3.1 | Request validation | Alternative validation layer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain HTML tables | TanStack Table | Existing codebase uses plain tables; adding TanStack would introduce inconsistency and unnecessary complexity for this simple use case |
| Custom toast | Sonner/react-hot-toast | Custom solution is 50-100 lines, no deps; libraries add 3-10KB and new patterns |
| URL state | Zustand/Redux | URL state is better for admin pages—shareable links, back button, no sync issues |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/pages/admin/
├── FlagReviewPage.tsx           # Main page component
├── components/
│   ├── FlaggedQuestionsTable.tsx  # Table component (follows QuestionTable pattern)
│   ├── FlagDetailPanel.tsx        # Detail view (follows QuestionDetailPanel pattern)
│   └── ReasonChip.tsx             # Already exists in game features, can reuse or adapt

backend/src/routes/
├── admin.ts                       # Add new endpoints here
```

### Pattern 1: URL-Based Filter & Pagination State
**What:** All filters, sort, and pagination state stored in URL searchParams
**When to use:** Always for admin list pages—enables shareable links, back button support
**Example:**
```typescript
// Source: C:\Project Test\frontend\src\pages\admin\QuestionsPage.tsx
export function FlagReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = searchParams.get('sort') || 'flag_count';
  const order = searchParams.get('order') || 'desc';
  const collection = searchParams.get('collection') || '';
  const tab = searchParams.get('tab') || 'active';

  // Update URL helper
  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Fetch data when URL changes
  useEffect(() => {
    fetchFlaggedQuestions();
  }, [searchParams.toString()]);
}
```

### Pattern 2: Plain HTML Table with Sort Headers
**What:** Native HTML table with clickable headers that update URL sort params
**When to use:** For all admin tables—no library needed, accessible, performant
**Example:**
```typescript
// Source: Existing QuestionTable.tsx pattern
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-red-900">
    <tr>
      <th
        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-800"
        onClick={() => handleSortChange('flag_count')}
      >
        Flags {renderSortIcon('flag_count')}
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {questions.map((q) => (
      <tr key={q.id} onClick={() => handleRowClick(q.id)} className="hover:bg-gray-50 cursor-pointer">
        <td className="px-6 py-4">...</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Pattern 3: Headless UI Tabs for Active/Archived
**What:** Accessible tab component from Headless UI with data attributes for styling
**When to use:** For Active vs Archived tabs—already installed, accessible, unstyled
**Example:**
```typescript
// Source: https://headlessui.com/react/tabs
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

function FlagReviewTabs() {
  return (
    <TabGroup>
      <TabList className="flex space-x-1 bg-red-900/20 p-1 rounded-lg">
        <Tab className="px-4 py-2 text-sm font-medium rounded-lg data-[selected]:bg-white data-[selected]:text-red-900 data-[hover]:bg-red-900/10">
          Active
        </Tab>
        <Tab className="px-4 py-2 text-sm font-medium rounded-lg data-[selected]:bg-white data-[selected]:text-red-900 data-[hover]:bg-red-900/10">
          Archived
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>{/* Active questions table */}</TabPanel>
        <TabPanel>{/* Archived questions table */}</TabPanel>
      </TabPanels>
    </TabGroup>
  )
}
```

### Pattern 4: Optimistic Update with Rollback
**What:** Update local state immediately, call API, rollback on error
**When to use:** For archive/dismiss actions—feels instant, handles errors gracefully
**Example:**
```typescript
// Source: Existing QuestionDetailPanel pattern
const handleArchive = async (questionId: number) => {
  // 1. Save previous state
  const previousState = [...questions];

  // 2. Optimistically update local state
  setQuestions(prev => prev.filter(q => q.id !== questionId));

  // 3. Show undo toast
  showUndoToast(() => {
    // Undo callback: restore from previous state
    setQuestions(previousState);
  });

  // 4. Call API
  try {
    await fetch(`/api/admin/questions/${questionId}/archive`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    // Rollback on error
    setQuestions(previousState);
    showErrorToast('Failed to archive question');
  }
};
```

### Pattern 5: Server-Side Pagination with Drizzle
**What:** Use limit/offset for pagination, count total for pagination meta
**When to use:** For all paginated admin endpoints—simple, works well for moderate data
**Example:**
```typescript
// Backend pattern
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 25;
const offset = (page - 1) * limit;

// Query with pagination
const results = await db
  .select()
  .from(questions)
  .where(gt(questions.flagCount, 0))
  .orderBy(desc(questions.flagCount))
  .limit(limit)
  .offset(offset);

// Count for pagination meta
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(questions)
  .where(gt(questions.flagCount, 0));

res.json({
  data: results,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit)
  }
});
```

### Anti-Patterns to Avoid
- **Using TanStack Table when plain tables work:** Existing admin uses plain HTML tables. Adding TanStack creates inconsistency and unnecessary complexity.
- **Client-side filtering/sorting:** Always paginate server-side for admin lists—large datasets, performance, security.
- **Modal dialogs for every action:** User already decided undo toast pattern—don't add confirmation modals for archive.
- **COUNT(*) with JOINs on every request:** Use denormalized flag_count column for sorting—avoids expensive aggregation queries.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible tabs | Custom tab state + keyboard nav | Headless UI Tab components | Already installed, handles aria-*, keyboard navigation (arrow keys, home/end), focus management |
| Toast notifications | Custom position/stack/timeout logic | Simple useState + setTimeout or Sonner | Toast stacking, z-index, animations are complex; Sonner is 3KB and handles edge cases |
| URL state sync | Manual searchParams updates | useSearchParams hook pattern | Existing codebase pattern handles back button, initial load, race conditions |
| Multi-column sorting | Custom sort state | URL params with single sort column | Multi-column adds complexity; single column with toggle asc/desc is standard admin pattern |

**Key insight:** The existing admin codebase (QuestionsPage, QuestionTable, QuestionDetailPanel) already solves every pattern needed for this phase—reuse those patterns exactly.

## Common Pitfalls

### Pitfall 1: Expensive COUNT(*) with JOINs on Every Page Load
**What goes wrong:** Joining question_flags table and counting flags on every request causes slow queries as data grows
**Why it happens:** Forgetting that flag_count is already denormalized on questions table
**How to avoid:** Use questions.flag_count for sorting and filtering—only JOIN to question_flags when showing detail view
**Warning signs:** Query times >200ms on admin page load, database CPU spikes

### Pitfall 2: Race Conditions in Optimistic Updates
**What goes wrong:** User clicks archive, API responds slowly, user clicks restore before archive completes—state gets corrupted
**Why it happens:** Multiple async operations updating same state without tracking in-flight requests
**How to avoid:** Track pending operations in state (`Map<questionId, 'archiving'|'restoring'>`) and disable buttons while pending
**Warning signs:** Questions disappearing/reappearing, double-clicks causing errors

### Pitfall 3: Not Resetting Pagination on Filter Change
**What goes wrong:** User is on page 5 of active flags, changes collection filter, sees empty page because filtered results only have 2 pages
**Why it happens:** Forgetting to reset page to 1 when filters change
**How to avoid:** Always include `newParams.set('page', '1')` when updating filter params (see QuestionsPage handleFilterChange)
**Warning signs:** Empty pages after filtering, users confused by "no results"

### Pitfall 4: Loading All Flags on Detail View
**What goes wrong:** Question has 50+ flags, detail view loads all at once, slow render, user doesn't need to see all
**Why it happens:** Simple query without thinking about cardinality
**How to avoid:** Limit detail view to most recent 10 flags, add "Show more" if needed; or paginate within detail panel
**Warning signs:** Detail panel slow to open, React performance warnings

### Pitfall 5: Forgetting to Update flag_count After Dismiss
**What goes wrong:** Admin dismisses flags, question stays at top of queue with old flag count
**Why it happens:** Dismiss endpoint clears question_flags rows but doesn't update questions.flag_count to 0
**How to avoid:** Dismiss endpoint must update both tables atomically in transaction
**Warning signs:** Questions stay in queue after dismiss, flag counts wrong

### Pitfall 6: Tab State Not in URL
**What goes wrong:** User is on Archived tab, refreshes page, gets dumped back to Active tab
**Why it happens:** Tab state stored in component state instead of URL
**How to avoid:** Use `tab` query param and sync with Headless UI TabGroup's `selectedIndex`
**Warning signs:** Tabs don't survive refresh, can't share link to archived view

## Code Examples

Verified patterns from official sources:

### Headless UI Tab with URL State
```typescript
// Source: https://headlessui.com/react/tabs + existing URL pattern
import { Tab, TabGroup } from '@headlessui/react'
import { useSearchParams } from 'react-router-dom'

function FlagReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';

  const selectedIndex = tab === 'archived' ? 1 : 0;

  const handleTabChange = (index: number) => {
    const newTab = index === 1 ? 'archived' : 'active';
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    newParams.set('page', '1'); // Reset pagination
    setSearchParams(newParams);
  };

  return (
    <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
      <TabList>
        <Tab>Active</Tab>
        <Tab>Archived</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>{/* Active content */}</TabPanel>
        <TabPanel>{/* Archived content */}</TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
```

### Simple Undo Toast Implementation
```typescript
// Custom implementation (no library needed for simple undo)
interface ToastState {
  message: string;
  action?: { label: string; onClick: () => void };
  visible: boolean;
}

function useUndoToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showToast = (message: string, undoCallback: () => void) => {
    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setToast({
      message,
      action: { label: 'Undo', onClick: undoCallback },
      visible: true
    });

    // Auto-hide after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return { toast, showToast, hideToast };
}

// Toast component
function Toast({ message, action, visible, onClose }: ToastState & { onClose: () => void }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <span>{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(); }}
          className="text-amber-400 hover:text-amber-300 font-medium"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="text-gray-400 hover:text-gray-300">×</button>
    </div>
  );
}
```

### Reason Breakdown Chips Display
```typescript
// Aggregate flags by reason type for table display
interface ReasonBreakdown {
  [reason: string]: number;
}

function aggregateReasons(flags: { reasons: string[] }[]): ReasonBreakdown {
  const breakdown: ReasonBreakdown = {};

  for (const flag of flags) {
    for (const reason of flag.reasons || []) {
      breakdown[reason] = (breakdown[reason] || 0) + 1;
    }
  }

  return breakdown;
}

// Display in table cell
function ReasonBreakdownCell({ breakdown }: { breakdown: ReasonBreakdown }) {
  const reasonLabels: Record<string, string> = {
    'confusing-wording': 'Confusing',
    'outdated-info': 'Outdated',
    'wrong-answer': 'Wrong',
    'not-interesting': 'Boring'
  };

  const reasonColors: Record<string, string> = {
    'confusing-wording': 'bg-amber-100 text-amber-800',
    'outdated-info': 'bg-blue-100 text-blue-800',
    'wrong-answer': 'bg-red-100 text-red-800',
    'not-interesting': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(breakdown).map(([reason, count]) => (
        <span
          key={reason}
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${reasonColors[reason]}`}
        >
          {reasonLabels[reason]} ×{count}
        </span>
      ))}
    </div>
  );
}
```

### Archive Endpoint with Denormalized Update
```typescript
// Source: Drizzle ORM patterns + existing admin endpoints
// backend/src/routes/admin.ts
router.patch('/questions/:id/archive', async (req, res) => {
  const questionId = parseInt(req.params.id);
  if (isNaN(questionId)) {
    return res.status(400).json({ error: 'Invalid question ID' });
  }

  try {
    // Update question status and clear flag_count
    await db.update(questions)
      .set({
        status: 'archived',
        flagCount: 0,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId));

    res.json({ success: true });
  } catch (error) {
    console.error('Archive failed:', error);
    res.status(500).json({ error: 'Failed to archive question' });
  }
});

// Dismiss flags endpoint
router.post('/questions/:id/dismiss-flags', async (req, res) => {
  const questionId = parseInt(req.params.id);

  try {
    // Clear flag count, keep question active
    await db.update(questions)
      .set({
        flagCount: 0,
        updatedAt: new Date()
      })
      .where(eq(questions.id, questionId));

    // Optionally delete the flag records
    await db.delete(questionFlags)
      .where(eq(questionFlags.questionId, questionId));

    res.json({ success: true });
  } catch (error) {
    console.error('Dismiss failed:', error);
    res.status(500).json({ error: 'Failed to dismiss flags' });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Table v7 | Plain HTML tables for simple admin | 2023-2024 | Simpler codebases reject heavy table libraries for basic use cases—only use TanStack for complex features like column visibility, row selection |
| Custom tab components | Headless UI | 2021-2022 | Accessibility built-in, less code, maintained by Tailwind team |
| Global state for filters | URL searchParams | 2022-2023 | Better UX (shareable links, back button), simpler code, no state sync bugs |
| Sonner library adoption | React 18+ standard | 2024-2025 | Sonner became de facto toast library for shadcn/ui ecosystem |
| useOptimistic hook | React 19 | 2024 | Built-in optimistic UI pattern, but React 18 users still use manual optimistic updates |

**Deprecated/outdated:**
- **react-table (v6-v7):** Renamed to TanStack Table v8, but even v8 is overkill for simple admin tables
- **react-toastify:** Still works but heavier than Sonner; ecosystem moving to Sonner
- **Limit/offset pagination for large datasets:** Cursor-based pagination is better for >100k rows, but admin flags review will have <10k records

## Open Questions

Things that couldn't be fully resolved:

1. **Should dismissed flags be soft-deleted or hard-deleted?**
   - What we know: CONTEXT doesn't specify, schema has no deleted_at column
   - What's unclear: Whether admins need audit trail of dismissed flags
   - Recommendation: Hard delete question_flags rows on dismiss (simpler), but log action in question's history if audit trail needed

2. **Should flag detail show username vs "Anonymous User" for deleted accounts?**
   - What we know: question_flags.userId is raw int reference to users table
   - What's unclear: Whether users can delete accounts, how to handle orphaned flags
   - Recommendation: JOIN to users table, display "Unknown User" if user not found (handle gracefully)

3. **Should admins see their own flags in the review queue?**
   - What we know: No requirement specified
   - What's unclear: Whether admins can flag questions and if those should be visible
   - Recommendation: Show all flags including admin flags—transparency is good, admins are trusted

## Sources

### Primary (HIGH confidence)
- Existing codebase: C:\Project Test\frontend\src\pages\admin\QuestionsPage.tsx - URL state pattern, pagination, filtering
- Existing codebase: C:\Project Test\frontend\src\pages\admin\components\QuestionTable.tsx - Table pattern, sorting
- Existing codebase: C:\Project Test\backend\src\db\schema.ts - Database schema, question_flags table structure
- Existing codebase: C:\Project Test\backend\src\routes\admin.ts - Admin endpoint patterns
- Headless UI official docs: https://headlessui.com/react/tabs - Tab component API and examples
- Drizzle ORM official docs: https://orm.drizzle.team/docs/guides/limit-offset-pagination - Pagination patterns

### Secondary (MEDIUM confidence)
- [React admin table patterns (Marmelab React-Admin)](https://marmelab.com/react-admin/ListTutorial.html)
- [Sonner toast library (modern React toast notifications)](https://medium.com/@rivainasution/shadcn-ui-react-series-part-19-sonner-modern-toast-notifications-done-right-903757c5681f)
- [React useOptimistic hook documentation](https://react.dev/reference/react/useOptimistic)
- [REST API archive/restore patterns (Phil Sturgeon)](https://philsturgeon.com/restful-deletions-restorations-and-revisions/)
- [Drizzle pagination performance](https://orm.drizzle.team/docs/guides/cursor-based-pagination)
- [SQL join aggregation performance (Ennicode)](https://www.ennicode.com/sql-performance-tuning/)

### Tertiary (LOW confidence)
- [Top React notification libraries 2026 (Knock)](https://knock.app/blog/the-top-notification-libraries-for-react) - General overview, not project-specific
- [React tabs best practices (Sandro Roth)](https://sandroroth.com/blog/react-tabs-component/) - Multiple approaches, not prescriptive

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, versions verified
- Architecture: HIGH - Existing codebase demonstrates all patterns needed
- Pitfalls: HIGH - Based on verified database schema and existing code patterns
- Code examples: HIGH - Sourced from official docs (Headless UI, Drizzle) and existing codebase

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days - stable stack, no fast-moving dependencies)
