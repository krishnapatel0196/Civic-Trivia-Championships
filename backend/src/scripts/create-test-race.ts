import 'dotenv/config';
import { db } from '../db/index.js';
import { electionRaces } from '../db/schema.js';

const result = await db.insert(electionRaces).values({
  seat: 'Mayor',
  electionType: 'general',
  electionDate: new Date('2026-11-03'),
  timezone: 'America/Indiana/Indianapolis',
  jurisdiction: 'Bloomington, IN',
  candidates: [{ name: 'Kerry Thomson', party: '', incumbent: false }, { name: 'Don Griffin', party: '', incumbent: false }],
  questionsGenerated: false,
  followupGenerated: false,
}).returning({ id: electionRaces.id });

console.log('Created race id:', result[0].id);
process.exit(0);
