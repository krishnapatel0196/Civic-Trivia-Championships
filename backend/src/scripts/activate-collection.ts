/**
 * activate-collection.ts
 *
 * Parameterized CLI that replaces the hardcoded activate-collections.ts.
 * Activates a collection and its draft questions in the database.
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/activate-collection.ts --slug bloomington-in --prefix bli
 *   npx tsx src/scripts/activate-collection.ts --slug bloomington-in --prefix bli --dry-run
 *   npx tsx src/scripts/activate-collection.ts --help
 */

import 'dotenv/config';
import { db } from '../db/index.js';
import { collections, questions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

// ─── CLI argument parsing ─────────────────────────────────────────────────────

interface ParsedArgs {
  slug: string | null;
  prefix: string | null;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    slug: null,
    prefix: null,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) {
      result.slug = args[i + 1];
      i++;
    } else if (args[i] === '--prefix' && args[i + 1]) {
      result.prefix = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      result.dryRun = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      result.help = true;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Usage: npx tsx src/scripts/activate-collection.ts [options]

Required:
  --slug <slug>          Collection slug (e.g. bloomington-in)
  --prefix <prefix>      External ID prefix used for this collection's questions (e.g. bli)

Optional:
  --dry-run              Show what would happen without writing to the database
  --help, -h             Show this help message

Examples:
  npx tsx src/scripts/activate-collection.ts --slug bloomington-in --prefix bli
  npx tsx src/scripts/activate-collection.ts --slug austin-tx --prefix aut --dry-run
`);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(args: ParsedArgs): void {
  const errors: string[] = [];

  if (!args.slug || args.slug.trim() === '') {
    errors.push('--slug is required and must be non-empty');
  }

  if (!args.prefix) {
    errors.push('--prefix is required');
  } else if (!/^[a-z]{2,4}$/.test(args.prefix)) {
    errors.push(`--prefix "${args.prefix}" must match /^[a-z]{2,4}$/ (2–4 lowercase letters)`);
  }

  if (errors.length > 0) {
    console.error('Validation errors:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  validate(args);

  const slug = args.slug!;
  const prefix = args.prefix!;

  try {
    // Step 1: Verify collection exists
    const [collection] = await db
      .select({ id: collections.id, name: collections.name, isActive: collections.isActive })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);

    if (!collection) {
      console.error(`Error: No collection found with slug "${slug}".`);
      console.error('Make sure the collection has been seeded to the database first.');
      console.error('  cd backend && npx tsx src/db/seed/seed.ts');
      process.exit(1);
    }

    if (collection.isActive) {
      console.warn(`Warning: Collection "${collection.name}" (${slug}) is already active. Proceeding anyway.`);
    }

    // Step 2: Count draft questions
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`);

    const draftCount = countResult?.count ?? 0;

    if (draftCount === 0) {
      console.warn(`Warning: No draft questions found with prefix '${prefix}-*'. Nothing to activate.`);
    } else if (draftCount < 50) {
      console.warn(`Warning: Only ${draftCount} draft questions found (recommended: 50+). Proceeding anyway.`);
    } else {
      console.log(`Found ${draftCount} draft questions matching '${prefix}-*'.`);
    }

    // Step 3: Dry run — show what would happen and exit
    if (args.dryRun) {
      const activeStatus = collection.isActive ? 'active' : 'inactive';
      console.log(`
DRY RUN — no changes made.
Would activate:
  Collection: ${collection.name} (${slug}) — currently ${activeStatus}
  Questions: ${draftCount} draft questions matching '${prefix}-*'
`);
      process.exit(0);
    }

    // Step 4: Activate collection
    await db
      .update(collections)
      .set({ isActive: true, updatedAt: sql`NOW()` })
      .where(eq(collections.slug, slug));

    // Step 5: Activate questions (only if count > 0)
    let activatedCount = 0;
    if (draftCount > 0) {
      const activated = await db
        .update(questions)
        .set({ status: 'active', updatedAt: sql`NOW()` })
        .where(sql`${questions.externalId} LIKE ${prefix + '-%'} AND ${questions.status} = 'draft'`)
        .returning({ externalId: questions.externalId });

      activatedCount = activated.length;
    }

    // Step 6: Print summary
    console.log(`
Activation complete!
  Collection: ${collection.name} (${slug}) — now active
  Questions activated: ${activatedCount}
`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
