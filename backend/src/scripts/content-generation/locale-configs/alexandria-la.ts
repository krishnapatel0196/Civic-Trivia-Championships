import type { LocaleConfig } from './bloomington-in.js';

/**
 * Alexandria, LA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Alexandria is an independent city AND the seat of Rapides Parish — do NOT conflate
 *   city services with parish services. The Mayor governs the city; the Rapides Parish
 *   Police Jury governs parish-level functions.
 * - Do NOT confuse Alexandria with nearby Pineville (across the Red River) or with
 *   the larger "CenLA" metro area. Questions must be scoped to the City of Alexandria.
 * - Government structure: mayor-council system. Mayor + 5 district council members +
 *   2 at-large council members = 7 elected legislators total.
 * - Economy questions: focus on current employers (P&G, Weyerhaeuser, Roy O. Martin,
 *   BASF, Union Tank Car) and England Airpark — not Fort Polk (outside city limits).
 * - History: keep to 1–2 questions on Civil War burning, 1–2 on WWII maneuvers.
 *   Do not write a "history test" — civic present is the focus.
 * - ALL officeholder questions MUST have expiresAt set.
 * - No addresses or phone numbers in answer options (quality rule).
 *
 * CURRENT OFFICEHOLDERS (verify before writing expiring questions):
 * - Mayor: Jacques M. Roy (4th term, started Dec 5, 2022, term ~ends Dec 2026)
 * - City Council: 5 district members + 2 at-large (Council President: Cynthia Perry)
 *   Known members: Malcolm Larvadain, Jules Green, Gary Johnson, Chuck Fowler,
 *   Lizzie Felter (District 4), Jim Villard, Reddex Washington
 * - State House District 26: Ed Larvadain III (D), eligible through 2028 term
 *
 * EXPIRING QUESTION GUIDANCE:
 * - Mayor Roy's term ends Dec 2026 → expiresAt: '2026-12-05T00:00:00Z'
 * - State House rep eligible through 2028 → expiresAt: '2028-01-01T00:00:00Z'
 * - Aim for 15–30% of questions expiring (council members + mayor = ~10 questions)
 */
