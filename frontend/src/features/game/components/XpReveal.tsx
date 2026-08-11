import { motion } from 'framer-motion';
import { XpResult } from '../../../types/game';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { XpIcon } from '../../../components/icons/XpIcon';

interface XpRevealProps {
  xpResult: XpResult;
}

export function XpReveal({ xpResult }: XpRevealProps) {
  const reducedMotion = useReducedMotion();

  const xpInLevel = xpResult.xpInLevel ?? 0;
  const xpToNextLevel = xpResult.xpToNextLevel ?? 0;
  const xpNeeded = xpInLevel + xpToNextLevel;
  const progressPercent = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 0;

  if (xpResult.isDuplicate) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex items-center gap-2 text-slate-500">
          <XpIcon className="w-5 h-5" />
          <span className="text-lg font-semibold">XP</span>
        </div>
        <p className="text-slate-500 text-sm">Already recorded</p>
        {xpNeeded > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>{xpInLevel} XP</span>
              <span>{xpToNextLevel} to next level</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.div
        className="flex items-center gap-2"
        initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reducedMotion ? {} : { type: 'spring', stiffness: 400, damping: 15 }}
      >
        <XpIcon className="w-6 h-6 text-cyan-400" />
        <span className="text-2xl font-bold text-cyan-400">
          +{xpResult.amount ?? 0} XP
        </span>
      </motion.div>

      {xpNeeded > 0 && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyan-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.6, delay: 0.3, ease: 'easeOut' }
              }
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{xpInLevel} XP in level</span>
            <span>{xpToNextLevel} to next level</span>
          </div>
        </div>
      )}

      {xpResult.level !== undefined && (
        <p className="text-slate-400 text-sm">
          Level {xpResult.level}
        </p>
      )}
    </div>
  );
}
