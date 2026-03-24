import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { exchangeRefreshToken, fetchAccountProfile, ssoSessionCheck } from '../services/accountsApi';
import { API_URL } from '../services/api';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { setAuth, clearAuth, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      let storedRefresh = localStorage.getItem('ev_refresh_token');

      if (!storedRefresh) {
        // No local refresh token — attempt silent SSO via ev_session cookie.
        // Use a 150ms delay before showing the spinner to prevent flash for fast checks.
        setLoading(false);
        const spinnerTimer = setTimeout(() => setLoading(true), 150);

        try {
          const ssoResult = await ssoSessionCheck();
          clearTimeout(spinnerTimer);

          if (ssoResult) {
            // SSO succeeded — write refresh token to localStorage and fall through
            // to the existing exchange logic below.
            localStorage.setItem('ev_refresh_token', ssoResult.refresh_token);
            storedRefresh = ssoResult.refresh_token;
          } else {
            // No SSO session — resolve as unauthenticated silently.
            clearAuth();
            useAuthStore.getState().setTierResolved(true);
            setLoading(false);
            return;
          }
        } catch {
          clearTimeout(spinnerTimer);
          clearAuth();
          useAuthStore.getState().setTierResolved(true);
          setLoading(false);
          return;
        }
      }

      // Exchange stored refresh token (either pre-existing or from SSO above)
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

          // Resolve authoritative tier and admin status in parallel.
          // setLoading(false) is deferred until both resolve to prevent AdminGuard
          // from briefly seeing stale state before the API calls complete.
          try {
            const [profileResult, adminResult] = await Promise.allSettled([
              fetchAccountProfile(data.access_token),
              fetch(`${API_URL}/api/users/profile/admin-status`, {
                headers: { Authorization: `Bearer ${data.access_token}` },
              }).then((r) => r.ok ? r.json() : { isAdmin: false, isSuperAdmin: false }),
            ]);

            if (profileResult.status === 'fulfilled') {
              useAuthStore.getState().setTier(profileResult.value.tier);
              useAuthStore.getState().setDisplayName(profileResult.value.display_name);
            }

            if (adminResult.status === 'fulfilled') {
              const { isAdmin, isSuperAdmin } = adminResult.value as { isAdmin: boolean; isSuperAdmin: boolean };
              useAuthStore.getState().setAdminStatus(isAdmin, isSuperAdmin);
            }
          } catch {
            // Fetch failures are non-critical — session is still valid.
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
