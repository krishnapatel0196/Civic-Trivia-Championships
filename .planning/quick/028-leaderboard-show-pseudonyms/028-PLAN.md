---
phase: quick
plan: 028
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/features/leaderboard/components/LeaderboardRow.tsx
  - frontend/src/features/leaderboard/components/LeaderboardPodium.tsx
  - backend/src/routes/leaderboard.ts
autonomous: true

must_haves:
  truths:
    - "All leaderboard entries show pseudonyms (display_name) for every player, not just the current user"
    - "Email addresses are never displayed on the leaderboard (safeUsername already handles this)"
    - "Players without a pseudonym show a fallback label like 'Player' instead of blank space"
  artifacts:
    - path: "frontend/src/features/leaderboard/components/LeaderboardRow.tsx"
      provides: "Shows username for all players, not just isYou"
    - path: "frontend/src/features/leaderboard/components/LeaderboardPodium.tsx"
      provides: "Shows username for all podium entries, not just isYou"
  key_links:
    - from: "LeaderboardRow.tsx"
      to: "entry.username"
      via: "Renders username text for all entries"
      pattern: "entry\\.username"
---

<objective>
Show pseudonyms on the leaderboard for all players, not just the current user.

Purpose: Currently LeaderboardRow and LeaderboardPodium conditionally hide usernames for non-current-user entries (`isYou ? (entry.username || 'You') : ''`). The backend already provides pseudonyms via `connected_profiles.display_name` through `safeUsername()` which strips email addresses. The frontend just needs to display them.

Output: All leaderboard entries show pseudonyms. No emails exposed. Blank pseudonyms get a fallback label.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/leaderboard/components/LeaderboardRow.tsx
@frontend/src/features/leaderboard/components/LeaderboardPodium.tsx
@frontend/src/features/leaderboard/types.ts
@backend/src/routes/leaderboard.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Show pseudonyms for all players in LeaderboardRow and LeaderboardPodium</name>
  <files>
    frontend/src/features/leaderboard/components/LeaderboardRow.tsx
    frontend/src/features/leaderboard/components/LeaderboardPodium.tsx
  </files>
  <action>
In LeaderboardRow.tsx:
- Line 80: Change `{isYou ? (entry.username || 'You') : ''}` to show the username for ALL entries. Use `entry.username || (isYou ? 'You' : 'Player')` as fallback. The `isYou` styling (bold/italic) can remain to highlight the current user's row, but the username text must render for everyone.
- Line 63: Show Avatar for all players, not just `isYou`. Use the generic circle div as fallback only when username is empty (no name to generate initials from). Specifically: always render `<Avatar name={entry.username || 'Player'} size={28} />` regardless of `isYou`. Remove the conditional that shows a blank gray circle for non-you entries.

In LeaderboardPodium.tsx (PodiumCard component):
- Line 104: Change `{isYou ? (entry.username || 'You') : ''}` to show username for ALL entries. Use `entry.username || (isYou ? 'You' : 'Player')` as fallback.
- Line 102: Update the title attribute similarly — show for all entries, not just isYou.
- Line 69-71: Show Avatar for all podium entries, not just `isYou`. Replace the conditional with `<Avatar name={entry.username || 'Player'} size={40} />` for all entries.
- Keep the `isYou` color styling (C.ink vs C.muted) — that visual distinction is still useful.
- Remove the italic fontStyle for non-you entries since they now have real text content. Use `'normal'` for all, or keep italic only when username is empty.
  </action>
  <verify>
Run `cd frontend && npx tsc --noEmit` to confirm no type errors. Visually inspect: `npm run dev` and visit /leaderboard — all rows should show pseudonyms, not blank names.
  </verify>
  <done>Every leaderboard entry (podium and list rows 4-25) displays the player's pseudonym. Current user row still highlighted. No emails visible. Empty pseudonyms show "Player" fallback.</done>
</task>

<task type="auto">
  <name>Task 2: Update backend safeUsername comment to reflect pseudonym reality</name>
  <files>backend/src/routes/leaderboard.ts</files>
  <action>
Update the JSDoc comment on `safeUsername()` (lines 92-97). The current comment says "Until a pseudonym system exists, email-shaped display_names are blanked." The pseudonym system DOES exist — `connected_profiles.display_name` IS the pseudonym (per Empowered platform docs). Update the comment to:

```
/**
 * Returns a safe public pseudonym for display on the leaderboard.
 * Privacy rule: never expose email addresses on a public page.
 * display_name from connected_profiles is the user's chosen pseudonym.
 * Email-shaped values are stripped as a safety net.
 */
```

This is comment-only — no logic change needed. The `safeUsername` function already works correctly.
  </action>
  <verify>Run `cd backend && npx tsc --noEmit` to confirm no type errors (comment-only change, but verify nothing broke).</verify>
  <done>Backend comment accurately reflects that display_name is the pseudonym system.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx tsc --noEmit` — no type errors
2. `cd backend && npx tsc --noEmit` — no type errors
3. Visit /leaderboard on local dev — all entries show pseudonyms, not blank names
4. Current user's row is still visually highlighted
5. No email addresses appear anywhere on the leaderboard
</verification>

<success_criteria>
- All leaderboard entries (podium top 3 + rows 4-25 + sticky you row) show pseudonyms for every player
- Players with blank/missing display_name show "Player" fallback (not empty space)
- Email addresses never appear (safeUsername already handles this, unchanged)
- Current user's row still has visual distinction (highlight, "You" fallback if no pseudonym)
- TypeScript compiles cleanly in both frontend and backend
</success_criteria>

<output>
After completion, create `.planning/quick/028-leaderboard-show-pseudonyms/028-SUMMARY.md`
</output>
