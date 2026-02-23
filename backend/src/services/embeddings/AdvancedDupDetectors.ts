/**
 * Advanced Duplicate Detectors
 *
 * Three detector classes for non-semantic duplicate patterns:
 * - AnswerLeakageDetector (DEDUP-05): Detects questions whose text contains another's correct answer
 * - SourceClusterDetector (DEDUP-06): Detects same-source questions with overlapping explanations
 * - InverseDuplicateDetector (DEDUP-07): Detects complementary pairs (Q1 gives what Q2 asks, vice versa)
 */

import type { QuestionForDedupFull, AdvancedFlag } from './types.js';

/**
 * Normalize text for comparison: lowercase, collapse whitespace, strip punctuation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count words in text
 */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Check if textA contains textB as a substring (normalized)
 */
function containsSubstring(textA: string, textB: string): boolean {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);
  return normA.includes(normB);
}

/**
 * Calculate word overlap percentage between two texts
 */
function wordOverlapPercentage(textA: string, textB: string): number {
  const wordsA = new Set(normalizeText(textA).split(/\s+/));
  const wordsB = new Set(normalizeText(textB).split(/\s+/));

  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Split text into sentences (simple: period + space)
 */
function splitSentences(text: string): string[] {
  return text
    .split('. ')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculate sentence overlap percentage
 */
function sentenceOverlapPercentage(textA: string, textB: string): number {
  const sentencesA = splitSentences(textA).map(normalizeText);
  const sentencesB = splitSentences(textB).map(normalizeText);

  if (sentencesA.length === 0 || sentencesB.length === 0) {
    return 0;
  }

  const sharedCount = sentencesA.filter(sa =>
    sentencesB.some(sb => sa === sb || sa.includes(sb) || sb.includes(sa))
  ).length;

  return sharedCount / Math.max(sentencesA.length, sentencesB.length);
}

/**
 * DEDUP-05: Answer Leakage Detector
 * Flags questions where one question's text contains another question's correct answer verbatim
 */
export class AnswerLeakageDetector {
  static detect(questions: QuestionForDedupFull[]): AdvancedFlag[] {
    const flags: AdvancedFlag[] = [];

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const qA = questions[i];
        const qB = questions[j];

        // Get correct answers
        const answerA = qA.options[qA.correctAnswer];
        const answerB = qB.options[qB.correctAnswer];

        // Skip short answers (avoid false positives on common phrases)
        if (wordCount(answerA) < 4 && wordCount(answerB) < 4) {
          continue;
        }

        // Check if qA's text contains qB's answer
        if (wordCount(answerB) >= 4 && containsSubstring(qA.text, answerB)) {
          const overlap = wordOverlapPercentage(answerB, qA.text);
          flags.push({
            type: 'answer-leakage',
            questionA: qA.externalId,
            questionB: qB.externalId,
            severity: overlap > 0.8 ? 'high' : 'medium',
            reason: `Question ${qA.externalId} text contains ${qB.externalId}'s correct answer`,
            evidence: `"${answerB}" appears in question text: "${qA.text.substring(0, 100)}..."`,
          });
        }

        // Check if qB's text contains qA's answer
        if (wordCount(answerA) >= 4 && containsSubstring(qB.text, answerA)) {
          const overlap = wordOverlapPercentage(answerA, qB.text);
          flags.push({
            type: 'answer-leakage',
            questionA: qB.externalId,
            questionB: qA.externalId,
            severity: overlap > 0.8 ? 'high' : 'medium',
            reason: `Question ${qB.externalId} text contains ${qA.externalId}'s correct answer`,
            evidence: `"${answerA}" appears in question text: "${qB.text.substring(0, 100)}..."`,
          });
        }
      }
    }

    return flags;
  }
}

/**
 * DEDUP-06: Same-Source Cluster Detector
 * Flags questions from the same source URL whose explanations reveal each other's answers
 */
