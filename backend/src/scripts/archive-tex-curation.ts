/**
 * archive-tex-curation.ts
 *
 * Curation cleanup for Texas State (tex-) questions.
 * Archives:
 *   A. Confirmed near-duplicates
 *   B. ERCOT cluster reduction (keep 3 best, archive 9)
 *   C. City-specific landmark questions (state-only rule)
 *   D. Low-value lookup question
 *
 * Also fixes tex-023 expiresAt → NULL (historical fact, not expiring).
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/archive-tex-curation.ts --dry-run
 *   npx tsx src/scripts/archive-tex-curation.ts
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

// ── Questions to archive, grouped by reason ──────────────────────────────────

// A. Near-duplicates within the tex- set
const DUPS: Record<string, string> = {
  'tex-004': 'duplicate of tex-003 (both ask 140-day session limit)',
  'tex-029': 'duplicate of tex-003 (140-day session limit — third copy)',
  'tex-030': 'duplicate of tex-003 (140-day session limit — fourth copy)',
  'tex-033': 'duplicate of tex-011 (both ask which exec is appointed: Secretary of State)',
  'tex-036': 'duplicate of tex-013 (both ask who presides over TX Senate: Lt. Governor)',
  'tex-037': 'duplicate of tex-025 (both ask how many Railroad Commissioners: 3)',
  'tex-038': 'duplicate of tex-006 (both ask House member term length: 2 years)',
  'tex-042': 'duplicate of tex-024 (both ask which battle produced TX independence: San Jacinto)',
  'tex-043': 'duplicate of tex-017 (both ask how many years TX was a republic: 9)',
  'tex-045': 'duplicate of tex-039 (both ask significant event at Washington-on-the-Brazos 1836)',
  'tex-048': 'duplicate of tex-040 (both ask what year TX delegates declared independence)',
  'tex-056': 'duplicate of tex-062 (both ask TX Supreme Court justice term length: 6 years)',
  'tex-063': 'duplicate of tex-053/tex-058 (all ask about partisan judge elections)',
  'tex-079': 'duplicate of tex-039/tex-021 (Washington-on-the-Brazos March 1 1836 — fourth coverage)',
  'tex-087': 'duplicate of tex-018 (both ask who is current Speaker of the House)',
  'tex-096': 'duplicate of tex-021 (both ask what site is "Where Texas Became Texas")',
  'tex-032': 'duplicate of tex-015 (both ask what Texas Railroad Commission regulates today)',
};

// B. ERCOT cluster — keep tex-019, tex-082, tex-091; archive the rest
const ERCOT_ARCHIVE: Record<string, string> = {
  'tex-012': 'ERCOT cluster dedup — general "what does ERCOT manage" covered by tex-078/tex-091',
  'tex-031': 'ERCOT cluster dedup — duplicate of tex-019 (both ask 90% power load)',
  'tex-035': 'ERCOT cluster dedup — duplicate of tex-085 (both ask power generation units)',
  'tex-076': 'ERCOT cluster dedup — duplicate of tex-019 (both ask 90% electric power load)',
  'tex-078': 'ERCOT cluster dedup — general ERCOT primary responsibility covered by tex-091',
  'tex-080': 'ERCOT cluster dedup — duplicate of tex-091 (both describe ERCOT + 90% stat)',
  'tex-085': 'ERCOT cluster dedup — operations-level stat (1,460 units) not compelling civic trivia',
  'tex-089': 'ERCOT cluster dedup — "ERCOT role in electricity market" covered by tex-091',
  'tex-097': 'ERCOT cluster dedup — "ERCOT primary responsibility" covered by tex-091',
};
// Keeping: tex-019 (90% stat), tex-082 (55,000 miles transmission lines), tex-091 (TX grid uniqueness)

// C. City-specific landmark questions (state-only rule violation)
const CITY_SPECIFIC: Record<string, string> = {
  'tex-050': 'city-specific: Port Isabel Lighthouse is a regional/city site, not statewide institution',
  'tex-081': 'city-specific: Port Isabel Lighthouse (rephrased duplicate of tex-050)',
  'tex-086': 'city-specific: Presidio La Bahía is a regional site in Goliad, not statewide institution',
  'tex-088': 'city-specific: Casa Navarro is a San Antonio city-specific site',
  'tex-090': 'city-specific: French Legation is an Austin city-specific site',
  'tex-092': 'city-specific: Fulton Mansion is a Rockport/Fulton area regional site',
};

// D. Low-value lookup questions
const LOW_VALUE: Record<string, string> = {
  'tex-099': 'pure lookup: AG employee headcount is not civic education',
};

// ── Flatten all archives ──────────────────────────────────────────────────────

const ALL_ARCHIVE: Record<string, string> = {
  ...DUPS,
  ...ERCOT_ARCHIVE,
  ...CITY_SPECIFIC,
  ...LOW_VALUE,
};

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const toArchive = Object.keys(ALL_ARCHIVE);

  console.log('=== Texas State Question Curation ===\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no DB changes)' : 'LIVE'}`);
  console.log(`Questions to archive: ${toArchive.length}\n`);

  // Group by reason category for readable output
  console.log('A. Near-duplicates:');
  for (const [id, reason] of Object.entries(DUPS)) {
    console.log(`  ${id}: ${reason}`);
  }
  console.log(`\nB. ERCOT cluster (keeping tex-019, tex-082, tex-091):`);
  for (const [id, reason] of Object.entries(ERCOT_ARCHIVE)) {
    console.log(`  ${id}: ${reason}`);
  }
  console.log(`\nC. City-specific landmark violations:`);
  for (const [id, reason] of Object.entries(CITY_SPECIFIC)) {
    console.log(`  ${id}: ${reason}`);
  }
  console.log(`\nD. Low-value lookup questions:`);
  for (const [id, reason] of Object.entries(LOW_VALUE)) {
    console.log(`  ${id}: ${reason}`);
  }

  if (isDryRun) {
    console.log('\n--- DRY RUN: No changes made ---');
    console.log('\nAlso would fix: tex-023 expiresAt → NULL (historical fact)');
    process.exit(0);
  }

  // Archive questions
  console.log(`\nArchiving ${toArchive.length} questions...`);
  const result = await db
    .update(questions)
    .set({ status: 'archived' })
    .where(inArray(questions.externalId, toArchive));

  console.log(`Archived ${toArchive.length} questions.`);

  // Fix tex-023 expiresAt → NULL (historical fact, not expiring)
  console.log('\nFixing tex-023: setting expiresAt to NULL (89th Legislature convened date is a historical fact)...');
  await db
    .update(questions)
    .set({ expiresAt: null })
    .where(eq(questions.externalId, 'tex-023'));
  console.log('tex-023 expiresAt fixed.');

  // Summary
  const remaining = await db
    .select({ externalId: questions.externalId, expiresAt: questions.expiresAt })
    .from(questions)
    .where(
      eq(questions.status, 'draft')
    );
  const texRemaining = remaining.filter(q => q.externalId.startsWith('tex-'));
  const durable = texRemaining.filter(q => !q.expiresAt);
  const expiring = texRemaining.filter(q => q.expiresAt);

  console.log('\n=== Post-Curation Summary ===');
  console.log(`Draft tex- questions remaining: ${texRemaining.length}`);
  console.log(`  Durable (expiresAt: null): ${durable.length}`);
  console.log(`  Expiring (expiresAt set):  ${expiring.length}`);
  console.log('\nDone.');

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
