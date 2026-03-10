import type { LocaleConfig } from '../bloomington-in.js';

/**
 * Oregon state configuration for civic trivia question generation.
 * Used by generate-locale-questions.ts to produce the Oregon State collection.
 *
 * CRITICAL ACCURACY NOTES:
 * - Oregon has NO elected Lt. Governor. The Secretary of State serves as ex officio Lt. Governor.
 * - The Secretary of State (Tobias Read) succeeds the Governor if the office becomes vacant.
 * - Kate Brown became Governor in 2015 via SoS succession — do NOT say Oregon had a Lt. Governor.
 * - Governor Tina Kotek (D), term ends January 2027; up for reelection November 2026.
 * - Secretary of State Tobias Read (D), term ends January 2029.
 * - Attorney General Dan Rayfield (D), term ends January 2029.
 * - State Treasurer Elizabeth Steiner (D), term ends January 2029.
 * - Legislature: bicameral, full-time, meets ANNUALLY — NOT biennially.
 * - State-only: no questions about Portland city gov, Salem city gov, or city-specific facts.
 * - MIXED DURABILITY: generate both expiring (current-officeholder) and durable questions.
 */
export const oregonStateConfig: LocaleConfig = {
  locale: 'oregon-state',
  name: 'Oregon',
  externalIdPrefix: 'ore',
  collectionSlug: 'oregon-state',
  targetQuestions: 100,
  batchSize: 25,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'Oregon State Government',
      description:
        'Oregon State Legislature and Executive Branch. Bicameral legislature: 30-member Senate (4-year staggered terms) + 60-member House (2-year terms). Annual sessions, no term limits. Governor, Secretary of State (who also serves as ex officio Lt. Governor — Oregon has NO elected Lt. Governor), Attorney General, State Treasurer. Succession structure: SoS succeeds Governor. Include current officeholders with correct expiresAt. Senate President Rob Wagner; House Speaker Julie Fahey.',
    },
    {
      slug: 'civic-innovations',
      name: 'Oregon Civic Innovations',
      description:
        "Oregon's national firsts in civic policy. Vote-by-mail (1998, Ballot Measure 60, first state to conduct all elections exclusively by mail). Bottle Bill (1971, HB 1036, first bottle deposit law in the US, original 5-cent deposit, reduced container litter 83% by 1974). Statewide land-use planning via SB100 (1973, signed by Governor Tom McCall, created LCDC and Urban Growth Boundaries, first in US). Ballot initiative process (adopted 1902 via Measure 1, Oregon was the third state to adopt it). Death with Dignity Act (effective October 27, 1997, first medical aid in dying law in the US, passed as Ballot Measure 16 in 1994). Cannabis decriminalization (Oregon first state to decriminalize cannabis possession, 1973). Cap each topic at 1–2 questions.",
    },
    {
      slug: 'history-statehood',
      name: 'Oregon History & Statehood',
      description:
        'Oregon statehood and constitutional history. Oregon Constitution adopted 1857; statehood February 14, 1859. Oregon Trail. Notable governors: Tom McCall (championed Bottle Bill and SB100); Kate Brown (succeeded via SoS succession in 2015 when Gov. Kitzhaber resigned). Oregon Supreme Court structure (7 justices, nonpartisan elections). Constitution amendment process.',
    },
    {
      slug: 'public-policy-law',
      name: 'Oregon Public Policy & Law',
      description:
        "Oregon statewide laws and policy. Oregon judiciary: Supreme Court (highest court, 7 justices), Court of Appeals (intermediate), nonpartisan judge elections. State elections administration (Secretary of State oversees elections). Oregon's 9 federally recognized tribes (count and government-to-government relations — not specific tribal governance structures). State budget and fiscal policy.",
    },
    {
      slug: 'culture-identity',
      name: 'Oregon Culture & Identity',
      description:
        "Oregon civic identity and symbols. State nickname 'the Beaver State'. State motto 'Alis Volat Propriis' (She Flies With Her Own Wings). State flag (only US state with different design on each side: state seal on obverse, beaver on reverse). Oregon's 9 federally recognized tribes (count only). Oregon State Capitol building: third capitol (first two destroyed by fires in 1855 and 1935); current building completed 1938 with PWA/New Deal funding; Art Deco/Moderne design; white Vermont marble exterior; topped by gilded bronze 'Pioneer' statue by Ulric Ellerhusen; added to National Register June 29, 1988; located in Salem.",
    },
  ],

  topicDistribution: {
    'state-government': 35,
    'civic-innovations': 20,
    'history-statehood': 15,
    'public-policy-law': 15,
    'culture-identity': 15,
  },

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Oregon',
    'https://en.wikipedia.org/wiki/Oregon_Legislative_Assembly',
    'https://en.wikipedia.org/wiki/Governor_of_Oregon',
    'https://en.wikipedia.org/wiki/Oregon_State_Capitol',
    'https://en.wikipedia.org/wiki/Constitution_of_Oregon',
    'https://en.wikipedia.org/wiki/Vote-by-mail_in_Oregon',
    'https://en.wikipedia.org/wiki/Oregon_Bottle_Bill',
    'https://en.wikipedia.org/wiki/Oregon_Land_Conservation_and_Development_Act_of_1973',
    'https://en.wikipedia.org/wiki/Oregon_Death_with_Dignity_Act',
    'https://en.wikipedia.org/wiki/History_of_Initiative_%26_Referendum_in_Oregon',
    'https://en.wikipedia.org/wiki/Oregon_Secretary_of_State',
    'https://sos.oregon.gov/blue-book/Pages/state/executive/governor.aspx',
    'https://www.oregonencyclopedia.org/articles/senate_bill_100/',
  ],
};

