export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  tier: 'inform' | 'connected' | 'empowered';
  level: number;
  total_xp: number;
}

export interface UserRank {
  rank: number;
  username: string;
  tier: 'inform' | 'connected' | 'empowered';
  level: number;
  total_xp: number;
  gap_to_next: number;
}

export interface LeaderboardResponse {
  tab: 'all_time' | 'this_week';
  entries: LeaderboardEntry[];
  userRank: UserRank | null;
  generatedAt: string;
}

export type LeaderboardTab = 'all_time' | 'this_week';
