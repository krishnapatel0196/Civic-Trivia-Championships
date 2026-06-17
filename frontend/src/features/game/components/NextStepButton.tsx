import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameTheme } from '../gameTheme';

interface NextStepButtonProps {
  questionIndex: number;      // 0-based current question index
  totalQuestions: number;     // total questions in game (5)
  isFinalQuestion: boolean;   // true for the final question (wager)
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
  const { G } = useGameTheme();

  // Derive label from props
  let label: string;
  if (isFinalQuestion) {
    label = 'Game Recap';
  } else if (questionIndex === totalQuestions - 2) {
    label = 'Last Question';
  } else {
    label = 'Next Question';
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
        fontFamily: "'Manrope', sans-serif",
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0px',
        background: isHovered && !disabled ? G.btnHover : G.btn,
        color: G.btnText,
        border: 'none',
        borderRadius: '10px',
        padding: '10px 32px',
        width: '100%',
        minHeight: '40px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s, opacity 0.15s',
      }}
    >
      {label}
    </motion.button>
  );
}
