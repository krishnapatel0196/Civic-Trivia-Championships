import { useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  shouldShake: boolean;
  showRedFlash: boolean;
  compact?: boolean;
}

export function ScoreDisplay({ score, shouldShake, showRedFlash, compact = false }: ScoreDisplayProps) {
  const motionScore = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionScore, score, {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      mass: 0.5,
    });
    return () => controls.stop();
  }, [score, motionScore]);

  const displayScore = Math.round(motionScore.get());

  useEffect(() => {
    const unsubscribe = motionScore.on('change', () => {
      // Force re-render when motion value changes
    });
    return unsubscribe;
  }, [motionScore]);

  return (
    <div className="relative">
      {/* Red flash overlay */}
      {showRedFlash && (
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: '#C0152A', borderRadius: '2px' }}
        />
      )}

      {/* Score — just the number, no card */}
      <motion.div
        animate={
          shouldShake
            ? { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 } }
            : {}
        }
        className="relative"
      >
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          color: '#E8A020',
          letterSpacing: '0.02em',
          lineHeight: 1,
          fontSize: compact ? '22px' : '36px',
          tabularNums: 'tabular-nums',
        } as React.CSSProperties}>
          {displayScore.toLocaleString()}
        </div>
        {!compact && (
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: '#9A8878',
            marginTop: '2px',
          }}>
            PTS
          </div>
        )}
      </motion.div>
    </div>
  );
}
