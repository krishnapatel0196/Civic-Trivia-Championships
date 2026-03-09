import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { usePlayerXp } from '../../hooks/usePlayerXp';

export function Header() {
  const { user, accessToken, clearAuth, isAuthenticated, displayName } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const menuRef                    = useRef<HTMLDivElement>(null);
  const userId                     = useAuthStore((s) => s.user?.id ?? null);
  const { xpData, isConnected: isXpConnected } = usePlayerXp(userId);
  const xpNeeded         = xpData ? xpData.xpInLevel + xpData.xpToNextLevel : 0;
  const progressPercent  = xpNeeded > 0 ? Math.round((xpData!.xpInLevel / xpNeeded) * 100) : 0;

  const handleLogout = async () => {
    try {
      if (accessToken) await authService.logout(accessToken);
    } catch {
      // Ignore logout errors - clear local state anyway
    } finally {
      clearAuth();
      navigate('/login');
    }
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
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#ECE7D9',
      borderBottom: '1px solid #C8BAA6',
    }}>
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

          {/* Right side */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* User info + XP */}
              <div className="hidden sm:flex flex-col items-end">
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  color: '#3D2E22',
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
                      color: '#9A8878',
                    }}>
                      LV {xpData.level}
                    </span>
                    <div style={{
                      width: '56px',
                      height: '4px',
                      background: '#C8BAA6',
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
                      color: '#9A8878',
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
                  style={{ color: '#17120E' }}
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
                    background: '#ECE7D9',
                    border: '1px solid #C8BAA6',
                    borderRadius: '2px',
                    padding: '4px 0',
                    boxShadow: '0 4px 16px rgba(23,18,14,0.12)',
                  }}>
                    <button
                      onClick={() => handleMenuItemClick(() => navigate('/profile'))}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.12em',
                        color: '#3D2E22',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#DDD5C3')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      PROFILE
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
                        color: '#C63B18',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#DDD5C3')}
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
                to="/login"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '15px',
                  letterSpacing: '0.14em',
                  color: '#7A6A5A',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#17120E')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#7A6A5A')}
              >
                SIGN IN
              </Link>
              <Link
                to="/signup"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '15px',
                  letterSpacing: '0.14em',
                  color: '#C63B18',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#A82F12')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#C63B18')}
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
