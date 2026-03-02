/**
 * Cluster Builder
 * Groups duplicate pairs into clusters using union-find with transitive closure
 */

import type {
  SimilarityResult,
  QuestionForDedup,
  DuplicateCluster,
  ClusterRecommendation,
  SimilarityTier,
  CollectionTier,
} from './types.js';
import { TIER_RANK } from './types.js';

export class ClusterBuilder {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  private tierMap: Map<string, CollectionTier>;

  constructor(tierMap: Map<string, CollectionTier>) {
    this.tierMap = tierMap;
  }

  /**
   * Find root with path compression
   */
  private find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
      return id;
    }

    const parentId = this.parent.get(id)!;
    if (parentId !== id) {
      // Path compression
      this.parent.set(id, this.find(parentId));
    }

    return this.parent.get(id)!;
  }

  /**
   * Union by rank
   */
  private union(id1: string, id2: string): void {
    const root1 = this.find(id1);
    const root2 = this.find(id2);

    if (root1 === root2) {
      return;
    }

    const rank1 = this.rank.get(root1) || 0;
    const rank2 = this.rank.get(root2) || 0;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }
  }

  /**
   * Determine which question to keep in a cluster
   */
  private recommendKeep(clusterQuestions: QuestionForDedup[]): ClusterRecommendation {
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

    // Determine the collection tier for each question
    const questionsWithTier = clusterQuestions.map((q) => {
      // Find the highest tier among this question's collections
      let highestTier: CollectionTier | null = null;
      let highestRank = 0;

      for (const collection of q.collections) {
        const tier = this.tierMap.get(collection);
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
   * Build clusters from similarity pairs
   */
  buildClusters(
    pairs: SimilarityResult[],
    questions: Map<string, QuestionForDedup>
  ): DuplicateCluster[] {
    // Reset union-find state
    this.parent.clear();
    this.rank.clear();

    // Union all pairs
    for (const pair of pairs) {
      this.union(pair.questionA, pair.questionB);
    }

    // Group by root
    const groups = new Map<string, string[]>();
    for (const [id, question] of questions.entries()) {
      const root = this.find(id);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(id);
    }

    // Build clusters (filter to 2+ members)
    const clusters: DuplicateCluster[] = [];
    let clusterIndex = 1;

    for (const [root, memberIds] of groups.entries()) {
      if (memberIds.length < 2) {
        continue;
      }

      // Get question objects
      const clusterQuestions = memberIds
        .map((id) => questions.get(id))
        .filter((q): q is QuestionForDedup => q !== undefined);

      // Find all similarities within this cluster
      const clusterSimilarities = pairs.filter(
        (p) => memberIds.includes(p.questionA) && memberIds.includes(p.questionB)
      );

      // Determine cluster tier (highest severity)
      const tierOrder: SimilarityTier[] = ['exact', 'near-duplicate', 'possible', 'unrelated'];
      let highestTier: SimilarityTier = 'unrelated';
      let highestTierIndex = tierOrder.length;

      for (const sim of clusterSimilarities) {
        const simTierIndex = tierOrder.indexOf(sim.tier);
        if (simTierIndex < highestTierIndex) {
          highestTier = sim.tier;
          highestTierIndex = simTierIndex;
        }
      }

      // Generate recommendation
      const recommendation = this.recommendKeep(clusterQuestions);

      clusters.push({
        clusterId: `cluster-${String(clusterIndex).padStart(3, '0')}`,
        tier: highestTier,
        questions: clusterQuestions,
        similarities: clusterSimilarities,
        recommendation,
      });

      clusterIndex++;
    }

    // Sort by tier severity (exact first)
    const tierOrder: SimilarityTier[] = ['exact', 'near-duplicate', 'possible', 'unrelated'];
    clusters.sort((a, b) => {
      return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
    });

    return clusters;
  }
}
