/**
 * Add targeted officeholder questions for Mississippi State to reach 15% expiring ratio.
 * Targets: Speaker Pro Tem (Trey Lamar) + 2 additional questions.
 * All expiresAt: 2028-01-13T00:00:00Z
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { questions, collections, collectionQuestions, topics } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const EXPIRES_AT = new Date('2028-01-13T00:00:00Z');

// Questions to add (Speaker Pro Tem + 2 more to reach 15%)
const newQuestions = [
  {
    externalId: 'mis-401',
    text: 'Who serves as Speaker Pro Tempore of the Mississippi House of Representatives?',
    options: ['Trey Lamar', 'Jason White', 'Delbert Hosemann', 'Lynn Fitch'],
    correctAnswer: 0,
    explanation: 'Trey Lamar (R-Senatobia) serves as Speaker Pro Tempore of the Mississippi House of Representatives, the second-highest position in the House, ranking below Speaker Jason White.',
    difficulty: 'hard',
    subcategory: 'current-officeholders',
    source: { name: 'Mississippi Legislature', url: 'https://en.wikipedia.org/wiki/Mississippi_Legislature' },
    expiresAt: EXPIRES_AT,
  },
  {
    externalId: 'mis-402',
    text: "What is the term length for Mississippi's Governor and other statewide elected officials?",
    options: ['4 years', '6 years', '2 years', '8 years'],
    correctAnswer: 0,
    explanation: "Mississippi's Governor, Lieutenant Governor, Attorney General, Secretary of State, Treasurer, and other statewide officials serve 4-year terms. Current officeholders elected in November 2023 took office January 2024 and serve until January 2028.",
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: { name: 'Government of Mississippi', url: 'https://en.wikipedia.org/wiki/Government_of_Mississippi' },
    expiresAt: EXPIRES_AT,
  },
  {
    externalId: 'mis-403',
    text: 'Which Mississippi official has the constitutional authority to appoint all Senate committee chairs?',
    options: ['The Lieutenant Governor', 'The Governor', 'The Senate President Pro Tem', 'The Attorney General'],
    correctAnswer: 0,
    explanation: "Mississippi's Lieutenant Governor has the constitutional authority to appoint all Senate committee chairs, a power that makes the Lt. Governor arguably the most powerful figure in state government. This dual executive-legislative role is distinctive among U.S. states. Delbert Hosemann currently serves as Lieutenant Governor.",
    difficulty: 'medium',
    subcategory: 'current-officeholders',
    source: { name: 'Government of Mississippi', url: 'https://en.wikipedia.org/wiki/Government_of_Mississippi' },
    expiresAt: EXPIRES_AT,
  },
];

async function main() {
  // Get collection
  const [coll] = await db.select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, 'mississippi-state'));
  if (!coll) { console.error('Collection not found'); process.exit(1); }

  // Get a topic ID (state-government topic for the collection)
  const allTopics = await db.select({ id: topics.id, slug: topics.slug }).from(topics);
  const govTopic = allTopics.find(t => t.slug === 'state-government') ||
                   allTopics.find(t => t.slug === 'government') ||
                   allTopics.find(t => t.slug === 'civic');
  if (!govTopic) { console.error('No suitable topic found. Available:', allTopics.map(t => t.slug).join(', ')); process.exit(1); }
  console.log('Using topic:', govTopic.slug, 'id:', govTopic.id);

  let inserted = 0;
  for (const q of newQuestions) {
    // Check if already exists
    const existing = await db.select({ id: questions.id })
      .from(questions)
      .where(eq(questions.externalId, q.externalId));
    if (existing.length > 0) {
      console.log(`Skipping ${q.externalId} — already exists`);
      continue;
    }

    const [newQ] = await db.insert(questions).values({
      externalId: q.externalId,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      subcategory: q.subcategory,
      source: q.source,
      expiresAt: q.expiresAt,
      status: 'draft',
      topicId: govTopic.id,
    }).returning({ id: questions.id });

    await db.insert(collectionQuestions).values({
      collectionId: coll.id,
      questionId: newQ.id,
    });

    console.log(`Inserted ${q.externalId}: ${q.text.substring(0, 60)}`);
    inserted++;
  }

  console.log(`\nInserted ${inserted} questions.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
