import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { usePlayerXp } from '../../hooks/usePlayerXp';

export function Header() {
  const { user, accessToken, clearAuth, isAuthenticated, displayName } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { xpData, isConnected: isXpConnected } = usePlayerXp(userId);
  const xpNeeded = xpData ? xpData.xpInLevel + xpData.xpToNextLevel : 0;
  const progressPercent = xpNeeded > 0 ? Math.round((xpData!.xpInLevel / xpNeeded) * 100) : 0;

  const handleLogout = async () => {
    try {
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch {
      // Ignore logout errors - clear local state anyway
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleMenuItemClick = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src="/images/Empowered Vote Dark Logo.png"
                alt="Empowered Vote"
                className="h-10"
              />
            </Link>
          </div>

          {/* User info and hamburger menu / Sign in links */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-slate-300">{displayName || user.email}</span>
                {isXpConnected && xpData && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">Lv {xpData.level}</span>
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{xpData.xpInLevel.toLocaleString()} XP</span>
                  </div>
                )}
              </div>

              {/* Hamburger menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="min-w-[48px] min-h-[48px] p-2 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  aria-label="Menu"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2">
                    <button
                      onClick={() => handleMenuItemClick(() => navigate('/profile'))}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleMenuItemClick(handleLogout)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-sm font-medium text-teal-400 hover:text-teal-300">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-medium text-teal-400 hover:text-teal-300">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
