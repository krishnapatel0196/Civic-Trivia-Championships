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
  // Set search path to trivia schema; 10s statement timeout prevents hung queries from
  // crashing the process via the pool error handler below
  options: '-c search_path=trivia -c statement_timeout=10000',
  // Drop idle connections after 30s so Supabase never gets the chance to terminate them
  idleTimeoutMillis: 30_000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err: Error & { code?: string }) => {
  // 57P01 = admin_shutdown: Supabase closed an idle connection — recoverable, pool will reconnect
  // 57014 = query_canceled: statement_timeout fired — recoverable, individual query throws
  if (err.code === '57P01' || err.code === '57014') {
    console.warn(`PostgreSQL connection event (${err.code}), pool will recover automatically.`);
    return;
  }
  console.error('PostgreSQL pool error:', err);
  process.exit(-1);
});

export { pool };