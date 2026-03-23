import type { LocaleConfig } from './bloomington-in.js';

/**
 * Springfield, MO locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Springfield uses a Council-Manager form of government. The mayor is chairman
 *   of the city council but is NOT the chief executive — that role belongs to the
 *   appointed City Manager (David Cameron, sworn in July 2025).
 * - The city council has 8 members: 4 General Seats (A–D) and 4 Zone seats (1–4).
 *   Total council including mayor = 9.
 * - Do NOT confuse Greene County government with Springfield city government.
 *   Springfield is the county seat of Greene County, but county services belong
 *   to a separate elected county government.
 * - Springfield is Missouri's THIRD-largest city (not second). Kansas City and
 *   St. Louis are larger.
 * - Route 66 "birthplace" claim: the number "66" was proposed via telegram from
 *   Springfield on April 30, 1926 — but official federal approval came November 11, 1926.
 *   Use "birthplace" carefully; some sources dispute it.
 * - Wilson's Creek National Battlefield is technically located near Republic, MO
 *   (southwest of Springfield), not within Springfield city limits.
 * - Missouri State University is Springfield's major public university, not
 *   "University of Missouri – Springfield" (no such institution exists).
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 * - Cap Bass Pro Shops questions at 4; it dominates other topics otherwise.
 *
 * CURRENT OFFICEHOLDERS (verify before activating):
 * - Mayor: Jeff Schrag (elected April 2025; 4-year term, ~expires 2029-04-30)
 * - City Manager: David Cameron (appointed, sworn in July 2025)
 * - Council – General Seat A: Heather Hardinger
 * - Council – General Seat B: Craig Hosmer
 * - Council – General Seat C: Callie Carroll
 * - Council – General Seat D: Derek Lee
 * - Council – Zone 1: Monica Horton
 * - Council – Zone 2: Abe McGull
 * - Council – Zone 3: Brandon Jenson
 * - Council – Zone 4: Bruce Adib-Yazdi
 * - U.S. Rep. (District 7): Eric Burlison (elected 2022)
 */