export class SourceClusterDetector {
  static detect(questions: QuestionForDedupFull[]): AdvancedFlag[] {
    const flags: AdvancedFlag[] = [];

    // Group questions by source URL (normalize trailing slashes)
    const sourceGroups = new Map<string, QuestionForDedupFull[]>();
    for (const q of questions) {
      // Skip questions without a source URL
      if (!q.source?.url) {
        continue;
      }
      const normalizedUrl = q.source.url.replace(/\/+$/, '');
      if (!sourceGroups.has(normalizedUrl)) {
        sourceGroups.set(normalizedUrl, []);
      }
      sourceGroups.get(normalizedUrl)!.push(q);
    }

    // Check each group with 2+ questions
    for (const [sourceUrl, groupQuestions] of sourceGroups) {
      if (groupQuestions.length < 2) {
        continue;
      }

      // Check each pair in the group
      for (let i = 0; i < groupQuestions.length; i++) {
        for (let j = i + 1; j < groupQuestions.length; j++) {
          const qA = groupQuestions[i];
          const qB = groupQuestions[j];

          // Check if qA's explanation contains qB's answer
          const answerA = qA.options[qA.correctAnswer];
          const answerB = qB.options[qB.correctAnswer];

          const explainAContainsBAnswer = containsSubstring(qA.explanation, answerB);
          const explainBContainsAAnswer = containsSubstring(qB.explanation, answerA);

          if (explainAContainsBAnswer || explainBContainsAAnswer) {
            const evidence = explainAContainsBAnswer
              ? `${qA.externalId}'s explanation contains "${answerB}"`
              : `${qB.externalId}'s explanation contains "${answerA}"`;

            flags.push({
              type: 'same-source-cluster',
              questionA: qA.externalId,
              questionB: qB.externalId,
              severity: 'high',
              reason: `Questions from same source (${sourceUrl}) have cross-contaminating explanations`,
              evidence,
            });
            continue; // Only flag once per pair
          }

          // Check for high explanation overlap (mined from same paragraph)
          const explanationOverlap = sentenceOverlapPercentage(
            qA.explanation,
            qB.explanation
          );

          if (explanationOverlap > 0.5) {
            const sharedSentences = splitSentences(qA.explanation)
              .filter(sa =>
                splitSentences(qB.explanation).some(sb =>
                  normalizeText(sa) === normalizeText(sb)
                )
              );

            flags.push({
              type: 'same-source-cluster',
              questionA: qA.externalId,
              questionB: qB.externalId,
              severity: 'medium',
              reason: `Questions from same source (${sourceUrl}) share >50% explanation sentences (likely mined from same paragraph)`,
              evidence: `Shared sentence: "${sharedSentences[0]?.substring(0, 100) || 'multiple'}..."`,
            });
          }
        }
      }
    }

    return flags;
  }
}

/**
 * DEDUP-07: Inverse Duplicate Detector
 * Flags complementary question pairs where one gives what the other asks, and vice versa
 */
export class InverseDuplicateDetector {
  static detect(questions: QuestionForDedupFull[]): AdvancedFlag[] {
    const flags: AdvancedFlag[] = [];

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const qA = questions[i];
        const qB = questions[j];

        const answerA = qA.options[qA.correctAnswer];
        const answerB = qB.options[qB.correctAnswer];

        // Check for inverse pattern:
        // - qA's answer appears in qB's question text
        // - qB's answer appears in qA's question text
        const aAnswerInBText = containsSubstring(qB.text, answerA);
        const bAnswerInAText = containsSubstring(qA.text, answerB);

        if (aAnswerInBText && bAnswerInAText) {
          // Calculate match quality
          const aOverlap = wordOverlapPercentage(answerA, qB.text);
          const bOverlap = wordOverlapPercentage(answerB, qA.text);
          const avgOverlap = (aOverlap + bOverlap) / 2;

          flags.push({
            type: 'inverse-duplicate',
            questionA: qA.externalId,
            questionB: qB.externalId,
            severity: avgOverlap > 0.7 ? 'high' : 'medium',
            reason: `Inverse duplicate pair: ${qA.externalId} gives what ${qB.externalId} asks, and vice versa`,
            evidence: `${qA.externalId} asks "${answerB}" / ${qB.externalId} asks "${answerA}"`,
          });
        }
      }
    }

    return flags;
  }
}

/**
 * Run all three advanced detectors and combine results
 */
export function runAllAdvancedDetectors(questions: QuestionForDedupFull[]): AdvancedFlag[] {
  return [
    ...AnswerLeakageDetector.detect(questions),
    ...SourceClusterDetector.detect(questions),
    ...InverseDuplicateDetector.detect(questions),
  ];
}
