# Phase 28: Progressive Disclosure UI - Research

**Researched:** 2026-02-21
**Domain:** Post-game feedback collection UI (React progressive disclosure patterns, multi-item feedback forms, chip selection components, textarea with character limits, batch API updates)
**Confidence:** HIGH

## Summary

Phase 28 implements post-game flag elaboration UI using progressive disclosure patterns — players who flagged questions during gameplay are shown those flagged questions after game completion and can optionally provide reasons and free-text feedback without interrupting the game flow. The research focused on five core domains: (1) progressive disclosure UI patterns in React for deferring complex interactions, (2) multi-item feedback collection forms with per-item inputs, (3) chip/tag selection components for predefined reasons, (4) textarea character limit implementation with live counter, and (5) batch API update patterns for submitting multiple flag elaborations in a single request.

The standard approach uses accordion or list patterns to show flagged questions with expandable/collapsible detail sections, chip buttons for multi-select reason categories (Material Tailwind or custom Tailwind CSS buttons with active state), controlled textarea components with maxLength and character counter display, and a single "Submit All" button that sends an array of elaborations to a batch update endpoint. The project already uses Headless UI 2.2.9 for Dialog components, Framer Motion 12.34.0 for animations, and TailwindCSS 3.4.1 for styling.

**Primary recommendation:** Create a post-game elaboration screen that appears between game results and action buttons (Play Again/Home) when flaggedQuestions.size > 0. Use simple div-based layout (not Headless UI Disclosure for this use case) with per-question sections showing question text, multi-select chip buttons for 4 predefined reasons, optional textarea (500 char max) with live counter, and Skip/Submit buttons that call PATCH /api/feedback/flags/batch with array of { questionId, reasons[], elaborationText }.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI framework | Already in use, provides controlled component patterns for multi-input forms |
| Headless UI | 2.2.9 | Accessible UI primitives | Already in use for Dialog/Modal patterns, provides Disclosure component for progressive reveal (though simple div layout may suffice) |
| Framer Motion | 12.34.0 | Animations | Already in use throughout app, provides stagger animations for list reveals and smooth transitions |
| TailwindCSS | 3.4.1 | Styling | Already in use, provides button states, spacing, and responsive grid for chip layouts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express-validator | 7.3.1 | Request validation | Already in use, validates batch elaboration payload (array of objects with questionId, reasons, text) |
| Drizzle ORM | 0.45.1 | Database updates | Already in use, updates question_flags.reasons and elaboration_text columns (already exist per Phase 27 schema) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Batch update endpoint | Individual PATCH per question | Batch reduces network round trips (1 request vs N requests), but adds complexity to validation and transaction handling |
| Custom chip buttons | Material Tailwind Chip component | Material Tailwind adds dependency, custom Tailwind buttons with state management gives full control over multi-select behavior |
| Headless UI Disclosure | Simple div with conditional rendering | Disclosure adds ARIA roles and keyboard navigation, but simple div is sufficient for always-visible sections (not truly collapsible in this UI) |
| React Hook Form + Zod | Controlled state with useState | RHF+Zod adds validation library overhead for simple optional feedback form; manual state management is clearer for optional multi-field inputs |

**Installation:**
```bash
# No new dependencies required
# All necessary libraries already installed:
# - react@18.2.0
# - @headlessui/react@2.2.9
# - framer-motion@12.34.0
# - tailwindcss@3.4.1
# - express-validator@7.3.1
# - drizzle-orm@0.45.1
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── features/game/components/
│   ├── FeedbackElaborationScreen.tsx  # NEW: Post-game elaboration UI
│   ├── FlaggedQuestionItem.tsx       # NEW: Per-question feedback section (reason chips + textarea)
│   ├── ReasonChip.tsx                # NEW: Multi-select chip button component
│   └── ResultsScreen.tsx             # MODIFIED: Conditional render of elaboration screen before results
└── types/
    └── feedback.ts                   # MODIFIED: Add elaboration types

backend/src/
├── routes/
│   └── feedback.ts                   # MODIFIED: Add PATCH /flags/batch endpoint
└── services/
    └── feedbackService.ts            # MODIFIED: Add updateFlagElaborations function
```

### Pattern 1: Progressive Disclosure with Conditional Screen Insertion
**What:** Show elaboration screen between game end and results display when flaggedQuestions.size > 0, allowing players to skip directly to results or provide feedback first.

