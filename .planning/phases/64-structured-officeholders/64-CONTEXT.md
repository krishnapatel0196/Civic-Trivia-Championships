# Phase 64: Structured Officeholders - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an `officeholders` array to LocaleConfig so the generation pipeline can (a) inject officeholder names and roles into generation prompts, nudging the AI to write current-officeholder questions by name, and (b) automatically seed `expiresAt` on any generated question whose text references an officeholder by name — eliminating the manual targeted pass entirely. Audit tooling reports officeholder coverage and flags zero-coverage entries as warnings.

</domain>

<decisions>
## Implementation Decisions

### Officeholder data shape
- Required fields: `name`, `role`, `termEnd`
- Optional field: `district` (plain text, e.g. "Ward 3" or "Northeast District") — used for prompt context only
- No party affiliation
- No coordinates (lng/lat deferred — see Deferred Ideas)

### Prompt injection style
- Option B: explicit instruction block surfaced in the generation prompt
- Block names each official and instructs the AI to use their name specifically (not "the current mayor") so the auto-seeder can match reliably
- Example shape:
  ```
  OFFICEHOLDERS — these are active, named officials. Generate questions that
  name them specifically so expiresAt can be set automatically.
  - Mayor: John Smith (term ends 2027-01-15)
  - Speaker Pro Tem: Jane Doe (term ends 2026-11-04)
  - City Council, Ward 3: Alex Rivera (term ends 2026-11-04)
  ```

### Name matching behavior
- Claude's Discretion — researcher and planner determine the matching strategy

### Audit coverage reporting
- `audit-collection-readiness.ts` reports how many officeholders have ≥1 question with matching `expiresAt`
- Zero-coverage officeholders are flagged as warnings only — does NOT block collection activation
- Non-blocking, consistent with existing audit warning patterns

</decisions>

<specifics>
## Specific Ideas

- The explicit "name them specifically" instruction in the prompt block is load-bearing — without it, the AI writes "the current mayor" and matching fails
- `district` field is intentionally text, not coordinates — keeps the data shape lean and human-readable in the config file

</specifics>

<deferred>
## Deferred Ideas

- **Geo-personalized collections** — use a connected user's location to surface only the collections relevant to their address (city, district, state). Future phase.
- **District-level sub-collections** — e.g., separate question sets per city council ward (Ward 3 vs. Ward 11). Requires geo-personalization infrastructure first.
- **Primary candidate questions** — expiring questions tied to candidates during primary season. Requires election pipeline extension. Future phase.
- **Officeholder coordinates (lng/lat)** — attaching geographic coordinates to officeholder entries to support district-level personalization. Deferred until geo-personalization phase is scoped.

</deferred>

---

*Phase: 64-structured-officeholders*
*Context gathered: 2026-03-15*
