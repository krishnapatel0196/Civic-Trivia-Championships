# Features Research: v1.7 Live Civic Intelligence

**Project:** Civic Trivia Championship
**Researched:** 2026-02-25
**Focus:** Election question lifecycle patterns, Norwich content categories, address/phone quality rule

---

## Election Question Pipeline

### Table Stakes

These must work for the feature to deliver value:

- **Race-specific question generation** — questions reference actual candidate names, seat names, and election dates. "Which candidates are running for Fremont City Council District 2?" is table stakes; generic "Who runs for city council?" is not.
- **Election-day expiration** — questions automatically expire via existing cron sweep when election day passes. No manual cleanup needed.
- **Election race data model** — race metadata (seat, candidates, election date, jurisdiction) stored in DB so generation and follow-up are linked to the same race.
- **Admin activation gate** — generated election questions go to `draft` status; admin reviews and activates before players see them. Prevents unreviewed content from appearing.
- **Follow-up question generation** — after admin enters election result, generates historical/outcome questions ("Who won the 2026 Fremont mayoral race?") that don't expire.

### Differentiators

- **Election lifecycle continuity** — questions evolve with the race: primary → general → result → term context. Most trivia apps are static; this one ages gracefully.
- **Hyper-local candidate trivia** — "Who is running for Bloomington City Council Ward 3?" is genuinely valuable to Bloomington players. No generic trivia app covers this.
- **Timed relevance** — knowing the answer has real-world utility. Players can actually use this knowledge to vote more informedly.

### Anti-Features (Deliberately NOT Building)

- **Real-time candidate tracking** (automated scraping of county portals) — too fragile for v1.7. Admin entry is the right starting point.
- **Policy position questions** — "Which candidate supports rent control?" invites partisan framing, which violates the brand's no-dark-patterns principle. Stick to factual: who is running, what seat, what party, what date.
- **Prediction questions** — "Who do you think will win?" is not civic learning. Avoid speculation.
- **Campaign finance questions** — dollar amounts change, sources vary, quickly outdated.

### Question Templates (with Examples)

**Before the election (expires on election day):**

```
Primary race — candidates:
"Which two candidates are running in the Democratic primary for [SEAT]?"
A) [Cand1] and [Cand2]  ← correct
B) [Cand3] and [Cand4]
C) [Cand1] and [Cand3]
D) [Cand5] and [Cand6]

Single candidate identity:
"Which candidate is challenging the incumbent in the [SEAT] race?"
A) [Challenger Name]  ← correct
B) [Wrong name from different race]
C) [Former candidate]
D) [Different office holder]

Party/role questions:
"What party does [Candidate Name] represent in the [YEAR] [SEAT] election?"
A) [Correct party]  ← correct
B) [Wrong party]
```

**After the election (no expiry — permanent historical fact):**

```
"Who won the [YEAR] election for [SEAT] in [Jurisdiction]?"
A) [Winner Name]  ← correct
B) [Runner-up]
C) [Other candidates]
```

### Expiry Timing Patterns

**Recommendation: expire at end of election day**

Set `expiresAt = election_date + "T23:59:59Z"` (in the jurisdiction's local timezone).

- "Who is running in Tuesday's election?" is still valid on election day itself (voters use it)
- The question becomes stale the morning after — people know the result
- The hourly cron sweep will archive it overnight

**Do NOT expire day-before:** Players actively want to test their knowledge the day of an election.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Unopposed race** | Skip candidate identity questions. Generate: "What seat is running unopposed in [Jurisdiction] in [YEAR]?" — focuses on the race itself |
| **Crowded primary (5+ candidates)** | Generate 2-3 questions about key candidates (incumbents, top challengers). Use partial lists: "Which of these candidates IS running for [SEAT]?" |
| **Candidate withdraws after questions go live** | `withdrew` flag on candidate object. Admin archives the question set and re-generates with corrected list |
| **Runoff election** | Treat as new `election_type = 'runoff'` race. Generate fresh questions after primary result is entered |
| **Special elections** | Same pipeline — admin enters the race, cron detects it within 60-day window |
| **By-election (UK)** | `election_type = 'by-election'`, same flow. Democracy Club tracks these |

---

## Election Lifecycle Follow-up Questions

The question types at each stage:

### Stage 1: Before Primary (expires on primary day)
- Who is running for [seat]?
- What party does [candidate] represent?
- Is [candidate] the incumbent?
- How many candidates are running for [seat]?

### Stage 2: After Primary (expires on general election day)
- Who won the [party] primary for [seat]?
- Who will face [winner] in the general election for [seat]?
- Is the incumbent advancing to the general election?

### Stage 3: After General (no expiry — permanent)
- Who won the [year] general election for [seat]?
- Who represents [jurisdiction] as [title] following the [year] election?
- What is [officeholder]'s term length for [seat]?

### Stage 4: Current Term (optional, expires when term ends)
- Who currently serves as [title] for [jurisdiction]?
- When does [officeholder]'s current term expire?

---

## Norwich, England Content

### Recommended Categories

| Category | Rationale | Target Count |
|----------|-----------|-------------|
| **City government & council** | Core civic knowledge — 39 councillors, 13 wards, City Hall | 12-15 |
| **Civic history** | Norwich was England's second city — rich distinctive history | 15-20 |
| **Notable landmarks & institutions** | Cathedral, Castle, UEA, The Forum, Norwich Market | 10-12 |
| **Local economy & culture** | City of Ale, Norwich Lanes, Colman's mustard, shoe industry | 8-10 |
| **Norfolk County context** | Two-tier government: City Council + Norfolk County Council | 5-8 |
| **Sports & community** | Norwich City FC ("The Canaries"), "On the Ball City" | 5-8 |

### Example Questions (10 samples)

1. *"What was Norwich's distinction among English cities during the medieval period?"*
   A) It was England's second-largest city after London ← correct
   B) It was the first city to receive a Royal Charter
   C) It had more churches than any city in Europe
   D) It was the capital of the Danelaw

