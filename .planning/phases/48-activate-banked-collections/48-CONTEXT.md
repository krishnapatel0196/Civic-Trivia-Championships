# Phase 48: Activate Banked Collections - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Flip Fremont CA and Norwich UK from inactive to live and playable in production. Both collections have banked questions from prior phases — this phase is about the activation gate: auditing readiness, resolving any gaps, updating is_active, verifying UI presentation, and confirming end-to-end playability. No new question generation workflows or new collection scaffolding.

</domain>

<decisions>
## Implementation Decisions

### Pre-activation readiness gate
- Minimum 50 active questions required before activation (matches roadmap success criteria)
- Must account for expiring questions on races and incumbents — question count must hold ≥50 after factoring in near-term expirations
- Full audit report required before flipping is_active — not just a count check
- If count falls short after audit: block activation, run generate-locale-questions to top up, re-audit before proceeding
- Claude's discretion on whether this is a dry-run script + separate activation command, or a single activation command with built-in gate

### Collection ordering & grouping
- Sections: Local (city collections) → State (state collections) → Federal
- Within each section: alphabetical order
- Fremont and Norwich both slot into Local alongside existing city collections (Bloomington, Los Angeles)
- Final Local order: Bloomington, Fremont, Los Angeles, Norwich
- Norwich treated identically to US cities — no country label or special treatment
- Frontend section grouping partially exists; may need update to handle row-wrap logic as section grows
- Layout is a responsive grid — CSS handles wrapping naturally, no explicit row-break logic needed

### Banner images
- Both Fremont and Norwich banners already exist
- Claude should verify filenames match the convention used by existing collections (e.g., `{slug}.jpg`) and confirm dimensions are consistent
- If a banner is wrong or missing: use a placeholder and activate anyway — banner quality does not block activation
- Banner style preference: city skyline with buildings, no recognizable people, town-square feel (applies as reference for auditing existing banners and any future replacements)

### Activation approach
- Direct to public — no admin-only preview stage
- Both Fremont and Norwich activated in the same plan (not split across plans)
- Post-activation verification: automated script that queries the collections API and validates all success criteria programmatically (is_active = true, ≥50 active questions returned for each)

### Claude's Discretion
- Structure of the readiness check (dry-run script vs. built-in gate in activate-collection.ts)
- Order of operations within the activation plan (audit → gap fill if needed → activate → verify)
- Expiring question threshold — how "soon" counts as near-term for the count floor check

</decisions>

<specifics>
## Specific Ideas

- Expiring race/incumbent questions are a specific concern — the audit should surface any questions with expiration dates set and include them in the count logic
- The section grouping UI is partially built but may need a small update as collections grow from 7 toward 11+

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 48-activate-banked-collections*
*Context gathered: 2026-03-02*
