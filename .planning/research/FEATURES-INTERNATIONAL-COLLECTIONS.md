# Feature Landscape: International Collections & Daily News Pipeline

**Project:** Civic Trivia Championship
**Milestone:** v2.5 International Collections
**Researched:** 2026-04-08
**Confidence:** MEDIUM — daily-refresh trivia is not a well-documented public domain; findings synthesize news-app UX patterns, trauma-informed design literature, and game content-pool first principles.

---

## Research Findings Summary

The six questions posed by the milestone are answered below before the
standard feature table. Feature tables follow.

---

### 1. Pool Self-Regulation (Target: 40–80 Active Questions)

No public documentation exists for the exact pool management algorithms
used by commercial trivia apps — this appears to be proprietary. However,
the design logic is derivable from first principles and analogous systems
(Duolingo daily-refresh work, Ham radio question pool management).

**Key insight from Duolingo's "Daily Refresh" project:** When a learner
exhausts all course content, the system faces the same problem as a
depleted question pool. Duolingo's solution was to reframe recycled content
as "review mode" — not new questions, but questions the learner hadn't
seen recently. The UX language changed to "Keep your skills sharp" rather
than surfacing the system's content constraint.

**Recommended model for CTC:**

The pool has three zones, not one threshold:

| Zone | Active Count | Behavior |
|------|-------------|----------|
| Healthy | 55–80 | Normal operation: 8-question game draws from full pool |
| Warning | 40–54 | Trigger generation run next pipeline cycle; show no UI change to players |
| Depleted | < 40 | Two options: (a) allow repeated questions with "seen before" flag, or (b) show "paused" state. Prefer option (a) with a recycling window |

**Tunable parameters (recommend exposing in admin UI):**
- `pool_floor`: minimum before generation is triggered (recommend: 40)
- `pool_target`: generation runs until this count is reached (recommend: 70)
- `pool_ceiling`: hard cap; generation stops even if new articles warrant more (recommend: 80)
- `question_recency_window`: minimum days before a question is eligible for repeat delivery to the same player (recommend: 14 days; 7 days minimum for fast-moving topics)
- `generation_batch_size`: max questions generated per pipeline run (recommend: 10–15; prevents low-quality bulk generation)

**Self-regulation flow:**
1. Hourly cron (existing): expires questions past their `expiresAt`
2. Daily pipeline: reads RSS feeds → extracts facts → generates questions → stores as `draft`
3. Admin review queue: `draft` → `active` after review (or auto-approve with quality threshold)
4. Pool monitor: if active count < `pool_floor`, flag in admin dashboard for manual intervention

**Critical constraint:** Generation batch size should be capped. Generating
20+ questions per run from a single news cycle produces duplicate angles on
the same fact. 10–15 per run is the right ceiling.

---

### 2. Collection Muting (Well-Being UX)

**Finding:** No major consumer news app has shipped a production
well-being-framed mute specifically tested at scale. The BBC ran an internal
prototype ("mood filter") that tested sentiment-tagged articles with a
user-controlled blur/hide control. It was tested only with young existing
news readers and was never released.

Apple News uses a plain "Block Topic" verb with no well-being framing.
Google News uses "Not interested" — preference language, not well-being
language.

**The research consensus on well-being-framed opt-out (trauma-informed
design literature, ACM Games research, content warning studies):**

1. The framing must be about preparation and autonomy, not about avoidance.
   "You're in control of what you engage with" outperforms "hide disturbing content."
2. The opt-out must not make the user feel foolish or fragile for using it.
   No microcopy like "Are you sure?" or "You might miss important news."
3. The control must be reversible and findable — not buried in settings.
4. The label should describe what the collection is, so the user knows
   what they are muting before muting it: "War in Ukraine — ongoing
   armed conflict coverage" lets the user make an informed choice.

**Recommended UX pattern:**

