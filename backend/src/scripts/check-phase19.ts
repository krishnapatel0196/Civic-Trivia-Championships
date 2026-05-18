import '../env.js';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function verify() {
  // Check archived questions
  const archived = await db.select().from(questions).where(eq(questions.status, 'archived'));
  console.log('\n=== ARCHIVED QUESTIONS ===');
  console.log(`Total archived: ${archived.length}`);
  console.log('IDs:', archived.map(q => q.externalId).join(', '));
  
  // Check active questions per collection
  const result = await db.execute(sql`
    SELECT 
      c.name,
      COUNT(q.id) as active_count
    FROM civic_trivia.collections c
    LEFT JOIN civic_trivia.collection_questions cq ON c.id = cq.collection_id
    LEFT JOIN civic_trivia.questions q ON cq.question_id = q.id AND q.status = 'active'
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    ORDER BY c.name
  `);
  
  console.log('\n=== ACTIVE QUESTIONS PER COLLECTION ===');
  for (const row of result.rows as any[]) {
    const status = (row.active_count as number) >= 50 ? 'VISIBLE' : 'HIDDEN';
    console.log(`${row.name}: ${row.active_count} questions (${status})`);
  }
  
  // Check quality scores
  const withScores = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions
    WHERE quality_score IS NOT NULL
  `);
  
  console.log('\n=== QUALITY SCORES ===');
  console.log(`Questions with scores: ${(withScores.rows[0] as any).count}`);
  
  process.exit(0);
}

verify().catch(console.error);
