import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../hooks/useTheme';

interface FinalQuestionAnnouncementProps {
  show: boolean;
}

export function FinalQuestionAnnouncement({ show }: FinalQuestionAnnouncementProps) {
  const { C } = useTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            minHeight: '100vh',
            background: C.paper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <motion.img
              src="/images/FinalQuestion_A.png"
              alt="Final Question"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '60%', maxWidth: '480px', margin: '0 auto', display: 'block', padding: '0 16px' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
