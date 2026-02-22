export interface FlaggedQuestionRow {
  id: number;
  externalId: string;
  text: string;
  difficulty: string;
  status: string;
  flagCount: number;
  collectionNames: string[];
  reasonBreakdown: Record<string, number>;
  lastFlaggedAt: string;
}

interface FlaggedQuestionsTableProps {
  questions: FlaggedQuestionRow[] | null;
  sort: string;
  order: string;
  onSortChange: (column: string) => void;
  onQuestionClick: (id: number) => void;
}

export function FlaggedQuestionsTable({
  questions,
  sort,
  order,
  onSortChange,
  onQuestionClick,
}: FlaggedQuestionsTableProps) {
  const renderSortIcon = (columnKey: string) => {
    if (sort !== columnKey) return null;
    return (
      <span className="ml-1">
        {order === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const getFlagCountColor = (count: number) => {
    if (count > 5) return 'text-red-600 font-bold';
    if (count > 2) return 'text-orange-600 font-bold';
    return 'text-gray-600 font-semibold';
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      'confusing-wording': { label: 'Confusing', color: 'bg-amber-100 text-amber-800' },
      'outdated-info': { label: 'Outdated', color: 'bg-blue-100 text-blue-800' },
      'wrong-answer': { label: 'Wrong', color: 'bg-red-100 text-red-800' },
      'not-interesting': { label: 'Boring', color: 'bg-gray-100 text-gray-800' },
    };
    return labels[reason] || { label: reason, color: 'bg-gray-100 text-gray-800' };
  };

  const renderReasonChips = (reasonBreakdown: Record<string, number> | null) => {
    if (!reasonBreakdown || Object.keys(reasonBreakdown).length === 0) {
      return <span className="text-sm text-gray-400">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(reasonBreakdown).map(([reason, count]) => {
          const { label, color } = getReasonLabel(reason);
          return (
            <span
              key={reason}
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}
            >
              {label} x{count}
            </span>
          );
        })}
      </div>
    );
  };

  // Loading skeleton
  if (!questions) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Question
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Collection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Reasons
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Last Flagged
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-red-900">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-800"
              onClick={() => onSortChange('flag_count')}
            >
              Flags {renderSortIcon('flag_count')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Question
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Collection
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Reasons
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-800"
              onClick={() => onSortChange('created_at')}
            >
              Last Flagged {renderSortIcon('created_at')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question) => (
            <tr
              key={question.id}
              onClick={() => onQuestionClick(question.id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <span className={`text-sm ${getFlagCountColor(question.flagCount)}`}>
                  {question.flagCount}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate">
                  {question.text}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {question.collectionNames.join(', ')}
                </div>
              </td>
              <td className="px-6 py-4">
                {renderReasonChips(question.reasonBreakdown)}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-900">
                  {new Date(question.lastFlaggedAt).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
