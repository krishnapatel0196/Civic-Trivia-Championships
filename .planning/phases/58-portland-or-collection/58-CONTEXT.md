# Phase 58: Portland, OR Collection - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold, generate, curate, and activate a city-level civic trivia collection for Portland, OR. Deliverables: 80+ questions meeting quality standards, 25–30% expiring questions, automated dedup pipeline runs during generation, and a completed retrospective appended to COLLECTION-PLAYBOOK.md.

</domain>

<decisions>
## Implementation Decisions

### Voice & tone
- Primary lens is civic/government first — questions feel like civic education; Portland's flavor comes through in content specifics, not in question tone
- Politically-charged topics: factual only, no editorial framing — state facts neutrally ("Portland was the first city to..." not "Portland led the way on...")
- Neighborhood specificity: sparingly — stick to citywide landmarks and institutions, not neighborhood-specific trivia (Pearl District, Alberta Arts District, etc. are out unless citywide significance)
- Accuracy guidance must explicitly warn against two things:
  1. Confusing city vs. metro — questions must be scoped to Portland city proper, not the greater Portland metro (Beaverton, Gresham, etc.)
  2. Over-relying on "Keep Portland Weird" clichés — questions should reflect real civic knowledge, not pop-culture quirkiness

### Topic distribution
- ~40% city government, ~60% everything else
- City government coverage: balanced between new 2025 council structure (12-district ranked-choice) and historical Portland government facts — neither ignored
- Emphasized topic clusters: Portland history & founding (Oregon Trail, Stumptown origin, statehood), parks & natural landmarks (Forest Park, Willamette River, Mount Tabor, Washington Park), cultural institutions (OMSI, Portland Art Museum, Powell's Books, Oregon Zoo)
- Excluded: sports/food/pop culture — no Trail Blazers trivia, no food cart questions, no craft beer angle; strict civic focus

### Tagline
- Angle: Rose City civic pride
- Use "Rose City" as the hook — iconic, warm, not kitschy
- Style: rhetorical question or punchy stakes using "Rose City" (e.g., "How well do you know the Rose City?")

### Expiring question strategy
- Target: 25–30% expiring questions (well above the 15% floor — the new council structure makes this achievable)
- Priority roles for `expiresAt`: Mayor, City Council members (12 districts), City Auditor
- Expiration dates: use the actual expected term-end date per seat — researcher should look up each councilmember's term expiry based on the staggered 4-year schedule from the Jan 2025 seating
- Question types: mix of structure (durable) and personnel (expiring)
  - Durable: how the new 12-district ranked-choice system works, number of districts, history of the change
  - Expiring: who is the current mayor, who represents district X, who is the current city auditor
- Voice guidance must explicitly instruct the generator to produce questions naming current mayor, current council members by district, and current city auditor — with `expiresAt` set to the relevant term-end date

### Claude's Discretion
- Exact tagline wording (within Rose City civic pride framing)
- Banner image selection (should be an iconic Portland citywide landmark — not a neighborhood)
- Collection theme color
- Specific topic weighting within the 40/60 split
- Loading states and error handling

</decisions>

<specifics>
## Specific Ideas

- The new city council model (Jan 2025) is genuinely interesting civic content — include a few questions explaining how the 12-district ranked-choice system works as durable facts
- Questions about the Willamette River bridges (there are many notable ones) could be good durable content
- Powell's Books, OMSI, and the Oregon Zoo are well-known cultural anchors worth including
- Forest Park as one of the largest urban forests in the US is a distinctive Portland fact

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 58-portland-or-collection*
*Context gathered: 2026-03-09*
