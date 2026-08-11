# Phase 52: Texas State Collection - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Create and activate the Texas State civic trivia collection — locale config, question generation, curation, banner image, and activation. The collection must have ≥50 questions covering state civic topics and be playable in production. This phase covers state-level government only; city-specific facts belong in city collections (e.g., Plano TX).

</domain>

<decisions>
## Implementation Decisions

### Topic categories
- ~8 categories total (matches Massachusetts State depth)
- Named categories to include: texas-history-identity (Republic era, independence, annexation — dedicated category, rich civic material)
- Constitutional history: light coverage (~1 category, lower question weight — don't over-index here)
- Bucket structure for Texas's distinctive institutions (Railroad Commission, Lt. Governor's outsized Senate power, Comptroller, plural executive) → Claude's discretion on whether these get their own category or fold into state-government

### Texas State vs. Plano TX separation
- **Hard rule: state-only.** No question may reference a specific Texas city. All questions must be about statewide institutions, laws, events, or history.
- Austin state institutions are fine (Capitol building, Governor's Mansion, state agencies) — Austin *city* facts are not.
- Texas distinctives (biennial legislative sessions, part-time legislature, plural executive) should be mentioned in voice guidance but not over-emphasized — they'll surface naturally as good question material.
- Exclusion list approach (what to avoid) vs. positive framing → Claude's discretion.

### Durability — new approach: expiring + durable mix
- **This collection should generate both expiring (current-officeholder/timely) AND durable questions.** The previous anti-officeholder guardrail is explicitly lifted.
- "Who is the Lt. Governor of Texas?" is an example of the kind of timely question we want. These questions add civic relevance and will be replenished as they expire.
- No fixed target for the expiring/durable split — generate as many of each as make sense.
- `expiresAt` set per question by Claude based on the nature of each question (e.g., end of specific term for officeholder questions, longer horizon for policy facts).
- **This becomes the new pattern for state collections going forward.** Voice guidance should explicitly instruct the generator to produce both types: "Generate a mix of durable civic facts and expiring current-officeholder questions. For current officeholders and time-sensitive facts, set expiresAt appropriately."

### Banner image
- Texas State Capitol building (consistent with Massachusetts State gold dome pattern — clearly signals state government)
- Composition/angle: Claude's discretion — pick the most visually compelling available image (note: the Texas Capitol is intentionally taller than the US Capitol, which could make for a dramatic wide-angle shot)

### Claude's Discretion
- Whether distinctive Texas institutions get their own topic category or fold into state-government
- Exact topic distribution percentages within the ~8-category structure
- Whether voice guidance uses positive framing ("questions must be statewide") vs. explicit exclusion list (cities to avoid)
- Banner image composition and angle

</decisions>

<specifics>
## Specific Ideas

- The user emphasized that expiring/timely questions are underused across the platform — Texas State should be a showcase for the mixed durability approach.
- "Who is the Lt. Governor of Texas?" cited as the kind of compelling, relevant question this collection should include.
- Texas Capitol's height (intentionally taller than the US Capitol) is a potential civic hook — both as a banner image angle and as a question candidate.

</specifics>

<deferred>
## Deferred Ideas

- Retrofitting the expiring/durable mix pattern to existing collections (Plano TX, Massachusetts State, etc.) — editorial decision for a future phase or quick task.

</deferred>

---

*Phase: 52-texas-state-collection*
*Context gathered: 2026-03-02*
