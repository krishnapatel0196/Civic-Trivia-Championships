import type { LocaleConfig } from './bloomington-in.js';

/**
 * Louisiana locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Louisiana is a STATE collection — do NOT write questions about New Orleans,
 *   Baton Rouge, Shreveport, or other city-level governance. State-scale only.
 *   Test: "Could a future city collection own this question?" If yes, cut it.
 * - Louisiana uses PARISHES (not counties) — there are exactly 64 parishes.
 *   The term was adopted officially in 1807. Never say "counties."
 * - Louisiana is the ONLY U.S. state whose private law is based on civil law
 *   (French/Spanish tradition), NOT English common law.
 * - Louisiana has had 11 state constitutions; the current one was adopted 1974.
 * - The state capitol in Baton Rouge is the TALLEST state capitol in the U.S.
 *   at 450 feet / 34 stories. It has NO DOME (one of only 9 capitols without one).
 * - Do NOT confuse city of Baton Rouge services with STATE government.
 * - Do NOT write questions about city councils, mayors, or city-level elected officials.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT STATE OFFICEHOLDERS:
 * - Governor: Jeff Landry (R) — took office January 8, 2024; term ends January 10, 2028
 * - Lieutenant Governor: Billy Nungesser (R) — term ends ~January 2028
 * - Attorney General: Liz Murrill (R) — term ends January 10, 2028
 * - Secretary of State: Nancy Landry (R) — term ends January 10, 2028
 * - Senate President: Cameron Henry (R)
 * - House Speaker: Phillip DeVillier (R)
 *
 * LEGISLATURE:
 * - Senate: 39 senators, 4-year terms, 3-term limit
 * - House: 105 representatives, 4-year terms, 3-term limit
 * - Odd years: budget sessions only (45 days); Even years: general sessions (60 days)
 *
 * EXPIRATION GUIDANCE:
 * - Governor/statewide officers: expiresAt = '2028-01-10T00:00:00Z'
 * - Target 15–30% expiring questions; state collections may structurally hit a ceiling.
 */
