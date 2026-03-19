import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { GamePhase } from '../../../types/game';

interface AnswerGridProps {
  options: string[];
  selectedOption: number | null;
  correctAnswer: number;
  phase: GamePhase;
  onSelect: (index: number) => void;
  onLockIn: () => void;
  explanation: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Design tokens (game screen dark palette)
const G = {
  surface:      '#1A1510',
  border:       '#2E2620',
  borderHover:  '#5C4A30',
  ink:          '#F5EDD8',
  inkMuted:     '#9A8878',
  accent:       '#E8A020',
  accentBg:     'rgba(232,160,32,0.10)',
  correct:      '#2D9B5F',
  correctBg:    'rgba(45,155,95,0.14)',
  incorrect:    '#C0152A',
  incorrectBg:  'rgba(192,21,42,0.12)',
} as const;

export function AnswerGrid({
  options,
  selectedOption,
  correctAnswer,
  phase,
  onSelect,
  onLockIn,
  explanation,
}: AnswerGridProps) {
  const isAnswering = phase === 'answering' || phase === 'selected';
  const isRevealing = phase === 'revealing';
  const isLocked    = phase === 'locked';
  const reducedMotion = useReducedMotion();

  const [focusedIndex, setFocusedIndex]   = useState<number | null>(null);
  const buttonRefs                         = useRef<(HTMLButtonElement | null)[]>([]);
  const lockInButtonRef                    = useRef<HTMLButtonElement>(null);
  const [hoveredIndex, setHoveredIndex]   = useState<number | null>(null);

  const canSelect = isAnswering && !isLocked;

  useEffect(() => {
    if (!canSelect) setFocusedIndex(null);
  }, [canSelect]);

  useEffect(() => {
    if (focusedIndex !== null && buttonRefs.current[focusedIndex]) {
      buttonRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Returns the inline style object for each button based on phase/selection state
  const getButtonStyle = (index: number): React.CSSProperties => {
    const isSelected = selectedOption === index;
    const isCorrectAnswer = index === correctAnswer;
    const isHovered = hoveredIndex === index;

    if (isRevealing) {
      if (isCorrectAnswer) {
        return {
          background: G.correctBg,
          border: `2px solid ${G.correct}`,
        };
      }
      if (isSelected && !isCorrectAnswer) {
        return {
          background: G.incorrectBg,
          border: `2px solid ${G.incorrect}`,
        };
      }
      return {
        background: G.surface,
        border: `2px solid ${G.border}`,
        opacity: 0.2,
      };
    }

    if ((phase === 'selected' || isLocked) && isSelected) {
      return {
        background: G.accentBg,
        border: `2px solid ${G.accent}`,
      };
    }

    if (canSelect && isHovered) {
      return {
        background: '#241C14',
        border: `2px solid ${G.borderHover}`,
      };
    }

    return {
      background: G.surface,
      border: `2px solid ${G.border}`,
    };
  };

  // Letter badge style
  const getBadgeStyle = (index: number): React.CSSProperties => {
    const isSelected = selectedOption === index;
    const isCorrectAnswer = index === correctAnswer;

    if (isRevealing) {
      if (isCorrectAnswer) {
        return { background: G.correct, color: '#F5EDD8', borderColor: G.correct };
      }
      if (isSelected && !isCorrectAnswer) {
        return { background: G.incorrect, color: '#F5EDD8', borderColor: G.incorrect };
      }
      return { background: 'transparent', color: G.inkMuted, borderColor: G.border };
    }

    if ((phase === 'selected' || isLocked) && isSelected) {
      return { background: G.accent, color: '#0F0D09', borderColor: G.accent };
    }

    return { background: 'transparent', color: G.inkMuted, borderColor: G.border };
  };

  const getOptionScale = (index: number) => {
    if (isRevealing && index === correctAnswer) return 1.02;
    return 1;
  };

  const getOpacity = (index: number) => {
    if (phase === 'locked' && selectedOption !== null && index !== selectedOption) return 0.3;
    return 1;
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!canSelect) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((index + 1) % 4);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((index + 3) % 4);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (phase === 'selected') {
          onLockIn();
        } else if (phase === 'answering') {
          if (selectedOption === null) {
            onSelect(index);
          } else {
            onLockIn();
          }
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        e.preventDefault();
        const selectedIdx = parseInt(e.key) - 1;
        onSelect(selectedIdx);
        setFocusedIndex(selectedIdx);
        break;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 md:px-6">
      {/* Answer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-3.5 mb-2 md:mb-3">
        {options.map((option, index) => (
          <motion.button
            key={index}
            ref={el => (buttonRefs.current[index] = el)}
            onClick={() => canSelect && onSelect(index)}
            onKeyDown={e => handleKeyDown(e, index)}
            onMouseEnter={() => canSelect && setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            disabled={!canSelect}
            tabIndex={focusedIndex === index ? 0 : index === 0 && focusedIndex === null ? 0 : -1}
            aria-label={`Option ${OPTION_LETTERS[index]}: ${option}`}
            whileTap={canSelect && !reducedMotion ? { scale: 0.97 } : undefined}
            animate={{
              scale: getOptionScale(index),
              opacity: getOpacity(index),
              ...(phase === 'locked' && selectedOption === index
                ? reducedMotion
                  ? { boxShadow: `0 0 16px rgba(232,160,32,0.5)` }
                  : {
                      boxShadow: [
                        '0 0 8px rgba(232,160,32,0.3)',
                        '0 0 24px rgba(232,160,32,0.7)',
                        '0 0 8px rgba(232,160,32,0.3)',
                      ],
                    }
                : { boxShadow: '0 0 0px rgba(0,0,0,0)' }),
            }}
            transition={{
              scale:     { type: 'spring', stiffness: 400, damping: 17 },
              opacity:   { duration: 0.3 },
              boxShadow: reducedMotion ? { duration: 0 } : { duration: 0.7, repeat: 1, ease: 'easeInOut' },
            }}
            style={{
              position: 'relative',
              padding: 'clamp(8px, 1.2vh, 14px) clamp(12px, 1.5vw, 20px)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              minHeight: 'clamp(48px, 6vh, 64px)',
              cursor: canSelect ? 'pointer' : 'default',
              borderRadius: '3px',
              transition: 'background 0.15s, border-color 0.15s',
              outline: 'none',
              ...getButtonStyle(index),
            }}
          >
            {/* Letter badge — square, Bebas Neue */}
            <div style={{
              flexShrink: 0,
              width: '34px',
              height: '34px',
              border: '1px solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '0.05em',
              borderRadius: '2px',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              ...getBadgeStyle(index),
            }}>
              {OPTION_LETTERS[index]}
            </div>

            {/* Option text */}
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              color: G.ink,
              fontSize: '15px',
              lineHeight: 1.4,
              flex: 1,
            }}>
              {option}
            </div>

            {/* Status icons during reveal */}
            {isRevealing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ flexShrink: 0 }}
              >
                {index === correctAnswer && (
                  <svg style={{ width: '20px', height: '20px', color: G.correct }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {index === selectedOption && index !== correctAnswer && (
                  <svg style={{ width: '20px', height: '20px', color: G.incorrect }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Lock In button */}
      {phase === 'selected' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4"
        >
          <button
            ref={lockInButtonRef}
            onClick={onLockIn}
            style={{
              padding: '12px 36px',
              background: G.accent,
              color: '#0F0D09',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '20px',
              letterSpacing: '0.12em',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              minHeight: '48px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#C88010')}
            onMouseLeave={e => (e.currentTarget.style.background = G.accent)}
          >
            LOCK IN
          </button>
        </motion.div>
      )}

      {/* Reveal phase — explanation */}
      {isRevealing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ textAlign: 'center' }}
        >
          {selectedOption !== null && selectedOption !== correctAnswer && (
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.12em',
              fontSize: '16px',
              color: G.incorrect,
              marginBottom: '10px',
            }}>
              NOT QUITE
            </div>
          )}

          <div style={{
            background: '#1A1510',
            border: `1px solid #2E2620`,
            borderLeft: `3px solid #2E2620`,
            padding: '14px 16px',
            marginBottom: '8px',
            borderRadius: '2px',
          }}>
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              color: '#C8B89A',
              fontSize: '14px',
              lineHeight: 1.65,
              fontStyle: 'italic',
            }}>
              {explanation}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
