---
phase: 39-election-pipeline-collection-hardening
verified: 2026-02-27T05:19:44Z
status: passed
score: 6/6 must-haves verified
gaps: []
---

# Phase 39: Election Pipeline Collection Hardening -- Verification Report

**Phase Goal:** Close three operational risks in the election pipeline identified by the v1.7 audit: (1) jurisdiction dropdown missing sparse collections due to 50-question floor, (2) no DB validation of jurisdiction on race creation, (3) regenerate cannot target a renamed collection.

**Verified:** 2026-02-27T05:19:44Z
**Status:** passed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/admin/collections returns all collections without a question-count floor or is_active filter | VERIFIED | admin.ts line 631: no WHERE clause, selects id/name/slug/isActive, orders by sortOrder only |
| 2 | A collection with 0 active questions appears in the ElectionsPage jurisdiction dropdown | VERIFIED | GET /collections has no question-count filter; ElectionsPage.tsx line 108 fetches from /api/admin/collections |
| 3 | POST /election-races returns 400 with descriptive error when jurisdiction does not match any collections.name | VERIFIED | admin.ts lines 1539-1548: eq(collections.name, jurisdiction) lookup before insert; 400 with attempted name |
| 4 | POST /election-races/:id/regenerate accepts optional collectionSlug in request body | VERIFIED | admin.ts lines 1712-1739: overrideSlug from req.body?.collectionSlug; slug path DB-validated with 400 on miss |
| 5 | POST /election-races/:id/regenerate falls back to name-based lookup when collectionSlug absent | VERIFIED | admin.ts lines 1728-1738: else branch resolves via eq(collections.name, race.jurisdiction) with 400 on miss |
| 6 | POST /election-races/:id/regenerate returns 400 if provided collectionSlug does not match any collection | VERIFIED | admin.ts lines 1724-1725: if (!collectionBySlug) return res.status(400).json() with descriptive error |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| backend/src/routes/admin.ts | GET /collections, jurisdiction validation, collectionSlug override | VERIFIED | File exists, 1800+ lines, all three features implemented and substantive |
| frontend/src/pages/admin/ElectionsPage.tsx | Fetches from /api/admin/collections with auth header | VERIFIED | Fetch at line 108 uses /api/admin/collections with Authorization: Bearer header |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| frontend/src/pages/admin/ElectionsPage.tsx | backend/src/routes/admin.ts | GET /api/admin/collections | WIRED | Line 108: fetch with Authorization Bearer accessToken header |
| backend/src/routes/admin.ts | backend/src/db/schema.ts | collections table jurisdiction check | WIRED | Lines 1542, 1722, 1733: eq() lookups against collections table |

---

### Route Ordering Verification

GET /collections is registered at line 631 in admin.ts.
GET /collections/health is registered at line 657 in admin.ts.
The general route is defined before the specific route -- no Express route shadowing risk.

---

### Anti-Patterns Found

None. No TODO/FIXME, no placeholder returns, no stub patterns found in the modified sections.

---

### Human Verification Required

None. All three operational risks are verifiable structurally:

1. The GET /collections route has no WHERE or HAVING clause -- confirmed by direct code read.
2. The 400-with-message pattern is explicit in the handler code.
3. The optional-chaining guard and both code paths are readable directly.

---

## Detailed Verification Notes

### Truths 1 and 2: Admin collections endpoint (no question-count floor)

File: backend/src/routes/admin.ts lines 626-647

The route selects id, name, slug, isActive from collections ordered by sortOrder.
No WHERE clause. No HAVING clause. No subquery counting active questions.
Returns every row in the collections table. Response shape: { collections: [...] }.

The game endpoint (game.ts) applies a HAVING clause requiring 50+ active questions.
The admin route has no such restriction -- collections with 0 active questions are returned.

### Truth 3: Jurisdiction validation on POST /election-races

File: backend/src/routes/admin.ts lines 1538-1549

After Zod parses the request body (line 1531) and jurisdiction is destructured (line 1536),
the handler does: eq(collections.name, jurisdiction) with .limit(1).
If no match: HTTP 400 with error message including the attempted jurisdiction name.
The db.insert(electionRaces) call only runs if matchedCollection is truthy (line 1551).

### Truths 4, 5, and 6: collectionSlug override on POST /election-races/:id/regenerate

File: backend/src/routes/admin.ts lines 1712-1739

Line 1713: overrideSlug extracted via typeof check on req.body?.collectionSlug
Override branch (lines 1717-1727): eq(collections.slug, overrideSlug) -- returns 400 if miss
Fallback branch (lines 1728-1738): eq(collections.name, race.jurisdiction) -- returns 400 if miss
collectionSlug declared as let (line 1715), assigned in both branches before line 1790.

### ElectionsPage frontend change

File: frontend/src/pages/admin/ElectionsPage.tsx lines 106-114

- Fetches from /api/admin/collections (grep for api/game/collections: NOT FOUND)
- Authorization: Bearer accessToken header at line 109
- Guard at line 107: if (!accessToken) return
- Dependency array: [accessToken] at line 114
- Response: data.collections ?? [] matching admin endpoint shape

---

_Verified: 2026-02-27T05:19:44Z_
_Verifier: Claude (gsd-verifier)_
