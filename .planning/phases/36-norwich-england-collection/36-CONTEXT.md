# Phase 36: Norwich, England Collection - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the platform's first non-US collection — generate ~90 civic questions about Norwich and Norfolk, add a collection picker card, and seed to production. The collection enables players to select Norwich from the collection picker and play a full game of local civic questions.

</domain>

<decisions>
## Implementation Decisions

### Collection card & picker
- Title: "Norwich, England" (mirrors US format like "Fremont, CA")
- Description: "Local democracy, history & culture in the heart of Norfolk"
- Icon: City/landmark image (Norwich Cathedral or Cow Tower style, consistent with other city collections)
- No special "International" badge — appears as just another city collection; normalizes international content

### Question coverage & distribution
- Target: 90 questions (consistent with other city collections)
- Topic mix: Heavy local government — 50%+ dedicated to council mechanics, roles, services, procedures
- City vs County split: 80/20 in favor of Norwich City Council; Norfolk County Council included as context and supporting topic
- Timeframe: Mix of historical and current — civic history (medieval charter, notable milestones, past mayors) plus current operations

### UK generation approach
- Sources: Broad sweep — Norwich City Council website, Norfolk.gov.uk, Wikipedia, BBC Local, The Guardian Norwich coverage
- Dual-tier attribution handling: Belt-and-suspenders — explicit responsibility split in every generation prompt (City = housing, planning, leisure; County = roads, schools, social care) PLUS a post-generation validation check that flags likely tier attribution errors
- Generation batching: Topic-based batches (separate runs per topic area for better distribution control)
- Locale config structure: Claude's Discretion (researcher/planner determines if new fields are needed for UK two-tier governance)

### Authentic UK voice
- Questions must read as coming from Norwich locals, not from Americans
- Strong UK civic terminology throughout: councillor, ward, by-election, MP, parish council, unitary authority, constituency — not mayor, city hall, zip code, congressman
- Prompt engineering priority: The voice and vocabulary should feel native to Norfolk, not translated from US civic templates

### Content quality & validation
- Difficulty: Same calibration as US collections — consistent player experience
- Quality rules: Run all existing rules (including checkAddressPhone); extend with Norwich-specific exceptions if UK formats (postcodes, UK phone numbers) would cause false positives
- Cross-tier attribution violations: Flag for admin review (consistent with existing quality violation handling) — no auto-rejection

### Claude's Discretion
- Locale config structure (new fields vs extending existing pattern)
- Exact landmark chosen for collection card image
- Specific terminology blocklist for US terms in prompts

</decisions>

<specifics>
## Specific Ideas

- "We are designing this for the people of Norwich — make it seem like it's coming from their own and not some yank from across the pond." The generation prompts should feel native, not translated.
- Norwich Cathedral or Cow Tower as the landmark image (Norman cathedral is the city's iconic landmark; Cow Tower is distinctive medieval civic architecture)
- The dual-tier governance complexity (City vs County) is the primary accuracy risk — both the prompt and a post-generation validation step must guard against mis-attribution

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 36-norwich-england-collection*
*Context gathered: 2026-02-25*
