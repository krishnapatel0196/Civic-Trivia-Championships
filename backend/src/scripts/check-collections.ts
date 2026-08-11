import 'dotenv/config';
import { db } from '../db/index.js';
import { collections } from '../db/schema.js';

const result = await db.select().from(collections);
console.log('Collections found:', result.length);
for (const c of result) {
  console.log(`  - ${c.slug} (id: ${c.id}, name: ${c.name})`);
}
process.exit(0);
