---
phase: quick-023
plan: 01
subsystem: tooling
tags: [cli, collections, typescript, drizzle-orm, scaffolding]

# Dependency graph
requires:
  - phase: quick-022
    provides: "Research on what it takes to add a new collection"
provides:
  - scaffold-collection CLI: automates 4-step manual process of registering a new collection across source files
  - activate-collection CLI: parameterized DB activation replacing hardcoded activate-collections.ts
affects: [new collection creation workflow, content generation pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual process.argv parsing (no third-party CLI library) — matches existing generate-locale-questions.ts pattern"
    - "String search + splice for file mutation (no AST) — safe for well-structured TypeScript files"
    - "Brace-depth traversal to find closing braces of objects/arrays"

key-files:
  created:
    - backend/src/scripts/scaffold-collection.ts
    - backend/src/scripts/activate-collection.ts
  modified: []

key-decisions:
  - "Used manual process.argv parsing to match project convention — no new dependencies needed"
  - "String search + splice (not regex replace) for file mutations — more predictable with multi-occurrence content"
  - "Brace-depth counter to find exact closing brace of supportedLocales/configKeys/COLLECTION_HIERARCHY — handles any size object"
  - "scaffold-collection creates placeholder locale config with 3 generic topics — developer fills in before generating"
  - "activate-collection uses --dry-run flag to preview before committing DB changes"

patterns-established:
  - "CLI scripts validate all required flags first, exit(1) with clear messages on failure"
  - "Dry-run support: check flag early, print summary of changes, exit(0) before any writes"
  - "File mutation: readFileSync → string manipulation → writeFileSync (sync is fine for one-shot CLI scripts)"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Quick Task 023: Scaffold and Activate Collection CLI Summary

**Two CLI scripts that automate collection management: scaffold-collection.ts writes 4 source files in one command, activate-collection.ts replaces the hardcoded activation script with a parameterized --dry-run-capable version.**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-03-01T07:25:52Z
- **Completed:** 2026-03-01T07:29:52Z
- **Tasks:** 2/2
- **Files modified:** 2 created

## Accomplishments

- `scaffold-collection.ts` automates inserting a seed entry into collections.ts, creating a locale config file, registering the locale in generate-locale-questions.ts, and adding to COLLECTION_HIERARCHY in types.ts — all from one command
- `activate-collection.ts` replaces the hardcoded activate-collections.ts with a parameterized CLI that accepts `--slug` and `--prefix`, counts draft questions before activating, and supports `--dry-run` to preview changes
- Both scripts compile cleanly under project TypeScript config and validate all required inputs with clear error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scaffold-collection CLI** - `add932a` (feat)
2. **Task 2: Create activate-collection CLI** - `6d1748a` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `backend/src/scripts/scaffold-collection.ts` — CLI with 4-step scaffolding: seed entry insertion, locale config creation, generate-locale-questions registration, COLLECTION_HIERARCHY addition
- `backend/src/scripts/activate-collection.ts` — Parameterized activation CLI with dry-run support and draft question counting

## Decisions Made

- **String search + splice, not regex replace** — the file mutations find exact insertion positions using brace-depth traversal. This is more reliable than regex when dealing with multi-occurrence text (e.g. multiple `};` in a file).
- **No new dependencies** — both scripts use only Node.js built-ins (`fs`, `path`) and project-local imports. Manual `process.argv` parsing matches the existing generate-locale-questions.ts pattern.
- **3 placeholder topics in locale config** — the scaffold creates a minimal but valid config. The developer is expected to customize topics and source URLs before running generation. A printed note reminds them.
- **activate-collection warns but continues if collection already active** — non-fatal, in case someone reruns after a partial failure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript's standalone `tsc --noEmit src/scripts/scaffold-collection.ts` flagged `matchAll` iterator usage, but this is a non-issue: the project tsconfig targets ES2022 (which supports iterators natively). The project-level `npx tsc --noEmit` passes with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both scripts are ready to use immediately:

```bash
# Add a new collection in one command:
cd backend
npx tsx src/scripts/scaffold-collection.ts --name "Austin, TX" --slug austin-tx --prefix aut --theme "#7C3AED"

# Preview activation before committing:
npx tsx src/scripts/activate-collection.ts --slug austin-tx --prefix aut --dry-run

# Activate for real:
npx tsx src/scripts/activate-collection.ts --slug austin-tx --prefix aut
```

No blockers.

---
*Quick Task: 023-scaffold-and-activate-collection-cli*
*Completed: 2026-03-01*
