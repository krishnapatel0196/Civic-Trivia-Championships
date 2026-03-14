/**
 * Mississippi State supplementation: 15 hand-crafted questions on topics
 * underrepresented after 3 generation runs hit the content-saturation wall.
 *
 * Priority topics:
 * 1. Mississippi Supreme Court structure (elected, 9 justices, 8-year terms)
 * 2. 1890 constitution voter suppression mechanisms (civil rights / state history)
 * 3. Gaming legislation (1990 legalization, state economic impact)
 * 4. Catfish aquaculture dominance
 * 5. Army Corps / flood control (Mississippi River)
 * 6. Reconstruction historical firsts (Revels as Alcorn president)
 * 7. State government — Lt. Gov dual-branch structure
 * 8. 13th Amendment ratification story
 *
 * External IDs start at mis-401 to avoid conflicts with generated questions (max ~380).
 * Run from backend/: npx tsx src/scripts/supplement-mississippi-questions.ts
 */

import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

interface SupplementQuestion {
  external_id: string;
  text: string;
  options: string[];
  correct_answer: number; // 0-based index into options array
  explanation: string;    // Must include "According to"
  difficulty: 'easy' | 'medium' | 'hard';
  topic_name: string;
  expires_at: string | null;
  source: { name: string; url: string };
}

