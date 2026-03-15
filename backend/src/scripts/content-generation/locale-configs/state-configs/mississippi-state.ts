import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Mississippi state configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Mississippi State collection.
 *
 * CRITICAL ACCURACY NOTES:
 * - The Lt. Governor is constitutionally the MOST POWERFUL figure in Mississippi state government
 *   — more powerful than the Governor. The Lt. Gov presides over the Senate, appoints all
 *   committee chairs, and serves in both executive and legislative branches simultaneously.
 * - Mississippi Legislature: bicameral — Senate (52 members) + House of Representatives (122 members)
 * - Mississippi Supreme Court: 9 justices, elected on nonpartisan ballot, 8-year terms
 * - Governor Tate Reeves, Lt. Gov Delbert Hosemann, AG Lynn Fitch, SoS Michael Watson,
 *   Treasurer David McRae, Speaker Jason White, Speaker Pro Tem Trey Lamar
 * - All 7 officeholder targets expire 2028-01-13 (end of current term)
 * - Civil rights history is CORE civic content: Medgar Evers, Fannie Lou Hamer, James Meredith,
 *   Freedom Summer 1964 (Chaney/Goodman/Schwerner), Emmett Till
 * - 2020 flag change: Senate 37-14, House 84-35, Governor signed, 72.8% referendum ratification
 * - State statehood: December 10, 1817 (20th state)
 * - Reconstruction firsts: Hiram Revels (first Black US Senator, 1870), Blanche Bruce (second)
 * - State-only: no questions about Jackson city gov, Gulfport city gov, or city-specific facts
 * - MIXED DURABILITY: generate both expiring (current-officeholder) and durable questions
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
      name: 'Mississippi State Government',
      description:
        'Mississippi state government structure and current officeholders. CRITICAL: The Lt. Governor is constitutionally the most powerful figure — more powerful than the Governor. Lt. Gov presides over the Senate, appoints ALL committee chairs, and uniquely serves in BOTH executive and legislative branches simultaneously. Bicameral legislature: Senate (52 members) + House of Representatives (122 members). Mississippi Supreme Court: 9 justices elected on nonpartisan ballot to 8-year terms — distinctive because most states appoint justices. Independently elected constitutional officers: Governor, Lt. Governor, Attorney General, Secretary of State, State Treasurer, State Auditor, Commissioner of Agriculture, Commissioner of Insurance, Commissioner of Public Safety. Governor is among the weakest in the nation constitutionally. Include current officeholders: Governor Tate Reeves, Lt. Gov Delbert Hosemann, AG Lynn Fitch, SoS Michael Watson, Treasurer David McRae, Speaker Jason White, Speaker Pro Tem Trey Lamar — all with expiresAt 2028-01-13.',
    },
    {
      slug: 'civil-rights',
      name: 'Mississippi Civil Rights History',
      description:
        "Mississippi civil rights history as core civic content — voter registration, federal enforcement of constitutional rights, and legislative milestones. Key figures: Medgar Evers (NAACP field secretary, organized voter registration drives, assassinated June 12, 1963 in Jackson); Fannie Lou Hamer (Mississippi Freedom Democratic Party co-founder, challenged all-white Mississippi delegation at 1964 DNC, 'I'm sick and tired of being sick and tired'); James Meredith (first Black student at University of Mississippi, enrolled October 1, 1962 under federal marshals and National Guard); Freedom Summer 1964 — voter registration campaign, James Chaney/Andrew Goodman/Michael Schwerner murdered June 21, 1964; Emmett Till (1955 murder in Money, MS — pivotal in sparking the civil rights movement). Frame all questions through: voter registration drives, federal enforcement of constitutional amendments (14th, 15th), legislative milestones, Supreme Court rulings. NO humor, NO cultural framing — civic education only.",
    },
    {
      slug: 'state-history',
      name: 'Mississippi State History and Founding',
      description:
        "Mississippi state history and constitutional milestones. Statehood: December 10, 1817 (20th state admitted to the Union). 1890 Mississippi Constitution — poll taxes and literacy tests as voter suppression mechanisms (civic angle: systematic disenfranchisement mechanisms written into state law). Reconstruction era: Hiram Revels (R-MS) — first Black US Senator, served 1870-1871, filled Jefferson Davis's former seat; Blanche Bruce (R-MS) — second Black US Senator, full term 1875-1881, first Black senator to preside over Senate. Mississippi seceded January 9, 1861 (second state to secede). Readmitted to the Union 1870. 1986 legislative revision. Jefferson Davis (Confederate president, born in Mississippi). Civil War history at state-policy scale — secession vote, constitutional provisions.",
    },
    {
      slug: 'geography',
      name: 'Mississippi Geography and Natural Features',
      description:
        "Mississippi geography at state scale. Mississippi River: forms the entire western border of the state; state is named after the river; Mississippi River is the longest river in the United States. Mississippi Delta: fertile agricultural region between the Mississippi River and the Yazoo River (NOT the same as the river delta at the Gulf). Gulf Coast: 44 miles of coastline on the Gulf of Mexico. Natchez Trace: 444-mile historic trail running through Mississippi (NPS administered as Natchez Trace Parkway), runs from Natchez, MS to Nashville, TN — statewide/federal, not city-specific. Highest point: Woodall Mountain (806 feet — lowest high point of any US state). Yazoo River. State capital: Jackson (appears ONLY as seat of state government — no Jackson city-specific facts).",
    },
    {
      slug: 'economy',
      name: 'Mississippi Economy and Industries',
      description:
        "Mississippi economy and industries at state scale. Agriculture: soybeans (#1 crop by value), cotton (historically dominant, still significant), corn, broiler chickens. Catfish aquaculture: Mississippi produces the majority of US farm-raised catfish — Sunflower County and surrounding Delta counties lead nationally. Gaming: legalized 1990 (Gulf Coast and river counties only, not statewide); Tunica became major casino hub in northwest Mississippi; generates significant state tax revenue. Military presence: Keesler Air Force Base (Biloxi — major electronic warfare and weather training; Keesler appears as a state economic driver, NOT as Biloxi city content), Camp Shelby (largest National Guard training facility in US east of the Mississippi), Columbus Air Force Base (pilot training). Manufacturing: Ingalls Shipbuilding (Pascagoula, largest private employer in Mississippi, builds US Navy ships). Aerospace and automotive in recent decades.",
    },
    {
      slug: 'current-officeholders',
      name: 'Mississippi Current Officeholders',
      description:
        "Mississippi current statewide elected officials — all with expiresAt 2028-01-13T00:00:00Z. Governor Tate Reeves (R) — took office January 2020, re-elected 2023. Lt. Governor Delbert Hosemann (R) — took office January 2020, re-elected 2023; as Lt. Gov he is the most constitutionally powerful statewide official. Attorney General Lynn Fitch (R) — first woman elected AG in Mississippi history, took office January 2020, re-elected 2023. Secretary of State Michael Watson (R) — took office January 2020, re-elected 2023. State Treasurer David McRae (R) — took office 2021, re-elected 2023. Speaker of the House Jason White (R) — elected Speaker 2022. Speaker Pro Tem Trey Lamar (R). Generate at least 2 questions per officeholder. ALL these questions MUST have expiresAt: '2028-01-13T00:00:00Z'.",
    },
    {
      slug: 'notable-mississippians',
      name: 'Notable Mississippians (Civic-Connected)',
      description:
        "Notable Mississippians with explicit civic, political, or public service connections — not pop culture figures. Civic leaders: Hiram Revels (first Black US Senator, born Fayetteville NC but represented Mississippi), Blanche Bruce (second Black US Senator, full term 1875-1881, plantation overseer turned senator). Political figures: Theodore G. Bilbo (Governor twice and US Senator — significant in Mississippi political history for segregationist policies; civic angle: his career illustrates how official policies enforced segregation). John C. Stennis (US Senator 1947-1989, dean of the Senate, champion of NASA's Stennis Space Center). Trent Lott (Senate Majority Leader). Other civic angle: Fannie Lou Hamer and Medgar Evers already covered in civil rights category. EXCLUDE: musicians (B.B. King, Robert Johnson, Muddy Waters), athletes, actors unless they have explicit civic leadership roles.",
    },
    {
      slug: 'state-symbols',
      name: 'Mississippi State Symbols and Identity',
      description:
        "Mississippi state symbols and civic identity. 2020 flag change — FRAME AS STRICTLY CIVIC: old flag (1894 design containing Confederate battle emblem) was retired; Mississippi Legislature voted to change it (Senate 37-14, House 84-35); Governor Tate Reeves signed the bill July 1, 2020; Commission on the New Mississippi State Flag designed the new magnolia design; voters ratified the new design by 72.8% approval in November 2020 referendum; new flag features the magnolia flower, 21 stars (symbolizing Mississippi as 20th state + US as 50-star nation at time of design), gold cross symbolizing faith, and the phrase 'In God We Trust'. State bird: mockingbird. State flower: magnolia. State tree: magnolia. State motto: 'Virtute et Armis' (Latin: 'By Valor and Arms'). State nickname: The Magnolia State. State song: 'Go, Mississippi'. Mississippi is called The Hospitality State as an informal nickname. Apply civic framing to flag change — NO editorial commentary, NO value judgments on the old or new design.",
    },
  ],

  topicDistribution: {
    'state-government': 24,
    'civil-rights': 22,
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
These questions teach civic facts about Mississippi. Treat all topics with the gravity and accuracy of a civics textbook.

**TONE AND FRAMING**
- No humor on sensitive historical events — civil rights history, the 2020 flag change, and racial injustice topics must be framed with full seriousness.
- Civil rights history is core civic content, not cultural content. Frame all civil rights questions through the lens of: voter registration drives, federal enforcement of constitutional rights, legislative milestones, and constitutional amendments in action.
- Apply the civic educator standard: every question should be something a middle school civics teacher would be proud to put on a test.

**MIXED DURABILITY INSTRUCTION**
Generate a mix of durable civic facts and expiring current-officeholder questions. Both types add civic value.
- For current officeholders, set expiresAt: "2028-01-13T00:00:00Z" for ALL 7 target offices
- For durable structural/historical/civic facts, set expiresAt: null
- "Who is the Lt. Governor of Mississippi?" is an excellent expiring question we WANT

**CRITICAL: THE LT. GOVERNOR IS THE MOST POWERFUL FIGURE IN MISSISSIPPI STATE GOVERNMENT**
- The Mississippi Lt. Governor is constitutionally MORE POWERFUL than the Governor. This is distinctive nationally.
- The Lt. Governor presides over the Mississippi Senate, appoints ALL committee chairs, and assigns all bills to committees.
- The Lt. Governor uniquely serves in BOTH the executive AND legislative branches simultaneously.
- The Governor of Mississippi is among the WEAKEST governors nationally — veto power but limited administrative control.
- Current Lt. Gov: Delbert Hosemann (R), took office January 2020, re-elected 2023. expiresAt: "2028-01-13T00:00:00Z"
- This Lt.-Gov-as-most-powerful-official structure is EXCELLENT distinctive trivia — generate at least 2-3 questions about it.

**CURRENT OFFICEHOLDERS — ALL expiresAt: "2028-01-13T00:00:00Z"**
- Governor Tate Reeves (R) — took office January 2020, re-elected November 2023
- Lt. Governor Delbert Hosemann (R) — took office January 2020, re-elected November 2023; most powerful figure in state government
- Attorney General Lynn Fitch (R) — first woman elected AG in Mississippi history; took office January 2020, re-elected 2023
- Secretary of State Michael Watson (R) — took office January 2020, re-elected 2023
- State Treasurer David McRae (R) — took office 2021, re-elected 2023
- Speaker of the House Jason White (R) — elected Speaker 2022
- Speaker Pro Tem Trey Lamar (R)
Generate at least 2 questions per officeholder. Every officeholder question MUST have expiresAt: "2028-01-13T00:00:00Z".

**CIVIL RIGHTS HISTORY — CIVIC FRAMING REQUIRED**
Key figures and events (frame through constitutional rights, voter registration, federal enforcement):
- Medgar Evers: NAACP field secretary in Mississippi, organized voter registration drives, assassinated June 12, 1963. First Black man to be buried at Arlington National Cemetery with full military honors from Mississippi.
- Fannie Lou Hamer: Co-founded the Mississippi Freedom Democratic Party (MFDP). Challenged the all-white Mississippi delegation at the 1964 Democratic National Convention. Known for the phrase "I'm sick and tired of being sick and tired." Sharecropper from Sunflower County.
- James Meredith: First Black student admitted to the University of Mississippi. Enrolled October 1, 1962, under escort of federal marshals and National Guard ordered by President Kennedy. His enrollment sparked riots on campus.
- Freedom Summer 1964: Voter registration campaign in Mississippi. Civil rights workers James Chaney (Black Mississippian), Andrew Goodman, and Michael Schwerner (both white New Yorkers) were murdered by KKK members on June 21, 1964, near Philadelphia, MS. Case led to federal civil rights enforcement action.
- Emmett Till: 14-year-old Chicago boy visiting relatives in Money, MS, murdered August 28, 1955. His open-casket funeral (mother Mamie Till's decision) and the acquittal of his murderers galvanized the civil rights movement nationally. The Emmett Till Antilynching Act was signed into federal law in 2022.

**MISSISSIPPI SUPREME COURT — DISTINCTIVE NATIONALLY**
- Mississippi Supreme Court: 9 justices, elected on nonpartisan ballot to 8-year staggered terms
- Most US states appoint their supreme court justices — Mississippi elects them directly
- This elected judiciary structure is distinctive civic content worth 1-2 questions

**MISSISSIPPI LEGISLATURE**
- Bicameral: Mississippi Senate (52 members, 4-year terms) + Mississippi House of Representatives (122 members, 4-year terms)
- Legislature meets annually; regular session begins second Tuesday of January
- Lt. Governor presides over the Senate and has extraordinary power over committee assignments

**2020 FLAG CHANGE — STRICTLY CIVIC FRAMING**
- Old flag (1894 design) contained the Confederate battle emblem in the canton — was the last state flag with Confederate imagery
- Mississippi Legislature voted to change it: Senate 37-14, House 84-35
- Governor Tate Reeves signed the legislation July 1, 2020
- A commission designed the new flag (magnolia design)
- Voters ratified the new design November 3, 2020 by 72.8% approval
- New flag features: magnolia flower, 21 stars, gold cross, text "In God We Trust"
- Frame STRICTLY as a civic event: legislative process, referendum, vote margins, design features. NO editorial commentary whatsoever on the old or new design.

**RECONSTRUCTION-ERA SENATORS — NATIONAL FIRSTS**
- Hiram Revels (R-MS): First Black US Senator in American history, served 1870-1871, filled the seat previously held by Jefferson Davis
- Blanche Bruce (R-MS): Second Black US Senator, first to serve a full term (1875-1881), first Black senator to preside over the Senate
- Both represented Mississippi during Reconstruction — this is important civic history about constitutional democracy in action

**STATE-SCALE RULE: ZERO TOLERANCE**
ALL questions must be about Mississippi statewide institutions, laws, events, or history.
- Jackson: appears ONLY as the location of the state capitol. Do NOT generate questions about Jackson city government, Jackson mayor, Jackson city council, Jackson water system, or any Jackson-specific facts.
- Gulfport: Do NOT generate questions about Gulfport city government or local institutions.
- Hattiesburg: Do NOT generate questions about Hattiesburg city government or local institutions.
- Natchez: appears ONLY in statewide historical context (Natchez Trace). Do NOT generate questions about Natchez city government.
- Biloxi: Keesler AFB is acceptable as a state economic/military fact. Do NOT generate questions about Biloxi city government, Biloxi mayor, or Biloxi City Council.
- If a fact is about a city that happens to be in Mississippi, ask: "Would this belong in a future Jackson MS or Gulfport MS city collection?" If yes — cut it immediately.
- Mississippi River geography (state border, naming) = statewide → INCLUDE
- Gaming legalization (state law, 1990) = statewide → INCLUDE
- Keesler AFB as major employer/economic driver = statewide → INCLUDE with care (not Biloxi city content)

**WHAT TO SKIP**
- County government entirely — 82 counties is too granular for state scale
- Any question about a specific address, phone number, building location, or website URL
- Pop culture figures: musicians (B.B. King, Robert Johnson, Elvis Presley connection), athletes, actors — UNLESS they have an explicit civic leadership role
- US Senators or US Representatives — federal subjects only
- Questions about specific university athletics or university governance
- Any question that is about a Mississippi city's local government

**GEOGRAPHY FACTS TO INCLUDE**
- Mississippi River forms Mississippi's entire western border AND the state is named after the river
- Mississippi Delta: the fertile agricultural region between the Mississippi and Yazoo rivers (not the river delta)
- Gulf Coast: 44 miles of coastline
- Natchez Trace: 444-mile historic parkway, NPS-administered, runs from Natchez MS to Nashville TN
- Highest point: Woodall Mountain at 806 feet — Mississippi has the lowest high point of any US state (distinctive trivia)

**ECONOMY FACTS TO INCLUDE**
- Catfish aquaculture: Mississippi produces the majority of US farm-raised catfish (Delta region)
- Gaming: legalized 1990 (state law); Tunica became major casino destination; state-level policy
- Ingalls Shipbuilding (Pascagoula): largest private employer in Mississippi; builds US Navy vessels
- Camp Shelby: largest National Guard training facility in the US east of the Mississippi River
- Agriculture: soybeans (#1 crop by value), cotton, broiler chickens, corn
`;
