import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '../../../hooks/useTheme';

interface SortableOptionProps {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  onTextChange: (text: string) => void;
  onMarkCorrect: () => void;
}

export function SortableOption({
  id,
  label,
  text,
  isCorrect,
  onTextChange,
  onMarkCorrect,
}: SortableOptionProps) {
  const { C } = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: isCorrect ? 'rgba(37,92,63,0.1)' : C.ruleLight,
    border: `1px solid ${isCorrect ? 'rgba(37,92,63,0.3)' : C.rule}`,
    borderRadius: '2px',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <button
        type="button"
        style={{ cursor: 'grab', color: C.mutedFg, background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center' }}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      {/* Label */}
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '0.08em', color: C.muted, width: '20px', flexShrink: 0 }}>
        {label}.
      </span>

      {/* Text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        maxLength={150}
        style={{ flex: 1, padding: '6px 10px', border: `1px solid ${C.rule}`, borderRadius: '2px', backgroundColor: C.paper, color: C.ink, fontFamily: "'Lora', Georgia, serif", fontSize: '14px', outline: 'none' }}
        placeholder="Enter option text"
      />

      {/* Correct answer radio */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
        <input
          type="radio"
          name="correctAnswer"
          checked={isCorrect}
          onChange={onMarkCorrect}
          style={{ width: '18px', height: '18px', accentColor: C.correct, cursor: 'pointer' }}
        />
        <span className="sr-only">Correct</span>
      </label>
    </div>
  );
}
