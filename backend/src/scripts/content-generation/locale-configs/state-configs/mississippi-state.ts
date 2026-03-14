import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Mississippi state configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Mississippi State collection.
 *
 * CRITICAL ACCURACY NOTES:
 * - The Lt. Governor is constitutionally the MOST POWERFUL figure in Mississippi state government.
 *   The Lt. Gov presides over the Senate, appoints all committee chairs, and serves in both
 *   executive and legislative branches simultaneously — more powerful than the Governor.
 * - Mississippi Legislature: bicameral — Senate (52 members) + House (122 members).
 * - Mississippi Supreme Court: 9 justices, nonpartisan elections, 8-year terms.
 * - Governor Tate Reeves (R), term ends January 2028.
 * - Lt. Governor Delbert Hosemann (R), term ends January 2028.
 * - Attorney General Lynn Fitch (R), term ends January 2028.
 * - Secretary of State Michael Watson (R), term ends January 2028.
 * - Treasurer David McRae (R), term ends January 2028.
 * - House Speaker Jason White (R), term ends with legislative session January 2028.
 * - House Speaker Pro Tem Trey Lamar (R), term ends January 2028.
 * - ALL officeholder expiresAt: "2028-01-13T00:00:00Z"
 * - State statehood: December 10, 1817 (20th state).
 * - 2020 flag change: Senate 37-14, House 84-35; voter ratification 72.8%.
 * - Hiram Revels: first Black US Senator (1870, Mississippi).
 * - Blanche Bruce: second Black US Senator (1875, Mississippi).
 * - State-only: no questions about Jackson, Gulfport, Hattiesburg, or Natchez local government.
 * - MIXED DURABILITY: generate both expiring (current-officeholder) and durable questions.
 */
