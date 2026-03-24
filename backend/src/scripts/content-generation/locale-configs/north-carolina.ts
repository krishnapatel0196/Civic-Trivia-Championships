import type { LocaleConfig } from './bloomington-in.js';

/**
 * North Carolina state locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - This is a STATE-level collection. Questions must cover state government, statewide landmarks,
 *   state history, and state economy ONLY. Do NOT write questions about:
 *     • Asheville city government (separate collection exists)
 *     • Charlotte, Raleigh, Greensboro, Durham, or Winston-Salem local government
 *     • Any city's mayor, council, or local departments
 *   Cities may appear ONLY as seats of state institutions (Raleigh as state capital is OK;
 *   Charlotte as a statewide banking center is OK; anything about Charlotte's city council = cut).
 *
 * - North Carolina General Assembly is bicameral: 50-member Senate + 120-member House.
 *   Both chambers serve 2-year terms. Governor has veto power; override requires 3/5 majority.
 *   Lt. Governor is UNIQUE: holds powers in BOTH executive and legislative branches — presides over
 *   NC Senate AND serves as executive officer.
 *
 * - Do NOT conflate state government with county or city government.
 * - "The Tar Heel State" is the main nickname; "The Old North State" is also used.
 * - Motto: Esse Quam Videri ("To be rather than to seem"), adopted 1893.
 * - Halifax Resolves (April 12, 1776): first official colonial authorization of independence —
 *   this is the basis for NC's "First in Freedom" tagline. Do NOT confuse with Mecklenburg
 *   Declaration of Independence (May 20, 1775 — its historicity is disputed).
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT OFFICEHOLDERS (as of 2026):
 * - Governor: Josh Stein (D), 76th Governor, sworn Jan 1, 2025; term ends Jan 1, 2029
 *   (first Jewish governor in NC history)
 * - Lt. Governor: Rachel Hunt (D), sworn Jan 1, 2025; term ends Jan 1, 2029
 * - Attorney General: Jeff Jackson (D), sworn Jan 1, 2025; term ends Jan 1, 2029
 * - Senate President Pro Tem: Sen. Phil Berger (R), 2025–2026 session (2-year GA terms)
 * - House Speaker: Rep. Destin Hall (R-Caldwell), 2025–2026 session
 * - Supreme Court Chief Justice: Paul Newby (R), elected Nov 2020
 */
