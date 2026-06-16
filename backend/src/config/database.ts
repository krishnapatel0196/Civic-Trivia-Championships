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
  // Drop idle connections after 30s so Supabase never gets the chance to terminate them
  idleTimeoutMillis: 30_000,
  // Fail fast if a connection can't be acquired — prevents indefinite hangs on cold start
  connectionTimeoutMillis: 10_000,
});

// On every new connection: set search_path and statement_timeout explicitly.
// Using SET commands here is more reliable than the `options` connection parameter,
// which Supabase's Supavisor pooler may not consistently forward on new connections.
pool.on('connect', (client) => {
  console.log('PostgreSQL connected');
  client.query("SET search_path TO trivia, public; SET statement_timeout TO '10s'")
    .catch((err: Error) => console.error('Failed to set session parameters:', err));
});

// Keep-alive: prevent Supavisor from dropping the idle connection.
// Runs every 20s — under the 30s idleTimeoutMillis — so there's always
// a warm connection ready and the first real query never pays reconnect cost.
setInterval(() => {
  pool.query('SELECT 1').catch(() => {});
}, 20_000);

pool.on('error', (err: Error & { code?: string }) => {
  // 57P01 = admin_shutdown: Supabase closed an idle connection — recoverable
  // 57014 = query_canceled: statement_timeout fired — recoverable
  // All other errors (network timeouts, infra blips) are also recoverable —
  // the pool will reconnect on the next query. Never exit: a transient Supabase
  // outage should degrade gracefully, not crash the process.
  if (err.code === '57P01' || err.code === '57014') {
    console.warn(`PostgreSQL connection event (${err.code}), pool will recover automatically.`);
  } else {
    console.error('PostgreSQL pool error (pool will attempt recovery):', err);
  }
});

export { pool };