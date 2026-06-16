import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FlaggedQuestionItem } from './FlaggedQuestionItem';
import type { Question } from '../../../types/game';

interface FeedbackElaborationScreenProps {
  flaggedQuestions: string[];  // Array of question externalIds
  questions: Question[];      // Full question objects from game state
  sessionId: string;
  onSubmit: (elaborations: Array<{
    questionId: string;
    reasons: string[];
    elaborationText: string;
  }>) => Promise<void>;
  onSkip: () => void;
}

export function FeedbackElaborationScreen({
  flaggedQuestions,
  questions,
  sessionId: _sessionId,
  onSubmit,
  onSkip,
}: FeedbackElaborationScreenProps) {
  const [elaborations, setElaborations] = useState<Map<string, { reasons: string[]; text: string }>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleElaborationUpdate = useCallback(
    (questionId: string, data: { reasons: string[]; text: string }) => {
      setElaborations((prev) => new Map(prev).set(questionId, data));
    },
    []
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Filter to non-empty elaborations
      const nonEmptyElaborations = Array.from(elaborations.entries())
        .filter(([_, data]) => data.reasons.length > 0 || data.text.trim().length > 0)
        .map(([questionId, data]) => ({
          questionId,
          reasons: data.reasons,
          elaborationText: data.text.trim(),
        }));

      // If all empty, just skip
      if (nonEmptyElaborations.length === 0) {
        onSkip();
        return;
      }

      // Submit the batch
      await onSubmit(nonEmptyElaborations);
    } catch (error) {
      console.error('Failed to submit elaborations:', error);
      // Don't crash - let button re-enable so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionCount = flaggedQuestions.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-white text-2xl font-bold mb-2">
            You flagged {questionCount} question{questionCount === 1 ? '' : 's'}
          </h2>
          <p className="text-slate-400">
            Help us improve by sharing what went wrong (optional)
          </p>
        </motion.div>

        {/* Flagged questions list */}
        <div className="space-y-4 mb-6">
          {flaggedQuestions.map((questionId, index) => {
            const question = questions.find((q) => q.id === questionId);
            if (!question) return null;

            return (
              <motion.div
                key={questionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <FlaggedQuestionItem
                  questionId={questionId}
                  questionText={question.text}
                  onUpdate={handleElaborationUpdate}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
