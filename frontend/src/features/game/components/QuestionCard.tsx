import type { Question } from '../../../types/game';
import { useGameTheme } from '../gameTheme';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  const { G } = useGameTheme();
  return (
    <div
      className="flex flex-col items-center max-w-3xl mx-auto w-full px-2 md:px-6"
      role="region"
      aria-label={`Question ${questionNumber} of ${totalQuestions}`}
    >
      {/* Topic badge with flanking amber rules */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${G.topicRule})` }} />
        <div style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: G.accent,
          whiteSpace: 'nowrap',
        }}>
          {question.topic}
        </div>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${G.topicRule})` }} />
      </div>

      {/* Question text — H2 style; wraps to as many lines as needed so long questions aren't truncated */}
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        color: G.ink,
        fontSize: 'clamp(15px, 2vw, 22px)',
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.3,
        letterSpacing: '-0.5px',
      }}>
        {question.text}
      </div>
    </div>
  );
}
