import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('=== Phase 24 Sample Questions Check ===\n');

  const collRes = await pool.query("SELECT id FROM civic_trivia.collections WHERE slug = 'fremont-ca'");
  const collId = collRes.rows[0]?.id;

  if (!collId) {
    console.log('Fremont collection not found');
    await pool.end();
    return;
  }

  const sampleRes = await pool.query(`
    SELECT q.external_id, q.text, q.explanation, q.subcategory
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    ORDER BY RANDOM()
    LIMIT 10
  `, [collId]);

  console.log('Sample of 10 random active questions:\n');
  let citationCount = 0;
  for (const row of sampleRes.rows) {
    const hasCitation = row.explanation && (
      row.explanation.toLowerCase().includes('according to') ||
      row.explanation.toLowerCase().includes('per the') ||
      row.explanation.toLowerCase().includes('based on')
    );
    if (hasCitation) citationCount++;
    console.log(`${row.external_id} [${row.subcategory}] - Citation: ${hasCitation ? 'YES' : 'NO'}`);
  }
  console.log(`\nCitations: ${citationCount}/10 (${(citationCount/10*100).toFixed(0)}%)\n`);

  console.log('=== Sensitive Topic Coverage ===\n');

  const ohloneRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    AND (LOWER(q.text) LIKE '%ohlone%' OR LOWER(q.explanation) LIKE '%ohlone%')
  `, [collId]);
  console.log(`Ohlone: ${ohloneRes.rows[0].count}`);

  const afghanRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    AND (LOWER(q.text) LIKE '%afghan%' OR LOWER(q.text) LIKE '%little kabul%')
  `, [collId]);
  console.log(`Afghan-American/Little Kabul: ${afghanRes.rows[0].count}`);

  const teslaRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    AND (LOWER(q.text) LIKE '%tesla%' OR LOWER(q.text) LIKE '%nummi%')
  `, [collId]);
  console.log(`Tesla/NUMMI: ${teslaRes.rows[0].count}`);

  const missionRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    AND LOWER(q.text) LIKE '%mission san jose%'
  `, [collId]);
  console.log(`Mission San Jose: ${missionRes.rows[0].count}`);

  const consolidationRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    WHERE cq.collection_id = $1 AND q.status = 'active'
    AND (LOWER(q.text) LIKE '%1956%' OR LOWER(q.text) LIKE '%consolidat%')
  `, [collId]);
  console.log(`1956 consolidation: ${consolidationRes.rows[0].count}`);

  await pool.end();
}

main();
