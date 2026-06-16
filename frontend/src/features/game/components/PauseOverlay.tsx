import FocusTrap from 'focus-trap-react';
import { motion } from 'framer-motion';

interface PauseOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ onResume, onQuit }: PauseOverlayProps) {
  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: '#resume-button',
        escapeDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-label="Game paused"
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(10,8,6,0.88)', backdropFilter: 'blur(6px)' }}
      >
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(40px, 10vw, 64px)',
            fontWeight: 800,
            color: '#F5EDD8',
            letterSpacing: '-1.5px',
            lineHeight: 1.125,
            marginBottom: '40px',
          }}>
            PAUSED
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              id="resume-button"
              onClick={onResume}
              style={{
                padding: '14px 48px',
                background: '#E8A020',
                color: '#0F0D09',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.25px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: '52px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#C88010')}
              onMouseLeave={e => (e.currentTarget.style.background = '#E8A020')}
            >
              RESUME
            </button>
            <button
              onClick={onQuit}
              style={{
                padding: '12px 48px',
                background: 'transparent',
                color: '#7A6858',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '-0.1px',
                border: '1px solid #3A2E20',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: '48px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7A6858';
                e.currentTarget.style.color = '#F5EDD8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#3A2E20';
                e.currentTarget.style.color = '#7A6858';
              }}
            >
              QUIT GAME
            </button>
          </div>
        </div>
      </motion.div>
    </FocusTrap>
  );
}
