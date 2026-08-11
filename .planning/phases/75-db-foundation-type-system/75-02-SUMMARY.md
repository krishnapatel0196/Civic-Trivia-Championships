---
phase: 75
plan: 02
subsystem: type-system
tags: [typescript, collections, international, types, cron]
one-liner: "Extended TypeScript type system to support international tier across full stack — backend, scaffold CLI, cron guard, and frontend"

dependency-graph:
  requires: []
  provides:
    - CollectionTier includes 'international' with TIER_RANK 0
    - scaffold-collection.ts --tier international accepted
    - InternationalLocaleConfig interface exported from bloomington-in.ts
    - replacementGenerator.ts skips international collections
    - Frontend CollectionSummary.tier includes 'international'
  affects:
    - Phase 77 (RSS pipeline — consumes InternationalLocaleConfig)
    - Phase 76 (UI — frontend type already updated)
    - Phase 78 (admin tools — scaffold CLI already supports international)
    - Phase 79 (launch collections — replacementGenerator guard already in place)

tech-stack:
  added: []
  patterns:
    - Tier rank 0 pattern for international (never blocks domestic dedup)
    - RSS pipeline guard in cron (skip replacement generation for international)

key-files:
  created: []
  modified:
    - backend/src/services/embeddings/types.ts
    - backend/src/scripts/scaffold-collection.ts
    - frontend/src/features/collections/types.ts
    - backend/src/scripts/content-generation/locale-configs/bloomington-in.ts
    - backend/src/cron/replacementGenerator.ts

decisions:
  - title: "TIER_RANK for international set to 0"
    rationale: "Rank 0 means international never blocks dedup of domestic tiers. CollectionHierarchy.isParentOrSame() uses higher rank to block lower — rank 0 is correct because international content should never prevent domestic question generation."
  - title: "InternationalLocaleConfig placed in bloomington-in.ts"
    rationale: "bloomington-in.ts is the canonical location for all locale config type interfaces (LocaleConfig, OfficeholderEntry, etc.). Phase 77 RSS pipeline will import from this file."
  - title: "Replacement guard placed before tryLoadLocaleConfig"
    rationale: "Guard must fire before the expensive locale config load to avoid unnecessary file I/O. International collections have no locale config file so they would fall through to no-locale-config reason anyway, but the explicit guard makes intent clear and fires early."
  - title: "deriveIconIdentifier returns 'globe' for international"
    rationale: "Consistent with UI icon system conventions. International collections are not tied to a country flag."
  - title: "CollectionPicker.tsx not updated in this plan"
    rationale: "Per plan spec: getCategory() already has a 'local' fallthrough for unknown tiers. International collections will render in Local section until Phase 76 adds the proper International section. No international collections exist yet, so this is a safe deferral."

metrics:
  duration: "~3 minutes"
  completed: "2026-04-09"
  tasks-completed: 2
  tasks-total: 2
---

# Phase 75 Plan 02: Type System — International Tier Support Summary

Extended the TypeScript type system to support the International tier across the full stack — backend types, scaffold CLI, cron guard, locale config interface, and frontend types.

## What Was Built

### Task 1: CollectionTier, TIER_RANK, scaffold CLI, frontend type

**`backend/src/services/embeddings/types.ts`**
- `CollectionTier` union extended: `'federal' | 'state' | 'city' | 'international'`
- `TIER_RANK` record extended: `international: 0` (rank 0 never blocks domestic dedup)

**`backend/src/scripts/scaffold-collection.ts`**
- `validTiers` array includes `'international'`
- Help text updated: `city | state | federal | international`
- `deriveIconIdentifier()` returns `'globe'` for international tier (before city fallthrough)

**`frontend/src/features/collections/types.ts`**
- `CollectionSummary.tier` union: `'federal' | 'state' | 'city' | 'international'`

### Task 2: InternationalLocaleConfig interface and replacement generator guard

**`backend/src/scripts/content-generation/locale-configs/bloomington-in.ts`**
- Exported `InternationalLocaleConfig` interface extending `LocaleConfig` with:
  - `rssFeeds: string[]` — RSS feed URLs replacing sourceUrls for international
  - `confidenceTierDefault: 'high' | 'medium' | 'low'` — default confidence tier
  - `poolFloor: number` — trigger generation below this active question count
  - `poolTarget: number` — stop generating at this target
  - `poolCeiling: number` — archive oldest questions above this hard cap

**`backend/src/cron/replacementGenerator.ts`**
- International skip guard added after null topic guard, before `tryLoadLocaleConfig`
- Queries DB for collection tier; returns `{ replaced: false, reason: 'international-collection-no-replacement' }` when tier is `'international'`

## Commits

| Hash | Description |
|------|-------------|
| `80e262d` | feat(75-02): extend CollectionTier type and scaffold CLI for international tier |
| `3a879f1` | feat(75-02): add InternationalLocaleConfig interface and replacement generator guard |

## Verification

- `cd backend && npx tsc --noEmit` — passes cleanly
- `cd frontend && npx tsc --noEmit` — passes cleanly
- `international` present in: types.ts, scaffold-collection.ts, frontend types.ts, bloomington-in.ts
- `international-collection-no-replacement` guard confirmed in replacementGenerator.ts
- TIER_RANK has exactly 4 entries (federal: 3, state: 2, city: 1, international: 0)

## Deviations from Plan

None — plan executed exactly as written.

## Status

Complete. All success criteria met.
