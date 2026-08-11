---
phase: quick-021
plan: 01
subsystem: infra
tags: [serve, vite, spa, react-router, render, deployment, routing]

# Dependency graph
requires: []
provides:
  - serve ^14.2.4 production dependency in frontend/package.json
  - npm start script running serve -s dist -l 10000 for SPA fallback
  - Direct URL and page refresh support for all frontend routes on Render
affects: [deployment, render-config]

# Tech tracking
tech-stack:
  added: ["serve ^14.2.4"]
  patterns:
    - "serve -s (SPA mode) for Render web service deployments: rewrites all unknown paths to index.html"
    - "Port 10000 as default Render port; serve respects PORT env var override"

key-files:
  created: []
  modified:
    - frontend/package.json

key-decisions:
  - "serve added to dependencies (not devDependencies) so it is available in Render's production build"
  - "Port 10000 set as default to match Render's expected port for web services"
  - "_redirects left unchanged — useful if frontend ever moves to Render Static Site"
  - "vite preview script left unchanged — used for local preview only, not production"

patterns-established:
  - "Render web service SPA deployments use npm start → serve -s dist pattern"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Quick Task 021: Fix SPA Routing — Direct URL / Refresh Summary

**Added serve ^14.2.4 with SPA fallback (-s) to frontend start script so Render serves index.html for all routes, fixing 404 on direct URL entry and page refresh**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-27T03:39:36Z
- **Completed:** 2026-02-27T03:41:26Z
- **Tasks:** 1 executed (+ 1 human-verify checkpoint documented below)
- **Files modified:** 2 (package.json, package-lock.json)

## Accomplishments

- Added `serve ^14.2.4` to production dependencies in `frontend/package.json`
- Added `"start": "serve -s dist -l 10000"` script so Render's `npm start` command uses SPA mode
- Verified locally: `serve -s dist` returns HTTP 200 for `/play` (and all unknown routes) instead of 404
- Build succeeds (`npm run build` clean)
- `npm install` completes cleanly with serve in node_modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Add serve dependency and start script to package.json** - `f86abda` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `frontend/package.json` - Added `serve ^14.2.4` to dependencies; added `"start": "serve -s dist -l 10000"` to scripts
- `frontend/package-lock.json` - Updated lockfile after `npm install`

## Decisions Made

- `serve` goes in `dependencies` (not `devDependencies`) — Render's production environment must have it available at runtime when executing `npm start`
- Port 10000 is Render's default for web services; `serve` also auto-respects the `PORT` env var if Render sets it
- Left `"preview": "vite preview"` unchanged — local-only script, no SPA fallback needed there
- Left `frontend/public/_redirects` unchanged — Netlify/Render Static Site style redirect file; harmless and useful if deployment model changes

## Human Checkpoint: Production Verification Required

The plan included a `checkpoint:human-verify` gate. Per execution constraints this is documented here rather than blocking.

**What was built:** `serve -s dist -l 10000` start script in package.json.

**What the user needs to do to verify:**

1. Push the committed changes to GitHub (Render auto-deploys on push)
2. Verify Render's Start Command is `npm start` — check Render dashboard > frontend service > Settings > Start Command
   - If it shows something other than `npm start` (e.g., `npm run preview` or a custom command), change it to `npm start`
3. Wait for Render to finish redeployment
4. Test these URLs directly in the browser (no navigation from root — go directly):
   - https://ctc.empowered.vote/play — should load the game
   - https://ctc.empowered.vote/admin — should load admin
   - https://ctc.empowered.vote/elections — should load elections
5. On each of those routes, hit browser Refresh — should reload correctly (not 404)
6. Confirm https://ctc.empowered.vote/ (root) still works

**Expected outcome:** All routes return the React app. API routes (/api/*) are proxied at the Render service level and are not affected by `serve`.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. `npm install`, `npm run build`, and local SPA routing test all succeeded on first run.

## Next Phase Readiness

- Package.json change is committed and ready to push
- Once deployed, all SPA routes will work with direct URL entry and page refresh
- No further code changes needed — this is a deployment configuration fix only

---
*Phase: quick-021*
*Completed: 2026-02-26*
