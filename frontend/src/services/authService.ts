import { accountsApiFetch } from './accountsApi';
import type {
  AuthResponse,
  LoginCredentials,
  SignupData,
} from '../types/auth';

export const authService = {
  signup: async (data: SignupData): Promise<{ message: string }> => {
    return accountsApiFetch<{ message: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return accountsApiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (accessToken: string): Promise<{ message: string }> => {
    return accountsApiFetch<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
