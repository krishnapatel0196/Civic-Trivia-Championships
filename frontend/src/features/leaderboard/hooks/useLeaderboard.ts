import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../../services/api';
import type { LeaderboardResponse, LeaderboardTab } from '../types';

interface CacheEntry {
  data: LeaderboardResponse;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface UseLeaderboardResult {
  data: LeaderboardResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderboard(
  tab: LeaderboardTab,
  userId: string | null
): UseLeaderboardResult {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  // Per-tab cache stored in a ref so it persists across renders without causing re-renders
  const cache = useRef<Partial<Record<LeaderboardTab, CacheEntry>>>({});

  useEffect(() => {
    const cached = cache.current[tab];
    const now = Date.now();

    // Use cached data if available and fresh (< 5 minutes old)
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      setData(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ tab });
    if (userId) params.set('userId', userId);

    fetch(`${API_URL}/api/leaderboard?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          return Promise.reject(res.status);
        }
        return res.json() as Promise<LeaderboardResponse>;
      })
      .then((responseData) => {
        cache.current[tab] = { data: responseData, fetchedAt: Date.now() };
        setData(responseData);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load leaderboard');
        setData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId, refetchTick]);

  const refetch = () => {
    // Bust cache for current tab and trigger re-fetch
    delete cache.current[tab];
    setRefetchTick((t) => t + 1);
  };

  return { data, isLoading, error, refetch };
}
