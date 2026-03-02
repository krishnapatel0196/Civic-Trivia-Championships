import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Avatar } from '../components/Avatar';
import { XpIcon } from '../components/icons/XpIcon';
import { GemIcon } from '../components/icons/GemIcon';
import { fetchTriviaStats, updateTimerMultiplier } from '../services/profileService';
import type { ProfileStats } from '../services/profileService';
import { fetchAccountProfile, ACCOUNTS_WEB_URL } from '../services/accountsApi';
import type { AccountProfile } from '../types/auth';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

function TierBadge({ tier }: { tier: string }) {
  if (tier === 'connected') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-600/20 text-teal-400 border border-teal-500/30">
        Connected
      </span>
    );
  }
  if (tier === 'empowered') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-600/20 text-purple-400 border border-purple-500/30">
        Empowered
      </span>
    );
  }
  return null;
}

export function Profile() {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [triviaStats, setTriviaStats] = useState<ProfileStats | null>(null);
  const [accountData, setAccountData] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [triviaError, setTriviaError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [updatingTimer, setUpdatingTimer] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { accessToken } = useAuthStore.getState();

      if (!accessToken) {
        navigate('/login?from=/profile', { replace: true });
        return;
      }

      const [triviaResult, accountResult] = await Promise.allSettled([
        fetchTriviaStats(),
        fetchAccountProfile(accessToken),
      ]);

      if (triviaResult.status === 'fulfilled') {
        setTriviaStats(triviaResult.value);
        useAuthStore.getState().setTimerMultiplier(triviaResult.value.timerMultiplier);
      } else {
        setTriviaError("Couldn't load game stats");
      }

      if (accountResult.status === 'fulfilled') {
        const profile = accountResult.value;
        setAccountData(profile);
        useAuthStore.getState().setDisplayName(profile.display_name);
        useAuthStore.getState().setTier(profile.tier);
        // TODO(43): re-enable inform-tier redirect once Connected accounts are available for testing
        // if (profile.tier === 'inform') {
        //   navigate('/signup', { replace: true });
        //   return;
        // }
      } else {
        setAccountError("Couldn't load account info");
      }

      setLoading(false);
    };

    load();
  }, [navigate]);

  const handleTimerMultiplierChange = async (multiplier: number) => {
    setUpdatingTimer(true);
    try {
      await updateTimerMultiplier(multiplier);
      if (triviaStats) {
        setTriviaStats({ ...triviaStats, timerMultiplier: multiplier });
      }
      useAuthStore.getState().setTimerMultiplier(multiplier);
    } catch {
      // Timer update failures are non-critical — silently ignore
    } finally {
      setUpdatingTimer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Hero section — accounts identity */}
        <div className="bg-slate-800 rounded-lg p-8">
          {accountError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Couldn't load account information. Some details may be unavailable.
            </div>
          )}

          {accountData && (
            <div className="flex items-start space-x-6">
              {/* Avatar — display only, no upload */}
              <div className="flex-shrink-0">
                <Avatar
                  name={accountData.display_name || accountData.email}
                  imageUrl={accountData.avatar_url}
                  size={80}
                />
              </div>

              {/* Identity */}
              <div className="flex-1">
                {/* Display name + tier badge inline */}
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-white">{accountData.display_name || accountData.email}</h1>
                  <TierBadge tier={accountData.tier} />
                </div>

                {/* Email */}
                <p className="text-slate-400 mt-1">{accountData.email}</p>

                {/* Manage account external link */}
                <a
                  href={ACCOUNTS_WEB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-teal-400 hover:text-teal-300 text-sm mt-2 transition-colors"
                >
                  <span>Manage your Empowered account</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                {/* Admin panel link — only shown to admin users */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm mt-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Admin Panel</span>
                  </Link>
                )}

                {/* XP and Gems */}
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <XpIcon className="w-6 h-6 text-cyan-400" />
                    <span className="text-2xl font-bold text-cyan-400">
                      {(accountData.connected_profile?.xp ?? 0).toLocaleString()}
                    </span>
                    <span className="text-slate-400">XP</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <GemIcon className="w-6 h-6 text-purple-400" />
                    <span className="text-2xl font-bold text-purple-400">
                      {(accountData.connected_profile?.gem_balance ?? 0).toLocaleString()}
                    </span>
                    <span className="text-slate-400">Gems</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats section — trivia backend */}
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>

          {triviaError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Couldn't load game stats. Try refreshing the page.
            </div>
          )}

          {triviaStats && triviaStats.gamesPlayed === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-lg text-slate-400">No games played yet!</p>
              <p className="text-slate-400">Play your first game to start tracking your stats.</p>
              <button
                onClick={() => navigate('/play')}
                className="mt-4 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Play Your First Game
              </button>
            </div>
          )}

          {triviaStats && triviaStats.gamesPlayed > 0 && (
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300">Games Played</span>
                <span className="text-white font-semibold">{triviaStats.gamesPlayed}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300">Best Score</span>
                <span className="text-white font-semibold">{triviaStats.bestScore.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-300">Overall Accuracy</span>
                <span className="text-white font-semibold">{triviaStats.overallAccuracy}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings section — trivia-specific */}
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Extended Time</h3>
                <p className="text-sm text-slate-400 mt-1">Adjusts the timer for all questions</p>
              </div>

              <div className="flex space-x-2">
                {[1.0, 1.5, 2.0].map((multiplier) => (
                  <button
                    key={multiplier}
                    onClick={() => handleTimerMultiplierChange(multiplier)}
                    disabled={updatingTimer}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      triviaStats?.timerMultiplier === multiplier
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } ${updatingTimer ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {multiplier}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
