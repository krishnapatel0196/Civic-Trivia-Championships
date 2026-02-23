/**
 * Semantic Duplicate Scanner Script
 *
 * Scans all active questions across collections for semantic duplicates using OpenAI embeddings.
 * Generates JSON and markdown reports showing duplicate clusters with recommendations.
 *
 * Usage:
 *   npm run scan-duplicates                        # Default: all collections, min-tier possible
 *   npm run scan-duplicates -- --dry-run           # Explicit dry-run mode
 *   npm run scan-duplicates -- --collections=Federal,Indiana
 *   npm run scan-duplicates -- --skip-cache        # Regenerate all embeddings
 *   npm run scan-duplicates -- --min-tier=exact    # Only show exact matches
 */

import '../env.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { OpenAIEmbeddingService } from '../services/embeddings/OpenAIEmbeddingService.js';
import { SemanticDupDetector } from '../services/embeddings/SemanticDupDetector.js';
import { ClusterBuilder } from '../services/embeddings/ClusterBuilder.js';
import { runAllAdvancedDetectors } from '../services/embeddings/AdvancedDupDetectors.js';
import {
  QuestionForDedup,
  QuestionForDedupFull,
  SimilarityResult,
  DuplicateCluster,
  SimilarityTier,
  AdvancedFlag,
} from '../services/embeddings/types.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Flags {
  dryRun: boolean;
  collections: string[] | null;
  skipCache: boolean;
  minTier: SimilarityTier;
}

/**
 * Parse CLI flags
 */
function parseFlags(): Flags {
  const args = process.argv.slice(2);

  return {
    dryRun: args.includes('--dry-run') || args.length === 0, // Default to dry-run
    collections: args.find(arg => arg.startsWith('--collections='))
      ?.split('=')[1]
      .split(',')
      .map(c => c.trim()) || null,
    skipCache: args.includes('--skip-cache'),
    minTier: (args.find(arg => arg.startsWith('--min-tier='))
      ?.split('=')[1] as SimilarityTier) || 'possible',
  };
}

/**
 * Fetch all active questions with collection memberships
 * Returns QuestionForDedupFull with explanation and source fields for advanced detectors
 */
async function fetchQuestions(collectionFilter: string[] | null): Promise<QuestionForDedupFull[]> {
  console.log('Fetching active questions from database...');

  let query;
  if (collectionFilter && collectionFilter.length > 0) {
    query = sql`
      SELECT
        q.external_id as "externalId",
        q.text,
        q.options,
        q.correct_answer as "correctAnswer",
        q.quality_score as "qualityScore",
        q.explanation,
        q.source,
        array_agg(c.name ORDER BY c.name) as "collections"
      FROM civic_trivia.questions q
      JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
      JOIN civic_trivia.collections c ON cq.collection_id = c.id
      WHERE q.status = 'active' AND c.name = ANY(${collectionFilter})
      GROUP BY q.id, q.external_id, q.text, q.options, q.correct_answer, q.quality_score, q.explanation, q.source
      ORDER BY q.external_id
    `;
  } else {
    query = sql`
      SELECT
        q.external_id as "externalId",
        q.text,
        q.options,
        q.correct_answer as "correctAnswer",
        q.quality_score as "qualityScore",
        q.explanation,
        q.source,
        array_agg(c.name ORDER BY c.name) as "collections"
      FROM civic_trivia.questions q
      JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
      JOIN civic_trivia.collections c ON cq.collection_id = c.id
      WHERE q.status = 'active'
      GROUP BY q.id, q.external_id, q.text, q.options, q.correct_answer, q.quality_score, q.explanation, q.source
      ORDER BY q.external_id
    `;
  }

  const result = await db.execute(query);
  const rows = result.rows as any[];

  return rows.map(row => ({
    externalId: row.externalId,
    text: row.text,
    options: row.options,
    correctAnswer: row.correctAnswer,
    collections: row.collections,
    qualityScore: row.qualityScore,
    explanation: row.explanation,
    source: row.source,
  }));
}

