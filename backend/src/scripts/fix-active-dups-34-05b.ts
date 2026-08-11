// One-time script to resolve additional active duplicates from Phase 34-05 second generation round.
// Duplicates identified by verify-no-active-dups.ts:
//   california-state: cal-084 vs cal-113 (signatures for citizen initiative)
//   california-state: cal-094 vs cal-114 (California became 31st state year)
//   california-state: cal-097 vs cal-115 (CA Legislature chambers)
//
// Resolution: archive the higher-numbered externalId (newly generated).

import '../env.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { pool } from '../config/database.js';

const ARCHIVE_EXTERNAL_IDS = ['cal-113', 'cal-114', 'cal-115'];

async function main() {
  console.log('=== Fix Active Duplicates Round 2 (Phase 34-05) ===\n');

  try {
    for (const externalId of ARCHIVE_EXTERNAL_IDS) {
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

      await db.execute(sql`
        UPDATE civic_trivia.questions
        SET status = 'archived', updated_at = NOW()
        WHERE external_id = ${externalId}
      `);

      console.log(`  ${externalId}: archived (was: ${row.status})`);
      console.log(`    Text: ${row.text.substring(0, 80)}`);
    }

    console.log('\nDone.');
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