export const mississippiStateConfig: LocaleConfig = {
  locale: 'mississippi-state',
  name: 'Mississippi',
  externalIdPrefix: 'mis',
  collectionSlug: 'mississippi-state',
  targetQuestions: 120,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'Mississippi State Government and Structure',
      description:
        'Mississippi state government structure. The Lt. Governor is constitutionally the most powerful figure — presides over the Senate, appoints ALL committee chairs, serves in both executive and legislative branches simultaneously. The Governor is among the weakest governors nationally. Bicameral legislature: 52-member Senate + 122-member House of Representatives. Mississippi Supreme Court: 9 justices, nonpartisan elections, 8-year terms. Independently elected constitutional officers: Governor, Lt. Governor, Attorney General, Secretary of State, Treasurer, Auditor, Agriculture Commissioner, Insurance Commissioner. Include current officeholders with expiresAt 2028-01-13. Senate President (Lt. Gov Hosemann); House Speaker Jason White; House Speaker Pro Tem Trey Lamar.',
    },
    {
      slug: 'civil-rights-history',
      name: 'Mississippi Civil Rights History',
      description:
        'Civil rights history in Mississippi — framed as civic content about voter rights, constitutional enforcement, and legislative milestones. Medgar Evers: NAACP field secretary in Mississippi, led voter registration drives, assassinated June 12, 1963. Fannie Lou Hamer: sharecropper turned voting rights activist, co-founded Mississippi Freedom Democratic Party (MFDP), challenged 1964 Democratic National Convention seating of all-white Mississippi delegation. James Meredith: first Black student admitted to University of Mississippi (Ole Miss), September 30, 1962 — required federal marshals and National Guard. Freedom Summer 1964: voter registration campaign; murders of James Chaney, Andrew Goodman, Michael Schwerner (Philadelphia, MS). Emmett Till: murder August 28, 1955, Tallahatchie County; acquittals led to national civil rights momentum. 24th Amendment (1964) abolished poll taxes in federal elections — Mississippi was a primary context for that amendment.',
    },
    {
      slug: 'state-history',
      name: 'Mississippi State History and Founding',
      description:
        'Mississippi statehood December 10, 1817 (20th state admitted to the Union). 1890 Mississippi Constitution: specifically designed poll taxes, literacy tests, and grandfather clauses to disenfranchise Black voters — landmark example of post-Reconstruction voter suppression mechanisms. Reconstruction era: Hiram Revels (1870, first Black US Senator in US history, representing Mississippi); Blanche Bruce (1875, second Black US Senator, also Mississippi — only state to send two Black senators during Reconstruction). Theodore Bilbo: Governor (1916-1920 and 1928-1932) and US Senator — prominent figure in segregationist political history. Mississippi secession: January 9, 1861 (second state to secede). Readmitted to the Union February 23, 1870.',
    },
    {
      slug: 'geography',
      name: 'Mississippi Geography and Natural Features',
      description:
        'Mississippi geography and physical features. Mississippi River: forms the entire western border of the state; the state takes its name from the river (from Ojibwe "misi-ziibi" meaning "great river"). Mississippi Delta: fertile alluvial plain between the Mississippi River and Yazoo River — NOT the river delta at the Gulf. Gulf Coast: Mississippi has approximately 44 miles of Gulf of Mexico coastline. Natchez Trace Parkway: 444-mile National Park Service-administered road from Natchez, MS to Nashville, TN. Yazoo River: major tributary that defines the eastern boundary of the Delta region. Capital: Jackson. Highest point: Woodall Mountain (806 feet — one of the lowest state high points in the US).',
    },
    {
      slug: 'economy',
      name: 'Mississippi Economy and Industries',
      description:
        'Mississippi economy and major industries. Agriculture: soybeans (#1 crop by value), cotton (historically dominant cash crop), corn, poultry. Catfish aquaculture: Mississippi produces the majority of US farm-raised catfish — centered in the Delta region. Gaming industry: legalized in 1990 via the Mississippi Gaming Control Act; Tunica County became one of the largest gambling markets in the US; state generates significant tax revenue from casinos. Military installations: Keesler Air Force Base (Biloxi), Camp Shelby (Hattiesburg area — largest National Guard training facility in the US), Columbus Air Force Base. NASA Stennis Space Center (Hancock County) — tests rocket engines for NASA programs.',
    },
    {
      slug: 'current-officeholders',
      name: 'Mississippi Current Officeholders',
      description:
        'Current Mississippi state officeholders (all terms end January 2028 — expiresAt: "2028-01-13T00:00:00Z"). Governor Tate Reeves (R). Lt. Governor Delbert Hosemann (R) — the most powerful figure in state government. Attorney General Lynn Fitch (R). Secretary of State Michael Watson (R). State Treasurer David McRae (R). House Speaker Jason White (R). House Speaker Pro Tem Trey Lamar (R). Generate questions about each of these 7 offices. ALWAYS set expiresAt to "2028-01-13T00:00:00Z" for ALL officeholder questions.',
    },
    {
      slug: 'notable-mississippians',
      name: 'Notable Mississippians (Civic-Connected)',
      description:
        'Mississippians whose contributions connect to civic life, public service, or policy — not pure pop culture or entertainment. Hiram Revels (first Black US Senator, 1870, also first president of Alcorn State University — first HBCU land-grant). Blanche Bruce (second Black US Senator from Mississippi, 1875-1881, Register of the US Treasury under two presidents). Medgar Evers (NAACP; see civil rights section). Fannie Lou Hamer (MFDP; see civil rights section). James Meredith (Ole Miss integration; see civil rights section). L.Q.C. Lamar (Supreme Court Justice, also served as US Senator and Secretary of the Interior — only Mississippian on the Supreme Court). Theodore Bilbo (Governor and Senator — political history, segregationist legacy). Do NOT include musicians or athletes unless they have an explicit civic policy connection.',
    },
    {
      slug: 'state-symbols',
      name: 'Mississippi State Symbols and Identity',
      description:
        'Mississippi state symbols and civic identity. 2020 Flag Change: Mississippi adopted a new state flag via two-step process — Legislature voted to retire old flag (Senate 37-14, House 84-35); Governor signed bill; voters ratified new magnolia design November 3, 2020 (72.8% approval). New flag features a magnolia blossom, 20 stars (20th state), "In God We Trust" motto. Old flag had Confederate battle emblem — last US state to retire it. State bird: mockingbird. State flower and tree: magnolia. State motto: "Virtute et Armis" (Latin: "By Valor and Arms"). State nickname: "The Magnolia State". State fish: largemouth bass. Mississippi became the last state to officially ratify the 13th Amendment (abolishing slavery) — submitted paperwork in 1995, officially certified 2013.',
    },
  ],

  topicDistribution: {
    'state-government': 24,
    'civil-rights-history': 22,
    'state-history': 18,
    'geography': 14,
    'economy': 12,
    'current-officeholders': 12,
    'notable-mississippians': 10,
    'state-symbols': 8,
  },

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Mississippi',
    'https://en.wikipedia.org/wiki/Government_of_Mississippi',
    'https://en.wikipedia.org/wiki/Mississippi_Legislature',
    'https://en.wikipedia.org/wiki/Civil_rights_movement_in_Mississippi',
    'https://en.wikipedia.org/wiki/2020_Mississippi_state_flag_referendum',
    'https://en.wikipedia.org/wiki/Mississippi_River',
    'https://ballotpedia.org/Mississippi',
  ],
};

