/**
 * Add targeted officeholder questions for Santa Monica, CA to close two verification gaps:
 *   Gap 1: Active count 77, need 80+ (3 below floor)
 *   Gap 2: Expiring ratio 5.2%, need 15-30% (0/7 officeholders have name-in-text coverage)
 *
 * Strategy: Insert 14 manually authored questions as ACTIVE with expiresAt set.
 * All 7 officeholders get 2 questions each. Officeholder name MUST appear in question text.
 * External IDs: smo-401 through smo-414 (400-series avoids existing smo-001..smo-3XX range).
 *
 * Usage: cd backend && npx tsx src/scripts/add-smo-officeholder-questions.ts
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions, topics } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const CITY_EXPIRES = new Date('2026-12-01T00:00:00Z');
const STATE_EXPIRES = new Date('2026-12-07T00:00:00Z');

const CITY_SOURCE = { name: 'City of Santa Monica', url: 'https://www.smgov.net' };
const STATE_SOURCE = { name: 'California Legislature', url: 'https://www.legislature.ca.gov' };

const newQuestions = [
  // ── Caroline Torosis (Mayor, expires 2026-12-01) ──────────────────────────
  {
    externalId: 'smo-401',
    text: 'Caroline Torosis holds which elected position in Santa Monica city government?',
    options: ['Mayor', 'City Attorney', 'City Clerk', 'City Manager'],
    correctAnswer: 0,
    explanation: 'Caroline Torosis serves as Mayor of Santa Monica. Unlike most California cities where mayors are directly elected, Santa Monica\'s mayor is chosen annually by the seven-member City Council from among its members.',
    difficulty: 'easy',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },
  {
    externalId: 'smo-402',
    text: 'How is Caroline Torosis selected as Santa Monica\'s mayor — by direct public vote or by City Council members?',
    options: [
      'By City Council members',
      'By direct public vote',
      'By the City Manager',
      'By a citywide runoff election',
    ],
    correctAnswer: 0,
    explanation: 'Caroline Torosis is Santa Monica\'s mayor through selection by the City Council, not a direct public vote. Santa Monica\'s council-manager government has the full council elect one of its members as mayor each year — a distinctive feature compared to most California cities.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },

  // ── Jesse Zwick (Council Member / Mayor Pro Tem, expires 2026-12-01) ──────
  {
    externalId: 'smo-403',
    text: 'Jesse Zwick serves in which dual role on the Santa Monica City Council?',
    options: [
      'City Council Member and Mayor Pro Tem',
      'City Council Member and City Attorney',
      'Mayor and City Council Member',
      'City Council Member and City Clerk',
    ],
    correctAnswer: 0,
    explanation: 'Jesse Zwick holds the dual role of City Council Member and Mayor Pro Tem on the Santa Monica City Council. The Mayor Pro Tem acts as mayor when the mayor is unavailable and is also elected annually by the council.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },
  {
    externalId: 'smo-404',
    text: 'Which Santa Monica council member currently serves as Mayor Pro Tem alongside Mayor Caroline Torosis?',
    options: ['Jesse Zwick', 'Lana Negrete', 'Ellis Raskin', 'Douglas Sloan'],
    correctAnswer: 0,
    explanation: 'Jesse Zwick serves as Mayor Pro Tem of Santa Monica, the second-ranking position on the City Council, alongside Mayor Caroline Torosis. Both positions are elected annually by the full council.',
    difficulty: 'easy',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },

  // ── Lana Negrete (Council Member, expires 2026-12-01) ─────────────────────
  {
    externalId: 'smo-405',
    text: 'Lana Negrete serves as an at-large member of which Santa Monica governing body?',
    options: ['City Council', 'Board of Education', 'Planning Commission', 'Airport Commission'],
    correctAnswer: 0,
    explanation: 'Lana Negrete serves on the Santa Monica City Council as an at-large member. Santa Monica\'s seven council members are all elected citywide — there are no geographic districts — making the council fully at-large.',
    difficulty: 'easy',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },
  {
    externalId: 'smo-406',
    text: 'Which city council includes Lana Negrete as one of its seven at-large members?',
    options: [
      'Santa Monica City Council',
      'Los Angeles City Council',
      'Malibu City Council',
      'Culver City Council',
    ],
    correctAnswer: 0,
    explanation: 'Lana Negrete is one of seven at-large members of the Santa Monica City Council. Santa Monica\'s council uses a fully at-large structure, meaning all members represent the entire city rather than individual districts.',
    difficulty: 'easy',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },

  // ── Ellis Raskin (Council Member, expires 2028-12-01) ─────────────────────
  {
    externalId: 'smo-407',
    text: 'Ellis Raskin was elected to the Santa Monica City Council for a term ending in which year?',
    options: ['2028', '2026', '2024', '2030'],
    correctAnswer: 0,
    explanation: 'Ellis Raskin was elected to the Santa Monica City Council for a term ending in December 2028. Santa Monica council members serve staggered four-year terms, and Raskin\'s term extends two years beyond most current colleagues whose terms end in 2026.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: new Date('2028-12-01T00:00:00Z'),
  },
  {
    externalId: 'smo-408',
    text: 'Which Santa Monica City Council member\'s term extends to December 2028, longer than most current colleagues?',
    options: ['Ellis Raskin', 'Jesse Zwick', 'Lana Negrete', 'Caroline Torosis'],
    correctAnswer: 0,
    explanation: 'Ellis Raskin\'s council term extends to December 2028, setting him apart from colleagues like Caroline Torosis, Jesse Zwick, and Lana Negrete whose terms end in December 2026. Santa Monica\'s staggered four-year terms create this overlap.',
    difficulty: 'hard',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: new Date('2028-12-01T00:00:00Z'),
  },

  // ── Douglas Sloan (City Attorney, expires 2026-12-01) ─────────────────────
  {
    externalId: 'smo-409',
    text: 'Douglas Sloan holds which separately elected legal position in Santa Monica?',
    options: ['City Attorney', 'City Clerk', 'City Manager', 'Public Defender'],
    correctAnswer: 0,
    explanation: 'Douglas Sloan serves as Santa Monica\'s City Attorney, a position that is separately elected by voters. Unlike most California cities where the city attorney is appointed by the council, Santa Monica\'s charter makes the city attorney an independently elected official.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },
  {
    externalId: 'smo-410',
    text: 'What distinguishes Douglas Sloan\'s position as Santa Monica City Attorney from most California cities?',
    options: [
      'It is a separately elected position, not appointed by the council',
      'It requires a two-thirds council supermajority to appoint',
      'It is a lifetime appointment confirmed by the state bar',
      'It is a jointly held position shared with Los Angeles County',
    ],
    correctAnswer: 0,
    explanation: 'Douglas Sloan\'s role as City Attorney is distinctive because Santa Monica voters directly elect the city attorney — a rare arrangement in California where most city attorneys are council appointees. This independently elected status gives the city attorney greater autonomy.',
    difficulty: 'hard',
    subcategory: 'current-officeholders',
    source: CITY_SOURCE,
    expiresAt: CITY_EXPIRES,
  },

  // ── Rick Chavez Zbur (CA Assembly AD-51, expires 2026-12-07) ──────────────
  {
    externalId: 'smo-411',
    text: 'Rick Chavez Zbur represents Santa Monica in which body of the California state legislature?',
    options: ['State Assembly', 'State Senate', 'U.S. House of Representatives', 'U.S. Senate'],
    correctAnswer: 0,
    explanation: 'Rick Chavez Zbur serves in the California State Assembly representing Assembly District 51, which includes Santa Monica. The State Assembly is the lower chamber of the California Legislature, with 80 members serving two-year terms.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: STATE_SOURCE,
    expiresAt: STATE_EXPIRES,
  },
  {
    externalId: 'smo-412',
    text: 'Which Assembly district does Rick Chavez Zbur represent, covering Santa Monica and nearby communities?',
    options: ['AD-51', 'AD-36', 'AD-62', 'AD-44'],
    correctAnswer: 0,
    explanation: 'Rick Chavez Zbur represents California\'s Assembly District 51 (AD-51), which covers Santa Monica and surrounding communities. He serves in the California State Assembly as part of the 80-member lower chamber of the California Legislature.',
    difficulty: 'hard',
    subcategory: 'current-officeholders',
    source: STATE_SOURCE,
    expiresAt: STATE_EXPIRES,
  },

  // ── Maria Elena Durazo (CA Senate SD-26, expires 2026-12-07) ─────────────
  {
    externalId: 'smo-413',
    text: 'Maria Elena Durazo represents Santa Monica in which chamber of the California Legislature?',
    options: ['State Senate', 'State Assembly', 'U.S. Senate', 'U.S. House of Representatives'],
    correctAnswer: 0,
    explanation: 'Maria Elena Durazo serves in the California State Senate, the upper chamber of the California Legislature, representing Senate District 26 which includes Santa Monica. The State Senate has 40 members serving four-year terms.',
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: STATE_SOURCE,
    expiresAt: STATE_EXPIRES,
  },
  {
    externalId: 'smo-414',
    text: 'Which state senate district, represented by Maria Elena Durazo, includes Santa Monica?',
    options: ['SD-26', 'SD-30', 'SD-18', 'SD-24'],
    correctAnswer: 0,
    explanation: 'Maria Elena Durazo represents California\'s Senate District 26 (SD-26), which includes Santa Monica. She serves in the California State Senate, the upper chamber of the California Legislature.',
    difficulty: 'hard',
    subcategory: 'current-officeholders',
    source: STATE_SOURCE,
    expiresAt: STATE_EXPIRES,
  },
];

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  Santa Monica Officeholder Question Insertion');
  console.log('='.repeat(60));

  // Get collection
  const [coll] = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.slug, 'santa-monica-ca'));

  if (!coll) {
    console.error('ERROR: Collection "santa-monica-ca" not found in database.');
    process.exit(1);
  }
  console.log(`  Collection: ${coll.name} (id: ${coll.id})`);

  // Get the city-government topic
  const [cityGovTopic] = await db
    .select({ id: topics.id, slug: topics.slug })
    .from(topics)
    .where(eq(topics.slug, 'city-government'));

  if (!cityGovTopic) {
    console.error('ERROR: Topic "city-government" not found. Available topics should include this.');
    process.exit(1);
  }
  console.log(`  Topic: ${cityGovTopic.slug} (id: ${cityGovTopic.id})`);

  // Count pre-insertion state
  const [preActiveResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(sql`${questions.externalId} LIKE 'smo-%' AND ${questions.status} = 'active'`);

  const [preExpiringResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(
      sql`${questions.externalId} LIKE 'smo-%' AND ${questions.status} = 'active' AND ${questions.expiresAt} IS NOT NULL`
    );

  const preActive = preActiveResult?.count ?? 0;
  const preExpiring = preExpiringResult?.count ?? 0;

  console.log('');
  console.log('  Pre-insertion state:');
  console.log(`    Active questions:   ${preActive}`);
  console.log(`    With expiresAt:     ${preExpiring}`);
  console.log(`    Expiring ratio:     ${preActive > 0 ? ((preExpiring / preActive) * 100).toFixed(1) : '0.0'}%`);
  console.log('');
  console.log('  Inserting questions...');

  let inserted = 0;
  let skipped = 0;

  for (const q of newQuestions) {
    // Duplicate check
    const existing = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.externalId, q.externalId));

    if (existing.length > 0) {
      console.log(`    SKIP ${q.externalId} — already exists`);
      skipped++;
      continue;
    }

    const [newQ] = await db
      .insert(questions)
      .values({
        externalId: q.externalId,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        subcategory: q.subcategory,
        source: q.source,
        expiresAt: q.expiresAt,
        status: 'active',
        topicId: cityGovTopic.id,
      })
      .returning({ id: questions.id });

    await db.insert(collectionQuestions).values({
      collectionId: coll.id,
      questionId: newQ.id,
    });

    console.log(`    OK  ${q.externalId}: ${q.text.substring(0, 65)}...`);
    inserted++;
  }

  // Count post-insertion state
  const [postActiveResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(sql`${questions.externalId} LIKE 'smo-%' AND ${questions.status} = 'active'`);

  const [postExpiringResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(
      sql`${questions.externalId} LIKE 'smo-%' AND ${questions.status} = 'active' AND ${questions.expiresAt} IS NOT NULL`
    );

  const postActive = postActiveResult?.count ?? 0;
  const postExpiring = postExpiringResult?.count ?? 0;
  const postRatio = postActive > 0 ? (postExpiring / postActive) * 100 : 0;

  console.log('');
  console.log('='.repeat(60));
  console.log('  Insertion Summary');
  console.log('='.repeat(60));
  console.log(`  Inserted:          ${inserted} questions`);
  console.log(`  Skipped (dup):     ${skipped} questions`);
  console.log('');
  console.log('  Post-insertion state:');
  console.log(`    Active questions:  ${postActive} (was ${preActive})`);
  console.log(`    With expiresAt:    ${postExpiring} (was ${preExpiring})`);
  console.log(`    Expiring ratio:    ${postRatio.toFixed(1)}% (target: 15-30%)`);
  console.log('');

  const countOk = postActive >= 80;
  const ratioOk = postRatio >= 15 && postRatio <= 30;

  console.log(`  Gap 1 (count >= 80): ${countOk ? 'CLOSED' : 'STILL OPEN'} — ${postActive} active`);
  console.log(`  Gap 2 (ratio 15-30%): ${ratioOk ? 'CLOSED' : 'STILL OPEN'} — ${postRatio.toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log('');

  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
