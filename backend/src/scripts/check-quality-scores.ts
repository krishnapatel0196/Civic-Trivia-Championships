import '../env.js';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

async function check() {
  try {
    const result = await db.execute(sql`
      SELECT external_id, quality_score
      FROM civic_trivia.questions
      WHERE quality_score IS NOT NULL
      ORDER BY quality_score ASC
      LIMIT 10
    `);
    console.log('Sample quality scores (lowest 10):');
    console.log(result.rows);

    const count = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM civic_trivia.questions
      WHERE quality_score IS NOT NULL
    `);
    console.log('\nTotal questions with scores:', count.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

check();
