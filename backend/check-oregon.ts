import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check collection_questions schema
const cols = await pool.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_schema = 'trivia' AND table_name = 'collection_questions'
  ORDER BY ordinal_position
`);
console.log('collection_questions columns:', cols.rows.map(r => r.column_name).join(', '));

await pool.end();