export const northCarolinaConfig: LocaleConfig = {
  locale: 'north-carolina',
  name: 'North Carolina',
  externalIdPrefix: 'norca',
  collectionSlug: 'north-carolina',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'state-government',
      name: 'State Government',
      description:
        'North Carolina uses a governor-led executive branch with a bicameral General Assembly (50-member Senate + 120-member House). Both chambers serve 2-year terms. The governor may veto legislation; overrides require a three-fifths majority in both chambers. The Lieutenant Governor (Rachel Hunt, sworn Jan 1, 2025) holds a unique dual role: she presides over the NC Senate AND serves as an executive officer — the only NC elected official with powers in both branches. Gov. Josh Stein (76th governor, sworn Jan 1, 2025) is the first Jewish governor in NC history. Senate President Pro Tem Phil Berger (R) and House Speaker Destin Hall (R-Caldwell) lead their respective chambers. The NC Supreme Court has 7 justices; Chief Justice Paul Newby (R). Do NOT write questions about city/county government. Focus on: General Assembly structure, governor powers, term lengths, current officeholders, how veto override works.',
    },
    {
      slug: 'state-history',
      name: 'State History',
      description:
        'NC became the 12th state on November 21, 1789, after initially rejecting ratification in 1788 over the absence of a Bill of Rights. The Halifax Resolves (April 12, 1776) were the first official colonial authorization of independence — passed unanimously by 83 delegates at Halifax — the origin of "First in Freedom." Roanoke Island (1587): Virginia Dare was the first English child born in the Americas; the colony vanished, leaving only the word "CROATOAN" carved on a post. The Wright Brothers made the first powered flight at Kill Devil Hills on December 17, 1903 (first flight: 12 seconds, 120 feet; longest: 59 seconds, 852 feet). Three presidents were born in NC: Andrew Jackson (7th), James K. Polk (11th, born Mecklenburg County), Andrew Johnson (17th, born Raleigh). The Greensboro lunch counter sit-ins (1960) were a pivotal Civil Rights moment. Focus on: Halifax Resolves, Roanoke Colony, statehood date, Wright Brothers flight, NC-born presidents, Greensboro 1960.',
    },
    {
      slug: 'landmarks-geography',
      name: 'Landmarks & Geography',
      description:
        'NC has three physiographic regions: Coastal Plain (~45% of land), Piedmont (central), and Mountains (west). Mount Mitchell at 6,684 feet is the highest peak east of the Mississippi River; located in the Black Mountains, Yancey County; Mount Mitchell State Park was NC\'s first state park. Cape Hatteras Lighthouse: 198 feet tall — tallest brick lighthouse in the US; black-and-white spiral pattern; area known as the "Graveyard of the Atlantic"; the lighthouse was moved 2,900 feet inland in 1999. Blue Ridge Parkway: 469 miles total (252 miles in NC); most visited unit in the entire National Park System since 1946; no entrance fee. Great Smoky Mountains National Park: most visited national park in the US; straddles NC/TN border; no entrance fee. Cape Hatteras National Seashore: first protected national seashore in the US. The Outer Banks: barrier islands separating the Atlantic from inland sounds; Pamlico Sound is the largest lagoonal estuary on the US East Coast. Raleigh has been state capital since 1792. Focus on: Mount Mitchell, Cape Hatteras Lighthouse, Blue Ridge Parkway, Great Smokies, Outer Banks geography. Do NOT write about Asheville city landmarks (separate collection).',
    },
    {
      slug: 'economy-innovation',
      name: 'Economy & Innovation',
      description:
        'Research Triangle Park (RTP): founded 1959; approximately 7,000 acres; located between Raleigh, Durham, and Chapel Hill; named for the triangle formed by NC State, UNC-Chapel Hill, and Duke University; ~385 companies, ~35,000 employed in life sciences. NC historically built its economy on the "three-legged stool" of tobacco, textiles, and furniture. High Point hosts the World Market Center — the world\'s largest furniture trade show (twice annual). Charlotte is the 2nd-largest banking center in the United States, after New York City; home to Bank of America HQ and Truist Financial HQ. SAS Institute (headquartered in Cary) is the world\'s largest privately held software company. NC is #1 in the US in sweet potato production and turkey production. Fort Bragg (formerly Fort Liberty, renamed Feb 2025 for WWII hero Pfc. Roland L. Bragg) covers 251 square miles near Fayetteville — the largest US Army installation by land area; home to the 82nd Airborne Division. Focus on: RTP founding, "three-legged stool" industries, Charlotte banking, High Point furniture, NC agriculture rankings, Fort Bragg/82nd Airborne.',
    },
    {
      slug: 'state-symbols-culture',
      name: 'State Symbols & Culture',
      description:
        'Official state symbols: bird = Northern Cardinal (1943); flower = Dogwood blossom (1941); tree = Longleaf Pine (1963); gemstone = Emerald; dog = Plott Hound; shell = Scotch bonnet; vegetable = Sweet potato; beverage = Milk; reptile = Eastern box turtle; rock = Granite; motto = Esse Quam Videri ("To be rather than to seem"), adopted 1893. Nicknames: "The Tar Heel State" and "The Old North State." The Tar Heel origin story is disputed — most likely refers to Civil War soldiers who "stuck to their ground like they had tar on their heels." State flag adopted 1885: blue union with two dates (May 20, 1775 and April 12, 1776), gold stars, NC initial; fly divided into red and white horizontal bars. Dolley Madison (First Lady, James Madison) was born in Guilford County, NC. Billy Graham born in Charlotte, 1918. Virginia Dare: first English child born in Americas (Roanoke Island, 1587). Focus on: state symbols, motto, nickname origins, flag elements, notable NC-born figures of statewide significance.',
    },
    {
      slug: 'education-military',
      name: 'Education & Military',
      description:
        'UNC Chapel Hill: chartered December 11, 1789; first student arrived February 12, 1795; the oldest public university in the United States to admit students and grant degrees in the 18th century; Old East building is the oldest state university building in the nation. NC State University (Raleigh): founded 1887; land-grant institution; largest university in NC (~38,000 students); home to Wilson College of Textiles — the only dedicated textiles college in the US and #1 ranked nationally. Duke University (Durham): private; founded 1838 as Brown\'s Schoolhouse; renamed Duke in 1924 when James B. Duke endowed it; US News 2026 ranking: #7 national universities; Duke Lemur Center: world\'s largest sanctuary for rare primates. Wake Forest University: founded 1834; relocated to Winston-Salem 1956. Fort Bragg (near Fayetteville): 251 sq miles; home to 82nd Airborne Division and US Army Special Operations Command; renamed Fort Liberty in 2023, then renamed back to Fort Bragg in February 2025 honoring WWII hero Pfc. Roland L. Bragg. Focus on: UNC founding facts, NC State land-grant status, Duke endowment story, Fort Bragg history and renaming.',
    },
  ],

  topicDistribution: {
    'state-government': 22,
    'state-history': 18,
    'landmarks-geography': 20,
    'economy-innovation': 15,
    'state-symbols-culture': 12,
    'education-military': 13,
  },

  officeholders: [
    {
      name: 'Josh Stein',
      role: 'Governor',
      termEnd: '2029-01-01T00:00:00Z',
    },
    {
      name: 'Rachel Hunt',
      role: 'Lieutenant Governor',
      termEnd: '2029-01-01T00:00:00Z',
    },
    {
      name: 'Jeff Jackson',
      role: 'Attorney General',
      termEnd: '2029-01-01T00:00:00Z',
    },
    {
      name: 'Phil Berger',
      role: 'Senate President Pro Tempore',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'Destin Hall',
      role: 'House Speaker',
      termEnd: '2026-12-01T00:00:00Z',
    },
    {
      name: 'Paul Newby',
      role: 'Supreme Court Chief Justice',
      termEnd: '2028-12-01T00:00:00Z',
    },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/North_Carolina',
    'https://en.wikipedia.org/wiki/North_Carolina_General_Assembly',
    'https://en.wikipedia.org/wiki/Governor_of_North_Carolina',
    'https://en.wikipedia.org/wiki/Halifax_Resolves',
    'https://en.wikipedia.org/wiki/Roanoke_Colony',
    'https://en.wikipedia.org/wiki/Wright_Brothers_National_Memorial',
    'https://en.wikipedia.org/wiki/North_Carolina_State_Capitol',
    'https://en.wikipedia.org/wiki/Cape_Hatteras_Lighthouse',
    'https://en.wikipedia.org/wiki/Blue_Ridge_Parkway',
    'https://en.wikipedia.org/wiki/Mount_Mitchell',
    'https://en.wikipedia.org/wiki/Research_Triangle_Park',
    'https://en.wikipedia.org/wiki/University_of_North_Carolina_at_Chapel_Hill',
    'https://en.wikipedia.org/wiki/Duke_University',
    'https://en.wikipedia.org/wiki/Fort_Bragg_(North_Carolina)',
  ],
};
