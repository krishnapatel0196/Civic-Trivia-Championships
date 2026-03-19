import { useState } from 'react';
import { motion } from 'framer-motion';

interface NextStepButtonProps {
  questionIndex: number;      // 0-based current question index
  totalQuestions: number;     // total questions in game (8)
  isFinalQuestion: boolean;   // true for Q8 (wager question)
  onAdvance: () => void;      // calls nextQuestion()
  disabled: boolean;          // true when LearnMore modal is open
}

export function NextStepButton({
  questionIndex,
  totalQuestions,
  isFinalQuestion,
  onAdvance,
  disabled,
}: NextStepButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Derive label from props
  let label: string;
  if (isFinalQuestion) {
    label = 'GAME RECAP';
  } else if (questionIndex === totalQuestions - 2) {
    label = 'LAST QUESTION';
  } else {
    label = 'NEXT QUESTION';
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="focus-ring-primary"
      aria-label={label}
      disabled={disabled}
      onClick={onAdvance}
      onMouseEnter={() => { if (!disabled) setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '20px',
        letterSpacing: '0.14em',
        background: isHovered && !disabled ? '#C88010' : '#E8A020',
        color: '#0F0D09',
        border: 'none',
        borderRadius: '2px',
        padding: '14px 40px',
        minHeight: '52px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s, opacity 0.15s',
      }}
    >
      {label}
    </motion.button>
  );
}
