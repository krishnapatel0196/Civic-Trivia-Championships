import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/layout/Header';
import { useCollections } from '../features/collections/hooks/useCollections';
import { CollectionPicker } from '../features/collections/components/CollectionPicker';
import { useTheme } from '../hooks/useTheme';

export function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { collections, selectedId, loading, select } = useCollections();
  const [playPressed, setPlayPressed] = useState(false);
  const { C, darkMode } = useTheme();

  const heroStyle = darkMode ? {
    background: '#0B1628',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  } : {
    background: '#EEF4F7',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? C.paper : '#EEF4F7' }}>
      <Header />

      {/* Hero section */}
      <section style={heroStyle}>
        {/* Dark mode: subtle vignette */}
        {darkMode && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(14,40,80,0.30) 0%, transparent 70%)',
          }} />
        )}

        <div className="relative max-w-3xl mx-auto px-4 pt-6 pb-10 flex flex-col items-center">
          {/* Logo */}
          <img
            src="/images/civic-trivia-championships-logo.png"
            alt="Civic Trivia Championship"
            className="w-full max-w-2xl px-4"
            style={{ filter: darkMode ? 'none' : 'none' }}
          />

          {/* Play button */}
          <div className="-mt-6 sm:-mt-8">
            <button
              onClick={() => navigate('/play', { state: { collectionId: selectedId } })}
              onPointerDown={() => setPlayPressed(true)}
              onPointerUp={() => setPlayPressed(false)}
              onPointerLeave={() => setPlayPressed(false)}
              className="transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img
                src={playPressed ? '/images/Play_Down.png' : '/images/Play_Up.png'}
                alt="Play"
                className="h-52 sm:h-64"
                draggable={false}
              />
            </button>
          </div>

          {/* Sign-in nudge */}
          {!isAuthenticated && (
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              color: darkMode ? '#7A6A5A' : C.muted,
              marginTop: '8px',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              <Link to="/login" style={{ color: '#B8A020', fontStyle: 'normal', textDecoration: 'none' }}>Sign in</Link>
              {' '}or{' '}
              <Link to="/signup" style={{ color: '#B8A020', fontStyle: 'normal', textDecoration: 'none' }}>create an account</Link>
              {' '}to track your progress and earn rewards.
            </p>
          )}
        </div>

        {/* Bottom fade — blends hero into collections */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{
          background: `linear-gradient(to bottom, transparent, ${darkMode ? C.paper : '#EEF4F7'})`,
        }} />
      </section>

      {/* Collections section */}
      <section style={{ background: darkMode ? C.paper : '#EEF4F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CollectionPicker
            collections={collections}
            selectedId={selectedId}
            loading={loading}
            onSelect={select}
          />
        </div>
      </section>
    </div>
  );
}
