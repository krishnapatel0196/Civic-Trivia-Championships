---
phase: quick
plan: 020
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/public/images/noun-tap-8166713-03B9D2.svg  # git add (already exists, just untracked)
  - frontend/src/features/game/components/AnswerGrid.tsx
autonomous: true

must_haves:
  truths:
    - "Tap hint SVG loads without 404 during answer reveal phase"
    - "No console errors related to noun-tap SVG or play resource"
    - "Pulsing tap hint animation displays correctly after answer reveal"
  artifacts:
    - path: "frontend/public/images/noun-tap-8166713-03B9D2.svg"
      provides: "Tap hint icon SVG"
      committed: true
  key_links:
    - from: "frontend/src/features/game/components/AnswerGrid.tsx"
      to: "frontend/public/images/noun-tap-8166713-03B9D2.svg"
      via: "img src attribute at line 247"
      pattern: 'src="/images/noun-tap-8166713-03B9D2.svg"'
---

<objective>
Fix 404 errors for the pulsing tap hint SVG icon shown during the game answer reveal phase.

Purpose: The tap hint SVG was added in commits 776a6e2 and b052de4 but the SVG file itself was never committed to git -- it exists only as an untracked file. This causes 404s in any deployed environment and potentially in local dev depending on server state.

Output: SVG committed to repo; confirm path reference is correct; no more 404 console errors.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/features/game/components/AnswerGrid.tsx
@frontend/public/images/noun-tap-8166713-03B9D2.svg
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commit the untracked tap hint SVG and verify path</name>
  <files>
    frontend/public/images/noun-tap-8166713-03B9D2.svg
    frontend/src/features/game/components/AnswerGrid.tsx
  </files>
  <action>
    1. Verify the SVG file exists at `frontend/public/images/noun-tap-8166713-03B9D2.svg` and contains valid SVG content (it does -- confirmed during investigation).

    2. Verify the img src in `AnswerGrid.tsx` line 247 uses the path `/images/noun-tap-8166713-03B9D2.svg` which correctly maps to `frontend/public/images/noun-tap-8166713-03B9D2.svg` via Vite's public directory serving. The path is correct -- no code change needed.

    3. Stage and commit the SVG file:
       ```
       git add frontend/public/images/noun-tap-8166713-03B9D2.svg
       git commit -m "fix(game): commit tap hint SVG that was missing from repo"
       ```

    4. Investigate the "play:1 Failed to load resource 404" error. This is most likely the browser dev tools showing that the 404 for the SVG was initiated FROM the /play page (the "play:1" notation means "line 1 of the /play document"). Once the SVG 404 is fixed by committing the file, this error should also disappear. If the error persists after fixing the SVG, check whether:
       - There is a stale browser cache or service worker caching an old response
       - The Vite dev server needs a restart to pick up the newly committed file
       - There is an actual separate resource named "play" being requested (unlikely based on codebase grep)

    NOTE on the 401 error: The "401" error listed in the bug report is likely an auth-related API call (e.g., fetching user profile when not logged in) and is unrelated to the SVG/play 404 issues. Do NOT attempt to fix it in this plan unless investigation reveals it is directly connected to the tap hint feature.
  </action>
  <verify>
    - `git status` shows noun-tap-8166713-03B9D2.svg is no longer untracked
    - `git log --oneline -1` shows the commit for the SVG file
    - `ls -la frontend/public/images/noun-tap-8166713-03B9D2.svg` confirms file exists
    - Open the game at /play, answer a question, and during the reveal phase confirm the tap hint SVG appears (pulsing icon in bottom-right corner) with no 404 in browser console
  </verify>
  <done>
    The tap hint SVG file is committed to the repository. The /images/noun-tap-8166713-03B9D2.svg path resolves correctly in both dev and deployed environments. No 404 errors appear in the browser console when the tap hint is displayed during answer reveal.
  </done>
</task>

</tasks>

<verification>
- Browser console shows zero 404 errors for noun-tap-8166713-03B9D2.svg when playing a game through answer reveal
- The pulsing tap hint icon is visible in the bottom-right corner during the reveal phase
- `git status` shows the SVG file is tracked and committed
</verification>

<success_criteria>
- SVG file committed to git (no longer untracked)
- Zero 404 console errors related to tap hint SVG or "play" resource during gameplay
- Tap hint animation works as designed (fades in after 1s, pulses after 1.6s)
</success_criteria>

<output>
After completion, create `.planning/quick/020-fix-pulsing-tap-icon-404-svg-and-play-re/020-SUMMARY.md`
</output>
