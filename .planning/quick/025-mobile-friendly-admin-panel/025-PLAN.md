---
quick: "025"
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/admin/components/QuestionTable.tsx
  - frontend/src/pages/admin/components/FlaggedQuestionsTable.tsx
  - frontend/src/pages/admin/QuestionsPage.tsx
  - frontend/src/pages/admin/FlagReviewPage.tsx
  - frontend/src/pages/admin/DuplicateReviewPage.tsx
autonomous: true

must_haves:
  truths:
    - "Admin can navigate to any section on a phone without a horizontal scroll"
    - "Questions list is readable and tappable on mobile (no tiny overflow table)"
    - "Detail panels open full-screen on mobile (not a side-sheet that clips off-screen)"
    - "Flag Review and Duplicate Review are usable on a narrow viewport"
  artifacts:
    - path: "frontend/src/pages/admin/components/QuestionTable.tsx"
      provides: "Card-list fallback for mobile, table for md+"
    - path: "frontend/src/pages/admin/components/FlaggedQuestionsTable.tsx"
      provides: "Card-list fallback for mobile, table for md+"
    - path: "frontend/src/pages/admin/QuestionsPage.tsx"
      provides: "Stacked filter layout on mobile"
    - path: "frontend/src/pages/admin/FlagReviewPage.tsx"
      provides: "Mobile-usable layout"
    - path: "frontend/src/pages/admin/DuplicateReviewPage.tsx"
      provides: "Mobile-usable layout"
  key_links:
    - from: "QuestionTable"
      to: "mobile card list"
      via: "useWindowSize or Tailwind hidden/block classes at sm breakpoint"
    - from: "QuestionDetailPanel / FlagDetailPanel"
      to: "full-screen dialog on mobile"
      via: "Dialog already uses headlessui; add max-w-full w-full on small screens"
---

<objective>
Make the admin panel usable on mobile. The current experience is broken: the Questions table is a fixed-width resizable grid (~1245px total) that forces horizontal scrolling, detail panels slide in from the right and are partially off-screen, and filter rows are four-column grids that crush on narrow viewports.

