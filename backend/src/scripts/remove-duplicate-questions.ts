/**
 * One-time script to remove duplicate questions from all collection data files.
 *
 * Duplicates were caused by the same factual questions being seeded across
 * multiple topic categories. This script removes the duplicates, keeping the
 * best version of each question (correct topic, best explanation).
 *
 * Also fixes:
 * - fre-009: WRONG answer (says mayor chosen by council, but mayor is directly elected)
 * - fre-091: Wrong topicCategory (budget-finance → city-government)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Question {
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  topicCategory: string;
  source: { url: string; name: string };
  expiresAt: string | null;
}

interface CollectionData {
  topics: Array<{ slug: string; name: string; description: string }>;
  questions: Question[];
}

// === FREMONT: IDs to remove ===
const fremontRemove = new Set([
  'fre-009',  // WRONG ANSWER: says mayor chosen by council (incorrect post-2017)
  'fre-040',  // Exact dup of fre-039 (five towns consolidated)
  'fre-045',  // Exact dup of fre-039 (five towns consolidated)
  'fre-057',  // Near-dup of fre-015 (Registrar of Voters)
  'fre-062',  // Near-dup of fre-019 (property tax collection)
  'fre-063',  // Exact dup of fre-028 (VoteCal)
  'fre-067',  // Exact dup of fre-032 (primary election 2026)
  'fre-083',  // Near-dup of fre-001 (council districts count)
  'fre-085',  // Exact dup of fre-003 (supervisor district), wrong topic
  'fre-087',  // Exact dup of fre-055 (BART), wrong topic
  'fre-088',  // Near-dup of fre-012 (city manager role), wrong topic
  'fre-090',  // Near-dup of fre-005 (council term length), wrong topic
  'fre-093',  // Near-dup of fre-004 (form of government), wrong topic
  'fre-099',  // Exact dup of fre-056 (pre-register age), wrong topic
  'fre-100',  // Near-dup of fre-015 (voter registration office), wrong topic
  'fre-102',  // Near-dup of fre-004 (form of government)
  'fre-105',  // Exact dup of fre-003 (supervisor district)
  'fre-110',  // Near-dup of fre-041 (Mission San Jose founding)
  'fre-111',  // Near-dup of fre-081 (NUMMI plant name)
  'fre-112',  // Near-dup of fre-082 (Niles silent film)
  'fre-113',  // Near-dup of fre-078 (Little Kabul)
]);

// === BLOOMINGTON: IDs to remove ===
const bloomingtonRemove = new Set([
  'bli-007',  // Dup of bli-054 (parks count)
  'bli-026',  // Dup of bli-001 (common council members)
  'bli-028',  // Dup of bli-002 (current mayor)
  'bli-029',  // Dup of bli-003 (council districts)
  'bli-031',  // Dup of bli-004 (form of government)
  'bli-032',  // Dup of bli-005 (council term length)
  'bli-035',  // Dup of bli-014 (county commissioners)
  'bli-036',  // Dup of bli-019 (county population)
  'bli-037',  // Dup of bli-016 (county council members)
  'bli-045',  // Dup of bli-062 (municipal election years)
  'bli-046',  // Dup of bli-054 (parks count)
  'bli-049',  // Dup of bli-070 (voter registration deadline)
  'bli-050',  // Dup of bli-012 (Kerry Thomson / IU center)
  'bli-051',  // Dup of bli-001 (common council members)
  'bli-052',  // Dup of bli-102 (Thomson took office)
  'bli-053',  // Dup of bli-003 (council districts)
  'bli-055',  // Dup of bli-004 (form of government)
  'bli-056',  // Dup of bli-027 (city incorporation)
  'bli-057',  // Dup of bli-005 (council term length)
  'bli-060',  // Dup of bli-010 (pools count)
  'bli-061',  // Dup of bli-008 (zoning permits)
  'bli-064',  // Dup of bli-079 (city budget adoption)
  'bli-065',  // Dup of bli-013 (city population)
  'bli-067',  // Dup of bli-030 (IU established)
  'bli-076',  // Dup of bli-054 (parks count)
  'bli-078',  // Dup of bli-066 (trails count)
  'bli-080',  // Dup of bli-027 (city incorporation)
  'bli-081',  // Dup of bli-010 (pools count)
  'bli-083',  // Dup of bli-030 (IU established)
  'bli-084',  // Dup of bli-073 (sports complexes)
  'bli-085',  // Dup of bli-074 (mayoral appointments)
  'bli-089',  // Dup of bli-004 (form of government)
  'bli-091',  // Dup of bli-072 (city clerk)
  'bli-093',  // Dup of bli-013 (city population)
  'bli-094',  // Dup of bli-069 (water/wastewater)
  'bli-095',  // Dup of bli-068 (Kerry Thomson number)
  'bli-096',  // Dup of bli-062 (municipal election years)
  'bli-101',  // Dup of bli-001 (common council members)
  'bli-103',  // Dup of bli-003 (council districts)
  'bli-104',  // Dup of bli-004 (government structure)
  'bli-105',  // Dup of bli-069 (water/wastewater)
  'bli-107',  // Dup of bli-062 (city election years)
  'bli-108',  // Dup of bli-070 (voter registration deadline)
  'bli-109',  // Dup of bli-024 (county clerk elections)
  'bli-111',  // Dup of bli-027 (city incorporation)
  'bli-112',  // Dup of bli-030 (IU established)
  'bli-113',  // Dup of bli-054 (parks count)
  'bli-114',  // Dup of bli-013 (city population)
  'bli-115',  // Dup of bli-088 (golf course holes)
  'bli-116',  // Dup of bli-033 (Monroe County formed)
  'bli-117',  // Dup of bli-016 (county council members)
  'bli-118',  // Dup of bli-019 (county population)
  'bli-119',  // Dup of bli-014 (county commissioners)
  'bli-120',  // Dup of bli-021 (county assessor)
  'bli-077',  // Dup of bli-059 (Thomson term end date)
]);

// === LOS ANGELES: IDs to remove ===
const losAngelesRemove = new Set([
  'lac-026',  // Dup of lac-017 (pre-register age)
  'lac-027',  // Dup of lac-001 (board of supervisors count)
  'lac-030',  // Dup of lac-022 (California GDP)
  'lac-031',  // Dup of lac-023 (national parks)
  'lac-032',  // Dup of lac-025 (VoteCal)
  'lac-034',  // Dup of lac-019 (student poll worker GPA)
  'lac-040',  // Dup of lac-006 (food systems office)
  'lac-046',  // Dup of lac-012 (chief sustainability office)
  'lac-048',  // Dup of lac-009 (charter county)
  'lac-049',  // Dup of lac-010 (equity oversight panel)
  'lac-051',  // Dup of lac-001 (board of supervisors count)
  'lac-052',  // Dup of lac-028 (LA county population)
  'lac-053',  // Dup of lac-005 (inspector general)
  'lac-054',  // Dup of lac-004 (dual function)
  'lac-055',  // Dup of lac-006 (food systems office)
  'lac-057',  // Dup of lac-016 (LADWP EV rebate)
  'lac-058',  // Dup of lac-043 (child protection office)
  'lac-059',  // Dup of lac-007 (executive office records)
  'lac-060',  // Dup of lac-010 (equity oversight panel)
  'lac-061',  // Dup of lac-009 (charter county)
  'lac-062',  // Dup of lac-012 (chief sustainability office)
  'lac-066',  // Dup of lac-017 (pre-register age)
  'lac-071',  // Dup of lac-019 (student poll worker GPA)
  'lac-073',  // Dup of lac-050 (voter registration languages)
  'lac-074',  // Dup of lac-025 (VoteCal)
  'lac-076',  // Dup of lac-001 (board of supervisors count)
  'lac-077',  // Dup of lac-004 (dual function)
  'lac-079',  // Dup of lac-033 (records office)
  'lac-081',  // Dup of lac-006 (food systems office)
  'lac-082',  // Dup of lac-012 (chief sustainability office)
  'lac-083',  // Dup of lac-010 (equity oversight panel)
  'lac-085',  // Dup of lac-043 (child protection office)
  'lac-086',  // Dup of lac-023 (national parks)
  'lac-087',  // Dup of lac-022 (California GDP)
  'lac-088',  // Dup of lac-024 (California population)
  'lac-089',  // Dup of lac-016 (LADWP EV rebate)
  'lac-090',  // Dup of lac-064 (voter registration deadline)
  'lac-091',  // Dup of lac-065 (ballot mailing date)
  'lac-092',  // Dup of lac-017 (pre-register age)
  'lac-093',  // Dup of lac-019 (student poll worker GPA)
  'lac-094',  // Dup of lac-038 (California campsites)
  'lac-096',  // Dup of lac-039 (Californians born overseas)
  'lac-097',  // Dup of lac-069 (ballot drop-off locations)
  'lac-098',  // Dup of lac-025 (VoteCal)
  'lac-101',  // Dup of lac-001 (board of supervisors count)
  'lac-102',  // Dup of lac-004 (dual function)
  'lac-103',  // Dup of lac-078 (LA county population)
  'lac-104',  // Dup of lac-009 (charter county)
  'lac-105',  // Dup of lac-005 (inspector general)
  'lac-106',  // Dup of lac-007 (executive office records)
  'lac-107',  // Dup of lac-006 (food systems office)
  'lac-108',  // Dup of lac-012 (chief sustainability office)
  'lac-109',  // Dup of lac-010 (equity oversight panel)
  'lac-110',  // Dup of lac-043 (child protection office)
  'lac-111',  // Dup of lac-022 (California GDP)
  'lac-112',  // Dup of lac-023 (national parks)
  'lac-113',  // Dup of lac-024 (California population)
  'lac-114',  // Dup of lac-016 (LADWP EV rebate)
  'lac-115',  // Dup of lac-064 (voter registration deadline)
  'lac-116',  // Dup of lac-017 (pre-register age)
  'lac-118',  // Dup of lac-019 (student poll worker GPA)
  'lac-119',  // Dup of lac-045 (student poll worker earnings)
]);

function processFile(filePath: string, removeSet: Set<string>, fixes?: (q: Question) => void): void {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: CollectionData = JSON.parse(raw);

  const before = data.questions.length;
  data.questions = data.questions.filter(q => !removeSet.has(q.externalId));
  const after = data.questions.length;

  // Apply any fixes to remaining questions
  if (fixes) {
    data.questions.forEach(fixes);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`${path.basename(filePath)}: ${before} → ${after} questions (removed ${before - after})`);
}

const dataDir = path.join(__dirname, '..', 'data');

// Process Fremont
processFile(
  path.join(dataDir, 'fremont-ca-questions.json'),
  fremontRemove,
  (q) => {
    // Fix fre-091 topic category
    if (q.externalId === 'fre-091') {
      q.topicCategory = 'city-government';
    }
  }
);

// Process Bloomington
processFile(
  path.join(dataDir, 'bloomington-in-questions.json'),
  bloomingtonRemove
);

// Process Los Angeles
processFile(
  path.join(dataDir, 'los-angeles-ca-questions.json'),
  losAngelesRemove
);

console.log('\nDone! Duplicate questions removed from all collections.');
