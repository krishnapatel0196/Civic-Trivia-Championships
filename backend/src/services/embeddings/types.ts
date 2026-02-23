/**
 * Shared types for semantic deduplication services
 */

export type SimilarityTier = 'exact' | 'near-duplicate' | 'possible' | 'unrelated';

export interface SimilarityResult {
  questionA: string; // externalId
  questionB: string; // externalId
  score: number; // 0-1 cosine similarity
  tier: SimilarityTier;
}

export interface QuestionForDedup {
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  collections: string[]; // collection names this question belongs to
  qualityScore: number | null;
}

export type CollectionTier = 'federal' | 'state' | 'city';

export const COLLECTION_HIERARCHY: Record<string, CollectionTier> = {
  'Federal Civics': 'federal',
  'Indiana': 'state',
  'California': 'state',
  'Bloomington, IN': 'city',
  'Los Angeles, CA': 'city',
  'Fremont, CA': 'city',
};

export const TIER_RANK: Record<CollectionTier, number> = {
  federal: 3,
  state: 2,
  city: 1,
};

export interface ClusterRecommendation {
  keep: string; // externalId to keep
  archive: string[]; // externalIds to archive
  reason: string; // human-readable explanation
}

export interface DuplicateCluster {
  clusterId: string; // e.g., "cluster-001"
  tier: SimilarityTier; // highest similarity tier in cluster
  questions: QuestionForDedup[];
  similarities: SimilarityResult[]; // all pairwise similarities within cluster
  recommendation: ClusterRecommendation;
}