Purpose: Admins should be able to review flags, triage questions, and manage duplicates from a phone without a desktop session.
Output: Mobile card-list views for the two data tables, responsive filter layouts, and full-screen detail panels on small screens.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@frontend/src/pages/admin/AdminLayout.tsx
@frontend/src/pages/admin/components/QuestionTable.tsx
@frontend/src/pages/admin/components/FlaggedQuestionsTable.tsx
@frontend/src/pages/admin/QuestionsPage.tsx
@frontend/src/pages/admin/FlagReviewPage.tsx
@frontend/src/pages/admin/DuplicateReviewPage.tsx
@frontend/src/pages/admin/components/QuestionDetailPanel.tsx
@frontend/src/pages/admin/components/FlagDetailPanel.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Mobile card-list for QuestionTable and QuestionsPage filters</name>
  <files>
    frontend/src/pages/admin/components/QuestionTable.tsx
    frontend/src/pages/admin/QuestionsPage.tsx
  </files>
  <action>
    QuestionTable.tsx — add a mobile card list rendered below `sm` breakpoint and keep the existing table for `md+`.

    Use a `useWindowSize` hook (or read `window.innerWidth` with a resize listener, whichever pattern already exists in the codebase — check `frontend/src/hooks/` first) to switch views. If no hook exists, create `frontend/src/hooks/useWindowSize.ts` returning `{ width, height }` via a `useEffect` + `useState` that listens to `window.resize`.

    Mobile card list (width < 768):
    - Replace the scrolling `<table>` with a `<div>` of stacked cards (one per question).
    - Each card: question text (2-line clamp), collection badge(s), difficulty badge, quality score, status badge, flag count if > 0. Omit: Encounters, Correct Rate, Created, Expires, Violations (low-value on mobile).
    - Card is fully tappable (`onClick` calls `onQuestionClick`). Use the same hover/selected background from the existing theme (`C.ruleLight`).
    - Match broadsheet aesthetic: `C.paper` background, `C.rule` border, `'Lora'` serif for question text, `'Bebas Neue'` for labels/badges.
    - No resize handles on mobile cards (they're table-specific).

    QuestionsPage.tsx — fix the filter row for mobile:
    - The current grid is `md:grid-cols-4` already, so single-column on mobile is correct. Verify the inline style `display: 'grid', gridTemplateColumns: '1fr'` is not overridden. If it is, remove the override.
    - Pagination row: wrap in `flexWrap: 'wrap'` so "Showing X to Y of Z" doesn't collide with PREV/NEXT on narrow screens.
  </action>
  <verify>
    `npm run build` (or `npx tsc --noEmit`) in `frontend/` produces no TypeScript errors.
    Visually: open `/admin/questions` at 390px wide (iPhone viewport in browser devtools) — question cards render stacked, filters are single-column, pagination wraps cleanly.
  </verify>
  <done>
    Questions page shows readable tappable cards on mobile (no horizontal overflow). Desktop table is unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: Mobile card-list for FlaggedQuestionsTable and full-screen detail panels</name>
  <files>
    frontend/src/pages/admin/components/FlaggedQuestionsTable.tsx
    frontend/src/pages/admin/components/QuestionDetailPanel.tsx
    frontend/src/pages/admin/components/FlagDetailPanel.tsx
  </files>
  <action>
    FlaggedQuestionsTable.tsx — same mobile card-list treatment as Task 1:
    - Below `md` breakpoint, render stacked cards instead of the table.
    - FlaggedQuestionsTable currently uses Tailwind classes (not inline styles). Keep using Tailwind for the card list.
    - Each card shows: question text (2-line clamp), collection, difficulty badge, flag count badge (colored by severity), reason breakdown chips. Tap opens `onQuestionClick`.

    QuestionDetailPanel.tsx — make the slide-in panel full-screen on mobile:
    - The panel is a headlessui `<Dialog>` with a fixed right-side panel. Find the panel container `<div>` that sets `width` (likely `480px` or `max-w-lg`).
    - Add responsive width: on mobile (`< md`) set `width: '100%'`, `maxWidth: '100%'`, `height: '100%'`; on desktop keep the existing side-panel width.
    - Use the same `useWindowSize` hook (already created in Task 1). Do NOT add a new media query system.
    - Ensure the close button (X) is easy to tap: minimum 44x44px touch target.

    FlagDetailPanel.tsx — identical full-screen treatment:
    - Same pattern as QuestionDetailPanel: full-screen width/height on mobile, side-panel on desktop.
    - Confirm close button has adequate touch target.
  </action>
  <verify>
    `npm run build` in `frontend/` produces no TypeScript errors.
    Visually: at 390px wide — Flag Review table shows cards; tapping a card opens a full-screen panel that can be closed with the X button.
  </verify>
  <done>
    Flag Review and Question detail panels are full-screen on mobile. Flag table rows are readable cards. No panels clip off-screen on 390px viewport.
  </done>
</task>

<task type="auto">
  <name>Task 3: Mobile layout fixes for DuplicateReviewPage and FlagReviewPage filters</name>
  <files>
    frontend/src/pages/admin/DuplicateReviewPage.tsx
    frontend/src/pages/admin/FlagReviewPage.tsx
    frontend/src/pages/admin/components/DuplicateClusterCard.tsx
  </files>
  <action>
    DuplicateReviewPage.tsx:
    - Read the page's current filter/toolbar layout. Any multi-column inline-style grid that doesn't already have a single-column mobile fallback needs `gridTemplateColumns: '1fr'` as base with the wider layout applied via the `useWindowSize` hook at `md+`.
    - DuplicateClusterCard already renders as a card (not a table), so it should be mostly mobile-friendly. Audit it: check if any row inside the card uses fixed widths or flex rows that overflow on narrow screens. If so, switch those rows to `flexWrap: 'wrap'` with `gap`.
    - The undo toast is `position: fixed, bottom: 24px, right: 24px` — on very narrow screens it may overlap content. Change its width to `calc(100% - 32px)` with `left: 16px, right: 16px` on mobile and revert to auto/right-aligned on desktop.

    FlagReviewPage.tsx:
    - The tab bar (headlessui `<TabList>`) and filter row (collection select + sort) need to be verified at mobile widths. If the tab list forces a single wide row, add `flexWrap: 'wrap'` or reduce tab label font size at mobile breakpoint.
    - The collection filter `<select>` should be full-width on mobile (already likely `w-full` or similar — verify).
    - Pagination: same `flexWrap: 'wrap'` fix as QuestionsPage.
  </action>
  <verify>
    `npm run build` in `frontend/` produces no TypeScript errors.
    Visually at 390px: Duplicate Review page shows cluster cards without horizontal overflow; tab bar wraps or scrolls cleanly; undo toast doesn't clip content.
  </verify>
  <done>
    DuplicateReviewPage and FlagReviewPage are usable on mobile. No layout elements overflow the viewport.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Mobile-responsive admin panel: card-list views for Questions and Flags tables, full-screen detail panels on mobile, and layout fixes for Duplicate and Flag Review pages.
  </what-built>
  <how-to-verify>
    1. Open Chrome DevTools, enable device toolbar, select iPhone 12 Pro (390px wide).
    2. Navigate to `/admin/questions` — confirm: question cards stack vertically, filters are single-column, pagination wraps.
    3. Tap a question — confirm: detail panel opens full-screen (not a partial slide-in).
    4. Navigate to `/admin/flags` — confirm: flagged question cards render without horizontal scroll.
    5. Tap a flag — confirm: flag detail panel opens full-screen.
    6. Navigate to `/admin/duplicates` — confirm: cluster cards fit the viewport, undo toast doesn't block content.
    7. Switch back to desktop (1280px) — confirm: tables, side panels, and layouts are unchanged from before this change.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` in `frontend/` with zero TypeScript errors
- All admin pages functional on 390px viewport (no horizontal overflow, no clipped panels)
- Desktop behavior unchanged
</verification>

<success_criteria>
Admin can open any section of the admin panel on a phone and complete core tasks (read questions, open detail, review flags, browse duplicates) without pinching/zooming or horizontal scrolling. Desktop experience is identical to pre-change.
</success_criteria>

<output>
After completion, create `.planning/quick/025-mobile-friendly-admin-panel/025-SUMMARY.md`
</output>
