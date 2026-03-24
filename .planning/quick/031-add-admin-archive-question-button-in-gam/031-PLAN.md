---
phase: quick-031
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/admin.ts
  - frontend/src/features/game/components/AdminArchiveButton.tsx
  - frontend/src/features/game/components/AdminArchiveModal.tsx
  - frontend/src/features/game/components/GameScreen.tsx
  - frontend/src/pages/Game.tsx
autonomous: true

must_haves:
  truths:
    - "Admin users see a discrete archive button on the question card during the reveal phase"
    - "Non-admin users never see the archive button"
    - "Clicking archive opens a modal where admin can type a verdict/reason"
    - "Submitting the modal archives the question and records the verdict note"
    - "The archived question's expirationHistory includes the verdict and archiving admin's user ID"
  artifacts:
    - path: "backend/src/routes/admin.ts"
      provides: "Enhanced archive endpoint accepting verdict note"
      contains: "verdict"
    - path: "frontend/src/features/game/components/AdminArchiveButton.tsx"
      provides: "Discrete archive button component for admin users"
    - path: "frontend/src/features/game/components/AdminArchiveModal.tsx"
      provides: "Modal dialog for entering archive verdict/reason"
    - path: "frontend/src/features/game/components/GameScreen.tsx"
      provides: "Renders AdminArchiveButton during reveal phase for admins"
  key_links:
    - from: "frontend/src/features/game/components/AdminArchiveButton.tsx"
      to: "/api/admin/questions/:id/archive"
      via: "fetch POST with Bearer token"
      pattern: "fetch.*api/admin.*archive"
    - from: "frontend/src/features/game/components/GameScreen.tsx"
      to: "AdminArchiveButton"
      via: "conditional render on isAdmin && phase === revealing"
      pattern: "isAdmin.*AdminArchiveButton"
---

<objective>
Add a discrete admin-only "Archive" button to the gameplay reveal phase that lets admins instantly archive bad questions with a verdict note explaining why.

Purpose: Enable the two current admins (Chris Andrews, Chris Cantrell) to prune unqualified questions directly during gameplay without switching to the admin panel.

Output: Backend endpoint enhanced with verdict support, new AdminArchiveButton + AdminArchiveModal components, wired into GameScreen during the reveal phase.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/pages/Game.tsx
@frontend/src/features/game/components/GameScreen.tsx
@frontend/src/features/game/components/FlagButton.tsx
@frontend/src/store/authStore.ts
@backend/src/routes/admin.ts (lines 199-239 — existing archive endpoint)
@backend/src/middleware/auth.ts
@frontend/src/types/game.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhance backend archive endpoint with verdict note and external ID lookup</name>
  <files>backend/src/routes/admin.ts</files>
  <action>
Modify the existing `POST /questions/:id/archive` endpoint at line 199 of admin.ts to:

1. Accept an optional `verdict` string and `archivedBy` string in the request body.
2. Include the verdict and archivedBy in the expirationHistory entry:
   ```ts
   const historyEntry = {
     action: 'archived' as const,
     timestamp: new Date().toISOString(),
     verdict: req.body.verdict || null,
     archivedBy: req.userId || null,
   };
   ```

3. Add a NEW companion endpoint `POST /questions/by-external-id/:externalId/archive` that:
   - Accepts `{ verdict?: string }` in the body
   - Looks up the question by `externalId` (text field, not numeric id)
   - Reuses the same archive logic (set status='archived', append history with verdict and req.userId)
   - Returns the updated question
   - This is needed because the game frontend only has the externalId (e.g., "fre-001"), not the numeric DB id

Both endpoints are already behind `requireAuth, requireAdmin` middleware from the router.use() at line 19.

Do NOT touch any other endpoints. Keep changes minimal.
  </action>
  <verify>
Build check: `cd backend && npx tsc --noEmit` passes.
Manual: `curl -X POST http://localhost:3001/api/admin/questions/by-external-id/fre-001/archive -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"verdict":"Outdated info"}'` returns 200 with question having status='archived' and verdict in expirationHistory.
  </verify>
  <done>
Archive endpoint accepts verdict string. New by-external-id variant exists for game flow use. Both record verdict and archivedBy in expirationHistory.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create AdminArchiveButton and AdminArchiveModal components</name>
  <files>
    frontend/src/features/game/components/AdminArchiveButton.tsx
    frontend/src/features/game/components/AdminArchiveModal.tsx
  </files>
  <action>
**AdminArchiveButton.tsx:**
- Small, discrete button positioned similarly to FlagButton (will be placed nearby)
- Props: `{ questionId: string; onArchived: () => void; accessToken: string }`
- Renders a small trash/archive icon (use an inline SVG archive box icon, similar style to FlagButton)
- Muted slate-500 color, p-2 size — not attention-grabbing
- On click: opens the AdminArchiveModal
- Tooltip on hover: "Archive question (admin)"

