import '../env.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql`
    SELECT 
      external_id,
      text,
      status,
      quality_score
    FROM civic_trivia.questions
    WHERE external_id IN ('q059', 'bli-006', 'lac-041')
    ORDER BY external_id
  `);
  
  console.log('\n=== ARCHIVED QUESTIONS DETAILS ===');
  for (const row of result.rows as any[]) {
    console.log(`\n${row.external_id}:`);
    console.log(`  Text: ${row.text.substring(0, 80)}...`);
    console.log(`  Status: ${row.status}`);
    console.log(`  Quality Score: ${row.quality_score}`);
  }
  
  process.exit(0);
}

check().catch(console.error);
