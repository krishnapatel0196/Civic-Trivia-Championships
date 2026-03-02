/**
 * One-time setup script: add super_admin column to admin_users and insert initial super-admin.
 *
 * Usage:
 *   npx tsx src/scripts/setup-super-admin.ts --email chris@empowered.vote
 *   npx tsx src/scripts/setup-super-admin.ts --user-id 4e6dde8f-2bd0-4054-824f-4164744165ea
 */
import '../env.js';
import { pool } from '../config/database.js';

const args = process.argv.slice(2);
const emailIdx = args.indexOf('--email');
const uuidIdx = args.indexOf('--user-id');

const targetEmail = emailIdx !== -1 ? args[emailIdx + 1] : null;
const targetUUID = uuidIdx !== -1 ? args[uuidIdx + 1] : null;

if (!targetEmail && !targetUUID) {
  console.error('Usage: npx tsx setup-super-admin.ts --email <email> OR --user-id <uuid>');
  process.exit(1);
}

async function setup() {
  const client = await pool.connect();
  try {
    // 1. Add super_admin column if not present (public schema)
    await client.query(`
      ALTER TABLE public.admin_users
      ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✓ super_admin column ensured on public.admin_users');

    // 2. Resolve UUID from email if needed
    let userId = targetUUID;
    if (!userId && targetEmail) {
      const result = await client.query(
        'SELECT id FROM auth.users WHERE email = $1 LIMIT 1',
        [targetEmail]
      );
      if (result.rows.length === 0) {
        console.error(`✗ No user found with email: ${targetEmail}`);
        process.exit(1);
      }
      userId = result.rows[0].id;
      console.log(`✓ Resolved UUID: ${userId}`);
    }

    // 3. Upsert into admin_users with super_admin = true
    await client.query(`
      INSERT INTO public.admin_users (user_id, super_admin)
      VALUES ($1, true)
      ON CONFLICT (user_id) DO UPDATE SET super_admin = true
    `, [userId]);
    console.log(`✓ User ${userId} inserted/updated as super_admin`);

    // 4. Verify
    const check = await client.query(
      'SELECT user_id, super_admin, created_at FROM public.admin_users WHERE user_id = $1',
      [userId]
    );
    console.log('Verified:', check.rows[0]);
    console.log('\nDone. You can now log into the admin panel.');
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
