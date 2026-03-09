import type { Question } from '../../../types/game';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 max-w-3xl mx-auto px-2 md:px-6"
      role="region"
      aria-label={`Question ${questionNumber} of ${totalQuestions}`}
    >
      {/* Topic badge */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: '0.22em',
        fontSize: '11px',
        color: '#9A8878',
      }}>
        {question.topic}
      </div>

      {/* Question text */}
      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        color: '#F5EDD8',
        fontSize: 'clamp(18px, 4vw, 26px)',
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.35,
      }}>
        {question.text}
      </div>
    </div>
  );
}
