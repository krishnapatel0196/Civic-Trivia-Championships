# Phase 62: Mississippi State Collection - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold, generate, curate, and activate a Mississippi State civic trivia collection following the established state collection pattern. Includes a playbook retrospective that closes out the v2.1 milestone — with a milestone-level summary capturing the full arc of collection improvements across Phases 57–62.

</domain>

<decisions>
## Implementation Decisions

### Content emphasis
- Balanced spread across all civic domains: state government structure, history, geography/natural features, economy, civic-connected notable Mississippians, and current officeholders
- Notable Mississippians: civic-connected figures only — those whose contributions connect to civic life, policy, or public service (e.g., Medgar Evers, James Meredith, Fannie Lou Hamer). Pure pop culture figures (musicians, athletes with no civic angle) excluded
- County government: skip entirely — 82 counties is too granular and varies too much to teach well at state scale

### Geography / state-scale rule
- Natural features that define the state (Mississippi River, Gulf Coast, delta region, Natchez Trace) are in scope
- Geographic references to cities are only allowed when anchoring a state institution or policy (e.g., "Jackson is the seat of state government" = OK; anything about Jackson's local government = cut)
- Zero-tolerance enforcement of state-scale rule: if a question could belong to a future Jackson MS or Gulfport MS city collection, cut it. When in doubt, cut it.

### Sensitive topic handling
- Civil rights history: include fully with factual framing — treat as core civic content, same standard as any other historical topic
- 2020 flag change (removal of Confederate emblem): include as a legitimate civic event (referendum, legislative action, new design), but keep framing strictly neutral — no editorializing. Example framing: "In what year did Mississippi adopt a new state flag?"
- Voice guidance tone: civic educator voice — "These questions teach civic facts about Mississippi. Treat all topics with the gravity and accuracy of a civics textbook. No humor on sensitive historical events."

### Expiring question strategy
- Target offices for expiring questions: Governor, Lt. Governor, AG, Secretary of State, Treasurer (top 5 constitutional officers) + House Speaker + Lt. Speaker (2 legislative leaders) = 7 total
- Use `expiresAt: 2028-01-13` for all current-term officeholder questions (Reeves term end; assume co-terminus for other officers elected on same cycle)
- Ratio target: 15–30% expiring. Make a genuine effort to hit 15% from real officeholder content. If structurally capped below 15% (similar to Oregon at 7.4%), document the ceiling and accept — do not manufacture artificial expiring questions.

### Supplementation approach
- Pipeline first: run full generation pipeline before deciding on supplementation
- If question count falls short of 80 after pipeline + dedup, do a targeted manual supplementation pass covering topic gaps (judiciary, Mississippi River policy, historical legislation, etc.)
- Oregon pattern (25 hand-crafted questions) is the reference model if supplementation is needed

### v2.1 closing retrospective
- Use standard retrospective format (what broke, what was fixed, carry-forward rules)
- Add a milestone-level summary section capturing: 5 collections shipped, pipeline hardening achievements (semantic dedup, expiring ratio enforcement, playbook), key patterns that emerged across Phases 58–62
- Note the vision for a future "create collection" skill: a single command that scaffolds, generates, curates, and publishes a collection from just a city/state/topic input — distilling all playbook learnings into an automated workflow

### Claude's Discretion
- Exact topic distribution percentages in locale config
- Which specific historical events to cover within civil rights history
- Number of supplementation questions if pipeline falls short
- Source URL selection (prefer Wikipedia article URLs per 58-02 pattern)

</decisions>

<specifics>
## Specific Ideas

- Civil rights framing: Medgar Evers, Fannie Lou Hamer, James Meredith, the 1964 Freedom Summer — these are civic history, not just cultural history; treat them as such
- Flag question: neutral framing like "In what year did Mississippi replace its state flag?" or "What symbol did the 2020 Mississippi flag replace?" — factual, no commentary
- Closing retrospective milestone summary: frame it as "what we now know about building great collections" — a reference document for the future /create-collection skill

</specifics>

<deferred>
## Deferred Ideas

- `/create-collection` skill — a future GSD skill that encapsulates the full collection creation workflow (scaffold → generate → curate → activate) from a single prompt. Explicitly the goal that this retrospective should help enable. Belongs in a future milestone, not Phase 62.

</deferred>

---

*Phase: 62-mississippi-state-collection*
*Context gathered: 2026-03-14*
