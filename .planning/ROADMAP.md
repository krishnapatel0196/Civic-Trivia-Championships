# Roadmap: Civic Trivia Championship

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-13)
- ✅ **v1.1 Production Hardening** - Phases 8-12 (shipped 2026-02-18)
- ✅ **v1.2 Community Collections** - Phases 13-17 (shipped 2026-02-19)
- ✅ **v1.3 Question Quality & Admin Tools** - Phases 18-22 (shipped 2026-02-20)
- ✅ **v1.4 Fremont, CA Collection** - Phases 23-26 (shipped 2026-02-21)
- ✅ **v1.5 Feedback Marks** - Phases 27-30 (shipped 2026-02-22)
- 🚧 **v1.6 Content Quality & Scale** - Phases 31-34 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-02-13</summary>

### Phase 1: Project Setup
**Goal**: Development environment ready for rapid iteration
**Plans**: 3 plans

Plans:
- [x] 01-01: Initialize project structure, configure build tools, set up Git
- [x] 01-02: Establish frontend foundation with React, TypeScript, Vite, Tailwind
- [x] 01-03: Establish backend foundation with Node.js, Express, TypeScript

### Phase 2: Authentication System
**Goal**: Users can create accounts and log in securely
**Plans**: 4 plans

Plans:
- [x] 02-01: Database schema for users table
- [x] 02-02: Backend auth endpoints (register, login, logout)
- [x] 02-03: JWT token generation and validation
- [x] 02-04: Frontend auth UI and session persistence

### Phase 3: Game Flow Foundation
**Goal**: Solo game experience with timer and answer reveal
**Plans**: 5 plans

Plans:
- [x] 03-01: Question bank data structure and mock questions
- [x] 03-02: Game session management (backend)
- [x] 03-03: Question display with timer UI
- [x] 03-04: Answer selection and reveal flow
- [x] 03-05: Results screen

### Phase 4: Scoring System
**Goal**: Server-side scoring with speed bonus and wager mechanics
**Plans**: 3 plans

Plans:
- [x] 04-01: Server-side answer validation
- [x] 04-02: Speed bonus calculation
- [x] 04-03: Wager system (confidence betting)

### Phase 5: Learning Content
**Goal**: Players can learn more about questions they find interesting
**Plans**: 3 plans

Plans:
- [x] 05-01: Learn more modal UI
- [x] 05-02: Explanation data structure
- [x] 05-03: Source attribution

### Phase 6: Progression System
**Goal**: Players earn XP and gems, can view their profile
**Plans**: 4 plans

Plans:
- [x] 06-01: XP/gems calculation and storage
- [x] 06-02: User profile page
- [x] 06-03: Progression rewards UI
- [x] 06-04: Profile stats and history

### Phase 7: Accessibility & Performance
**Goal**: WCAG AA compliant, fast loading, mobile responsive
**Plans**: 4 plans

Plans:
- [x] 07-01: WCAG AA keyboard navigation
- [x] 07-02: Screen reader support
- [x] 07-03: Mobile responsive layout
- [x] 07-04: Performance optimization (FCP <1.5s, TTI <3s)

</details>

<details>
<summary>✅ v1.1 Production Hardening (Phases 8-12) - SHIPPED 2026-02-18</summary>

### Phase 8: Tech Debt Cleanup
**Goal**: Clean development environment and complete v1.0 documentation
**Plans**: 2 plans

Plans:
- [x] 08-01: Fix dev tooling issues
- [x] 08-02: Complete v1.0 documentation gaps

### Phase 9: Redis Session Storage
**Goal**: Game sessions stored in Redis with graceful degradation
**Plans**: 2 plans

Plans:
- [x] 09-01: Redis integration with Upstash
- [x] 09-02: Graceful fallback to in-memory

### Phase 10: Game UX Improvements
**Goal**: Cleaner answer selection and visual hierarchy
**Plans**: 2 plans

