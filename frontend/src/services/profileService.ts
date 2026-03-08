import { apiRequest } from './api';
import { useAuthStore } from '../store/authStore';

export interface ProfileStats {
  gamesPlayed: number;
  bestScore: number;
  overallAccuracy: number;
  timerMultiplier: number;
}

export async function fetchTriviaStats(): Promise<ProfileStats> {
  const { accessToken } = useAuthStore.getState();

  return apiRequest<ProfileStats>('/api/users/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateTimerMultiplier(multiplier: number): Promise<{ timerMultiplier: number }> {
  const { accessToken } = useAuthStore.getState();

  return apiRequest<{ timerMultiplier: number }>('/api/users/profile/settings', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timerMultiplier: multiplier }),
  });
}

export interface XpHistoryEntry {
  id: string;
  createdAt: string;
  amount: number;
  isDuplicate: boolean;
  score: number | null;
  correctAnswers: number | null;
  collectionSlug: string | null;
}

export interface XpHistoryResponse {
  entries: XpHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchXpHistory(page: number = 1): Promise<XpHistoryResponse> {
  return apiRequest<XpHistoryResponse>(`/api/users/profile/xp/history?page=${page}`);
}
