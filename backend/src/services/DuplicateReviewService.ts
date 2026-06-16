/**
 * Duplicate Review Service
 * Loads scanner reports, manages cluster resolution state, orchestrates archival with undo
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { eq, inArray, sql } from 'drizzle-orm';
import type { DuplicateCluster, SimilarityTier } from './embeddings/types.js';

export interface AdvancedFlag {
  type: 'answer-leakage' | 'same-source-cluster' | 'inverse-duplicate';
  questionA: string; // externalId
  questionB: string; // externalId
  details: string;
}

interface ClusterResolution {
  keepIds: string[];
  archivedIds: string[];
  resolvedAt: Date;
  archivedDbIds: number[];
}

interface ScannerReportNewFormat {
  clusters: DuplicateCluster[];
  advancedFlags: AdvancedFlag[];
}

export class DuplicateReviewService {
  private clusters: DuplicateCluster[] = [];
  private advancedFlags: AdvancedFlag[] = [];
  private resolutions: Map<string, ClusterResolution> = new Map();
  private externalIdToDbId: Map<string, number> = new Map();

  /**
   * Load the most recent scanner report from .planning/dedup-reports/
   */
  async loadReport(reportPath?: string): Promise<void> {
    // Resolve project root: go up from backend/src/services/ or from process.cwd()
    const projectRoot = path.resolve(process.cwd(), '..');
    const reportsDir = fs.existsSync(path.join(process.cwd(), '.planning', 'dedup-reports'))
      ? path.join(process.cwd(), '.planning', 'dedup-reports')
      : path.join(projectRoot, '.planning', 'dedup-reports');

    let filePath: string;
    if (reportPath) {
      filePath = reportPath;
    } else {
      // Find most recent duplicates-*.json file by timestamp
      const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('duplicates-') && f.endsWith('.json'));
      if (files.length === 0) {
        throw new Error('No scanner reports found in .planning/dedup-reports/');
      }

      // Sort by filename (timestamp-based, newest last)
      files.sort();
      const latestFile = files[files.length - 1];
      filePath = path.join(reportsDir, latestFile);
    }

    // Read and parse JSON
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Backward-compatible format detection
    let clusters: DuplicateCluster[];
    let advancedFlags: AdvancedFlag[];

    if (Array.isArray(parsed)) {
      // Old format: bare array of clusters (pre-Plan 32-04)
      clusters = parsed;
      advancedFlags = [];
    } else if (parsed && typeof parsed === 'object' && 'clusters' in parsed) {
      // New format: { clusters: [...], advancedFlags: [...] } (from Plan 32-04)
      const report = parsed as ScannerReportNewFormat;
      clusters = report.clusters;
      advancedFlags = report.advancedFlags ?? [];
    } else {
      throw new Error('Unrecognized scanner report format');
    }

    this.clusters = clusters;
    this.advancedFlags = advancedFlags;

    // Load question DB IDs for all questions in clusters
    const allExternalIds = new Set<string>();
    for (const cluster of clusters) {
      for (const question of cluster.questions) {
        allExternalIds.add(question.externalId);
      }
    }

    if (allExternalIds.size > 0) {
      const dbQuestions = await db
        .select({ id: questions.id, externalId: questions.externalId, status: questions.status })
        .from(questions)
        .where(inArray(questions.externalId, Array.from(allExternalIds)));

      const archivedExternalIds = new Set<string>();
      for (const q of dbQuestions) {
        this.externalIdToDbId.set(q.externalId, q.id);
        if (q.status === 'archived') {
          archivedExternalIds.add(q.externalId);
        }
      }

      // Detect already-resolved clusters from DB state
      // A cluster is resolved if ANY question in it is archived
      for (const cluster of clusters) {
        const clusterArchived = cluster.questions.filter(q => archivedExternalIds.has(q.externalId));
        const clusterKept = cluster.questions.filter(q => !archivedExternalIds.has(q.externalId));

        if (clusterArchived.length > 0) {
          this.resolutions.set(cluster.clusterId, {
            keepIds: clusterKept.map(q => q.externalId),
            archivedIds: clusterArchived.map(q => q.externalId),
            resolvedAt: new Date(),
            archivedDbIds: clusterArchived
              .map(q => this.externalIdToDbId.get(q.externalId))
              .filter((id): id is number => id !== undefined),
          });
        }
      }
    }
  }

  /**
   * Get clusters with optional filtering
   */
  getClusters(filter?: { tier?: SimilarityTier; resolved?: boolean }): Array<DuplicateCluster & {
    autoResolvable: boolean;
    resolved: boolean;
    resolution?: ClusterResolution;
  }> {
    let filtered = this.clusters;

    if (filter?.tier) {
      filtered = filtered.filter(c => c.tier === filter.tier);
    }

    if (filter?.resolved !== undefined) {
      filtered = filtered.filter(c => {
        const isResolved = this.resolutions.has(c.clusterId);
        return isResolved === filter.resolved;
      });
    }

    return filtered.map(cluster => {
      // Determine if auto-resolvable (highest similarity >= 0.90)
      const maxSimilarity = Math.max(...cluster.similarities.map(s => s.score));
      const autoResolvable = maxSimilarity >= 0.90;

      const resolved = this.resolutions.has(cluster.clusterId);
      const resolution = this.resolutions.get(cluster.clusterId);

      return {
        ...cluster,
        autoResolvable,
        resolved,
        resolution,
      };
    });
  }

  /**
   * Get all advanced flags
   */
  getAdvancedFlags(): AdvancedFlag[] {
    return this.advancedFlags;
  }

  /**
   * Get flags associated with a specific question
   */
  getFlagsForQuestion(externalId: string): AdvancedFlag[] {
    return this.advancedFlags.filter(
      flag => flag.questionA === externalId || flag.questionB === externalId
    );
  }

  /**
   * Resolve a cluster by archiving all questions except the keepers
   */
  async resolveCluster(clusterId: string, keepExternalIds: string | string[]): Promise<string[]> {
    // Normalize to array for backward compat (auto-resolve still sends single)
    const keepIds = Array.isArray(keepExternalIds) ? keepExternalIds : [keepExternalIds];
    const keepSet = new Set(keepIds);

    // Find cluster
    const cluster = this.clusters.find(c => c.clusterId === clusterId);
    if (!cluster) {
      throw new Error(`Cluster ${clusterId} not found`);
    }

    // Validate all keepers exist in cluster
    for (const keepId of keepIds) {
      if (!cluster.questions.find(q => q.externalId === keepId)) {
        throw new Error(`Keeper ${keepId} not found in cluster ${clusterId}`);
      }
    }

    // Get questions to archive (everything not kept — if keepIds empty, archive all)
    const toArchive = cluster.questions.filter(q => !keepSet.has(q.externalId));
    const archiveExternalIds = toArchive.map(q => q.externalId);
    const archiveDbIds = toArchive
      .map(q => this.externalIdToDbId.get(q.externalId))
      .filter((id): id is number => id !== undefined);

    if (archiveDbIds.length === 0) {
      throw new Error('No questions to archive (all externalIds are missing from DB)');
    }

    // Use Drizzle transaction to archive all questions
    await db.transaction(async (tx) => {
      const historyEntry = {
        action: 'archived' as const,
        timestamp: new Date().toISOString(),
        reason: 'duplicate-review',
      };

      // Update all archived questions
      await tx
        .update(questions)
        .set({
          status: 'archived',
          expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
          updatedAt: new Date(),
        })
        .where(inArray(questions.id, archiveDbIds));
    });

    // Track resolution
    this.resolutions.set(clusterId, {
      keepIds: keepIds,
      archivedIds: archiveExternalIds,
      resolvedAt: new Date(),
      archivedDbIds: archiveDbIds,
    });

    return archiveExternalIds;
  }

  /**
   * Undo a cluster resolution (restore archived questions)
   */
  async undoResolve(clusterId: string): Promise<string[]> {
    const resolution = this.resolutions.get(clusterId);
    if (!resolution) {
      throw new Error(`Cluster ${clusterId} has not been resolved`);
    }

    // Check if within 30-second undo window
    const now = new Date();
    const elapsedMs = now.getTime() - resolution.resolvedAt.getTime();
    const MAX_UNDO_WINDOW_MS = 30 * 1000; // 30 seconds

    if (elapsedMs > MAX_UNDO_WINDOW_MS) {
      throw new Error('Undo window expired (must undo within 30 seconds)');
    }

    // Use Drizzle transaction to restore questions
    await db.transaction(async (tx) => {
      const historyEntry = {
        action: 'renewed' as const,
        timestamp: new Date().toISOString(),
      };

      // Restore all archived questions
      await tx
        .update(questions)
        .set({
          status: 'active',
          expirationHistory: sql`${questions.expirationHistory} || ${JSON.stringify([historyEntry])}::jsonb`,
          updatedAt: new Date(),
        })
        .where(inArray(questions.id, resolution.archivedDbIds));
    });

    // Remove from resolution tracking
    const restoredIds = resolution.archivedIds;
    this.resolutions.delete(clusterId);

    return restoredIds;
  }

  /**
   * Auto-resolve all clusters with highest similarity >= 0.90
   */
  async autoResolveAll(): Promise<{
    clustersResolved: number;
    totalArchived: number;
    archivedExternalIds: string[];
  }> {
    const autoResolvableClusters = this.clusters.filter(cluster => {
      const maxSimilarity = Math.max(...cluster.similarities.map(s => s.score));
      return maxSimilarity >= 0.90 && !this.resolutions.has(cluster.clusterId);
    });

    let totalArchived = 0;
    const allArchivedExternalIds: string[] = [];

    for (const cluster of autoResolvableClusters) {
      const keepExternalId = cluster.recommendation.keep;
      const archivedIds = await this.resolveCluster(cluster.clusterId, keepExternalId);
      totalArchived += archivedIds.length;
      allArchivedExternalIds.push(...archivedIds);
    }

    return {
      clustersResolved: autoResolvableClusters.length,
      totalArchived,
      archivedExternalIds: allArchivedExternalIds,
    };
  }
}
