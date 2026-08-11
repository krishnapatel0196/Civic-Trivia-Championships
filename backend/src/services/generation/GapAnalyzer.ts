/**
 * Gap analysis for identifying underrepresented topics and difficulty levels
 * in a collection, with redistribution for unreachable topics.
 */

import type {
  TopicConfig,
  CollectionGaps,
  GenerationSlot,
  DifficultyDistribution,
} from './types.js';
import { DEFAULT_DIFFICULTY_DISTRIBUTION } from './types.js';

export class GapAnalyzer {
  private readonly MIN_QUESTIONS_PER_TOPIC = 10;

  /**
   * Analyze current collection state and identify gaps in topic and difficulty distribution.
   * Returns a generation plan that prioritizes the largest gaps.
   */
  analyzeGaps(
    existingQuestions: Array<{ topicCategory: string; difficulty: string }>,
    targetCount: number,
    topics: TopicConfig[],
    difficultyDistribution: DifficultyDistribution = DEFAULT_DIFFICULTY_DISTRIBUTION
  ): CollectionGaps {
    // 1. Count current topic distribution
    const topicCounts = new Map<string, number>();
    for (const q of existingQuestions) {
      topicCounts.set(q.topicCategory, (topicCounts.get(q.topicCategory) || 0) + 1);
    }

    // 2. Count current difficulty distribution
    const difficultyCounts = new Map<string, number>();
    for (const q of existingQuestions) {
      difficultyCounts.set(q.difficulty, (difficultyCounts.get(q.difficulty) || 0) + 1);
    }

    // 3. Calculate topic targets (equal distribution with minimum of 10)
    const topicGaps = new Map<string, number>();
    for (const topic of topics) {
      const current = topicCounts.get(topic.slug) || 0;
      const target = Math.max(
        this.MIN_QUESTIONS_PER_TOPIC,
        Math.floor(targetCount / topics.length)
      );
      const gap = Math.max(0, target - current);
      if (gap > 0) {
        topicGaps.set(topic.slug, gap);
      }
    }

    // 4. Calculate difficulty targets (40/35/25 distribution)
    const difficultyGaps = new Map<string, number>();
    const difficultyTargets = {
      easy: Math.round(targetCount * difficultyDistribution.easy),
      medium: Math.round(targetCount * difficultyDistribution.medium),
      hard: Math.round(targetCount * difficultyDistribution.hard),
    };

    for (const [difficulty, target] of Object.entries(difficultyTargets)) {
      const current = difficultyCounts.get(difficulty) || 0;
      const gap = Math.max(0, target - current);
      if (gap > 0) {
        difficultyGaps.set(difficulty, gap);
      }
    }

    // 5. Redistribution: if any topic needs more than half the total gap, redistribute
    this.redistributeIfNeeded(topicGaps, topics);

    // 6. Build generation plan (interleave topics and difficulties)
    const generationPlan = this.buildGenerationPlan(topicGaps, difficultyGaps);

    return {
      topicGaps,
      difficultyGaps,
      totalNeeded: Math.max(0, targetCount - existingQuestions.length),
      generationPlan,
    };
  }

  /**
   * Detect and redistribute topics that need more than half the total gap
   * (likely unreachable). Redistribute their quota to other topics.
   */
  private redistributeIfNeeded(topicGaps: Map<string, number>, topics: TopicConfig[]): void {
    const totalGap = Array.from(topicGaps.values()).reduce((sum, n) => sum + n, 0);
    if (totalGap === 0) return;

    const unreachableTopics: string[] = [];

    for (const [slug, needed] of topicGaps) {
      if (needed > totalGap * 0.5) {
        unreachableTopics.push(slug);
        console.warn(
          `⚠️  Topic "${slug}" needs ${needed} questions (>${(totalGap * 0.5).toFixed(
            0
          )} = 50% of gap). Redistributing to other topics.`
        );
      }
    }

    if (unreachableTopics.length === 0) return;

    // Remove unreachable topics and redistribute their quota
    let redistributeAmount = 0;
    for (const slug of unreachableTopics) {
      redistributeAmount += topicGaps.get(slug) || 0;
      topicGaps.delete(slug);
    }

    const remainingTopics = topics.filter((t) => !unreachableTopics.includes(t.slug));
    if (remainingTopics.length === 0) {
      console.error('❌ All topics unreachable - cannot redistribute');
      return;
    }

    const perTopic = Math.floor(redistributeAmount / remainingTopics.length);
    for (const topic of remainingTopics) {
      const currentGap = topicGaps.get(topic.slug) || 0;
      topicGaps.set(topic.slug, currentGap + perTopic);
    }
  }

  /**
   * Build a generation plan that satisfies both topic AND difficulty gaps.
   * Uses a greedy approach: pick the topic with the biggest gap, assign the
   * difficulty with the biggest gap, decrement both, repeat.
   */
  private buildGenerationPlan(
    topicGaps: Map<string, number>,
    difficultyGaps: Map<string, number>
  ): GenerationSlot[] {
    const plan: GenerationSlot[] = [];

    // Clone gaps so we can mutate during planning
    const topicGapsClone = new Map(topicGaps);
    const difficultyGapsClone = new Map(difficultyGaps);

    // Generate slots until both gaps are exhausted
    while (topicGapsClone.size > 0 && difficultyGapsClone.size > 0) {
      // Find topic with largest gap
      const topicEntries = Array.from(topicGapsClone.entries());
      topicEntries.sort((a, b) => b[1] - a[1]);
      const [topic, topicNeeded] = topicEntries[0];

      // Find difficulty with largest gap
      const difficultyEntries = Array.from(difficultyGapsClone.entries());
      difficultyEntries.sort((a, b) => b[1] - a[1]);
      const [difficulty, difficultyNeeded] = difficultyEntries[0];

      // Add slot
      plan.push({ topic, difficulty });

      // Decrement gaps
      topicGapsClone.set(topic, topicNeeded - 1);
      difficultyGapsClone.set(difficulty, difficultyNeeded - 1);

      // Remove if exhausted
      if (topicGapsClone.get(topic) === 0) {
        topicGapsClone.delete(topic);
      }
      if (difficultyGapsClone.get(difficulty) === 0) {
        difficultyGapsClone.delete(difficulty);
      }
    }

    return plan;
  }

  /**
   * Generate a human-readable summary of the gap analysis
   */
  summarize(gaps: CollectionGaps): string {
    const lines: string[] = [];

    lines.push('Gap Analysis Summary');
    lines.push('='.repeat(60));
    lines.push(`Total questions needed: ${gaps.totalNeeded}`);
    lines.push('');

    if (gaps.topicGaps.size > 0) {
      lines.push('Topic Gaps:');
      for (const [topic, needed] of gaps.topicGaps) {
        lines.push(`  - ${topic}: ${needed} needed`);
      }
      lines.push('');
    }

    if (gaps.difficultyGaps.size > 0) {
      lines.push('Difficulty Gaps:');
      for (const [difficulty, needed] of gaps.difficultyGaps) {
        lines.push(`  - ${difficulty}: ${needed} needed`);
      }
      lines.push('');
    }

    lines.push(`Generation plan: ${gaps.generationPlan.length} slots`);
    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}
