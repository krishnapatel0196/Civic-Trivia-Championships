# Phase 65: Auto-Regenerate Expired Questions - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

When the hourly expiry cron archives an expired question, it automatically generates and seeds a fresh replacement in the same topic — the collection never shrinks. This is a cron behavior only; admin-manual archiving does not trigger replacement. Backfill of already-archived questions is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Replacement count & metadata
- Exactly 1 replacement per expired question (1:1 ratio)
- Replacement inherits the archived question's topic category only — all other fields (text, options, explanation, expiresAt, sourceUrls) are generated fresh using locale config
- No rate limit on replacements per cron run — generate for every expired question in the batch

### Quality rules
- Run quality rules on the generated replacement before seeding
- If quality rules fail: skip seeding, log structured warning — collection shrinks by 1; cleanliness over gap-filling
- If AI returns empty or unparseable response: retry once, then skip + log warning

### Error handling & observability
- Log structured warnings with context: collection slug, topic, archived question ID, error message/reason
- Log an always-on cron run summary at the end of each run (e.g. "3 expired, 2 replaced, 1 skipped") — even when nothing happened
- No external alerting (email/Slack) — operators review Render dashboard logs
- No DB record for skipped replacements — log only

### Backfill & trigger scope
- Forward-only: only questions archived by the cron after this phase ships receive replacements
- Cron-triggered only: admin-manual archival does not trigger replacement (admin removals are intentional)
- Only runs for collections that have a locale config — collections without locale configs are silently skipped
- No special handling if a collection falls below a minimum question count — same rules apply regardless of collection size

### Dedup & semantic checking
- Full semantic dedup pass (runWithinCollectionSemanticDedup) before seeding replacement
- Dedup checks against active questions only — archived questions (including the one being replaced) are excluded
- The archived question is explicitly excluded from the dedup scope to prevent false positives
- If replacement is flagged as near-duplicate: retry generation once, then skip + log warning
- On retry: if still near-duplicate, skip seeding — collection shrinks by 1

### Claude's Discretion
- Exact integration point within the hourly cron (inline vs. separate function)
- Whether to generate the replacement before or after committing the archival to DB (order of operations)
- Prompt construction for replacement generation (same prompt as normal generation, scoped to topic)
- Embedding generation approach for dedup check on the fresh replacement

</decisions>

<specifics>
## Specific Ideas

- Pattern mirrors `awardPlatformXp` never-throw design: replacement generation must never cause the expiry cron to fail — expiry always completes regardless of replacement outcome
- Existing `runWithinCollectionSemanticDedup` function should be reused directly for the dedup pass
- Locale config is the sole source of context for replacement generation (same as normal generation pipeline)

</specifics>

<deferred>
## Deferred Ideas

- One-time backfill script for already-archived expired questions — could be a future quick task if Chris wants to close the historical gap
- Admin-triggered replacement for manually archived questions — would require wiring into admin panel archive action

</deferred>

---

*Phase: 65-auto-regenerate-expired-questions*
*Context gathered: 2026-03-15*
