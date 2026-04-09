# Requirements: Civic Trivia Championship

**Defined:** 2026-04-08
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## v2.5 Requirements — International Collections

### Pipeline (Daily AI News Generation)

- [ ] **PIPE-01**: System ingests RSS feeds daily from curated Tier 2 sources (BBC World, NPR, The Guardian, DW) with per-feed error isolation — a single bad or malformed feed does not abort the batch
- [ ] **PIPE-02**: System extracts article content using RSS-body-first strategy (`<content:encoded>` primary, HTTP fallback) with 300-word minimum gate; articles below threshold are skipped
- [ ] **PIPE-03**: System deduplicates stories before Claude generation — the same news event covered by multiple sources generates at most one question cluster per run
- [ ] **PIPE-04**: System generates MCQ questions via Claude with quality gate where partisan framing is a blocking rule (not advisory) for International content; questions failing the gate are queued for admin review (draft status); passing questions are published active
- [ ] **PIPE-05**: System regulates pool size per International collection: target 40–80 active questions; daily generation capped at 8 questions per collection per run; expiry duration 3–14 days based on per-question volatility classification (`fast`/`medium`/`slow`/`stable`) assigned at generation time
- [ ] **PIPE-06**: System logs each pipeline run to `generation_jobs` table recording collection, status, questions generated/flagged/activated, and timestamp

### International Tier

- [x] **INTL-01**: Collection picker has an "International" section alongside Federal/State/City; International collection cards display a freshness indicator ("Updated X hours ago")
- [x] **INTL-02**: `scaffold-collection.ts` supports `--tier international` flag; `InternationalLocaleConfig` interface defined
- [ ] **INTL-03**: War in Iran collection — live at launch with a minimum 15 active questions; fast expiry (3–5 days); sourced from BBC/NPR/UN
- [ ] **INTL-04**: Climate Agreements collection — live at launch with a minimum 15 active questions; medium expiry (7–14 days); sourced from BBC/The Guardian/UNFCCC

### Admin Tooling

- [ ] **ADMIN-01**: Admin can view pipeline job history showing date, collection, and counts (generated/flagged/activated) per run
- [ ] **ADMIN-02**: Admin dashboard shows active question count per International collection with a warning indicator when count falls below 20
- [ ] **ADMIN-03**: Admin dashboard shows pending review count for International draft questions; pipeline auto-throttles (skips generation for that collection) when pending review count exceeds 20

---

## v2.6 Requirements (Deferred)

### Player Experience

- **PLAY-01**: Player can Pause (mute) any International collection — well-being framed; muted collections stay visible with "Paused" pill; one-tap restore
- **PLAY-02**: Muted collections are excluded from player's question feed for the duration of the mute
- **PLAY-03**: Mute preferences persist across sessions (stored server-side in `user_collection_mutes` table)

### International Tier (Future)

- **INTL-05**: Concluded topic collections display a "Concluded" visual state rather than being archived or hidden
- **INTL-06**: Expired questions are accessible in a historical archive mode (admin-only or public-facing browsable view)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Collection-level Pause/mute | Deferred to v2.6 — launch tier first, build well-being controls once International is proven |
| Transparency log (public pipeline history) | Future milestone — powerful feature, low priority for launch |
| Regional variants (EU-specific content, language variants) | Same content globally for now — scope decision from design doc |
| Player-suggested topics | Requires editorial workflow; defer until tier is established |
| Fully automated publish (no admin gate) | Safety boundary — AI-generated news content must have human review path |
| `fact_snapshot` browsable archive | Future milestone — store the field now, surface it later |
| Score/streak normalization for muted collections | Deferred with muting to v2.6 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 77 | Pending |
| PIPE-02 | Phase 77 | Pending |
| PIPE-03 | Phase 77 | Pending |
| PIPE-04 | Phase 77 | Pending |
| PIPE-05 | Phase 78 | Pending |
| PIPE-06 | Phase 78 | Pending |
| INTL-01 | Phase 76 | Pending |
| INTL-02 | Phase 75 | Pending |
| INTL-03 | Phase 79 | Pending |
| INTL-04 | Phase 79 | Pending |
| ADMIN-01 | Phase 80 | Pending |
| ADMIN-02 | Phase 80 | Pending |
| ADMIN-03 | Phase 80 | Pending |

**Coverage:**
- v2.5 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 — v2.5 milestone start*