2. *"In 1549, Robert Kett led a major rebellion in Norwich against what practice?"*
   A) The enclosure of common lands ← correct
   B) Forced conscription into the navy
   C) The dissolution of monasteries
   D) New taxes on wool merchants

3. *"What is unique about Norwich Cathedral's cloisters compared to other English cathedrals?"*
   A) They are the largest monastic cloisters in England ← correct
   B) They are the oldest surviving Norman cloisters
   C) They were built entirely by local craftsmen
   D) They contain Europe's largest collection of misericords

4. *"Norwich City FC's anthem 'On the Ball City' holds what distinction?"*
   A) It is the oldest football song still sung in the world ← correct
   B) It was the first football song broadcast on national radio
   C) It was written by a Norwich City mayor
   D) It was adopted as the official Norfolk county song

5. *"How is Norwich City Council structured in terms of wards and councillors?"*
   A) 13 wards with 3 councillors each (39 total) ← correct
   B) 10 wards with 4 councillors each (40 total)
   C) 15 wards with 2 councillors each (30 total)
   D) 12 wards with 3 councillors each (36 total)

6. *"Norwich City Hall, opened in 1938, overlooks which historic Norwich landmark?"*
   A) Norwich Market ← correct
   B) Norwich Cathedral
   C) The Forum
   D) Norwich Castle

7. *"What food company, founded in Norwich in 1814, became synonymous with English mustard?"*
   A) Colman's ← correct
   B) Keen's
   C) Taylors
   D) Mornflake

8. *"The Forum, completed in 2001, replaced what building that was destroyed by fire?"*
   A) Norwich Central Library ← correct
   B) The old City Hall
   C) The Corn Exchange
   D) The medieval Guildhall

9. *"Which body is responsible for roads, schools, and social care in Norwich — as opposed to the City Council?"*
   A) Norfolk County Council ← correct
   B) East Anglia Regional Authority
   C) Norwich Metropolitan Council
   D) The Greater Norwich Combined Authority

10. *"Norwich appears in the Domesday Book of 1086 as one of England's largest towns with approximately how many inhabitants?"*
    A) 6,000 ← correct
    B) 2,000
    C) 15,000
    D) 10,000

### Sensitive Topics to Avoid

- **Specific current politicians' personal details** — stick to roles and structures, not individuals
- **Brexit** — rapidly dated, highly divisive
- **Norwich City FC relegation/promotion** — changes season-to-season, poor trivia
- **Norfolk County Council vs City Council jurisdiction disputes** — politically contentious
- **UEA scandals or controversies** — not civic government

### Sources for Norwich Generation

- norwich.gov.uk — official city council site, ward/councillor data
- norfolk.gov.uk — county council (for two-tier government questions)
- visitnorwich.co.uk — local history and landmarks
- democracyclub.org.uk — election candidate data
- wikipedia.org/wiki/Norwich — well-sourced civic history article
- theforumnorwich.co.uk — The Forum

---

## Address/Phone Quality Rule

### What to Detect

The rule should flag questions where **any of the multiple choice options** is a phone number or street address. These should never be correct answers; they also shouldn't appear as plausible wrong answers.

### Detection Patterns

```
Phone numbers:
- US: /\b\(\d{3}\)\s*\d{3}[-.\s]\d{4}\b/        # (510) 272-6933
- US alt: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/      # 510-272-6933
- UK local: /\b0\d{4}\s\d{6}\b/                   # 01603 123456
- UK mobile: /\b07\d{3}\s\d{6}\b/                 # 07700 900123

Street addresses (US):
- /\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Way|Boulevard|Blvd|Court|Ct)\b/i

Street addresses (UK):
- /\b\d+\s+[A-Z][a-z]+\s+(Street|Road|Lane|Avenue|Close|Way|Drive|Place|Row|Gate)\b/i

UK postcodes:
- /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i       # NR1 3JQ
```

### Edge Cases: Allow vs Block

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| "What is the area code for Norwich?" / Answer: "01603" | **Advisory flag** | Area codes are civic geography but borderline |
| "Where is City Hall located?" / Answer: "City Hall Square, Norwich" | **Advisory flag** | Named civic places are legitimate landmarks, not postal addresses |
| "What is the phone number for the County Registrar?" / Answer: "(510) 272-6933" | **Flag (clear violation)** | Phone numbers as correct answers have no civic learning value |
| "Which of these is the ZIP code for Bloomington, IN?" / Answer: "47401" | **Advisory flag** | ZIP codes are mild civic geography — borderline, worth reviewing |
| "What is the address of the White House?" / Answer: "1600 Pennsylvania Avenue" | **Advisory flag** | Famous addresses that are civic landmarks are borderline |

### Severity: Advisory (not blocking)

Address/location questions can be legitimate civic content when the question is about a named landmark or government seat. The rule should **flag for human review** rather than auto-archive. Blocking severity would catch legitimate "Where is [government building] located?" questions.

---

*Research completed: 2026-02-25*
