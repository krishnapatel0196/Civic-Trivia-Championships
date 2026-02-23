/**
 * Semantic Duplicate Detector
 * Computes cosine similarity and classifies duplicate tiers
 */

import type { SimilarityTier, SimilarityResult, QuestionForDedup } from './types.js';

// Similarity thresholds
const EXACT_THRESHOLD = 0.95;
const NEAR_DUPLICATE_THRESHOLD = 0.85;
const POSSIBLE_THRESHOLD = 0.75;

export class SemanticDupDetector {
  /**
   * Compute cosine similarity between two embedding vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Classify similarity score into tier
   */
  static getSimilarityTier(score: number): SimilarityTier {
    if (score > EXACT_THRESHOLD) return 'exact';
    if (score > NEAR_DUPLICATE_THRESHOLD) return 'near-duplicate';
    if (score > POSSIBLE_THRESHOLD) return 'possible';
    return 'unrelated';
  }

  /**
   * Fast text-based similarity check
   * Returns 1.0 for exact match, 0.0 otherwise
   */
  static normalizedTextSimilarity(textA: string, textB: string): number {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normA = normalize(textA);
    const normB = normalize(textB);

    return normA === normB ? 1.0 : 0.0;
  }

  /**
   * Prepare question text for embedding
   * Concatenates question text with all answer options
   */
  static prepareTextForEmbedding(question: QuestionForDedup): string {
    const labels = ['A', 'B', 'C', 'D'];
    const optionsText = question.options
      .map((opt, idx) => `${labels[idx]}: ${opt}`)
      .join('\n');

    return `${question.text}\n${optionsText}`;
  }

  /**
   * Find all pairwise similarities above threshold
   */
  static findAllPairs(
    questions: QuestionForDedup[],
    embeddings: Map<string, number[]>,
    minTier: SimilarityTier = 'possible'
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];
    const tierOrder: SimilarityTier[] = ['exact', 'near-duplicate', 'possible', 'unrelated'];
    const minTierIndex = tierOrder.indexOf(minTier);

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const qA = questions[i];
        const qB = questions[j];

        // Fast text comparison first
        const textSim = this.normalizedTextSimilarity(
          this.prepareTextForEmbedding(qA),
          this.prepareTextForEmbedding(qB)
        );

        let score: number;
        let tier: SimilarityTier;

        if (textSim === 1.0) {
          score = 1.0;
          tier = 'exact';
        } else {
          // Use embeddings for semantic similarity
          const embA = embeddings.get(qA.externalId);
          const embB = embeddings.get(qB.externalId);

          if (!embA || !embB) {
            console.warn(`Missing embedding for ${qA.externalId} or ${qB.externalId}`);
            continue;
          }

          score = this.cosineSimilarity(embA, embB);
          tier = this.getSimilarityTier(score);
        }

        // Only include if meets minimum tier threshold
        const tierIndex = tierOrder.indexOf(tier);
        if (tierIndex <= minTierIndex) {
          results.push({
            questionA: qA.externalId,
            questionB: qB.externalId,
            score,
            tier,
          });
        }
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }
}
