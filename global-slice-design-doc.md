# Global Slice — Feature Design Document
**Civic Trivia Championships | Empowered Vote**
*Last Updated: April 2026*

---

## Overview

**Global Slice** is a living, expiring trivia collection within Civic Trivia Championships that reflects the current state of the world. Unlike static question banks, Global Slice is refreshed daily by an AI pipeline that reads global headlines, synthesizes factual claims, and generates sourced trivia questions. The collection is designed to keep civic knowledge current without requiring manual editorial work — while upholding strict standards for accuracy, nonpartisanship, and source reliability.

---

## Goals

- Give players a reason to return daily — the world has changed, and so has the quiz.
- Model responsible civic information: every question is traceable to a real, trusted source.
- Respect player sensitivity — users can mute sub-collections tied to topics they find distressing or triggering.
- Maintain a healthy pool size automatically, self-regulating expiry duration and daily output volume.

---

## Collection Architecture

Global Slice is not a flat list of questions. It is a **hierarchical collection** — a parent container made up of active sub-collections, each representing a distinct topic cluster.

```
Global Slice (parent collection)
├── War in Ukraine        [sub-collection]
├── Conflict in Gaza      [sub-collection]
├── Venezuela Crisis      [sub-collection, may be inactive]
├── Federal Budget        [sub-collection]
├── Climate Agreements    [sub-collection]
└── ...                   [dynamically added / retired]
```

### Sub-Collections

Each sub-collection is a **topic cluster** with its own:
- Active/inactive status (a topic may become dormant when it leaves the news cycle)
- Mute eligibility (players can mute any sub-collection)
- Independent question expiry rhythms (a fast-moving conflict may expire faster than a budget question)

Sub-collections are created by the AI pipeline when a new major topic emerges, and are **retired** (not deleted) when they fall below a minimum question threshold and have had no new questions added in N days.

### Questions

Each question belongs to exactly one sub-collection and has:
- A **publish date**
- An **expiry date** (computed at creation time based on pool regulation logic)
- A **source citation** (URL + publication + date accessed)
- A **confidence tier** (see Quality Standards below)
- A **fact snapshot** — a brief locked summary of the factual claim the question tests, recorded at time of generation (so even after the question expires, the historical record is preserved)

---

## Daily AI Generation Pipeline

### Trigger
Once per day (recommended: 2–4 AM local server time), an automated job runs the generation pipeline.

### Step 1 — Headline Ingestion
The pipeline reads **RSS feeds** from a curated set of trusted global news sources (see Source Tier List), then **fetches full article pages via HTTP** for claim extraction. No paid news APIs are used — only free, publicly accessible feeds and pages. It retrieves top headlines from the last 24 hours, filtered for civic relevance: governance, international relations, economics, public policy, elections, humanitarian issues.

### Step 2 — Claim Extraction
For each headline cluster, the AI identifies **discrete, verifiable factual claims**. A claim is eligible if:
- It can be expressed as a question with a single defensible correct answer
- The answer existed in the public record at time of generation
- The claim does not require the player to infer motive, assign blame, or evaluate contested interpretations

Examples of **eligible claims:**
> "As of [date], Ukraine controls approximately X% of the territory it held before February 2022."
> "The UN Security Council voted [X]-[Y]-[Z] on Resolution [N] regarding [topic]."
> "The U.S. allocated $[X] billion to [program] in the [year] budget."

Examples of **ineligible claims:**
> "Who is responsible for the humanitarian crisis in [region]?" — assigns blame
> "Which side has committed more violations?" — contested and partisan
> "Is [policy] effective?" — requires value judgment

### Step 3 — Question Generation
For each approved claim, the AI generates:
- A trivia question (multiple choice, 4 options)
- A correct answer with a short factual rationale (~2 sentences)
- A source citation
- A suggested sub-collection assignment (new or existing)
- A suggested expiry duration based on topic volatility (see Pool Regulation)

### Step 4 — Quality Gate
Before any question is committed to the database, it passes through an automated quality gate that checks for:

| Check | Method |
|---|---|
| Fallacy flags | Prompted self-evaluation: "Does this question assume causation, use loaded language, or imply a partisan framing?" |
| Source validity | Source URL domain checked against Tier 1/2 approved list |
| Answer defensibility | AI asked to argue against its own answer — if it can, the question is flagged for human review |
| Factual currency | Claim timestamped; question marked as expiring before the next election cycle or major anticipated update |

Questions that fail automated checks are queued for **human editorial review**, not auto-rejected (to preserve edge cases that may still be valid).

### Step 5 — Pool Regulation Check
After generation, the system calculates the current pool size and adjusts if needed (see Pool Regulation below).

### Step 6 — Publish
Approved questions are published to Global Slice, assigned to their sub-collections, and made available to players immediately.

---

## Pool Regulation

The target pool is **40–80 active questions** at any given time. The pipeline self-regulates to stay in this range.

### Regulation Logic

```
current_pool = count of non-expired questions in Global Slice

if current_pool < 40:
    target_daily_output += 2
    avg_expiry_duration -= 1 day (floor: 3 days)

if current_pool > 80:
    target_daily_output -= 2
    avg_expiry_duration += 1 day (ceiling: 14 days)

if 40 <= current_pool <= 80:
    hold steady
```

### Default Parameters (Starting Point)

| Parameter | Default |
|---|---|
| Target pool size | 40–80 questions |
| Default daily generation target | 8–12 questions |
| Default expiry duration | 5–7 days |
| Minimum expiry duration | 3 days |
| Maximum expiry duration | 14 days |
| Daily generation floor | 3 questions |
| Daily generation ceiling | 20 questions |

### Topic Volatility Modifiers
Some topics warrant shorter expiry windows because facts change faster:

