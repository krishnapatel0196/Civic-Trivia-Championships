import type { LocaleConfig } from './bloomington-in.js';

/**
 * Portland, OR locale configuration for civic trivia question generation.
 *
 * CRITICAL ACCURACY NOTES:
 * - Portland restructured government January 1, 2025: replaced commission form with mayor-council
 * - City Council: 12 members across 4 geographic districts, 3 councilors per district
 * - Voting method: Multi-winner ranked-choice voting (NOT "commissioner" — correct term is "councilor")
 * - Mayor Keith Wilson: Executive branch only; does NOT sit on council; term Jan 2025–Jan 2029
 * - City Administrator: Appointed by Mayor; new role from 2022 charter reform
 * - City Auditor Simone Rede: Independently elected; term Jan 2025–Jan 2029
 * - Portland City proper only — Beaverton, Gresham, etc. are NOT Portland
 *
 * COUNCIL MEMBERS BY DISTRICT:
 * - District 1 (expires Jan 2029): Candace Avalos, Jamie Dunphy, Loretta Smith
 * - District 2 (expires Jan 2029): Sameer Kanal, Elana Pirtle-Guiney, Dan Ryan
 * - District 3 (expires Jan 2027): Tiffany Koyama Lane, Angelita Morillo, Steve Novick
 * - District 4 (expires Jan 2027): Olivia Clark, Mitch Green, Eric Zimmerman
 *
 * EXPIRATION DATES:
 * - Districts 1 & 2 councilors: "2029-01-01T00:00:00Z"
 * - Districts 3 & 4 councilors: "2027-01-01T00:00:00Z"
 * - Mayor Keith Wilson: "2029-01-01T00:00:00Z"
 * - City Auditor Simone Rede: "2029-01-01T00:00:00Z"
 * - Durable structural questions: null
 */
export const portlandOrConfig: LocaleConfig = {
  locale: 'portland-or',
  name: 'Portland, OR',
  externalIdPrefix: 'por',
  collectionSlug: 'portland-or',
  targetQuestions: 100,
  batchSize: 25,
  overshootFactor: 1.5,

  topicCategories: [
    {
      slug: 'city-government',
      name: 'City Government',
      description: 'Portland city government — the 2025 mayor-council restructuring (replaced 112-year commission form), 12-member council across 4 geographic districts, multi-winner ranked-choice voting, Mayor Keith Wilson (executive role, not on council), City Administrator (new appointed executive role), City Auditor Simone Rede. Mix of structure questions (durable) and current-officeholder questions (expiring).',
    },
    {
      slug: 'civic-history',
      name: 'Civic History & Founding',
      description: 'Portland founding and name origin — 1843 land claim by Asa Lovejoy and William Overton, sold to Francis Pettygrove; 1845 coin toss naming Portland after Portland, Maine using the 1835 Portland Penny (now at Oregon Historical Society); incorporation February 8, 1851; "Stumptown" nickname from rapid post-1847 growth; Oregon statehood (February 14, 1859); Oregon Trail history.',
    },
    {
      slug: 'parks-natural',
      name: 'Parks & Natural Landmarks',
      description: "Portland's natural and park identity — Forest Park (5,100+ acres, one of the largest urban forests in US, formally dedicated September 23, 1948, Wildwood Trail, Olmsted Brothers 1903 plan), Willamette River (12 bridges, 'Bridge City'), Mount Tabor (volcanic cinder cone inside city limits), Washington Park, International Rose Test Garden (established 1917, oldest continuously operating public rose test garden in US, 7,000+ plants).",
    },
    {
      slug: 'rose-city-identity',
      name: 'Rose City Identity',
      description: "Portland's Rose City identity — first 'City of Roses' reference 1888, Portland Rose Festival (first held 1907), international reputation as a city of roses. 12 Willamette River bridges and 'Bridge City' nickname. Civic pride facts that connect Portlanders to their city.",
    },
    {
      slug: 'cultural-institutions',
      name: 'Cultural Institutions',
      description: 'Portland civic cultural institutions — Oregon Zoo (founded November 7, 1888, oldest zoo west of the Mississippi, in Washington Park), Portland Art Museum (founded 1892 as Portland Art Association, opened 1895), OMSI (established November 5, 1944, current east bank location opened 1992, includes USS Blueback submarine), Powell\'s Books (largest independent bookstore in the world). Civic anchor facts only — no food/entertainment angle.',
    },
  ],

  topicDistribution: {
    'city-government': 36,
    'civic-history': 18,
    'parks-natural': 18,
    'rose-city-identity': 9,
    'cultural-institutions': 9,
  },

  sourceUrls: [
    // City government (keep — these worked)
    'https://en.wikipedia.org/wiki/Portland,_Oregon',
    'https://en.wikipedia.org/wiki/Portland_city_government',
    'https://www.oregonlive.com/politics/2025/01/portland-welcomes-new-city-council-under-charter-reform.html',
    // Civic history (keep — these worked)
    'https://en.wikipedia.org/wiki/History_of_Portland,_Oregon',
    // Parks & natural landmarks — Wikipedia article URLs (replacing portlandoregon.gov/portlandonline.com)
    'https://en.wikipedia.org/wiki/Forest_Park_(Portland,_Oregon)',
    'https://en.wikipedia.org/wiki/Willamette_River',
    'https://en.wikipedia.org/wiki/Mount_Tabor_Park',
    'https://en.wikipedia.org/wiki/Washington_Park_(Portland,_Oregon)',
    'https://en.wikipedia.org/wiki/International_Rose_Test_Garden',
    // Rose City identity — Wikipedia article URLs (replacing portland.gov)
    'https://en.wikipedia.org/wiki/Portland_Rose_Festival',
    'https://en.wikipedia.org/wiki/Portland_Japanese_Garden',
    // Cultural institutions (keep — these worked)
    'https://en.wikipedia.org/wiki/Oregon_Zoo',
    'https://en.wikipedia.org/wiki/Portland_Art_Museum',
    'https://en.wikipedia.org/wiki/Oregon_Museum_of_Science_and_Industry',
    'https://en.wikipedia.org/wiki/Powell%27s_Books',
    // Bridge identity (keep)
    'https://en.wikipedia.org/wiki/Hawthorne_Bridge',
    'https://en.wikipedia.org/wiki/Steel_Bridge_(Portland,_Oregon)',
  ],
};
