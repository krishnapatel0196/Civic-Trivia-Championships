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

export const TIER_RANK: Record<CollectionTier, number> = {
  federal: 3,
  state: 2,
  city: 1,
};

/**
 * Load collection tier map from database at runtime.
 * Returns Map<collectionName, CollectionTier> keyed by the DB `name` column.
 *
 * IMPORTANT: State collections use short names ('Indiana', 'California',
 * 'Massachusetts', 'Texas') — NOT names with 'State' suffix. All callers
 * must pass DB-consistent names when looking up tiers.
 */
export async function loadCollectionTierMap(): Promise<Map<string, CollectionTier>> {
  const { db } = await import('../../db/index.js');
  const { collections } = await import('../../db/schema.js');
  const rows = await db.select({ name: collections.name, tier: collections.tier }).from(collections);
  const map = new Map<string, CollectionTier>();
  for (const row of rows) {
    map.set(row.name, row.tier as CollectionTier);
  }
  return map;
}

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

/**
 * Extended question data for advanced duplicate detection
 * Includes explanation and source fields needed by AdvancedDupDetectors
 */
export interface QuestionForDedupFull extends QuestionForDedup {
  explanation: string;
  source: { name: string; url: string };
}

/**
 * Advanced flag types for non-semantic duplicate detection
 */
export type AdvancedFlagType = 'answer-leakage' | 'same-source-cluster' | 'inverse-duplicate';

/**
 * Advanced detection flag (non-semantic duplicate patterns)
 */
export interface AdvancedFlag {
  type: AdvancedFlagType;
  questionA: string; // externalId
  questionB: string; // externalId
  severity: 'high' | 'medium' | 'low';
  reason: string; // human-readable explanation
  evidence: string; // the specific text/data that triggered the flag
}

/**
 * Complete scan report with both semantic clusters and advanced flags
 */
export interface ScanReport {
  clusters: DuplicateCluster[];
  advancedFlags: AdvancedFlag[];
  metadata: {
    totalQuestions: number;
    collectionsScanned: string[];
    timestamp: string;
  };
}
