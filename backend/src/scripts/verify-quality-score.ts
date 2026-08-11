import '../env.js';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

async function verify() {
  try {
    const result = await db.execute(sql`
      SELECT quality_score FROM civic_trivia.questions LIMIT 1
    `);
    console.log('Quality score column verified:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
