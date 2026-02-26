// Usage:
//   npx tsx src/scripts/merge-generated-questions.ts --input <path-to-generated-json> --collection <slug>
//
// Merges the output of generateQuestions.ts (a generated-questions-*.json file) into the
// canonical source JSON file for a collection. Skips questions whose externalId already
// exists in the source file (idempotent — safe to run twice).
//
// Run from the backend/ directory.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Maps collection slug (as used in generateQuestions.ts) to source JSON filename
const JSON_FILE_MAP: Record<string, string> = {
  'bloomington-in': 'bloomington-in-questions.json',
  'los-angeles-ca': 'los-angeles-ca-questions.json',
  'indiana': 'indiana-state-questions.json',
  'california': 'california-state-questions.json',
  'fremont-ca': 'fremont-ca-questions.json',
  'norwich-uk': 'norwich-uk-questions.json',
};

interface Question {
  externalId: string;
  [key: string]: unknown;
}

interface CollectionData {
  topics: unknown[];
  questions: Question[];
}

interface CLIArgs {
  input: string;
  collection: string;
}

function parseArgs(): CLIArgs | null {
  const args = process.argv.slice(2);
  const result: Partial<CLIArgs> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      result.input = args[i + 1];
      i++;
    } else if (args[i] === '--collection' && args[i + 1]) {
      result.collection = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  if (!result.input || !result.collection) {
    console.error('Error: --input and --collection are required');
    console.error('');
    printUsage();
    return null;
  }

  return result as CLIArgs;
}

function printUsage() {
  console.log('Usage:');
  console.log('  npx tsx src/scripts/merge-generated-questions.ts --input <path> --collection <slug>');
  console.log('');
  console.log('Options:');
  console.log('  --input <path>        Path to the generated JSON file (output of generateQuestions.ts)');
  console.log('  --collection <slug>   Collection slug: bloomington-in, los-angeles-ca, fremont-ca, indiana, california');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx src/scripts/merge-generated-questions.ts \\');
  console.log('    --input ./generated-questions-fremont-ca-2024-01-01.json \\');
  console.log('    --collection fremont-ca');
}

function main() {
  const args = parseArgs();
  if (!args) {
    process.exit(1);
  }

  const { input, collection } = args;

  // Resolve the source JSON filename for this collection
  const sourceFileName = JSON_FILE_MAP[collection];
  if (!sourceFileName) {
    console.error(`Error: Unknown collection slug: "${collection}"`);
    console.error(`Valid slugs: ${Object.keys(JSON_FILE_MAP).join(', ')}`);
    process.exit(1);
  }

  // Resolve absolute paths
  const inputPath = resolve(process.cwd(), input);
  const sourcePath = resolve(__dirname, '..', 'data', sourceFileName);

  // Validate input file exists
  if (!existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Validate source file exists
  if (!existsSync(sourcePath)) {
    console.error(`Error: Source JSON file not found: ${sourcePath}`);
    console.error('Expected canonical data file to already exist in backend/src/data/');
    process.exit(1);
  }

  // Read generated file
  let generated: CollectionData;
  try {
    const raw = readFileSync(inputPath, 'utf-8');
    generated = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Failed to parse input file: ${inputPath}`);
    console.error(err);
    process.exit(1);
  }

  // Validate generated file structure
  if (!Array.isArray(generated.questions)) {
    console.error('Error: Generated file missing "questions" array');
    process.exit(1);
  }

  if (generated.questions.length === 0) {
    console.warn('Warning: Generated questions array is empty — nothing to merge');
    process.exit(0);
  }

  // Read source file
  let source: CollectionData;
  try {
    const raw = readFileSync(sourcePath, 'utf-8');
    source = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Failed to parse source file: ${sourcePath}`);
    console.error(err);
    process.exit(1);
  }

  if (!Array.isArray(source.questions)) {
    console.error('Error: Source file missing "questions" array');
    process.exit(1);
  }

  // Build set of existing externalIds for collision detection
  const existingIds = new Set<string>(
    source.questions.map((q) => q.externalId)
  );

  const beforeCount = source.questions.length;
  let appended = 0;
  let skipped = 0;

  for (const q of generated.questions) {
    if (!q.externalId) {
      console.warn(`Warning: Generated question missing externalId — skipping`);
      skipped++;
      continue;
    }

    if (existingIds.has(q.externalId)) {
      console.warn(`Warning: Duplicate externalId "${q.externalId}" — skipping (already in source)`);
      skipped++;
      continue;
    }

    source.questions.push(q);
    existingIds.add(q.externalId);
    appended++;
  }

  const afterCount = source.questions.length;

  // Write updated source file back (topics array is left unchanged)
  const output = JSON.stringify(source, null, 2) + '\n';
  writeFileSync(sourcePath, output, 'utf-8');

  console.log('');
  console.log('=== Merge Complete ===');
  console.log(`Collection:          ${collection} → ${sourceFileName}`);
  console.log(`Input file:          ${inputPath}`);
  console.log(`Generated questions: ${generated.questions.length}`);
  console.log(`Appended:            ${appended}`);
  console.log(`Skipped (duplicate): ${skipped}`);
  console.log(`Source before:       ${beforeCount} questions`);
  console.log(`Source after:        ${afterCount} questions`);
}

main();
