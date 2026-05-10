import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ACCOUNTS_API_URL } from '../../services/accountsApi';
import { usePlayerXp } from '../../hooks/usePlayerXp';
import { useTheme } from '../../hooks/useTheme';
import { useTierColor } from '../../hooks/useTierColor';

export function Header() {
  const { user, accessToken, clearAuth, isAuthenticated, displayName } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]             = useState(false);
  const [showSignedOutToast, setShowSignedOutToast] = useState(false);
  const menuRef                              = useRef<HTMLDivElement>(null);
  const userId                     = useAuthStore((s) => s.user?.id ?? null);
  const { xpData, isConnected: isXpConnected } = usePlayerXp(userId);
  const xpNeeded         = xpData ? xpData.xpInLevel + xpData.xpToNextLevel : 0;
  const progressPercent  = xpNeeded > 0 ? Math.round((xpData!.xpInLevel / xpNeeded) * 100) : 0;
  const { darkMode, C }  = useTheme();
  const tierBorderColor  = useTierColor();

  const handleLogout = async () => {
    try {
      await fetch(`${ACCOUNTS_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch {
      // Always clear local state regardless of logout errors
    }
    clearAuth();
    setShowSignedOutToast(true);
    setTimeout(() => setShowSignedOutToast(false), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleMenuItemClick = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <>
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: C.paper,
      borderBottom: `1px solid ${tierBorderColor}`,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo — swaps based on theme */}
          <div className="flex-shrink-0">
            <a href="https://alpha.empowered.vote">
              <img
                src={darkMode
                  ? '/images/Empowered Vote Dark Logo.png'
                  : '/images/Empowered_Vote_Logo_2026.png'}
                alt="Empowered Vote"
                className="h-10"
              />
            </a>
          </div>

          {/* Right side */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* User info + XP */}
              <div className="hidden sm:flex flex-col items-end">
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  color: C.inkLight,
                  fontStyle: 'italic',
                }}>
                  {displayName || user.email}
                </span>
                {isXpConnected && xpData && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                      color: C.mutedFg,
                    }}>
                      LV {xpData.level}
                    </span>
                    <div style={{
                      width: '56px',
                      height: '4px',
                      background: C.ruleLight,
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: '#E8A020',
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: C.mutedFg,
                    }}>
                      {xpData.xpInLevel.toLocaleString()} XP
                    </span>
                  </div>
                )}
              </div>

              {/* Hamburger */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="min-w-[48px] min-h-[48px] p-2 flex items-center justify-center transition-opacity hover:opacity-60"
                  aria-label="Menu"
                  style={{ color: C.ink }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '4px',
                    width: '160px',
                    background: C.paper,
                    border: `1px solid ${C.rule}`,
                    borderRadius: '2px',
                    padding: '4px 0',
                    boxShadow: '0 4px 16px rgba(23,18,14,0.18)',
                  }}>
                    <button
                      onClick={() => handleMenuItemClick(() => { window.location.href = 'https://login.empowered.vote/profile'; })}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.12em',
                        color: C.inkLight,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.ruleLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      PROFILE
                    </button>
                    <button
                      onClick={() => handleMenuItemClick(() => { window.location.href = 'https://financials.empowered.vote'; })}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.12em',
                        color: C.inkLight,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.ruleLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      EV FINANCIALS
                    </button>
                    <button
                      onClick={() => handleMenuItemClick(() => navigate('/leaderboard'))}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.12em',
                        color: C.inkLight,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.ruleLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      LEADERBOARD
                    </button>
                    <button
                      onClick={() => handleMenuItemClick(handleLogout)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.12em',
                        color: C.accent,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.ruleLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      LOG OUT
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <Link
                to="/leaderboard"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '15px',
                  letterSpacing: '0.14em',
                  color: C.muted,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = C.ink)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = C.muted)}
              >
                LEADERBOARD
              </Link>
              <Link
                to="/login"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '15px',
                  letterSpacing: '0.14em',
                  color: C.muted,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = C.ink)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = C.muted)}
              >
                SIGN IN
              </Link>
              <Link
                to="/signup"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '15px',
                  letterSpacing: '0.14em',
                  color: C.accent,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = C.accentHover)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = C.accent)}
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    {showSignedOutToast && (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: '#1C1510',
        color: '#ECE7D9',
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '14px',
        fontWeight: 500,
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(23,18,14,0.3)',
      }}>
        You've been signed out
      </div>
    )}
    </>
  );
}