**When to use:** When feedback collection shouldn't interrupt core flow (gameplay) but should be collected while context is fresh (immediately after game, before results).

**Example:**
```typescript
// frontend/src/pages/Game.tsx (inside component)
const [showElaborationScreen, setShowElaborationScreen] = useState(false);
const [elaborationComplete, setElaborationComplete] = useState(false);

// After game ends, check if elaboration needed
useEffect(() => {
  if (gameState.phase === 'completed' && flaggedQuestions.size > 0 && !elaborationComplete) {
    setShowElaborationScreen(true);
  }
}, [gameState.phase, flaggedQuestions.size, elaborationComplete]);

// Render logic
if (showElaborationScreen) {
  return (
    <FeedbackElaborationScreen
      flaggedQuestions={Array.from(flaggedQuestions)}
      questions={gameState.questions}
      sessionId={gameState.sessionId}
      onSubmit={async (elaborations) => {
        await submitElaborations(elaborations);
        setElaborationComplete(true);
        setShowElaborationScreen(false);
      }}
      onSkip={() => {
        setElaborationComplete(true);
        setShowElaborationScreen(false);
      }}
    />
  );
}

if (gameState.phase === 'completed' && !showElaborationScreen) {
  return (
    <ResultsScreen
      result={gameState.result}
      questions={gameState.questions}
      onPlayAgain={handlePlayAgain}
      onHome={handleHome}
    />
  );
}
```