| Topic Type | Expiry Modifier |
|---|---|
| Active armed conflict (casualty counts, territorial control) | −2 days |
| Election results / vote counts | −1 day (expires after certification) |
| Budget / legislation (passed and signed) | +3 days (more stable) |
| Climate data / treaties | +2 days |
| UN resolutions / international agreements | No modifier |

---

## Quality Standards & Source Tiers

### Source Tier List

**Tier 1 — Primary Sources** *(highest weight, preferred)*
- Official government portals (.gov, parliament sites, UN, EU official bodies)
- UN agencies (UNHCR, WHO, WFP, UNICEF, OCHA)
- International courts and treaty bodies (ICJ, ICC)
- Central banks and finance ministries

**Tier 2 — Established Journalism**
- Reuters, Associated Press, AFP
- BBC News, NPR, PBS NewsHour
- The Guardian, Le Monde, Der Spiegel, Al Jazeera English
- Major regional papers of record

**Tier 3 — Academic / Research**
- Peer-reviewed outlets and think tanks with disclosed funding
- RAND Corporation, Brookings, Pew Research
- Academic journals

**Not Eligible**
- Outlets with documented history of factual inaccuracy
- Paywalled sources the player cannot verify
- Social media posts, even from official accounts (unless corroborated by Tier 1/2)
- Partisan advocacy organizations

### Fallacy & Framing Guardrails

The AI pipeline is explicitly prompted to avoid:
- **False equivalence** — treating positions with vastly different evidence bases as equal
- **Appeal to authority** — citing a source without noting its limitations when relevant
- **Loaded language** — "invasion," "liberation," "terrorist," "freedom fighter" — questions use neutral descriptors or quote official designations with attribution
- **Recency bias** — a dramatic recent event doesn't override well-established prior context
- **Omission framing** — questions don't imply causation by selective inclusion of facts

Where a **contested fact** is unavoidable (e.g., casualty counts from multiple parties that disagree), the question is framed around the disagreement itself:
> "As of [date], estimates of civilian casualties in [conflict] ranged from X (per [org]) to Y (per [org]). Which of the following most accurately reflects the UN's reported figure?"

---

## User Muting (Sub-Collection Controls)

### Player Experience

In the player's settings or mid-game, they can view a list of active sub-collections within Global Slice and toggle any of them off. Muted sub-collections:
- Are hidden from their question feed
- Do not count against their daily streak
- Do not appear in score breakdowns
- Are remembered across sessions

Muting is presented compassionately, not as a content preference but as a **well-being control:**
> *"Some topics in Global Slice touch on ongoing conflicts or crises. You can pause any of these — they'll be here when you're ready."*

### Muting Scope
Muting operates at the **sub-collection level**, not at the individual question level. This is intentional — it reduces decision fatigue and prevents players from curating out inconvenient truths while keeping the controls meaningfully expressive.

Players cannot mute the entire Global Slice parent collection from within the muting UI — that would be accomplished by simply not playing Global Slice mode. This distinction preserves the integrity of "I'm engaging with the world, just not this specific ongoing situation right now."

### Future: Mute Recommendations
As muting data accumulates, the platform may surface gentle prompts:
> *"You've had [War in Ukraine] muted for 30 days. It's still active. Want to take a look at what's changed, or keep it paused?"*

This is opt-in behavior and subject to user consent settings.

---

## Data Model (Sketch)

```
collections
  id, name, parent_collection_id (nullable), is_active, created_at, retired_at

questions
  id, collection_id, question_text, correct_answer, distractors (json),
  rationale, source_url, source_name, source_date,
  published_at, expires_at, fact_snapshot, confidence_tier,
  flagged_for_review (bool), generation_job_id

generation_jobs
  id, ran_at, questions_generated, questions_flagged, pool_size_before,
  pool_size_after, expiry_target_used, daily_target_used

user_collection_mutes
  user_id, collection_id, muted_at, unmuted_at (nullable)
```

---

## Decisions

1. **Who reviews flagged questions?** — The CTC admin. Flagged questions queue for admin review before or after publish (not auto-rejected).
2. **How are sub-collections created?** — Primarily automated: the AI pipeline identifies when a new topic cluster warrants its own sub-collection and creates it. Admins can also manually create or retire sub-collections.
3. **What happens when a fact is later proven wrong?** — Two-tier correction flow:
   - **Admins** can archive a question directly (removes it from active play).
   - **Non-admins** can raise its visibility (flag it for admin review), surfacing it in the admin queue without removing it.
   - No silent deletions — archived questions are retained in the database with a status of `archived` and a correction note.
4. **Streak and scoring implications** — Deferred. Not a priority for initial implementation.
5. **Localization** — Same content globally for now. Questions are written to be fair, sourced, and framing-neutral for any audience.
6. **Pipeline cost model** — No paid external APIs. The pipeline uses free RSS feeds + public HTTP fetching for ingestion, and Claude (already in use) for generation. Supabase handles storage (already in use). Zero additional spend required.

---

## Future Directions

- **Federal Slice** — A parallel collection scoped to domestic U.S. policy, following the same architecture. Questions like *"What percentage of the FY2026 federal budget is allocated to defense?"* live here, not in Global Slice.
- **Player-suggested topics** — Verified Empowered users can submit topic suggestions for new sub-collections, subject to editorial approval.
- **Expiry archive** — Expired questions don't disappear — they move to a browsable historical archive. Players can explore "what the world looked like" on any given week.
- **Transparency log** — A public-facing log of every generation job: how many questions were made, how many were flagged, what sources were used. Radical transparency as a platform value.

---

*This document reflects decisions made as of April 2026. Ready for implementation planning.*
