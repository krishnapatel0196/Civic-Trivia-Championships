import type { PlayerXpData } from '../../../hooks/usePlayerXp';

interface XpStripProps {
  xpData: PlayerXpData | null;
  isLoading: boolean;
}

export function XpStrip({ xpData, isLoading }: XpStripProps) {
  if (isLoading) {
    return (
      <div className="mt-4 w-64 mx-auto">
        <div className="h-4 bg-slate-700/50 rounded animate-pulse mb-2" />
        <div className="h-2 bg-slate-700/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!xpData) return null;

  const xpNeeded = xpData.xpInLevel + xpData.xpToNextLevel;
  const progress = xpNeeded > 0 ? xpData.xpInLevel / xpNeeded : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="mt-4 w-64 mx-auto text-center">
      <div className="text-slate-300 text-sm font-medium mb-1">
        Level {xpData.level}
      </div>
      <div className="text-slate-400 text-xs mb-2">
        {xpData.xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
      </div>
      <div
        className="h-2 bg-slate-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP progress: ${progressPercent}%`}
      >
        <div
          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
