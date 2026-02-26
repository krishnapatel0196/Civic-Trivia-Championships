import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../services/api';
import { DuplicateClusterCard } from './components/DuplicateClusterCard';
import { EnrichedCluster, AdvancedFlag, DuplicateSummary } from '../../types/duplicates';

// Undo toast hook (following project pattern)
interface ToastState {
  message: string;
  clusterId: string | null;
  visible: boolean;
  countdown: number;
}

function useUndoToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    clusterId: null,
    visible: false,
    countdown: 30,
  });
  const timeoutRef = useRef<number>();
  const countdownRef = useRef<number>();

  const showToast = (message: string, clusterId: string) => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setToast({
      message,
      clusterId,
      visible: true,
      countdown: 30,
    });

    // Countdown every second
    let remaining = 30;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setToast((prev) => ({ ...prev, countdown: remaining }));
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setToast((prev) => ({ ...prev, visible: false }));
      }
    }, 1000);

    // Auto-hide after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 30000);
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  return { toast, showToast, hideToast };
}

// Toast component
function UndoToast({
  message,
  countdown,
  visible,
  onClose,
  onUndo,
}: {
  message: string;
  countdown: number;
  visible: boolean;
  onClose: () => void;
  onUndo: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 min-w-[320px]">
      <span className="flex-1">{message}</span>
      <button
        onClick={onUndo}
        className="text-amber-400 hover:text-amber-300 font-medium px-2"
      >
        Undo ({countdown}s)
      </button>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-300 text-xl leading-none">
        ×
      </button>
    </div>
  );
}

export function DuplicateReviewPage() {
  const { accessToken } = useAuthStore();

  // Data state
  const [clusters, setClusters] = useState<EnrichedCluster[]>([]);
  const [advancedFlags, setAdvancedFlags] = useState<AdvancedFlag[]>([]);
  const [summary, setSummary] = useState<DuplicateSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Toast state
  const { toast, showToast, hideToast } = useUndoToast();

  // Fetch clusters on mount
  useEffect(() => {
    fetchClusters();
  }, [accessToken]);

  const fetchClusters = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/duplicates`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch duplicate clusters');
      }

      const data = await response.json();
      if (data.noReports) {
        setError('No duplicate scan reports found on this server. Run the scan locally to generate reports.');
        setClusters([]);
        return;
      }
      setClusters(data.clusters || []);
      setAdvancedFlags(data.advancedFlags || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle resolve
  const handleResolve = async (clusterId: string, keepExternalIds: string[]) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/duplicates/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ clusterId, keepExternalIds }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to resolve cluster');
      }

      const result = await response.json();
      const keepSet = new Set(keepExternalIds);

      // Update local state
      setClusters((prev) =>
        prev.map((c) =>
          c.clusterId === clusterId
            ? {
                ...c,
                resolved: true,
                resolution: {
                  keepIds: keepExternalIds,
                  archivedIds: result.archivedIds || c.questions.filter(q => !keepSet.has(q.externalId)).map(q => q.externalId),
                  resolvedAt: new Date().toISOString(),
                },
              }
            : c
        )
      );

      // Show undo toast
      const archivedCount = result.archivedIds?.length || (clusters.find(c => c.clusterId === clusterId)?.questions.length || 0) - keepExternalIds.length;
      showToast(`Cluster resolved. ${archivedCount} ${archivedCount === 1 ? 'question' : 'questions'} archived.`, clusterId);

      // Update summary
      if (summary) {
        setSummary({
          ...summary,
          resolved: summary.resolved + 1,
          pendingReview: summary.pendingReview - 1,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve cluster');
    }
  };

  // Handle undo
  const handleUndo = async (clusterId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/duplicates/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ clusterId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to undo resolution');
      }

      // Update local state
      setClusters((prev) =>
        prev.map((c) =>
          c.clusterId === clusterId
            ? {
                ...c,
                resolved: false,
                resolution: undefined,
              }
            : c
        )
      );

      // Hide toast
      hideToast();

      // Update summary
      if (summary) {
        setSummary({
          ...summary,
          resolved: summary.resolved - 1,
          pendingReview: summary.pendingReview + 1,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to undo resolution');
    }
  };

  // Handle auto-resolve all
  const handleAutoResolveAll = async () => {
    if (!accessToken) return;

    const autoResolvableCount = clusters.filter(c => c.autoResolvable && !c.resolved).length;

    if (autoResolvableCount === 0) {
      alert('No auto-resolvable clusters found');
      return;
    }

    const confirmed = confirm(
      `Auto-resolve ${autoResolvableCount} high-confidence duplicate ${autoResolvableCount === 1 ? 'cluster' : 'clusters'}?\n\nThis will keep the recommended question and archive the rest.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/duplicates/auto-resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to auto-resolve clusters');
      }

      const result = await response.json();

      // Refresh cluster list
      await fetchClusters();

      alert(`Successfully resolved ${result.resolvedCount} ${result.resolvedCount === 1 ? 'cluster' : 'clusters'}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to auto-resolve');
    }
  };

  // Filter clusters
  const filteredClusters = clusters.filter((cluster) => {
    if (tierFilter !== 'all' && cluster.tier !== tierFilter) return false;
    if (statusFilter === 'pending' && cluster.resolved) return false;
    if (statusFilter === 'resolved' && !cluster.resolved) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Duplicate Review</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and resolve duplicate question clusters
        </p>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary.totalClusters}</div>
                <div className="text-xs text-gray-600">Total Clusters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary.pendingReview}</div>
                <div className="text-xs text-gray-600">Pending Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
                <div className="text-xs text-gray-600">Resolved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.autoResolvable}</div>
                <div className="text-xs text-gray-600">Auto-resolvable</div>
              </div>
              {advancedFlags.length > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-600">{advancedFlags.length}</div>
                  <div className="text-xs text-gray-600">Advanced Flags</div>
                </div>
              )}
            </div>
            {summary.autoResolvable > 0 && (
              <button
                onClick={handleAutoResolveAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Auto-resolve All ({summary.autoResolvable})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
            Tier
          </label>
          <select
            id="tier"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All tiers</option>
            <option value="exact">Exact</option>
            <option value="near-duplicate">Near-duplicate</option>
            <option value="possible">Possible</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading clusters...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredClusters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 text-center">
            {tierFilter === 'all' && statusFilter === 'all'
              ? 'No duplicate clusters found'
              : 'No clusters match the selected filters'}
          </p>
        </div>
      )}

      {/* Cluster list */}
      {!loading && filteredClusters.length > 0 && (
        <div className="space-y-4">
          {filteredClusters.map((cluster) => (
            <DuplicateClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              onResolve={handleResolve}
              onUndo={handleUndo}
              advancedFlags={advancedFlags}
            />
          ))}
        </div>
      )}

      {/* Undo toast */}
      <UndoToast
        message={toast.message}
        countdown={toast.countdown}
        visible={toast.visible}
        onClose={hideToast}
        onUndo={() => toast.clusterId && handleUndo(toast.clusterId)}
      />
    </div>
  );
}
