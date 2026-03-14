/**
 * generate-wdc-officeholder-questions.ts
 *
 * Targeted generation pass for Washington, DC current-officeholder questions.
 * Generates ~15 questions specifically about current elected/appointed officials,
 * seeds them as draft with expiresAt pre-set, to satisfy the 15% expiring ratio.
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/generate-wdc-officeholder-questions.ts [--dry-run]
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions, topics, collectionTopics } from '../db/schema.js';
import { eq, and, like, inArray } from 'drizzle-orm';
import { DuplicateDetector } from '../services/qualityRules/rules/duplicate.js';

const DRY_RUN = process.argv.includes('--dry-run');

const client = new Anthropic();
const MODEL = 'claude-opus-4-6';

// ─── Expiration dates ─────────────────────────────────────────────────────────

const JAN2_2027 = '2027-01-02T00:00:00+00:00';
const JAN3_2027 = '2027-01-03T00:00:00+00:00';

// ─── Relaxed batch schema for small targeted pass ─────────────────────────────

const OfficeholderQuestionSchema = z.object({
  externalId: z.string().regex(/^wdc-\d{3}$/, 'externalId must match wdc-NNN'),
  text: z.string().min(10).max(300),
  options: z.array(z.string().min(1).max(200)).length(4),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().min(20).max(500).refine(v => v.includes('According to'), 'Must include "According to"'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topicCategory: z.string().min(1),
  source: z.object({ name: z.string().min(1), url: z.string().url() }),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
});

const OfficeholderBatchSchema = z.object({
  questions: z.array(OfficeholderQuestionSchema).min(10).max(20),
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert civic trivia question writer specializing in Washington, DC local government.

You will generate exactly 15 civic trivia questions specifically about CURRENT ELECTED OFFICIALS in Washington, DC.

CRITICAL ACCURACY RULES:
- DC is NOT a city or state — always call it "the District" or "Washington, DC"
- The DC Council is NOT a "city council" — it is the DC Council
- Current Mayor: Muriel Bowser (Democrat; has served since 2015; not seeking a 4th term; term ends January 2027)
- Current Council Chair: Phil Mendelson (at-large; serving since 2012; term ends January 2027)
- Current Attorney General: Brian Schwalb (elected 2022; first year 2023; term ends January 2027)
- DC's non-voting Delegate to US House: Eleanor Holmes Norton (serving since 1991; can vote in committee but NOT on floor; retiring January 2027)
- DC Council has 13 members: 1 Chair (at-large) + 4 at-large members + 8 ward members (one per ward)
- At-large council members currently include: Anita Bonds, Elissa Silverman, Robert White Jr., Christina Henderson
- All DC council members and Mayor serve 4-year terms; no term limits
- ALL DC judges are presidentially appointed and Senate-confirmed — NOT elected

QUESTION REQUIREMENTS:
- Write questions in present tense: "Who is the current...?", "Who currently serves as...?", "Who chairs the DC Council?", etc.
- Do NOT include the year in the question text (no "As of 2026..." phrases)
- Each question must be factually distinct — cover different officials and roles
- Mix easy/medium/hard difficulty
- All officeholder questions must use topicCategory: "dc-government-structure"
- Set expiresAt to the correct date:
  - Mayor Bowser questions: "2027-01-02T00:00:00+00:00"
  - Council Chair Mendelson questions: "2027-01-02T00:00:00+00:00"
  - AG Schwalb questions: "2027-01-02T00:00:00+00:00"
  - DC Delegate Norton questions: "2027-01-03T00:00:00+00:00"
  - At-large council member questions: "2027-01-02T00:00:00+00:00"
- Use externalId format wdc-4XX (e.g., wdc-401, wdc-402, ...) to avoid conflicts with existing wdc-1XX to wdc-3XX questions
- Source: use { name: "DC Council", url: "https://dccouncil.gov" } for council questions;
  { name: "Office of the Mayor", url: "https://mayor.dc.gov" } for mayor questions;
  { name: "Office of the Attorney General DC", url: "https://oag.dc.gov" } for AG questions;
  { name: "Office of Eleanor Holmes Norton", url: "https://norton.house.gov" } for delegate questions
- Explanations must start with "According to" and cite the source

FORBIDDEN:
- Questions about Congress, the President, federal agencies, national monuments — those belong in the Federal collection
- Questions calling DC a "city" or "state"
- Questions confusing the federal AG with the DC AG`;

const USER_PROMPT = `Generate exactly 15 civic trivia questions about current Washington, DC elected officials.

Cover these officials across the 15 questions:
1. Mayor Muriel Bowser (3-4 questions: who she is, how long she has served, what office she holds)
2. Council Chair Phil Mendelson (2-3 questions: who he is, his role, how long he has served)
3. AG Brian Schwalb (2 questions: who he is, his unique elected status)
4. Delegate Eleanor Holmes Norton (2-3 questions: who she is, her voting rights limitations, her tenure)
5. At-large council members — Anita Bonds, Elissa Silverman, Robert White Jr., or Christina Henderson (2-3 questions)
6. DC Council composition (1 question: how many members, structure)

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "externalId": "wdc-401",
      "text": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "According to ...",
      "difficulty": "easy",
      "topicCategory": "dc-government-structure",
      "source": { "name": "...", "url": "..." },
      "expiresAt": "2027-01-02T00:00:00+00:00"
    },
    ...
  ]
}`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no changes will be written\n' : '✏️  LIVE RUN — seeding to database\n');

  // ── Generate questions ──
  console.log('Calling Claude for officeholder questions...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: USER_PROMPT }],
    system: SYSTEM_PROMPT,
  });

  const raw = response.content[0];
  if (raw.type !== 'text') throw new Error('Unexpected response type from Claude');

  // Extract JSON from response
  const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  // Parse and validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Raw response:', raw.text.substring(0, 500));
    throw new Error('Failed to parse JSON from Claude response');
  }

  const validated = OfficeholderBatchSchema.safeParse(parsed);
  if (!validated.success) {
    console.error('Validation errors:', JSON.stringify(validated.error.issues, null, 2));
    console.error('Raw questions:', JSON.stringify(parsed, null, 2));
    throw new Error('Question batch failed validation');
  }

  const batch = validated.data.questions;
  console.log(`\nGenerated ${batch.length} questions:\n`);
  for (const q of batch) {
    console.log(`  ${q.externalId} [${q.difficulty}] expires:${q.expiresAt?.split('T')[0] ?? 'null'} — ${q.text.substring(0, 80)}`);
  }

  const expiringCount = batch.filter(q => q.expiresAt !== null).length;
  console.log(`\nExpiring: ${expiringCount}/${batch.length}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN complete — no database changes.');
    process.exit(0);
  }

  // ── Seed to database ──
  console.log('\nSeeding to database...');

  const [collection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, 'washington-dc'))
    .limit(1);

  if (!collection) throw new Error('washington-dc collection not found — run db:seed first');

  // Get the dc-government-structure topic ID
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.slug, 'dc-government-structure'))
    .limit(1);

  if (!topic) throw new Error('dc-government-structure topic not found — run the main generator first');

  const topicIdMap: Record<string, number> = {
    'dc-government-structure': topic.id,
  };

  // Load existing questions for duplicate detection
  const existingLinks = await db
    .select({ questionId: collectionQuestions.questionId })
    .from(collectionQuestions)
    .where(eq(collectionQuestions.collectionId, collection.id));

  const detector = new DuplicateDetector();
  if (existingLinks.length > 0) {
    const existingQs = await db
      .select({ externalId: questions.externalId, text: questions.text })
      .from(questions)
      .where(
        and(
          inArray(questions.id, existingLinks.map(l => l.questionId)),
          inArray(questions.status, ['active', 'draft'])
        )
      );
    detector.loadExisting(existingQs);
    console.log(`Loaded ${existingQs.length} existing questions for duplicate detection`);
  }

  let seeded = 0;
  let skipped = 0;

  for (const q of batch) {
    const dupResult = detector.check(q);
    if (!dupResult.passed) {
      console.warn(`  Skipped (duplicate): ${q.externalId} — ${dupResult.violations[0].message}`);
      skipped++;
      continue;
    }

    const inserted = await db
      .insert(questions)
      .values({
        externalId: q.externalId,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topicId: topicIdMap[q.topicCategory],
        subcategory: q.topicCategory,
        source: q.source,
        learningContent: null,
        expiresAt: q.expiresAt ? new Date(q.expiresAt) : null,
        status: 'draft' as const,
        expirationHistory: [],
      })
      .onConflictDoNothing()
      .returning({ id: questions.id });

    if (!inserted || inserted.length === 0) {
      console.log(`  Skipped (duplicate externalId): ${q.externalId}`);
      skipped++;
      continue;
    }

    await db.insert(collectionQuestions)
      .values({ collectionId: collection.id, questionId: inserted[0].id })
      .onConflictDoNothing();

    detector.add(q);
    console.log(`  Seeded: ${q.externalId} — ${q.text.substring(0, 70)}`);
    seeded++;
  }

  console.log(`\nDone — seeded: ${seeded}, skipped: ${skipped}`);

  // Final ratio check
  const allDraft = await db
    .select({ expiresAt: questions.expiresAt })
    .from(questions)
    .where(and(like(questions.externalId, 'wdc-%'), eq(questions.status, 'draft')));

  const withExpiry = allDraft.filter(q => q.expiresAt !== null).length;
  const ratio = ((withExpiry / allDraft.length) * 100).toFixed(1);
  console.log(`\nUpdated expiring ratio: ${withExpiry}/${allDraft.length} = ${ratio}%`);
  if (parseFloat(ratio) >= 15) {
    console.log('✓ Ratio meets 15% target');
  } else {
    console.log('⚠  Still below 15% — consider another targeted pass');
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