const SUPPLEMENTAL_QUESTIONS: SupplementQuestion[] = [
  // === Mississippi State Government and Structure (5 questions) ===
  {
    external_id: 'mis-401',
    text: 'Unlike most states, Mississippi\'s Supreme Court justices are chosen by which method?',
    options: ['Gubernatorial appointment', 'Nonpartisan popular election', 'Legislative confirmation vote', 'Merit selection commission'],
    correct_answer: 1, // 'Nonpartisan popular election'
    explanation: 'According to the Mississippi Constitution, Supreme Court justices are elected by voters in nonpartisan elections, serving 8-year terms. This makes Mississippi one of the few states where all high court judges face direct popular election — a notable distinction in American judicial selection.',
    difficulty: 'medium',
    topic_name: 'Mississippi State Government and Structure',
    expires_at: null,
    source: { name: 'Government of Mississippi', url: 'https://en.wikipedia.org/wiki/Government_of_Mississippi' },
  },
  {
    external_id: 'mis-402',
    text: 'How long are the terms served by Mississippi Supreme Court justices?',
    options: ['4 years', '6 years', '8 years', '10 years'],
    correct_answer: 2, // '8 years'
    explanation: 'According to the Mississippi Constitution, Supreme Court justices serve 8-year terms after winning nonpartisan elections. The court has 9 justices. Mississippi\'s elected judiciary is a distinctive feature of its government compared to states that use gubernatorial appointment.',
    difficulty: 'medium',
    topic_name: 'Mississippi State Government and Structure',
    expires_at: null,
    source: { name: 'Government of Mississippi', url: 'https://en.wikipedia.org/wiki/Government_of_Mississippi' },
  },
  {
    external_id: 'mis-403',
    text: 'The Mississippi Lt. Governor uniquely serves in which two branches of government simultaneously?',
    options: ['Executive and judicial', 'Executive and legislative', 'Legislative and judicial', 'Federal and state'],
    correct_answer: 1, // 'Executive and legislative'
    explanation: 'According to Mississippi\'s constitution, the Lt. Governor serves simultaneously in both the executive branch (as elected constitutional officer) and the legislative branch (presiding over the Senate and appointing all committee chairs). This dual-branch role is the source of the Lt. Governor\'s unusual power — more than the Governor in practice.',
    difficulty: 'medium',
    topic_name: 'Mississippi State Government and Structure',
    expires_at: null,
    source: { name: 'Government of Mississippi', url: 'https://en.wikipedia.org/wiki/Government_of_Mississippi' },
  },
  {
    external_id: 'mis-404',
    text: 'Which Mississippi constitutional officer appoints all committee chairs in the Mississippi Senate?',
    options: ['The Governor', 'The Senate Majority Leader', 'The Lt. Governor', 'The Secretary of State'],
    correct_answer: 2, // 'The Lt. Governor'
    explanation: 'According to Mississippi\'s legislative rules, the Lt. Governor appoints all Senate committee chairs, giving this office enormous control over legislation. This appointment power — combined with the Lt. Governor\'s role as presiding officer of the Senate — makes the position constitutionally stronger than the Governor\'s office in Mississippi.',
    difficulty: 'medium',
    topic_name: 'Mississippi State Government and Structure',
    expires_at: null,
    source: { name: 'Mississippi Legislature', url: 'https://en.wikipedia.org/wiki/Mississippi_Legislature' },
  },
  {
    external_id: 'mis-405',
    text: 'What is the total number of members in the Mississippi State Legislature (Senate and House combined)?',
    options: ['122', '152', '174', '236'],
    correct_answer: 2, // '174'
    explanation: 'According to the Mississippi Constitution, the bicameral legislature totals 174 members: 52 in the Mississippi Senate and 122 in the Mississippi House of Representatives. The Lt. Governor presides over the Senate; the Speaker of the House presides over the House.',
    difficulty: 'hard',
    topic_name: 'Mississippi State Government and Structure',
    expires_at: null,
    source: { name: 'Mississippi Legislature', url: 'https://en.wikipedia.org/wiki/Mississippi_Legislature' },
  },

  // === Mississippi State History and Founding (3 questions) ===
  {
    external_id: 'mis-406',
    text: 'What were the two primary mechanisms Mississippi\'s 1890 constitution used to disenfranchise Black voters?',
    options: ['Literacy tests and poll taxes', 'Property ownership and age restrictions', 'English-only ballots and residency requirements', 'Grandfather clauses and criminal convictions only'],
    correct_answer: 0, // 'Literacy tests and poll taxes'
    explanation: 'According to historians of Reconstruction, Mississippi\'s 1890 constitution was explicitly designed to disenfranchise Black voters through literacy tests (administered selectively by white registrars) and poll taxes (fees most Black Mississippians could not afford). These mechanisms became a national model for post-Reconstruction voter suppression, later outlawed by the 24th Amendment (1964) and the Voting Rights Act of 1965.',
    difficulty: 'medium',
    topic_name: 'Mississippi State History and Founding',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },
  {
    external_id: 'mis-407',
    text: 'Mississippi was the last US state to officially complete ratification of which constitutional amendment, with the paperwork certified in 2013?',
    options: ['13th Amendment (abolishing slavery)', '14th Amendment (equal protection)', '15th Amendment (voting rights)', '19th Amendment (women\'s suffrage)'],
    correct_answer: 0, // '13th Amendment'
    explanation: 'According to the US National Archives, Mississippi voted to ratify the 13th Amendment in 1995 but failed to submit the paperwork to the US Archivist. After a researcher discovered the oversight (partly inspired by the film "Lincoln"), the paperwork was filed and officially certified on February 7, 2013 — making Mississippi the last state to formally complete ratification of the amendment abolishing slavery.',
    difficulty: 'hard',
    topic_name: 'Mississippi State History and Founding',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },
  {
    external_id: 'mis-408',
    text: 'Hiram Revels, the first Black US Senator in American history, later became the first president of which historically significant Mississippi institution?',
    options: ['Jackson State University', 'Tougaloo College', 'Alcorn State University', 'Mississippi Valley State University'],
    correct_answer: 2, // 'Alcorn State University'
    explanation: 'According to historical records, after serving as the first Black US Senator (1870-1871), Hiram Revels became the first president of Alcorn State University — the first HBCU land-grant college in the United States. This dual legacy makes Revels one of the most significant figures in both federal political history and the history of Black higher education.',
    difficulty: 'hard',
    topic_name: 'Mississippi State History and Founding',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },

  // === Mississippi Economy and Industries (3 questions) ===
  {
    external_id: 'mis-409',
    text: 'What legislation did Mississippi pass in 1990 that transformed Tunica County into one of the largest gaming markets in the United States?',
    options: ['The Mississippi Lottery Act', 'The Mississippi Gaming Control Act', 'The Riverside Casino Authorization', 'The Gulf Coast Tourism Development Act'],
    correct_answer: 1, // 'The Mississippi Gaming Control Act'
    explanation: 'According to state legislative records, the Mississippi Gaming Control Act of 1990 legalized dockside casino gambling along the Mississippi River and Gulf Coast. Tunica County, previously one of the poorest counties in the US, became a major casino destination within a decade. Gaming became a significant source of state tax revenue and employment.',
    difficulty: 'medium',
    topic_name: 'Mississippi Economy and Industries',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },
  {
    external_id: 'mis-410',
    text: 'What share of US farm-raised catfish does Mississippi produce, making it the nation\'s dominant catfish aquaculture state?',
    options: ['About 25%', 'About 40%', 'A majority (more than 50%)', 'Nearly 90%'],
    correct_answer: 2, // 'A majority (more than 50%)'
    explanation: 'According to USDA agricultural statistics, Mississippi produces the majority of US farm-raised catfish, centered in the Delta region\'s pond aquaculture operations. The catfish industry employs thousands of Mississippians in farming, processing, and distribution. No other state approaches Mississippi\'s dominance in US catfish aquaculture.',
    difficulty: 'medium',
    topic_name: 'Mississippi Economy and Industries',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },
  {
    external_id: 'mis-411',
    text: 'Which federal agency administers flood control infrastructure along the Mississippi River, including the levee system that protects Mississippi communities?',
    options: ['Federal Emergency Management Agency (FEMA)', 'US Army Corps of Engineers', 'National Flood Insurance Program', 'Bureau of Reclamation'],
    correct_answer: 1, // 'US Army Corps of Engineers'
    explanation: 'According to federal law (Flood Control Act of 1928), the US Army Corps of Engineers administers the flood control infrastructure along the Mississippi River, including levees, floodways, and the Old River Control Structure. The 1928 legislation followed the catastrophic 1927 Mississippi River flood. This federal infrastructure is critical to Mississippi\'s agriculture and economy.',
    difficulty: 'medium',
    topic_name: 'Mississippi Economy and Industries',
    expires_at: null,
    source: { name: 'Mississippi River', url: 'https://en.wikipedia.org/wiki/Mississippi_River' },
  },

  // === Mississippi Civil Rights History (2 questions) ===
  {
    external_id: 'mis-412',
    text: 'The 24th Amendment (1964), abolishing poll taxes in federal elections, most directly targeted the voter suppression mechanisms established by which state\'s 1890 constitution?',
    options: ['Alabama', 'Georgia', 'Mississippi', 'South Carolina'],
    correct_answer: 2, // 'Mississippi'
    explanation: 'According to civil rights historians, Mississippi\'s 1890 constitution pioneered the use of poll taxes and literacy tests as post-Reconstruction voter suppression tools. Other Southern states copied these mechanisms. The 24th Amendment (ratified 1964) abolished poll taxes in federal elections, directly responding to disenfranchisement frameworks Mississippi had established and other states had adopted.',
    difficulty: 'hard',
    topic_name: 'Mississippi Civil Rights History',
    expires_at: null,
    source: { name: 'Civil rights movement in Mississippi', url: 'https://en.wikipedia.org/wiki/Civil_rights_movement_in_Mississippi' },
  },
  {
    external_id: 'mis-413',
    text: 'Fannie Lou Hamer\'s 1964 challenge at the Democratic National Convention was on behalf of which organization?',
    options: ['NAACP', 'Southern Christian Leadership Conference', 'Mississippi Freedom Democratic Party', 'Student Nonviolent Coordinating Committee'],
    correct_answer: 2, // 'Mississippi Freedom Democratic Party'
    explanation: 'According to historical records, Fannie Lou Hamer co-founded and represented the Mississippi Freedom Democratic Party (MFDP) at the 1964 Democratic National Convention in Atlantic City. The MFDP challenged the seating of Mississippi\'s all-white official delegation, arguing it violated Democratic Party rules. Hamer\'s televised testimony brought national attention to Mississippi\'s systematic voter disenfranchisement.',
    difficulty: 'medium',
    topic_name: 'Mississippi Civil Rights History',
    expires_at: null,
    source: { name: 'Civil rights movement in Mississippi', url: 'https://en.wikipedia.org/wiki/Civil_rights_movement_in_Mississippi' },
  },

  // === Mississippi Geography and Natural Features (2 questions) ===
  {
    external_id: 'mis-414',
    text: 'The Mississippi Delta region is the alluvial plain between the Mississippi River and which other river?',
    options: ['Tennessee River', 'Yazoo River', 'Big Black River', 'Pearl River'],
    correct_answer: 1, // 'Yazoo River'
    explanation: 'According to geographers, the Mississippi Delta is the alluvial plain between the Mississippi River (western boundary) and the Yazoo River (eastern boundary) — distinct from the river delta at the Gulf of Mexico. This region, known for fertile soil and cotton farming history, stretches roughly 200 miles north-to-south in northwestern Mississippi.',
    difficulty: 'medium',
    topic_name: 'Mississippi Geography and Natural Features',
    expires_at: null,
    source: { name: 'Mississippi River', url: 'https://en.wikipedia.org/wiki/Mississippi_River' },
  },
  {
    external_id: 'mis-415',
    text: 'The Natchez Trace Parkway, administered by the National Park Service, runs approximately 444 miles connecting Natchez, Mississippi to which city?',
    options: ['Memphis, Tennessee', 'Birmingham, Alabama', 'Nashville, Tennessee', 'Chattanooga, Tennessee'],
    correct_answer: 2, // 'Nashville, Tennessee'
    explanation: 'According to the National Park Service, the Natchez Trace Parkway follows the historic Natchez Trace — an ancient travel corridor used by Native Americans, European settlers, and early American traders. The 444-mile NPS-administered road runs from Natchez, MS to Nashville, TN, passing through portions of Mississippi, Alabama, and Tennessee.',
    difficulty: 'medium',
    topic_name: 'Mississippi Geography and Natural Features',
    expires_at: null,
    source: { name: 'Mississippi', url: 'https://en.wikipedia.org/wiki/Mississippi' },
  },
];