- Surface the mute control inline in the collection picker, not in Settings.
- Use a toggle with label: "Pause this collection"
- Secondary copy: "You won't see this in your collection list until you turn it back on."
- Do NOT say "hide" or "block" — those connote filtering. "Pause" connotes
  a temporary, reversible choice the user is in control of.
- Muted collections still appear in the picker — they show a "Paused" pill
  badge and a one-tap restore. They do not disappear entirely. (Disappearing
  them means users lose the ability to find and re-enable them easily.)
- No confirmation dialog on mute — the restore path is the undo.

**What muting must NOT do:**
- Affect question content inside other collections (it is collection-scoped only, as decided)
- Affect the player's XP or gem accumulation (muted collections should still
  accumulate stats when played if the player navigates there directly)
- Trigger any "are you sure" retention dialogs

---

### 3. Topic Volatility and Expiry Duration

The core insight is that expiry duration should track the rate at which
the **correct answer** is likely to change, not the rate at which news
articles are published.

**Volatility taxonomy:**

| Topic Type | Answer Stability | Recommended `expiresAt` | Rationale |
|------------|-----------------|------------------------|-----------|
| Active armed conflict (front lines, commanders, control of territory) | Days | 3–5 days | Ground truth changes with battle reports |
| Ceasefire / peace negotiations | Weeks | 7–14 days | Can collapse or advance quickly |
| Ongoing diplomacy / UN resolutions | Months | 14–21 days | Changes, but on legislative/diplomatic timescale |
| Legislation (introduced, passed, signed) | Stable after passage | 30 days for "introduced/pending"; no expiry for "signed into law" | Passage is a permanent fact; pending status is volatile |
| International agreements (Paris, trade deals) | Stable (can be withdrawn) | 60 days | Rare reversals but possible; periodic re-check |
| Who holds an office or role | Term-dependent | Until next election / appointment cycle | Reuse existing officeholder expiry pattern |
| Historical fact (date of event, casualty count when conflict ended) | Permanent | No expiry | Closed facts don't change |

**Practical implication:** A single topic collection (e.g., "War in Ukraine")
will contain questions with wildly different expiry windows. Active-status
questions expire in 3–5 days; historical facts about the origin of the
conflict never expire. The pipeline must tag each question with a volatility
class at generation time, not apply a single expiry to the whole collection.

**Recommended volatility field:**
Add `volatility_class` to the question model: `fast` (3–5d), `medium`
(7–14d), `slow` (21–30d), `stable` (no expiry). The pipeline prompt instructs
Claude to classify each question at generation time. Admin can override.

---

### 4. Fact Snapshot / Historical Archive

**Finding:** The "archive rather than delete" pattern is standard across
learning management systems (Moodle, LearnDash, Canvas) and aligns with
user expectations from educational software — users expect old questions to
remain accessible as a historical record.

