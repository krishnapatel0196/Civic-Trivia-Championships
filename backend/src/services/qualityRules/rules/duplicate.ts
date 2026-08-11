/**
 * Duplicate Detection Rule
 *
 * Detects questions with identical or near-identical text within a collection.
 * Works as both:
 * - A batch validator (scan existing data files for duplicates)
 * - A guard during question generation (check new questions against existing ones)
 *
 * Normalization: lowercase, collapse whitespace, strip trailing punctuation.
 * This catches "How is the Fremont mayor selected?" vs "How is the Fremont Mayor selected?"
 */

import type { RuleResult, Violation } from '../types.js';

/**
 * Normalize question text for comparison.
 * - Lowercase
 * - Collapse multiple spaces/tabs to single space
 * - Trim
 * - Strip trailing question mark (some dups differ only by punctuation)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\?$/, '');
}

/**
 * Holds a set of known question texts and checks new questions against them.
 * Use one instance per collection to detect duplicates within that collection.
 */
export class DuplicateDetector {
  private seen = new Map<string, { externalId: string; text: string }>();

  /**
   * Load existing questions into the detector.
   * Call this before checking new questions.
   */
  loadExisting(questions: Array<{ externalId: string; text: string }>): void {
    for (const q of questions) {
      const key = normalizeText(q.text);
      // Keep the first occurrence (the one we'll keep)
      if (!this.seen.has(key)) {
        this.seen.set(key, { externalId: q.externalId, text: q.text });
      }
    }
  }

  /**
   * Check a question for duplicates. Returns a blocking violation if the
   * normalized text matches an existing question with a different externalId.
   */
  check(question: { externalId: string; text: string }): RuleResult {
    const violations: Violation[] = [];
    const key = normalizeText(question.text);
    const existing = this.seen.get(key);

    if (existing && existing.externalId !== question.externalId) {
      violations.push({
        rule: 'duplicate-text',
        severity: 'blocking',
        message: `Duplicate question text (matches ${existing.externalId})`,
        evidence: `"${question.text}" duplicates "${existing.text}"`,
      });
    }

    return { passed: violations.length === 0, violations };
  }

  /**
   * Add a question to the detector (after it passes validation).
   * Call this after a new question is accepted to prevent future duplicates.
   */
  add(question: { externalId: string; text: string }): void {
    const key = normalizeText(question.text);
    if (!this.seen.has(key)) {
      this.seen.set(key, { externalId: question.externalId, text: question.text });
    }
  }

  /** Number of unique question texts tracked */
  get size(): number {
    return this.seen.size;
  }
}

/**
 * Scan a full list of questions and return all duplicate groups.
 * Useful for auditing an entire data file at once.
 *
 * Returns an array of duplicate groups, where each group contains
 * all questions sharing the same normalized text.
 */
export function findDuplicateGroups(
  questions: Array<{ externalId: string; text: string; correctAnswer: number; options: string[] }>
): Array<{
  normalizedText: string;
  questions: Array<{ externalId: string; text: string; correctAnswer: string }>;
  hasConflict: boolean;
}> {
  const groups = new Map<string, Array<{ externalId: string; text: string; correctAnswer: number; options: string[] }>>();

  for (const q of questions) {
    const key = normalizeText(q.text);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(q);
  }

  // Return only groups with more than one question (actual duplicates)
  const duplicates: Array<{
    normalizedText: string;
    questions: Array<{ externalId: string; text: string; correctAnswer: string }>;
    hasConflict: boolean;
  }> = [];

  for (const [normalizedText, group] of groups) {
    if (group.length > 1) {
      const answers = group.map(q => q.options[q.correctAnswer]);
      const uniqueAnswers = new Set(answers.map(a => a?.toLowerCase().trim()));
      const hasConflict = uniqueAnswers.size > 1;

      duplicates.push({
        normalizedText,
        questions: group.map(q => ({
          externalId: q.externalId,
          text: q.text,
          correctAnswer: q.options[q.correctAnswer] || `index ${q.correctAnswer}`,
        })),
        hasConflict,
      });
    }
  }

  return duplicates;
}
