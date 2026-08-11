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
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(10,8,6,0.92)' }}
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
            <div style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: '#E8A020',
              marginBottom: '12px',
            }}>
              Level Up
            </div>
            <div style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(64px, 18vw, 120px)',
              fontWeight: 800,
              color: '#F5EDD8',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              marginBottom: '16px',
            }}>
              {newLevel}
            </div>
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '13px',
              color: '#7A6858',
              fontStyle: 'italic',
            }}>
              Tap to continue
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