/**
 * Mississippi-specific features to inject into the state system prompt.
 * This string is passed to buildStateSystemPrompt() and serves as all voice guidance
 * for Mississippi question generation. No changes to system-prompt.ts or generate-locale-questions.ts are needed.
 */
export const mississippiStateFeatures = `
Mississippi has several distinctive features in its state government and history that MUST be accurately represented:

**TONE AND FRAMING — CRITICAL**
- These questions teach civic facts about Mississippi. Treat all topics with the gravity and accuracy of a civics textbook.
- No humor on sensitive historical events — civil rights history, the 2020 flag change, and racial injustice topics must be framed with full seriousness.
- Apply the civics educator standard: every question should be something a high school civics teacher would be proud to assign.

**MIXED DURABILITY INSTRUCTION**
Generate a mix of durable civic facts and expiring current-officeholder questions. Both types add civic value.
- For current officeholders, set expiresAt to "2028-01-13T00:00:00Z" (end of current term)
- For durable structural/historical facts, set expiresAt: null
- "Who is the Lt. Governor of Mississippi?" is an example of a compelling expiring question we WANT

**CRITICAL: THE LT. GOVERNOR IS THE MOST POWERFUL FIGURE IN MISSISSIPPI STATE GOVERNMENT**
- The Mississippi Lt. Governor is constitutionally more powerful than the Governor. This is a nationally distinctive fact.
- The Lt. Governor presides over the Mississippi Senate AND appoints ALL committee chairs.
- The Lt. Governor serves simultaneously in both the executive and legislative branches.
- By contrast, the Governor of Mississippi is considered one of the weakest governors nationally (limited appointment power, shared executive authority).
- Current Lt. Governor: Delbert Hosemann (R) — expiresAt: "2028-01-13T00:00:00Z"
- This Lt.-Gov-as-most-powerful fact is EXCELLENT trivia material and should generate at least 2-3 questions.

**CURRENT OFFICEHOLDERS (ALL expiresAt: "2028-01-13T00:00:00Z")**
- Governor Tate Reeves (R) — expiresAt: "2028-01-13T00:00:00Z"
- Lt. Governor Delbert Hosemann (R) — most powerful figure in state government — expiresAt: "2028-01-13T00:00:00Z"
- Attorney General Lynn Fitch (R) — expiresAt: "2028-01-13T00:00:00Z"
- Secretary of State Michael Watson (R) — expiresAt: "2028-01-13T00:00:00Z"
- State Treasurer David McRae (R) — expiresAt: "2028-01-13T00:00:00Z"
- House Speaker Jason White (R) — expiresAt: "2028-01-13T00:00:00Z"
- House Speaker Pro Tem Trey Lamar (R) — expiresAt: "2028-01-13T00:00:00Z"
Generate at least one question per office. ALL officeholder questions MUST have expiresAt set.

**MISSISSIPPI LEGISLATURE**
- Bicameral: Mississippi Senate (52 members) + Mississippi House of Representatives (122 members)
- Lt. Governor presides over the Senate AND appoints all Senate committee chairs — this dual role is unique
- House Speaker Jason White presides over the House

**MISSISSIPPI SUPREME COURT**
- 9 justices — elected in nonpartisan elections (unusual nationally; most states appoint)
- 8-year terms
- This elected judiciary structure is distinctive and merits 1-2 questions

**CIVIL RIGHTS HISTORY — FRAME AS CIVIC CONTENT**
Civil rights history is core civic content, not cultural content. Frame ALL civil rights questions through the lens of:
voter registration drives, federal enforcement of constitutional rights, legislative milestones, and constitutional amendments in action.

Key figures and events:
- Medgar Evers: NAACP field secretary in Mississippi, led voter registration drives, assassinated June 12, 1963 in Jackson
- Fannie Lou Hamer: sharecropper, co-founded Mississippi Freedom Democratic Party (MFDP), challenged 1964 DNC seating of all-white Mississippi delegation — frame as democratic participation and party representation challenge
- James Meredith: first Black student admitted to University of Mississippi (Ole Miss), September 30, 1962; required federal marshals and National Guard — frame as federal enforcement of constitutional rights
- Freedom Summer 1964: voter registration campaign; murder of James Chaney, Andrew Goodman, Michael Schwerner near Philadelphia, MS — frame as federal enforcement gap and civil rights legislation catalyst
- Emmett Till: murder August 28, 1955, Tallahatchie County; acquittals prompted outrage that accelerated the civil rights movement — frame as catalyst for federal civil rights legislation
- 24th Amendment (1964): abolished poll taxes in federal elections — Mississippi's 1890 constitution was the primary context for poll tax disenfranchisement

**2020 FLAG CHANGE — STRICTLY NEUTRAL CIVIC FRAMING**
The 2020 flag change must be framed ONLY as a civic event — process, vote margins, design features, voter ratification percentage. NO editorial commentary whatsoever.
- Legislature voted to retire old Confederate-emblem flag: Senate 37-14, House 84-35
- Governor Tate Reeves signed the bill into law
- New magnolia design ratified by voters November 3, 2020: 72.8% approval
- New flag features: magnolia blossom, 20 stars (for 20th state), "In God We Trust"
- Mississippi was the last US state to retire a flag with Confederate imagery

**CRITICAL: STATE-SCALE RULE — ZERO TOLERANCE**
ALL questions must be about Mississippi statewide institutions, laws, events, or history.
- Jackson: appears ONLY as the location of the state capitol. Do NOT generate questions about Jackson city government, Jackson mayor, Jackson City Council, or Jackson-specific landmarks.
- Gulfport: Do NOT generate questions about Gulfport city government or Gulfport-specific facts.
- Hattiesburg: Do NOT generate questions about Hattiesburg city government or Hattiesburg-specific facts.
- Natchez: may appear ONLY in the context of the Natchez Trace Parkway (a federal/statewide facility) or antebellum history relevant to statewide policy. No Natchez city government.
- Biloxi: the Keesler Air Force Base connection is acceptable as a statewide military/economic fact. Do NOT generate questions about Biloxi city government, casinos by name, or Biloxi-specific landmarks.
- Test: "Could a future Jackson MS city collection own this question?" If yes, cut it immediately from state collection.

**RECONSTRUCTION ERA**
- Hiram Revels (Republican, Mississippi): first Black US Senator in US history, served 1870-1871; also became first president of Alcorn State University (first HBCU land-grant college)
- Blanche Bruce (Republican, Mississippi): second Black US Senator in US history, served 1875-1881; later served as Register of the US Treasury
- Mississippi sent both Black Reconstruction senators — a nationally significant civic fact
- Do NOT conflate Revels and Bruce; they are distinct figures with different roles

**1890 MISSISSIPPI CONSTITUTION**
- Specifically designed to disenfranchise Black voters through poll taxes, literacy tests, and grandfather clauses
- A landmark example of post-Reconstruction legal voter suppression mechanisms
- This is civic content about how constitutional law was weaponized against voting rights
- Frame through the lens of constitutional law and voting rights, not as cultural commentary

**MISSISSIPPI STATE HISTORY — KEY FACTS**
- Statehood: December 10, 1817 (20th state)
- Mississippi seceded January 9, 1861 (second state to secede)
- Readmitted to the Union February 23, 1870
- Last state to officially ratify the 13th Amendment (abolishing slavery): submitted paperwork 1995, officially certified 2013

**WHAT TO AVOID**
- Do NOT generate questions about Jackson city government, Jackson mayor, Jackson City Council
- Do NOT generate questions about Gulfport, Hattiesburg, or Natchez local governance
- Do NOT generate questions about county government — 82 counties is too granular for state scale
- Do NOT generate questions about specific addresses, phone numbers, or building locations
- Do NOT generate questions about Mississippi universities as institutions (Ole Miss, Mississippi State) unless directly tied to a statewide civic event (e.g., James Meredith integration)
- Do NOT generate questions about Mississippi sports teams
- Do NOT generate questions whose answer is a phone number, street address, or website URL
- Do NOT include musicians or athletes as "notable Mississippians" unless they have an explicit civic angle
- Do NOT generate questions about individual county governments or county officials
- Skip Theodore Bilbo if framing is ambiguous — only include if framing is strictly factual political history
`;
