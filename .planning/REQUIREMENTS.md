# Requirements: Civic Trivia Championship

**Defined:** 2026-03-01
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## v1.9 Requirements

Requirements for the Geographic Expansion milestone. Phases start at 47.

### Infrastructure

- [ ] **INFRA-01**: Collection hierarchy tier data sourced from database at runtime, not hardcoded TypeScript map in embeddings/types.ts
- [ ] **INFRA-02**: State collection configs registered in standard `generate-locale-questions.ts` workflow (state-configs/ gap closed; state collections can be generated via --locale flag like city collections)

### Activate Banked Collections

- [x] **ACT-01**: Fremont, CA collection is active and playable in production (is_active = true, ≥50 active questions visible via collections API)
- [x] **ACT-02**: Norwich, England collection is active and playable in production (is_active = true, ≥50 active questions visible via collections API)

### Cambridge, MA Collection

- [ ] **CAMB-01**: Cambridge, MA collection scaffolded — seed row inserted, locale config created with Cambridge-specific topics and source URLs, registered in generator, added to hierarchy
- [ ] **CAMB-02**: Cambridge, MA has ≥50 active questions covering local civic topics (city government, Harvard/MIT civic context, housing policy, Cambridge City Council, elections)
- [ ] **CAMB-03**: Cambridge, MA collection card visible and playable in production with banner image

### Massachusetts State Collection

- [ ] **MASS-01**: Massachusetts State collection scaffolded — seed row, locale config, generator registration, hierarchy entry
- [ ] **MASS-02**: Massachusetts State has ≥50 active questions covering state civic topics (state legislature, governor, constitutional history, public policy, civic landmarks)
- [ ] **MASS-03**: Massachusetts State collection active and playable in production

### Plano, TX Collection

- [ ] **PLAN-01**: Plano, TX collection scaffolded — seed row, locale config, generator registration, hierarchy entry
- [ ] **PLAN-02**: Plano, TX has ≥50 active questions covering local civic topics (city government, Collin County, city services, local history, elections)
- [ ] **PLAN-03**: Plano, TX collection active and playable in production with banner image

### Texas State Collection

- [ ] **TEX-01**: Texas State collection scaffolded — seed row, locale config, generator registration, hierarchy entry
- [ ] **TEX-02**: Texas State has ≥50 active questions covering state civic topics (legislature, governor, constitutional history, public policy, civic landmarks)
- [ ] **TEX-03**: Texas State collection active and playable in production

## Future Requirements

### Additional Locales (v2.0+)

- Additional US cities and states as platform grows
- International collections beyond Norwich (UK, Canada, Australia)
- Location-based auto-assignment of collections (needs more collections first)

## Out of Scope

| Feature | Reason |
|---------|---------|
| Collection search/browse | Not enough collections yet to need search |
| Admin UI for collection creation | CLI tools (scaffold-collection.ts) are sufficient for now |
| Automated banner image generation | Human-curated images maintain quality |
| International collections beyond Norwich | Focus on US expansion first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 47 | Complete |
| INFRA-02 | Phase 47 | Complete |
| ACT-01 | Phase 48 | Complete |
| ACT-02 | Phase 48 | Complete |
| CAMB-01 | Phase 49 | Pending |
| CAMB-02 | Phase 49 | Pending |
| CAMB-03 | Phase 49 | Pending |
| MASS-01 | Phase 50 | Pending |
| MASS-02 | Phase 50 | Pending |
| MASS-03 | Phase 50 | Pending |
| PLAN-01 | Phase 51 | Pending |
| PLAN-02 | Phase 51 | Pending |
| PLAN-03 | Phase 51 | Pending |
| TEX-01 | Phase 52 | Pending |
| TEX-02 | Phase 52 | Pending |
| TEX-03 | Phase 52 | Pending |

**Coverage:**
- v1.9 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
