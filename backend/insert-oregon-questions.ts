import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const COLLECTION_ID = 79;

// Topics: 489=state-government, 490=civic-innovations, 491=history-statehood, 492=public-policy-law, 493=culture-identity

interface Q {
  external_id: string;
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  topic_id: number;
  source: { url: string; name: string };
  expires_at: string | null;
  status: string;
}

const questions: Q[] = [
  // EXPIRING: Current officeholders
  {
    external_id: 'ore-101',
    text: 'Who is the Oregon Attorney General as of 2026?',
    options: ['Ellen Rosenblum', 'Dan Rayfield', 'Tobias Read', 'Andrea Salinas'],
    correct_answer: 1,
    explanation: 'Dan Rayfield is the Oregon Attorney General, elected in 2024. He took office in January 2025, succeeding Ellen Rosenblum who served from 2012 to 2025. Rayfield previously served in the Oregon House of Representatives.',
    difficulty: 'hard',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Attorney_General', name: 'Oregon Attorney General' },
    expires_at: '2029-01-15T00:00:00Z',
    status: 'draft',
  },
  {
    external_id: 'ore-102',
    text: 'Who is the Oregon State Treasurer as of 2026?',
    options: ['Tobias Read', 'Elizabeth Steiner', 'Dan Rayfield', 'Tina Kotek'],
    correct_answer: 1,
    explanation: 'Elizabeth Steiner is the Oregon State Treasurer, elected in 2024. She is a physician and former state senator who took office in January 2025. The State Treasurer manages Oregon investments and public finance.',
    difficulty: 'hard',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_State_Treasurer', name: 'Oregon State Treasurer' },
    expires_at: '2029-01-15T00:00:00Z',
    status: 'draft',
  },
  {
    external_id: 'ore-103',
    text: 'Who serves as Oregon Senate President as of 2026?',
    options: ['Julie Fahey', 'Rob Wagner', 'Tobias Read', 'Dan Rayfield'],
    correct_answer: 1,
    explanation: 'Rob Wagner (D) serves as President of the Oregon State Senate. The Senate President presides over the 30-member Senate and is one of the most powerful legislative leaders in Oregon government.',
    difficulty: 'hard',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Legislative_Assembly', name: 'Oregon Legislative Assembly' },
    expires_at: '2027-01-01T00:00:00Z',
    status: 'draft',
  },
  {
    external_id: 'ore-104',
    text: 'Who serves as Oregon House Speaker as of 2026?',
    options: ['Rob Wagner', 'Julie Fahey', 'Tina Kotek', 'Tobias Read'],
    correct_answer: 1,
    explanation: 'Julie Fahey (D) serves as Speaker of the Oregon House of Representatives. The Speaker presides over the 60-member House and helps set the legislative agenda for Oregon lower chamber.',
    difficulty: 'hard',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Legislative_Assembly', name: 'Oregon Legislative Assembly' },
    expires_at: '2027-01-01T00:00:00Z',
    status: 'draft',
  },
  // DURABLE: Oregon Supreme Court
  {
    external_id: 'ore-105',
    text: 'How many justices serve on the Oregon Supreme Court?',
    options: ['5', '7', '9', '11'],
    correct_answer: 1,
    explanation: 'The Oregon Supreme Court consists of 7 justices elected in nonpartisan statewide elections for 6-year terms. It is the highest court in Oregon with final authority on questions of Oregon state law.',
    difficulty: 'medium',
    topic_id: 492,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Supreme_Court', name: 'Oregon Supreme Court' },
    expires_at: null,
    status: 'draft',
  },
  {
    external_id: 'ore-106',
    text: 'How are Oregon Supreme Court justices selected?',
    options: ['Appointed by the Governor', 'Elected in nonpartisan elections', 'Elected in partisan elections', 'Appointed by the Legislature'],
    correct_answer: 1,
    explanation: 'Oregon Supreme Court justices are elected in nonpartisan statewide elections for 6-year terms. The nonpartisan election system distinguishes Oregon from states where judges are appointed and aims to insulate the judiciary from direct partisan politics.',
    difficulty: 'medium',
    topic_id: 492,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Supreme_Court', name: 'Oregon Supreme Court' },
    expires_at: null,
    status: 'draft',
  },
  {
    external_id: 'ore-107',
    text: 'What court sits between the Oregon circuit courts and the Oregon Supreme Court?',
    options: ['Oregon District Court', 'Oregon Court of Appeals', 'Oregon Superior Court', 'Oregon Appellate Division'],
    correct_answer: 1,
    explanation: 'The Oregon Court of Appeals is the intermediate appellate court in Oregon three-tier judicial system. It reviews decisions from circuit courts before cases can be appealed to the Oregon Supreme Court.',
    difficulty: 'medium',
    topic_id: 492,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Supreme_Court', name: 'Oregon Supreme Court' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon Trail
  {
    external_id: 'ore-108',
    text: 'What was the historic overland route that brought settlers to Oregon during the 1840s to 1860s?',
    options: ['Santa Fe Trail', 'Oregon Trail', 'California Trail', 'Mormon Trail'],
    correct_answer: 1,
    explanation: 'The Oregon Trail was a 2,170-mile overland route used by approximately 300,000 to 500,000 settlers migrating to Oregon from 1836 to the 1860s. It began in Missouri and ended in Oregon Willamette Valley, playing a key role in Oregon settlement and eventual statehood in 1859.',
    difficulty: 'easy',
    topic_id: 491,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Trail', name: 'Oregon Trail' },
    expires_at: null,
    status: 'draft',
  },
  {
    external_id: 'ore-109',
    text: 'Approximately how long was the Oregon Trail?',
    options: ['About 1,000 miles', 'About 2,170 miles', 'About 3,500 miles', 'About 500 miles'],
    correct_answer: 1,
    explanation: 'The Oregon Trail stretched approximately 2,170 miles from Independence, Missouri to Oregon Willamette Valley. The journey typically took 4 to 6 months by covered wagon and was central to westward expansion and Oregon history.',
    difficulty: 'medium',
    topic_id: 491,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Trail', name: 'Oregon Trail' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon counties
  {
    external_id: 'ore-110',
    text: 'How many counties does Oregon have?',
    options: ['29', '33', '36', '42'],
    correct_answer: 2,
    explanation: 'Oregon has 36 counties, ranging from Multnomah County (the most populous, containing Portland) to Wheeler County (one of the least populous counties in the US). Counties are the primary unit of local government for unincorporated areas in Oregon.',
    difficulty: 'medium',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Tom McCall dual legacy
  {
    external_id: 'ore-111',
    text: 'Which Oregon governor championed both the Bottle Bill and statewide land-use planning law (SB100)?',
    options: ['Mark Hatfield', 'Tom McCall', 'Bob Straub', 'Neil Goldschmidt'],
    correct_answer: 1,
    explanation: 'Governor Tom McCall (1967 to 1975) championed both Oregon Bottle Bill (1971) and Senate Bill 100 (1973), which established statewide land-use planning. He is widely regarded as one of Oregon most consequential governors for his lasting environmental legacy.',
    difficulty: 'medium',
    topic_id: 491,
    source: { url: 'https://en.wikipedia.org/wiki/Tom_McCall', name: 'Tom McCall' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Kate Brown succession mechanism
  {
    external_id: 'ore-112',
    text: 'How did Kate Brown become Oregon Governor in 2015?',
    options: ['She won a special election', 'She succeeded as Secretary of State when Governor Kitzhaber resigned', 'She was appointed by the legislature', 'She won the 2014 general election'],
    correct_answer: 1,
    explanation: 'Kate Brown became Oregon governor in February 2015 after Governor John Kitzhaber resigned. As Oregon Secretary of State, she was first in the line of succession since Oregon has no elected Lieutenant Governor. She was also the first openly bisexual governor in US history.',
    difficulty: 'hard',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Governor_of_Oregon', name: 'Governor of Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Measure 91 cannabis legalization
  {
    external_id: 'ore-113',
    text: 'What 2014 Oregon ballot measure legalized recreational cannabis for adult use?',
    options: ['Measure 80', 'Measure 91', 'Measure 49', 'Measure 37'],
    correct_answer: 1,
    explanation: 'Oregon Measure 91, passed by voters in November 2014, legalized recreational cannabis for adults 21 and older. Oregon had previously decriminalized cannabis possession in 1973. Recreational sales began in October 2015, making Oregon one of the earliest states to legalize adult-use cannabis.',
    difficulty: 'hard',
    topic_id: 490,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Governor term limit
  {
    external_id: 'ore-114',
    text: 'What is the maximum number of consecutive years an Oregon Governor may serve?',
    options: ['4 years (one term)', '8 years (two consecutive terms)', '12 years', 'There is no limit'],
    correct_answer: 1,
    explanation: 'The Oregon Governor serves 4-year terms but may serve no more than 8 consecutive years (two consecutive terms). After a break, a former governor may run again. This 8-year consecutive limit is a notable feature of Oregon executive structure.',
    difficulty: 'medium',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Governor_of_Oregon', name: 'Governor of Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon Valentine statehood
  {
    external_id: 'ore-115',
    text: 'Oregon was admitted to the Union on which holiday in 1859?',
    options: ['New Year Day', 'Valentine Day', 'Independence Day', 'Halloween'],
    correct_answer: 1,
    explanation: 'Oregon was admitted to the Union on February 14, 1859, Valentine Day. It became the 33rd state. This Valentine Day statehood date is a distinctive and memorable fact about Oregon history.',
    difficulty: 'medium',
    topic_id: 491,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Secretary of State oversees elections
  {
    external_id: 'ore-116',
    text: 'Which Oregon official oversees the administration of state elections?',
    options: ['Governor', 'Secretary of State', 'Attorney General', 'State Treasurer'],
    correct_answer: 1,
    explanation: 'The Oregon Secretary of State oversees the administration of state elections, including certifying ballot measures, overseeing voter registration, and administering Oregon vote-by-mail system. The Secretary of State also serves as Oregon ex officio Lieutenant Governor.',
    difficulty: 'medium',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Secretary_of_State', name: 'Oregon Secretary of State' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon flag reverse image
  {
    external_id: 'ore-117',
    text: 'What image appears on the reverse side of the Oregon state flag?',
    options: ['A Douglas fir tree', 'A beaver', 'A pioneer wagon', 'An eagle'],
    correct_answer: 1,
    explanation: 'The reverse side of Oregon state flag depicts a beaver, the state animal and the source of the nickname "the Beaver State." Oregon is the only US state with a flag that has a different design on each side: the state seal on the front and a beaver on the back.',
    difficulty: 'hard',
    topic_id: 493,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon state animal
  {
    external_id: 'ore-118',
    text: 'What is Oregon state animal, also depicted on the back of the state flag?',
    options: ['Black bear', 'Roosevelt elk', 'Beaver', 'Bighorn sheep'],
    correct_answer: 2,
    explanation: 'The American beaver is Oregon state animal, the origin of the state nickname "the Beaver State." The beaver also appears on the reverse side of Oregon state flag, making it the only US state flag with different designs on each side.',
    difficulty: 'easy',
    topic_id: 493,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Government-to-government tribal relations
  {
    external_id: 'ore-119',
    text: 'What type of relationship does the State of Oregon maintain with its 9 federally recognized tribal nations?',
    options: ['Charitable assistance relationship', 'Government-to-government relationship', 'Regulatory oversight relationship', 'Advisory relationship'],
    correct_answer: 1,
    explanation: 'Oregon maintains government-to-government relationships with its 9 federally recognized tribal nations. This relationship is rooted in federal treaties recognizing tribal nations as sovereign governments. The state works with tribes on natural resources, public safety, and economic development.',
    difficulty: 'hard',
    topic_id: 492,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon', name: 'Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Death with Dignity supreme court
  {
    external_id: 'ore-120',
    text: 'What US Supreme Court case upheld Oregon right to enforce its Death with Dignity Act in 2006?',
    options: ['Oregon v. Ashcroft', 'Gonzales v. Oregon', 'Oregon v. Smith', 'Glucksberg v. Oregon'],
    correct_answer: 1,
    explanation: 'In Gonzales v. Oregon (2006), the US Supreme Court ruled 6 to 3 that the federal Controlled Substances Act could not be used to block Oregon Death with Dignity Act. This upheld Oregon right to allow physician-assisted death for terminally ill patients.',
    difficulty: 'hard',
    topic_id: 490,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Death_with_Dignity_Act', name: 'Oregon Death with Dignity Act' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon Legislature annual sessions
  {
    external_id: 'ore-121',
    text: 'How often does the Oregon State Legislature meet in regular session?',
    options: ['Every two years (biennial)', 'Once a year (annual)', 'Twice a year', 'Only when called by the Governor'],
    correct_answer: 1,
    explanation: 'Oregon Legislature meets in annual regular sessions. This is sometimes confused with neighboring states like Washington, which hold biennial sessions. Oregon changed to annual sessions to allow more responsive governance.',
    difficulty: 'medium',
    topic_id: 489,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Legislative_Assembly', name: 'Oregon Legislative Assembly' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Urban Growth Boundary
  {
    external_id: 'ore-122',
    text: 'What planning tool, established by Oregon Senate Bill 100 in 1973, draws a boundary around cities to contain urban sprawl?',
    options: ['Green Zone', 'Urban Growth Boundary', 'Land Conservation District', 'Urban Development Line'],
    correct_answer: 1,
    explanation: 'Urban Growth Boundaries (UGBs) were established by Oregon Senate Bill 100 in 1973. They draw a line around cities designating where urban development can occur. Land outside is reserved for farming, forestry, and open space. Oregon was the first state to establish UGBs as a statewide planning tool.',
    difficulty: 'hard',
    topic_id: 490,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Land_Conservation_and_Development_Act_of_1973', name: 'Oregon Land Conservation and Development Act' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon capitol fires
  {
    external_id: 'ore-123',
    text: 'How many previous capitol buildings did Oregon have before the current 1938 structure?',
    options: ['None', 'One', 'Two', 'Three'],
    correct_answer: 2,
    explanation: 'Oregon had two capitol buildings before the current one: the first (1855) was destroyed by fire in 1855, and the second (1876) was destroyed by fire in 1935. After the 1935 fire, the current capitol was constructed with New Deal PWA funding and completed in 1938.',
    difficulty: 'hard',
    topic_id: 493,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_State_Capitol', name: 'Oregon State Capitol' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Oregon initiative signature requirement
  {
    external_id: 'ore-124',
    text: 'Who can amend the Oregon state constitution — the Legislature alone, voters directly, or both?',
    options: ['Only the Legislature can amend the constitution', 'Only voters can amend it through initiatives', 'Both the Legislature and voters can propose amendments', 'Only a constitutional convention can amend it'],
    correct_answer: 2,
    explanation: 'Both the Oregon Legislature and voters can propose constitutional amendments. The Legislature can refer amendments to voters, and citizens can also propose amendments directly through the initiative process (adopted 1902). Amendments require majority approval at a general election.',
    difficulty: 'medium',
    topic_id: 492,
    source: { url: 'https://en.wikipedia.org/wiki/Constitution_of_Oregon', name: 'Constitution of Oregon' },
    expires_at: null,
    status: 'draft',
  },
  // DURABLE: Bottle Bill deposit increase
  {
    external_id: 'ore-125',
    text: 'What was the deposit amount per container when Oregon Bottle Bill was updated in 2007?',
    options: ['5 cents (unchanged)', '10 cents', '15 cents', '25 cents'],
    correct_answer: 1,
    explanation: 'Oregon Bottle Bill deposit was increased from 5 cents to 10 cents in 2007. The original 1971 law set a 5-cent deposit. The Bottle Bill covers beer, carbonated soft drinks, water, and other beverages. The 2007 update also expanded which containers qualified.',
    difficulty: 'hard',
    topic_id: 490,
    source: { url: 'https://en.wikipedia.org/wiki/Oregon_Bottle_Bill', name: 'Oregon Bottle Bill' },
    expires_at: null,
    status: 'draft',
  },
];

let inserted = 0;
for (const q of questions) {
  const result = await pool.query(`
    INSERT INTO trivia.questions (
      external_id, text, options, correct_answer, explanation, difficulty,
      topic_id, source, expires_at, status, expiration_history,
      encounter_count, correct_count, flag_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '[]', 0, 0, 0)
    ON CONFLICT (external_id) DO NOTHING
    RETURNING id
  `, [
    q.external_id, q.text, JSON.stringify(q.options), q.correct_answer,
    q.explanation, q.difficulty, q.topic_id, JSON.stringify(q.source),
    q.expires_at, q.status
  ]);

  if (result.rows.length > 0) {
    const questionId = result.rows[0].id;
    await pool.query(`
      INSERT INTO trivia.collection_questions (collection_id, question_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [COLLECTION_ID, questionId]);
    console.log('Inserted:', q.external_id);
    inserted++;
  } else {
    console.log('Skipped (already exists):', q.external_id);
  }
}
console.log(`\nTotal inserted: ${inserted} questions`);

// Final count
const counts = await pool.query(`
  SELECT q.status, COUNT(*) as cnt
  FROM trivia.questions q
  JOIN trivia.collection_questions cq ON cq.question_id = q.id
  WHERE cq.collection_id = ${COLLECTION_ID}
  GROUP BY q.status
  ORDER BY q.status
`);
counts.rows.forEach((r: {status: string; cnt: number}) => console.log(r.status, ':', r.cnt));

await pool.end();
