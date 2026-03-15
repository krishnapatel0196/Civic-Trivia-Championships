import pg from 'pg';
import { setDefaultResultOrder } from 'dns';

// Force IPv4 DNS resolution — Render cannot reach Supabase's direct endpoint over IPv6
setDefaultResultOrder('ipv4first');

const { Pool } = pg;

// Create PostgreSQL connection pool from DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  // Set search path to trivia schema
  options: '-c search_path=trivia',
  // Drop idle connections after 30s so Supabase never gets the chance to terminate them
  idleTimeoutMillis: 30_000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err: Error & { code?: string }) => {
  // 57P01 = admin_shutdown: Supabase closed an idle connection — recoverable, pool will reconnect
  if (err.code === '57P01') {
    console.warn('PostgreSQL connection closed by server (57P01), pool will reconnect automatically.');
    return;
  }
  console.error('PostgreSQL pool error:', err);
  process.exit(-1);
});

export { pool };