export const louisianaConfig: LocaleConfig = {
  locale: 'louisiana',
  name: 'Louisiana',
  externalIdPrefix: 'lou',
  collectionSlug: 'louisiana',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'la-state-government',
      name: 'Louisiana State Government',
      description:
        'Covers the structure and function of Louisiana state government: governor, lieutenant governor, attorney general, secretary of state, state treasurer, commissioner of insurance. Include current officeholders with term details. Covers the Louisiana Legislature: 39-senator Senate and 105-member House of Representatives, both serving 4-year terms with 3-term limits. Legislative session calendar (odd years = budget only, 45 days; even years = general, 60 days). The Louisiana Supreme Court structure (7 justices, 10-year terms). The unique parish system (64 parishes, not counties). Do NOT include city or parish-level officials.',
    },
    {
      slug: 'la-history-founding',
      name: 'Louisiana History & Founding',
      description:
        'Covers Louisiana\'s founding and history at the state level: French colonial era (La Salle claimed Mississippi valley for France in 1682, named after King Louis XIV), Pierre Le Moyne d\'Iberville\'s Fort Maurepas (1699), Spanish colonial period (1762–1800), Louisiana Purchase (April 30, 1803, $15 million, ~828,000 sq mi from Napoleon), formal transfer at the Cabildo on December 20, 1803. Statehood on April 30, 1812 (18th state, first state west of the Mississippi). Battle of New Orleans (January 8, 1815 — Andrew Jackson defeated British). Huey Long era (governor 1928–32, senator 1932–35, assassinated in the Capitol 1935). Civil War and Reconstruction. Do NOT write questions about New Orleans, Baton Rouge, or any city\'s local history.',
    },
    {
      slug: 'la-landmarks-culture',
      name: 'Louisiana Landmarks & Culture',
      description:
        'Covers Louisiana\'s statewide cultural landmarks and traditions: the Louisiana State Capitol (450 ft, 34 stories, Art Deco, tallest state capitol in U.S., completed 1932, designed by Weiss Dreyfous and Seiferth, no dome, Huey Long is buried in the Capitol gardens). The Old State Capitol (built 1847–1852, Gothic Revival style, designed by James H. Dakin). Mardi Gras as a Louisiana state legal holiday (Mardi Gras Act signed 1875), first observed near New Orleans March 2, 1699 by Bienville. Natchitoches as the oldest permanent settlement in Louisiana (1714). St. Louis Cathedral as the oldest cathedral in continuous use in the U.S. The Governor\'s Mansion (current built 1963, inspired by Oak Alley Plantation). 54 National Historic Landmarks across the state. Keep questions at the state level — do not ask about city-specific venues or services.',
    },
    {
      slug: 'la-economy-industry',
      name: 'Louisiana Economy & Industry',
      description:
        'Covers Louisiana\'s statewide economy: energy sector (top 3 natural gas producer, top 10 crude oil producer, highest number of refineries per capita, contributes 25% of state GDP). Port of South Louisiana (largest U.S. port by tonnage, 4th largest in the world, exports 52+ million tons/year). New Orleans and South Louisiana ports handle 60% of all U.S. grain exports. Seafood industry (850+ million pounds/year, 90% of U.S. crawfish). Agriculture: rice, sugarcane, soybeans, crawfish, sweet potatoes; poultry is largest animal ag sector (~$2B/year). Healthcare is the largest employment sector (14.5% of workforce). Chemical/petroleum manufacturing leads manufacturing output. Do NOT ask about city-specific businesses or local economic development.',
    },
    {
      slug: 'la-law-legal-system',
      name: 'Louisiana Law & Legal System',
      description:
        'Covers Louisiana\'s unique legal heritage: the ONLY U.S. state whose private law is based on civil law (French/Spanish tradition, not English common law). Louisiana codified its laws in 1808, derived from a common 1800 draft (Napoleonic Code enacted March 21, 1804). Courts still consult the French Civil Code for unclear provisions. Unique doctrine of "forced heirship" (portion of estate must go to children). Louisiana has had 11 state constitutions; the current one was adopted 1974 (ratified April 20, 1974, effective January 1, 1975), has 14 articles. The parish system: 64 parishes (not counties), term adopted officially 1807, derived from French colonial ecclesiastical parishes. 38 parishes are governed by a "police jury" structure. Louisiana holds state elections in odd-numbered years not coinciding with presidential or midterm elections (e.g., 2023, 2027).',
    },
    {
      slug: 'la-symbols-nature',
      name: 'Louisiana Symbols & Nature',
      description:
        'Covers Louisiana\'s state symbols and geographic facts: state bird = Brown Pelican (nickname "The Pelican State"); state flower = Magnolia (1900); state tree = Bald Cypress (1963); state mammal = Louisiana Black Bear (formerly threatened under ESA); state dog = Louisiana Catahoula Leopard Dog (1979, named after Catahoula Parish, only dog breed native to Louisiana); state reptile = Alligator (1983); state insect = Honeybee (1977). State motto: "Union, Justice, and Confidence." State colors: Blue, White, Gold. Geography: Driskill Mountain at 535 feet is one of the lowest high points of any state; Louisiana\'s lowest point is 8 feet below sea level (2nd lowest in U.S.); 397 miles of coastline; borders Arkansas, Mississippi, Texas, Gulf of Mexico. State songs: "Give Me Louisiana" (1970) and "You Are My Sunshine" (1977). Total area: 51,843 sq mi (31st largest). Population ~4.6 million.',
    },
  ],

  topicDistribution: {
    'la-state-government': 20,
    'la-history-founding': 20,
    'la-landmarks-culture': 18,
    'la-economy-industry': 13,
    'la-law-legal-system': 17,
    'la-symbols-nature': 12,
  },

  officeholders: [
    { name: 'Jeff Landry', role: 'Governor', termEnd: '2028-01-10T00:00:00Z' },
    { name: 'Billy Nungesser', role: 'Lieutenant Governor', termEnd: '2028-01-10T00:00:00Z' },
    { name: 'Liz Murrill', role: 'Attorney General', termEnd: '2028-01-10T00:00:00Z' },
    { name: 'Nancy Landry', role: 'Secretary of State', termEnd: '2028-01-10T00:00:00Z' },
    { name: 'Cameron Henry', role: 'Senate President', termEnd: '2028-01-10T00:00:00Z' },
    { name: 'Phillip DeVillier', role: 'House Speaker', termEnd: '2028-01-10T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Louisiana',
    'https://en.wikipedia.org/wiki/Government_of_Louisiana',
    'https://en.wikipedia.org/wiki/Louisiana_State_Capitol',
    'https://en.wikipedia.org/wiki/Huey_Long',
    'https://en.wikipedia.org/wiki/Louisiana_Purchase',
    'https://en.wikipedia.org/wiki/Battle_of_New_Orleans',
    'https://en.wikipedia.org/wiki/Mardi_Gras',
    'https://en.wikipedia.org/wiki/Jeff_Landry',
  ],
};
