// One-time script to resolve active duplicates from Phase 34-05 third generation round.
// Duplicates: cal-108 vs cal-122, cal-112 vs cal-123
// Resolution: archive the higher-numbered (newly generated) IDs.

import '../env.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { pool } from '../config/database.js';

const ARCHIVE_EXTERNAL_IDS = ['cal-122', 'cal-123'];

async function main() {
  console.log('=== Fix Active Duplicates Round 3 (Phase 34-05) ===\n');

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
