import { motion } from 'framer-motion';
import { PillButton } from '../../../components/ui/PillButton';

interface LockInButtonProps {
  onLockIn: () => void;
}

export function LockInButton({ onLockIn }: LockInButtonProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PillButton
        className="focus-ring-primary"
        aria-label="Lock In"
        onClick={onLockIn}
        style={{ width: '100%', fontSize: 15, padding: '10px 32px' }}
      >
        Lock In
      </PillButton>
    </motion.div>
  );
}
