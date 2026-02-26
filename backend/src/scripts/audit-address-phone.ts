/**
 * Audit Address/Phone Script
 *
 * Scans all active questions against the checkAddressPhone quality rule and
 * produces a grouped report of flagged questions by collection.
 *
 * This script is READ-ONLY — it makes no database mutations.
 * Flagged questions must be reviewed and archived manually via the admin UI.
 *
 * Usage:
 *   npm run audit-address-phone
 */

import '../env.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { checkAddressPhone } from '../services/qualityRules/rules/address-phone.js';
import type { QuestionInput } from '../services/qualityRules/types.js';

interface QuestionRow {
  id: number;
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  source: { name: string; url: string };
  collectionNames: string[];
}

interface FlaggedQuestion {
  externalId: string;
  text: string;
  collectionNames: string[];
  evidence: string;
}

/**
 * Fetch all active questions with their collection memberships
 */
async function fetchQuestions(): Promise<QuestionRow[]> {
  const result = await db.execute(sql`
    SELECT
      q.id,
      q.external_id as "externalId",
      q.text,
      q.options,
      q.correct_answer as "correctAnswer",
      q.explanation,
      q.difficulty,
      q.source,
      array_agg(c.name ORDER BY c.name) as "collectionNames"
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    JOIN civic_trivia.collections c ON cq.collection_id = c.id
    WHERE q.status = 'active'
    GROUP BY q.id, q.external_id, q.text, q.options, q.correct_answer, q.explanation, q.difficulty, q.source
    ORDER BY q.id
  `);

  return result.rows as unknown as QuestionRow[];
}

/**
 * Main execution
 */
async function main() {
  try {
    const questionRows = await fetchQuestions();
    const totalScanned = questionRows.length;

    // Scan each question with checkAddressPhone only
    const flagged: FlaggedQuestion[] = [];

    for (const row of questionRows) {
      const questionInput: QuestionInput = {
        externalId: row.externalId,
        text: row.text,
        options: row.options,
        correctAnswer: row.correctAnswer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        source: row.source,
      };

      const result = checkAddressPhone(questionInput);

      if (!result.passed) {
        // Collect all evidence strings from violations
        const evidenceParts = result.violations
          .map(v => v.evidence)
          .filter((e): e is string => !!e);

        flagged.push({
          externalId: row.externalId,
          text: row.text,
          collectionNames: row.collectionNames,
          evidence: evidenceParts.join(' | '),
        });
      }
    }

    // Group flagged questions by collection name
    const byCollection = new Map<string, FlaggedQuestion[]>();

    for (const question of flagged) {
      for (const collectionName of question.collectionNames) {
        if (!byCollection.has(collectionName)) {
          byCollection.set(collectionName, []);
        }
        byCollection.get(collectionName)!.push(question);
      }
    }

    // Print report
    console.log('\n=== ADDRESS/PHONE AUDIT REPORT ===');
    console.log(`Total active questions scanned: ${totalScanned}`);
    console.log(`Questions flagged: ${flagged.length}`);
    console.log('');

    if (flagged.length > 0) {
      console.log('--- Flagged by Collection ---\n');

      const sortedCollections = Array.from(byCollection.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      );

      for (const [collectionName, questions] of sortedCollections) {
        console.log(`${collectionName} (${questions.length} flagged)`);

        for (const q of questions) {
          const truncatedText = q.text.length > 80
            ? q.text.substring(0, 80) + '...'
            : q.text;
          console.log(`  - ${q.externalId}: "${truncatedText}" | Evidence: ${q.evidence}`);
        }

        console.log('');
      }
    } else {
      console.log('No questions flagged — no phone numbers or street addresses found in answer options.\n');
    }

    console.log('--- Summary ---');
    console.log('No auto-archival performed. Review flagged questions manually in admin UI.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\nAudit failed:', error);
    process.exit(1);
  }
}

main();