**AdminArchiveModal.tsx:**
- Props: `{ questionId: string; accessToken: string; onClose: () => void; onArchived: () => void; isOpen: boolean }`
- Fixed overlay modal (dark backdrop, centered white/slate card)
- Content:
  - Title: "Archive Question"
  - Subtitle: "This will remove the question from active play."
  - Textarea for verdict/reason (placeholder: "Why is this question being archived? (optional but helpful)")
  - Two buttons: "Cancel" (secondary) and "Archive" (red/destructive)
- On submit: POST to `${API_URL}/api/admin/questions/by-external-id/${questionId}/archive` with `{ verdict }` and Bearer token
- Show loading state on the Archive button while request is in flight
- On success: call onArchived() callback, close modal, show a brief green "Archived" confirmation (can be a simple state flash on the button itself, or a small toast-like message)
- On error: show inline error message in the modal
- Use Tailwind classes consistent with existing game UI (dark theme: slate-800 bg, slate-200 text)
- Import API_URL from '../../../services/api'
  </action>
  <verify>
Build check: `cd frontend && npx tsc --noEmit` passes.
Visual: Components render correctly when imported (verified in Task 3 integration).
  </verify>
  <done>
AdminArchiveButton renders a discrete archive icon. AdminArchiveModal provides verdict textarea and calls the backend archive endpoint.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire archive button into GameScreen and Game.tsx</name>
  <files>
    frontend/src/features/game/components/GameScreen.tsx
    frontend/src/pages/Game.tsx
  </files>
  <action>
**GameScreen.tsx changes:**

1. Import `AdminArchiveButton` from './AdminArchiveButton'
2. Read `isAdmin` from authStore (already imported): `const isAdmin = useAuthStore((s) => s.isAdmin);`
3. Add a new prop to GameScreenProps: `onArchiveQuestion?: (questionId: string) => void`
4. Next to the existing FlagButton render block (line ~567), add the AdminArchiveButton conditionally:
   ```tsx
   {/* Admin archive button - shown during reveal for admin users */}
   {state.phase === 'revealing' && isAdmin && currentQuestion && accessToken && (
     <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
       <AdminArchiveButton
         questionId={currentQuestion.id}
         onArchived={() => onArchiveQuestion?.(currentQuestion.id)}
         accessToken={accessToken}
       />
     </div>
   )}
   ```
   Note: FlagButton is positioned `right-2`, so place this at `left-2` to avoid overlap.
5. Read accessToken from authStore in GameScreen: `const accessToken = useAuthStore((s) => s.accessToken);`

**Game.tsx changes:**

1. Add state to track archived questions: `const [archivedQuestions, setArchivedQuestions] = useState<Set<string>>(new Set());`
2. Add handler:
   ```ts
   const handleArchiveQuestion = (questionId: string) => {
     setArchivedQuestions(prev => new Set(prev).add(questionId));
   };
   ```
3. Pass `onArchiveQuestion={handleArchiveQuestion}` to `<GameScreen>` component
4. Reset archivedQuestions in the same useEffect that resets flaggedQuestions (line ~70)

The archived state tracking is purely for potential future UI feedback (e.g., showing an "Archived" badge). The actual archive happens in the modal's API call.

NOTE on future work: The user mentioned wanting a 'Dev Role' with limited collection access. That is NOT part of this plan — note it only as a comment in AdminArchiveButton: `// TODO: Future — support Dev Role with per-collection admin access`
  </action>
  <verify>
Build check: `cd frontend && npx tsc --noEmit` passes.
Manual test: Log in as admin, start a game, answer a question. During the reveal phase, verify:
  1. A discrete archive icon appears in the top-left of the question card
  2. Clicking it opens the verdict modal
  3. Typing a reason and clicking "Archive" calls the API and shows confirmation
  4. Non-admin users do NOT see the button
  </verify>
  <done>
Admin users see a discrete archive button during the reveal phase. Clicking it opens a verdict modal. Submitting archives the question via the backend API. Non-admins never see the button.
  </done>
</task>

</tasks>

<verification>
1. `cd backend && npx tsc --noEmit` — backend compiles
2. `cd frontend && npx tsc --noEmit` — frontend compiles
3. Log in as admin user, play a game, verify archive button appears only during reveal phase
4. Log in as non-admin user, play a game, verify archive button does NOT appear
5. Archive a question with a verdict, check the DB: `SELECT status, expiration_history FROM trivia.questions WHERE external_id = 'xxx'` — status is 'archived', history contains verdict and archivedBy UUID
</verification>

<success_criteria>
- Admin-only archive button visible during reveal phase, invisible to non-admins
- Verdict modal allows optional reason text before archiving
- Backend records verdict and admin userId in expirationHistory
- Question status changes to 'archived' in the database
- No visual disruption to normal gameplay flow
- TypeScript compiles cleanly on both frontend and backend
</success_criteria>

<output>
After completion, create `.planning/quick/031-add-admin-archive-question-button-in-gam/031-SUMMARY.md`
</output>
