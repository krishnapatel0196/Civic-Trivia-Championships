import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface LevelUpOverlayProps {
  newLevel: number;
  onDismiss: () => void;
}

export function LevelUpOverlay({ newLevel, onDismiss }: LevelUpOverlayProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, reducedMotion ? 0 : 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss, reducedMotion]);

  const handleTap = () => {
    setVisible(false);
    setTimeout(onDismiss, reducedMotion ? 0 : 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 cursor-pointer"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleTap}
          role="dialog"
          aria-modal="true"
          aria-label={`Level up! You reached Level ${newLevel}`}
        >
          <motion.div
            className="text-center pointer-events-none"
            initial={reducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 1.1, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="text-teal-400 text-lg font-semibold tracking-widest uppercase mb-2">
              Level Up!
            </div>
            <div className="text-8xl font-black text-white mb-4">
              {newLevel}
            </div>
            <div className="text-slate-400 text-sm mt-4">Tap to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
