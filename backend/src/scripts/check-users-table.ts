import { pool } from '../config/database.js';

async function checkUsersTable() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'users'
    `);
    console.log('Users table found in schemas:', result.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable().catch(console.error);
