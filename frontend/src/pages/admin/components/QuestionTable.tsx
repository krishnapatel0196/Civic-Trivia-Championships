import { useCallback, useRef, useState } from 'react';
import { DifficultyRate } from './DifficultyRate';
import { useTheme } from '../../../hooks/useTheme';
import { useWindowSize } from '../../../hooks/useWindowSize';

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
  { key: 'text',         label: 'Question Text',  sortKey: null,              defaultWidth: 300 },
  { key: 'collections',  label: 'Collection(s)',   sortKey: null,              defaultWidth: 150 },
  { key: 'difficulty',   label: 'Difficulty',      sortKey: 'difficulty',      defaultWidth: 100 },
  { key: 'qualityScore', label: 'Quality Score',   sortKey: 'quality_score',   defaultWidth: 115 },
  { key: 'encounters',   label: 'Encounters',      sortKey: 'encounter_count', defaultWidth: 105 },
  { key: 'correctRate',  label: 'Correct Rate',    sortKey: 'correct_count',   defaultWidth: 110 },
  { key: 'status',       label: 'Status',          sortKey: null,              defaultWidth: 90  },
  { key: 'created',      label: 'Created',         sortKey: 'created_at',      defaultWidth: 100 },
  { key: 'expires',      label: 'Expires',         sortKey: null,              defaultWidth: 100 },
  { key: 'violations',   label: 'Violations',      sortKey: null,              defaultWidth: 95  },
  { key: 'flags',        label: 'Flags',           sortKey: 'flag_count',      defaultWidth: 70  },
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
  const { C } = useTheme();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [colWidths, setColWidths] = useState<ColWidths>(buildDefaultWidths);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
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
    return <span style={{ marginLeft: '4px' }}>{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const getDifficultyStyle = (difficulty: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      easy:   { backgroundColor: 'rgba(37,92,63,0.15)',   color: C.correct },
      medium: { backgroundColor: 'rgba(212,160,23,0.15)', color: C.amber },
      hard:   { backgroundColor: 'rgba(192,21,42,0.12)',  color: C.incorrect },
    };
    return map[difficulty] ?? map.medium;
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      active:   { backgroundColor: 'rgba(37,92,63,0.15)',   color: C.correct },
      archived: { backgroundColor: 'rgba(192,21,42,0.12)',  color: C.incorrect },
      expired:  { backgroundColor: 'rgba(212,160,23,0.15)', color: C.amber },
    };
    return map[status] ?? { backgroundColor: C.ruleLight, color: C.muted };
  };

  const getFlagBadgeStyle = (flagCount: number): React.CSSProperties => {
    if (flagCount > 5) return { backgroundColor: 'rgba(192,21,42,0.12)', color: C.incorrect };
    if (flagCount > 2) return { backgroundColor: 'rgba(212,160,23,0.15)', color: C.amber };
    return { backgroundColor: C.ruleLight, color: C.muted };
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px 10px 12px',
    textAlign: 'left',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '11px',
    letterSpacing: '0.14em',
    color: '#C8BAA6',
    backgroundColor: '#3D2E22',
    position: 'relative',
    userSelect: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    overflow: 'hidden',
    borderBottom: `1px solid ${C.rule}`,
  };

  // ── Mobile card list ──────────────────────────────────────────────────────
  if (isMobile) {
    if (!questions) {
      // Mobile loading skeleton
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
              <div style={{ height: '14px', backgroundColor: C.rule, borderRadius: '2px', width: '85%', opacity: 0.5, marginBottom: '8px' }} />
              <div style={{ height: '14px', backgroundColor: C.rule, borderRadius: '2px', width: '60%', opacity: 0.4, marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ height: '20px', width: '60px', backgroundColor: C.rule, borderRadius: '2px', opacity: 0.4 }} />
                <div style={{ height: '20px', width: '50px', backgroundColor: C.rule, borderRadius: '2px', opacity: 0.4 }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {questions.map((question, index) => (
          <div
            key={question.id}
            onClick={() => onQuestionClick(question.id, index)}
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${C.rule}`,
              backgroundColor: hoveredId === question.id ? C.ruleLight : C.paper,
              cursor: 'pointer',
              transition: 'background-color 0.1s',
            }}
            onTouchStart={() => setHoveredId(question.id)}
            onTouchEnd={() => setHoveredId(null)}
          >
            {/* Question text — 2-line clamp */}
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '14px',
              color: C.ink,
              margin: '0 0 8px 0',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {question.text}
            </p>

            {/* Collection(s) */}
            {question.collectionNames.length > 0 && (
              <p style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px',
                color: C.muted,
                margin: '0 0 10px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {question.collectionNames.join(', ')}
              </p>
            )}

            {/* Badges row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {/* Difficulty */}
              <span style={{
                ...getDifficultyStyle(question.difficulty),
                padding: '2px 8px',
                borderRadius: '2px',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.08em',
              }}>
                {question.difficulty}
              </span>

              {/* Quality score */}
              {question.qualityScore !== null && (
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  color: C.muted,
                  backgroundColor: C.ruleLight,
                  padding: '2px 8px',
                  borderRadius: '2px',
                }}>
                  Q: {question.qualityScore}
                </span>
              )}

              {/* Status */}
              <span style={{
                ...getStatusStyle(question.status),
                padding: '2px 8px',
                borderRadius: '2px',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.08em',
              }}>
                {question.status}
              </span>

              {/* Flag count — only if > 0 */}
              {question.flagCount > 0 && (
                <span style={{
                  ...getFlagBadgeStyle(question.flagCount),
                  padding: '2px 8px',
                  borderRadius: '2px',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                }}>
                  {question.flagCount} {question.flagCount === 1 ? 'flag' : 'flags'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Desktop table (unchanged) ─────────────────────────────────────────────
  // Loading skeleton
  if (!questions) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ tableLayout: 'fixed', width: totalWidth, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} style={{ ...thStyle, width: colWidths[col.key] }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: C.paper }}>
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                {COLUMNS.map(col => (
                  <td key={col.key} style={tdStyle}>
                    <div style={{ height: '16px', backgroundColor: C.rule, borderRadius: '2px', width: '75%', opacity: 0.5 }} />
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
    <div style={{ overflowX: 'auto' }}>
      <table style={{ tableLayout: 'fixed', width: totalWidth, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                style={{ ...thStyle, width: colWidths[col.key], cursor: col.sortKey ? 'pointer' : 'default' }}
                onClick={col.sortKey ? () => onSortChange(col.sortKey!) : undefined}
              >
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                  {col.label} {renderSortIcon(col.sortKey)}
                </span>
                {/* Resize handle */}
                <div
                  style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '8px', cursor: 'col-resize', zIndex: 10 }}
                  onMouseDown={e => startResize(e, col.key)}
                  onClick={e => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => (
            <tr
              key={question.id}
              onClick={() => onQuestionClick(question.id, index)}
              onMouseEnter={() => setHoveredId(question.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ backgroundColor: hoveredId === question.id ? C.ruleLight : C.paper, cursor: 'pointer', transition: 'background-color 0.1s' }}
            >
              <td style={tdStyle}>
                <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.ink, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {question.text}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.muted, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {question.collectionNames.join(', ')}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ ...getDifficultyStyle(question.difficulty), padding: '2px 8px', borderRadius: '2px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.08em', display: 'inline-block' }}>
                  {question.difficulty}
                </span>
              </td>
              <td style={tdStyle}>
                {question.qualityScore !== null ? (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', fontWeight: 600, color: C.ink }}>{question.qualityScore}</span>
                ) : (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.mutedFg, fontStyle: 'italic' }}>—</span>
                )}
              </td>
              <td style={tdStyle}>
                <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.ink }}>{question.encounterCount}</span>
              </td>
              <td style={tdStyle}>
                <DifficultyRate correctCount={question.correctCount} encounterCount={question.encounterCount} />
              </td>
              <td style={tdStyle}>
                <span style={{ ...getStatusStyle(question.status), padding: '2px 8px', borderRadius: '2px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.08em', display: 'inline-block' }}>
                  {question.status}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.ink }}>{new Date(question.createdAt).toLocaleDateString()}</span>
              </td>
              <td style={tdStyle}>
                {question.expiresAt ? (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.ink }}>{new Date(question.expiresAt).toLocaleDateString()}</span>
                ) : (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.mutedFg }}>—</span>
                )}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {question.violationCount !== null ? (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', fontWeight: 600, color: question.violationCount === 0 ? C.correct : C.incorrect }}>
                    {question.violationCount}
                  </span>
                ) : (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.mutedFg }}>-</span>
                )}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {question.flagCount > 0 ? (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    ...(question.flagCount > 5 ? { backgroundColor: 'rgba(192,21,42,0.12)', color: C.incorrect } :
                        question.flagCount > 2 ? { backgroundColor: 'rgba(212,160,23,0.15)', color: C.amber } :
                        { backgroundColor: C.ruleLight, color: C.muted }),
                  }}>
                    {question.flagCount}
                  </span>
                ) : (
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.mutedFg }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
