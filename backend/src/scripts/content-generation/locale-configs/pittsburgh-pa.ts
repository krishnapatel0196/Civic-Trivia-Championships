import type { LocaleConfig } from './bloomington-in.js';

/**
 * Pittsburgh, PA locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Pittsburgh is a "City of the Second Class" under Pennsylvania law — do NOT
 *   attribute Allegheny County services (county executive, county council) to
 *   Pittsburgh city government. They are separate jurisdictions.
 * - Pittsburgh uses a STRONG-MAYOR system, NOT council-manager.
 * - The three rivers are: Allegheny (north), Monongahela (south), Ohio (west).
 *   They meet at "The Point" — Point State Park.
 * - Do NOT confuse Carnegie Mellon University with the University of Pittsburgh;
 *   both are in the Oakland neighborhood.
 * - No addresses or phone numbers in answer options (quality rule).
 * - No political party labels (Democrat, Republican, etc.) in any field.
 *
 * CURRENT OFFICEHOLDERS (as of 2026-03-25):
 * - Mayor: Corey O'Connor (62nd mayor, took office Jan 5, 2026; term ends ~Jan 2030)
 * - City Controller: Rachael Heisler (term ends Jan 3, 2028)
 * - Council President: R. Daniel Lavelle (District 6; term ends Jan 7, 2030)
 * - District 1: Bobby Wilson (term ends Jan 3, 2028)
 * - District 2: Kim Salinetro (term ends Jan 7, 2030)
 * - District 3: Robert Charland III (term ends Jan 3, 2028)
 * - District 4: Anthony Coghill (term ends Jan 7, 2030)
 * - District 5: Barbara Warwick (term ends Jan 3, 2028)
 * - District 7: Deborah Gross (term ends Jan 3, 2028)
 * - District 8: Erika Strassburger (term ends Jan 7, 2030)
 * - District 9: Khari Mosley (term ends Jan 3, 2028)
 *
 * EXPIRATION GUIDANCE:
 * - Mayor term: 4 years; Corey O'Connor's term expires ~Jan 2030
 * - Controller term: 4 years; Rachael Heisler expires Jan 3, 2028
 * - Council terms: 4 years; staggered (odd districts expire 2028, even 2030)
 * - All officeholder questions MUST have expiresAt set
 */
