import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScorePopupProps {
  basePoints: number;
  speedBonus: number;
  isCorrect: boolean;
  isTimeout: boolean;
  onComplete: () => void;
}

export function ScorePopup({
  basePoints,
  speedBonus,
  isCorrect,
  isTimeout,
  onComplete,
}: ScorePopupProps) {
  // Auto-complete after animations finish
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, 1500); // Total animation duration (reduced for snappier pacing)

    return () => clearTimeout(timeout);
  }, [onComplete]);

  // Timeout treatment - orange/amber
  if (isTimeout) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <AnimatePresence>
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '28px',
              letterSpacing: '0.14em',
              color: '#E8A020',
              padding: '14px 36px',
              background: 'rgba(15,13,9,0.92)',
              border: '1px solid rgba(232,160,32,0.4)',
              borderRadius: '2px',
            }}
          >
            TIME'S UP
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Wrong answer - no popup (shake/flash handles it)
  if (!isCorrect) {
    return null;
  }

  // Correct answer - show base and speed bonus popups anchored near the top-left score display
  return (
    <div className="fixed top-0 left-0 z-20 pointer-events-none">
      <div className="relative" style={{ top: '40px', left: '16px' }}>
        <AnimatePresence>
          {/* Base points popup */}
          <motion.div
            key="base"
            initial={{ opacity: 0, y: 20, x: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -10, x: 40, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: 0,
            }}
            style={{
              position: 'absolute',
              left: 0,
              fontFamily: "'Manrope', sans-serif",
              fontSize: '32px',
              letterSpacing: '0.04em',
              color: '#E8A020',
              textShadow: '0 0 20px rgba(232,160,32,0.6)',
            }}
          >
            +{basePoints}
          </motion.div>

          {/* Speed bonus popup (only if bonus > 0) */}
          {speedBonus > 0 && (
            <motion.div
              key="speed"
              initial={{ opacity: 0, y: 24, x: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: 14, x: 40, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: 0.15,
              }}
              style={{
                position: 'absolute',
                left: 0,
                fontFamily: "'Manrope', sans-serif",
                fontSize: '16px',
                letterSpacing: '0.1em',
                color: '#C8A050',
                whiteSpace: 'nowrap',
                textShadow: '0 0 16px rgba(200,160,80,0.5)',
              }}
            >
              +{speedBonus} SPEED
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
