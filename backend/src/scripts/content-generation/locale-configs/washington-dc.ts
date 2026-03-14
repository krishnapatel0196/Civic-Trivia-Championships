import type { LocaleConfig } from './bloomington-in.js';

/**
 * Washington, DC locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - DC is NOT a city or a state — always call it "the District" or "Washington, DC"
 * - DC Council is NOT a "city council" — it is the DC Council
 * - DC government operates under the Home Rule Charter (enacted by Congress December 24, 1973;
 *   DC voters approved May 1974 by 4-to-1 margin; 103 years without elected local government 1871-1974)
 * - DC Council: 13 members total — Chairman elected at-large + 4 at-large members + 8 ward members
 *   All members serve 4-year terms; no term limits
 * - DC Attorney General is ELECTED (since 2015, previously appointed by Mayor)
 * - John A. Wilson Building (1350 Pennsylvania Ave NW) is DC's seat of government — NOT the US Capitol
 *
 * CURRENT OFFICEHOLDERS (with expiration dates):
 * - Mayor: Muriel Bowser (not running for 4th term; expiresAt: 2027-01-02)
 * - Council Chair: Phil Mendelson (expiresAt: 2027-01-02)
 * - Attorney General: Brian Schwalb (expiresAt: 2027-01-02)
 * - Non-voting Delegate to US House: Eleanor Holmes Norton (serving since 1991, retiring 2026;
 *   expiresAt: 2027-01-03 — can vote in committee but NOT on floor)
 *
 * FORBIDDEN CONTENT — NEVER generate:
 * - Questions about the US Congress, US Supreme Court, the White House, or the President acting
 *   in federal (not DC-local) capacity — these belong in the Federal collection
 * - Questions about national monuments: Lincoln Memorial, Washington Monument, Jefferson Memorial,
 *   WWII Memorial, Smithsonian museums — these are NPS/Smithsonian and belong in Federal
 * - Questions calling DC a "city" or "state" — always "the District" or "Washington, DC"
 * - Questions about the US Capitol as DC's civic landmark (Wilson Building is DC City Hall)
 * - Questions confusing the federal Attorney General with the DC Attorney General
 * - Questions stating DC judges are elected or appointed by the Mayor
 *   (ALL DC judges are presidentially appointed and Senate-confirmed)
 * - Questions referencing website navigation structure ("Which section of dc.gov...")
 */
