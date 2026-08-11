---
phase: quick-021
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/package.json
autonomous: true

must_haves:
  truths:
    - "Direct URL entry to ctc.empowered.vote/play serves the React app"
    - "Page refresh on any route serves the React app"
    - "API proxy routes still forward to the backend"
    - "Local dev workflow (npm run dev) still works unchanged"
  artifacts:
    - path: "frontend/package.json"
      provides: "serve dependency and start script for SPA fallback"
      contains: "serve"
  key_links:
    - from: "Render start command (npm start)"
      to: "serve -s dist"
      via: "package.json start script"
      pattern: '"start".*serve.*-s.*dist'
---

<objective>
Fix SPA routing on the deployed Render site so that direct URL entry and page refresh
work for all frontend routes (e.g., /play, /admin, /elections).

Purpose: Currently only navigation from the root works. Any direct URL or refresh returns
a 404 or "not found" because the web service does not fall back to index.html for
unknown paths. Adding the `serve` package with its `-s` (single-page) flag provides
SPA fallback when Render runs `npm start`.

Output: Updated frontend/package.json with `serve` as a production dependency and a
new `start` script.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/package.json
@frontend/vite.config.ts
@frontend/public/_redirects
@frontend/src/App.tsx (uses BrowserRouter from react-router-dom)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add serve dependency and start script to package.json</name>
  <files>frontend/package.json</files>
  <action>
Make two changes to frontend/package.json:

1. Add `serve` to `dependencies` (NOT devDependencies -- it must be available in
   production on Render):
   ```
   "serve": "^14.2.4"
   ```

2. Add a `start` script to `scripts`:
   ```
   "start": "serve -s dist -l 10000"
   ```

   The `-s` flag enables SPA mode (rewrites all routes to /index.html).
   The `-l 10000` sets the port to 10000, which is Render's default expected port
   for web services. If Render sets a PORT env var, serve will respect that instead,
   but having a sensible default avoids issues.

   NOTE on the `preview` script: Leave `"preview": "vite preview"` unchanged. The
   `vite preview` command is for local preview only and does NOT need SPA fallback
   because it is not used in production. The `start` script is what Render will use.

   NOTE on `_redirects`: Leave `frontend/public/_redirects` in place. It does no harm
   and would be useful if the frontend is ever moved to a Render Static Site.
  </action>
  <verify>
Run these commands from the frontend directory:
1. `cat package.json | grep -A1 '"start"'` -- confirms start script exists with serve -s
2. `cat package.json | grep '"serve"'` -- confirms serve is in dependencies
3. `npm install` -- confirms serve installs without errors
4. `npm run build && npx serve -s dist -l 4444 &` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:4444/play` -- should return 200 (not 404)
  </verify>
  <done>
frontend/package.json has `serve` in dependencies and a `start` script that runs
`serve -s dist -l 10000`. Running `serve -s dist` locally confirms that hitting
/play returns 200 with index.html content.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Added the `serve` package and a `start` script to frontend/package.json so that
Render's web service can serve the SPA with proper fallback routing.
  </what-built>
  <how-to-verify>
1. Commit and push the changes
2. Wait for Render to redeploy (it should auto-deploy on push)
3. If Render's start command is `npm start`, it will now use `serve -s dist`
4. Test these URLs directly in your browser:
   - https://ctc.empowered.vote/play -- should load the game
   - https://ctc.empowered.vote/admin -- should load admin
   - https://ctc.empowered.vote/elections -- should load elections
5. Test page refresh on any of those routes -- should reload correctly
6. Test that the root https://ctc.empowered.vote/ still works

If Render's start command is something OTHER than `npm start` (e.g., `npm run preview`
or a custom command), you will need to change it to `npm start` in the Render dashboard
(Settings > Start Command).
  </how-to-verify>
  <resume-signal>Type "approved" if SPA routing works on all routes, or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npm install` succeeds with serve in node_modules
- `npm run build` still works
- Local test: `npx serve -s dist` serves index.html for unknown routes (200, not 404)
- After deploy: direct URL access and page refresh work for /play, /admin, /elections
</verification>

<success_criteria>
- Direct URL entry to any frontend route on ctc.empowered.vote returns the React app
- Page refresh on any route returns the React app
- API routes (/api/*) still proxy to the backend (serve does not interfere; API proxy
  is handled at the Render service level, not by serve)
- Local dev workflow (npm run dev) is unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/021-fix-spa-routing-direct-url-refresh/021-SUMMARY.md`
</output>
