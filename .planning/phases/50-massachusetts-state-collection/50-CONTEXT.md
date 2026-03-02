# Phase 50: Massachusetts State Collection - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a fully playable Massachusetts State civic trivia collection: scaffold the collection with a locale config and state-level topics, generate ≥50 questions passing all quality rules, curate, and activate in production. This is a state-level collection — not a Boston city collection, not a Cambridge collection, not a Federal collection.

</domain>

<decisions>
## Implementation Decisions

### Topic scope and balance
- **Balanced 50/50:** roughly equal split between historical civic facts and modern state government structures/policy
- Historical backbone: Massachusetts Constitution of 1780, Shays' Rebellion, abolitionism, women's suffrage, landmark state court decisions
- Modern government: the General Court (legislature), Governor's Council, MCAS, 2006 health reform (as civic policy milestone, not partisan), clean energy policy, home rule structure
- Apply the dinner party test: surprising and shareable civic tidbits, not bureaucratic trivia

### Expiring vs. durable questions
- Current officeholders (Governor, AG, Senate President, Speaker of the House) → expiring questions with appropriate `expiresAt`
- Structural and historical facts → durable, `expiresAt = null`
- Target roughly half-and-half, same pattern as Cambridge

### Anti-partisan framing
- Platform is actively anti-partisan — strip partisan framing entirely
- No questions framed around party affiliation, ballot controversy, or political positioning
- Civic policy milestones (e.g., 2006 health reform) should focus on what the policy DID as civic fact, not which party passed it or opposed it
- **No private companies** as subjects — Raytheon, Fidelity, General Electric, etc. are out of scope. Civic-adjacent institutions (public universities, civic nonprofits, state agencies) are fine.

### Boston / Cambridge / Federal overlap avoidance
- **Boston city facts belong in a Boston collection** (future phase) — avoid questions whose correct scope is Boston city government
- **Cambridge-specific facts belong in the Cambridge collection** — already handled in Phase 49
- **Federal facts belong in the Federal collection** — Massachusetts senators/representatives are federal, not state subjects unless the question is about their state-level role
- Focus: state government, state history, state-level civic institutions, state leaders in their state roles

### Factual accuracy guidance (voice guidance priorities)
The researcher and planner should encode these as critical accuracy requirements:
- Massachusetts Constitution of 1780: correctly described as the **world's oldest functioning written constitution still in use** (not just "one of the oldest")
- The state legislature is called **"the General Court"** — not "state legislature," "state assembly," or "state congress"
- The **Governor's Council** (Governor's Executive Council) is a unique elected body in Massachusetts — it must confirm gubernatorial appointments to the judiciary and other offices; very few states have this structure
- **County government:** Massachusetts abolished most county governments as functioning governments (Middlesex County, Hampshire County, etc.) — counties exist as geographic/judicial districts but no longer have elected county government in most cases; the sheriff and register of deeds remain
- **2006 health reform (Chapter 58):** Massachusetts was the first state to pass near-universal health care coverage — this is verifiable civic fact. Frame as civic milestone, not partisan achievement.
- **Same-sex marriage (2004, Goodridge v. Dept. of Public Health):** Massachusetts was the first US state to legally recognize same-sex marriage — verifiable civic/legal fact, frame structurally.
- Avoid the common conflation: "Boston passed X" vs. "Massachusetts passed X" — state vs. city distinction matters

### Source strategy
- Official: malegislature.gov, mass.gov, Secretary of State's office publications
- Historical: Massachusetts Historical Society, State Archives, Freedom Trail Foundation (for civically relevant history)
- Journalism: WBUR (civic coverage), Boston Globe civic/government reporting
- Academic/legal: Harvard Kennedy School state policy publications, SJC decisions for legal milestones
- Wikipedia acceptable for supplementary historical context, paired with authoritative primary

### Visual identity
- **Banner image:** Massachusetts State House (24 Beacon Street, Boston) — the gold dome is the defining civic symbol
- Same pattern as Indiana State and California State (state capitol building)
- **Theme color:** Claude's discretion — should complement the gold dome / Massachusetts civic palette (navy blue is a reasonable default given the state flag)
- **Slug:** `massachusetts-state`
- **Prefix:** `mas`

### Claude's Discretion
- Exact theme color (navy/gold range suggested by state identity)
- Specific topic distribution percentages within the balanced framework
- Which specific court cases or policy milestones to include beyond the anchors above
- How to handle edge cases in question curation

</decisions>

<specifics>
## Specific Ideas

- "Well-sourced, unbiased answers" — every fact should be traceable to an official or authoritative source
- Expiring questions for current officials: Governor, AG, Senate President, House Speaker, Treasurer, Auditor
- The General Court, Governor's Council, and county government structure are three genuinely surprising MA civic facts for most players — prioritize these
- The 1780 Constitution and 2004 same-sex marriage ruling are model questions: historically significant, non-partisan framing possible, durable

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 50-massachusetts-state-collection*
*Context gathered: 2026-03-02*
