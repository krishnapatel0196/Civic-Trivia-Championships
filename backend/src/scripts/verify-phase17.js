import { db } from '../db/index.js';
import { collections, questions } from '../db/schema.js';
import { like, sql } from 'drizzle-orm';

async function verify() {
  try {
    console.log('=== COLLECTIONS STATUS ===');
    const allCollections = await db.select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      isActive: collections.isActive,
    }).from(collections).orderBy(collections.sortOrder);
    
    console.log(JSON.stringify(allCollections, null, 2));
    
    console.log('\n=== QUESTION COUNTS ===');
    const bliTotal = await db.select({ count: sql`count(*)` }).from(questions).where(like(questions.externalId, 'bli-%'));
    const lacTotal = await db.select({ count: sql`count(*)` }).from(questions).where(like(questions.externalId, 'lac-%'));
    const bliActive = await db.select({ count: sql`count(*)` }).from(questions).where(sql`external_id LIKE 'bli-%' AND status = 'active'`);
    const lacActive = await db.select({ count: sql`count(*)` }).from(questions).where(sql`external_id LIKE 'lac-%' AND status = 'active'`);
    const fedActive = await db.select({ count: sql`count(*)` }).from(questions).where(sql`external_id LIKE 'fed-%' AND status = 'active'`);
    
    console.log('Bloomington total:', bliTotal[0]?.count || 0);
    console.log('Bloomington active:', bliActive[0]?.count || 0);
    console.log('LA total:', lacTotal[0]?.count || 0);
    console.log('LA active:', lacActive[0]?.count || 0);
    console.log('Federal active:', fedActive[0]?.count || 0);
    
    console.log('\n=== SAMPLE BLOOMINGTON QUESTIONS ===');
    const bliSample = await db.select({
      externalId: questions.externalId,
      status: questions.status,
      topicCategory: questions.topicCategory,
      text: questions.text,
    }).from(questions).where(like(questions.externalId, 'bli-%')).orderBy(questions.externalId).limit(3);
    
    for (const q of bliSample) {
      console.log(`${q.externalId} [${q.status}] (${q.topicCategory}): ${q.text.substring(0, 80)}...`);
    }
    
    console.log('\n=== SAMPLE LA QUESTIONS ===');
    const lacSample = await db.select({
      externalId: questions.externalId,
      status: questions.status,
      topicCategory: questions.topicCategory,
      text: questions.text,
    }).from(questions).where(like(questions.externalId, 'lac-%')).orderBy(questions.externalId).limit(3);
    
    for (const q of lacSample) {
      console.log(`${q.externalId} [${q.status}] (${q.topicCategory}): ${q.text.substring(0, 80)}...`);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

verify();
