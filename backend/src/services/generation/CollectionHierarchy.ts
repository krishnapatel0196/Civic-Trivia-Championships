/**
 * Cross-collection duplicate detection with hierarchy-aware policy.
 * Federal blocks State, State blocks City. Siblings allowed.
 */

import {
  TIER_RANK,
  type CollectionTier,
  type QuestionForDedup,
} from '../embeddings/types.js';
import { SemanticDupDetector } from '../embeddings/SemanticDupDetector.js';
import type { OpenAIEmbeddingService } from '../embeddings/OpenAIEmbeddingService.js';

const NEAR_DUPLICATE_THRESHOLD = 0.85;

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: string;
  matchScore?: number;
  reason?: string;
}

export class CollectionHierarchy {
  private tierMap: Map<string, CollectionTier>;

  constructor(
    private embeddingService: OpenAIEmbeddingService,
    tierMap: Map<string, CollectionTier>
  ) {
    this.tierMap = tierMap;
  }

  /**
   * Check if generated question is a semantic duplicate of existing questions,
   * applying cross-collection hierarchy policy:
   * - REJECT if duplicate exists in PARENT collection (higher tier)
   * - REJECT if duplicate exists in SAME collection
   * - ALLOW if duplicate exists in SIBLING collection (same tier, different name)
   * - ALLOW if duplicate exists in CHILD collection (lower tier)
   */
  async checkDuplicate(
    questionText: string,
    questionOptions: string[],
    targetCollection: string,
    existingQuestions: Array<{
      externalId: string;
      text: string;
      options: string[];
      collections: string[];
      embedding?: number[];
    }>,
    batchEmbeddings?: Map<string, number[]>
  ): Promise<DuplicateCheckResult> {
    // 1. Prepare text for embedding
    const preparedText = SemanticDupDetector.prepareTextForEmbedding({
      text: questionText,
      options: questionOptions,
      externalId: '',
      correctAnswer: 0,
      collections: [],
      qualityScore: null,
    } as QuestionForDedup);

    // 2. Generate embedding for new question
    const generatedEmbedding = await this.embeddingService.embed(preparedText);

    // 3. Determine target collection tier
    const targetTier = this.getCollectionTier(targetCollection);
    if (!targetTier) {
      console.warn(`⚠️  Unknown collection "${targetCollection}", treating as city tier`);
    }

    // 4. Check intra-batch duplicates first (if provided)
    if (batchEmbeddings) {
      for (const [batchId, batchEmbedding] of batchEmbeddings) {
        const similarity = SemanticDupDetector.cosineSimilarity(
          generatedEmbedding,
          batchEmbedding
        );

        if (similarity > NEAR_DUPLICATE_THRESHOLD) {
          return {
            isDuplicate: true,
            duplicateOf: batchId,
            matchScore: similarity,
            reason: `Duplicate within current generation batch (similarity: ${similarity.toFixed(3)})`,
          };
        }
      }
    }

    // 5. Check against existing questions with hierarchy policy
    for (const existing of existingQuestions) {
      // Get or compute existing question's embedding
      let existingEmbedding: number[];
      if (existing.embedding) {
        existingEmbedding = existing.embedding;
      } else {
        const existingText = SemanticDupDetector.prepareTextForEmbedding(
          existing as QuestionForDedup
        );
        existingEmbedding = await this.embeddingService.embed(existingText);
      }

      const similarity = SemanticDupDetector.cosineSimilarity(
        generatedEmbedding,
        existingEmbedding
      );

      if (similarity > NEAR_DUPLICATE_THRESHOLD) {
        // Found semantic duplicate - apply hierarchy policy
        for (const existingCollection of existing.collections) {
          // Case 1: Duplicate in parent collection (higher tier) - REJECT
          if (this.isParentOrSame(existingCollection, targetCollection)) {
            const existingTier = this.getCollectionTier(existingCollection);
            return {
              isDuplicate: true,
              duplicateOf: existing.externalId,
              matchScore: similarity,
              reason: `Duplicate exists in parent/same collection "${existingCollection}" (${existingTier} blocks ${targetTier}, similarity: ${similarity.toFixed(3)})`,
            };
          }

          // Case 2: Duplicate in sibling (same tier, different name) - ALLOW
          // Case 3: Duplicate in child (lower tier) - ALLOW
          // Both cases: continue checking other questions
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Get collection tier from the DB-sourced tier map
   */
  getCollectionTier(collectionName: string): CollectionTier | undefined {
    return this.tierMap.get(collectionName);
  }

  /**
   * Check if existingCollection is the same as or a parent of targetCollection
   * Returns true if existing is same or higher tier
   */
  isParentOrSame(existingCollection: string, targetCollection: string): boolean {
    if (existingCollection === targetCollection) {
      return true; // Same collection - reject
    }

    const existingTier = this.getCollectionTier(existingCollection);
    const targetTier = this.getCollectionTier(targetCollection);

    if (!existingTier || !targetTier) {
      return false; // Unknown tier - allow by default
    }

    // Parent if existing tier rank is higher (Federal=3 > State=2 > City=1)
    return TIER_RANK[existingTier] > TIER_RANK[targetTier];
  }
}
