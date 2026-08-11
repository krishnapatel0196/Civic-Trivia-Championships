/**
 * verify-post-activation.ts
 *
 * Post-activation API verification script. Queries the live collections API
 * and validates that specified collections appear with >= 50 active questions.
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/verify-post-activation.ts --slugs fremont-ca,norwich-uk
 *   npx tsx src/scripts/verify-post-activation.ts --slugs fremont-ca,norwich-uk --api-url https://civic-trivia-backend.onrender.com
 *
 * Exit codes:
 *   0 — All slugs pass (present in API with questionCount >= 50)
 *   1 — One or more slugs fail, or request error
 */

import 'dotenv/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CollectionApiItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  themeColor: string;
  tier: string;
  sortOrder: number;
  questionCount: number;
}

interface CollectionsApiResponse {
  collections: CollectionApiItem[];
}

// ─── CLI argument parsing ─────────────────────────────────────────────────────

interface ParsedArgs {
  slugs: string[];
  apiUrl: string;
  help: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const defaultApiUrl = process.env['API_BASE_URL'] || 'http://localhost:3001';
  const result: ParsedArgs = {
    slugs: [],
    apiUrl: defaultApiUrl,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slugs' && args[i + 1]) {
      result.slugs = args[i + 1].split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (args[i] === '--api-url' && args[i + 1]) {
      result.apiUrl = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      result.help = true;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Usage: npx tsx src/scripts/verify-post-activation.ts [options]

Required:
  --slugs <slug1,slug2,...>   Comma-separated collection slugs to verify

Optional:
  --api-url <url>             Backend API base URL (default: API_BASE_URL env or http://localhost:3001)
  --help, -h                  Show this help message

Exit codes:
  0 — All slugs pass (present in API response with questionCount >= 50)
  1 — One or more slugs fail, or request error

Examples:
  npx tsx src/scripts/verify-post-activation.ts --slugs fremont-ca,norwich-uk
  npx tsx src/scripts/verify-post-activation.ts --slugs fremont-ca,norwich-uk --api-url https://civic-trivia-backend.onrender.com
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.slugs.length === 0) {
    console.error('Error: --slugs is required (comma-separated collection slugs)');
    process.exit(1);
  }

  const endpoint = `${args.apiUrl}/api/game/collections`;

  console.log('');
  console.log('='.repeat(60));
  console.log('  POST-ACTIVATION VERIFICATION');
  console.log('='.repeat(60));
  console.log(`  API endpoint:  ${endpoint}`);
  console.log(`  Checking:      ${args.slugs.join(', ')}`);
  console.log('');

  let response: Response;
  let data: CollectionsApiResponse;

  try {
    response = await fetch(endpoint);
    if (!response.ok) {
      console.error(`API request failed: HTTP ${response.status} ${response.statusText}`);
      console.error('Make sure the backend is running and the API URL is correct.');
      process.exit(1);
    }
    data = await response.json() as CollectionsApiResponse;
  } catch (error) {
    console.error('Failed to reach API:', error instanceof Error ? error.message : error);
    console.error(`Endpoint: ${endpoint}`);
    console.error('Make sure the backend is running, or pass --api-url with the production URL.');
    process.exit(1);
  }

  const allCollections = data.collections ?? [];
  const collectionsBySlug = new Map<string, CollectionApiItem>(
    allCollections.map(c => [c.slug, c])
  );

  let allPassed = true;
  const results: Array<{ slug: string; status: 'PASS' | 'FAIL'; name: string; questionCount: number; reason?: string }> = [];

  for (const slug of args.slugs) {
    const collection = collectionsBySlug.get(slug);

    if (!collection) {
      // Not in API response — means is_active=false OR questionCount < 50 (filtered out)
      allPassed = false;
      results.push({
        slug,
        status: 'FAIL',
        name: '(not found in API response)',
        questionCount: 0,
        reason: 'Collection absent from API — is_active=false or questionCount < 50',
      });
    } else if (collection.questionCount < 50) {
      // Present but below threshold (shouldn't happen given API filter, but belt-and-suspenders)
      allPassed = false;
      results.push({
        slug,
        status: 'FAIL',
        name: collection.name,
        questionCount: collection.questionCount,
        reason: `questionCount=${collection.questionCount} is below 50-question minimum`,
      });
    } else {
      results.push({
        slug,
        status: 'PASS',
        name: collection.name,
        questionCount: collection.questionCount,
      });
    }
  }

  // Print results
  for (const result of results) {
    if (result.status === 'PASS') {
      console.log(`  [PASS] ${result.name} (${result.slug})`);
      console.log(`         ${result.questionCount} active questions`);
    } else {
      console.log(`  [FAIL] ${result.slug}`);
      console.log(`         ${result.reason}`);
    }
    console.log('');
  }

  console.log('  Total collections in API: ' + allCollections.length);
  console.log('');

  if (allPassed) {
    console.log('  All success criteria met.');
    console.log('='.repeat(60));
    console.log('');
    process.exit(0);
  } else {
    console.error('  FAILURES detected. See above for details.');
    console.log('='.repeat(60));
    console.log('');
    process.exit(1);
  }
}

main();
