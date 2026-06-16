import { useState, useEffect } from 'react';
import { ACCOUNTS_API_URL } from '../services/accountsApi';

export type PlayerXpData = {
  level: number;
  totalXp: number;
  xpInLevel: number;
  xpToNextLevel: number;
};

type UsePlayerXpResult = {
  xpData: PlayerXpData | null;
  isLoading: boolean;
  isConnected: boolean; // false if 404 (user not connected to platform)
};

export function usePlayerXp(userId: string | null): UsePlayerXpResult {
  const [xpData, setXpData] = useState<PlayerXpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      setXpData(null);
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    setIsLoading(true);

    fetch(`${ACCOUNTS_API_URL}/api/xp/${userId}`)
      .then((res) => {
        if (res.status === 404) {
          // User exists but has no XP record — not Connected
          setIsConnected(false);
          setXpData(null);
          return null;
        }
        if (!res.ok) {
          throw new Error(`XP fetch failed: ${res.status}`);
        }
        setIsConnected(true);
        return res.json();
      })
      .then((data) => {
        if (data) {
          setXpData({
            level: data.level,
            totalXp: data.total_xp,
            xpInLevel: data.xp_in_level,
            xpToNextLevel: data.xp_to_next_level,
          });
        }
      })
      .catch((err) => {
        console.warn('[usePlayerXp] Failed to fetch XP data:', err);
        setIsConnected(false);
        setXpData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  return { xpData, isLoading, isConnected };
}