For news trivia specifically, expired questions have secondary value:
- They are evidence that the collection covered a topic at a given time
- They can be surfaced as "retrospective" questions ("In 2025, who was
  commanding Russian forces in the Zaporizhzhia region?")
- They allow admin auditing of generation quality over time
- They support a potential future "History of this conflict" view

**Recommendation:** Expire to `archived` status (the existing pattern).
Do not delete. Archived questions retain all metadata including `expiresAt`
timestamp and `source_url` references.

**What users do NOT expect:** They do not expect to see archived questions
during normal gameplay unless explicitly placed in a "historical" context.
Serving archived questions in the main play rotation would feel like
playing outdated content — that is the one pattern to avoid.

**Future affordance (not v2.5):** A "This week in history" retrospective
mode that intentionally serves expired questions from prior news cycles as
historical trivia. Archive now to enable this later.

---

### 5. International Tier in Collection Picker

**Finding:** No consumer app has a direct analog to a live-refreshed
"International" section alongside geographic tiers. The closest patterns are:

- Apple News "Following" section — curated by the user, not system-curated
- Google News "For You" — personalized, not topic-specific
- Year-end news quizzes (Foreign Policy, Chatham House, CNN) — annual
  snapshots, not live collections

**Key difference for CTC International tier:** The collections are
ephemeral-topic-based (e.g., "War in Ukraine"), not geography-based. This
means they have a lifespan — they may not be relevant forever. That is a
fundamentally different contract with the player than "New York State"
(which will always be available).

**Recommended picker behavior:**

1. **Section label:** "International" (not "World News" — avoids implication
   of comprehensive coverage, which RSS-based generation cannot provide)
2. **Freshness indicator:** Show relative time since last question was added,
   e.g., "Updated 2 hours ago" or "Updated today." Do not show a count of
   new questions (creates pressure to play immediately). Simple recency text
   is sufficient.
3. **Freshness indicator placement:** Below the collection name in the card,
   in a subdued style (not a badge/pill — that implies urgency). Think of it
   as a timestamp, not a notification.
4. **Sort order:** Within the International section, sort by recency of last
   update (most recently updated collection appears first). This surfaces the
   "hottest" topic naturally without explicit editorial curation.
5. **Muted indicator:** A "Paused" pill replaces the freshness indicator when
   the collection is muted. The collection stays in the list.
6. **Empty state:** If a collection's active pool falls below the `pool_floor`
   and generation has not run yet, show the collection as "New questions
   coming soon" rather than hiding it. Hiding creates confusion about
   whether the topic has been retired.
7. **Retired collections:** When a topic is truly over (e.g., a specific
   crisis that has concluded), admin can mark it as `concluded`. Concluded
   collections show a visual distinction (greyed out or labeled "Archived
   topic") and remain browsable but do not receive new questions.

**Contrast with Federal/State/City behavior:**
- Geographic collections are permanent; they have no freshness indicator
  because civic facts are not expected to change daily.
- International collections are time-sensitive; freshness is a signal of
  reliability, not just engagement.
- The International section should visually read as "current events,"
  while Federal/State/City reads as "evergreen civics."

---

### 6. Sub-Collection vs. Aggregated "World News" Bucket

**Finding:** Neither news aggregators nor trivia platforms publish explicit
thresholds for when a topic earns its own collection. The editorial logic is
derivable from first principles and analogy.

**The core question:** Does the topic have enough facts with distinct
correct answers to fill a 40-question pool that doesn't feel repetitive?

**Recommended threshold for standalone collection:**
A topic warrants its own collection when:
1. It can generate 40+ factually distinct questions without redundant angles
2. It is expected to produce new facts for at least 30 days
3. It has a clear civic/policy dimension (not just human interest)
4. It is comprehensible as a coherent topic to a casual news reader

**When to group into "World News" instead:**
- Topic is too narrow to sustain 40 questions (e.g., a single summit meeting)
- Topic is too short-lived (a one-week story)
- Topic lacks a civic dimension (celebrity news, entertainment)

**The aggregated bucket paradox:** A "World News" catch-all creates a
mixing problem — players may get questions about Ukraine mixed with
questions about the Federal Budget, which feels incoherent. The collection
should feel like a coherent game session. If "World News" becomes a grab-bag,
the player experience degrades.

**Recommended rule:** Build "World News" as a fallback container for stories
that don't warrant standalone collections, but cap it at the same 40–80
question pool. When a story within "World News" accumulates enough coverage
to warrant graduation to its own collection, the admin can spin it off.
"World News" questions can be re-tagged to the new collection.

**Practical boundary examples:**

| Topic | Verdict | Reason |
|-------|---------|--------|
| War in Ukraine (ongoing, 3+ years) | Standalone | Sustained facts, 40+ distinct angles, civic dimension |
| UN Climate Agreements | Standalone | Policy-dense, persistent, distinct from other collections |
| US Federal Budget Negotiations | Standalone | High civic relevance, annual cycle, distinct questions |
| Summit between two leaders (one week) | World News bucket | Single event, insufficient standalone volume |
| International election monitoring (WHO/UN missions) | Standalone if major; World News if minor | Depends on question volume |
| Gaza / Middle East conflict | Standalone | Sustained, policy-dense, high news volume |

---

## Table Stakes

Features the International Collections tier must have to be viable.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **Daily RSS ingestion pipeline** | The whole tier depends on freshness; without automation, curation is unsustainable | High | None (net new) |
| **Per-question volatility classification** | Expiry without classification produces either stale questions (too long) or empty pools (too short) | Medium | Extends existing `expiresAt` model |
| **Pool floor monitoring + admin alert** | Admin needs to know when a collection is degrading before players see empty states | Low | Existing admin panel |
| **Archived (not deleted) expired questions** | Preserves trust, enables auditing, unlocks future retrospective modes | Low | Existing `archived` status pattern |
| **"Paused" collection mute at collection level** | Well-being control; without it the product ships potentially distressing content with no opt-out | Medium | Collection picker UI |
| **Freshness indicator on International collection cards** | Signals to players that content is live, distinguishes tier from static collections | Low | Collection picker UI |
| **Draft → active admin review for generated questions** | Safety gate on AI-generated news content; prevents factual errors reaching players | Low | Existing admin review queue |
| **Source attribution on each question** | Admin must be able to verify facts against source; players need provenance for controversial answers | Medium | Question data model |
| **"Updated today" / "Updated X hours ago" timestamp** | Core signal that distinguishes International from static collections | Low | Collection metadata |
| **International section grouping in picker** | Structural separation from Federal/State/City tiers | Low | Collection picker UI |

---

## Differentiators

Features that make International Collections meaningfully better than static collections and better than a generic current-events quiz app.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|-------------|
| **Volatility-aware expiry** (`fast`/`medium`/`slow`/`stable` classes) | No other civic trivia product adjusts question shelf life to topic type; delivers always-current pool | Medium | Extends `expiresAt` model; requires pipeline prompt engineering |
| **Standalone topic collections (not just a catch-all)** | Players choose what they engage with; "War in Ukraine" vs. "Climate Agreements" is a meaningful choice; respects the well-being mute design | Medium | Collection creation tooling; admin can spawn new collections |
| **Well-being mute with "Pause" framing** | Thoughtful, reversible control; positioned as empowerment not avoidance; no other trivia app does this | Medium | Collection picker UI; user preference storage |
| **Source tier transparency (Tier 1 .gov/UN vs Tier 2 AP/BBC)** | Signals question credibility; civic app should model source literacy | Low | Question metadata; admin tooling |
| **Graduated question lifecycle within a topic** (fact introduced → fact stabilizes → fact becomes history) | Questions evolve with the news cycle; "Who commands X?" transitions from expiring to historical fact when the conflict ends | High | Pipeline logic; admin tooling; future enhancement |
| **Admin-spawned new collections from pipeline data** | Admin sees coverage density in a topic and clicks "Spin off as standalone collection"; no code required | Medium | Admin UI; collection creation tooling |
| **"Concluded topic" state for ended stories** | Graceful retirement of collections when events conclude; preserves historical access | Low | Collection status model |
| **Retrospective mode hook (future)** | Archive today to enable a "This week in history" mode later; design for it now even if not built in v2.5 | Low (to hook); High (to build) | Archived question metadata |

---

## Anti-Features

Things to deliberately NOT build in v2.5.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Fully automated publish (no admin review)** | AI-generated news content will produce factual errors, hallucinations about recent events, and potentially harmful framings. Auto-publish to players is a safety failure, not a speed gain. | Keep draft → active admin review gate. Target < 24h review SLA. |
| **Question-level muting / keyword filtering** | Implementing this correctly requires sentiment analysis, is brittle, and creates a false sense of safety. The BBC mood filter prototype was never shipped for this reason. | Mute at collection level only. If a player doesn't want war content, they mute the war collection. |
| **"You might miss breaking news" retention messaging** | This is a dark pattern that exploits anxiety to prevent muting. It directly violates the well-being framing. | Reversible mute with no copy pressuring the user to stay. |
| **Real-time / live-updating questions mid-session** | A question that changes its correct answer while a player is in a session is catastrophic UX. | Expiry only between sessions, never during. The hourly cron fires at session boundaries. |
| **Paid news API integrations** | Already decided against (project context). Not in v2.5. | RSS + HTTP fetch from Tier 1/Tier 2 sources only. |
| **Prediction / opinion questions ("Who will win?")** | These are not factual. They create gambler-framing, not civic learning. Already excluded from election pipeline — apply same rule here. | Only questions with a definitive correct answer sourced to a verifiable fact. |
| **Question-level source credibility scores visible to players** | Would distract from gameplay and imply player should be fact-checking during the game. | Keep source tier metadata admin-only. Players see "Source: Reuters" on answer reveal if source attribution is shown, not a credibility score. |
| **Aggregated "all topics" World News catch-all as the only International collection** | Produces incoherent play sessions; undermines topic-specific muting; degrades question relevance | Use standalone collections per topic; World News bucket is a fallback only, not the primary pattern. |
| **Infinite pool growth (no ceiling)** | Without a `pool_ceiling`, a prolific pipeline creates a pool with hundreds of questions, causing duplicated topic angles and diluted difficulty calibration. | Enforce `pool_ceiling` = 80; pause generation when ceiling is reached. |
| **Retroactive question correction after archive** | Correcting archived questions breaks the "historical record" contract and introduces integrity questions ("was this always the answer?"). | Archived questions are read-only. If a fact was wrong, archive the question and generate a corrected replacement. |

---

## Feature Dependencies

```
RSS ingestion pipeline
  └── per-question volatility classification
        └── volatility-aware expiresAt assignment
              └── pool floor monitoring
                    └── admin alert in dashboard

Collection mute (Pause)
  └── user preference storage (per-user, per-collection)
        └── muted state shown in collection picker
              └── "Paused" pill replaces freshness indicator

Freshness indicator
  └── collection.last_question_added_at timestamp (new field)
        └── relative time display in collection card

Source attribution
  └── question.source_url + question.source_tier fields (new)
        └── shown to admin in review queue
              └── optionally shown to player on answer reveal
```

---

## MVP Recommendation for v2.5 International Tier

**Must ship for the tier to be viable:**
1. RSS ingestion pipeline with draft generation
2. Admin review queue for generated questions (already exists for regular questions — extend it)
3. Per-question volatility classification and `expiresAt` assignment
4. Pool floor monitoring with admin dashboard alert
5. At least 2 standalone collections at launch (recommend: one active conflict, one policy topic)
6. International section in collection picker with freshness indicator
7. Collection-level Pause (mute) with well-being framing

**Defer to post-v2.5:**
- "Concluded topic" visual state (low value at launch with few collections)
- Source tier transparency for players (admin-only is sufficient for v2.5)
- Admin-spawned collections from pipeline data (manual creation is fine initially)
- Retrospective / "This week in history" mode
- Graduated lifecycle (fact → history transition) — complex; phase 2 of International

---

## Sources

- BBC mood filter experiment (2019, journalism.co.uk) — LOW-MEDIUM confidence; single source, prototype never shipped
- Apple News block/follow documentation (official Apple Support, 2025) — HIGH confidence
- ACM Games Research: content warnings in games (2024, dl.acm.org/doi/10.1145/3638287) — MEDIUM confidence (fetched; referenced via search)
- UX Content Collective: trauma-informed design — MEDIUM confidence (referenced via search)
- Deque Systems: "My Trigger, My Choice" content warning design — MEDIUM confidence
- Content Design London: trauma-informed content design — MEDIUM confidence
- Duolingo Daily Refresh design case study (devansh.design) — MEDIUM confidence; single designer's case study but aligns with public Duolingo feature
- Ham radio question pool management (hamstudy.org) — HIGH confidence for pool versioning analogy only
- Material Design 3 badge guidelines (m3.material.io) — HIGH confidence for freshness indicator pattern
- NN/G: Indicators, Validations, and Notifications — HIGH confidence for badge/indicator UX principles