async function main() {
  console.log('Mississippi State Question Supplementation');
  console.log('==========================================');
  console.log(`Inserting ${SUPPLEMENTAL_QUESTIONS.length} hand-crafted questions (mis-401 to mis-415)\n`);

  // Get collection ID
  const collectionResult = await pool.query(
    `SELECT id FROM trivia.collections WHERE slug = 'mississippi-state'`
  );
  if (collectionResult.rows.length === 0) {
    throw new Error('Mississippi State collection not found. Run seed first.');
  }
  const collectionId = collectionResult.rows[0].id;
  console.log(`Collection ID: ${collectionId}\n`);

  // Get topic IDs by name
  const topicNamesNeeded = [...new Set(SUPPLEMENTAL_QUESTIONS.map(q => q.topic_name))];
  const topicResult = await pool.query(
    `SELECT id, name FROM trivia.topics WHERE name = ANY($1)`,
    [topicNamesNeeded]
  );
  const topicMap: Record<string, number> = {};
  for (const row of topicResult.rows) {
    topicMap[row.name] = row.id;
  }
  console.log('Topic map:');
  for (const [name, id] of Object.entries(topicMap)) {
    console.log(`  ${name}: ${id}`);
  }

  const missingTopics = topicNamesNeeded.filter(n => !topicMap[n]);
  if (missingTopics.length > 0) {
    throw new Error(`Missing topics in database: ${missingTopics.join(', ')}`);
  }

  let inserted = 0;
  let skipped = 0;

  for (const q of SUPPLEMENTAL_QUESTIONS) {
    const topicId = topicMap[q.topic_name];

    // Insert question
    const result = await pool.query(`
      INSERT INTO trivia.questions (
        external_id, text, options, correct_answer, explanation,
        difficulty, topic_id, subcategory, source, status, expires_at,
        expiration_history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, '[]'::jsonb)
      ON CONFLICT (external_id) DO NOTHING
      RETURNING id
    `, [
      q.external_id,
      q.text,
      JSON.stringify(q.options),
      q.correct_answer,
      q.explanation,
      q.difficulty,
      topicId,
      q.topic_name,
      JSON.stringify(q.source),
      q.expires_at,
    ]);

    if (result.rows.length === 0) {
      console.log(`  SKIP (already exists): ${q.external_id}`);
      skipped++;
      continue;
    }

    const questionId = result.rows[0].id;

    // Link to collection
    await pool.query(`
      INSERT INTO trivia.collection_questions (collection_id, question_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [collectionId, questionId]);

    console.log(`  INSERTED: ${q.external_id} — ${q.text.substring(0, 70)}...`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);

  // Final count
  const countResult = await pool.query(`
    SELECT status, COUNT(*) as cnt
    FROM trivia.questions
    WHERE external_id LIKE 'mis-%'
    GROUP BY status
    ORDER BY status
  `);
  console.log('\nFinal Mississippi question counts:');
  countResult.rows.forEach(r => console.log(`  ${r.status}: ${r.cnt}`));

  await pool.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
