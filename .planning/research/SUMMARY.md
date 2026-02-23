# Project Research Summary

**Project:** Civic Trivia Championship v1.6 - Content Quality & Scale
**Domain:** Educational trivia with AI-generated civic content
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

The v1.6 milestone addresses a critical quality gap: text-based duplicate detection catches only ~50% of duplicates in AI-generated content. Research shows that LA County's 52 questions contained nearly 50% duplicates/near-duplicates, including semantic paraphrases ("How many people does LA County serve?" vs "What is the LA County population?"), answer leakage in explanations, and same-source factoid clustering. Scaling to 90+ questions per collection (540+ total) without semantic deduplication would create a poor user experience and inflate perceived content volume.

**Recommended approach:** Implement hybrid duplicate detection (text normalization + embedding-based semantic similarity) using OpenAI text-embedding-3-small with fast-cosine-similarity for in-memory vector comparison. Add quality rules for cross-question validation (answer leakage, source diversity) and integrate semantic checks into the existing quality validation pipeline. Use overshoot-and-curate strategy (generate 1.3x target, keep best quality) to maintain high standards at scale.

**Key risks:** (1) AI hallucination in factual civic content — requires RAG with source grounding and programmatic fact verification; (2) Cross-collection duplicates — city questions repeating state/federal facts; (3) Database state inconsistency during migration — existing 639 questions need safe, idempotent deduplication. All three mitigated through phased rollout with dry-run modes, manual review workflows, and human-in-the-loop for high-stakes changes.

## Key Findings

### Recommended Stack

The existing stack (Claude Sonnet 4.5 with RAG, Zod validation, quality rules engine) works well but needs semantic similarity detection. Research compared pgvector/vector databases vs lightweight in-memory approaches. **Recommendation: Add OpenAI text-embedding-3-small + fast-cosine-similarity for minimal complexity and zero production risk.**

**Core technologies:**
- **OpenAI text-embedding-3-small** (new): Semantic similarity detection — 1536-dim embeddings, $0.02/1M tokens ($0.01 batch), proven reliability, free $5 credit covers entire project
- **fast-cosine-similarity** (new): Vector similarity computation — 3x faster than alternatives, TypeScript native, zero dependencies
- **p-limit v7.3.0** (existing): Rate limit compliance — already installed, 80M+ weekly downloads, perfect for concurrent embedding API calls
- **Existing quality validation pipeline**: Retry loop with blocking/advisory rules — extend with semantic duplicate rule, minimal disruption

**Anti-recommendations (avoid):**
- **NO pgvector**: Overkill for one-time audit, requires schema changes, adds production risk
- **NO vector databases**: Scale mismatch (639 questions << millions), external dependency, ongoing operational overhead
- **NO LangChain**: Heavyweight abstraction, 100+ KB dependencies for simple embedding calls

### Expected Features

Educational trivia platforms treat deduplication as pre-launch quality checks, not ongoing operations. Academic research shows automated detection + human curation is the sweet spot for quality at scale.

**Must have (table stakes):**
- **Exact duplicate detection** — text normalization (already implemented via DuplicateDetector)
- **Semantic duplicate detection** — embedding-based similarity, threshold 0.85-0.90 (GAP — needs implementation)
- **Cross-collection duplicate detection** — prevent same questions across federal/state/city (GAP — currently siloed)
- **Manual review workflow** — admin reviews flagged duplicates, makes final archival decisions (extend existing flag review queue)
- **Batch content generation** — calculate gap, apply overshoot, retry with feedback (already implemented)
- **Quality validation with blocking rules** — prevent low-quality content (already implemented with 8 rules)

**Should have (competitive):**
- **Inverse duplicate detection** — catch Q1 "What year did X happen?" + Q2 "Which governor signed X?" revealing each other (differentiator, medium complexity)
- **Answer leakage detection** — Q2's explanation shouldn't contain Q1's answer (academic research confirms this is real problem)
- **Same-source factoid clustering** — track which source paragraphs generate questions, enforce diversity (leverages existing source.url field)
- **Duplicate metrics in collection health dashboard** — admin visibility into duplicate rates (easy addition to existing dashboard)
- **Smart overshoot calculation** — dynamic adjustment based on historical pass rates and duplicate rates (data science best practice)

