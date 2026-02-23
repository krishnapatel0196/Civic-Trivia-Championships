/**
 * Types for duplicate review UI
 * Matches backend types from embeddings/types.ts
 */

export interface ClusterQuestion {
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  collections: string[];
  qualityScore: number | null;
}

export interface SimilarityPair {
  questionA: string;
  questionB: string;
  score: number;
  tier: 'exact' | 'near-duplicate' | 'possible';
}

export interface ClusterRecommendation {
  keep: string;
  archive: string[];
  reason: string;
}

export interface EnrichedCluster {
  clusterId: string;
  tier: 'exact' | 'near-duplicate' | 'possible';
  questions: ClusterQuestion[];
  similarities: SimilarityPair[];
  recommendation: ClusterRecommendation;
  autoResolvable: boolean;
  resolved: boolean;
  resolution?: {
    keepId: string;
    archivedIds: string[];
    resolvedAt: string;
  };
}

export type AdvancedFlagType = 'answer-leakage' | 'same-source-cluster' | 'inverse-duplicate';

export interface AdvancedFlag {
  type: AdvancedFlagType;
  questionA: string; // externalId
  questionB: string; // externalId
  severity: 'high' | 'medium' | 'low';
  reason: string;
  evidence: string;
}

export interface DuplicateSummary {
  totalClusters: number;
  pendingReview: number;
  resolved: number;
  autoResolvable: number;
  byTier: {
    exact: number;
    'near-duplicate': number;
    possible: number;
  };
  totalQuestions: number;
  affectedCollections: string[];
}
