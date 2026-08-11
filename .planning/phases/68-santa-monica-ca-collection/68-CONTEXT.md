# Phase 68: Santa Monica, CA Collection - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold, generate, curate, and activate a Santa Monica, CA city collection with 80–100 questions. This phase is the first collection built end-to-end using the Phase 64 `officeholders` field to achieve 15–30% expiring ratio without a manual targeted pass.

</domain>

<decisions>
## Implementation Decisions

### Topic coverage
- Standard city mix: city government, local history, landmarks, economy, community/culture — same structure as other city collections
- Target question count: 90–95 (midrange)
- Strict Santa Monica only — no LA County crossover questions; LA appears only as geographic context
- Balanced topic distribution — no emphasis area; even spread across all categories

### Officeholders configuration
- Include: mayor, key city council members (mayor + 2–3 most prominent, not all 6), city attorney, city clerk, state assembly member, state senator representing Santa Monica
- Researcher looks up current officeholder names and term end dates from city website + Ballotpedia during research phase
- No manual targeted pass — the officeholders field drives expiresAt auto-seeding entirely

### Collection identity
- Tagline angle: pier/beach — Route 66 endpoint, iconic coastal character (e.g., "Where Route 66 meets the Pacific")
- Voice guidance must warn on two fronts:
  1. Santa Monica is its own city — not part of LA city government; avoid conflating SM and LA institutions
  2. Civic knowledge over tourist trivia — questions should reflect governance, not just beach/pier facts
- No specific topic mandates — researcher discovers the most civically significant topics naturally

### Banner image
- Subject: Santa Monica Pier (most iconic, instantly recognizable)
- Source: Wikimedia Commons — find a high-quality public domain or CC-licensed photo

### Claude's Discretion
- Exact topic category names and per-topic question distribution
- Which 2–3 council members to include as key officeholders (pick based on prominence/coverage)
- Specific tagline wording (pier/beach angle is locked, exact phrasing is flexible)

</decisions>

<specifics>
## Specific Ideas

- Tagline should evoke the Route 66 endpoint + Pacific coast — something like "Where Route 66 meets the Pacific — how well do you know the city at the end of the road?"
- The SM/LA distinction is the primary accuracy risk — generation prompts must emphasize this explicitly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 68-santa-monica-ca-collection*
*Context gathered: 2026-03-17*
