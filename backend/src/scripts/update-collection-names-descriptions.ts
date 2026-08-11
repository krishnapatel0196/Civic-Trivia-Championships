/**
 * One-time migration: rename state collections (drop "State" suffix) and
 * update flat taglines for newer collections.
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { collections } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { pool } from '../config/database.js';

const updates = [
  { slug: 'indiana-state',      name: 'Indiana',       localeName: 'Indiana',       description: null },
  { slug: 'california-state',   name: 'California',    localeName: 'California',    description: null },
  { slug: 'massachusetts-state', name: 'Massachusetts', localeName: 'Massachusetts', description: "Can the Bay State's oldest democracy stump you?" },
  { slug: 'texas-state',        name: null,            localeName: null,            description: "Everything's bigger in Texas. So is the civics challenge." },
  { slug: 'cambridge-ma',       name: null,            localeName: null,            description: 'From Harvard Square to City Hall — think you know Cambridge, MA?' },
  { slug: 'plano-tx',           name: null,            localeName: null,            description: 'The City of Excellence awaits — how well do you know Plano, TX?' },
];

async function run() {
  for (const u of updates) {
    const patch: Record<string, string> = {};
    if (u.name)        patch.name        = u.name;
    if (u.localeName)  patch.localeName  = u.localeName;
    if (u.description) patch.description = u.description;

    if (Object.keys(patch).length === 0) continue;

    await db.update(collections).set(patch).where(eq(collections.slug, u.slug));
    console.log(`✓ ${u.slug}:`, patch);
  }
  console.log('\nDone.');
  await pool.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