/**
 * Generate JSON report
 * NOTE: Format changed from bare array to object with clusters and advancedFlags.
 * For backward compatibility with DuplicateReviewService, check if parsed data is array or object:
 *   if (Array.isArray(parsed)) { clusters = parsed; flags = []; }
 *   else { clusters = parsed.clusters; flags = parsed.advancedFlags; }
 */
function generateJsonReport(clusters: DuplicateCluster[], advancedFlags: AdvancedFlag[]): string {
  return JSON.stringify({ clusters, advancedFlags }, null, 2);
}

/**
 * Determine which question to keep in a cluster (used by splitCrossCollectionClusters)
 * Duplicates the logic from ClusterBuilder.recommendKeep
 */
function recommendKeepForCluster(clusterQuestions: QuestionForDedup[]): {
  keep: string;
  archive: string[];
  reason: string;
} {
  if (clusterQuestions.length === 0) {
    throw new Error('Cannot recommend keep for empty cluster');
  }

  if (clusterQuestions.length === 1) {
    return {
      keep: clusterQuestions[0].externalId,
      archive: [],
      reason: 'Single question cluster',
    };
  }

  // Import collection hierarchy from types
  const COLLECTION_HIERARCHY: Record<string, 'federal' | 'state' | 'local'> = {
    'Federal': 'federal',
    'California': 'state',
    'Indiana': 'state',
    'Bloomington, IN': 'local',
    'Fremont, CA': 'local',
    'Los Angeles, CA': 'local',
  };

  const TIER_RANK = {
    federal: 3,
    state: 2,
    local: 1,
  };

  // Determine the collection tier for each question
  const questionsWithTier = clusterQuestions.map((q) => {
    // Find the highest tier among this question's collections
    let highestTier: 'federal' | 'state' | 'local' | null = null;
    let highestRank = 0;

    for (const collection of q.collections) {
      const tier = COLLECTION_HIERARCHY[collection];
      if (tier) {
        const rank = TIER_RANK[tier];
        if (rank > highestRank) {
          highestTier = tier;
          highestRank = rank;
        }
      }
    }

    return {
      question: q,
      tier: highestTier,
      tierRank: highestRank,
    };
  });

  // Sort by: tier rank DESC, quality score DESC, externalId ASC
  questionsWithTier.sort((a, b) => {
    // 1. Highest tier wins
    if (a.tierRank !== b.tierRank) {
      return b.tierRank - a.tierRank;
    }

    // 2. Highest quality score wins (null = 0)
    const scoreA = a.question.qualityScore ?? 0;
    const scoreB = b.question.qualityScore ?? 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. Lowest externalId wins (alphabetical stability)
    return a.question.externalId.localeCompare(b.question.externalId);
  });

  const keep = questionsWithTier[0];
  const archive = questionsWithTier.slice(1);

  // Build reason
  let reason = `Keep ${keep.question.externalId}`;

  if (keep.tier) {
    reason += ` (${keep.tier} tier`;
    if (keep.question.qualityScore !== null) {
      reason += `, quality: ${keep.question.qualityScore.toFixed(2)}`;
    }
    reason += ')';
  } else if (keep.question.qualityScore !== null) {
    reason += ` (quality: ${keep.question.qualityScore.toFixed(2)})`;
  } else {
    reason += ' (alphabetical order)';
  }

  return {
    keep: keep.question.externalId,
    archive: archive.map((a) => a.question.externalId),
    reason,
  };
}

/**
 * Split clusters containing cross-collection questions with different answers.
 *
 * Algorithm:
 * 1. For each cluster, check if it has questions from multiple collections
 * 2. If all same collection, keep as-is
 * 3. If cross-collection, group questions by their normalized correct answer text
 * 4. If all questions have the same answer, keep as-is (legitimate cross-collection duplicate)
 * 5. If questions have different answers, split into sub-clusters by answer
 * 6. Re-compute the similarities and recommendation for each sub-cluster
 * 7. Sub-clusters with only 1 question are discarded (not duplicates)
 */