**Reference:** [Progressive Disclosure - Primer](https://primer.style/product/ui-patterns/progressive-disclosure/) explains deferring complex interactions to secondary screens to reduce cognitive load on primary task.

### Pattern 2: Multi-Select Chip Buttons with Toggle State
**What:** Chip buttons that toggle on/off independently, storing selected values in array state, used for predefined reason categories.

**When to use:** When user can select zero or more options from a small set (3-6 options), and selections should be visually distinct and easily reversible.

**Example:**
```typescript
// frontend/src/features/game/components/ReasonChip.tsx
interface ReasonChipProps {
  label: string;
  value: string;
  selected: boolean;
  onToggle: (value: string) => void;
}

export function ReasonChip({ label, value, selected, onToggle }: ReasonChipProps) {
  return (
    <button
      onClick={() => onToggle(value)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected
          ? 'bg-amber-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

// Usage in FlaggedQuestionItem.tsx
const REASON_OPTIONS = [
  { value: 'confusing-wording', label: 'Confusing wording' },
  { value: 'outdated-info', label: 'Outdated info' },
  { value: 'wrong-answer', label: 'Wrong answer' },
  { value: 'not-interesting', label: 'Not interesting' },
];

function FlaggedQuestionItem({ questionId, questionText, onUpdate }) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');

  const handleReasonToggle = (value: string) => {
    setSelectedReasons((prev) =>
      prev.includes(value)
        ? prev.filter((r) => r !== value)
        : [...prev, value]
    );
  };

  // Notify parent of changes (for batch submission)
  useEffect(() => {
    onUpdate(questionId, { reasons: selectedReasons, text: feedbackText });
  }, [selectedReasons, feedbackText, questionId, onUpdate]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">{questionText}</h3>

      {/* Reason chips */}
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

      {/* Optional feedback text */}
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        maxLength={500}
        placeholder="Additional feedback (optional)"
        className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        rows={3}
      />
      <div className="text-sm text-slate-400 text-right">
        {feedbackText.length} / 500
      </div>
    </div>
  );
}
```

**Reference:** [Material Tailwind Chip](https://www.material-tailwind.com/docs/react/chip) shows chip patterns for compact selectable elements, though custom implementation with Tailwind avoids external dependency.

### Pattern 3: Textarea with Character Limit and Live Counter
**What:** Controlled textarea component with maxLength HTML attribute and live character count display below input.

**When to use:** When collecting free-form text feedback with length constraints (prevents essay submissions, keeps feedback focused).

**Example:**
```typescript
// frontend/src/features/game/components/FlaggedQuestionItem.tsx
interface CharacterCountedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}

function CharacterCountedTextarea({
  value,
  onChange,
  maxLength,
  placeholder
}: CharacterCountedTextareaProps) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= 50;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        rows={3}
      />
      <div className={`text-sm text-right ${isNearLimit ? 'text-amber-400' : 'text-slate-400'}`}>
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
```

**Reference:** [React textarea character counter - createIT](https://www.createit.com/blog/character-counter-in-react/) explains controlled input with live character count using useState hook.

### Pattern 4: Batch Update API with Transaction Safety
**What:** PATCH endpoint accepts array of flag elaborations, validates all items, and updates in single database transaction (all succeed or all fail).

**When to use:** When multiple related updates should be atomic (prevent partial success scenarios) and reduce network round trips.

**Example:**
```typescript
// backend/src/routes/feedback.ts
import { body, validationResult } from 'express-validator';

/**
 * PATCH /flags/batch - Update elaborations for multiple flags
 * Body: {
 *   sessionId: string,
 *   elaborations: Array<{
 *     questionId: string,
 *     reasons: string[],
 *     elaborationText: string
 *   }>
 * }
 */
router.patch(
  '/flags/batch',
  authenticateToken,
  [
    body('sessionId').isString().notEmpty(),
    body('elaborations').isArray().notEmpty(),
    body('elaborations.*.questionId').isString().notEmpty(),
    body('elaborations.*.reasons').isArray(),
    body('elaborations.*.reasons.*').isString(),
    body('elaborations.*.elaborationText').isString().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { sessionId, elaborations } = req.body;
    const userId = req.user!.userId;

    try {
      // Update all flags in transaction
      const updated = await updateFlagElaborations(userId, sessionId, elaborations);

      res.status(200).json({
        success: true,
        updatedCount: updated,
      });
    } catch (error: any) {
      console.error('Batch elaboration update error:', error);
      res.status(500).json({ error: 'Failed to update elaborations' });
    }
  }
);

// backend/src/services/feedbackService.ts
export async function updateFlagElaborations(
  userId: number,
  sessionId: string,
  elaborations: Array<{
    questionId: string;
    reasons: string[];
    elaborationText: string;
  }>
): Promise<number> {
  return await db.transaction(async (tx) => {
    let updatedCount = 0;

    for (const { questionId: externalId, reasons, elaborationText } of elaborations) {
      // Look up question by externalId
      const [question] = await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.externalId, externalId))
        .limit(1);

      if (!question) {
        throw new Error(`Question not found: ${externalId}`);
      }

      // Update flag elaboration (user + question unique constraint guarantees single row)
      const result = await tx
        .update(questionFlags)
        .set({
          reasons: reasons.length > 0 ? reasons : null,
          elaborationText: elaborationText.trim() || null,
        })
        .where(
          and(
            eq(questionFlags.userId, userId),
            eq(questionFlags.questionId, question.id),
            eq(questionFlags.sessionId, sessionId)
          )
        );

      if (result.rowCount && result.rowCount > 0) {
        updatedCount++;
      }
    }

    return updatedCount;
  });
}
```

**Reference:** [Supporting bulk operations in REST APIs](https://www.mscharhag.com/api-design/bulk-and-batch-operations) recommends resource-specific bulk endpoints (/flags/batch) over generic batch endpoints for better validation and error handling.

### Pattern 5: Optional Form Submission with Skip Button
**What:** Provide both "Skip" and "Submit Feedback" buttons with equal visual weight, making feedback submission explicitly optional without guilt patterns.

**When to use:** When feedback is valuable but not required, and forcing submission would harm user experience or reduce completion rates.

**Example:**
```typescript
// frontend/src/features/game/components/FeedbackElaborationScreen.tsx
export function FeedbackElaborationScreen({
  flaggedQuestions,
  questions,
  sessionId,
  onSubmit,
  onSkip
}: FeedbackElaborationScreenProps) {
  const [elaborations, setElaborations] = useState<Map<string, Elaboration>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Only submit questions that have reasons or text
      const nonEmptyElaborations = Array.from(elaborations.entries())
        .filter(([_, e]) => e.reasons.length > 0 || e.text.trim())
        .map(([questionId, e]) => ({
          questionId,
          reasons: e.reasons,
          elaborationText: e.text,
        }));

      if (nonEmptyElaborations.length > 0) {
        await onSubmit(nonEmptyElaborations);
      } else {
        // No feedback provided, treat as skip
        onSkip();
      }
    } catch (error) {
      console.error('Failed to submit elaborations:', error);
      // Show error toast/message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">
          You flagged {flaggedQuestions.length} question{flaggedQuestions.length !== 1 ? 's' : ''}
        </h2>
        <p className="text-slate-400 text-center">
          Help us improve by sharing what went wrong (optional)
        </p>

        {/* Flagged questions list */}
        <div className="space-y-6">
          {flaggedQuestions.map((questionId) => {
            const question = questions.find((q) => q.id === questionId);
            return question ? (
              <FlaggedQuestionItem
                key={questionId}
                questionId={questionId}
                questionText={question.text}
                onUpdate={(id, data) => {
                  setElaborations((prev) => new Map(prev).set(id, data));
                }}
              />
            ) : null;
          })}
        </div>

        {/* Action buttons - equal visual weight */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Reference:** [User-Feedback Requests: 5 Guidelines - NN/G](https://www.nngroup.com/articles/user-feedback/) emphasizes making feedback requests optional with clear exit paths to avoid user frustration.

### Anti-Patterns to Avoid
- **Forcing feedback submission:** Don't disable Skip button or require at least one reason selection. Optional means truly optional — players can flag but provide zero elaboration.
- **Individual API calls per question:** Don't send separate PATCH requests for each elaboration. Use batch endpoint to reduce network overhead and provide atomic success/failure.
- **Disabling Submit button when empty:** Don't disable Submit if no feedback provided. Let users click Submit with empty form (treat as skip). Disabled buttons reduce perceived control.
- **Modal/popup for elaboration:** Don't show elaboration UI as modal overlay. Use full-screen takeover between game and results to avoid modal fatigue and accidental dismissal.
- **Collapsible question sections:** Don't hide question details in accordions that require clicks to expand. Show all flagged questions simultaneously (typically 1-3 per game) for quick scanning and submission.
- **Pre-populating feedback text:** Don't add placeholder suggestions like "What went wrong?". Keep placeholder generic — players should describe issues in their own words.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select chip UI | Custom checkbox styling with labels | Tailwind button classes with aria-pressed state | Checkboxes require label association and custom styling; button elements with aria-pressed provide native keyboard support and simpler state management |
| Character limit enforcement | Client-side validation + manual counter | HTML maxLength attribute + controlled textarea with .length display | maxLength prevents typing beyond limit (better UX than error message), native browser support handles edge cases |
| Batch validation | Manual array iteration with error accumulation | express-validator with wildcard selectors (body('elaborations.*.questionId')) | Validator library handles nested array validation with clear error messages, prevents injection attacks |
| Transaction rollback | Try-catch with manual rollback | Drizzle db.transaction() wrapper | Database-level transaction guarantees atomicity, automatically rolls back on error, prevents partial updates |
| Progressive disclosure animation | Custom CSS transitions with state management | Framer Motion stagger animations with initial/animate props | Framer Motion handles animation orchestration, reduced motion preference, and cleanup automatically |

**Key insight:** Multi-item form submission with per-item validation is a classic batch operation problem. Don't iterate-and-fail-on-first-error — use transaction wrappers (Drizzle's db.transaction) to ensure all-or-nothing semantics and express-validator's wildcard selectors to validate entire array structure before processing.

## Common Pitfalls

### Pitfall 1: Partial Batch Update Success
**What goes wrong:** Batch update endpoint processes elaborations sequentially without transaction, causing first N items to succeed while item N+1 fails, leaving inconsistent state (some flags elaborated, others not).

**Why it happens:** Without database transaction, each UPDATE commits immediately. Subsequent errors don't roll back prior updates.

**How to avoid:** Wrap all updates in db.transaction() block. If any update throws error, transaction rolls back all changes automatically.

**Warning signs:** Users report "some feedback saved but not all" or see partial elaborations in admin review queue when batch submission fails.

### Pitfall 2: Empty Elaborations Creating Database Clutter
**What goes wrong:** Submitting elaborations with empty reasons array and empty text string updates question_flags rows with null values, creating unnecessary database writes.

**Why it happens:** Frontend doesn't filter out empty elaborations before sending to API, or backend doesn't check for meaningful content before updating.

**How to avoid:** Filter elaborations client-side before submission (only send questions with reasons.length > 0 OR text.trim()), and treat empty submission as skip action.

**Warning signs:** Database audit shows question_flags rows with reasons=null AND elaboration_text=null but non-null updatedAt timestamps (indicating unnecessary updates).

### Pitfall 3: Character Count Exceeding Limit
**What goes wrong:** User types exactly 500 characters, then pastes additional text, bypassing maxLength restriction in some browsers or during race conditions.

**Why it happens:** maxLength attribute prevents typing beyond limit but doesn't prevent all forms of text insertion (paste, drag-drop, autocomplete may vary by browser).

**How to avoid:** Enforce limit server-side with express-validator's isLength({ max: 500 }) validator AND truncate in frontend onChange handler: onChange={(e) => setText(e.target.value.slice(0, 500))}.

**Warning signs:** Backend validation errors with "elaborationText exceeds max length" despite frontend showing 500/500 counter.

### Pitfall 4: Stale Flag Data from Earlier Session
**What goes wrong:** Player flags questions in Game A, starts Game B, returns to Game A's elaboration screen (e.g., browser back button), and submits elaborations that don't match Game A's sessionId.

**Why it happens:** sessionId verification missing from batch update endpoint, allowing elaborations for flags from different sessions to be updated incorrectly.

**How to avoid:** Backend validates elaborations.sessionId matches each flag's sessionId in database before updating. Reject entire batch if mismatch detected.

**Warning signs:** Admin review queue shows elaborations on flags that don't match the session they claim to belong to.

### Pitfall 5: Skip and Submit Buttons Have Unequal Visual Hierarchy
**What goes wrong:** Submit button styled as large primary action while Skip is small/gray/secondary, creating guilt pattern that pressures users into providing feedback.

**Why it happens:** Standard form design patterns emphasize primary action (Submit) over secondary (Skip), but this violates optional feedback principle.

**How to avoid:** Give Skip and Submit equal visual weight — same size, similar prominence (e.g., Skip in neutral gray, Submit in brand color, but both large and clear). Per NN/g guidelines: "Make feedback requests optional with clear exit paths."

**Warning signs:** User research shows high submission rate but low-quality feedback (e.g., single-word responses, unhelpful comments) indicating users felt pressured to submit.

## Code Examples

Verified patterns from official sources:

### Complete FeedbackElaborationScreen Component
```typescript
// frontend/src/features/game/components/FeedbackElaborationScreen.tsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Question } from '../../../types/game';

interface Elaboration {
  reasons: string[];
  text: string;
}

interface FeedbackElaborationScreenProps {
  flaggedQuestions: string[]; // Array of question IDs
  questions: Question[];
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
  sessionId,
  onSubmit,
  onSkip,
}: FeedbackElaborationScreenProps) {
  const [elaborations, setElaborations] = useState<Map<string, Elaboration>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleElaborationUpdate = useCallback((questionId: string, data: Elaboration) => {
    setElaborations((prev) => {
      const next = new Map(prev);
      next.set(questionId, data);
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Filter to non-empty elaborations
      const nonEmptyElaborations = Array.from(elaborations.entries())
        .filter(([_, e]) => e.reasons.length > 0 || e.text.trim().length > 0)
        .map(([questionId, e]) => ({
          questionId,
          reasons: e.reasons,
          elaborationText: e.text.trim(),
        }));

      if (nonEmptyElaborations.length > 0) {
        await onSubmit(nonEmptyElaborations);
      } else {
        // No feedback provided, treat as skip
        onSkip();
      }
    } catch (error) {
      console.error('Failed to submit elaborations:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              You flagged {flaggedQuestions.length} question{flaggedQuestions.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-slate-400">
              Help us improve by sharing what went wrong (optional)
            </p>
          </div>

          {/* Flagged questions list */}
          <div className="space-y-6">
            {flaggedQuestions.map((questionId, index) => {
              const question = questions.find((q) => q.id === questionId);
              return question ? (
                <motion.div
                  key={questionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <FlaggedQuestionItem
                    questionId={questionId}
                    questionText={question.text}
                    onUpdate={handleElaborationUpdate}
                  />
                </motion.div>
              ) : null;
            })}
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex gap-4 pt-4"
          >
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
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
```

### FlaggedQuestionItem with Chip Selection and Textarea
```typescript
// frontend/src/features/game/components/FlaggedQuestionItem.tsx
import { useState, useEffect } from 'react';
import { ReasonChip } from './ReasonChip';

const REASON_OPTIONS = [
  { value: 'confusing-wording', label: 'Confusing wording' },
  { value: 'outdated-info', label: 'Outdated info' },
  { value: 'wrong-answer', label: 'Wrong answer' },
  { value: 'not-interesting', label: 'Not interesting' },
];

interface FlaggedQuestionItemProps {
  questionId: string;
  questionText: string;
  onUpdate: (questionId: string, data: { reasons: string[]; text: string }) => void;
}

export function FlaggedQuestionItem({
  questionId,
  questionText,
  onUpdate,
}: FlaggedQuestionItemProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');

  // Notify parent of changes
  useEffect(() => {
    onUpdate(questionId, { reasons: selectedReasons, text: feedbackText });
  }, [selectedReasons, feedbackText, questionId, onUpdate]);

  const handleReasonToggle = (value: string) => {
    setSelectedReasons((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Enforce 500 char limit (defense in depth with maxLength)
    setFeedbackText(e.target.value.slice(0, 500));
  };

  const remaining = 500 - feedbackText.length;
  const isNearLimit = remaining <= 50;

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
      {/* Question text */}
      <h3 className="text-lg font-medium text-white leading-relaxed">
        {questionText}
      </h3>

      {/* Reason chips */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
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

      {/* Optional feedback text */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Additional feedback (optional)
        </label>
        <textarea
          value={feedbackText}
          onChange={handleTextChange}
          maxLength={500}
          placeholder="Share more details about the issue..."
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows={3}
        />
        <div className={`text-sm text-right mt-1 ${isNearLimit ? 'text-amber-400' : 'text-slate-400'}`}>
          {feedbackText.length} / 500
        </div>
      </div>
    </div>
  );
}
```

### ReasonChip Component
```typescript
// frontend/src/features/game/components/ReasonChip.tsx
interface ReasonChipProps {
  label: string;
  value: string;
  selected: boolean;
  onToggle: (value: string) => void;
}

export function ReasonChip({ label, value, selected, onToggle }: ReasonChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected
          ? 'bg-amber-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
      aria-pressed={selected}
      aria-label={`${selected ? 'Deselect' : 'Select'} ${label}`}
    >
      {label}
    </button>
  );
}
```

### Backend Batch Update Endpoint
```typescript
// backend/src/routes/feedback.ts (add to existing router)
router.patch(
  '/flags/batch',
  authenticateToken,
  [
    body('sessionId').isString().notEmpty(),
    body('elaborations').isArray({ min: 1 }),
    body('elaborations.*.questionId').isString().notEmpty(),
    body('elaborations.*.reasons').isArray(),
    body('elaborations.*.reasons.*').isIn([
      'confusing-wording',
      'outdated-info',
      'wrong-answer',
      'not-interesting',
    ]),
    body('elaborations.*.elaborationText').isString().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const { sessionId, elaborations } = req.body;
      const userId = req.user!.userId;

      // Update all flags in transaction
      const updated = await updateFlagElaborations(userId, sessionId, elaborations);

      res.status(200).json({
        success: true,
        updatedCount: updated,
      });
    } catch (error: any) {
      console.error('Batch elaboration update error:', error);
      res.status(500).json({ error: 'Failed to update elaborations' });
    }
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal popups for feedback | Full-screen progressive disclosure | 2020s (mobile-first design) | Reduces modal fatigue, prevents accidental dismissal, provides more space for multi-item forms |
| Individual API calls per item | Batch endpoints with transaction safety | RESTful API evolution (2018+) | Reduces network overhead, provides atomic success/failure, simplifies error handling |
| Checkbox groups for multi-select | Chip/tag buttons with toggle states | Material Design 3 (2021+) | More compact, clearer selected state, better mobile touch targets |
| Separate character counter component | Native maxLength + .length display | HTML5 + React controlled inputs | Simpler implementation, native browser support prevents over-typing, no external library needed |
| React Hook Form for all forms | useState for simple optional forms | Context-dependent (2024+) | RHF adds overhead for forms without complex validation; simple controlled inputs sufficient for optional feedback |

**Deprecated/outdated:**
- **Accordion patterns for 1-3 items:** Progressive disclosure via accordions made sense for 10+ items, but for typical 1-3 flagged questions per game, showing all items simultaneously is faster and reduces interaction cost.
- **Required feedback on flag:** Early feedback systems forced users to provide reason/explanation when flagging. Modern UX research shows optional feedback increases flagging rate and overall feedback volume.

## Open Questions

Things that couldn't be fully resolved:

1. **Should elaboration screen show question options and correct answer?**
   - What we know: Requirements say "show list of questions flagged during that session"
   - What's unclear: Does "question" mean just text, or full Q&A detail (options, correct answer, explanation)?
   - Recommendation: Show question text only, not full Q&A detail. Elaboration context is "which question bothered you" not "review the question again." Keeps UI focused and reduces cognitive load.

2. **Should reasons be required if elaborationText is provided?**
   - What we know: ELAB-03 says "optional free-text field", ELAB-04 says multi-select reasons
   - What's unclear: Can user submit text without selecting reasons, or vice versa?
   - Recommendation: Allow any combination: reasons only, text only, both, or neither. Don't enforce interdependencies — let players provide feedback in whatever format is easiest.

3. **Should elaboration screen be dismissable (X button) or only via Skip/Submit?**
   - What we know: UX best practices say "clear exit paths" for optional feedback
   - What's unclear: Is Skip button sufficient, or should there be X/close button in corner?
   - Recommendation: Skip button is sufficient. X button in corner adds visual clutter and creates redundant affordance. Skip is clear and prominent.

4. **Should frontend validate reason values match server enum?**
   - What we know: Backend validates reasons array items with isIn() validator
   - What's unclear: Should frontend have duplicate validation, or rely on backend rejection?
   - Recommendation: Frontend defines allowed reasons in const array, maps to chip buttons. This provides client-side guarantee of valid values without duplicate validation logic. Backend validation is defense-in-depth.

## Sources

### Primary (HIGH confidence)
- [Progressive Disclosure - Primer](https://primer.style/product/ui-patterns/progressive-disclosure/) - Official UI pattern documentation for deferring complex interactions
- [Headless UI Disclosure](https://headlessui.com/react/disclosure) - Official React component docs (though simple div layout may suffice for this use case)
- [Material Tailwind Chip](https://www.material-tailwind.com/docs/react/chip) - Chip component patterns for selectable elements
- [React textarea character counter - createIT](https://www.createit.com/blog/character-counter-in-react/) - Controlled textarea with live character count using useState
- [Supporting bulk operations in REST APIs](https://www.mscharhag.com/api-design/bulk-and-batch-operations) - Batch endpoint patterns for multiple updates in single request
- [User-Feedback Requests: 5 Guidelines - NN/G](https://www.nngroup.com/articles/user-feedback/) - Making feedback requests optional with clear exit paths
- Codebase patterns:
  - `frontend/src/features/game/components/ResultsScreen.tsx` - Framer Motion stagger animations, multi-section layout
  - `frontend/src/features/game/components/LearnMoreModal.tsx` - Headless UI Dialog usage
  - `backend/src/routes/feedback.ts` - Existing flag endpoints (POST /flag, DELETE /flag/:id)
  - `backend/src/db/schema.ts` - question_flags table with reasons jsonb and elaboration_text columns

### Secondary (MEDIUM confidence)
- [React multi-step form with React Hook Form and Zod - LogRocket](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) - Multi-step form patterns (though Phase 28 doesn't need RHF/Zod)
- [Form Validation with Zod - Contentful](https://www.contentful.com/blog/react-hook-form-validation-zod/) - Array validation patterns with Zod
- [How to Use the Optimistic UI Pattern - freeCodeCamp](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) - Optimistic updates with rollback (Phase 27 already implements)
- [12 Form UI/UX Design Best Practices - DesignStudio](https://www.designstudiouiux.com/blog/form-ux-design-best-practices/) - Form design patterns for 2026

### Tertiary (LOW confidence)
- Multiple WebSearch results on React forms, chip components, batch APIs - used for ecosystem discovery, specific claims verified against official docs or codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use (React 18.2.0, Headless UI 2.2.9, Framer Motion 12.34.0, TailwindCSS 3.4.1), versions verified from package.json
- Architecture: HIGH - Progressive disclosure, batch updates, and optional form patterns are well-established UX/API design patterns verified against multiple authoritative sources (NN/g, Primer, REST API design guides)
- Pitfalls: HIGH - Transaction safety, batch validation, and optional feedback patterns are documented best practices; pitfalls identified from REST API design guides and form UX research
- Code examples: HIGH - Based on existing project patterns (Framer Motion animations in ResultsScreen.tsx, Headless UI in LearnMoreModal.tsx, express-validator in feedback.ts routes)

**Research date:** 2026-02-21
**Valid until:** 2026-03-23 (30 days) - Stable technologies (React, REST APIs, UX patterns), no fast-moving frameworks