export const washingtonDcConfig: LocaleConfig = {
  locale: 'washington-dc',
  name: 'Washington, DC',
  externalIdPrefix: 'wdc',
  collectionSlug: 'washington-dc',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'dc-government-structure',
      name: 'DC Government Structure',
      description: 'The DC Council (13 members: Chairman elected at-large + 4 at-large members + 8 ward members, all 4-year terms, no term limits), Mayor (executive, 4-year term), DC Attorney General (elected since 2015, previously appointed by Mayor), Home Rule Charter (Congress enacted December 24, 1973; DC voters approved May 1974 by 4-to-1 margin), 103 years without elected local government (1871-1974), Board of Commissioners predecessor, Congressional override authority (30-day review period for DC legislation). Current Mayor: Muriel Bowser (not running for 4th term, expiresAt: 2027-01-02). Current Council Chair: Phil Mendelson (expiresAt: 2027-01-02). Current AG: Brian Schwalb (expiresAt: 2027-01-02). FRAMING: NEVER call DC a "city" — always "the District" or "Washington, DC". The DC Council is NOT a "city council." The John A. Wilson Building is where the Mayor and Council work — NOT the US Capitol.',
    },
    {
      slug: 'constitutional-status',
      name: 'Constitutional Status & Voting Rights',
      description: 'Article I Section 8 Clause 17 (District Clause — Congress has exclusive legislative authority over the federal district). No voting representation in Congress: no senators, no voting House member. Non-voting Delegate to US House (can vote in committee, NOT on floor; Eleanor Holmes Norton serving since 1991, retiring 2026, expiresAt: 2027-01-03). 23rd Amendment (ratified 1961, DC gets electoral votes equal to least-populous state — currently 3; first presidential vote 1964). "Taxation Without Representation" license plate motto. DC Voting Rights Amendment (1978, passed Congress but expired 1985 without ratification). DC statehood debate (proposed name: Washington, Douglass Commonwealth, honoring Frederick Douglass; House passed statehood bill 2019 and 2021, Senate has not).',
    },
    {
      slug: 'dc-courts-judiciary',
      name: 'DC Courts & Judiciary',
      description: 'DC Superior Court (trial court, Chief Judge + 50 associate judges). DC Court of Appeals (DC\'s highest court, equivalent to a state supreme court, Chief Judge + 8 associate judges). CRITICAL: ALL DC judges are appointed by the President of the United States and confirmed by the US Senate — NOT elected, NOT appointed by the Mayor. This is a direct consequence of DC\'s federal status and is a distinguishing civic fact. Federal courts in DC (US District Court for DC, DC Circuit Court of Appeals) are NOT DC local courts — they are federal courts that happen to sit in DC.',
    },
    {
      slug: 'ward-neighborhood-structure',
      name: 'Ward & Neighborhood Structure',
      description: 'DC is divided into 8 wards, each represented by one Council member. Advisory Neighborhood Commissions (ANCs): 37 ANCs created by Home Rule Act, first elections 1975; each represents approximately 2,000 residents. ANCs are advisory — they vote on local issues but cannot pass binding laws. Ward boundaries redrawn after each decennial census. DC is also divided into quadrants (NW, NE, SE, SW) radiating from the Capitol building.',
    },
    {
      slug: 'dc-history',
      name: 'DC History',
      description: 'Capital established by Congress in 1790 (Residence Act). President Washington selected the Potomac site. Capital moved from Philadelphia in 1800. Pierre Charles L\'Enfant designed the original city plan (1791). DC created from land ceded by Maryland and Virginia; Virginia\'s portion retroceded in 1846. Marion Barry: 4-term Mayor (1979-1991, 1995-1999), DC\'s most prominent Mayor. Sharon Pratt: first Black woman elected Mayor of a major US city (1991). DC budget is subject to Congressional approval.',
    },
    {
      slug: 'dc-civic-identity',
      name: 'DC Civic Identity',
      description: 'John A. Wilson Building: DC City Hall at 1350 Pennsylvania Avenue NW, where the Mayor and DC Council work. NOT to be confused with the US Capitol. DC population approximately 700,000 (larger than Wyoming and Vermont but with no Senate representation). "Chocolate City" historical nickname (1970s). DC Public Schools (DCPS) under DC government, not federal control. DC budget process: submitted by Mayor, passed by Council, subject to Congressional appropriation review.',
    },
  ],

  topicDistribution: {
    'dc-government-structure': 30,
    'constitutional-status': 25,
    'dc-courts-judiciary': 15,
    'ward-neighborhood-structure': 10,
    'dc-history': 12,
    'dc-civic-identity': 8,
  },

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Washington,_D.C.',
    'https://en.wikipedia.org/wiki/District_of_Columbia_home_rule',
    'https://en.wikipedia.org/wiki/District_of_Columbia_Home_Rule_Act',
    'https://en.wikipedia.org/wiki/Council_of_the_District_of_Columbia',
    'https://en.wikipedia.org/wiki/Government_of_the_District_of_Columbia',
    'https://en.wikipedia.org/wiki/Mayor_of_the_District_of_Columbia',
    'https://en.wikipedia.org/wiki/Twenty-third_Amendment_to_the_United_States_Constitution',
    'https://en.wikipedia.org/wiki/District_of_Columbia_voting_rights',
    'https://en.wikipedia.org/wiki/Washington_D.C._statehood_movement',
    'https://en.wikipedia.org/wiki/District_of_Columbia_Court_of_Appeals',
    'https://en.wikipedia.org/wiki/Superior_Court_of_the_District_of_Columbia',
    'https://en.wikipedia.org/wiki/History_of_Washington,_D.C.',
    'https://en.wikipedia.org/wiki/District_of_Columbia_Delegate',
    'https://en.wikipedia.org/wiki/Advisory_Neighborhood_Commission',
  ],
};