**Defer (v2+):**
- **Fully automated duplicate removal** — research shows false positives require human review (don't build)
- **Real-time semantic search in production** — pgvector/vector DB only justified if building "find similar questions" feature
- **Local embedding models** — OpenAI's quality is higher and free credits make cost a non-issue

### Architecture Approach

The current generation pipeline (Locale Config → RAG Sources → Claude Generation → Zod Validation → Quality Validation → JSON Output → Database Seeding) has clean extension points. Add semantic similarity as a parallel check alongside text normalization during quality validation. Research shows embedding-based detection integrates cleanly with minimal disruption to existing retry loops and batch processing.

**Major components:**
1. **SemanticDupDetector** — embedding-based similarity check using OpenAI + cosine similarity, integrated as optional parameter to validateAndRetry()
2. **EmbeddingCache** — in-memory Map<externalId, embedding> for generation workflow, checks new questions against existing embeddings
3. **Cross-question validation rules** — answer leakage detection, source diversity enforcement, fact extraction for same-source clustering
4. **Dedup scanner CLI tool** — batch scan all collections, generate duplicate reports for manual review, idempotent with dry-run mode
5. **Migration-safe archival workflow** — two-phase approach (mark for review → human confirms → archive), respects status field constraints

**Integration pattern:**
Composition over replacement. DuplicateDetector keeps text normalization (fast, no API calls), SemanticDupDetector runs after as second layer (slower, catches paraphrases). Both violations surface in quality audit, unified retry loop handles regeneration.

### Critical Pitfalls

Research identified 13 pitfalls; top 5 by severity:

1. **Text-only deduplication misses semantic duplicates** — Simple normalization catches only 50% of AI-generated duplicates. LA had "How many people does LA County serve?" / "What population does LA County government serve?" / "What is the LA County population?" all passing text checks. Prevention: Multi-level pipeline (exact text → semantic similarity → answer overlap), cosine threshold 0.85-0.90, fact extraction for source-level dedup.

2. **AI hallucination in factual content** — LLMs "optimized for fluency, not truth" generate plausible-sounding falsehoods (wrong dates, numbers, non-existent entities). Catastrophic for educational content. Prevention: RAG with explicit source grounding (quote relevant sentence in reasoning), programmatic fact verification against .gov APIs for verifiable claims, human-in-the-loop for high-stakes content (elections, hard difficulty).

3. **Cross-collection duplicates ignored** — Federal/state facts appear in city collections. DuplicateDetector loads per-collection with no shared state. Prevention: Global duplicate registry across all collections, content specialization strategy (general facts at highest relevant hierarchy level), generation prompts with anti-patterns from other collections.

4. **Answer leakage in explanations** — Question B's explanation: "According to source, Y is the process that X uses to..." reveals answer to Question A about X. Quality validation runs per-question without cross-question checks. Prevention: Batch validation after generation, check if any question's correct answer appears in other explanations, regenerate with constraints if leakage found.

5. **Database state inconsistency during migration** — Git status shows manual edits to data files and multiple ad-hoc dedup scripts. Production system wasn't designed for deduplication from start. Prevention: Idempotent migration scripts in transactions, two-phase migration (mark → review → archive), dry-run mode mandatory, status field transition constraints.

## Implications for Roadmap

Based on research, suggested 4-phase structure prioritizing quality foundation before scaling:

### Phase 1: Semantic Deduplication Foundation (Week 1)
**Rationale:** Must establish hybrid detection (text + semantic) before generating new content. Attempting to scale without semantic dedup will produce collections full of paraphrased duplicates.

**Delivers:**
- OpenAI embedding service + fast-cosine-similarity integration
- SemanticDupDetector class with configurable thresholds
- EmbeddingCache for generation workflow
- Dedup scanner CLI tool with dry-run mode

**Addresses:**
- Semantic duplicate detection (FEATURES table stakes)
- Cross-collection duplicate detection (FEATURES table stakes)
- Text-only deduplication pitfall (PITFALLS #1)
- Cross-collection duplicates pitfall (PITFALLS #3)

**Avoids:**
- Database state inconsistency (idempotent scripts, dry-run first)
- Production risk (no schema changes, in-memory only)

### Phase 2: Existing Collection Audit & Cleanup (Week 1)
**Rationale:** Must deduplicate existing 639 questions before generating new content. Otherwise new questions will duplicate existing ones that should have been archived.

**Delivers:**
- Backfill embeddings for all existing questions
- Run dedup scanner across all 6 collections
- Generate duplicate reports with similarity scores
- Manual review workflow (extend existing flag review queue)
- Archive confirmed duplicates

**Addresses:**
- Manual review workflow (FEATURES table stakes)
- Database migration safety (PITFALLS #5)

**Avoids:**
- Fully automated removal (anti-feature, causes false positives)
- Status field violations (two-phase migration with human review)

### Phase 3: Cross-Question Quality Rules (Week 2)
**Rationale:** Before scaling content generation, add quality rules that detect cross-question issues (answer leakage, source over-mining). These violations are harder to fix post-generation.

**Delivers:**
- Answer leakage detection (check if correct answers appear in other explanations)
- Source diversity enforcement (<20% from any single source)
- Same-source factoid clustering detection
- Batch-level validation (not just per-question)
- Enhanced generation reports with cross-question stats

**Addresses:**
- Answer leakage detection (FEATURES differentiator)
- Same-source factoid clustering (FEATURES differentiator)
- Answer leakage pitfall (PITFALLS #4)
- Same-source mining pitfall (PITFALLS #4 related)

**Avoids:**
- AI hallucination (source grounding reinforced through diversity rules)

### Phase 4: Scale to 90+ Questions per Collection (Week 2-3)
**Rationale:** With dedup and quality infrastructure in place, safe to scale. Use overshoot-and-curate strategy to maintain quality at volume.

**Delivers:**
- Calculate gaps per collection (90 target - current unique count)
- Apply 1.3x overshoot multiplier
- Generate new content with semantic dedup enabled
- Quality-over-quantity filtering (keep best by quality score)
- Difficulty-aware generation (separate passes for easy/medium/hard)
- Early stopping if success rate drops below threshold

**Addresses:**
- Batch content generation (FEATURES table stakes, validate at scale)
- Smart overshoot calculation (FEATURES differentiator)
- Quality degradation in high-volume generation (PITFALLS #9)
- RAG context window degradation (PITFALLS #8, use topic-filtered sources)

**Avoids:**
- Prompt drift (lock configuration, test against golden set before deploying)
- Intra-batch duplicates (batch-aware prompting, progressive dedup)

### Phase Ordering Rationale

**Foundation → Cleanup → Rules → Scale** is the only safe order because:

1. **Foundation first:** Can't detect semantic duplicates without embedding infrastructure. Building on text-only dedup repeats existing failures.

2. **Cleanup before generation:** Generating new questions before deduplicating existing ones creates duplicates between old and new content. Wasted API costs regenerating questions similar to ones that should have been archived.

3. **Rules before scale:** Cross-question quality rules are cheaper to enforce during generation than to fix post-generation. Answer leakage requires regenerating both questions involved.

4. **Scale last:** Quality at volume requires mature infrastructure. Research shows generation quality degrades as scale increases without proper controls (overshoot-and-curate, early stopping, difficulty-aware passes).

**Dependencies from research:**
- STACK.md: OpenAI embeddings needed before semantic detection works
- ARCHITECTURE.md: validateAndRetry() hook point requires SemanticDupDetector implementation first
- PITFALLS.md: Phase assignment tables explicitly call out Phase 1 for dedup architecture, Phase 2 for quality rules, Phase 4 for scaling

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Cross-Question Quality Rules):** Answer leakage detection algorithms not well-documented in trivia platforms. May need to prototype simple text-matching approach vs LLM-based analysis to balance accuracy and cost.
- **Phase 4 (Scale to 90+):** Optimal overshoot multiplier (1.3x?) needs calibration based on actual pass rates. Golden set testing strategy needs definition before locking prompt versions.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Semantic Dedup Foundation):** Embedding-based duplicate detection is well-established. OpenAI embeddings + cosine similarity is industry standard with extensive documentation.
- **Phase 2 (Existing Collection Audit):** Database migration patterns well-understood. Idempotent scripts with dry-run modes are standard practice.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | OpenAI embeddings extensively documented, fast-cosine-similarity benchmarked, existing codebase analysis confirms integration points. Anti-recommendations (pgvector, vector DBs) justified with clear rationale. |
| Features | MEDIUM | Table stakes features confirmed via academic research (semantic similarity thresholds, manual review workflows). Differentiators (inverse duplicates, answer leakage) found in academic papers but less common in commercial trivia platforms. |
| Architecture | HIGH | Direct codebase analysis reveals clean extension points (validateAndRetry hook, DuplicateDetector composition pattern, quality rules engine). Hybrid detection approach proven in academic research. |
| Pitfalls | HIGH | Top 5 pitfalls backed by codebase evidence (git status showing manual fixes, existing DuplicateDetector limitations, audit report violations). Prevention strategies validated against research sources and industry best practices. |

**Overall confidence:** HIGH

Research depth is excellent due to:
1. **Direct codebase analysis:** ARCHITECTURE.md and PITFALLS.md cite specific files, line numbers, and existing patterns
2. **Academic research validation:** Semantic similarity thresholds (0.85-0.90), manual review workflows, RAG optimization all backed by peer-reviewed sources
3. **Real-world evidence:** LA duplicate audit (50% duplicates) provides concrete validation of the problem severity

### Gaps to Address

**During planning/execution:**

1. **Semantic similarity threshold tuning (Phase 1):** Research recommends 0.85-0.90 but optimal threshold depends on Civic Trivia's specific content. **Resolution:** Start with 0.90 (stricter), generate duplicate report for existing questions, manually review 20-30 flagged pairs to measure precision. Adjust in 0.05 increments if false positive rate >10%.

2. **Cross-collection policy (Phase 2):** Should any questions be allowed across collections? Example: "Who is the governor?" could legitimately appear in both state and city collections if framed differently. **Resolution:** Define collection hierarchy (federal > state > city) and content specialization policy before Phase 2. General civic facts belong at highest relevant level; collection-specific angles allowed.

3. **Overshoot multiplier calibration (Phase 4):** Research suggests 1.3x but actual multiplier depends on quality pass rates and duplicate rates observed during execution. **Resolution:** Track stats during Phase 4 first batch, calculate optimal multiplier: `target * (1 / pass_rate) * (1 / (1 - dup_rate))`, cap at 2x to avoid cost explosion.

4. **Answer leakage detection algorithm (Phase 3):** Not well-documented whether simple text matching ("does explanation contain answer?") is sufficient or if LLM-based analysis needed. **Resolution:** Prototype simple approach first (check if correct answer string appears in other explanations with fuzzy matching). If false positive rate >20%, escalate to LLM-based semantic analysis.

5. **RAG source filtering strategy (Phase 4):** As source documents grow, existing "load all sources" approach will degrade quality. **Resolution:** Implement topic-filtered RAG (embed topic descriptions, use cosine similarity to select top 5 relevant sources per generation batch). Monitor hallucination rate; if it increases, implement chunk-level retrieval with re-ranking.

## Sources

### Primary (HIGH confidence)

**Codebase analysis:**
- `backend/src/services/qualityRules/rules/duplicate.ts` — existing text normalization approach, integration points
- `backend/src/scripts/content-generation/utils/quality-validation.ts` — validateAndRetry() hook, retry loop architecture
- `backend/src/scripts/content-generation/generate-locale-questions.ts` — generation pipeline flow, DuplicateDetector initialization
- `backend/audit-report.md` — quality violation evidence, LA duplicate audit findings
- Git status showing manual data edits and ad-hoc dedup scripts — database migration challenges

**Official documentation:**
- [OpenAI Embeddings API Pricing](https://costgoat.com/pricing/openai-embeddings) — cost analysis, batch API
- [fast-cosine-similarity npm](https://www.npmjs.com/package/fast-cosine-similarity) — performance benchmarks, TypeScript support
- [Anthropic Embeddings Documentation](https://platform.claude.com/docs/en/build-with-claude/embeddings) — Voyage AI recommendation

### Secondary (MEDIUM confidence)

**Academic research:**
- [Semantic Similarity Analysis for Examination Questions Classification](https://www.mdpi.com/2076-3417/13/14/8323) — threshold recommendations, educational content patterns
- [How do I use embeddings for duplicate detection?](https://zilliz.com/ai-faq/how-do-i-use-embeddings-for-duplicate-detection) — cosine similarity 0.9 threshold, industry standard
- [Deduplicating records in systematic reviews](https://www.sciencedirect.com/science/article/abs/pii/S0895435622002566) — manual review workflows, automated tools not perfect
- [ACM publication on answer leakage in quiz generation](https://dl.acm.org/doi/pdf/10.1145/3626772.3657855) — volleyball championship example

**Industry best practices:**
- [AI Hallucination Testing in 2026](https://medium.com/ai-in-quality-assurance/ai-hallucination-testing-in-2026-how-qa-engineers-detect-confidently-wrong-ai-answers-cb978ec6cc26) — fact verification strategies
- [How to Optimize RAG Context Windows for Smarter Retrieval](https://medium.com/@ai.nishikant/how-to-optimize-rag-context-windows-b26859f03b2d) — topic filtering, chunking strategies
- [AI Data Quality in 2026: Challenges & Best Practices](https://research.aimultiple.com/data-quality-ai/) — quality degradation at high volume

### Tertiary (LOW confidence, needs validation)

- [Best AI quiz generator tools in 2026](https://blog.vocaliv.com/top-5-best-ai-quiz-generator-tools-in-2026) — general trivia platform trends
- [Content curation strategy best practices](https://www.semrush.com/blog/content-curation/) — overshoot strategies (not specific to AI generation)
- [Duplicate data management in ML](https://dagshub.com/blog/mastering-duplicate-data-management-in-machine-learning-for-optimal-model-performance/) — acceptable duplicate rates (10-30% in ML contexts, different domain)

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
