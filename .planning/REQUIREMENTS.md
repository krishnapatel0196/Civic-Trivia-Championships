# Requirements: Civic Trivia Championship v2.0

**Defined:** 2026-03-05
**Core Value:** Make civic learning fun through game show mechanics — play, not study. No dark patterns, no guilt, no pressure.

## v2.0 Requirements

### XP Backend

- [ ] **XP-01**: Backend awards XP via `POST /api/xp/award` after each game session for Connected players (server-to-server, service key auth, never exposed to browser)
- [ ] **XP-02**: XP formula is score-proportional with a participation floor (exact formula defined during Phase 53 planning)
- [ ] **XP-03**: Each game session has a server-generated `gameId` used to construct the idempotency key (`ctc-game-<gameId>-<userId>`)
- [ ] **XP-04**: Non-Connected players (Inform/anonymous) are silently skipped — no award call is made
- [ ] **XP-05**: `TRIVIA_SERVICE_KEY` and `EMPOWERED_ACCOUNTS_API_URL` env vars wired on CTC backend

### XP Start Screen

- [ ] **XPS-01**: Connected players see their current level and XP progress bar before the game starts (`GET /api/xp/:userId`)
- [ ] **XPS-02**: Non-Connected players see a "Link your account to earn XP" prompt on the start screen

### XP End Screen

- [ ] **XPE-01**: Connected players see `+XP earned` with the game's awarded amount after game results
- [ ] **XPE-02**: Level-up animation shown when award response `level > pre-game level`
- [ ] **XPE-03**: Updated XP progress bar reflects new level position after the award
- [ ] **XPE-04**: `is_duplicate: true` response shows a neutral "game already recorded" message instead of reward animation

### XP History

- [ ] **XPH-01**: Profile page has an XP history panel showing past CTC game sessions and XP earned
- [ ] **XPH-02**: History is paginated and fetched via `GET /api/xp/me/history` (Bearer JWT, Connected tier only)

## Future Requirements

*(None identified — this milestone is focused and complete)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| XP for non-game activities (e.g., flagging questions) | Platform defines XP sources; CTC is only authorized for `civic_trivia_championship_score` |
| Leaderboards | Research needed, may add later (from v1.x OUT OF SCOPE) |
| Daily XP caps | Platform has no daily cap; do not build this |
| Perfect-game bonus as separate transaction | Keep it simple for v2.0 — include in base formula |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| XP-01 | Phase 53 | Complete |
| XP-02 | Phase 53 | Complete |
| XP-03 | Phase 53 | Complete |
| XP-04 | Phase 53 | Complete |
| XP-05 | Phase 53 | Complete |
| XPS-01 | Phase 54 | Pending |
| XPS-02 | Phase 54 | Pending |
| XPE-01 | Phase 54 | Pending |
| XPE-02 | Phase 54 | Pending |
| XPE-03 | Phase 54 | Pending |
| XPE-04 | Phase 54 | Pending |
| XPH-01 | Phase 55 | Pending |
| XPH-02 | Phase 55 | Pending |

**Coverage:**
- v2.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after initial definition*
