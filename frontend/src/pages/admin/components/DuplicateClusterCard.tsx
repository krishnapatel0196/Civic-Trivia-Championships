import { useState } from 'react';
import { ClusterQuestionItem } from './ClusterQuestionItem';
import { EnrichedCluster, AdvancedFlag } from '../../../types/duplicates';

interface DuplicateClusterCardProps {
  cluster: EnrichedCluster;
  onResolve: (clusterId: string, keepExternalIds: string[]) => Promise<void>;
  onUndo: (clusterId: string) => Promise<void>;
  advancedFlags?: AdvancedFlag[];
}

export function DuplicateClusterCard({
  cluster,
  onResolve,
  onUndo,
  advancedFlags = [],
}: DuplicateClusterCardProps) {
  // Initialize with recommended keep checked, rest unchecked
  const [keepIds, setKeepIds] = useState<Set<string>>(() => new Set([cluster.recommendation.keep]));
  const [isResolving, setIsResolving] = useState(false);

  // Filter flags for questions in this cluster
  const clusterQuestionIds = new Set(cluster.questions.map(q => q.externalId));
  const clusterFlags = advancedFlags.filter(
    flag => clusterQuestionIds.has(flag.questionA) || clusterQuestionIds.has(flag.questionB)
  );

  // Get flags for a specific question
  const getFlagsForQuestion = (externalId: string): AdvancedFlag[] => {
    return clusterFlags.filter(flag => flag.questionA === externalId || flag.questionB === externalId);
  };

  // Get highest severity in cluster
  const getHighestSeverity = (): 'high' | 'medium' | 'low' | null => {
    if (clusterFlags.length === 0) return null;
    if (clusterFlags.some(f => f.severity === 'high')) return 'high';
    if (clusterFlags.some(f => f.severity === 'medium')) return 'medium';
    return 'low';
  };

  const highestSeverity = getHighestSeverity();

  // Tier color helpers
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'exact': return 'bg-red-100 text-red-800 border-red-300';
      case 'near-duplicate': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'possible': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFlagCountColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-purple-500 text-white';
    }
  };

  // Calculate similarity range
  const scores = cluster.similarities.map(s => s.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // At least one must be archived (keeping none is allowed — archives all)
  const archiveCount = cluster.questions.length - keepIds.size;
  const canResolve = archiveCount > 0;

  // Toggle a question's keep status
  const toggleKeep = (externalId: string) => {
    setKeepIds(prev => {
      const next = new Set(prev);
      if (next.has(externalId)) {
        next.delete(externalId);
      } else {
        next.add(externalId);
      }
      return next;
    });
  };

  // Handle resolve
  const handleResolve = async () => {
    if (!canResolve || isResolving) return;
    setIsResolving(true);
    try {
      await onResolve(cluster.clusterId, Array.from(keepIds));
    } finally {
      setIsResolving(false);
    }
  };

  // Handle undo
  const handleUndo = async () => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      await onUndo(cluster.clusterId);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{cluster.clusterId}</h3>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${getTierColor(cluster.tier)}`}>
              {cluster.tier}
            </span>
            {cluster.autoResolvable && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Auto-recommended
              </span>
            )}
            {cluster.resolved && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
                Resolved
              </span>
            )}
            {clusterFlags.length > 0 && highestSeverity && (
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getFlagCountColor(highestSeverity)}`}>
                {clusterFlags.length} {clusterFlags.length === 1 ? 'flag' : 'flags'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>{cluster.questions.length} questions</span>
            <span>Similarity: {(minScore * 100).toFixed(1)}% - {(maxScore * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Questions */}
        <div className="space-y-3">
          {cluster.questions.map((question) => (
            <ClusterQuestionItem
              key={question.externalId}
              question={question}
              isSelected={keepIds.has(question.externalId)}
              onSelect={() => !cluster.resolved && toggleKeep(question.externalId)}
              isKept={cluster.resolved && cluster.resolution?.keepIds?.includes(question.externalId)}
              isArchived={cluster.resolved && cluster.resolution?.archivedIds.includes(question.externalId)}
              flags={getFlagsForQuestion(question.externalId)}
            />
          ))}
        </div>

        {/* Similarity table */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Pairwise Similarities</h4>
          <div className="space-y-1">
            {cluster.similarities.map((sim, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {sim.questionA.slice(-8)} ↔ {sim.questionB.slice(-8)}
                </span>
                <span className={`font-medium ${
                  sim.tier === 'exact' ? 'text-red-700' :
                  sim.tier === 'near-duplicate' ? 'text-orange-700' :
                  'text-yellow-700'
                }`}>
                  {(sim.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {!cluster.resolved && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Recommendation:</span> {cluster.recommendation.reason}
            </p>
          </div>
        )}

        {/* Resolution info */}
        {cluster.resolved && cluster.resolution && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-900">
              <span className="font-semibold">Resolved:</span> {cluster.resolution.archivedIds.length} archived, {cluster.resolution.keepIds?.length || 1} kept — {new Date(cluster.resolution.resolvedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
        {cluster.resolved ? (
          <button
            onClick={handleUndo}
            disabled={isResolving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResolving ? 'Undoing...' : 'Undo'}
          </button>
        ) : (
          <>
            <span className="text-xs text-gray-500">
              Keep {keepIds.size}, archive {archiveCount}
            </span>
            <button
              onClick={handleResolve}
              disabled={!canResolve || isResolving}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolving ? 'Resolving...' : `Archive ${archiveCount}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