export const alexandriaLaConfig: LocaleConfig = {
  locale: 'alexandria-la',
  name: 'Alexandria, LA',
  externalIdPrefix: 'alxla',
  collectionSlug: 'alexandria-la',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description:
        'Alexandria operates under a mayor-council system with a directly elected mayor ' +
        'and seven council members (5 district + 2 at-large). Write questions about the ' +
        'council structure, how many members, what the at-large seats represent, term lengths, ' +
        'and current leadership. Include questions on Mayor Jacques Roy — his current term, ' +
        'how many terms he has served, and what office he leads. Cover the City Clerk, City ' +
        'Court, and the AlexConnects app (city service request platform). Do NOT write about ' +
        'Rapides Parish Police Jury — that is parish government, not city government.',
    },
    {
      slug: 'local-services',
      name: 'Local Services & Community',
      description:
        'Cover the services the City of Alexandria directly provides to residents: parks and ' +
        'recreation, the Alexandria Public Library system, public utilities, water/sewer, ' +
        'solid waste collection, the Alexandria Fire Department, and the Alexandria Police ' +
        'Department. Include questions about Bringhurst Park (oldest city park), the ' +
        'Coughlin-Saunders Performing Arts Center, the Hearn Stage, the Riverfront ' +
        'Amphitheater, and the Rapides Parish Coliseum (major event venue serving the city). ' +
        'Demographics: ~43,000 residents; metro area ~164,000. Do NOT include parish-level ' +
        'services or county-equivalent functions.',
    },
    {
      slug: 'economy-development',
      name: 'Economy & Development',
      description:
        'Alexandria\'s economy is anchored by manufacturing, healthcare, retail, timber, ' +
        'and education. Major employers to feature: Procter & Gamble (manufacturing), ' +
        'Weyerhaeuser (timber/paper), Roy O. Martin Company (lumber), BASF (chemicals), ' +
        'Union Tank Car (rail equipment). England Airpark — the redeveloped former England ' +
        'Air Force Base — is now home to Alexandria International Airport (AEX), Louisiana ' +
        'State University Health Sciences Center, and 2,000+ jobs across aviation, ' +
        'manufacturing, and commercial tenants. The Port of Alexandria on the Red River ' +
        'was established via the Red River Waterway Project. MacArthur Drive is the major ' +
        'commercial corridor. Ask about airport code AEX, England Airpark history, and ' +
        'which major manufacturers operate here.',
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description:
        'Notable landmarks: Hotel Bentley (1908, Renaissance-style, built by timber baron ' +
        'Joseph Bentley, National Register of Historic Places 1979, WWII generals\' HQ), ' +
        'Alexandria Museum of Art (founded 1977, in the 1898 Rapides Bank Building on the ' +
        'Red River, National Historic Register), Kent House (~1796, built by Pierre Baillio II ' +
        'on original Spanish land grant, oldest standing structure in Central Louisiana), ' +
        'St. Francis Xavier Cathedral (sole structure to survive the 1864 Union burning). ' +
        'KALB-TV launched September 29, 1954 ("Know Alexandria Louisiana Better"). ' +
        'The city\'s motto/nickname is "Heart of Louisiana." Write about what makes each ' +
        'landmark significant — when built, by whom, what it\'s used for today.',
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description:
        'Keep history focused on civic context, not a history exam. Key facts: Alexander ' +
        'Fulton laid out the town in 1805 on a Spanish land grant he received in 1785; ' +
        'incorporated March 18, 1819; city charter from the Louisiana Legislature in 1832. ' +
        'The city name origin is disputed — named after Fulton himself or his infant daughter. ' +
        'The Red River rapids ("Rapides") made Alexandria the natural head of navigation for ' +
        'half the year, creating a transshipment hub that drove early commerce. Rapides Parish ' +
        'is named after these rapids. The 1864 Civil War burning destroyed ~90% of the city ' +
        '(Lt. Col. Joseph Bailey\'s engineering feat — Bailey\'s Dam — saved stranded Union ' +
        'gunboats). Limit to 2 questions on Civil War and 2 on WWII Louisiana Maneuvers ' +
        '(500,000 troops, Generals Patton/Eisenhower/Bradley). England AFB renamed 1955 for ' +
        'Lt Col John Brooke England; closed 1992.',
    },
    {
      slug: 'red-river-geography',
      name: 'Red River & Geography',
      description:
        'Alexandria sits at almost the exact geographic center of Louisiana on the Red River, ' +
        'at 55 feet elevation. The Red River rapids historically limited upstream navigation, ' +
        'making Alexandria the cargo transshipment point. Rapides Parish (named after the ' +
        'rapids) is the parish Alexandria seats. The city is the largest in Central Louisiana ' +
        '("CenLA"). Pineville is the separate city directly across the Red River. The ' +
        'Red River Waterway Project (authorized 1968) established the Port of Alexandria ' +
        'and opened year-round commercial navigation. Write about the river\'s role in ' +
        'commerce, the parish name origin, Alexandria\'s position as geographic center of ' +
        'Louisiana, and the relationship between the city and the surrounding region.',
    },
  ],

  topicDistribution: {
    'city-government': 22,
    'local-services': 20,
    'economy-development': 18,
    'landmarks-culture': 17,
    'founding-history': 13,
    'red-river-geography': 10,
  },

  officeholders: [
    {
      name: 'Jacques M. Roy',
      role: 'Mayor',
      termEnd: '2026-12-05T00:00:00Z',
    },
    {
      name: 'Cynthia Perry',
      role: 'City Council President',
      termEnd: '2026-12-05T00:00:00Z',
    },
    {
      name: 'Ed Larvadain III',
      role: 'Louisiana State House Representative, District 26',
      termEnd: '2028-01-01T00:00:00Z',
    },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Alexandria,_Louisiana',
    'https://en.wikipedia.org/wiki/Hotel_Bentley',
    'https://en.wikipedia.org/wiki/Kent_House',
    'https://en.wikipedia.org/wiki/England_Air_Force_Base',
    'https://en.wikipedia.org/wiki/Rapides_Parish,_Louisiana',
    'https://www.cityofalexandriala.com/office-mayor',
    'https://www.alexandria-louisiana.com/alexandria-louisiana-history.htm',
  ],
};
