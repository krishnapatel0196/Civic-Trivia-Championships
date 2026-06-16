#!/usr/bin/env tsx
import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { pool } from '../config/database.js';

async function fix() {
  try {
    console.log('=== Fix Federal Collection Links ===\n');
    console.log('Database:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    // Check current state
    const before = await db.execute(sql`
      SELECT COUNT(*) as count FROM civic_trivia.collection_questions cq
      JOIN civic_trivia.collections c ON cq.collection_id = c.id
      WHERE c.slug = 'federal'
    `);
    console.log('\nFederal collection_questions before:', (before.rows[0] as any).count);

    // Show what will be removed
    const nonFederal = await db.execute(sql`
      SELECT q.external_id, q.text
      FROM civic_trivia.collection_questions cq
      JOIN civic_trivia.collections c ON cq.collection_id = c.id
      JOIN civic_trivia.questions q ON cq.question_id = q.id
      WHERE c.slug = 'federal' AND q.external_id NOT LIKE 'q%'
      LIMIT 10
    `);
    console.log(`\nSample non-federal questions in Federal collection (${nonFederal.rows.length} shown):`);
    for (const row of nonFederal.rows) {
      const r = row as any;
      console.log(`  ${r.external_id}: ${r.text?.substring(0, 80)}...`);
    }

    // Delete non-federal questions linked to Federal collection
    const deleted = await db.execute(sql`
      DELETE FROM civic_trivia.collection_questions
      WHERE collection_id = (SELECT id FROM civic_trivia.collections WHERE slug = 'federal')
      AND question_id IN (
        SELECT q.id FROM civic_trivia.questions q
        WHERE q.external_id NOT LIKE 'q%'
      )
    `);
    console.log('\nDeleted non-federal links:', deleted.rowCount);

    // Verify
    const after = await db.execute(sql`
      SELECT COUNT(*) as count FROM civic_trivia.collection_questions cq
      JOIN civic_trivia.collections c ON cq.collection_id = c.id
      WHERE c.slug = 'federal'
    `);
    console.log('Federal collection_questions after:', (after.rows[0] as any).count);

    console.log('\n✓ Done!');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fix();
