/**
 * repair-broken-links.ts - Reusable admin tool for scanning and repairing broken source URLs
 *
 * Usage:
 *   npx tsx src/scripts/repair-broken-links.ts                    # Scan and report
 *   npx tsx src/scripts/repair-broken-links.ts --apply            # Scan and repair
 *   npx tsx src/scripts/repair-broken-links.ts --batch 10         # Process 10 at a time
 *   npx tsx src/scripts/repair-broken-links.ts --apply --batch 5  # Repair in batches of 5
 */

import '../env.js';
import { db } from '../db/index.js';
import { questions } from '../db/schema.js';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { client, MODEL } from './content-generation/anthropic-client.js';
import pLimit from 'p-limit';

// CLI arguments
const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const batchSize = parseInt(args.find((arg, i) => args[i - 1] === '--batch') || '20');
const concurrency = parseInt(args.find((arg, i) => args[i - 1] === '--concurrency') || '5');

// Types
interface ValidationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
}

interface SourceSuggestion {
  url: string;
  source_name: string;
  relevance_score: number;
}

interface AIResponse {
  urls: SourceSuggestion[];
  confidence: 'high' | 'medium' | 'low';
}

interface Question {
  id: number;
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  source: {
    name: string;
    url: string;
  };
}

/**
 * Validates a URL via HTTP HEAD request with 5-second timeout.
 * Falls back to GET if HEAD returns 405 Method Not Allowed.
 */
async function validateUrl(url: string): Promise<ValidationResult> {
  try {
    // Try HEAD first
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'CivicTriviaBot/1.0 (link validation)',
      },
    });

    return {
      url,
      isValid: headResponse.ok,
      statusCode: headResponse.status,
    };
  } catch (error) {
    // If HEAD fails with 405, try GET
    if (error instanceof Error && error.message.includes('405')) {
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'CivicTriviaBot/1.0 (link validation)',
          },
        });

        return {
          url,
          isValid: getResponse.ok,
          statusCode: getResponse.status,
        };
      } catch (getError) {
        return {
          url,
          isValid: false,
          error: getError instanceof Error ? getError.message : String(getError),
        };
      }
    }

    // Handle other errors (timeout, network, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      url,
      isValid: false,
      error: errorMessage.includes('TimeoutError') ? 'Timeout (5s)' : errorMessage,
    };
  }
}

/**
 * Uses AI to find authoritative source URLs for a civic trivia question.
 * Returns validated suggestions ranked by relevance.
 */
async function findSourceUrls(questionText: string, correctAnswerText: string): Promise<AIResponse> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: 'You are a civic education content curator. Find 1-3 authoritative source URLs for the given civic trivia question. ONLY suggest URLs from .gov, .edu, or established civic education organizations (e.g., archives.gov, constitutioncenter.org, uscis.gov). Respond with valid JSON.',
      messages: [
        {
          role: 'user',
          content: `Find authoritative source URLs for this civic trivia question:

Question: ${questionText}
Correct Answer: ${correctAnswerText}

Respond with JSON in this format:
{
  "urls": [
    {
      "url": "https://example.gov/page",
      "source_name": "Official Source Name",
      "relevance_score": 9
    }
  ],
  "confidence": "high"
}

Only suggest .gov, .edu, or reputable civic education sites. Rank by relevance (1-10). Include 1-3 suggestions.`,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      return { urls: [], confidence: 'low' };
    }

    // Parse JSON (may be wrapped in markdown code blocks)
    const jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonText) as AIResponse;

    // Basic validation
    if (!Array.isArray(parsed.urls) || typeof parsed.confidence !== 'string') {
      console.warn('  AI response missing required fields');
      return { urls: [], confidence: 'low' };
    }

    return parsed;
  } catch (error) {
    console.error('  AI call failed:', error instanceof Error ? error.message : String(error));
    return { urls: [], confidence: 'low' };
  }
}

/**
 * Scans all active questions with non-null source URLs and validates them.
 * Returns questions with broken links.
 */
