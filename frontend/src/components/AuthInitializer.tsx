import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { exchangeRefreshToken } from '../services/accountsApi';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { setAuth, clearAuth, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedRefresh = localStorage.getItem('ev_refresh_token');

      // No stored refresh token — resolve immediately with no network call.
      // New visitors and logged-out users skip the spinner entirely.
      if (!storedRefresh) {
        clearAuth();
        setLoading(false);
        return;
      }

      // Exchange stored refresh token for a new access token
      try {
        const data = await exchangeRefreshToken();

        if (data) {
          // Store the rotated refresh token
          localStorage.setItem('ev_refresh_token', data.refresh_token);
          setAuth(data.access_token, {
            id: data.user?.id || '',
            email: data.user?.email || '',
            tier: data.user?.tier || 'inform',
          });
        } else {
          // exchangeRefreshToken already removed the stale token from localStorage
          clearAuth();
        }
      } catch {
        // Any unexpected error — clear auth state
        localStorage.removeItem('ev_refresh_token');
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setAuth, clearAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
