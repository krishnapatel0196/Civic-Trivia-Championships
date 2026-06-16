---
phase: 79-launch-collections
verified: 2026-04-09T22:52:36Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 79: Launch Collections Verification Report

**Phase Goal:** Two International collections are live and playable - War in Iran and Climate Agreements - each with at least 15 active questions seeded at launch.
**Verified:** 2026-04-09T22:52:36Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | War in Iran collection card appears in the International section | VERIFIED | tier=international in DB (is_active=true); CollectionPicker.tsx routes tier=international to International section; game.ts returns war-in-iran questionCount=15 >= MIN_INTERNATIONAL_THRESHOLD=8 |
| 2 | War in Iran has 15+ active questions, fast volatility, expiresAt 3-5 days | VERIFIED | DB: active_questions=15, fast_count=15, avg_expiry_days=4.00; all 15 questions have expires_at set |
| 3 | Climate Agreements collection card appears in the International section | VERIFIED | tier=international in DB (is_active=true); same tier routing; game.ts returns climate-agreements questionCount=17 >= MIN_INTERNATIONAL_THRESHOLD=8 |
| 4 | Climate Agreements has 15+ active questions, medium volatility, expiresAt 7-14 days | VERIFIED | DB: active_questions=17, medium_count=17, avg_expiry_days=10.00; all 17 questions have expires_at set |
| 5 | Both collections freshness indicators reflect actual question timestamps | VERIFIED | game.ts SELECT includes MAX(questions.created_at) as latestQuestionAt; CollectionSummary types it; formatFreshness() is real time-based implementation |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|--------|
| backend/src/routes/game.ts | Tier-conditional threshold (8 for international) | VERIFIED | Line 17: MIN_INTERNATIONAL_THRESHOLD=8; Lines 95-98: tier-conditional filter |
| backend/src/cron/pipelineCron.ts | Both collections uncommented in INTERNATIONAL_COLLECTIONS | VERIFIED | Lines 28-29: both entries active; volatility=fast/medium correct |
| backend/src/scripts/content-generation/locale-configs/war-in-iran.ts | Scaffold locale config | VERIFIED | Exists, 1077 bytes |
| backend/src/scripts/content-generation/locale-configs/climate-agreements.ts | Scaffold locale config | VERIFIED | Exists, 1127 bytes |
| backend/src/scripts/international/seed-climate-agreements.ts | Seed script volatility=medium | VERIFIED | Line 15: runPipeline with volatility=medium; no stub patterns |
| frontend/public/images/collections/war-in-iran.jpg | Banner image | VERIFIED | 445443 bytes (Tehran skyline, Wikimedia Commons CC-BY-SA) |
| frontend/public/images/collections/climate-agreements.jpg | Banner image | VERIFIED | 431044 bytes (Blue Marble Earth, NASA public domain) |
| frontend/src/utils/formatFreshness.ts | Real freshness implementation | VERIFIED | 4-tier time-based: just now / Xm ago / Xh ago / date string |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|--------|
| game.ts filter | collection picker UI | tier-conditional threshold | VERIFIED | war-in-iran=15 questions, climate-agreements=17 questions, both exceed threshold=8 |
| trivia.collections | trivia.collection_questions | writePassingQuestions auto-insert | VERIFIED | 15 linked for war-in-iran, 17 for climate-agreements |
| trivia.collections | trivia.collection_topics | SQL INSERT after pipeline run | VERIFIED | Both linked to world-news topic id=749 |
| CollectionCard.tsx | banner images | /images/collections/slug.jpg | VERIFIED | Slug-based path resolves to both existing .jpg files |
| questions.created_at MAX | freshness indicator | game.ts -> latestQuestionAt -> formatFreshness() | VERIFIED | Full chain verified; war-in-iran latest=2026-04-09T22:20:03Z, climate-agreements latest=2026-04-09T22:44:32Z |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| War in Iran in International section, 8-question game playable | SATISFIED | is_active=true, tier=international, 15 questions >= 8 threshold |
| War in Iran 15+ active questions, fast volatility, 3-5 day expiresAt | SATISFIED | 15 questions, all fast, avg=4.00 days |
| Climate Agreements in International section, 8-question game playable | SATISFIED | is_active=true, tier=international, 17 questions >= 8 threshold |
| Climate Agreements 15+ active questions, medium volatility, 7-14 day expiresAt | SATISFIED | 17 questions, all medium, avg=10.00 days |
| Freshness indicators reflect actual timestamps | SATISFIED | latestQuestionAt from MAX(created_at); formatFreshness() real implementation |

### Anti-Patterns Found

No stub patterns, TODO/FIXME comments, placeholder content, or empty handlers found in any phase 79 artifacts.

### Human Verification Required

**1. War in Iran 8-question game flow**
Test: Start a game from the War in Iran collection card. Play all 8 questions through to the score screen.
Expected: Questions load with 4 answer choices; wager question (Q8) appears correctly; game completes showing score/XP/gems.
Why human: Requires live API, session state, and question format validation that automated checks cannot perform.

**2. Climate Agreements 8-question game flow**
Test: Start a game from the Climate Agreements collection card. Play all 8 questions through to the score screen.
Expected: Game completes normally with appropriate questions about climate agreements and treaties.
Why human: Same reason.

**3. International section visual layout**
Test: Open the collection picker. Confirm an International section header appears with both collection cards visible.
Expected: Two collection cards in a clearly labeled International section; freshness badges show Updated Apr 9 or a relative time string.
Why human: Visual rendering cannot be verified from static code analysis alone.

**4. Question content quality**
Test: Play through both collections and evaluate whether questions are substantive and factually accurate.
Expected: Questions specific (dates, names, figures); 4-day expiry for War in Iran appropriate for fast-moving news; 10-day for Climate Agreements appropriate for treaty/agreement pace.
Why human: Content quality requires human judgment; automated quality gate passed all questions but cannot be re-verified programmatically.

### Gaps Summary

No gaps found. All 5 observable truths are fully verified by the codebase and database state.

**DB Summary (live Supabase query 2026-04-09T22:52:36Z):**
- war-in-iran: is_active=true, tier=international, 15 active questions, 15 fast, avg_expiry=4.00 days, latest_question_at=2026-04-09T22:20:03Z
- climate-agreements: is_active=true, tier=international, 17 active questions, 17 medium, avg_expiry=10.00 days, latest_question_at=2026-04-09T22:44:32Z

**Code Summary:**
- game.ts MIN_INTERNATIONAL_THRESHOLD=8 at line 17, tier-conditional filter at lines 95-98
- pipelineCron.ts both entries active at lines 28-29
- seed-climate-agreements.ts calls runPipeline() with volatility=medium at line 15
- Both banner images are real JPEGs (445KB and 431KB)
- formatFreshness() is a complete, non-stub implementation

---

_Verified: 2026-04-09T22:52:36Z_
_Verifier: Claude (gsd-verifier)_
