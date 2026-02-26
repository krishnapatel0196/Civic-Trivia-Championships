// Usage:
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in --force
//   npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in --dry-run
//
// Run from backend/ directory. Requires ANTHROPIC_API_KEY and DATABASE_URL in .env.
// Generates election-specific civic trivia questions for a race and seeds to database as draft.

import 'dotenv/config';

import {
  generateElectionQuestions,
  GenerationBlockedError,
} from '../services/generation/ElectionQuestionGenerator.js';

// ─── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(): {
  raceId: number | null;
  collectionSlug: string | null;
  force: boolean;
  dryRun: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    raceId: null as number | null,
    collectionSlug: null as string | null,
    force: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--race-id' || args[i] === '--raceId') && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed)) result.raceId = parsed;
      i++;
    } else if (args[i] === '--collection' && args[i + 1]) {
      result.collectionSlug = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      result.force = true;
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
Usage: npx tsx src/scripts/generate-election-questions.ts [options]

Options:
  --race-id <N>         Election race ID (required)
  --collection <slug>   Collection slug to link questions to (required)
                        e.g., bloomington-in, los-angeles-ca, fremont-ca
  --force               Archive existing questions and regenerate
  --dry-run             Generate and print questions but do not insert to DB
  --help, -h            Show this help message

Examples:
  npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in
  npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in --force
  npx tsx src/scripts/generate-election-questions.ts --race-id 1 --collection bloomington-in --dry-run

Notes:
  - Questions are seeded as status='draft'. Activate via the admin panel.
  - Use --force to archive existing questions and regenerate for a race.
  - Requires ANTHROPIC_API_KEY and DATABASE_URL in backend/.env
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.raceId) {
    console.error('Error: --race-id is required');
    printHelp();
    process.exit(1);
  }

  if (!args.collectionSlug) {
    console.error('Error: --collection is required');
    printHelp();
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('Add ANTHROPIC_API_KEY=sk-... to backend/.env');
    process.exit(1);
  }

  console.log(`\nElection Question Generator`);
  console.log(`===========================`);
  console.log(`Race ID:    ${args.raceId}`);
  console.log(`Collection: ${args.collectionSlug}`);
  console.log(`Force:      ${args.force}`);
  console.log(`Dry run:    ${args.dryRun}`);

  const result = await generateElectionQuestions(args.raceId, args.collectionSlug, {
    force: args.force,
    dryRun: args.dryRun,
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Generation Complete`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Questions created: ${result.questionsCreated}`);
  if (result.archived > 0) {
    console.log(`Questions archived: ${result.archived}`);
  }
  console.log(`Jurisdiction: ${result.jurisdiction}`);

  if (!args.dryRun) {
    console.log(`\nQuestions are in 'draft' status — review and activate via admin panel.`);
    console.log(`View in admin: /admin/questions?collection=${result.collectionSlug}&status=draft`);
  } else {
    console.log(`\n[DRY RUN] No questions were written to database.`);
  }

  process.exit(0);
}

main().catch((error) => {
  if (error instanceof GenerationBlockedError) {
    console.error(`\nGeneration blocked: ${error.message}`);
    console.error(`\nExisting questions: ${error.existingCount}`);
    if (error.generatedAt) {
      console.error(`Generated at: ${new Date(error.generatedAt).toLocaleString()}`);
    }
    console.error(`\nUse --force to archive existing questions and regenerate.`);
    process.exit(1);
  }

  console.error('\nFatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