export const pittsburghPaConfig: LocaleConfig = {
  locale: 'pittsburgh-pa',
  name: 'Pittsburgh, PA',
  externalIdPrefix: 'pitpa',
  collectionSlug: 'pittsburgh-pa',
  targetQuestions: 130,
  batchSize: 25,
  overshootFactor: 1.4,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: `Pittsburgh operates under a strong-mayor system with a nine-member city council
      elected from nine districts. The mayor serves 4-year terms and appoints the police chief
      with council approval. The city is classified as a "City of the Second Class" under
      Pennsylvania law (Title 53). The Pittsburgh Intergovernmental Cooperation Authority is the
      state-appointed financial oversight body. Do NOT conflate with Allegheny County government.
      All officeholder questions must have expiresAt set.`,
    },
    {
      slug: 'founding-history',
      name: 'Founding & History',
      description: `Pittsburgh's civic history begins with the French and Indian War. Fort Duquesne
      was built by the French in 1754; the British captured it and built Fort Pitt in 1758.
      Pittsburgh was incorporated as a borough in 1794 and as a city in 1816. The post-WWII
      Pittsburgh Renaissance cleaned the air and modernized the city. Pittsburgh hosted the G20
      Summit in 2009. The Fort Pitt Blockhouse (built 1764) is the oldest authenticated structure
      in Western Pennsylvania. Focus on civic milestones, not just steel industry.`,
    },
    {
      slug: 'landmarks-culture',
      name: 'Landmarks & Culture',
      description: `Key landmarks: Point State Park (36 acres, fountain sprays 150 ft, opened 1974),
      Duquesne Incline (opened 1877, scales Mount Washington, 400 ft climb, 5-foot gauge track),
      Phipps Conservatory (opened 1893, donated by Henry Phipps Jr., located in Schenley Park),
      U.S. Steel Tower (841 ft, tallest building), Cathedral of Learning (42 stories, 535 ft,
      University of Pittsburgh, 31 Nationality Rooms, Late Gothic Revival, architect Charles Klauder).
      The Smithfield Street Bridge (1883) is the oldest in-service bridge and a National Historic Landmark.`,
    },
    {
      slug: 'bridges-geography',
      name: 'Bridges & Geography',
      description: `Pittsburgh has approximately 446 bridges — earning the nickname "City of Bridges."
      Three rivers: Allegheny (north), Monongahela (south), Ohio (west, formed at The Point).
      The Three Sisters are three identical self-anchored suspension bridges over the Allegheny:
      Roberto Clemente, Andy Warhol, and Rachel Carson bridges. Pittsburgh has 90 official
      neighborhoods. Downtown is called the Golden Triangle (shaped by the rivers). The Oakland
      neighborhood is the institutional hub. City official colors are black and gold.`,
    },
    {
      slug: 'economy-industry',
      name: 'Economy & Industry',
      description: `Pittsburgh was the global center of steel production in the late 19th and early
      20th centuries. Andrew Carnegie founded Carnegie Steel Company; it was later sold and became
      U.S. Steel. Henry Phipps Jr. was Carnegie's business partner. Today, Pittsburgh's economy
      is dominated by healthcare, education, and technology. The city hosts 10 Fortune 500 companies
      and federal centers for robotics, cyber defense, and energy research. Population: ~307,668
      (2024 est.), 67th largest U.S. city, 2nd largest in Pennsylvania.`,
    },
    {
      slug: 'arts-education',
      name: 'Arts & Education',
      description: `Carnegie Museums of Pittsburgh operates four museums: Carnegie Museum of Natural
      History, Carnegie Museum of Art, Andy Warhol Museum, and Carnegie Science Center (most visited
      in Pittsburgh). The Andy Warhol Museum (opened 1994, North Shore, 7 floors, 17 galleries) is
      the largest single-artist museum in North America. Andy Warhol was born in Pittsburgh.
      Carnegie Natural History Museum holds over 20 million objects. The Carnegie complex in Oakland
      was built in 1895. University of Pittsburgh (Pitt) is in Oakland neighborhood.`,
    },
    {
      slug: 'community-neighborhoods',
      name: 'Community & Neighborhoods',
      description: `Pittsburgh has 90 official neighborhoods. Notable ones: Squirrel Hill (large
      Jewish community, site of 2018 Tree of Life synagogue shooting), Shadyside, Lawrenceville
      (Lower and Upper), Oakland (institutional hub — Pitt, CMU, UPMC), South Side (near Duquesne
      Incline), North Shore (PNC Park, Warhol Museum). Pittsburgh History & Landmarks Foundation
      (founded 1964) has placed over 500 historic plaques. The "Paris of Appalachia" nickname
      reflects cultural richness. Pittsburgh Regional Transit operates public transit.`,
    },
  ],

  topicDistribution: {
    'city-government': 20,
    'founding-history': 14,
    'landmarks-culture': 20,
    'bridges-geography': 12,
    'economy-industry': 13,
    'arts-education': 13,
    'community-neighborhoods': 8,
  },

  officeholders: [
    { name: 'Corey O\'Connor', role: 'Mayor', termEnd: '2030-01-06T00:00:00Z' },
    { name: 'Rachael Heisler', role: 'City Controller', termEnd: '2028-01-03T00:00:00Z' },
    { name: 'R. Daniel Lavelle', role: 'City Council President / District 6', termEnd: '2030-01-07T00:00:00Z' },
    { name: 'Bobby Wilson', role: 'City Council District 1', termEnd: '2028-01-03T00:00:00Z' },
    { name: 'Kim Salinetro', role: 'City Council District 2', termEnd: '2030-01-07T00:00:00Z' },
    { name: 'Robert Charland III', role: 'City Council District 3', termEnd: '2028-01-03T00:00:00Z' },
    { name: 'Anthony Coghill', role: 'City Council District 4', termEnd: '2030-01-07T00:00:00Z' },
    { name: 'Barbara Warwick', role: 'City Council District 5', termEnd: '2028-01-03T00:00:00Z' },
    { name: 'Deborah Gross', role: 'City Council District 7', termEnd: '2028-01-03T00:00:00Z' },
    { name: 'Erika Strassburger', role: 'City Council District 8', termEnd: '2030-01-07T00:00:00Z' },
    { name: 'Khari Mosley', role: 'City Council District 9', termEnd: '2028-01-03T00:00:00Z' },
  ],

  sourceUrls: [
    'https://en.wikipedia.org/wiki/Pittsburgh',
    'https://en.wikipedia.org/wiki/Pittsburgh_City_Council',
    'https://en.wikipedia.org/wiki/Corey_O%27Connor',
    'https://en.wikipedia.org/wiki/Point_State_Park',
    'https://en.wikipedia.org/wiki/Duquesne_Incline',
    'https://en.wikipedia.org/wiki/Cathedral_of_Learning',
    'https://en.wikipedia.org/wiki/Carnegie_Museums_of_Pittsburgh',
    'https://en.wikipedia.org/wiki/Andy_Warhol_Museum',
    'https://en.wikipedia.org/wiki/Fort_Pitt_Blockhouse',
    'https://en.wikipedia.org/wiki/Phipps_Conservatory_and_Botanical_Gardens',
    'https://en.wikipedia.org/wiki/Pittsburgh_bridges',
    'https://en.wikipedia.org/wiki/Government_of_Pittsburgh',
  ],
};
