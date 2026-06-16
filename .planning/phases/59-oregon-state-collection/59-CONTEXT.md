# Phase 59: Oregon State Collection - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate, curate, and activate the Oregon State civic trivia collection. Covers state-tier civic content only — Oregon government structure, history, statewide laws and policy, and civic identity. City-specific content belongs in future city collections (Portland, Eugene, Salem, Bend). Retrospective appended to COLLECTION-PLAYBOOK.md at close.

</domain>

<decisions>
## Implementation Decisions

### Topic coverage
- Balanced spread across: state government structure, Oregon history, statewide laws/policy, economy (policy-linked), civic innovation, and culture
- Oregon civic innovations (vote-by-mail, bottle bill, land-use planning, ballot initiative process) — include 1–2 questions each, don't over-index
- Natural resources and geography (Crater Lake, Columbia River, Oregon Coast, Mt. Hood) — only include when directly tied to policy, law, or interstate/federal governance. Pure geography trivia is out.
- Tribal civics — light touch: 1–2 questions on tribal presence in Oregon (9 federally recognized tribes); do not go deep on specific tribal governance structures

### Expiring question strategy
- Primary expiring targets: Governor, Secretary of State, Attorney General, Treasurer (statewide elected executives)
- Set expiresAt to the next scheduled election cycle for each officeholder's seat
- If statewide execs alone fall short of 15% expiring ratio: expand to Senate President and House Speaker
- If even legislative leadership doesn't reach 15%, accept the lower ratio — do not force artificial expiring questions

### State-only curation (UNIVERSAL RULE — applies to all state collections)
- Strict state-scale only: questions must be about Oregon as a whole, not tied to any specific city or region
- The test: "Could a future Salem, Eugene, Bend, or Portland collection own this question?" If yes, cut it from Oregon.
- Salem may appear only as the capital (e.g., "What is Oregon's capital?") — no questions about Salem's civic life, landmarks, or local government
- Natural features allowed only when tied to statewide policy or interstate/federal law — not as geography facts
- Oregon questions should be non-duplicable: if a city collection ships later, it shouldn't overlap with Oregon State questions

### Voice & tone
- Tone: straightforward civic — clear, factual, educational. Let Oregon facts speak for themselves, no editorial flourishes.
- Oregon ballot initiative and direct democracy questions: frame as Oregon civic innovation (Oregon pioneered the initiative process — that framing is accurate and educational)
- No partisan framing — Oregon leans progressive, but questions should not read as political commentary
- Accessibility floor: if a well-informed Oregonian wouldn't know it, cut it. Aim for informed general audience, not civic specialists

### Claude's Discretion
- Exact topic distribution percentages across government/history/policy/culture buckets
- Whether to use Oregon's nickname ("the Beaver State") or motto ("Alis Volat Propriis") as trivia
- Specific wording of tribal-presence questions (handle with care)

</decisions>

<specifics>
## Specific Ideas

- Oregon is a trailblazer on direct democracy — vote-by-mail, bottle bill (1971), Death with Dignity Act, Measure 91 (cannabis). These are great civic trivia fodder but cap at 1–2 per topic.
- The collection should work for any Oregon resident, not just Portland residents — which is the entire point of state-scale curation.
- Future city collections planned: Portland (live), Eugene, Salem, Bend. State collection is the one that covers what none of those cities will.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 59-oregon-state-collection*
*Context gathered: 2026-03-09*
