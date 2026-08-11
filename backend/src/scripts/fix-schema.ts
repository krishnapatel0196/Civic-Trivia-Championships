import '../env.js';
import { pool } from '../config/database.js';

async function fixSchema() {
  const client = await pool.connect();
  try {
    // Check existing columns on users table
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Current users columns:', cols.rows.map((r: any) => r.column_name).join(', '));

    // Add is_admin if missing
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false');
    console.log('✓ is_admin column ensured');

    // Check questions columns too
    const qcols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'questions'
      ORDER BY ordinal_position
    `);
    console.log('Current questions columns:', qcols.rows.map((r: any) => r.column_name).join(', '));

    // Add missing questions columns
    await client.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS encounter_count INTEGER NOT NULL DEFAULT 0');
    await client.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_count INTEGER NOT NULL DEFAULT 0');
    await client.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS quality_score INTEGER');
    await client.query('ALTER TABLE questions ADD COLUMN IF NOT EXISTS violation_count INTEGER');
    console.log('✓ questions columns ensured');

    // Verify final state
    const finalCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Final users columns:', finalCols.rows.map((r: any) => r.column_name).join(', '));

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema();
