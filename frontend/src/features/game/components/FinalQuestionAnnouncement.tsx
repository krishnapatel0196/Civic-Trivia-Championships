import { motion, AnimatePresence } from 'framer-motion';
import { useGameTheme } from '../gameTheme';

interface FinalQuestionAnnouncementProps {
  show: boolean;
}

export function FinalQuestionAnnouncement({ show }: FinalQuestionAnnouncementProps) {
  const { G } = useGameTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'relative',
            minHeight: '100vh',
            background: G.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          {/* Amber highlight glow behind the text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 900, height: 560, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(232,160,32,0.28), transparent 70%)',
          }} />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}
          >
            <div style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 900,
              fontSize: 'clamp(40px, 8vw, 96px)', lineHeight: 1.05,
              letterSpacing: '-0.02em', color: G.ink,
            }}>
              Final
            </div>
            <div style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 900,
              fontSize: 'clamp(40px, 8vw, 96px)', lineHeight: 1.05,
              letterSpacing: '-0.02em', color: G.accent,
            }}>
              Question
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
