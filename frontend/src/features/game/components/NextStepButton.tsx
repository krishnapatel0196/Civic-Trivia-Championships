import { motion } from 'framer-motion';
import { PillButton } from '../../../components/ui/PillButton';

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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
      <PillButton
        className="focus-ring-primary"
        aria-label={label}
        disabled={disabled}
        onClick={onAdvance}
        style={{ width: '100%', fontSize: 15, padding: '10px 32px' }}
      >
        {label}
      </PillButton>
    </motion.div>
  );
}
