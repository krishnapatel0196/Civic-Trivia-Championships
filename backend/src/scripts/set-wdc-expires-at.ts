/**
 * set-wdc-expires-at.ts
 *
 * Sets expiresAt on Washington, DC current-officeholder questions.
 *
 * Targets:
 *   Mayor Muriel Bowser       → 2027-01-02
 *   Council Chair Mendelson   → 2027-01-02
 *   AG Brian Schwalb          → 2027-01-02
 *   DC Delegate / Norton      → 2027-01-03
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/set-wdc-expires-at.ts [--dry-run]
 */

import 'dotenv/config';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { and, eq, like } from 'drizzle-orm';

const DRY_RUN = process.argv.includes('--dry-run');

const MAYOR_DATE = new Date('2027-01-02T00:00:00Z');
const CHAIR_DATE = new Date('2027-01-02T00:00:00Z');
const AG_DATE    = new Date('2027-01-02T00:00:00Z');
const DELEGATE_DATE = new Date('2027-01-03T00:00:00Z');

interface TargetGroup {
  label: string;
  expiresAt: Date;
  keywords: string[];
}

const groups: TargetGroup[] = [
  {
    label: 'Mayor Bowser',
    expiresAt: MAYOR_DATE,
    keywords: ['Bowser', 'mayor of washington', 'mayor of the district', 'muriel', 'current mayor'],
  },
  {
    label: 'Council Chair Mendelson',
    expiresAt: CHAIR_DATE,
    keywords: ['Mendelson', 'council chair', 'chairman of the council', 'chair of the dc council'],
  },
  {
    label: 'AG Schwalb',
    expiresAt: AG_DATE,
    keywords: ['Schwalb', 'dc attorney general', 'attorney general of the district', 'brian schwalb'],
  },
  {
    label: 'DC Delegate / Norton',
    expiresAt: DELEGATE_DATE,
    keywords: ['Eleanor Holmes Norton', 'norton', 'dc delegate', 'non-voting delegate', 'delegate to the'],
  },
];

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no changes will be written\n' : '✏️  LIVE RUN — updating database\n');

  // Fetch all active wdc questions with no expiresAt yet
  const allWdc = await db
    .select({ id: questions.id, externalId: questions.externalId, text: questions.text, expiresAt: questions.expiresAt })
    .from(questions)
    .where(and(like(questions.externalId, 'wdc-%'), eq(questions.status, 'draft')));

  console.log(`Found ${allWdc.length} active wdc questions\n`);

  let totalUpdated = 0;

  for (const group of groups) {
    const matches = allWdc.filter(q => {
      const lower = q.text.toLowerCase();
      return group.keywords.some(kw => lower.includes(kw.toLowerCase()));
    });

    if (matches.length === 0) {
      console.log(`${group.label}: no matches found`);
      continue;
    }

    console.log(`${group.label} (${group.expiresAt.toISOString().split('T')[0]}): ${matches.length} match(es)`);
    for (const q of matches) {
      const alreadySet = q.expiresAt ? ` [already: ${q.expiresAt}]` : '';
      console.log(`  ${q.externalId}: ${q.text.substring(0, 90)}${alreadySet}`);
      if (!DRY_RUN) {
        await db.update(questions)
          .set({ expiresAt: group.expiresAt })
          .where(eq(questions.id, q.id));
      }
      totalUpdated++;
    }
    console.log();
  }

  console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'} ${totalUpdated} question(s)`);

  // Summary of expiring ratio
  const expiring = allWdc.filter(q => {
    const lower = q.text.toLowerCase();
    return groups.some(g => g.keywords.some(kw => lower.includes(kw.toLowerCase())));
  });
  const ratio = ((expiring.length / allWdc.length) * 100).toFixed(1);
  console.log(`Expiring ratio after update: ${expiring.length}/${allWdc.length} = ${ratio}%`);
  if (parseFloat(ratio) < 15) {
    console.log('⚠  Below 15% target — consider whether ward/at-large council member questions exist to boost ratio');
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
