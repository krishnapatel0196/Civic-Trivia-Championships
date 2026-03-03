import type { Question } from '../../../types/game';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 md:gap-2 max-w-3xl mx-auto px-2 md:px-6" role="region" aria-label={`Question ${questionNumber} of ${totalQuestions}`}>
      {/* Topic badge */}
      <div className="text-teal-400/70 text-xs font-medium uppercase tracking-wider">
        {question.topic}
      </div>

      {/* Question text */}
      <div className="text-white text-lg md:text-2xl lg:text-3xl font-bold text-center leading-snug">
        {question.text}
      </div>
    </div>
  );
}
