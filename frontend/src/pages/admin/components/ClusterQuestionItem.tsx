import { AdvancedFlag } from '../../../types/duplicates';

interface QuestionForDedup {
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  collections: string[];
  qualityScore: number | null;
}

interface ClusterQuestionItemProps {
  question: QuestionForDedup;
  isSelected: boolean;
  onSelect: () => void;
  isKept?: boolean;
  isArchived?: boolean;
  flags?: AdvancedFlag[];
}

export function ClusterQuestionItem({
  question,
  isSelected,
  onSelect,
  isKept,
  isArchived,
  flags = [],
}: ClusterQuestionItemProps) {
  // Get difficulty from qualityScore (0-25: easy, 26-50: medium, 51-75: hard, 76-100: expert)
  const getDifficulty = (score: number | null): string => {
    if (score === null) return 'unknown';
    if (score <= 25) return 'easy';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'hard';
    return 'expert';
  };

  const difficulty = getDifficulty(question.qualityScore);

  // Badge color helpers
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCollectionColor = (idx: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[idx % colors.length];
  };

  // Advanced flag badge helpers
  const getFlagBadgeColor = (type: AdvancedFlag['type'], severity: AdvancedFlag['severity']) => {
    if (type === 'answer-leakage') {
      if (severity === 'high') return 'bg-red-600 text-white';
      if (severity === 'medium') return 'bg-red-400 text-white';
      return 'bg-red-200 text-red-900 border border-red-400';
    }
    if (type === 'same-source-cluster') {
      if (severity === 'high') return 'bg-orange-600 text-white';
      if (severity === 'medium') return 'bg-orange-400 text-white';
      return 'bg-orange-200 text-orange-900 border border-orange-400';
    }
    // inverse-duplicate
    if (severity === 'high') return 'bg-purple-600 text-white';
    if (severity === 'medium') return 'bg-purple-400 text-white';
    return 'bg-purple-200 text-purple-900 border border-purple-400';
  };

  const getFlagLabel = (type: AdvancedFlag['type']) => {
    switch (type) {
      case 'answer-leakage': return 'Answer Leak';
      case 'same-source-cluster': return 'Same Source';
      case 'inverse-duplicate': return 'Inverse';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isKept
          ? 'bg-green-50 border-green-500'
          : isArchived
          ? 'bg-red-50 border-red-300 opacity-60'
          : isSelected
          ? 'border-red-500 bg-red-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox - keep selected questions, archive unchecked */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          disabled={isKept || isArchived}
          className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 rounded disabled:opacity-50"
        />

        <div className="flex-1 min-w-0">
          {/* Status badges */}
          <div className="flex items-center gap-2 mb-2">
            {isKept && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
                Kept
              </span>
            )}
            {isArchived && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-600 text-white rounded">
                Archived
              </span>
            )}
          </div>

          {/* Question text */}
          <p className={`text-sm font-medium text-gray-900 mb-3 ${isArchived ? 'line-through' : ''}`}>
            {question.text}
          </p>

          {/* Advanced flag badges */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {flags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`group relative inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getFlagBadgeColor(flag.type, flag.severity)}`}
                  title={flag.reason}
                >
                  {getFlagLabel(flag.type)}
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 max-w-xs">
                      <div className="font-semibold mb-1">{flag.reason}</div>
                      <div className="text-gray-300">{flag.evidence}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          <div className="space-y-2 mb-3">
            {question.options.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-sm ${
                  idx === question.correctAnswer ? 'font-medium text-green-700' : 'text-gray-700'
                }`}
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1">{option}</span>
                {idx === question.correctAnswer && (
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Collections */}
            {question.collections.map((coll, idx) => (
              <span key={coll} className={`inline-flex items-center px-2 py-1 rounded font-medium ${getCollectionColor(idx)}`}>
                {coll}
              </span>
            ))}
            {/* Quality score */}
            {question.qualityScore !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded font-medium bg-gray-100 text-gray-800">
                Quality: {question.qualityScore}
              </span>
            )}
            {/* Difficulty */}
            <span className={`inline-flex items-center px-2 py-1 rounded font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
