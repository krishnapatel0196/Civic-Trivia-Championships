import { useCallback, useRef, useState } from 'react';
import { DifficultyRate } from './DifficultyRate';

export interface QuestionRow {
  id: number;
  externalId: string;
  text: string;
  difficulty: string;
  qualityScore: number | null;
  violationCount: number | null;
  flagCount: number;
  status: string;
  encounterCount: number;
  correctCount: number;
  createdAt: string;
  expiresAt: string | null;
  collectionNames: string[];
}

interface QuestionTableProps {
  questions: QuestionRow[] | null;
  sort: string;
  order: string;
  onSortChange: (column: string) => void;
  onQuestionClick: (id: number, index: number) => void;
}

const COLUMNS = [
  { key: 'text',         label: 'Question Text',  sortKey: null,            defaultWidth: 300 },
  { key: 'collections',  label: 'Collection(s)',   sortKey: null,            defaultWidth: 150 },
  { key: 'difficulty',   label: 'Difficulty',      sortKey: 'difficulty',    defaultWidth: 100 },
  { key: 'qualityScore', label: 'Quality Score',   sortKey: 'quality_score', defaultWidth: 115 },
  { key: 'encounters',   label: 'Encounters',      sortKey: 'encounter_count', defaultWidth: 105 },
  { key: 'correctRate',  label: 'Correct Rate',    sortKey: 'correct_count', defaultWidth: 110 },
  { key: 'status',       label: 'Status',          sortKey: null,            defaultWidth: 90  },
  { key: 'created',      label: 'Created',         sortKey: 'created_at',    defaultWidth: 100 },
  { key: 'expires',      label: 'Expires',         sortKey: null,            defaultWidth: 100 },
  { key: 'violations',   label: 'Violations',      sortKey: null,            defaultWidth: 95  },
  { key: 'flags',        label: 'Flags',           sortKey: 'flag_count',    defaultWidth: 70  },
] as const;

type ColKey = typeof COLUMNS[number]['key'];
type ColWidths = Record<ColKey, number>;

interface DragState {
  col: ColKey;
  startX: number;
  startWidth: number;
}

function buildDefaultWidths(): ColWidths {
  return Object.fromEntries(COLUMNS.map(c => [c.key, c.defaultWidth])) as ColWidths;
}

export function QuestionTable({
  questions,
  sort,
  order,
  onSortChange,
  onQuestionClick,
}: QuestionTableProps) {
  const [colWidths, setColWidths] = useState<ColWidths>(buildDefaultWidths);
  const dragRef = useRef<DragState | null>(null);

  const startResize = useCallback((e: React.MouseEvent, col: ColKey) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { col, startX: e.clientX, startWidth: colWidths[col] };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      const newWidth = Math.max(50, dragRef.current.startWidth + delta);
      setColWidths(prev => ({ ...prev, [dragRef.current!.col]: newWidth }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [colWidths]);

  const totalWidth = COLUMNS.reduce((sum, c) => sum + colWidths[c.key], 0);

  const renderSortIcon = (sortKey: string | null) => {
    if (!sortKey || sort !== sortKey) return null;
    return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = { easy: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', hard: 'bg-red-100 text-red-800' };
    return badges[difficulty as keyof typeof badges] || badges.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges = { active: 'bg-green-100 text-green-800', archived: 'bg-red-100 text-red-800', expired: 'bg-yellow-100 text-yellow-800' };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getFlagCountBadge = (count: number) => {
    if (count > 5) return 'bg-red-100 text-red-600 font-bold';
    if (count > 2) return 'bg-orange-100 text-orange-600 font-bold';
    if (count > 0) return 'bg-gray-100 text-gray-600';
    return '';
  };

  const thBase = 'py-3 pl-3 pr-1 text-left text-xs font-medium text-white uppercase tracking-wider relative select-none overflow-hidden';
  const tdBase = 'py-4 px-3 overflow-hidden';

  // Loading skeleton
  if (!questions) {
    return (
      <div className="overflow-x-auto">
        <table className="divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: totalWidth }}>
          <thead className="bg-red-900">
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} className={thBase} style={{ width: colWidths[col.key] }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {COLUMNS.map(col => (
                  <td key={col.key} className={tdBase}>
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: totalWidth }}>
        <thead className="bg-red-900">
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`${thBase}${col.sortKey ? ' cursor-pointer hover:bg-red-800' : ''}`}
                style={{ width: colWidths[col.key] }}
                onClick={col.sortKey ? () => onSortChange(col.sortKey!) : undefined}
              >
                <span className="truncate block pr-2">
                  {col.label} {renderSortIcon(col.sortKey)}
                </span>
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-white/40 z-10"
                  onMouseDown={e => startResize(e, col.key)}
                  onClick={e => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question, index) => (
            <tr
              key={question.id}
              onClick={() => onQuestionClick(question.id, index)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className={tdBase}>
                <div className="text-sm text-gray-900 truncate">{question.text}</div>
              </td>
              <td className={tdBase}>
                <div className="text-sm text-gray-900 truncate">{question.collectionNames.join(', ')}</div>
              </td>
              <td className={tdBase}>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyBadge(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              </td>
              <td className={tdBase}>
                {question.qualityScore !== null ? (
                  <span className="text-sm font-medium text-gray-900">{question.qualityScore}</span>
                ) : (
                  <span className="text-sm text-gray-400">Not scored</span>
                )}
              </td>
              <td className={tdBase}>
                <span className="text-sm text-gray-900">{question.encounterCount}</span>
              </td>
              <td className={tdBase}>
                <DifficultyRate correctCount={question.correctCount} encounterCount={question.encounterCount} />
              </td>
              <td className={tdBase}>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(question.status)}`}>
                  {question.status}
                </span>
              </td>
              <td className={tdBase}>
                <span className="text-sm text-gray-900">{new Date(question.createdAt).toLocaleDateString()}</span>
              </td>
              <td className={tdBase}>
                {question.expiresAt ? (
                  <span className="text-sm text-gray-900">{new Date(question.expiresAt).toLocaleDateString()}</span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
              <td className={`${tdBase} text-center`}>
                {question.violationCount !== null ? (
                  <span className={`text-sm font-semibold ${question.violationCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {question.violationCount}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className={`${tdBase} text-center`}>
                {question.flagCount > 0 ? (
                  <span className={`px-2 py-1 text-xs rounded-full ${getFlagCountBadge(question.flagCount)}`}>
                    {question.flagCount}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