Plans:
- [x] 10-01: Single-click answer selection
- [x] 10-02: Improved visual hierarchy

### Phase 11: Plausibility Detection
**Goal**: Suspicious perfect games flagged with difficulty-adjusted thresholds
**Plans**: 3 plans

Plans:
- [x] 11-01: Detection algorithm with difficulty thresholds
- [x] 11-02: Speed bonus penalties for suspicious games
- [x] 11-03: Admin visibility for flagged games

### Phase 12: Learning Content Expansion
**Goal**: Learning content coverage increased from 15% to 27.5%
**Plans**: 2 plans

Plans:
- [x] 12-01: Expand explanations for existing questions
- [x] 12-02: Add source links for 33/120 questions

</details>

<details>
<summary>✅ v1.2 Community Collections (Phases 13-17) - SHIPPED 2026-02-19</summary>

### Phase 13: Database Migration
**Goal**: Question data migrated from JSON to PostgreSQL with relational schema
**Plans**: 3 plans

Plans:
- [x] 13-01: Design database schema for collections and questions
- [x] 13-02: Create migration scripts
- [x] 13-03: Seed initial Federal collection to database

### Phase 14: Collection-Scoped Game Flow
**Goal**: Players can select a collection and play questions from it
**Plans**: 4 plans

Plans:
- [x] 14-01: QuestionService for collection-scoped selection
- [x] 14-02: Collection picker UI
- [x] 14-03: Wire collection selection to game flow
- [x] 14-04: Difficulty-balanced question selection

### Phase 15: Question Expiration System
**Goal**: Time-sensitive questions automatically expire and flag for admin review
**Plans**: 3 plans

Plans:
- [x] 15-01: Expiration schema and API
- [x] 15-02: Hourly cron sweep
- [x] 15-03: Admin review UI for expired questions

### Phase 16: AI Content Generation Pipeline
**Goal**: Locale-specific questions generated via AI with human review
**Plans**: 3 plans

Plans:
- [x] 16-01: OpenAI integration and prompt templates
- [x] 16-02: RAG source collection for communities
- [x] 16-03: Generation scripts with quality validation

### Phase 17: Community Question Banks
**Goal**: Bloomington IN and Los Angeles CA collections seeded and playable
**Plans**: 2 plans

Plans:
- [x] 17-01: Generate and validate Bloomington IN questions
- [x] 17-02: Generate and validate Los Angeles CA questions

</details>

<details>
<summary>✅ v1.3 Question Quality & Admin Tools (Phases 18-22) - SHIPPED 2026-02-20</summary>

### Phase 18: Quality Rules Engine
**Goal**: Question quality codified as enforceable TypeScript rules with blocking/advisory severity
**Plans**: 3 plans

Plans:
- [x] 18-01: Quality rules architecture (RuleEngine, Rule interface)
- [x] 18-02: Implement 8 quality rules (dinner party test, civic utility, no phone numbers, etc.)
- [x] 18-03: Quality scoring algorithm (0-100 scale)

### Phase 19: Content Quality Audit
**Goal**: Existing 320 questions audited, low-quality content archived
**Plans**: 4 plans

Plans:
- [x] 19-01: Batch audit script for all collections
- [x] 19-02: Generate audit report with violation details
- [x] 19-03: Manual review of blocking violations
- [x] 19-04: Archive questions failing blocking rules

### Phase 20: Admin Question Explorer
**Goal**: Admin can browse all questions, view quality scores, and filter by collection/status/difficulty
**Plans**: 4 plans

Plans:
- [x] 20-01: Admin UI foundation (routing, layout, authentication)
- [x] 20-02: Question explorer table with filters and sorting
- [x] 20-03: Question detail panel with quality rule breakdown
- [x] 20-04: Collection health dashboard

### Phase 21: Admin Question Editing
**Goal**: Admin can edit questions inline with quality re-scoring and optimistic updates
**Plans**: 3 plans

