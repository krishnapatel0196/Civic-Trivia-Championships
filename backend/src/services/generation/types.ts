/**
 * Shared types for AI question generation pipeline
 */

export interface TopicConfig {
  slug: string;
  name: string;
  description: string;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export const DEFAULT_DIFFICULTY_DISTRIBUTION: DifficultyDistribution = {
  easy: 0.40,
  medium: 0.35,
  hard: 0.25,
};

export interface GenerationConfig {
  collectionName: string;
  collectionSlug: string;
  targetCount: number;
  topics: TopicConfig[];
  difficultyDistribution: DifficultyDistribution;
  minQuestionsPerTopic: number;
  maxRetries: number;
  localContext: string;
}

export interface GenerationSlot {
  topic: string;
  difficulty: string;
}

export interface CollectionGaps {
  topicGaps: Map<string, number>;
  difficultyGaps: Map<string, number>;
  totalNeeded: number;
  generationPlan: GenerationSlot[];
}

export interface GeneratedQuestion {
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  topicCategory: string;
  source: { name: string; url: string };
  expiresAt: string | null;
  learningContent?: {
    topic: string;
    paragraphs: string[];
    corrections: Record<string, string>;
    source: { name: string; url: string };
  };
}

export interface GenerationResult {
  question: GeneratedQuestion;
  status: 'accepted' | 'skipped' | 'duplicate';
  attempts: number;
  violations: Array<{ rule: string; severity: string; message: string }>;
  sourceWarning?: string;
}

export interface GenerationReport {
  collectionName: string;
  timestamp: string;
  config: {
    targetCount: number;
    difficultyDistribution: DifficultyDistribution;
  };
  gapAnalysis: {
    totalNeeded: number;
    topicGaps: Record<string, number>;
    difficultyGaps: Record<string, number>;
  };
  results: {
    accepted: number;
    skipped: number;
    duplicates: number;
    totalAttempted: number;
  };
  acceptedQuestions: GeneratedQuestion[];
  skippedDetails: Array<{
    topic: string;
    difficulty: string;
    reason: string;
    attempts: number;
  }>;
  sourceDiversity: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  finalDistribution: {
    topics: Record<string, number>;
    difficulties: Record<string, number>;
  };
}
