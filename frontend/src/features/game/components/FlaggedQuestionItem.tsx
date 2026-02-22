import { useState, useEffect, useCallback } from 'react';
import { ReasonChip } from './ReasonChip';

interface FlaggedQuestionItemProps {
  questionId: string;
  questionText: string;
  onUpdate: (questionId: string, data: { reasons: string[]; text: string }) => void;
}

const REASON_OPTIONS = [
  { value: 'confusing-wording', label: 'Confusing wording' },
  { value: 'outdated-info', label: 'Outdated info' },
  { value: 'wrong-answer', label: 'Wrong answer' },
  { value: 'not-interesting', label: 'Not interesting' },
];

export function FlaggedQuestionItem({
  questionId,
  questionText,
  onUpdate,
}: FlaggedQuestionItemProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');

  // Notify parent of updates
  useEffect(() => {
    onUpdate(questionId, { reasons: selectedReasons, text: feedbackText });
  }, [questionId, selectedReasons, feedbackText, onUpdate]);

  const handleReasonToggle = useCallback((value: string) => {
    setSelectedReasons((prev) =>
      prev.includes(value)
        ? prev.filter((r) => r !== value)
        : [...prev, value]
    );
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Defense: enforce 500 char max even if HTML maxLength fails
    setFeedbackText(e.target.value.slice(0, 500));
  };

  const remaining = 500 - feedbackText.length;
  const isNearLimit = remaining <= 50;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {/* Question text */}
      <h3 className="text-white text-lg font-medium mb-4">{questionText}</h3>

      {/* Reason chips section */}
      <div className="mb-4">
        <label className="block text-slate-400 text-sm mb-2">
          What went wrong?
        </label>
        <div className="flex flex-wrap gap-2">
          {REASON_OPTIONS.map((option) => (
            <ReasonChip
              key={option.value}
              label={option.label}
              value={option.value}
              selected={selectedReasons.includes(option.value)}
              onToggle={handleReasonToggle}
            />
          ))}
        </div>
      </div>

      {/* Feedback textarea section */}
      <div>
        <label className="block text-slate-400 text-sm mb-2">
          Additional feedback (optional)
        </label>
        <textarea
          value={feedbackText}
          onChange={handleTextChange}
          maxLength={500}
          rows={3}
          placeholder="Share more details about the issue..."
          className="w-full bg-slate-700 text-white rounded-lg border border-slate-600 p-3 resize-none focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <div className={`text-xs text-right mt-1 ${isNearLimit ? 'text-amber-400' : 'text-slate-400'}`}>
          {feedbackText.length} / 500
        </div>
      </div>
    </div>
  );
}
