import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/layout/Header';
import { useCollections } from '../features/collections/hooks/useCollections';
import { CollectionPicker } from '../features/collections/components/CollectionPicker';
import { usePlayerXp } from '../hooks/usePlayerXp';
import { XpStrip } from '../features/game/components/XpStrip';
import { ACCOUNTS_WEB_URL } from '../services/accountsApi';

export function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { xpData, isLoading: isXpLoading, isConnected: isXpConnected } = usePlayerXp(userId);
  const { collections, selectedId, loading, select } = useCollections();
  const [playPressed, setPlayPressed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="p-6">
          <div className="flex justify-center pt-4 pb-1">
            <img
              src="/images/civic-trivia-championships-logo.png"
              alt="Civic Trivia Championship"
              className="w-full max-w-2xl px-4"
            />
          </div>

          {/* Start Game Button */}
          <div className="text-center py-2 -mt-6 sm:-mt-8 h-16 sm:h-20 flex items-center justify-center mb-16 sm:mb-0">
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

          {/* XP strip for Connected players, link prompt for others */}
          {isXpConnected && (
            <div className="flex justify-center mb-4">
              <XpStrip xpData={xpData} isLoading={isXpLoading} />
            </div>
          )}
          {!isXpConnected && !isXpLoading && isAuthenticated && (
            <div className="text-center mb-4">
              <a
                href={ACCOUNTS_WEB_URL}
                className="text-slate-500 hover:text-slate-400 text-sm transition-colors"
              >
                Link account to earn XP
              </a>
            </div>
          )}

          {/* Collection Picker */}
          <CollectionPicker
            collections={collections}
            selectedId={selectedId}
            loading={loading}
            onSelect={select}
          />

          {/* Sign-in nudge for anonymous users */}
          {!isAuthenticated && (
            <p className="text-slate-400 mt-6 text-sm text-center">
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
              {' '}or{' '}
              <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-medium">create an account</Link>
              {' '}to track your progress and earn rewards.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