export const springfieldMoConfig: LocaleConfig = {
  locale: 'springfield-mo',
  name: 'Springfield, MO',
  externalIdPrefix: 'sprmo',
  collectionSlug: 'springfield-mo',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description:
        'Springfield operates under a Council-Manager form of government. The city council has 9 members total: the mayor plus 4 General Seats (A–D) and 4 Zone representatives (Zones 1–4). All are elected non-partisan on 4-year terms. The city manager — not the mayor — serves as chief executive. Jeff Schrag was elected mayor in April 2025. David Cameron was sworn in as city manager in July 2025. The city charter was adopted in 1951; a 2024 amendment extended the mayoral term to 4 years. Write questions about: government structure, the role of city manager vs. mayor, council composition, how elections work, the charter, city departments.',
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description:
        'Springfield was founded in 1829 when John Polk Campbell carved his initials in an ash tree. William Fulbright settled at Fulbright Spring in 1830. The town site was platted in 1835 when Campbell donated 50 acres including 2 acres for a public square. It was incorporated in March 1838. Springfield is the county seat of Greene County, established January 2, 1833 and named for Revolutionary War General Nathanael Greene. Write questions about: founding figures (Campbell, Fulbright), incorporation date, Greene County, the public square, the first courthouse (1837), Trail of Tears passing through in 1838.',
    },
    {
      slug: 'civil-war',
      name: 'Civil War & Wilson\'s Creek',
      description:
        'The Battle of Wilson\'s Creek on August 10, 1861 was the first major Civil War battle west of the Mississippi River. Union forces (~5,400 troops) under Brigadier General Nathaniel Lyon fought Confederate forces (~12,000) under Generals Benjamin McCulloch and Sterling Price. General Lyon became the first Union general killed in the Civil War at this battle. Casualties: ~1,317 Union, ~1,222 Confederate. The Battle of Springfield occurred in January 1863 when Confederate General John S. Marmaduke advanced toward the town square before withdrawing. Springfield remained under Union control from 1863. Wilson\'s Creek National Battlefield is located near Republic, MO; became an NPS unit in 1960; features 1,750 acres and the 1852 Ray House.',
    },
    {
      slug: 'route-66',
      name: 'Route 66 Heritage',
      description:
        'Springfield claims to be the "Birthplace of Route 66." On April 30, 1926, a telegram proposing the number "66" was sent from the Colonial Hotel in Springfield by A.H. Piepmeier and Cyrus Avery. The route received official federal approval on November 11, 1926. John T. Woodruff, a Springfield attorney, became the first president of the US Highway 66 Association (founded 1927). Route 66 across Missouri was completely paved by 1931; I-44 replaced it by 1972; Route 66 was officially decommissioned in 1985. The Missouri Route 66 Association formed in 1990; the first historic Route 66 sign in Springfield was erected at Kearney and Glenstone in 1991. Write questions about: the 1926 telegram, Piepmeier and Avery, Woodruff, the decommissioning year, I-44 replacement, the 1991 sign.',
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Key Springfield landmarks: Bass Pro Shops Outdoor World (founded 1972 by Johnny Morris; started in 8 sq ft in back of his father\'s liquor store; now nearly 500,000 sq ft; Missouri\'s #1 tourist attraction drawing 4M visitors/year). Missouri State University (founded 1905 as Fourth District Normal School; renamed Missouri State University in 2005 on its 100th anniversary; second-largest university in Missouri with 23,418 students in fall 2023). Pythian Castle (1913–1914, Gothic-revival, built by Knights of Pythias; used to rehabilitate WWII soldiers; listed National Register 2009). Walnut Street Historic District (150+ structures, 13-block area, added to National Register 1985). Springfield-style cashew chicken: invented by David Leong in the 1960s (first served 1963 at Grove Supper Club); Leong was a WWII veteran who survived D-Day. Write about: Bass Pro founding, MSU history, Pythian Castle, cashew chicken inventor, Walnut Street.',
    },
    {
      slug: 'community-services',
      name: 'Community & Services',
      description:
        'Springfield operates Springfield-Branson National Airport, Dickerson Park Zoo, and over 20 city departments employing ~2,300 people. The city has earned Government Finance Officers Association awards every year since 1977. Its bond rating is Aa1. The health care sector employs 47,000–49,000 people in the metro. The economy\'s gross metropolitan product was $19.49 billion in 2021 (6.6% of Missouri\'s GSP). Springfield grew non-farm employment 6.3% from Feb 2020 to Dec 2023, outpacing Missouri\'s 2.8%. The metro area spans five counties: Greene, Christian, Webster, Polk, and Dallas. The James River flows through the area. Write questions about: the airport, zoo, bond rating, GFOA record, metro counties, economic statistics, Jordan Valley Park.',
    },
  ],

  topicDistribution: {
    'city-government': 22,
    'founding-history': 18,
    'civil-war': 15,
    'route-66': 15,
    'landmarks-culture': 20,
    'community-services': 10,
  },

  officeholders: [
    { name: 'Jeff Schrag', role: 'Mayor', termEnd: '2029-04-30T00:00:00Z' },
    { name: 'David Cameron', role: 'City Manager', termEnd: '2029-04-30T00:00:00Z' },
    { name: 'Heather Hardinger', role: 'Council Member – General Seat A', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Craig Hosmer', role: 'Council Member – General Seat B', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Callie Carroll', role: 'Council Member – General Seat C', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Derek Lee', role: 'Council Member – General Seat D', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Monica Horton', role: 'Council Member – Zone 1', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Abe McGull', role: 'Council Member – Zone 2', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Brandon Jenson', role: 'Council Member – Zone 3', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Bruce Adib-Yazdi', role: 'Council Member – Zone 4', termEnd: '2027-04-30T00:00:00Z' },
    { name: 'Eric Burlison', role: 'U.S. Representative – District 7', termEnd: '2027-01-03T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Springfield,_Missouri',
    'https://en.wikipedia.org/wiki/Battle_of_Wilson%27s_Creek',
    'https://en.wikipedia.org/wiki/Missouri_State_University',
    'https://en.wikipedia.org/wiki/Bass_Pro_Shops',
    'https://en.wikipedia.org/wiki/Walnut_Street_Historic_District_(Springfield,_Missouri)',
    'https://www.springfieldmo.gov/145/City-Council',
    'https://www.springfieldmo.gov/27/Government',
  ],
};
