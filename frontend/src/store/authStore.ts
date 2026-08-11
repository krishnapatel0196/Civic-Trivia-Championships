import { create } from 'zustand';
import type { AccountsUser, Tier } from '../types/auth';

interface AuthStore {
  accessToken: string | null;
  user: AccountsUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tier: Tier | null;
  tierResolved: boolean;
  displayName: string | null;
  timerMultiplier: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  setAuth: (token: string, user: AccountsUser, extras?: { tier?: Tier; displayName?: string }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setTimerMultiplier: (multiplier: number) => void;
  setDisplayName: (name: string) => void;
  setTier: (tier: Tier) => void;
  setTierResolved: (resolved: boolean) => void;
  setAdminStatus: (isAdmin: boolean, isSuperAdmin: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tier: null,
  tierResolved: false,
  displayName: null,
  timerMultiplier: 1.0,
  isAdmin: false,
  isSuperAdmin: false,

  setAuth: (token: string, user: AccountsUser, extras?: { tier?: Tier; displayName?: string }) =>
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isLoading: false,
      tier: extras?.tier ?? user.tier ?? null,
      tierResolved: true,
      displayName: extras?.displayName ?? null,
    }),

  clearAuth: () => {
    localStorage.removeItem('ev_refresh_token');
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      tier: null,
      tierResolved: false,
      displayName: null,
      timerMultiplier: 1.0,
      isAdmin: false,
      isSuperAdmin: false,
    });
  },

  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  setTimerMultiplier: (multiplier: number) =>
    set({
      timerMultiplier: multiplier,
    }),

  setDisplayName: (name: string) =>
    set({
      displayName: name,
    }),

  setTier: (tier: Tier) =>
    set({
      tier,
    }),

  setTierResolved: (resolved: boolean) =>
    set({
      tierResolved: resolved,
    }),

  setAdminStatus: (isAdmin: boolean, isSuperAdmin: boolean) =>
    set({ isAdmin, isSuperAdmin }),
}));
