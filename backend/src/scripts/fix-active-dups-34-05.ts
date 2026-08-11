// One-time script to resolve active duplicates introduced by Phase 34-05 generation.
// Duplicates identified by verify-no-active-dups.ts:
//   indiana-state:  ind-100 vs ind-108 (same question about amending state constitution)
//   california-state: cal-087 vs cal-104 (same question about highest court)
//   california-state: cal-097 vs cal-107 (same question about CA legislature chambers)
//
// Resolution policy: archive the higher-numbered externalId (newly generated question),
// keep the lower-numbered one (existing question already in DB before this run).
// This preserves established question IDs and avoids disrupting any user history.

import '../env.js';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { pool } from '../config/database.js';

// Newer duplicates to archive (higher external_id numbers = newly generated)
const ARCHIVE_EXTERNAL_IDS = ['ind-108', 'cal-104', 'cal-107'];

async function main() {
  console.log('=== Fix Active Duplicates (Phase 34-05) ===\n');

  try {
    for (const externalId of ARCHIVE_EXTERNAL_IDS) {
      // Find the question
      const result = await db.execute(sql`
        SELECT id, external_id, text, status
        FROM civic_trivia.questions
        WHERE external_id = ${externalId}
      `);

      const row = result.rows[0] as { id: number; external_id: string; text: string; status: string } | undefined;

      if (!row) {
        console.log(`  ${externalId}: NOT FOUND — skipping`);
        continue;
      }

      if (row.status === 'archived') {
        console.log(`  ${externalId}: already archived — skipping`);
        continue;
      }

      // Archive it
      await db.execute(sql`
        UPDATE civic_trivia.questions
        SET status = 'archived', updated_at = NOW()
        WHERE external_id = ${externalId}
      `);

      console.log(`  ${externalId}: archived (was: ${row.status})`);
      console.log(`    Text: ${row.text.substring(0, 80)}`);
    }

    console.log('\nVerifying no active duplicates remain...');

    // Quick sanity check
    const dupCheck = await db.execute(sql`
      SELECT q.text, COUNT(q.id) as cnt, string_agg(q.external_id, ', ' ORDER BY q.external_id) as ids
      FROM civic_trivia.questions q
      JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
      WHERE q.status = 'active'
      GROUP BY lower(trim(q.text))
      HAVING COUNT(q.id) > 1
    `);

    if (dupCheck.rows.length === 0) {
      console.log('No active duplicates found — CLEAN');
    } else {
      console.log(`WARNING: ${dupCheck.rows.length} duplicate group(s) still exist:`);
      for (const row of dupCheck.rows as Array<{ text: string; cnt: number; ids: string }>) {
        console.log(`  ${row.ids}: ${row.text.substring(0, 60)}`);
      }
    }

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
