/**
 * One-off seed script for Climate Agreements collection.
 *
 * The CLI (run-pipeline.ts) defaults volatility to 'fast'. Climate Agreements
 * requires 'medium' volatility (expiresAt ~10 days). This script calls
 * runPipeline() programmatically with the correct option.
 *
 * Usage: cd backend && npx tsx src/scripts/international/seed-climate-agreements.ts
 * Run 2-3 times until active question count >= 15.
 */
import 'dotenv/config';
import { runPipeline } from './run-pipeline.js';

console.log('[seed-climate-agreements] Starting pipeline with volatility=medium');
await runPipeline('climate-agreements', 'clima', { volatility: 'medium' });
console.log('[seed-climate-agreements] Done.');
