export type Tier = 'inform' | 'connected' | 'empowered';

export interface AccountsUser {
  id: string;
  email: string;
  tier: Tier;
}

export interface AccountProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  tier: Tier;
  account_standing: string;
  connected_profile?: {
    // xp may be a plain number (legacy) or a rich object from the XP system
    xp: number | { total_xp: number; level?: number; xp_in_level?: number; xp_to_next_level?: number };
    gem_balance: number;
    display_name: string;
    verification_status?: string;
    completed_onboarding?: boolean;
  };
}

export interface AuthState {
  accessToken: string | null;
  user: AccountsUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tier: Tier | null;
  displayName: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AccountsUser;
}

export interface AuthError {
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}
