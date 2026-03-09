# Requirements: Civic Trivia Championship

**Defined:** 2026-03-09
**Milestone:** v2.1 Collection Excellence
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## v2.1 Requirements

### Content

- [ ] **CONTENT-01**: Portland, OR city collection scaffolded, generated, curated, and activated
- [ ] **CONTENT-02**: Oregon State collection scaffolded, generated, curated, and activated
- [ ] **CONTENT-03**: Washington, DC collection scaffolded, generated, curated, and activated *(district framing: no voting representation in Congress, DC Council + Mayor structure, voting rights civic angle)*
- [ ] **CONTENT-04**: Biloxi, MS city collection scaffolded, generated, curated, and activated
- [ ] **CONTENT-05**: Mississippi State collection scaffolded, generated, curated, and activated

### Pipeline

- [ ] **PIPELINE-01**: Semantic near-duplicate detection runs automatically inside `generate-locale-questions.ts` (not a separate manual pass after every collection)
- [ ] **PIPELINE-02**: `audit-collection-readiness.ts` warns when a collection has <15% expiring questions before activation (enforces 15–30% target ratio from v2.0 backlog)

### Playbook

- [ ] **PLAYBOOK-01**: `COLLECTION-PLAYBOOK.md` created in `.planning/` as a living document bootstrapped with learnings from Phases 47–52 (v1.9)
- [ ] **PLAYBOOK-02**: Each of the 5 collection phases (58–62) ends with a structured retrospective: what broke, what was fixed, what carry-forward rules were added — playbook updated each time

## Future Requirements

*(None identified for v2.2 yet — retrospective outputs from this milestone will inform next milestone scope)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full automation of collection creation | Requires multiple milestone iterations first; v2.1 builds the foundation |
| Additional collections beyond the 5 specified | Cadence limit — quality over quantity |
| Auto-regeneration of expired questions | v2.0 backlog item; deferred to a future milestone after ratio enforcement lands |
| New game features | Separate concern; collections milestone stays focused on content pipeline |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPELINE-01 | Phase 57 | Complete |
| PIPELINE-02 | Phase 57 | Complete |
| PLAYBOOK-01 | Phase 57 | Complete |
| CONTENT-01 | Phase 58 | Pending |
| PLAYBOOK-02 | Phases 58–62 | Pending |
| CONTENT-02 | Phase 59 | Pending |
| CONTENT-03 | Phase 60 | Pending |
| CONTENT-04 | Phase 61 | Pending |
| CONTENT-05 | Phase 62 | Pending |

**Coverage:**
- v2.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 — traceability updated after roadmap creation*
