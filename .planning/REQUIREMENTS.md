# Requirements: v1.6 Content Quality & Scale

**Defined:** 2026-02-22
**Core Value:** Make civic learning fun through game show mechanics — play, not study

## v1.6 Requirements

Requirements for content deduplication and scaling all collections to 90+ unique questions.

### Deduplication

- [x] **DEDUP-01**: Semantic duplicate detection using embeddings identifies question pairs testing the same fact with different wording
- [x] **DEDUP-02**: Cross-collection duplicate scanning detects shared questions across all 6 collection JSON files
- [x] **DEDUP-03**: Duplicate report generated with grouped pairs/clusters, similarity scores, and recommended action (keep/archive)
- [ ] **DEDUP-04**: Manual review workflow allows human to approve/reject duplicate findings before archival
- [ ] **DEDUP-05**: Answer leakage detection flags questions where one question's text contains another's answer
- [ ] **DEDUP-06**: Same-source factoid clustering identifies questions mined from the same sentence/paragraph whose explanations reveal each other's answers
- [ ] **DEDUP-07**: Inverse duplicate detection catches complementary question pairs (Q1 gives office, asks date; Q2 gives date, asks office)
- [ ] **DEDUP-08**: Cross-collection hierarchy policy defined and applied (which state-level facts are acceptable in city collections — decided during implementation based on actual duplicates found)

### Content Generation

- [ ] **GEN-01**: All 5 non-Federal collections reach 90+ unique questions after dedup and generation
- [ ] **GEN-02**: Semantic dedup check integrated into generation pipeline to prevent creating duplicates of existing questions
- [ ] **GEN-03**: All new questions pass existing 8 quality rules with no blocking violations
- [ ] **GEN-04**: Source diversity enforced — no single webpage sources more than 15% of a collection's questions
- [ ] **GEN-05**: Difficulty distribution maintained across each collection (target: ~30% easy, ~40% medium, ~30% hard)
- [ ] **GEN-06**: Topic distribution balanced — all topic categories for each collection have adequate representation (minimum 10 questions per topic)

### Data Cleanup

- [ ] **DATA-01**: Duplicate questions archived from existing collections (removed from JSON files, archived in database)
- [ ] **DATA-02**: Updated JSON source files with duplicates removed and new questions added
- [ ] **DATA-03**: All updated collections re-seeded to database with correct status (active)
- [ ] **DATA-04**: Federal collection audited for duplicates (already at 117, but verify quality)

## Future Requirements

Deferred to later milestones.

- **DEDUP-F1**: Persistent embedding store for ongoing duplicate detection during admin question editing
- **DEDUP-F2**: Real-time duplicate warning in admin question editor
- **GEN-F1**: Auto-difficulty calibration based on telemetry data (encounter_count/correct_count)
- **GEN-F2**: Admin UI for triggering content generation runs

## Out of Scope

| Feature | Reason |
|---------|--------|
| pgvector / vector database | Overkill for one-time audit of ~700 questions; in-memory sufficient |
| Fully automated duplicate removal | Research consensus: human review mandatory for educational content |
| Zero-duplicate target | Accept <5% near-duplicate rate; perfection is counterproductive |
| LangChain or heavy AI frameworks | Simple OpenAI embedding calls sufficient; avoid abstraction overhead |
| Production schema changes for embeddings | Embeddings used in tooling only, not runtime queries |
| New question types (numeric, image) | Content scaling only, not format changes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEDUP-01 | Phase 31 | Pending |
| DEDUP-02 | Phase 31 | Pending |
| DEDUP-03 | Phase 31 | Pending |
| DEDUP-04 | Phase 32 | Pending |
| DEDUP-05 | Phase 32 | Pending |
| DEDUP-06 | Phase 32 | Pending |
| DEDUP-07 | Phase 32 | Pending |
| DEDUP-08 | Phase 32 | Pending |
| GEN-01 | Phase 34 | Pending |
| GEN-02 | Phase 33 | Pending |
| GEN-03 | Phase 33 | Pending |
| GEN-04 | Phase 33 | Pending |
| GEN-05 | Phase 33 | Pending |
| GEN-06 | Phase 33 | Pending |
| DATA-01 | Phase 32 | Pending |
| DATA-02 | Phase 34 | Pending |
| DATA-03 | Phase 34 | Pending |
| DATA-04 | Phase 32 | Pending |

**Coverage:**
- v1.6 requirements: 18 total
- Mapped to phases: 18 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
