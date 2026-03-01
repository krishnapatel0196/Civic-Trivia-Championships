import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { exchangeRefreshToken, fetchAccountProfile } from '../services/accountsApi';

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
        useAuthStore.getState().setTierResolved(true);
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

          // Resolve authoritative tier from the accounts API.
          // setLoading(false) is deferred until this resolves to prevent AdminGuard
          // from briefly seeing stale JWT-metadata tier before the API call completes.
          try {
            const profile = await fetchAccountProfile(data.access_token);
            useAuthStore.getState().setTier(profile.tier);
            useAuthStore.getState().setDisplayName(profile.display_name);
          } catch {
            // Profile fetch failed — session is still valid; tier stays at JWT metadata value.
            // Silently ignore so auth flow completes successfully.
          } finally {
            useAuthStore.getState().setTierResolved(true);
            setLoading(false);
          }
        } else {
          // exchangeRefreshToken already removed the stale token from localStorage
          clearAuth();
          useAuthStore.getState().setTierResolved(true);
          setLoading(false);
        }
      } catch {
        // Any unexpected error — clear auth state
        localStorage.removeItem('ev_refresh_token');
        clearAuth();
        useAuthStore.getState().setTierResolved(true);
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
