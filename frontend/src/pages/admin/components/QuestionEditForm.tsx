import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableOption } from './SortableOption';
import { useTheme } from '../../../hooks/useTheme';

interface QuestionDetail {
  id: number;
  externalId: string;
  text: string;
  difficulty: string;
  status: string;
  createdAt: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  source: {
    name: string;
    url: string | null;
  };
  encounterCount: number;
  correctCount: number;
  qualityScore: number | null;
  violations: Array<{
    rule: string;
    severity: 'blocking' | 'advisory';
    message: string;
    evidence?: string;
  }>;
}

export interface EditFormData {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceUrl: string;
  difficulty: number;
}

interface OptionItem {
  id: string;
  text: string;
}

interface QuestionEditFormProps {
  question: QuestionDetail;
  onSave: (data: EditFormData) => Promise<void>;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  isSaving: boolean;
}

export function QuestionEditForm({
  question,
  onSave,
  onCancel,
  onDirtyChange,
  isSaving,
}: QuestionEditFormProps) {
  const { C } = useTheme();

  const difficultyToNumber = (diff: string): number => {
    switch (diff.toLowerCase()) {
      case 'easy': return 3;
      case 'medium': return 5;
      case 'hard': return 8;
      default: return 5;
    }
  };

  const [text, setText] = useState(question.text);
  const [optionItems, setOptionItems] = useState<OptionItem[]>(
    question.options.map((opt, idx) => ({ id: `opt-${idx}`, text: opt }))
  );
  const [correctOptionId, setCorrectOptionId] = useState(`opt-${question.correctAnswer}`);
  const [explanation, setExplanation] = useState(question.explanation);
  const [sourceUrl, setSourceUrl] = useState(question.source.url || '');
  const [difficulty, setDifficulty] = useState(difficultyToNumber(question.difficulty));
  const [sourceUrlError, setSourceUrlError] = useState('');

  const [initialState] = useState({
    text: question.text,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sourceUrl: question.source.url || '',
    difficulty: difficultyToNumber(question.difficulty),
  });

  useEffect(() => {
    const currentCorrectIndex = optionItems.findIndex((item) => item.id === correctOptionId);
    const currentOptions = optionItems.map((item) => item.text);
    const isDirty =
      text !== initialState.text ||
      JSON.stringify(currentOptions) !== JSON.stringify(initialState.options) ||
      currentCorrectIndex !== initialState.correctAnswer ||
      explanation !== initialState.explanation ||
      sourceUrl !== initialState.sourceUrl ||
      difficulty !== initialState.difficulty;
    onDirtyChange(isDirty);
  }, [text, optionItems, correctOptionId, explanation, sourceUrl, difficulty, initialState, onDirtyChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOptionItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleOptionTextChange = (id: string, newText: string) => {
    setOptionItems((items) => items.map((item) => (item.id === id ? { ...item, text: newText } : item)));
  };

  const validateUrl = (url: string) => {
    if (!url.trim()) { setSourceUrlError(''); return; }
    try { new URL(url); setSourceUrlError(''); }
    catch { setSourceUrlError('Invalid URL format'); }
  };

  const handleSourceUrlChange = (value: string) => {
    setSourceUrl(value);
    validateUrl(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceUrlError) return;
    const correctAnswerIndex = optionItems.findIndex((item) => item.id === correctOptionId);
    if (correctAnswerIndex === -1) return;
    await onSave({
      text,
      options: optionItems.map((item) => item.text),
      correctAnswer: correctAnswerIndex,
      explanation,
      sourceUrl,
      difficulty,
    });
  };

  const getDifficultyLabel = (value: number): string => {
    if (value <= 3) return 'Easy';
    if (value <= 7) return 'Medium';
    return 'Hard';
  };

  const getDifficultyStyle = (value: number): React.CSSProperties => {
    if (value <= 3) return { backgroundColor: 'rgba(37,92,63,0.12)', color: C.correct };
    if (value <= 7) return { backgroundColor: 'rgba(212,160,23,0.12)', color: C.amber };
    return { backgroundColor: 'rgba(192,21,42,0.12)', color: C.incorrect };
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '11px',
    letterSpacing: '0.14em',
    color: C.muted,
    marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${C.rule}`,
    borderRadius: '2px',
    backgroundColor: C.paper,
    color: C.ink,
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    opacity: isSaving ? 0.5 : 1,
  };

  const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
    const isNearLimit = current > max * 0.9;
    return (
      <div style={{ fontSize: '12px', marginTop: '4px', color: isNearLimit ? C.incorrect : C.mutedFg, fontFamily: "'Lora', Georgia, serif" }}>
        {current}/{max} characters
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Question Text */}
      <div>
        <label htmlFor="questionText" style={labelStyle}>
          QUESTION TEXT <span style={{ color: C.incorrect }}>*</span>
        </label>
        <textarea
          id="questionText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          rows={3}
          required
          disabled={isSaving}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <CharacterCounter current={text.length} max={300} />
      </div>

      {/* Options */}
      <div>
        <label style={labelStyle}>
          ANSWER OPTIONS <span style={{ color: C.incorrect }}>*</span>
        </label>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={optionItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {optionItems.map((item, index) => (
                <SortableOption
                  key={item.id}
                  id={item.id}
                  label={String.fromCharCode(65 + index)}
                  text={item.text}
                  isCorrect={item.id === correctOptionId}
                  onTextChange={(newText) => handleOptionTextChange(item.id, newText)}
                  onMarkCorrect={() => setCorrectOptionId(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Explanation */}
      <div>
        <label htmlFor="explanation" style={labelStyle}>
          EXPLANATION <span style={{ color: C.incorrect }}>*</span>
        </label>
        <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '12px', color: C.mutedFg, marginBottom: '6px', fontStyle: 'italic' }}>
          Supports basic markdown (bold, italic, links)
        </div>
        <textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          maxLength={500}
          rows={4}
          required
          disabled={isSaving}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <CharacterCounter current={explanation.length} max={500} />
      </div>

      {/* Source URL */}
      <div>
        <label htmlFor="sourceUrl" style={labelStyle}>SOURCE URL</label>
        <input
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => handleSourceUrlChange(e.target.value)}
          onBlur={(e) => validateUrl(e.target.value)}
          disabled={isSaving}
          style={inputStyle}
          placeholder="https://example.com/source"
        />
        {sourceUrlError && (
          <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '12px', color: C.incorrect, marginTop: '4px' }}>
            {sourceUrlError}
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div>
        <label htmlFor="difficulty" style={labelStyle}>DIFFICULTY</label>
        <input
          id="difficulty"
          type="range"
          min={1}
          max={10}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          disabled={isSaving}
          style={{ width: '100%', accentColor: C.accent, opacity: isSaving ? 0.5 : 1 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '14px', color: C.ink, fontWeight: 600 }}>
            {difficulty}/10
          </span>
          <span style={{ ...getDifficultyStyle(difficulty), padding: '2px 8px', borderRadius: '2px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.08em' }}>
            {getDifficultyLabel(difficulty)}
          </span>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${C.rule}` }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{ padding: '8px 16px', backgroundColor: 'transparent', color: C.muted, border: `1px solid ${C.rule}`, borderRadius: '2px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.1em', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={isSaving || !!sourceUrlError}
          style={{ padding: '8px 16px', backgroundColor: C.accent, color: '#fff', border: 'none', borderRadius: '2px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.1em', cursor: (isSaving || !!sourceUrlError) ? 'not-allowed' : 'pointer', opacity: (isSaving || !!sourceUrlError) ? 0.5 : 1 }}
        >
          {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </div>
    </form>
  );
}