Plans:
- [x] 21-01: Inline editing UI with validation
- [x] 21-02: Quality re-scoring after edits
- [x] 21-03: Optimistic updates and error handling

### Phase 22: State-Level Collections
**Goal**: Indiana and California state question collections generated and seeded
**Plans**: 3 plans

Plans:
- [x] 22-01: State-level generation template (government/civic processes/broader civics)
- [x] 22-02: Generate and validate Indiana questions
- [x] 22-03: Generate and validate California questions

</details>

<details>
<summary>✅ v1.4 Fremont, CA Collection (Phases 23-26) - SHIPPED 2026-02-21</summary>

### Phase 23: Enhanced Generation Pipeline
**Goal**: AI generation with overshoot-and-curate strategy, quality validation retry loop, and cultural sensitivity framework
**Plans**: 2 plans

Plans:
- [x] 23-01: Overshoot-and-curate generation (130% target, filter to best)
- [x] 23-02: Quality validation retry loop with feedback

### Phase 24: Fremont Content Generation
**Goal**: 92 culturally-validated questions for Fremont, CA across 8 topic categories
**Plans**: 2 plans

Plans:
- [x] 24-01: Fremont locale configuration with cultural sensitivity framework
- [x] 24-02: Generate and curate Fremont questions (123 → 92)

### Phase 25: Collection Deployment
**Goal**: Fremont collection seeded, activated, and playable in production
**Plans**: 1 plan

Plans:
- [x] 25-01: Seed Fremont collection, add banner image, deploy

### Phase 26: Production Verification
**Goal**: Comprehensive verification script confirms all deployment criteria
**Plans**: 1 plan

Plans:
- [x] 26-01: Create and run production verification script

</details>

<details>
<summary>✅ v1.5 Feedback Marks (Phases 27-30) - SHIPPED 2026-02-22</summary>

### Phase 27: In-Game Flagging
**Goal**: Players can flag problematic questions during gameplay with optimistic UI and rate limiting
**Plans**: 3 plans

Plans:
- [x] 27-01: Flag data model and API endpoints
- [x] 27-02: In-game flag button with optimistic updates
- [x] 27-03: Rate limiting (10 flags per 15 minutes)

### Phase 28: Post-Game Elaboration
**Goal**: Players can provide detailed feedback via reason chips and free-text after results
**Plans**: 3 plans

Plans:
- [x] 28-01: Elaboration data model and API
- [x] 28-02: Elaboration modal with reason chips
- [x] 28-03: Batch submission after results review

### Phase 29: Admin Flag Review Queue
**Goal**: Admin can review flagged questions, archive/dismiss with undo, and restore archived questions
**Plans**: 3 plans

Plans:
- [x] 29-01: Flag review queue UI with Active/Archived tabs
- [x] 29-02: Archive/Dismiss/Restore actions with undo toast
- [x] 29-03: Flag detail panel with elaborations

### Phase 30: Admin Integration & Tech Debt
**Goal**: Flag counts visible in explorer, flagged filter, deep-linking, and broken source URL repair
**Plans**: 2 plans

Plans:
- [x] 30-01: Question explorer flag integration
- [x] 30-02: Tech debt cleanup and environment validation

</details>

### v1.6 Content Quality & Scale (In Progress)

**Milestone Goal:** Deduplicate all question collections and generate enough new content so every collection has 90+ unique, high-quality questions.

#### ✅ Phase 31: Semantic Deduplication Infrastructure
**Goal**: Hybrid duplicate detection (text + embeddings) operational with tooling to scan collections
**Depends on**: Phase 30
**Requirements**: DEDUP-01, DEDUP-02, DEDUP-03
**Completed**: 2026-02-23
**Success Criteria** (what must be TRUE):
  1. ✓ OpenAI embedding service integrated with rate-limiting and caching
  2. ✓ SemanticDupDetector class generates similarity scores for question pairs using cosine similarity
  3. ✓ Dedup scanner CLI tool can scan all 6 collections and generate duplicate reports with dry-run mode
  4. ✓ Cross-collection duplicate detection works (Federal/State/City questions compared globally)