function splitCrossCollectionClusters(
  clusters: DuplicateCluster[],
  questionMap: Map<string, QuestionForDedupFull>
): DuplicateCluster[] {
  const resultClusters: DuplicateCluster[] = [];

  for (const cluster of clusters) {
    // Check if cluster has questions from multiple collections
    const allCollections = new Set<string>();
    for (const q of cluster.questions) {
      for (const c of q.collections) {
        allCollections.add(c);
      }
    }

    // If all questions are from the same collection, keep as-is
    if (allCollections.size === 1) {
      resultClusters.push(cluster);
      continue;
    }

    // Multi-collection cluster - group by correct answer
    const normalizeAnswer = (text: string) => text.toLowerCase().trim();
    const answerGroups = new Map<string, QuestionForDedup[]>();

    for (const q of cluster.questions) {
      const answerText = q.options[q.correctAnswer];
      const normalizedAnswer = normalizeAnswer(answerText);

      if (!answerGroups.has(normalizedAnswer)) {
        answerGroups.set(normalizedAnswer, []);
      }
      answerGroups.get(normalizedAnswer)!.push(q);
    }

    // If all have the same answer, keep as-is (legitimate cross-collection duplicate)
    if (answerGroups.size === 1) {
      resultClusters.push(cluster);
      continue;
    }

    // Different answers - split into sub-clusters
    let subClusterIndex = 0;
    for (const [answer, groupQuestions] of answerGroups) {
      // Skip single-question sub-clusters (not duplicates)
      if (groupQuestions.length < 2) {
        continue;
      }

      // Get the question IDs for this sub-cluster
      const groupIds = new Set(groupQuestions.map(q => q.externalId));

      // Filter similarities to only include pairs within this sub-cluster
      const subClusterSimilarities = cluster.similarities.filter(
        sim => groupIds.has(sim.questionA) && groupIds.has(sim.questionB)
      );

      // Determine sub-cluster tier (highest severity)
      const tierOrder: SimilarityTier[] = ['exact', 'near-duplicate', 'possible', 'unrelated'];
      let highestTier: SimilarityTier = 'unrelated';
      let highestTierIndex = tierOrder.length;

      for (const sim of subClusterSimilarities) {
        const simTierIndex = tierOrder.indexOf(sim.tier);
        if (simTierIndex < highestTierIndex) {
          highestTier = sim.tier;
          highestTierIndex = simTierIndex;
        }
      }

      // Generate new recommendation for this sub-cluster
      const recommendation = recommendKeepForCluster(groupQuestions);

      // Generate sub-cluster ID
      const subClusterId = subClusterIndex === 0
        ? cluster.clusterId
        : `${cluster.clusterId}${String.fromCharCode(97 + subClusterIndex)}`; // a, b, c, etc.

      resultClusters.push({
        clusterId: subClusterId,
        tier: highestTier,
        questions: groupQuestions,
        similarities: subClusterSimilarities,
        recommendation,
      });

      subClusterIndex++;
    }
  }

  // Re-sort by tier severity (exact first)
  const tierOrder: SimilarityTier[] = ['exact', 'near-duplicate', 'possible', 'unrelated'];
  resultClusters.sort((a, b) => {
    return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
  });

  // Renumber cluster IDs to be sequential
  resultClusters.forEach((cluster, index) => {
    cluster.clusterId = `cluster-${String(index + 1).padStart(3, '0')}`;
  });

  return resultClusters;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(
  clusters: DuplicateCluster[],
  advancedFlags: AdvancedFlag[],
  totalQuestions: number,
  collectionsScanned: string[],
  cacheStats: { hits: number; misses: number }
): string {
  const timestamp = new Date().toISOString();

  // Calculate tier statistics
  const tierStats = {
    exact: 0,
    'near-duplicate': 0,
    possible: 0,
  };

  const questionsInClusters = new Set<string>();
  for (const cluster of clusters) {
    tierStats[cluster.tier as keyof typeof tierStats]++;
    for (const q of cluster.questions) {
      questionsInClusters.add(q.externalId);
    }
  }

  let md = '# Duplicate Detection Report\n\n';
  md += `**Generated:** ${timestamp}\n`;
  md += `**Questions Scanned:** ${totalQuestions}\n`;
  md += `**Collections:** ${collectionsScanned.join(', ')}\n`;
  md += `**Duplicate Clusters Found:** ${clusters.length}\n\n`;

  // Summary table
  md += '## Summary\n\n';
  md += '| Tier | Clusters | Questions Affected |\n';
  md += '|------|----------|--------------------|\\n';
  md += `| Exact (>0.95) | ${tierStats.exact} | ${Array.from(questionsInClusters).filter(id => clusters.some(c => c.tier === 'exact' && c.questions.some(q => q.externalId === id))).length} |\n`;
  md += `| Near-duplicate (>0.85) | ${tierStats['near-duplicate']} | ${Array.from(questionsInClusters).filter(id => clusters.some(c => c.tier === 'near-duplicate' && c.questions.some(q => q.externalId === id))).length} |\n`;
  md += `| Possible (>0.75) | ${tierStats.possible} | ${Array.from(questionsInClusters).filter(id => clusters.some(c => c.tier === 'possible' && c.questions.some(q => q.externalId === id))).length} |\n\n`;

  md += `**Embedding Cache:** ${cacheStats.hits} hits, ${cacheStats.misses} new embeddings\n\n`;

  // Clusters
  md += '## Clusters\n\n';

  if (clusters.length === 0) {
    md += '*No duplicate clusters found.*\n';
  } else {
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const clusterNum = i + 1;

      // Find highest similarity score in cluster
      const maxScore = Math.max(...cluster.similarities.map(s => s.score));
      const tierLabel = cluster.tier === 'exact' ? 'Exact Match' :
                       cluster.tier === 'near-duplicate' ? 'Near-Duplicate' :
                       'Possible Duplicate';

      md += `### Cluster ${clusterNum} — ${tierLabel} (score: ${maxScore.toFixed(2)})\n\n`;
      md += `**Recommendation:** Keep \`${cluster.recommendation.keep}\`, archive ${cluster.recommendation.archive.map(id => `\`${id}\``).join(', ')}\n`;
      md += `**Reason:** ${cluster.recommendation.reason}\n\n`;

      // Show each question in cluster
      for (const question of cluster.questions) {
        md += `#### ${question.externalId} (${question.collections.join(', ')})\n`;
        md += `**Question:** ${question.text}\n`;
        md += `**Answers:**\n`;

        for (let optIdx = 0; optIdx < question.options.length; optIdx++) {
          const isCorrect = optIdx === question.correctAnswer;
          const marker = isCorrect ? '  ✓' : '   ';
          md += `${marker} ${optIdx + 1}. ${question.options[optIdx]}\n`;
        }

        const qualityStr = question.qualityScore !== null ? question.qualityScore.toString() : 'N/A';
        md += `**Quality Score:** ${qualityStr}\n\n`;
      }

      // Pairwise similarities table
      md += '**Pairwise Similarities:**\n';
      md += '| Pair | Score | Tier |\n';
      md += '|------|-------|------|\n';

      for (const sim of cluster.similarities) {
        md += `| ${sim.questionA} vs ${sim.questionB} | ${sim.score.toFixed(2)} | ${sim.tier} |\n`;
      }

      md += '\n';
    }
  }

  // Advanced Detection Flags
  md += '## Advanced Detection Flags\n\n';

  const answerLeakageFlags = advancedFlags.filter(f => f.type === 'answer-leakage');
  const sourceClusterFlags = advancedFlags.filter(f => f.type === 'same-source-cluster');
  const inverseDuplicateFlags = advancedFlags.filter(f => f.type === 'inverse-duplicate');

  // Answer Leakage
  md += '### Answer Leakage\n\n';
  if (answerLeakageFlags.length === 0) {
    md += '*None detected.*\n\n';
  } else {
    md += '| Question A | Question B | Severity | Evidence |\n';
    md += '|------------|------------|----------|----------|\n';
    for (const flag of answerLeakageFlags) {
      md += `| ${flag.questionA} | ${flag.questionB} | ${flag.severity} | ${flag.evidence} |\n`;
    }
    md += '\n';
  }

  // Same-Source Clusters
  md += '### Same-Source Clusters\n\n';
  if (sourceClusterFlags.length === 0) {
    md += '*None detected.*\n\n';
  } else {
    md += '| Question A | Question B | Severity | Evidence |\n';
    md += '|------------|------------|----------|----------|\n';
    for (const flag of sourceClusterFlags) {
      md += `| ${flag.questionA} | ${flag.questionB} | ${flag.severity} | ${flag.evidence} |\n`;
    }
    md += '\n';
  }

  // Inverse Duplicates
  md += '### Inverse Duplicates\n\n';
  if (inverseDuplicateFlags.length === 0) {
    md += '*None detected.*\n\n';
  } else {
    md += '| Question A | Question B | Severity | Evidence |\n';
    md += '|------------|------------|----------|----------|\n';
    for (const flag of inverseDuplicateFlags) {
      md += `| ${flag.questionA} | ${flag.questionB} | ${flag.severity} | ${flag.evidence} |\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Main execution
 */
async function main() {
  const flags = parseFlags();

  // Print banner
  console.log('=== Semantic Duplicate Scanner ===');
  console.log(`Mode: DRY RUN (report only, no changes)`);
  console.log(`Collections: ${flags.collections ? flags.collections.join(', ') : 'all'}`);
  console.log(`Minimum tier: ${flags.minTier}`);
  console.log('');

  try {
    // 1. Fetch questions
    const questions = await fetchQuestions(flags.collections);
    const uniqueCollections = Array.from(new Set(questions.flatMap(q => q.collections))).sort();
    console.log(`Fetched ${questions.length} active questions across ${uniqueCollections.length} collections`);

    // 2. Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY not set. Add it to backend/.env');
      process.exit(1);
    }

    // 3. Create embedding service
    const cacheDir = flags.skipCache
      ? resolve(__dirname, '..', '..', '.embedding-cache-temp')
      : resolve(__dirname, '..', '..', '.embedding-cache');

    const embeddingService = new OpenAIEmbeddingService({
      apiKey: process.env.OPENAI_API_KEY,
      cacheDir,
    });

    // 4. Prepare texts for embedding
    const textsToEmbed = questions.map(q => ({
      id: q.externalId,
      text: SemanticDupDetector.prepareTextForEmbedding(q),
    }));

    // 5. Embed all questions with progress tracking
    console.log('Embedding questions...');
    const embeddings = await embeddingService.embedBatch(textsToEmbed, (done: number, total: number) => {
      if (done % 50 === 0 || done === total) {
        const stats = embeddingService.getCacheStats();
        console.log(`  ${done}/${total} (${stats.hits} cache hits)`);
      }
    });

    // 6. Save cache
    embeddingService.saveCache();
    const cacheStats = embeddingService.getCacheStats();

    // 7. Find similar pairs
    const pairs = SemanticDupDetector.findAllPairs(
      questions,
      embeddings,
      flags.minTier
    );
    console.log(`Found ${pairs.length} similar pairs above ${flags.minTier} threshold`);

    // 7b. Filter out cross-collection pairs with different answers
    const questionMap = new Map(questions.map(q => [q.externalId, q]));
    const filteredPairs = pairs.filter(pair => {
      const qA = questionMap.get(pair.questionA);
      const qB = questionMap.get(pair.questionB);

      if (!qA || !qB) {
        return true; // Keep if question not found (shouldn't happen)
      }

      // Check if questions are from different collections (no overlap)
      const collectionsOverlap = qA.collections.some(c => qB.collections.includes(c));

      if (collectionsOverlap) {
        // Same collection or collection overlap - keep the pair
        return true;
      }

      // Different collections - only keep if answers are similar
      const answerA = qA.options[qA.correctAnswer];
      const answerB = qB.options[qB.correctAnswer];

      // Normalize answers for comparison
      const normalizeAnswer = (text: string) => text.toLowerCase().trim();
      const normalizedA = normalizeAnswer(answerA);
      const normalizedB = normalizeAnswer(answerB);

      // Keep only if answers match
      return normalizedA === normalizedB;
    });

    const filteredCount = pairs.length - filteredPairs.length;
    console.log(`Filtered out ${filteredCount} cross-collection pairs with different answers`);
    console.log(`Remaining pairs: ${filteredPairs.length}`);

    // 8. Build clusters
    const clusterBuilder = new ClusterBuilder();
    let clusters = clusterBuilder.buildClusters(filteredPairs, questionMap);
    console.log(`Grouped into ${clusters.length} duplicate clusters`);

    // 8b. Split cross-collection clusters with different answers
    console.log('Splitting cross-collection clusters with different answers...');
    const clustersBefore = clusters.length;
    clusters = splitCrossCollectionClusters(clusters, questionMap);
    const splitCount = clusters.length - clustersBefore;
    if (splitCount > 0) {
      console.log(`Split ${splitCount} clusters (now ${clusters.length} total clusters)`);
    } else {
      console.log(`No clusters needed splitting`);
    }

    // 8c. Run advanced detection rules
    console.log('Running advanced detection rules...');
    const advancedFlags = runAllAdvancedDetectors(questions);
    console.log(`Found ${advancedFlags.length} advanced flags:`);
    console.log(`  - Answer leakage: ${advancedFlags.filter(f => f.type === 'answer-leakage').length}`);
    console.log(`  - Same-source cluster: ${advancedFlags.filter(f => f.type === 'same-source-cluster').length}`);
    console.log(`  - Inverse duplicate: ${advancedFlags.filter(f => f.type === 'inverse-duplicate').length}`);

    // 9. Generate reports
    const projectRoot = resolve(__dirname, '..', '..', '..');
    const reportsDir = resolve(projectRoot, '.planning', 'dedup-reports');

    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString()
      .replace(/:/g, '')
      .replace(/\..+/, '')
      .replace('T', '-');

    const jsonPath = resolve(reportsDir, `duplicates-${timestamp}.json`);
    const mdPath = resolve(reportsDir, `duplicates-${timestamp}.md`);

    const jsonReport = generateJsonReport(clusters, advancedFlags);
    const mdReport = generateMarkdownReport(
      clusters,
      advancedFlags,
      questions.length,
      uniqueCollections,
      cacheStats
    );

    writeFileSync(jsonPath, jsonReport);
    writeFileSync(mdPath, mdReport);

    // 10. Print summary
    const tierCounts = {
      exact: clusters.filter(c => c.tier === 'exact').length,
      'near-duplicate': clusters.filter(c => c.tier === 'near-duplicate').length,
      possible: clusters.filter(c => c.tier === 'possible').length,
    };

    console.log('\n=== Scan Complete ===\n');
    console.log(`Questions scanned: ${questions.length}`);
    console.log(`Collections covered: ${uniqueCollections.join(', ')}`);
    console.log(`Similar pairs found: ${pairs.length}`);
    console.log(`Duplicate clusters: ${clusters.length}`);
    console.log(`  - Exact (>0.95): ${tierCounts.exact} clusters`);
    console.log(`  - Near-duplicate (>0.85): ${tierCounts['near-duplicate']} clusters`);
    console.log(`  - Possible (>0.75): ${tierCounts.possible} clusters`);
    console.log('');
    console.log(`Advanced flags: ${advancedFlags.length}`);
    console.log(`  - Answer leakage: ${advancedFlags.filter(f => f.type === 'answer-leakage').length} flags`);
    console.log(`  - Same-source cluster: ${advancedFlags.filter(f => f.type === 'same-source-cluster').length} flags`);
    console.log(`  - Inverse duplicate: ${advancedFlags.filter(f => f.type === 'inverse-duplicate').length} flags`);
    console.log('');
    console.log(`Embedding cache: ${cacheStats.hits} hits, ${cacheStats.misses} new embeddings`);
    console.log('');
    console.log('Reports saved:');
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
    console.log('');
    console.log('DRY RUN: No changes made. Review reports before proceeding.');

    process.exit(0);
  } catch (error) {
    console.error('\nScan failed:', error);
    process.exit(1);
  }
}

main();