async function scanBrokenLinks(): Promise<Question[]> {
  console.log('\n=== Scanning for broken links ===\n');

  // Query all active questions with non-null source URLs
  const allQuestions = await db
    .select({
      id: questions.id,
      externalId: questions.externalId,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      source: questions.source,
    })
    .from(questions)
    .where(
      and(
        eq(questions.status, 'active'),
        isNotNull(questions.source),
        sql`${questions.source}->>'url' IS NOT NULL`,
        sql`${questions.source}->>'url' != ''`
      )
    );

  console.log(`Found ${allQuestions.length} active questions with source URLs`);

  // Extract URLs for validation
  const urlsToValidate = allQuestions
    .map((q) => (q.source as { url: string }).url)
    .filter((url) => url && url.length > 0);

  console.log(`Validating ${urlsToValidate.length} URLs (concurrency: ${concurrency})...\n`);

  // Batch validate with concurrency limit
  const limit = pLimit(concurrency);
  const validationResults = await Promise.all(
    urlsToValidate.map((url) => limit(() => validateUrl(url)))
  );

  // Build lookup map
  const urlStatusMap = new Map<string, ValidationResult>();
  validationResults.forEach((result) => {
    urlStatusMap.set(result.url, result);
  });

  // Filter to broken questions
  const brokenQuestions = allQuestions.filter((q) => {
    const url = (q.source as { url: string }).url;
    const result = urlStatusMap.get(url);
    return result && !result.isValid;
  });

  // Report summary
  const validCount = validationResults.filter((r) => r.isValid).length;
  const brokenCount = validationResults.length - validCount;

  console.log(`\n=== Scan Results ===`);
  console.log(`Total scanned: ${allQuestions.length}`);
  console.log(`Valid URLs: ${validCount}`);
  console.log(`Broken URLs: ${brokenCount}\n`);

  if (brokenQuestions.length > 0) {
    console.log('Sample broken URLs:');
    brokenQuestions.slice(0, 5).forEach((q) => {
      const url = (q.source as { url: string }).url;
      const result = urlStatusMap.get(url);
      console.log(`  ${q.externalId}: ${url}`);
      console.log(`    Status: ${result?.statusCode || 'N/A'} - ${result?.error || 'Failed'}`);
    });
  }

  return brokenQuestions;
}

/**
 * Repairs broken links by finding AI-suggested replacements and validating them.
 * Updates database if --apply flag is set.
 */
async function repairBrokenLinks(brokenQuestions: Question[]): Promise<void> {
  console.log(`\n=== Repairing ${brokenQuestions.length} broken links ===\n`);

  let repaired = 0;
  let nullSet = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < brokenQuestions.length; i += batchSize) {
    const batch = brokenQuestions.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)...\n`);

    for (const question of batch) {
      const correctAnswerText = question.options[question.correctAnswer];
      const oldUrl = (question.source as { url: string }).url;
      const sourceName = (question.source as { name: string }).name;

      console.log(`${question.externalId}: ${question.text.slice(0, 60)}...`);
      console.log(`  Old URL: ${oldUrl}`);

      // Get AI suggestions
      const aiResponse = await findSourceUrls(question.text, correctAnswerText);
      console.log(`  AI confidence: ${aiResponse.confidence}, suggestions: ${aiResponse.urls.length}`);

      if (aiResponse.urls.length === 0) {
        console.log(`  No suggestions from AI - setting URL to null`);
        if (shouldApply) {
          await db
            .update(questions)
            .set({
              source: { name: sourceName, url: null as any },
              updatedAt: new Date(),
            })
            .where(eq(questions.id, question.id));
        }
        nullSet++;
        continue;
      }

      // Validate all suggested URLs
      const limit = pLimit(concurrency);
      const validationResults = await Promise.all(
        aiResponse.urls.map((suggestion) =>
          limit(async () => {
            const result = await validateUrl(suggestion.url);
            return { ...suggestion, ...result };
          })
        )
      );

      // Find best valid suggestion (highest relevance score)
      const validSuggestions = validationResults.filter((r) => r.isValid);
      if (validSuggestions.length === 0) {
        console.log(`  All AI suggestions invalid - setting URL to null`);
        if (shouldApply) {
          await db
            .update(questions)
            .set({
              source: { name: sourceName, url: null as any },
              updatedAt: new Date(),
            })
            .where(eq(questions.id, question.id));
        }
        nullSet++;
        continue;
      }

      // Pick best (highest relevance)
      const best = validSuggestions.sort((a, b) => b.relevance_score - a.relevance_score)[0];
      console.log(`  New URL: ${best.url} (score: ${best.relevance_score})`);

      if (shouldApply) {
        await db
          .update(questions)
          .set({
            source: { name: best.source_name, url: best.url },
            updatedAt: new Date(),
          })
          .where(eq(questions.id, question.id));
        repaired++;
      } else {
        repaired++; // Count what would be repaired
      }

      // Rate limit: 1 second delay between AI calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n=== Repair Summary ===`);
  console.log(`Total processed: ${brokenQuestions.length}`);
  console.log(`Repaired with new URL: ${repaired}`);
  console.log(`Set to null (no valid suggestion): ${nullSet}`);
  console.log(`Failed: ${failed}`);

  if (!shouldApply) {
    console.log(`\n*** DRY RUN - No changes applied ***`);
    console.log(`Run with --apply to save changes to database\n`);
  } else {
    console.log(`\n*** Changes saved to database ***\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Link Repair Tool');
  console.log('================');
  console.log(`Mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Concurrency: ${concurrency}`);

  try {
    // Step 1: Scan for broken links
    const brokenQuestions = await scanBrokenLinks();

    if (brokenQuestions.length === 0) {
      console.log('\nNo broken links found. All source URLs are valid.\n');
      process.exit(0);
    }

    // Step 2: Repair broken links
    await repairBrokenLinks(brokenQuestions);

    process.exit(0);
  } catch (error) {
    console.error('\nError during execution:', error);
    process.exit(1);
  }
}

main();