**Plans**: 2 plans

Plans:
- [x] 31-01-PLAN.md — Core embedding, similarity, and clustering services
- [x] 31-02-PLAN.md — CLI scanner tool with dual JSON/markdown reports

#### Phase 32: Existing Collection Audit ✅
**Goal**: All 639 existing questions scanned for duplicates, duplicates reviewed and archived
**Depends on**: Phase 31
**Requirements**: DEDUP-04, DEDUP-05, DEDUP-06, DEDUP-07, DEDUP-08, DATA-01, DATA-04
**Success Criteria** (what must be TRUE):
  1. ✅ Embeddings generated for all existing questions across 6 collections
  2. ✅ Duplicate report generated showing grouped pairs/clusters with similarity scores
  3. ✅ Admin manual review workflow identifies which duplicates to keep vs archive
  4. ✅ Confirmed duplicates archived from database and removed from JSON source files (268 archived)
  5. ✅ Federal collection audited and verified unique (114 active, 6 archived)
**Plans**: 4 plans — COMPLETE

Plans:
- [x] 32-01-PLAN.md — Backend services and API endpoints for duplicate review workflow
- [x] 32-02-PLAN.md — Admin UI for reviewing and resolving duplicate clusters
- [x] 32-03-PLAN.md — Execute full audit: run scanner, review clusters, archive duplicates
- [x] 32-04-PLAN.md — Advanced detection rules: answer leakage, same-source clustering, inverse duplicates

#### Phase 33: Generation Pipeline Enhancement ✅
**Goal**: Self-validating generation pipeline with semantic dedup, quality rules, gap analysis, and source diversity tracking
**Depends on**: Phase 32
**Requirements**: GEN-02, GEN-03, GEN-04, GEN-05, GEN-06
**Completed**: 2026-02-23
**Success Criteria** (what must be TRUE):
  1. ✅ Semantic duplicate check integrated into generation pipeline prevents creating duplicates
  2. ✅ All new questions pass 8 existing quality rules with no blocking violations
  3. ✅ Source diversity enforced — soft 15% cap with adaptive scaling for source-poor locales
  4. ✅ Difficulty distribution maintained per collection (40% easy, 35% medium, 25% hard target)
  5. ✅ Topic distribution balanced with minimum 10 questions per topic category
**Plans**: 2 plans — COMPLETE

Plans:
- [x] 33-01-PLAN.md — Generation service modules: types, GapAnalyzer, SourceTracker, CollectionHierarchy
- [x] 33-02-PLAN.md — Main generateQuestions.ts orchestrator with full pipeline integration

#### Phase 34: Scale to 90+ Questions
**Goal**: All 5 non-Federal collections have 90+ unique, high-quality questions seeded to database
**Depends on**: Phase 33
**Requirements**: GEN-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. All 5 non-Federal collections (Bloomington IN, Los Angeles CA, Indiana, California, Fremont CA) have 90+ active questions
  2. Updated JSON source files with duplicates removed and new questions added
  3. All collections re-seeded to database with correct active status
  4. Quality score distribution maintained (no degradation from high-volume generation)
  5. Total question bank expanded to 540+ unique questions across 6 collections
**Plans**: TBD

Plans:
- [ ] 34-01: TBD
- [ ] 34-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 31 → 32 → 33 → 34

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 31. Semantic Deduplication Infrastructure | 2/2 | Complete | 2026-02-23 |
| 32. Existing Collection Audit | 4/4 | Complete | 2026-02-23 |
| 33. Generation Pipeline Enhancement | 2/2 | Complete | 2026-02-23 |
| 34. Scale to 90+ Questions | 0/TBD | Not started | - |
