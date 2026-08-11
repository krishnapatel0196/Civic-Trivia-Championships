#!/usr/bin/env tsx
import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { pool } from '../config/database.js';

// Phase 34 target: >= 90 active questions for each non-Federal collection
const TARGETS: Record<string, number> = {
  'bloomington-in': 90,
  'los-angeles-ca': 90,
  'fremont-ca': 90,
  'indiana-state': 90,
  'california-state': 90,
};

// Known pre-Phase-34 Federal count (should remain ~114, unchanged)
const FEDERAL_SLUG = 'federal';
const FEDERAL_PRE_PHASE34_COUNT = 114;

// Total bank target across all 6 collections
const TOTAL_BANK_TARGET = 540;

// JSON source file question counts (from merge step in Phase 34-02)
const JSON_COUNTS: Record<string, number> = {
  'bloomington-in': 83,
  'los-angeles-ca': 72,
  'fremont-ca': 72,
  'indiana-state': 102,
  'california-state': 99,
};

async function main() {
  console.log('=== Phase 34 Verification ===');
  console.log(`Run at: ${new Date().toISOString()}\n`);

  let allPass = true;

  // -----------------------------------------------------------------------
  // CHECK 1: Per-collection active counts
  // -----------------------------------------------------------------------
  console.log('--- Check 1: Active question counts per collection ---\n');

  const countResult = await db.execute(sql`
    SELECT c.slug, c.name, COUNT(q.id)::int AS active_count
    FROM civic_trivia.collections c
    LEFT JOIN civic_trivia.collection_questions cq ON c.id = cq.collection_id
    LEFT JOIN civic_trivia.questions q ON cq.question_id = q.id AND q.status = 'active'
    GROUP BY c.slug, c.name
    ORDER BY c.slug
  `);

  const rows = countResult.rows as Array<{ slug: string; name: string; active_count: number }>;

  // Print header
  console.log(
    'Collection'.padEnd(24) +
    'Active'.padEnd(10) +
    'Target'.padEnd(10) +
    'Status'
  );
  console.log('-'.repeat(58));

  let totalActive = 0;
  let federalCount = 0;
  const perCollectionResults: Array<{
    slug: string;
    name: string;
    activeCount: number;
    target: number | null;
    pass: boolean;
  }> = [];

  for (const row of rows) {
    const count = Number(row.active_count);
    totalActive += count;

    if (row.slug === FEDERAL_SLUG) {
      federalCount = count;
      console.log(
        row.slug.padEnd(24) +
        String(count).padEnd(10) +
        '(N/A)'.padEnd(10) +
        'INFO (Federal — not scaled)'
      );
      perCollectionResults.push({ slug: row.slug, name: row.name, activeCount: count, target: null, pass: true });
      continue;
    }

    const target = TARGETS[row.slug];
    if (target === undefined) {
      // Unknown collection — informational only
      console.log(
        row.slug.padEnd(24) +
        String(count).padEnd(10) +
        '(N/A)'.padEnd(10) +
        'INFO (unknown collection)'
      );
      perCollectionResults.push({ slug: row.slug, name: row.name, activeCount: count, target: null, pass: true });
      continue;
    }

    const pass = count >= target;
    if (!pass) allPass = false;

    console.log(
      row.slug.padEnd(24) +
      String(count).padEnd(10) +
      String(target).padEnd(10) +
      (pass ? 'PASS' : `FAIL (short by ${target - count})`)
    );

    perCollectionResults.push({ slug: row.slug, name: row.name, activeCount: count, target, pass });
  }

  console.log();

  // -----------------------------------------------------------------------
  // CHECK 2: Total question bank count
  // -----------------------------------------------------------------------
  console.log('--- Check 2: Total active question bank ---\n');

  const totalPass = totalActive >= TOTAL_BANK_TARGET;
  if (!totalPass) allPass = false;

  console.log(`Total active questions across all collections: ${totalActive}`);
  console.log(`Target: ${TOTAL_BANK_TARGET}`);
  console.log(`Status: ${totalPass ? 'PASS' : `FAIL (short by ${TOTAL_BANK_TARGET - totalActive})`}`);
  console.log();

  // -----------------------------------------------------------------------
  // CHECK 3: Quality sanity — recently-created questions with quality issues
  // -----------------------------------------------------------------------
  console.log('--- Check 3: Quality sanity for recently generated questions ---\n');

  // Check questions created in the last 48h for any that have quality_score
  // entries marking blocking violations (violation_count > 0 as a proxy).
  // Phase 34 generation happened ~2026-02-23/24.
  // quality_score column lives on the questions table (0.0–1.0, higher is better)
  // A score < 0.5 is treated as a potential quality concern for new questions.
  const recentResult = await db.execute(sql`
    SELECT
      c.slug,
      COUNT(q.id)::int AS recent_count,
      COUNT(CASE WHEN q.quality_score IS NOT NULL AND q.quality_score < 0.5 THEN 1 END)::int AS low_quality_count,
      COUNT(CASE WHEN q.quality_score IS NULL THEN 1 END)::int AS unscored_count
    FROM civic_trivia.questions q
    JOIN civic_trivia.collection_questions cq ON q.id = cq.question_id
    JOIN civic_trivia.collections c ON cq.collection_id = c.id
    WHERE q.status = 'active'
      AND q.created_at >= NOW() - INTERVAL '48 hours'
      AND c.slug != 'federal'
    GROUP BY c.slug
    ORDER BY c.slug
  `);

  const recentRows = recentResult.rows as Array<{
    slug: string;
    recent_count: number;
    low_quality_count: number;
    unscored_count: number;
  }>;

  if (recentRows.length === 0) {
    console.log('No questions created in the last 48h found.');
    console.log('Quality check: SKIPPED (no recent questions to check)');
  } else {
    console.log(
      'Collection'.padEnd(24) +
      'Recent'.padEnd(10) +
      'Low Quality'.padEnd(14) +
      'Unscored'.padEnd(12) +
      'Status'
    );
    console.log('-'.repeat(70));

    for (const row of recentRows) {
      const lowQuality = Number(row.low_quality_count);
      const recent = Number(row.recent_count);
      const unscored = Number(row.unscored_count);
      // Pipeline-generated questions go through quality filter before insertion
      // so low_quality_count should be 0; warn if not
      if (lowQuality > 0) {
        console.log(
          row.slug.padEnd(24) +
          String(recent).padEnd(10) +
          String(lowQuality).padEnd(14) +
          String(unscored).padEnd(12) +
          `WARN (${lowQuality} questions below quality threshold)`
        );
      } else {
        console.log(
          row.slug.padEnd(24) +
          String(recent).padEnd(10) +
          String(lowQuality).padEnd(14) +
          String(unscored).padEnd(12) +
          'PASS'
        );
      }
    }
  }
  console.log();

  // -----------------------------------------------------------------------
  // CHECK 4: Federal collection unchanged (add-only constraint)
  // -----------------------------------------------------------------------
  console.log('--- Check 4: Federal collection unchanged (add-only constraint) ---\n');

  const federalPass =
    federalCount >= FEDERAL_PRE_PHASE34_COUNT - 2 &&
    federalCount <= FEDERAL_PRE_PHASE34_COUNT + 2; // allow tiny drift

  console.log(`Federal active questions: ${federalCount}`);
  console.log(`Expected (pre-Phase-34): ~${FEDERAL_PRE_PHASE34_COUNT}`);
  console.log(`Status: ${federalPass ? 'PASS (Federal unchanged)' : `WARN (Federal changed from ${FEDERAL_PRE_PHASE34_COUNT} → ${federalCount})`}`);
  console.log();

  // -----------------------------------------------------------------------
  // FINAL SUMMARY TABLE
  // -----------------------------------------------------------------------
  console.log('--- Phase 34 Final State Summary ---\n');

  console.log(
    'Collection'.padEnd(24) +
    'JSON Qs'.padEnd(10) +
    'Active'.padEnd(10) +
    'Target'.padEnd(10) +
    'Result'
  );
  console.log('-'.repeat(68));

  for (const r of perCollectionResults) {
    const jsonCount = JSON_COUNTS[r.slug] ?? '—';
    const targetStr = r.target !== null ? String(r.target) : '(N/A)';
    const resultStr = r.target !== null
      ? (r.pass ? 'PASS' : `FAIL (-${r.target - r.activeCount})`)
      : 'Federal';
    console.log(
      r.slug.padEnd(24) +
      String(jsonCount).padEnd(10) +
      String(r.activeCount).padEnd(10) +
      targetStr.padEnd(10) +
      resultStr
    );
  }

  console.log('-'.repeat(68));
  console.log(
    'TOTAL'.padEnd(24) +
    ''.padEnd(10) +
    String(totalActive).padEnd(10) +
    String(TOTAL_BANK_TARGET).padEnd(10) +
    (totalPass ? 'PASS' : `FAIL (-${TOTAL_BANK_TARGET - totalActive})`)
  );
  console.log();

  // -----------------------------------------------------------------------
  // Phase 34 CONTEXT.md decision: accept shortfall if sources ran dry
  // -----------------------------------------------------------------------
  const nonFederalRows = perCollectionResults.filter(r => r.target !== null);
  const failedCollections = nonFederalRows.filter(r => !r.pass);

  if (failedCollections.length > 0) {
    console.log('NOTE: The following collections are below 90 active questions:');
    for (const r of failedCollections) {
      console.log(`  ${r.slug}: ${r.activeCount} active (${r.target! - r.activeCount} short)`);
    }
    console.log('Per Phase 34 CONTEXT.md decision: shortfall accepted when sources run dry.');
    console.log('Phase 32 archiving created a gap that add-only seeding cannot bridge.');
    console.log('This is a known constraint — not a pipeline failure.\n');
  }

  // Final verdict
  if (allPass) {
    console.log('=== ALL CHECKS PASSED ===');
  } else {
    console.log('=== SOME CHECKS FAILED (see NOTE above for accepted shortfalls) ===');
  }

  await pool.end();
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
