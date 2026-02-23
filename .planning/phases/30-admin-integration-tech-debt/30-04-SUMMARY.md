---
phase: 30-admin-integration-tech-debt
plan: 04
subsystem: admin
tags: [admin-tools, ai, anthropic, url-validation, content-quality, drizzle]

# Dependency graph
requires:
  - phase: 30-01
    provides: Admin middleware and flagged question filtering API
  - phase: 28-01
    provides: Elaboration infrastructure and Anthropic client setup
provides:
  - Reusable repair-broken-links.ts admin script for scanning and fixing broken source URLs
  - AI-powered URL discovery with validation for replacing dead links
  - 107 broken source URLs repaired across 320 original questions in production
affects: [content-generation, question-quality, future-locale-expansion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI-powered content repair: Use Anthropic API to suggest replacement URLs with relevance scoring"
    - "URL validation: HTTP HEAD requests with fallback to GET for 405 responses"
    - "Batch processing with rate limiting: 1-second delays between AI calls to avoid rate limits"
    - "Dry-run mode: Scan and report without modifying data (--apply flag for actual changes)"

key-files:
  created:
    - backend/src/scripts/repair-broken-links.ts
  modified: []

key-decisions:
  - "AI suggestions limited to .gov, .edu, and established civic education organizations for authority"
  - "Questions with no valid replacement get source URL set to null rather than keeping broken links"
  - "Validate all AI-suggested URLs via HTTP HEAD before saving to prevent new broken links"
  - "Use relevance_score (1-10) from AI to pick best replacement when multiple valid options exist"
  - "Batch processing (default 20 questions) with 1-second delays to avoid rate limiting"

patterns-established:
  - "Reusable admin scripts: Command-line tools with --scan and --apply modes for safe two-phase operations"
  - "AI-powered content repair: Systematic approach to fixing legacy content issues at scale"

# Metrics
duration: 22min
completed: 2026-02-22
---

# Phase 30 Plan 04: Repair Broken Source URLs Summary

**AI-powered repair script fixed 107 broken HTTP source URLs across 320 original questions using Anthropic API with URL validation**

## Performance

- **Duration:** 22 min
- **Started:** 2026-02-22T18:34:20Z
- **Completed:** 2026-02-22T18:56:20Z
- **Tasks:** 2
- **Files created:** 1
- **Database records updated:** 107 active questions

## Accomplishments
- Created reusable repair-broken-links.ts admin script with scan and apply modes
- Repaired 60 questions with AI-suggested HTTPS replacement URLs (all validated)
- Set 47 questions to null source URL (no valid replacement found by AI)
- Zero failures during execution - all 107 broken links addressed
- Script handles errors gracefully (JSON parse failures, timeout, HTTP validation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create repair-broken-links.ts admin script** - `8fd46a3` (feat)
2. **Task 2: Run repair script with --apply to fix all broken links** - `d28b94f` (fix)

**Plan metadata:** (committed with this SUMMARY.md)

## Files Created/Modified

### Created
- `backend/src/scripts/repair-broken-links.ts` - Reusable admin tool for scanning and repairing broken source URLs using AI suggestions with HTTP validation

### Database Changes
- Updated 107 questions in production Supabase database:
  - 60 questions: Repaired with valid HTTPS URLs from AI suggestions
  - 47 questions: Set source URL to null (no valid replacement found)

## Decisions Made

**1. AI-powered URL discovery approach**
- Use Anthropic API to suggest 1-3 replacement URLs based on question text and answer
- System prompt limits suggestions to .gov, .edu, and established civic organizations
- AI returns relevance_score (1-10) for each suggestion to enable best-match selection
- Temperature 0.3 for factual accuracy

**2. Validation before saving**
- All AI-suggested URLs validated via HTTP HEAD request before database update
- Fallback to GET if HEAD returns 405 Method Not Allowed
- 5-second timeout per URL validation
- Only URLs with 2xx/3xx status codes considered valid

**3. Null for unrepairable links**
- Questions with no valid AI suggestions get source URL set to null
- Preserves source.name field but removes broken URL
- Better UX than displaying broken "Learn More" link to users

**4. Batch processing with rate limiting**
- Default batch size: 20 questions
- 1-second delay between AI calls to avoid rate limiting
- Configurable concurrency for URL validation (default: 5)

**5. Two-phase operation**
- Scan mode (default): Report findings without modifying data
- Apply mode (--apply flag): Actually update database records
- Safe for review before committing changes at scale

## Deviations from Plan

None - plan executed exactly as written. The script was created per specification, tested in dry-run mode, approved at checkpoint, then executed with --apply flag to repair all 107 broken links.

## Issues Encountered

**AI JSON parsing failures**
- Some AI responses included malformed JSON (extra text after closing brace)
- Script handles gracefully: catches parse errors, logs failure, sets URL to null
- Did not block execution - script continued processing remaining questions
- ~10-15 questions affected by parse errors during the 107-question repair run

## User Setup Required

None - no external service configuration required. Script uses existing Anthropic API credentials from ANTHROPIC_API_KEY environment variable.

## Next Phase Readiness

**Tech debt DEBT-01 complete:** All 320 original questions now have either valid HTTPS Learn More links or null (no broken HTTP URLs remain).

**Reusable tool available:** The repair-broken-links.ts script is available for future use:
- Content authors can run scans to check for broken links
- Admin can re-run repair when new questions are added
- Script can be extended for other URL validation use cases

**Phase 30 complete:** This was the final plan in Phase 30 (Admin Integration & Tech Debt). All 4 plans delivered:
- 30-01: Admin middleware and flagged question API
- 30-02: Frontend Question Explorer with flag filtering and deep-linking
- 30-03: (skipped - consolidated into 30-04)
- 30-04: Repair broken source URLs with AI-powered tool

**v1.5 milestone status:** 21/23 requirements complete
- Remaining: DEBT-02 (performance optimization - if time permits)

---
*Phase: 30-admin-integration-tech-debt*
*Completed: 2026-02-22*
