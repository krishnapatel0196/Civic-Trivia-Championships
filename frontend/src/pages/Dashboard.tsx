import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/layout/Header';
import { useCollections } from '../features/collections/hooks/useCollections';
import { CollectionPicker } from '../features/collections/components/CollectionPicker';

export function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { collections, selectedId, loading, select } = useCollections();
  const [playPressed, setPlayPressed] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#ECE7D9' }}>
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="p-6">
          {/* Logo */}
          <div className="flex justify-center pt-4 pb-1">
            <img
              src="/images/civic-trivia-championships-logo.png"
              alt="Civic Trivia Championship"
              className="w-full max-w-2xl px-4"
            />
          </div>

          {/* Play button */}
          <div className="text-center py-2 -mt-6 sm:-mt-8 h-16 sm:h-20 flex items-center justify-center mb-16 sm:mb-10">
            <button
              onClick={() => navigate('/play', { state: { collectionId: selectedId } })}
              onPointerDown={() => setPlayPressed(true)}
              onPointerUp={() => setPlayPressed(false)}
              onPointerLeave={() => setPlayPressed(false)}
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src={playPressed ? '/images/Play_Down.png' : '/images/Play_Up.png'}
                alt="Play"
                className="h-52 sm:h-64"
                draggable={false}
              />
            </button>
          </div>

          {/* Collection Picker */}
          <CollectionPicker
            collections={collections}
            selectedId={selectedId}
            loading={loading}
            onSelect={select}
          />

          {/* Sign-in nudge */}
          {!isAuthenticated && (
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: 'italic',
              color: '#7A6A5A',
              marginTop: '24px',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              <Link to="/login" style={{ color: '#C63B18', fontStyle: 'normal', textDecoration: 'none' }}>Sign in</Link>
              {' '}or{' '}
              <Link to="/signup" style={{ color: '#C63B18', fontStyle: 'normal', textDecoration: 'none' }}>create an account</Link>
              {' '}to track your progress and earn rewards.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