/**
 * Oregon-specific features to inject into the state system prompt.
 * This string is passed to buildStateSystemPrompt() and serves as all voice guidance
 * for Oregon question generation. No changes to system-prompt.ts or generate-locale-questions.ts are needed.
 */
export const oregonStateFeatures = `
Oregon has several unique features in its state government that MUST be accurately represented:

**MIXED DURABILITY INSTRUCTION**
Generate a mix of durable civic facts and expiring current-officeholder questions. Both types add civic value.
- For current officeholders and time-sensitive facts, set expiresAt to the end of their current term
- For durable structural/historical/civic-innovation facts, set expiresAt: null
- "Who is the Governor of Oregon?" is an example of a compelling expiring question we WANT

**CRITICAL: NO ELECTED LT. GOVERNOR IN OREGON**
- Oregon has NO elected Lt. Governor. This is a distinctive and important civic fact.
- The Oregon Secretary of State serves as ex officio Lt. Governor by law.
- The Secretary of State succeeds the Governor if the office becomes vacant.
- Kate Brown became Governor in February 2015 via this succession path when Governor Kitzhaber resigned.
- As of 2026, no formal Lt. Governor position exists in Oregon.
- Do NOT generate questions that imply Oregon has an elected Lt. Governor.
- Do NOT mention HJR 16 (proposed constitutional amendment to add Lt. Gov) — it is speculative.
- This no-Lt.-Gov structure is EXCELLENT trivia material and should generate at least 1-2 questions.

**CURRENT OFFICEHOLDERS (set expiresAt correctly)**
- Governor Tina Kotek (D) — term ends January 2027; up for reelection November 2026 -> expiresAt: "2027-01-20T00:00:00Z"
- Secretary of State Tobias Read (D) — term ends January 2029 -> expiresAt: "2029-01-15T00:00:00Z"
- Attorney General Dan Rayfield (D) — term ends January 2029 -> expiresAt: "2029-01-15T00:00:00Z"
- State Treasurer Elizabeth Steiner (D) — term ends January 2029 -> expiresAt: "2029-01-15T00:00:00Z"
- Senate President Rob Wagner (D) — legislative leadership; term expires with legislative session -> expiresAt: "2027-01-01T00:00:00Z"
- House Speaker Julie Fahey (D) — legislative leadership -> expiresAt: "2027-01-01T00:00:00Z"

**CRITICAL: STATE-ONLY RULE**
- ALL questions must be about Oregon statewide institutions, laws, events, or history
- Portland: Do NOT generate questions about Portland city government, the Portland mayor, Portland City Council, Portland neighborhoods, Rose City, Forest Park, Willamette River bridges, or any Portland-specific facts
- Salem: appears ONLY as the location of the state capitol. Do NOT generate questions about Salem city government, Salem mayor, Salem city council, or Salem local institutions.
- Do NOT generate questions about city-specific facts that would belong in future Eugene, Bend, or Salem city collections
- If a fact is about a city that happens to be in Oregon, it does NOT belong in this collection

**OREGON LEGISLATURE**
- Bicameral: Oregon State Senate (30 members, 4-year staggered terms) + Oregon House of Representatives (60 members, 2-year terms)
- Full-time legislature that meets ANNUALLY — do NOT say biennial or only odd years
- No term limits on Oregon legislators
- Legislative building is in Salem (state capital)

**OREGON CONSTITUTION**
- Oregon's Constitution was adopted in 1857
- Oregon was admitted to the Union on February 14, 1859 (Valentine's Day statehood — distinctive trivia)
- The constitution contains the initiative, referendum, and recall processes

**OREGON'S CIVIC INNOVATIONS — each deserves 1-2 questions**

Vote-by-mail:
- Ballot Measure 60, passed in 1998
- Oregon was the FIRST state to conduct ALL elections exclusively by mail
- All registered voters automatically receive ballots; return by Election Day

Bottle Bill:
- House Bill 1036, enacted 1971
- First bottle deposit law in the United States
- Original 5-cent deposit on beer and carbonated beverage containers
- Reduced container litter by 83% by 1974
- Named after the beverage containers it targeted

Statewide land-use planning:
- Senate Bill 100, enacted 1973
- Signed by Governor Tom McCall
- Created the Land Conservation and Development Commission (LCDC)
- Established Urban Growth Boundaries (UGBs) around cities
- First statewide land-use planning law in the US

Ballot initiative process:
- Adopted 1902 via Measure 1
- Oregon was the THIRD state to adopt the ballot initiative process
- "Oregon System" became a model for direct democracy

Death with Dignity Act:
- Effective October 27, 1997
- First medical aid in dying law in the United States
- Passed originally as Ballot Measure 16 in November 1994
- Allows terminally ill Oregon residents to request lethal medication from physicians

Cannabis decriminalization:
- Oregon was the FIRST state to decriminalize cannabis possession (1973)
- Possession of small amounts reduced to a civil violation (not a crime)

**OREGON STATE CAPITOL**
- Oregon's THIRD capitol building (the first two were destroyed by fires in 1855 and 1935)
- Current building completed in 1938 with PWA (Public Works Administration / New Deal) funding
- Architectural style: Art Deco / Art Moderne
- Exterior: white Vermont marble
- Topped by a gilded bronze "Pioneer" statue by sculptor Ulric Ellerhusen
- Added to the National Register of Historic Places on June 29, 1988
- Located in Salem, Oregon

**OREGON STATE SYMBOLS**
- State nickname: "the Beaver State"
- State motto: "Alis Volat Propriis" (Latin: "She Flies With Her Own Wings") — adopted 1987
- State flag: the ONLY US state flag with different designs on each side
  - Obverse (front): Oregon state seal in gold on navy blue background
  - Reverse (back): a beaver (after which the state is nicknamed)
  - This two-sided design is a genuinely distinctive national trivia fact — generate this question

**OREGON TRIBAL NATIONS**
- Oregon has 9 federally recognized tribes
- Generate at most 1-2 questions about tribal presence in Oregon (count only)
- Do NOT generate questions about specific tribal governance structures, names of individual tribal leaders, or detailed tribal history
- Government-to-government relations between state and tribes are an acceptable policy topic

**WHAT TO AVOID**
- Do NOT generate questions about Portland city government, Portland mayor, Portland neighborhoods, Forest Park, Willamette River bridges, or Rose City
- Do NOT generate questions about Salem city government, Salem mayor, Salem city council
- Do NOT generate questions about Eugene city government, Bend, or other city-specific topics
- Do NOT generate questions implying Oregon has an elected Lt. Governor — it does NOT
- Do NOT mention HJR 16 (proposed Lt. Governor amendment)
- Do NOT generate questions about Oregon universities as institutions (OSU, UofO)
- Do NOT generate questions about Oregon sports teams
- Do NOT generate questions whose answer is a phone number, street address, or website URL
- Do NOT generate questions about US Senators Ron Wyden or Jeff Merkley — federal subjects only
- Apply the dinner party test: "Is this a surprising, shareable civic tidbit?" PASS: "Oregon is the only US state whose flag has a different design on each side." FAIL: "What is the Oregon Secretary of State's office address?"
`;
